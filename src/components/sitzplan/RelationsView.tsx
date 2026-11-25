import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Link2,
  Split,
  ThumbsUp,
  X,
} from 'lucide-react';
import { RelationKind, SitzplanClass } from '../../types/sitzplanTypes';
import { RELATION_LABELS, detectConflicts } from './sitzplanEngine';
import { SITZPLAN_PALETTE } from './RoomSvgElements';

interface RelationsViewProps {
  cls: SitzplanClass;
  expert: boolean;
  onSetRelation: (a: string, b: string, kind: RelationKind | null) => void;
  onGoToStudents: () => void;
}

const RULE_STYLES: Record<
  RelationKind,
  {
    icon: React.ComponentType<{ className?: string }>;
    btnActive: string;
    badge: string;
    stroke: string;
    dash?: string;
    width: number;
  }
> = {
  never: {
    icon: Ban,
    btnActive: 'bg-rose-600 text-white shadow-xs',
    badge: 'bg-rose-600 text-white',
    stroke: SITZPLAN_PALETTE.never,
    dash: '6 5',
    width: 2.5,
  },
  apart: {
    icon: Split,
    btnActive: 'bg-hbs-amber text-white shadow-xs',
    badge: 'bg-hbs-amber text-white',
    stroke: SITZPLAN_PALETTE.apart,
    dash: '2 4',
    width: 2.5,
  },
  good: {
    icon: ThumbsUp,
    btnActive: 'bg-hbs-teal text-white shadow-xs',
    badge: 'bg-hbs-teal text-white',
    stroke: SITZPLAN_PALETTE.good,
    width: 2.2,
  },
  together: {
    icon: Link2,
    btnActive: 'bg-hbs-blue text-white shadow-xs',
    badge: 'bg-hbs-blue text-white',
    stroke: SITZPLAN_PALETTE.together,
    width: 3.5,
  },
};

const RULE_ORDER: RelationKind[] = ['never', 'apart', 'good', 'together'];

export const RelationsView: React.FC<RelationsViewProps> = ({
  cls,
  expert,
  onSetRelation,
  onGoToStudents,
}) => {
  const [selectedRule, setSelectedRule] = useState<RelationKind>('never');
  const [firstStudent, setFirstStudent] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'list' | 'net'>('list');

  const conflicts = useMemo(
    () => detectConflicts(cls).filter((c) => c.scope === 'relation'),
    [cls]
  );
  const nameMap = useMemo(
    () => new Map(cls.students.map((s) => [s.id, s.name])),
    [cls.students]
  );

  const existingWithFirst = useMemo(() => {
    const map = new Map<string, RelationKind>();
    if (!firstStudent) return map;
    for (const r of cls.relations) {
      if (r.a === firstStudent) map.set(r.b, r.kind);
      else if (r.b === firstStudent) map.set(r.a, r.kind);
    }
    return map;
  }, [cls.relations, firstStudent]);

  const handleTapStudent = (id: string) => {
    if (!firstStudent) {
      setFirstStudent(id);
      return;
    }
    if (firstStudent === id) {
      setFirstStudent(null);
      return;
    }
    const existing = cls.relations.find(
      (r) => (r.a === firstStudent && r.b === id) || (r.a === id && r.b === firstStudent)
    )?.kind;
    onSetRelation(firstStudent, id, existing === selectedRule ? null : selectedRule);
    setFirstStudent(null);
  };

  // Sociogram geometry
  const socioNodes = useMemo(() => {
    const n = cls.students.length;
    const map = new Map<string, { x: number; y: number; a: number }>();
    cls.students.forEach((s, idx) => {
      const a = (idx / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      map.set(s.id, { x: 300 + 210 * Math.cos(a), y: 300 + 210 * Math.sin(a), a });
    });
    return map;
  }, [cls.students]);

  const relationCounts = useMemo(() => {
    const map = new Map<string, number>();
    cls.relations.forEach((r) => {
      map.set(r.a, (map.get(r.a) ?? 0) + 1);
      map.set(r.b, (map.get(r.b) ?? 0) + 1);
    });
    return map;
  }, [cls.relations]);

  if (cls.students.length < 2) {
    return (
      <div className="grid h-full place-items-center bg-hbs-bg p-6">
        <div className="max-w-sm rounded-2xl border border-hbs-slate-border bg-white p-6 text-center shadow-hbs-card">
          <h3 className="text-xl font-black text-hbs-slate-dark">Noch zu wenige Kinder</h3>
          <p className="mt-1 text-sm text-hbs-slate-muted">
            Für Beziehungen braucht es mindestens zwei Kinder in der Klasse.
          </p>
          <button
            type="button"
            onClick={onGoToStudents}
            className="mt-4 min-h-[44px] px-5 rounded-xl bg-hbs-blue text-sm font-bold text-white hover:bg-hbs-blue-deep"
          >
            Kinder anlegen
          </button>
        </div>
      </div>
    );
  }

  const firstName = firstStudent ? nameMap.get(firstStudent) : null;
  const connectedToFirst = firstStudent
    ? new Set(
        cls.relations
          .filter((r) => r.a === firstStudent || r.b === firstStudent)
          .flatMap((r) => [r.a, r.b])
      )
    : null;

  return (
    <div className="h-full overflow-y-auto bg-hbs-bg p-4 md:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-2xl font-black text-hbs-slate-dark tracking-tight">
              Beziehungen
            </h2>
            <p className="text-xs text-hbs-slate-muted">
              Regel wählen, dann zwei Kinder antippen. Nochmal setzen entfernt sie.
            </p>
          </div>

          <div className="sticky top-0 z-10 space-y-2 bg-hbs-bg/95 py-1.5 backdrop-blur-xs">
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white border border-hbs-slate-border p-1.5 lg:grid-cols-4">
              {RULE_ORDER.map((kind) => {
                const cfg = RULE_STYLES[kind];
                const Icon = cfg.icon;
                const active = selectedRule === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedRule(kind)}
                    className={`flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-all ${
                      active ? cfg.btnActive : 'text-hbs-slate hover:bg-hbs-blue-soft'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{RELATION_LABELS[kind]}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs font-medium ${firstStudent ? 'text-hbs-slate-dark' : 'text-hbs-slate-muted'}`}>
                {firstName ? (
                  <>
                    Zweites Kind für <strong>{firstName}</strong> antippen ·{' '}
                    <strong>{RELATION_LABELS[selectedRule]}</strong>
                  </>
                ) : (
                  'Erstes Kind antippen.'
                )}
              </p>

              {expert && (
                <div
                  role="group"
                  aria-label="Darstellung"
                  className="flex rounded-xl bg-white border border-hbs-slate-border p-0.5 text-xs font-bold"
                >
                  {([
                    ['list', 'Liste'],
                    ['net', 'Soziogramm'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={displayMode === key}
                      onClick={() => setDisplayMode(key)}
                      className={`min-h-[36px] rounded-lg px-3 transition-colors ${
                        displayMode === key
                          ? 'bg-hbs-blue text-white'
                          : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {expert && displayMode === 'net' ? (
            <div className="space-y-2">
              <svg
                viewBox="-60 0 720 600"
                className="mx-auto w-full max-w-[720px] select-none rounded-2xl border border-hbs-slate-border bg-white shadow-hbs-card"
                role="img"
                aria-label="Soziogramm der Klasse"
              >
                <circle
                  cx={300}
                  cy={300}
                  r={210}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeDasharray="3 6"
                />
                {cls.relations.map((rel) => {
                  const posA = socioNodes.get(rel.a);
                  const posB = socioNodes.get(rel.b);
                  if (!posA || !posB) return null;
                  const style = RULE_STYLES[rel.kind];
                  const active = !firstStudent || rel.a === firstStudent || rel.b === firstStudent;
                  return (
                    <path
                      key={`${rel.a}-${rel.b}`}
                      d={`M${posA.x},${posA.y} Q300,300 ${posB.x},${posB.y}`}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash}
                      strokeLinecap="round"
                      opacity={active ? 0.9 : 0.1}
                    />
                  );
                })}
                {cls.students.map((st) => {
                  const pos = socioNodes.get(st.id);
                  if (!pos) return null;
                  const count = relationCounts.get(st.id) ?? 0;
                  const dimmed =
                    connectedToFirst &&
                    !connectedToFirst.has(st.id) &&
                    firstStudent !== st.id;
                  const lx = 300 + 242 * Math.cos(pos.a);
                  const ly = 300 + 242 * Math.sin(pos.a);
                  const anchor =
                    Math.abs(Math.cos(pos.a)) < 0.3
                      ? 'middle'
                      : Math.cos(pos.a) > 0
                        ? 'start'
                        : 'end';
                  return (
                    <g
                      key={st.id}
                      onClick={() => handleTapStudent(st.id)}
                      className="cursor-pointer"
                      opacity={dimmed ? 0.3 : 1}
                    >
                      <circle cx={pos.x} cy={pos.y} r={22} fill="transparent" />
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={8 + Math.min(count, 5) * 1.6}
                        fill={firstStudent === st.id ? SITZPLAN_PALETTE.primary : '#FFFFFF'}
                        stroke={SITZPLAN_PALETTE.primary}
                        strokeWidth={2.5}
                      />
                      {count === 0 && (
                        <circle cx={pos.x} cy={pos.y} r={3} fill="#94A3B8" />
                      )}
                      <text
                        x={lx}
                        y={ly}
                        dy="0.35em"
                        textAnchor={anchor}
                        fontSize={14}
                        fontWeight={firstStudent === st.id ? 700 : 600}
                        fill={SITZPLAN_PALETTE.wall}
                      >
                        {st.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-center text-xs text-hbs-slate-muted">
                Großer Punkt = viele Regeln · leerer Punkt = noch keine Regel. Ein Kind antippen zeigt nur seine Fäden.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {cls.students.map((st) => {
                const relWithFirst = existingWithFirst.get(st.id);
                const isFirst = firstStudent === st.id;
                const hasConflict = conflicts.some(
                  (c) => c.students.length <= 3 && c.students.includes(st.id)
                );
                const RelIcon = relWithFirst ? RULE_STYLES[relWithFirst].icon : null;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleTapStudent(st.id)}
                    className={`relative flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm font-bold transition-all active:scale-[0.97] ${
                      isFirst
                        ? 'border-hbs-blue ring-2 ring-hbs-blue/30 text-hbs-blue'
                        : 'border-hbs-slate-border hover:border-hbs-blue/50 text-hbs-slate-dark'
                    }`}
                  >
                    {relWithFirst && RelIcon && (
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md ${RULE_STYLES[relWithFirst].badge}`}
                      >
                        <RelIcon className="w-3 h-3" />
                      </span>
                    )}
                    <span className="truncate">{st.name}</span>
                    {hasConflict && (
                      <AlertTriangle className="ml-auto w-3.5 h-3.5 shrink-0 text-hbs-amber" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rules & Conflict Sidebar */}
        <aside className="space-y-4 md:sticky md:top-0 md:max-h-[calc(100vh-10rem)] md:self-start md:overflow-y-auto md:rounded-2xl md:border md:border-hbs-slate-border md:bg-white md:p-4 md:shadow-hbs-card">
          {conflicts.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-hbs-amber/50 bg-hbs-amber-light p-3">
              <h3 className="flex items-center gap-1.5 text-sm font-black text-hbs-amber-dark">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Hinweise zu den Regeln
              </h3>
              {conflicts.map((c, idx) => (
                <p key={idx} className="flex gap-1.5 text-xs text-hbs-slate">
                  <AlertCircle
                    className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${
                      c.level === 'error' ? 'text-rose-600' : 'text-hbs-amber-dark'
                    }`}
                  />
                  <span>{c.message}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-bold text-hbs-teal-deep bg-hbs-teal-light rounded-xl px-3 py-2 border border-hbs-teal/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Keine Widersprüche
            </p>
          )}

          <h3 className="text-base font-black text-hbs-slate-dark">
            Regeln ({cls.relations.length})
          </h3>

          {!cls.relations.length && (
            <p className="text-xs text-hbs-slate-muted">Noch keine Regeln festgelegt.</p>
          )}

          {RULE_ORDER.map((kind) => {
            const list = cls.relations.filter((r) => r.kind === kind);
            if (!list.length) return null;
            const cfg = RULE_STYLES[kind];
            const Icon = cfg.icon;
            return (
              <div key={kind} className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-dark">
                  <span className={`grid size-5 place-items-center rounded-md ${cfg.badge}`}>
                    <Icon className="w-3 h-3" />
                  </span>
                  <span>{RELATION_LABELS[kind]}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((rel) => (
                    <span
                      key={`${rel.a}-${rel.b}`}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-hbs-slate-border bg-hbs-bg pl-3 pr-1 text-xs font-semibold text-hbs-slate-dark"
                    >
                      <span>
                        {nameMap.get(rel.a)} &amp; {nameMap.get(rel.b)}
                      </span>
                      <button
                        type="button"
                        aria-label="Regel entfernen"
                        onClick={() => onSetRelation(rel.a, rel.b, null)}
                        className="grid size-6 place-items-center rounded-full text-hbs-slate-muted hover:bg-slate-200 hover:text-hbs-slate-dark"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
};
