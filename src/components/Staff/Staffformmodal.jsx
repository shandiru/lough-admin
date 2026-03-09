import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Clock, Plus, Trash2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultDay = () => ({ isWorking: false, start: '09:00', end: '17:00', breaks: [] });
const defaultWorkingHours = () => DAYS.reduce((acc, d) => { acc[d] = defaultDay(); return acc; }, {});

const TABS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'profile',  label: 'Profile',  icon: Briefcase },
  { key: 'hours',    label: 'Hours',    icon: Clock },
];

const UK_PHONE_REGEX = /^(07\d{3} \d{6}|(\+44\s?7\d{3}\s?\d{6}))$/;
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StaffFormModal = ({ services = [], editData = null, onClose, onSuccess }) => {
  const isEditing = !!editData;

  const [tab, setTab] = useState('personal');
  const [loading, setLoading] = useState(false);

  
  const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', phone: '' });

 
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'female',
    skills: [],
    genderRestriction: 'all',
    bio: '',
    specializations: '',
    isOnLeave: false,
    workingHours: defaultWorkingHours(),
  });


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
  const setErr = (key, msg) => setErrors(e => ({ ...e, [key]: msg }));
  const clrErr = (key) => setErrors(e => ({ ...e, [key]: '' }));

  // ── Live validators ──
  const handleFirstNameChange = (val) => {
    set('firstName', val);
    if (!val.trim())              setErr('firstName', 'First name is required');
    else if (val.trim().length < 2) setErr('firstName', 'Minimum 2 characters');
    else                           clrErr('firstName');
  };

  const handleLastNameChange = (val) => {
    set('lastName', val);
    if (!val.trim())              setErr('lastName', 'Last name is required');
    else if (val.trim().length < 2) setErr('lastName', 'Minimum 2 characters');
    else                           clrErr('lastName');
  };

  const handleEmailChange = (val) => {
    set('email', val);
    if (!val.trim())                       setErr('email', 'Email is required');
    else if (!EMAIL_REGEX.test(val.trim())) setErr('email', 'Enter a valid email (e.g. jane@example.com)');
    else                                   clrErr('email');
  };

  const handlePhoneChange = (val) => {
    set('phone', val);
    if (val && !UK_PHONE_REGEX.test(val.trim()))
      setErr('phone', 'Enter a valid UK number: 07911 123456 or +44 7911 123456');
    else
      clrErr('phone');
  };

  // ── Next guard: validates ALL personal fields before moving to Profile tab ──
  const handleNextToProfile = () => {
    const newErrors = { firstName: '', lastName: '', email: '', phone: '' };
    let hasError = false;

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required'; hasError = true;
    } else if (form.firstName.trim().length < 2) {
      newErrors.firstName = 'Minimum 2 characters'; hasError = true;
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required'; hasError = true;
    } else if (form.lastName.trim().length < 2) {
      newErrors.lastName = 'Minimum 2 characters'; hasError = true;
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required'; hasError = true;
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'Enter a valid email (e.g. jane@example.com)'; hasError = true;
    }

    if (form.phone && !UK_PHONE_REGEX.test(form.phone.trim())) {
      newErrors.phone = 'Enter a valid UK number: 07911 123456 or +44 7911 123456'; hasError = true;
    }

    setErrors(newErrors);
    if (hasError) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    setTab('profile');
  };

  const toggleSkill = (id) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(id) ? f.skills.filter(s => s !== id) : [...f.skills, id],
    }));
  };

  const updateDay = (day, key, val) =>
    setForm(f => ({ ...f, workingHours: { ...f.workingHours, [day]: { ...f.workingHours[day], [key]: val } } }));

  const addBreak = (day) =>
    updateDay(day, 'breaks', [...(form.workingHours[day]?.breaks || []), { start: '12:00', end: '13:00' }]);

  const removeBreak = (day, idx) =>
    updateDay(day, 'breaks', form.workingHours[day]?.breaks?.filter((_, i) => i !== idx) || []);

  const updateBreak = (day, idx, key, val) =>
    updateDay(day, 'breaks', form.workingHours[day]?.breaks?.map((b, i) => i === idx ? { ...b, [key]: val } : b) || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean) };
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

  // ── Styles ──
  const inp    = 'w-full px-5 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 placeholder:text-gray-300 font-medium text-sm';
  const inpErr = 'w-full px-5 py-4 bg-white/80 border border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-2xl outline-none transition-all text-gray-900 placeholder:text-gray-300 font-medium text-sm';
  const sel    = `${inp} appearance-none cursor-pointer font-black`;
  const lbl    = 'text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1';

  // Reusable hint component
  const Hint = ({ field, grey }) =>
    errors[field]
      ? <p className="text-[10px] text-red-400 mt-1.5 ml-2 font-semibold">{errors[field]}</p>
      : grey ? <p className="text-[10px] text-gray-400 mt-1.5 ml-2">{grey}</p>
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5EDE4] w-full max-w-xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-brand-soft/30 max-h-[95dvh] flex flex-col">

        {/* ── Header ── */}
        <div className="p-6 sm:p-10 pb-0 shrink-0">
          <div className="flex justify-between items-start mb-7">
            <div>
              <h2 className="text-3xl font-serif italic text-gray-900 leading-tight">
                {isEditing ? 'Edit' : 'Add New'} <span className="text-[#22B8C8]">Staff</span>
              </h2>
              {isEditing
                ? <p className="text-xs text-gray-400 mt-1 font-medium">{editData?.userId?.firstName} {editData?.userId?.lastName}</p>
                : <p className="text-xs text-gray-400 mt-1">An invite email will be sent automatically</p>
              }
              <div className="h-1 w-14 bg-brand mt-3 rounded-full" />
            </div>
            <button onClick={onClose} className="p-2.5 bg-white/60 rounded-full hover:rotate-90 hover:bg-white transition-all duration-300 border border-brand-soft/30 shrink-0">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex bg-white/50 rounded-2xl p-1 gap-1 mb-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  tab === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 sm:px-10 pt-5">

          {/* ════ TAB 1: Personal ════ */}
          {tab === 'personal' && (
            <div className="space-y-5 pb-6">

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>First Name <span className="text-red-400 normal-case">*</span></label>
                  <input
                    placeholder="Jane"
                    className={errors.firstName ? inpErr : inp}
                    value={form.firstName}
                    onChange={e => handleFirstNameChange(e.target.value)}
                   
                  />
                  <Hint field="firstName" />
                </div>
                <div>
                  <label className={lbl}>Last Name <span className="text-red-400 normal-case">*</span></label>
                  <input
                    placeholder="Doe"
                    className={errors.lastName ? inpErr : inp}
                    value={form.lastName}
                    onChange={e => handleLastNameChange(e.target.value)}
                  />
                  <Hint field="lastName" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={lbl}>Email <span className="text-red-400 normal-case">*</span></label>
                <input
                  type="email"
                  placeholder="jane@loughskin.com"
                  className={errors.email ? inpErr : inp}
                  value={form.email}
                  onChange={e => handleEmailChange(e.target.value)}
                 
                />
                {isEditing
                  ? <p className="text-[10px] text-gray-400 mt-1 ml-2">Email cannot be changed after creation</p>
                  : <Hint field="email" grey="Must be a valid email address" />
                }
              </div>

              {/* Phone */}
              <div>
                <label className={lbl}>Phone</label>
                <input
                  placeholder="07911 123456 or +44 7911 123456"
                  className={errors.phone ? inpErr : inp}
                  value={form.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                />
                <Hint field="phone" grey="UK format only: 07911 123456 or +44 7911 123456" />
              </div>

              {/* Gender */}
              <div>
                <label className={lbl}>Gender</label>
                <select className={sel} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* ── Next button: BLOCKED until First, Last, Email are valid ── */}
              <button
                type="button"
                onClick={handleNextToProfile}
                className="w-full py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-[#24a1ad] transition-all shadow-lg shadow-brand/20 mt-2"
              >
                Next: Profile Details →
              </button>
            </div>
          )}

          {/* ════ TAB 2: Profile ════ */}
          {tab === 'profile' && (
            <div className="space-y-5 pb-6">
              <div>
                <label className={lbl}>Skills / Services</label>
                <div className="bg-white/80 rounded-2xl p-4 space-y-2 max-h-44 overflow-y-auto">
                  {services.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-2">No services found</p>
                    : services.map(svc => (
                      <label key={svc._id} className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-xl hover:bg-brand/5 transition-colors">
                        <div onClick={() => toggleSkill(svc._id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            form.skills.includes(svc._id) ? 'bg-brand border-brand' : 'border-gray-300'
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
                    ))
                  }
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
                  <button type="button" onClick={() => set('isOnLeave', !form.isOnLeave)}
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
                    <div className="flex items-center gap-4 px-5 py-4">
                      <button type="button" onClick={() => updateDay(day, 'isWorking', !d.isWorking)}
                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${d.isWorking ? 'bg-brand' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.isWorking ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-sm font-black capitalize w-24 ${d.isWorking ? 'text-gray-800' : 'text-gray-400'}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                      {d.isWorking ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <input type="time" value={d.start} onChange={e => updateDay(day, 'start', e.target.value)}
                            className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                          />
                          <span className="text-gray-400 text-xs">—</span>
                          <input type="time" value={d.end} onChange={e => updateDay(day, 'end', e.target.value)}
                            className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                          />
                        </div>
                      ) : (
                        <span className="ml-auto text-[10px] text-gray-300 font-black uppercase tracking-widest">Day Off</span>
                      )}
                    </div>

                    {d.isWorking && (
                      <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-2">
                        {d.breaks?.map((br, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest w-14">Break</span>
                            <input type="time" value={br.start} onChange={e => updateBreak(day, idx, 'start', e.target.value)}
                              className="text-xs font-black text-gray-700 bg-[#F5EDE4] rounded-xl px-3 py-2 border border-transparent focus:border-brand outline-none"
                            />
                            <span className="text-gray-400 text-xs">—</span>
                            <input type="time" value={br.end} onChange={e => updateBreak(day, idx, 'end', e.target.value)}
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

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" disabled={loading}
                  className="w-full bg-brand hover:bg-[#24a1ad] py-5 rounded-2xl font-black text-white shadow-xl shadow-brand/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />}
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