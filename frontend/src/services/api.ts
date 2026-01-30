import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const shipmentAPI = {
  getAll: () => api.get('/shipments'),
  getById: (id: number) => api.get(`/shipments/${id}`),
  create: (data: any) => api.post('/shipments', data),
};
