import axios from 'axios';

// Default to relative '/api' so it routes through Vite's dev proxy (same-origin, no CORS blocks)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mess_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('mess_token');
      localStorage.removeItem('mess_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const mealsAPI = {
  getUpcoming: async (days = 3) => {
    const res = await api.get(`/meals/upcoming?days=${days}`);
    return res.data;
  },
  markSkip: async (mealId) => {
    const res = await api.post(`/meals/${mealId}/skip`);
    return res.data;
  },
  unmarkSkip: async (mealId) => {
    const res = await api.delete(`/meals/${mealId}/skip`);
    return res.data;
  },
};

export const managerAPI = {
  getForecast: async (dateStr) => {
    const url = dateStr ? `/manager/forecast?date=${dateStr}` : '/manager/forecast';
    const res = await api.get(url);
    return res.data;
  },
  recordActuals: async (data) => {
    const res = await api.post('/manager/actuals', data);
    return res.data;
  },
  getReport: async () => {
    const res = await api.get('/manager/report');
    return res.data;
  },
};

export const adminAPI = {
  seed: async (force = true) => {
    const res = await api.post(`/admin/seed?force=${force}`);
    return res.data;
  },
};

export default api;
