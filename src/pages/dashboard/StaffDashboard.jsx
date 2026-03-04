import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, Loader2 } from 'lucide-react';

import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { googleCalendarApi } from '../../api/googleCalendar';
import GoogleCalendarCard from '../../components/Google/GoogleCalendarCard';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConnected, setIsConnected]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try { setIsConnected(await googleCalendarApi.getStatus()); }
      catch { setIsConnected(false); }
      finally { setLoading(false); }
    };

    const gcal = searchParams.get('gcal');
    if (gcal) {
      if (gcal === 'success') toast.success('Calendar connected!');
      if (gcal === 'denied')  toast.error('Access denied.');
      if (gcal === 'error')   toast.error('Connection failed.');
      searchParams.delete('gcal');
      setSearchParams(searchParams);
    }
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const url = await googleCalendarApi.getAuthUrl();
      window.location.href = url;
    } catch {
      toast.error('Could not start Google sign-in.');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Appointments will stop syncing to your Google Calendar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, disconnect!',
      reverseButtons: true,
      customClass: { popup: 'rounded-[28px] p-8' },
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await googleCalendarApi.disconnect();
      setIsConnected(false);
      Swal.fire({ title: 'Unlinked!', text: 'Google Calendar disconnected.', icon: 'success', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[28px]' } });
    } catch {
      toast.error('Failed to disconnect.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 p-6 lg:p-12">
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold uppercase tracking-widest">
            Staff
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-10">
          Welcome, {user?.name}
        </h1>

        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-[var(--color-brand)]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">Integrations</span>
          </div>
          {loading ? (
            <div className="rounded-[28px] bg-white/70 border border-white p-7 shadow-xl flex items-center justify-center gap-3 h-44">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand)]" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-[2px]">Checking Status...</span>
            </div>
          ) : (
            <GoogleCalendarCard
              isConnected={isConnected}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              processing={actionLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;