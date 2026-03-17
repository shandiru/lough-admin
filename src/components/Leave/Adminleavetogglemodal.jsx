import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

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

/**
 * Toggle an already-reviewed leave:
 *   approved → rejected  (reason required)
 *   rejected → approved  (reason required)
 */
const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

const AdminLeaveToggleModal = ({ leave, onClose, onReviewed }) => {
  const [adminNote, setAdminNote] = useState(leave.adminNote || '');
  const [loading,   setLoading]   = useState(false);

  const staff        = leave?.staffId?.userId;
  const profileImage = getImageUrl(staff?.profileImage);
  const initials     = `${staff?.firstName?.[0] ?? ''}${staff?.lastName?.[0] ?? ''}`.toUpperCase();
  const isApproved   = leave.status === 'approved';
  const targetStatus = isApproved ? 'rejected' : 'approved';
  const actionLabel  = isApproved ? 'Reject' : 'Approve';
  const actionColor  = isApproved
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-[var(--color-brand)] hover:opacity-90 text-white';

  const duration = getDuration(leave);

  const handleToggle = async () => {
    if (!adminNote.trim()) return toast.error('Please provide a reason for this change.');
    setLoading(true);
    try {
      await leaveService.review(leave._id, targetStatus, adminNote);
      toast.success(`Leave ${targetStatus}!`);
      onReviewed(leave._id, targetStatus, adminNote);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isApproved ? 'bg-red-100' : 'bg-green-100'}`}>
            {isApproved
              ? <XCircle size={20} className="text-red-500" />
              : <CheckCircle size={20} className="text-green-600" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {isApproved ? 'Reject Approved Leave' : 'Approve Rejected Leave'}
            </h2>
            <p className="text-xs text-gray-500">
              Current status: <span className={`font-bold ${isApproved ? 'text-green-600' : 'text-red-500'}`}>{leave.status}</span>
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mt-4 mb-5">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            You are changing a <strong>{leave.status}</strong> leave to <strong>{targetStatus}</strong>.
            A reason is required — it will be sent to the staff member.
          </p>
        </div>

        {/* Staff + leave info */}
        <div className="bg-[#F5EDE4] rounded-2xl p-4 mb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-black text-sm shrink-0 overflow-hidden">
              {profileImage
                ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{staff?.firstName} {staff?.lastName}</p>
              <p className="text-[10px] text-gray-400">{staff?.email}</p>
            </div>
          </div>

          <div className="text-xs text-gray-600 flex flex-col gap-1">
            {/* Type + hourly badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <strong>Type:</strong> {leave?.type?.charAt(0).toUpperCase() + leave?.type?.slice(1)} Leave
              </span>
              {leave.isHourly && (
                <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={9} /> Hourly
                </span>
              )}
            </div>

            {/* Duration */}
            {duration && <span><strong>Duration:</strong> {duration}</span>}

            {/* Date / time */}
            {leave.isHourly ? (
              <>
                <span><strong>Date:</strong> {new Date(leave.startDate).toDateString()}</span>
                <span><strong>Time:</strong> {leave.startTime} – {leave.endTime}</span>
              </>
            ) : (
              <span>
                <strong>Dates:</strong> {new Date(leave.startDate).toDateString()} → {new Date(leave.endDate).toDateString()}
              </span>
            )}

            {leave?.reason && <span><strong>Staff Reason:</strong> {leave.reason}</span>}
          </div>
        </div>

        {/* Reason input */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
            Reason for Change <span className="text-red-400">*</span>
          </label>
          <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
            placeholder={isApproved
              ? 'Explain why this approved leave is being rejected...'
              : 'Explain why this rejected leave is now being approved...'}
            rows={3} maxLength={500}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none" />
          <p className="text-[10px] text-gray-400 mt-1">{adminNote.length}/500 characters</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-50 transition">
            Keep {leave.status}
          </button>
          <button onClick={handleToggle} disabled={loading || !adminNote.trim()}
            className={`flex-1 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50 ${actionColor}`}>
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : isApproved ? <XCircle size={15} /> : <CheckCircle size={15} />}
            {loading ? 'Processing...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveToggleModal;