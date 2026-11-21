const UserModel = require('../models/userModel');

const UserController = {
  /**
   * GET /api/users
   * Admin-only: list all registered users along with their transaction metrics
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.findAll();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/users/:id/role
   * Admin-only: update user role (admin, user, read-only)
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'user', 'read-only'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Role must be 'admin', 'user', or 'read-only'.",
        });
      }

      // Prevent admin from accidentally demoting themselves if they are the only admin
      if (parseInt(id, 10) === req.user.id && role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Action prohibited: You cannot demote your own admin account.',
        });
      }

      const updated = await UserModel.updateRole(id, role);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: `User role successfully updated to '${role}'`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/users/:id
   * Admin-only: delete user account
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Action prohibited: You cannot delete your own account while logged in.',
        });
      }

      const deleted = await UserModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User account and associated records deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
