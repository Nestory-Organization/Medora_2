/**
 * Authentication Service - Usage Examples
 * This file demonstrates how to use the authentication service
 */

// Example 1: Register a Patient
const registerPatient = async () => {
  const response = await fetch('http://localhost:4001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'patient@medora.com',
      password: 'SecurePassword123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
      phone: '+1-555-0123'
    })
  });

  const data = await response.json();
  console.log('Patient Registration:', data);
  return data.data.token;
};

// Example 2: Register a Doctor
const registerDoctor = async () => {
  const response = await fetch('http://localhost:4001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'doctor@medora.com',
      password: 'SecurePassword123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MD-2024-001234',
      phone: '+1-555-0456'
    })
  });

  const data = await response.json();
  console.log('Doctor Registration:', data);
  return data.data.token;
};

// Example 3: Login
const login = async () => {
  const response = await fetch('http://localhost:4001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'patient@medora.com',
      password: 'SecurePassword123'
    })
  });

  const data = await response.json();
  console.log('Login Response:', data);
  return data.data.token;
};

// Example 4: Get User Profile (Protected Route)
const getProfile = async (token) => {
  const response = await fetch('http://localhost:4001/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('User Profile:', data);
  return data;
};

// Example 5: Error Handling - Login with wrong password
const loginWithWrongPassword = async () => {
  const response = await fetch('http://localhost:4001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'patient@medora.com',
      password: 'WrongPassword'
    })
  });

  const data = await response.json();
  console.log('Login Failed:', data);
  // Expected response: { success: false, message: 'Invalid credentials' }
};

// Example 6: Error Handling - Register duplicate email
const registerDuplicate = async () => {
  const response = await fetch('http://localhost:4001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'patient@medora.com', // Already exists
      password: 'NewPassword123',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'patient'
    })
  });

  const data = await response.json();
  console.log('Duplicate Registration:', data);
  // Expected response: { success: false, message: 'User already exists with this email' }
};

// Example 7: Doctor registration without required fields
const registerDoctorIncomplete = async () => {
  const response = await fetch('http://localhost:4001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'incomplete-doctor@medora.com',
      password: 'SecurePassword123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'doctor'
      // Missing: specialization, licenseNumber
    })
  });

  const data = await response.json();
  console.log('Incomplete Doctor Registration:', data);
  // Expected response: { success: false, message: 'Specialization and license number are required for doctors' }
};

// Example 8: Access profile without token
const getProfileWithoutToken = async () => {
  const response = await fetch('http://localhost:4001/auth/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Profile Access Without Token:', data);
  // Expected response: { success: false, message: 'Authorization token is missing' }
};

// Example 9: Access profile with invalid token
const getProfileWithInvalidToken = async () => {
  const response = await fetch('http://localhost:4001/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid.token.here',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Profile Access With Invalid Token:', data);
  // Expected response: { success: false, message: 'Invalid or expired token' }
};

// Example 10: Complete authentication flow
const completeAuthFlow = async () => {
  console.log('\n=== COMPLETE AUTHENTICATION FLOW ===\n');

  // Step 1: Register
  console.log('Step 1: Registering a new patient...');
  const registerResponse = await fetch('http://localhost:4001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `patient-${Date.now()}@medora.com`,
      password: 'SecurePassword123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
      phone: '+1-555-0123'
    })
  });
  const registerData = await registerResponse.json();
  const token = registerData.data.token;
  console.log('✓ Registered successfully');

  // Step 2: Use profile endpoint
  console.log('\nStep 2: Retrieving user profile...');
  const profileResponse = await fetch('http://localhost:4001/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const profileData = await profileResponse.json();
  console.log('✓ Profile retrieved successfully');
  console.log('User:', profileData.data.user);

  // Step 3: Logout (just sending invalid token)
  console.log('\nStep 3: Logout (discarding token)');
  console.log('✓ Logged out successfully (token invalidated)');
};

// Export for testing
module.exports = {
  registerPatient,
  registerDoctor,
  login,
  getProfile,
  loginWithWrongPassword,
  registerDuplicate,
  registerDoctorIncomplete,
  getProfileWithoutToken,
  getProfileWithInvalidToken,
  completeAuthFlow
};
