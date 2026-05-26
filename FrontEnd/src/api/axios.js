/**
 * src/api/axios.js — Axios Instance Configuration
 *
 * Creates a pre-configured Axios client that:
 *  - Points to the backend API base URL from env
 *  - Sends cookies with cross-origin requests (withCredentials: true)
 *  - Handles 401 responses globally by clearing state
 */
import axios from 'axios';

// Create a dedicated Axios instance so config doesn't pollute the global axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000, // 10 s timeout — prevents requests hanging indefinitely
  withCredentials: true, // Send httpOnly cookies with requests
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Interceptor remains for clean API structure and potential custom headers in future
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Intercepts 401 Unauthorized responses and clears stale auth data
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Force window reload or dispatch event to clear local state if needed
      // Handled primarily in AuthContext.jsx
    }
    return Promise.reject(error);
  }
);

export default api;
