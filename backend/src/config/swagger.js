const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Personal Finance Tracker API',
    version: '1.0.0',
    description: `
**Full Stack Personal Finance Tracker API**
- Multi-Role RBAC: \`admin\`, \`user\`, \`read-only\`
- Redis Caching: User analytics cached for 15 min, categories cached for 1 hour with automatic cache invalidation
- Rate Limiting: 5 req/15min for auth, 100 req/hr for transactions, 50 req/hr for analytics
- Security: SQL injection prevention via parameterized queries, Helmet security headers, JWT Bearer tokens
    `,
    contact: {
      name: 'Kapil Kumar',
      email: 'kapilmaan0123@gmail.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Alex Standard' },
          email: { type: 'string', format: 'email', example: 'user@financetracker.com' },
          role: { type: 'string', enum: ['admin', 'user', 'read-only'], example: 'user' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Food & Dining' },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          color: { type: 'string', example: '#ef4444' },
          icon: { type: 'string', example: 'Utensils' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 42 },
          user_id: { type: 'integer', example: 2 },
          category_id: { type: 'integer', example: 1 },
          category_name: { type: 'string', example: 'Food & Dining' },
          category_color: { type: 'string', example: '#ef4444' },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          amount: { type: 'number', format: 'float', example: 85.50 },
          description: { type: 'string', example: 'Weekly grocery store shopping' },
          date: { type: 'string', format: 'date', example: '2026-11-20' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AnalyticsSummary: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number', example: 6970.00 },
          totalExpense: { type: 'number', example: 2492.00 },
          netSavings: { type: 'number', example: 4478.00 },
          savingsRate: { type: 'number', example: 64.2 },
          totalTransactions: { type: 'integer', example: 12 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message description' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        description: 'Rate limit: 5 requests per 15 minutes. Creates a user account with default role "user".',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                  role: { type: 'string', enum: ['user', 'read-only'], example: 'user' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully and JWT returned' },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Authentication'],
        description: 'Rate limit: 5 requests per 15 minutes. Returns JWT bearer token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@financetracker.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful, JWT token returned' },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profile details returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/transactions': {
      get: {
        summary: 'List transactions with search, filter, and pagination',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        description: 'Accessible to all roles (admin, user, read-only). Rate limit: 100 requests per hour.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['income', 'expense'] } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'date' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' } },
        ],
        responses: {
          200: { description: 'Paginated list of transactions' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new transaction',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        description: 'Restricted to admin and user roles. read-only roles are blocked with 403 Forbidden. Automatically invalidates analytics cache.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'amount', 'description'],
                properties: {
                  category_id: { type: 'integer', example: 1 },
                  type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                  amount: { type: 'number', example: 64.50 },
                  description: { type: 'string', example: 'Dinner with colleagues' },
                  date: { type: 'string', format: 'date', example: '2026-11-21' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Transaction created' },
          400: { description: 'Bad request' },
          403: { description: 'Forbidden (read-only role)' },
        },
      },
    },
    '/api/transactions/{id}': {
      get: {
        summary: 'Get single transaction by ID',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Transaction details' },
          403: { description: 'Forbidden' },
          404: { description: 'Transaction not found' },
        },
      },
      put: {
        summary: 'Update existing transaction',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        description: 'Restricted to admin or transaction owner. read-only receives 403 Forbidden. Automatically invalidates analytics cache.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer', example: 2 },
                  type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                  amount: { type: 'number', example: 75.00 },
                  description: { type: 'string', example: 'Updated grocery description' },
                  date: { type: 'string', format: 'date', example: '2026-11-21' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Transaction updated successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Transaction not found' },
        },
      },
      delete: {
        summary: 'Delete a transaction',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        description: 'Restricted to admin or transaction owner. read-only receives 403 Forbidden. Automatically invalidates analytics cache.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Transaction deleted' },
          403: { description: 'Forbidden' },
          404: { description: 'Transaction not found' },
        },
      },
    },
    '/api/transactions/categories': {
      get: {
        summary: 'Get list of transaction categories',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        description: 'Cached in Redis for 1 hour (3600 seconds). Accessible to all roles.',
        responses: {
          200: { description: 'List of categories' },
        },
      },
    },
    '/api/analytics': {
      get: {
        summary: 'Get dashboard analytics and spending aggregations',
        tags: ['Analytics'],
        security: [{ BearerAuth: [] }],
        description: 'Cached in Redis for 15 minutes (900 seconds). Rate limit: 50 requests per hour. Accessible to all roles.',
        parameters: [
          { name: 'timeframe', in: 'query', schema: { type: 'string', default: 'all' } },
          { name: 'targetUserId', in: 'query', description: 'Admin only: view analytics for specific user', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Analytics data with cache status' },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'List all users with metrics (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of all registered users' },
          403: { description: 'Forbidden: Admin access required' },
        },
      },
    },
    '/api/users/{id}/role': {
      put: {
        summary: 'Update user role (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'user', 'read-only'], example: 'read-only' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'User not found' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Personal Finance Tracker API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
};

module.exports = { setupSwagger, swaggerSpec };
