import { useState, useEffect } from 'react';
import {
  X, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Calendar, Clock, User, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewRescheduleRequest, getAvailableSlotsAdmin } from '../../api/bookingService';
import { INPUT_CLS, INPUT_ERR_CLS } from './constants';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MiniCalendar({ selected, onSelect }) {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(new Date(year, month - 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 text-sm font-bold">‹</button>
        <span className="text-xs font-bold text-gray-700">{MONTHS[month]} {year}</span>
        <button onClick={() => setView(new Date(year, month + 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 text-sm font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d =>
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`}/>;
          const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const cellDate = new Date(year, month, day);
          const isDisabled = cellDate < tomorrow;
          const isSel = selected === iso;
          return (
            <button key={iso} disabled={isDisabled} onClick={() => onSelect(iso)}
              className={`aspect-square rounded-lg text-xs font-medium transition-all
                ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#22B8C8]/10 cursor-pointer'}
                ${isSel ? 'bg-[#22B8C8] text-white' : 'text-gray-700'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RescheduleReviewModal({ booking, staffList = [], onClose, onDone }) {
  const [action,       setAction]       = useState('approve');
  const [adminNote,    setAdminNote]    = useState('');
  const [loading,      setLoading]      = useState(false);

  // For approve — override fields (pre-fill from customer request)
  const proposedDateStr = booking.rescheduleDate
    ? new Date(booking.rescheduleDate).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
    : '';
  const [overrideDate,  setOverrideDate]  = useState(proposedDateStr);
  const [overrideTime,  setOverrideTime]  = useState(booking.rescheduleTime || '');
  const [overrideStaff, setOverrideStaff] = useState(
    booking.rescheduleStaffMember?._id?.toString()
    || booking.rescheduleStaffMember?.toString()
    || booking.staffMember?._id?.toString()
    || ''
  );

  // Available slots when date+staff chosen
  const [slots,         setSlots]         = useState([]);
  const [loadingSlots,  setLoadingSlots]  = useState(false);

  // Cancel-specific
  const [refundAmount,  setRefundAmount]  = useState('');
  const maxRefund = (booking.paidAmount / 100).toFixed(2);
  const hasStripe = !!booking.stripePaymentIntentId;

  // Load available slots whenever date or staff changes
  useEffect(() => {
    if (action !== 'approve' || !overrideDate || !overrideStaff) { setSlots([]); return; }
    let cancelled = false;
    const fetch = async () => {
      setLoadingSlots(true);
      try {
        const data = await getAvailableSlotsAdmin(
          booking.service?._id || booking.service,
          overrideDate,
          booking.customerGender,
          booking.staffGenderPreference,
          booking._id, // exclude this booking so it doesn't block its own time slot
        );
        if (cancelled) return;
        const staffEntry = Array.isArray(data)
          ? data.find(s => s.staff?._id?.toString() === overrideStaff)
          : null;
        setSlots(staffEntry?.availableSlots || []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [overrideDate, overrideStaff, action]);

  const submit = async () => {
    if (action === 'approve' && (!overrideDate || !overrideTime))
      return toast.error('Please select a date and time to approve');

    setLoading(true);
    try {
      const payload = { action, adminNote };

      if (action === 'approve') {
        payload.newDate    = overrideDate;
        payload.newTime    = overrideTime;
        payload.newStaffId = overrideStaff;
      }

      if (action === 'cancel') {
        if (refundAmount) payload.refundAmount = Math.round(parseFloat(refundAmount) * 100);
      }

      await reviewRescheduleRequest(booking._id, payload);

      toast.success(
        action === 'approve' ? 'Reschedule approved — new appointment set!'
        : action === 'reject' ? 'Reschedule request rejected'
        : 'Booking cancelled'
      );
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const svc = booking.service;
  const proposedStaffName = (() => {
    const sid = booking.rescheduleStaffMember?._id?.toString() || booking.rescheduleStaffMember?.toString();
    const s = staffList.find(st => st._id?.toString() === sid || st.userId?._id?.toString() === sid);
    if (!s) return 'Same as current';
    const u = s.userId || s;
    return `${u.firstName || ''} ${u.lastName || ''}`.trim();
  })();

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <RefreshCw size={16} className="text-[#22B8C8]" /> Review Reschedule Request
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.bookingNumber} · {booking.customerName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Customer's request summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
            <p className="font-bold text-blue-700 text-xs uppercase tracking-wide">Customer's Request</p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-[10px] text-blue-400 mb-0.5 font-medium">Current Appointment</p>
                <p className="font-semibold text-gray-800 text-xs">
                  {new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-gray-500 text-xs">{booking.bookingTime} · {svc?.name}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-[10px] text-blue-400 mb-0.5 font-medium">Requested New Slot</p>
                <p className="font-semibold text-gray-800 text-xs">
                  {proposedDateStr
                    ? new Date(proposedDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
                <p className="text-gray-500 text-xs">{booking.rescheduleTime || '—'}</p>
              </div>
            </div>

            {booking.rescheduleReason && (
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-[10px] text-blue-400 mb-0.5 font-medium">Reason</p>
                <p className="text-sm text-gray-700">{booking.rescheduleReason}</p>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Requested {new Date(booking.rescheduleRequestedAt).toLocaleString('en-GB')}
              {proposedStaffName && ` · Staff: ${proposedStaffName}`}
            </div>
          </div>

          {/* Action selector */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your Decision</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'approve', label: '✓ Approve',  cls: action === 'approve' ? 'border-[#22B8C8] bg-[#f0fafa] text-[#22B8C8]' : 'border-gray-200 text-gray-500 hover:border-gray-300' },
                { key: 'reject',  label: '✕ Reject',   cls: action === 'reject'  ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:border-gray-300' },
                { key: 'cancel',  label: '⊘ Cancel',   cls: action === 'cancel'  ? 'border-red-400 bg-red-50 text-red-600'         : 'border-gray-200 text-gray-500 hover:border-gray-300' },
              ].map(({ key, label, cls }) => (
                <button key={key} onClick={() => setAction(key)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${cls}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {action === 'approve' && 'Approve & set new date/time below. Old calendar event deleted, new one created.'}
              {action === 'reject'  && 'Original booking stays unchanged. Customer is notified.'}
              {action === 'cancel'  && 'Cancel the booking entirely. Optional refund available.'}
            </p>
          </div>

          {/* APPROVE — date/time/staff pickers */}
          {action === 'approve' && (
            <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-[#22B8C8] uppercase tracking-wide">
                Set New Appointment
              </p>
              <p className="text-xs text-gray-500 -mt-2">
                Pre-filled with customer's request. Adjust if needed.
              </p>

              {/* Staff selector */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <User size={11}/> Staff Member
                </label>
                <select value={overrideStaff} onChange={e => { setOverrideStaff(e.target.value); setOverrideTime(''); }}
                  className={INPUT_CLS}>
                  <option value="">— Select staff —</option>
                  {staffList.map(s => {
                    const u = s.userId || s;
                    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                    return (
                      <option key={s._id} value={s._id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <Calendar size={11}/> Date
                </label>
                <MiniCalendar selected={overrideDate} onSelect={d => { setOverrideDate(d); setOverrideTime(''); }} />
              </div>

              {/* Time slot picker */}
              {overrideDate && overrideStaff && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                    <Clock size={11}/> Available Time Slots
                    {loadingSlots && <Loader2 size={11} className="animate-spin text-[#22B8C8]"/>}
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-[#22B8C8]"/>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-amber-50 text-amber-700 text-xs rounded-xl p-3 flex items-center gap-2">
                      <AlertTriangle size={13}/> No available slots for this date &amp; staff member
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {slots.map(t => (
                        <button key={t} onClick={() => setOverrideTime(t)}
                          className={`py-2 rounded-xl text-xs font-bold border-2 transition-all
                            ${overrideTime === t
                              ? 'border-[#22B8C8] bg-[#22B8C8] text-white'
                              : 'border-gray-200 text-gray-600 hover:border-[#22B8C8]/50'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual override if slot not in list */}
                  <div className="mt-2">
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">
                      Or type time manually (HH:MM)
                    </label>
                    <input type="time" value={overrideTime} onChange={e => setOverrideTime(e.target.value)}
                      className={INPUT_CLS + ' text-sm'}/>
                  </div>
                </div>
              )}

              {overrideDate && overrideTime && (
                <div className="bg-[#22B8C8]/10 rounded-xl p-3 text-sm text-[#22B8C8] font-bold flex items-center gap-2">
                  <CheckCircle2 size={15}/>
                  New slot: {new Date(overrideDate).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })} at {overrideTime}
                </div>
              )}
            </div>
          )}

          {/* CANCEL — refund */}
          {action === 'cancel' && (
            <div className="space-y-3 bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Cancel Booking</p>
              {hasStripe ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Refund Amount (max £{maxRefund}) — leave blank for no refund
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                      <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                        min="0" max={maxRefund} step="0.01" placeholder={`0.00 – ${maxRefund}`}
                        className={INPUT_CLS + ' pl-7'}/>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle size={14}/> No Stripe payment — cancel only, no refund available.
                </div>
              )}
            </div>
          )}

          {/* Admin note */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Admin Note (optional — logged internally)
            </label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              rows={2} className={INPUT_CLS + ' resize-none'}
              placeholder="Internal note about this decision..."/>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50">
              Close
            </button>
            <button onClick={submit} disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-60 transition-all
                ${action === 'approve' ? 'bg-[#22B8C8] hover:bg-[#1a9aad]'
                : action === 'reject'  ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-red-500 hover:bg-red-600'}`}>
              {loading
                ? <Loader2 size={15} className="animate-spin"/>
                : action === 'approve' ? <CheckCircle2 size={15}/>
                : action === 'reject'  ? <XCircle size={15}/>
                : <XCircle size={15}/>}
              {action === 'approve' ? 'Approve & Reschedule'
               : action === 'reject' ? 'Reject Request'
               : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
