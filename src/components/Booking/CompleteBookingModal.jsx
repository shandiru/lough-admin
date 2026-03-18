import { useState } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateStatus } from '../../api/bookingService';
import { INPUT_CLS } from './constants';

export default function CompleteBookingModal({ booking, onClose, onDone }) {
  const balanceDue  = booking.balanceRemaining > 0 ? (booking.balanceRemaining / 100).toFixed(2) : '0.00';
  const hasBalance  = booking.balanceRemaining > 0;

  const [balanceReceived, setBalanceReceived] = useState(hasBalance ? balanceDue : '');
  const [noBalance, setNoBalance]             = useState(!hasBalance);
  const [loading, setLoading]                 = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const amount = noBalance ? 0 : (balanceReceived ? parseFloat(balanceReceived) : 0);
      await updateStatus(booking._id, 'completed', amount);
      toast.success(
        'Booking marked as completed' + (amount > 0 ? ` · £${amount.toFixed(2)} balance recorded` : '')
      );
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> Complete Booking
            </h3>
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
              <p className="text-xs text-gray-400 mb-0.5">Total</p>
              <p className="font-bold text-gray-800">£{(booking.totalAmount / 100).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Already Paid</p>
              <p className="font-bold text-[#22B8C8]">£{(booking.paidAmount / 100).toFixed(2)}</p>
            </div>
            <div className={`rounded-xl p-3 ${hasBalance ? 'bg-amber-50' : 'bg-green-50'}`}>
              <p className="text-xs text-gray-400 mb-0.5">Balance Due</p>
              <p className={`font-bold ${hasBalance ? 'text-amber-600' : 'text-green-600'}`}>
                {hasBalance ? `£${balanceDue}` : 'Fully Paid ✓'}
              </p>
            </div>
          </div>

          {hasBalance ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Balance Received In-Person
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                  <input
                    type="number"
                    value={noBalance ? '' : balanceReceived}
                    onChange={e => { setBalanceReceived(e.target.value); setNoBalance(false); }}
                    disabled={noBalance}
                    min="0"
                    max={balanceDue}
                    step="0.01"
                    placeholder={`0.00 – ${balanceDue}`}
                    className={INPUT_CLS + ' pl-7 ' + (noBalance ? 'opacity-40' : '')}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noBalance}
                  onChange={e => { setNoBalance(e.target.checked); if (e.target.checked) setBalanceReceived(''); }}
                  className="w-4 h-4 rounded accent-[#22B8C8]"
                />
                <span className="text-sm text-gray-600">
                  No balance collected (waived / cash handled separately)
                </span>
              </label>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 size={15} /> This booking is already fully paid — no balance to collect.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white bg-green-500 hover:bg-green-600 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Confirm Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
