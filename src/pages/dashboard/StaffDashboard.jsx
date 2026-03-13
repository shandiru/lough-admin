import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { googleCalendarApi } from '../../api/googleCalendar';
import GoogleCalendarCard from '../../components/Google/GoogleCalendarCard';
import axiosInstance from '../../api/axiosInstance';

const TEAL = '#22B8C8';

function toMins(t) { const [h,m]=t.split(':').map(Number); return h*60+m; }
function isoDate(d) { return d instanceof Date ? d.toISOString().split('T')[0] : new Date(d).toISOString().split('T')[0]; }
function addDays(d,n) { const r=new Date(d); r.setDate(r.getDate()+n); return r; }

// ── Staff Calendar ─────────────────────────────────────────────────────────────
function StaffCalendar() {
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; });
  const [data, setData] = useState({ bookings:[], googleBookings:[] });
  const [loading, setLoading] = useState(false);

  const days = useMemo(()=>{
    if(viewMode==='day') return [currentDate];
    const d=new Date(currentDate), day=d.getDay();
    const mon=new Date(d); mon.setDate(d.getDate()-(day===0?6:day-1));
    return Array.from({length:7},(_,i)=>addDays(mon,i));
  },[currentDate,viewMode]);

  const startDate=isoDate(days[0]);
  const endDate=isoDate(days[days.length-1]);

  useEffect(()=>{
    setLoading(true);
    // Staff sees only their own bookings via /bookings/my
    Promise.all([
      axiosInstance.get(`/bookings/my`).then(r=>r.data).catch(()=>[]),
      axiosInstance.get(`/bookings/calendar?startDate=${startDate}&endDate=${endDate}`).then(r=>r.data?.googleBookings||[]).catch(()=>[]),
    ]).then(([bookings, googleBookings])=>{
      // Filter bookings to date range
      const filtered = bookings.filter(b=>{
        const bd=isoDate(new Date(b.bookingDate));
        return bd>=startDate && bd<=endDate && b.status!=='cancelled';
      });
      setData({ bookings:filtered, googleBookings });
    }).finally(()=>setLoading(false));
  },[startDate,endDate]);

  const navigate=(dir)=>{ const step=viewMode==='day'?1:7; setCurrentDate(d=>addDays(d,dir*step)); };
  const HOURS=Array.from({length:13},(_,i)=>i+8);
  const DAY_LABELS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayStr=isoDate(new Date());

  const bookingsByDay = useMemo(()=>{
    const m={}; days.forEach(d=>{ m[isoDate(d)]=[]; });
    (data.bookings||[]).forEach(b=>{ const ds=isoDate(new Date(b.bookingDate)); if(m[ds]) m[ds].push({...b,_isInternal:true}); });
    (data.googleBookings||[]).forEach(b=>{ const ds=isoDate(new Date(b.date)); if(m[ds]) m[ds].push({...b,_isGoogle:true}); });
    return m;
  },[data,days]);

  const getTop=(time)=>{ const [h,min]=time.split(':').map(Number); return ((h-8)*60+min)/(12*60)*100; };
  const getHeight=(dur)=>Math.max((dur/(12*60))*100,2.5);

  return (
    <div className="bg-white rounded-[28px] border border-white shadow-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day','week'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${viewMode===m?'bg-white text-[#22B8C8] shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{m}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={()=>navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={16}/></button>
          <button onClick={()=>setCurrentDate(new Date())} className="text-xs font-bold text-[#22B8C8] px-3 py-1.5 hover:bg-[#22B8C8]/10 rounded-lg transition-colors">Today</button>
          <button onClick={()=>navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={16}/></button>
        </div>
        <span className="text-sm font-bold text-gray-700">
          {viewMode==='day' ? currentDate.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}) : `${days[0].toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – ${days[6].toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#22B8C8]"/></div>
      ) : (
        <div className="overflow-auto" style={{maxHeight:'60vh'}}>
          <div className="flex min-w-[500px]">
            {/* Time col */}
            <div className="w-12 shrink-0 border-r border-gray-100 pt-10">
              {HOURS.map(h=>(
                <div key={h} className="h-16 border-t border-gray-50 flex items-start px-1 pt-1">
                  <span className="text-[9px] text-gray-400 font-medium">{String(h).padStart(2,'0')}:00</span>
                </div>
              ))}
            </div>
            {/* Day cols */}
            {days.map(day=>{
              const ds=isoDate(day);
              const isToday=ds===todayStr;
              const dayBookings=bookingsByDay[ds]||[];
              return (
                <div key={ds} className="flex-1 min-w-[70px] border-r border-gray-100 last:border-r-0">
                  <div className={`h-10 flex flex-col items-center justify-center border-b border-gray-100 sticky top-0 z-10 ${isToday?'bg-[#22B8C8]/10':'bg-white'}`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{DAY_LABELS[day.getDay()===0?6:day.getDay()-1]}</span>
                    <span className={`text-sm font-black ${isToday?'text-[#22B8C8]':'text-gray-700'}`}>{day.getDate()}</span>
                  </div>
                  <div className="relative" style={{height:`${13*4}rem`}}>
                    {HOURS.map(h=><div key={h} className="absolute w-full border-t border-gray-50" style={{top:`${((h-8)/12)*100}%`}}/>)}
                    {dayBookings.map((b,idx)=>{
                      const startTime=b._isGoogle?b.startTime:b.bookingTime;
                      const dur=b._isGoogle ? toMins(b.endTime)-toMins(b.startTime) : (b.service?.duration||b.duration||60);
                      const top=getTop(startTime);
                      const height=getHeight(dur);
                      const color=b._isGoogle?'#a78bfa':TEAL;
                      return (
                        <div key={b._id||idx}
                          className={`absolute left-0.5 right-0.5 rounded-lg px-1 py-0.5 text-white overflow-hidden ${b._isGoogle?'opacity-70 border border-purple-300':''}`}
                          style={{top:`${top}%`,height:`${height}%`,minHeight:18,backgroundColor:color}}>
                          <p className="text-[9px] font-black truncate leading-tight">{b._isGoogle?'🔗':''}{b._isGoogle?`${b.startTime}–${b.endTime}`:b.service?.name||'Appt'}</p>
                          {!b._isGoogle && <p className="text-[8px] truncate opacity-80">{b.customerName}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-gray-100 flex gap-4 items-center">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#22B8C8]"/><span className="text-[10px] text-gray-500">My Bookings</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-400"/><span className="text-[10px] text-gray-500">External (Google)</span></div>
      </div>
    </div>
  );
}

// ── StaffDashboard ─────────────────────────────────────────────────────────────
const StaffDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(()=>{
    const checkStatus=async()=>{
      try { setIsConnected(await googleCalendarApi.getStatus()); }
      catch { setIsConnected(false); }
      finally { setLoading(false); }
    };

    const gcal=searchParams.get('gcal');
    const expected=searchParams.get('expected');
    const got=searchParams.get('got');

    if(gcal){
      if(gcal==='success') toast.success('Google Calendar connected successfully!');
      if(gcal==='denied') toast.error('Google access denied.');
      if(gcal==='error') toast.error('Connection failed. Please try again.');
      if(gcal==='wrong_account') {
        Swal.fire({
          title:'<span style="color:#1a1a1a;font-size:20px;font-weight:900">Wrong Google Account</span>',
          html:`<div style="text-align:left;font-family:sans-serif;line-height:1.7;color:#555;font-size:14px"><p style="margin-bottom:16px">You signed in with a <strong>different Google account</strong> than your staff login email.</p><div style="background:#FEF3C7;border-radius:12px;padding:14px 16px;margin-bottom:16px"><p style="margin:0 0 6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#92400e">Expected</p><p style="margin:0;font-weight:700;color:#1a1a1a">${decodeURIComponent(expected||'')}</p></div><div style="background:#FEE2E2;border-radius:12px;padding:14px 16px"><p style="margin:0 0 6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#991b1b">You Used</p><p style="margin:0;font-weight:700;color:#1a1a1a">${decodeURIComponent(got||'')}</p></div><p style="margin-top:16px;color:#888;font-size:13px">Please sign in with your staff email Google account to connect.</p></div>`,
          icon:'warning', confirmButtonText:'Try Again', confirmButtonColor:'#22B8C8',
          customClass:{ popup:'rounded-[28px]', confirmButton:'rounded-xl px-8 py-3 font-black text-xs tracking-widest' },
        });
      }
      searchParams.delete('gcal'); searchParams.delete('expected'); searchParams.delete('got');
      setSearchParams(searchParams);
    }
    checkStatus();
  },[]);

  const handleConnect=async()=>{
    setActionLoading(true);
    try { const url=await googleCalendarApi.getAuthUrl(); window.location.href=url; }
    catch { toast.error('Could not start Google sign-in.'); setActionLoading(false); }
  };

  const handleDisconnect=async()=>{
    const result=await Swal.fire({ title:'Are you sure?', text:'Appointments will stop syncing to your Google Calendar.', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444', cancelButtonColor:'#6b7280', confirmButtonText:'Yes, disconnect!', reverseButtons:true, customClass:{popup:'rounded-[28px] p-8'} });
    if(!result.isConfirmed) return;
    setActionLoading(true);
    try { await googleCalendarApi.disconnect(); setIsConnected(false); Swal.fire({ title:'Unlinked!', text:'Google Calendar disconnected.', icon:'success', timer:2000, showConfirmButton:false, customClass:{popup:'rounded-[28px]'} }); }
    catch { toast.error('Failed to disconnect.'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" reverseOrder={false}/>
      <Sidebar/>
      <main className="flex-1 p-6 lg:p-12">
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold uppercase tracking-widest">Staff</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-10">Welcome, {user?.name}</h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar (2/3 width) */}
          <div className="xl:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-4 h-4 text-[var(--color-brand)]"/>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">My Schedule</span>
            </div>
            <StaffCalendar/>
          </div>

          {/* Google Calendar card (1/3 width) */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-4 h-4 text-[var(--color-brand)]"/>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">Integrations</span>
            </div>
            {loading ? (
              <div className="rounded-[28px] bg-white/70 border border-white p-7 shadow-xl flex items-center justify-center gap-3 h-44">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand)]"/>
                <span className="text-xs font-black text-gray-400 uppercase tracking-[2px]">Checking Status...</span>
              </div>
            ) : (
              <GoogleCalendarCard isConnected={isConnected} onConnect={handleConnect} onDisconnect={handleDisconnect} processing={actionLoading}/>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
