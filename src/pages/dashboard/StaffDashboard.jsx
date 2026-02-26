import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';

const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GoogleCalendarCard = ({ isConnected, onConnect, connecting }) => {


  if (isConnected) {
    return (
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60 p-7 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md shadow-emerald-100 flex items-center justify-center">
            <GoogleLogo size={22} />
          </div>
          <div>
            <p className="font-black text-gray-800 text-sm">Google Calendar</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px]">Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-sm text-gray-600 font-medium">
            Your Google Calendar is already connected. Appointments will sync automatically.
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="relative overflow-hidden rounded-[28px] bg-white/70 backdrop-blur-md border border-white p-7 shadow-xl">
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[var(--color-brand)]/5 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center">
            <GoogleLogo size={22} />
          </div>
          <div>
            <p className="font-black text-gray-800 text-sm">Google Calendar</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Not Connected</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-7">
          Connect your Google account to automatically sync your appointments with your personal calendar.
        </p>

        {/* Connect Button */}
        <button
          onClick={onConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-lg text-gray-700 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-60 group"
        >
          {connecting ? (
            <>
              <span className="w-5 h-5 border-2 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" />
              <span className="uppercase tracking-widest text-xs text-gray-500">Opening Google...</span>
            </>
          ) : (
            <>
              <GoogleLogo size={20} />
              <span className="uppercase tracking-widest text-xs group-hover:tracking-[3px] transition-all duration-300">
                Sign in with Google
              </span>
            </>
          )}
        </button>

        <p className="text-[9px] text-gray-300 text-center mt-3 font-medium tracking-wide">
          You'll be redirected to Google to authorise calendar access
        </p>
      </div>
    </div>
  );
};


const StaffDashboard = () => {
  const { user }       = useAuth();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [connecting,  setConnecting]  = useState(false);


  useEffect(() => {
    const gcal = searchParams.get('gcal');
    if (gcal === 'success') toast.success('Google Calendar connected successfully! ', { duration: 4000 });
    if (gcal === 'denied')  toast.error('Google Calendar access was denied.',            { duration: 4000 });
    if (gcal === 'error')   toast.error('Google Calendar connection failed. Try again.', { duration: 4000 });
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/staff/getGoogleCalenderStatus');
        setIsConnected(res.data === true);
      } catch {
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await axiosInstance.get('/google/auth-url');
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google sign-in. Try again.');
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            color: '#111',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            padding: '16px 20px',
          },
        }}
      />

      <Sidebar />

      <main className="flex-1 p-6 lg:p-12 flex flex-col items-start justify-start min-w-0">

        {/* Role badge */}
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            Staff
          </span>
        </div>

        {/* Welcome heading */}
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight break-words">
            Welcome, {user?.name}
          </h1>
        </div>

        <div className="w-16 md:w-24 h-1 bg-[var(--color-brand)] mt-6 md:mt-8 rounded-full opacity-50 mb-10" />

        {/* ── Google Calendar Section ── */}
        <div className="w-full max-w-md">

          {/* Section label */}
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-[var(--color-brand)]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">
              Calendar Integration
            </span>
          </div>

          {/* Card or loader */}
          {loading ? (
            <div className="rounded-[28px] bg-white/70 border border-white p-7 shadow-xl flex items-center justify-center gap-3 h-44">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand)]" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-[2px]">Loading...</span>
            </div>
          ) : (
            <GoogleCalendarCard
              isConnected={isConnected}
              onConnect={handleConnect}
              connecting={connecting}
            />
          )}
        </div>

      </main>
    </div>
  );
};

export default StaffDashboard;