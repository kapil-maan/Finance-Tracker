const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbacMiddleware');

// User management endpoints: strictly restricted to admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/', UserController.getAllUsers);
router.put('/:id/role', UserController.updateUserRole);
router.delete('/:id', UserController.deleteUser);

module.exports = router;
