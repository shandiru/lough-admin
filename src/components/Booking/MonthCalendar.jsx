import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MonthCalendar({ selected, onSelect, disablePast = true }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const yr = viewDate.getFullYear();
  const mo = viewDate.getMonth();

  const cells = [];
  for (let i = 0; i < new Date(yr, mo, 1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= new Date(yr, mo + 1, 0).getDate(); d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(new Date(yr, mo - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="font-bold text-sm text-gray-700">{MONTHS[mo]} {yr}</span>
        <button
          onClick={() => setViewDate(new Date(yr, mo + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const iso = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const cellDate = new Date(yr, mo, day);
          const isPast = disablePast && cellDate < tomorrow;
          const isToday = cellDate.getTime() === today.getTime();
          const isSel = selected === iso;

          return (
            <button
              key={iso}
              disabled={isPast}
              onClick={() => onSelect(iso)}
              title={isToday ? 'Same-day bookings not available' : undefined}
              className={`
                aspect-square rounded-lg text-xs font-medium transition-all
                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#22B8C8]/10'}
                ${isToday ? 'ring-1 ring-gray-200' : ''}
                ${isSel ? 'bg-[#22B8C8] text-white' : 'text-gray-700'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Bookings require at least 1 day advance notice.
      </p>
    </div>
  );
}
