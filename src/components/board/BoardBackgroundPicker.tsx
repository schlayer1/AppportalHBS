import React from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { BACKGROUND_PRESETS } from './backgrounds';
import { BoardBackgroundId } from './types';

interface BoardBackgroundPickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeBackgroundId: BoardBackgroundId;
  onSelectBackground: (id: BoardBackgroundId) => void;
}

export const BoardBackgroundPicker: React.FC<BoardBackgroundPickerProps> = ({
  isOpen,
  onClose,
  activeBackgroundId,
  onSelectBackground
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl ios-glass overflow-hidden shadow-2xl p-5 border border-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-hbs-blue text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-hbs-slate-dark tracking-tight">Tafel-Hintergrund</h3>
              <p className="text-xs text-hbs-slate-muted">Wähle die passende Kulisse für deine Stunde</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/60 shadow-2xs transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid of Background Previews */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-h-[60vh] overflow-y-auto p-1">
          {BACKGROUND_PRESETS.map((preset) => {
            const isSelected = activeBackgroundId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectBackground(preset.id);
                  onClose();
                }}
                className={`relative group rounded-2xl overflow-hidden border-2 text-left transition-all p-3 flex flex-col justify-end h-28 shadow-xs active:scale-95 ${
                  isSelected
                    ? 'border-hbs-blue ring-2 ring-hbs-blue/30 shadow-md scale-[1.02]'
                    : 'border-white/80 hover:border-hbs-blue/40'
                }`}
                style={preset.style}
              >
                {/* Fallback background class if no inline style */}
                {preset.className && (
                  <div className={`absolute inset-0 ${preset.className} -z-10`} />
                )}

                {/* Selected Checkmark badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-hbs-blue text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-1 text-white border border-white/20">
                  <span className="text-xs font-bold block truncate drop-shadow-xs">
                    {preset.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
