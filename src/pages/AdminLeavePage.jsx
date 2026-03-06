import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, CheckCircle, XCircle, Clock, Ban, RefreshCw, Search, X } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminLeaveReviewModal  from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal  from '../components/Leave/Adminleavetogglemodal';
import { leaveService } from '../api/leaveService';

const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',   icon: <Clock size={11} /> },
  approved:  { cls: 'bg-[#22B8C8]/10 text-[#22B8C8]', icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-red-100 text-red-500',         icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',       icon: <Ban size={11} /> },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** Returns human-readable duration for any leave */
const getDuration = (leave) => {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const mins = toMins(leave.endTime) - toMins(leave.startTime);
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
  }
  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
  return `${days} day${days > 1 ? 's' : ''}`;
};

/** Returns the date/time range string for a leave */
const getDateRange = (leave) => {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    return `${new Date(leave.startDate).toLocaleDateString('en-GB')} · ${leave.startTime} – ${leave.endTime}`;
  }
  const start = new Date(leave.startDate).toLocaleDateString('en-GB');
  const end   = new Date(leave.endDate).toLocaleDateString('en-GB');
  return start === end ? start : `${start} — ${end}`;
};

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} rounded-full border-4 border-[#C9AF94]/30 border-t-[#22B8C8] animate-spin`} />
  );
};

// ── Page loader ───────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center py-28 gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-[#C9AF94]/20 border-t-[#22B8C8] animate-spin" />
      <div className="absolute inset-2 rounded-full border-4 border-[#22B8C8]/20 border-b-[#C9AF94] animate-spin"
        style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#22B8C8]" />
      </div>
    </div>
    <p className="text-[11px] font-black uppercase tracking-[3px] text-[#C9AF94]">Loading...</p>
  </div>
);

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#C9AF94]/20 flex flex-col gap-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C9AF94]/20 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="w-28 h-3 bg-[#C9AF94]/20 rounded-full animate-pulse" />
          <div className="w-20 h-2.5 bg-[#C9AF94]/10 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="w-16 h-5 bg-[#22B8C8]/10 rounded-full animate-pulse" />
    </div>
    <div className="bg-[#F5F5F5] rounded-xl p-3 flex flex-col gap-2">
      <div className="w-32 h-3 bg-[#C9AF94]/20 rounded-full animate-pulse" />
      <div className="w-24 h-2.5 bg-[#C9AF94]/10 rounded-full animate-pulse" />
    </div>
    <div className="w-full h-10 bg-[#22B8C8]/10 rounded-xl animate-pulse mt-auto" />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminLeavePage = () => {
  const [leaves,        setLeaves]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [toggleLeave,   setToggleLeave]   = useState(null);

  const [staffSearch, setStaffSearch] = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  const fetchLeaves = useCallback((status, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    leaveService.getAllLeaves(status === 'all' ? '' : status)
      .then(res => setLeaves(res.data))
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchLeaves(filter); }, [filter, fetchLeaves]);

  const handleRefresh  = () => fetchLeaves(filter, true);
  const handleReviewed = (id, status, note) => setLeaves(prev => prev.map(l => l._id === id ? { ...l, status, adminNote: note } : l));
  const handleToggled  = (id, status, note) => setLeaves(prev => prev.map(l => l._id === id ? { ...l, status, adminNote: note } : l));
  const clearFilters   = () => { setStaffSearch(''); setDateFrom(''); setDateTo(''); };

  const filtered = useMemo(() => leaves.filter(leave => {
    const staff    = leave.staffId?.userId;
    const fullName = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.toLowerCase();
    if (staffSearch && !fullName.includes(staffSearch.toLowerCase())) return false;
    const start = new Date(leave.startDate);
    const end   = new Date(leave.endDate);
    if (dateFrom && end   < new Date(dateFrom)) return false;
    if (dateTo   && start > new Date(dateTo))   return false;
    return true;
  }), [leaves, staffSearch, dateFrom, dateTo]);

  const pendingCount     = leaves.filter(l => l.status === 'pending').length;
  const hasActiveFilters = staffSearch || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-[#22B8C8]" />
            <span className="text-[10px] font-black text-[#C9AF94] uppercase tracking-[3px]">Management</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Leave Requests</h1>
              {pendingCount > 0 && (
                <span className="bg-[#22B8C8] text-white text-xs font-black px-3 py-1 rounded-full shadow-md shadow-[#22B8C8]/30">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white text-gray-600 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm border border-[#C9AF94]/30 hover:bg-[#F5F5F5] transition disabled:opacity-60">
              {refreshing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="w-16 h-1 bg-[#22B8C8] mt-3 rounded-full opacity-60" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-2xl transition ${
                filter === f
                  ? 'bg-[#22B8C8] text-white shadow-md shadow-[#22B8C8]/30'
                  : 'bg-white text-gray-500 hover:bg-white/80 shadow-sm border border-[#C9AF94]/20'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-[#C9AF94]/20 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">Staff Name</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9AF94]" />
              <input type="text" placeholder="Search by name..." value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 placeholder:text-[#C9AF94]/60 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition" />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition" />
          </div>
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">To Date</label>
            <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition" />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:bg-red-50 px-3 py-2.5 rounded-xl transition">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {hasActiveFilters && !loading && (
          <p className="text-xs text-[#C9AF94] font-medium mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Cards grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3 text-[#C9AF94]">
            <CalendarDays size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">No leave requests found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(leave => {
              const staff        = leave.staffId?.userId;
              const s            = STATUS[leave.status] || STATUS.pending;
              const duration     = getDuration(leave);
              const dateRange    = getDateRange(leave);
              const profileImage = getImageUrl(staff?.profileImage);
              const initials     = `${staff?.firstName?.[0] ?? ''}${staff?.lastName?.[0] ?? ''}`.toUpperCase();

              return (
                <div key={leave._id}
                  className="bg-white rounded-[20px] p-5 shadow-sm border border-[#C9AF94]/20 flex flex-col gap-4 hover:shadow-md hover:border-[#22B8C8]/20 transition-all duration-200">

                  {/* Profile + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[#22B8C8]/20 flex items-center justify-center text-[#22B8C8] font-black text-xs overflow-hidden border-2 border-white shadow-sm">
                        {profileImage
                          ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {staff?.firstName} {staff?.lastName}
                        </p>
                        <p className="text-[10px] text-[#C9AF94] truncate">{staff?.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm ${s.cls}`}>
                      {s.icon} {leave.status}
                    </span>
                  </div>

                  {/* Leave details */}
                  <div className="bg-[#F5F5F5] rounded-xl p-3 border border-[#C9AF94]/10">
                    {/* Type + duration + hourly badge row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-700">
                          {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                        </span>
                        {/* ── Hourly badge ── */}
                        {leave.isHourly && (
                          <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={9} /> Hourly
                          </span>
                        )}
                      </div>
                      {/* Duration */}
                      {duration && (
                        <span className="text-[10px] font-black text-[#22B8C8] bg-white px-2 py-0.5 rounded-full border border-[#22B8C8]/20 shrink-0">
                          {duration}
                        </span>
                      )}
                    </div>

                    {/* Date / time range */}
                    <p className="text-[10px] text-[#C9AF94] font-medium">{dateRange}</p>

                    {leave.reason && (
                      <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 italic">"{leave.reason}"</p>
                    )}
                  </div>

                  {leave.adminNote && (
                    <div className="px-1 border-l-2 border-[#22B8C8]/30">
                      <p className="text-[10px] text-gray-400 italic leading-relaxed">
                        <strong className="text-gray-500">Note:</strong> {leave.adminNote}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-auto flex flex-col gap-2">
                    {leave.status === 'pending' && (
                      <button onClick={() => setSelectedLeave(leave)}
                        className="w-full bg-[#22B8C8] text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#1da6b5] transition shadow-lg shadow-[#22B8C8]/25">
                        Review Request
                      </button>
                    )}
                    {leave.status === 'approved' && (
                      <button onClick={() => setToggleLeave(leave)}
                        className="w-full border-2 border-red-300 text-red-500 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-1.5">
                        <XCircle size={13} /> Reject This Leave
                      </button>
                    )}
                    {leave.status === 'rejected' && (
                      <button onClick={() => setToggleLeave(leave)}
                        className="w-full border-2 border-[#22B8C8]/40 text-[#22B8C8] text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-[#22B8C8]/5 transition flex items-center justify-center gap-1.5">
                        <CheckCircle size={13} /> Approve This Leave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedLeave && (
        <AdminLeaveReviewModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onReviewed={handleReviewed}
        />
      )}

      {toggleLeave && (
        <AdminLeaveToggleModal
          leave={toggleLeave}
          onClose={() => setToggleLeave(null)}
          onReviewed={handleToggled}
        />
      )}
    </div>
  );
};

export default AdminLeavePage;