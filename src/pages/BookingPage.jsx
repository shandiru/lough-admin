import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarCheck, Plus, X, Loader2, ChevronLeft, ChevronRight,
  User, Users, Phone, MapPin, StickyNote, AlertCircle, CheckCircle2,
  Clock, Search,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { serviceApi } from '../api/serviceApi';
import { getAllBookings, getAvailableSlotsAdmin, createBookingAdmin } from '../api/bookingService';

// ── Helpers ──────────────────────────────────────────────────────────────────
const statusColor = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-gray-100 text-gray-500',
};

// ── Mini calendar ─────────────────────────────────────────────────────────────
function MonthCalendar({ selected, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-sm text-gray-700">{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;
          const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
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

// ── Create Booking Modal ──────────────────────────────────────────────────────
function CreateBookingModal({ services, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName:          '',
    customerEmail:         '',
    customerPhone:         '',
    customerAddress:       '',
    customerGender:        '',   // stored in state, used for filtering
    staffGenderPreference: 'any',
    customerNotes:         '',
    serviceId:             '',
    internalNotes:         '',
  });

  const [selectedDate,  setSelectedDate]  = useState('');
  const [slotsData,     setSlotsData]     = useState([]);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedTime,  setSelectedTime]  = useState('');

  const selectedService = services.find(s => s._id === form.serviceId);

  // Re-fetch slots when date, service, customerGender, or staffGenderPreference changes
  useEffect(() => {
    if (!selectedDate || !form.serviceId) return;
    setLoadingSlots(true);
    setSlotsData([]);
    setSelectedStaff(null);
    setSelectedTime('');
    getAvailableSlotsAdmin(form.serviceId, selectedDate, form.customerGender, form.staffGenderPreference)
      .then(res => setSlotsData(res.data || res))
      .catch(() => setSlotsData([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, form.serviceId, form.customerGender, form.staffGenderPreference]);

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canStep0 = form.customerName && form.customerEmail && form.customerPhone && form.customerGender && form.serviceId;
  const canStep1 = selectedDate && selectedStaff && selectedTime;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await createBookingAdmin({
        ...form,
        staffId:      selectedStaff._id,
        bookingDate:  selectedDate,
        bookingTime:  selectedTime,
        bookingSource: 'admin',
      });
      toast.success('Booking created!');
      onCreated(res.data || res);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#22B8C8] bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarCheck size={20} className="text-[#22B8C8]" /> New Booking (Admin)
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-6 pt-4">
          {['Customer & Service', 'Date & Time', 'Confirm'].map((l, i) => (
            <div key={l} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2
                ${i < step ? 'bg-[#22B8C8] border-[#22B8C8] text-white' :
                  i === step ? 'border-[#22B8C8] text-[#22B8C8]' : 'border-gray-200 text-gray-300'}`}>
                {i < step ? '✓' : i+1}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${i === step ? 'text-[#22B8C8]' : 'text-gray-400'}`}>{l}</span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-[#22B8C8]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* ── Step 0: Customer & Service ─────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['customerName',  'Full Name', 'text',  'Jane Smith'],
                  ['customerEmail', 'Email',     'email', 'jane@example.com'],
                  ['customerPhone', 'Phone',     'text',  '07700 900000'],
                ].map(([k, label, type, ph]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
                    <input type={type} value={form[k]} onChange={e => handleField(k, e.target.value)}
                      placeholder={ph} className={inputCls} />
                  </div>
                ))}

                {/* Customer gender — stored in state, drives staff filtering */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                    <User size={12} /> Customer Gender
                  </label>
                  <select value={form.customerGender} onChange={e => handleField('customerGender', e.target.value)} className={inputCls}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Staff gender preference — admin can set on behalf of customer */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                    <Users size={12} /> Preferred Staff Gender
                  </label>
                  <select value={form.staffGenderPreference} onChange={e => handleField('staffGenderPreference', e.target.value)} className={inputCls}>
                    <option value="any">No preference</option>
                    <option value="female">Female staff only</option>
                    <option value="male">Male staff only</option>
                  </select>
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Service</label>
                <select value={form.serviceId} onChange={e => handleField('serviceId', e.target.value)} className={inputCls}>
                  <option value="">Select service</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s._id} value={s._id}>{s.name} — £{s.price} ({s.duration} min)</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                  <MapPin size={12} /> Address (optional)
                </label>
                <input value={form.customerAddress} onChange={e => handleField('customerAddress', e.target.value)}
                  placeholder="123 High Street, London" className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                  <StickyNote size={12} /> Customer Notes (optional)
                </label>
                <textarea value={form.customerNotes} onChange={e => handleField('customerNotes', e.target.value)}
                  rows={2} className={inputCls + ' resize-none'} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Internal Notes (admin only)</label>
                <textarea value={form.internalNotes} onChange={e => handleField('internalNotes', e.target.value)}
                  rows={2} className={inputCls + ' resize-none'} />
              </div>

              <button disabled={!canStep0} onClick={() => setStep(1)}
                className="w-full bg-[#22B8C8] text-white py-3 rounded-xl font-bold disabled:opacity-40">
                Next →
              </button>
            </>
          )}

          {/* ── Step 1: Date & Time ────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <MonthCalendar selected={selectedDate} onSelect={setSelectedDate} />

              {selectedDate && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    Staff & Times for {selectedDate}
                  </p>
                  {loadingSlots && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Loader2 size={16} className="animate-spin" /> Loading slots...
                    </div>
                  )}
                  {!loadingSlots && slotsData.length === 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-600 rounded-xl p-3 text-sm">
                      <AlertCircle size={16} /> No available slots on this date.
                    </div>
                  )}
                  {!loadingSlots && slotsData.map(({ staff, availableSlots }) => (
                    <div key={staff._id} onClick={() => { setSelectedStaff(staff); setSelectedTime(''); }}
                      className={`mb-3 rounded-xl border-2 p-4 cursor-pointer transition-all
                        ${selectedStaff?._id === staff._id ? 'border-[#22B8C8] bg-[#f0fafa]' : 'border-gray-100 hover:border-[#C9AF94]/40'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#22B8C8] text-white flex items-center justify-center text-xs font-bold">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-700">{staff.name}</p>
                            {staff.gender && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize
                                ${staff.gender === 'female' ? 'bg-pink-50 text-pink-500' :
                                  staff.gender === 'male'   ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                {staff.gender}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{availableSlots.length} slots</p>
                        </div>
                        {selectedStaff?._id === staff._id && <CheckCircle2 size={18} className="text-[#22B8C8] ml-auto" />}
                      </div>
                      {selectedStaff?._id === staff._id && (
                        <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                          {availableSlots.map(slot => (
                            <button key={slot} onClick={e => { e.stopPropagation(); setSelectedTime(slot); }}
                              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${selectedTime === slot ? 'bg-[#22B8C8] text-white border-[#22B8C8]' : 'border-gray-200 text-gray-600 hover:border-[#22B8C8]'}`}>
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50">
                  ← Back
                </button>
                <button disabled={!canStep1} onClick={() => setStep(2)}
                  className="flex-1 bg-[#22B8C8] text-white py-3 rounded-xl font-bold disabled:opacity-40">
                  Review →
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Confirm ───────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <Row label="Service"    value={selectedService?.name} />
                <Row label="Date"       value={selectedDate} />
                <Row label="Time"       value={selectedTime} />
                <Row label="Staff"      value={selectedStaff?.name} />
                <Row label="Duration"   value={`${selectedService?.duration} min`} />
                <Row label="Price"      value={`£${selectedService?.price}`} />
                <div className="border-t pt-2 mt-2" />
                <Row label="Customer"   value={form.customerName} />
                <Row label="Email"      value={form.customerEmail} />
                <Row label="Phone"      value={form.customerPhone} />
                <Row label="Gender"     value={form.customerGender} />
                <Row label="Staff Pref" value={form.staffGenderPreference === 'any' ? 'No preference' : `${form.staffGenderPreference} only`} />
                {form.customerAddress && <Row label="Address"    value={form.customerAddress} />}
                {form.internalNotes   && <Row label="Int. Notes" value={form.internalNotes} />}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-700">
                <Clock size={14} /> Admin bookings are confirmed immediately — no payment required.
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-500 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-[#22B8C8] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CalendarCheck size={16} /> Confirm</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-700 capitalize">{value}</span>
    </div>
  );
}

// ── Main Booking Page ─────────────────────────────────────────────────────────
const AdminBookingPage = () => {
  const [bookings, setBookings]         = useState([]);
  const [services, setServices]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, sRes] = await Promise.all([getAllBookings(), serviceApi.getAll()]);
      setBookings(bRes.data || bRes);
      setServices(sRes.data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (booking) => {
    setBookings(prev => [booking, ...prev]);
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <Toaster position="top-right" />

      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
            <p className="text-sm text-gray-400">{bookings.length} total bookings</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#22B8C8] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1a9aad] transition-all"
          >
            <Plus size={18} /> New Booking
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, booking #..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#22B8C8] bg-white"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#22B8C8]">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#22B8C8]" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Booking #', 'Customer', 'Service', 'Staff', 'Date & Time', 'Status', 'Total', 'Paid'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">No bookings found.</td>
                    </tr>
                  ) : filtered.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#22B8C8] font-bold">{b.bookingNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{b.customerName}</p>
                        <p className="text-xs text-gray-400">{b.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{b.service?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.staffMember?.userId
                          ? `${b.staffMember.userId.firstName} ${b.staffMember.userId.lastName}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-gray-700">{new Date(b.bookingDate).toLocaleDateString('en-GB')}</p>
                        <p className="text-xs text-gray-400">{b.bookingTime}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[b.status] || 'bg-gray-100 text-gray-500'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">
                        £{(b.totalAmount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${b.paymentStatus === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                          {b.paymentStatus === 'paid' ? `£${(b.paidAmount/100).toFixed(2)} paid` : b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <CreateBookingModal
          services={services}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default AdminBookingPage;
