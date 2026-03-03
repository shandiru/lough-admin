import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, PlusCircle, BellRing } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import LeaveApplyModal from '../components/Leave/LeaveApplyModal';
import MyLeaveList from '../components/Leave/MyLeaveList';
import { leaveService } from '../api/leaveService';
import { useSocket } from '../hooks/useSocket';

const StaffLeavePage = () => {
  const socket = useSocket();

  const [leaves,    setLeaves]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Fetch leaves on mount
  useEffect(() => {
    leaveService.getMyLeaves()
      .then(res => setLeaves(res.data))
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false));
  }, []);

  // Real-time: admin reviewed my leave
  useEffect(() => {
    if (!socket) return;
    const handler = ({ message, status, leaveId, adminNote }) => {
      setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status, adminNote } : l));
      const approved = status === 'approved';
      toast(t => (
        <div className="flex items-start gap-3">
          <BellRing size={16} className={approved ? 'text-green-500' : 'text-red-500'} />
          <div>
            <p className="font-bold text-sm">{approved ? 'Leave Approved! 🎉' : 'Leave Rejected'}</p>
            <p className="text-xs text-gray-500">{message}</p>
            {adminNote && <p className="text-xs text-gray-400 mt-0.5">Note: {adminNote}</p>}
          </div>
        </div>
      ), { duration: 7000, style: { borderRadius: '16px', padding: '12px 16px' } });
    };
    socket.on('leave:reviewed', handler);
    return () => socket.off('leave:reviewed', handler);
  }, [socket]);

  const onNewLeave  = (leave) => setLeaves(prev => [leave, ...prev]);
  const onCancel    = (id)    => setLeaves(prev => prev.map(l => l._id === id ? { ...l, status: 'cancelled' } : l));

  // Stats
  const total    = leaves.length;
  const pending  = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5E6DA]">
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
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[var(--color-brand)] text-white text-sm font-bold px-5 py-2.5 rounded-2xl hover:opacity-90 transition shadow-md">
              <PlusCircle size={16} /> Apply for Leave
            </button>
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
        <MyLeaveList leaves={leaves} loading={loading} onCancel={onCancel} />
      </main>

      {showModal && (
        <LeaveApplyModal onClose={() => setShowModal(false)} onSuccess={onNewLeave} />
      )}
    </div>
  );
};

export default StaffLeavePage;