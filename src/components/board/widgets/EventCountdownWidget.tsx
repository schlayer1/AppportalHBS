import React, { useState } from 'react';
import { PartyPopper, CalendarClock, Edit3, Check } from 'lucide-react';

export const EventCountdownWidget: React.FC = () => {
  // Default: Next school milestone (e.g. Herbstferien or custom date)
  const [eventName, setEventName] = useState('Herbstferien');
  const [targetDateStr, setTargetDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 24); // 24 days default
    return d.toISOString().split('T')[0];
  });
  const [isEditing, setIsEditing] = useState(false);

  const calculateDaysLeft = () => {
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = calculateDaysLeft();

  return (
    <div className="flex flex-col items-center justify-between p-2 text-hbs-slate-dark select-none h-full">
      {/* Event Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarClock className="w-4 h-4 text-hbs-amber shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-hbs-slate-dark truncate">
            {eventName}
          </span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white text-hbs-slate-muted hover:text-hbs-blue flex items-center justify-center border border-white/80 transition-all active:scale-95"
          title={isEditing ? 'Speichern' : 'Ereignis anpassen'}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div className="w-full my-3 space-y-2.5">
          <div>
            <label className="text-[10px] font-bold text-hbs-slate-muted block mb-1">Ereignis-Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white/80 border border-white/90 font-bold focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
              placeholder="z.B. Sommerferien, Klassenarbeit..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-hbs-slate-muted block mb-1">Zieldatum</label>
            <input
              type="date"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white/80 border border-white/90 font-bold focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1 pt-1">
            {['Herbstferien', 'Weihnachtsferien', 'Klassenarbeit', 'Projektwoche'].map((preset) => (
              <button
                key={preset}
                onClick={() => setEventName(preset)}
                className="px-2 py-0.5 rounded-lg bg-white/60 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Countdown Display */
        <div className="my-auto py-2 text-center flex flex-col items-center">
          {daysLeft > 0 ? (
            <>
              <span className="text-5xl sm:text-6xl font-black text-hbs-slate-dark tracking-tight font-mono drop-shadow-xs">
                {daysLeft}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-hbs-amber-dark mt-1">
                {daysLeft === 1 ? 'Tag verbleibend' : 'Tage verbleibend'}
              </span>
            </>
          ) : daysLeft === 0 ? (
            <div className="flex flex-col items-center gap-1 text-emerald-600 animate-bounce">
              <PartyPopper className="w-10 h-10" />
              <span className="text-xl font-black">Heute ist es soweit!</span>
            </div>
          ) : (
            <div className="text-center text-hbs-slate-muted">
              <span className="text-2xl font-bold">Bereits vorbei!</span>
              <p className="text-[11px] mt-1">Stelle ein neues Zieldatum ein.</p>
            </div>
          )}
        </div>
      )}

      {/* Target Date Footer */}
      <div className="text-[11px] font-bold text-hbs-slate-muted text-center pt-2 border-t border-white/30 w-full">
        Ziel: {new Date(targetDateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </div>
    </div>
  );
};
