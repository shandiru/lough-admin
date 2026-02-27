import axiosInstance from './axiosInstance';

export const leaveService = {
  // Staff
  apply:       (data) => axiosInstance.post('/leaves', data),
  getMyLeaves: ()     => axiosInstance.get('/leaves/my'),
  cancel:      (id)   => axiosInstance.patch(`/leaves/${id}/cancel`),

  // Admin
  getAllLeaves: (status) => axiosInstance.get('/leaves', { params: status ? { status } : {} }),
  review:      (id, status, adminNote) => axiosInstance.patch(`/leaves/${id}/review`, { status, adminNote }),
};