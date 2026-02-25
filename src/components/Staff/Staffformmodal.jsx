import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Clock, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const defaultDay = () => ({ isWorking: false, start: '09:00', end: '17:00', breaks: [] });
const defaultWorkingHours = () => DAYS.reduce((acc, d) => { acc[d] = defaultDay(); return acc; }, {});

const TABS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'profile',  label: 'Profile',  icon: Briefcase },
  { key: 'hours',    label: 'Hours',    icon: Clock },
];

const StaffFormModal = ({ services = [], editData = null, onClose, onSuccess }) => {
  const isEditing = !!editData;

  const [tab, setTab] = useState('personal');
  const [loading, setLoading] = useState(false);

  // ── Form state ──
  const [form, setForm] = useState({
    // User fields
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'female',
    // Staff fields
    skills: [],
    genderRestriction: 'all',
    bio: '',
    specializations: '',
    isOnLeave: false,
    workingHours: defaultWorkingHours(),
  });

  // Populate when editing
  useEffect(() => {
    if (isEditing && editData) {
      const u = editData.userId || {};
      setForm({
        firstName: u.firstName || '',
        lastName:  u.lastName  || '',
        email:     u.email     || '',
        phone:     u.phone     || '',
        gender:    u.gender    || 'female',
        skills:            editData.skills?.map(s => s._id) || [],
        genderRestriction: editData.genderRestriction || 'all',
        bio:               editData.bio || '',
        specializations:   editData.specializations?.join(', ') || '',
        isOnLeave:         editData.isOnLeave || false,
        workingHours:      editData.workingHours || defaultWorkingHours(),
      });
    }
  }, [isEditing, editData]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleSkill = (id) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(id)
        ? f.skills.filter(s => s !== id)
        : [...f.skills, id],
    }));
  };

  const updateDay = (day, key, val) => {
    setForm(f => ({
      ...f,
      workingHours: {
        ...f.workingHours,
        [day]: { ...f.workingHours[day], [key]: val },
      },
    }));
  };

  const addBreak = (day) => {
    const breaks = [...(form.workingHours[day]?.breaks || []), { start: '12:00', end: '13:00' }];
    updateDay(day, 'breaks', breaks);
  };

  const removeBreak = (day, idx) => {
    const breaks = form.workingHours[day]?.breaks?.filter((_, i) => i !== idx) || [];
    updateDay(day, 'breaks', breaks);
  };

  const updateBreak = (day, idx, key, val) => {
    const breaks = form.workingHours[day]?.breaks?.map((b, i) => i === idx ? { ...b, [key]: val } : b) || [];
    updateDay(day, 'breaks', breaks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      specializations: form.specializations
        .split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (isEditing) {
        await axiosInstance.put(`/staff/${editData._id}`, payload);
        toast.success('Staff updated!');
      } else {
        const res = await axiosInstance.post('/staff', payload);
        toast.success(res.data.message || 'Staff created & invite sent!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── Input class ──
  const inp = 'w-full px-5 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 placeholder:text-gray-300 font-medium text-sm';
  const sel = `${inp} appearance-none cursor-pointer font-black`;
  const lbl = 'text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5EDE4] w-full max-w-xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-brand-soft/30 max-h-[95dvh] flex flex-col">

        {/* ── Fixed Header ── */}
        <div className="p-6 sm:p-10 pb-0 shrink-0">
          <div className="flex justify-between items-start mb-7">
            <div>
              <h2 className="text-3xl font-serif italic text-gray-900 leading-tight">
                {isEditing ? 'Edit' : 'Add New'}{' '}
                <span className="text-[#22B8C8]">Staff</span>
              </h2>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  {editData?.userId?.firstName} {editData?.userId?.lastName}
                </p>
              )}
              {!isEditing && (
                <p className="text-xs text-gray-400 mt-1">An invite email will be sent automatically</p>
              )}
              <div className="h-1 w-14 bg-brand mt-3 rounded-full" />
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/60 rounded-full hover:rotate-90 hover:bg-white transition-all duration-300 border border-brand-soft/30 shrink-0"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex bg-white/50 rounded-2xl p-1 gap-1 mb-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  tab === key
                    ? 'bg-brand text-white shadow-md shadow-brand/25'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 sm:px-10 pt-5">

          {/* ════ TAB 1: Personal ════ */}
          {tab === 'personal' && (
            <div className="space-y-5 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>First Name</label>
                  <input required placeholder="Jane" className={inp}
                    value={form.firstName} onChange={e => set('firstName', e.target.value)}
                    disabled={isEditing && !!editData?.userId?.email}
                  />
                </div>
                <div>
                  <label className={lbl}>Last Name</label>
                  <input required placeholder="Doe" className={inp}
                    value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Email</label>
                <input required type="email" placeholder="jane@loughskin.com" className={inp}
                  value={form.email} onChange={e => set('email', e.target.value)}
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-[10px] text-gray-400 mt-1 ml-2">Email cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className={lbl}>Phone</label>
                <input placeholder="07123 456789" className={inp}
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                />
              </div>

              <div>
                <label className={lbl}>Gender</label>
                <select className={sel} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Next tab hint */}
              <button type="button" onClick={() => setTab('profile')}
                className="w-full py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-[#24a1ad] transition-all shadow-lg shadow-brand/20 mt-2"
              >
                Next: Profile Details →
              </button>
            </div>
          )}

          {/* ════ TAB 2: Profile ════ */}
          {tab === 'profile' && (
            <div className="space-y-5 pb-6">
              {/* Skills multi-select */}
              <div>
                <label className={lbl}>Skills / Services</label>
                <div className="bg-white/80 rounded-2xl p-4 space-y-2 max-h-44 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No services found</p>
                  ) : services.map(svc => (
                    <label key={svc._id}
                      className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-xl hover:bg-brand/5 transition-colors"
                    >
                      <div
                        onClick={() => toggleSkill(svc._id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          form.skills.includes(svc._id)
                            ? 'bg-brand border-brand'
                            : 'border-gray-300'
                        }`}
                      >
                        {form.skills.includes(svc._id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{svc.name}</span>
                      <span className="ml-auto text-xs text-gray-400">€{svc.price} · {svc.duration}min</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Gender Restriction</label>
                <select className={sel} value={form.genderRestriction} onChange={e => set('genderRestriction', e.target.value)}>
                  <option value="all">All Clients</option>
                  <option value="female-only">Female Only</option>
                  <option value="male-only">Male Only</option>
                </select>
              </div>

              <div>
                <label className={lbl}>Bio</label>
                <textarea rows="3" placeholder="Brief bio about this staff member..."
                  className={`${inp} resize-none`}
                  value={form.bio} onChange={e => set('bio', e.target.value)}
                />
              </div>

              <div>
                <label className={lbl}>Specializations <span className="normal-case font-normal">(comma separated)</span></label>
                <input placeholder="e.g. Acne Care, Anti-Aging, Massage" className={inp}
                  value={form.specializations} onChange={e => set('specializations', e.target.value)}
                />
              </div>

              {isEditing && (
                <div className="flex items-center justify-between bg-white/80 rounded-2xl px-5 py-4">
                  <span className="text-sm font-black text-gray-700">Currently On Leave</span>
                  <button
                    type="button"
                    onClick={() => set('isOnLeave', !form.isOnLeave)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.isOnLeave ? 'bg-amber-400' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isOnLeave ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              <button type="button" onClick={() => setTab('hours')}
                className="w-full py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-[#24a1ad] transition-all shadow-lg shadow-brand/20 mt-2"
              >
                Next: Working Hours →
              </button>
            </div>
          )}

          {/* ════ TAB 3: Working Hours ════ */}
          {tab === 'hours' && (
            <div className="space-y-3 pb-6">
              <p className="text-xs text-gray-400 mb-4">Set which days this staff member works and their shift hours.</p>

              {DAYS.map(day => {
                const d = form.workingHours[day] || defaultDay();
                return (
                  <div key={day} className={`bg-white/80 rounded-2xl overflow-hidden transition-all ${d.isWorking ? 'shadow-md' : ''}`}>
                    {/* Day header */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      <button
                        type="button"
                        onClick={() => updateDay(day, 'isWorking', !d.isWorking)}
                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${d.isWorking ? 'bg-brand' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.isWorking ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-sm font-black capitalize w-24 ${d.isWorking ? 'text-gray-800' : 'text-gray-400'}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                      {d.isWorking && (
                        <div className="flex items-center gap-2 ml-auto">
                          <input type="time" value={d.start}
                            onChange={e => updateDay(day, 'start', e.target.value)}
                            className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                          />
                          <span className="text-gray-400 text-xs">—</span>
                          <input type="time" value={d.end}
                            onChange={e => updateDay(day, 'end', e.target.value)}
                            className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                          />
                        </div>
                      )}
                      {!d.isWorking && (
                        <span className="ml-auto text-[10px] text-gray-300 font-black uppercase tracking-widest">Day Off</span>
                      )}
                    </div>

                    {/* Breaks */}
                    {d.isWorking && (
                      <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-2">
                        {d.breaks?.map((br, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest w-14">Break</span>
                            <input type="time" value={br.start}
                              onChange={e => updateBreak(day, idx, 'start', e.target.value)}
                              className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                            />
                            <span className="text-gray-400 text-xs">—</span>
                            <input type="time" value={br.end}
                              onChange={e => updateBreak(day, idx, 'end', e.target.value)}
                              className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                            />
                            <button type="button" onClick={() => removeBreak(day, idx)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addBreak(day)}
                          className="flex items-center gap-1.5 text-[10px] font-black text-brand uppercase tracking-widest hover:text-[#24a1ad] transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Break
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand hover:bg-[#24a1ad] py-5 rounded-2xl font-black text-white shadow-xl shadow-brand/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                  )}
                  {loading
                    ? (isEditing ? 'Updating...' : 'Creating...')
                    : (isEditing ? 'Update Staff' : '✉ Create Staff & Send Invite')
                  }
                </button>
                <button type="button" onClick={onClose}
                  className="w-full py-4 font-bold text-gray-400 hover:text-[#B62025] transition-colors uppercase tracking-widest text-[10px]"
                >
                  Cancel and go back
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StaffFormModal;