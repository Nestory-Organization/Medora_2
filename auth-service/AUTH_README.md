# Authentication Service - Medora

A secure Node.js/Express-based authentication service using JWT and MongoDB for the Medora healthcare platform.

## Features

- **User Registration** with role-based access (Patient, Doctor, Admin)
- **JWT-based Authentication** with secure token generation
- **Password Hashing** using bcryptjs
- **Protected Routes** with authentication middleware
- **Role-based Authorization** for sensitive endpoints
- **Encrypted Passwords** stored securely in MongoDB
- **User Profiles** with extended metadata (specialization for doctors, etc.)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables:
```
PORT=4001
NODE_ENV=development
SERVICE_NAME=auth-service
MONGO_URI=mongodb://localhost:27017/medora_auth
JWT_SECRET=your_secure_random_secret_key
JWT_EXPIRE=7d
```

## Running the Service

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The service will start on the configured PORT (default: 4001).

## API Endpoints

### 1. Register User
`POST /auth/register`

Register a new user with role-specific fields.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "phone": "+1234567890"
}
```

**For Doctor Registration:**
```json
{
  "email": "doctor@example.com",
  "password": "secure_password",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "doctor",
  "specialization": "Cardiology",
  "licenseNumber": "MD123456",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "phone": "+1234567890",
      "isActive": true,
      "createdAt": "2024-03-31T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
`POST /auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile
`GET /auth/profile`

Retrieve authenticated user's profile (requires valid JWT token).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "phone": "+1234567890",
      "isActive": true,
      "createdAt": "2024-03-31T10:00:00Z",
      "updatedAt": "2024-03-31T10:00:00Z"
    }
  }
}
```

## User Roles

The system supports three user roles:

### 1. **Patient** (default)
- Can register and login
- Can access their own profile
- Standard healthcare patient features

### 2. **Doctor**
- Requires specialization and license number
- Can register and manage their profile
- Access to doctor-specific endpoints

### 3. **Admin**
- Full access to system
- Can manage users and roles
- (Admin creation typically handled separately or during initial setup)

## JWT Token Structure

The JWT token contains the following payload:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "patient",
  "iat": 1711865400,
  "exp": 1712470200
}
```

## Example Usage with cURL

### Register a Patient
```bash
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "phone": "+1234567890"
  }'
```

### Register a Doctor
```bash
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "doctor",
    "specialization": "Cardiology",
    "licenseNumber": "MD123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:4001/auth/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Security Features

1. **Password Hashing**: Bcryptjs with salt rounds (10)
2. **JWT Expiration**: Configurable token expiry (default: 7 days)
3. **Password Comparison**: Safe comparison using bcryptjs
4. **Email Validation**: Regex pattern validation
5. **CORS Protection**: Configured CORS headers
6. **Helmet Security**: HTTP headers hardened
7. **MongoDB Connection**: Pooling with timeout settings
8. **Error Handling**: Detailed error messages without sensitive data
9. **Unique Constraints**: Email uniqueness at database level
10. **Active User Check**: Account activation status validation

## Database Schema

### User Collection
```
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (enum: ['patient', 'doctor', 'admin']),
  phone: String,
  isActive: Boolean,
  specialization: String (for doctors),
  licenseNumber: String (for doctors),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The service returns appropriate HTTP status codes:

- **200 OK**: Successful GET request
- **201 Created**: Successful POST request (registration)
- **400 Bad Request**: Missing or invalid fields
- **401 Unauthorized**: Missing token or invalid credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: User already exists
- **500 Internal Server Error**: Server error

## Integration with Other Services

The authentication service can be integrated with other microservices:

1. **API Gateway**: Route auth requests through the gateway
2. **Other Services**: Use the `/auth/profile` endpoint with JWT tokens to verify users
3. **Middleware**: Use the `authenticate` middleware in other services to verify tokens

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4001 | Service port |
| NODE_ENV | development | Environment mode |
| MONGO_URI | - | MongoDB connection string (required) |
| JWT_SECRET | - | Secret key for JWT (required, must be changed in production) |
| JWT_EXPIRE | 7d | Token expiration time |
| SERVICE_NAME | auth-service | Service identifier |

## License

MIT
