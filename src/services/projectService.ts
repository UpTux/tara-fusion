import api from './api';
import { Project } from '../types';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: Omit<Project, 'id'>) => {
  const response = await api.post('/projects', project);
  return response.data;
};
