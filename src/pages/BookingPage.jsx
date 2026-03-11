import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarCheck, Plus, X, Loader2, ChevronLeft, ChevronRight,
  User, Users, Phone, MapPin, StickyNote, AlertCircle, CheckCircle2,
  Clock, Search, RefreshCw, XCircle, DollarSign, Eye, ChevronDown,
  Filter, AlertTriangle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { serviceApi } from '../api/serviceApi';
import { getAllBookings, getAvailableSlotsAdmin, createBookingAdmin, reviewCancelRequest, updateStatus } from '../api/bookingService';

const TEAL  = '#22B8C8';
const GOLD  = '#C9AF94';

// ── Status colours ────────────────────────────────────────────────────────────
const statusCls = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  'no-show': 'bg-gray-100 text-gray-500 border-gray-200',
};
const cancelReqCls = {
  pending:  'bg-orange-100 text-orange-700',
  approved: 'bg-red-100 text-red-600',
  rejected: 'bg-gray-100 text-gray-500',
};

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#22B8C8] focus:ring-2 focus:ring-[#22B8C8]/10 bg-gray-50 transition-all';

function toMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }
function fromMins(m) { return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`; }

// ── Mini calendar ─────────────────────────────────────────────────────────────
function MonthCalendar({ selected, onSelect }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [vd, setVd] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const yr = vd.getFullYear(), mo = vd.getMonth();
  const cells = [];
  for (let i = 0; i < new Date(yr,mo,1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= new Date(yr,mo+1,0).getDate(); d++) cells.push(d);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setVd(new Date(yr,mo-1,1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><ChevronLeft size={15}/></button>
        <span className="font-bold text-sm text-gray-700">{MONTHS[mo]} {yr}</span>
        <button onClick={() => setVd(new Date(yr,mo+1,1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><ChevronRight size={15}/></button>
      </div>
      <div className="grid grid-cols-7 mb-1">{['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day,i) => {
          if (!day) return <div key={`e-${i}`}/>;
          const iso = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast = new Date(yr,mo,day) < today;
          const isSel = selected === iso;
          return (
            <button key={iso} disabled={isPast} onClick={() => onSelect(iso)}
              className={`aspect-square rounded-lg text-xs font-medium transition-all
                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#22B8C8]/10'}
                ${isSel ? 'bg-[#22B8C8] text-white' : 'text-gray-700'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Review Cancel Modal ───────────────────────────────────────────────────────
function ReviewCancelModal({ booking, onClose, onDone }) {
  const [action, setAction]   = useState('approve');
  const [refund, setRefund]   = useState('');
  const [note,   setNote]     = useState('');
  const [loading, setLoading] = useState(false);

  const maxRefund = (booking.paidAmount / 100).toFixed(2);
  const hasStripe = !!booking.stripePaymentIntentId;

  const submit = async () => {
    setLoading(true);
    try {
      const refundPence = action === 'approve' && refund ? Math.round(parseFloat(refund) * 100) : 0;
      await reviewCancelRequest(booking._id, { action, refundAmount: refundPence, adminNote: note });
      toast.success(action === 'approve' ? 'Booking cancelled' + (refundPence ? ' & refund issued' : '') : 'Request rejected');
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Review Cancellation Request</h3>
            <p className="text-xs text-gray-400 mt-0.5">{booking.bookingNumber} · {booking.customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Request details */}
          <div className="bg-orange-50 rounded-2xl p-4 text-sm space-y-1.5">
            <p className="font-bold text-orange-700 text-xs uppercase tracking-wide">Customer's Request</p>
            <p className="text-gray-700">{booking.cancelRequestReason || <em className="text-gray-400">No reason provided</em>}</p>
            <p className="text-xs text-gray-400">Requested {new Date(booking.cancelRequestedAt).toLocaleString('en-GB')}</p>
          </div>

          {/* Booking summary */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Service</p>
              <p className="font-semibold text-gray-800">{booking.service?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
              <p className="font-semibold text-gray-800">
                {new Date(booking.bookingDate).toLocaleDateString('en-GB', {day:'numeric',month:'short'})} at {booking.bookingTime}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Paid</p>
              <p className="font-bold text-[#22B8C8]">£{(booking.paidAmount/100).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Payment type</p>
              <p className="font-semibold text-gray-800 capitalize">{booking.paymentType}</p>
            </div>
          </div>

          {/* Action */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Action</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAction('approve')}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${action === 'approve' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                ✓ Approve Cancel
              </button>
              <button onClick={() => setAction('reject')}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${action === 'reject' ? 'border-[#22B8C8] bg-[#f0fafa] text-[#22B8C8]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                ✕ Reject Request
              </button>
            </div>
          </div>

          {/* Refund (approve only + has Stripe) */}
          {action === 'approve' && hasStripe && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Refund Amount (max £{maxRefund}) — leave blank for no refund
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                <input type="number" value={refund} onChange={e => setRefund(e.target.value)}
                  min="0" max={maxRefund} step="0.01"
                  placeholder={`0.00 – ${maxRefund}`}
                  className={inputCls + ' pl-7'}/>
              </div>
              <p className="text-xs text-gray-400 mt-1">Refund will be issued via Stripe immediately</p>
            </div>
          )}
          {action === 'approve' && !hasStripe && (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
              <AlertTriangle size={14}/> This booking has no Stripe payment — cancel only, no refund available.
            </div>
          )}

          {/* Admin note */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Admin Note (optional — saved to internal notes)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className={inputCls + ' resize-none'} placeholder="Internal note..."/>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-60 transition-all
                ${action === 'approve' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#22B8C8] hover:bg-[#1a9aad]'}`}>
              {loading ? <Loader2 size={15} className="animate-spin"/> : action === 'approve' ? <XCircle size={15}/> : <CheckCircle2 size={15}/>}
              {action === 'approve' ? 'Confirm Cancellation' : 'Reject Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Booking Modal ──────────────────────────────────────────────────────
function CreateBookingModal({ services, onClose, onCreated }) {
  const [step, setStep]         = useState(0);
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerGender: '', customerNotes: '',
    internalNotes: '', serviceId: '', staffGenderPreference: 'any',
  });
  const [selectedDate,  setDate]  = useState('');
  const [slotsData,     setSlots] = useState([]);
  const [loadingSlots,  setLS]    = useState(false);
  const [selectedStaff, setSt]    = useState(null);
  const [selectedTime,  setTm]    = useState('');

  const svc = services.find(s => s._id === form.serviceId);
  const endTime = (selectedTime && svc) ? fromMins(toMins(selectedTime) + svc.duration) : '';

  useEffect(() => {
    if (!selectedDate || !form.serviceId) return;
    setLS(true); setSlots([]); setSt(null); setTm('');
    getAvailableSlotsAdmin(form.serviceId, selectedDate, form.customerGender, form.staffGenderPreference)
      .then(setSlots).catch(() => setSlots([])).finally(() => setLS(false));
  }, [selectedDate, form.serviceId, form.customerGender, form.staffGenderPreference]);

  const hf = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const canStep0 = form.customerName && form.customerEmail && form.customerPhone && form.customerGender && form.serviceId;
  const canStep1 = selectedDate && selectedStaff && selectedTime;

  const handleSubmit = async () => {
    setSub(true); setError('');
    try {
      const created = await createBookingAdmin({
        customerName:          form.customerName,
        customerEmail:         form.customerEmail,
        customerPhone:         form.customerPhone,
        customerAddress:       form.customerAddress,
        customerGender:        form.customerGender,
        customerNotes:         form.customerNotes,
        internalNotes:         form.internalNotes,
        serviceId:             form.serviceId,
        staffId:               selectedStaff._id,
        bookingDate:           selectedDate,
        bookingTime:           selectedTime,
        staffGenderPreference: form.staffGenderPreference,
        consentFormCompleted:  false,
        bookingSource:         'admin',
      });
      toast.success('Booking created!');
      onCreated(created);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create booking');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 rounded-t-3xl z-10">
          <div>
            <h2 className="font-bold text-gray-800">New Booking</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {[0,1,2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-[#22B8C8]' : i < step ? 'w-4 bg-[#22B8C8]/40' : 'w-4 bg-gray-200'}`}/>
              ))}
              <span className="text-xs text-gray-400 ml-1">Step {step+1} of 3</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Step 0: Customer & Service ──────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><User size={11}/> Full Name *</label>
                  <input value={form.customerName} onChange={e => hf('customerName',e.target.value)} placeholder="Jane Smith" className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Email *</label>
                  <input value={form.customerEmail} onChange={e => hf('customerEmail',e.target.value)} type="email" placeholder="jane@example.com" className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><Phone size={11}/> Phone *</label>
                  <input value={form.customerPhone} onChange={e => hf('customerPhone',e.target.value)} placeholder="07700 900000" className={inputCls}/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><MapPin size={11}/> Address</label>
                  <input value={form.customerAddress} onChange={e => hf('customerAddress',e.target.value)} placeholder="123 High St, London" className={inputCls}/>
                </div>

                {/* Service */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><CalendarCheck size={11}/> Service *</label>
                  <select value={form.serviceId} onChange={e => { hf('serviceId',e.target.value); setDate(''); setSlots([]); setSt(null); setTm(''); }} className={inputCls}>
                    <option value="">Select a service</option>
                    {services.filter(s=>s.isActive).map(s => (
                      <option key={s._id} value={s._id}>{s.name} — £{s.price} ({s.duration} min)</option>
                    ))}
                  </select>
                </div>

                {/* Customer gender */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Customer Gender *</label>
                  <select value={form.customerGender} onChange={e => hf('customerGender',e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Staff gender preference */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><Users size={11}/> Staff Preference</label>
                  <select value={form.staffGenderPreference} onChange={e => hf('staffGenderPreference',e.target.value)} className={inputCls}>
                    <option value="any">No preference</option>
                    <option value="female">Female staff only</option>
                    <option value="male">Male staff only</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1"><StickyNote size={11}/> Customer Notes</label>
                  <textarea value={form.customerNotes} onChange={e => hf('customerNotes',e.target.value)} rows={2} className={inputCls+' resize-none'}/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Internal Notes (admin only)</label>
                  <textarea value={form.internalNotes} onChange={e => hf('internalNotes',e.target.value)} rows={2} className={inputCls+' resize-none'}/>
                </div>
              </div>
              <button disabled={!canStep0} onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-md transition-all">
                Next: Pick Date & Time →
              </button>
            </>
          )}

          {/* ── Step 1: Date & Time ─────────────────────────────────────────── */}
          {step === 1 && (
            <>
              {svc && (
                <div className="bg-[#f0fafa] border border-[#22B8C8]/20 rounded-xl p-3 flex items-center gap-2 text-sm">
                  <CalendarCheck size={15} className="text-[#22B8C8]"/>
                  <span className="font-bold text-gray-700">{svc.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{svc.duration} min</span>
                </div>
              )}
              <MonthCalendar selected={selectedDate} onSelect={setDate}/>

              {selectedDate && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Available Staff — {selectedDate}</p>
                  {loadingSlots && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Loader2 size={16} className="animate-spin text-[#22B8C8]"/> Finding slots...
                    </div>
                  )}
                  {!loadingSlots && slotsData.length === 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-600 rounded-xl p-3 text-sm border border-amber-200">
                      <AlertCircle size={15}/> No available slots. Try another date or adjust preferences.
                    </div>
                  )}
                  {!loadingSlots && slotsData.map(({ staff, availableSlots }) => (
                    <div key={staff._id} onClick={() => { setSt(staff); setTm(''); }}
                      className={`mb-3 rounded-2xl border-2 p-4 cursor-pointer transition-all
                        ${selectedStaff?._id === staff._id ? 'border-[#22B8C8] bg-[#f0fafa]' : 'border-gray-100 hover:border-[#C9AF94]/40'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22B8C8] to-[#C9AF94] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-700">{staff.name}</p>
                            {staff.gender && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize
                                ${staff.gender==='female' ? 'bg-pink-50 text-pink-500' : staff.gender==='male' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                {staff.gender}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{availableSlots.length} slots</p>
                        </div>
                        {selectedStaff?._id === staff._id && <CheckCircle2 size={18} className="text-[#22B8C8]"/>}
                      </div>
                      {selectedStaff?._id === staff._id && (
                        <>
                          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                            {availableSlots.map(slot => (
                              <button key={slot} onClick={e => { e.stopPropagation(); setTm(slot); }}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all
                                  ${selectedTime===slot ? 'bg-[#22B8C8] text-white border-[#22B8C8]' : 'border-gray-200 text-gray-600 hover:border-[#22B8C8]'}`}>
                                {slot}
                              </button>
                            ))}
                          </div>
                          {selectedTime && (
                            <div className="mt-3 flex items-center gap-2 bg-[#22B8C8]/10 rounded-lg px-3 py-2">
                              <Clock size={13} className="text-[#22B8C8]"/>
                              <span className="text-sm font-bold text-[#22B8C8]">{selectedTime}</span>
                              <span className="text-gray-400 text-sm">→</span>
                              <span className="text-sm font-bold text-[#22B8C8]">{endTime}</span>
                              <span className="text-xs text-gray-400">({svc?.duration} min)</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 text-sm">← Back</button>
                <button disabled={!canStep1} onClick={() => setStep(2)}
                  className="flex-1 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold disabled:opacity-40 text-sm hover:shadow-md transition-all">
                  Review →
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Confirm ─────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                {[
                  ['Service',      svc?.name],
                  ['Date',         selectedDate],
                  ['Time',         selectedTime + (endTime ? ` – ${endTime}` : '')],
                  ['Staff',        selectedStaff?.name],
                  ['Duration',     svc ? `${svc.duration} min` : ''],
                  ['Price',        svc ? `£${svc.price}` : ''],
                  ['Customer',     form.customerName],
                  ['Email',        form.customerEmail],
                  ['Phone',        form.customerPhone],
                  ['Gender',       form.customerGender],
                  ['Staff Pref',   form.staffGenderPreference === 'any' ? 'No preference' : `${form.staffGenderPreference} only`],
                  ['Address',      form.customerAddress],
                  ['Int. Notes',   form.internalNotes],
                ].filter(([,v]) => v).map(([l,v]) => (
                  <div key={l} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 font-medium">{l}</span>
                    <span className="font-semibold text-gray-700 capitalize">{v}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#f0fafa] border border-[#22B8C8]/20 rounded-xl p-3 flex items-center gap-2 text-xs text-[#1a9aad]">
                <CheckCircle2 size={14}/> Admin bookings are confirmed immediately — no payment required.
              </div>

              {error && <div className="flex items-center gap-2 bg-red-50 text-red-500 rounded-xl p-3 text-sm border border-red-200"><AlertCircle size={15}/>{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50">← Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 text-sm hover:shadow-md transition-all">
                  {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving...</> : <><CalendarCheck size={15}/> Confirm Booking</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Booking Detail Drawer ─────────────────────────────────────────────────────
function BookingDrawer({ booking, onClose, onUpdated }) {
  const [status, setStatus]   = useState(booking.status);
  const [saving, setSaving]   = useState(false);
  const [showReview, setRev]  = useState(false);

  const svc   = booking.service;
  const staff = booking.staffMember?.userId;
  const endTime = svc ? fromMins(toMins(booking.bookingTime) + svc.duration) : '';

  const saveStatus = async () => {
    setSaving(true);
    try {
      await updateStatus(booking._id, status);
      toast.success('Status updated');
      onUpdated();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <div>
            <p className="font-mono text-xs text-[#22B8C8] font-bold">{booking.bookingNumber}</p>
            <p className="font-bold text-gray-800">{booking.customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + cancel request banner */}
          {booking.cancelRequestStatus === 'pending' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-orange-700 text-sm flex items-center gap-1.5"><AlertTriangle size={15}/> Cancellation Requested</p>
                <p className="text-xs text-orange-600 mt-1">{booking.cancelRequestReason || 'No reason provided'}</p>
              </div>
              <button onClick={() => setRev(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all">
                Review
              </button>
            </div>
          )}

          {/* Appointment */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Appointment</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Service',  svc?.name],
                ['Date',     new Date(booking.bookingDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})],
                ['Time',     booking.bookingTime + (endTime ? ` – ${endTime}` : '')],
                ['Duration', `${svc?.duration || booking.duration} min`],
                ['Staff',    staff ? `${staff.firstName} ${staff.lastName}` : '—'],
                ['Source',   booking.bookingSource],
              ].map(([l,v]) => v && (
                <div key={l} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="font-semibold text-gray-800 text-xs capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Customer</p>
            <div className="space-y-2 text-sm">
              {[
                ['Email',   booking.customerEmail],
                ['Phone',   booking.customerPhone],
                ['Gender',  booking.customerGender],
                ['Address', booking.customerAddress],
              ].filter(([,v])=>v).map(([l,v]) => (
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

          {/* Payment */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Payment</p>
            <div className="bg-[#f0fafa] rounded-2xl p-4 space-y-2 text-sm">
              {[
                ['Total',        `£${(booking.totalAmount/100).toFixed(2)}`],
                ['Paid',         `£${(booking.paidAmount/100).toFixed(2)}`],
                ['Balance',      `£${(booking.balanceRemaining/100).toFixed(2)}`],
                ['Type',         booking.paymentType],
                ['Status',       booking.paymentStatus],
                ['Refunded',     booking.refundAmount > 0 ? `£${(booking.refundAmount/100).toFixed(2)}` : null],
              ].filter(([,v])=>v).map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-semibold text-gray-800 capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status update */}
          <div>
            <p className="text-xs font-bold text-[#C9AF94] uppercase tracking-widest mb-3">Update Status</p>
            <div className="flex gap-2">
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls + ' flex-1'}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
              <button onClick={saveStatus} disabled={saving || status === booking.status}
                className="bg-[#22B8C8] text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-[#1a9aad] transition-all flex items-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewCancelModal
          booking={booking}
          onClose={() => setRev(false)}
          onDone={() => { setRev(false); onClose(); onUpdated(); }}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminBookingPage() {
  const [bookings,      setBookings]  = useState([]);
  const [services,      setServices]  = useState([]);
  const [loading,       setLoading]   = useState(true);
  const [showModal,     setModal]     = useState(false);
  const [search,        setSearch]    = useState('');
  const [filterStatus,  setFStatus]   = useState('all');
  const [filterCancel,  setFCancel]   = useState(false);
  const [selected,      setSelected]  = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, sRes] = await Promise.all([getAllBookings(), serviceApi.getAll()]);
      setBookings(Array.isArray(bRes) ? bRes : bRes.data || []);
      setServices(sRes.data || []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingCancelCount = bookings.filter(b => b.cancelRequestStatus === 'pending').length;

  const filtered = bookings.filter(b => {
    if (search) {
      const q = search.toLowerCase();
      if (!b.customerName?.toLowerCase().includes(q) &&
          !b.customerEmail?.toLowerCase().includes(q) &&
          !b.bookingNumber?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterCancel && b.cancelRequestStatus !== 'pending') return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar/>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600, fontSize: 13 } }}/>

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bookings</h1>
            <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total · {filtered.length} shown</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCancelCount > 0 && (
              <button onClick={() => setFCancel(c => !c)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all
                  ${filterCancel ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-400'}`}>
                <AlertTriangle size={13}/> {pendingCancelCount} Cancel Request{pendingCancelCount>1?'s':''}
              </button>
            )}
            <button onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <Plus size={16}/> New Booking
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, booking #..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#22B8C8] focus:ring-2 focus:ring-[#22B8C8]/10 bg-white"/>
            </div>
            <select value={filterStatus} onChange={e => setFStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#22B8C8] font-medium">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#22B8C8]"/></div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Booking #','Customer','Service','Staff','Date & Time','Status','Total','Paid',''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-16 text-gray-400 text-sm">No bookings found</td></tr>
                    ) : filtered.map(b => {
                      const hasCancelReq = b.cancelRequestStatus === 'pending';
                      return (
                        <tr key={b._id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${hasCancelReq ? 'bg-orange-50/50' : ''}`}
                          onClick={() => setSelected(b)}>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-bold text-[#22B8C8]">{b.bookingNumber}</p>
                            {hasCancelReq && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full mt-1">
                                <RefreshCw size={9}/> Cancel req
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{b.customerName}</p>
                            <p className="text-xs text-gray-400">{b.customerEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{b.service?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {b.staffMember?.userId ? `${b.staffMember.userId.firstName} ${b.staffMember.userId.lastName}` : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-gray-700 font-medium">{new Date(b.bookingDate).toLocaleDateString('en-GB')}</p>
                            <p className="text-xs text-gray-400">{b.bookingTime}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${statusCls[b.status]||'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">£{(b.totalAmount/100).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${b.paymentStatus==='paid'?'text-green-500':b.paymentStatus==='refunded'?'text-blue-500':'text-amber-500'}`}>
                              {b.paymentStatus === 'paid' ? `£${(b.paidAmount/100).toFixed(2)} paid` : b.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Eye size={15} className="text-gray-300 hover:text-[#22B8C8]"/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && <CreateBookingModal services={services} onClose={() => setModal(false)} onCreated={b => { setBookings(p => [b,...p]); }}/>}
      {selected && <BookingDrawer booking={selected} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); load(); }}/>}
    </div>
  );
}
