import React, { useState } from 'react';

type LightColor = 'red' | 'yellow' | 'green' | null;

export const TrafficLightWidget: React.FC = () => {
  const [activeLight, setActiveLight] = useState<LightColor>('green');

  return (
    <div className="flex flex-col items-center justify-between p-2 select-none h-full text-hbs-slate-dark">
      {/* Traffic Light Housing */}
      <div className="w-24 p-3 rounded-3xl bg-slate-900/90 border-2 border-slate-700 shadow-2xl flex flex-col items-center gap-3 my-1">
        
        {/* RED LIGHT */}
        <button
          onClick={() => setActiveLight(activeLight === 'red' ? null : 'red')}
          className={`w-16 h-16 rounded-full border-2 transition-all duration-200 active:scale-95 flex items-center justify-center ${
            activeLight === 'red'
              ? 'bg-red-500 border-red-300 shadow-[0_0_28px_rgba(239,68,68,0.85)] scale-105'
              : 'bg-red-950/60 border-red-900/40 opacity-40 hover:opacity-60'
          }`}
          title="Rot: Stopp / Absolute Ruhe"
          aria-label="Rotes Licht"
        >
          <div className={`w-6 h-6 rounded-full ${activeLight === 'red' ? 'bg-red-300/60 blur-xs' : 'hidden'}`} />
        </button>

        {/* YELLOW LIGHT */}
        <button
          onClick={() => setActiveLight(activeLight === 'yellow' ? null : 'yellow')}
          className={`w-16 h-16 rounded-full border-2 transition-all duration-200 active:scale-95 flex items-center justify-center ${
            activeLight === 'yellow'
              ? 'bg-amber-400 border-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.85)] scale-105'
              : 'bg-amber-950/60 border-amber-900/40 opacity-40 hover:opacity-60'
          }`}
          title="Gelb: Aufmerksamkeit / Vorbereitung"
          aria-label="Gelbes Licht"
        >
          <div className={`w-6 h-6 rounded-full ${activeLight === 'yellow' ? 'bg-amber-200/60 blur-xs' : 'hidden'}`} />
        </button>

        {/* GREEN LIGHT */}
        <button
          onClick={() => setActiveLight(activeLight === 'green' ? null : 'green')}
          className={`w-16 h-16 rounded-full border-2 transition-all duration-200 active:scale-95 flex items-center justify-center ${
            activeLight === 'green'
              ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.85)] scale-105'
              : 'bg-emerald-950/60 border-emerald-900/40 opacity-40 hover:opacity-60'
          }`}
          title="Grün: Start / Freies Arbeiten"
          aria-label="Grünes Licht"
        >
          <div className={`w-6 h-6 rounded-full ${activeLight === 'green' ? 'bg-emerald-300/60 blur-xs' : 'hidden'}`} />
        </button>
      </div>

      {/* Meaning Status Badge */}
      <div className="mt-2 text-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-xs ${
            activeLight === 'red'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : activeLight === 'yellow'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : activeLight === 'green'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-white/60 text-hbs-slate-muted border border-white/80'
          }`}
        >
          {activeLight === 'red'
            ? 'Stopp & Zuhören'
            : activeLight === 'yellow'
            ? 'Achtung / Phase beenden'
            : activeLight === 'green'
            ? 'Arbeitsphase läuft'
            : 'Ampel ausgeschaltet'}
        </span>
      </div>
    </div>
  );
};
