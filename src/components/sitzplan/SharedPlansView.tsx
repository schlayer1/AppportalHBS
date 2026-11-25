import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  CopyPlus,
  Eye,
  FlaskConical,
  GraduationCap,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';
import { SharedSeatingPlan } from '../../types/sitzplanTypes';
import { SeatPlanCanvas } from './SeatPlanCanvas';
import { PrintSitzplanModal } from './PrintSitzplanModal';
import { View3DMode } from './Classroom3DView';

const Classroom3DView = lazy(() =>
  import('./Classroom3DView').then((m) => ({ default: m.Classroom3DView }))
);

interface SharedPlansViewProps {
  plans: SharedSeatingPlan[];
  loading: boolean;
  error: string | null;
  currentAuthorId: string;
  onRefresh: () => Promise<void>;
  onCopyToMyClasses: (plan: SharedSeatingPlan, asSubject?: string) => void;
}

const SUBJECT_FILTERS = ['Alle', 'Klassenraum', 'Chemie', 'Physik', 'Kunst', 'Biologie'] as const;

export const SharedPlansView: React.FC<SharedPlansViewProps> = ({
  plans,
  loading,
  error,
  currentAuthorId,
  onRefresh,
  onCopyToMyClasses,
}) => {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('Alle');
  const [viewingPlan, setViewingPlan] = useState<SharedSeatingPlan | null>(null);
  const [teacherPerspective, setTeacherPerspective] = useState(true);
  const [view3D, setView3D] = useState<View3DMode | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (subjectFilter !== 'Alle') {
        if (subjectFilter === 'Klassenraum') {
          if (p.roleType !== 'klassenleitung' && p.subject !== 'Klassenraum') return false;
        } else if (p.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
          return false;
        }
      }
      if (!q) return true;
      return (
        p.classLabel.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.roomLabel || '').toLowerCase().includes(q)
      );
    });
  }, [plans, subjectFilter, search]);

  const groupedByClass = useMemo(() => {
    const groups = new Map<string, SharedSeatingPlan[]>();
    filtered.forEach((p) => {
      const key = p.classLabel || 'Ohne Klassenangabe';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b, 'de', { numeric: true })
    );
  }, [filtered]);

  return (
    <div className="h-full overflow-y-auto bg-hbs-bg p-4 md:p-6">
      <div className="mx-auto max-w-[2100px] space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Freigegebene Sitzpläne nach Klassen
            </h2>
            <p className="text-sm text-hbs-slate-muted">
              Übersicht aller von Klassenleitungen und Fachlehrkräften (Chemie, Physik, Kunst, Biologie u. a.) freigegebenen Sitzpläne.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border bg-white hover:bg-hbs-blue-soft text-sm font-bold text-hbs-slate-dark flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-hbs-blue ${loading ? 'animate-spin' : ''}`} />
            <span>Aktualisieren</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {SUBJECT_FILTERS.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSubjectFilter(subj)}
                className={`min-h-[40px] shrink-0 rounded-full px-3.5 text-xs font-bold transition-colors border ${
                  subjectFilter === subj
                    ? 'bg-hbs-blue text-white border-hbs-blue'
                    : 'bg-white text-hbs-slate border-hbs-slate-border hover:bg-hbs-blue-soft'
                }`}
              >
                {subj === 'Klassenraum' ? 'Klassenleitung' : subj}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-hbs-slate-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Klasse, Fach oder Lehrkraft suchen…"
              className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border bg-white pl-9 pr-3 text-sm font-medium focus:border-hbs-blue focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-hbs-amber/40 bg-hbs-amber-light px-4 py-3 text-xs font-bold text-hbs-amber-dark">
            Hinweis: {error}
          </div>
        )}

        {groupedByClass.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-hbs-slate-border bg-white p-8 text-center shadow-hbs-card">
            <Users className="w-10 h-10 text-hbs-blue/50 mx-auto mb-3" />
            <h3 className="text-lg font-black text-hbs-slate-dark">
              {plans.length === 0
                ? 'Noch keine freigegebenen Sitzpläne'
                : 'Keine Treffer für diese Auswahl'}
            </h3>
            <p className="mt-1 text-sm text-hbs-slate-muted">
              {plans.length === 0
                ? 'Unter „Sitzplan“ → „Freigeben“ kann jede Klassenleitung und Fachlehrkraft ihren Sitzplan für das Kollegium bereitstellen.'
                : 'Passe den Fach-Filter oder Suchbegriff an.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByClass.map(([classLabel, classPlans]) => (
              <section key={classLabel} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-hbs-blue text-white px-3 py-1 text-sm font-black shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                    {classLabel}
                  </span>
                  <span className="text-xs font-bold text-hbs-slate-muted">
                    {classPlans.length}{' '}
                    {classPlans.length === 1 ? 'freigegebener Plan' : 'freigegebene Pläne'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {classPlans.map((plan) => {
                    const isKlassenleitung = plan.roleType === 'klassenleitung';
                    const isMine = plan.authorId === currentAuthorId;
                    return (
                      <div
                        key={plan.id}
                        className="group rounded-2xl border border-hbs-slate-border bg-white p-4 shadow-hbs-card hover:shadow-hbs-hover hover:border-hbs-blue/40 transition-all flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                  isKlassenleitung
                                    ? 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25'
                                    : 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25'
                                }`}
                              >
                                {!isKlassenleitung && <FlaskConical className="w-3 h-3" />}
                                {isKlassenleitung ? 'Klassenleitung' : plan.subject}
                              </span>
                              {plan.roomLabel && (
                                <span className="text-[11px] font-bold text-hbs-slate-muted">
                                  {plan.roomLabel}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-hbs-slate-dark truncate">
                              {plan.classLabel} · {plan.planName}
                            </h4>
                            <p className="text-xs text-hbs-slate-muted flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              <span>
                                {plan.authorName}
                                {isMine ? ' (Eigener Plan)' : ''}
                              </span>
                            </p>
                          </div>

                          <span className="text-[11px] font-semibold text-hbs-slate-muted shrink-0">
                            {new Date(plan.updatedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingPlan(plan);
                            setTeacherPerspective(true);
                            setView3D(null);
                          }}
                          className="aspect-[10/7] w-full rounded-xl border border-hbs-slate-border/70 bg-hbs-bg/40 p-1.5 overflow-hidden cursor-pointer hover:border-hbs-blue/40 transition-colors"
                        >
                          <div className="pointer-events-none h-full w-full">
                            <SeatPlanCanvas
                              room={plan.room}
                              assignment={plan.assignment}
                              students={plan.students}
                              interactive={false}
                              teacherPerspective
                              gridId={`shared-thumb-${plan.id}`}
                            />
                          </div>
                        </button>

                        {plan.notes && (
                          <p className="text-xs text-hbs-slate bg-hbs-bg rounded-xl px-3 py-2 border border-slate-100">
                            {plan.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-auto pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingPlan(plan);
                              setTeacherPerspective(true);
                              setView3D(null);
                            }}
                            className="flex-1 min-h-[40px] rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ansehen &amp; Drucken</span>
                          </button>
                          <button
                            type="button"
                            title="Raum & Namensliste als eigenen Entwurf übernehmen"
                            onClick={() => onCopyToMyClasses(plan)}
                            className="min-h-[40px] px-3 rounded-xl border border-hbs-slate-border bg-white hover:bg-hbs-blue-soft text-hbs-slate-dark text-xs font-bold flex items-center gap-1"
                          >
                            <CopyPlus className="w-3.5 h-3.5 text-hbs-blue" />
                            <span className="hidden sm:inline">Kopieren</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Full Interactive Shared Plan Viewer Modal */}
      {viewingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/60 p-3 sm:p-5 backdrop-blur-xs"
          onClick={() => setViewingPlan(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl border border-hbs-slate-border bg-white shadow-hbs-modal overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hbs-slate-border bg-hbs-bg px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-hbs-blue text-white px-2.5 py-0.5 text-xs font-black">
                    {viewingPlan.classLabel}
                  </span>
                  <span className="rounded-full bg-hbs-teal-light text-hbs-teal-deep px-2.5 py-0.5 text-xs font-bold">
                    {viewingPlan.roleType === 'klassenleitung'
                      ? 'Klassenleitung'
                      : viewingPlan.subject}
                  </span>
                  {viewingPlan.roomLabel && (
                    <span className="text-xs font-bold text-hbs-slate-muted">
                      {viewingPlan.roomLabel}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark mt-1">
                  {viewingPlan.planName} · {viewingPlan.authorName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!view3D && (
                  <button
                    type="button"
                    onClick={() => setTeacherPerspective((v) => !v)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                      teacherPerspective
                        ? 'bg-hbs-blue text-white border-hbs-blue'
                        : 'bg-white text-hbs-slate-dark border-hbs-slate-border'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {teacherPerspective
                        ? 'Lehrerblick (Tafel im Rücken)'
                        : 'Raumblick (Tafel oben)'}
                    </span>
                  </button>
                )}

                <div className="flex rounded-xl bg-white border border-hbs-slate-border p-0.5 text-xs font-bold">
                  {(
                    [
                      [null, '2D'],
                      ['orbit', '3D'],
                      ['teacher', 'Lehrerblick 3D'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setView3D(mode)}
                      className={`min-h-[36px] px-2.5 rounded-lg ${
                        view3D === mode
                          ? 'bg-hbs-blue text-white'
                          : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPrintOpen(true)}
                  className="min-h-[40px] px-3.5 rounded-xl bg-hbs-amber text-white text-xs font-bold flex items-center gap-1.5 hover:bg-hbs-amber-dark"
                >
                  <Printer className="w-4 h-4" />
                  <span>Drucken</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCopyToMyClasses(viewingPlan);
                    setViewingPlan(null);
                  }}
                  className="min-h-[40px] px-3.5 rounded-xl border border-hbs-slate-border bg-white text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-1.5"
                >
                  <CopyPlus className="w-4 h-4 text-hbs-blue" />
                  <span>Für mich kopieren</span>
                </button>

                <button
                  type="button"
                  aria-label="Ansicht schließen"
                  onClick={() => setViewingPlan(null)}
                  className="min-h-[40px] min-w-[40px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-3 sm:p-5 bg-hbs-bg">
              {view3D ? (
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center text-sm font-bold text-hbs-slate-muted">
                      3D wird geladen …
                    </div>
                  }
                >
                  <Classroom3DView
                    room={viewingPlan.room}
                    assignment={viewingPlan.assignment}
                    students={viewingPlan.students}
                    view={view3D}
                    focusSeat={null}
                  />
                </Suspense>
              ) : (
                <SeatPlanCanvas
                  room={viewingPlan.room}
                  assignment={viewingPlan.assignment}
                  students={viewingPlan.students}
                  interactive={false}
                  teacherPerspective={teacherPerspective}
                  gridId="shared-modal-grid"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {viewingPlan && (
        <PrintSitzplanModal
          isOpen={printOpen}
          onClose={() => setPrintOpen(false)}
          title={`${viewingPlan.classLabel}${
            viewingPlan.subject && viewingPlan.subject !== 'Klassenraum'
              ? ` · ${viewingPlan.subject}`
              : ''
          } · ${viewingPlan.planName}`}
          subtitle={`${viewingPlan.authorName}${
            viewingPlan.roomLabel ? ` · ${viewingPlan.roomLabel}` : ''
          }`}
          room={viewingPlan.room}
          assignment={viewingPlan.assignment}
          students={viewingPlan.students}
          initialTeacherPerspective={teacherPerspective}
        />
      )}
    </div>
  );
};
