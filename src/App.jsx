import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts/Components
import SilentRefresh from './components/SilentRefresh'; // Import here
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import RegisterPage from './pages/RegisterPage';
import SetupPasswordPage from './pages/SetupPasswordPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CustomerDashboard from './pages/dashboard/StaffDashboard';
import ForgotPasswordPage from './pages/Forgotpasswordpage';
import ResetPasswordPage from './pages/ResetPasswordPages';

const App = () => {
  return (
    <BrowserRouter>
      <SilentRefresh>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/setup-password" element={<SetupPasswordPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer/Staff Routes */}
          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </SilentRefresh>
    </BrowserRouter>
  );
};

export default App;