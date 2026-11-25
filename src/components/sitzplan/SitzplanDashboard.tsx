import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Cloud,
  CloudOff,
  Download,
  FlaskConical,
  FolderPlus,
  HeartHandshake,
  LayoutGrid,
  LayoutPanelTop,
  Loader2,
  MoreVertical,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTeacherName } from '../../types/user';
import {
  FACHRAUM_SUBJECTS,
  PlanRoleType,
  SitzplanClass,
} from '../../types/sitzplanTypes';
import { getClassPlacementStatus } from './sitzplanEngine';
import { useSitzplanStore } from './useSitzplanStore';
import { RoomEditorView } from './RoomEditorView';
import { StudentsView } from './StudentsView';
import { RelationsView } from './RelationsView';
import { SeatingPlanView } from './SeatingPlanView';
import { SharedPlansView } from './SharedPlansView';

type SitzplanTab = 'raum' | 'kinder' | 'beziehungen' | 'sitzplan' | 'freigegeben';

interface SitzplanDashboardProps {
  onBackToPortal: () => void;
}

const TABS: Array<{
  id: SitzplanTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'raum', label: 'Klassenraum', mobileLabel: 'Raum', icon: LayoutGrid },
  { id: 'kinder', label: 'Kinder', mobileLabel: 'Kinder', icon: Users },
  { id: 'beziehungen', label: 'Beziehungen', mobileLabel: 'Regeln', icon: HeartHandshake },
  { id: 'sitzplan', label: 'Sitzplan', mobileLabel: 'Sitzplan', icon: LayoutPanelTop },
  { id: 'freigegeben', label: 'Freigegeben', mobileLabel: 'Kollegium', icon: BookOpen },
];

export const SitzplanDashboard: React.FC<SitzplanDashboardProps> = ({
  onBackToPortal,
}) => {
  const { currentUser } = useAuth();
  const authorId = currentUser?.id || 'teacher-local';
  const authorName = currentUser ? formatTeacherName(currentUser) : 'Lehrkraft';

  const store = useSitzplanStore(authorId, authorName);
  const [activeTab, setActiveTab] = useState<SitzplanTab>('raum');
  const [menuOpen, setMenuOpen] = useState(false);

  // Toast banner
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'success' | 'info' | 'warn';
    undo?: () => void;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (
    message: string,
    tone: 'success' | 'info' | 'warn' = 'info',
    undo?: () => void
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, tone, undo });
    toastTimerRef.current = setTimeout(() => setToast(null), undo ? 6000 : 3500);
  };

  // Class Creation / Rename Modals
  const [classModal, setClassModal] = useState<{
    mode: 'create' | 'rename';
    name: string;
    classLabel: string;
    roleType: PlanRoleType;
    subject: string;
    roomLabel: string;
  } | null>(null);
  const [deleteClassConfirm, setDeleteClassConfirm] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const cls = store.activeClass;
  const placement = cls ? getClassPlacementStatus(cls) : null;

  const exportBackupJson = () => {
    const payload = {
      app: 'hbs-sitzplan',
      version: 1,
      exportedAt: new Date().toISOString(),
      authorId,
      authorName,
      classes: store.classes,
      roomTemplates: store.roomTemplates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hbs-sitzplan-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 5000);
    notify('JSON-Sicherung heruntergeladen.', 'success');
  };

  const handleImportJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const importedClasses = parsed.classes as SitzplanClass[];
      if (
        !Array.isArray(importedClasses) ||
        importedClasses.length === 0 ||
        !importedClasses.every((c) => c.id && c.room && Array.isArray(c.students))
      ) {
        throw new Error('Ungültiges Format');
      }
      const importedTemplates = Array.isArray(parsed.roomTemplates)
        ? parsed.roomTemplates.filter((t: any) => t && t.id && t.name && t.room)
        : undefined;
      store.importAll(importedClasses, importedTemplates);
      notify(`${importedClasses.length} Klasse(n) importiert.`, 'success');
    } catch {
      notify('Die Datei ist keine gültige Sitzplan-Sicherung.', 'warn');
    }
  };

  return (
    <div className="sitzplan-app-ui flex h-dvh min-w-0 flex-col overflow-hidden bg-hbs-bg text-hbs-slate-dark print:hidden">
      {/* HBS Header */}
      <header className="shrink-0 border-b border-hbs-slate-border bg-white/95 backdrop-blur-md px-3 py-2 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-[2100px] mx-auto">
          {/* Left: Siegel + Back + Class Select */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onBackToPortal}
              aria-label="Zurück zum Portal"
              title="Zurück zum App-Portal"
              className="min-h-[44px] px-2.5 sm:px-3 rounded-xl border border-hbs-slate-border bg-white hover:bg-hbs-blue-soft text-xs font-bold text-hbs-slate hover:text-hbs-blue flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portal</span>
            </button>

            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-hbs-blue-soft p-1 items-center justify-center border border-hbs-blue/20 shrink-0 bg-white">
              <img src="/Siegel_bunt.png" alt="HBS Siegel" className="w-full h-full object-contain" />
            </div>

            <div className="hidden xl:block min-w-0 mr-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-hbs-blue">
                Heimbürgeschule
              </span>
              <span className="block text-sm font-black text-hbs-slate-dark leading-tight">
                HBS Sitzplan
              </span>
            </div>

            <select
              aria-label="Klasse wählen"
              value={store.activeClassId}
              onChange={(e) => store.setActiveClass(e.target.value)}
              className="min-h-[42px] min-w-0 max-w-[11rem] sm:max-w-[15rem] rounded-xl border border-hbs-slate-border bg-hbs-bg px-2.5 text-sm font-black text-hbs-slate-dark focus:border-hbs-blue focus:outline-none"
            >
              {store.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.subject && c.subject !== 'Klassenraum' ? ` (${c.subject})` : ''}
                </option>
              ))}
            </select>

            {cls?.roleType === 'fachlehrer' && cls.subject && (
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-hbs-amber-light border border-hbs-amber/25 px-2.5 py-0.5 text-[11px] font-bold text-hbs-amber-dark shrink-0">
                <FlaskConical className="w-3 h-3" />
                {cls.subject}
              </span>
            )}
          </div>

          {/* Center: Desktop Tab Navigation */}
          <nav
            aria-label="Sitzplan Navigation"
            className="hidden md:flex items-center gap-1 rounded-2xl bg-hbs-bg border border-hbs-slate-border/80 p-1 mx-auto"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs lg:text-sm font-bold transition-all ${
                    active
                      ? 'bg-white text-hbs-blue shadow-xs border border-hbs-slate-border/60'
                      : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">{tab.label}</span>
                  {tab.id === 'freigegeben' && store.sharedPlans.length > 0 && (
                    <span className="rounded-full bg-hbs-teal-light text-hbs-teal-deep px-1.5 py-0.5 text-[10px] font-black border border-hbs-teal/20">
                      {store.sharedPlans.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Status + Cloud Sync + Ansicht + Menu */}
          <div className="flex shrink-0 items-center gap-1.5">
            {placement && placement.total > 0 && (
              <span
                title={`${placement.placed} von ${placement.total} Kindern sitzen · ${placement.capacity} Plätze im Raum`}
                className={`hidden 2xl:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
                  placement.complete
                    ? 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25'
                    : 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25'
                }`}
              >
                {placement.placed} / {placement.total} sitzen
              </span>
            )}

            {/* Cloudflare R2 Sync Status */}
            <button
              type="button"
              onClick={() => store.forceSyncNow()}
              title={
                store.syncState === 'synced'
                  ? 'In Cloudflare R2 Cloud gesichert (klicken für Sofort-Sync)'
                  : store.syncState === 'syncing'
                    ? 'Synchronisiere mit Cloudflare R2…'
                    : store.syncError || 'Lokal im Browser gespeichert'
              }
              className={`hidden xl:inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-colors ${
                store.syncState === 'synced'
                  ? 'bg-hbs-teal-light/60 border-hbs-teal/25 text-hbs-teal-deep'
                  : store.syncState === 'syncing'
                    ? 'bg-hbs-blue-light border-hbs-blue/25 text-hbs-blue'
                    : 'bg-slate-100 border-slate-200 text-hbs-slate-muted'
              }`}
            >
              {store.syncState === 'syncing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : store.syncState === 'synced' ? (
                <Cloud className="w-3.5 h-3.5" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              <span>
                {store.syncState === 'synced'
                  ? 'R2 Cloud'
                  : store.syncState === 'syncing'
                    ? 'Sync…'
                    : 'Lokal'}
              </span>
            </button>

            {/* Einfach / Erweitert Switch */}
            <div
              role="group"
              aria-label="Ansichtsmodus"
              className="hidden md:flex rounded-xl bg-hbs-bg border border-hbs-slate-border p-0.5 text-xs font-bold"
            >
              {(
                [
                  [false, 'Einfach'],
                  [true, 'Erweitert'],
                ] as const
              ).map(([isExp, label]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={store.expert === isExp}
                  onClick={() => store.setExpert(isExp)}
                  className={`min-h-[34px] rounded-lg px-2.5 transition-colors ${
                    store.expert === isExp
                      ? 'bg-white text-hbs-blue shadow-xs'
                      : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                type="button"
                aria-label="Menü öffnen"
                onClick={() => setMenuOpen((v) => !v)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-hbs-blue-soft hover:text-hbs-blue"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-hbs-slate-border bg-white p-1.5 shadow-hbs-modal space-y-0.5">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="block text-[10px] font-bold uppercase text-hbs-slate-muted">
                        Angemeldet als
                      </span>
                      <span className="block text-xs font-black text-hbs-slate-dark truncate">
                        {authorName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        store.setExpert(!store.expert);
                      }}
                      className="md:hidden w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-hbs-blue" />
                      <span>{store.expert ? 'Einfache Ansicht' : 'Erweiterte Ansicht'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setClassModal({
                          mode: 'create',
                          name: '',
                          classLabel: '',
                          roleType: 'klassenleitung',
                          subject: 'Klassenraum',
                          roomLabel: '',
                        });
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <FolderPlus className="w-4 h-4 text-hbs-blue" />
                      <span>Neue Klasse / Fachplan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setClassModal({
                          mode: 'rename',
                          name: cls.name,
                          classLabel: cls.classLabel || cls.name,
                          roleType: cls.roleType || 'klassenleitung',
                          subject: cls.subject || 'Klassenraum',
                          roomLabel: cls.roomLabel || '',
                        });
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4 text-hbs-slate-muted" />
                      <span>Klasse / Fach bearbeiten</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        store.addDemoClass();
                        notify('Beispielklasse 4b hinzugefügt.', 'success');
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-hbs-teal" />
                      <span>Beispielklasse hinzufügen</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        exportBackupJson();
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-hbs-blue" />
                      <span>Alle Daten sichern (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-hbs-slate-dark hover:bg-hbs-blue-soft flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-hbs-blue" />
                      <span>Sicherung importieren</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteClassConfirm(true);
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Klasse löschen</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {!store.hydrated ? (
          <div className="flex h-full items-center justify-center text-sm font-bold text-hbs-slate-muted">
            Lade gespeicherte Sitzpläne …
          </div>
        ) : activeTab === 'raum' ? (
          <RoomEditorView
            cls={cls}
            expert={store.expert}
            roomTemplates={store.roomTemplates}
            onUpdateRoom={store.updateRoom}
            onUpsertTable={store.upsertTable}
            onRemoveTable={store.removeTable}
            onUpsertFixture={store.upsertFixture}
            onRemoveFixture={store.removeFixture}
            onSaveRoomTemplate={store.saveRoomTemplate}
            onRemoveRoomTemplate={store.removeRoomTemplate}
            onNotify={notify}
          />
        ) : activeTab === 'kinder' ? (
          <StudentsView
            cls={cls}
            expert={store.expert}
            onUpsertStudent={store.upsertStudent}
            onAddStudentsBulk={store.addStudentsBulk}
            onRemoveStudent={store.removeStudent}
            onRestoreClass={store.restoreClassSnapshot}
            onNotify={notify}
          />
        ) : activeTab === 'beziehungen' ? (
          <RelationsView
            cls={cls}
            expert={store.expert}
            onSetRelation={store.setRelation}
            onGoToStudents={() => setActiveTab('kinder')}
          />
        ) : activeTab === 'sitzplan' ? (
          <SeatingPlanView
            cls={cls}
            expert={store.expert}
            authorName={authorName}
            onUpsertPlan={store.upsertPlan}
            onRemovePlan={store.removePlan}
            onSetActivePlan={store.setActivePlan}
            onRestorePlans={(plans, activePlanId) =>
              store.restoreClassSnapshot({ ...cls, plans, activePlanId })
            }
            onPublishPlan={store.publishPlanForColleagues}
            onUnpublishPlan={store.unpublishActivePlan}
            onGoToRoom={() => setActiveTab('raum')}
            onGoToStudents={() => setActiveTab('kinder')}
            onNotify={notify}
          />
        ) : (
          <SharedPlansView
            plans={store.sharedPlans}
            loading={store.sharedLoading}
            error={store.sharedError}
            currentAuthorId={authorId}
            onRefresh={store.refreshSharedPlans}
            onCopyToMyClasses={(shared) => {
              store.copySharedPlanToMyClasses(shared);
              setActiveTab('sitzplan');
              notify(`Sitzplan „${shared.classLabel}“ als eigenen Entwurf übernommen.`, 'success');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Sitzplan Navigation"
        className="grid shrink-0 grid-cols-5 border-t border-hbs-slate-border bg-white md:hidden"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[10.5px] font-bold transition-colors ${
                active ? 'bg-hbs-blue-light text-hbs-blue' : 'text-hbs-slate-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.mobileLabel}</span>
              {tab.id === 'freigegeben' && store.sharedPlans.length > 0 && (
                <span className="absolute right-2 top-1.5 rounded-full bg-hbs-teal px-1 text-[9px] font-black text-white">
                  {store.sharedPlans.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hidden File Input for JSON Import */}
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportJson(file);
          e.target.value = '';
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-xs sm:text-sm font-bold shadow-hbs-modal ${
            toast.tone === 'warn'
              ? 'bg-hbs-amber-light border-hbs-amber text-hbs-amber-dark'
              : toast.tone === 'success'
                ? 'bg-hbs-teal-light border-hbs-teal text-hbs-teal-deep'
                : 'bg-hbs-slate-dark border-hbs-slate text-white'
          }`}
        >
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
              className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-black underline"
            >
              Rückgängig
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      {classModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs"
          onClick={() => setClassModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmedName = classModal.name.trim() || classModal.classLabel.trim();
              if (!trimmedName) return;
              if (classModal.mode === 'create') {
                store.addClass({
                  name: trimmedName,
                  classLabel: classModal.classLabel.trim() || trimmedName,
                  roleType: classModal.roleType,
                  subject: classModal.subject.trim() || 'Klassenraum',
                  roomLabel: classModal.roomLabel.trim() || undefined,
                });
              } else {
                store.renameClass(trimmedName, {
                  classLabel: classModal.classLabel.trim() || trimmedName,
                  roleType: classModal.roleType,
                  subject: classModal.subject.trim() || 'Klassenraum',
                  roomLabel: classModal.roomLabel.trim() || undefined,
                });
              }
              setClassModal(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-hbs-slate-border bg-white p-5 sm:p-6 shadow-hbs-modal space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-hbs-slate-dark">
                {classModal.mode === 'create'
                  ? 'Neue Klasse / Fachplan anlegen'
                  : 'Klasse / Fachplan bearbeiten'}
              </h3>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setClassModal(null)}
                className="min-h-[40px] min-w-[40px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Anzeigename (z. B. Klasse 7a oder 7a Chemie)
                </label>
                <input
                  autoFocus
                  required
                  value={classModal.name}
                  onChange={(e) =>
                    setClassModal((m) =>
                      m
                        ? {
                            ...m,
                            name: e.target.value,
                            classLabel:
                              m.mode === 'create' && !m.classLabel
                                ? e.target.value
                                : m.classLabel,
                          }
                        : m
                    )
                  }
                  placeholder="z. B. Klasse 7a"
                  className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                    Klasse (Gruppierung)
                  </label>
                  <input
                    value={classModal.classLabel}
                    onChange={(e) =>
                      setClassModal((m) => (m ? { ...m, classLabel: e.target.value } : m))
                    }
                    placeholder="z. B. 7a"
                    className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                    Funktion
                  </label>
                  <select
                    value={classModal.roleType}
                    onChange={(e) => {
                      const role = e.target.value as PlanRoleType;
                      setClassModal((m) =>
                        m
                          ? {
                              ...m,
                              roleType: role,
                              subject:
                                role === 'klassenleitung'
                                  ? 'Klassenraum'
                                  : m.subject === 'Klassenraum'
                                    ? 'Chemie'
                                    : m.subject,
                            }
                          : m
                      );
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-bold bg-white"
                  >
                    <option value="klassenleitung">Klassenleitung</option>
                    <option value="fachlehrer">Fachlehrer</option>
                  </select>
                </div>
              </div>

              {classModal.roleType === 'fachlehrer' && (
                <div>
                  <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                    Fach / Fachraum
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {FACHRAUM_SUBJECTS.filter((s) => s !== 'Klassenraum').map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() =>
                          setClassModal((m) => (m ? { ...m, subject: subj } : m))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          classModal.subject === subj
                            ? 'bg-hbs-blue text-white border-hbs-blue'
                            : 'bg-hbs-bg text-hbs-slate border-hbs-slate-border'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                  <input
                    value={classModal.subject}
                    onChange={(e) =>
                      setClassModal((m) => (m ? { ...m, subject: e.target.value } : m))
                    }
                    placeholder="Fach eingeben…"
                    className="w-full min-h-[40px] rounded-xl border border-hbs-slate-border px-3 text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-hbs-slate-dark mb-1">
                  Raumbezeichnung (optional)
                </label>
                <input
                  value={classModal.roomLabel}
                  onChange={(e) =>
                    setClassModal((m) => (m ? { ...m, roomLabel: e.target.value } : m))
                  }
                  placeholder="z. B. Raum 204 oder Physiksaal"
                  className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassModal(null)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!classModal.name.trim() && !classModal.classLabel.trim()}
                className="min-h-[44px] px-5 rounded-xl bg-hbs-blue text-white text-sm font-bold hover:bg-hbs-blue-deep disabled:opacity-50"
              >
                {classModal.mode === 'create' ? 'Anlegen' : 'Speichern'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Class Confirm */}
      {deleteClassConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4">
            <p className="text-sm font-bold text-hbs-slate-dark">
              „{cls.name}“ wirklich löschen?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteClassConfirm(false)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteClassConfirm(false);
                  store.deleteClass();
                  notify('Klasse gelöscht.', 'info');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
