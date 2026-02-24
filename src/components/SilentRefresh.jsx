// src/components/SilentRefresh.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { refreshSuccess, logout } from '../store/slices/authSlice';

const SilentRefresh = ({ children }) => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const performRefresh = async () => {
      if (!accessToken) {
        try {
          const res = await axios.post(
            `http://localhost:5000/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          dispatch(refreshSuccess({ 
            accessToken: res.data.accessToken, 
            user: res.data.user 
          }));
        } catch (error) {
          dispatch(logout());
        } finally {
          setChecked(true);
        }
      } else {
        setChecked(true);
      }
    };

    performRefresh();
  }, [accessToken, dispatch]);

  if (!checked) {
    return (
      <div className="splash-screen flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="mb-6 animate-pulse">
          <img 
            src="/logo.webp" 
            alt="Logo" 
            className="w-32 h-auto object-contain" 
          />
        </div>
        <div className="splash-spinner border-4 border-[var(--color-brand-soft)] border-t-[var(--color-brand)] rounded-full w-10 h-10 animate-spin" />
      </div>
    );
  }

  return children;
};

export default SilentRefresh;