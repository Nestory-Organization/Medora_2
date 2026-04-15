const gemini = require("../config/gemini");
const {
  buildSymptomAnalysisPrompt,
  buildSpecialistRecommendationPrompt,
  buildHealthInsightsPrompt,
} = require("../utils/promptBuilder");

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

    return res.status(200).json({
      success: true,
      message: "Symptom analysis completed",
      data: analysisResult,
    });
  } catch (error) {
    console.error("Error in analyzeSymptoms:", error);

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
      return res.status(500).json({
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
      recommendationResult = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { raw: response };
    } catch (parseError) {
      recommendationResult = { raw: response };
    }

    return res.status(200).json({
      success: true,
      message: "Specialist recommendations generated",
      data: recommendationResult,
    });
  } catch (error) {
    console.error("Error in recommendSpecialist:", error);

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
      return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: "Health insights generated",
      data: insightsResult,
    });
  } catch (error) {
    console.error("Error in getHealthInsights:", error);

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
      return res.status(500).json({
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

module.exports = {
  analyzeSymptoms,
  recommendSpecialist,
  getHealthInsights,
};
