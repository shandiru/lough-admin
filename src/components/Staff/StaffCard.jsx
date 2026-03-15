import React from 'react';
import { Scissors, ToggleLeft, ToggleRight, Pencil, Trash2, Mail, Clock, RefreshCw } from 'lucide-react';

const GENDER_LABEL = { all: 'All', 'female-only': 'Female Only', 'male-only': 'Male Only' };

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
};

const StaffCard = ({ staff, onView, onEdit, onToggle, onDelete, onResendInvite }) => {
  const u = staff.userId || {};
  const isActive = u.isActive;
  const isPending = !isActive;
  const isEmailChangePending = isPending && !!staff.pendingEmail;
  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  const profileImage = getImageUrl(u.profileImage);

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-[28px] p-6 shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
      isActive ? 'border-white' : 'border-dashed border-gray-200 opacity-80'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-[#1a8f9a] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand/25 shrink-0 overflow-hidden">
            {profileImage
              ? <img src={profileImage} alt={initials} className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 text-sm leading-tight truncate">{u.firstName} {u.lastName}</p>
            <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{u.email}</p>
          </div>
        </div>
        {/* <button onClick={onToggle} className="p-1 shrink-0">
          {isActive ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
        </button> */}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
          isActive
            ? 'bg-emerald-100 text-emerald-600'
            : isEmailChangePending
            ? 'bg-blue-100 text-blue-600'
            : 'bg-amber-100 text-amber-500'
        }`}>
          {isActive ? 'Active' : isEmailChangePending ? 'Email Verify Pending' : 'Pending Setup'}
        </span>
        {staff.isOnLeave && <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-500">On Leave</span>}
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand/10 text-brand">{GENDER_LABEL[staff.genderRestriction]}</span>
      </div>

      {staff.skills?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Scissors className="w-3 h-3 text-gray-300" />
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">Skills</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {staff.skills.slice(0, 3).map(sk => (
              <span key={sk._id} className="text-[10px] font-semibold px-2 py-1 bg-[#F5EDE4] text-gray-600 rounded-lg">{sk.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="h-5 mb-4">
        {isActive && u.lastLogin ? (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-200" />
            <span className="text-[10px] text-gray-300 font-medium">Last login: {new Date(u.lastLogin).toLocaleDateString('en-GB')}</span>
          </div>
        ) : isEmailChangePending ? (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-500 font-bold">Awaiting email verification</span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-bold">Awaiting account setup</span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button onClick={onView} className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-[#F5EDE4] hover:bg-brand/10 text-gray-500 hover:text-brand rounded-xl transition-colors">View</button>
        <button onClick={onEdit} className="p-2.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        {isPending && (
          <button
            onClick={onResendInvite}
            title={isEmailChangePending ? 'Resend email verification link' : 'Resend setup invite'}
            className={`p-2.5 rounded-xl transition-colors ${isEmailChangePending ? 'bg-blue-100 hover:bg-blue-200 text-blue-500' : 'bg-amber-100 hover:bg-amber-200 text-amber-500'}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onDelete} className="p-2.5 rounded-xl bg-[#B62025]/10 hover:bg-[#B62025]/20 text-[#B62025] dark:text-[#FF4B4B] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
};

export default StaffCard;