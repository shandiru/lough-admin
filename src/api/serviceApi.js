import axiosInstance from './axiosInstance';

export const serviceApi = {
  getAll: () => axiosInstance.get('/services'),
  getById: (id) => axiosInstance.get(`/services/${id}`),
  create: (data) => axiosInstance.post('/services', data),
  update: (id, data) => axiosInstance.put(`/services/${id}`, data),
  delete: (id) => axiosInstance.delete(`/services/${id}`),
};

