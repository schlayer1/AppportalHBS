import { useState, useEffect, useMemo } from 'react';
import { PasswordGate } from './components/PasswordGate';
import { Header, ViewMode } from './components/Header';
import { AppCard } from './components/AppCard';
import { CompactAppCard } from './components/CompactAppCard';
import { AppDetailSheet } from './components/AppDetailSheet';
import { QrCodeModal } from './components/QrCodeModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { QuickToolsDrawer } from './components/QuickToolsDrawer';
import { FloatingDock } from './components/FloatingDock';
import { ExternalLinks } from './components/ExternalLinks';
import { ClassroomBoard } from './components/board/ClassroomBoard';
import { EmptyState } from './components/ui/empty-state';
import { CardTilt } from './components/ui/card-tilt';
import { AuroraBackground } from './components/ui/aurora-background';
import { SCHOOL_APPS, EXTERNAL_LINKS, PORTAL_CONFIG, SchoolApp } from './config/apps';
import { useFavorites } from './hooks/useFavorites';
import { 
  Sparkles, 
  Shield, 
  Smartphone, 
  HeartHandshake, 
  SearchX, 
  Projector, 
  Star,
  MonitorCheck
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('hbs_portal_auth') === 'true' ||
      sessionStorage.getItem('hbs_portal_auth') === 'true'
    );
  });

  // Default to compact view on mobile screens (< 640px)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'compact';
    }
    return 'bento';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQrApp, setActiveQrApp] = useState<SchoolApp | null>(null);
  const [selectedDetailApp, setSelectedDetailApp] = useState<SchoolApp | null>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState<boolean>(false);

  // Favorites Hook
  const { favorites, toggleFavorite, isFavorite, hasFavorites } = useFavorites();

  const isSmartboardMode = viewMode === 'smartboard';

  // Auto-scroll to top when category or view mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, viewMode]);

  const handleLogout = () => {
    localStorage.removeItem('hbs_portal_auth');
    localStorage.removeItem('hbs_portal_auth_timestamp');
    sessionStorage.removeItem('hbs_portal_auth');
    setIsAuthenticated(false);
  };

  // Filtered Apps based on Category, Search & Smartboard Mode
  const filteredApps = useMemo(() => {
    return SCHOOL_APPS.filter((app) => {
      // In Smartboard mode: strictly hide internal collegium/verwaltung apps!
      if (isSmartboardMode && app.category !== 'unterricht') {
        return false;
      }

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        app.category === selectedCategory ||
        (selectedCategory === 'kollegium' && app.category === 'verwaltung');

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.title.toLowerCase().includes(q) ||
        app.shortTitle.toLowerCase().includes(q) ||
        app.subtitle.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, isSmartboardMode]);

  // Favorite Apps list
  const favoriteApps = useMemo(() => {
    return SCHOOL_APPS.filter((app) => favorites.includes(app.id));
  }, [favorites]);

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Fullscreen Classroom Board View (Classroomscreen Replica)
  if (viewMode === 'tafel') {
    return <ClassroomBoard onExit={() => setViewMode('bento')} />;
  }

  return (
    <AuroraBackground>
      
      {/* Sticky Header with SchoolClock and ViewMode Segmented Switcher */}
      <Header
        onLogout={handleLogout}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenQuickTools={() => setIsQuickToolsOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        appCount={SCHOOL_APPS.length}
      />

      {/* Main Content Area: Screen-Filling Desktop Width with generous bottom clearance for Dock */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pb-40 sm:pb-36">
        
        {/* SMARTBOARD MODE ALERT BANNER */}
        {isSmartboardMode && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-hbs-amber-light via-amber-50 to-orange-50 border-2 border-hbs-amber/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-hbs-amber text-white flex items-center justify-center shrink-0 shadow-md">
                <Projector className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-hbs-amber-dark">
                  Klassenzimmer- & Beamer-Modus aktiv
                </span>
                <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark tracking-tight">
                  Unterrichtsansicht mit direkten Riesen-QR-Codes
                </h3>
                <p className="text-xs text-hbs-slate-muted mt-0.5">
                  Interne Kollegiumstools (Getränke & Vertretung) sind für Schüler ausgeblendet.
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewMode('bento')}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-hbs-amber text-hbs-slate-dark hover:text-white border border-hbs-amber/30 text-xs font-bold shadow-xs transition-all duration-150 active:scale-95 shrink-0"
            >
              Normalansicht wiederherstellen
            </button>
          </div>
        )}

        {/* HERO BANNER: Clean, non-overlapping responsive layout */}
        {selectedCategory === 'all' && !searchQuery && !isSmartboardMode && (
          <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-5 sm:p-8 lg:p-10 shadow-[0_15px_35px_-5px_rgba(9,29,46,0.07)] mb-8 sm:mb-10 overflow-hidden shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
              
              {/* Left Column: School Title & Feature Badges */}
              <div className="max-w-3xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hbs-blue-soft border border-hbs-blue/20 text-hbs-blue text-xs font-bold mb-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <Sparkles className="w-3.5 h-3.5 text-hbs-blue" />
                  <span>Staatliche Regelschule Heimbürgeschule Kahla</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-hbs-slate-dark tracking-tight leading-tight">
                  Zentrale Anlaufstelle für Ihren Schulalltag
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-hbs-slate-muted mt-2 leading-relaxed">
                  Alle schuleigenen Web-Apps, pädagogischen Begleiter und offiziellen Portale gebündelt. 
                  Optimiert für Tablets, Smartphones, Smartboards und Dienstgeräte.
                </p>

                {/* Quick Feature Pills */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 mt-5 pt-5 border-t border-slate-100 text-xs font-bold text-hbs-slate-muted">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hbs-bg border border-slate-200">
                    <Shield className="w-3.5 h-3.5 text-hbs-blue" />
                    <span>DSGVO-konform</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hbs-bg border border-slate-200">
                    <Smartphone className="w-3.5 h-3.5 text-hbs-teal" />
                    <span>PWA-fähig</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hbs-bg border border-slate-200">
                    <HeartHandshake className="w-3.5 h-3.5 text-hbs-amber" />
                    <span>Von Kollegen für Kollegen</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hbs-bg border border-slate-200">
                    <MonitorCheck className="w-3.5 h-3.5 text-hbs-blue" />
                    <span>Dashboard-Mode</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Properly Sized 3D School Seal (Never cut off!) */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-hbs-blue/30 via-hbs-teal/25 to-hbs-amber/20 blur-xl pointer-events-none" />

                <CardTilt maxRotation={12} scale={1.05} className="relative z-10">
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-3xl bg-white/95 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center border border-white/90 shadow-xl shadow-hbs-blue/10 shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]">
                    <img 
                      src="/Siegel_bunt.png" 
                      alt="Heimbürgeschule Siegel" 
                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-500 hover:scale-105"
                      style={{ transform: 'translateZ(20px)' }}
                    />
                  </div>
                </CardTilt>
              </div>

            </div>
          </div>
        )}

        {/* SECTION: MEINE FAVORITEN (If any exist and not in smartboard mode) */}
        {hasFavorites && selectedCategory === 'all' && !searchQuery && !isSmartboardMode && (
          <div className="mb-10 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 shadow-xs">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <h3 className="text-lg font-black text-hbs-slate-dark tracking-tight">
                Meine Favoriten (<span className="tabular-nums">{favoriteApps.length}</span>)
              </h3>
            </div>

            {/* Favorite Apps Grid */}
            {viewMode === 'compact' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {favoriteApps.map((app) => (
                  <CompactAppCard
                    key={`fav-compact-${app.id}`}
                    app={app}
                    onOpenDetails={(a) => setSelectedDetailApp(a)}
                    onOpenQr={(a) => setActiveQrApp(a)}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-7">
                {favoriteApps.map((app) => (
                  <AppCard
                    key={`fav-${app.id}`}
                    app={app}
                    onOpenQr={(selectedApp) => setActiveQrApp(selectedApp)}
                    onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                    isSmartboardMode={false}
                  />
                ))}
              </div>
            )}

            <div className="w-full h-[1px] bg-slate-200/80 my-8" />
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-hbs-slate-dark tracking-tight">
              {isSmartboardMode && 'Schüler- & Unterrichtstools für Beamer'}
              {!isSmartboardMode && selectedCategory === 'all' && 'Alle schuleigenen Anwendungen'}
              {!isSmartboardMode && selectedCategory === 'kollegium' && 'Apps für Kollegium & Lehrerzimmer'}
              {!isSmartboardMode && selectedCategory === 'unterricht' && 'Apps für Unterricht & Schülerprojekte'}
              {!isSmartboardMode && selectedCategory === 'portale' && 'Offizielle Schulportale'}
            </h3>
            {(searchQuery || isSmartboardMode) && (
              <p className="text-xs sm:text-sm text-hbs-slate-muted mt-0.5">
                {searchQuery 
                  ? `${filteredApps.length} ${filteredApps.length === 1 ? 'Ergebnis' : 'Ergebnisse'} für „${searchQuery}“`
                  : 'Schüler können die QR-Codes direkt von der Wand oder vom Smartboard scannen.'
                }
              </p>
            )}
          </div>
        </div>

        {/* Apps Grid: Dynamic switching between Bento, Compact and Smartboard */}
        {selectedCategory !== 'portale' && (
          <>
            {filteredApps.length > 0 ? (
              viewMode === 'compact' ? (
                /* Compact 2-column mobile / tablet grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {filteredApps.map((app) => (
                    <CompactAppCard
                      key={`compact-${app.id}`}
                      app={app}
                      onOpenDetails={(a) => setSelectedDetailApp(a)}
                      onOpenQr={(a) => setActiveQrApp(a)}
                      isFavorite={isFavorite(app.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                /* Full-width Bento / Smartboard grid (up to 4 columns on large screens) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-7">
                  {filteredApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onOpenQr={(selectedApp) => setActiveQrApp(selectedApp)}
                      onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
                      isFavorite={isFavorite(app.id)}
                      onToggleFavorite={toggleFavorite}
                      isSmartboardMode={isSmartboardMode}
                    />
                  ))}
                </div>
              )
            ) : (
              <EmptyState
                icon={SearchX}
                title="Keine passende Schulapp gefunden"
                description={`Für die aktuelle Auswahl konnte keine passende Anwendung gefunden werden.`}
                actionLabel="Filter zurücksetzen"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setViewMode('compact');
                }}
              />
            )}
          </>
        )}

        {/* External School Portals Section (Hidden in Smartboard mode) */}
        {!isSmartboardMode && (selectedCategory === 'all' || selectedCategory === 'portale') && !searchQuery && (
          <ExternalLinks links={EXTERNAL_LINKS} />
        )}

      </main>

      {/* Footer with Safe Area Padding */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-hbs-slate-border/70 mt-16 sm:mt-20 py-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hbs-slate-muted">
          <div className="flex items-center gap-3">
            <img src="/Siegel_bunt.png" alt="" className="w-7 h-7 object-contain opacity-80" />
            <div>
              <p className="font-bold text-hbs-slate-dark">{PORTAL_CONFIG.schoolName} • {PORTAL_CONFIG.schoolLocation}</p>
              <p className="text-[11px]">Internes App-Portal für Kollegium & Unterricht</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsInstallGuideOpen(true)}
              className="min-h-[44px] hover:text-hbs-blue transition-colors font-medium flex items-center"
            >
              PWA-Anleitung
            </button>
            <span>•</span>
            <button
              onClick={() => setIsQuickToolsOpen(true)}
              className="min-h-[44px] hover:text-hbs-blue transition-colors font-medium flex items-center"
            >
              Quick-Tools
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="min-h-[44px] hover:text-red-600 transition-colors font-medium flex items-center"
            >
              Abmelden
            </button>
          </div>
        </div>
      </footer>

      {/* FLOATING MACOS / IPADOS DOCK AT BOTTOM */}
      <FloatingDock
        onOpenQuickTools={() => setIsQuickToolsOpen(true)}
        isSmartboardMode={isSmartboardMode}
        onToggleSmartboardMode={() => setViewMode(isSmartboardMode ? 'bento' : 'smartboard')}
        onOpenQr={(app) => setActiveQrApp(app)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        apps={SCHOOL_APPS}
      />

      {/* QR Code Modal (for full Beamer view) */}
      <QrCodeModal
        app={activeQrApp}
        onClose={() => setActiveQrApp(null)}
      />

      {/* iOS Bottom Detail Sheet (for compact mobile taps) */}
      <AppDetailSheet
        app={selectedDetailApp}
        onClose={() => setSelectedDetailApp(null)}
        onOpenFullQr={(app) => {
          setSelectedDetailApp(null);
          setActiveQrApp(app);
        }}
      />

      {/* PWA Homescreen Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Quick Tools Slide-Over Drawer */}
      <QuickToolsDrawer
        isOpen={isQuickToolsOpen}
        onClose={() => setIsQuickToolsOpen(false)}
      />

    </AuroraBackground>
  );
}
