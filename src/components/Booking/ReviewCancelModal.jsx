import { useState } from 'react';
import { X, XCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewCancelRequest } from '../../api/bookingService';
import { INPUT_CLS } from './constants';

export default function ReviewCancelModal({ booking, onClose, onDone }) {
  const [action, setAction]   = useState('approve');
  const [refund, setRefund]   = useState('');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);

  const maxRefund = (booking.paidAmount / 100).toFixed(2);
  const hasStripe = !!booking.stripePaymentIntentId;

  const submit = async () => {
    setLoading(true);
    try {
      const refundPence = action === 'approve' && refund ? Math.round(parseFloat(refund) * 100) : 0;
      await reviewCancelRequest(booking._id, { action, refundAmount: refundPence, adminNote: note });
      toast.success(
        action === 'approve'
          ? 'Booking cancelled' + (refundPence ? ' & refund issued' : '')
          : 'Request rejected'
      );
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Review Cancellation Request</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.bookingNumber} · {booking.customerName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-orange-50 rounded-2xl p-4 text-sm space-y-1.5">
            <p className="font-bold text-orange-700 text-xs uppercase tracking-wide">Customer's Request</p>
            <p className="text-gray-700">
              {booking.cancelRequestReason || <em className="text-gray-400">No reason provided</em>}
            </p>
            <p className="text-xs text-gray-400">
              Requested {new Date(booking.cancelRequestedAt).toLocaleString('en-GB')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Service</p>
              <p className="font-semibold text-gray-800">{booking.service?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Paid</p>
              <p className="font-bold text-[#22B8C8]">£{(booking.paidAmount / 100).toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Action</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAction('approve')}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  action === 'approve'
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                ✓ Approve Cancel
              </button>
              <button
                onClick={() => setAction('reject')}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  action === 'reject'
                    ? 'border-[#22B8C8] bg-[#f0fafa] text-[#22B8C8]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                ✕ Reject Request
              </button>
            </div>
          </div>

          {action === 'approve' && hasStripe && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Refund Amount (max £{maxRefund}) — leave blank for no refund
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                <input
                  type="number"
                  value={refund}
                  onChange={e => setRefund(e.target.value)}
                  min="0"
                  max={maxRefund}
                  step="0.01"
                  placeholder={`0.00 – ${maxRefund}`}
                  className={INPUT_CLS + ' pl-7'}
                />
              </div>
            </div>
          )}

          {action === 'approve' && !hasStripe && (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
              <AlertTriangle size={14} /> No Stripe payment — cancel only, no refund available.
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Admin Note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className={INPUT_CLS + ' resize-none'}
              placeholder="Internal note..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-60 transition-all ${
                action === 'approve' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#22B8C8] hover:bg-[#1a9aad]'
              }`}
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : action === 'approve'
                  ? <XCircle size={15} />
                  : <CheckCircle2 size={15} />}
              {action === 'approve' ? 'Confirm Cancellation' : 'Reject Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
