import React, { Suspense, lazy, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpToLine,
  Check,
  Columns3,
  Eye,
  Heart,
  Info,
  Loader2,
  Lock,
  LockOpen,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  EvaluationItem,
  FACHRAUM_SUBJECTS,
  PlanRoleType,
  SeatPlan,
  SitzplanClass,
  SwapSuggestion,
} from '../../types/sitzplanTypes';
import {
  computePlanReport,
  createEvalContext,
  explainStudentPlacement,
  findSwapSuggestions,
  nextSeed,
  nextVariantName,
  solveSeatingPlan,
  swapSeats,
} from './sitzplanEngine';
import { SeatPlanCanvas } from './SeatPlanCanvas';
import { TouchWorkspace, useIsMobileViewport } from './RoomSvgElements';
import { PrintSitzplanModal } from './PrintSitzplanModal';
import { View3DMode } from './Classroom3DView';

const Classroom3DView = lazy(() =>
  import('./Classroom3DView').then((m) => ({ default: m.Classroom3DView }))
);

interface SeatingPlanViewProps {
  cls: SitzplanClass;
  expert: boolean;
  authorName: string;
  onUpsertPlan: (p: SeatPlan) => void;
  onRemovePlan: (id: string) => void;
  onSetActivePlan: (id: string) => void;
  onRestorePlans: (plans: SeatPlan[], activePlanId: string | null) => void;
  onPublishPlan: (opts: {
    plan: SeatPlan;
    classLabel: string;
    roleType: PlanRoleType;
    subject: string;
    roomLabel?: string;
    notes?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUnpublishPlan: () => Promise<void>;
  onGoToRoom: () => void;
  onGoToStudents: () => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warn', undo?: () => void) => void;
}

const ScoreBar: React.FC<{ ok: number; total: number }> = ({ ok, total }) => (
  <div className="flex gap-1">
    {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
      <span
        key={i}
        className={`h-2 flex-1 rounded-full ${
          total === 0 ? 'bg-slate-200' : i < ok ? 'bg-hbs-teal' : 'bg-rose-500'
        }`}
      />
    ))}
  </div>
);

const EvalItemRow: React.FC<{ item: EvaluationItem }> = ({ item }) => {
  const dotColor =
    item.severity === 'hard'
      ? 'bg-rose-600'
      : item.severity === 'warn'
        ? 'bg-hbs-amber'
        : item.severity === 'good'
          ? 'bg-hbs-teal'
          : 'bg-slate-300';
  return (
    <li className="flex gap-2 text-xs sm:text-sm text-hbs-slate">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dotColor}`} />
      <span>{item.message}</span>
    </li>
  );
};

export const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({
  cls,
  expert,
  authorName,
  onUpsertPlan,
  onRemovePlan,
  onSetActivePlan,
  onRestorePlans,
  onPublishPlan,
  onUnpublishPlan,
  onGoToRoom,
  onGoToStudents,
  onNotify,
}) => {
  const isMobile = useIsMobileViewport();
  const activePlan =
    cls.plans.find((p) => p.id === cls.activePlanId) ?? cls.plans[0];

  const ctx = useMemo(() => createEvalContext(cls), [cls]);
  const report = useMemo(
    () => (activePlan ? computePlanReport(ctx, activePlan.assignment, cls.relations) : null),
    [ctx, activePlan, cls.relations]
  );

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SwapSuggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [teacherPerspective, setTeacherPerspective] = useState(false);
  const [view3D, setView3D] = useState<View3DMode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'bewertung' | 'kind' | 'vorschlaege'>('bewertung');
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Share Modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareClassLabel, setShareClassLabel] = useState(cls.classLabel || cls.name);
  const [shareRoleType, setShareRoleType] = useState<PlanRoleType>(cls.roleType || 'klassenleitung');
  const [shareSubject, setShareSubject] = useState(cls.subject || 'Klassenraum');
  const [shareRoomLabel, setShareRoomLabel] = useState(cls.roomLabel || '');
  const [shareNotes, setShareNotes] = useState('');
  const [shareBusy, setShareBusy] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const runAsync = (fn: () => void) => {
    setBusy(true);
    setTimeout(() => {
      try {
        fn();
      } finally {
        setBusy(false);
      }
    }, 30);
  };

  const getLockedAssignment = (plan: SeatPlan) =>
    Object.fromEntries(
      plan.locked.filter((s) => plan.assignment[s]).map((s) => [s, plan.assignment[s]])
    );

  const generatePlan = (createNewVariant: boolean) => {
    runAsync(() => {
      const seed =
        activePlan && !createNewVariant
          ? nextSeed(activePlan.seed)
          : createNewVariant && activePlan
            ? nextSeed(activePlan.seed + cls.plans.length)
            : 1;
      const fixed = activePlan ? getLockedAssignment(activePlan) : {};
      const previousAssignment =
        createNewVariant && activePlan ? activePlan.assignment : undefined;
      const solved = solveSeatingPlan({
        cls,
        seed,
        fixed,
        previousAssignment,
      });

      const nextPlan: SeatPlan =
        createNewVariant || !activePlan
          ? {
              id: `p${Date.now().toString(36)}`,
              name: nextVariantName(cls.plans),
              seed,
              assignment: solved.assignment,
              locked: activePlan ? Object.keys(fixed) : [],
              createdAt: Date.now(),
            }
          : {
              ...activePlan,
              seed,
              assignment: solved.assignment,
              basePlanId: undefined,
            };

      const prevPlan = activePlan;
      onUpsertPlan(nextPlan);
      setSuggestions(null);
      setSelectedSeat(null);
      if (prevPlan && !createNewVariant) {
        onNotify('Neuer Vorschlag erstellt', 'info', () => onUpsertPlan(prevPlan));
      }
      if (solved.unplaced.length > 0) {
        onNotify(
          `${solved.unplaced.length} Kinder haben keinen Platz – bitte Tische ergänzen.`,
          'warn'
        );
      }
    });
  };

  const saveAssignment = (nextAssignment: Record<string, string>, nextLocked?: string[]) => {
    if (!activePlan) return;
    onUpsertPlan({
      ...activePlan,
      assignment: nextAssignment,
      locked: nextLocked ?? activePlan.locked,
    });
    setSuggestions(null);
  };

  const handleSwap = (seatA: string, seatB: string) => {
    if (!activePlan) return;
    if (activePlan.locked.includes(seatA) || activePlan.locked.includes(seatB)) {
      onNotify('Fixierte Plätze zuerst lösen.', 'warn');
      return;
    }
    const copy = { ...activePlan.assignment };
    swapSeats(copy, seatA, seatB);
    saveAssignment(copy);
    setSelectedSeat(null);
  };

  const handleSeatTap = (seatId: string) => {
    if (!activePlan) return;
    if (
      selectedStudent &&
      !Object.values(activePlan.assignment).includes(selectedStudent)
    ) {
      if (activePlan.locked.includes(seatId)) {
        onNotify('Fixierte Plätze zuerst lösen.', 'warn');
        return;
      }
      saveAssignment({ ...activePlan.assignment, [seatId]: selectedStudent });
      setSelectedStudent(null);
      return;
    }
    if (selectedSeat && selectedSeat !== seatId) {
      handleSwap(selectedSeat, seatId);
      return;
    }
    if (selectedSeat === seatId) {
      setSelectedSeat(null);
      setSelectedStudent(null);
      return;
    }
    setSelectedSeat(seatId);
    const studId = activePlan.assignment[seatId];
    setSelectedStudent(studId ?? null);
    if (studId) setSidebarTab('kind');
  };

  const handleLockToggle = (seatId = selectedSeat) => {
    if (!activePlan || !seatId) return;
    if (!activePlan.assignment[seatId] && !activePlan.locked.includes(seatId)) return;
    const nextLocked = activePlan.locked.includes(seatId)
      ? activePlan.locked.filter((s) => s !== seatId)
      : [...activePlan.locked, seatId];
    saveAssignment(activePlan.assignment, nextLocked);
  };

  const handleOptimizeCheck = () => {
    if (!activePlan) return;
    runAsync(() => {
      const found = findSwapSuggestions(ctx, activePlan.assignment, activePlan.locked);
      setSuggestions(found);
      setSidebarTab('vorschlaege');
      setSidebarOpen(true);
      if (!found.length) {
        onNotify(
          'Keine einfache Verbesserung gefunden – der Plan passt gut zu den Regeln.',
          'success'
        );
      }
    });
  };

  const neighborStudents = useMemo(() => {
    if (!activePlan || !selectedStudent) return undefined;
    const seatEntry = Object.entries(activePlan.assignment).find(
      ([, sId]) => sId === selectedStudent
    );
    const neighbors = [...(ctx.graph.neighbors.get(seatEntry?.[0] ?? '') ?? [])]
      .map((sId) => activePlan.assignment[sId])
      .filter((id): id is string => Boolean(id));
    return new Set(neighbors);
  }, [activePlan, selectedStudent, ctx]);

  const warnStudents = useMemo(
    () =>
      new Set(
        report?.problems.flatMap((p) => (p.students.length <= 2 ? p.students : [])) ?? []
      ),
    [report]
  );

  if (!cls.room.tables.length || !cls.students.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-hbs-bg p-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark">
          {cls.students.length ? 'Noch keine Sitzplätze' : 'Noch keine Kinder'}
        </h2>
        <p className="max-w-md text-sm text-hbs-slate-muted">
          {cls.students.length
            ? `${cls.students.length} Kinder warten auf Plätze – stelle zuerst Tische im Klassenraum auf.`
            : 'Lege zuerst die Kinder deiner Klasse an.'}
        </p>
        <button
          type="button"
          onClick={cls.students.length ? onGoToRoom : onGoToStudents}
          className="min-h-[48px] px-6 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-sm flex items-center gap-2 shadow-sm"
        >
          {cls.students.length ? (
            <>
              <Columns3 className="w-4 h-4" />
              <span>Zum Klassenraum</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              <span>Zu den Kindern</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-hbs-bg p-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-hbs-slate-dark tracking-tight">
          Bereit für den Sitzplan
        </h2>
        <p className="max-w-md text-sm sm:text-base text-hbs-slate-muted">
          {cls.students.length} Kinder, {ctx.graph.seats.length} Plätze, {cls.relations.length}{' '}
          Beziehungsregeln. Die Verteilung ist regelbasiert und reproduzierbar.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => generatePlan(true)}
          className="min-h-[52px] px-7 rounded-2xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-base flex items-center gap-2 shadow-hbs-card disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>Sitzplan erstellen</span>
        </button>
      </div>
    );
  }

  const showSidebar = sidebarOpen || Boolean(suggestions);
  const selectedStudentName = selectedStudent
    ? cls.students.find((s) => s.id === selectedStudent)?.name
    : null;
  const studentExplanation =
    selectedStudent && report
      ? explainStudentPlacement(ctx, activePlan.assignment, report.items, selectedStudent)
      : null;
  const isShared = cls.sharedPlanId === activePlan.id;

  return (
    <div className="relative flex h-full min-h-0 flex-row bg-hbs-bg">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-hbs-slate-border bg-white px-3 py-2">
          {/* Variant switcher */}
          <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-xl bg-hbs-bg border border-hbs-slate-border/70 p-1">
            {cls.plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSetActivePlan(p.id);
                  setSuggestions(null);
                  setSelectedSeat(null);
                }}
                className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-lg px-3 text-xs sm:text-sm font-bold transition-colors ${
                  p.id === activePlan.id
                    ? 'bg-white text-hbs-blue shadow-xs border border-hbs-slate-border/60'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              type="button"
              aria-label="Neue Variante"
              title="Neue Variante erstellen"
              onClick={() => generatePlan(true)}
              className="grid min-h-[38px] min-w-[38px] shrink-0 place-items-center rounded-lg text-hbs-slate-muted hover:bg-white hover:text-hbs-blue"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => generatePlan(false)}
              title="Fixierte Plätze bleiben erhalten"
              className="min-h-[44px] px-3 rounded-xl border border-hbs-slate-border bg-white hover:bg-hbs-blue-soft text-xs font-bold text-hbs-slate-dark flex items-center gap-1.5"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shuffle className="w-4 h-4 text-hbs-blue" />
              )}
              <span className="hidden md:inline">Neuer Vorschlag</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleOptimizeCheck}
              className="min-h-[44px] px-3 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <WandSparkles className="w-4 h-4" />
              <span className="hidden md:inline">Verbessern</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareClassLabel(cls.classLabel || cls.name);
                setShareRoleType(cls.roleType || 'klassenleitung');
                setShareSubject(cls.subject || 'Klassenraum');
                setShareRoomLabel(cls.roomLabel || '');
                setShareOpen(true);
              }}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                isShared
                  ? 'bg-hbs-teal-light border-hbs-teal/40 text-hbs-teal-deep'
                  : 'bg-white border-hbs-slate-border text-hbs-slate-dark hover:bg-hbs-teal-light hover:border-hbs-teal/30'
              }`}
              title="Sitzplan für Kollegium freigeben"
            >
              <Share2 className="w-4 h-4 text-hbs-teal" />
              <span className="hidden sm:inline">{isShared ? 'Freigegeben' : 'Freigeben'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="min-h-[44px] px-3 rounded-xl bg-hbs-amber-light border border-hbs-amber/30 text-hbs-amber-dark hover:bg-hbs-amber hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Sitzplan drucken (Lehrerblick: Tafel im Rücken)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Drucken</span>
            </button>

            <button
              type="button"
              aria-pressed={showSidebar}
              onClick={() => {
                if (showSidebar) {
                  setSidebarOpen(false);
                  setSuggestions(null);
                } else {
                  setSidebarOpen(true);
                }
              }}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                showSidebar
                  ? 'bg-hbs-blue-light border-hbs-blue/30 text-hbs-blue'
                  : 'bg-white border-hbs-slate-border text-hbs-slate hover:bg-slate-50'
              }`}
            >
              <PanelRight className="w-4 h-4" />
              <span className="hidden lg:inline">Bewertung</span>
              {report && report.problems.length > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {report.problems.length}
                </span>
              )}
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Weitere Aktionen"
                onClick={() => setActionsMenuOpen((v) => !v)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-slate-50"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {actionsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setActionsMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-hbs-slate-border bg-white p-1.5 shadow-hbs-modal space-y-1">
                    {cls.plans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setCompareOpen(true);
                        }}
                        className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                      >
                        <Columns3 className="w-4 h-4 text-hbs-blue" />
                        <span>Varianten vergleichen</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setPrintModalOpen(true);
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-hbs-amber" />
                      <span>Drucken / PDF speichern</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setRenameDraft(activePlan.name);
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4 text-hbs-slate-muted" />
                      <span>Variante umbenennen</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        const prevPlans = cls.plans;
                        const prevActive = cls.activePlanId;
                        const delName = activePlan.name;
                        onRemovePlan(activePlan.id);
                        onNotify(`${delName} gelöscht`, 'info', () =>
                          onRestorePlans(prevPlans, prevActive)
                        );
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Variante löschen</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Stage */}
        <div className="relative min-h-0 flex-1 p-2 sm:p-3">
          {/* Top-left legend & perspective quick toggle */}
          {!(view3D && expert) && (
            <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
              <div className="pointer-events-none flex items-center gap-1.5 rounded-full bg-white/90 border border-hbs-slate-border px-2.5 py-1 text-[11px] font-bold text-hbs-slate-muted shadow-xs">
                <span className="inline-grid size-4 place-items-center rounded-full bg-[#1B4D3E] text-[8px] text-white">
                  ▲
                </span>
                <span>nah an der Tafel</span>
              </div>

              <button
                type="button"
                onClick={() => setTeacherPerspective((v) => !v)}
                className={`min-h-[32px] rounded-full border px-3 py-1 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-colors ${
                  teacherPerspective
                    ? 'bg-hbs-blue text-white border-hbs-blue'
                    : 'bg-white/95 text-hbs-slate-dark border-hbs-slate-border hover:bg-hbs-blue-soft'
                }`}
                title="Ansicht um 180° drehen (Lehrerblick: Tafel im Rücken)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{teacherPerspective ? 'Lehrerblick (Tafel im Rücken)' : 'Tafel oben'}</span>
              </button>
            </div>
          )}

          {/* 2D / 3D / Lehrerblick / Platzblick Switcher (Erweitert) */}
          {expert && (
            <div className="absolute right-4 top-3 z-20 flex gap-1 rounded-full border border-hbs-slate-border bg-white/95 p-1 text-xs font-bold shadow-card">
              {(
                [
                  [null, '2D'],
                  ['orbit', '3D'],
                  ['teacher', 'Lehrerblick'],
                  ['seat', 'Platzblick'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setView3D(mode)}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    view3D === mode
                      ? 'bg-hbs-blue text-white'
                      : 'text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-slate-dark'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {view3D && expert ? (
            <div className="h-full w-full">
              <Suspense
                fallback={
                  <div className="grid h-full place-items-center text-sm font-bold text-hbs-slate-muted">
                    3D-Klassenraum wird geladen …
                  </div>
                }
              >
                <Classroom3DView
                  room={cls.room}
                  assignment={activePlan.assignment}
                  students={cls.students}
                  view={view3D}
                  focusSeat={
                    selectedSeat ??
                    Object.keys(activePlan.assignment).find(
                      (s) => activePlan.assignment[s]
                    ) ??
                    null
                  }
                />
              </Suspense>
              {view3D === 'seat' && !selectedSeat && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/95 border border-hbs-slate-border px-4 py-1.5 text-xs font-bold text-hbs-slate-dark shadow-md">
                  Anderen Platz: Im 2D-Plan antippen.
                </div>
              )}
            </div>
          ) : (
            <TouchWorkspace>
              <SeatPlanCanvas
                ref={svgRef}
                room={cls.room}
                assignment={activePlan.assignment}
                locked={activePlan.locked}
                students={cls.students}
                selectedSeat={selectedSeat}
                highlightStudentIds={neighborStudents}
                warnStudentIds={warnStudents}
                teacherPerspective={teacherPerspective}
                onSeatTap={handleSeatTap}
                onSwap={handleSwap}
                onLockToggle={(sId) => handleLockToggle(sId)}
                onBackgroundTap={() => {
                  setSelectedSeat(null);
                  setSelectedStudent(null);
                }}
              />
            </TouchWorkspace>
          )}

          {/* Selected Seat Action Bar */}
          {selectedSeat && !(view3D && expert) && (
            <div className="absolute bottom-4 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-hbs-slate-border bg-white p-3 shadow-hbs-modal">
              <span className="min-w-0 flex-1 text-xs sm:text-sm text-hbs-slate">
                {selectedStudentName ? (
                  activePlan.locked.includes(selectedSeat) ? (
                    <>
                      <strong className="text-hbs-slate-dark">{selectedStudentName}</strong> · Platz
                      fixiert
                    </>
                  ) : (
                    <>
                      <strong className="text-hbs-slate-dark">{selectedStudentName}</strong>{' '}
                      ausgewählt · Zweiten Platz zum Tauschen antippen
                    </>
                  )
                ) : activePlan.locked.includes(selectedSeat) ? (
                  'Leerer Platz fixiert'
                ) : (
                  'Freier Platz ausgewählt · Zweiten Platz zum Tauschen antippen'
                )}
              </span>

              {(selectedStudentName || activePlan.locked.includes(selectedSeat)) && (
                <button
                  type="button"
                  onClick={() => handleLockToggle(selectedSeat)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                    activePlan.locked.includes(selectedSeat)
                      ? 'bg-hbs-blue text-white border-hbs-blue'
                      : 'bg-white text-hbs-slate-dark border-hbs-slate-border hover:bg-hbs-blue-soft'
                  }`}
                >
                  {activePlan.locked.includes(selectedSeat) ? (
                    <>
                      <LockOpen className="w-3.5 h-3.5" />
                      <span>Lösen</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Fixieren</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                aria-label="Auswahl aufheben"
                onClick={() => {
                  setSelectedSeat(null);
                  setSelectedStudent(null);
                }}
                className="min-h-[40px] min-w-[40px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Unplaced Students Bar */}
        {report && report.unplaced.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-hbs-slate-border bg-white px-3 py-2 text-xs sm:text-sm">
            <span className="shrink-0 font-bold text-hbs-slate-muted">
              Ohne Platz <span className="hidden md:inline">(antippen, dann Platz wählen)</span>:
            </span>
            {report.unplaced.map((studId) => {
              const name = cls.students.find((s) => s.id === studId)?.name;
              const active = selectedStudent === studId;
              return (
                <button
                  key={studId}
                  type="button"
                  onClick={() => {
                    setSelectedStudent(active ? null : studId);
                    setSelectedSeat(null);
                  }}
                  className={`shrink-0 min-h-[36px] rounded-full border px-3 py-1 font-bold transition-colors ${
                    active
                      ? 'border-hbs-blue bg-hbs-blue-light text-hbs-blue'
                      : 'border-hbs-slate-border bg-hbs-bg text-hbs-slate-dark'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Evaluation / Why / Suggestions Sidebar */}
      {showSidebar && (
        <aside
          className={`${
            isMobile
              ? 'fixed inset-x-0 bottom-0 z-40 max-h-[75dvh] rounded-t-2xl border-t shadow-2xl'
              : 'w-[22rem] max-w-[90%] border-l'
          } overflow-y-auto border-hbs-slate-border bg-white p-4`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue">
              Plan-Analyse
            </span>
            <button
              type="button"
              aria-label="Bewertung schließen"
              onClick={() => {
                setSidebarOpen(false);
                setSuggestions(null);
              }}
              className="min-h-[36px] min-w-[36px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`grid gap-1 rounded-xl bg-hbs-bg p-1 border border-hbs-slate-border ${expert ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <button
              type="button"
              onClick={() => setSidebarTab('bewertung')}
              className={`min-h-[36px] rounded-lg text-xs font-bold ${
                sidebarTab === 'bewertung'
                  ? 'bg-white text-hbs-blue shadow-xs'
                  : 'text-hbs-slate-muted'
              }`}
            >
              Bewertung
            </button>
            {expert && (
              <>
                <button
                  type="button"
                  onClick={() => setSidebarTab('kind')}
                  className={`min-h-[36px] rounded-lg text-xs font-bold ${
                    sidebarTab === 'kind'
                      ? 'bg-white text-hbs-blue shadow-xs'
                      : 'text-hbs-slate-muted'
                  }`}
                >
                  Warum?
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('vorschlaege')}
                  className={`min-h-[36px] rounded-lg text-xs font-bold ${
                    sidebarTab === 'vorschlaege'
                      ? 'bg-white text-hbs-blue shadow-xs'
                      : 'text-hbs-slate-muted'
                  }`}
                >
                  Vorschläge
                </button>
              </>
            )}
          </div>

          {(!expert || sidebarTab === 'bewertung') && report && (
            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-hbs-slate-dark">
                    <Eye className="w-4 h-4 text-hbs-blue" /> Harte Regeln
                  </span>
                  <span className="text-hbs-slate-muted">
                    {report.hard.total ? `${report.hard.ok} von ${report.hard.total} eingehalten` : 'keine'}
                  </span>
                </div>
                <ScoreBar ok={report.hard.ok} total={report.hard.total} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-hbs-slate-dark">
                    <Heart className="w-4 h-4 text-hbs-teal" /> Positive Wünsche
                  </span>
                  <span className="text-hbs-slate-muted">
                    {report.wishes.total ? `${report.wishes.ok} von ${report.wishes.total} erfüllt` : 'keine'}
                  </span>
                </div>
                <ScoreBar ok={report.wishes.ok} total={report.wishes.total} />
              </div>

              {report.front.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-hbs-slate-dark">
                      <ArrowUpToLine className="w-4 h-4 text-hbs-amber" /> Vorne sitzen
                    </span>
                    <span className="text-hbs-slate-muted">
                      {report.front.ok} von {report.front.total}
                    </span>
                  </div>
                  <ScoreBar ok={report.front.ok} total={report.front.total} />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-hbs-slate-dark">
                    <AlertTriangle className="w-4 h-4 text-hbs-amber" /> Ungünstige Nachbarschaften
                  </span>
                  <span className="text-hbs-slate-muted">{report.problems.length || 'keine'}</span>
                </div>
                <ul className="space-y-1.5">
                  {report.problems.map((item) => (
                    <EvalItemRow key={item.key} item={item} />
                  ))}
                </ul>
              </div>

              {report.wishes.missed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-dark">
                    <Info className="w-4 h-4 text-hbs-blue" /> Nicht berücksichtigte Wünsche
                  </div>
                  <ul className="space-y-1.5">
                    {report.wishes.missed.map((item) => (
                      <EvalItemRow key={item.key} item={item} />
                    ))}
                  </ul>
                </div>
              )}

              {expert && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-dark">
                    <Columns3 className="w-4 h-4 text-hbs-blue" /> Gesprächigkeit je Tisch
                  </div>
                  <div className="space-y-1.5">
                    {report.tables
                      .filter((t) => t.names.length > 1)
                      .map((t) => (
                        <div key={t.tableId} className="flex items-center gap-2 text-xs">
                          <span className="w-32 truncate text-hbs-slate-muted">
                            {t.names.join(', ')}
                          </span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <span
                              className="block h-full rounded-full bg-hbs-blue"
                              style={{ width: `${(t.talk / 5) * 100}%` }}
                            />
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-hbs-slate-muted">
                Variante „{activePlan.name}“ · Startwert {activePlan.seed} · gleiche Eingaben ergeben denselben Plan.
              </p>
            </div>
          )}

          {expert && sidebarTab === 'kind' && (
            <div className="mt-4 space-y-3">
              {studentExplanation && selectedStudentName ? (
                <>
                  <h4 className="text-lg font-black text-hbs-slate-dark">{selectedStudentName}</h4>
                  <p className="text-xs sm:text-sm text-hbs-slate">
                    <strong>Direkte Nachbarn:</strong>{' '}
                    {studentExplanation.neighbors.join(', ') || 'keine'}
                  </p>
                  {studentExplanation.tablemates.length > 0 && (
                    <p className="text-xs sm:text-sm text-hbs-slate">
                      <strong>Am selben Tisch:</strong> {studentExplanation.tablemates.join(', ')}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {studentExplanation.items.map((item) => (
                      <EvalItemRow key={item.key} item={item} />
                    ))}
                    {!studentExplanation.items.length && (
                      <li className="text-xs text-hbs-slate-muted">
                        Für diesen Platz greifen keine besonderen Regeln – er ist neutral.
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-hbs-slate-muted">
                  Tippe ein Kind im Plan an, um zu sehen, warum es dort sitzt.
                </p>
              )}
            </div>
          )}

          {expert && sidebarTab === 'vorschlaege' && (
            <div className="mt-4 space-y-3">
              {!suggestions && (
                <>
                  <p className="text-xs sm:text-sm text-hbs-slate-muted">
                    „Verbessern“ prüft den aktuellen Plan und schlägt gezielte Tausche vor. Du entscheidest.
                  </p>
                  <button
                    type="button"
                    onClick={handleOptimizeCheck}
                    className="w-full min-h-[44px] rounded-xl bg-hbs-blue text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <WandSparkles className="w-4 h-4" />
                    <span>Jetzt prüfen</span>
                  </button>
                </>
              )}
              {suggestions?.length === 0 && (
                <p className="text-xs sm:text-sm font-bold text-hbs-teal-deep">
                  Keine sinnvollen Einzeltausche gefunden.
                </p>
              )}
              {suggestions?.map((sug) => (
                <div
                  key={sug.seatA + sug.seatB}
                  className="space-y-3 rounded-xl border border-hbs-slate-border p-3 bg-hbs-bg/50"
                >
                  <p className="text-xs sm:text-sm font-bold text-hbs-slate-dark">{sug.message}</p>
                  {sug.resolved.length > 0 && (
                    <ul className="space-y-1 text-xs text-hbs-teal-deep">
                      {sug.resolved.map((r) => (
                        <li key={r.key}>✓ {r.message}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...activePlan.assignment };
                        swapSeats(copy, sug.seatA, sug.seatB);
                        saveAssignment(copy);
                      }}
                      className="flex-1 min-h-[40px] rounded-xl bg-hbs-blue text-white text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Übernehmen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSuggestions((prev) => (prev ? prev.filter((x) => x !== sug) : prev))
                      }
                      className="min-h-[40px] px-3 rounded-xl border border-hbs-slate-border bg-white text-xs font-bold text-hbs-slate flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Ablehnen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* Rename Variant Modal */}
      {renameDraft !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs"
          onClick={() => setRenameDraft(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = renameDraft.trim();
              if (trimmed) onUpsertPlan({ ...activePlan, name: trimmed });
              setRenameDraft(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4"
          >
            <h3 className="text-base font-black text-hbs-slate-dark">Variante umbenennen</h3>
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              maxLength={40}
              className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-bold"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameDraft(null)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!renameDraft.trim()}
                className="min-h-[44px] px-4 rounded-xl bg-hbs-blue text-white text-sm font-bold disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Compare Variants Modal */}
      {compareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs"
          onClick={() => setCompareOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[85vh] flex flex-col rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-hbs-slate-dark">Varianten vergleichen</h3>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setCompareOpen(false)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {cls.plans.map((p) => {
                const rep = computePlanReport(ctx, p.assignment, cls.relations);
                const isActive = p.id === activePlan.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSetActivePlan(p.id);
                      setCompareOpen(false);
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-hbs-blue ring-2 ring-hbs-blue/20 bg-hbs-blue-soft/30'
                        : 'border-hbs-slate-border hover:border-hbs-blue/40'
                    }`}
                  >
                    <div className="mb-2 flex justify-between items-center">
                      <strong className="text-sm font-black text-hbs-slate-dark">{p.name}</strong>
                      {isActive && (
                        <span className="text-xs font-bold text-hbs-blue">aktiv</span>
                      )}
                    </div>
                    <div className="pointer-events-none aspect-[10/7]">
                      <SeatPlanCanvas
                        room={cls.room}
                        assignment={p.assignment}
                        students={cls.students}
                        interactive={false}
                        gridId={`cmp-grid-${p.id}`}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-hbs-bg py-1.5">
                        <div className="font-black text-base text-hbs-slate-dark">
                          {rep.hard.ok}/{rep.hard.total}
                        </div>
                        <div className="text-hbs-slate-muted">Harte Regeln</div>
                      </div>
                      <div className="rounded-xl bg-hbs-bg py-1.5">
                        <div className="font-black text-base text-hbs-slate-dark">
                          {rep.wishes.ok}/{rep.wishes.total}
                        </div>
                        <div className="text-hbs-slate-muted">Wünsche</div>
                      </div>
                      <div className="rounded-xl bg-hbs-bg py-1.5">
                        <div className="font-black text-base text-hbs-slate-dark">
                          {rep.problems.length}
                        </div>
                        <div className="text-hbs-slate-muted">Hinweise</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share for Colleagues Modal */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs"
          onClick={() => setShareOpen(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setShareBusy(true);
              const res = await onPublishPlan({
                plan: activePlan,
                classLabel: shareClassLabel,
                roleType: shareRoleType,
                subject: shareSubject,
                roomLabel: shareRoomLabel,
                notes: shareNotes,
              });
              setShareBusy(false);
              if (res.ok) {
                setShareOpen(false);
                onNotify('Sitzplan für das Kollegium in Cloudflare R2 freigegeben!', 'success');
              } else {
                onNotify(res.error || 'Freigabe fehlgeschlagen.', 'warn');
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-hbs-slate-border bg-white p-5 sm:p-6 shadow-hbs-modal space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-hbs-slate-dark">
                  Sitzplan für Kollegium freigeben
                </h3>
                <p className="text-xs text-hbs-slate-muted">
                  Kolleginnen &amp; Kollegen sehen nur den Raumplan &amp; die Namen – keine pädagogischen Notizen oder Beziehungsregeln.
                </p>
              </div>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setShareOpen(false)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Klasse (für Übersicht)
                </label>
                <input
                  required
                  value={shareClassLabel}
                  onChange={(e) => setShareClassLabel(e.target.value)}
                  placeholder="z. B. 7a oder Klasse 4b"
                  className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Rolle / Perspektive
                </label>
                <select
                  value={shareRoleType}
                  onChange={(e) => {
                    const r = e.target.value as PlanRoleType;
                    setShareRoleType(r);
                    if (r === 'klassenleitung') setShareSubject('Klassenraum');
                    else if (shareSubject === 'Klassenraum') setShareSubject('Chemie');
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-bold bg-white"
                >
                  <option value="klassenleitung">Klassenleitung (Klassenraum)</option>
                  <option value="fachlehrer">Fachlehrer (Fachraum)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Fach / Raumart
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {FACHRAUM_SUBJECTS.filter((s) =>
                    shareRoleType === 'klassenleitung' ? s === 'Klassenraum' : s !== 'Klassenraum'
                  ).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setShareSubject(subj)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        shareSubject === subj
                          ? 'bg-hbs-blue text-white border-hbs-blue'
                          : 'bg-hbs-bg text-hbs-slate border-hbs-slate-border'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
                <input
                  value={shareSubject}
                  onChange={(e) => setShareSubject(e.target.value)}
                  placeholder="z. B. Chemie, Physik, Kunst, Biologie..."
                  className="w-full min-h-[40px] rounded-xl border border-hbs-slate-border px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Raumnummer (optional)
                </label>
                <input
                  value={shareRoomLabel}
                  onChange={(e) => setShareRoomLabel(e.target.value)}
                  placeholder="z. B. R 204 oder Chemieraum"
                  className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                Hinweis für Kollegen (optional)
              </label>
              <input
                value={shareNotes}
                onChange={(e) => setShareNotes(e.target.value)}
                placeholder="z. B. Gültig ab November, bitte bei Experimenten so belassen"
                className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {isShared ? (
                <button
                  type="button"
                  disabled={shareBusy}
                  onClick={async () => {
                    setShareBusy(true);
                    await onUnpublishPlan();
                    setShareBusy(false);
                    setShareOpen(false);
                    onNotify('Freigabe zurückgezogen.', 'info');
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                >
                  Freigabe beenden
                </button>
              ) : (
                <span className="text-[11px] text-hbs-slate-muted">Erstellt von {authorName}</span>
              )}

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={shareBusy || !shareClassLabel.trim()}
                  className="min-h-[44px] px-5 rounded-xl bg-hbs-teal hover:bg-hbs-teal-deep text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {shareBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>{isShared ? 'Freigabe aktualisieren' : 'Jetzt freigeben'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Print Modal */}
      <PrintSitzplanModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title={`${cls.classLabel || cls.name}${cls.subject && cls.subject !== 'Klassenraum' ? ` · ${cls.subject}` : ''} · Sitzplan ${activePlan.name}`}
        subtitle={`${authorName}${cls.roomLabel ? ` · ${cls.roomLabel}` : ''} · ${cls.students.length - (report?.unplaced.length ?? 0)} Kinder mit Platz`}
        room={cls.room}
        assignment={activePlan.assignment}
        students={cls.students}
        initialTeacherPerspective
      />
    </div>
  );
};
