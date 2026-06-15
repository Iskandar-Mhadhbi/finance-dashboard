import api from './client';

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export const register = async (email: string, password: string, name: string) => {
  const res = await api.post<AuthResponse>('/auth/register', { email, password, name });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};