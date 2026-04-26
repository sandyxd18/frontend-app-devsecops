import axios from 'axios';
import { useAuthStore } from '../store/useStore';

// authApi — HttpOnly cookie (withCredentials: true) for session restore.
// Bearer token is ALSO injected from in-memory store so that general auth-service
// endpoints (e.g. /auth/profile, /auth/password) receive an explicit token,
// preventing cross-session cookie conflicts when both admin and user are logged
// in on the same browser.

const createApiClient = (baseURL, useCookie = false) => {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    ...(useCookie ? { withCredentials: true } : {}),
  });

  // Always inject Bearer token from in-memory store when available.
  // For authApi (useCookie=true) this supplements the cookie so that
  // authenticateJWT picks up the Bearer header first (correct user context).
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState()._token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return client;
};

export const authApi    = createApiClient(import.meta.env.VITE_AUTH_API_URL, true);
export const bookApi    = createApiClient(import.meta.env.VITE_BOOK_API_URL);
export const orderApi   = createApiClient(import.meta.env.VITE_ORDER_API_URL);
export const paymentApi = createApiClient(import.meta.env.VITE_PAYMENT_API_URL);
export const blockApi   = createApiClient(import.meta.env.VITE_BLOCKCHAIN_API_URL);
