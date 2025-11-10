import api from './api';
import { Organization } from '../types';

export const getOrganizations = async () => {
  const response = await api.get('/organizations');
  return response.data;
};

export const getOrganization = async (id: string) => {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
};

export const createOrganization = async (organization: Omit<Organization, 'id'>) => {
  const response = await api.post('/organizations', organization);
  return response.data;
};
