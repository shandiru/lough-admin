import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, Loader2, CalendarCheck, Clock, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { googleCalendarApi } from '../../api/googleCalendar';
import GoogleCalendarCard from '../../components/Google/GoogleCalendarCard';
import axiosInstance from '../../api/axiosInstance';

function isoDate(d) { return d instanceof Date ? d.toISOString().split('T')[0] : new Date(d).toISOString().split('T')[0]; }

function StatCard({ icon: Icon, label, value, color = '#22B8C8' }) {
  return (
    <div className="bg-white rounded-[24px] border border-white shadow-lg p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TodayAppointments() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayStr = isoDate(new Date());

  useEffect(() => {
    axiosInstance.get('/bookings/staff/my')
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        const today = all
          .filter(b => isoDate(new Date(b.bookingDate)) === todayStr && b.status !== 'cancelled')
          .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
        setBookings(today);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    'no-show': 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="bg-white rounded-[28px] border border-white shadow-xl overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck size={16} className="text-[#22B8C8]" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">Today's Appointments</span>
        </div>
        <span className="text-xs font-bold text-gray-400">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-[#22B8C8]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <CalendarDays size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-400">No appointments today</p>
          <p className="text-xs text-gray-300 mt-1">Enjoy your free day!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {bookings.map(b => (
            <div key={b._id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#22B8C8]/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#22B8C8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{b.customerName}</p>
                <p className="text-xs text-gray-400 truncate">{b.service?.name || '—'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-gray-700">{b.bookingTime}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[b.status] || 'bg-gray-100 text-gray-500'}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const StaffDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0, upcoming: 0 });

  useEffect(() => {
    const checkStatus = async () => {
      try { setIsConnected(await googleCalendarApi.getStatus()); }
      catch { setIsConnected(false); }
      finally { setLoading(false); }
    };

    const gcal = searchParams.get('gcal');
    const expected = searchParams.get('expected');
    const got = searchParams.get('got');

    if (gcal) {
      if (gcal === 'success') toast.success('Google Calendar connected successfully!');
      if (gcal === 'denied') toast.error('Google access denied.');
      if (gcal === 'error') toast.error('Connection failed. Please try again.');
      if (gcal === 'wrong_account') {
        Swal.fire({
          title: '<span style="color:#1a1a1a;font-size:20px;font-weight:900">Wrong Google Account</span>',
          html: `<div style="text-align:left;font-family:sans-serif;line-height:1.7;color:#555;font-size:14px"><p style="margin-bottom:16px">You signed in with a <strong>different Google account</strong> than your staff login email.</p><div style="background:#FEF3C7;border-radius:12px;padding:14px 16px;margin-bottom:16px"><p style="margin:0 0 6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#92400e">Expected</p><p style="margin:0;font-weight:700;color:#1a1a1a">${decodeURIComponent(expected || '')}</p></div><div style="background:#FEE2E2;border-radius:12px;padding:14px 16px"><p style="margin:0 0 6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#991b1b">You Used</p><p style="margin:0;font-weight:700;color:#1a1a1a">${decodeURIComponent(got || '')}</p></div><p style="margin-top:16px;color:#888;font-size:13px">Please sign in with your staff email Google account to connect.</p></div>`,
          icon: 'warning', confirmButtonText: 'Try Again', confirmButtonColor: '#22B8C8',
          customClass: { popup: 'rounded-[28px]', confirmButton: 'rounded-xl px-8 py-3 font-black text-xs tracking-widest' },
        });
      }
      searchParams.delete('gcal'); searchParams.delete('expected'); searchParams.delete('got');
      setSearchParams(searchParams);
    }

    checkStatus();

    axiosInstance.get('/bookings/staff/my')
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        const todayStr = isoDate(new Date());
        const todayCount = all.filter(b => isoDate(new Date(b.bookingDate)) === todayStr && b.status !== 'cancelled').length;
        const upcomingCount = all.filter(b => isoDate(new Date(b.bookingDate)) >= todayStr && b.status !== 'cancelled').length;
        setStats({ total: all.length, today: todayCount, upcoming: upcomingCount });
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    try { const url = await googleCalendarApi.getAuthUrl(); window.location.href = url; }
    catch { toast.error('Could not start Google sign-in.'); setActionLoading(false); }
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Appointments will stop syncing to your Google Calendar.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, disconnect!', reverseButtons: true, customClass: { popup: 'rounded-[28px] p-8' } });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await googleCalendarApi.disconnect();
      setIsConnected(false);
      Swal.fire({ title: 'Unlinked!', text: 'Google Calendar disconnected.', icon: 'success', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[28px]' } });
    }
    catch { toast.error('Failed to disconnect.'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold uppercase tracking-widest">Staff</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">Welcome, {user?.name}</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={CalendarCheck} label="Today's Appointments" value={stats.today} color="#22B8C8" />
          <StatCard icon={TrendingUp} label="Upcoming" value={stats.upcoming} color="#C9AF94" />
          <StatCard icon={CalendarDays} label="Total Bookings" value={stats.total} color="#a78bfa" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Today's Appointments */}
          <div className="xl:col-span-2">
            <TodayAppointments />
          </div>

          {/* Google Calendar card */}
          <div>
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
              <GoogleCalendarCard isConnected={isConnected} onConnect={handleConnect} onDisconnect={handleDisconnect} processing={actionLoading} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;