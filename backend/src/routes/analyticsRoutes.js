const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbacMiddleware');
const { analyticsLimiter } = require('../middleware/rateLimiter');

// All analytics routes require authentication
router.use(authenticate);

// Rate limiting applied to analytics endpoints (50 req/hr)
router.use(analyticsLimiter);

// Analytics dashboard data: Accessible to all roles ('admin', 'user', 'read-only')
// Cached for 15 minutes in Redis
router.get('/', AnalyticsController.getDashboardAnalytics);

// Admin cache purge utility
router.post('/cache/purge', requireAdmin, AnalyticsController.purgeAnalyticsCache);

module.exports = router;
