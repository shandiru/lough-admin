import axiosInstance from './axiosInstance';

export const getAllBookings = async () => {
  const res = await axiosInstance.get('/bookings');
  return res.data;
};

export const getAvailableSlotsAdmin = async (serviceId, date, customerGender, staffGenderPreference) => {
  const params = new URLSearchParams({ serviceId, date });
  if (customerGender) params.append('customerGender', customerGender);
  if (staffGenderPreference && staffGenderPreference !== 'any') params.append('staffGenderPreference', staffGenderPreference);
  const res = await axiosInstance.get(`/bookings/available-slots?${params}`);
  return res.data;
};

export const createBookingAdmin = async (data) => {
  const res = await axiosInstance.post('/bookings/admin', data);
  return res.data;
};

export const reviewCancelRequest = async (bookingId, { action, refundAmount, adminNote }) => {
  const res = await axiosInstance.post(`/bookings/${bookingId}/cancel-review`, { action, refundAmount, adminNote });
  return res.data;
};

export const updateStatus = async (bookingId, status) => {
  const res = await axiosInstance.patch(`/bookings/${bookingId}/status`, { status });
  return res.data;
};

export const adminCancelBooking = async (bookingId, { refundAmount = 0, reason = '', internalNotes = '' }) => {
  const res = await axiosInstance.post(`/bookings/${bookingId}/admin-cancel`, { refundAmount, reason, internalNotes });
  return res.data;
};

export const getCalendarBookings = async (startDate, endDate, staffId = '') => {
  const params = new URLSearchParams({ startDate, endDate });
  if (staffId) params.append('staffId', staffId);
  const res = await axiosInstance.get(`/bookings/calendar?${params}`);
  return res.data;
};
