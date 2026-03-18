import { useState } from 'react';
import { X, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCancelBooking } from '../../api/bookingService';
import { INPUT_CLS } from './constants';

export default function AdminCancelModal({ booking, onClose, onDone }) {
  const [refund, setRefund]       = useState('');
  const [refundKey, setRefundKey] = useState('');
  const [reason, setReason]       = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);

  const maxRefund  = booking.paidAmount > 0 ? (booking.paidAmount / 100).toFixed(2) : '0.00';
  const hasStripe  = !!booking.stripePaymentIntentId && booking.paidAmount > 0;
  const wantsRefund = hasStripe && parseFloat(refund) > 0;

  const submit = async () => {
    setLoading(true);
    try {
      const refundPence = refund ? Math.round(parseFloat(refund) * 100) : 0;
      await adminCancelBooking(booking._id, {
        refundAmount: refundPence,
        reason,
        internalNotes: note,
        refundKey,
      });
      toast.success('Booking cancelled' + (refundPence > 0 ? ` & £${(refundPence / 100).toFixed(2)} refunded` : ''));
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Cancel Booking</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.bookingNumber} · {booking.customerName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Service</p>
              <p className="font-semibold text-gray-800">{booking.service?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {booking.bookingTime}
              </p>
            </div>
            {booking.paidAmount > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Amount Paid</p>
                <p className="font-bold text-[#22B8C8]">£{(booking.paidAmount / 100).toFixed(2)}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Payment Type</p>
              <p className="font-semibold text-gray-800 capitalize">{booking.paymentType}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Cancellation Reason
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className={INPUT_CLS + ' resize-none'}
              placeholder="Reason for cancellation..."
            />
          </div>

          {hasStripe ? (
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
              <p className="text-xs text-gray-400 mt-1">Refund will be issued via Stripe immediately</p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
              <AlertTriangle size={14} />
              {booking.paidAmount > 0
                ? 'No Stripe payment ID — cannot issue automatic refund. Handle manually if needed.'
                : 'No payment collected — cancel only.'}
            </div>
          )}

          {wantsRefund && (
            <div>
              <label className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1.5 block">
                🔑 Admin Refund Key — Required to issue refund
              </label>
              <input
                type="password"
                value={refundKey}
                onChange={e => setRefundKey(e.target.value)}
                placeholder="Enter admin refund key..."
                className={INPUT_CLS + ' border-red-200 focus:border-red-400 focus:ring-red-100'}
              />
              <p className="text-xs text-red-400 mt-1">
                This key is required before Stripe will process the refund.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Internal Note (optional)
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
              Back
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
