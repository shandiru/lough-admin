import React from 'react';
import { Users, UserPlus, Search } from 'lucide-react';

export const StaffHeader = ({ count, active, pending, leave, onAdd }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
          <Users className="w-4 h-4 text-brand" />
        </div>
        <span className="text-[10px] font-black text-brand uppercase tracking-[3px]">Lough Skin Admin</span>
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
        Staff <span className="text-[#22B8C8]">Management</span>
      </h1>
      <div className="flex flex-wrap items-center gap-4 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-brand rounded-full" />
          <span className="text-xs text-gray-400 font-medium">{count} total</span>
        </div>
        {active > 0 && <span className="text-xs text-emerald-500 font-bold">{active} active</span>}
        {pending > 0 && <span className="text-xs text-amber-500 font-bold">{pending} pending</span>}
      </div>
    </div>
    <button onClick={onAdd} className="flex items-center justify-center gap-2 bg-brand hover:bg-[#24a1ad] text-white px-7 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-95 group shrink-0">
      <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
      <span className="uppercase tracking-wider text-sm">Add Staff</span>
    </button>
  </div>
);

export const SearchBar = ({ value, onChange }) => (
  <div className="relative mb-8 max-w-md">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      placeholder="Search staff by name..."
      className="w-full pl-11 pr-5 py-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300 transition-all"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);