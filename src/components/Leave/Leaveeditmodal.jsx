import React, { useState } from 'react';
import { X, CalendarDays, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'sick',     label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'training', label: 'Training' },
  { value: 'other',    label: 'Other' },
];

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition';
const lbl = 'text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block';
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const LeaveEditModal = ({ leave, onClose, onUpdated }) => {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    type:      leave.type,
    startDate: leave.startDate?.split('T')[0] || '',
    endDate:   leave.endDate?.split('T')[0]   || '',
    reason:    leave.reason || '',
    isHourly:  leave.isHourly || false,
    startTime: leave.startTime || '09:00',
    endTime:   leave.endTime   || '10:00',
  });
  const [loading, setLoading]         = useState(false);
  const [conflictsByDay, setConflicts] = useState(null);

  const set = (k, v) => { setConflicts(null); setForm(f => ({ ...f, [k]: v })); };

  const toggleHourly = () => {
    setConflicts(null);
    setForm(f => ({
      ...f,
      isHourly: !f.isHourly,
      endDate: !f.isHourly ? f.startDate : f.endDate,
    }));
  };

  const handleStartDate = (v) => {
    setConflicts(null);
    setForm(f => ({
      ...f,
      startDate: v,
      endDate: f.isHourly ? v : (f.endDate && f.endDate >= v ? f.endDate : v),
    }));
  };

  const hourlyDuration = () => {
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) return null;
    const mins = toMins(form.endTime) - toMins(form.startTime);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate) return toast.error('Please select a date.');
    if (!form.isHourly && !form.endDate) return toast.error('Please select an end date.');
    if (!form.isHourly && form.endDate < form.startDate) return toast.error('End date cannot be before start date.');
    if (form.isHourly && toMins(form.startTime) >= toMins(form.endTime)) return toast.error('Start time must be before end time.');

    setLoading(true);
    setConflicts(null);
    try {
      const payload = {
        type:      form.type,
        startDate: form.startDate,
        endDate:   form.isHourly ? form.startDate : form.endDate,
        reason:    form.reason,
        isHourly:  form.isHourly,
        ...(form.isHourly && { startTime: form.startTime, endTime: form.endTime }),
      };
      const res = await leaveService.update(leave._id, payload);
      toast.success('Leave updated!');
      onUpdated(res.data.leave || { ...leave, ...payload });
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflictingBookings) {
        setConflicts(data.conflictingBookings);
        toast.error(data.message || 'Booking conflicts found.');
      } else {
        toast.error(data?.message || 'Failed to update.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 relative max-h-[92vh] overflow-y-auto">

        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Edit Leave Request</h2>
            <p className="text-xs text-gray-500">Update your pending leave details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className={lbl}>Leave Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inp}>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Hourly toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--color-brand)]" /> Hourly / Partial-day
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Block only specific hours, not full days</p>
            </div>
            <button type="button" onClick={toggleHourly}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${form.isHourly ? 'bg-[var(--color-brand)]' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isHourly ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {form.isHourly ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className={lbl}>Date</label>
                <input type="date" value={form.startDate} min={today} required
                  onChange={e => handleStartDate(e.target.value)} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Start Time</label>
                  <input type="time" value={form.startTime} required
                    onChange={e => set('startTime', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>End Time</label>
                  <input type="time" value={form.endTime} required
                    onChange={e => set('endTime', e.target.value)} className={inp} />
                </div>
              </div>
              {hourlyDuration() && (
                <div className="flex items-center gap-2 bg-[var(--color-brand)]/5 rounded-xl px-4 py-2.5">
                  <Clock size={13} className="text-[var(--color-brand)]" />
                  <span className="text-xs font-bold text-[var(--color-brand)]">Duration: {hourlyDuration()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Start Date</label>
                <input type="date" value={form.startDate} min={today} required
                  onChange={e => handleStartDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>End Date</label>
                <input type="date" value={form.endDate} min={form.startDate || today} required
                  onChange={e => set('endDate', e.target.value)} className={inp} />
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Reason (Optional)</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
              rows={3} maxLength={500} placeholder="Briefly describe the reason..."
              className={`${inp} resize-none`} />
          </div>

          {conflictsByDay && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Booking Conflicts</p>
              </div>
              <p className="text-xs text-amber-600 mb-3">
                Cancel or reschedule these bookings before editing these dates.
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(conflictsByDay).map(([day, bookings]) => (
                  <div key={day} className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">{day}</p>
                    {bookings.map((bk, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-gray-600 py-0.5 gap-2">
                        <span className="font-bold shrink-0">{bk.time}</span>
                        <span className="text-gray-500 flex-1 truncate">{bk.service}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          bk.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>{bk.status}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[var(--color-brand)] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveEditModal;