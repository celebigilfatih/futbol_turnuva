import type { ApiResponse } from '@/types/api';
import { post, get } from './api';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  user: User;
  token: string;
}

const ENDPOINT = '/auth';

export const authService = {
  // Login
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await post<AuthResponse>(`${ENDPOINT}/login`, data);
    if (response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Register
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await post<AuthResponse>(`${ENDPOINT}/register`, data);
    if (response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return get<User>(`${ENDPOINT}/me`);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const user = authService.getStoredUser();
    return user?.role === 'admin';
  },

  // Create initial admin
  createInitialAdmin: async (): Promise<ApiResponse<any>> => {
    return post<any>(`${ENDPOINT}/init-admin`, {});
  }
};
