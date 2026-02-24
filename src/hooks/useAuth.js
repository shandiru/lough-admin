import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import axiosInstance from '../api/axiosInstance';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, accessToken, isLoading } = useSelector((state) => state.auth);

  const isAuthenticated = !!accessToken;

  const handleLogout = async () => {
    alert('You will be logged out. Please confirm.');
    try {
      await axiosInstance.post('/auth/logout');
    } catch (e) {
      // Even if API fails, clear local state
      alert('Logout failed on server, but you have been logged out locally. Please try again if you experience issues.');
    }
    dispatch(logout());
    window.location.href = '/login';
  };

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    role: user?.role,
    name: user?.name,
    handleLogout,
  };
};