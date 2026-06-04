import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/doctors';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Appointment {
  _id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  specialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  qualification: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio?: string;
  clinicAddress?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

export interface RescheduleRequestAppointment {
  _id: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  specialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  rescheduleRequest?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    reason?: string;
    createdAt?: string;
    rejectionReason?: string;
  };
}

// Get doctor's assigned appointments
export const getAppointments = async (status?: string) => {
  const params = status ? { status } : {};
  const response = await api.get('/appointments', { params });
  return response.data;
};

// Get appointments for a specific date
export const getAppointmentsByDate = async (date: string) => {
  const response = await api.get('/appointments', {
    params: { date },
  });
  return response.data;
};

// Get doctor profile
export const getDoctorProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

// Get doctor profile by public ID
export const getDoctorProfileById = async (doctorId: string) => {
  const response = await api.get(`/profile/${doctorId}`);
  return response.data;
};

// Update doctor profile
export const updateDoctorProfile = async (data: Partial<DoctorProfile>) => {
  const response = await api.put('/profile', data);
  return response.data;
};

// Set availability
export const setAvailability = async (data: any) => {
  const response = await api.post('/availability', data);
  return response.data;
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const response = await axios.put(
    `http://localhost:4000/api/appointments/${appointmentId}/doctor-status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Add prescription
export const addPrescription = async (appointmentId: string, prescription: any) => {
  const response = await api.post(`/appointment/${appointmentId}/prescription`, prescription);
  return response.data;
};

// Get prescription
export const getPrescription = async (appointmentId: string) => {
  const response = await api.get(`/appointment/${appointmentId}/prescription`);
  return response.data;
};

export const getRescheduleRequests = async (doctorId: string) => {
  const response = await api.get(`/reschedule-requests/${doctorId}`);
  return response.data;
};

export const approveRescheduleRequest = async (appointmentId: string) => {
  const response = await api.put(`/appointment/${appointmentId}/reschedule-request/approve`);
  return response.data;
};

export const rejectRescheduleRequest = async (appointmentId: string, rejectionReason?: string) => {
  const response = await api.put(`/appointment/${appointmentId}/reschedule-request/reject`, {
    rejectionReason
  });
  return response.data;
};

export default api;
