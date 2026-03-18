import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Loader2 } from 'lucide-react';
import { getCalendarBookings } from '../../api/bookingService';
import { TEAL, STAFF_COLORS, toMins, isoDate, addDays } from './constants';

const HOURS      = Array.from({ length: 13 }, (_, i) => i + 8);
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTop(time) {
  const [h, min] = time.split(':').map(Number);
  return ((h - 8) * 60 + min) / (12 * 60) * 100;
}

function getHeight(dur) {
  return Math.max((dur / (12 * 60)) * 100, 2.5);
}

export default function CalendarView({ staffList, onSelectBooking }) {
  const [viewMode, setViewMode]     = useState('week');
  const [filterStaff, setFilterStaff] = useState('all');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [data, setData]   = useState({ bookings: [], googleBookings: [] });
  const [loading, setLoading] = useState(false);

  const staffColorMap = useMemo(() => {
    const m = {};
    staffList.forEach((s, i) => { m[s._id] = STAFF_COLORS[i % STAFF_COLORS.length]; });
    return m;
  }, [staffList]);

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const d = new Date(currentDate), day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [currentDate, viewMode]);

  const startDate = isoDate(days[0]);
  const endDate   = isoDate(days[days.length - 1]);

  useEffect(() => {
    setLoading(true);
    getCalendarBookings(startDate, endDate, filterStaff !== 'all' ? filterStaff : '')
      .then(d => setData(d || { bookings: [], googleBookings: [] }))
      .catch(() => setData({ bookings: [], googleBookings: [] }))
      .finally(() => setLoading(false));
  }, [startDate, endDate, filterStaff]);

  const navigate = (dir) => {
    const step = viewMode === 'day' ? 1 : 7;
    setCurrentDate(d => addDays(d, dir * step));
  };

  const todayStr = isoDate(new Date());

  const bookingsByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { m[isoDate(d)] = []; });
    (data.bookings || []).forEach(b => {
      const ds = isoDate(new Date(b.bookingDate));
      if (m[ds]) m[ds].push({ ...b, _isInternal: true });
    });
    return m;
  }, [data, days]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day', 'week'].map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                viewMode === m ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-[#22B8C8] px-3 py-1.5 hover:bg-[#22B8C8]/10 rounded-lg transition-colors">Today</button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
        </div>

        <span className="text-sm font-bold text-gray-700">
          {viewMode === 'day'
            ? currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
            : `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <select
            value={filterStaff}
            onChange={e => setFilterStaff(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white outline-none focus:border-[#22B8C8] font-medium"
          >
            <option value="all">All Staff</option>
            {staffList.map(s => (
              <option key={s._id} value={s._id}>{s.userId?.firstName} {s.userId?.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#22B8C8]" />
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
          <div className="flex min-w-[600px]">
            <div className="w-14 shrink-0 border-r border-gray-100 pt-10">
              {HOURS.map(h => (
                <div key={h} className="h-16 border-t border-gray-50 flex items-start px-2 pt-1">
                  <span className="text-[10px] text-gray-400 font-medium">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {days.map(day => {
              const ds           = isoDate(day);
              const isToday      = ds === todayStr;
              const dayBookings  = bookingsByDay[ds] || [];

              return (
                <div key={ds} className="flex-1 min-w-[90px] border-r border-gray-100 last:border-r-0">
                  <div className={`h-10 flex flex-col items-center justify-center border-b border-gray-100 sticky top-0 z-10 ${isToday ? 'bg-[#22B8C8]/10' : 'bg-white'}`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </span>
                    <span className={`text-sm font-black ${isToday ? 'text-[#22B8C8]' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="relative" style={{ height: `${13 * 4}rem` }}>
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-t border-gray-50" style={{ top: `${((h - 8) / 12) * 100}%` }} />
                    ))}
                    {dayBookings.map((b, idx) => {
                      const startTime = b._isGoogle ? b.startTime : b.bookingTime;
                      const dur       = b._isGoogle
                        ? toMins(b.endTime) - toMins(b.startTime)
                        : (b.service?.duration || b.duration || 60);
                      const staffId   = b._isGoogle ? b.staffId?._id : b.staffMember?._id;
                      const color     = b._isGoogle ? '#a78bfa' : (staffColorMap[staffId] || TEAL);

                      return (
                        <div
                          key={b._id || idx}
                          onClick={() => !b._isGoogle && onSelectBooking(b)}
                          className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-white overflow-hidden transition-all ${
                            b._isGoogle
                              ? 'opacity-70 cursor-default border border-purple-300'
                              : 'cursor-pointer hover:brightness-110 hover:shadow-md'
                          }`}
                          style={{
                            top: `${getTop(startTime)}%`,
                            height: `${getHeight(dur)}%`,
                            minHeight: 20,
                            backgroundColor: color,
                          }}
                        >
                          <p className="text-[9px] font-black truncate leading-tight">
                            {b._isGoogle ? '🔗 Ext' : b.service?.name || 'Booking'}
                          </p>
                          {!b._isGoogle && <p className="text-[8px] truncate opacity-80">{b.customerName}</p>}
                          {b._isGoogle  && <p className="text-[8px] truncate opacity-80">{b.startTime}–{b.endTime}</p>}
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

      <div className="p-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Legend:</span>
        {staffList.slice(0, 6).map((s, i) => (
          <div key={s._id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} />
            <span className="text-[10px] text-gray-500">{s.userId?.firstName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
