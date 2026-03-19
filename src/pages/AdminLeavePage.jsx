import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays, CheckCircle, XCircle, Clock, Ban,
  RefreshCw, Search, X, ChevronLeft, ChevronRight
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminLeaveReviewModal from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal from '../components/Leave/Adminleavetogglemodal';
import { leaveService } from '../api/leaveService';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',   icon: <Clock size={11} /> },
  approved:  { cls: 'bg-[#22B8C8]/10 text-[#22B8C8]', icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-red-100 text-red-500',         icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',       icon: <Ban size={11} /> },
};

const FILTERS   = ['all', 'pending', 'approved', 'rejected', 'cancelled'];
const PAGE_SIZE = 9;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const getDuration = (leave) => {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const mins = toMins(leave.endTime) - toMins(leave.startTime);
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
  }
  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
  return `${days} day${days > 1 ? 's' : ''}`;
};

const getDateRange = (leave) => {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    return `${new Date(leave.startDate).toLocaleDateString('en-GB')} · ${leave.startTime} – ${leave.endTime}`;
  }
  const s = new Date(leave.startDate).toLocaleDateString('en-GB');
  const e = new Date(leave.endDate).toLocaleDateString('en-GB');
  return s === e ? s : `${s} — ${e}`;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
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

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange, total, startIdx }) => {
  if (totalPages <= 1) return null;

  const nums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const arr = [1];
    if (page > 3) arr.push('…');
    const lo = Math.max(2, page - 1), hi = Math.min(totalPages - 1, page + 1);
    for (let i = lo; i <= hi; i++) arr.push(i);
    if (page < totalPages - 2) arr.push('…');
    arr.push(totalPages);
    return arr;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#C9AF94]/20">
      <p className="text-[11px] text-[#C9AF94] font-medium order-2 sm:order-1">
        Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, total)} of {total}
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="w-8 h-8 rounded-xl bg-white border border-[#C9AF94]/20 shadow-sm flex items-center justify-center text-[#C9AF94] hover:bg-[#F5F5F5] transition disabled:opacity-40">
          <ChevronLeft size={14} />
        </button>
        {nums().map((p, i) =>
          typeof p === 'string'
            ? <span key={`d${i}`} className="w-6 text-center text-[#C9AF94] text-xs">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                  p === page
                    ? 'bg-[#22B8C8] text-white shadow-md shadow-[#22B8C8]/30'
                    : 'bg-white border border-[#C9AF94]/20 shadow-sm text-gray-500 hover:bg-[#F5F5F5]'
                }`}>{p}</button>
        )}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-8 h-8 rounded-xl bg-white border border-[#C9AF94]/20 shadow-sm flex items-center justify-center text-[#C9AF94] hover:bg-[#F5F5F5] transition disabled:opacity-40">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminLeavePage = () => {
  const [leaves,        setLeaves]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [toggleLeave,   setToggleLeave]   = useState(null);
  const [page,          setPage]          = useState(1);

  const [staffSearch, setStaffSearch] = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  const fetchLeaves = useCallback((status, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    leaveService.getAllLeaves(status === 'all' ? '' : status)
      .then(res => setLeaves(res.data))
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { setPage(1); fetchLeaves(filter); }, [filter, fetchLeaves]);
  useEffect(() => { setPage(1); }, [staffSearch, dateFrom, dateTo]);

  const handleRefresh  = () => fetchLeaves(filter, true);
  const handleReviewed = (id, status, note) => setLeaves(p => p.map(l => l._id === id ? { ...l, status, adminNote: note } : l));
  const handleToggled  = (id, status, note) => setLeaves(p => p.map(l => l._id === id ? { ...l, status, adminNote: note } : l));
  const clearFilters   = () => { setStaffSearch(''); setDateFrom(''); setDateTo(''); };

  const filtered = useMemo(() => leaves.filter(leave => {
    const staff    = leave.staffId?.userId;
    const fullName = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.toLowerCase();
    if (staffSearch && !fullName.includes(staffSearch.toLowerCase())) return false;
    const s = new Date(leave.startDate), e = new Date(leave.endDate);
    if (dateFrom && e < new Date(dateFrom)) return false;
    if (dateTo   && s > new Date(dateTo))   return false;
    return true;
  }), [leaves, staffSearch, dateFrom, dateTo]);

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage     = Math.min(page, Math.max(1, totalPages));
  const startIdx     = (safePage - 1) * PAGE_SIZE;
  const paginated    = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const pendingCount     = leaves.filter(l => l.status === 'pending').length;
  const hasActiveFilters = staffSearch || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      {/* pt-16 on mobile for hamburger button space */}
      <main className="flex-1 p-4 pt-16 lg:pt-6 sm:p-6 lg:p-10 overflow-y-auto min-w-0">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-[#22B8C8] shrink-0" />
            <span className="text-[10px] font-black text-[#C9AF94] uppercase tracking-[3px]">Management</span>
          </div>
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Leave Requests</h1>
              {pendingCount > 0 && (
                <span className="bg-[#22B8C8] text-white text-xs font-black px-3 py-1 rounded-full shadow-md shadow-[#22B8C8]/30">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white text-gray-600 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm border border-[#C9AF94]/30 hover:bg-[#F5F5F5] transition disabled:opacity-60 self-start xs:self-auto shrink-0">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <div className="w-16 h-1 bg-[#22B8C8] mt-3 rounded-full opacity-60" />
        </div>

        {/* ── Status Tabs (scroll on mobile) ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-widest px-4 sm:px-5 py-2 rounded-2xl transition whitespace-nowrap shrink-0 ${
                filter === f
                  ? 'bg-[#22B8C8] text-white shadow-md shadow-[#22B8C8]/30'
                  : 'bg-white text-gray-500 hover:bg-white/80 shadow-sm border border-[#C9AF94]/20'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-[#C9AF94]/20">
          {/* Row 1: Staff name search */}
          <div className="mb-3">
            <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">Staff Name</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9AF94]" />
              <input
                type="text" placeholder="Search by name..." value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 placeholder:text-[#C9AF94]/60 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition"
              />
            </div>
          </div>
          {/* Row 2: Dates + Clear */}
          <div className="flex flex-col xs:flex-row gap-3 xs:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-[#C9AF94] uppercase tracking-widest block mb-1.5">To Date</label>
              <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[#22B8C8]/20 border border-transparent focus:border-[#22B8C8]/30 transition" />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:bg-red-50 px-3 py-2.5 rounded-xl transition whitespace-nowrap self-end xs:self-auto">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && !loading && (
          <p className="text-xs text-[#C9AF94] font-medium mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* ── Cards Grid ── */}
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginated.map(leave => {
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
                          <p className="font-bold text-gray-800 text-sm truncate">{staff?.firstName} {staff?.lastName}</p>
                          <p className="text-[10px] text-[#C9AF94] truncate">{staff?.email}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm ${s.cls}`}>
                        {s.icon} {leave.status}
                      </span>
                    </div>

                    {/* Leave details */}
                    <div className="bg-[#F5F5F5] rounded-xl p-3 border border-[#C9AF94]/10">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-xs font-bold text-gray-700">
                            {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                          </span>
                          {leave.isHourly && (
                            <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Clock size={9} /> Hourly
                            </span>
                          )}
                        </div>
                        {duration && (
                          <span className="text-[10px] font-black text-[#22B8C8] bg-white px-2 py-0.5 rounded-full border border-[#22B8C8]/20 shrink-0">
                            {duration}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#C9AF94] font-medium break-words">{dateRange}</p>
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

            {/* ── Pagination ── */}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              total={filtered.length}
              startIdx={startIdx}
            />
          </>
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
