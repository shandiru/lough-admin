import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Loader2 } from 'lucide-react';
import { getCalendarBookings } from '../../api/bookingService';
import { TEAL, STAFF_COLORS, toMins, isoDate, addDays } from './constants';
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTop(time, startHour, endHour) {
  const [h, min] = time.split(':').map(Number);
  return ((((h - startHour) * 60) + min) / ((endHour - startHour) * 60)) * 100;
}

function getHeight(dur, startHour, endHour) {
  return Math.max((dur / ((endHour - startHour) * 60)) * 100, 2.5);
}

export default function CalendarView({ staffList, onSelectBooking }) {
  const [viewMode, setViewMode] = useState('week');
  const [filterStaff, setFilterStaff] = useState('all');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [data, setData] = useState({ bookings: [], googleBookings: [] });
  const [loading, setLoading] = useState(false);

  const staffColorMap = useMemo(() => {
    const map = {};
    staffList.forEach((staff, index) => {
      map[staff._id] = STAFF_COLORS[index % STAFF_COLORS.length];
    });
    return map;
  }, [staffList]);

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    const d = new Date(currentDate);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [currentDate, viewMode]);

  const startDate = isoDate(days[0]);
  const endDate = isoDate(days[days.length - 1]);

  useEffect(() => {
    setLoading(true);
    getCalendarBookings(startDate, endDate, filterStaff !== 'all' ? filterStaff : '')
      .then((response) => setData(response || { bookings: [], googleBookings: [] }))
      .catch(() => setData({ bookings: [], googleBookings: [] }))
      .finally(() => setLoading(false));
  }, [startDate, endDate, filterStaff]);

  const navigate = (dir) => {
    const step = viewMode === 'day' ? 1 : 7;
    setCurrentDate((date) => addDays(date, dir * step));
  };

  const todayStr = isoDate(new Date());

  const bookingsByDay = useMemo(() => {
    const map = {};
    days.forEach((day) => {
      map[isoDate(day)] = [];
    });

    (data.bookings || []).forEach((booking) => {
      const dateKey = isoDate(new Date(booking.bookingDate));
      if (map[dateKey]) map[dateKey].push({ ...booking, _isInternal: true });
    });

    (data.googleBookings || []).forEach((booking) => {
      const dateKey = isoDate(new Date(booking.date));
      if (map[dateKey]) map[dateKey].push({ ...booking, _isGoogle: true });
    });

    Object.values(map).forEach((items) => {
      items.sort((a, b) => {
        const aTime = a._isGoogle ? a.startTime : a.bookingTime;
        const bTime = b._isGoogle ? b.startTime : b.bookingTime;
        return toMins(aTime) - toMins(bTime);
      });
    });

    return map;
  }, [data, days]);

  const { startHour, endHour, hours } = useMemo(() => {
    const times = [];

    Object.values(bookingsByDay).flat().forEach((booking) => {
      const startTime = booking._isGoogle ? booking.startTime : booking.bookingTime;
      const endTime = booking._isGoogle
        ? booking.endTime
        : (() => {
            const mins = toMins(booking.bookingTime) + (booking.service?.duration || booking.duration || 60);
            const hour = Math.floor(mins / 60).toString().padStart(2, '0');
            const minute = String(mins % 60).padStart(2, '0');
            return `${hour}:${minute}`;
          })();

      if (startTime) times.push(toMins(startTime));
      if (endTime) times.push(toMins(endTime));
    });

    if (times.length === 0) {
      const baseHours = Array.from({ length: 13 }, (_, i) => i + 8);
      return { startHour: 8, endHour: 20, hours: baseHours };
    }

    const minMins = Math.min(...times);
    const maxMins = Math.max(...times);
    const start = Math.max(0, Math.min(8, Math.floor(minMins / 60) - 1));
    const end = Math.min(24, Math.max(20, Math.ceil(maxMins / 60) + 1));
    return {
      startHour: start,
      endHour: end,
      hours: Array.from({ length: Math.max(end - start + 1, 1) }, (_, i) => start + i),
    };
  }, [bookingsByDay]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['day', 'week'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                viewMode === mode ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode}
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
            : `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white outline-none focus:border-[#22B8C8] font-medium"
          >
            <option value="all">All Staff</option>
            {staffList.map((staff) => (
              <option key={staff._id} value={staff._id}>{staff.userId?.firstName} {staff.userId?.lastName}</option>
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
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-t border-gray-50 flex items-start px-2 pt-1">
                  <span className="text-[10px] text-gray-400 font-medium">{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dateKey = isoDate(day);
              const isToday = dateKey === todayStr;
              const dayBookings = bookingsByDay[dateKey] || [];

              return (
                <div key={dateKey} className="flex-1 min-w-[90px] border-r border-gray-100 last:border-r-0">
                  <div className={`h-10 flex flex-col items-center justify-center border-b border-gray-100 sticky top-0 z-10 ${isToday ? 'bg-[#22B8C8]/10' : 'bg-white'}`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </span>
                    <span className={`text-sm font-black ${isToday ? 'text-[#22B8C8]' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="relative" style={{ height: `${Math.max(endHour - startHour, 1) * 4}rem` }}>
                    {hours.map((hour) => (
                      <div key={hour} className="absolute w-full border-t border-gray-50" style={{ top: `${((hour - startHour) / Math.max(endHour - startHour, 1)) * 100}%` }} />
                    ))}

                    {dayBookings.map((booking, index) => {
                      const startTime = booking._isGoogle ? booking.startTime : booking.bookingTime;
                      const duration = booking._isGoogle
                        ? Math.max(toMins(booking.endTime) - toMins(booking.startTime), 15)
                        : (booking.service?.duration || booking.duration || 60);
                      const staffId = booking._isGoogle ? booking.staffId : booking.staffMember?._id;
                      const color = booking._isGoogle ? '#a78bfa' : (staffColorMap[staffId] || TEAL);

                      return (
                        <div
                          key={booking._id || index}
                          onClick={() => !booking._isGoogle && onSelectBooking(booking)}
                          className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-white overflow-hidden transition-all ${
                            booking._isGoogle
                              ? 'opacity-80 cursor-default border border-purple-300'
                              : 'cursor-pointer hover:brightness-110 hover:shadow-md'
                          }`}
                          style={{
                            top: `${getTop(startTime, startHour, endHour)}%`,
                            height: `${getHeight(duration, startHour, endHour)}%`,
                            minHeight: 20,
                            backgroundColor: color,
                          }}
                        >
                          <p className="text-[9px] font-black truncate leading-tight">
                            {booking._isGoogle ? (booking.summary || 'External Booking') : booking.service?.name || 'Booking'}
                          </p>
                          {!booking._isGoogle && <p className="text-[8px] truncate opacity-80">{booking.customerName}</p>}
                          {booking._isGoogle && <p className="text-[8px] truncate opacity-80">{startTime}-{booking.endTime}</p>}
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
        {staffList.slice(0, 6).map((staff, index) => (
          <div key={staff._id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAFF_COLORS[index % STAFF_COLORS.length] }} />
            <span className="text-[10px] text-gray-500">{staff.userId?.firstName}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#a78bfa]" />
          <span className="text-[10px] text-gray-500">Google Calendar</span>
        </div>
      </div>
    </div>
  );
}
