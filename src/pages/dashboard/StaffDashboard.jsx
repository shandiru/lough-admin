import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays, Link2Off, ExternalLink,
  RefreshCw, CheckCircle2, AlertTriangle,
  Loader2, Sparkles
} from 'lucide-react';

// ─── Google G Logo SVG ────────────────────────────────────────────────────────
const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─── Google Calendar Integration Card ────────────────────────────────────────
const GoogleCalendarCard = ({ gcalData, onRefresh }) => {
  const [connecting,    setConnecting]    = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const status     = gcalData?.googleCalendarSyncStatus?.status || 'disconnected';
  const lastSync   = gcalData?.googleCalendarSyncStatus?.lastSync;
  const errMsg     = gcalData?.googleCalendarSyncStatus?.errorMessage;
  const calId      = gcalData?.googleCalendarId;
  const isConnected = status === 'connected';
  const isError     = status === 'error';

  // ── STEP 1: Request OAuth URL from backend → redirect browser to Google ──
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await axiosInstance.get('/google/auth-url');
      // Full page redirect — Google will redirect back to /api/google/callback
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google sign-in. Try again.');
      setConnecting(false);
    }
  };

  // ── Disconnect with confirmation toast ──
  const handleDisconnect = () => {
    toast(t => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-black text-gray-800 text-sm">Disconnect Google Calendar?</p>
        <p className="text-xs text-gray-500">Appointments will no longer sync automatically.</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-2.5 bg-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-200 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              setDisconnecting(true);
              try {
                await axiosInstance.delete('/google/disconnect');
                toast.success('Google Calendar disconnected');
                onRefresh();
              } catch {
                toast.error('Failed to disconnect. Please try again.');
              } finally {
                setDisconnecting(false);
              }
            }}
            className="flex-1 px-3 py-2.5 bg-[#B62025] text-white rounded-xl text-xs font-black hover:bg-[#9a1a1e] transition-colors uppercase tracking-wider"
          >
            Disconnect
          </button>
        </div>
      </div>
    ), { duration: 12000 });
  };

  // ════════════════════════════════════
  //  CONNECTED UI
  // ════════════════════════════════════
  if (isConnected) {
    return (
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60 p-7 shadow-xl">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-100/50 pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
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
            {lastSync && (
              <span className="text-[9px] text-gray-400 font-bold text-right leading-relaxed">
                Last sync<br />
                {new Date(lastSync).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            )}
          </div>

          {/* Calendar ID pill */}
          {calId && (
            <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-3 mb-5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-gray-600 truncate flex-1">{calId}</span>
              <a
                href="https://calendar.google.com/calendar/r"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Google Calendar"
                className="shrink-0 p-1 rounded-lg hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Feature checks */}
          <div className="space-y-2 mb-6">
            {[
              'New bookings auto-sync to your calendar',
              'Google Calendar reminders are active',
              'Access your schedule from any device',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-gray-600 font-medium">{f}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 transition-all disabled:opacity-50"
            >
              {disconnecting
                ? <span className="w-3 h-3 border-2 border-red-200 border-t-red-400 rounded-full animate-spin" />
                : <Link2Off className="w-3 h-3" />
              }
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════
  //  ERROR UI
  // ════════════════════════════════════
  if (isError) {
    return (
      <div className="rounded-[28px] bg-red-50 border border-red-100 p-7 shadow-xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
            <GoogleLogo size={22} />
          </div>
          <div>
            <p className="font-black text-gray-800 text-sm">Google Calendar</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[2px]">Sync Error</span>
            </div>
          </div>
        </div>
        {errMsg && (
          <div className="flex items-start gap-2 bg-red-100/60 rounded-xl px-4 py-3 mb-5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs text-red-600 font-medium">{errMsg}</span>
          </div>
        )}
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50/50 text-gray-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {connecting
            ? <><span className="w-4 h-4 border-2 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" /> Connecting...</>
            : <><GoogleLogo size={18} /> Reconnect Google Calendar</>
          }
        </button>
      </div>
    );
  }

  // ════════════════════════════════════
  //  DISCONNECTED UI (default)
  // ════════════════════════════════════
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
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          Connect your Google account to automatically sync your Lough Skin appointments with your personal calendar.
        </p>

        {/* Feature list */}
        <div className="space-y-2.5 mb-7">
          {[
            'Auto-sync bookings to Google Calendar',
            'Get reminders for upcoming appointments',
            'Access your schedule from any device',
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] shrink-0" />
              <span className="text-xs text-gray-500 font-medium">{f}</span>
            </div>
          ))}
        </div>

        {/* ✅ MAIN CONNECT BUTTON */}
        <button
          onClick={handleConnect}
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

// ─── Main Staff Dashboard Page ────────────────────────────────────────────────
const StaffDashboard = () => {
  const { user }         = useAuth();
  const [searchParams]   = useSearchParams();
  const [gcalData, setGcalData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── Handle OAuth redirect result (?gcal=success|denied|error) ──
  useEffect(() => {
    const gcal = searchParams.get('gcal');
    if (gcal === 'success') toast.success('Google Calendar connected successfully! 🎉', { duration: 4000 });
    if (gcal === 'denied')  toast.error('Google Calendar access was denied.',           { duration: 4000 });
    if (gcal === 'error')   toast.error('Google Calendar connection failed. Try again.', { duration: 4000 });
  }, []);

  // ── Fetch staff profile to get current gcal status ──
  const fetchGcalStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/staff/me');
      setGcalData(res.data);
    } catch {
      setGcalData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGcalStatus(); }, [fetchGcalStatus]);

  const gcalStatus = gcalData?.googleCalendarSyncStatus?.status || 'disconnected';

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
            <GoogleCalendarCard gcalData={gcalData} onRefresh={fetchGcalStatus} />
          )}

          {/* Hint text below card */}
          {!loading && gcalStatus === 'connected' && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-600 font-bold">
                Your appointments will appear in Google Calendar automatically
              </span>
            </div>
          )}
          {!loading && gcalStatus === 'disconnected' && (
            <p className="text-[10px] text-gray-400 font-medium mt-3 px-1">
              Connect once — stays connected until you choose to disconnect
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;