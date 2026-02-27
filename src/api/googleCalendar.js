import axiosInstance from './axiosInstance';

export const googleCalendarApi = {

  getStatus: async () => {
    const res = await axiosInstance.get('/staff/getGoogleCalenderStatus');
    return res.data === true;
  },


  getAuthUrl: async () => {
    const res = await axiosInstance.get('/google/auth-url');
    return res.data.url;
  },

 
  disconnect: async () => {
    return await axiosInstance.delete('/google/disconnect');
  }
};