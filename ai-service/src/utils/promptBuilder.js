/**
 * Build prompt for symptom analysis
 * @param {Array<string>} symptoms - List of symptoms
 * @param {string} duration - How long symptoms have been present (e.g., "3 days", "1 week")
 * @param {number} severity - Severity rating from 1-10
 * @param {number} age - Patient age
 * @param {string} medicalHistory - Optional medical history
 * @returns {string} - Formatted prompt for Gemini
 */
const buildSymptomAnalysisPrompt = (
  symptoms,
  duration,
  severity,
  age,
  medicalHistory = "",
  description = "",
) => {
  const symptomsList = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms;

  let prompt = `You are a medical AI assistant. Analyze the following patient symptoms and provide a structured response.

PATIENT INFORMATION:
- Age: ${age} years old
- Symptoms: ${symptomsList}
${description ? `- Patient's Description: ${description}` : ""}
- Duration: ${duration}
- Severity: ${severity}/10
${medicalHistory ? `- Medical History: ${medicalHistory}` : ""}

ANALYSIS TASK:
Analyze these symptoms and provide:
1. Possible conditions (list top 3-5 with confidence percentages)
2. Brief description of each condition
3. Red flags (if any, that warrant immediate attention)
4. General recommendations (no substitute for professional medical advice)

IMPORTANT: Always include this disclaimer: "This analysis is for educational purposes only and should not replace professional medical consultation."

Provide your response in the following JSON format:
{
  "disclaimer": "This analysis is for educational purposes only and should not replace professional medical consultation.",
  "possibleConditions": [
    {
      "condition": "condition name",
      "confidence": 85,
      "description": "brief description"
    }
  ],
  "redFlags": ["flag1", "flag2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

  return prompt;
};

/**
 * Build prompt for specialist recommendation
 * @param {Array<string>} symptoms - List of symptoms
 * @param {Array<string>} conditions - Optional list of conditions from analysis
 * @returns {string} - Formatted prompt for Gemini
 */
const buildSpecialistRecommendationPrompt = (symptoms, conditions = []) => {
  const symptomsList = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms;
  const conditionsList =
    conditions.length > 0 ? conditions.join(", ") : "Not provided";

  let prompt = `You are a medical AI assistant specializing in specialist recommendations.

PATIENT CASE:
- Symptoms: ${symptomsList}
- Identified Conditions: ${conditionsList}

RECOMMENDATION TASK:
Based on the symptoms and conditions, recommend the most relevant medical specialties that would be helpful.

For each specialty, provide:
1. Specialty name
2. Reason why it's relevant
3. Priority level (High/Medium/Low)

Provide your response in the following JSON format:
{
  "disclaimer": "This is an AI-generated recommendation for informational purposes. Final specialty recommendations should be made by healthcare professionals.",
  "specialtyRecommendations": [
    {
      "specialty": "specialty name",
      "reason": "explanation of why relevant",
      "priority": "High|Medium|Low"
    }
  ]
}

Recommend 3-5 most relevant specialties.`;

  return prompt;
};

/**
 * Build prompt for health insights
 * @param {Array<string>} symptoms - List of symptoms
 * @param {string} medicalHistory - Medical history
 * @param {number} age - Patient age
 * @returns {string} - Formatted prompt for Gemini
 */
const buildHealthInsightsPrompt = (symptoms, medicalHistory, age) => {
  const symptomsList = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms;

  let prompt = `You are a health and wellness AI advisor.

PATIENT PROFILE:
- Age: ${age}
- Current Symptoms: ${symptomsList}
- Medical History: ${medicalHistory || "Not provided"}

INSIGHTS TASK:
Provide general wellness advice, preventive measures, and lifestyle tips relevant to the patient's current symptoms and age group.

Include:
1. Lifestyle modifications
2. Dietary recommendations
3. Exercise suggestions
4. Preventive measures
5. When to seek professional help

Provide your response in the following JSON format:
{
  "disclaimer": "This wellness advice is for informational purposes. Consult healthcare professionals for personalized medical advice.",
  "lifestyleModifications": ["tip1", "tip2"],
  "dietaryRecommendations": ["recommendation1", "recommendation2"],
  "exerciseSuggestions": ["suggestion1", "suggestion2"],
  "preventiveMeasures": ["measure1", "measure2"],
  "whenToSeekHelp": "description of warning signs"
}`;

  return prompt;
};

module.exports = {
  buildSymptomAnalysisPrompt,
  buildSpecialistRecommendationPrompt,
  buildHealthInsightsPrompt,
};
