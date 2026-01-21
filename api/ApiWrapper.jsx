import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          });
          
          Cookies.set('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api.request(originalRequest);
        } catch (refreshError) {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  /**
   * @param {string} login - Can be email (contains @) or username
   * @param {string} password 
   * @returns {Promise<{access: string, refresh: string, user?: object}>}
   */
  login: async (login, password) => {
    const isEmail = login.includes('@');

    const requestBody = {
      username: login,
      password: password,
    };
    
    console.log('Login request:', { 
      login, 
      isEmail, 
      requestBody 
    });

    try {
      const { data } = await api.post('/api/auth/login/', requestBody);
      
      if (data.access) {
        Cookies.set('access_token', data.access, { expires: 1 }); 
      }
      if (data.refresh) {
        Cookies.set('refresh_token', data.refresh, { expires: 7 }); 
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * @param {string} login 
   * @param {string} password 
   * @param {boolean} isEmail 
   * @returns {Promise<{access: string, refresh: string, user?: object}>}
   */
  loginWithDetection: async (login, password, isEmail = false) => {
    const requestBody = isEmail 
      ? { email: login, password: password }
      : { username: login, password: password };
    
    console.log('Login with detection:', requestBody);

    try {
      const { data } = await api.post('/api/auth/login/', requestBody);
      
      if (data.access) {
        Cookies.set('access_token', data.access, { expires: 1 }); 
      }
      if (data.refresh) {
        Cookies.set('refresh_token', data.refresh, { expires: 7 }); 
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * @param {string} email 
   * @param {string} username 
   * @param {string} password
   * @returns {Promise<{access: string, refresh: string, user?: object}>}
   */
  register: async (email, username, password) => {
    try {
      const { data } = await api.post('/api/auth/registration/', {
        email,
        username,
        password1: password,
        password2: password,
      });
      
      if (data.access) {
        Cookies.set('access_token', data.access, { expires: 1 });
      }
      if (data.refresh) {
        Cookies.set('refresh_token', data.refresh, { expires: 7 });
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }
  },

  /**
   * @returns {Promise<object>}
   */
  getCurrentUser: async () => {
    try {
      const { data } = await api.get('/api/auth/user/');
      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!Cookies.get('access_token');
  },

  /**
   * @returns {Promise<{access: string}>}
   */
  refreshToken: async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const { data } = await axios.post(`${API_URL}/api/token/refresh/`, {
        refresh: refreshToken,
      });
      
      Cookies.set('access_token', data.access, { expires: 1 });
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      throw error;
    }
  },

  /**
   * @param {object} userData
   * @returns {Promise<object>}
   */
  updateProfile: async (userData) => {
    try {
      const { data } = await api.patch('/api/auth/user/', userData);
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};

export default api;