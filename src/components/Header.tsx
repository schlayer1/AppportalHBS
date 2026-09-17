import React, { useState } from 'react';
import { 
  LogOut, 
  Smartphone, 
  Search, 
  X, 
  Sparkles, 
  Wrench,
  LayoutGrid,
  Grid2X2,
  Projector,
  Presentation,
  Coffee,
  GraduationCap,
  Globe,
  User,
  Plus,
  Shield,
  ArrowUpDown,
  MoreVertical,
  BarChart2
} from 'lucide-react';
import { PORTAL_CONFIG } from '../config/apps';
import { useAuth } from '../context/AuthContext';

export type ViewMode = 'bento' | 'compact' | 'smartboard' | 'tafel' | 'menti';

interface HeaderProps {
  onLogout: () => void;
  onOpenInstallGuide: () => void;
  onOpenQuickTools: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAddCustomLink?: () => void;
  isReorderMode?: boolean;
  onToggleReorderMode?: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  appCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLogout,
  onOpenInstallGuide,
  onOpenQuickTools,
  onOpenAdminPanel,
  onOpenAddCustomLink,
  isReorderMode,
  onToggleReorderMode,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  appCount
}) => {
  const { currentUser, isAdmin, isGuest } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <header className="bg-white/95 border-b border-hbs-slate-border/70 sticky top-0 z-30 shadow-xs backdrop-blur-md pt-[env(safe-area-inset-top)]">
      {/* Top Navbar */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24 gap-2 sm:gap-3">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-hbs-blue-soft p-1 sm:p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              <img 
                src="/Siegel_bunt.png" 
                alt="Heimbürgeschule Wappen" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-hbs-blue truncate">
                  {PORTAL_CONFIG.schoolName}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal bg-hbs-teal-light px-2.5 py-0.5 rounded-full border border-hbs-teal/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <Sparkles className="w-3 h-3" /> Kollegiumshub
                </span>
              </div>
              <h1 className="text-sm sm:text-xl lg:text-2xl font-black text-hbs-slate-dark tracking-tight leading-tight truncate">
                {PORTAL_CONFIG.portalTitle}
              </h1>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* MOBILE ONLY (< md): Dedicated Tafel / Apps Toggle */}
            <div className="flex items-center md:hidden">
              {viewMode !== 'tafel' ? (
                <button
                  onClick={() => setViewMode('tafel')}
                  className="h-9 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all select-none"
                  title="Zur Digitalen Tafel wechseln"
                >
                  <Presentation className="w-3.5 h-3.5 shrink-0" />
                  <span>Tafel</span>
                </button>
              ) : (
                <button
                  onClick={() => setViewMode('bento')}
                  className="h-9 px-2.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all select-none"
                  title="Zurück zur App-Übersicht"
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span>Apps</span>
                </button>
              )}
            </div>

            {/* TABLET & DESKTOP (md:flex): Full View Mode Segmented Control */}
            <div className="hidden md:flex items-center bg-hbs-bg p-1 rounded-2xl border border-hbs-slate-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              <button
                onClick={() => setViewMode('bento')}
                className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1 ${
                  viewMode === 'bento'
                    ? 'bg-white text-hbs-blue shadow-xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                }`}
                title="Bento-Grid Ansicht"
                aria-label="Bento-Grid Ansicht"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden xl:inline">Bento</span>
              </button>

              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1 ${
                  viewMode === 'compact'
                    ? 'bg-white text-hbs-blue shadow-xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                }`}
                title="Kompakte Kacheln (App-Style)"
                aria-label="Kompaktansicht"
              >
                <Grid2X2 className="w-4 h-4" />
                <span className="hidden xl:inline">Kompakt</span>
              </button>

              <button
                onClick={() => setViewMode('smartboard')}
                className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1 ${
                  viewMode === 'smartboard'
                    ? 'bg-hbs-amber text-white shadow-xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                }`}
                title="Smartboard-Präsentationsmodus (Große App-Kacheln & QR)"
                aria-label="Smartboard-Modus"
              >
                <Projector className="w-4 h-4" />
                <span className="hidden xl:inline">Smartboard</span>
              </button>

              <button
                onClick={() => setViewMode('tafel')}
                className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                  viewMode === 'tafel'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-hbs-slate-muted hover:text-emerald-700'
                }`}
                title="Digitale Tafel"
                aria-label="Digitale Tafel"
              >
                <Presentation className={`w-4 h-4 ${viewMode === 'tafel' ? 'text-white' : 'text-emerald-600'}`} />
                <span className="hidden xl:inline font-black">Tafel</span>
              </button>

              <button
                onClick={() => setViewMode('menti')}
                className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                  viewMode === 'menti'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-hbs-slate-muted hover:text-teal-700'
                }`}
                title="HBS Menti (Live-Abfragen & Wortwolken)"
                aria-label="HBS Menti"
              >
                <BarChart2 className={`w-4 h-4 ${viewMode === 'menti' ? 'text-white' : 'text-teal-600'}`} />
                <span className="hidden xl:inline font-black">Menti</span>
              </button>
            </div>

            {/* Quick Tools Drawer Trigger (Hidden on mobile because in bottom dock) */}
            <button
              onClick={onOpenQuickTools}
              className="hidden md:flex h-9 sm:min-h-[40px] items-center gap-2 px-3 py-2 rounded-xl bg-hbs-blue-soft text-hbs-blue-deep hover:bg-hbs-blue-light border border-hbs-blue/20 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all select-none"
              title="Unterrichts-Quick-Tools (Timer, Zufall, Lärmampel)"
            >
              <Wrench className="w-4 h-4 text-hbs-blue shrink-0" />
              <span className="hidden lg:inline">Tools</span>
            </button>

            {/* Custom Link Button */}
            {onOpenAddCustomLink && currentUser && (
              <button
                onClick={onOpenAddCustomLink}
                className="h-9 px-2 sm:px-3 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all select-none flex items-center gap-1.5"
                title="Neuen eigenen Link / App ablegen"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">+ Link</span>
              </button>
            )}

            {/* Admin Panel Button */}
            {isAdmin && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="h-9 px-2 sm:px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all select-none flex items-center gap-1.5"
                title="Admin-Panel öffnen (Benutzer, Vorlagen & Sync)"
              >
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Reorder Mode Button */}
            {onToggleReorderMode && currentUser && (
              <button
                onClick={onToggleReorderMode}
                className={`h-9 px-2 sm:px-3 rounded-xl border text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all select-none items-center gap-1.5 ${
                  isReorderMode
                    ? 'flex bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'hidden sm:flex bg-white hover:bg-slate-50 text-hbs-slate-dark border-slate-200'
                }`}
                title="Apps frei sortieren"
              >
                <ArrowUpDown className="w-4 h-4 shrink-0" />
                <span className="hidden xl:inline">{isReorderMode ? 'Fertig' : 'Sortieren'}</span>
              </button>
            )}

            {/* Logged in Teacher Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-hbs-slate-dark select-none">
              <User className="w-3.5 h-3.5 text-hbs-blue shrink-0" />
              <span className="truncate max-w-[90px] md:max-w-[120px]">
                {currentUser ? currentUser.name : isGuest ? 'Gast' : 'Kollege'}
              </span>
            </div>

            {/* Guide modal trigger (Hidden on mobile because in bottom dock) */}
            <button
              onClick={onOpenInstallGuide}
              className="hidden md:flex h-9 sm:min-h-[40px] p-2 sm:px-3 rounded-xl text-hbs-slate-muted hover:text-hbs-blue hover:bg-hbs-blue-soft border border-transparent hover:border-hbs-blue/20 text-xs sm:text-sm font-semibold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
              title="Installationsanleitung & Homescreen-Tipps"
              aria-label="Installationsanleitung öffnen"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Guide</span>
            </button>

            {/* Mobile More Menu Button (< sm) */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-hbs-slate-dark hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center shadow-2xs"
                title="Menü öffnen"
                aria-label="Menü"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMobileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1 animate-in fade-in duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Angemeldet als</span>
                      <span className="text-xs font-black text-slate-800 truncate block">
                        {currentUser ? currentUser.name : isGuest ? 'Gast' : 'Kollege'}
                      </span>
                    </div>

                    {/* View Switcher inside Mobile Menu */}
                    <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 mb-1">
                      <button
                        onClick={() => { setViewMode('bento'); setIsMobileMenuOpen(false); }}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'bento' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" /> Bento
                      </button>
                      <button
                        onClick={() => { setViewMode('compact'); setIsMobileMenuOpen(false); }}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'compact' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <Grid2X2 className="w-3 h-3" /> Kompakt
                      </button>
                      <button
                        onClick={() => { setViewMode('menti'); setIsMobileMenuOpen(false); }}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          viewMode === 'menti' ? 'bg-white text-teal-600 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <BarChart2 className="w-3 h-3 text-teal-600" /> Menti
                      </button>
                    </div>

                    {onToggleReorderMode && currentUser && (
                      <button
                        onClick={() => { onToggleReorderMode(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isReorderMode ? 'Sortieren beenden' : 'Apps frei sortieren'}</span>
                      </button>
                    )}

                    {onOpenInstallGuide && (
                      <button
                        onClick={() => { onOpenInstallGuide(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Installations-Guide</span>
                      </button>
                    )}

                    {onOpenQuickTools && (
                      <button
                        onClick={() => { onOpenQuickTools(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Wrench className="w-3.5 h-3.5 text-hbs-blue" />
                        <span>Unterrichts-Tools</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Abmelden</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="h-9 px-2 sm:px-3 rounded-xl text-hbs-slate-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs sm:text-sm font-semibold active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 select-none"
              title="Portal sperren / Abmelden"
              aria-label="Abmelden"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-500 hover:text-red-600" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Sub-Bar */}
        <div className="pb-4 pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 select-none flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>Alle Apps</span> (<span className="tabular-nums">{appCount}</span>)
            </button>
            <button
              onClick={() => setSelectedCategory('kollegium')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 select-none flex items-center gap-1.5 ${
                selectedCategory === 'kollegium'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 shrink-0 text-hbs-teal-deep" />
              <span>Lehrerzimmer & Kollegium</span>
            </button>
            <button
              onClick={() => setSelectedCategory('unterricht')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 select-none flex items-center gap-1.5 ${
                selectedCategory === 'unterricht'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-hbs-amber-dark" />
              <span>Unterricht & Schüler</span>
            </button>
            <button
              onClick={() => setSelectedCategory('portale')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 select-none flex items-center gap-1.5 ${
                selectedCategory === 'portale'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0 text-hbs-blue" />
              <span>Schul-Portale</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-hbs-slate-light">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="App oder Funktion suchen..."
              className="w-full min-h-[44px] pl-9 pr-9 py-2 text-xs sm:text-sm bg-hbs-bg rounded-xl border border-hbs-slate-border text-hbs-slate-dark placeholder-hbs-slate-light/80 focus:outline-none focus:border-hbs-blue focus:ring-2 focus:ring-hbs-blue/15 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-hbs-slate-light hover:text-hbs-slate-dark min-h-[44px] min-w-[44px]"
                aria-label="Suche zurücksetzen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
