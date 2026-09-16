import { useState, useEffect, useMemo } from 'react';
import { PasswordGate } from './components/PasswordGate';
import { Header } from './components/Header';
import { AppCard } from './components/AppCard';
import { QrCodeModal } from './components/QrCodeModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { ExternalLinks } from './components/ExternalLinks';
import { SCHOOL_APPS, EXTERNAL_LINKS, PORTAL_CONFIG, SchoolApp } from './config/apps';
import { Sparkles, Shield, Smartphone, HeartHandshake, Layers } from 'lucide-react';

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

  // Auto-scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  const handleLogout = () => {
    localStorage.removeItem('hbs_portal_auth');
    localStorage.removeItem('hbs_portal_auth_timestamp');
    sessionStorage.removeItem('hbs_portal_auth');
    setIsAuthenticated(false);
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return SCHOOL_APPS.filter((app) => {
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
  }, [selectedCategory, searchQuery]);

  // If not authenticated, show password screen
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-hbs-bg text-hbs-slate-dark flex flex-col font-sans">
      
      {/* Sticky Header with Navigation & Filter */}
      <Header
        onLogout={handleLogout}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        appCount={SCHOOL_APPS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        
        {/* Welcome Hero Banner (Only on 'all' and when not searching) */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="relative rounded-3xl bg-gradient-to-br from-white via-white to-hbs-blue-soft/50 border border-hbs-slate-border/80 p-6 sm:p-10 shadow-hbs-card mb-8 sm:mb-12 overflow-hidden">
            
            {/* Background seal watermark */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 opacity-5 pointer-events-none">
              <img src="/Siegel_bunt.png" alt="" className="w-full h-full object-contain" />
            </div>

            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hbs-blue-soft border border-hbs-blue/20 text-hbs-blue text-xs font-bold mb-3">
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
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-hbs-slate-dark tracking-tight">
              {selectedCategory === 'all' && 'Schuleigene Anwendungen'}
              {selectedCategory === 'kollegium' && 'Apps für Kollegium & Lehrerzimmer'}
              {selectedCategory === 'unterricht' && 'Apps für Unterricht & Schülerprojekte'}
              {selectedCategory === 'portale' && 'Offizielle Schulportale'}
            </h3>
            <p className="text-xs sm:text-sm text-hbs-slate-muted mt-0.5">
              {searchQuery 
                ? `${filteredApps.length} ${filteredApps.length === 1 ? 'Ergebnis' : 'Ergebnisse'} für „${searchQuery}“`
                : 'Klicken Sie auf „App öffnen“ oder lassen Sie sich den QR-Code anzeigen.'
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
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-hbs-slate-border">
                <Layers className="w-12 h-12 text-hbs-slate-light mx-auto mb-3 opacity-50" />
                <h4 className="text-base font-bold text-hbs-slate-dark">Keine passende Schulapp gefunden</h4>
                <p className="text-xs text-hbs-slate-muted mt-1 max-w-sm mx-auto">
                  Versuchen Sie einen anderen Suchbegriff oder wählen Sie oben die Kategorie „Alle Apps“.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-hbs-blue-soft text-hbs-blue text-xs font-bold hover:bg-hbs-blue-light transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </>
        )}

        {/* External School Portals Section */}
        {(selectedCategory === 'all' || selectedCategory === 'portale') && !searchQuery && (
          <ExternalLinks links={EXTERNAL_LINKS} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-hbs-slate-border/70 mt-16 sm:mt-24 py-8">
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
              className="hover:text-hbs-blue transition-colors font-medium"
            >
              PWA-Anleitung
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="hover:text-red-600 transition-colors font-medium"
            >
              Abmelden
            </button>
          </div>
        </div>
      </footer>

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

    </div>
  );
}
