import axiosInstance from './axiosInstance';

export const staffService = {
  getAll: () => axiosInstance.get('/staff'),
  toggleActive: (id) => axiosInstance.patch(`/staff/${id}/toggle-active`),
  resendInvite: (id) => axiosInstance.patch(`/staff/${id}/resend-invite`),
  delete: (id) => axiosInstance.delete(`/staff/${id}`),
};