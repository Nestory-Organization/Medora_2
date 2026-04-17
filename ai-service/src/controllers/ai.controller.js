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

const isGeminiServiceUnavailable = (error) => {
  const message = String(error?.message || "");
  const originalError = String(error?.originalError || "");
  return (
    message.includes("503 Service Unavailable") ||
    originalError.includes("503 Service Unavailable") ||
    originalError.includes("high demand")
  );
};

const buildFallbackSymptomAnalysis = (symptoms = [], severity = 5) => {
  const severityNum = Number(severity);
  const severityLevel =
    severityNum <= 3 ? "Low" : severityNum <= 7 ? "Medium" : "High";
  const symptomList = Array.isArray(symptoms)
    ? symptoms.map((s) => String(s).toLowerCase())
    : [];

  const likelyConditions = [];
  if (symptomList.includes("fever") || symptomList.includes("cough")) {
    likelyConditions.push({
      name: "Viral Respiratory Infection",
      probability: 60,
    });
  }
  if (symptomList.includes("headache") || symptomList.includes("fatigue")) {
    likelyConditions.push({
      name: "General Fatigue / Tension Related",
      probability: 55,
    });
  }
  if (likelyConditions.length === 0) {
    likelyConditions.push({
      name: "Non-specific Symptom Pattern",
      probability: 50,
    });
  }

  const redFlags = [
    "Severe chest pain",
    "Shortness of breath",
    "Persistent high fever",
    "Confusion or drowsiness",
  ];

  return {
    disclaimer:
      "This fallback analysis is informational only and does not replace professional medical diagnosis.",
    conditions: likelyConditions,
    severityLevel,
    advice:
      "Monitor symptoms, stay hydrated, and seek clinical assessment if symptoms worsen or persist.",
    redFlags,
    recommendations: [
      "Rest and maintain hydration.",
      "Track symptoms every 6-8 hours.",
      "Consult a doctor if no improvement within 24-48 hours.",
    ],
    fallback: true,
  };
};

const buildFallbackSpecialistRecommendations = (symptoms = []) => {
  const symptomList = Array.isArray(symptoms)
    ? symptoms.map((s) => String(s).toLowerCase())
    : [];
  const recommendations = [];

  if (
    symptomList.some((s) =>
      ["chest pain", "palpitation", "shortness of breath"].includes(s),
    )
  ) {
    recommendations.push({
      specialty: "Cardiology",
      reason: "Cardiac-related symptoms may require cardiovascular evaluation.",
      priority: "High",
    });
  }

  if (
    symptomList.some((s) => ["headache", "dizziness", "seizure"].includes(s))
  ) {
    recommendations.push({
      specialty: "Neurology",
      reason: "Neurological symptoms benefit from specialist review.",
      priority: "Medium",
    });
  }

  if (symptomList.some((s) => ["cough", "fever", "sore throat"].includes(s))) {
    recommendations.push({
      specialty: "General Physician",
      reason: "General symptoms should be assessed by a primary care doctor.",
      priority: "Medium",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      specialty: "General Physician",
      reason: "A primary evaluation is recommended for non-specific symptoms.",
      priority: "Medium",
    });
  }

  return recommendations;
};

const attachAiResponse = (resultData, aiResponseText) => ({
  ...(resultData || {}),
  aiResponse:
    typeof aiResponseText === "string"
      ? aiResponseText
      : JSON.stringify(aiResponseText || {}),
});

const buildFallbackHealthInsights = (
  symptoms = [],
  medicalHistory = "",
  age,
) => {
  const symptomList = Array.isArray(symptoms)
    ? symptoms.map((s) => String(s).toLowerCase())
    : [];

  const lifestyleModifications = [
    "Maintain a regular sleep schedule with 7-8 hours of rest.",
    "Stay hydrated throughout the day and monitor symptom changes.",
  ];

  const dietaryRecommendations = [
    "Choose balanced meals with vegetables, fruits, and lean proteins.",
    "Limit highly processed foods and excess sugar while recovering.",
  ];

  const exerciseSuggestions = [
    "Prefer light activity such as short walks unless symptoms worsen.",
    "Avoid intense exercise until symptoms improve.",
  ];

  const preventiveMeasures = [
    "Track symptom progression and seek medical review if symptoms persist.",
    "Wash hands frequently and follow general infection prevention practices.",
  ];

  if (symptomList.includes("fever") || symptomList.includes("cough")) {
    preventiveMeasures.push(
      "Use a mask in crowded areas and monitor body temperature daily.",
    );
  }

  if (Number(age) >= 60) {
    preventiveMeasures.push(
      "Given your age, seek early clinical evaluation for persistent symptoms.",
    );
  }

  if (medicalHistory) {
    preventiveMeasures.push(
      "Consider your prior medical history and follow your clinician's ongoing treatment guidance.",
    );
  }

  return {
    disclaimer:
      "These recommendations are generated from a fallback health rules engine and do not replace professional medical advice.",
    lifestyleModifications,
    dietaryRecommendations,
    exerciseSuggestions,
    preventiveMeasures,
    whenToSeekHelp:
      "Seek urgent care if you have chest pain, breathing difficulty, persistent high fever, confusion, dehydration, or rapidly worsening symptoms.",
    fallback: true,
  };
};

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
  const { symptoms, conditions, analysisHistoryId } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return {
      valid: false,
      message: "Symptoms array is required and must not be empty",
    };
  }

  if (conditions && !Array.isArray(conditions)) {
    return { valid: false, message: "Conditions must be an array if provided" };
  }

  if (analysisHistoryId && typeof analysisHistoryId !== "string") {
    return {
      valid: false,
      message: "analysisHistoryId must be a string if provided",
    };
  }

  return { valid: true };
};

/**
 * Validate input for health insights
 */
const validateHealthInsightsInput = (req) => {
  const { symptoms, medicalHistory, age, analysisHistoryId } = req.body;

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

  if (analysisHistoryId && typeof analysisHistoryId !== "string") {
    return {
      valid: false,
      message: "analysisHistoryId must be a string if provided",
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

    const { symptoms, description, duration, severity, age, medicalHistory } =
      req.body;

    // Sanitize inputs
    const sanitizedSymptoms = sanitizeInput(symptoms);
    const sanitizedDescription = sanitizeInput(description || "");
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
      sanitizedDescription,
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
    let analysisHistoryId = null;

    // Save to history
    try {
      if (req.user?.id) {
        const historyEntry = await AiHistory.create({
          userId: req.user.id,
          type: "analysis",
          inputData: {
            symptoms: sanitizedSymptoms,
            description: sanitizedDescription,
            duration: sanitizedDuration,
            severity,
            age,
          },
          resultData: attachAiResponse(
            {
              ...analysisResult,
              recommendedDoctors: [],
              wellnessProtocol: null,
            },
            response,
          ),
        });
        analysisHistoryId = historyEntry?._id?.toString() || null;
      }
    } catch (historyError) {
      console.error("Failed to save AI history:", historyError);
      // Don't fail the request if history save fails
    }

    return res.status(200).json({
      success: true,
      message: "Symptom analysis completed",
      data: analysisResult,
      analysisHistoryId,
    });
  } catch (error) {
    console.error("Error in analyzeSymptoms:", error);

    const shouldUseFallback =
      isGeminiServiceUnavailable(error) ||
      error.code === "TIMEOUT" ||
      error.code === "RATE_LIMIT";

    if (shouldUseFallback) {
      const { symptoms, duration, severity, age } = req.body;
      const fallbackData = buildFallbackSymptomAnalysis(
        sanitizeInput(symptoms || []),
        severity,
      );

      let analysisHistoryId = null;

      try {
        if (req.user?.id) {
          const historyEntry = await AiHistory.create({
            userId: req.user.id,
            type: "analysis",
            inputData: {
              symptoms: sanitizeInput(symptoms || []),
              duration: sanitizeInput(duration || ""),
              severity,
              age,
            },
            resultData: attachAiResponse(
              {
                ...fallbackData,
                recommendedDoctors: [],
                wellnessProtocol: null,
              },
              "Fallback analysis response used due to temporary AI service unavailability.",
            ),
          });
          analysisHistoryId = historyEntry?._id?.toString() || null;
        }
      } catch (historyError) {
        console.error("Failed to save fallback AI history:", historyError);
      }

      return res.status(200).json({
        success: true,
        message:
          "Symptom analysis generated using fallback guidance due to temporary AI service unavailability.",
        data: fallbackData,
        analysisHistoryId,
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

    const { symptoms, conditions, analysisHistoryId } = req.body;

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

    // Save recommendation history and also enrich original analysis history if provided
    try {
      if (req.user?.id) {
        await AiHistory.create({
          userId: req.user.id,
          type: "recommendation",
          inputData: {
            symptoms: sanitizedSymptoms,
            conditions: sanitizedConditions,
          },
          resultData: attachAiResponse(responsePayload, response),
        });

        if (analysisHistoryId) {
          await AiHistory.findOneAndUpdate(
            {
              _id: analysisHistoryId,
              userId: req.user.id,
              type: "analysis",
              isDeleted: false,
            },
            {
              $set: {
                "resultData.recommendedDoctors": doctorMatches.suggestedDoctors,
                "resultData.specialistRecommendations":
                  specialtyRecommendations,
              },
            },
          );
        }
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

    const shouldUseFallback =
      isGeminiServiceUnavailable(error) ||
      error.code === "TIMEOUT" ||
      error.code === "RATE_LIMIT";

    if (shouldUseFallback) {
      const { symptoms, conditions, analysisHistoryId } = req.body;
      const sanitizedSymptoms = sanitizeInput(symptoms || []);
      const sanitizedConditions = sanitizeInput(conditions || []);
      const specialtyRecommendations =
        buildFallbackSpecialistRecommendations(sanitizedSymptoms);
      const doctorMatches = await enrichWithRegisteredDoctors(
        specialtyRecommendations,
      );

      const fallbackPayload = {
        fallback: true,
        specialtyRecommendations,
        specialties: doctorMatches.specialties,
        suggestedDoctors: doctorMatches.suggestedDoctors,
        doctorCoverage: doctorMatches.doctorCoverage,
      };

      try {
        if (req.user?.id) {
          await AiHistory.create({
            userId: req.user.id,
            type: "recommendation",
            inputData: {
              symptoms: sanitizedSymptoms,
              conditions: sanitizedConditions,
            },
            resultData: attachAiResponse(
              fallbackPayload,
              "Fallback specialist recommendation used due to temporary AI service unavailability.",
            ),
          });

          if (analysisHistoryId) {
            await AiHistory.findOneAndUpdate(
              {
                _id: analysisHistoryId,
                userId: req.user.id,
                type: "analysis",
                isDeleted: false,
              },
              {
                $set: {
                  "resultData.recommendedDoctors":
                    doctorMatches.suggestedDoctors,
                  "resultData.specialistRecommendations":
                    specialtyRecommendations,
                },
              },
            );
          }
        }
      } catch (historyError) {
        console.error("Failed to save fallback AI history:", historyError);
      }

      return res.status(200).json({
        success: true,
        message:
          "Specialist recommendations generated using fallback guidance due to temporary AI service unavailability.",
        data: fallbackPayload,
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

    const { symptoms, medicalHistory, age, analysisHistoryId } = req.body;

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

    // Save insight history and also attach wellness protocol to original analysis history if provided
    try {
      if (req.user?.id) {
        await AiHistory.create({
          userId: req.user.id,
          type: "insight",
          inputData: { symptoms: sanitizedSymptoms, age },
          resultData: attachAiResponse(insightsResult, response),
        });

        if (analysisHistoryId) {
          await AiHistory.findOneAndUpdate(
            {
              _id: analysisHistoryId,
              userId: req.user.id,
              type: "analysis",
              isDeleted: false,
            },
            {
              $set: {
                "resultData.wellnessProtocol": insightsResult,
              },
            },
          );
        }
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

    const shouldUseFallback =
      isGeminiServiceUnavailable(error) ||
      error.code === "TIMEOUT" ||
      error.code === "RATE_LIMIT";

    if (shouldUseFallback) {
      const { symptoms, medicalHistory, age, analysisHistoryId } = req.body;
      const fallbackData = buildFallbackHealthInsights(
        sanitizeInput(symptoms || []),
        sanitizeInput(medicalHistory || ""),
        age,
      );

      // Save fallback result to history as well
      try {
        if (req.user?.id) {
          await AiHistory.create({
            userId: req.user.id,
            type: "insight",
            inputData: { symptoms: sanitizeInput(symptoms || []), age },
            resultData: attachAiResponse(
              fallbackData,
              "Fallback health insights used due to temporary AI service unavailability.",
            ),
          });

          if (analysisHistoryId) {
            await AiHistory.findOneAndUpdate(
              {
                _id: analysisHistoryId,
                userId: req.user.id,
                type: "analysis",
                isDeleted: false,
              },
              {
                $set: {
                  "resultData.wellnessProtocol": fallbackData,
                },
              },
            );
          }
        }
      } catch (historyError) {
        console.error("Failed to save fallback AI history:", historyError);
      }

      return res.status(200).json({
        success: true,
        message:
          "Health insights generated using fallback guidance due to temporary AI service unavailability.",
        data: fallbackData,
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
