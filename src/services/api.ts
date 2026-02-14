import axios from 'axios';

const getBaseUrl = () => {
    // Dynamically use the hostname (localhost or network IP)
    const { hostname, protocol } = window.location;
    // Prefer env variable if set
    if (import.meta.env.VITE_BACKEND_URL) {
        return `${import.meta.env.VITE_BACKEND_URL}/api`;
    }
    // Default to port 5000 on the same host
    return `${protocol}//${hostname}:5000/api`;
};

console.log('API Base URL:', getBaseUrl());

const api = axios.create({
    baseURL: getBaseUrl(),
});

// Add auth header if token exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // Don't send token for login/register/forgot-password/reset-password
    const isAuthRequest = config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register') ||
        config.url?.includes('/auth/forgot-password') ||
        config.url?.includes('/auth/reset-password');

    if (token && !isAuthRequest) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
