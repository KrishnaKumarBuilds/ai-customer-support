import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data)
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const ticketApi = {
  getAll: (params?: any) => api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  updateStatus: (id: string, status: string) => api.put(`/tickets/${id}`, { status }),
  assign: (id: string, agentId: string) => api.put(`/tickets/${id}/assign`, { agentId }),
  addNote: (id: string, note: string) => api.post(`/tickets/${id}/notes`, { note }),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  getMessages: (id: string) => api.get(`/tickets/${id}/messages`),
  sendMessage: (id: string, data: any) => api.post(`/tickets/${id}/messages`, data)
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiApi = {
  classify: (subject: string, description: string) => api.post('/ai/classify', { subject, description })
};

// ─── Agents ──────────────────────────────────────────────────────────────────
export const agentApi = {
  getAll: () => api.get('/agents'),
  getById: (id: string) => api.get(`/agents/${id}`),
  update: (id: string, data: any) => api.put(`/agents/${id}`, data)
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserRole: (id: string, data: any) => api.put(`/admin/users/${id}/role`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`)
};

// ─── Feedback ────────────────────────────────────────────────────────────────
export const feedbackApi = {
  submit: (data: any) => api.post('/feedback', data),
  getAll: (params?: any) => api.get('/feedback', { params })
};

// ─── SLA ─────────────────────────────────────────────────────────────────────
export const slaApi = {
  getAll: () => api.get('/sla'),
  create: (data: any) => api.post('/sla', data),
  update: (id: string, data: any) => api.put(`/sla/${id}`, data)
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data)
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`)
};
