import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const patientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUserId = (user: any) => user?.id || user?._id || user?.userId || null;

export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const getStoredUserId = () => getUserId(getStoredUser());

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
    // Check for authorization errors - ONLY logout on 401 Unauthorized
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
    } else if (error.response?.status === 400) {
      // 400 Bad Request - likely missing patient ID
      console.warn('Bad request:', error.response.data?.message);
      error.message = error.response.data?.message || 'Invalid request parameters.';
    } else if (error.response?.status === 404) {
      // 404 Not Found - endpoint doesn't exist
      console.error('Endpoint not found:', error.config?.url);
      error.message = 'The requested resource was not found.';
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
  const payload = response.data?.data ?? response.data ?? {};
  return payload.patient ?? payload;
};

export const updatePatientProfile = async (data: any) => {
    const response = await patientApi.put('/patients/profile', data);
  const payload = response.data?.data ?? response.data ?? {};
  return payload.patient ?? payload;
};

export const registerPatientProfile = async (data: {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) => {
  const response = await patientApi.post('/patients/register', data);
  return response.data?.data?.patient ?? response.data;
};

// Medical History & Uploads
export const getMedicalHistory = async () => {
    const response = await patientApi.get('/patients/history');
  const payload = response.data?.data ?? response.data ?? {};
  return payload.history ?? [];
};

export const addMedicalHistory = async (data: any) => {
    const response = await patientApi.post('/patients/history', data);
  return response.data?.data?.history ?? response.data;
};

export const uploadMedicalReport = async (formData: FormData) => {
    const response = await patientApi.post('/patients/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  return response.data?.data?.document ?? response.data;
};

export const getMedicalDocuments = async () => {
  const response = await patientApi.get('/patients/documents');
  const payload = response.data?.data ?? response.data ?? {};
  return payload.documents ?? [];
};

export const deleteMedicalDocument = async (docId: string) => {
  const response = await patientApi.delete(`/patients/documents/${docId}`);
  return response.data;
};

// Prescriptions & Appointments
export const getPrescriptions = async () => {
    const response = await patientApi.get('/patients/prescriptions');
  const payload = response.data?.data ?? response.data ?? {};
  return (payload.prescriptions ?? []).map((item: any) => ({
    ...item,
    medicines: item.medicines || item.medications || [],
    date: item.date || item.prescriptionDate,
    doctorName: item.doctorName || item?.doctor?.name || 'Unknown Doctor'
  }));
};

export const getMyAppointments = async () => {
    // Get patientId from stored user object
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const patientId = user?._id;
    
    if (!patientId) {
        throw new Error('Patient ID not found. Please login again.');
    }
    
    const response = await patientApi.get('/appointments/my-appointments', {
        params: { patientId }
    });
    return response.data;
};

export const bookAppointment = async (appointmentData: any) => {
    const response = await patientApi.post('/appointments', appointmentData);
    return response.data;
};

export const searchDoctors = async (specialty: string, date?: string) => {
    const response = await patientApi.get('/appointments/doctors/search', {
        params: { specialty, ...(date && { date }) }
    });
    return response.data;
};

export const cancelAppointment = async (id: string) => {
    const response = await patientApi.delete(`/appointments/${id}`);
    return response.data;
};

export default patientApi;
