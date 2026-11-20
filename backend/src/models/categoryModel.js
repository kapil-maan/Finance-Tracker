const { pool } = require('../config/db');

const CategoryModel = {
  async findAll() {
    const query = `
      SELECT id, name, type, color, icon, created_at
      FROM categories
      ORDER BY type ASC, name ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id, name, type, color, icon
      FROM categories
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

module.exports = CategoryModel;
