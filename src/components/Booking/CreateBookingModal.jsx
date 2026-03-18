import { useState, useEffect } from 'react';
import { X, CalendarCheck, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvailableSlotsAdmin, createBookingAdmin } from '../../api/bookingService';
import { INPUT_CLS, INPUT_ERR_CLS, fromMins, toMins, isValidUKPhone } from './constants';
import MonthCalendar from './MonthCalendar';

export default function CreateBookingModal({ services, onClose, onCreated }) {
  const [step, setStep]           = useState(0);
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerGender: '', customerNotes: '',
    internalNotes: '', serviceId: '', staffGenderPreference: 'any',
  });

  const [selectedDate, setDate]   = useState('');
  const [slotsData, setSlots]     = useState([]);
  const [loadingSlots, setLS]     = useState(false);
  const [selectedStaff, setSt]    = useState(null);
  const [selectedTime, setTm]     = useState('');

  const svc     = services.find(s => s._id === form.serviceId);
  const endTime = selectedTime && svc ? fromMins(toMins(selectedTime) + svc.duration) : '';

  useEffect(() => {
    if (!selectedDate || !form.serviceId) return;
    setLS(true); setSlots([]); setSt(null); setTm('');
    getAvailableSlotsAdmin(form.serviceId, selectedDate, form.customerGender, form.staffGenderPreference)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLS(false));
  }, [selectedDate, form.serviceId, form.customerGender, form.staffGenderPreference]);

  const hf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canStep0 =
    form.customerName && form.customerEmail && form.customerPhone &&
    isValidUKPhone(form.customerPhone) && form.customerGender && form.serviceId;

  const canStep1 = selectedDate && selectedStaff && selectedTime;

  const handleSubmit = async () => {
    setSub(true); setError('');
    try {
      const created = await createBookingAdmin({
        customerName: form.customerName, customerEmail: form.customerEmail,
        customerPhone: form.customerPhone, customerAddress: form.customerAddress,
        customerGender: form.customerGender, customerNotes: form.customerNotes,
        internalNotes: form.internalNotes, serviceId: form.serviceId,
        staffId: selectedStaff._id, bookingDate: selectedDate,
        bookingTime: selectedTime, staffGenderPreference: form.staffGenderPreference,
        consentFormCompleted: false, bookingSource: 'admin',
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
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 rounded-t-3xl z-10">
          <div>
            <h2 className="font-bold text-gray-800">New Booking</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-8 bg-[#22B8C8]' : i < step ? 'w-4 bg-[#22B8C8]/40' : 'w-4 bg-gray-200'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">Step {step + 1} of 3</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                  <input value={form.customerName} onChange={e => hf('customerName', e.target.value)} placeholder="Jane Smith" className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Email *</label>
                  <input value={form.customerEmail} onChange={e => hf('customerEmail', e.target.value)} type="email" placeholder="jane@example.com" className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Phone (UK) *</label>
                  <input
                    value={form.customerPhone}
                    onChange={e => {
                      hf('customerPhone', e.target.value);
                      setPhoneError(e.target.value && !isValidUKPhone(e.target.value) ? 'Enter a valid UK number e.g. 07700 900000' : '');
                    }}
                    onBlur={e => {
                      if (e.target.value && !isValidUKPhone(e.target.value))
                        setPhoneError('Enter a valid UK number e.g. 07700 900000');
                    }}
                    placeholder="07700 900000"
                    className={phoneError ? INPUT_ERR_CLS : INPUT_CLS}
                  />
                  {phoneError && <p className="text-red-400 text-[11px] mt-1">{phoneError}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Address</label>
                  <input value={form.customerAddress} onChange={e => hf('customerAddress', e.target.value)} placeholder="123 High St, London" className={INPUT_CLS} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Service *</label>
                  <select
                    value={form.serviceId}
                    onChange={e => { hf('serviceId', e.target.value); setDate(''); setSlots([]); setSt(null); setTm(''); }}
                    className={INPUT_CLS}
                  >
                    <option value="">Select a service</option>
                    {services.filter(s => s.isActive).map(s => (
                      <option key={s._id} value={s._id}>{s.name} — £{s.price} ({s.duration} min)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Customer Gender *</label>
                  <select value={form.customerGender} onChange={e => hf('customerGender', e.target.value)} className={INPUT_CLS}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Staff Preference</label>
                  <select value={form.staffGenderPreference} onChange={e => hf('staffGenderPreference', e.target.value)} className={INPUT_CLS}>
                    <option value="any">No preference</option>
                    <option value="female">Female staff only</option>
                    <option value="male">Male staff only</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Customer Notes</label>
                  <textarea value={form.customerNotes} onChange={e => hf('customerNotes', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Internal Notes (admin only)</label>
                  <textarea value={form.internalNotes} onChange={e => hf('internalNotes', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} />
                </div>
              </div>
              <button
                disabled={!canStep0}
                onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                Next: Pick Date & Time →
              </button>
            </>
          )}

          {step === 1 && (
            <>
              {svc && (
                <div className="bg-[#f0fafa] border border-[#22B8C8]/20 rounded-xl p-3 flex items-center gap-2 text-sm">
                  <CalendarCheck size={15} className="text-[#22B8C8]" />
                  <span className="font-bold text-gray-700">{svc.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{svc.duration} min</span>
                </div>
              )}
              <MonthCalendar selected={selectedDate} onSelect={setDate} />
              {selectedDate && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Available Staff — {selectedDate}
                  </p>
                  {loadingSlots && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Loader2 size={16} className="animate-spin text-[#22B8C8]" /> Finding slots...
                    </div>
                  )}
                  {!loadingSlots && slotsData.length === 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-600 rounded-xl p-3 text-sm border border-amber-200">
                      <AlertCircle size={15} /> No available slots.
                    </div>
                  )}
                  {!loadingSlots && slotsData.map(({ staff, availableSlots }) => (
                    <div
                      key={staff._id}
                      onClick={() => { setSt(staff); setTm(''); }}
                      className={`mb-3 rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                        selectedStaff?._id === staff._id
                          ? 'border-[#22B8C8] bg-[#f0fafa]'
                          : 'border-gray-100 hover:border-[#C9AF94]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22B8C8] to-[#C9AF94] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-700">{staff.name}</p>
                          <p className="text-xs text-gray-400">{availableSlots.length} slots</p>
                        </div>
                        {selectedStaff?._id === staff._id && <CheckCircle2 size={18} className="text-[#22B8C8]" />}
                      </div>
                      {selectedStaff?._id === staff._id && (
                        <>
                          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                            {availableSlots.map(slot => (
                              <button
                                key={slot}
                                onClick={e => { e.stopPropagation(); setTm(slot); }}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  selectedTime === slot
                                    ? 'bg-[#22B8C8] text-white border-[#22B8C8]'
                                    : 'border-gray-200 text-gray-600 hover:border-[#22B8C8]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {selectedTime && (
                            <div className="mt-3 flex items-center gap-2 bg-[#22B8C8]/10 rounded-lg px-3 py-2">
                              <Clock size={13} className="text-[#22B8C8]" />
                              <span className="text-sm font-bold text-[#22B8C8]">{selectedTime}</span>
                              <span className="text-gray-400 text-sm">→</span>
                              <span className="text-sm font-bold text-[#22B8C8]">{endTime}</span>
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
                <button disabled={!canStep1} onClick={() => setStep(2)} className="flex-1 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold disabled:opacity-40 text-sm hover:shadow-md transition-all">Review →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3">
                {[
                  ['Service', svc?.name],
                  ['Date', selectedDate],
                  ['Time', selectedTime + (endTime ? ` – ${endTime}` : '')],
                  ['Staff', selectedStaff?.name],
                  ['Duration', svc ? `${svc.duration} min` : ''],
                  ['Price', svc ? `£${svc.price}` : ''],
                  ['Customer', form.customerName],
                  ['Email', form.customerEmail],
                  ['Phone', form.customerPhone],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 font-medium">{l}</span>
                    <span className="font-semibold text-gray-700 capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#f0fafa] border border-[#22B8C8]/20 rounded-xl p-3 flex items-center gap-2 text-xs text-[#1a9aad]">
                <CheckCircle2 size={14} /> Admin bookings are confirmed immediately — no payment required.
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-500 rounded-xl p-3 text-sm border border-red-200">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 text-sm hover:shadow-md transition-all"
                >
                  {submitting
                    ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    : <><CalendarCheck size={15} /> Confirm Booking</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
