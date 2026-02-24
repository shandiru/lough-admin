import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";

// allowedRoles: array like ['admin'] or ['admin', 'customer']
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role not allowed — redirect to their own dashboard
    return <Navigate to={role === 'admin' ? '/dashboard/admin' : '/dashboard/customer'} replace />;
  }

  return children;
};

export default ProtectedRoute;