import axios from 'axios';

const getBaseUrl = () => {
    // If VITE_API_URL is set (production via Vercel env var), use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Development Environment:
    // If running on local network (or localhost), point to the same host on port 5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        return `http://${window.location.hostname}:5000/api`;
    }

    // Fallback? (Maybe remove this or make it safer)
    // For many Vercel deployments without the env var, this might break things differently.
    // Better to default to the provided production URL if known, or fail gracefully.
    // But for now, let's trust the env var is the PRIMARY source of truth.

    // If we are on Vercel but forgot the env var, logging an error might help debug
    console.warn("VITE_API_URL is missing! Requests might fail.");
    return '/api'; // Try relative path? Or just fail.
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
