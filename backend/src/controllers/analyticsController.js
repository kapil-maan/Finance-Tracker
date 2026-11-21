const { pool } = require('../config/db');
const cacheService = require('../config/redis');

const AnalyticsController = {
  /**
   * GET /api/analytics
   * Aggregates financial analytics:
   * - Overview: Total Income, Total Expense, Net Savings, Savings Rate, Transaction Count
   * - Category Breakdown: expense distribution by category
   * - Monthly Trends: monthly income vs expense over the last 6-12 months
   * Requirement: Cache user analytics data for 15 minutes (900 seconds) in Redis
   */
  async getDashboardAnalytics(req, res, next) {
    const startTime = process.hrtime();
    try {
      const { timeframe = 'all', targetUserId } = req.query;
      const isAdmin = req.user.role === 'admin';

      // Scoping:
      // Regular and read-only users only see their own analytics
      // Admin sees global analytics or target user's analytics
      const effectiveUserId = isAdmin && targetUserId ? parseInt(targetUserId, 10) : (!isAdmin ? req.user.id : null);
      const cacheKey = `analytics:${effectiveUserId ? `user:${effectiveUserId}` : 'admin:global'}:${timeframe}`;

      // Check Redis / In-memory Cache
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        const diff = process.hrtime(startTime);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        if (res.setCacheStatus) res.setCacheStatus('HIT');

        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return res.status(200).json({
          ...parsed,
          cache: {
            status: 'HIT',
            provider: cacheService.isConnected() ? 'Redis' : 'Memory-TTL',
            key: cacheKey,
            ttlSeconds: 900,
            responseTime: `${durationMs}ms`,
          },
        });
      }

      if (res.setCacheStatus) res.setCacheStatus('MISS');

      // Build SQL WHERE condition for user filter
      const userCondition = effectiveUserId ? `WHERE t.user_id = $1` : '';
      const params = effectiveUserId ? [effectiveUserId] : [];

      // 1. Overall Summary
      const summaryQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as total_expense,
          COUNT(t.id)::int as total_transactions
        FROM transactions t
        ${userCondition};
      `;
      const summaryRes = await pool.query(summaryQuery, params);
      const totalIncome = parseFloat(summaryRes.rows[0].total_income || 0);
      const totalExpense = parseFloat(summaryRes.rows[0].total_expense || 0);
      const netSavings = parseFloat((totalIncome - totalExpense).toFixed(2));
      const savingsRate = totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1)) : 0;
      const totalTransactions = summaryRes.rows[0].total_transactions || 0;

      // 2. Category Expense Breakdown (for Pie / Doughnut Chart)
      const categoryQuery = `
        SELECT 
          c.name as category,
          c.color,
          c.icon,
          SUM(t.amount)::numeric(12,2) as total,
          COUNT(t.id)::int as count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' ${effectiveUserId ? 'AND t.user_id = $1' : ''}
        GROUP BY c.name, c.color, c.icon
        ORDER BY total DESC;
      `;
      const categoryRes = await pool.query(categoryQuery, params);
      const categoryBreakdown = categoryRes.rows.map((row) => {
        const catTotal = parseFloat(row.total);
        const percentage = totalExpense > 0 ? parseFloat(((catTotal / totalExpense) * 100).toFixed(1)) : 0;
        return {
          category: row.category || 'Uncategorized',
          color: row.color || '#94a3b8',
          icon: row.icon || 'Tag',
          total: catTotal,
          count: row.count,
          percentage,
        };
      });

      // 3. Monthly Trends (Income vs Expense over past 6-12 months for Line & Bar Charts)
      const monthlyQuery = `
        SELECT 
          TO_CHAR(t.date, 'YYYY-MM') as month_key,
          TO_CHAR(t.date, 'Mon YYYY') as month_label,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as expense
        FROM transactions t
        ${userCondition}
        GROUP BY TO_CHAR(t.date, 'YYYY-MM'), TO_CHAR(t.date, 'Mon YYYY')
        ORDER BY month_key ASC;
      `;
      const monthlyRes = await pool.query(monthlyQuery, params);
      const monthlyTrends = monthlyRes.rows.map((row) => ({
        monthKey: row.month_key,
        month: row.month_label,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense),
        net: parseFloat((parseFloat(row.income) - parseFloat(row.expense)).toFixed(2)),
      }));

      // 4. Recent high-value or notable transactions
      const recentQuery = `
        SELECT 
          t.id,
          t.type,
          t.amount::numeric(12,2),
          t.description,
          TO_CHAR(t.date, 'YYYY-MM-DD') as date,
          c.name as category_name,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ${userCondition}
        ORDER BY t.date DESC, t.id DESC
        LIMIT 5;
      `;
      const recentRes = await pool.query(recentQuery, params);

      const responsePayload = {
        success: true,
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate,
          totalTransactions,
        },
        categoryBreakdown,
        monthlyTrends,
        recentTransactions: recentRes.rows,
      };

      // Cache for 15 minutes (900 seconds) in Redis
      await cacheService.set(cacheKey, responsePayload, 900);

      const diff = process.hrtime(startTime);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

      res.status(200).json({
        ...responsePayload,
        cache: {
          status: 'MISS',
          provider: cacheService.isConnected() ? 'Redis' : 'Memory-TTL',
          key: cacheKey,
          ttlSeconds: 900,
          responseTime: `${durationMs}ms`,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/analytics/cache/purge
   * Manual cache purge endpoint for testing and auditing cache effectiveness
   */
  async purgeAnalyticsCache(req, res, next) {
    try {
      const cleared = await cacheService.delPattern('analytics:*');
      res.status(200).json({
        success: true,
        message: 'Analytics cache cleared successfully',
        clearedKeysCount: cleared,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AnalyticsController;
