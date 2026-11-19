const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Authentication middleware that verifies JWT Bearer token
 * and attaches user record to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token is required',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Malformed authorization header',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Token has expired. Please log in again',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token signature',
      });
    }

    // Verify user exists in database and has current role
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Account associated with this token no longer exists',
      });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
};

module.exports = { authenticate };
