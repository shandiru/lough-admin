import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0">
        
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            Administrator
          </span>
        </div>

        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight break-words">
            Welcome, {user?.name || 'Admin'}
          </h1>
        </div>

        <div className="w-16 md:w-24 h-1 bg-[var(--color-brand)] mt-6 md:mt-8 rounded-full opacity-50"></div>

      </main>
    </div>
  );
};

export default AdminDashboard;