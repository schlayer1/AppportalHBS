import { useState, useEffect, useMemo } from 'react';
import { PasswordGate } from './components/PasswordGate';
import { Header } from './components/Header';
import { AppCard } from './components/AppCard';
import { QrCodeModal } from './components/QrCodeModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { QuickToolsDrawer } from './components/QuickToolsDrawer';
import { FloatingDock } from './components/FloatingDock';
import { ExternalLinks } from './components/ExternalLinks';
import { EmptyState } from './components/ui/empty-state';
import { CardTilt } from './components/ui/card-tilt';
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
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('hbs_portal_auth') === 'true' ||
      sessionStorage.getItem('hbs_portal_auth') === 'true'
    );
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQrApp, setActiveQrApp] = useState<SchoolApp | null>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState<boolean>(false);
  const [isSmartboardMode, setIsSmartboardMode] = useState<boolean>(false);

  // Favorites Hook
  const { favorites, toggleFavorite, isFavorite, hasFavorites } = useFavorites();

  // Auto-scroll to top when category or smartboard mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, isSmartboardMode]);

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

  return (
    <div className="min-h-dvh bg-hbs-bg text-hbs-slate-dark flex flex-col font-sans pb-24">
      
      {/* Sticky Header */}
      <Header
        onLogout={handleLogout}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenQuickTools={() => setIsQuickToolsOpen(true)}
        isSmartboardMode={isSmartboardMode}
        onToggleSmartboardMode={() => setIsSmartboardMode(!isSmartboardMode)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        appCount={SCHOOL_APPS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        
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
              onClick={() => setIsSmartboardMode(false)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-hbs-amber text-hbs-slate-dark hover:text-white border border-hbs-amber/30 text-xs font-bold shadow-xs transition-all duration-150 active:scale-95 shrink-0"
            >
              Normalansicht wiederherstellen
            </button>
          </div>
        )}

        {/* HERO BANNER WITH 3D EMBLEM & AURA */}
        {selectedCategory === 'all' && !searchQuery && !isSmartboardMode && (
          <div className="relative rounded-3xl bg-gradient-to-br from-white via-white to-hbs-blue-soft/50 border border-hbs-slate-border/80 p-6 sm:p-10 shadow-hbs-card mb-8 sm:mb-12 overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              
              {/* Left Column: Text & Features */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hbs-blue-soft border border-hbs-blue/20 text-hbs-blue text-xs font-bold mb-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Digitale Infrastruktur • Heimbürgeschule Kahla</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-hbs-slate-dark tracking-tight leading-tight">
                  Zentrale Anlaufstelle für Ihren Schulalltag
                </h2>
                <p className="text-sm sm:text-base text-hbs-slate-muted mt-2 sm:mt-3 leading-relaxed">
                  Alle schuleigenen Web-Apps, pädagogischen Begleiter und offiziellen Portale an einem geschützten Ort. 
                  Optimiert für Tablets, Smartphones und Dienstgeräte.
                </p>

                {/* Quick Feature Pills */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-slate-100 text-xs font-semibold text-hbs-slate-muted">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-hbs-blue" />
                    <span>DSGVO-konform & datensparsam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-hbs-teal" />
                    <span>PWA & Homescreen-fähig</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-hbs-amber" />
                    <span>Von Kollegen für Kollegen</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Interaktives Schulsiegel mit Leucht-Aura */}
              <div className="relative group shrink-0">
                {/* Pulsing Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-hbs-blue/30 via-hbs-teal/30 to-hbs-amber/20 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

                <CardTilt maxRotation={15} scale={1.05} className="relative z-10">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/90 backdrop-blur-md p-4 flex items-center justify-center border-2 border-hbs-blue/20 shadow-2xl shadow-hbs-blue/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                    <img 
                      src="/Siegel_bunt.png" 
                      alt="Heimbürgeschule Siegel" 
                      className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                      style={{ transform: 'translateZ(25px)' }}
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
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <h3 className="text-lg font-black text-hbs-slate-dark tracking-tight">
                Meine Favoriten (<span className="tabular-nums">{favoriteApps.length}</span>)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
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

            <div className="w-full h-[1px] bg-slate-200/80 my-10" />
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-hbs-slate-dark tracking-tight">
              {isSmartboardMode && 'Schüler- & Unterrichtstools für Beamer'}
              {!isSmartboardMode && selectedCategory === 'all' && 'Alle schuleigenen Anwendungen'}
              {!isSmartboardMode && selectedCategory === 'kollegium' && 'Apps für Kollegium & Lehrerzimmer'}
              {!isSmartboardMode && selectedCategory === 'unterricht' && 'Apps für Unterricht & Schülerprojekte'}
              {!isSmartboardMode && selectedCategory === 'portale' && 'Offizielle Schulportale'}
            </h3>
            <p className="text-xs sm:text-sm text-hbs-slate-muted mt-0.5">
              {searchQuery 
                ? `${filteredApps.length} ${filteredApps.length === 1 ? 'Ergebnis' : 'Ergebnisse'} für „${searchQuery}“`
                : isSmartboardMode
                ? 'Schüler können die QR-Codes direkt von der Wand oder vom Smartboard scannen.'
                : 'Klicken Sie auf 🔄 für 3D-Details oder ⭐ zum Favorisieren.'
              }
            </p>
          </div>
        </div>

        {/* Apps Grid */}
        {selectedCategory !== 'portale' && (
          <>
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
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
            ) : (
              <EmptyState
                icon={SearchX}
                title="Keine passende Schulapp gefunden"
                description={`Für die aktuelle Auswahl konnte keine passende Anwendung gefunden werden.`}
                actionLabel="Filter zurücksetzen"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setIsSmartboardMode(false);
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

      {/* Footer */}
      <footer className="bg-white border-t border-hbs-slate-border/70 mt-16 sm:mt-24 py-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hbs-slate-muted">
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
        onToggleSmartboardMode={() => setIsSmartboardMode(!isSmartboardMode)}
        onOpenQr={(app) => setActiveQrApp(app)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        apps={SCHOOL_APPS}
      />

      {/* QR Code Modal */}
      <QrCodeModal
        app={activeQrApp}
        onClose={() => setActiveQrApp(null)}
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

    </div>
  );
}
