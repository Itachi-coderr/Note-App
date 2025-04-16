import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://note-app-rosy-omega.vercel.app/api'}`, // Replace with your Vercel backend domain
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    } else if (error.response?.status === 404) {
      console.warn('Resource not found:', error.response.config.url);
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
};

export const notes = {
  getAll: () => api.get('/notes'),
  getById: (id) => api.get(`/notes/${id}`),
  create: (noteData) => api.post('/notes', noteData),
  update: (id, noteData) => api.put(`/notes/${id}`, noteData),
  delete: (id) => api.delete(`/notes/${id}`),
  share: (id, userData) => api.post(`/notes/${id}/share`, userData),
  getSharedUsers: (id) => api.get(`/notes/${id}/shared`),
};

export const upload = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;