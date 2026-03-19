import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Users, Loader2,
  CheckCircle, XCircle, Clock, Ban, BedDouble
} from 'lucide-react';
import { leaveService } from '../api/leaveService';
import AdminLeaveReviewModal from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal from '../components/Leave/Adminleavetogglemodal';
import toast from 'react-hot-toast';

// ─── constants (same palette as booking calendar) ─────────────────────────────
const HOURS      = Array.from({ length: 13 }, (_, i) => i + 8); // 08–20
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STAFF_COLORS = [
  '#22B8C8', '#C9AF94', '#a78bfa', '#f97316',
  '#10b981', '#ec4899', '#3b82f6', '#f59e0b',
];

const STATUS_CLS = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved:  'bg-green-100  text-green-700  border-green-200',
  rejected:  'bg-red-100    text-red-600    border-red-200',
  cancelled: 'bg-gray-100   text-gray-400   border-gray-200',
};

// ─── pure helpers ─────────────────────────────────────────────────────────────
function isoDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toMins(t)     { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function getTop(time) {
  const [h, m] = time.split(':').map(Number);
  return ((h - 8) * 60 + m) / (12 * 60) * 100;
}
function getHeight(start, end) {
  return Math.max((toMins(end) - toMins(start)) / (12 * 60) * 100, 2.5);
}
function getDuration(leave) {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const mins = toMins(leave.endTime) - toMins(leave.startTime);
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  }
  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
  return `${days} day${days > 1 ? 's' : ''}`;
}
function getImageUrl(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`;
}

// ─── Avatar (same as booking drawer style) ───────────────────────────────────
function Avatar({ staff }) {
  const img      = getImageUrl(staff?.profileImage);
  const initials = `${staff?.firstName?.[0] ?? ''}${staff?.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[#22B8C8]/20 text-[#22B8C8] font-black text-[10px]
                    flex items-center justify-center shrink-0 overflow-hidden">
      {img ? <img src={img} alt={initials} className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  LEAVE CALENDAR  (looks & feels exactly like CalendarView.jsx in booking page)
// ════════════════════════════════════════════════════════════════════════════════
function LeaveCalendar({ leaves, staffColorMap, staffList, filterStaff, onAction }) {
  const [viewMode,    setViewMode]    = useState('week');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  // visible days
  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const d = new Date(currentDate), dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [currentDate, viewMode]);

  const navigate = (dir) => setCurrentDate(d => addDays(d, dir * (viewMode === 'day' ? 1 : 7)));
  const todayStr = isoDate(new Date());

  // expand multi-day leaves into per-day buckets
  const leavesByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { m[isoDate(d)] = []; });

    const filtered = filterStaff === 'all'
      ? leaves
      : leaves.filter(l => (l.staffId?._id ?? l.staffId) === filterStaff);

    filtered.forEach(leave => {
      const start = new Date(leave.startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(leave.endDate);   end.setHours(0, 0, 0, 0);
      for (const cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        const ds = isoDate(cur);
        if (m[ds]) m[ds].push(leave);
      }
    });
    return m;
  }, [leaves, days, filterStaff]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── toolbar (identical layout to CalendarView) ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">

        {/* day / week toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day', 'week'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                viewMode === m
                  ? 'bg-white text-[#22B8C8] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m}
            </button>
          ))}
        </div>

        {/* nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-xs font-bold text-[#22B8C8] px-3 py-1.5 hover:bg-[#22B8C8]/10 rounded-lg transition-colors">
            Today
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* date range label */}
        <span className="text-sm font-bold text-gray-700">
          {viewMode === 'day'
            ? currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
            : `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>
      </div>

      {/* ── time grid (identical structure to CalendarView) ── */}
      <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
        <div className="flex min-w-[600px]">

          {/* hour gutter */}
          <div className="w-14 shrink-0 border-r border-gray-100 pt-10">
            {HOURS.map(h => (
              <div key={h} className="h-16 border-t border-gray-50 flex items-start px-2 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* day columns */}
          {days.map(day => {
            const ds        = isoDate(day);
            const isToday   = ds === todayStr;
            const dayLeaves = leavesByDay[ds] || [];
            const fullDay   = dayLeaves.filter(l => !l.isHourly);
            const hourly    = dayLeaves.filter(l => l.isHourly);

            return (
              <div key={ds} className="flex-1 min-w-[90px] border-r border-gray-100 last:border-r-0">

                {/* column header */}
                <div className={`sticky top-0 z-10 border-b border-gray-100
                                 ${isToday ? 'bg-[#22B8C8]/10' : 'bg-white'}`}>
                  {/* date label */}
                  <div className="h-10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </span>
                    <span className={`text-sm font-black ${isToday ? 'text-[#22B8C8]' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* full-day leave chips — sit right under the date number */}
                  {fullDay.length > 0 && (
                    <div className="px-0.5 pb-1 flex flex-col gap-0.5">
                      {fullDay.map((leave, i) => {
                        const color = staffColorMap[leave.staffId?._id] || '#22B8C8';
                        const staff = leave.staffId?.userId;
                        const name  = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.trim();
                        const dur   = getDuration(leave);
                        const canClick = leave.status === 'pending' || leave.status === 'approved' || leave.status === 'rejected';
                        return (
                          <div key={leave._id || i}
                            onClick={() => canClick && onAction(leave.status === 'pending' ? 'review' : 'toggle', leave)}
                            title={`${name} — ${leave.type} leave${dur ? ` (${dur})` : ''} [${leave.status}]`}
                            className={`rounded-md px-1.5 py-1 text-white overflow-hidden transition-all
                                        ${canClick ? 'cursor-pointer hover:brightness-110 hover:shadow-sm' : 'opacity-40'}`}
                            style={{ backgroundColor: color }}
                          >
                            <div className="flex items-center gap-0.5">
                              <BedDouble size={7} className="opacity-80 shrink-0" />
                              <p className="text-[8px] font-black truncate leading-tight">{name || 'Staff'}</p>
                            </div>
                            <p className="text-[7px] opacity-75 truncate capitalize">{leave.type} · {leave.status}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* time grid body */}
                <div className="relative" style={{ height: `${13 * 4}rem` }}>
                  {/* hour lines */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute w-full border-t border-gray-50"
                      style={{ top: `${((h - 8) / 12) * 100}%` }} />
                  ))}

                  {/* hourly leave blocks — same positioning as booking blocks */}
                  {hourly.map((leave, idx) => {
                    const color  = staffColorMap[leave.staffId?._id] || '#22B8C8';
                    const staff  = leave.staffId?.userId;
                    const name   = `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.trim();
                    const start  = leave.startTime || '08:00';
                    const end    = leave.endTime   || '09:00';
                    const canClick = leave.status === 'pending' || leave.status === 'approved' || leave.status === 'rejected';

                    return (
                      <div key={leave._id || `h-${idx}`}
                        onClick={() => canClick && onAction(leave.status === 'pending' ? 'review' : 'toggle', leave)}
                        title={`${name} — ${start}–${end} [${leave.status}]`}
                        className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-white overflow-hidden transition-all
                                    ${canClick ? 'cursor-pointer hover:brightness-110 hover:shadow-md' : ''}`}
                        style={{
                          top:             `${getTop(start)}%`,
                          height:          `${getHeight(start, end)}%`,
                          minHeight:       20,
                          backgroundColor: color,
                          opacity:         leave.status === 'cancelled' || leave.status === 'rejected' ? 0.4 : 0.88,
                          // pending = striped so admin can spot quickly
                          backgroundImage: leave.status === 'pending'
                            ? `repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.2) 4px,rgba(255,255,255,.2) 8px)`
                            : 'none',
                        }}
                      >
                        <p className="text-[9px] font-black truncate leading-tight">🛏 {name || 'Staff'}</p>
                        <p className="text-[7px] opacity-80 truncate">{start}–{end}</p>
                        <p className="text-[7px] opacity-70 capitalize truncate">{leave.type} · {leave.status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── legend (same style as CalendarView legend) ── */}
      <div className="p-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Staff:</span>
        {staffList.slice(0, 7).map((s, i) => (
          <div key={s._id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} />
            <span className="text-[10px] text-gray-500">{s.userId?.firstName}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <BedDouble size={11} className="text-gray-400" />
          <span className="text-[10px] text-gray-400">Full-day = header · Hourly = time block · Striped = pending</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function AdminLeavePage() {
  const [leaves,       setLeaves]      = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter,  setStaffFilter]  = useState('all');
  const [reviewLeave,  setReviewLeave] = useState(null);
  const [toggleLeave,  setToggleLeave] = useState(null);

  // fetch all leaves (re-runs when status tab changes)
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

  // stable color map keyed by staff id
  const staffColorMap = useMemo(() => {
    const seen = [], map = {};
    leaves.forEach(l => {
      const id = l.staffId?._id;
      if (id && !map[id]) { map[id] = STAFF_COLORS[seen.length % STAFF_COLORS.length]; seen.push(id); }
    });
    return map;
  }, [leaves]);

  // unique staff list for filter dropdown
  const staffList = useMemo(() => {
    const map = {};
    leaves.forEach(l => {
      const id = l.staffId?._id;
      if (id && !map[id]) map[id] = l.staffId;
    });
    return Object.values(map);
  }, [leaves]);

  const filteredLeaves = useMemo(() =>
    staffFilter === 'all' ? leaves
      : leaves.filter(l => (l.staffId?._id ?? l.staffId) === staffFilter)
  , [leaves, staffFilter]);

  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    leaves.forEach(l => { c.all++; c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [leaves]);

  const handleAction = (type, leave) =>
    type === 'review' ? setReviewLeave(leave) : setToggleLeave(leave);

  const handleReviewed = (id, status, adminNote) =>
    setLeaves(prev => prev.map(l => l._id === id ? { ...l, status, adminNote } : l));

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-6">

      {/* page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">See who is on leave and manage requests</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending',   count: counts.pending,   cls: 'text-yellow-600 bg-yellow-50  border-yellow-100' },
          { label: 'Approved',  count: counts.approved,  cls: 'text-green-600  bg-green-50   border-green-100'  },
          { label: 'Rejected',  count: counts.rejected,  cls: 'text-red-500    bg-red-50     border-red-100'    },
          { label: 'Total',     count: counts.all,       cls: 'text-[#22B8C8]  bg-[#22B8C8]/5 border-[#22B8C8]/20' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`rounded-2xl border p-4 ${cls}`}>
            <p className="text-2xl font-black">{count}</p>
            <p className="text-xs font-bold opacity-70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* toolbar — status tabs + staff filter (same pattern as booking page) */}
      <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* status filter tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white text-[#22B8C8] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s}{counts[s] > 0 ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>

        {/* staff filter — same as booking CalendarView */}
        <div className="ml-auto flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white outline-none focus:border-[#22B8C8] font-medium">
            <option value="all">All Staff</option>
            {staffList.map(s => (
              <option key={s._id} value={s._id}>
                {s.userId?.firstName} {s.userId?.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#22B8C8]" />
        </div>
      ) : (
        <LeaveCalendar
          leaves={filteredLeaves}
          staffColorMap={staffColorMap}
          staffList={staffList}
          filterStaff={staffFilter}
          onAction={handleAction}
        />
      )}

      {/* modals */}
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