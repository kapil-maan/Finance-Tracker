const TransactionModel = require('../models/transactionModel');
const CategoryModel = require('../models/categoryModel');
const cacheService = require('../config/redis');

const TransactionController = {
  /**
   * GET /api/transactions
   * Paginated list of transactions with search and filter capabilities
   */
  async getTransactions(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        type,
        categoryId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'date',
        sortOrder = 'DESC',
        targetUserId,
      } = req.query;

      const isAdmin = req.user.role === 'admin';

      const result = await TransactionModel.findPaginated({
        userId: req.user.id,
        isAdmin,
        targetUserId: isAdmin ? targetUserId : null,
        type,
        categoryId,
        search,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/transactions/:id
   */
  async getTransactionById(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }

      // Check access permission: admin can view all, users can only view their own
      if (req.user.role !== 'admin' && transaction.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to view this transaction',
        });
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/transactions
   * Create a new transaction (restricted to admin & user)
   */
  async createTransaction(req, res, next) {
    try {
      const { category_id, type, amount, description, date } = req.body;

      if (!type || !amount || !description) {
        return res.status(400).json({
          success: false,
          error: 'Please provide type (income/expense), amount, and description.',
        });
      }

      if (!['income', 'expense'].includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: "Transaction type must be 'income' or 'expense'.",
        });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a valid positive number.',
        });
      }

      const transaction = await TransactionModel.create({
        userId: req.user.id,
        categoryId: category_id || null,
        type: type.toLowerCase(),
        amount: numAmount,
        description,
        date: date || undefined,
      });

      // Cache Invalidation on data update:
      // Invalidate analytics caches for this user and global analytics
      await cacheService.delPattern(`analytics:user:${req.user.id}*`);
      await cacheService.delPattern(`analytics:admin*`);
      console.log(`[Cache Invalidation] Cleared analytics cache for user #${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Transaction recorded successfully',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/transactions/:id
   * Update transaction (restricted to admin & owner user)
   */
  async updateTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await TransactionModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }

      // RBAC Ownership Check
      if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot modify another user\'s transaction',
        });
      }

      const { category_id, type, amount, description, date } = req.body;

      if (type && !['income', 'expense'].includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: "Type must be 'income' or 'expense'.",
        });
      }

      if (amount !== undefined) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Amount must be a valid positive number.',
          });
        }
      }

      const updated = await TransactionModel.update(id, {
        categoryId: category_id,
        type,
        amount,
        description,
        date,
      });

      // Cache Invalidation on data update:
      await cacheService.delPattern(`analytics:user:${existing.user_id}*`);
      await cacheService.delPattern(`analytics:admin*`);
      console.log(`[Cache Invalidation] Cleared analytics cache for user #${existing.user_id}`);

      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/transactions/:id
   * Delete transaction (restricted to admin & owner user)
   */
  async deleteTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await TransactionModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }

      // RBAC Ownership Check
      if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot delete another user\'s transaction',
        });
      }

      await TransactionModel.delete(id);

      // Cache Invalidation on data update:
      await cacheService.delPattern(`analytics:user:${existing.user_id}*`);
      await cacheService.delPattern(`analytics:admin*`);
      console.log(`[Cache Invalidation] Cleared analytics cache for user #${existing.user_id}`);

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/transactions/categories
   * Requirement: Cache category lists for 1 hour (3600 seconds) in Redis
   */
  async getCategories(req, res, next) {
    try {
      const cacheKey = 'categories:list:all';
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        if (res.setCacheStatus) res.setCacheStatus('HIT');
        return res.status(200).json({
          success: true,
          cached: true,
          data: typeof cached === 'string' ? JSON.parse(cached) : cached,
        });
      }

      if (res.setCacheStatus) res.setCacheStatus('MISS');
      const categories = await CategoryModel.findAll();

      // Cache for 1 hour (3600 seconds)
      await cacheService.set(cacheKey, categories, 3600);

      res.status(200).json({
        success: true,
        cached: false,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TransactionController;
