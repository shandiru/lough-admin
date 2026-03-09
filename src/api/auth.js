import axios from "axios";

import config from '../config/index';
const API_URL = config.apiUrl;

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
    
    throw error.response?.data?.message ;
  }
};


export const resetPasswordConfirm = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password-confirm`, data);
    return response.data;
  } catch (error) {
    
    throw error.response?.data?.message;
  }
};


export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { email });
    return response.data;
  } catch (error) {
  
    throw error.response?.data?.message ;
  }
};



export const checkTokenStatus = async (token, email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-token-status`, { token, email });
    return response.data;
  } catch (error) {
    
    throw error.response?.data?.message ;
  }
};