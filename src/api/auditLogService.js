import axiosInstance from './axiosInstance';

export const auditLogService = {
  getLogs: (params = {}) =>
    axiosInstance.get('/audit-logs', { params }),

  getDistinctActions: () =>
    axiosInstance.get('/audit-logs/actions'),
};
