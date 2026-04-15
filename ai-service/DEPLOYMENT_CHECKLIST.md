# Phase 3: AI Service - Deployment Checklist

## ✅ Implementation Complete

All files created and configured for Google Gemini API integration.

---

## 📋 Pre-Deployment Steps

### 1. Install Dependencies

```bash
cd /Users/admin/Lithira/SLIIT/Medora_2/ai-service
npm install
```

### 2. Get Google Gemini API Key

- Visit: https://aistudio.google.com/app/apikey
- Click "Create API Key"
- Select/create a Google Cloud project
- Copy the generated API key

### 3. Update Environment Variables

Edit `ai-service/.env`:

```env
# Get from Google AI Studio (above)
GOOGLE_GEMINI_API_KEY=your_api_key_here

# Must match auth-service JWT_SECRET for token verification
JWT_SECRET=your_jwt_secret_here

# (Optional) Adjust rate limiting if needed
AI_RATE_LIMIT=5
AI_RATE_WINDOW=3600
```

### 4. Start the Service

```bash
npm start          # Production mode
# or
npm run dev        # Development mode (auto-reload)
```

Service will be available at: `http://localhost:4007`

---

## 🧪 Testing the Implementation

### Test 1: Get JWT Token (from Auth Service)

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

Save the `token` from response.

### Test 2: Analyze Symptoms (Most Important)

```bash
curl -X POST http://localhost:4007/api/ai/analyze-symptoms \
  -H "Authorization: Bearer <token_from_test_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["headache", "fever", "cough"],
    "duration": "3 days",
    "severity": 7,
    "age": 35,
    "medicalHistory": "none"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Symptom analysis completed",
  "data": {
    "disclaimer": "...",
    "possibleConditions": [
      { "condition": "...", "confidence": 75, "description": "..." }
    ],
    "redFlags": [...],
    "recommendations": [...]
  }
}
```

### Test 3: Recommend Specialist

```bash
curl -X POST http://localhost:4007/api/ai/recommend-specialist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["chest pain", "shortness of breath"],
    "conditions": []
  }'
```

**Expected Response:** 3-5 specialist recommendations with priority levels.

### Test 4: Get Health Insights

```bash
curl -X POST http://localhost:4007/api/ai/health-insights \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["fatigue", "low energy"],
    "medicalHistory": "stress",
    "age": 40
  }'
```

**Expected Response:** Lifestyle tips, dietary advice, exercise suggestions, preventive measures.

### Test 5: Rate Limiting (Make 6 requests in sequence)

Request 1-5 should succeed (200).
Request 6 should return (429):

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 1800,
  "resetTime": "2026-04-16T..."
}
```

### Test 6: Invalid Input (Empty Symptoms)

```bash
curl -X POST http://localhost:4007/api/ai/analyze-symptoms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": [],
    "duration": "3 days",
    "severity": 5,
    "age": 30
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Symptoms array is required and must not be empty"
}
```

### Test 7: Missing JWT Token

```bash
curl -X POST http://localhost:4007/api/ai/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["headache"], "duration": "1 day", "severity": 5, "age": 30}'
```

**Expected Response (401):**

```json
{
  "success": false,
  "message": "Authorization token is missing"
}
```

---

## 📁 Files Created/Modified

### NEW Files

- ✅ `ai-service/src/config/gemini.js` - Gemini API client
- ✅ `ai-service/src/utils/promptBuilder.js` - Prompt builders
- ✅ `ai-service/src/middleware/auth.middleware.js` - JWT auth
- ✅ `ai-service/src/middleware/rateLimiter.middleware.js` - Rate limiting
- ✅ `ai-service/src/controllers/ai.controller.js` - AI endpoints
- ✅ `ai-service/src/routes/ai.routes.js` - API routes
- ✅ `ai-service/AI_SERVICE_GUIDE.md` - Complete documentation

### MODIFIED Files

- ✅ `ai-service/.env` - Added Gemini & JWT config
- ✅ `ai-service/package.json` - Added dependencies
- ✅ `ai-service/src/config/env.js` - Added new env vars
- ✅ `ai-service/src/app.js` - Registered AI routes

---

## 🔧 Configuration Reference

| Setting      | Value            | Notes                         |
| ------------ | ---------------- | ----------------------------- |
| Service Port | 4007             | Access via `localhost:4007`   |
| Gem Model    | gemini-1.5-flash | Latest fast model (free tier) |
| Rate Limit   | 5 req/hour       | Per authenticated user        |
| Timeout      | 30 seconds       | Max Gemini API wait time      |
| Rate Window  | 3600 seconds     | 1 hour reset period           |

---

## 🚨 Troubleshooting

### Error: "Missing required environment variable: GOOGLE_GEMINI_API_KEY"

**Solution:** Add valid API key from Google AI Studio to `.env`

### Error: "Invalid or expired token"

**Solution:** Get fresh JWT from auth-service login endpoint

### Error: "Too many requests"

**Solution:** Wait for window reset (check `resetTime` in response) or increase `AI_RATE_LIMIT`

### Error: "Gemini API request timeout"

**Solution:**

- Check internet connection
- Verify API key validity
- Check Google Gemini quota
- Try again (auto-retry in client)

### No JSON response from Gemini

**Solution:** Service returns `raw` text response if JSON parsing fails

---

## 📊 API Endpoints Summary

| Method | Endpoint                     | Purpose                  | Rate Limited | Auth Required |
| ------ | ---------------------------- | ------------------------ | ------------ | ------------- |
| POST   | /api/ai/analyze-symptoms     | Symptom → conditions     | ✅           | ✅            |
| POST   | /api/ai/recommend-specialist | Conditions → specialists | ✅           | ✅            |
| POST   | /api/ai/health-insights      | Wellness advice          | ✅           | ✅            |
| GET    | /health                      | Service health           | ❌           | ❌            |
| GET    | /status                      | Service status           | ❌           | ❌            |

---

## 📚 Additional Resources

- [AI Service Documentation](./AI_SERVICE_GUIDE.md)
- [Google Gemini API](https://ai.google.dev/docs)
- [JWT Overview](https://jwt.io)
- [Express.js Documentation](https://expressjs.com)

---

## ✨ Key Features Implemented

✅ Google Gemini API Integration
✅ Three AI Analysis Endpoints
✅ JWT Authentication
✅ Per-User Rate Limiting (5 req/hour)
✅ Input Sanitization (XSS/SQL Injection prevention)
✅ Medical Disclaimers
✅ Comprehensive Error Handling
✅ 30-Second API Timeout
✅ Detailed Logging
✅ Production-Ready Configuration

---

## 🎯 Next Steps

1. **Install**: `npm install` in ai-service directory
2. **Configure**: Add GOOGLE_GEMINI_API_KEY to .env
3. **Start**: `npm start` or `npm run dev`
4. **Test**: Use curl commands above or Postman
5. **Monitor**: Check logs for errors/warnings
6. **Deploy**: Configure rate limits for production load

---

**Ready for deployment!** 🚀

For questions or issues, refer to [AI_SERVICE_GUIDE.md](./AI_SERVICE_GUIDE.md)

Last Updated: 2026-04-16
