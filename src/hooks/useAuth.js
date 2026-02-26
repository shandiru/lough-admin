import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import axiosInstance from '../api/axiosInstance';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate import pannunga

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // 2. navigate function-ai initialize pannunga
  const { user, accessToken, isLoading } = useSelector((state) => state.auth);

  const isAuthenticated = !!accessToken;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to exit?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22b8c7',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      background: '#fdf8f3',
      color: '#1f8e9a'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Logging out...',
          didOpen: () => { Swal.showLoading(); },
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await axiosInstance.post('/auth/logout');
      } catch (e) {
        console.error("Logout error", e);
      } finally {
        // 3. Redux state-ai clear panrom
        dispatch(logout());
        
        // 4. Page reload illaama smooth-a redirect panrom
        navigate('/login', { replace: true }); 
        
        // SweetAlert-ai close panna
        Swal.close();
      }
    }
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