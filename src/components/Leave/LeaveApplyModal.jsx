import React, { useState } from 'react';
import { X, CalendarDays, Loader2 } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'sick',     label: ' Sick Leave' },
  { value: 'vacation', label: ' Vacation' },
  { value: 'training', label: ' Training' },
  { value: 'other',    label: ' Other' },
];

const LeaveApplyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ type: 'sick', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return toast.error('Please select dates.');
    if (form.endDate < form.startDate)    return toast.error('End date cannot be before start date.');
    setLoading(true);
    try {
      const res = await leaveService.apply(form);
      toast.success('Leave request submitted!');
      onSuccess(res.data.leave);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Apply for Leave</h2>
            <p className="text-xs text-gray-500">Submit a request for admin review</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Leave Type</label>
            <select name="type" value={form.type} onChange={onChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]">
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={onChange}
                min={today} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={onChange}
                min={form.startDate || today} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]" />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Reason (Optional)</label>
            <textarea name="reason" value={form.reason} onChange={onChange} rows={3} maxLength={500}
              placeholder="Briefly describe the reason..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--color-brand)] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveApplyModal;