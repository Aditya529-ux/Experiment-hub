import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://experiment-hub1.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) => api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Experiments
export const experimentsAPI = {
  list: (params?: any) => api.get('/experiments', { params }),
  get: (id: string) => api.get(`/experiments/${id}`),
  create: (data: any) => api.post('/experiments', data),
  update: (id: string, data: any) => api.put(`/experiments/${id}`, data),
  delete: (id: string) => api.delete(`/experiments/${id}`),
  timeline: () => api.get('/experiments/timeline'),
  versions: (id: string) => api.get(`/experiments/${id}/versions`),
  share: (id: string) => api.post(`/experiments/${id}/share`),
  exportData: (data: any) => api.post('/experiments/export', data),
};

// Projects
export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Comments
export const commentsAPI = {
  list: (experimentId: string) => api.get(`/comments/${experimentId}`),
  create: (experimentId: string, data: any) => api.post(`/comments/${experimentId}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// AI
export const aiAPI = {
  summarize: (data: any) => api.post('/ai/summarize', data),
  chat: (data: any) => api.post('/ai/chat', data),
  patterns: () => api.post('/ai/patterns'),
};

// Analytics
export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

// Search
export const searchAPI = {
  search: (params: any) => api.get('/search', { params }),
};

export default api;
