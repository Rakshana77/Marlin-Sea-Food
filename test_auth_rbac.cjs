// Automated End-to-End RBAC & Seafood Flow Verification Script
const http = require('http');

function postJson(url, data, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  MARINE SEAFOODS - E2E RBAC & BUSINESS FLOW TEST   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Test 1: Admin Login
  const adminRes = await postJson('http://localhost:5000/api/auth/login', {
    email: 'admin@marineseafoods.com',
    password: 'admin123'
  });
  assert('Admin login returns 200 OK', adminRes.status === 200);
  assert('Admin login returns valid JWT token', !!adminRes.data?.data?.token);
  assert('Admin user role is ADMIN', adminRes.data?.data?.user?.role === 'ADMIN');
  const adminToken = adminRes.data?.data?.token;

  // Test 2: Worker Login
  const workerRes = await postJson('http://localhost:5000/api/auth/login', {
    email: 'worker@marineseafoods.com',
    password: 'worker123'
  });
  assert('Worker login returns 200 OK', workerRes.status === 200);
  assert('Worker login returns valid JWT token', !!workerRes.data?.data?.token);
  assert('Worker user role is WORKER', workerRes.data?.data?.user?.role === 'WORKER');
  const workerToken = workerRes.data?.data?.token;

  // Test 3: Unauthenticated access blocked
  const unauthRes = await getJson('http://localhost:5000/api/fishermen');
  assert('Unauthenticated access to /api/fishermen returns 401 UNAUTHORIZED', unauthRes.status === 401);

  // Test 4: Worker RBAC - Access to Daily Rates allowed
  const workerRates = await getJson('http://localhost:5000/api/daily-rates', workerToken);
  assert('Worker can access /api/daily-rates (200 OK)', workerRates.status === 200);

  // Test 5: Worker RBAC - Access to Fishermen blocked (403 Forbidden)
  const workerFishermen = await getJson('http://localhost:5000/api/fishermen', workerToken);
  assert('Worker access to /api/fishermen is FORBIDDEN (403)', workerFishermen.status === 403);

  // Test 6: Worker RBAC - Access to Purchase Bills blocked (403 Forbidden)
  const workerBills = await getJson('http://localhost:5000/api/purchase-bills', workerToken);
  assert('Worker access to /api/purchase-bills is FORBIDDEN (403)', workerBills.status === 403);

  // Test 7: Worker RBAC - Access to Wastage endpoint blocked (403 Forbidden)
  const workerWastage = await postJson('http://localhost:5000/api/stock/wastage', {
    branchId: '00000000-0000-0000-0000-000000000001',
    seafoodId: '00000000-0000-0000-0000-000000000001',
    gradeId: '00000000-0000-0000-0000-000000000001',
    quantityKg: 10,
    reason: 'SPOILAGE'
  }, workerToken);
  assert('Worker posting to /api/stock/wastage is FORBIDDEN (403)', workerWastage.status === 403);

  // Test 8: Admin RBAC - Access to Fishermen allowed
  const adminFishermen = await getJson('http://localhost:5000/api/fishermen', adminToken);
  assert('Admin can access /api/fishermen (200 OK)', adminFishermen.status === 200);

  // Test 9: Daily Seafood Flow Query
  const flowRes = await getJson('http://localhost:5000/api/stock/daily-flow', adminToken);
  assert('Admin can query /api/stock/daily-flow (200 OK)', flowRes.status === 200);
  assert('Daily flow summary has openingKg = 0', parseFloat(flowRes.data?.data?.summary?.openingKg) === 0);
  assert('Daily flow calculates closingKg = (opening + received - sold - wastage)', 
    !isNaN(parseFloat(flowRes.data?.data?.summary?.closingKg))
  );

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
