import axios from 'axios';
import { useAuthStore } from '../store/useStore';

// Common setup for Axios
const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      // Get the token from Zustand store
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

// Export specialized API clients
export const authApi = createApiClient(import.meta.env.VITE_AUTH_API_URL);
export const bookApi = createApiClient(import.meta.env.VITE_BOOK_API_URL);
export const orderApi = createApiClient(import.meta.env.VITE_ORDER_API_URL);
export const paymentApi = createApiClient(import.meta.env.VITE_PAYMENT_API_URL);
export const blockApi = createApiClient(import.meta.env.VITE_BLOCKCHAIN_API_URL);
