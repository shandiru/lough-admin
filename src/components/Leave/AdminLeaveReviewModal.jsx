import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

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

const AdminLeaveReviewModal = ({ leave, onClose, onReviewed }) => {
  const [adminNote, setAdminNote] = useState('');
  const [loading,   setLoading]   = useState(false);

  const staff    = leave?.staffId?.userId;
  const duration = getDuration(leave);
  const profileImage = getImageUrl(staff?.profileImage);
  const initials = `${staff?.firstName?.[0] ?? ''}${staff?.lastName?.[0] ?? ''}`.toUpperCase();

  const handleReview = async (status) => {
    setLoading(true);
    try {
      await leaveService.review(leave._id, status, adminNote);
      toast.success(`Leave ${status}!`);
      onReviewed(leave._id, status, adminNote);
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

        <h2 className="text-xl font-black text-gray-900 mb-1">Review Leave Request</h2>
        <p className="text-xs text-gray-500 mb-6">Approve or reject this staff leave request</p>

        {/* Staff + leave info */}
        <div className="bg-[#F5EDE4] rounded-2xl p-4 mb-5 flex flex-col gap-3">
          {/* Staff avatar row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-black text-sm shrink-0 overflow-hidden">
              {profileImage
                ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div>
              <p className="font-bold text-gray-800">{staff?.firstName} {staff?.lastName}</p>
              <p className="text-xs text-gray-400">{staff?.email}</p>
            </div>
          </div>

          {/* Leave details */}
          <div className="text-sm text-gray-700 flex flex-col gap-1.5">
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
            {duration && (
              <span><strong>Duration:</strong> {duration}</span>
            )}

            {/* Date / time */}
            {leave.isHourly ? (
              <>
                <span><strong>Date:</strong> {new Date(leave.startDate).toDateString()}</span>
                <span><strong>Time:</strong> {leave.startTime} – {leave.endTime}</span>
              </>
            ) : (
              <>
                <span><strong>From:</strong> {new Date(leave.startDate).toDateString()}</span>
                <span><strong>To:</strong> {new Date(leave.endDate).toDateString()}</span>
              </>
            )}

            {leave?.reason && <span><strong>Reason:</strong> {leave.reason}</span>}
          </div>
        </div>

        {/* Admin note */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
            Note to Staff (sent via email)
          </label>
          <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
            placeholder="Optional note included in the email..." rows={3} maxLength={500}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => handleReview('rejected')} disabled={loading}
            className="flex-1 border-2 border-red-400 text-red-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            Reject
          </button>
          <button onClick={() => handleReview('approved')} disabled={loading}
            className="flex-1 bg-[var(--color-brand)] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveReviewModal;