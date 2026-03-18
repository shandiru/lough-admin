import { useState } from 'react';
import { X, XCircle, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateStatus } from '../../api/bookingService';
import { INPUT_CLS, fromMins, toMins } from './constants';
import ReviewCancelModal from './ReviewCancelModal';
import AdminCancelModal from './AdminCancelModal';
import CompleteBookingModal from './CompleteBookingModal';
import RescheduleReviewModal from './RescheduleReviewModal';

export default function BookingDrawer({ booking, staffList = [], onClose, onUpdated }) {
  const [status, setStatus]         = useState(booking.status);
  const [saving, setSaving]         = useState(false);
  const [showReview, setRev]        = useState(false);
  const [showAdminCancel, setAdminCancel] = useState(false);
  const [showComplete, setShowComplete]  = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const svc     = booking.service;
  const staff   = booking.staffMember?.userId;
  const endTime = svc ? fromMins(toMins(booking.bookingTime) + svc.duration) : '';

  const saveStatus = async () => {
    if (status === 'cancelled') { setAdminCancel(true); return; }
    if (status === 'completed') { setShowComplete(true); return; }
    setSaving(true);
    try {
      await updateStatus(booking._id, status);
      toast.success('Status updated');
      onUpdated();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <div>
            <p className="font-mono text-xs text-[#22B8C8] font-bold">{booking.bookingNumber}</p>
            <p className="font-bold text-gray-800">{booking.customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {booking.cancelRequestStatus === 'pending' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-orange-700 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Cancellation Requested
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {booking.cancelRequestReason || 'No reason provided'}
                </p>
              </div>
              <button
                onClick={() => setRev(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all"
              >
                Review
              </button>
            </div>
          )}

          {booking.rescheduleRequestStatus === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-blue-700 text-sm flex items-center gap-1.5">
                  <RefreshCw size={15} /> Reschedule Requested
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {booking.rescheduleReason || 'No reason provided'}
                </p>
                {booking.rescheduleDate && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    Wants: {new Date(booking.rescheduleDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                    {booking.rescheduleTime ? ` at ${booking.rescheduleTime}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowReschedule(true)}
                className="bg-[#22B8C8] hover:bg-[#1a9aad] text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all"
              >
                Review
              </button>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Appointment</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Service', svc?.name],
                ['Date', new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Time', booking.bookingTime + (endTime ? ` – ${endTime}` : '')],
                ['Duration', `${svc?.duration || booking.duration} min`],
                ['Staff', staff ? `${staff.firstName} ${staff.lastName}` : '—'],
                ['Source', booking.bookingSource],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="font-semibold text-gray-800 text-xs capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Customer</p>
            <div className="space-y-2 text-sm">
              {[
                ['Email', booking.customerEmail],
                ['Phone', booking.customerPhone],
                ['Gender', booking.customerGender],
                ['Address', booking.customerAddress],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium text-gray-700 capitalize">{v}</span>
                </div>
              ))}
              {booking.customerNotes && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 mb-1">Customer Notes</p>
                  <p className="text-xs text-gray-700">{booking.customerNotes}</p>
                </div>
              )}
              {booking.internalNotes && (
                <div className="bg-gray-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-500 mb-1">Internal Notes</p>
                  <p className="text-xs text-gray-600 whitespace-pre-line">{booking.internalNotes}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Payment</p>
            <div className="bg-[#f0fafa] rounded-2xl p-4 space-y-2 text-sm">
              {[
                ['Total',    `£${(booking.totalAmount / 100).toFixed(2)}`],
                ['Paid',     `£${(booking.paidAmount / 100).toFixed(2)}`],
                ['Balance',  `£${(booking.balanceRemaining / 100).toFixed(2)}`],
                ['Type',     booking.paymentType],
                ['Status',   booking.paymentStatus],
                ['Refunded', booking.refundAmount > 0 ? `£${(booking.refundAmount / 100).toFixed(2)}` : null],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-semibold text-gray-800 capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {booking.status !== 'cancelled' && (
            <div>
              <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Update Status</p>
              <div className="flex gap-2">
                <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT_CLS + ' flex-1'}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancel Booking</option>
                  <option value="no-show">No Show</option>
                </select>
                <button
                  onClick={saveStatus}
                  disabled={saving || status === booking.status}
                  className={`px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40 transition-all flex items-center gap-1.5 text-white ${
                    status === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#22B8C8] hover:bg-[#1a9aad]'
                  }`}
                >
                  {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : status === 'cancelled'
                      ? <XCircle size={14} />
                      : <CheckCircle2 size={14} />}
                  {status === 'cancelled' ? 'Cancel' : 'Save'}
                </button>
              </div>
              {status === 'cancelled' && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={11} /> Clicking Cancel will open refund options
                </p>
              )}
              {status === 'completed' && (
                <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Will prompt to record any balance payment
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {showReview && (
        <ReviewCancelModal
          booking={booking}
          onClose={() => setRev(false)}
          onDone={() => { setRev(false); onClose(); onUpdated(); }}
        />
      )}
      {showAdminCancel && (
        <AdminCancelModal
          booking={booking}
          onClose={() => { setAdminCancel(false); setStatus(booking.status); }}
          onDone={() => { setAdminCancel(false); onClose(); onUpdated(); }}
        />
      )}
      {showComplete && (
        <CompleteBookingModal
          booking={booking}
          onClose={() => { setShowComplete(false); setStatus(booking.status); }}
          onDone={() => { setShowComplete(false); onClose(); onUpdated(); }}
        />
      )}
      {showReschedule && (
        <RescheduleReviewModal
          booking={booking}
          staffList={staffList}
          onClose={() => setShowReschedule(false)}
          onDone={() => { setShowReschedule(false); onClose(); onUpdated(); }}
        />
      )}
    </>
  );
}
