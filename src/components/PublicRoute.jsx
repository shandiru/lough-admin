import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // assuming you have this hook

const PublicRoute = ({ children }) => {
  const { user } = useAuth(); // get logged-in user info from context/store

  if (user) {
    // redirect logged-in users based on role
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/dashboard/staff" replace />;
  }

  return children; // only non-logged-in users can access
};

export default PublicRoute;