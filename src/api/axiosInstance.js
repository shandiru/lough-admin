import axios from 'axios';
import store from '../store/store';
import { refreshSuccess, logout } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL;
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // important for httpOnly refresh cookie
});

// ✅ REQUEST INTERCEPTOR — attach accessToken
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR — handle 401 & refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Axios Response Error:', error);
    console.log(originalRequest);
    console.log('===== AXIOS ERROR =====');

    // 1️⃣ Which URL failed
    console.log('Request URL:', originalRequest?.url);
    console.log('Request Method:', originalRequest?.method);

    // 2️⃣ Request headers & data
    console.log('Request Headers:', originalRequest?.headers);
    console.log('Request Data:', originalRequest?.data);

    // 3️⃣ Response from server
    if (error.response) {
      console.log('Status Code:', error.response.status);
      console.log('Response Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Request object:', error.request);
    } else {
      console.log('Error Message:', error.message);
    }

    console.log('=======================');

    // If 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const res = await axios.post(
          'https://backend-nu-ruddy-13.vercel.app/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken, user } = res.data;

        // Update Redux
        store.dispatch(refreshSuccess({ accessToken, user }));

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh failed → logout
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;