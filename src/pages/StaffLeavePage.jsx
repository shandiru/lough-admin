import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, PlusCircle, RefreshCw } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import LeaveApplyModal from '../components/Leave/LeaveApplyModal';
import MyLeaveList from '../components/Leave/MyLeaveList';
import { leaveService } from '../api/leaveService';

const StaffLeavePage = () => {
  const [leaves,     setLeaves]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal,  setShowModal] = useState(false);

  const fetchLeaves = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    leaveService.getMyLeaves()
      .then(res => setLeaves(res.data))
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  // Poll every 30s to pick up admin approve/reject
  useEffect(() => {
    const interval = setInterval(() => fetchLeaves(true), 30000);
    return () => clearInterval(interval);
  }, [fetchLeaves]);

  const handleRefresh = () => fetchLeaves(true);

  // New leave submitted
  const onNewLeave = (leave) => setLeaves(prev => [leave, ...prev]);

  // Pending leave cancelled → mark as cancelled
  const onCancel = (id) =>
    setLeaves(prev => prev.map(l => l._id === id ? { ...l, status: 'cancelled' } : l));

  // Pending leave edited → replace record
  const onUpdated = (updated) =>
    setLeaves(prev => prev.map(l => l._id === updated._id ? updated : l));

  // Any leave deleted → remove from list
  const onDeleted = (id) =>
    setLeaves(prev => prev.filter(l => l._id !== id));

  // Stats
  const total    = leaves.length;
  const pending  = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-[var(--color-brand)]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">My Leaves</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Leave Requests</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white text-gray-600 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition disabled:opacity-60">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[var(--color-brand)] text-white text-sm font-bold px-5 py-2.5 rounded-2xl hover:opacity-90 transition shadow-md">
                <PlusCircle size={16} /> Apply for Leave
              </button>
            </div>
          </div>
          <div className="w-16 h-1 bg-[var(--color-brand)] mt-3 rounded-full opacity-50" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',    value: total,    bg: 'bg-white' },
            { label: 'Pending',  value: pending,  bg: 'bg-yellow-50' },
            { label: 'Approved', value: approved, bg: 'bg-green-50' },
            { label: 'Rejected', value: rejected, bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 shadow-sm border border-gray-100`}>
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Leave List */}
        <MyLeaveList
          leaves={leaves}
          loading={loading}
          onCancel={onCancel}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      </main>

      {showModal && (
        <LeaveApplyModal onClose={() => setShowModal(false)} onSuccess={onNewLeave} />
      )}
    </div>
  );
};

export default StaffLeavePage;