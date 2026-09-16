import React, { useState } from 'react';
import { VolumeX, MessageSquare, Users2, Building2 } from 'lucide-react';

interface WorkSymbol {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SYMBOLS: WorkSymbol[] = [
  {
    id: 'silence',
    title: 'Stillarbeit',
    subtitle: 'Absolute Ruhe, Einzelarbeit',
    emoji: '🤫',
    icon: VolumeX,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'whisper',
    title: 'Flüsterarbeit',
    subtitle: 'Nur mit dem Tischnachbarn flüstern',
    emoji: '💬',
    icon: MessageSquare,
    color: 'from-teal-500 to-emerald-600'
  },
  {
    id: 'partner',
    title: 'Partnerarbeit',
    subtitle: 'Austausch zu zweit in Zimmerlautstärke',
    emoji: '👥',
    icon: Users2,
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'group',
    title: 'Gruppenarbeit',
    subtitle: 'Gemeinsames Arbeiten im Team',
    emoji: '🤝',
    icon: Building2,
    color: 'from-purple-500 to-pink-600'
  }
];

export const WorkSymbolsWidget: React.FC = () => {
  const [activeSymbolId, setActiveSymbolId] = useState<string>('silence');

  const currentSymbol = SYMBOLS.find((s) => s.id === activeSymbolId) || SYMBOLS[0];

  return (
    <div className="flex flex-col items-center justify-between p-2 select-none h-full text-hbs-slate-dark">
      {/* Big Active Symbol Card */}
      <div className="w-full p-4 rounded-2xl bg-white/70 border border-white/90 shadow-sm flex flex-col items-center text-center my-1">
        <span className="text-5xl my-1 animate-bounce duration-1000">{currentSymbol.emoji}</span>
        <h4 className="text-lg font-black text-hbs-slate-dark tracking-tight mt-1">
          {currentSymbol.title}
        </h4>
        <p className="text-xs text-hbs-slate-muted font-bold mt-0.5">
          {currentSymbol.subtitle}
        </p>
      </div>

      {/* 4 Mode Selectors */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-3">
        {SYMBOLS.map((sym) => {
          const isSelected = activeSymbolId === sym.id;
          return (
            <button
              key={sym.id}
              onClick={() => setActiveSymbolId(sym.id)}
              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                isSelected
                  ? 'bg-hbs-blue text-white border-hbs-blue shadow-xs scale-105 font-bold'
                  : 'bg-white/60 hover:bg-white text-hbs-slate-dark border-white/80'
              }`}
            >
              <span className="text-lg">{sym.emoji}</span>
              <span className="text-[10px] font-black leading-tight text-center truncate max-w-full">
                {sym.title.replace('arbeit', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
