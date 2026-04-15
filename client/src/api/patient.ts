import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const patientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
patientApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for unified error handling
patientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for authorization errors
    if (error.response?.status === 401) {
      console.warn('Unauthorized access, redirecting to login...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Force login redirect
    }
    
    // Check for network errors or service unavailability (502/503)
    if (!error.response) {
      console.error('Network error or server unreachable');
      error.message = 'The server is currently unreachable. Please check your connection.';
    } else if ([502, 503, 504].includes(error.response.status)) {
      error.message = 'The service is temporarily unavailable. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Patient API Endpoints
 */

// Profile & Personal Info
export const getPatientProfile = async () => {
    const response = await patientApi.get('/patients/profile');
    return response.data;
};

export const updatePatientProfile = async (data: any) => {
    const response = await patientApi.put('/patients/profile', data);
    return response.data;
};

// Medical History & Uploads
export const getMedicalHistory = async () => {
    const response = await patientApi.get('/patients/history');
    return response.data;
};

export const addMedicalHistory = async (data: any) => {
    const response = await patientApi.post('/patients/history', data);
    return response.data;
};

export const uploadMedicalReport = async (formData: FormData) => {
    const response = await patientApi.post('/patients/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Prescriptions & Appointments
export const getPrescriptions = async () => {
    const response = await patientApi.get('/patients/prescriptions');
    return response.data;
};

export const getMyAppointments = async () => {
    const response = await patientApi.get('/appointments/my-appointments');
    return response.data;
};

export const cancelAppointment = async (id: string) => {
    const response = await patientApi.put(`/appointments/cancel/${id}`);
    return response.data;
};

export default patientApi;
