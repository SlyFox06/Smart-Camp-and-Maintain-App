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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
