const { pool } = require('../config/db');

const TransactionModel = {
  /**
   * Search and filter transactions with secure parameterized queries and pagination
   */
  async findPaginated({
    userId = null,
    isAdmin = false,
    targetUserId = null,
    type = null,
    categoryId = null,
    search = null,
    startDate = null,
    endDate = null,
    minAmount = null,
    maxAmount = null,
    sortBy = 'date',
    sortOrder = 'DESC',
    page = 1,
    limit = 10,
  }) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // RBAC scoping:
    // Regular users and read-only users CAN ONLY query their own records.
    // Admin can query all users or specify targetUserId.
    if (!isAdmin) {
      conditions.push(`t.user_id = $${paramIndex++}`);
      values.push(userId);
    } else if (targetUserId) {
      conditions.push(`t.user_id = $${paramIndex++}`);
      values.push(targetUserId);
    }

    if (type) {
      conditions.push(`t.type = $${paramIndex++}`);
      values.push(type.toLowerCase());
    }

    if (categoryId) {
      conditions.push(`t.category_id = $${paramIndex++}`);
      values.push(parseInt(categoryId, 10));
    }

    if (search && search.trim() !== '') {
      conditions.push(`(t.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`t.date >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.date <= $${paramIndex++}`);
      values.push(endDate);
    }

    if (minAmount !== null && minAmount !== undefined && minAmount !== '') {
      conditions.push(`t.amount >= $${paramIndex++}`);
      values.push(parseFloat(minAmount));
    }

    if (maxAmount !== null && maxAmount !== undefined && maxAmount !== '') {
      conditions.push(`t.amount <= $${paramIndex++}`);
      values.push(parseFloat(maxAmount));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = {
      date: 't.date',
      amount: 't.amount',
      created_at: 't.created_at',
      description: 't.description',
      category: 'c.name',
    };
    const sortColumn = allowedSortColumns[sortBy.toLowerCase()] || 't.date';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Get total count
    const countQuery = `
      SELECT COUNT(t.id)::int as total
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause};
    `;
    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0]?.total || 0;

    // 2. Query paginated records
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const dataQuery = `
      SELECT 
        t.id,
        t.user_id,
        u.name as user_name,
        u.email as user_email,
        t.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        t.type,
        t.amount::numeric(12,2),
        t.description,
        TO_CHAR(t.date, 'YYYY-MM-DD') as date,
        t.created_at,
        t.updated_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}, t.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    values.push(safeLimit, offset);
    const dataResult = await pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  },

  async findById(id) {
    const query = `
      SELECT 
        t.id,
        t.user_id,
        t.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        t.type,
        t.amount::numeric(12,2),
        t.description,
        TO_CHAR(t.date, 'YYYY-MM-DD') as date,
        t.created_at,
        t.updated_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async create({ userId, categoryId, type, amount, description, date }) {
    const query = `
      INSERT INTO transactions (user_id, category_id, type, amount, description, date)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
      RETURNING id, user_id, category_id, type, amount::numeric(12,2), description, TO_CHAR(date, 'YYYY-MM-DD') as date, created_at;
    `;
    const { rows } = await pool.query(query, [
      userId,
      categoryId || null,
      type.toLowerCase(),
      parseFloat(amount),
      description.trim(),
      date || null,
    ]);
    return rows[0];
  },

  async update(id, { categoryId, type, amount, description, date }) {
    const query = `
      UPDATE transactions
      SET 
        category_id = COALESCE($1, category_id),
        type = COALESCE($2, type),
        amount = COALESCE($3, amount),
        description = COALESCE($4, description),
        date = COALESCE($5::date, date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, user_id, category_id, type, amount::numeric(12,2), description, TO_CHAR(date, 'YYYY-MM-DD') as date, updated_at;
    `;
    const { rows } = await pool.query(query, [
      categoryId || null,
      type ? type.toLowerCase() : null,
      amount ? parseFloat(amount) : null,
      description ? description.trim() : null,
      date || null,
      id,
    ]);
    return rows[0] || null;
  },

  async delete(id) {
    const query = `
      DELETE FROM transactions
      WHERE id = $1
      RETURNING id, user_id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

module.exports = TransactionModel;
