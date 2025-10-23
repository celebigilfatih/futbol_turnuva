import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// GET isteği
export const get = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  const response = await api.get<ApiResponse<T>>(endpoint);
  return response.data;
};

// POST isteği
export const post = async <T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> => {
  const response = await api.post<ApiResponse<T>>(endpoint, data);
  return response.data;
};

// PUT isteği
export const put = async <T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> => {
  const response = await api.put<ApiResponse<T>>(endpoint, data);
  return response.data;
};

// DELETE isteği
export const del = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  const response = await api.delete<ApiResponse<T>>(endpoint);
  return response.data;
};

// Sayfalı GET isteği
export const getPaginated = async <T>(
  endpoint: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<T>> => {
  const response = await api.get<PaginatedResponse<T>>(
    `${endpoint}?page=${page}&limit=${limit}`
  );
  return response.data;
}; 