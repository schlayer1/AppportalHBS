import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, Sparkles, BookOpen, Compass } from 'lucide-react';
import { BACKGROUND_PRESETS } from './backgrounds';
import { BoardBackgroundId } from './types';

interface BoardBackgroundPickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeBackgroundId: BoardBackgroundId;
  onSelectBackground: (id: BoardBackgroundId) => void;
}

type TabType = 'all' | 'verlauf' | 'linierung' | 'classic';

export const BoardBackgroundPicker: React.FC<BoardBackgroundPickerProps> = ({
  isOpen,
  onClose,
  activeBackgroundId,
  onSelectBackground
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (!isOpen) return null;

  const filteredPresets = BACKGROUND_PRESETS.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verlauf') return p.category === 'verlauf';
    if (activeTab === 'linierung') return p.category === 'linierung';
    if (activeTab === 'classic') return ['tafel', 'papier', 'natur', 'modern'].includes(p.category);
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl ios-glass overflow-hidden shadow-2xl p-5 border border-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-hbs-blue text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark tracking-tight">Tafel-Hintergrund wählen</h3>
              <p className="text-xs text-hbs-slate-muted">Seichte Verläufe, klassische Linierungen oder Naturkulissen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/60 shadow-2xs transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pb-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-hbs-blue text-white shadow-2xs font-black'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border border-white/80'
            }`}
          >
            Alle ({BACKGROUND_PRESETS.length})
          </button>
          <button
            onClick={() => setActiveTab('verlauf')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'verlauf'
                ? 'bg-hbs-blue text-white shadow-2xs font-black'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border border-white/80'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>5 Sanfte Verläufe</span>
          </button>
          <button
            onClick={() => setActiveTab('linierung')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'linierung'
                ? 'bg-hbs-blue text-white shadow-2xs font-black'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border border-white/80'
            }`}
          >
            <BookOpen className="w-3 h-3 text-emerald-600" />
            <span>5 Tafel-Linierungen</span>
          </button>
          <button
            onClick={() => setActiveTab('classic')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'classic'
                ? 'bg-hbs-blue text-white shadow-2xs font-black'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border border-white/80'
            }`}
          >
            <Compass className="w-3 h-3 text-blue-500" />
            <span>Klassisch & Natur</span>
          </button>
        </div>

        {/* Grid of Background Previews */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 max-h-[60vh] overflow-y-auto p-1">
          {filteredPresets.map((preset) => {
            const isSelected = activeBackgroundId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectBackground(preset.id);
                  onClose();
                }}
                className={`relative group rounded-2xl overflow-hidden border-2 text-left transition-all p-3 flex flex-col justify-between h-28 sm:h-32 shadow-xs active:scale-95 ${
                  isSelected
                    ? 'border-hbs-blue ring-2 ring-hbs-blue/40 shadow-lg scale-[1.02]'
                    : 'border-white/80 hover:border-hbs-blue/40'
                }`}
                style={preset.style}
              >
                {/* Background class */}
                {preset.className && (
                  <div className={`absolute inset-0 ${preset.className} -z-10`} />
                )}

                {/* Selected Checkmark badge */}
                <div className="flex justify-end w-full">
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-hbs-blue text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Info Chip */}
                <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 text-white border border-white/20">
                  <span className="text-xs font-black block truncate leading-tight">
                    {preset.name}
                  </span>
                  {preset.description && (
                    <span className="text-[9px] text-white/80 block truncate mt-0.5">
                      {preset.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
