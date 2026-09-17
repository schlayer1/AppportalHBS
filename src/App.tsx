import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { PasswordGate } from './components/PasswordGate';
import { Header, ViewMode } from './components/Header';
import { PortalViewMode } from './types/user';
import { AppCard } from './components/AppCard';
import { CompactAppCard } from './components/CompactAppCard';
import { AppDetailSheet } from './components/AppDetailSheet';
import { QrCodeModal } from './components/QrCodeModal';
import { QuickToolsDrawer } from './components/QuickToolsDrawer';
import { FloatingDock } from './components/FloatingDock';
import { ExternalLinks } from './components/ExternalLinks';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy-loaded standalone sub-applications & heavy screens
const ClassroomBoard = lazy(() => import('./components/board/ClassroomBoard').then(m => ({ default: m.ClassroomBoard })));
const StudentPollVoter = lazy(() => import('./components/board/StudentPollVoter').then(m => ({ default: m.StudentPollVoter })));
const StudentBoardViewer = lazy(() => import('./components/board/StudentBoardViewer').then(m => ({ default: m.StudentBoardViewer })));

const MentiDashboard = lazy(() => import('./components/menti/MentiDashboard').then(m => ({ default: m.MentiDashboard })));
const MentiEditor = lazy(() => import('./components/menti/MentiEditor').then(m => ({ default: m.MentiEditor })));
const MentiPresenter = lazy(() => import('./components/menti/MentiPresenter').then(m => ({ default: m.MentiPresenter })));
const MentiStudentVoter = lazy(() => import('./components/menti/MentiStudentVoter').then(m => ({ default: m.MentiStudentVoter })));
import type { MentiPresentation } from './types/mentiTypes';

const KahootDashboard = lazy(() => import('./components/kahoot/KahootDashboard').then(m => ({ default: m.KahootDashboard })));
const KahootEditor = lazy(() => import('./components/kahoot/KahootEditor').then(m => ({ default: m.KahootEditor })));
const KahootPresenter = lazy(() => import('./components/kahoot/KahootPresenter').then(m => ({ default: m.KahootPresenter })));
const KahootStudentPlayer = lazy(() => import('./components/kahoot/KahootStudentPlayer').then(m => ({ default: m.KahootStudentPlayer })));
import type { KahootGame } from './types/kahootTypes';

const OncooDashboard = lazy(() => import('./components/oncoo/OncooDashboard').then(m => ({ default: m.OncooDashboard })));
const OncooPresenter = lazy(() => import('./components/oncoo/OncooPresenter').then(m => ({ default: m.OncooPresenter })));
const OncooStudentClient = lazy(() => import('./components/oncoo/OncooStudentClient').then(m => ({ default: m.OncooStudentClient })));
import type { OncooSession } from './types/oncooTypes';

// Lazy-loaded heavy modal dialogues
const InstallGuideModal = lazy(() => import('./components/InstallGuideModal').then(m => ({ default: m.InstallGuideModal })));
const AdminPanelModal = lazy(() => import('./components/admin/AdminPanelModal').then(m => ({ default: m.AdminPanelModal })));
const AddCustomLinkModal = lazy(() => import('./components/links/AddCustomLinkModal').then(m => ({ default: m.AddCustomLinkModal })));
const TableTentGeneratorModal = lazy(() => import('./components/tools/TableTentGeneratorModal').then(m => ({ default: m.TableTentGeneratorModal })));
import { EmptyState } from './components/ui/empty-state';
import { CardTilt } from './components/ui/card-tilt';
import { AuroraBackground } from './components/ui/aurora-background';
import { SCHOOL_APPS, EXTERNAL_LINKS, SchoolApp } from './config/apps';
import { useFavorites } from './hooks/useFavorites';
import { useAuth } from './context/AuthContext';
import { 
  Sparkles, 
  Shield, 
  SearchX, 
  Projector, 
  Star, 
  ArrowUpDown, 
  Plus 
} from 'lucide-react';

const STORAGE_KEY_PORTAL_VIEW = 'hbs_portal_view_mode';

const getInitialPortalView = (): PortalViewMode => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PORTAL_VIEW);
      if (saved === 'bento' || saved === 'compact' || saved === 'smartboard') {
        return saved as PortalViewMode;
      }
    } catch {
      // ignore
    }
    if (window.innerWidth < 640) {
      return 'compact';
    }
  }
  return 'bento';
};

export default function App() {
  const { 
    isAuthenticated, 
    logout, 
    userPreferences, 
    updateAppOrder, 
    removeCustomApp, 
    updatePortalViewMode,
    currentUser, 
    isAdmin,
    isGuest
  } = useAuth();

  // Remembered preferred portal view mode (bento | compact | smartboard)
  const [preferredPortalView, setPreferredPortalView] = useState<PortalViewMode>(getInitialPortalView);

  // Remembers the preferred standard grid ('bento' or 'compact') when switching out of smartboard mode
  const [normalPortalView, setNormalPortalView] = useState<'bento' | 'compact'>(() => {
    const initial = getInitialPortalView();
    return initial === 'compact' ? 'compact' : 'bento';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#menti') return 'menti';
      if (hash === '#kahoot') return 'kahoot';
      if (hash === '#oncoo') return 'oncoo';
      if (localStorage.getItem('hbs_guest_portal_mode_v1') === 'true') {
        return 'tafel';
      }
    }
    return getInitialPortalView();
  });

  // Guest mode is dedicated solely to the Digital Blackboard (ClassroomBoard)
  useEffect(() => {
    if (isGuest && viewMode !== 'tafel') {
      setViewMode('tafel');
    }
  }, [isGuest, viewMode]);

  // Synchronize preferred portal view from user profile if saved in cloud
  useEffect(() => {
    if (userPreferences?.portalViewMode) {
      const userPref = userPreferences.portalViewMode;
      setPreferredPortalView(userPref);
      if (userPref === 'bento' || userPref === 'compact') {
        setNormalPortalView(userPref);
      }
      try {
        localStorage.setItem(STORAGE_KEY_PORTAL_VIEW, userPref);
      } catch {
        // ignore
      }
      setViewMode((current) => {
        if (current === 'bento' || current === 'compact' || current === 'smartboard') {
          return userPref;
        }
        return current;
      });
    }
  }, [userPreferences?.portalViewMode]);

  // Handle active user switching of view modes
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    if (newMode === 'bento' || newMode === 'compact' || newMode === 'smartboard') {
      setPreferredPortalView(newMode);
      if (newMode === 'bento' || newMode === 'compact') {
        setNormalPortalView(newMode);
      }
      try {
        localStorage.setItem(STORAGE_KEY_PORTAL_VIEW, newMode);
      } catch {
        // ignore
      }
      if (currentUser && updatePortalViewMode) {
        updatePortalViewMode(newMode);
      }
    }
    setViewMode(newMode);
  }, [currentUser, updatePortalViewMode]);

  // Cleanly exit an app/tool back to the user's remembered portal view
  const handleExitToPortal = useCallback(() => {
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
    }
    setViewMode(preferredPortalView);
  }, [preferredPortalView]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQrApp, setActiveQrApp] = useState<SchoolApp | null>(null);
  const [selectedDetailApp, setSelectedDetailApp] = useState<SchoolApp | null>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState<boolean>(false);

  // New Modals State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAddCustomLinkOpen, setIsAddCustomLinkOpen] = useState<boolean>(false);
  const [isTableTentOpen, setIsTableTentOpen] = useState<boolean>(false);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // Menti presentation state
  const [activeMentiPresentation, setActiveMentiPresentation] = useState<MentiPresentation | null>(null);
  const [mentiSubView, setMentiSubView] = useState<'dashboard' | 'editor' | 'presenter'>('dashboard');

  // Kahoot game state
  const [activeKahootGame, setActiveKahootGame] = useState<KahootGame | null>(null);
  const [kahootSubView, setKahootSubView] = useState<'dashboard' | 'editor' | 'presenter'>('dashboard');

  // Oncoo session state
  const [activeOncooPresentationSession, setActiveOncooPresentationSession] = useState<OncooSession | null>(null);
  const [oncooSubView, setOncooSubView] = useState<'dashboard' | 'presenter'>('dashboard');

  // Favorites Hook
  const { favorites, toggleFavorite, isFavorite, hasFavorites } = useFavorites();

  const isSmartboardMode = viewMode === 'smartboard';

  // Listen to #menti, #kahoot and #oncoo hashes in URL
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#menti') {
        setViewMode('menti');
      } else if (hash === '#kahoot') {
        setViewMode('kahoot');
      } else if (hash === '#oncoo') {
        setViewMode('oncoo');
      } else if (!hash) {
        setViewMode((prev) => {
          if (prev === 'menti' || prev === 'kahoot' || prev === 'oncoo') {
            return preferredPortalView;
          }
          return prev;
        });
      }
    };
    window.addEventListener('hashchange', checkHash);
    checkHash();
    return () => window.removeEventListener('hashchange', checkHash);
  }, [preferredPortalView]);

  // Auto-scroll to top when category or view mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, viewMode]);

  // Convert custom user apps to SchoolApp objects
  const customSchoolApps: SchoolApp[] = useMemo(() => {
    return (userPreferences?.customApps || []).map((ca) => ({
      id: ca.id,
      title: ca.title,
      shortTitle: ca.title,
      subtitle: ca.description || 'Eigener Link',
      description: ca.description || ca.url,
      url: ca.url,
      category: (ca.category as any) || 'unterricht',
      badge: ca.badge || 'Mein Link',
      badgeColor: 'teal' as const,
      icon: ca.icon || 'Globe',
      tags: ['Eigener Link', 'Persönlich'],
      offlineReady: false
    }));
  }, [userPreferences?.customApps]);

  // Combined Apps list: School Apps + Personal Custom Links, sorted by user's custom order
  const combinedApps = useMemo(() => {
    const combined = [...SCHOOL_APPS, ...customSchoolApps];
    const order = userPreferences?.appOrder;
    if (!order || order.length === 0) return combined;

    return [...combined].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [customSchoolApps, userPreferences?.appOrder]);

  // Filtered Apps based on Category, Search & Smartboard Mode
  const filteredApps = useMemo(() => {
    return combinedApps.filter((app) => {
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
  }, [combinedApps, selectedCategory, searchQuery, isSmartboardMode]);

  // Favorite Apps list
  const favoriteApps = useMemo(() => {
    return combinedApps.filter((app) => favorites.includes(app.id));
  }, [combinedApps, favorites]);

  // Move App Order
  const handleMoveApp = (appId: string, direction: 'left' | 'right') => {
    const ids = combinedApps.map(a => a.id);
    const idx = ids.indexOf(appId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;

    const newOrder = [...ids];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    updateAppOrder(newOrder);
  };

  // Check if student is accessing live poll via QR code (bypass password gate)
  const isPollVoter = typeof window !== 'undefined' && (
    window.location.search.includes('poll=') || 
    window.location.hash.includes('poll=')
  );

  if (isPollVoter) {
    return (
      <Suspense fallback={<LoadingSpinner message="Abstimmung wird geladen..." />}>
        <StudentPollVoter 
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('poll');
            window.history.replaceState({}, '', url.pathname);
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  // Check if student is accessing Menti live via QR code or PIN (bypass password gate)
  const isMentiVoter = typeof window !== 'undefined' && (
    window.location.search.includes('menti=') || 
    window.location.hash.includes('menti=')
  );

  if (isMentiVoter) {
    return (
      <Suspense fallback={<LoadingSpinner message="Menti Abstimmung wird geladen..." />}>
        <MentiStudentVoter 
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('menti');
            window.history.replaceState({}, '', url.pathname);
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  // Check if student is accessing Kahoot live via QR code or PIN (bypass password gate)
  const isKahootPlayer = typeof window !== 'undefined' && (
    window.location.search.includes('kahoot=') || 
    window.location.hash.includes('kahoot=')
  );

  if (isKahootPlayer) {
    return (
      <Suspense fallback={<LoadingSpinner message="Kahoot Quiz wird geladen..." />}>
        <KahootStudentPlayer 
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('kahoot');
            window.history.replaceState({}, '', url.pathname);
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  // Check if student is accessing Oncoo via PIN or QR code (bypass password gate)
  const isOncooPlayer = typeof window !== 'undefined' && (
    window.location.search.includes('oncoo=') || 
    window.location.hash.includes('oncoo=')
  );

  if (isOncooPlayer) {
    return (
      <Suspense fallback={<LoadingSpinner message="Oncoo Werkzeug wird geladen..." />}>
        <OncooStudentClient 
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('oncoo');
            window.history.replaceState({}, '', url.pathname);
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  // Check if student is accessing shared blackboard via QR code (bypass password gate)
  const isBoardShare = typeof window !== 'undefined' && (
    window.location.search.includes('boardShare=') || 
    window.location.hash.includes('boardShare=')
  );

  if (isBoardShare) {
    return (
      <Suspense fallback={<LoadingSpinner message="Tafelbild wird geladen..." />}>
        <StudentBoardViewer 
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('boardShare');
            window.history.replaceState({}, '', url.pathname);
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return (
      <PasswordGate 
        onAuthenticated={() => {}} 
        onStartGuestBoard={() => {
          setViewMode('tafel');
        }}
      />
    );
  }

  // Fullscreen Classroom Board View (Classroomscreen Replica)
  if (viewMode === 'tafel') {
    return (
      <Suspense fallback={<LoadingSpinner message="Digitale Tafel wird geladen..." />}>
        <ClassroomBoard 
          onExit={() => {
            if (isGuest) {
              logout();
            } else {
              handleExitToPortal();
            }
          }} 
          isGuest={isGuest}
        />
      </Suspense>
    );
  }

  // Fullscreen / Dedicated HBS Menti System (Mentimeter Clone)
  if (viewMode === 'menti') {
    if (mentiSubView === 'editor' && activeMentiPresentation) {
      return (
        <Suspense fallback={<LoadingSpinner message="Menti Editor wird geladen..." />}>
          <MentiEditor
            initialPresentation={activeMentiPresentation}
            onClose={() => setMentiSubView('dashboard')}
            onStartPresenter={(pres) => {
              setActiveMentiPresentation(pres);
              setMentiSubView('presenter');
            }}
          />
        </Suspense>
      );
    }

    if (mentiSubView === 'presenter' && activeMentiPresentation) {
      return (
        <Suspense fallback={<LoadingSpinner message="Menti Präsentation wird geladen..." />}>
          <MentiPresenter
            presentation={activeMentiPresentation}
            onExit={() => setMentiSubView('dashboard')}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<LoadingSpinner message="Menti Studio wird geladen..." />}>
        <MentiDashboard
          onBackToPortal={handleExitToPortal}
          onEditPresentation={(pres) => {
            setActiveMentiPresentation(pres);
            setMentiSubView('editor');
          }}
          onStartPresenter={(pres) => {
            setActiveMentiPresentation(pres);
            setMentiSubView('presenter');
          }}
        />
      </Suspense>
    );
  }

  // Fullscreen / Dedicated HBS Kahoot System (Kahoot Clone with AI Quiz Generator)
  if (viewMode === 'kahoot') {
    if (kahootSubView === 'editor' && activeKahootGame) {
      return (
        <Suspense fallback={<LoadingSpinner message="Quiz Editor wird geladen..." />}>
          <KahootEditor
            initialGame={activeKahootGame}
            onClose={() => setKahootSubView('dashboard')}
            onStartPresenter={(game) => {
              setActiveKahootGame(game);
              setKahootSubView('presenter');
            }}
          />
        </Suspense>
      );
    }

    if (kahootSubView === 'presenter' && activeKahootGame) {
      return (
        <Suspense fallback={<LoadingSpinner message="Live-Quiz Arena wird gestartet..." />}>
          <KahootPresenter
            game={activeKahootGame}
            onExit={() => setKahootSubView('dashboard')}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<LoadingSpinner message="Kahoot Studio wird geladen..." />}>
        <KahootDashboard
          onBackToPortal={handleExitToPortal}
          onEditGame={(game) => {
            setActiveKahootGame(game);
            setKahootSubView('editor');
          }}
          onStartGame={(game) => {
            setActiveKahootGame(game);
            setKahootSubView('presenter');
          }}
        />
      </Suspense>
    );
  }

  // Fullscreen / Dedicated HBS Oncoo System (Cooperative Learning Tools)
  if (viewMode === 'oncoo') {
    if (oncooSubView === 'presenter' && activeOncooPresentationSession) {
      return (
        <Suspense fallback={<LoadingSpinner message="Oncoo Sitzung wird vorbereitet..." />}>
          <OncooPresenter
            session={activeOncooPresentationSession}
            onExit={() => setOncooSubView('dashboard')}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<LoadingSpinner message="Oncoo Studio wird geladen..." />}>
        <OncooDashboard
          onBackToPortal={handleExitToPortal}
          onStartSession={(session) => {
            setActiveOncooPresentationSession(session);
            setOncooSubView('presenter');
          }}
        />
      </Suspense>
    );
  }

  return (
    <AuroraBackground>
      
      {/* Sticky Header with SchoolClock and ViewMode Segmented Switcher */}
      <Header
        onLogout={logout}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenQuickTools={() => setIsQuickToolsOpen(true)}
        onOpenTableTent={() => setIsTableTentOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAddCustomLink={() => setIsAddCustomLinkOpen(true)}
        isReorderMode={isReorderMode}
        onToggleReorderMode={() => setIsReorderMode(!isReorderMode)}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        appCount={combinedApps.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pb-40 sm:pb-36">
        
        {/* REORDER MODE ALERT BANNER */}
        {isReorderMode && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-950">
                  Sortiermodus aktiv für {currentUser ? currentUser.name : 'Kollege'}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Verschieben Sie Kacheln mit den Pfeiltasten (◀ ▶). Eigene Links können Sie mit dem Papierkorb entfernen.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReorderMode(false)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
            >
              Fertig & Speichern
            </button>
          </div>
        )}

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
              onClick={() => handleViewModeChange(normalPortalView)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-hbs-amber text-hbs-slate-dark hover:text-white border border-hbs-amber/30 text-xs font-bold shadow-xs transition-all duration-150 active:scale-95 shrink-0"
            >
              Normalansicht wiederherstellen
            </button>
          </div>
        )}

        {/* HERO BANNER: Clean, non-overlapping responsive layout */}
        {selectedCategory === 'all' && !searchQuery && !isSmartboardMode && !isReorderMode && (
          <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-5 sm:p-8 lg:p-10 shadow-[0_15px_35px_-5px_rgba(9,29,46,0.07)] mb-8 sm:mb-10 overflow-hidden shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
              
              {/* Left Column: School Title & Feature Badges */}
              <div className="max-w-3xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hbs-blue-soft border border-hbs-blue/20 text-hbs-blue text-xs font-bold mb-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <Sparkles className="w-3.5 h-3.5 text-hbs-blue" />
                  <span>Staatliche Regelschule Heimbürgeschule Kahla</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-hbs-slate-dark tracking-tight leading-tight">
                  {currentUser ? `Willkommen, ${currentUser.name}!` : 'Zentrale Anlaufstelle für Ihren Schulalltag'}
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-hbs-slate-muted mt-2 leading-relaxed">
                  {currentUser 
                    ? `Ihr persönlicher digitaler Arbeitsplatz. Ordnen Sie Apps nach Ihren Vorlieben an, speichern Sie eigene Unterrichtslinks und nutzen Sie gespeicherte Tafelbilder.`
                    : `Alle schuleigenen Web-Apps, pädagogischen Begleiter und offiziellen Portale gebündelt. Optimiert für Tablets, Smartboards und Dienstgeräte.`
                  }
                </p>

                {/* Quick Action Buttons in Hero */}
                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <button
                    onClick={() => setIsAddCustomLinkOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Eigener Link hinzufügen</span>
                  </button>

                  <button
                    onClick={() => setIsReorderMode(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Apps anordnen</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin-Panel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Properly Sized 3D School Seal */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-hbs-blue/30 via-hbs-teal/25 to-hbs-amber/20 blur-xl pointer-events-none" />

                <CardTilt maxRotation={12} scale={1.05} className="relative z-10">
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-3xl bg-white/95 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center border border-white/90 shadow-xl shadow-hbs-blue/10 shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]">
                    <img 
                      src="/Siegel_bunt.png" 
                      alt="Heimbürgeschule Siegel" 
                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </CardTilt>
              </div>

            </div>
          </div>
        )}

        {/* SECTION: MEINE FAVORITEN (If any exist and not in smartboard mode) */}
        {hasFavorites && selectedCategory === 'all' && !searchQuery && !isSmartboardMode && !isReorderMode && (
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
              {!isSmartboardMode && selectedCategory === 'all' && 'Alle schuleigenen Anwendungen & persönliche Links'}
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
                      isReorderMode={isReorderMode}
                      onMoveLeft={() => handleMoveApp(app.id, 'left')}
                      onMoveRight={() => handleMoveApp(app.id, 'right')}
                      onDeleteCustom={app.id.startsWith('custom-') ? () => removeCustomApp(app.id) : undefined}
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
                      isReorderMode={isReorderMode}
                      onMoveLeft={() => handleMoveApp(app.id, 'left')}
                      onMoveRight={() => handleMoveApp(app.id, 'right')}
                      onDeleteCustom={app.id.startsWith('custom-') ? () => removeCustomApp(app.id) : undefined}
                    />
                  ))}
                </div>
              )
            ) : (
              <EmptyState 
                icon={SearchX}
                title="Keine Apps gefunden"
                description={searchQuery ? `Für "${searchQuery}" wurden keine passenden Apps gefunden.` : "In dieser Kategorie sind derzeit keine Apps hinterlegt."}
                actionLabel="Filter zurücksetzen"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }} 
              />
            )}
          </>
        )}

        {/* SECTION: EXTERNE SCHULPORTALE */}
        {(selectedCategory === 'all' || selectedCategory === 'portale') && !searchQuery && !isSmartboardMode && (
          <div className="mt-14 sm:mt-16">
            <ExternalLinks links={EXTERNAL_LINKS} />
          </div>
        )}

      </main>

      {/* FLOATING MACOS / IPADOS DOCK AT BOTTOM */}
      <FloatingDock
        onOpenQuickTools={() => setIsQuickToolsOpen(true)}
        isSmartboardMode={isSmartboardMode}
        onToggleSmartboardMode={() => handleViewModeChange(isSmartboardMode ? normalPortalView : 'smartboard')}
        onOpenQr={(app) => setActiveQrApp(app)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        apps={combinedApps}
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

      {/* Suspense Container for Heavy Modal Dialogues */}
      <Suspense fallback={null}>
        {/* PWA Homescreen Guide Modal */}
        {isInstallGuideOpen && (
          <InstallGuideModal
            isOpen={isInstallGuideOpen}
            onClose={() => setIsInstallGuideOpen(false)}
          />
        )}

        {/* Admin Panel Modal */}
        {isAdminPanelOpen && (
          <AdminPanelModal
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
          />
        )}

        {/* Add Custom Link Modal */}
        {isAddCustomLinkOpen && (
          <AddCustomLinkModal
            isOpen={isAddCustomLinkOpen}
            onClose={() => setIsAddCustomLinkOpen(false)}
          />
        )}

        {/* QR-Code Table Tent Generator Modal */}
        {isTableTentOpen && (
          <TableTentGeneratorModal
            isOpen={isTableTentOpen}
            onClose={() => setIsTableTentOpen(false)}
          />
        )}
      </Suspense>

      {/* Quick Tools Slide-Over Drawer */}
      <QuickToolsDrawer
        isOpen={isQuickToolsOpen}
        onClose={() => setIsQuickToolsOpen(false)}
        onOpenTableTent={() => setIsTableTentOpen(true)}
      />
    </AuroraBackground>
  );
}
