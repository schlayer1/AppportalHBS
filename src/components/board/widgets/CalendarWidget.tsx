import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

export const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  // Month name in German
  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // First day of month (0 = Sun, 1 = Mon... we want Monday = 0)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 font-black text-sm">
          <CalIcon className="w-4 h-4 text-hbs-blue" />
          <span className="capitalize">{monthName}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80 transition-all active:scale-95"
          >
            Heute
          </button>
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center border border-white/80 text-hbs-slate-dark transition-all active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center border border-white/80 text-hbs-slate-dark transition-all active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-hbs-slate-muted mb-1.5">
        {weekdays.map((wd, i) => (
          <div key={wd} className={i >= 5 ? 'text-amber-700/70' : ''}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-7" />;
          }

          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          const dayOfWeek = (idx % 7);
          const isWeekend = dayOfWeek >= 5;

          return (
            <div
              key={`day-${day}`}
              className={`h-7 flex items-center justify-center rounded-xl font-bold transition-all ${
                isToday
                  ? 'bg-hbs-blue text-white shadow-xs font-black ring-2 ring-hbs-blue/30 scale-105'
                  : isWeekend
                  ? 'bg-amber-100/40 text-amber-900/80 hover:bg-white'
                  : 'hover:bg-white/80 text-hbs-slate-dark'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};
