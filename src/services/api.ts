// src/services/api.ts

import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://millitary-asset-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach JWT from localStorage, if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
