import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, CheckCircle, XCircle, Clock, Ban, RefreshCw, Search, X } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminLeaveReviewModal  from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal  from '../components/Leave/AdminLeaveToggleModal';
import { leaveService } from '../api/leaveService';

// Status styling
const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',                         icon: <Clock size={11} /> },
  approved:  { cls: 'bg-green-100 text-green-700',                           icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-[#B62025]/10 text-[#B62025]',                        icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',                             icon: <Ban size={11} /> },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

const AdminLeavePage = () => {
  const [leaves,        setLeaves]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null); // pending → review modal
  const [toggleLeave,   setToggleLeave]   = useState(null); // approved/rejected → toggle modal

  // Filters
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

  const handleRefresh = () => fetchLeaves(filter, true);

  // Called after pending review
  const handleReviewed = (leaveId, status, adminNote) => {
    setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status, adminNote } : l));
  };

  // Called after toggle (approved↔rejected)
  const handleToggled = (leaveId, status, adminNote) => {
    setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status, adminNote } : l));
  };

  const clearFilters = () => { setStaffSearch(''); setDateFrom(''); setDateTo(''); };

  const filtered = useMemo(() => {
    return leaves.filter(leave => {
      const staff    = leave.staffId?.userId;
      const fullName = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.toLowerCase();
      if (staffSearch && !fullName.includes(staffSearch.toLowerCase())) return false;
      const start = new Date(leave.startDate);
      const end   = new Date(leave.endDate);
      if (dateFrom && end   < new Date(dateFrom)) return false;
      if (dateTo   && start > new Date(dateTo))   return false;
      return true;
    });
  }, [leaves, staffSearch, dateFrom, dateTo]);

  const pendingCount    = leaves.filter(l => l.status === 'pending').length;
  const hasActiveFilters = staffSearch || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-white">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-brand" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Management</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Leave Requests</h1>
              {pendingCount > 0 && (
                <span className="bg-brand text-white text-xs font-black px-3 py-1 rounded-full">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white text-gray-600 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition disabled:opacity-60">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="w-16 h-1 bg-brand mt-3 rounded-full opacity-50" />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-2xl transition ${
                filter === f
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-white/80 shadow-sm border'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Staff Name</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search by name..." value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 placeholder:text-gray-300 font-medium outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 font-medium outline-none" />
          </div>
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">To Date</label>
            <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 font-medium outline-none" />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-[#B62025] hover:bg-red-50 px-3 py-2.5 rounded-xl transition">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {hasActiveFilters && !loading && (
          <p className="text-xs text-gray-400 font-medium mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Leaves Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white/60 rounded-2xl h-44 animate-pulse border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3 text-gray-400">
            <CalendarDays size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">No leave requests found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(leave => {
              const staff        = leave.staffId?.userId;
              const s            = STATUS[leave.status] || STATUS.pending;
              const days         = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
              const profileImage = getImageUrl(staff?.profileImage);
              const initials     = `${staff?.firstName?.[0] ?? ''}${staff?.lastName?.[0] ?? ''}`.toUpperCase();

              return (
                <div key={leave._id}
                  className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition">

                  {/* Profile + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs overflow-hidden border-2 border-white shadow-sm">
                        {profileImage
                          ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {staff?.firstName} {staff?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{staff?.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm ${s.cls}`}>
                      {s.icon} {leave.status}
                    </span>
                  </div>

                  {/* Leave Details */}
                  <div className="bg-[#F5EDE4] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                      </span>
                      <span className="text-[10px] font-black text-brand bg-white px-2 py-0.5 rounded-full">
                        {days} day{days > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {new Date(leave.startDate).toLocaleDateString('en-GB')} — {new Date(leave.endDate).toLocaleDateString('en-GB')}
                    </p>
                    {leave.reason && (
                      <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 italic">"{leave.reason}"</p>
                    )}
                  </div>

                  {leave.adminNote && (
                    <div className="px-1 border-l-2 border-brand/20">
                      <p className="text-[10px] text-gray-400 italic leading-relaxed">
                        <strong className="text-gray-500">Note:</strong> {leave.adminNote}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto flex flex-col gap-2">
                    {/* Pending → Review */}
                    {leave.status === 'pending' && (
                      <button onClick={() => setSelectedLeave(leave)}
                        className="w-full bg-brand text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand/20">
                        Review Request
                      </button>
                    )}

                    {/* Approved → can reject (toggle) */}
                    {leave.status === 'approved' && (
                      <button onClick={() => setToggleLeave(leave)}
                        className="w-full border-2 border-red-300 text-red-500 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-1.5">
                        <XCircle size={13} /> Reject This Leave
                      </button>
                    )}

                    {/* Rejected → can approve (toggle) */}
                    {leave.status === 'rejected' && (
                      <button onClick={() => setToggleLeave(leave)}
                        className="w-full border-2 border-green-300 text-green-600 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-1.5">
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

      {/* Pending → Review modal */}
      {selectedLeave && (
        <AdminLeaveReviewModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onReviewed={handleReviewed}
        />
      )}

      {/* Approved/Rejected → Toggle modal */}
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