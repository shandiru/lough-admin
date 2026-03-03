import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    // Changed: 'overflow-x-hidden' prevents horizontal scrolling issues on small screens
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA] overflow-x-hidden">
      
      {/* Note: If your Sidebar isn't responsive, you may need to pass a 'isOpen' prop 
         or use a state here to toggle it on mobile.
      */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 flex flex-col items-start justify-start w-full">
        
        {/* Breadcrumb / Tag */}
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            Administrator
          </span>
        </div>

        {/* Heading - Fixed 'break-words' and width for mobile */}
        <div className="w-full">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Welcome, <br className="block md:hidden" /> 
            <span className="text-[var(--color-brand)]">{user?.name || 'Admin'}</span>
          </h1>
        </div>

        {/* Decorative Divider */}
        <div className="w-16 md:w-24 h-1 bg-[var(--color-brand)] mt-6 md:mt-8 rounded-full opacity-50"></div>

        {/* Stats Grid Example (Important for Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-10">
            {/* Your dashboard cards would go here */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;