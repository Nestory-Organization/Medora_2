const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("./env");

// Initialize Google Generative AI client
let client = null;

const getGeminiClient = () => {
  if (!client) {
    try {
      if (!env.geminiApiKey) {
        throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
      }
      client = new GoogleGenerativeAI(env.geminiApiKey);
    } catch (error) {
      console.error("Failed to initialize Gemini client:", error.message);
      throw error;
    }
  }
  return client;
};

/**
 * Call Gemini API with a given prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The response from Gemini
 * @throws {Error} - If API call fails or timeout occurs
 */
const analyzeText = async (prompt) => {
  try {
    const client = getGeminiClient();
    const modelCandidates = [
      env.geminiModel,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = client.getGenerativeModel({ model: modelName });

        // Create a promise that rejects after 30 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini API request timeout (30s)")),
            30000,
          ),
        );

        // Race between the API call and timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise,
        ]);

        if (!result.response.text()) {
          throw new Error("Empty response from Gemini API");
        }

        return result.response.text();
      } catch (modelError) {
        const msg = modelError?.message || "";
        const modelMissing =
          msg.includes("models/") && msg.includes("not found");

        if (!modelMissing) {
          throw modelError;
        }

        console.warn(`Gemini model unavailable: ${modelName}`);
        lastError = modelError;
      }
    }

    throw lastError || new Error("No available Gemini model found");
  } catch (error) {
    if (error.message.includes("timeout")) {
      throw {
        code: "TIMEOUT",
        message: "Gemini API request timeout",
        originalError: error.message,
      };
    }

    if (error.message.includes("API key")) {
      throw {
        code: "INVALID_API_KEY",
        message: "Invalid or missing Gemini API key",
        originalError: error.message,
      };
    }

    if (error.message.includes("429") || error.message.includes("quota")) {
      throw {
        code: "RATE_LIMIT",
        message: "Gemini API rate limit exceeded",
        originalError: error.message,
      };
    }

    if (
      error.message.includes("models/") &&
      error.message.includes("not found")
    ) {
      throw {
        code: "MODEL_NOT_FOUND",
        message: "Configured Gemini model is not available",
        originalError: error.message,
      };
    }

    throw {
      code: "API_ERROR",
      message: "Gemini API error",
      originalError: error.message,
    };
  }
};

module.exports = {
  getGeminiClient,
  analyzeText,
};
