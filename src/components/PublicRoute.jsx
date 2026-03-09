import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 

const PublicRoute = ({ children }) => {
  const { user } = useAuth(); 

  if (user) {
   
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/dashboard/staff" replace />;
  }

  return children; 
};

export default PublicRoute;