import axios from "axios";
import { API_CONFIG } from "./config";

// Create an Axios instance with base config
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: Number(API_CONFIG.TIMEOUT),
  headers: API_CONFIG.HEADERS,
  withCredentials: true, // Enable sending cookies with requests
});

// Optional: Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here if needed
    return Promise.reject(error);
  }
);

export default axiosInstance;
