import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Eye,
  Monitor,
  Download,
  WifiOff,
  Layers,
  MousePointerClick,
  Wand2,
  Lightbulb,
  AlertTriangle,
  Server,
  ShieldCheck,
  Puzzle,
  Check,
  Copy,
  ChevronRight,
  Route,
  Lock,
  SlidersHorizontal,
  RefreshCw,
  LayoutGrid,
  Dices,
  HelpCircle,
  ListChecks,
  Users,
  Clock,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import {
  EDITOR_TEMPLATES,
  GOAL_OPTIONS,
  GoalId,
  PHASE_LABELS,
  PhaseId,
  PROMPT_FORMATS,
  PromptFormat,
  REGELSCHULE_GRADE_GROUPS,
  THURINGIA_REGELSCHULE_SUBJECTS,
  buildPrompt,
} from './htmlWerkstattData';
import {
  DemoChecklist,
  DemoEscape,
  DemoGenerator,
  DemoGeschichte,
  DemoId,
  DemoKarten,
  DemoQuiz,
  DemoSchritte,
  DemoSimulation,
  DemoTimer,
  DemoZufall,
  DemoZuordnen,
} from './HtmlWerkstattDemos';

interface HtmlWerkstattPageProps {
  onBackToPortal: () => void;
  onOpenStorage?: () => void;
}

interface DemoCardConfig {
  id: DemoId;
  phase: Exclude<PhaseId, 'alle'>;
  kicker: string;
  title: string;
  description: string;
  classroomTip: string;
  classroomTipLabel?: string;
  promptLabel: string;
  accent: 'blue' | 'teal' | 'amber';
  wide?: boolean;
  icon: React.ElementType;
  render: (onTried: (id: DemoId) => void) => React.ReactNode;
}

const TRIED_STORAGE_KEY = 'hbs_html_werkstatt_tried_v1';

const DEMO_CARDS: DemoCardConfig[] = [
  {
    id: 'geschichte',
    phase: 'einstieg',
    kicker: 'Einstieg · Geschichte Kl. 6',
    title: 'Entscheidungsgeschichte',
    description:
      'Die Lernenden treffen Entscheidungen und erleben die Folgen. Am Ende steht der Fachbegriff, um den es in der Stunde geht.',
    classroomTip:
      'Die Klasse spielt die Geschichte am Smartboard gemeinsam durch und stimmt bei jeder Entscheidung ab. Danach vergleicht ihr, welche Wege zu welchem Ausgang geführt haben.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'blue',
    icon: Route,
    render: (onTried) => <DemoGeschichte onTried={onTried} />,
  },
  {
    id: 'escape',
    phase: 'einstieg',
    kicker: 'Einstieg · Mathematik Kl. 7',
    title: 'Escape-Rätsel mit Zahlenschloss',
    description:
      'Drei Aufgaben ergeben drei Ziffern, und erst der richtige Code öffnet die Truhe. Bei einem falschen Code sagt das Schloss, wie viele Ziffern schon stimmen.',
    classroomTip:
      'Mehrere Schlösser hintereinander ergeben einen kleinen Escape-Room. Die Gruppen arbeiten auf ihren Schul-iPads, und wer die letzte Truhe öffnet, erhält das Lösungswort.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'blue',
    icon: Lock,
    render: (onTried) => <DemoEscape onTried={onTried} />,
  },
  {
    id: 'simulation',
    phase: 'erarbeitung',
    kicker: 'Erarbeitung · Mathematik & Wirtschaft/Recht Kl. 8–10',
    title: 'Simulation mit Schiebereglern',
    description:
      'Die Lernenden verändern Sparrate, Zinssatz und Laufzeit und sehen sofort, wie stark der Zinseszins über die Jahre wirkt. Ein statisches Schaubild im Buch kann das nicht.',
    classroomTip:
      'Gib der Klasse einen Forscherauftrag wie „Findet heraus, ab welchem Jahr die Zinsen höher sind als das selbst eingezahlte Geld“ und lass die Jugendlichen mit den Reglern experimentieren.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'teal',
    wide: true,
    icon: SlidersHorizontal,
    render: (onTried) => <DemoSimulation onTried={onTried} />,
  },
  {
    id: 'schritte',
    phase: 'erarbeitung',
    kicker: 'Erarbeitung · MNT / Geografie Kl. 5–6',
    title: 'Schaubild, das Schritt für Schritt entsteht',
    description:
      'Bei jedem Klick kommt ein neuer Pfeil ins Bild, und darunter steht ein Satz, der genau diesen Schritt erklärt. So entsteht der Wasserkreislauf vor den Augen der Klasse.',
    classroomTip:
      'Bevor du auf „Weiter“ klickst, fragst du die Klasse, welcher Schritt als Nächstes kommt. Das Schaubild liefert danach direkt die visuelle Auflösung am Smartboard.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'teal',
    icon: RefreshCw,
    render: (onTried) => <DemoSchritte onTried={onTried} />,
  },
  {
    id: 'zuordnen',
    phase: 'uebung',
    kicker: 'Übung · Deutsch Kl. 5–6',
    title: 'Zuordnen per Ziehen oder Antippen',
    description:
      'Ordne die Wörter der richtigen Wortart zu. Am Rechner ziehst du die Begriffe mit der Maus, auf dem iPad tippst du erst das Wort und dann die Kategorie an.',
    classroomTip:
      'Zuordnungen funktionieren in jedem Fach – etwa historische Epochen in Geschichte, Wirbeltierklassen in Biologie oder Stoffeigenschaften in Chemie.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'blue',
    icon: LayoutGrid,
    render: (onTried) => <DemoZuordnen onTried={onTried} />,
  },
  {
    id: 'karten',
    phase: 'uebung',
    kicker: 'Übung · Englisch Kl. 6–8',
    title: 'Lernkarten zum Umdrehen',
    description:
      'Tippe auf die Karte, um sie umzudrehen. Karten, die du noch nicht sicher kannst, wandern wieder nach hinten, bis alle sitzen.',
    classroomTip:
      'Lernkarten eignen sich für unregelmäßige Verben, Fachbegriffe, physikalische Einheiten und Geschichtsdaten – ideal auch zum Üben auf dem iPad oder Smartphone zu Hause.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'blue',
    icon: Layers,
    render: (onTried) => <DemoKarten onTried={onTried} />,
  },
  {
    id: 'generator',
    phase: 'uebung',
    kicker: 'Übung · Mathematik Kl. 7–9',
    title: 'Aufgabengenerator ohne Ende',
    description:
      'Jeder Klick erzeugt eine neue Prozentaufgabe mit anderen Zahlen. Bei einem Fehler zeigt die Seite den Rechenweg, und der Zähler hält die Serie fest.',
    classroomTip:
      'Ein Generator ersetzt zehn Arbeitsblätter, weil jede Schülerin und jeder Schüler eigene Zahlen bekommt – Abschreiben vom Nachbartisch lohnt sich nicht mehr.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'blue',
    icon: Dices,
    render: (onTried) => <DemoGenerator onTried={onTried} />,
  },
  {
    id: 'quiz',
    phase: 'sicherung',
    kicker: 'Sicherung · Wirtschaft und Recht Kl. 8–9',
    title: 'Quiz mit Erklärung nach jeder Antwort',
    description:
      'Nach jeder Antwort erfahren die Lernenden sofort, warum sie richtig oder falsch lagen. So lernen sie direkt aus dem Fehler, solange die Frage noch frisch ist.',
    classroomTip:
      'Das Quiz eignet sich für die letzten zehn Minuten einer Stunde oder zur selbstständigen Wiederholung mit kurzem Ergebnis-Screenshot als Nachweis.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'teal',
    icon: HelpCircle,
    render: (onTried) => <DemoQuiz onTried={onTried} />,
  },
  {
    id: 'check',
    phase: 'sicherung',
    kicker: 'Sicherung · Mathematik Kl. 7–8',
    title: 'Lerncheckliste vor der Klassenarbeit',
    description:
      'Die Lernenden schätzen sich zur Prozentrechnung selbst ein und bekommen zu jedem unsicheren Punkt einen konkreten Übungstipp. Die Auswahl bleibt im Browser gespeichert.',
    classroomTip:
      'Gib die Checkliste eine Woche vor der Klassenarbeit aus. Die Schülerinnen und Schüler sehen sofort, was sie noch üben müssen, und bringen gezielte Fragen mit.',
    promptLabel: 'Prompt für dein eigenes Thema',
    accent: 'teal',
    icon: ListChecks,
    render: (onTried) => <DemoChecklist onTried={onTried} />,
  },
  {
    id: 'zufall',
    phase: 'orga',
    kicker: 'Organisation · alle Fächer',
    title: 'Zufallsauswahl und Gruppen',
    description:
      'Die Seite zieht einen Namen, ohne dass jemand doppelt drankommt, oder teilt die ganze Liste fair in Gruppen ein. Namen können beliebig angepasst werden.',
    classroomTipLabel: 'Datenschutz:',
    classroomTip:
      'Die Namen bleiben ausschließlich im Browser. Die Seite schickt nichts an einen Server, und beim Schließen ist alles wieder weg.',
    promptLabel: 'Prompt für dein eigenes Werkzeug',
    accent: 'amber',
    icon: Users,
    render: (onTried) => <DemoZufall onTried={onTried} />,
  },
  {
    id: 'timer',
    phase: 'orga',
    kicker: 'Organisation · alle Fächer',
    title: 'Timer für Arbeitsphasen',
    description:
      'Ein großer Timer zeigt am Smartboard mit einem Fortschrittsring, wie viel Zeit noch bleibt, und gibt am Ende ein kurzes Tonsignal aus.',
    classroomTip:
      'Ein gut sichtbarer Timer beantwortet die Frage „Wie lange haben wir noch?“, bevor sie gestellt wird – perfekt für Partner- und Gruppenarbeitsphasen.',
    promptLabel: 'Prompt für dein eigenes Werkzeug',
    accent: 'amber',
    icon: Clock,
    render: (onTried) => <DemoTimer onTried={onTried} />,
  },
];

const ACCENT_STYLES = {
  blue: {
    kicker: 'text-hbs-blue',
    iconBox: 'bg-hbs-blue-light text-hbs-blue border-hbs-blue/20',
    topLine: 'border-t-hbs-blue',
  },
  teal: {
    kicker: 'text-hbs-teal-deep',
    iconBox: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/20',
    topLine: 'border-t-hbs-teal',
  },
  amber: {
    kicker: 'text-hbs-amber-dark',
    iconBox: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
    topLine: 'border-t-hbs-amber',
  },
};

function CopyPromptButton({ text, primary = false }: { text: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
        copied
          ? 'bg-hbs-teal text-white'
          : primary
          ? 'bg-hbs-blue hover:bg-hbs-blue-deep text-white shadow-xs'
          : 'bg-white hover:bg-hbs-blue-soft text-hbs-slate-dark border border-hbs-slate-border'
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      <span>{copied ? 'Prompt kopiert!' : 'Prompt kopieren'}</span>
    </button>
  );
}

export const HtmlWerkstattPage: React.FC<HtmlWerkstattPageProps> = ({
  onBackToPortal,
  onOpenStorage,
}) => {
  // Progress tracking
  const [triedIds, setTriedIds] = useState<DemoId[]>(() => {
    try {
      const raw = localStorage.getItem(TRIED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const markTried = (id: DemoId) => {
    setTriedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(TRIED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Live HTML Editor state
  const [activeTplId, setActiveTplId] = useState<string>(EDITOR_TEMPLATES[0].id);
  const [editorCode, setEditorCode] = useState<string>(EDITOR_TEMPLATES[0].code);

  const selectTemplate = (id: string) => {
    const found = EDITOR_TEMPLATES.find((t) => t.id === id);
    if (!found) return;
    setActiveTplId(found.id);
    setEditorCode(found.code);
  };

  const handleDownloadSandboxHtml = () => {
    const fullDoc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meine HTML-Übung · HBS Kahla</title>
  <style>
    body { font-family: "Plus Jakarta Sans", system-ui, sans-serif; color: #091D2E; background: #F8FBFC; padding: 2rem; line-height: 1.6; max-width: 780px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; background: #fff; }
    th, td { border: 1px solid #D1E4FB; padding: 8px 12px; text-align: left; }
    th { background: #E6F4F8; }
    summary { cursor: pointer; font-weight: 700; color: #0B7BA7; }
  </style>
</head>
<body>
${editorCode}
</body>
</html>`;
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meine-hbs-uebung.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Phase filter
  const [phaseFilter, setPhaseFilter] = useState<PhaseId>('alle');
  const [highlightedDemo, setHighlightedDemo] = useState<string | null>(null);

  const filteredDemos = useMemo(
    () =>
      phaseFilter === 'alle'
        ? DEMO_CARDS
        : DEMO_CARDS.filter((c) => c.phase === phaseFilter),
    [phaseFilter]
  );

  // Ideen-Finder state (Regelschule Thüringen)
  const [finderSubject, setFinderSubject] = useState<string>('Geschichte');
  const [finderTopic, setFinderTopic] = useState<string>('Das Alte Ägypten und der Nil');
  const [topicTouched, setTopicTouched] = useState<boolean>(false);
  const [finderGrade, setFinderGrade] = useState<string>(REGELSCHULE_GRADE_GROUPS[1].value);
  const [finderGoal, setFinderGoal] = useState<GoalId>('uebung');

  const handleSubjectChange = (val: string) => {
    setFinderSubject(val);
    if (!topicTouched || !finderTopic.trim()) {
      const subj = THURINGIA_REGELSCHULE_SUBJECTS.find((s) => s.value === val);
      setFinderTopic(subj?.exampleTopic || '');
      setTopicTouched(false);
    }
  };

  const matchingFormats = useMemo(() => {
    return (Object.values(PROMPT_FORMATS) as PromptFormat[]).filter((f) => f.phase === finderGoal);
  }, [finderGoal]);

  const gradePromptLabel =
    REGELSCHULE_GRADE_GROUPS.find((g) => g.value === finderGrade)?.promptText ||
    'eine Klasse der Thüringer Regelschule';

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const jumpToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpToDemo = (demoId: DemoId) => {
    setPhaseFilter('alle');
    setTimeout(() => {
      const el = document.getElementById(`demo-${demoId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedDemo(demoId);
      setTimeout(() => setHighlightedDemo(null), 1800);
    }, 60);
  };

  const progressPct = Math.round((triedIds.length / DEMO_CARDS.length) * 100);

  const iframeSrcDoc = useMemo(() => {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
      body { font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif; color: #091D2E; line-height: 1.6; font-size: 15px; margin: 0; padding: 4px; }
      h1 { font-size: 1.45rem; font-weight: 800; margin: 0 0 0.5rem; color: #091D2E; }
      h2 { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem; color: #091D2E; }
      p { margin: 0 0 0.75rem; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #D1E4FB; padding: 8px 10px; text-align: left; }
      th { background: #E6F4F8; color: #006185; }
      summary { cursor: pointer; font-weight: 700; color: #0B7BA7; }
    </style></head><body>${editorCode}</body></html>`;
  }, [editorCode]);

  return (
    <div ref={scrollContainerRef} className="min-h-screen bg-hbs-bg text-hbs-slate flex flex-col">
      {/* ==================== STICKY HBS HEADER ==================== */}
      <header className="bg-white/95 border-b border-hbs-slate-border/70 sticky top-0 z-40 backdrop-blur-md w-full">
        <div className="w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-hbs-blue-soft p-1 sm:p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0 bg-white">
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
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal-deep bg-hbs-teal-light px-2 py-0.5 rounded-full border border-hbs-teal/20">
                  <Sparkles className="w-3 h-3" /> Kollegiums-Werkstatt
                </span>
              </div>
              <h1 className="text-sm sm:text-lg font-black text-hbs-slate-dark tracking-tight truncate">
                HTML-Werkstatt für Lehrkräfte
              </h1>
            </div>
          </div>

          {/* Section Jump Nav (Desktop) */}
          <nav aria-label="Bereiche der HTML-Werkstatt" className="hidden xl:flex items-center gap-1">
            {[
              { id: 'grundidee', label: 'Grundidee' },
              { id: 'ausprobieren', label: '11 Beispiele' },
              { id: 'ideen', label: 'Ideen-Finder' },
              { id: 'bauen', label: 'Selbst bauen' },
              { id: 'grenzen', label: 'Grenzen' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToSection(item.id)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-hbs-slate hover:text-hbs-blue hover:bg-hbs-blue-soft transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Back to Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToPortal}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-hbs-slate-dark hover:text-hbs-blue bg-hbs-bg hover:bg-hbs-blue-light/60 rounded-xl transition-all border border-hbs-slate-border hover:border-hbs-blue/30 active:scale-95 cursor-pointer"
              title="Zurück zum App-Portal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zum Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* HERO SECTION */}
        <section className="bg-white rounded-3xl border border-hbs-slate-border/80 shadow-hbs-card p-6 sm:p-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 text-xs font-extrabold tracking-tight">
            <Code2 className="w-4 h-4" />
            <span>Interaktive Übersicht für das Kollegium</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-hbs-slate-dark leading-tight">
              Was eine einzige <span className="text-hbs-blue">HTML-Datei</span> im Unterricht kann
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-hbs-slate leading-relaxed">
              Eine HTML-Datei öffnet sich in jedem Browser – auf Schul-iPads, am Smartboard und auf privaten Geräten.
              Eine KI erstellt sie in wenigen Minuten. Auf dieser Seite probieren Sie direkt aus, was damit möglich ist:
              Jedes der elf Beispiele unten funktioniert sofort im Browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-hbs-bg border border-hbs-slate-border text-xs sm:text-sm font-bold text-hbs-slate-dark">
              <Monitor className="w-4 h-4 text-hbs-blue" />
              Läuft in jedem Browser
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-hbs-bg border border-hbs-slate-border text-xs sm:text-sm font-bold text-hbs-slate-dark">
              <Download className="w-4 h-4 text-hbs-teal" />
              Keine Installation
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-hbs-bg border border-hbs-slate-border text-xs sm:text-sm font-bold text-hbs-slate-dark">
              <WifiOff className="w-4 h-4 text-hbs-amber-dark" />
              Funktioniert auch offline
            </span>
          </div>

          {/* 4-Column Statbar */}
          <div
            aria-label="Eckdaten"
            className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-hbs-slate-border/80 rounded-2xl border border-hbs-slate-border bg-hbs-bg overflow-hidden"
          >
            <div className="p-4 sm:p-5 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-black text-hbs-blue tabular-nums">1</span>
              <span className="text-xs sm:text-sm text-hbs-slate-muted font-medium">
                Datei reicht für eine ganze Übung
              </span>
            </div>
            <div className="p-4 sm:p-5 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tabular-nums">0</span>
              <span className="text-xs sm:text-sm text-hbs-slate-muted font-medium">
                Programme, die installiert werden müssen
              </span>
            </div>
            <div className="p-4 sm:p-5 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tabular-nums">
                {DEMO_CARDS.length}
              </span>
              <span className="text-xs sm:text-sm text-hbs-slate-muted font-medium">
                Regelschul-Beispiele zum Ausprobieren
              </span>
            </div>
            <div className="p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-hbs-teal tabular-nums">
                {triedIds.length}
              </span>
              <span className="text-xs sm:text-sm text-hbs-slate-muted font-medium">
                {triedIds.length === DEMO_CARDS.length
                  ? 'Alle Beispiele ausprobiert!'
                  : 'davon bereits ausprobiert'}
              </span>
              <div className="w-3/4 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-hbs-teal transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SECTION 1: GRUNDIDEE ==================== */}
        <section id="grundidee" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 text-xs font-extrabold">
              <Code2 className="w-3.5 h-3.5" /> Die Grundidee
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Was eine HTML-Datei <span className="text-hbs-blue">eigentlich</span> ist
            </h2>
            <p className="text-sm sm:text-base text-hbs-slate leading-relaxed">
              Jede Webseite besteht aus HTML. Der Unterschied zu einem Word-Dokument oder PDF ist, dass eine HTML-Seite
              reagieren kann: Sie prüft Antworten, bewegt Elemente, rechnet mit und merkt sich Eingaben. Programmieren
              müssen Sie dafür nicht – den Code schreibt auf Wunsch eine KI.
            </p>
          </div>

          {/* Live Editor Card */}
          <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue block">
                    Selbst ausprobieren
                  </span>
                  <h3 className="text-lg font-extrabold text-hbs-slate-dark">
                    Code bearbeiten und die Vorschau sofort sehen
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadSandboxHtml}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue-soft hover:bg-hbs-blue-light text-hbs-blue-deep border border-hbs-blue/20 text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Als .html-Datei herunterladen</span>
              </button>
            </div>

            <p className="text-sm text-hbs-slate">
              Wählen Sie eine Regelschul-Vorlage oder ändern Sie den Text links direkt. Die Vorschau rechts passt sich
              bei jedem Tastendruck sofort an.
            </p>

            {/* Template Chips */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Vorlagen für den Code">
              {EDITOR_TEMPLATES.map((tpl) => {
                const active = activeTplId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectTemplate(tpl.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? 'bg-hbs-blue text-white border-hbs-blue shadow-xs'
                        : 'bg-hbs-bg text-hbs-slate border-hbs-slate-border hover:border-hbs-blue'
                    }`}
                  >
                    {tpl.label}
                  </button>
                );
              })}
            </div>

            {/* Split Editor & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="hw-live-code"
                  className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted"
                >
                  <Code2 className="w-3.5 h-3.5" /> Code zum Bearbeiten
                </label>
                <textarea
                  id="hw-live-code"
                  spellCheck={false}
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  className="w-full min-h-[260px] p-4 rounded-2xl border border-hbs-slate-border bg-hbs-slate-dark text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-hbs-blue"
                />
              </div>

              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted">
                  <Eye className="w-3.5 h-3.5" /> So sieht es im Browser aus
                </span>
                <iframe
                  title="Live-Vorschau des HTML-Codes"
                  sandbox=""
                  srcDoc={iframeSrcDoc}
                  className="w-full min-h-[260px] rounded-2xl border border-hbs-slate-border bg-white p-3"
                />
              </div>
            </div>
          </div>

          {/* 3-Säulen HTML/CSS/JS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">HTML ordnet den Inhalt</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                HTML legt fest, was auf der Seite steht: Überschriften, Absätze, Tabellen, Bilder, Knöpfe und
                Eingabefelder.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-teal-light text-hbs-teal-deep border border-hbs-teal/20 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">CSS gestaltet das Aussehen</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                CSS bestimmt Farben, Schriften und Abstände und sorgt dafür, dass die Seite auf dem Handy genauso
                lesbar ist wie am Smartboard.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 flex items-center justify-center shrink-0">
                  <MousePointerClick className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">JavaScript macht sie lebendig</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                JavaScript ist für alles zuständig, was reagiert: Antworten prüfen, Punkte zählen, Karten umdrehen und
                Timer laufen lassen.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== SECTION 2: 11 INTERAKTIVE BEISPIELE ==================== */}
        <section id="ausprobieren" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-teal-light text-hbs-teal-deep border border-hbs-teal/20 text-xs font-extrabold">
              <MousePointerClick className="w-3.5 h-3.5" /> Zum Ausprobieren
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Elf Regelschul-Beispiele, die Sie <span className="text-hbs-teal">sofort</span> anklicken können
            </h2>
            <p className="text-sm sm:text-base text-hbs-slate leading-relaxed">
              Die Beispiele sind nach Unterrichtsphasen sortiert und auf die Klassenstufen 5–10 unserer Regelschule
              abgestimmt. Unter jedem Beispiel liegt ein fertiger Prompt, um das Format direkt für Ihr eigenes Fach zu
              übernehmen.
            </p>
          </div>

          {/* Filter & Progress Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Unterrichtsphase filtern">
              {(
                [
                  { id: 'alle' as PhaseId, label: 'Alle', count: DEMO_CARDS.length },
                  ...(Object.keys(PHASE_LABELS) as Exclude<PhaseId, 'alle'>[]).map((p) => ({
                    id: p,
                    label: PHASE_LABELS[p],
                    count: DEMO_CARDS.filter((c) => c.phase === p).length,
                  })),
                ]
              ).map((f) => {
                const active = phaseFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPhaseFilter(f.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-hbs-blue text-white border-hbs-blue shadow-xs'
                        : 'bg-white text-hbs-slate border-hbs-slate-border hover:border-hbs-blue'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="opacity-75 tabular-nums">{f.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-hbs-slate-muted tabular-nums">
              <span>
                {triedIds.length} von {DEMO_CARDS.length} ausprobiert
              </span>
              <div className="w-28 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-hbs-teal transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Demo Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredDemos.map((card) => {
              const Icon = card.icon;
              const style = ACCENT_STYLES[card.accent];
              const isTried = triedIds.includes(card.id);
              const isHighlighted = highlightedDemo === card.id;
              const defaultPrompt = buildPrompt(card.id, {
                fach: '[dein Fach]',
                thema: '[dein Thema]',
                klasse: '[deine Lerngruppe]',
              });

              return (
                <article
                  key={card.id}
                  id={`demo-${card.id}`}
                  className={`bg-white rounded-2xl border-t-4 border border-hbs-slate-border/80 ${style.topLine} shadow-hbs-card p-5 sm:p-6 flex flex-col gap-4 scroll-mt-24 transition-all ${
                    card.wide && (phaseFilter === 'alle' || phaseFilter === 'erarbeitung')
                      ? 'lg:col-span-2'
                      : ''
                  } ${isHighlighted ? 'ring-4 ring-hbs-amber/50' : ''}`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBox}`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider block ${style.kicker}`}>
                          {card.kicker}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-hbs-slate-dark leading-snug">
                          {card.title}
                        </h3>
                      </div>
                    </div>

                    {isTried && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-hbs-teal-light text-hbs-teal-deep border border-hbs-teal/25 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        <span>ausprobiert</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-hbs-slate leading-relaxed">{card.description}</p>

                  {/* Interactive Sandbox Area */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/70">
                    {card.render(markTried)}
                  </div>

                  {/* Classroom Tip */}
                  <p className="text-xs sm:text-sm text-hbs-slate-muted leading-relaxed">
                    <strong className="text-hbs-slate-dark">
                      {card.classroomTipLabel || 'Im Unterricht:'}
                    </strong>{' '}
                    {card.classroomTip}
                  </p>

                  {/* Collapsible Prompt */}
                  <details className="border-t border-slate-100 pt-3 group">
                    <summary className="cursor-pointer text-xs sm:text-sm font-bold text-hbs-blue hover:text-hbs-blue-deep list-none inline-flex items-center gap-1.5 select-none">
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                      <span>{card.promptLabel}</span>
                    </summary>
                    <div className="mt-3 space-y-2.5">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-hbs-slate-dark bg-hbs-bg border border-hbs-slate-border rounded-xl p-3.5 max-h-60 overflow-y-auto">
                        {defaultPrompt}
                      </pre>
                      <CopyPromptButton text={defaultPrompt} />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        {/* ==================== SECTION 3: IDEEN-FINDER ==================== */}
        <section id="ideen" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 text-xs font-extrabold">
              <Lightbulb className="w-3.5 h-3.5" /> Ideen-Finder · Thüringer Regelschule
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Welche Seite passt zu <span className="text-hbs-blue">Ihrer</span> Stunde?
            </h2>
            <p className="text-sm sm:text-base text-hbs-slate leading-relaxed">
              Wählen Sie ein Fach der Thüringer Rahmenstundentafel, Ihr Stundenthema, die Lerngruppe (Kl. 5–10) und das
              Unterrichtsziel. Der Ideen-Finder stellt passende Formate vor und schreibt den fertigen Prompt direkt
              mit Ihren Angaben.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Controls */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-6 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted block">
                  Fach (Thüringer Rahmenstundentafel)
                </span>
                <select
                  value={finderSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-hbs-slate-border bg-hbs-bg text-sm font-semibold text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
                >
                  {THURINGIA_REGELSCHULE_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted block">
                  Thema der Stunde
                </span>
                <input
                  type="text"
                  value={finderTopic}
                  onChange={(e) => {
                    setTopicTouched(true);
                    setFinderTopic(e.target.value);
                  }}
                  placeholder={finderSubject === 'anderes' ? 'Ihr Thema eingeben...' : 'Thema eingeben...'}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-hbs-slate-border bg-hbs-bg text-sm font-semibold text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted block">
                  Lerngruppe (Regelschule)
                </span>
                <select
                  value={finderGrade}
                  onChange={(e) => setFinderGrade(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-hbs-slate-border bg-hbs-bg text-sm font-semibold text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
                >
                  {REGELSCHULE_GRADE_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted block">
                  Ziel der Stunde
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Ziel der Stunde">
                  {GOAL_OPTIONS.map((goal) => {
                    const active = finderGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFinderGoal(goal.id)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-hbs-blue text-white border-hbs-blue'
                            : 'bg-hbs-bg text-hbs-slate border-hbs-slate-border hover:border-hbs-blue'
                        }`}
                      >
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generated Prompt Cards */}
            <div className="lg:col-span-8 space-y-4" aria-live="polite">
              {matchingFormats.map((fmt) => {
                const compiledPrompt = buildPrompt(fmt.id, {
                  fach: finderSubject === 'anderes' ? '[dein Fach]' : finderSubject,
                  thema: finderTopic.trim() || '[dein Thema]',
                  klasse: gradePromptLabel,
                });

                return (
                  <article
                    key={fmt.id}
                    className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-6 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue block">
                          {PHASE_LABELS[fmt.phase]} ·{' '}
                          {finderSubject === 'anderes' ? 'Ihr Fach' : finderSubject}
                        </span>
                        <h3 className="text-lg font-extrabold text-hbs-slate-dark">{fmt.title}</h3>
                      </div>
                    </div>

                    <p className="text-sm text-hbs-slate">{fmt.shortDesc}</p>

                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-hbs-slate-dark bg-hbs-bg border border-hbs-slate-border rounded-xl p-3.5 max-h-60 overflow-y-auto">
                      {compiledPrompt}
                    </pre>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <CopyPromptButton text={compiledPrompt} primary />
                      <button
                        type="button"
                        onClick={() => jumpToDemo(fmt.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-hbs-blue" />
                        <span>Beispiel ansehen</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 4: SELBST BAUEN ==================== */}
        <section id="bauen" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 text-xs font-extrabold">
              <Wand2 className="w-3.5 h-3.5" /> Selbst bauen
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              So kommen Sie zu Ihrer <span className="text-hbs-blue">eigenen</span> Seite
            </h2>
            <p className="text-sm sm:text-base text-hbs-slate leading-relaxed">
              Sie brauchen kein spezielles Programm und keine Programmierkenntnisse. Ein Zugang zu einem KI-Chat und ein
              Browser reichen aus.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                nr: 1,
                title: 'Sie beschreiben der KI, was die Seite können soll',
                text: (
                  <>
                    Nehmen Sie einen der Prompts aus dem Ideen-Finder oder beschreiben Sie in eigenen Worten, was Sie
                    brauchen. Besonders praktisch ist eine KI mit direkter Vorschau (z. B. <strong>Canvas</strong> in
                    Gemini/ChatGPT oder <strong>Artefakt</strong>). Dort klicken Sie die Seite sofort durch und sagen
                    der KI direkt, was noch geändert werden soll.
                  </>
                ),
              },
              {
                nr: 2,
                title: 'Sie speichern den Code als Datei',
                text: (
                  <>
                    Wenn die KI keinen direkten Download-Knopf anbietet, kopieren Sie den Code in einen einfachen
                    Texteditor (unter macOS TextEdit im reinen Textmodus, unter Windows Editor) und speichern ihn unter
                    einem Namen wie <code className="px-1.5 py-0.5 rounded bg-hbs-bg border border-hbs-slate-border font-mono text-xs text-hbs-blue">quiz-prozentrechnung.html</code>. Wichtig ist nur die Endung{' '}
                    <code className="px-1.5 py-0.5 rounded bg-hbs-bg border border-hbs-slate-border font-mono text-xs text-hbs-blue">.html</code>. Ein Doppelklick öffnet die Datei im Browser.
                  </>
                ),
              },
              {
                nr: 3,
                title: 'Sie teilen die Datei mit der Klasse',
                text: (
                  <>
                    Laden Sie die fertige HTML-Datei in die Thüringer Schulcloud, schicken Sie sie über EduPage oder
                    öffnen Sie sie direkt am Smartboard. Alternativ legen Sie eigene Vorlagen für die Fachschaft in
                    unserer HBS-Dateiablage ab.
                  </>
                ),
              },
            ].map((step) => (
              <div
                key={step.nr}
                className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-6 flex items-start gap-4"
              >
                <span className="w-9 h-9 rounded-xl bg-hbs-blue text-white font-black text-base flex items-center justify-center shrink-0 tabular-nums">
                  {step.nr}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-hbs-slate-dark">{step.title}</h3>
                  <p className="text-sm text-hbs-slate leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue block">
                    Wenn etwas nicht klappt
                  </span>
                  <h3 className="text-base font-extrabold text-hbs-slate-dark">
                    Beschreiben Sie der KI, was Sie sehen
                  </h3>
                </div>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                Sie müssen Fehler niemals im Code suchen. Schreiben Sie der KI einfach: „Auf dem Schul-iPad lassen sich
                die Begriffe nicht verschieben“ oder „Bei Frage 3 wird die falsche Lösung angezeigt“. Die KI passt die
                Seite an, und Sie testen kurz neu.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-teal-light text-hbs-teal-deep border border-hbs-teal/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-teal-deep block">
                    Tipp für die Heimbürgeschule
                  </span>
                  <h3 className="text-base font-extrabold text-hbs-slate-dark">
                    Direkt im HBS-Ökosystem weiterarbeiten
                  </h3>
                </div>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                Für noch schnellere HTML5-Lernspiele mit ThILLM-Lehrplanbezug und QR-Code-Verteilung steht im Portal
                auch unser <strong>KI-Unterrichts-Baukasten</strong> bereit. Eigene HTML-Dateien lassen sich zudem
                bequem im Kollegium über die <strong>HBS Dateiablage</strong> austauschen.
              </p>
              {onOpenStorage && (
                <button
                  type="button"
                  onClick={onOpenStorage}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-teal-light hover:bg-hbs-teal text-hbs-teal-deep hover:text-white border border-hbs-teal/25 text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Zur HBS Dateiablage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 5: GRENZEN ==================== */}
        <section id="grenzen" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 text-xs font-extrabold">
              <AlertTriangle className="w-3.5 h-3.5" /> Grenzen
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              Was eine einzelne HTML-Datei <span className="text-hbs-amber-dark">nicht</span> kann
            </h2>
            <p className="text-sm sm:text-base text-hbs-slate leading-relaxed">
              Eine einzelne Datei ist schnell gebaut und leicht verteilt. Dafür gibt es drei klare Grenzen, die man vor
              dem Einsatz kennen sollte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">Ergebnisse landen nicht bei Ihnen</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                Hinter einer einzelnen HTML-Datei steht kein Server. Was Schülerinnen und Schüler eintragen, bleibt auf
                deren Gerät. Für Rückmeldungen lassen Sie sich am Ende einen Screenshot zeigen oder einen kurzen
                Ergebniscode ausgeben.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">Namen bleiben im Browser</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                Werkzeuge wie die Zufallsauswahl arbeiten rein lokal im Browser. Tragen Sie Klassennamen erst direkt im
                Unterricht ein und speichern Sie keine Schülerdaten fest in Dateien, die Sie hochladen.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-hbs-amber-light text-hbs-amber-dark border border-hbs-amber/25 flex items-center justify-center shrink-0">
                  <Puzzle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-hbs-slate-dark">Kleine Seiten laufen zuverlässiger</h3>
              </div>
              <p className="text-sm text-hbs-slate leading-relaxed">
                Eine Seite mit einer klaren Aufgabe erstellt die KI sehr zuverlässig. Packt man eine komplette
                Unterrichtsreihe in eine einzige Datei, schleichen sich leichter Fehler ein. Bauen Sie lieber mehrere
                kleine Seiten.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="pt-6 border-t border-hbs-slate-border flex flex-wrap items-center justify-between gap-3 text-xs text-hbs-slate-muted">
          <span className="font-bold text-hbs-slate-dark">
            Staatliche Regelschule Heimbürgeschule Kahla · HTML-Werkstatt für das Kollegium
          </span>
          <span>Alle interaktiven Beispiele laufen vollständig lokal in Ihrem Browser.</span>
        </footer>
      </main>
    </div>
  );
};
