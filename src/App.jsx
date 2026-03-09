import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SilentRefresh    from './components/SilentRefresh';
import ProtectedRoute   from './components/ProtectedRoute';
import PublicRoute      from './components/PublicRoute';


import RegisterPage       from './pages/RegisterPage';
import SetupPasswordPage  from './pages/SetupPasswordPage';
import LoginPage          from './pages/LoginPage';
import ForgotPasswordPage from './pages/Forgotpasswordpage';
import ResetPasswordPage  from './pages/ResetPasswordPages';
import VerifyEmailChangePage from './pages/VerifyEmailChangePage';


import AdminDashboard  from './pages/dashboard/AdminDashboard';
import CategoryPage    from './pages/CategoryPage';
import ServicePage     from './pages/Servicepage';
import StaffPage       from './pages/Staffpage';
import AdminLeavePage  from './pages/AdminLeavePage'; 
import AdminBookingPage from './pages/BookingPage';


import StaffDashboard  from './pages/dashboard/StaffDashboard';
import StaffLeavePage  from './pages/StaffLeavePage'; 
import UnauthorizedPage from './pages/UnauthorizedPage';
const App = () => {
  return (
    <BrowserRouter>
      <SilentRefresh>
        <Routes>

          
          <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/setup-password"  element={<PublicRoute><SetupPasswordPage /></PublicRoute>} />
          <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />

          
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/category" element={
            <ProtectedRoute allowedRoles={['admin']}><CategoryPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/service" element={
            <ProtectedRoute allowedRoles={['admin']}><ServicePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/staff" element={
            <ProtectedRoute allowedRoles={['admin']}><StaffPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/leaves" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminLeavePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/bookings" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminBookingPage /></ProtectedRoute>
          } />

         
          <Route path="/dashboard/staff" element={
            <ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/staff/leaves" element={
            <ProtectedRoute allowedRoles={['staff']}><StaffLeavePage /></ProtectedRoute>
          } />

         
          <Route path="/" element={<Navigate to="/login" replace />} />
           <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </SilentRefresh>
    </BrowserRouter>
  );
};

export default App;