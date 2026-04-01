# Quick Reference - Authentication Service

## 🚀 Get Started in 5 Minutes

### 1. Install & Setup
```bash
cd auth-service
npm install
cp .env.example .env
# Edit .env: Add JWT_SECRET and MONGO_URI
```

### 2. Start Service
```bash
npm run dev
# Service running on http://localhost:4001
```

### 3. Test It
```bash
npm test
```

---

## 🔑 Core Endpoints

### Register Patient
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Register Doctor
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "doctor",
  "specialization": "Cardiology",
  "licenseNumber": "MD-12345"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Profile (Protected)
```bash
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...}
  }
}
```

---

## 🔐 JWT Token Usage

All protected endpoints require the token in header:
```
Authorization: Bearer <token>
```

Token contains:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "patient"
}
```

---

## 🛠 Integration with Other Services

### Add JWT Middleware
```javascript
const { authenticate } = require('./middleware/auth.middleware');

// Protected route
router.get('/profile', authenticate, controller.getProfile);
```

### Verify Token Locally
```javascript
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded contains: { id, email, role }
```

### Role-Based Access
```javascript
const { authorize } = require('./middleware/auth.middleware');

// Only doctors can access
router.get('/:id', authenticate, authorize('doctor', 'admin'), controller.getPatient);
```

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (wrong password/token) |
| 403 | Forbidden (insufficient permissions) |
| 409 | Conflict (email already exists) |
| 500 | Server error |

---

## 🧪 Test Scenarios

### Register & Login Flow
```bash
# 1. Register
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","role":"patient"}'

# Save the token from response

# 2. Login
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Get Profile (use token from login)
curl -X GET http://localhost:4001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚙️ Environment Variables

```env
PORT=4001                               # Port number
NODE_ENV=development                    # development/production
MONGO_URI=mongodb://localhost:27017/db  # MongoDB URL
JWT_SECRET=your_secret_key              # MUST CHANGE!
JWT_EXPIRE=7d                           # Token expiry
SERVICE_NAME=auth-service               # Service name
```

---

## 🚨 Common Issues

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED
```
**Fix:** Start MongoDB or update MONGO_URI

### JWT_SECRET Not Set
```
Error: Missing required environment variable: JWT_SECRET
```
**Fix:** Add JWT_SECRET to .env

### Port Already in Use
```
Error: listen EADDRINUSE
```
**Fix:** Change PORT in .env or kill process on that port

---

## 📚 User Roles

| Role | Can | Cannot |
|------|-----|--------|
| **Patient** | Login, view profile | Manage other users |
| **Doctor** | Login, view profile, access patient data | Delete users |
| **Admin** | Everything | - |

---

## 🔍 Debug Mode

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

Check MongoDB connection:
```javascript
const mongoose = require('mongoose');
console.log(mongoose.connection.readyState);
// 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
```

---

## 📝 Files Guide

| File | Purpose |
|------|---------|
| `src/models/user.model.js` | User schema |
| `src/controllers/auth.controller.js` | Auth logic |
| `src/middleware/auth.middleware.js` | JWT verification |
| `src/routes/auth.routes.js` | Endpoints |
| `test.js` | Test suite |
| `AUTH_README.md` | Full API docs |
| `SETUP_GUIDE.md` | Installation |
| `INTEGRATION.md` | Microservices |

---

## 🚀 Deployment Checklist

- [ ] Change JWT_SECRET
- [ ] Update MONGO_URI to production DB
- [ ] Set NODE_ENV=production
- [ ] Configure JWT_EXPIRE
- [ ] Set up monitoring
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Set up backups
- [ ] Test all endpoints

---

## 💡 Tips & Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT_SECRET** periodically
3. **Keep same JWT_SECRET** across all services
4. **Handle token expiry** on client side
5. **Store tokens securely** (secure cookies)
6. **Validate on both sides** (client + server)
7. **Use .env files** for secrets
8. **Monitor auth failures** for security
9. **Implement rate limiting** for login attempts
10. **Log all auth events** for audit trail

---

## 🔗 Service URLs

| Service | URL | Port |
|---------|-----|------|
| Auth Service | http://localhost:4001 | 4001 |
| Patient Service | http://localhost:4002 | 4002 |
| Doctor Service | http://localhost:4003 | 4003 |
| API Gateway | http://localhost:3000 | 3000 |

---

## 📞 Get Help

1. **API Parameters**: See `AUTH_README.md`
2. **Setup Issues**: See `SETUP_GUIDE.md`
3. **Integration**: See `INTEGRATION.md`
4. **Examples**: See `EXAMPLES.js`
5. **Tests**: See `test.js`
6. **Implementation**: See `IMPLEMENTATION.md`

---

**Last Updated**: March 31, 2026
**Version**: 1.0.0
