import React, { useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Clock, Ban, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';
import LeaveEditModal from './Leaveeditmodal';

const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={11} /> },
  approved:  { cls: 'bg-green-100 text-green-700',    icon: <CheckCircle size={11} /> },
  rejected:  { cls: 'bg-red-100 text-red-700',        icon: <XCircle size={11} /> },
  cancelled: { cls: 'bg-gray-100 text-gray-400',      icon: <Ban size={11} /> },
};

const PAGE_SIZE = 5;

// Compute human-readable duration for full-day or hourly leave
const getDuration = (leave) => {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const [sh, sm] = leave.startTime.split(':').map(Number);
    const [eh, em] = leave.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
  }
  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
  return `${days} day${days > 1 ? 's' : ''}`;
};

const MyLeaveList = ({ leaves, loading, onCancel, onUpdated, onDeleted }) => {
  const [page,      setPage]      = useState(1);
  const [editLeave, setEditLeave] = useState(null);

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Leave?',
      text: 'Are you sure you want to cancel this leave request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it',
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

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Leave?',
      text: 'This will permanently remove the leave record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No, keep it',
      reverseButtons: true,
      customClass: { popup: 'rounded-[28px] p-8' },
    });
    if (!result.isConfirmed) return;
    try {
      await leaveService.delete(id);
      toast.success('Leave deleted.');
      onDeleted(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
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

  const totalPages = Math.ceil(leaves.length / PAGE_SIZE);
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const paginated  = leaves.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col gap-3">
        {paginated.map((leave) => {
          const s          = STATUS[leave.status] || STATUS.pending;
          const duration   = getDuration(leave);
          const isPending  = leave.status === 'pending';

          return (
            <div key={leave._id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">

                {/* Top badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-800">
                    {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${s.cls}`}>
                    {s.icon} {leave.status}
                  </span>
                  {duration && (
                    <span className="text-[10px] font-black text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded-full">
                      {duration}
                    </span>
                  )}
                  {/* Hourly badge */}
                  {leave.isHourly && (
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={9} /> Hourly
                    </span>
                  )}
                </div>

                {/* Date / time range */}
                {leave.isHourly ? (
                  <p className="text-sm text-gray-500">
                    {new Date(leave.startDate).toDateString()} · {leave.startTime} – {leave.endTime}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {new Date(leave.startDate).toDateString()} → {new Date(leave.endDate).toDateString()}
                  </p>
                )}

                {leave.reason && (
                  <p className="text-xs text-gray-400 mt-0.5">"{leave.reason}"</p>
                )}
                {leave.adminNote && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">
                    <strong>Admin note:</strong> {leave.adminNote}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {isPending && (
                  <>
                    <button onClick={() => setEditLeave(leave)}
                      className="text-xs font-bold text-blue-500 border border-blue-200 rounded-xl px-4 py-2 flex items-center gap-1.5 hover:bg-blue-50 transition">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => handleCancel(leave._id)}
                      className="text-xs font-bold text-red-500 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-1.5 hover:bg-red-50 transition">
                      <X size={13} /> Cancel
                    </button>
                  </>
                )}
                {leave.status === 'cancelled' && (
                  <button onClick={() => handleDelete(leave._id)}
                    className="text-xs font-bold text-gray-400 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-1.5 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[11px] text-gray-400 font-medium">
              Showing {start + 1}–{Math.min(start + PAGE_SIZE, leaves.length)} of {leaves.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                    p === safePage
                      ? 'bg-[var(--color-brand)] text-white shadow-md'
                      : 'bg-white border border-gray-100 shadow-sm text-gray-500 hover:bg-gray-50'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editLeave && (
        <LeaveEditModal
          leave={editLeave}
          onClose={() => setEditLeave(null)}
          onUpdated={(updated) => { onUpdated(updated); setEditLeave(null); }}
        />
      )}
    </>
  );
};

export default MyLeaveList;