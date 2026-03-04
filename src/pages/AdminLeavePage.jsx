import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, CheckCircle, XCircle, Clock, Ban, RefreshCw, Search, X } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminLeaveReviewModal from '../components/Leave/AdminLeaveReviewModal';
import { leaveService } from '../api/leaveService';

const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={11} /> },
  approved:  { cls: 'bg-green-100 text-green-700',    icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-red-100 text-red-700',        icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',      icon: <Ban size={11} /> },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

const AdminLeavePage = () => {
  const [leaves,        setLeaves]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Local filters
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

  const handleReviewed = (leaveId, status, adminNote) => {
    setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status, adminNote } : l));
  };

  const clearFilters = () => { setStaffSearch(''); setDateFrom(''); setDateTo(''); };

  // Client-side filter: staff name + date range
  const filtered = useMemo(() => {
    return leaves.filter(leave => {
      const staff = leave.staffId?.userId;
      const fullName = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.toLowerCase();

      if (staffSearch && !fullName.includes(staffSearch.toLowerCase())) return false;

      const start = new Date(leave.startDate);
      const end   = new Date(leave.endDate);
      if (dateFrom && end   < new Date(dateFrom)) return false;
      if (dateTo   && start > new Date(dateTo))   return false;

      return true;
    });
  }, [leaves, staffSearch, dateFrom, dateTo]);

  const pendingCount   = leaves.filter(l => l.status === 'pending').length;
  const hasActiveFilters = staffSearch || dateFrom || dateTo;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA]">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-[var(--color-brand)]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Management</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Leave Requests</h1>
              {pendingCount > 0 && (
                <span className="bg-[var(--color-brand)] text-white text-xs font-black px-3 py-1 rounded-full">
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
          <div className="w-16 h-1 bg-[var(--color-brand)] mt-3 rounded-full opacity-50" />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-2xl transition ${
                filter === f
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-white/80 shadow-sm'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Search + Date filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
          {/* Staff search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Staff Name</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Search by name..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 placeholder:text-gray-300 font-medium outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
              />
            </div>
          </div>

          {/* Date from */}
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
            />
          </div>

          {/* Date to */}
          <div className="min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">To Date</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5EDE4] rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
            />
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition px-3 py-2.5 rounded-xl hover:bg-red-50">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {hasActiveFilters && !loading && (
          <p className="text-xs text-gray-400 font-medium mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Cards grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white/60 rounded-2xl h-44 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3 text-gray-400">
            <CalendarDays size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">No leave requests found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(leave => {
              const staff = leave.staffId?.userId;
              const s     = STATUS[leave.status] || STATUS.pending;
              const days  = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;

              return (
                <div key={leave._id}
                  className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition">

                  {/* Staff + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-black text-sm">
                        {staff?.firstName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {staff?.firstName} {staff?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{staff?.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${s.cls}`}>
                      {s.icon} {leave.status}
                    </span>
                  </div>

                  {/* Leave details */}
                  <div className="bg-[#F5EDE4] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                      </span>
                      <span className="text-[10px] font-black text-[var(--color-brand)] bg-white px-2 py-0.5 rounded-full">
                        {days} day{days > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(leave.startDate).toDateString()} → {new Date(leave.endDate).toDateString()}
                    </p>
                    {leave.reason && (
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">"{leave.reason}"</p>
                    )}
                  </div>

                  {leave.adminNote && (
                    <p className="text-[10px] text-gray-400 italic px-1">
                      <strong>Note:</strong> {leave.adminNote}
                    </p>
                  )}

                  {leave.status === 'pending' && (
                    <button onClick={() => setSelectedLeave(leave)}
                      className="w-full bg-[var(--color-brand)] text-white text-xs font-bold py-2.5 rounded-2xl hover:opacity-90 transition">
                      Review Request
                    </button>
                  )}
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
    </div>
  );
};

export default AdminLeavePage;