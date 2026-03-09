import axiosInstance from './axiosInstance';

export const getAllBookings = async () => {
  const res = await axiosInstance.get('/bookings');
  return res.data;
};

export const getAvailableSlotsAdmin = async (serviceId, date, customerGender) => {
  const params = new URLSearchParams({ serviceId, date });
  if (customerGender) params.append('customerGender', customerGender);
  const res = await axiosInstance.get(`/bookings/available-slots?${params}`);
  return res.data;
};

export const createBookingAdmin = async (data) => {
  const res = await axiosInstance.post('/bookings/admin', data);
  return res.data;
};
