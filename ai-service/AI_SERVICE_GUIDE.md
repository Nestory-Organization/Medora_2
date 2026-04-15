# Phase 3: AI Service - Implementation Guide

## Overview

Phase 3 implements Google Gemini API integration for AI-powered medical analysis in the Medora healthcare platform. The AI service provides symptom analysis, specialist recommendations, and health insights.

---

## Project Structure

```
ai-service/
├── .env                          # Environment configuration
├── package.json                  # Dependencies (updated with Gemini & JWT)
├── src/
│   ├── app.js                    # Express app (updated with AI routes)
│   ├── server.js                 # Server entry point
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── env.js                # Environment variables (updated)
│   │   └── gemini.js             # Google Gemini API client (NEW)
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT authentication (NEW)
│   │   └── rateLimiter.middleware.js  # Rate limiting (NEW)
│   ├── controllers/
│   │   ├── system.controller.js  # Health/status endpoints
│   │   └── ai.controller.js      # AI endpoints (NEW)
│   ├── routes/
│   │   ├── system.routes.js      # System routes
│   │   └── ai.routes.js          # AI routes (NEW)
│   ├── utils/
│   │   └── promptBuilder.js      # Prompt builders (NEW)
│   └── models/                   # (Database models - optional)
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd ai-service
npm install
```

This installs:

- `@google/generative-ai`: Google Gemini API SDK
- `express-rate-limit`: Rate limiting middleware
- `jsonwebtoken`: JWT authentication
- Plus existing dependencies (express, mongoose, etc.)

### 2. Configure Environment Variables

Create/update `.env` in the ai-service root:

```env
NODE_ENV=development
PORT=4007
MONGO_URI=mongodb://localhost:27017/ai_db
SERVICE_NAME=ai-service

# Gemini API Configuration
GOOGLE_GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Rate Limiting
AI_RATE_LIMIT=5
AI_RATE_WINDOW=3600
```

#### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the API key and paste into `.env`

---

## API Endpoints

### Authentication

All endpoints require JWT token in `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### 1. Analyze Symptoms

**POST** `/api/ai/analyze-symptoms`

Analyzes patient symptoms and returns possible conditions with confidence levels.

**Request Body:**

```json
{
  "symptoms": ["headache", "fever", "cough"],
  "duration": "3 days",
  "severity": 7,
  "age": 35,
  "medicalHistory": "diabetes" // optional
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Symptom analysis completed",
  "data": {
    "disclaimer": "This analysis is for educational purposes only...",
    "possibleConditions": [
      {
        "condition": "Common Cold",
        "confidence": 75,
        "description": "Viral infection causing respiratory symptoms"
      },
      {
        "condition": "Influenza",
        "confidence": 60,
        "description": "Contagious respiratory illness"
      }
    ],
    "redFlags": ["persistent fever above 38.5°C", "difficulty breathing"],
    "recommendations": [
      "Stay hydrated",
      "Rest adequately",
      "Seek immediate care if severe"
    ]
  }
}
```

**Error Responses:**

- **400 Bad Request**: Invalid input (empty symptoms, invalid severity)
- **401 Unauthorized**: Missing JWT token
- **429 Too Many Requests**: Rate limit exceeded
- **500 Server Error**: Gemini API error or invalid API key
- **504 Gateway Timeout**: Request exceeded 30 seconds

---

### 2. Recommend Specialist

**POST** `/api/ai/recommend-specialist`

Recommends relevant medical specialists based on symptoms and conditions.

**Request Body:**

```json
{
  "symptoms": ["chest pain", "shortness of breath", "palpitations"],
  "conditions": ["Possible hypertension", "Anxiety"] // optional
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Specialist recommendations generated",
  "data": {
    "disclaimer": "This is an AI-generated recommendation...",
    "specialtyRecommendations": [
      {
        "specialty": "Cardiologist",
        "reason": "Chest pain and palpitations suggest cardiac issues",
        "priority": "High"
      },
      {
        "specialty": "Pulmonologist",
        "reason": "Shortness of breath indicates respiratory concern",
        "priority": "High"
      },
      {
        "specialty": "Psychiatrist",
        "reason": "Anxiety could be contributing factor",
        "priority": "Medium"
      }
    ]
  }
}
```

---

### 3. Get Health Insights

**POST** `/api/ai/health-insights`

Provides personalized wellness advice, lifestyle modifications, and preventive measures.

**Request Body:**

```json
{
  "symptoms": ["fatigue", "low energy", "poor sleep"],
  "medicalHistory": "Stress-related issues", // optional
  "age": 40
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Health insights generated",
  "data": {
    "disclaimer": "This wellness advice is for informational purposes...",
    "lifestyleModifications": [
      "Establish consistent sleep schedule (7-8 hours)",
      "Reduce screen time 1 hour before bed",
      "Practice stress management techniques"
    ],
    "dietaryRecommendations": [
      "Increase iron-rich foods (spinach, lean meats)",
      "Include B-vitamins for energy",
      "Stay hydrated (2-3 liters water daily)"
    ],
    "exerciseSuggestions": [
      "30 minutes moderate exercise 4-5 times weekly",
      "Include both cardio and strength training",
      "Try yoga or tai chi for stress"
    ],
    "preventiveMeasures": [
      "Regular health checkups",
      "Vitamin D supplementation if deficient",
      "Monitor thyroid function"
    ],
    "whenToSeekHelp": "Consult a doctor if fatigue persists beyond 2 weeks or worsens"
  }
}
```

---

## Rate Limiting

The AI service implements per-user rate limiting:

- **Limit**: 5 requests per hour per user
- **Store**: In-memory (resets on service restart)
- **Headers**: Includes `X-RateLimit-*` and `Retry-After`

**Example Rate Limit Response (429):**

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 1800,
  "resetTime": "2025-04-16T10:30:00Z"
}
```

---

## Security Features

### 1. Authentication (JWT)

- All AI endpoints require valid JWT token
- Token verified against `JWT_SECRET`
- Missing/invalid token → 401 Unauthorized

### 2. Input Sanitization

- Removes HTML/SQL injection characters: `< > " ' \` `
- Prevents XSS attacks
- Validates all input types and ranges

### 3. Medical Disclaimers

- All Gemini responses include disclaimer
- Not a substitute for professional medical consultation
- Educational purposes only

### 4. Privacy Protection

- Symptoms not stored in database
- Only metadata logged (user ID, timestamp, symptom count)
- Raw Gemini responses not persisted

### 5. Rate Limiting

- Per-user rate limiting (5 req/hour)
- Prevents API abuse and quota exhaustion
- Returns clear retry guidance

---

## Error Handling

The AI service handles errors gracefully:

| Code | Status            | Cause               | Solution                                   |
| ---- | ----------------- | ------------------- | ------------------------------------------ |
| 400  | Bad Request       | Invalid input       | Check symptoms array, severity (1-10), age |
| 401  | Unauthorized      | Missing JWT         | Include `Authorization: Bearer <token>`    |
| 403  | Forbidden         | Insufficient role   | User role not authorized for endpoint      |
| 429  | Too Many Requests | Rate limit exceeded | Wait for reset time or check `Retry-After` |
| 500  | Server Error      | Gemini API error    | Check API key, service status              |
| 504  | Gateway Timeout   | Request >30s        | Try again, check API rate limits           |

---

## Testing

### 1. Test with Postman/cURL

#### Get JWT Token (from Auth Service)

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Analyze Symptoms

```bash
curl -X POST http://localhost:4007/api/ai/analyze-symptoms \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["headache", "fever"],
    "duration": "2 days",
    "severity": 6,
    "age": 30
  }'
```

### 2. Verification Checklist

- [ ] Valid JWT token accepted
- [ ] Invalid JWT returns 401
- [ ] Empty symptoms array returns 400
- [ ] Invalid severity (>10) returns 400
- [ ] First 5 requests succeed, 6th returns 429
- [ ] Gemini response includes disclaimer
- [ ] Specialist recommendations include priority
- [ ] Health insights well-formatted
- [ ] Timeout after 30s returns 504
- [ ] Invalid API key returns 500

---

## Development & Troubleshooting

### Common Issues

**1. Missing GOOGLE_GEMINI_API_KEY**

```
Error: Missing required environment variable: GOOGLE_GEMINI_API_KEY
```

**Solution**: Add API key to `.env` from Google AI Studio

**2. Invalid JWT Secret**

```
Error: Missing required environment variable: JWT_SECRET
```

**Solution**: Ensure JWT_SECRET matches auth-service configuration

**3. Gemini Timeout**

```
{
  "success": false,
  "message": "Gemini API request timeout",
  "error": "The request took too long..."
}
```

**Solution**:

- Check internet connection
- Verify API key validity
- Retry with simpler prompt

**4. Rate Limit Too Strict**

- Edit `.env`: `AI_RATE_LIMIT=10` (or desired number)
- Rate window: `AI_RATE_WINDOW=3600` (1 hour in seconds)

### Enable Debug Logging

```javascript
// In ai.controller.js, add detailed logs
console.log("Request details:", { userId, symptoms, severity });
```

### Test Gemini Configuration

```bash
cd ai-service
node -e "const g = require('./src/config/gemini'); g.analyzeText('test prompt')"
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production JWT_SECRET (strong, random)
- [ ] Use production GOOGLE_GEMINI_API_KEY
- [ ] Set rate limits appropriately (5-10 req/hour)
- [ ] Enable HTTPS for all API calls
- [ ] Configure CORS for production domain
- [ ] Test all endpoints thoroughly
- [ ] Monitor Gemini API usage/costs
- [ ] Set up error logging/monitoring

### Scaling Considerations

- **Rate Limit Store**: Replace in-memory with Redis for multi-instance
- **Database**: Store analysis metadata in MongoDB
- **Caching**: Cache common prompts/responses
- **API Quotas**: Monitor Google Gemini usage

---

## Integration with API Gateway

The AI service runs on port 4007. API Gateway routes:

```
/api/ai/... → ai-service:4007
```

Make requests to Gateway:

```bash
POST /api/ai/analyze-symptoms
POST /api/ai/recommend-specialist
POST /api/ai/health-insights
```

---

## Environment Variables Reference

| Variable              | Required | Default          | Description                 |
| --------------------- | -------- | ---------------- | --------------------------- |
| NODE_ENV              | No       | development      | Production/development mode |
| PORT                  | Yes      | -                | Service port (4007)         |
| MONGO_URI             | Yes      | -                | MongoDB connection string   |
| SERVICE_NAME          | No       | ai-service       | Service identifier          |
| JWT_SECRET            | Yes      | -                | JWT signing secret          |
| JWT_EXPIRE            | No       | 7d               | JWT expiration time         |
| GOOGLE_GEMINI_API_KEY | Yes      | -                | Google Gemini API key       |
| GEMINI_MODEL          | No       | gemini-1.5-flash | Gemini model name           |
| AI_RATE_LIMIT         | No       | 5                | Max requests per window     |
| AI_RATE_WINDOW        | No       | 3600             | Rate limit window (seconds) |

---

## References

- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [JWT Authentication](https://jwt.io)
- [Express.js Documentation](https://expressjs.com)

---

## Version History

| Version | Date       | Changes                                        |
| ------- | ---------- | ---------------------------------------------- |
| 1.0.0   | 2026-04-16 | Initial implementation with Gemini integration |

---

## Support

For issues or questions:

1. Check the troubleshooting section
2. Verify environment variables
3. Check Gemini API quota and limits
4. Review service logs for error details

---

**Last Updated**: 2026-04-16
**Maintained By**: Medora Development Team
