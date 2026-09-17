import React, { useState } from 'react';
import { 
  Plus, 
  Play, 
  Copy, 
  Trash2, 
  Share2, 
  Search, 
  Layers, 
  ArrowLeft,
  Users,
  Target,
  Zap,
  HelpCircle,
  Layout,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OncooSession, OncooToolType } from '../../types/oncooTypes';

interface OncooDashboardProps {
  onBackToPortal: () => void;
  onStartSession: (session: OncooSession) => void;
}

const TOOL_CONFIG: Record<OncooToolType, {
  label: string;
  shortDesc: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
  pedagogicalTip: string;
}> = {
  kartenabfrage: {
    label: 'Kartenabfrage',
    shortDesc: 'Digitale Pinnwand zur Ideensammlung, zum Clustern und Strukturieren von Begriffen.',
    badge: 'Brainstorming & Moderation',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Layers,
    gradient: 'from-amber-500 to-orange-600',
    border: 'hover:border-amber-400',
    pedagogicalTip: 'Schüler senden farbige Kärtchen per Smartphone. Die Lehrkraft sortiert sie am Smartboard in Spalten und Clustern.'
  },
  zielscheibe: {
    label: 'Zielscheibe',
    shortDesc: 'Blitzschnelle visuelle Reflexion & Selbstevaluation mit konzentrischen Ringen.',
    badge: 'Feedback & Reflexion',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: Target,
    gradient: 'from-emerald-600 to-teal-700',
    border: 'hover:border-emerald-400',
    pedagogicalTip: 'Schüler setzen anonym Klebepunkte auf 2–8 Bewertungsachsen (1–5 Ringe). Zeigt sofort Trefferwolken und Mittelwerte.'
  },
  lerntempoduett: {
    label: 'Lerntempoduett',
    shortDesc: 'Organisiert die Partnerfindung nach individuellen Arbeitsphasen nach Klippert.',
    badge: 'Kooperative Partnerprüfung',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: Zap,
    gradient: 'from-blue-600 to-indigo-700',
    border: 'hover:border-blue-400',
    pedagogicalTip: 'Schüler melden sich per Klick als fertig. Das Tool koppelt sie sofort in der Reihenfolge der Fertigstellung als Tandem.'
  },
  helfersystem: {
    label: 'Helfersystem',
    shortDesc: 'Hilfebörse für den differenzierten Unterricht: Schüler helfen Schülern (Peer-Teaching).',
    badge: 'Peer-Assistance',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: HelpCircle,
    gradient: 'from-purple-600 to-pink-700',
    border: 'hover:border-purple-400',
    pedagogicalTip: 'Schüler fordern Hilfe für bestimmte Aufgaben an oder bieten ihre Hilfe an. Fördert Selbstständigkeit und Entlastung.'
  },
  placemat: {
    label: 'Placemat (4-Felder)',
    shortDesc: 'Think-Pair-Share Gruppenkooperation mit Außenfeldern und zentralem Konsensfeld.',
    badge: 'Think-Pair-Share',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: Layout,
    gradient: 'from-rose-600 to-red-700',
    border: 'hover:border-rose-400',
    pedagogicalTip: 'Jedes Gruppenmitglied formuliert eigene Gedanken im Außenfeld. Anschließend wird in der Mitte das Gruppenergebnis vereinbart.'
  }
};

const SUBJECTS = [
  'Alle Fächer',
  'Fächerübergreifend',
  'Mathematik',
  'Deutsch',
  'Englisch',
  'Biologie',
  'Physik',
  'Chemie',
  'Geschichte',
  'Geografie',
  'Wirtschaft / Recht',
  'Ethik / Medien',
  'Kunst',
  'Musik',
  'Sport'
];

export const OncooDashboard: React.FC<OncooDashboardProps> = ({
  onBackToPortal,
  onStartSession
}) => {
  const { 
    oncooSessions, 
    currentUser, 
    isAdmin, 
    saveOncooSession, 
    deleteOncooSession, 
    toggleShareOncooSession, 
    duplicateOncooSession 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'mine' | 'school' | 'templates'>('mine');
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('Alle Fächer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal for creating a new session
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newToolType, setNewToolType] = useState<OncooToolType>('kartenabfrage');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Fächerübergreifend');
  const [newGrade, setNewGrade] = useState<string>('Klasse 7–10');
  const [newQuestion, setNewQuestion] = useState<string>('');

  // My Sessions vs School Sessions
  const mySessions = oncooSessions.filter(
    s => currentUser && (s.authorId === currentUser.id || s.authorId === 'guest')
  );

  const schoolSessions = oncooSessions.filter(
    s => s.isShared && (!currentUser || s.authorId !== currentUser.id)
  );

  const displayList = activeTab === 'mine' ? mySessions : schoolSessions;

  const filteredSessions = displayList.filter(s => {
    const matchesTool = selectedToolFilter === 'all' || s.toolType === selectedToolFilter;
    const matchesSubject = selectedSubject === 'Alle Fächer' || s.subject === selectedSubject;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      s.title.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.authorName && s.authorName.toLowerCase().includes(q));
    return matchesTool && matchesSubject && matchesSearch;
  });

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const newSession: OncooSession = {
      id: `oncoo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      toolType: newToolType,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      subject: newSubject,
      grade: newGrade,
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Kollege',
      isShared: false,
      pinCode: pin,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
    };

    // Initialize tool-specific defaults
    if (newToolType === 'kartenabfrage') {
      newSession.kartenabfrage = {
        question: newQuestion.trim() || 'Welche Gedanken oder Fragen hast du zu diesem Thema?',
        columns: [
          { id: 'col-1', title: 'Ideen & Vorschläge', color: 'yellow' },
          { id: 'col-2', title: 'Fragen & Unklarheiten', color: 'blue' },
          { id: 'col-3', title: 'Wichtige Argumente', color: 'green' },
        ],
        cards: [],
        allowMultipleCards: true,
        maxCardsPerStudent: 3,
        showAuthor: true,
        allowLikes: true
      };
    } else if (newToolType === 'zielscheibe') {
      newSession.zielscheibe = {
        title: newQuestion.trim() || newTitle.trim(),
        rings: 5,
        minLabel: '1 = Trifft nicht zu',
        maxLabel: '5 = Trifft voll zu',
        criteria: [
          { id: 'c-1', label: 'Verständlichkeit', description: 'Waren die Erklärungen und Aufgaben verständlich?' },
          { id: 'c-2', label: 'Arbeitstempo', description: 'War das Tempo angemessen?' },
          { id: 'c-3', label: 'Mitarbeit & Team', description: 'Hat die Zusammenarbeit gut funktioniert?' },
          { id: 'c-4', label: 'Lernzuwachs', description: 'Hast du heute Neues gelernt?' },
        ],
        votes: []
      };
    } else if (newToolType === 'lerntempoduett') {
      newSession.lerntempoduett = {
        taskTitle: newQuestion.trim() || 'Aufgaben im Buch / auf dem Arbeitsblatt bearbeiten',
        currentPhase: 1,
        phases: [
          { phaseNumber: 1, title: 'Einzelarbeitsphase', description: 'Jeder bearbeitet die Aufgaben eigenständig im Heft.' },
          { phaseNumber: 2, title: 'Tandem-Vergleich', description: 'Lösungen vergleichen, Unklarheiten klären und Fehler korrigieren.' },
          { phaseNumber: 3, title: 'Experten- & Weiterarbeit', description: 'Gemeinsame Vertiefungsaufgabe bearbeiten.' }
        ],
        waitingQueue: [],
        pairs: []
      };
    } else if (newToolType === 'helfersystem') {
      newSession.helfersystem = {
        exerciseTitle: newQuestion.trim() || newTitle.trim(),
        topics: [
          'Aufgabe 1 (Grundlagen)',
          'Aufgabe 2 (Anwendung)',
          'Aufgabe 3 (Transfer & Vertiefung)',
          'Allgemeine Fragen'
        ],
        items: []
      };
    } else if (newToolType === 'placemat') {
      newSession.placemat = {
        topic: newQuestion.trim() || newTitle.trim(),
        groups: [
          {
            id: 'g-1',
            groupName: 'Tisch 1',
            phase: 'think',
            cornerA: { author: 'Schüler A (Norden)', notes: [] },
            cornerB: { author: 'Schüler B (Osten)', notes: [] },
            cornerC: { author: 'Schüler C (Süden)', notes: [] },
            cornerD: { author: 'Schüler D (Westen)', notes: [] },
            consensus: ''
          },
          {
            id: 'g-2',
            groupName: 'Tisch 2',
            phase: 'think',
            cornerA: { author: 'Schüler A (Norden)', notes: [] },
            cornerB: { author: 'Schüler B (Osten)', notes: [] },
            cornerC: { author: 'Schüler C (Süden)', notes: [] },
            cornerD: { author: 'Schüler D (Westen)', notes: [] },
            consensus: ''
          }
        ]
      };
    }

    const saved = await saveOncooSession(newSession);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewQuestion('');
    onStartSession(saved);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2 text-xs font-bold"
              title="Zurück zum Schul-Portal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Schul-Portal</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  <span>HBS Oncoo</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Kooperatives Lernen
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Kartenabfrage • Zielscheibe • Lerntempoduett • Helfersystem • Placemat
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewToolType('kartenabfrage');
                setIsCreateModalOpen(true);
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Neue Sitzung</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* HERO BANNER: The 5 Cooperative Learning Methods */}
        <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-300 text-xs font-bold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Didaktischer Werkzeugkasten für Heimbürgeschule Kahla</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kooperative Lernformen digital im Unterricht anwenden
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Schülerinnen und Schüler treten ohne Login mit einem 6-stelligen PIN-Code oder QR-Code bei. 
              Alle Vorlagen und Ergebnisse bleiben in Ihrem Lehrerprofil gespeichert und können für Kolleginnen und Kollegen freigegeben werden.
            </p>
          </div>

          {/* Quick Launch Cards for all 5 Tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
            {(Object.keys(TOOL_CONFIG) as OncooToolType[]).map((type) => {
              const cfg = TOOL_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setNewToolType(type);
                    setNewTitle(`${cfg.label}: Neuer Entwurf`);
                    setIsCreateModalOpen(true);
                  }}
                  className="group text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} text-white flex items-center justify-center mb-2 shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white block group-hover:text-rose-300 transition-colors">
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                      {cfg.shortDesc}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-300">
                    <span>Starten</span>
                    <Play className="w-3 h-3 fill-current" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs (Meine Sitzungen vs Schulweite Vorlagen) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'mine'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Meine Vorlagen ({mySessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'school'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Schulweite Vorlagen ({schoolSessions.length})</span>
            </button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tool Filter */}
            <select
              value={selectedToolFilter}
              onChange={(e) => setSelectedToolFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="all">Alle Methoden</option>
              <option value="kartenabfrage">Kartenabfrage</option>
              <option value="zielscheibe">Zielscheibe</option>
              <option value="lerntempoduett">Lerntempoduett</option>
              <option value="helfersystem">Helfersystem</option>
              <option value="placemat">Placemat</option>
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* SESSIONS LIST */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Keine Sitzungen gefunden</h3>
            <p className="text-xs text-slate-500 mt-1">
              Erstelle eine neue Sitzung oder wähle oben eines der fünf Werkzeuge aus.
            </p>
            <button
              onClick={() => {
                setNewToolType('kartenabfrage');
                setIsCreateModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Jetzt Sitzung erstellen</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const cfg = TOOL_CONFIG[session.toolType] || TOOL_CONFIG.kartenabfrage;
              const Icon = cfg.icon;
              const isOwner = currentUser && (session.authorId === currentUser.id || session.authorId === 'guest');

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${cfg.border}`}
                >
                  <div>
                    {/* Header: Icon, Badge & Action Menu */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.gradient} text-white flex items-center justify-center shadow-sm shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeColor}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            PIN: <strong className="text-slate-700 font-mono tracking-wider">{session.pinCode}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Share toggle */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => toggleShareOncooSession(session.id)}
                          className={`p-1.5 rounded-xl border text-xs transition-all ${
                            session.isShared
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
                          }`}
                          title={session.isShared ? 'Mit Kollegium geteilt (Klick zum Aufheben)' : 'Für Kollegium freigeben'}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-base font-black text-slate-900 leading-snug tracking-tight mb-1">
                      {session.title}
                    </h4>
                    {session.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {session.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 mb-4">
                      {session.subject && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {session.subject}
                        </span>
                      )}
                      {session.grade && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {session.grade}
                        </span>
                      )}
                      <span className="text-slate-400 text-[10px]">
                        von {session.authorName}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onStartSession(session)}
                      className={`flex-1 py-2 px-3 rounded-xl bg-gradient-to-r ${cfg.gradient} hover:opacity-95 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Sitzung öffnen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateOncooSession(session.id)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all"
                      title="Sitzung duplizieren"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {(isOwner || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Möchtest du "${session.title}" wirklich löschen?`)) {
                            deleteOncooSession(session.id);
                          }
                        }}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                        title="Sitzung löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* CREATE NEW SESSION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Neue Oncoo-Sitzung anlegen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              
              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kooperative Lernmethode wählen
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(TOOL_CONFIG) as OncooToolType[]).map((t) => {
                    const cfg = TOOL_CONFIG[t];
                    const isSel = newToolType === t;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewToolType(t)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                          isSel
                            ? 'bg-rose-50 border-rose-500 text-rose-950 font-black shadow-xs ring-1 ring-rose-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span className="text-xs leading-tight">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  ℹ️ <strong>Didaktischer Tipp:</strong> {TOOL_CONFIG[newToolType].pedagogicalTip}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thema / Titel der Sitzung *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="z. B. Brainstorming: Klimawandel in Thüringen"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Question / Central Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Zentrale Fragestellung / Arbeitsauftrag für die Schüler
                </label>
                <textarea
                  rows={2}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="z. B. Welche Ursachen und Folgen seht ihr in unserem Alltag?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Subject & Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Schulfach
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-rose-500"
                  >
                    {SUBJECTS.filter(s => s !== 'Alle Fächer').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Klassenstufe
                  </label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="z. B. Klasse 8b"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  Sitzung anlegen & starten
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
