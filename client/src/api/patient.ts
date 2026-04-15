import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // API Gateway or Patient Service port

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

export const getPatientProfile = () => patientApi.get('/patients/profile');
export const updatePatientProfile = (data: any) => patientApi.put('/patients/profile', data);
export const uploadMedicalReport = (formData: FormData) => 
  patientApi.post('/patients/upload-report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getMedicalHistory = () => patientApi.get('/patients/history');
export const addMedicalHistory = (data: any) => patientApi.post('/patients/history', data);
export const getPrescriptions = () => patientApi.get('/patients/prescriptions');
export const getMyAppointments = () => patientApi.get('/appointments/my-appointments');
export const cancelAppointment = (id: string) => patientApi.put(`/appointments/cancel/${id}`);

export default patientApi;
