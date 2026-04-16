const gemini = require("../config/gemini");
const AiHistory = require("../models/aiHistory.model");
const {
  buildSymptomAnalysisPrompt,
  buildSpecialistRecommendationPrompt,
  buildHealthInsightsPrompt,
} = require("../utils/promptBuilder");
const env = require("../config/env");

const DOCTOR_FETCH_TIMEOUT_MS = 4000;
const MAX_DOCTORS_PER_SPECIALTY = 3;

const buildDoctorSearchUrls = () => {
  const configuredBaseUrls = [
    env.doctorServiceUrl,
    "http://doctor-service:4003",
    "http://localhost:4003",
    "http://localhost:4000/api/doctors",
  ].filter(Boolean);

  return Array.from(
    new Set(
      configuredBaseUrls.map((baseUrl) =>
        baseUrl.includes("/api/doctors") || baseUrl.includes("/doctor")
          ? baseUrl.replace(/\/+$/, "")
          : `${baseUrl.replace(/\/+$/, "")}/doctor`,
      ),
    ),
  );
};

const tryFetchDoctors = async (specialty) => {
  const searchUrls = buildDoctorSearchUrls();

  for (const baseUrl of searchUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOCTOR_FETCH_TIMEOUT_MS);

    try {
      const url = `${baseUrl}/search?specialty=${encodeURIComponent(specialty)}`;
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload?.data)) {
        continue;
      }

      return payload.data;
    } catch (error) {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return [];
};

const normalizeSpecialistRecommendations = (recommendationResult) => {
  if (Array.isArray(recommendationResult?.specialtyRecommendations)) {
    return recommendationResult.specialtyRecommendations.map((item) => ({
      specialty: String(item?.specialty || "General Physician"),
      reason: String(item?.reason || "Based on symptom pattern"),
      priority: String(item?.priority || "Medium"),
    }));
  }

  if (Array.isArray(recommendationResult?.specialists)) {
    return recommendationResult.specialists.map((item) => ({
      specialty: String(item?.name || item?.specialty || "General Physician"),
      reason: String(item?.reason || "Based on symptom pattern"),
      priority: String(item?.priority || "Medium"),
    }));
  }

  return [];
};

const enrichWithRegisteredDoctors = async (specialtyRecommendations) => {
  const mapped = await Promise.all(
    specialtyRecommendations.map(async (rec) => {
      const doctors = await tryFetchDoctors(rec.specialty);
      const topDoctors = doctors.slice(0, MAX_DOCTORS_PER_SPECIALTY);

      const matchedDoctors = topDoctors.map((doctor) => ({
        doctorId: doctor.doctorId,
        name:
          doctor.name ||
          `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim(),
        specialization: doctor.specialization || rec.specialty,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationFee: doctor.consultationFee,
        qualification: doctor.qualification,
        clinicAddress: doctor.clinicAddress,
        reason: rec.reason,
        priority: rec.priority,
      }));

      // Find external links if no internal doctors are found
      let externalSearchUrl = null;
      if (matchedDoctors.length === 0) {
        const query = encodeURIComponent(`${rec.specialty} doctors near me`);
        externalSearchUrl = `https://www.google.com/search?q=${query}`;
      }

      return {
        specialty: rec.specialty,
        reason: rec.reason,
        priority: rec.priority,
        matchedDoctorCount: matchedDoctors.length,
        matchedDoctors,
        externalSearchUrl, // Added for web search fallback
      };
    }),
  );

  const dedupedDoctorMap = new Map();

  mapped.forEach((entry) => {
    entry.matchedDoctors.forEach((doctor) => {
      if (!doctor?.doctorId) {
        return;
      }

      if (!dedupedDoctorMap.has(doctor.doctorId)) {
        dedupedDoctorMap.set(doctor.doctorId, {
          ...doctor,
          matchedSpecialties: [entry.specialty],
        });
      } else {
        const existing = dedupedDoctorMap.get(doctor.doctorId);
        existing.matchedSpecialties = Array.from(
          new Set([...(existing.matchedSpecialties || []), entry.specialty]),
        );
      }
    });
  });

  return {
    specialties: mapped,
    suggestedDoctors: Array.from(dedupedDoctorMap.values()),
    doctorCoverage: {
      totalSpecialties: mapped.length,
      specialtiesWithDoctors: mapped.filter(
        (item) => item.matchedDoctorCount > 0,
      ).length,
      totalSuggestedDoctors: dedupedDoctorMap.size,
    },
  };
};

/**
 * Validate input for symptom analysis
 */
const validateSymptomInput = (req) => {
  const { symptoms, duration, severity, age, medicalHistory } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return {
      valid: false,
      message: "Symptoms array is required and must not be empty",
    };
  }

  if (!duration || typeof duration !== "string") {
    return {
      valid: false,
      message: "Duration is required and must be a string",
    };
  }

  if (severity === undefined || severity === null) {
    return { valid: false, message: "Severity is required" };
  }

  const severityNum = Number(severity);
  if (isNaN(severityNum) || severityNum < 1 || severityNum > 10) {
    return {
      valid: false,
      message: "Severity must be a number between 1 and 10",
    };
  }

  if (!age || typeof age !== "number" || age < 0 || age > 150) {
    return {
      valid: false,
      message: "Age must be a valid number between 0 and 150",
    };
  }

  return { valid: true };
};

/**
 * Validate input for specialist recommendation
 */
const validateSpecialistInput = (req) => {
  const { symptoms, conditions } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return {
      valid: false,
      message: "Symptoms array is required and must not be empty",
    };
  }

  if (conditions && !Array.isArray(conditions)) {
    return { valid: false, message: "Conditions must be an array if provided" };
  }

  return { valid: true };
};

/**
 * Validate input for health insights
 */
const validateHealthInsightsInput = (req) => {
  const { symptoms, medicalHistory, age } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return {
      valid: false,
      message: "Symptoms array is required and must not be empty",
    };
  }

  if (
    typeof medicalHistory !== "string" &&
    medicalHistory !== undefined &&
    medicalHistory !== null
  ) {
    return {
      valid: false,
      message: "Medical history must be a string if provided",
    };
  }

  if (!age || typeof age !== "number" || age < 0 || age > 150) {
    return {
      valid: false,
      message: "Age must be a valid number between 0 and 150",
    };
  }

  return { valid: true };
};

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }

  if (typeof input === "string") {
    return input.replace(/[<>\"'`]/g, "").trim();
  }

  return input;
};

/**
 * Analyze Symptoms Handler
 * POST /api/ai/analyze-symptoms
 */
const analyzeSymptoms = async (req, res) => {
  try {
    // Validate input
    const validation = validateSymptomInput(req);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { symptoms, duration, severity, age, medicalHistory } = req.body;

    // Sanitize inputs
    const sanitizedSymptoms = sanitizeInput(symptoms);
    const sanitizedDuration = sanitizeInput(duration);
    const sanitizedHistory = sanitizeInput(medicalHistory || "");

    // Log request (without storing sensitive data)
    console.log(
      `Symptom analysis requested by user: ${req.user?.id || "anonymous"}, symptoms count: ${sanitizedSymptoms.length}`,
    );

    // Build prompt
    const prompt = buildSymptomAnalysisPrompt(
      sanitizedSymptoms,
      sanitizedDuration,
      severity,
      age,
      sanitizedHistory,
    );

    // Call Gemini API
    const response = await gemini.analyzeText(prompt);

    // Parse response (expect JSON)
    let analysisResult;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch (parseError) {
      analysisResult = { raw: response };
    }
// Save to history
    try {
      if (req.user?.id) {
        await AiHistory.create({
          userId: req.user.id,
          type: "analysis",
          inputData: { symptoms: sanitizedSymptoms, duration: sanitizedDuration, severity, age },
          resultData: analysisResult,
        });
      }
    } catch (historyError) {
      console.error("Failed to save AI history:", historyError);
      // Don't fail the request if history save fails
    }

    
    return res.status(200).json({
      success: true,
      message: "Symptom analysis completed",
      data: analysisResult,
    });
  } catch (error) {
    console.error("Error in analyzeSymptoms:", error);

    // Check for Gemini API Service Unavailable (503)
    if (error.message && error.message.includes("503 Service Unavailable")) {
      return res.status(503).json({
        success: false,
        message: "AI service temporarily unavailable",
        error: "The Gemini API is experiencing high demand. Please try again in a few moments.",
      });
    }

    if (error.code === "TIMEOUT") {
      return res.status(504).json({
        success: false,
        message: "Gemini API request timeout",
        error: "The request took too long. Please try again later.",
      });
    }

    if (error.code === "INVALID_API_KEY") {
      return res.status(500).json({
        success: false,
        message: "AI service configuration error",
        error: "Invalid API key configuration",
      });
    }

    if (error.code === "RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        message: "Gemini API rate limit exceeded",
        error: "Please try again later",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to analyze symptoms",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * Recommend Specialist Handler
 * POST /api/ai/recommend-specialist
 */
const recommendSpecialist = async (req, res) => {
  try {
    // Validate input
    const validation = validateSpecialistInput(req);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { symptoms, conditions } = req.body;

    // Sanitize inputs
    const sanitizedSymptoms = sanitizeInput(symptoms);
    const sanitizedConditions = sanitizeInput(conditions || []);

    // Log request
    console.log(
      `Specialist recommendation requested by user: ${req.user?.id || "anonymous"}`,
    );

    // Build prompt
    const prompt = buildSpecialistRecommendationPrompt(
      sanitizedSymptoms,
      sanitizedConditions,
    );

    // Call Gemini API
    const response = await gemini.analyzeText(prompt);

    // Parse response
    let recommendationResult;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      recommendationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch (parseError) {
      recommendationResult = { raw: response };
    }

    const specialtyRecommendations =
      normalizeSpecialistRecommendations(recommendationResult);
    const doctorMatches = await enrichWithRegisteredDoctors(
      specialtyRecommendations,
    );

    const responsePayload = {
      ...recommendationResult,
      specialtyRecommendations,
      specialties: doctorMatches.specialties,
      suggestedDoctors: doctorMatches.suggestedDoctors,
      doctorCoverage: doctorMatches.doctorCoverage,
    };

    // Save to history
    try {
      if (req.user?.id) {
        await AiHistory.create({
          userId: req.user.id,
          type: "recommendation",
          inputData: { symptoms: sanitizedSymptoms, conditions: sanitizedConditions },
          resultData: responsePayload,
        });
      }
    } catch (historyError) {
      console.error("Failed to save AI history:", historyError);
    }

    return res.status(200).json({
      success: true,
      message: "Specialist recommendations generated",
      data: responsePayload,
    });
  } catch (error) {
    console.error("Error in recommendSpecialist:", error);

    // Check for Gemini API Service Unavailable (503)
    if (error.message && error.message.includes("503 Service Unavailable")) {
      return res.status(503).json({
        success: false,
        message: "AI service temporarily unavailable",
        error: "The Gemini API is experiencing high demand. Please try again in a few moments.",
      });
    }

    if (error.code === "TIMEOUT") {
      return res.status(504).json({
        success: false,
        message: "Gemini API request timeout",
        error: "The request took too long. Please try again later.",
      });
    }

    if (error.code === "INVALID_API_KEY") {
      return res.status(500).json({
        success: false,
        message: "AI service configuration error",
        error: "Invalid API key configuration",
      });
    }

    if (error.code === "RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        message: "Gemini API rate limit exceeded",
        error: "Please try again later",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate specialist recommendations",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * Get Health Insights Handler
 * POST /api/ai/health-insights
 */
const getHealthInsights = async (req, res) => {
  try {
    // Validate input
    const validation = validateHealthInsightsInput(req);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { symptoms, medicalHistory, age } = req.body;

    // Sanitize inputs
    const sanitizedSymptoms = sanitizeInput(symptoms);
    const sanitizedHistory = sanitizeInput(medicalHistory || "");

    // Log request
    console.log(
      `Health insights requested by user: ${req.user?.id || "anonymous"}`,
    );

    // Build prompt
    const prompt = buildHealthInsightsPrompt(
      sanitizedSymptoms,
      sanitizedHistory,
      age,
    );

    // Call Gemini API
    const response = await gemini.analyzeText(prompt);

    // Parse response
    let insightsResult;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      insightsResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch (parseError) {
      insightsResult = { raw: response };
    }

    // Save to history
    try {
      if (req.user?.id) {
        await AiHistory.create({
          userId: req.user.id,
          type: "insight",
          inputData: { symptoms: sanitizedSymptoms, age },
          resultData: insightsResult,
        });
      }
    } catch (historyError) {
      console.error("Failed to save AI history:", historyError);
    }

    return res.status(200).json({
      success: true,
      message: "Health insights generated",
      data: insightsResult,
    });
  } catch (error) {
    console.error("Error in getHealthInsights:", error);

    // Check for Gemini API Service Unavailable (503)
    if (error.message && error.message.includes("503 Service Unavailable")) {
      return res.status(503).json({
        success: false,
        message: "AI service temporarily unavailable",
        error: "The Gemini API is experiencing high demand. Please try again in a few moments.",
      });
    }

    if (error.code === "TIMEOUT") {
      return res.status(504).json({
        success: false,
        message: "Gemini API request timeout",
        error: "The request took too long. Please try again later.",
      });
    }

    if (error.code === "INVALID_API_KEY") {
      return res.status(500).json({
        success: false,
        message: "AI service configuration error",
        error: "Invalid API key configuration",
      });
    }

    if (error.code === "RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        message: "Gemini API rate limit exceeded",
        error: "Please try again later",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate health insights",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * Get AI History for user
 * GET /api/ai/history
 */
const getAiHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await AiHistory.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error in getAiHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI history",
    });
  }
};

/**
 * Delete AI History item
 * DELETE /api/ai/history/:id
 */
const deleteAiHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const historyItem = await AiHistory.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true },
      { new: true },
    );

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: "History item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "History item deleted",
    });
  } catch (error) {
    console.error("Error in deleteAiHistoryItem:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete history item",
    });
  }
};

module.exports = {
  analyzeSymptoms,
  recommendSpecialist,
  getHealthInsights,
  getAiHistory,
  deleteAiHistoryItem,
};
