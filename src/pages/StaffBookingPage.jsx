import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2,
  Clock, Search, List, Calendar, X, User, Phone,
  MapPin, StickyNote, CheckCircle2, AlertCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../api/axiosInstance';

const TEAL = '#22B8C8';

function isoDate(d) { return d instanceof Date ? d.toISOString().split('T')[0] : new Date(d).toISOString().split('T')[0]; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fromMins(m) { return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`; }
function toMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

const statusCls = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  'no-show': 'bg-gray-100 text-gray-500 border-gray-200',
};

// ── Booking Detail Drawer ─────────────────────────────────────────────────────
function BookingDrawer({ booking, onClose }) {
  const svc = booking.service;
  const endTime = svc ? fromMins(toMins(booking.bookingTime) + svc.duration) : '';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <div>
            <p className="font-mono text-xs text-[#22B8C8] font-bold">{booking.bookingNumber}</p>
            <p className="font-bold text-gray-800">{booking.customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold capitalize border ${statusCls[booking.status] || 'bg-gray-100 text-gray-500'}`}>
            {booking.status}
          </span>

          {/* Appointment */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Appointment</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Service', svc?.name],
                ['Date', new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Time', booking.bookingTime + (endTime ? ` – ${endTime}` : '')],
                ['Duration', `${svc?.duration || booking.duration || '—'} min`],
              ].map(([l, v]) => v && (
                <div key={l} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="font-semibold text-gray-800 text-xs capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Customer</p>
            <div className="space-y-2 text-sm">
              {[
                ['Email', booking.customerEmail],
                ['Phone', booking.customerPhone],
                ['Gender', booking.customerGender],
                ['Address', booking.customerAddress],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium text-gray-700 capitalize">{v}</span>
                </div>
              ))}
              {booking.customerNotes && (
                <div className="bg-amber-50 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-amber-600 mb-1">Customer Notes</p>
                  <p className="text-xs text-gray-700">{booking.customerNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Payment</p>
            <div className="bg-[#f0fafa] rounded-2xl p-4 space-y-2 text-sm">
              {[
                ['Total', `£${((booking.totalAmount || 0) / 100).toFixed(2)}`],
                ['Paid', `£${((booking.paidAmount || 0) / 100).toFixed(2)}`],
                ['Type', booking.paymentType],
                ['Status', booking.paymentStatus],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-semibold text-gray-800 capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function StaffCalendarView({ bookings, onSelectBooking }) {
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const d = new Date(currentDate), day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [currentDate, viewMode]);

  const navigate = (dir) => { const step = viewMode === 'day' ? 1 : 7; setCurrentDate(d => addDays(d, dir * step)); };
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = isoDate(new Date());

  const startDate = isoDate(days[0]);
  const endDate = isoDate(days[days.length - 1]);

  const bookingsByDay = useMemo(() => {
    const m = {}; days.forEach(d => { m[isoDate(d)] = []; });
    bookings.filter(b => b.status !== 'cancelled').forEach(b => {
      const ds = isoDate(new Date(b.bookingDate));
      if (m[ds]) m[ds].push(b);
    });
    return m;
  }, [bookings, days]);

  const getTop = (time) => { const [h, min] = time.split(':').map(Number); return ((h - 8) * 60 + min) / (12 * 60) * 100; };
  const getHeight = (dur) => Math.max((dur / (12 * 60)) * 100, 2.5);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day', 'week'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === m ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-[#22B8C8] px-3 py-1.5 hover:bg-[#22B8C8]/10 rounded-lg transition-colors">Today</button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
        </div>
        <span className="text-sm font-bold text-gray-700">
          {viewMode === 'day'
            ? currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
            : `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
        <div className="flex min-w-[500px]">
          {/* Time col */}
          <div className="w-14 shrink-0 border-r border-gray-100 pt-10">
            {HOURS.map(h => (
              <div key={h} className="h-16 border-t border-gray-50 flex items-start px-2 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Day cols */}
          {days.map(day => {
            const ds = isoDate(day);
            const isToday = ds === todayStr;
            const dayBookings = bookingsByDay[ds] || [];
            return (
              <div key={ds} className="flex-1 min-w-[80px] border-r border-gray-100 last:border-r-0">
                <div className={`h-10 flex flex-col items-center justify-center border-b border-gray-100 sticky top-0 z-10 ${isToday ? 'bg-[#22B8C8]/10' : 'bg-white'}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}</span>
                  <span className={`text-sm font-black ${isToday ? 'text-[#22B8C8]' : 'text-gray-700'}`}>{day.getDate()}</span>
                </div>
                <div className="relative" style={{ height: `${13 * 4}rem` }}>
                  {HOURS.map(h => <div key={h} className="absolute w-full border-t border-gray-50" style={{ top: `${((h - 8) / 12) * 100}%` }} />)}
                  {dayBookings.map((b, idx) => {
                    const dur = b.service?.duration || b.duration || 60;
                    const top = getTop(b.bookingTime);
                    const height = getHeight(dur);
                    return (
                      <div key={b._id || idx}
                        onClick={() => onSelectBooking(b)}
                        className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-white overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-md transition-all"
                        style={{ top: `${top}%`, height: `${height}%`, minHeight: 20, backgroundColor: TEAL }}>
                        <p className="text-[9px] font-black truncate leading-tight">{b.service?.name || 'Booking'}</p>
                        <p className="text-[8px] truncate opacity-80">{b.customerName}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-gray-100 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#22B8C8]" />
        <span className="text-[10px] text-gray-500">My Bookings</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffBookingPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axiosInstance.get('/bookings/my');
      setBookings(Array.isArray(r.data) ? r.data : []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    if (search) {
      const q = search.toLowerCase();
      if (!b.customerName?.toLowerCase().includes(q) &&
          !b.customerEmail?.toLowerCase().includes(q) &&
          !b.bookingNumber?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#F5E6DA] overflow-hidden">
      <Sidebar />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600, fontSize: 13 } }} />
      <main className="flex-1 overflow-auto">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Bookings</h1>
            <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total · {filtered.length} shown</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={13} /> List
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar size={13} /> Calendar
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {viewMode === 'calendar' ? (
            <StaffCalendarView bookings={bookings} onSelectBooking={b => setSelected(b)} />
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, email, booking #..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#22B8C8] focus:ring-2 focus:ring-[#22B8C8]/10 bg-white" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#22B8C8] font-medium">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#22B8C8]" /></div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Booking #', 'Customer', 'Service', 'Date & Time', 'Duration', 'Status', 'Payment', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No bookings found</td></tr>
                        ) : filtered.map(b => (
                          <tr key={b._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs font-bold text-[#22B8C8]">{b.bookingNumber}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800">{b.customerName}</p>
                              <p className="text-xs text-gray-400">{b.customerEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{b.service?.name || '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-gray-700 font-medium">{new Date(b.bookingDate).toLocaleDateString('en-GB')}</p>
                              <p className="text-xs text-gray-400">{b.bookingTime}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{b.service?.duration || b.duration || '—'} min</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${statusCls[b.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold ${b.paymentStatus === 'paid' ? 'text-green-500' : b.paymentStatus === 'refunded' ? 'text-blue-500' : 'text-amber-500'}`}>
                                {b.paymentStatus === 'paid' ? `£${((b.paidAmount || 0) / 100).toFixed(2)} paid` : b.paymentStatus || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <ChevronRight size={11} className="text-gray-400" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selected && <BookingDrawer booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
