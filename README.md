# Personal Finance Tracker

A full-stack personal finance application built with **React 18**, **Node.js/Express**, **PostgreSQL**, and **Redis**. Designed with multi-role access control (RBAC), high-performance caching, rate limiting, and interactive financial analytics.

---

## Key Features

- **Multi-Role Access Control (RBAC)**: Support for `admin`, `user`, and `read-only` roles with route-level middleware enforcement and dynamic UI adaptation.
- **Transaction Management**: Add, update, delete, search, and filter income/expense records with pagination and virtual scrolling.
- **Financial Analytics**: Monthly/yearly cash flow trends, category breakdown, and income vs. expense visual charts using Chart.js.
- **Redis Caching**:
  - Analytics cached for 15 minutes (`900s`).
  - Category list cached for 1 hour (`3600s`).
  - Automatic cache invalidation upon any data mutation.
  - Built-in In-Memory TTL fallback for zero-dependency local development when Redis server is offline.
- **API Rate Limiting**: Endpoint-specific rate limiting (`express-rate-limit`):
  - Auth routes: 5 requests per 15 minutes
  - Transaction routes: 100 requests per hour
  - Analytics routes: 50 requests per hour
- **Security Best Practices**:
  - Parameterized queries to prevent SQL injection.
  - Helmet middleware for HTTP security headers (XSS, clickjacking, MIME sniffing prevention).
  - JWT Bearer tokens with expiration.
  - Password hashing with `bcryptjs`.
- **Interactive OpenAPI / Swagger Documentation**: Available at `/api-docs`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Chart.js, Lucide Icons, Vite |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL 15+ |
| **Caching** | Redis (ioredis) with In-Memory TTL fallback |
| **Security** | Helmet, bcryptjs, jsonwebtoken, express-rate-limit |
| **Documentation** | Swagger / OpenAPI 3.0 (`swagger-ui-express`) |

---

## Role-Based Access Control (RBAC) Matrix

| Capability | Admin | User | Read-Only |
|---|:---:|:---:|:---:|
| View own transactions & analytics | Yes | Yes | Yes |
| Create transactions | Yes | Yes | **Blocked (403)** |
| Edit & delete own transactions | Yes | Yes | **Blocked (403)** |
| View all users' data | Yes | No | No |
| Manage users & modify roles | Yes | No | No |
| Purge Redis cache manually | Yes | No | No |

### Pre-Seeded Demo Credentials

All test accounts use the password: `Password123!`

- **Admin**: `admin@financetracker.com`
- **Standard User**: `user@financetracker.com`
- **Read-Only User**: `readonly@financetracker.com`

*(The frontend login page also includes 1-click quick-fill buttons for instant role testing).*

---

## Project Structure

```text
Finance_Tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, and Swagger config
│   │   ├── controllers/     # Route logic for auth, transactions, analytics, users
│   │   ├── middleware/      # JWT auth, RBAC guards, rate limiters, error handler
│   │   ├── models/          # Parameterized SQL database queries
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # DB schema migration and mock data seed scripts
│   │   └── server.js        # Server entry point
│   ├── tests/               # Integration & RBAC test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor
│   │   ├── components/      # Modals, charts, virtual list, common widgets
│   │   ├── context/         # AuthContext and ThemeContext (Light/Dark)
│   │   ├── pages/           # Dashboard, Transactions, Admin, Login, Register
│   │   ├── App.jsx          # Lazy-loaded routes & ProtectedRoute guards
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── docker-compose.yml       # One-click PostgreSQL + Redis container setup
└── README.md
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (optional - app automatically uses built-in in-memory fallback if Redis is offline)

### 2. Database & Cache (Docker Option)
If you prefer Docker, you can run PostgreSQL and Redis with one command:
```bash
docker-compose up -d
```

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Update `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` if your local PostgreSQL settings differ).*
4. Run migrations and seed sample data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.
   - **Swagger UI**: `http://localhost:5000/api-docs`
   - **Health Check**: `http://localhost:5000/api/health`

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The client will open at `http://localhost:5173`.

---

## Verification & Testing

An automated integration test suite is included to verify all endpoints, RBAC permissions, and caching behavior:

```bash
cd backend
npm test
```

Test coverage includes:
- Health check verification
- JWT token generation & role claim validation
- 1-hour category caching (`Cache MISS -> Cache HIT`)
- 15-minute analytics caching with response time benchmarks
- RBAC write-block: verifies `read-only` user receives `403 Forbidden` on `POST /api/transactions`
- Cache invalidation: confirms `analytics:*` cache is cleared when transactions are created
- Admin route isolation: verifies non-admin users cannot access `GET /api/users`

---

## Caching Strategy & Benchmark

- **Categories**: Infrequently modified list cached for **1 hour (3600s)**.
- **Analytics**: Aggregated financial metrics cached for **15 minutes (900s)** per user (`analytics:user:<id>:all`).
- **Cache Invalidation**: Whenever a transaction is created, updated, or deleted, `delPattern('analytics:user:<id>*')` is executed immediately.
- **Response Headers**:
  - `X-Cache: HIT` or `X-Cache: MISS`
  - `X-Response-Time: <duration>ms`

Uncached database aggregations typically complete in **8–15ms**, whereas Redis cache hits respond in **0.01–0.15ms** (~100x speedup).

---

## License

This project is licensed under the MIT License.
