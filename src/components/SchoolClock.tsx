import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Period {
  start: number; // minutes from midnight
  end: number;
  label: string;
  isBreak?: boolean;
}

const SCHEDULE: Period[] = [
  { start: 7 * 60 + 45, end: 8 * 60 + 30, label: '1. Stunde' },
  { start: 8 * 60 + 35, end: 9 * 60 + 20, label: '2. Stunde' },
  { start: 9 * 60 + 20, end: 9 * 60 + 35, label: 'Frühstückspause', isBreak: true },
  { start: 9 * 60 + 35, end: 10 * 60 + 20, label: '3. Stunde' },
  { start: 10 * 60 + 25, end: 11 * 60 + 10, label: '4. Stunde' },
  { start: 11 * 60 + 10, end: 11 * 60 + 35, label: 'Große Hofpause', isBreak: true },
  { start: 11 * 60 + 35, end: 12 * 60 + 20, label: '5. Stunde' },
  { start: 12 * 60 + 20, end: 12 * 60 + 45, label: 'Mittagspause', isBreak: true },
  { start: 12 * 60 + 45, end: 13 * 60 + 30, label: '6. Stunde' },
  { start: 13 * 60 + 35, end: 14 * 60 + 20, label: '7. Stunde' },
];

export const SchoolClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const currentMinutes = hours * 60 + minutes;

  // Determine current period
  let statusText = 'Feierabend / Freizeit';
  let isBreakTime = false;

  if (day === 0 || day === 6) {
    statusText = 'Schönes Wochenende';
  } else if (currentMinutes < 7 * 60 + 45) {
    statusText = 'Guten Morgen • Vor Beginn';
  } else if (currentMinutes > 14 * 60 + 20) {
    statusText = 'GTA / Nachmittagsbetreuung';
  } else {
    const foundPeriod = SCHEDULE.find(p => currentMinutes >= p.start && currentMinutes < p.end);
    if (foundPeriod) {
      statusText = foundPeriod.label;
      isBreakTime = !!foundPeriod.isBreak;
    } else {
      statusText = 'Kleine Pause';
      isBreakTime = true;
    }
  }

  const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/80 backdrop-blur-md border border-hbs-slate-border/80 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] text-xs select-none">
      <div className="flex items-center gap-1.5 font-black text-hbs-slate-dark tabular-nums">
        <Clock className="w-3.5 h-3.5 text-hbs-blue" />
        <span>{timeString}</span>
      </div>

      <span className="w-1 h-1 rounded-full bg-slate-300" />

      <div className="flex items-center gap-1.5 font-bold">
        <span 
          className={`w-2 h-2 rounded-full ${
            isBreakTime 
              ? 'bg-amber-400 animate-pulse' 
              : 'bg-emerald-500'
          }`} 
        />
        <span className={isBreakTime ? 'text-amber-700' : 'text-hbs-slate-muted'}>
          {statusText}
        </span>
      </div>
    </div>
  );
};
