import axios from 'axios';

// Create an axios instance with default config
const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // This is important for cookies/sessions
});

// API endpoints
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => API.post('/login', credentials),
    register: (userData) => API.post('/register', userData),
    logout: () => API.get('/logout'),
    checkAuth: () => API.get('/api/check-auth'),
  },
  
  // Profile endpoints
  profile: {
    get: () => API.get('/profile'),
    update: (profileData) => API.post('/profile', profileData),
  },
  
  // Exercise endpoints
  exercise: {
    getMetrics: () => API.get('/get_metrics'),
    resetCounter: () => API.get('/reset_counter'),
    endWorkout: () => API.get('/end_workout'),
    checkCamera: () => API.get('/check_camera'),
    checkMediapipe: () => API.get('/check_mediapipe'),
  },
  
  // History endpoints
  history: {
    get: () => API.get('/history'),
  },
  
  // Diagnostic endpoints
  diagnostics: {
    checkDatabase: () => API.get('/api/check-db'),
  }
};

// Handle request intercept
API.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Intercept responses for error handling
API.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Redirect to login page or show auth error
      console.error('Authentication error:', error.response.data);
      // Uncomment to automatically redirect to login page
      // window.location.href = '/login';
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default API; 