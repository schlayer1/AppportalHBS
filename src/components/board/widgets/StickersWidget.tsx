import React, { useState } from 'react';

interface Sticker {
  id: string;
  emoji: string;
  label: string;
  badgeColor: string;
}

const STICKERS: Sticker[] = [
  { id: 'trophy', emoji: '🏆', label: '1. Platz / Gewinner', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'star', emoji: '⭐', label: 'Super Leistung!', badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'target', emoji: '🎯', label: 'Stundenziel erreicht', badgeColor: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'rocket', emoji: '🚀', label: 'Volle Fahrt voraus', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'bulb', emoji: '💡', label: 'Geniale Idee!', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'heart', emoji: '❤️', label: 'Tolle Teamarbeit', badgeColor: 'bg-pink-100 text-pink-800 border-pink-300' },
  { id: 'medal', emoji: '🥇', label: 'Goldmedaille', badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'crown', emoji: '👑', label: 'Tageskönig(in)', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export const StickersWidget: React.FC = () => {
  const [selectedSticker, setSelectedSticker] = useState<Sticker>(STICKERS[0]);

  return (
    <div className="flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none h-full">
      {/* Big Featured Stamp */}
      <div className="my-auto p-4 rounded-3xl bg-white/80 border-2 border-white shadow-md flex flex-col items-center text-center">
        <span className="text-6xl animate-bounce duration-1000 my-1">{selectedSticker.emoji}</span>
        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-black border ${selectedSticker.badgeColor} shadow-2xs`}>
          {selectedSticker.label}
        </span>
      </div>

      {/* Grid of Stamp Choices */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-2 pt-2 border-t border-white/40">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSticker(s)}
            className={`p-1.5 rounded-xl text-xl flex items-center justify-center border transition-all active:scale-90 ${
              selectedSticker.id === s.id
                ? 'bg-hbs-blue text-white border-hbs-blue shadow-2xs scale-110'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border-white/80'
            }`}
            title={s.label}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
