import React from 'react';
import { X, Pencil, Mail, Phone, Clock, Scissors, Calendar, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const GENDER_LABEL = { all: 'All Clients', 'female-only': 'Female Only', 'male-only': 'Male Only' };
const GCAL_STATUS_STYLE = {
  connected:    'bg-emerald-100 text-emerald-600',
  disconnected: 'bg-gray-100 text-gray-400',
  error:        'bg-red-100 text-red-500',
};

const StaffProfileModal = ({ staff, onClose, onEdit }) => {
  const u = staff.userId || {};
  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  const gcalStatus = staff.googleCalendarSyncStatus?.status || 'disconnected';
  const workingDays = DAYS.filter(d => staff.workingHours?.[d]?.isWorking);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5EDE4] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-brand-soft/30 max-h-[95dvh] overflow-y-auto">

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-[#1a8f9a] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/30">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {u.firstName} {u.lastName}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onEdit}
                className="p-2.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-full transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={onClose}
                className="p-2.5 bg-white/60 rounded-full hover:rotate-90 hover:bg-white transition-all duration-300 border border-brand-soft/30"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {u.isActive ? '● Active' : '● Inactive'}
            </span>
            {staff.isOnLeave && (
              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-100 text-amber-600">
                ● On Leave
              </span>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-brand/10 text-brand">
              {GENDER_LABEL[staff.genderRestriction]}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${GCAL_STATUS_STYLE[gcalStatus]}`}>
              {gcalStatus === 'connected' ? <span className="flex items-center gap-1"><Wifi className="w-3 h-3 inline" /> Google Cal</span> : 'Cal Not Synced'}
            </span>
          </div>
          <div className="h-px bg-gray-200 mb-6" />
        </div>

        {/* Body */}
        <div className="px-8 pb-8 space-y-6">

          {/* Contact */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-3">Contact</p>
            <div className="space-y-2">
              {u.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{u.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{u.email}</span>
              </div>
              {u.lastLogin && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 font-medium">
                    Last login: {new Date(u.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {!u.isActive && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-500 font-bold">Awaiting email verification / account activation</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {staff.bio && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-3">Bio</p>
              <p className="text-sm text-gray-600 leading-relaxed">{staff.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {staff.specializations?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-3">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {staff.specializations.map((s, i) => (
                  <span key={i} className="text-xs font-semibold px-3 py-1.5 bg-white/80 text-gray-600 rounded-xl border border-gray-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {staff.skills?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Skills</p>
              </div>
              <div className="space-y-2">
                {staff.skills.map(sk => (
                  <div key={sk._id} className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-gray-700">{sk.name}</span>
                    <span className="text-xs text-gray-400">€{sk.price} · {sk.duration}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Working Hours */}
          {workingDays.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Working Hours</p>
              </div>
              <div className="space-y-2">
                {workingDays.map(day => {
                  const d = staff.workingHours[day];
                  return (
                    <div key={day} className="flex items-start justify-between bg-white/60 rounded-xl px-4 py-3">
                      <span className="text-sm font-black text-gray-700 capitalize w-24">{day}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-brand">{d.start} – {d.end}</span>
                        {d.breaks?.map((br, i) => (
                          <p key={i} className="text-[10px] text-gray-400 mt-0.5">Break: {br.start} – {br.end}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Leave */}
          {staff.isOnLeave && staff.currentLeave?.startDate && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-[3px] mb-2">Current Leave</p>
              <p className="text-sm font-bold text-gray-700 capitalize">{staff.currentLeave.type || 'Leave'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(staff.currentLeave.startDate).toLocaleDateString('en-GB')}
                {staff.currentLeave.endDate && ` → ${new Date(staff.currentLeave.endDate).toLocaleDateString('en-GB')}`}
              </p>
              {staff.currentLeave.reason && (
                <p className="text-xs text-gray-400 mt-1 italic">"{staff.currentLeave.reason}"</p>
              )}
            </div>
          )}

          {/* Google Calendar */}
          <div className="bg-white/60 rounded-2xl p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">Google Calendar</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold capitalize ${gcalStatus === 'connected' ? 'text-emerald-600' : gcalStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                {gcalStatus}
              </span>
              {staff.googleCalendarSyncStatus?.lastSync && (
                <span className="text-[10px] text-gray-300">
                  Last sync: {new Date(staff.googleCalendarSyncStatus.lastSync).toLocaleDateString('en-GB')}
                </span>
              )}
            </div>
            {gcalStatus === 'error' && staff.googleCalendarSyncStatus?.errorMessage && (
              <p className="text-xs text-red-400 mt-1">{staff.googleCalendarSyncStatus.errorMessage}</p>
            )}
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="w-full py-4 font-bold text-gray-400 hover:text-[#B62025] transition-colors uppercase tracking-widest text-[10px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;