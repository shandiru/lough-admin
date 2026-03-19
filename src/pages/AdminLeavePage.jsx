import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, Ban, Users, Loader2, List, CalendarDays, Filter
} from 'lucide-react';
import { leaveService } from '../api/leaveService';
import AdminLeaveReviewModal   from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal   from '../components/Leave/Adminleavetogglemodal';
import toast from 'react-hot-toast';

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_META = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400',  icon: <Clock size={10}/> },
  approved:  { cls: 'bg-green-100  text-green-700  border-green-200',  dot: 'bg-green-500',   icon: <CheckCircle size={10}/> },
  rejected:  { cls: 'bg-red-100    text-red-600    border-red-200',    dot: 'bg-red-400',     icon: <XCircle size={10}/> },
  cancelled: { cls: 'bg-gray-100   text-gray-400   border-gray-200',   dot: 'bg-gray-300',    icon: <Ban size={10}/> },
};

// Calendar dot colours per status
const DOT_COLORS = {
  pending:   '#FBBF24',
  approved:  '#10B981',
  rejected:  '#F87171',
  cancelled: '#D1D5DB',
};

function isoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getDuration(leave) {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const [sh,sm] = leave.startTime.split(':').map(Number);
    const [eh,em] = leave.endTime.split(':').map(Number);
    const mins = (eh*60+em)-(sh*60+sm);
    if (mins<=0) return null;
    const h=Math.floor(mins/60), m=mins%60;
    return h>0 ? `${h}h${m>0?` ${m}m`:''}` : `${m}m`;
  }
  const days = Math.ceil((new Date(leave.endDate)-new Date(leave.startDate))/86400000)+1;
  return `${days} day${days>1?'s':''}`;
}

function getImageUrl(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api','')}${src}`;
}

// Does a leave span a given calendar day?
function leaveCoversDay(leave, iso) {
  const start = isoDate(new Date(leave.startDate));
  const end   = isoDate(new Date(leave.endDate));
  return iso >= start && iso <= end;
}

// ─── Staff Avatar ─────────────────────────────────────────────────────────────
function Avatar({ staff, size = 7 }) {
  const img      = getImageUrl(staff?.profileImage);
  const initials = `${staff?.firstName?.[0]??''}${staff?.lastName?.[0]??''}`.toUpperCase();
  const sz       = `w-${size} h-${size}`;
  return (
    <div className={`${sz} rounded-full bg-[#22B8C8]/20 text-[#22B8C8] font-black text-xs flex items-center justify-center shrink-0 overflow-hidden`}>
      {img ? <img src={img} alt={initials} className="w-full h-full object-cover"/> : initials}
    </div>
  );
}

// ─── Leave Card (list view) ───────────────────────────────────────────────────
function LeaveCard({ leave, onAction }) {
  const s        = STATUS_META[leave.status] || STATUS_META.pending;
  const staff    = leave.staffId?.userId;
  const duration = getDuration(leave);
  const isPending  = leave.status === 'pending';
  const isReviewed = leave.status === 'approved' || leave.status === 'rejected';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:shadow-md transition-shadow">
      <Avatar staff={staff} size={9}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-bold text-sm text-gray-800">
              {staff?.firstName} {staff?.lastName}
            </p>
            <p className="text-[10px] text-gray-400">{staff?.email}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${s.cls}`}>
              {s.icon} {leave.status}
            </span>
            {leave.isHourly && (
              <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={8}/> Hourly
              </span>
            )}
            {duration && (
              <span className="text-[9px] font-black text-[#22B8C8] bg-[#22B8C8]/10 px-2 py-0.5 rounded-full">
                {duration}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-1.5 font-medium capitalize">
          {leave.type} Leave
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {leave.isHourly
            ? `${new Date(leave.startDate).toDateString()} · ${leave.startTime}–${leave.endTime}`
            : `${new Date(leave.startDate).toDateString()} → ${new Date(leave.endDate).toDateString()}`}
        </p>
        {leave.reason && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">"{leave.reason}"</p>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          {isPending && (
            <>
              <button
                onClick={() => onAction('review', leave)}
                className="text-xs font-bold px-3 py-1.5 bg-[#22B8C8] text-white rounded-xl hover:opacity-90 transition flex items-center gap-1.5"
              >
                <CheckCircle size={12}/> Review
              </button>
            </>
          )}
          {isReviewed && (
            <button
              onClick={() => onAction('toggle', leave)}
              className="text-xs font-bold px-3 py-1.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition"
            >
              Change Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Cell Popover ────────────────────────────────────────────────────
function DayPopover({ leaves, onAction, onClose }) {
  if (!leaves.length) return null;
  return (
    <div
      className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-2"
      onClick={e => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xs font-bold">✕</button>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{leaves.length} leave{leaves.length>1?'s':''}</p>
      {leaves.map(leave => {
        const s     = STATUS_META[leave.status] || STATUS_META.pending;
        const staff = leave.staffId?.userId;
        const dur   = getDuration(leave);
        const isPending  = leave.status === 'pending';
        const isReviewed = leave.status === 'approved' || leave.status === 'rejected';
        return (
          <div key={leave._id} className="border border-gray-100 rounded-xl p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Avatar staff={staff} size={6}/>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{staff?.firstName} {staff?.lastName}</p>
                <p className="text-[9px] text-gray-400 capitalize">{leave.type} leave {dur ? `· ${dur}`:''}</p>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${s.cls}`}>
                {leave.status}
              </span>
            </div>
            <div className="flex gap-1.5">
              {isPending && (
                <button onClick={() => { onAction('review', leave); onClose(); }}
                  className="flex-1 text-[9px] font-bold py-1 bg-[#22B8C8] text-white rounded-lg hover:opacity-90 transition">
                  Review
                </button>
              )}
              {isReviewed && (
                <button onClick={() => { onAction('toggle', leave); onClose(); }}
                  className="flex-1 text-[9px] font-bold py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition">
                  Change
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────
function LeaveMonthCalendar({ leaves, filterStaff, onAction }) {
  const today     = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [openDay,  setOpenDay]  = useState(null);

  const yr = viewDate.getFullYear();
  const mo = viewDate.getMonth();

  // Build calendar cells (padded to start on Sunday)
  const cells = useMemo(() => {
    const arr = [];
    const firstDow = new Date(yr, mo, 1).getDay();
    for (let i=0; i<firstDow; i++) arr.push(null);
    const daysInMonth = new Date(yr, mo+1, 0).getDate();
    for (let d=1; d<=daysInMonth; d++) arr.push(d);
    return arr;
  }, [yr, mo]);

  // Map iso-date → leaves for this month
  const dayLeaveMap = useMemo(() => {
    const map = {};
    const filtered = filterStaff === 'all' ? leaves
      : leaves.filter(l => l.staffId?._id === filterStaff || l.staffId === filterStaff);

    filtered.forEach(leave => {
      // Expand multi-day leaves across all days they span
      const start = new Date(leave.startDate);
      const end   = new Date(leave.endDate);
      start.setHours(0,0,0,0); end.setHours(0,0,0,0);
      const cur = new Date(start);
      while (cur <= end) {
        const iso = isoDate(cur);
        if (!map[iso]) map[iso] = [];
        map[iso].push(leave);
        cur.setDate(cur.getDate()+1);
      }
    });
    return map;
  }, [leaves, filterStaff]);

  const todayIso = isoDate(today);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={() => setViewDate(new Date(yr, mo-1, 1))}
          className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16}/>
        </button>
        <span className="font-black text-gray-800">{MONTHS[mo]} {yr}</span>
        <button onClick={() => setViewDate(new Date(yr, mo+1, 1))}
          className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-50">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase py-2.5 tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-16 border-b border-r border-gray-50 last:border-r-0"/>;

          const iso       = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday   = iso === todayIso;
          const dayLeaves = dayLeaveMap[iso] || [];
          const isOpen    = openDay === iso;

          // Aggregate dots: up to 3 distinct status dots
          const statusSet = [...new Set(dayLeaves.map(l => l.status))].slice(0,3);

          return (
            <div
              key={iso}
              className={`relative h-16 border-b border-r border-gray-50 last:border-r-0 p-1 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-[#22B8C8]/5' : ''
              }`}
              onClick={() => setOpenDay(isOpen ? null : (dayLeaves.length ? iso : null))}
            >
              <span className={`text-xs font-black self-start leading-none rounded-lg px-1.5 py-1 ${
                isToday ? 'bg-[#22B8C8] text-white' : 'text-gray-600'
              }`}>
                {day}
              </span>

              {/* Status dots */}
              {statusSet.length > 0 && (
                <div className="flex items-center gap-0.5 mt-auto flex-wrap">
                  {statusSet.map(st => (
                    <span key={st} className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor: DOT_COLORS[st]}}/>
                  ))}
                  {dayLeaves.length > 1 && (
                    <span className="text-[8px] text-gray-400 font-black ml-0.5">×{dayLeaves.length}</span>
                  )}
                </div>
              )}

              {/* Popover */}
              {isOpen && dayLeaves.length > 0 && (
                <DayPopover
                  leaves={dayLeaves}
                  onAction={onAction}
                  onClose={() => setOpenDay(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-gray-50">
        {Object.entries(DOT_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: color}}/>
            <span className="text-[10px] text-gray-500 capitalize font-medium">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLeavePage() {
  const [leaves,      setLeaves]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter,  setStaffFilter]  = useState('all');
  const [viewMode,    setViewMode]    = useState('calendar'); // 'calendar' | 'list'
  const [reviewLeave, setReviewLeave] = useState(null);
  const [toggleLeave, setToggleLeave] = useState(null);

  const fetchLeaves = async (status) => {
    setLoading(true);
    try {
      const res = await leaveService.getAllLeaves(status === 'all' ? '' : status);
      setLeaves(res.data?.leaves || res.data || []);
    } catch {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(statusFilter); }, [statusFilter]);

  // Unique staff list from loaded leaves
  const staffList = useMemo(() => {
    const map = {};
    leaves.forEach(l => {
      const id = l.staffId?._id;
      if (id && !map[id]) map[id] = l.staffId?.userId;
    });
    return Object.entries(map).map(([id, u]) => ({ id, user: u }));
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    if (staffFilter === 'all') return leaves;
    return leaves.filter(l => l.staffId?._id === staffFilter || l.staffId === staffFilter);
  }, [leaves, staffFilter]);

  // Counters
  const counts = useMemo(() => {
    const c = { all:0, pending:0, approved:0, rejected:0, cancelled:0 };
    leaves.forEach(l => { c.all++; c[l.status] = (c[l.status]||0)+1; });
    return c;
  }, [leaves]);

  const handleAction = (type, leave) => {
    if (type === 'review') setReviewLeave(leave);
    if (type === 'toggle') setToggleLeave(leave);
  };

  const handleReviewed = (id, status, adminNote) => {
    setLeaves(prev => prev.map(l => l._id === id ? { ...l, status, adminNote } : l));
  };

  const STATUS_TABS = ['all','pending','approved','rejected','cancelled'];

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-6">

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and manage all staff leave requests</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label:'Pending',   count: counts.pending,   color:'text-yellow-600 bg-yellow-50 border-yellow-100' },
          { label:'Approved',  count: counts.approved,  color:'text-green-600  bg-green-50  border-green-100' },
          { label:'Rejected',  count: counts.rejected,  color:'text-red-500    bg-red-50    border-red-100' },
          { label:'Total',     count: counts.all,       color:'text-[#22B8C8]  bg-[#22B8C8]/5 border-[#22B8C8]/20' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-2xl font-black">{count}</p>
            <p className="text-xs font-bold opacity-70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#22B8C8] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {s} {counts[s] > 0 ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>

        {/* Staff filter */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-1.5">
          <Users size={13} className="text-gray-400"/>
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="text-xs font-medium text-gray-600 outline-none bg-transparent"
          >
            <option value="all">All Staff</option>
            {staffList.map(({ id, user }) => (
              <option key={id} value={id}>{user?.firstName} {user?.lastName}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-all ${viewMode==='calendar' ? 'bg-[#22B8C8] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <CalendarDays size={15}/>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode==='list' ? 'bg-[#22B8C8] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={15}/>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#22B8C8]"/>
        </div>
      ) : viewMode === 'calendar' ? (
        <LeaveMonthCalendar
          leaves={filteredLeaves}
          filterStaff={staffFilter}
          onAction={handleAction}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-3 text-gray-300">
              <Clock size={40} strokeWidth={1.2}/>
              <p className="text-sm font-medium">No leave requests found</p>
            </div>
          ) : (
            filteredLeaves.map(leave => (
              <LeaveCard key={leave._id} leave={leave} onAction={handleAction}/>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {reviewLeave && (
        <AdminLeaveReviewModal
          leave={reviewLeave}
          onClose={() => setReviewLeave(null)}
          onReviewed={(id, status, note) => { handleReviewed(id, status, note); setReviewLeave(null); }}
        />
      )}
      {toggleLeave && (
        <AdminLeaveToggleModal
          leave={toggleLeave}
          onClose={() => setToggleLeave(null)}
          onReviewed={(id, status, note) => { handleReviewed(id, status, note); setToggleLeave(null); }}
        />
      )}
    </div>
  );
}