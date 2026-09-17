import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Presentation, 
  BarChart2, 
  QrCode, 
  ShieldCheck, 
  GraduationCap
} from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHandbook?: () => void;
}

interface TourStep {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  imageCaption: string;
  highlights: { title: string; text: string }[];
  icon: React.ElementType;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    badge: 'Schritt 1 von 6 • Willkommen',
    title: 'Willkommen im HBS App-Portal',
    subtitle: 'Die digitale Schaltzentrale für Kollegium und Unterricht an der Heimbürgeschule Kahla.',
    image: '/screenshots/01_login_gate.png',
    imageCaption: 'Das Anmeldeportal mit den 3 Rollen: Kollegium, Tafel-Gast und Admin',
    icon: ShieldCheck,
    highlights: [
      {
        title: 'Kein Passwort- & App-Chaos mehr',
        text: 'Alle schulischen Werkzeuge sind gebündelt an einem einzigen Ort erreichbar.'
      },
      {
        title: '100% DSGVO-Sicherheit für Schüler',
        text: 'Schüler benötigen weder Accounts, E-Mails noch Passwörter – ein QR-Scan genügt.'
      },
      {
        title: 'Auf jedem Gerät einsatzbereit',
        text: 'Optimiert für interaktive Smartboards, iPads, Dienstlaptops und Smartphones.'
      }
    ]
  },
  {
    stepNumber: 2,
    badge: 'Schritt 2 von 6 • Orientierung',
    title: 'Bento-Grid, Kompakt-Modus & Schnelle Suche',
    subtitle: 'Wählen Sie für jede Unterrichtssituation die passende Portal-Ansicht.',
    image: '/screenshots/02_portal_overview.png',
    imageCaption: 'Das Bento-Grid mit didaktischen Praxistipps und Kategorienschnellfiltern',
    icon: Layers,
    highlights: [
      {
        title: 'Bento-Raster mit Praxistipps',
        text: 'Liefert didaktische Tipps, Lernziele und Kurzanleitungen auf der Kartenrückseite.'
      },
      {
        title: 'Kompakte Liste & Smartboard-Modus',
        text: 'Schlanke Listenansicht fürs Handy oder extragroße Schaltflächen für den Beamer.'
      },
      {
        title: 'Persönliche Favoriten (⭐)',
        text: 'Klicken Sie auf den Stern bei einer App, um sie ganz oben in Ihre Favoritenleiste zu pinnen.'
      }
    ]
  },
  {
    stepNumber: 3,
    badge: 'Schritt 3 von 6 • Smartboard',
    title: 'Die Digitale Schultafel',
    subtitle: '26 frei bewegliche Widgets für Struktur, Zeitmanagement und Aufmerksamkeit.',
    image: '/screenshots/03_digitale_tafel.png',
    imageCaption: 'Interaktive Schultafel mit Kuchen-Timer, Lärmampel und Handballenschutz',
    icon: Presentation,
    highlights: [
      {
        title: 'Zeit, Organisation & Lautstärke',
        text: 'Unterrichtsuhr, visueller Kuchen-Timer, Countdown und Lärmampel mit Mikrofon-Ausschlag.'
      },
      {
        title: 'Zufallsauswahl & Aktivierung',
        text: 'Zufalls-Schülerauswahl, 3D-Würfel, Gruppen-Generator, Punktezähler und Arbeitsphasen-Symbole.'
      },
      {
        title: 'Palm-Rejection & Tafelbild-Export',
        text: 'Handballenschutz für Stifteingabe sowie Export als druckfertiges DIN-A4-Stundenprotokoll.'
      }
    ]
  },
  {
    stepNumber: 4,
    badge: 'Schritt 4 von 6 • Schüleraktivierung',
    title: 'Live-Interaktion: Menti, Kahoot & Oncoo',
    subtitle: 'Wortwolken, KI-Quizze und kooperative Lernformen in Sekundenschnelle starten.',
    image: '/screenshots/04_menti_dashboard.png',
    imageCaption: 'HBS Menti & Kahoot: Schüler scannen den Beamer-QR-Code und machen sofort live mit',
    icon: BarChart2,
    highlights: [
      {
        title: 'HBS Menti',
        text: 'Echtzeit-Wortwolken, Multiple-Choice-Abstimmungen und offene Schüler-Thesen.'
      },
      {
        title: 'HBS Kahoot mit KI-Generator',
        text: 'Quizfragen mit Gemini AI automatisch formulieren lassen und Notfall-Arbeitsblätter drucken.'
      },
      {
        title: 'HBS Oncoo (Kooperatives Lernen)',
        text: 'Kartenabfrage, Zielscheibe, Lerntempoduett-Tandems, Helfersystem und Placemat-Methode.'
      }
    ]
  },
  {
    stepNumber: 5,
    badge: 'Schritt 5 von 6 • Unterrichts-Helfer',
    title: 'Tischaufsteller & Quick-Tools',
    subtitle: 'Praktische Helfer für die Unterrichtsstunde und Faltprismen für Gruppentische.',
    image: '/screenshots/07_tischaufsteller_generator.png',
    imageCaption: 'DIN-A4 Tischaufsteller-Generator mit Faltlinien und QR-Code für Tisch 1 bis 10',
    icon: QrCode,
    highlights: [
      {
        title: 'DIN-A4 Faltprisma-Generator',
        text: 'Erzeugt mit einem Klick faltbare Tisch-Kärtchen mit QR-Code für Gruppenarbeiten.'
      },
      {
        title: 'Unterrichts-Quick-Tools (Zauberstab)',
        text: 'Seitenleiste mit Ruhesignal-Gong, Timer, Lärmampel und Würfel jederzeit griffbereit.'
      },
      {
        title: 'Eigene Links hinterlegen',
        text: 'Eigene Lieblings-Apps und Webseiten einfach in das persönliche Portal einbinden.'
      }
    ]
  },
  {
    stepNumber: 6,
    badge: 'Schritt 6 von 6 • Startklar',
    title: 'Sie sind bereit für den Unterricht!',
    subtitle: 'Das Handbuch und diese Tour stehen Ihnen jederzeit zur Verfügung.',
    image: '/screenshots/02_portal_overview.png',
    imageCaption: 'Herzlich willkommen im Kollegium der Heimbürgeschule Kahla',
    icon: GraduationCap,
    highlights: [
      {
        title: 'Bebildertes Kollegiums-Handbuch',
        text: 'Ausführliche Schritt-für-Schritt-Anleitungen und druckfertige PDF-Version als Appkachel.'
      },
      {
        title: 'Tour jederzeit wiederholen',
        text: 'Über die Menüleiste können Sie diese Einführung jederzeit erneut aufrufen.'
      },
      {
        title: 'Viel Freude im Unterricht!',
        text: 'Nutzen Sie die Werkzeuge zur Entlastung und für lebendigen, digitalen Unterricht.'
      }
    ]
  }
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onOpenHandbook
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Global Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' && !isLastStep) handleNext();
      if (e.key === 'ArrowLeft' && !isFirstStep) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, isLastStep, isFirstStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('hbs_onboarding_completed', 'true');
      } catch (e) {}
    }
    onClose();
  };

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
      onClick={handleClose}
    >
      {/* Modal Container */}
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 cursor-default animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                Portal-Einführung
              </span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                Schritt {currentStep.stepNumber} von {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 shrink-0 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-hbs-blue via-teal-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          
          {/* Title Area */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-hbs-blue-soft text-hbs-blue p-2.5 flex items-center justify-center border border-hbs-blue/15 shadow-xs shrink-0 mt-0.5">
              <StepIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-hbs-blue px-2.5 py-0.5 rounded-full bg-hbs-blue-soft border border-hbs-blue/15">
                {currentStep.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                {currentStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Screenshot Illustration */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <img 
              src={currentStep.image} 
              alt={currentStep.title} 
              className="w-full h-48 sm:h-64 object-cover object-top"
            />
            <div className="p-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium italic text-center">
              {currentStep.imageCaption}
            </div>
          </div>

          {/* Highlights 3-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentStep.highlights.map((h, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-black shrink-0">
                    ✓
                  </div>
                  <strong className="text-xs font-black text-slate-900 leading-snug">
                    {h.title}
                  </strong>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  {h.text}
                </p>
              </div>
            ))}
          </div>

          {/* Last Step Extra Link to Handbook */}
          {isLastStep && onOpenHandbook && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hbs-blue text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-950">Möchten Sie alle Details nachschlagen?</h4>
                  <p className="text-xs text-blue-800">Öffnen Sie das vollständige Kollegiums-Handbuch mit PDF-Download.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenHandbook();
                }}
                className="px-3.5 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all shrink-0"
              >
                Handbuch öffnen
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Step Dots & Checkbox */}
          <div className="flex items-center gap-4">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentStepIndex 
                      ? 'w-7 bg-hbs-blue' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Schritt ${idx + 1}`}
                />
              ))}
            </div>

            {/* Checkbox */}
            <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-hbs-blue focus:ring-hbs-blue"
              />
              <span>Nicht mehr automatisch anzeigen</span>
            </label>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Zurück</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all"
            >
              Überspringen
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35)]"
            >
              <span>{isLastStep ? 'Tour abschließen & loslegen' : 'Weiter'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
