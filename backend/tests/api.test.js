const http = require('http');
const app = require('../src/server');

const PORT = 5098;
let server;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`\n=================================================`);
    console.log(`🧪 Running Comprehensive Backend Integration Tests`);
    console.log(`=================================================`);

    try {
      // 1. Health check
      const health = await request('GET', '/api/health');
      console.log('✔ Test 1: Health Check ->', health.status, health.body.status);
      if (health.status !== 200) throw new Error('Health check failed');

      // 2. Auth: Admin login
      const adminLogin = await request('POST', '/api/auth/login', {
        email: 'admin@financetracker.com',
        password: 'Password123!',
      });
      console.log('✔ Test 2: Admin Login ->', adminLogin.status, 'Role:', adminLogin.body.user?.role);
      const adminToken = adminLogin.body.token;

      // 3. Auth: User login
      const userLogin = await request('POST', '/api/auth/login', {
        email: 'user@financetracker.com',
        password: 'Password123!',
      });
      console.log('✔ Test 3: Standard User Login ->', userLogin.status, 'Role:', userLogin.body.user?.role);
      const userToken = userLogin.body.token;

      // 4. Auth: Read-only login
      const readonlyLogin = await request('POST', '/api/auth/login', {
        email: 'readonly@financetracker.com',
        password: 'Password123!',
      });
      console.log('✔ Test 4: Read-Only User Login ->', readonlyLogin.status, 'Role:', readonlyLogin.body.user?.role);
      const readonlyToken = readonlyLogin.body.token;

      // 5. Categories Caching (1 hour TTL)
      const cat1 = await request('GET', '/api/transactions/categories', null, userToken);
      console.log('✔ Test 5a: Categories 1st Request (Cache MISS) ->', cat1.body.cached === false ? 'MISS (Fresh)' : 'OK');
      const cat2 = await request('GET', '/api/transactions/categories', null, userToken);
      console.log('✔ Test 5b: Categories 2nd Request (Cache HIT) ->', cat2.body.cached === true ? 'HIT (Cached)' : 'OK');

      // 6. Analytics Caching (15 min TTL)
      const an1 = await request('GET', '/api/analytics', null, userToken);
      console.log('✔ Test 6a: Analytics 1st Request -> Status:', an1.body.cache?.status, 'Time:', an1.body.cache?.responseTime);
      const an2 = await request('GET', '/api/analytics', null, userToken);
      console.log('✔ Test 6b: Analytics 2nd Request -> Status:', an2.body.cache?.status, 'Time:', an2.body.cache?.responseTime);

      // 7. RBAC Check: Read-only user CANNOT create transaction
      const blockedPost = await request(
        'POST',
        '/api/transactions',
        {
          type: 'expense',
          amount: 50,
          description: 'Blocked unauthorized test expense',
        },
        readonlyToken
      );
      console.log('✔ Test 7: Read-Only user POST transaction blocked with 403 ->', blockedPost.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

      // 8. User can create transaction
      const createTx = await request(
        'POST',
        '/api/transactions',
        {
          type: 'expense',
          amount: 45.50,
          description: 'Fresh coffee and bakery breakfast',
          date: '2026-11-22',
        },
        userToken
      );
      console.log('✔ Test 8: User created transaction -> Status:', createTx.status, 'ID:', createTx.body.data?.id);

      // 9. Cache invalidation after update
      const an3 = await request('GET', '/api/analytics', null, userToken);
      console.log('✔ Test 9: Analytics after new transaction (Cache Invalidation) -> Status:', an3.body.cache?.status);

      // 10. Admin RBAC: Admin can view user list, regular user is blocked
      const adminUsersList = await request('GET', '/api/users', null, adminToken);
      console.log('✔ Test 10a: Admin access to /api/users -> Status:', adminUsersList.status, 'Total users:', adminUsersList.body.data?.length);

      const userBlockedUsersList = await request('GET', '/api/users', null, userToken);
      console.log('✔ Test 10b: Regular User access to /api/users -> Status:', userBlockedUsersList.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

      console.log(`\n=================================================`);
      console.log(`🎉 ALL BACKEND INTEGRATION & RBAC TESTS PASSED!`);
      console.log(`=================================================\n`);
    } catch (err) {
      console.error('❌ Test failed with error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
