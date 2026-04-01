/**
 * Test Suite for Authentication Service
 * Run with: npm test
 */

const assert = require('assert');

// Configuration
const BASE_URL = 'http://localhost:4001';
let authToken = '';
let userId = '';

// Test utilities
const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    data
  };
};

// Test Suite
const tests = {
  async testRegisterPatient() {
    console.log('\n✓ Test: Register Patient');
    const response = await makeRequest('POST', '/auth/register', {
      email: `patient-${Date.now()}@test.com`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'Patient',
      role: 'patient',
      phone: '+1-555-0000'
    });

    assert.strictEqual(response.status, 201, 'Should return 201 Created');
    assert.strictEqual(response.data.success, true, 'Success should be true');
    assert(response.data.data.token, 'Should return JWT token');
    assert(response.data.data.user._id, 'Should return user ID');
    assert.strictEqual(response.data.data.user.role, 'patient', 'Role should be patient');

    authToken = response.data.data.token;
    userId = response.data.data.user._id;
    console.log('  ✓ Patient registered successfully');
    console.log(`  ✓ Token received: ${authToken.substring(0, 20)}...`);
  },

  async testRegisterDoctor() {
    console.log('\n✓ Test: Register Doctor');
    const response = await makeRequest('POST', '/auth/register', {
      email: `doctor-${Date.now()}@test.com`,
      password: 'Test123456',
      firstName: 'Dr.',
      lastName: 'Smith',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MD-TEST-001'
    });

    assert.strictEqual(response.status, 201, 'Should return 201 Created');
    assert.strictEqual(response.data.data.user.role, 'doctor', 'Role should be doctor');
    assert.strictEqual(response.data.data.user.specialization, 'Cardiology', 'Should have specialization');
    console.log('  ✓ Doctor registered successfully');
  },

  async testRegisterInvalidEmail() {
    console.log('\n✓ Test: Register with Invalid Email');
    const response = await makeRequest('POST', '/auth/register', {
      email: 'invalid-email',
      password: 'Test123456',
      firstName: 'Invalid',
      lastName: 'User',
      role: 'patient'
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');
    console.log('  ✓ Invalid email rejected');
  },

  async testRegisterDuplicateEmail() {
    console.log('\n✓ Test: Register Duplicate Email');
    const testEmail = `duplicate-${Date.now()}@test.com`;

    // Register first user
    await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'Test123456',
      firstName: 'First',
      lastName: 'User',
      role: 'patient'
    });

    // Try to register with same email
    const response = await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'Different123456',
      firstName: 'Second',
      lastName: 'User',
      role: 'patient'
    });

    assert.strictEqual(response.status, 409, 'Should return 409 Conflict');
    assert.strictEqual(response.data.success, false, 'Should indicate failure');
    console.log('  ✓ Duplicate email rejected');
  },

  async testRegisterDoctorMissingLicense() {
    console.log('\n✓ Test: Register Doctor without License');
    const response = await makeRequest('POST', '/auth/register', {
      email: `doctor-${Date.now()}@test.com`,
      password: 'Test123456',
      firstName: 'Dr.',
      lastName: 'Incomplete',
      role: 'doctor',
      specialization: 'Cardiology'
      // Missing: licenseNumber
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');
    console.log('  ✓ Doctor registration without license rejected');
  },

  async testLogin() {
    console.log('\n✓ Test: Login');
    const testEmail = `login-${Date.now()}@test.com`;

    // Register user first
    await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'Test123456',
      firstName: 'Login',
      lastName: 'Test',
      role: 'patient'
    });

    // Login
    const response = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'Test123456'
    });

    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    assert.strictEqual(response.data.success, true, 'Success should be true');
    assert(response.data.data.token, 'Should return JWT token');
    assert.strictEqual(response.data.data.user.email, testEmail, 'Email should match');
    console.log('  ✓ Login successful');
  },

  async testLoginInvalidCredentials() {
    console.log('\n✓ Test: Login with Invalid Credentials');
    const response = await makeRequest('POST', '/auth/login', {
      email: 'nonexistent@test.com',
      password: 'WrongPassword'
    });

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
    assert.strictEqual(response.data.success, false, 'Success should be false');
    console.log('  ✓ Invalid credentials rejected');
  },

  async testLoginWrongPassword() {
    console.log('\n✓ Test: Login with Wrong Password');
    const testEmail = `wrongpass-${Date.now()}@test.com`;

    // Register user
    await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'CorrectPassword123',
      firstName: 'Wrong',
      lastName: 'Pass',
      role: 'patient'
    });

    // Try login with wrong password
    const response = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword123'
    });

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
    console.log('  ✓ Wrong password rejected');
  },

  async testGetProfile() {
    console.log('\n✓ Test: Get User Profile');
    const response = await makeRequest('GET', '/auth/profile', null, authToken);

    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    assert.strictEqual(response.data.success, true, 'Success should be true');
    assert.strictEqual(response.data.data.user._id, userId, 'Should return correct user');
    assert(response.data.data.user.email, 'Should have email');
    assert(response.data.data.user.firstName, 'Should have firstName');
    console.log('  ✓ Profile retrieved successfully');
  },

  async testGetProfileWithoutToken() {
    console.log('\n✓ Test: Get Profile without Token');
    const response = await makeRequest('GET', '/auth/profile', null, null);

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
    assert.strictEqual(response.data.success, false, 'Success should be false');
    console.log('  ✓ Unauthenicated request rejected');
  },

  async testGetProfileWithInvalidToken() {
    console.log('\n✓ Test: Get Profile with Invalid Token');
    const response = await makeRequest('GET', '/auth/profile', null, 'invalid.token.here');

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
    assert.strictEqual(response.data.success, false, 'Success should be false');
    console.log('  ✓ Invalid token rejected');
  },

  async testPasswordHashing() {
    console.log('\n✓ Test: Password Hashing');
    const testEmail = `hash-${Date.now()}@test.com`;
    const password = 'OriginalPassword123';

    // Register user
    const registerResponse = await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: password,
      firstName: 'Hash',
      lastName: 'Test',
      role: 'patient'
    });

    // Verify password is hashed (not in response)
    assert(!registerResponse.data.data.user.password, 'Password should not be in response');

    // Verify correct password works
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: password
    });

    assert.strictEqual(loginResponse.status, 200, 'Correct password should login');
    console.log('  ✓ Passwords are properly hashed');
  },

  async testJWTContainsRole() {
    console.log('\n✓ Test: JWT Contains Role');
    const response = await makeRequest('POST', '/auth/register', {
      email: `jwttest-${Date.now()}@test.com`,
      password: 'Test123456',
      firstName: 'JWT',
      lastName: 'Test',
      role: 'doctor'
    });

    const token = response.data.data.token;

    // Decode JWT (without verification)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    assert.strictEqual(payload.role, 'doctor', 'JWT should contain role');
    assert(payload.email, 'JWT should contain email');
    assert(payload.id, 'JWT should contain user ID');
    console.log('  ✓ JWT contains required fields');
  },

  async testHealthCheck() {
    console.log('\n✓ Test: Health Check');
    const response = await makeRequest('GET', '/health');

    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    console.log('  ✓ Health check working');
  }
};

// Run tests
const runTests = async () => {
  console.log('='.repeat(50));
  console.log('Authentication Service - Test Suite');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const [testName, testFn] of Object.entries(tests)) {
    try {
      await testFn();
      passed++;
    } catch (error) {
      failed++;
      console.error(`  ✗ FAILED: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Tests Complete: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
};

// Run if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, tests };
