import axiosInstance from './axiosInstance';

export const profileService = {
  // GET current user's profile (user + staff data)
  getMyProfile: () => axiosInstance.get('/profile/me'),

  // PUT update profile — send FormData (firstName, lastName, phone, bio, optional profileImage file)
  updateMyProfile: (formData) =>
    axiosInstance.put('/profile/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};