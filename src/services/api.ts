import axios from 'axios';

const getBaseUrl = () => {
    // Dynamically use the hostname (localhost or network IP)
    const { hostname } = window.location;
    return `http://${hostname}:5000/api`;
};

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
