const express = require("express");
const {
  analyzeSymptoms,
  recommendSpecialist,
  getHealthInsights,
  getAiHistory,
  deleteAiHistoryItem,
} = require("../controllers/ai.controller");
const { authenticate } = require("../middleware/auth.middleware");
const rateLimiter = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// All AI endpoints require authentication and rate limiting
router.use(authenticate);
router.use(rateLimiter);

/**
 * POST /api/ai/analyze-symptoms
 * Analyze symptoms and provide possible conditions
 *
 * Request body:
 * {
 *   "symptoms": ["headache", "fever"],
 *   "duration": "3 days",
 *   "severity": 7,
 *   "age": 35,
 *   "medicalHistory": "diabetes" (optional)
 * }
 */
router.post("/analyze-symptoms", analyzeSymptoms);

/**
 * POST /api/ai/recommend-specialist
 * Recommend medical specialists based on symptoms
 *
 * Request body:
 * {
 *   "symptoms": ["chest pain", "shortness of breath"],
 *   "conditions": ["condition1"] (optional)
 * }
 */
router.post("/recommend-specialist", recommendSpecialist);

/**
 * POST /api/ai/health-insights
 * Get health insights and wellness recommendations
 *
 * Request body:
 * {
 *   "symptoms": ["fatigue", "low energy"],
 *   "medicalHistory": "history" (optional),
 *   "age": 40
 * }
 */
/**
 * GET /api/ai/history
 * Get AI history for the authenticated user
 */
router.get("/history", getAiHistory);

/**
 * DELETE /api/ai/history/:id
 * Delete a history item
 */
router.delete("/history/:id", deleteAiHistoryItem);

router.post("/health-insights", getHealthInsights);

module.exports = router;
