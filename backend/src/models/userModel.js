const { pool } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const query = `
      SELECT id, name, email, password, role, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email.trim()]);
    return rows[0] || null;
  },

  async findById(id) {
    const query = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async create({ name, email, password, role = 'user' }) {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
    `;
    const { rows } = await pool.query(query, [
      name.trim(),
      email.toLowerCase().trim(),
      password,
      role,
    ]);
    return rows[0];
  },

  async findAll() {
    const query = `
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(t.id)::int as transaction_count,
             COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as total_income,
             COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric(12,2) as total_expense
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      ORDER BY u.created_at ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async updateRole(id, role) {
    const query = `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role, updated_at;
    `;
    const { rows } = await pool.query(query, [role, id]);
    return rows[0] || null;
  },

  async delete(id) {
    const query = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, email;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

module.exports = UserModel;
