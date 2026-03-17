import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { getAllBookings } from '../../api/bookingService';
import { staffService } from '../../api/staffService';
import { serviceApi } from '../../api/serviceApi';
import {
  CalendarCheck, Users, TrendingUp, Clock, AlertTriangle,
  CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw,
  Star, Briefcase, DollarSign, Calendar, UserCheck, UserX,
} from 'lucide-react';

const BRAND = '#22B8C8';
const GOLD  = '#C9AF94';

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

function toMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fromMins(m) { return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`; }

const statusCls = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  'no-show': 'bg-gray-100 text-gray-500',
};

function StatCard({ icon: Icon, label, value, sub, color = BRAND, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} transition-all`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {onClick && <ArrowRight size={14} className="text-gray-300" />}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-sm font-semibold text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function BookingRow({ booking }) {
  const svc = booking.service;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        booking.status === 'completed' ? 'bg-green-400' :
        booking.status === 'cancelled' ? 'bg-red-400' :
        booking.status === 'confirmed' ? 'bg-blue-400' : 'bg-yellow-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{booking.customerName}</p>
        <p className="text-xs text-gray-400 truncate">{svc?.name} · {booking.bookingTime}</p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusCls[booking.status] || 'bg-gray-100 text-gray-500'}`}>
          {booking.status}
        </span>
        <p className="text-xs text-gray-400 mt-0.5">£{((booking.totalAmount || 0) / 100).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [bRes, stRes, sRes] = await Promise.all([
        getAllBookings(),
        staffService.getAll(),
        serviceApi.getAll(),
      ]);
      setBookings(Array.isArray(bRes) ? bRes : bRes.data || []);
      const stData = stRes.data || stRes || [];
      setStaffList(Array.isArray(stData) ? stData : []);
      setServices(sRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.bookingDate).toISOString().split('T')[0];
    return d === todayStr && b.status !== 'cancelled';
  });

  const pendingCancelCount = bookings.filter(b => b.cancelRequestStatus === 'pending').length;
  const pendingBookings    = bookings.filter(b => b.status === 'pending');
  const confirmedBookings  = bookings.filter(b => b.status === 'confirmed');
  const completedBookings  = bookings.filter(b => b.status === 'completed');
  const cancelledBookings  = bookings.filter(b => b.status === 'cancelled');

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + (b.paidAmount || 0), 0);

  const totalRefunded = bookings.reduce((s, b) => s + (b.refundAmount || 0), 0);

  const now = new Date();
  const monthRevenue = bookings
    .filter(b => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status !== 'cancelled';
    })
    .reduce((s, b) => s + (b.paidAmount || 0), 0);

  const activeStaff    = staffList.filter(s => s.userId?.isActive).length;
  const pendingStaff   = staffList.filter(s => !s.userId?.isActive).length;
  const activeServices = services.filter(s => s.isActive).length;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate))
    .slice(0, 8);

  const upcomingToday = [...todayBookings]
    .sort((a, b) => toMins(a.bookingTime) - toMins(b.bookingTime));

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5E6DA]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#22B8C8]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5E6DA] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">

        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22B8C8] text-white text-[10px] font-bold uppercase tracking-widest">
                Administrator
              </span>
            </div>
            <h1 className="text-xl font-black text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#22B8C8] px-3 py-2 rounded-xl hover:bg-[#22B8C8]/10 transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* Alert: pending cancel requests */}
          {pendingCancelCount > 0 && (
            <div
              onClick={() => navigate('/bookings')}
              className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:border-orange-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-orange-700 text-sm">
                    {pendingCancelCount} Cancellation Request{pendingCancelCount > 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-xs text-orange-500 mt-0.5">Click to review and take action</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-orange-400" />
            </div>
          )}

          {/* Stat Grid */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={CalendarCheck} label="Today's Bookings"
                value={todayBookings.length} sub={`${upcomingToday.length} upcoming`}
                color={BRAND} onClick={() => navigate('/bookings')}
              />
              <StatCard
                icon={TrendingUp} label="This Month Revenue"
                value={`£${(monthRevenue / 100).toFixed(0)}`} sub={`£${(totalRevenue / 100).toFixed(0)} all time`}
                color="#10b981"
              />
              <StatCard
                icon={Users} label="Staff"
                value={staffList.length} sub={`${activeStaff} active · ${pendingStaff} pending`}
                color={GOLD} onClick={() => navigate('/staff')}
              />
              <StatCard
                icon={Briefcase} label="Active Services"
                value={activeServices} sub={`${services.length} total`}
                color="#a78bfa" onClick={() => navigate('/services')}
              />
            </div>
          </div>

          {/* Booking Status Breakdown */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Booking Status Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pending',   count: pendingBookings.length,   icon: Clock,        color: '#f59e0b', bg: 'bg-yellow-50' },
                { label: 'Confirmed', count: confirmedBookings.length,  icon: CheckCircle2, color: '#3b82f6', bg: 'bg-blue-50'   },
                { label: 'Completed', count: completedBookings.length,  icon: Star,         color: '#10b981', bg: 'bg-green-50'  },
                { label: 'Cancelled', count: cancelledBookings.length,  icon: XCircle,      color: '#ef4444', bg: 'bg-red-50'    },
              ].map(({ label, count, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
                  <Icon size={18} style={{ color }} />
                  <div>
                    <p className="text-xl font-black text-gray-800">{count}</p>
                    <p className="text-xs font-semibold text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#22B8C8]" />
                  <p className="font-bold text-gray-700 text-sm">Today's Schedule</p>
                </div>
                <span className="text-xs font-bold text-gray-400">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="p-5">
                {upcomingToday.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarCheck size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No bookings today</p>
                  </div>
                ) : (
                  <div>
                    {upcomingToday.map(b => {
                      const svc = b.service;
                      const endTime = svc ? fromMins(toMins(b.bookingTime) + svc.duration) : '';
                      const staff = b.staffMember?.userId;
                      return (
                        <div key={b._id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                          <div className="text-center w-14 shrink-0">
                            <p className="text-xs font-black text-[#22B8C8]">{b.bookingTime}</p>
                            {endTime && <p className="text-[10px] text-gray-400">{endTime}</p>}
                          </div>
                          <div className="w-px h-8 bg-gray-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{b.customerName}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {svc?.name}{staff && ` · ${staff.firstName}`}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${statusCls[b.status] || ''}`}>
                            {b.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full text-xs font-bold text-[#22B8C8] py-2 rounded-xl hover:bg-[#22B8C8]/5 transition-all flex items-center justify-center gap-1"
                >
                  View all bookings <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-[#C9AF94]" />
                  <p className="font-bold text-gray-700 text-sm">Recent Bookings</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">Last {recentBookings.length}</span>
              </div>
              <div className="px-5 py-2">
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No bookings yet</p>
                  </div>
                ) : (
                  recentBookings.map(b => <BookingRow key={b._id} booking={b} />)
                )}
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full text-xs font-bold text-[#22B8C8] py-2 rounded-xl hover:bg-[#22B8C8]/5 transition-all flex items-center justify-center gap-1"
                >
                  View all bookings <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Revenue & Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

            {/* Revenue Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-green-500" />
                <p className="font-bold text-gray-700 text-sm">Revenue Summary</p>
              </div>
              <div className="space-y-0">
                {[
                  { label: 'Total Collected',     value: `£${(totalRevenue / 100).toFixed(2)}`,    cls: 'text-gray-800 font-black text-base' },
                  { label: 'This Month',           value: `£${(monthRevenue / 100).toFixed(2)}`,   cls: 'text-green-600 font-bold' },
                  { label: 'Total Refunded',       value: `£${(totalRefunded / 100).toFixed(2)}`,  cls: 'text-red-400 font-semibold' },
                  { label: 'Total Bookings',       value: bookings.length,                          cls: 'text-gray-600 font-semibold' },
                  { label: 'Completed',            value: completedBookings.length,                 cls: 'text-green-600 font-semibold' },
                  { label: 'Cancellation Rate',    value: bookings.length > 0 ? `${Math.round((cancelledBookings.length / bookings.length) * 100)}%` : '0%', cls: 'text-gray-500 font-semibold' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className={cls}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#C9AF94]" />
                  <p className="font-bold text-gray-700 text-sm">Staff</p>
                </div>
                <button
                  onClick={() => navigate('/staff')}
                  className="text-xs font-bold text-[#22B8C8] hover:underline flex items-center gap-1"
                >
                  Manage <ArrowRight size={11} />
                </button>
              </div>
              {staffList.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No staff added yet</p>
              ) : (
                <div className="space-y-3">
                  {staffList.slice(0, 6).map(s => {
                    const u = s.userId;
                    const initials = u ? `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() : '?';
                    const profileImage = getImageUrl(u?.profileImage);
                    const isActive = u?.isActive;
                    return (
                      <div key={s._id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22B8C8] to-[#C9AF94] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                          {profileImage
                            ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
                            : initials
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {u ? `${u.firstName} ${u.lastName}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">{s.services?.length || 0} service{s.services?.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {isActive ? <UserCheck size={10} /> : <UserX size={10} />}
                          {isActive ? 'Active' : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                  {staffList.length > 6 && (
                    <p className="text-xs text-gray-400 text-center pt-1">+{staffList.length - 6} more</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
