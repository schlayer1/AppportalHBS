import React, { useState, useEffect } from 'react';
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
  BarChart2,
  Flame,
  Users,
  QrCode,
  Compass,
  BookOpen
} from 'lucide-react';
import { PORTAL_CONFIG } from '../config/apps';
import { useAuth } from '../context/AuthContext';

export type ViewMode = 'bento' | 'compact' | 'smartboard' | 'tafel' | 'menti' | 'kahoot' | 'oncoo';

interface HeaderProps {
  onLogout: () => void;
  onOpenInstallGuide: () => void;
  onOpenQuickTools: () => void;
  onOpenTableTent?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAddCustomLink?: () => void;
  onOpenHandbook?: () => void;
  onOpenTour?: () => void;
  onOpenGeminiSettings?: () => void;
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

const VIEW_MODES = [
  { id: 'bento' as ViewMode, label: 'Bento-Grid', shortLabel: 'Bento', icon: LayoutGrid, color: 'text-hbs-blue', bgActive: 'bg-white text-hbs-blue shadow-xs' },
  { id: 'compact' as ViewMode, label: 'Kompakte Kacheln', shortLabel: 'Kompakt', icon: Grid2X2, color: 'text-hbs-blue', bgActive: 'bg-white text-hbs-blue shadow-xs' },
  { id: 'smartboard' as ViewMode, label: 'Smartboard', shortLabel: 'Beamer', icon: Projector, color: 'text-hbs-amber', bgActive: 'bg-hbs-amber text-white shadow-xs' },
  { id: 'tafel' as ViewMode, label: 'Digitale Tafel', shortLabel: 'Tafel', icon: Presentation, color: 'text-emerald-600', bgActive: 'bg-emerald-600 text-white shadow-xs' },
  { id: 'menti' as ViewMode, label: 'HBS Menti', shortLabel: 'Menti', icon: BarChart2, color: 'text-teal-600', bgActive: 'bg-teal-600 text-white shadow-xs' },
  { id: 'kahoot' as ViewMode, label: 'HBS Kahoot!', shortLabel: 'Kahoot', icon: Flame, color: 'text-purple-600', bgActive: 'bg-purple-600 text-white shadow-xs' },
  { id: 'oncoo' as ViewMode, label: 'HBS Oncoo', shortLabel: 'Oncoo', icon: Users, color: 'text-rose-600', bgActive: 'bg-rose-600 text-white shadow-xs' },
];

export const Header: React.FC<HeaderProps> = ({
  onLogout,
  onOpenInstallGuide,
  onOpenQuickTools,
  onOpenTableTent,
  onOpenAdminPanel,
  onOpenAddCustomLink,
  onOpenHandbook,
  onOpenTour,
  onOpenGeminiSettings,
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

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white/95 border-b border-hbs-slate-border/70 sticky top-0 z-40 shadow-xs backdrop-blur-md pt-[env(safe-area-inset-top)] w-full max-w-full overflow-visible">
      {/* Top Navbar */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 relative overflow-visible">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-hbs-blue-soft p-1 sm:p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0">
              <img 
                src="/Siegel_bunt.png" 
                alt="Heimbürgeschule Wappen" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-hbs-blue truncate block">
                  {PORTAL_CONFIG.schoolName}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal bg-hbs-teal-light px-2.5 py-0.5 rounded-full border border-hbs-teal/20">
                  <Sparkles className="w-3 h-3" /> Kollegiumshub
                </span>
              </div>
              <h1 className="text-xs sm:text-base lg:text-xl font-black text-hbs-slate-dark tracking-tight leading-tight truncate">
                {PORTAL_CONFIG.portalTitle}
              </h1>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* DESKTOP (lg:flex): Full Segmented Control */}
            <div className="hidden lg:flex items-center bg-hbs-bg p-1 rounded-2xl border border-hbs-slate-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                      isSelected
                        ? mode.bgActive
                        : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                    }`}
                    title={mode.label}
                    aria-label={mode.label}
                  >
                    <Icon className={`w-4 h-4 ${isSelected && mode.id !== 'bento' && mode.id !== 'compact' ? 'text-white' : mode.color}`} />
                    <span className="hidden xl:inline font-black">{mode.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Tools Trigger (Visible on all screen sizes) */}
            <button
              type="button"
              onClick={onOpenQuickTools}
              className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-hbs-blue-soft text-hbs-blue-deep hover:bg-hbs-blue-light border border-hbs-blue/20 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer touch-manipulation"
              title="Unterrichts-Quick-Tools (Timer, Zufall, Lärmampel)"
            >
              <Wrench className="w-4 h-4 text-hbs-blue shrink-0" />
              <span className="hidden xs:inline">Tools</span>
            </button>

            {/* Custom Link Button (lg:flex) */}
            {onOpenAddCustomLink && currentUser && (
              <button
                onClick={onOpenAddCustomLink}
                className="hidden lg:flex h-9 px-3 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs active:scale-95 transition-all select-none items-center gap-1.5"
                title="Neuen eigenen Link / App ablegen"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>+ Link</span>
              </button>
            )}

            {/* Admin Panel Button */}
            {isAdmin && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs active:scale-95 transition-all select-none flex items-center gap-1.5"
                title="Admin-Panel öffnen (Benutzer, Vorlagen & Sync)"
              >
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Reorder Mode Button (desktop or active) */}
            {onToggleReorderMode && currentUser && (
              <button
                onClick={onToggleReorderMode}
                className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold shadow-xs active:scale-95 transition-all select-none items-center gap-1.5 ${
                  isReorderMode
                    ? 'flex bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'hidden xl:flex bg-white hover:bg-slate-50 text-hbs-slate-dark border-slate-200'
                }`}
                title="Apps frei sortieren"
              >
                <ArrowUpDown className="w-4 h-4 shrink-0" />
                <span>{isReorderMode ? 'Fertig' : 'Sortieren'}</span>
              </button>
            )}

            {/* Logged in Teacher Badge (lg:flex) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-hbs-slate-dark select-none">
              <User className="w-3.5 h-3.5 text-hbs-blue shrink-0" />
              <span className="truncate max-w-[100px] xl:max-w-[140px]">
                {currentUser ? currentUser.name : isGuest ? 'Gast' : 'Kollege'}
              </span>
            </div>

            {/* Tour trigger (lg:flex) */}
            {onOpenTour && (
              <button
                onClick={onOpenTour}
                className="hidden lg:flex h-9 p-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 border border-teal-300/40 text-xs font-bold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
                title="Interaktive Portal-Tour starten"
                aria-label="Portal-Tour"
              >
                <Compass className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Tour</span>
              </button>
            )}

            {/* Handbook trigger (lg:flex) */}
            {onOpenHandbook && (
              <button
                onClick={onOpenHandbook}
                className="hidden lg:flex h-9 p-2 px-3 rounded-xl text-hbs-slate-muted hover:text-hbs-blue hover:bg-hbs-blue-soft border border-transparent hover:border-hbs-blue/20 text-xs font-semibold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
                title="Bebildertes Kollegiums-Handbuch & Dokumentation öffnen"
                aria-label="Handbuch öffnen"
              >
                <BookOpen className="w-4 h-4 text-hbs-blue shrink-0" />
                <span>Handbuch</span>
              </button>
            )}

            {/* Gemini KI-Studio trigger (lg:flex) */}
            {onOpenGeminiSettings && (
              <button
                onClick={onOpenGeminiSettings}
                className="hidden lg:flex h-9 p-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 border border-purple-300/60 text-xs font-bold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
                title="Google Gemini KI-Optionen & Modellstatus öffnen"
                aria-label="KI-Studio"
              >
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>KI-Studio</span>
              </button>
            )}

            {/* Table Tent Generator modal trigger (xl:flex) */}
            {onOpenTableTent && (
              <button
                onClick={onOpenTableTent}
                className="hidden xl:flex h-9 p-2 px-3 rounded-xl text-hbs-slate-muted hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 text-xs font-semibold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
                title="QR-Code Tischaufsteller für Schülertische drucken"
                aria-label="Tischaufsteller öffnen"
              >
                <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Aufsteller</span>
              </button>
            )}

            {/* Guide modal trigger (xl:flex) */}
            <button
              onClick={onOpenInstallGuide}
              className="hidden xl:flex h-9 p-2 px-3 rounded-xl text-hbs-slate-muted hover:text-hbs-blue hover:bg-hbs-blue-soft border border-transparent hover:border-hbs-blue/20 text-xs font-semibold active:scale-95 transition-all items-center justify-center gap-1.5 select-none"
              title="Installationsanleitung & Homescreen-Tipps"
              aria-label="Installationsanleitung öffnen"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Guide</span>
            </button>

            {/* Mobile More Menu Button (< lg) */}
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-hbs-slate-dark hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center shadow-2xs cursor-pointer touch-manipulation"
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
                  <div className="absolute right-0 top-11 z-50 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Angemeldet als</span>
                      <span className="text-xs font-black text-slate-800 truncate block">
                        {currentUser ? currentUser.name : isGuest ? 'Gast' : 'Kollege'}
                      </span>
                    </div>

                    {onOpenAddCustomLink && currentUser && (
                      <button
                        onClick={() => { onOpenAddCustomLink(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5 text-hbs-blue" />
                        <span>Eigener Link hinzufügen</span>
                      </button>
                    )}

                    {isAdmin && onOpenAdminPanel && (
                      <button
                        onClick={() => { onOpenAdminPanel(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>Admin-Panel</span>
                      </button>
                    )}

                    {onToggleReorderMode && currentUser && (
                      <button
                        onClick={() => { onToggleReorderMode(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isReorderMode ? 'Sortieren beenden' : 'Apps frei sortieren'}</span>
                      </button>
                    )}

                    {onOpenTour && (
                      <button
                        onClick={() => { onOpenTour(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-50 flex items-center gap-2"
                      >
                        <Compass className="w-3.5 h-3.5 text-teal-600" />
                        <span>Portal-Tour & Einführung</span>
                      </button>
                    )}

                    {onOpenHandbook && (
                      <button
                        onClick={() => { onOpenHandbook(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-hbs-blue hover:bg-hbs-blue-soft flex items-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-hbs-blue" />
                        <span>Kollegiums-Handbuch (PDF)</span>
                      </button>
                    )}

                    {onOpenGeminiSettings && (
                      <button
                        onClick={() => { onOpenGeminiSettings(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-900 hover:bg-purple-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Google Gemini KI-Studio</span>
                      </button>
                    )}

                    {onOpenTableTent && (
                      <button
                        onClick={() => { onOpenTableTent(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-50 flex items-center gap-2"
                      >
                        <QrCode className="w-3.5 h-3.5 text-teal-600" />
                        <span>Tischaufsteller drucken</span>
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

                    {onOpenInstallGuide && (
                      <button
                        onClick={() => { onOpenInstallGuide(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Installations-Guide</span>
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
              className="h-9 px-2.5 sm:px-3 rounded-xl text-hbs-slate-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-semibold active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 select-none"
              title="Portal sperren / Abmelden"
              aria-label="Abmelden"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-500 hover:text-red-600" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>

          </div>
        </div>

        {/* MOBILE VIEW MODE BAR (< lg): Swipeable horizontal pill selector */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2 px-0.5 border-t border-slate-100 touch-manipulation">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation cursor-pointer ${
                  isSelected
                    ? mode.bgActive
                    : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected && mode.id !== 'bento' && mode.id !== 'compact' ? 'text-white' : mode.color}`} />
                <span>{mode.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter Sub-Bar */}
        <div className="pb-4 pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none touch-manipulation">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>Alle Apps</span> (<span className="tabular-nums">{appCount}</span>)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('kollegium')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                selectedCategory === 'kollegium'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 shrink-0 text-hbs-teal-deep" />
              <span>Lehrerzimmer & Kollegium</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('unterricht')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                selectedCategory === 'unterricht'
                  ? 'bg-hbs-blue text-white shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue border border-hbs-blue/10'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-hbs-amber-dark" />
              <span>Unterricht & Schüler</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('portale')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] shrink-0 flex items-center gap-1.5 touch-manipulation cursor-pointer ${
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
