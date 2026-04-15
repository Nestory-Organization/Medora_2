import axios, { AxiosError } from 'axios';

// The API Gateway URL from environment variable
const API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:4000/api/ai'; 

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
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
  duration: string;
  severity: number;
  age: number;
  medicalHistory: string;
}) => {
  try {
    const response = await aiApi.post('/analyze-symptoms', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const recommendSpecialist = async (data: { symptoms: string[] }) => {
  try {
    const response = await aiApi.post('/recommend-specialist', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const getHealthInsights = async (data: { symptoms: string[] }) => {
  try {
    const response = await aiApi.post('/health-insights', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

// Error handling helper
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    if (status === 400) {
      return new Error(data.message || 'Validation error. Please check your inputs.');
    }
    if (status === 429) {
      return new Error('Too many requests. Please try again later.');
    }
    if (status >= 500) {
      return new Error('AI service unavailable. Please try again later.');
    }
    return new Error(data.message || 'An unexpected error occurred.');
  }
  return new Error('Network error. Please check your connection.');
};

export default aiApi;

