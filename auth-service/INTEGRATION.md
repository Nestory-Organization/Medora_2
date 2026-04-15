# Integration Guide - Authentication with Other Services

This guide explains how to integrate the authentication service with other Medora microservices.

## Architecture Overview

```
API Gateway (Port 3000)
    ↓
    ├─→ Auth Service (Port 4001)
    ├─→ Patient Service (Port 4002)
    ├─→ Doctor Service (Port 4003)
    ├─→ Appointment Service (Port 4004)
    └─→ Other Services...
```

## 1. Verify User with Auth Service

When a service receives a request with a JWT token, verify it with the auth service.

### Option A: Pass Token to Auth Service

```javascript
const verifyToken = async (token) => {
  try {
    const response = await fetch('http://auth-service:4001/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.data.user;
    }
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};
```

### Option B: Verify JWT Locally (Recommended)

Use the same JWT_SECRET in all services to verify tokens locally:

```javascript
const jwt = require('jsonwebtoken');
const env = require('./config/env');

const verifyJWT = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
};
```

## 2. Add JWT Middleware to Patient Service

Update `patient-service/src/middleware/auth.middleware.js`:

```javascript
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

## 3. Update Patient Service Config

Add `JWT_SECRET` to `.env.example`:

```env
PORT=4002
MONGO_URI=mongodb://localhost:27017/medora_patient
JWT_SECRET=your_jwt_secret_key_same_as_auth_service
SERVICE_NAME=patient-service
```

**IMPORTANT**: Use the **same JWT_SECRET** in all services!

## 4. Protect Patient Service Routes

Update `patient-service/src/routes/patient.routes.js`:

```javascript
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const patientController = require('../controllers/patient.controller');

const router = express.Router();

// Only authenticated users can access patient routes
router.use(authenticate);

// Only patients can access their own data
router.get('/my-profile', authorize('patient'), patientController.getMyProfile);
router.put('/my-profile', authorize('patient'), patientController.updateMyProfile);

// Only doctors can view patient data
router.get('/:id', authorize('doctor', 'admin'), patientController.getPatientById);

// Only admin can list all patients
router.get('/', authorize('admin'), patientController.getAllPatients);

module.exports = router;
```

## 5. Add JWT to Patient Controller

Update `patient-service/src/controllers/patient.controller.js`:

```javascript
exports.getMyProfile = async (req, res) => {
  try {
    // req.user contains: { id, email, role }
    const userId = req.user.id;

    const patient = await Patient.findById(userId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, address, dateOfBirth } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      userId,
      { phone, address, dateOfBirth },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { patient }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 6. Service-to-Service Communication

When one service needs to make requests to another, pass the token:

```javascript
// In Doctor Service - Get patient information
const getPatientFromService = async (patientId, token) => {
  try {
    const response = await fetch(
      `http://patient-service:4002/patients/${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return null;
  }
};
```

## 7. API Gateway Integration

Update API Gateway to include auth middleware:

```javascript
// api-gateway/src/app.js
const express = require('express');
const app = express();

app.use(express.json());

// Auth routes (don't require authentication)
app.use('/api/auth', require('./routes/auth-proxy.routes'));

// Other routes require authentication
app.use('/api/patients', authenticateMiddleware, require('./routes/patient-proxy.routes'));
app.use('/api/doctors', authenticateMiddleware, require('./routes/doctor-proxy.routes'));
app.use('/api/appointments', authenticateMiddleware, require('./routes/appointment-proxy.routes'));

module.exports = app;
```

## 8. Complete Flow Example

### User Registration
```
Client
  ↓
POST /api/auth/register
  ↓
API Gateway
  ↓
Auth Service (4001) → MongoDB
  ↓
Response with JWT token
```

### User Access Patient Profile
```
Client (with JWT token)
  ↓
GET /api/patients/my-profile
  ↓
API Gateway (verify token)
  ↓
Patient Service (4002)
  - Verify token locally or with auth service
  - Extract user ID from token
  - Query MongoDB with user ID
  ↓
Return patient data
```

### Doctor Access Patient Data
```
Client (Doctor with JWT token)
  ↓
GET /api/patients/:patientId
  ↓
API Gateway
  ↓
Patient Service
  - Verify token
  - Check role is 'doctor' or 'admin'
  - Query patient data
  ↓
Return patient data
```

## 9. Error Handling Standardization

All services should return consistent error responses:

```javascript
// Unauthorized (missing token)
{
  success: false,
  message: 'Authorization token required',
  status: 401
}

// Forbidden (insufficient permissions)
{
  success: false,
  message: 'Doctor role required to access this resource',
  status: 403
}

// Invalid token
{
  success: false,
  message: 'Invalid or expired token',
  status: 401
}
```

## 10. Testing Integrated Flow

### 1. Register a doctor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@medora.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Smith",
    "role": "doctor",
    "specialization": "Cardiology",
    "licenseNumber": "MD-2024-001"
  }'
```

### 2. Get doctor profile
```bash
curl -X GET http://localhost:3000/api/doctors/profile \
  -H "Authorization: Bearer <token_from_register>"
```

### 3. Register a patient
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@medora.com",
    "password": "Password123",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "patient"
  }'
```

### 4. Doctor access patient information
```bash
curl -X GET http://localhost:3000/api/patients/<patient_id> \
  -H "Authorization: Bearer <doctor_token>"
```

## 11. Environment Setup for All Services

Create a `.env` file in each service with the same JWT_SECRET:

### auth-service/.env
```env
PORT=4001
MONGO_URI=mongodb://localhost:27017/medora_auth
JWT_SECRET=sk_live_abc123defghijklmnopqrstuvwxyz789
JWT_EXPIRE=7d
```

### patient-service/.env
```env
PORT=4002
MONGO_URI=mongodb://localhost:27017/medora_patient
JWT_SECRET=sk_live_abc123defghijklmnopqrstuvwxyz789
```

### doctor-service/.env
```env
PORT=4003
MONGO_URI=mongodb://localhost:27017/medora_doctor
JWT_SECRET=sk_live_abc123defghijklmnopqrstuvwxyz789
```

⚠️ **IMPORTANT**: Keep JWT_SECRET consistent across all services!

## 12. Docker Compose with Shared JWT_SECRET

Update `docker-compose.yml` to share JWT_SECRET:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"

  auth-service:
    build: ./auth-service
    ports:
      - "4001:4001"
    environment:
      MONGO_URI: mongodb://mongodb:27017/medora_auth
      JWT_SECRET: sk_live_abc123defghijklmnopqrstuvwxyz789
      PORT: 4001

  patient-service:
    build: ./patient-service
    ports:
      - "4002:4002"
    environment:
      MONGO_URI: mongodb://mongodb:27017/medora_patient
      JWT_SECRET: sk_live_abc123defghijklmnopqrstuvwxyz789
      PORT: 4002
    depends_on:
      - auth-service
  
  appointment-service:
  build: ./appointment-service
  ports:
    - "5004:5004"

  # Other services...
```

## Summary

✅ Auth service handles user registration and login
✅ All services verify JWT tokens locally
✅ JWT payload includes user role for authorization
✅ Role-based access control on each service
✅ Consistent error handling across all services
✅ Service-to-service communication includes auth token
✅ All services use the same JWT_SECRET

This architecture ensures secure, scalable authentication across all Medora microservices!
