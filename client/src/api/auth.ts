import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/auth'; // Adjust based on your auth-service port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const login = async (credentials: any) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export default api;
