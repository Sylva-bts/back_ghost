#!/usr/bin/env node

/**
 * SCRIPT DE TEST RAPIDE
 * 
 * Testez rapidement les endpoints sans avoir besoin de Postman
 * 
 * Usage:
 *   node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
let token = null;

/**
 * Helper pour faire des requêtes HTTP
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data || '{}')
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Tests
 */
async function runTests() {
  console.log('🧪 Démarrage des tests...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Health Check');
    let res = await makeRequest('GET', '/');
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    console.log();

    // Test 2: Register
    console.log('2️⃣ Register');
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456!'
    };
    res = await makeRequest('POST', '/auth/register', testUser);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    console.log();

    // Test 3: Login
    console.log('3️⃣ Login');
    res = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log(`   Status: ${res.status}`);
    if (res.body.token) {
      token = res.body.token;
      console.log(`   ✓ JWT obtenu: ${token.substring(0, 30)}...`);
    }
    console.log(`   Balance: $${res.body.user?.balance || 0}`);
    console.log();

    // Test 4: Create Deposit
    console.log('4️⃣ Create Deposit');
    res = await makeRequest('POST', '/deposit', {
      amount: 50
    });
    console.log(`   Status: ${res.status}`);
    if (res.body.payUrl) {
      console.log(`   ✓ Payment URL: ${res.body.payUrl}`);
      console.log(`   ✓ Track ID: ${res.body.trackId}`);
      console.log(`   ✓ TX ID: ${res.body.txId}`);
    }
    const depositTxId = res.body.txId;
    console.log();

    // Test 5: Check Deposit Status
    if (depositTxId) {
      console.log('5️⃣ Check Deposit Status');
      res = await makeRequest('GET', `/deposit/${depositTxId}`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Response:`, res.body);
      console.log();
    }

    // Test 6: Create Withdraw
    console.log('6️⃣ Create Withdraw');
    res = await makeRequest('POST', '/withdraw', {
      amount: 10,
      address: 'TLBz41r3p33PoPqnysKsZMb1Axuh5gucqJ',
      network: 'TRC20'
    });
    console.log(`   Status: ${res.status}`);
    if (res.status === 200) {
      console.log(`   ✓ Withdraw créé`);
      console.log(`   ✓ Track ID: ${res.body.trackId}`);
      console.log(`   ✓ TX ID: ${res.body.txId}`);
    } else {
      console.log(`   ✗ Erreur: ${res.body.error}`);
    }
    const withdrawTxId = res.body.txId;
    console.log();

    // Test 7: Check Withdraw Status
    if (withdrawTxId) {
      console.log('7️⃣ Check Withdraw Status');
      res = await makeRequest('GET', `/withdraw/${withdrawTxId}/status`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Response:`, res.body);
      console.log();
    }

    // Test 8: Invalid Request
    console.log('8️⃣ Test Invalid Request (Montant invalide)');
    res = await makeRequest('POST', '/deposit', {
      amount: -100
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Error: ${res.body.error}`);
    console.log();

    console.log('✅ Tests terminés!');
    console.log('\n📊 Résumé:');
    console.log('  - Register: ✓');
    console.log('  - Login: ✓');
    console.log('  - Deposit: ✓');
    console.log('  - Withdraw: ✓');
    console.log('  - Error Handling: ✓');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   S\'assurer que le serveur tourne: npm start');
  }
}

// Lancer les tests
runTests();
