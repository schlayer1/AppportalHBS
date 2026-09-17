import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Compass, 
  BookOpen, 
  Presentation, 
  BarChart2, 
  Flame, 
  Target, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  Cpu, 
  GraduationCap, 
  CheckCircle2, 
  ChevronRight,
  Layers
} from 'lucide-react';

interface HandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
}

type ChapterId = 'intro' | 'views' | 'tafel' | 'menti' | 'kahoot' | 'oncoo' | 'tools' | 'didactics' | 'tech';

interface Chapter {
  id: ChapterId;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  badge: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'intro', title: '1. Zugang & Authentifizierung', shortTitle: 'Zugang & Rollen', icon: ShieldCheck, badge: 'DSGVO & PIN' },
  { id: 'views', title: '2. Ansichts- & Arbeitsmodi', shortTitle: 'Ansichten', icon: Layers, badge: 'Bento / Smartboard' },
  { id: 'tafel', title: '3. Digitale Schultafel', shortTitle: 'Digitale Tafel', icon: Presentation, badge: '26 Widgets' },
  { id: 'menti', title: '4. HBS Menti (Live-Abfragen)', shortTitle: 'HBS Menti', icon: BarChart2, badge: 'Wortwolke & Quiz' },
  { id: 'kahoot', title: '5. HBS Kahoot! & KI-Generator', shortTitle: 'HBS Kahoot!', icon: Flame, badge: 'Gemini KI' },
  { id: 'oncoo', title: '6. HBS Oncoo (Kooperatives Lernen)', shortTitle: 'HBS Oncoo', icon: Target, badge: '5 Methoden' },
  { id: 'tools', title: '7. Quick-Tools & Tischaufsteller', shortTitle: 'Tischaufsteller', icon: QrCode, badge: 'DIN A4 Prisma' },
  { id: 'didactics', title: '8. Didaktische Einsatzszenarien', shortTitle: 'Unterrichts-Tipps', icon: GraduationCap, badge: 'Praxis-Guide' },
  { id: 'tech', title: '9. Technik unter der Haube', shortTitle: 'Architektur & P2P', icon: Cpu, badge: 'Offline & Sync' },
];

export const HandbookModal: React.FC<HandbookModalProps> = ({
  isOpen,
  onClose,
  onStartTour
}) => {
  const [activeChapter, setActiveChapter] = useState<ChapterId>('intro');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      {/* Outer Modal Container */}
      <div 
        className="w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <header className="px-5 py-4 bg-gradient-to-r from-slate-900 via-hbs-slate-dark to-[#04202C] text-white flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-hbs-blue to-teal-500 p-2 text-white flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30">
                  Offizielles Kollegiums-Handbuch
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">Version 2.0</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                Handbuch & Dokumentation • Heimbürgeschule
              </h2>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onStartTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/30 text-xs font-bold transition-all active:scale-95"
                title="Interaktive Portal-Tour starten"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Interaktive Tour</span>
              </button>
            )}

            <a
              href="/HBS_App_Portal_Handbuch.pdf"
              download="HBS_App_Portal_Handbuch.pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all active:scale-95 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35)]"
              title="Vollständiges Handbuch als PDF herunterladen"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF Download</span>
            </a>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95 hidden sm:flex"
              title="Drucken"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors ml-1"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Chapter Navigation Sidebar */}
          <aside className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 hidden md:block">
              Inhaltsverzeichnis
            </span>

            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl text-left transition-all shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-white text-hbs-blue border border-slate-200 shadow-sm shadow-hbs-blue/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-hbs-blue text-white shadow-2xs' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{ch.shortTitle}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 hidden md:block transition-transform ${
                    isActive ? 'text-hbs-blue translate-x-0.5' : 'text-slate-300'
                  }`} />
                </button>
              );
            })}

            {/* Quick Tour Trigger inside Sidebar on Desktop */}
            {onStartTour && (
              <div className="hidden md:block mt-auto pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    onClose();
                    onStartTour();
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-teal-900 hover:border-teal-300 text-xs font-black flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="text-left">
                    <div className="leading-tight">Interaktive Tour</div>
                    <div className="text-[10px] font-normal text-teal-700">6 geführte Schritte</div>
                  </div>
                </button>
              </div>
            )}
          </aside>

          {/* Main Reading View */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-800 leading-relaxed">

            {/* CHAPTER 1: ZUGANG & AUTH */}
            {activeChapter === 'intro' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-hbs-blue">Kapitel 1</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Zugang & Anmeldekonzept
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Datenschutz nach thüringischem Schulgesetz, kein Schüler-Account-Zwang und 3 abgestimmte Rollen.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/01_login_gate.png" 
                    alt="Anmeldeportal Heimbürgeschule" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 1: Anmeldefenster mit den 3 Haupt-Zugängen (Kollegium, Tafel-Gast, Admin)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">1. Kollegium</h4>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      Namen auswählen und persönliche 4-stellige PIN eingeben. Arbeitsplatz, Favoriten und Vorlagen synchronisieren sich automatisch auf jedem Dienstgerät.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">2. Tafel-Gast</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      Ein Klick auf „Tafel-Gast“ öffnet direkt die Digitale Schultafel. Keine Zugangsdaten auf Klassenzimmer-Smartboards hinterlassen – optimal für Vertretung und Gastdozenten.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">3. Admin-Zugang</h4>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      Für Schulleitung und IT-Beauftragte: Verwaltung von Lehrer-PINs, druckbare Kollegiumslisten und Firebase-Cloud-Konfiguration.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3 text-teal-950">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold">100% DSGVO-Sicherheit für Schüler:</strong> Schülerinnen und Schüler benötigen weder Accounts, Passwörter noch E-Mail-Adressen. Ein Scan des Beamer-QR-Codes genügt, um live an Votings, Menti-Wortwolken oder Quizzen teilzunehmen.
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 2: ANSICHTEN & NAVIGATION */}
            {activeChapter === 'views' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-hbs-blue">Kapitel 2</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Ansichtsmodi & Navigation
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Flexibel anpassbar an Smartboards, iPads oder Lehrerzimmer-Rechner.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/02_portal_overview.png" 
                    alt="Bento-Grid Übersicht" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 2: Bento-Raster mit Kategorienschnellfilter, Suchleiste und Favoriten
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>🍱 Bento-Grid (Standard)</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Große Kacheln mit didaktischen Praxistipps, pädagogischem Mehrwert und Kurzanleitungen auf der Kartenrückseite.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>📱 Kompakte Kacheln</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Kompakte App-Icons nach iOS-Vorbild. Ideal für Smartphones oder schnelle Orientierung in Pausen.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>📽️ Smartboard- & Beamer-Modus</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Maximierte Klickflächen, riesige Touch-Buttons und direkt sichtbare Schüler-QR-Codes für die Projektion an die Wand.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  ⭐ <strong>Favoriten-Funktion:</strong> Klicken Sie auf den Stern einer App, um sie ganz oben in Ihre persönliche Favoritenleiste anzuheften. Ihre Auswahl wird im Profil gespeichert.
                </div>
              </div>
            )}

            {/* CHAPTER 3: DIGITALE SCHULTAFEL */}
            {activeChapter === 'tafel' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Kapitel 3</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Die Digitale Schultafel
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    26 frei verschiebbare Widgets für die Unterrichtsstrukturierung nach Classroomscreen-Vorbild.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/03_digitale_tafel.png" 
                    alt="Digitale Tafel der Heimbürgeschule" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 3: Tafel mit Unterrichtsuhr, Kuchen-Timer, Lärmampel und Freihandzeichnung
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">⏱️ Zeit & Strukturierung:</strong>
                    Unterrichtsuhr, Countdown, Kuchen-Timer, Stoppuhr, Kalender und Arbeitsphasen-Symbole (Einzel-, Partner-, Gruppenarbeit, Flüsterphase).
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">🚦 Signale & Lautstärke:</strong>
                    Lärmampel mit Live-Mikrofonausschlag, Verhaltensampel, Gong, akustische Klassensignale und Ruhesignale.
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">🎲 Zufall & Aktivierung:</strong>
                    Zufallsauswahl für Schülernamen, Gruppen-Generator, 3D-Würfel, Quick-Poll-Umfragen und Punktezähler.
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">✍️ Medien & Freihand:</strong>
                    Palm-Rejection (Handballenschutz für Stifteingabe), Notiz-Editor, PDF-Viewer, YouTube-Player und Dokumentenkamera.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  💡 <strong>Tafelbild-Export:</strong> Sie können das fertige Tafelbild jederzeit mit einem Klick als druckfertiges DIN A4 Stundenprotokoll exportieren oder als Vorlage für Ihre Fachschaft in der Cloud speichern!
                </div>
              </div>
            )}

            {/* CHAPTER 4: HBS MENTI */}
            {activeChapter === 'menti' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-teal-600">Kapitel 4</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    HBS Menti (Live-Abfragen)
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Mentimeter-Klon ohne Lizenzkosten, ohne Schüler-Accounts und 100% datenschutzkonform.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/04_menti_dashboard.png" 
                    alt="HBS Menti Dashboard" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 4: HBS Menti Dashboard mit Vorlagen, Ordnerstruktur und Präsentationsstart
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">☁️ Wortwolke (Wordcloud)</span>
                    <span className="text-slate-500">Begriffe wachsen in Echtzeit live am Smartboard</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">📊 Multiple Choice</span>
                    <span className="text-slate-500">Animierte Säulendiagramme mit Live-Abstimmung</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">💬 Offene Fragen</span>
                    <span className="text-slate-500">Kärtchenmosaik für Schülergedanken und Thesen</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">🏆 Quiz-Rennen</span>
                    <span className="text-slate-500">Punktevergabe nach Schnelligkeit mit Live-Siegertreppchen</span>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 5: HBS KAHOOT! */}
            {activeChapter === 'kahoot' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600">Kapitel 5</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    HBS Kahoot! & KI-Quizgenerator
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Spielerischer Wettbewerb, 4-Farben-Gamepad und automatischer Fragenentwurf via Gemini AI.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/05_kahoot_dashboard.png" 
                    alt="HBS Kahoot Dashboard" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 5: HBS Kahoot Übersicht mit KI-Generator-Knopf und Vorlagen
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
                    <strong className="font-black text-purple-900 block mb-1">✨ Gemini KI-Quizgenerator:</strong>
                    Geben Sie Thema, Fach und Klassenstufe ein. Die KI formuliert in Sekunden 5 bis 10 Multiple-Choice-Fragen inklusive plausibler Distraktoren, die Sie direkt bearbeiten und übernehmen können.
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    <strong className="font-black text-slate-900 block mb-1">📄 Notfall-Arbeitsblätter:</strong>
                    WLAN ausgefallen? Ein Klick erzeugt aus jedem Quiz ein druckfertiges DIN-A4-Arbeitsblatt mit Ankreuzfeldern und separatem Lösungsbogen für den Ordner!
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 6: HBS ONCOO */}
            {activeChapter === 'oncoo' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-600">Kapitel 6</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    HBS Oncoo (Kooperative Lernformen)
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    5 bewährte Methoden nach Heinz Klippert digital umgesetzt.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/06_oncoo_dashboard.png" 
                    alt="HBS Oncoo Dashboard" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 6: HBS Oncoo Methodenwahl (Kartenabfrage, Zielscheibe, Duett, Helfersystem, Placemat)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                    <span className="font-black text-rose-950 block">📌 Kartenabfrage:</span>
                    Schüler senden bunte Kärtchen; die Lehrkraft sortiert sie am Smartboard in Clustern oder Spalten. Übertragung auf die Digitale Tafel per Knopfdruck möglich!
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                    <span className="font-black text-rose-950 block">🎯 Zielscheibe:</span>
                    Schnelles Selbsteinschätzungs- oder Stunden-Feedback auf einer interaktiven 4-Sektoren-Scheibe.
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                    <span className="font-black text-rose-950 block">⚡ Lerntempoduett:</span>
                    Schüler melden Fertigstellung per Klick. Das System koppelt jeweils zwei Schüler sofort als Kontrolltandem.
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                    <span className="font-black text-rose-950 block">🤝 Helfersystem & Placemat:</span>
                    Differenzierte Hilfebörse (Peer-Teaching) und 4-Felder-Kooperation (Think-Pair-Share).
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 7: QUICK-TOOLS & TISCHAUFSTELLER */}
            {activeChapter === 'tools' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-teal-600">Kapitel 7</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Quick-Tools & Tischaufsteller-Generator
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Praktische Helfer für die Unterrichtsstunde und Faltprismen für Gruppentische.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img 
                    src="/screenshots/07_tischaufsteller_generator.png" 
                    alt="Tischaufsteller Generator" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
                    Abbildung 7: DIN-A4 Tischaufsteller-Generator mit Faltlinien und QR-Code für Tisch 1 bis 10
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <strong className="font-black text-teal-950 block mb-1">📐 DIN-A4 Faltprisma-Generator:</strong>
                    Erzeugen Sie mit einem Klick faltbare Aufsteller mit Tisch-Nummer und QR-Code für Ihre Gruppentische. Einmal ausdrucken, laminieren und bei Gruppenarbeitsphasen auf die Tische stellen – Schüler sind in 3 Sekunden in der richtigen Session!
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">⚡ Unterrichts-Quick-Tools Drawer:</strong>
                    Über das Zauberstab-Symbol in der Kopfleiste öffnen Sie jederzeit die seitliche Leiste mit Ruhesignal-Gong, Countdown-Timer, Lärmampel und Zufallsauswahl, ohne Ihre aktuelle Ansicht zu verlassen.
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 8: DIDAKTISCHE EINSATZSZENARIEN */}
            {activeChapter === 'didactics' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-hbs-blue">Kapitel 8</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Didaktische Einsatzszenarien
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Best-Practice-Beispiele für die 45- und 90-Minuten-Stunde an der Heimbürgeschule.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
                    <div className="font-black text-blue-900 text-sm mb-1">Stundeneinstieg (5–10 Min.)</div>
                    <p className="text-blue-800 leading-relaxed">
                      Starten Sie mit einer <strong>HBS Menti-Wortwolke</strong> zur Aktivierung von Vorwissen (z. B. <em>„Welche Begriffe fallen euch zu den Weimarer Klassikern ein?“</em>). Die Ergebnisse werden direkt sichtbar und bieten den Gesprächsanlass.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                    <div className="font-black text-emerald-900 text-sm mb-1">Erarbeitungsphase (20–25 Min.)</div>
                    <p className="text-emerald-800 leading-relaxed">
                      Auf der <strong>Digitalen Tafel</strong> läuft der visuelle Kuchen-Timer mit leiser Arbeitsmusik oder Lärmampel. Arbeitsaufträge sind fixiert, und mit der Schülerauswahl werden die Zwischenergebnisse gewürfelt.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
                    <div className="font-black text-purple-900 text-sm mb-1">Sicherung & Gamification (10–15 Min.)</div>
                    <p className="text-purple-800 leading-relaxed">
                      Ein 5-Fragen-Sprint in <strong>HBS Kahoot!</strong> festigt die Stunde spielerisch. Die Schüler sehen sofort, wo noch Unsicherheiten bestehen, und das Siegertreppchen sorgt für hohe Motivation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 9: TECHNIK UNTER DER HAUBE */}
            {activeChapter === 'tech' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Kapitel 9</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Technik unter der Haube
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Für IT-Interessierte: Wie funktioniert das Portal technisch im Hintergrund?
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">⚡ React 18 & Vite:</strong>
                    Modernste Frontend-Technologie für sofortige Ladezeiten unter 100 ms ohne spürbare Ladeverzögerungen auf Smartboards.
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">📡 Peer-to-Peer & BroadcastChannel:</strong>
                    Schüler-Eingaben synchronisieren sich über den HTML5 BroadcastChannel und Firebase Firestore in Echtzeit – selbst bei schwankendem Schul-WLAN.
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="font-black text-slate-900 block mb-1">💾 Offline-First & Service Worker (PWA):</strong>
                    Alle Kernkomponenten sind als Progressive Web App gecacht. Auch bei komplettem Internetausfall bleiben Tafel, Timer, Audio-Effekte und Würfel voll bedienbar.
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <strong className="font-black text-emerald-900 block mb-1">🛡️ Datenschutz & Zero-Tracker:</strong>
                    Keine Google Analytics, keine Werbe-Pixel, keine externen Cookies. Schüler-Sessions werden nach Sitzungsende automatisch bereinigt.
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Modal Sticky Footer */}
        <footer className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Staatliche Regelschule „Geschwister Scholl“ Kahla</span>
            <span>•</span>
            <span className="text-slate-400">Heimbürgeschule Kollegium</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/HBS_App_Portal_Handbuch.pdf"
              download="HBS_App_Portal_Handbuch.pdf"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Druckfertiges PDF (A4)</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            >
              Schließen
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
