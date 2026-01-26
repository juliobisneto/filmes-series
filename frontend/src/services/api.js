import axios from 'axios';

// Usar variável de ambiente ou fallback para localhost (desenvolvimento local)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para login se não estiver já nessa página
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  getToken: () => {
    return localStorage.getItem('token');
  },
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Serviços de perfil
export const profileService = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getUser: () => api.get('/profile/user')
};

// Serviços de media (filmes/séries)
export const mediaService = {
  getAll: (params = {}) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  search: (query) => api.get('/media/search/local', { params: { q: query } }),
  create: (data) => api.post('/media', data),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`)
};

// Serviços OMDb (IMDB)
export const omdbService = {
  search: (params) => {
    // params pode ser uma string (título) ou um objeto { title, type, year }
    if (typeof params === 'string') {
      return api.get('/omdb/search', { params: { title: params } });
    }
    return api.get('/omdb/search', { params });
  },
  getByImdbId: (imdbId) => api.get(`/omdb/${imdbId}`),
  getByTitle: (title, type = null, year = null) => {
    const params = {};
    if (type) params.type = type;
    if (year) params.year = year;
    return api.get(`/omdb/title/${title}`, { params });
  }
};

export default api;
