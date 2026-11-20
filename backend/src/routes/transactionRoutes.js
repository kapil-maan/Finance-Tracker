const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireWriteAccess } = require('../middleware/rbacMiddleware');
const { transactionLimiter } = require('../middleware/rateLimiter');

// All transaction routes require authentication
router.use(authenticate);

// Rate limiting applied to transaction endpoints (100 req/hr)
router.use(transactionLimiter);

// Categories endpoint: Cached for 1 hour in Redis (all roles can access)
router.get('/categories', TransactionController.getCategories);

// Transaction list & details: Accessible to all roles ('admin', 'user', 'read-only')
router.get('/', TransactionController.getTransactions);
router.get('/:id', TransactionController.getTransactionById);

// Transaction mutations: Restricted to 'admin' and 'user' ('read-only' receives 403 Forbidden)
router.post('/', requireWriteAccess, TransactionController.createTransaction);
router.put('/:id', requireWriteAccess, TransactionController.updateTransaction);
router.delete('/:id', requireWriteAccess, TransactionController.deleteTransaction);

module.exports = router;
