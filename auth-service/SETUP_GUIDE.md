# SETUP GUIDE - Authentication Service

## Quick Start

### Prerequisites
- Node.js >= 20
- MongoDB (local or Docker)
- npm or yarn

### Step 1: Install Dependencies
```bash
cd auth-service
npm install
```

### Step 2: Create Environment File
```bash
cp .env.example .env
```

### Step 3: Configure MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d \
  --name medora-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=medora_auth \
  mongo:latest
```

**Option B: Local MongoDB**
Make sure MongoDB is running on `localhost:27017`

### Step 4: Update .env
Edit the `.env` file with your configuration:
```
PORT=4001
NODE_ENV=development
SERVICE_NAME=auth-service
MONGO_URI=mongodb://localhost:27017/medora_auth
JWT_SECRET=your_very_secure_random_secret_key_here_change_this
JWT_EXPIRE=7d
```

### Step 5: Start the Service
```bash
# Development mode (auto-reload)
npm run dev

# Or production mode
npm start
```

The service should now be running on `http://localhost:4001`

## Testing the API

### 1. Register a Patient
```bash
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }'
```

Expected Response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Register a Doctor
```bash
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.jane@example.com",
    "password": "SecurePass123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "doctor",
    "specialization": "Cardiology",
    "licenseNumber": "MD-2024-12345"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 4. Get Profile (Requires Token)
```bash
# Replace TOKEN_HERE with the token from login/register response
curl -X GET http://localhost:4001/auth/profile \
  -H "Authorization: Bearer TOKEN_HERE"
```

## Using with Postman

1. **Register Endpoint**
   - Method: POST
   - URL: `http://localhost:4001/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "Password123",
       "firstName": "First",
       "lastName": "Last",
       "role": "patient"
     }
     ```

2. **Login Endpoint**
   - Method: POST
   - URL: `http://localhost:4001/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "Password123"
     }
     ```

3. **Profile Endpoint**
   - Method: GET
   - URL: `http://localhost:4001/auth/profile`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer {token_from_login}`

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Ensure MongoDB is running
- Check MONGO_URI in .env
- Use Docker if local MongoDB is not installed

### JWT Secret Error
```
Error: Missing required environment variable: JWT_SECRET
```

**Solution:**
- Add JWT_SECRET to .env file

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4001
```

**Solution:**
- Change PORT in .env to an available port
- Or kill the process using port 4001

### Token Expired
```
Error: Invalid or expired token
```

**Solution:**
- Get a new token by logging in again
- Increase JWT_EXPIRE in .env (default: 7d)

## Project Structure
```
auth-service/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── env.js               # Environment configuration
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   └── system.controller.js # System endpoints
│   ├── models/
│   │   └── user.model.js        # User schema
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification
│   └── routes/
│       ├── auth.routes.js       # Auth endpoints
│       └── system.routes.js     # System endpoints
├── package.json
├── .env.example
├── AUTH_README.md               # API documentation
├── SETUP_GUIDE.md               # This file
└── EXAMPLES.js                  # Usage examples
```

## API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login user |
| GET | /auth/profile | Yes | Get user profile |
| GET | /health | No | Health check |
| GET | /status | No | Service status |

## Security Best Practices

1. **Change JWT_SECRET** in production - Use a strong, random string
2. **Use HTTPS** in production - Never send tokens over HTTP
3. **Secure MongoDB** - Use authentication and proper firewall rules
4. **Validate Input** - Service includes validation, but validate on client too
5. **Rate Limiting** - Consider adding rate limiting middleware
6. **CORS** - Review CORS settings for your environment
7. **Password Requirements** - Consider implementing stronger password policies

## Deployment Considerations

### Environment Variables for Production
```
NODE_ENV=production
PORT=4001
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/medora_auth
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRE=7d
```

### Docker Build
```bash
docker build -t medora-auth-service .
docker run -p 4001:4001 \
  --env-file .env \
  medora-auth-service
```

### Using Docker Compose
The service is already configured in the root `docker-compose.yml`

## Support & Documentation

- **API Documentation**: See `AUTH_README.md`
- **Usage Examples**: See `EXAMPLES.js`
- **Models**: See `src/models/user.model.js`
- **Controllers**: See `src/controllers/auth.controller.js`
- **Middleware**: See `src/middleware/auth.middleware.js`

## Next Steps

1. Create seed data for admin users
2. Implement password reset functionality
3. Add email verification
4. Implement refresh tokens
5. Add role-based access control (RBAC) endpoints
6. Set up API rate limiting
7. Add comprehensive logging
8. Implement API documentation (Swagger/OpenAPI)
