import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  // Destructuring 'user' to pull the admin's name from your auth context
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-[var(--color-brand-soft)]">
      <Sidebar />

      <main className="flex-1 p-12 flex flex-col items-start justify-start">
        
        {/* Identity Badge */}
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-xs font-bold uppercase tracking-widest shadow-sm">
            Administrator
          </span>
        </div>

        {/* Welcome Header */}
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            Welcome, {user?.name || 'Admin'}
          </h1>
         
        </div>

        {/* Optional: Simple Divider */}
        <div className="w-24 h-1 bg-[var(--color-brand)] mt-8 rounded-full opacity-50"></div>

      </main>
    </div>
  );
};

export default AdminDashboard;