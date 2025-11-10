import api from './api';
import { User } from '../types';

export const login = async (credentials: Pick<User, 'email' | 'password'>) => {
  const response = await api.post('/auth/login', credentials);
  localStorage.setItem('token', response.data.token);
  return response.data.user;
};

export const register = async (user: Omit<User, 'id'>) => {
  const response = await api.post('/auth/register', user);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
