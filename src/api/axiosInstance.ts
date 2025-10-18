import axios from 'axios';
import { API_CONFIG } from './config';

// Create an Axios instance with base config
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: Number(API_CONFIG.TIMEOUT),
  headers: API_CONFIG.HEADERS,
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Request interceptor - No longer needed for token as it's in cookies
// Keeping for potential future use (e.g., adding other headers)
axiosInstance.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with each request
    // No need to manually add Authorization header
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here if needed
    return Promise.reject(error);
  }
);

export default axiosInstance;