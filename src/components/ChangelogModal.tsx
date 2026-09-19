import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Wrench, 
  Calendar, 
  Tag, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Maximize2, 
  Minimize2,
  HelpCircle
} from 'lucide-react';
import { CHANGELOG_RELEASES } from '../data/changelogData';
import { ChangelogRelease, ChangelogItem } from '../types/requestTypes';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRequests?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose, onOpenRequests }) => {
  // Set of expanded versions; latest is open by default
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CHANGELOG_RELEASES.forEach((r, idx) => {
      initial[r.version] = idx === 0; // Only latest open by default
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    CHANGELOG_RELEASES.forEach(r => { allOpen[r.version] = true; });
    setExpandedVersions(allOpen);
  };

  const collapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    CHANGELOG_RELEASES.forEach(r => { allClosed[r.version] = false; });
    setExpandedVersions(allClosed);
  };

  const areAllExpanded = useMemo(() => {
    return CHANGELOG_RELEASES.every(r => expandedVersions[r.version]);
  }, [expandedVersions]);

  // Filtered releases based on search
  const filteredReleases = useMemo(() => {
    if (!searchQuery.trim()) return CHANGELOG_RELEASES;
    const q = searchQuery.toLowerCase().trim();
    return CHANGELOG_RELEASES.map(rel => {
      const matchesTitle = rel.title.toLowerCase().includes(q);
      const matchesVersion = rel.version.toLowerCase().includes(q);
      const matchingItems = rel.items.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
      if (matchesTitle || matchesVersion || matchingItems.length > 0) {
        return {
          ...rel,
          items: matchingItems.length > 0 ? matchingItems : rel.items
        };
      }
      return null;
    }).filter(Boolean) as ChangelogRelease[];
  }, [searchQuery]);

  // Auto-expand on active search
  useEffect(() => {
    if (searchQuery.trim()) {
      expandAll();
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const getTypeBadge = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'neu':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Neu
          </span>
        );
      case 'verbessert':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Verbessert
          </span>
        );
      case 'behoben':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            <Wrench className="w-3 h-3 text-amber-600" />
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
                  App-Portal • Heimbürgeschule Kahla
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Was ist neu? (Changelog)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Alle Aktualisierungen, Neuerungen und Hilfen für den Schulalltag – verständlich erklärt.
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

        {/* Filter & Expand Controls Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Funktion oder Stichwort suchen..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expand/Collapse All Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={areAllExpanded ? collapseAll : expandAll}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs active:scale-98"
            >
              {areAllExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Alle einklappen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alle aufklappen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content: Collapsible Releases */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
          {filteredReleases.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">
                Keine Einträge für „{searchQuery}“ gefunden
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                Versuchen Sie einen anderen Suchbegriff oder leeren Sie die Suche.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Suche zurücksetzen
              </button>
            </div>
          ) : (
            filteredReleases.map((release) => {
              const isExpanded = !!expandedVersions[release.version];

              return (
                <div
                  key={release.version}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'bg-white border-blue-200 shadow-md shadow-blue-500/5' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Collapsible Release Header */}
                  <button
                    onClick={() => toggleVersion(release.version)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 select-none transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                        release.isLatest 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        v{release.version}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">
                            {release.title}
                          </h3>
                          {release.isLatest && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Aktuell
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {release.date}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-500">
                            {release.items.length} {release.items.length === 1 ? 'Änderung' : 'Änderungen'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                        {isExpanded ? 'Einklappen' : 'Anzeigen'}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isExpanded ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Body: Release Details & Items */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 border-t border-slate-100 space-y-3.5 animate-fadeIn">
                      {/* Highlight Banner if available */}
                      {release.highlight && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100 text-xs text-blue-900 font-medium">
                          <strong className="font-bold text-blue-950">Zusammenfassung: </strong>
                          {release.highlight}
                        </div>
                      )}

                      {/* Items List */}
                      <div className="grid gap-2.5">
                        {release.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-200 transition-all"
                          >
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              {getTypeBadge(item.type)}
                              {item.badge && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                                  {item.badge}
                                </span>
                              )}
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed pl-0.5">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Haben Sie eine Idee für eine neue Funktion oder möchten Sie einen Wunsch einreichen?
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
