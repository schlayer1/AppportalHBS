import React, { useRef, useState } from 'react';
import {
  ArrowUpToLine,
  ClipboardPaste,
  Dices,
  LifeBuoy,
  Plus,
  Presentation,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { SitzplanClass, StudentProfile } from '../../types/sitzplanTypes';
import { genId } from './sitzplanEngine';

interface StudentsViewProps {
  cls: SitzplanClass;
  expert: boolean;
  onUpsertStudent: (s: StudentProfile) => void;
  onAddStudentsBulk: (list: StudentProfile[]) => void;
  onRemoveStudent: (id: string) => void;
  onRestoreClass: (snapshot: SitzplanClass) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warn', undo?: () => void) => void;
}

const BOARD_NAMES_STORAGE_KEY = 'hbs_board_picker_names';

function parseNamesList(raw: string): string[] {
  return raw
    .split(/[\r\n\t,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const SwipeLevelControl: React.FC<{
  label: string;
  value: number;
  hint: [string, string];
  onChange: (val: number) => void;
}> = ({ label, value, hint, onChange }) => {
  const dragRef = useRef<{ y: number; v: number; moved: boolean } | null>(null);
  const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs sm:text-sm font-bold text-hbs-slate-dark">{label}</span>
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(clamp(value + 1));
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(clamp(value - 1));
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { y: e.clientY, v: value, moved: false };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const delta = (d.y - e.clientY) / 26;
          if (Math.abs(d.y - e.clientY) > 6) d.moved = true;
          if (d.moved) onChange(clamp(d.v + delta));
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        className="touch-none relative flex h-36 w-16 cursor-ns-resize flex-col-reverse gap-1.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border p-2 outline-none focus-visible:ring-2 focus-visible:ring-hbs-blue"
      >
        {[1, 2, 3, 4, 5].map((lvl) => (
          <button
            key={lvl}
            type="button"
            tabIndex={-1}
            aria-label={`${label} ${lvl}`}
            onPointerUp={() => {
              if (dragRef.current && !dragRef.current.moved) onChange(lvl);
            }}
            className={`flex-1 rounded-lg transition-all duration-150 ${
              lvl <= value ? 'bg-hbs-blue' : 'bg-slate-200'
            }`}
            style={{ marginInline: `${(5 - lvl) * 3.5}px` }}
          />
        ))}
      </div>
      <span className="text-xl font-black text-hbs-slate-dark tabular-nums">
        {value} <span className="text-xs font-semibold text-hbs-slate-muted">/ 5</span>
      </span>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-label={`${label} Regler`}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-20 accent-hbs-blue"
      />
      <div className="flex w-24 justify-between text-[10px] font-semibold text-hbs-slate-muted">
        <span>{hint[0]}</span>
        <span>{hint[1]}</span>
      </div>
    </div>
  );
};

const MiniLevelBars: React.FC<{ value: number }> = ({ value }) => (
  <span className="inline-flex items-end gap-0.5" aria-label={`${value} von 5`}>
    {[1, 2, 3, 4, 5].map((lvl) => (
      <span
        key={lvl}
        className={`w-1.5 rounded-xs ${lvl <= value ? 'bg-hbs-blue' : 'bg-slate-200'}`}
        style={{ height: 4 + lvl * 2.5 }}
      />
    ))}
  </span>
);

export const StudentsView: React.FC<StudentsViewProps> = ({
  cls,
  expert,
  onUpsertStudent,
  onAddStudentsBulk,
  onRemoveStudent,
  onRestoreClass,
  onNotify,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const editingStudent = cls.students.find((s) => s.id === editingId) ?? null;
  const parsedNames = parseNamesList(pasteText);

  const finishEditing = () => {
    if (editingStudent && !editingStudent.name.trim()) {
      const idx = cls.students.indexOf(editingStudent);
      onUpsertStudent({ ...editingStudent, name: `Kind ${idx + 1}` });
    }
    setEditingId(null);
  };

  const addSingleStudent = () => {
    const next: StudentProfile = {
      id: genId('s'),
      name: `Kind ${cls.students.length + 1}`,
      concentration: 3,
      teamwork: 3,
      talkative: 3,
      support: false,
      front: false,
      solo: false,
    };
    onUpsertStudent(next);
    setEditingId(next.id);
  };

  const importFromBoard = () => {
    try {
      const raw = localStorage.getItem(BOARD_NAMES_STORAGE_KEY);
      if (!raw || !raw.trim()) {
        onNotify('In der Digitalen Tafel / Gruppen sind aktuell noch keine Namen gespeichert.', 'warn');
        return;
      }
      setPasteText(raw);
      setPasteOpen(true);
    } catch {
      onNotify('Zugriff auf lokale Namen fehlgeschlagen.', 'warn');
    }
  };

  const exportToBoardAndGroups = () => {
    if (cls.students.length === 0) return;
    try {
      const namesStr = cls.students.map((s) => s.name).join(', ');
      localStorage.setItem(BOARD_NAMES_STORAGE_KEY, namesStr);
      onNotify(
        `${cls.students.length} Namen an Digitale Tafel & HBS Gruppen übertragen!`,
        'success'
      );
    } catch {
      onNotify('Namen konnten nicht gespeichert werden.', 'warn');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-hbs-bg p-4 md:p-6">
      <div className="mx-auto max-w-[2100px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Kinder
            </h2>
            <p className="text-sm text-hbs-slate-muted">
              {cls.students.length} Kinder · Einschätzungen dienen nur der Sitzplanung, nicht der Bewertung.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {cls.students.length > 0 && (
              <button
                type="button"
                onClick={exportToBoardAndGroups}
                className="min-h-[44px] px-3.5 rounded-xl border border-hbs-teal/30 bg-hbs-teal-light text-hbs-teal-deep text-xs sm:text-sm font-bold hover:bg-hbs-teal/15 flex items-center gap-1.5 transition-colors"
                title="Namensliste in Zufallsgenerator & Gruppen-Tool verfügbar machen"
              >
                <Dices className="w-4 h-4" />
                <span className="hidden sm:inline">An Tafel &amp; Gruppen senden</span>
                <span className="sm:hidden">→ Tafel</span>
              </button>
            )}
            <button
              type="button"
              onClick={importFromBoard}
              className="min-h-[44px] px-3.5 rounded-xl border border-hbs-slate-border bg-white text-hbs-slate text-xs sm:text-sm font-bold hover:bg-hbs-blue-soft hover:text-hbs-blue flex items-center gap-1.5 transition-colors"
              title="Namen aus der Digitalen Tafel laden"
            >
              <Presentation className="w-4 h-4 text-hbs-blue" />
              <span className="hidden sm:inline">Aus Tafel laden</span>
              <span className="sm:hidden">Tafel-Import</span>
            </button>
            <button
              type="button"
              onClick={() => setPasteOpen(true)}
              className="min-h-[44px] px-3.5 rounded-xl border border-hbs-slate-border bg-white text-hbs-slate text-xs sm:text-sm font-bold hover:bg-hbs-blue-soft hover:text-hbs-blue flex items-center gap-1.5 transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Namen einfügen</span>
            </button>
            <button
              type="button"
              onClick={addSingleStudent}
              className="min-h-[44px] px-4 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Kind hinzufügen</span>
            </button>
          </div>
        </div>

        {cls.students.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-hbs-slate-border bg-white p-6 text-center shadow-hbs-card">
            <h3 className="text-lg font-black text-hbs-slate-dark">
              Noch keine Kinder in dieser Klasse
            </h3>
            <p className="mt-1 text-sm text-hbs-slate-muted">
              Füge eine Namensliste ein, importiere aus der Digitalen Tafel oder lege Kinder einzeln an.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setPasteOpen(true)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border bg-white text-sm font-bold text-hbs-slate hover:bg-hbs-blue-soft flex items-center gap-1.5"
              >
                <ClipboardPaste className="w-4 h-4" />
                Namen einfügen
              </button>
              <button
                type="button"
                onClick={addSingleStudent}
                className="min-h-[44px] px-4 rounded-xl bg-hbs-blue text-sm font-bold text-white hover:bg-hbs-blue-deep flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Kind hinzufügen
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {cls.students.map((st) => {
              const badgeCount = [st.front, st.solo, expert && st.support].filter(Boolean).length;
              return (
                <div key={st.id} className="relative min-w-0">
                  <button
                    type="button"
                    aria-label={`${st.name} bearbeiten`}
                    onClick={() => setEditingId(st.id)}
                    className="group block h-full w-full min-w-0 rounded-2xl border border-hbs-slate-border/90 bg-white p-3 text-left shadow-hbs-card hover:shadow-hbs-hover hover:border-hbs-blue/40 transition-all active:scale-[0.98]"
                  >
                    <div className="flex min-h-8 items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-hbs-blue-light text-xs font-black text-hbs-blue">
                        {st.name.slice(0, 2)}
                      </span>
                      <span
                        className="min-w-0 flex-1 break-words text-sm font-bold text-hbs-slate-dark"
                        style={{ paddingRight: `${badgeCount * 1.55}rem` }}
                      >
                        {st.name}
                      </span>
                    </div>
                    {expert && (
                      <dl className="mt-2 space-y-1 text-[11px] text-hbs-slate-muted border-t border-slate-100 pt-2">
                        <div className="flex items-center justify-between">
                          <dt>Konzentration</dt>
                          <dd><MiniLevelBars value={st.concentration} /></dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Teamfähigkeit</dt>
                          <dd><MiniLevelBars value={st.teamwork} /></dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Gesprächigkeit</dt>
                          <dd><MiniLevelBars value={st.talkative} /></dd>
                        </div>
                      </dl>
                    )}
                  </button>

                  <div className="pointer-events-none absolute right-2 top-2 flex gap-0.5">
                    {st.front && (
                      <span
                        title="Bevorzugt vorne sitzen"
                        className="grid size-6 place-items-center rounded-full bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25"
                      >
                        <ArrowUpToLine className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {st.solo && (
                      <span
                        title="Einzelplatz wichtig"
                        className="grid size-6 place-items-center rounded-full bg-hbs-blue-light text-hbs-blue border border-hbs-blue/25"
                      >
                        <User className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {expert && st.support && (
                      <span
                        title="Besonderer Unterstützungsbedarf"
                        className="grid size-6 place-items-center rounded-full bg-hbs-teal-light text-hbs-teal-deep border border-hbs-teal/25"
                      >
                        <LifeBuoy className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Student Drawer */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-hbs-slate-dark/40 backdrop-blur-xs"
          onClick={finishEditing}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 sm:p-6 shadow-hbs-modal space-y-6 border-l border-hbs-slate-border"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-hbs-slate-dark">Kind bearbeiten</h3>
              <button
                type="button"
                aria-label="Schließen"
                onClick={finishEditing}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-name-input" className="text-sm font-bold text-hbs-slate-dark">
                Vorname oder Kürzel
              </label>
              <input
                id="student-name-input"
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                value={editingStudent.name}
                onChange={(e) =>
                  onUpsertStudent({ ...editingStudent, name: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    finishEditing();
                  }
                }}
                enterKeyHint="done"
                className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-base font-bold text-hbs-slate-dark focus:border-hbs-blue focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
              />
            </div>

            {expert && (
              <>
                <p className="text-xs text-hbs-slate-muted">
                  Nach oben wischen erhöht, nach unten senkt den Wert. Antippen oder Regler geht auch.
                </p>
                <div className="flex justify-around gap-2">
                  <SwipeLevelControl
                    label="Konzentration"
                    value={editingStudent.concentration}
                    hint={['wenig', 'viel']}
                    onChange={(concentration) =>
                      onUpsertStudent({ ...editingStudent, concentration })
                    }
                  />
                  <SwipeLevelControl
                    label="Teamfähigkeit"
                    value={editingStudent.teamwork}
                    hint={['wenig', 'viel']}
                    onChange={(teamwork) =>
                      onUpsertStudent({ ...editingStudent, teamwork })
                    }
                  />
                  <SwipeLevelControl
                    label="Gesprächigkeit"
                    value={editingStudent.talkative}
                    hint={['ruhig', 'lebhaft']}
                    onChange={(talkative) =>
                      onUpsertStudent({ ...editingStudent, talkative })
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-hbs-slate-border px-3.5 py-3 cursor-pointer hover:bg-hbs-bg">
                <span>
                  <span className="block text-sm font-bold text-hbs-slate-dark">
                    Bevorzugt vorne sitzen
                  </span>
                  <span className="block text-xs text-hbs-slate-muted">
                    Möglichst tafelnah platzieren
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={editingStudent.front}
                  onChange={(e) =>
                    onUpsertStudent({ ...editingStudent, front: e.target.checked })
                  }
                  className="h-5 w-5 accent-hbs-blue rounded"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-hbs-slate-border px-3.5 py-3 cursor-pointer hover:bg-hbs-bg">
                <span>
                  <span className="block text-sm font-bold text-hbs-slate-dark">
                    Einzelplatz wichtig
                  </span>
                  <span className="block text-xs text-hbs-slate-muted">
                    Möglichst ohne direkte Sitznachbarn, z. B. am Einzeltisch
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={!!editingStudent.solo}
                  onChange={(e) =>
                    onUpsertStudent({ ...editingStudent, solo: e.target.checked })
                  }
                  className="h-5 w-5 accent-hbs-blue rounded"
                />
              </label>

              {expert && (
                <label className="flex items-center justify-between gap-3 rounded-xl border border-hbs-slate-border px-3.5 py-3 cursor-pointer hover:bg-hbs-bg">
                  <span>
                    <span className="block text-sm font-bold text-hbs-slate-dark">
                      Besonderer Unterstützungsbedarf
                    </span>
                    <span className="block text-xs text-hbs-slate-muted">
                      Nicht in die letzten Reihen setzen
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={editingStudent.support}
                    onChange={(e) =>
                      onUpsertStudent({ ...editingStudent, support: e.target.checked })
                    }
                    className="h-5 w-5 accent-hbs-blue rounded"
                  />
                </label>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={finishEditing}
                className="w-full min-h-[44px] rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-sm"
              >
                Fertig
              </button>
              <button
                type="button"
                onClick={() => {
                  const snapshot = structuredClone(cls);
                  const deletedName = editingStudent.name;
                  onRemoveStudent(editingStudent.id);
                  setEditingId(null);
                  onNotify(`${deletedName} entfernt`, 'info', () => onRestoreClass(snapshot));
                }}
                className="w-full min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kind entfernen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paste Modal */}
      {pasteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs"
          onClick={() => setPasteOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-hbs-slate-dark">Namen einfügen</h3>
                <p className="text-xs text-hbs-slate-muted">
                  Ein Name pro Zeile, kommagetrennt oder aus einer Tabelle.
                </p>
              </div>
              <button
                type="button"
                aria-label="Dialog schließen"
                onClick={() => setPasteOpen(false)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              autoFocus
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Mia&#10;Paul&#10;Lena&#10;..."
              className="w-full min-h-48 rounded-xl border border-hbs-slate-border p-3 text-sm font-medium focus:border-hbs-blue focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
            />

            <p className="text-xs font-bold text-hbs-slate-muted">
              {parsedNames.length} {parsedNames.length === 1 ? 'Kind erkannt' : 'Kinder erkannt'}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteOpen(false)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={parsedNames.length === 0}
                onClick={() => {
                  const created: StudentProfile[] = parsedNames.map((name) => ({
                    id: genId('s'),
                    name,
                    concentration: 3,
                    teamwork: 3,
                    talkative: 3,
                    support: false,
                    front: false,
                    solo: false,
                  }));
                  onAddStudentsBulk(created);
                  setPasteText('');
                  setPasteOpen(false);
                  onNotify(
                    `${created.length} ${created.length === 1 ? 'Kind hinzugefügt' : 'Kinder hinzugefügt'}`,
                    'success'
                  );
                }}
                className="min-h-[44px] px-4 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Hinzufügen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
