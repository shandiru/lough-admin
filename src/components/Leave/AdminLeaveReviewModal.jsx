import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const TYPE_EMOJI = { sick: '🤒', vacation: '🏖️', training: '📚', other: '📋' };

const AdminLeaveReviewModal = ({ leave, onClose, onReviewed }) => {
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading]     = useState(false);

  const staff = leave?.staffId?.userId;

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

  const days = Math.ceil((new Date(leave?.endDate) - new Date(leave?.startDate)) / 86400000) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-gray-900 mb-1">Review Leave Request</h2>
        <p className="text-xs text-gray-500 mb-6">Approve or reject this staff leave request</p>

        {/* Staff info */}
        <div className="bg-[#F5EDE4] rounded-2xl p-4 mb-5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-black">
              {staff?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-800">{staff?.firstName} {staff?.lastName}</p>
              <p className="text-xs text-gray-400">{staff?.email}</p>
            </div>
          </div>
          <div className="mt-1 text-sm text-gray-700 flex flex-col gap-1">
            <span><strong>Type:</strong> {TYPE_EMOJI[leave?.type]} {leave?.type?.charAt(0).toUpperCase() + leave?.type?.slice(1)}</span>
            <span><strong>Duration:</strong> {days} day{days > 1 ? 's' : ''}</span>
            <span><strong>From:</strong> {new Date(leave?.startDate).toDateString()}</span>
            <span><strong>To:</strong>   {new Date(leave?.endDate).toDateString()}</span>
            {leave?.reason && <span><strong>Reason:</strong> {leave.reason}</span>}
          </div>
        </div>

        {/* Admin note */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
            Note to Staff (sent via email)
          </label>
          <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
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