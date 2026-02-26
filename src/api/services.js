import axios from "axios";

const API_URL =  import.meta.env.VITE_API_URL;

export const sendInvite = async (formData) => {
  try {
    
    const response = await axios.post(`${API_URL}/auth/invite`, formData);
    return response.data;
  } catch (error) {
    
    throw error.response?.data?.message;
  }
};


export const verifySetupPassword = async (setupData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-setup`, setupData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message ;
  }
};


export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      withCredentials: true, 
    });
    return response.data;
  } catch (error) {
    
    throw error.response?.data?.message || "Login failed. Please try again.";
  }
};


export const resetPasswordConfirm = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password-confirm`, data);
    return response.data;
  } catch (error) {
    
    throw error.response?.data?.message || "Reset failed. Link may have expired.";
  }
};


export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { email });
    return response.data;
  } catch (error) {
  
    throw error.response?.data?.message || "Something went wrong. Try again.";
  }
};