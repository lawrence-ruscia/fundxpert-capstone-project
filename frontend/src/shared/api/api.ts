import axios from 'axios';
// Create a single axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // send cookies (JWT httpOnly cookies)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    // Normalize error response
    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.error || 'Request failed',
      });
    }
    return Promise.reject({ status: 500, message: 'Network error' });
  }
);
