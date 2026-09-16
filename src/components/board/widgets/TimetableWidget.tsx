import React, { useState, useEffect } from 'react';
import { CalendarDays, Edit2, Check } from 'lucide-react';

interface TimetableSlot {
  period: string;
  time: string;
  startMin: number;
  endMin: number;
  subject: string;
  room?: string;
  isBreak?: boolean;
}

const DEFAULT_SCHEDULE: TimetableSlot[] = [
  { period: '1. Std.', time: '07:45 - 08:30', startMin: 7 * 60 + 45, endMin: 8 * 60 + 30, subject: 'Mathematik', room: 'R 204' },
  { period: '2. Std.', time: '08:35 - 09:20', startMin: 8 * 60 + 35, endMin: 9 * 60 + 20, subject: 'Deutsch', room: 'R 204' },
  { period: 'Pause', time: '09:20 - 09:35', startMin: 9 * 60 + 20, endMin: 9 * 60 + 35, subject: 'Frühstückspause', isBreak: true },
  { period: '3. Std.', time: '09:35 - 10:20', startMin: 9 * 60 + 35, endMin: 10 * 60 + 20, subject: 'Englisch', room: 'R 102' },
  { period: '4. Std.', time: '10:25 - 11:10', startMin: 10 * 60 + 25, endMin: 11 * 60 + 10, subject: 'Biologie', room: 'Bio-Fachraum' },
  { period: 'Hofpause', time: '11:10 - 11:35', startMin: 11 * 60 + 10, endMin: 11 * 60 + 35, subject: 'Große Hofpause', isBreak: true },
  { period: '5. Std.', time: '11:35 - 12:20', startMin: 11 * 60 + 35, endMin: 12 * 60 + 20, subject: 'Geschichte', room: 'R 204' },
  { period: '6. Std.', time: '12:45 - 13:30', startMin: 12 * 60 + 45, endMin: 13 * 60 + 30, subject: 'Geografie', room: 'R 204' },
  { period: '7. Std.', time: '13:35 - 14:20', startMin: 13 * 60 + 35, endMin: 14 * 60 + 20, subject: 'Förderunterricht', room: 'R 204' }
];

export const TimetableWidget: React.FC = () => {
  const [schedule, setSchedule] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('hbs_board_timetable_slots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SCHEDULE;
  });

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const handleSubjectChange = (index: number, newSubject: string) => {
    const updated = [...schedule];
    updated[index].subject = newSubject;
    setSchedule(updated);
    localStorage.setItem('hbs_board_timetable_slots', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 font-black text-xs">
          <CalendarDays className="w-4 h-4 text-hbs-blue" />
          <span>Tagesablauf & Stundenplan</span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80 transition-all active:scale-95 flex items-center gap-1"
        >
          {isEditing ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          <span>{isEditing ? 'Fertig' : 'Fächer ändern'}</span>
        </button>
      </div>

      {/* Schedule List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {schedule.map((slot, idx) => {
          const isCurrent = currentMinutes >= slot.startMin && currentMinutes < slot.endMin;

          if (slot.isBreak) {
            return (
              <div
                key={idx}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center justify-between border ${
                  isCurrent
                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30 font-black scale-[1.01]'
                    : 'bg-white/40 text-hbs-slate-muted border-white/60'
                }`}
              >
                <span>☕ {slot.subject}</span>
                <span className="text-[10px] font-mono">{slot.time}</span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                isCurrent
                  ? 'bg-hbs-blue text-white border-hbs-blue ring-2 ring-hbs-blue/30 shadow-xs font-black scale-[1.01]'
                  : 'bg-white/70 hover:bg-white text-hbs-slate-dark border-white/80'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  isCurrent ? 'bg-white/20 text-white' : 'bg-hbs-blue-soft text-hbs-blue'
                }`}>
                  {slot.period}
                </span>

                {isEditing ? (
                  <input
                    type="text"
                    value={slot.subject}
                    onChange={(e) => handleSubjectChange(idx, e.target.value)}
                    className="px-1.5 py-0.5 rounded bg-white text-hbs-slate-dark text-xs font-bold border border-hbs-blue/30 focus:outline-none"
                  />
                ) : (
                  <span className="font-bold truncate">{slot.subject}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {slot.room && (
                  <span className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-hbs-slate-muted'}`}>
                    {slot.room}
                  </span>
                )}
                <span className={`text-[10px] font-mono ${isCurrent ? 'text-white/90' : 'text-hbs-slate-muted'}`}>
                  {slot.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
