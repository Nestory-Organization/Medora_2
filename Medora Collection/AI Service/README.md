# AI Service Test Collection

Comprehensive API endpoint test suite for the AI Service module, following patient/doctor test collection format.

## Overview

This collection provides end-to-end testing for three AI-powered health endpoints:

- **Symptom Analysis**: Analyze patient symptoms and get possible conditions
- **Specialist Recommendation**: Get recommended doctor specialties based on symptoms
- **Health Insights**: Get lifestyle and dietary recommendations

## Prerequisites

Before running tests:

1. **Auth Service must be running** (for patient login)
2. **AI Service must be running** (port 4007)
3. **API Gateway must be running** (port 4000)
4. **Patient account must exist** with credentials:
   ```
   Email: patient_test_123@test.com
   Password: Test@123
   ```
5. **GOOGLE_GEMINI_API_KEY** must be configured in AI Service .env
6. **JWT_SECRET** must match across auth-service and ai-service

## Test Execution Order

```
1. Patient Login → (saves JWT token)
2. Analyze Symptoms
3. Recommend Specialist
4. Get Health Insights
```

**Critical**: Run test 01 first to authenticate and save the JWT token for subsequent tests.

## Test Files

### 01 - Patient Login.yml

**Purpose**: Authenticate as patient and save JWT token for AI API calls

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/auth/login`
- Body: `{ email, password }`

**Assertions**:

- Status: 200
- Response: `{ success: true, data: { token } }`
- Saves `AI_JWT_TOKEN` variable for subsequent tests

**Success Indicator**: ✅ JWT Token saved

---

### 02 - Analyze Symptoms - Success.yml

**Purpose**: Successfully analyze patient symptoms and get possible conditions

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/ai/analyze-symptoms`
- Auth: Bearer token (required)
- Body: `{ symptoms, duration, severity (1-10), age, medicalHistory }`

**Assertions**:

- Status: 200
- Response: `{ success: true, data: { possibleConditions[], recommendations } }`
- possibleConditions is non-empty array

**Success Indicator**: ✅ Symptom analysis success

**Note**: This test makes actual Gemini API call. May take 1-3 seconds.

---

### 03 - Recommend Specialist.yml

**Purpose**: Successfully get specialist recommendations based on symptoms

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/ai/recommend-specialist`
- Auth: Bearer token
- Body: `{ symptoms[], conditions[] }`

**Assertions**:

- Status: 200
- Response: `{ success: true, data: { specialtyRecommendations[] } }`
- specialtyRecommendations contains priority field
- Array is non-empty

**Success Indicator**: ✅ Specialist recommendations

**Example Response**:

```json
{
  "specialtyRecommendations": [
    {
      "specialty": "Cardiologist",
      "priority": "High",
      "reason": "Chest pain detected"
    }
  ]
}
```

---

### 06 - Recommend Specialist - Validation Error.yml

**Purpose**: Test validation error when symptoms array is empty

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/ai/recommend-specialist`
- Auth: Bearer token
- Body: `{ symptoms: [], conditions: [] }`

**Assertions**:

- Status: 400
- Response: `{ success: false, message: "...Symptoms..." }`

**Success Indicator**: ✅ Validation error - empty symptoms

---

### 07 - Get Health Insights - Success.yml

**Purpose**: Successfully get personalized health insights and recommendations

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/ai/health-insights`
- Auth: Bearer token
- Body: `{ symptoms[], medicalHistory, age }`

**Assertions**:

- Status: 200
- Response: `{ success: true, data: { lifestyleModifications[], dietaryRecommendations[], whenToSeekHelp } }`
- lifestyleModifications is non-empty array
- dietaryRecommendations is non-empty array

**Success Indicator**: ✅ Health insights received

**Note**: Response includes medical disclaimer

---

### 04 - Get Health Insights.yml

**Purpose**: Successfully get personalized health insights and recommendations

**Request**:

- Method: POST
- URL: `http://localhost:4000/api/ai/health-insights`
- Auth: Bearer token
- Body: `{ symptoms[], medicalHistory, age }`

**Assertions**:

- Status: 200
- Response: `{ success: true, data: { lifestyleModifications[], dietaryRecommendations[], whenToSeekHelp } }`
- lifestyleModifications is non-empty array
- dietaryRecommendations is non-empty array

**Success Indicator**: ✅ Health insights received

**Note**: Response includes medical disclaimer

---

## Test Coverage

| Test | Endpoint             | Type    | Purpose                                 |
| ---- | -------------------- | ------- | --------------------------------------- |
| 01   | Auth                 | Setup   | Get JWT token                           |
| 02   | Analyze Symptoms     | Success | Analyze patient symptoms                |
| 03   | Recommend Specialist | Success | Get doctor specialty recommendations    |
| 04   | Health Insights      | Success | Get personalized health recommendations |

## Environment Variables

In Bruno/Insomnia environment file (`environments/ai.yml`):

```yaml
variables:
  AI_JWT_TOKEN: (saved by test 01)
```

## Quick Start

### Bruno

1. Open Bruno
2. Import this collection
3. Run tests sequentially: 01 → 04
4. View results in response panel

### Insomnia

1. Open Insomnia
2. Import this collection
3. Run tests from request manager
4. Set execution order: 01 → 04

### cURL (Manual Testing)

Get JWT Token:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient_test_123@test.com","password":"Test@123"}'
```

Analyze Symptoms:

```bash
curl -X POST http://localhost:4000/api/ai/analyze-symptoms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "symptoms": ["headache","fever","cough"],
    "duration": "3 days",
    "severity": 7,
    "age": 35,
    "medicalHistory": "none"
  }'
```

## Troubleshooting

| Issue                     | Solution                                                      |
| ------------------------- | ------------------------------------------------------------- |
| Test 01 fails             | Ensure auth-service is running; verify patient account exists |
| Tests 02-08 fail with 503 | AI Service not running; check port 4007                       |
| Tests 02-08 fail with 500 | GOOGLE_GEMINI_API_KEY not set or invalid                      |
| Tests return 429          | Rate limit exceeded; reset after 1 hour or restart AI service |
| JWT token invalid         | Run test 01 again; token may have expired (7 days)            |
| Timeout (504)             | Gemini API slow; try again after 30 seconds                   |

## Notes

- **Medical Disclaimer**: All AI responses include a medical disclaimer
- **Gemini Model**: gemini-1.5-flash (30-second timeout)
- **Input Sanitization**: All inputs sanitized to prevent injection attacks
- **Token Expiry**: JWT tokens expire after 7 days
- **Test Data**: All test data is generic and for testing purposes only

## Related Documentation

- [AI Service Implementation Guide](../../AI_SERVICE_GUIDE.md)
- [Deployment Checklist](../../DEPLOYMENT_CHECKLIST.md)
- [Auth Service Tests](../Auth/)
- [Patient Endpoint Tests](../Patient/)
- [Doctor Endpoint Tests](../Doctor/)
