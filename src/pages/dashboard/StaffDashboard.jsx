import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { googleCalendarApi } from '../../api/googleCalendar';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, Loader2 } from 'lucide-react';
import GoogleCalendarCard from '../../components/Google/GoogleCalendarCard'

const StaffDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const gcal = searchParams.get('gcal');
    if (gcal === 'success') toast.success('Calendar connected!');
    if (gcal === 'denied') toast.error('Access denied.');
    if (gcal === 'error') toast.error('Connection failed.');
    
    checkStatus();
  }, [searchParams]);

  const checkStatus = async () => {
    try {
      const status = await googleCalendarApi.getStatus();
      setIsConnected(status);
    } catch {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const url = await googleCalendarApi.getAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error('Could not start Google sign-in.');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Google Calendar? Appointments will stop syncing.")) return;
    
    setActionLoading(true);
    try {
      await googleCalendarApi.disconnect();
      setIsConnected(false);
      toast.success('Calendar disconnected successfully');
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA]">
      <Toaster position="top-center" />
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
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">
              Integrations
            </span>
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