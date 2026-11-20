import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Dices,
  Plus,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Printer,
  Copy,
  Check,
  Sparkles,
  Users,
  Play,
  Square,
  X,
  Shuffle,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  SAL1KE_GROUP_COLORS,
  QrGroupSession,
  DEFAULT_GRUPPEN_PRESETS,
  PreassignedGroupTeam,
  createShuffledGroupBag
} from '../../types/gruppenTypes';
import {
  syncGruppenLiveSession,
  subscribeToGruppenSession,
  claimGruppenSlotInCloud
} from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatTeacherName } from '../../types/user';

interface GruppenDashboardProps {
  onBackToPortal: () => void;
  onOpenTableTentWithCode?: (pinCode: string) => void;
}

const SEVEN_DAYS_MS = 7 * 86400000;

function generateRoundCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HBS${suffix}`;
}

export const GruppenDashboard: React.FC<GruppenDashboardProps> = ({
  onBackToPortal,
  onOpenTableTentWithCode
}) => {
  const { currentUser } = useAuth();
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Configuration / Setup Drawer or Modal state
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [showTeacherCheatSheet, setShowTeacherCheatSheet] = useState<boolean>(false);
  const [isQrFullscreenOpen, setIsQrFullscreenOpen] = useState<boolean>(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);
  const [isSimulatingClass, setIsSimulatingClass] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'link' | 'code' | null>(null);

  // Setup Form State
  const [draftTitle, setDraftTitle] = useState<string>(
    'Sucht euch einen Platz und baut eure Station auf'
  );
  const [draftGroupCount, setDraftGroupCount] = useState<number>(5);
  const [draftMaxSeats, setDraftMaxSeats] = useState<number>(29);
  const [draftGroupNames, setDraftGroupNames] = useState<string[]>([
    'Gruppe 1',
    'Gruppe 2',
    'Gruppe 3',
    'Gruppe 4',
    'Gruppe 5'
  ]);
  const [draftPreassignedGroups, setDraftPreassignedGroups] = useState<PreassignedGroupTeam[]>([]);

  // Active Live Session State
  const [session, setSession] = useState<QrGroupSession>(() => {
    try {
      const cached = localStorage.getItem('hbs_gruppen_active_session');
      if (cached) {
        const parsed = JSON.parse(cached) as QrGroupSession;
        if (parsed && parsed.pinCode && parsed.expiresAt > Date.now()) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const initialCode = generateRoundCode();
    const initialCount = 5;
    const now = Date.now();
    return {
      id: `grp-${now}`,
      code: initialCode,
      pinCode: initialCode,
      title: 'Sucht euch einen Platz und baut eure Station auf',
      groupCount: initialCount,
      groupNames: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4', 'Gruppe 5'],
      groupColors: SAL1KE_GROUP_COLORS.slice(0, initialCount),
      maxSeats: 29,
      assignedCount: 0,
      groupCounts: Array(initialCount).fill(0),
      remainingBag: createShuffledGroupBag(initialCount),
      deviceAssignments: {},
      isOpen: true,
      authorId: currentUser?.id || 'teacher',
      authorName: currentUser ? formatTeacherName(currentUser) : 'Lehrkraft',
      createdAt: now,
      updatedAt: now,
      expiresAt: now + SEVEN_DAYS_MS
    };
  });

  // Sync initial session to cloud on mount and subscribe to real-time student scans
  useEffect(() => {
    syncGruppenLiveSession(session);
  }, []);

  useEffect(() => {
    if (!session.pinCode) return;
    const unsub = subscribeToGruppenSession(session.pinCode, (remote) => {
      if (remote) {
        setSession((prev) => {
          if (remote.updatedAt >= prev.updatedAt || remote.assignedCount !== prev.assignedCount) {
            return remote;
          }
          return prev;
        });
      }
    });
    return () => unsub();
  }, [session.pinCode]);

  // Listen to browser fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Probierraum Class Simulation Interval (matches sal1ke's `probe.js` 800ms simulation)
  useEffect(() => {
    if (!isSimulatingClass) return;
    const timer = setInterval(async () => {
      if (!session.isOpen || session.assignedCount >= session.maxSeats) {
        setIsSimulatingClass(false);
        return;
      }
      const fakeToken = `sim_student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await claimGruppenSlotInCloud(session.pinCode, fakeToken);
      if (res.session) {
        setSession(res.session);
      }
      if (res.status === 'full' || res.status === 'closed') {
        setIsSimulatingClass(false);
      }
    }, 850);
    return () => clearInterval(timer);
  }, [isSimulatingClass, session.isOpen, session.assignedCount, session.maxSeats, session.pinCode]);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://appportal.heimbuergeschule.de/';
  const shortDisplayHost =
    typeof window !== 'undefined'
      ? `${window.location.host}${window.location.pathname === '/' ? '' : window.location.pathname}`
      : 'appportal.heimbuergeschule.de';
  const studentJoinUrl = `${baseUrl}?gruppen=${session.pinCode}`;

  const handleCopy = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // fallback
    }
  };

  // Toggle "Runde schließen" / "Runde öffnen" (matching sal1ke `a=status`)
  const handleToggleRoundStatus = async () => {
    const updated: QrGroupSession = {
      ...session,
      isOpen: !session.isOpen,
      updatedAt: Date.now()
    };
    setSession(updated);
    await syncGruppenLiveSession(updated);
  };

  // "+ 10 Plätze mehr" (matching sal1ke `a=mehr`, capped at 200)
  const handleAddMoreSeats = async () => {
    const updated: QrGroupSession = {
      ...session,
      maxSeats: Math.min(200, (session.maxSeats || 29) + 10),
      updatedAt: Date.now()
    };
    setSession(updated);
    await syncGruppenLiveSession(updated);
  };

  // Toggle Fullscreen on Stage (`#buehne`)
  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (stageRef.current?.requestFullscreen) {
      stageRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Update draft group names array when groupCount changes
  const handleChangeDraftGroupCount = (newCount: number) => {
    const clamped = Math.max(2, Math.min(12, newCount));
    setDraftGroupCount(clamped);
    setDraftGroupNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) {
        next.push(`Gruppe ${next.length + 1}`);
      }
      return next.slice(0, clamped);
    });
  };

  // Import student list from Digital Blackboard (`hbs_board_picker_names`) and pre-generate fair teams
  const handleImportFromTafelGroupMaker = () => {
    const rawNames =
      localStorage.getItem('hbs_board_picker_names') ||
      'Anna, Ben, Clara, David, Elias, Felix, Greta, Hanna, Jonas, Lara, Max, Noah, Paul, Sophie, Tim, Mia';
    const list = rawNames
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (list.length === 0) return;

    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const numGroups = draftGroupCount;
    const buckets: string[][] = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((student, idx) => {
      buckets[idx % numGroups].push(student);
    });

    const teams: PreassignedGroupTeam[] = buckets.map((members, idx) => ({
      groupIndex: idx,
      groupName: draftGroupNames[idx] || `Gruppe ${idx + 1}`,
      members
    }));

    setDraftPreassignedGroups(teams);
    setDraftMaxSeats(Math.max(list.length + 2, draftMaxSeats));
  };

  // Start a fresh round with current draft configuration
  const handleStartNewRound = useCallback(
    async (keepCurrentCode = false) => {
      setIsSimulatingClass(false);
      const newCode = keepCurrentCode ? session.pinCode : generateRoundCode();
      const count = Math.max(2, Math.min(12, draftGroupCount));
      const names = draftGroupNames
        .slice(0, count)
        .map((n, i) => n.trim() || `Gruppe ${i + 1}`);
      const now = Date.now();

      // Clear local device memory for demo/re-testing if same code
      try {
        localStorage.removeItem(`tools-g-${newCode}`);
      } catch {
        // ignore
      }

      const nextSession: QrGroupSession = {
        id: `grp-${now}`,
        code: newCode,
        pinCode: newCode,
        title: draftTitle.trim() || 'Sucht euch einen Platz und baut eure Station auf',
        groupCount: count,
        groupNames: names,
        groupColors: SAL1KE_GROUP_COLORS.slice(0, count),
        maxSeats: Math.max(count, Math.min(200, draftMaxSeats || 29)),
        assignedCount: 0,
        groupCounts: Array(count).fill(0),
        remainingBag: createShuffledGroupBag(count),
        deviceAssignments: {},
        ...(draftPreassignedGroups.length === count
          ? { preassignedGroups: draftPreassignedGroups }
          : {}),
        isOpen: true,
        authorId: currentUser?.id || 'teacher',
        authorName: currentUser ? formatTeacherName(currentUser) : 'Lehrkraft',
        createdAt: now,
        updatedAt: now,
        expiresAt: now + SEVEN_DAYS_MS
      };

      setSession(nextSession);
      setIsConfigOpen(false);
      await syncGruppenLiveSession(nextSession);
    },
    [
      draftGroupCount,
      draftGroupNames,
      draftMaxSeats,
      draftPreassignedGroups,
      draftTitle,
      currentUser,
      session.pinCode
    ]
  );

  // Open config modal pre-populated with current session settings
  const openConfigModal = () => {
    setDraftTitle(session.title);
    setDraftGroupCount(session.groupCount);
    setDraftMaxSeats(session.maxSeats);
    setDraftGroupNames([...session.groupNames]);
    setDraftPreassignedGroups(session.preassignedGroups ? [...session.preassignedGroups] : []);
    setIsConfigOpen(true);
  };

  const isAllSeatsTaken = session.assignedCount >= session.maxSeats;

  return (
    <div className="min-h-screen w-full bg-hbs-bg flex flex-col">
      {/* ===================================================================== */}
      {/* 1. HBS HEADER (Design System Compliant)                               */}
      {/* ===================================================================== */}
      <header className="bg-white/95 border-b border-hbs-slate-border/70 sticky top-0 z-40 backdrop-blur-md w-full print:hidden">
        <div className="w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Left: HBS Seal & App Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-hbs-blue-soft p-1 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0 bg-white">
              <img
                src="/Siegel_bunt.png"
                alt="Heimbürgeschule Kahla Siegel"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-hbs-blue truncate">
                  Heimbürgeschule Kahla
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal bg-hbs-teal-light px-2 py-0.5 rounded-full border border-hbs-teal/20">
                  <Sparkles className="w-3 h-3" /> QR-Gruppenlos
                </span>
              </div>
              <h1 className="text-sm sm:text-lg font-black text-hbs-slate-dark tracking-tight truncate">
                Gruppen per QR-Code ({session.pinCode})
              </h1>
            </div>
          </div>

          {/* Right: Quick Teacher Actions & Back to Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openConfigModal}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-hbs-slate hover:text-hbs-blue bg-white hover:bg-hbs-blue-soft rounded-xl transition-all border border-hbs-slate-border hover:border-hbs-blue/30 shadow-2xs active:scale-95 cursor-pointer"
              title="Gruppenanzahl, Namen, Plätze & Auftrag anpassen"
            >
              <Settings className="w-4 h-4 text-hbs-blue" />
              <span className="hidden sm:inline">Runde anpassen</span>
            </button>

            <button
              onClick={() => setIsPrintSheetOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-hbs-slate hover:text-hbs-teal bg-white hover:bg-hbs-teal-light rounded-xl transition-all border border-hbs-slate-border hover:border-hbs-teal/30 shadow-2xs active:scale-95 cursor-pointer"
              title="Farbige Tischkarten für alle Gruppen drucken"
            >
              <Printer className="w-4 h-4 text-hbs-teal" />
              <span className="hidden md:inline">Tischkarten</span>
            </button>

            <button
              onClick={onBackToPortal}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-hbs-slate hover:text-hbs-blue hover:bg-hbs-blue-light/50 rounded-xl transition-all border border-transparent hover:border-hbs-blue/20 active:scale-95 cursor-pointer"
              title="Zurück zum App-Portal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Zum Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. TEACHER TOOLBAR (Replica of sal1ke `nav.werkzeug-t` + HBS Extras)  */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 print:hidden">
        <nav
          aria-label="Werkzeuge für diese Gruppenrunde"
          className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 sm:p-4 rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card"
        >
          {/* Left: Round Status Badge & Reset / New Round */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                session.isOpen
                  ? 'bg-hbs-teal-light text-hbs-teal border-hbs-teal/25'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  session.isOpen ? 'bg-hbs-teal animate-pulse' : 'bg-amber-500'
                }`}
              />
              {session.isOpen ? 'Runde offen für Scans' : 'Runde geschlossen'}
            </span>

            <button
              type="button"
              onClick={() => handleStartNewRound(false)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-hbs-blue-soft hover:bg-hbs-blue-light text-hbs-blue font-bold text-xs sm:text-sm border border-hbs-blue/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Startet sofort eine neue Runde mit frischem Code"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Neue Runde</span>
            </button>

            {/* Probierraum Simulation Toggle (sal1ke `probe.js` Feature!) */}
            <button
              type="button"
              onClick={() => setIsSimulatingClass((prev) => !prev)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isSimulatingClass
                  ? 'bg-hbs-amber text-white border-hbs-amber shadow-xs'
                  : 'bg-white hover:bg-hbs-amber-light text-hbs-slate border-hbs-slate-border'
              }`}
              title="Simuliert eine Schulklasse, die nacheinander den QR-Code scannt (wie im sal1ke Probierraum)"
            >
              {isSimulatingClass ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Simulation stoppen</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-hbs-amber" />
                  <span>Klasse simulieren</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Core sal1ke buttons ("Runde schließen", "10 Plätze mehr", "Vollbild") + Teacher Spickzettel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleRoundStatus}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                session.isOpen
                  ? 'bg-white hover:bg-amber-50 text-hbs-slate hover:text-amber-900 border-hbs-slate-border hover:border-amber-300'
                  : 'bg-hbs-teal hover:bg-hbs-teal-deep text-white border-hbs-teal shadow-xs'
              }`}
            >
              {session.isOpen ? (
                <>
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Runde schließen</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Runde öffnen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAddMoreSeats}
              disabled={session.maxSeats >= 200}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft text-hbs-slate hover:text-hbs-blue font-bold text-xs sm:text-sm border border-hbs-slate-border hover:border-hbs-blue/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-hbs-blue" />
              <span>10 Plätze mehr</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTeacherCheatSheet((prev) => !prev)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                showTeacherCheatSheet
                  ? 'bg-hbs-slate-dark text-white border-hbs-slate-dark'
                  : 'bg-white hover:bg-slate-100 text-hbs-slate border-hbs-slate-border'
              }`}
              title="Lehrkraft-Spickzettel: Zeigt die genaue Verteilung pro Gruppe (am Beamer standardmäßig ausgeblendet)"
            >
              {showTeacherCheatSheet ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Spickzettel ausblenden</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-hbs-slate-muted" />
                  <span className="hidden sm:inline">Spickzettel</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Vollbild beenden</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Vollbild</span>
                </>
              )}
            </button>
          </div>
        </nav>

        {/* ===================================================================== */}
        {/* 3. PROJECTOR STAGE (`section.buehne-t#buehne` Replica)                */}
        {/* ===================================================================== */}
        <section
          ref={stageRef}
          id="buehne"
          className={`bg-white rounded-3xl border border-hbs-slate-border/90 shadow-hbs-card p-6 sm:p-10 lg:p-14 transition-all ${
            isFullscreen
              ? 'min-h-screen flex flex-col justify-center items-center overflow-y-auto rounded-none border-0'
              : ''
          }`}
        >
          {/* Fullscreen Exit Floating Button when in Stage Fullscreen */}
          {isFullscreen && (
            <div className="w-full max-w-5xl flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/Siegel_bunt.png" alt="HBS" className="w-8 h-8 object-contain" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue">
                  Heimbürgeschule Kahla · QR-Gruppenlos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleRoundStatus}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold cursor-pointer"
                >
                  {session.isOpen ? 'Runde schließen' : 'Runde öffnen'}
                </button>
                <button
                  onClick={handleAddMoreSeats}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold cursor-pointer"
                >
                  10 Plätze mehr
                </button>
                <button
                  onClick={handleToggleFullscreen}
                  className="min-h-[44px] px-4 py-1.5 rounded-xl bg-hbs-slate-dark text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Vollbild beenden</span>
                </button>
              </div>
            </div>
          )}

          {/* Task Prompt Heading (`h1` on stage) */}
          <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue bg-hbs-blue-light px-3 py-1 rounded-full border border-hbs-blue/20 mb-3">
              <Dices className="w-3.5 h-3.5" /> Arbeitsauftrag & Gruppenzuteilung
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-hbs-slate-dark tracking-tight leading-tight">
              {session.title}
            </h2>
          </div>

          {/* Join Area: QR Code left + URL & Huge Code right (`.beitritt-t` replica) */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 items-center bg-hbs-bg/80 p-6 sm:p-8 lg:p-10 rounded-3xl border border-hbs-slate-border/80">
            {/* QR Code Box (clickable for fullscreen zoom just like `seite.js`) */}
            <div className="md:col-span-6 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsQrFullscreenOpen(true)}
                className="group relative bg-white p-5 sm:p-6 rounded-3xl border-2 border-hbs-slate-border hover:border-hbs-blue shadow-hbs-card hover:shadow-hbs-hover transition-all duration-200 cursor-pointer active:scale-98"
                title="Klicken, um den QR-Code bildschirmfüllend für die letzte Reihe zu vergrößern"
                aria-label="QR-Code zum Klassenlink groß anzeigen"
              >
                <QRCodeSVG
                  value={studentJoinUrl}
                  size={250}
                  level="M"
                  includeMargin={false}
                  className="w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72"
                />
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-hbs-blue group-hover:underline">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Anklicken zum Vergrößern</span>
                </span>
              </button>
            </div>

            {/* Join Instructions & Giant Round Code (`.weg-t` replica) */}
            <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <p className="text-sm sm:text-base font-bold text-hbs-slate-muted">
                1. QR-Code mit Tablet / Smartphone scannen <span className="font-normal">oder</span>
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-hbs-slate-border text-hbs-slate-dark font-extrabold text-sm sm:text-base shadow-2xs">
                <QrCode className="w-4 h-4 text-hbs-blue shrink-0" />
                <span className="truncate">{shortDisplayHost}?gruppen=…</span>
              </div>

              <p className="text-sm sm:text-base font-bold text-hbs-slate-muted pt-1">
                2. Öffnen und diesen Runden-Code eingeben:
              </p>

              {/* Huge Code Display (`.grosscode`) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-5 py-2.5 rounded-2xl bg-white border-2 border-hbs-blue/30 text-3xl sm:text-5xl font-black tracking-widest text-hbs-slate-dark shadow-xs select-all font-mono">
                  {session.pinCode}
                </span>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(studentJoinUrl, 'link')}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft text-hbs-slate hover:text-hbs-blue text-xs font-bold border border-hbs-slate-border flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedType === 'link' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-hbs-teal" />
                        <span className="text-hbs-teal">Link kopiert ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Link kopieren</span>
                      </>
                    )}
                  </button>

                  {onOpenTableTentWithCode && (
                    <button
                      type="button"
                      onClick={() => onOpenTableTentWithCode(session.pinCode)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-hbs-teal-light text-hbs-slate hover:text-hbs-teal text-xs font-bold border border-hbs-slate-border flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-hbs-teal" />
                      <span>QR-Aufsteller</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-hbs-slate-muted pt-1 max-w-sm">
                Tipp: Scanne den QR-Code oder öffne den Link im zweiten Tab, um die farbige Schüleransicht live zu testen.
              </p>
            </div>
          </div>

          {/* Colored Group Pills (`ul.los-gruppen` replica with exact sal1ke palette) */}
          <div className="mt-8 sm:mt-10 max-w-4xl mx-auto">
            <ul
              aria-label="Die Gruppen und ihre Farben"
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              {session.groupNames.slice(0, session.groupCount).map((name, idx) => {
                const color =
                  session.groupColors?.[idx] ||
                  SAL1KE_GROUP_COLORS[idx % SAL1KE_GROUP_COLORS.length];
                const countInGroup = session.groupCounts?.[idx] || 0;
                return (
                  <li
                    key={idx}
                    style={{ backgroundColor: color }}
                    className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-white font-black text-base sm:text-lg shadow-md flex items-center gap-2.5 tracking-tight transition-transform hover:scale-105"
                  >
                    <span>{name}</span>
                    {showTeacherCheatSheet && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-black/25 text-white text-xs font-extrabold border border-white/25"
                        title="Anzahl zugeteilter Geräte in dieser Gruppe (nur bei aktivem Spickzettel sichtbar)"
                      >
                        {countInGroup}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Live Counter Bar (`p.stand-t` replica: ONLY total devices shown by default!) */}
          <div className="mt-8 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-hbs-blue-soft border border-hbs-blue/20 text-hbs-slate-dark text-lg sm:text-2xl font-bold">
              <span>
                <strong className="font-black text-hbs-blue text-2xl sm:text-3xl tabular-nums">
                  {session.assignedCount}
                </strong>{' '}
                <span>{session.assignedCount === 1 ? 'Gerät' : 'Geräte'}</span> in{' '}
                <strong className="font-black">{session.groupCount}</strong> Gruppen
              </span>
              <span className="text-hbs-slate-muted">·</span>
              <span
                className={`font-extrabold ${
                  isAllSeatsTaken ? 'text-rose-600' : 'text-hbs-teal'
                }`}
              >
                {isAllSeatsTaken
                  ? `alle ${session.maxSeats} Plätze vergeben`
                  : `${session.maxSeats} Plätze`}
              </span>
            </div>
          </div>

          {/* Optional Teacher Cheat Sheet Panel (when toggled on) */}
          {showTeacherCheatSheet && (
            <div className="mt-6 max-w-4xl mx-auto p-5 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-hbs-amber" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-hbs-amber">
                    Lehrkraft-Spickzettel (Einzelverteilung & Namensliste)
                  </h3>
                </div>
                <button
                  onClick={() => setShowTeacherCheatSheet(false)}
                  className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Ausblenden
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {session.groupNames.slice(0, session.groupCount).map((gName, idx) => {
                  const color =
                    session.groupColors?.[idx] ||
                    SAL1KE_GROUP_COLORS[idx % SAL1KE_GROUP_COLORS.length];
                  const count = session.groupCounts?.[idx] || 0;
                  const preTeam = session.preassignedGroups?.find((t) => t.groupIndex === idx);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span
                            style={{ backgroundColor: color }}
                            className="w-3 h-3 rounded-full shrink-0"
                          />
                          <span className="text-xs font-black truncate flex-1">{gName}</span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-700 text-white tabular-nums">
                            {count}
                          </span>
                        </div>
                        {preTeam && preTeam.members.length > 0 && (
                          <ul className="mt-2 text-[11px] text-slate-300 space-y-0.5 border-t border-slate-700/80 pt-1.5">
                            {preTeam.members.map((m, mIdx) => (
                              <li key={mIdx} className="truncate">
                                • {m}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 4. PEDAGOGICAL & PRIVACY EXPLANATION (`p.hinweis` Replica)            */}
        {/* ===================================================================== */}
        <div className="bg-white/90 rounded-2xl border border-hbs-slate-border/70 p-5 sm:p-6 text-xs sm:text-sm text-hbs-slate leading-relaxed shadow-2xs flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-hbs-teal-light text-hbs-teal flex items-center justify-center shrink-0 border border-hbs-teal/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-black text-hbs-slate-dark text-sm">
              Wie funktioniert die faire Zufallszuteilung?
            </h3>
            <p className="text-hbs-slate-muted">
              Vergeben wird reihum in zufälliger Reihenfolge: Die Gruppen sind immer gleich groß
              (höchstens eine Person Unterschied), und wer nacheinander scannt, kommt garantiert in
              verschiedene Gruppen. Jedes Gerät merkt sich seine Gruppe für diese Runde – noch
              einmal scannen zeigt dieselbe Gruppe und verbraucht keinen weiteren Platz. Die Bühne
              zeigt standardmäßig nur, wie viele Geräte schon eine Gruppe haben, nicht wie viele in
              jeder Gruppe sind – sonst ließe sich am Smartboard ablesen, welche Gruppe als Nächstes
              kommt. Es werden nur anonyme Zahlen gespeichert, keine Schülernamen; sind alle Plätze
              vergeben, kann niemand die Runde mit Abrufen fluten, bis du mit „10 Plätze mehr“
              nachlegst.
            </p>
          </div>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 5. FULLSCREEN QR-CODE OVERLAY (Replica of `seite.js` `gross()`)       */}
      {/* ===================================================================== */}
      {isQrFullscreenOpen && (
        <div
          role="dialog"
          aria-label="QR-Code groß. Klicken oder Esc schließt."
          onClick={() => setIsQrFullscreenOpen(false)}
          className="fixed inset-0 z-50 bg-hbs-slate-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 text-white cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-hbs-slate-dark rounded-3xl p-6 sm:p-10 shadow-2xl max-w-xl w-full flex flex-col items-center text-center space-y-5 cursor-default"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue">
                QR-Code für die letzte Reihe
              </span>
              <button
                onClick={() => setIsQrFullscreenOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-hbs-slate-border">
              <QRCodeSVG
                value={studentJoinUrl}
                size={360}
                level="M"
                className="w-64 h-64 sm:w-88 sm:h-88"
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-hbs-slate-muted">
                Direktlink oder Runden-Code:
              </p>
              <p className="text-3xl sm:text-4xl font-black tracking-widest text-hbs-blue font-mono">
                {session.pinCode}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => handleCopy(studentJoinUrl, 'link')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedType === 'link' ? 'Kopiert ✓' : 'Link kopieren'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(session.pinCode, 'code')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedType === 'code' ? 'Kopiert ✓' : 'Code kopieren'}</span>
              </button>
            </div>

            <small className="text-xs text-hbs-slate-muted">
              Kamera auf den Code halten · Klicken außerhalb oder Esc schließt
            </small>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. CONFIGURATION MODAL (Custom Groups, Names, Seats & Tafel-Import)   */}
      {/* ===================================================================== */}
      {isConfigOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-hbs-slate-dark/60 backdrop-blur-sm animate-in fade-in duration-150 print:hidden"
          onClick={() => setIsConfigOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-hbs-modal max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-hbs-slate-border"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-hbs-blue-light text-hbs-blue flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-hbs-slate-dark">
                    Gruppenrunde konfigurieren
                  </h2>
                  <p className="text-xs text-hbs-slate-muted">
                    Anzahl der Gruppen (2–12), Plätze, Arbeitsauftrag & eigene Stationsnamen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-hbs-blue mb-2">
                  Schnell-Vorlagen für den Unterricht
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_GRUPPEN_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDraftTitle(preset.title);
                        setDraftGroupCount(preset.groupCount);
                        setDraftMaxSeats(preset.maxSeats);
                        setDraftGroupNames([...preset.groupNames]);
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-hbs-bg hover:bg-hbs-blue-soft text-hbs-slate hover:text-hbs-blue text-xs font-bold border border-hbs-slate-border transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arbeitsauftrag (Stage Heading) */}
              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1.5">
                  Arbeitsauftrag auf der Bühne & auf den Schülergeräten
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={140}
                  placeholder="z. B. Sucht euch einen Platz und baut eure Station auf"
                  className="w-full h-11 px-3.5 rounded-xl border border-hbs-slate-border focus:border-hbs-blue text-sm font-bold text-hbs-slate-dark focus:outline-none"
                />
              </div>

              {/* Group Count (2..12) & Max Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-hbs-bg border border-hbs-slate-border/80">
                  <label className="block text-xs font-bold text-hbs-slate-dark mb-2">
                    Anzahl der Gruppen (2 bis 12)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChangeDraftGroupCount(draftGroupCount - 1)}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-hbs-slate-border font-black text-lg text-hbs-slate-dark hover:bg-hbs-blue-soft cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-2xl font-black text-hbs-blue tabular-nums">
                      {draftGroupCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleChangeDraftGroupCount(draftGroupCount + 1)}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-hbs-slate-border font-black text-lg text-hbs-slate-dark hover:bg-hbs-blue-soft cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-hbs-bg border border-hbs-slate-border/80">
                  <label className="block text-xs font-bold text-hbs-slate-dark mb-2">
                    Plätze insgesamt (Schutz gegen Fluten)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDraftMaxSeats(Math.max(draftGroupCount, draftMaxSeats - 5))}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-hbs-slate-border font-black text-sm text-hbs-slate-dark hover:bg-hbs-blue-soft cursor-pointer"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={draftMaxSeats}
                      onChange={(e) => setDraftMaxSeats(Number(e.target.value) || 29)}
                      className="w-20 h-11 text-center rounded-xl bg-white border border-hbs-slate-border font-black text-lg text-hbs-slate-dark"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftMaxSeats(Math.min(200, draftMaxSeats + 5))}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-hbs-slate-border font-black text-sm text-hbs-slate-dark hover:bg-hbs-blue-soft cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual Group Names & Colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-hbs-slate-dark">
                    Gruppennamen & Erkennungsfarben
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftGroupNames(
                        Array.from({ length: draftGroupCount }, (_, i) => `Gruppe ${i + 1}`)
                      )
                    }
                    className="text-xs font-bold text-hbs-blue hover:underline cursor-pointer"
                  >
                    Auf „Gruppe 1..{draftGroupCount}“ zurücksetzen
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Array.from({ length: draftGroupCount }).map((_, idx) => {
                    const color = SAL1KE_GROUP_COLORS[idx % SAL1KE_GROUP_COLORS.length];
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: color }}
                          className="w-8 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-xs shadow-2xs"
                        >
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={draftGroupNames[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftGroupNames((prev) => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Gruppe ${idx + 1}`}
                          maxLength={40}
                          className="flex-1 h-10 px-3 rounded-xl border border-hbs-slate-border focus:border-hbs-blue text-xs sm:text-sm font-bold text-hbs-slate-dark focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bridge to Digital Blackboard (Tafel-Gruppengenerator Import) */}
              <div className="p-4 rounded-2xl bg-hbs-teal-light/60 border border-hbs-teal/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-hbs-slate-dark flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-hbs-teal" />
                      <span>Klassenliste aus Digitaler Tafel übernehmen (Optional)</span>
                    </h4>
                    <p className="text-[11px] text-hbs-slate-muted mt-0.5">
                      Mischt die gespeicherte Schülerliste aus dem Tafel-Gruppengenerator vorab in{' '}
                      {draftGroupCount} Teams und zeigt die Teammitglieder im Spickzettel & auf dem
                      Schülergerät.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleImportFromTafelGroupMaker}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-hbs-teal hover:bg-hbs-teal-deep text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Teams aus Tafel mischen</span>
                  </button>
                </div>

                {draftPreassignedGroups.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-hbs-teal/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-hbs-teal">
                        ✓ {draftPreassignedGroups.reduce((acc, t) => acc + t.members.length, 0)}{' '}
                        Schüler auf {draftPreassignedGroups.length} Teams verteilt:
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftPreassignedGroups([])}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Ohne Namensliste starten
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {draftPreassignedGroups.map((t, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-white border border-hbs-teal/20 text-[11px]"
                        >
                          <strong className="font-black text-hbs-slate-dark block">
                            {draftGroupNames[i] || t.groupName}
                          </strong>
                          <span className="text-hbs-slate-muted">
                            {t.members.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-hbs-slate text-xs sm:text-sm font-bold border border-hbs-slate-border cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleStartNewRound(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-teal hover:bg-hbs-teal-deep text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                Übernehmen (Code {session.pinCode} behalten)
              </button>
              <button
                type="button"
                onClick={() => handleStartNewRound(false)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
              >
                Neue Runde mit neuem Code starten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. PRINTABLE GROUP TABLE CARDS MODAL (A4 Gruppentisch-Aufsteller)     */}
      {/* ===================================================================== */}
      {isPrintSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-hbs-slate-dark/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsPrintSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-hbs-modal max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-hbs-slate-border"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between print:hidden">
              <div>
                <h2 className="text-base sm:text-lg font-black text-hbs-slate-dark">
                  Gruppen-Tischkarten drucken ({session.groupCount} Gruppen)
                </h2>
                <p className="text-xs text-hbs-slate-muted">
                  Farbige Erkennungsschilder für die Gruppentische oder Lernstationen im
                  Klassenzimmer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Jetzt drucken (A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:p-0 print:bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-6">
                {session.groupNames.slice(0, session.groupCount).map((gName, idx) => {
                  const color =
                    session.groupColors?.[idx] ||
                    SAL1KE_GROUP_COLORS[idx % SAL1KE_GROUP_COLORS.length];
                  const preTeam = session.preassignedGroups?.find((t) => t.groupIndex === idx);
                  return (
                    <div
                      key={idx}
                      style={{ borderColor: color }}
                      className="bg-white rounded-3xl border-4 p-6 flex flex-col justify-between min-h-[210px] shadow-sm break-inside-avoid"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src="/Siegel_bunt.png"
                            alt="HBS"
                            className="w-7 h-7 object-contain"
                          />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-hbs-slate-muted">
                            Heimbürgeschule Kahla · Runde {session.pinCode}
                          </span>
                        </div>
                        <span
                          style={{ backgroundColor: color }}
                          className="px-3 py-1 rounded-full text-white text-xs font-black"
                        >
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="my-4 text-center">
                        <div
                          style={{ backgroundColor: color }}
                          className="inline-block px-6 py-3 rounded-2xl text-white font-black text-2xl sm:text-3xl shadow-xs"
                        >
                          {gName}
                        </div>
                        {preTeam && preTeam.members.length > 0 && (
                          <p className="mt-3 text-xs font-bold text-hbs-slate">
                            {preTeam.members.join(' · ')}
                          </p>
                        )}
                      </div>

                      <p className="text-[11px] font-bold text-hbs-slate-muted text-center truncate">
                        {session.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
