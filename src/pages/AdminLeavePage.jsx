import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, Ban, Users, Loader2, List, CalendarDays,
  CalendarRange, BedDouble
} from 'lucide-react';
import { leaveService } from '../api/leaveService';
import AdminLeaveReviewModal from '../components/Leave/AdminLeaveReviewModal';
import AdminLeaveToggleModal from '../components/Leave/Adminleavetogglemodal';
import toast from 'react-hot-toast';

// ─── constants ────────────────────────────────────────────────────────────────
const HOURS      = Array.from({ length: 13 }, (_, i) => i + 8);
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS     = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
const STAFF_COLORS = [
  '#22B8C8','#C9AF94','#a78bfa','#f97316',
  '#10b981','#ec4899','#3b82f6','#f59e0b',
];
const STATUS_META = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={10}/> },
  approved:  { cls: 'bg-green-100  text-green-700  border-green-200',  icon: <CheckCircle size={10}/> },
  rejected:  { cls: 'bg-red-100    text-red-600    border-red-200',    icon: <XCircle size={10}/> },
  cancelled: { cls: 'bg-gray-100   text-gray-400   border-gray-200',   icon: <Ban size={10}/> },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function isoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function toMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }
function getTop(time) {
  const [h,min] = time.split(':').map(Number);
  return ((h-8)*60+min) / (12*60) * 100;
}
function getHeight(s, e) {
  return Math.max((toMins(e)-toMins(s)) / (12*60) * 100, 2.5);
}
function getDuration(leave) {
  if (leave.isHourly && leave.startTime && leave.endTime) {
    const mins = toMins(leave.endTime) - toMins(leave.startTime);
    if (mins <= 0) return null;
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

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ staff, size=8 }) {
  const img = getImageUrl(staff?.profileImage);
  const initials = `${staff?.firstName?.[0]??''}${staff?.lastName?.[0]??''}`.toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#22B8C8]/20 text-[#22B8C8] font-black text-xs
                     flex items-center justify-center shrink-0 overflow-hidden`}>
      {img ? <img src={img} alt={initials} className="w-full h-full object-cover"/> : initials}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  WEEK / DAY GRID  (booking-calendar style)
// ════════════════════════════════════════════════════════════════════
function LeaveCalendarGrid({ leaves, staffColorMap, filterStaff, onAction }) {
  const [viewMode,    setViewMode]    = useState('week');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const d = new Date(currentDate), dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [currentDate, viewMode]);

  const navigate = dir => setCurrentDate(d => addDays(d, dir * (viewMode==='day'?1:7)));
  const todayStr = isoDate(new Date());

  const leavesByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { m[isoDate(d)] = []; });
    const filtered = filterStaff==='all' ? leaves
      : leaves.filter(l => (l.staffId?._id ?? l.staffId) === filterStaff);

    filtered.forEach(leave => {
      const start = new Date(leave.startDate); start.setHours(0,0,0,0);
      const end   = new Date(leave.endDate);   end.setHours(0,0,0,0);
      const cur   = new Date(start);
      while (cur <= end) {
        const ds = isoDate(cur);
        if (m[ds]) m[ds].push(leave);
        cur.setDate(cur.getDate()+1);
      }
    });
    return m;
  }, [leaves, days, filterStaff]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* sub-toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day','week'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                viewMode===m ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{m}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16}/></button>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-xs font-bold text-[#22B8C8] px-3 py-1.5 hover:bg-[#22B8C8]/10 rounded-lg transition-colors">Today</button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16}/></button>
        </div>
        <span className="text-sm font-bold text-gray-700">
          {viewMode==='day'
            ? currentDate.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
            : `${days[0].toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – ${days[6].toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`}
        </span>
      </div>

      {/* grid */}
      <div className="overflow-auto" style={{ maxHeight:'68vh' }}>
        <div className="flex min-w-[600px]">
          {/* time gutter */}
          <div className="w-14 shrink-0 border-r border-gray-100 pt-10">
            {HOURS.map(h => (
              <div key={h} className="h-16 border-t border-gray-50 flex items-start px-2 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">{String(h).padStart(2,'0')}:00</span>
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
                <div className={`sticky top-0 z-10 border-b border-gray-100 ${isToday?'bg-[#22B8C8]/8':'bg-white'}`}>
                  <div className="h-10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {DAY_LABELS[day.getDay()===0?6:day.getDay()-1]}
                    </span>
                    <span className={`text-sm font-black ${isToday?'text-[#22B8C8]':'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                  {/* full-day leave pills */}
                  {fullDay.length > 0 && (
                    <div className="px-0.5 pb-1 flex flex-col gap-0.5">
                      {fullDay.map((leave, i) => {
                        const sid   = leave.staffId?._id;
                        const color = staffColorMap[sid] || '#22B8C8';
                        const staff = leave.staffId?.userId;
                        const name  = `${staff?.firstName??''} ${staff?.lastName??''}`.trim();
                        const canAct = leave.status==='pending' || leave.status==='approved' || leave.status==='rejected';
                        return (
                          <div key={leave._id||i}
                            onClick={() => canAct && onAction(leave.status==='pending'?'review':'toggle', leave)}
                            className={`rounded-md px-1.5 py-1 text-white overflow-hidden transition-all ${canAct?'cursor-pointer hover:brightness-110 hover:shadow-sm':''}`}
                            style={{ backgroundColor: color, opacity: leave.status==='cancelled'||leave.status==='rejected'?0.45:1 }}
                            title={`${name} — ${leave.type} leave [${leave.status}]`}
                          >
                            <div className="flex items-center gap-0.5">
                              <BedDouble size={8} className="shrink-0 opacity-80"/>
                              <p className="text-[8px] font-black truncate leading-tight">{name||'Staff'}</p>
                            </div>
                            <p className="text-[7px] opacity-75 truncate capitalize">{leave.type} · {leave.status}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* time grid */}
                <div className="relative" style={{ height:`${13*4}rem` }}>
                  {HOURS.map(h => (
                    <div key={h} className="absolute w-full border-t border-gray-50"
                         style={{ top:`${((h-8)/12)*100}%` }}/>
                  ))}

                  {/* hourly leave blocks */}
                  {hourly.map((leave, i) => {
                    const sid   = leave.staffId?._id;
                    const color = staffColorMap[sid] || '#22B8C8';
                    const staff = leave.staffId?.userId;
                    const name  = `${staff?.firstName??''} ${staff?.lastName??''}`.trim();
                    const start = leave.startTime || '08:00';
                    const end   = leave.endTime   || '09:00';
                    const top    = getTop(start);
                    const height = getHeight(start, end);
                    const canAct = leave.status==='pending'||leave.status==='approved'||leave.status==='rejected';
                    return (
                      <div key={leave._id||`h-${i}`}
                        onClick={() => canAct && onAction(leave.status==='pending'?'review':'toggle', leave)}
                        className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-white overflow-hidden transition-all ${canAct?'cursor-pointer hover:brightness-110 hover:shadow-md':''}`}
                        style={{
                          top:`${top}%`, height:`${height}%`, minHeight:22,
                          backgroundColor: color,
                          opacity: leave.status==='cancelled'||leave.status==='rejected' ? 0.4 : 0.88,
                          backgroundImage: leave.status==='pending'
                            ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.18) 4px,rgba(255,255,255,.18) 8px)'
                            : 'none',
                        }}
                        title={`${name} — ${leave.type} ${start}–${end} [${leave.status}]`}
                      >
                        <p className="text-[9px] font-black truncate leading-tight">🛏 {name||'Staff'}</p>
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

      {/* legend */}
      <div className="p-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Staff:</span>
        {Object.entries(staffColorMap).map(([id, color]) => {
          const found = leaves.find(l => (l.staffId?._id??l.staffId)===id);
          const name  = `${found?.staffId?.userId?.firstName??''}`.trim();
          if (!name) return null;
          return (
            <div key={id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:color }}/>
              <span className="text-[10px] text-gray-500">{name}</span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
          <BedDouble size={11}/> Full-day = header pill &nbsp;·&nbsp; Hourly = time block
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  MONTH CALENDAR
// ════════════════════════════════════════════════════════════════════
function LeaveMonthGrid({ leaves, staffColorMap, filterStaff, onAction }) {
  const today = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(),today.getMonth(),1));
  const [openDay,  setOpenDay]  = useState(null);

  const yr=viewDate.getFullYear(), mo=viewDate.getMonth();

  const cells = useMemo(() => {
    const arr=[], fd=new Date(yr,mo,1).getDay(), adj=fd===0?6:fd-1;
    for(let i=0;i<adj;i++) arr.push(null);
    for(let d=1;d<=new Date(yr,mo+1,0).getDate();d++) arr.push(d);
    return arr;
  },[yr,mo]);

  const dayLeaveMap = useMemo(() => {
    const map={};
    const filtered = filterStaff==='all' ? leaves
      : leaves.filter(l=>(l.staffId?._id??l.staffId)===filterStaff);
    filtered.forEach(leave => {
      const start=new Date(leave.startDate); start.setHours(0,0,0,0);
      const end=new Date(leave.endDate);     end.setHours(0,0,0,0);
      const cur=new Date(start);
      while(cur<=end){
        const iso=isoDate(cur);
        if(!map[iso]) map[iso]=[];
        map[iso].push(leave);
        cur.setDate(cur.getDate()+1);
      }
    });
    return map;
  },[leaves,filterStaff]);

  const todayIso=isoDate(today);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={()=>setViewDate(new Date(yr,mo-1,1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronLeft size={16}/></button>
        <span className="font-black text-gray-800">{MONTHS[mo]} {yr}</span>
        <button onClick={()=>setViewDate(new Date(yr,mo+1,1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
          <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase py-2.5 tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day,i)=>{
          if(!day) return <div key={`e-${i}`} className="min-h-[72px] border-b border-r border-gray-50 last:border-r-0"/>;
          const iso=`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday=iso===todayIso;
          const dayLeaves=dayLeaveMap[iso]||[];
          const isOpen=openDay===iso;
          const shown=dayLeaves.slice(0,3);
          const extra=dayLeaves.length-3;

          return (
            <div key={iso}
              className={`relative min-h-[72px] border-b border-r border-gray-50 last:border-r-0 p-1 flex flex-col
                          ${dayLeaves.length?'cursor-pointer hover:bg-gray-50':''} transition-colors
                          ${isToday?'bg-[#22B8C8]/5':''}`}
              onClick={()=>dayLeaves.length&&setOpenDay(isOpen?null:iso)}
            >
              <span className={`text-xs font-black self-end leading-none rounded-lg px-1.5 py-1 mb-0.5
                                ${isToday?'bg-[#22B8C8] text-white':'text-gray-600'}`}>{day}</span>
              <div className="flex flex-col gap-0.5 flex-1">
                {shown.map((leave,idx)=>{
                  const sid=leave.staffId?._id;
                  const color=staffColorMap[sid]||'#22B8C8';
                  const name=`${leave.staffId?.userId?.firstName??''}`.trim();
                  return (
                    <div key={leave._id||idx}
                      className="rounded-md px-1 py-0.5 text-white text-[8px] font-black truncate leading-tight"
                      style={{backgroundColor:color, opacity:leave.status==='cancelled'||leave.status==='rejected'?0.4:1}}>
                      {name||'Staff'} <span className="opacity-70 capitalize">· {leave.type}</span>
                    </div>
                  );
                })}
                {extra>0 && <span className="text-[8px] text-gray-400 font-bold pl-1">+{extra} more</span>}
              </div>

              {/* popover */}
              {isOpen && (
                <div className="absolute z-30 top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3"
                     onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      {dayLeaves.length} Leave{dayLeaves.length>1?'s':''}
                    </p>
                    <button onClick={()=>setOpenDay(null)} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {dayLeaves.map(leave=>{
                      const smeta=STATUS_META[leave.status]||STATUS_META.pending;
                      const staff=leave.staffId?.userId;
                      const dur=getDuration(leave);
                      const isPend=leave.status==='pending';
                      const isRev=leave.status==='approved'||leave.status==='rejected';
                      return (
                        <div key={leave._id} className="border border-gray-100 rounded-xl p-2.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Avatar staff={staff} size={6}/>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{staff?.firstName} {staff?.lastName}</p>
                              <p className="text-[9px] text-gray-400 capitalize">{leave.type}{dur?` · ${dur}`:''}</p>
                            </div>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${smeta.cls}`}>
                              {leave.status}
                            </span>
                          </div>
                          {leave.isHourly && <p className="text-[9px] text-gray-400 mb-1.5">⏰ {leave.startTime}–{leave.endTime}</p>}
                          {leave.reason && <p className="text-[9px] text-gray-400 italic mb-1.5 line-clamp-1">"{leave.reason}"</p>}
                          <div className="flex gap-1.5">
                            {isPend && (
                              <button onClick={()=>{onAction('review',leave);setOpenDay(null);}}
                                className="flex-1 text-[9px] font-bold py-1 bg-[#22B8C8] text-white rounded-lg hover:opacity-90 transition">
                                Review
                              </button>
                            )}
                            {isRev && (
                              <button onClick={()=>{onAction('toggle',leave);setOpenDay(null);}}
                                className="flex-1 text-[9px] font-bold py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition">
                                Change
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  LIST VIEW
// ════════════════════════════════════════════════════════════════════
function LeaveListView({ leaves, onAction }) {
  if (!leaves.length) return (
    <div className="flex flex-col items-center py-24 gap-3">
      <Clock size={40} strokeWidth={1.2} className="text-gray-200"/>
      <p className="text-sm font-medium text-gray-400">No leave requests found</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      {leaves.map(leave=>{
        const smeta=STATUS_META[leave.status]||STATUS_META.pending;
        const staff=leave.staffId?.userId;
        const dur=getDuration(leave);
        const isPend=leave.status==='pending';
        const isRev=leave.status==='approved'||leave.status==='rejected';
        return (
          <div key={leave._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:shadow-md transition-shadow">
            <Avatar staff={staff} size={10}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-bold text-sm text-gray-800">{staff?.firstName} {staff?.lastName}</p>
                  <p className="text-[10px] text-gray-400">{staff?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${smeta.cls}`}>
                    {smeta.icon} {leave.status}
                  </span>
                  {leave.isHourly && (
                    <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={8}/> Hourly
                    </span>
                  )}
                  {dur && <span className="text-[9px] font-black text-[#22B8C8] bg-[#22B8C8]/10 px-2 py-0.5 rounded-full">{dur}</span>}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 font-medium capitalize">{leave.type} Leave</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {leave.isHourly
                  ? `${new Date(leave.startDate).toDateString()} · ${leave.startTime}–${leave.endTime}`
                  : `${new Date(leave.startDate).toDateString()} → ${new Date(leave.endDate).toDateString()}`}
              </p>
              {leave.reason && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">"{leave.reason}"</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                {isPend && (
                  <button onClick={()=>onAction('review',leave)}
                    className="text-xs font-bold px-3 py-1.5 bg-[#22B8C8] text-white rounded-xl hover:opacity-90 transition flex items-center gap-1.5">
                    <CheckCircle size={12}/> Review
                  </button>
                )}
                {isRev && (
                  <button onClick={()=>onAction('toggle',leave)}
                    className="text-xs font-bold px-3 py-1.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition">
                    Change Status
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function AdminLeavePage() {
  const [leaves,       setLeaves]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter,  setStaffFilter]  = useState('all');
  const [viewMode,     setViewMode]     = useState('week');
  const [reviewLeave,  setReviewLeave]  = useState(null);
  const [toggleLeave,  setToggleLeave]  = useState(null);

  const fetchLeaves = async (status) => {
    setLoading(true);
    try {
      const res = await leaveService.getAllLeaves(status==='all'?'':status);
      setLeaves(res.data?.leaves || res.data || []);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(statusFilter); }, [statusFilter]);

  const staffColorMap = useMemo(() => {
    const seen=[], map={};
    leaves.forEach(l => {
      const id=l.staffId?._id;
      if(id&&!map[id]){ map[id]=STAFF_COLORS[seen.length%STAFF_COLORS.length]; seen.push(id); }
    });
    return map;
  }, [leaves]);

  const staffList = useMemo(() => {
    const map={};
    leaves.forEach(l=>{ const id=l.staffId?._id; if(id&&!map[id]) map[id]=l.staffId?.userId; });
    return Object.entries(map).map(([id,u])=>({id,user:u}));
  }, [leaves]);

  const filteredLeaves = useMemo(() =>
    staffFilter==='all' ? leaves : leaves.filter(l=>(l.staffId?._id??l.staffId)===staffFilter)
  , [leaves, staffFilter]);

  const counts = useMemo(() => {
    const c={all:0,pending:0,approved:0,rejected:0,cancelled:0};
    leaves.forEach(l=>{ c.all++; c[l.status]=(c[l.status]||0)+1; });
    return c;
  }, [leaves]);

  const handleAction   = (type, leave) => { if(type==='review') setReviewLeave(leave); else setToggleLeave(leave); };
  const handleReviewed = (id, status, adminNote) =>
    setLeaves(prev => prev.map(l => l._id===id ? {...l,status,adminNote} : l));

  const VIEW_TABS = [
    { key:'week',  label:'Week',  icon:<CalendarDays size={13}/> },
    { key:'month', label:'Month', icon:<CalendarRange size={13}/> },
    { key:'list',  label:'List',  icon:<List size={13}/> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-6">
      {/* header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">View and manage all staff leave requests</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {label:'Pending',  count:counts.pending,  color:'text-yellow-600 bg-yellow-50 border-yellow-100'},
          {label:'Approved', count:counts.approved, color:'text-green-600  bg-green-50  border-green-100'},
          {label:'Rejected', count:counts.rejected, color:'text-red-500    bg-red-50    border-red-100'},
          {label:'Total',    count:counts.all,      color:'text-[#22B8C8]  bg-[#22B8C8]/5 border-[#22B8C8]/20'},
        ].map(({label,count,color})=>(
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-2xl font-black">{count}</p>
            <p className="text-xs font-bold opacity-70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* status tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 flex-wrap">
          {['all','pending','approved','rejected','cancelled'].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter===s ? 'bg-[#22B8C8] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {s}{counts[s]>0?` (${counts[s]})` :''}
            </button>
          ))}
        </div>

        {/* staff filter */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2">
          <Users size={13} className="text-gray-400"/>
          <select value={staffFilter} onChange={e=>setStaffFilter(e.target.value)}
            className="text-xs font-medium text-gray-600 outline-none bg-transparent">
            <option value="all">All Staff</option>
            {staffList.map(({id,user})=>(
              <option key={id} value={id}>{user?.firstName} {user?.lastName}</option>
            ))}
          </select>
        </div>

        {/* view toggle */}
        <div className="ml-auto flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
          {VIEW_TABS.map(({key,label,icon})=>(
            <button key={key} onClick={()=>setViewMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode===key ? 'bg-[#22B8C8] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#22B8C8]"/>
        </div>
      ) : viewMode==='week' ? (
        <LeaveCalendarGrid leaves={filteredLeaves} staffColorMap={staffColorMap} filterStaff={staffFilter} onAction={handleAction}/>
      ) : viewMode==='month' ? (
        <LeaveMonthGrid leaves={filteredLeaves} staffColorMap={staffColorMap} filterStaff={staffFilter} onAction={handleAction}/>
      ) : (
        <LeaveListView leaves={filteredLeaves} onAction={handleAction}/>
      )}

      {reviewLeave && (
        <AdminLeaveReviewModal leave={reviewLeave} onClose={()=>setReviewLeave(null)}
          onReviewed={(id,status,note)=>{handleReviewed(id,status,note);setReviewLeave(null);}}/>
      )}
      {toggleLeave && (
        <AdminLeaveToggleModal leave={toggleLeave} onClose={()=>setToggleLeave(null)}
          onReviewed={(id,status,note)=>{handleReviewed(id,status,note);setToggleLeave(null);}}/>
      )}
    </div>
  );
}