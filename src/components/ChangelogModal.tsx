import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Wrench, Calendar, Tag, Layers } from 'lucide-react';
import { CHANGELOG_RELEASES } from '../data/changelogData';
import { ChangelogRelease, ChangelogItem } from '../types/requestTypes';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRequests?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose, onOpenRequests }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(CHANGELOG_RELEASES[0]?.version || '2.3.0');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRelease: ChangelogRelease = CHANGELOG_RELEASES.find(r => r.version === selectedVersion) || CHANGELOG_RELEASES[0];

  const getTypeBadge = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'neu':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            Neu
          </span>
        );
      case 'verbessert':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" />
            Verbessert
          </span>
        );
      case 'behoben':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Wrench className="w-3 h-3" />
            Behoben
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex items-center justify-center bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-hbs-slate-border/80 w-full max-w-3xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 mt-0.5">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 px-2.5 py-0.5 bg-blue-100/80 rounded-full border border-blue-200">
                  Versions-Historie
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  App-Portal HBS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Was ist neu?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Alle Aktualisierungen, Neuerungen und Fehlerbehebungen auf einen Blick.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Selector Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {CHANGELOG_RELEASES.map((rel) => {
            const isSelected = rel.version === selectedVersion;
            return (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                <span>v{rel.version}</span>
                {rel.isLatest && (
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Aktuell
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {/* Release Header Banner */}
          <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 rounded-2xl p-4 sm:p-5 border border-blue-100/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-blue-900 bg-blue-200/70 px-2.5 py-0.5 rounded-lg">
                  v{currentRelease.version}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  {currentRelease.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentRelease.date}</span>
              </div>
            </div>
            {currentRelease.highlight && (
              <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">
                {currentRelease.highlight}
              </p>
            )}
          </div>

          {/* Release Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Änderungen & Details ({currentRelease.items.length})
            </h4>
            <div className="grid gap-3">
              {currentRelease.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 transition-all duration-150 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getTypeBadge(item.type)}
                    {item.badge && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {item.badge}
                      </span>
                    )}
                    <h5 className="text-sm sm:text-base font-bold text-slate-800">
                      {item.title}
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Haben Sie eine Idee für eine neue Funktion oder ein Problem entdeckt?
          </p>
          <div className="flex items-center gap-2">
            {onOpenRequests && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRequests();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-98 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Wunsch einreichen
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
