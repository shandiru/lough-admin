import axiosInstance from "../api/axiosInstance";

export const categoryService = {
  getAll: () => axiosInstance.get('/categories'),
  create: (data) => axiosInstance.post('/categories', data),
  update: (id, data) => axiosInstance.put(`/categories/${id}`, data),
  delete: (id) => axiosInstance.delete(`/categories/${id}`),
};