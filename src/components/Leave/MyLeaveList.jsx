import React from 'react';
import { X, Loader2, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import Swal from 'sweetalert2';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={11} /> },
  approved:  { cls: 'bg-green-100 text-green-700',    icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-red-100 text-red-700',        icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',      icon: <Ban size={11} /> },
};

const TYPE_EMOJI = { sick: '🤒', vacation: '🏖️', training: '📚', other: '📋' };

const MyLeaveList = ({ leaves, loading, onCancel }) => {
  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Leave?',
      text: 'Are you sure you want to cancel this leave request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel',
      reverseButtons: true,
      customClass: { popup: 'rounded-[28px] p-8' },
    });
    if (!result.isConfirmed) return;
    try {
      await leaveService.cancel(id);
      toast.success('Leave cancelled.');
      onCancel(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel.');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-[var(--color-brand)]" size={28} />
    </div>
  );

  if (!leaves.length) return (
    <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
      <Clock size={36} strokeWidth={1.2} />
      <p className="text-sm font-medium">No leave requests yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {leaves.map((leave) => {
        const s    = STATUS[leave.status] || STATUS.pending;
        const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
        return (
          <div key={leave._id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-800">
                  {TYPE_EMOJI[leave.type]} {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${s.cls}`}>
                  {s.icon} {leave.status}
                </span>
                <span className="text-[10px] font-black text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded-full">
                  {days} day{days > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(leave.startDate).toDateString()} → {new Date(leave.endDate).toDateString()}
              </p>
              {leave.reason && <p className="text-xs text-gray-400 mt-0.5">"{leave.reason}"</p>}
              {leave.adminNote && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  <strong>Admin note:</strong> {leave.adminNote}
                </p>
              )}
            </div>
            {leave.status === 'pending' && (
              <button onClick={() => handleCancel(leave._id)}
                className="text-xs font-bold text-red-500 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-1.5 hover:bg-red-50 transition">
                <X size={13} /> Cancel
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyLeaveList;