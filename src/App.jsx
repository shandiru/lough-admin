import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SilentRefresh from './components/SilentRefresh';
import ProtectedRoute from './components/ProtectedRoute';

import RegisterPage from './pages/RegisterPage';
import SetupPasswordPage from './pages/SetupPasswordPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import ForgotPasswordPage from './pages/Forgotpasswordpage';
import ResetPasswordPage from './pages/ResetPasswordPages';
import CategoryPage from './pages/CategoryPage';
import ServicePage from './pages/ServicePage';
import StaffPage from './pages/StaffPage';

const App = () => {
  return (
    <BrowserRouter>
      <SilentRefresh>
        <Routes>
          {/* Public */}
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/setup-password"  element={<SetupPasswordPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* Admin */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          }/>
          <Route path="/dashboard/admin/category" element={
            <ProtectedRoute allowedRoles={['admin']}><CategoryPage /></ProtectedRoute>
          }/>
          <Route path="/dashboard/admin/service" element={
            <ProtectedRoute allowedRoles={['admin']}><ServicePage /></ProtectedRoute>
          }/>
          <Route path="/dashboard/admin/staff" element={
            <ProtectedRoute allowedRoles={['admin']}><StaffPage /></ProtectedRoute>
          }/>

          {/* Staff */}
          <Route path="/dashboard/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>
          }/>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </SilentRefresh>
    </BrowserRouter>
  );
};

export default App;