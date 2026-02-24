import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    /* 1. Changed to flex-col by default (mobile) and flex-row for larger screens */
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-brand-soft)]">
      
      {/* Sidebar needs to handle its own mobile visibility/toggle inside its component */}
      <Sidebar />

      {/* 2. Adjusted padding: p-6 on mobile, p-12 on desktop */}
      <main className="flex-1 p-6 lg:p-12 flex flex-col items-start justify-start">
        
        {/* Identity Badge */}
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            Administrator
          </span>
        </div>

        {/* Welcome Header */}
        <div className="w-full">
          {/* 3. Responsive Text Size: text-3xl on mobile, text-5xl on desktop */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight break-words">
            Welcome, {user?.name || 'Admin'}
          </h1>
        </div>

        {/* Optional: Simple Divider */}
        <div className="w-16 md:w-24 h-1 bg-[var(--color-brand)] mt-6 md:mt-8 rounded-full opacity-50"></div>

      </main>
    </div>
  );
};

export default AdminDashboard;