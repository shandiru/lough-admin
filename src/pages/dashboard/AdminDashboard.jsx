import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-12 flex flex-col items-start justify-start">
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            Administrator
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight break-words">
          Welcome, {user?.name || 'Admin'}
        </h1>
        <div className="w-16 md:w-24 h-1 bg-[var(--color-brand)] mt-6 md:mt-8 rounded-full opacity-50" />
      </main>
    </div>
  );
};

export default AdminDashboard;