import axios, { AxiosError } from 'axios';

// The API Gateway URL from environment variable
const API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:4000/api/ai'; 

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type UiCondition = {
  name: string;
  probability: number;
};

type UiInsight = {
  tip: string;
  category: string;
};

type UiSuggestedDoctor = {
  doctorId: string;
  name: string;
  specialization: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  qualification?: string;
  clinicAddress?: string;
  reason?: string;
  priority?: string;
  matchedSpecialties?: string[];
};

type UiSpecialist = {
  name: string;
  reason: string;
  priority?: string;
  matchedDoctors?: UiSuggestedDoctor[];
  externalSearchUrl?: string; // Added for web fallback
};

export type AiHistoryItem = {
  _id: string;
  type: 'analysis' | 'recommendation' | 'insight';
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const clampPercentage = (value: unknown) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const inferSeverityFromScore = (severity: number): 'Low' | 'Medium' | 'High' => {
  if (severity <= 3) return 'Low';
  if (severity <= 7) return 'Medium';
  return 'High';
};

const normalizeConditions = (payload: any): UiCondition[] => {
  if (Array.isArray(payload?.conditions)) {
    return payload.conditions.map((item: any) => ({
      name: String(item?.name ?? 'Unknown Condition'),
      probability: clampPercentage(item?.probability),
    }));
  }

  if (Array.isArray(payload?.possibleConditions)) {
    return payload.possibleConditions.map((item: any) => ({
      name: String(item?.condition ?? item?.name ?? 'Unknown Condition'),
      probability: clampPercentage(item?.confidence ?? item?.probability),
    }));
  }

  return [];
};

const normalizeInsights = (payload: any): UiInsight[] => {
  if (Array.isArray(payload?.insights)) {
    return payload.insights.map((item: any) => ({
      tip: String(item?.tip ?? ''),
      category: String(item?.category ?? 'General'),
    }));
  }

  const buckets: Array<[string, any[]]> = [
    ['Lifestyle', payload?.lifestyleModifications],
    ['Diet', payload?.dietaryRecommendations],
    ['Exercise', payload?.exerciseSuggestions],
    ['Prevention', payload?.preventiveMeasures],
  ];

  const mapped = buckets.flatMap(([category, list]) =>
    Array.isArray(list)
      ? list.map((tip) => ({ tip: String(tip ?? ''), category }))
      : [],
  );

  if (payload?.whenToSeekHelp) {
    mapped.push({
      tip: String(payload.whenToSeekHelp),
      category: 'Warning Signs',
    });
  }

  return mapped;
};

// Add a request interceptor to include the auth token
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const analyzeSymptoms = async (data: {
  symptoms: string[];
  description?: string;
  duration: string;
  severity: number;
  age: number;
  medicalHistory: string;
}) => {
  try {
    const response = await aiApi.post('/analyze-symptoms', data);
    const payload = response.data?.data ?? response.data ?? {};
    const conditions = normalizeConditions(payload);

    const normalizedData = {
      ...payload,
      symptoms: data.symptoms,
      description: data.description,
      age: data.age,
      medicalHistory: data.medicalHistory,
      conditions,
      severityLevel:
        payload?.severityLevel ?? inferSeverityFromScore(Number(data.severity || 0)),
      advice:
        payload?.advice ??
        payload?.summary ??
        (Array.isArray(payload?.recommendations) ? payload.recommendations[0] : '') ??
        '',
      redFlags: Array.isArray(payload?.redFlags) ? payload.redFlags : [],
      recommendations: Array.isArray(payload?.recommendations) ? payload.recommendations : [],
      possibleConditions: conditions, // Add this for consistency in history
    };

    return {
      ...response.data,
      data: normalizedData,
    };
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const getAiHistory = async () => {
  try {
    const response = await aiApi.get('/history');
    return {
      ...response.data,
      data: Array.isArray(response.data?.data) ? (response.data.data as AiHistoryItem[]) : [],
    };
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const deleteAiHistoryItem = async (id: string) => {
  try {
    const response = await aiApi.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const recommendSpecialist = async (data: { symptoms: string[]; conditions?: string[]; analysisHistoryId?: string }) => {
  try {
    const response = await aiApi.post('/recommend-specialist', data);
    const payload = response.data?.data ?? response.data ?? {};

    const specialists: UiSpecialist[] = Array.isArray(payload?.specialties)
      ? payload.specialties.map((item: any) => ({
          name: String(item?.specialty ?? 'Specialist'),
          reason: String(item?.reason ?? ''),
          priority: item?.priority,
          externalSearchUrl: item?.externalSearchUrl, // Added
          matchedDoctors: Array.isArray(item?.matchedDoctors)
            ? item.matchedDoctors.map((doctor: any) => ({
                doctorId: String(doctor?.doctorId ?? ''),
                name: String(doctor?.name ?? 'Unknown Doctor'),
                specialization: String(doctor?.specialization ?? item?.specialty ?? ''),
                yearsOfExperience: doctor?.yearsOfExperience,
                consultationFee: doctor?.consultationFee,
                qualification: doctor?.qualification,
                clinicAddress: doctor?.clinicAddress,
                reason: doctor?.reason,
                priority: doctor?.priority,
              }))
            : [],
        }))
      : Array.isArray(payload?.specialtyRecommendations)
        ? payload.specialtyRecommendations.map((item: any) => ({
            name: String(item?.specialty ?? 'Specialist'),
            reason: String(item?.reason ?? ''),
            priority: item?.priority,
            matchedDoctors: [],
          }))
        : Array.isArray(payload?.specialists)
          ? payload.specialists.map((item: any) => ({
              name: String(item?.name ?? item?.specialty ?? 'Specialist'),
              reason: String(item?.reason ?? ''),
              priority: item?.priority,
              matchedDoctors: [],
            }))
          : [];

    const suggestedDoctors: UiSuggestedDoctor[] = Array.isArray(payload?.suggestedDoctors)
      ? payload.suggestedDoctors.map((doctor: any) => ({
          doctorId: String(doctor?.doctorId ?? ''),
          name: String(doctor?.name ?? 'Unknown Doctor'),
          specialization: String(doctor?.specialization ?? ''),
          yearsOfExperience: doctor?.yearsOfExperience,
          consultationFee: doctor?.consultationFee,
          qualification: doctor?.qualification,
          clinicAddress: doctor?.clinicAddress,
          reason: doctor?.reason,
          priority: doctor?.priority,
          matchedSpecialties: Array.isArray(doctor?.matchedSpecialties)
            ? doctor.matchedSpecialties.map((specialty: any) => String(specialty))
            : [],
        }))
      : specialists.flatMap((specialist) => specialist.matchedDoctors || []);

    return {
      ...response.data,
      data: {
        ...payload,
        specialists,
        suggestedDoctors,
        doctorCoverage: payload?.doctorCoverage,
      },
    };
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const getHealthInsights = async (data: { symptoms: string[]; medicalHistory?: string; age?: number; analysisHistoryId?: string }) => {
  try {
    const response = await aiApi.post('/health-insights', data);
    const payload = response.data?.data ?? response.data ?? {};

    return {
      ...response.data,
      data: {
        ...payload,
        insights: normalizeInsights(payload),
      },
    };
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

// Error handling helper
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;
    let message = 'An unexpected error occurred.';

    if (status === 400) {
      message = data.message || 'Validation error. Please check your inputs.';
    } else if (status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      message = 'Your session has expired or is invalid. Please log in again.';
    } else if (status === 503) {
      message = data.message || 'AI service temporarily unavailable. Please try again later.';
    } else if (status === 504) {
      message = 'Request timeout. Please try again.';
    } else if (status === 429) {
      message = 'Too many requests. Please try again later.';
    } else if (status >= 500) {
      message = data.message || 'Server error. Please try again later.';
    } else {
      message = data.message || 'An unexpected error occurred.';
    }

    // Create error with response attached for frontend error handling
    const err = new Error(message) as any;
    err.response = error.response;
    return err;
  }
  const err = new Error('Network error. Please check your connection.') as any;
  err.response = error.response;
  return err;
};

export default aiApi;

