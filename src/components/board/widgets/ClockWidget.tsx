import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Calendar } from 'lucide-react';

interface Period {
  start: number;
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

export const ClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [showAnalog, setShowAnalog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const day = now.getDay();
  const currentMinutes = hours * 60 + minutes;

  // Determine school schedule status
  let statusText = 'Feierabend';
  let isBreakTime = false;

  if (day === 0 || day === 6) {
    statusText = 'Wochenende';
  } else if (currentMinutes < 7 * 60 + 45) {
    statusText = 'Vor Unterrichtsbeginn';
  } else if (currentMinutes > 14 * 60 + 20) {
    statusText = 'GTA / Nachmittag';
  } else {
    const foundPeriod = SCHEDULE.find((p) => currentMinutes >= p.start && currentMinutes < p.end);
    if (foundPeriod) {
      statusText = foundPeriod.label;
      isBreakTime = !!foundPeriod.isBreak;
    } else {
      statusText = 'Kleine Pause';
      isBreakTime = true;
    }
  }

  const dateString = now.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'long'
  });

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const secondsString = seconds.toString().padStart(2, '0');

  // Analog clock hand degrees
  const secDeg = (seconds / 60) * 360;
  const minDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  return (
    <div className="flex flex-col items-center justify-center p-2 text-hbs-slate-dark">
      {/* Mode Switcher Toggle */}
      <div className="w-full flex items-center justify-between mb-3 text-[11px] font-bold text-hbs-slate-muted">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-hbs-blue" />
          <span>{dateString}</span>
        </div>
        <button
          onClick={() => setShowAnalog(!showAnalog)}
          className="px-2 py-0.5 rounded-lg bg-white/60 hover:bg-white text-hbs-blue border border-white/80 shadow-2xs transition-all active:scale-95"
        >
          {showAnalog ? 'Digital' : 'Analog'}
        </button>
      </div>

      {showAnalog ? (
        /* Analog Clock Face */
        <div className="relative w-36 h-36 rounded-full border-4 border-white/80 bg-white/70 shadow-inner flex items-center justify-center my-1">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-2.5 bg-hbs-slate-dark/30 rounded-full"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-60px)`
              }}
            />
          ))}

          {/* Center pin */}
          <div className="w-3 h-3 rounded-full bg-hbs-blue z-20 shadow-xs" />

          {/* Hour hand */}
          <div
            className="absolute w-1.5 h-10 bg-hbs-slate-dark rounded-full origin-bottom z-10"
            style={{
              transform: `rotate(${hourDeg}deg) translateY(-50%)`,
              bottom: '50%'
            }}
          />

          {/* Minute hand */}
          <div
            className="absolute w-1 h-14 bg-hbs-slate-dark/80 rounded-full origin-bottom z-10"
            style={{
              transform: `rotate(${minDeg}deg) translateY(-50%)`,
              bottom: '50%'
            }}
          />

          {/* Second hand */}
          <div
            className="absolute w-0.5 h-15 bg-red-500 rounded-full origin-bottom z-15"
            style={{
              transform: `rotate(${secDeg}deg) translateY(-50%)`,
              bottom: '50%'
            }}
          />
        </div>
      ) : (
        /* Digital Clock Face */
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-5xl sm:text-6xl font-black tracking-tight text-hbs-slate-dark font-mono drop-shadow-xs">
            {timeString}
          </span>
          <span className="text-xl font-extrabold text-hbs-blue font-mono">
            :{secondsString}
          </span>
        </div>
      )}

      {/* Period Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
            isBreakTime
              ? 'bg-amber-100/90 text-amber-900 border border-amber-300/60'
              : 'bg-hbs-blue-soft text-hbs-blue-deep border border-hbs-blue/20'
          }`}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          {statusText}
        </span>
      </div>
    </div>
  );
};
