const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const { pool } = require('./config/db');
const cacheService = require('./config/redis');
const { setupSwagger } = require('./config/swagger');
const responseTimer = require('./middleware/responseTimer');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet headers (XSS, Clickjacking, MIME sniffing prevention)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    exposedHeaders: ['X-Response-Time', 'X-Cache', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  })
);

// Body parsing with safe size limit (prevents payload flood attacks)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Response time and cache profiling middleware
app.use(responseTimer);

// Swagger OpenAPI documentation
setupSwagger(app);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as db_time');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      dbTime: dbRes.rows[0].db_time,
      redis: cacheService.isConnected() ? 'connected' : 'memory-fallback-active',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'degraded',
      database: 'error',
      error: err.message,
    });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Root information endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Personal Finance Tracker API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
  });
});

// 404 handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Finance Tracker API running on port ${PORT}`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health check:     http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(async () => {
      try {
        await pool.end();
        console.log('[PostgreSQL] Connection pool drained.');
      } catch (err) {}
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
