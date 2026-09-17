import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  Clock, 
  Award, 
  Sliders, 
  FileText, 
  BarChart2, 
  MessageSquare, 
  Cloud, 
  Sparkles,
  Grid2X2,
  ListOrdered,
  X
} from 'lucide-react';
import { MentiPresentation, MentiSlide, MentiSlideType } from '../../types/mentiTypes';
import { useAuth } from '../../context/AuthContext';

interface MentiEditorProps {
  initialPresentation: MentiPresentation;
  onClose: () => void;
  onStartPresenter: (presentation: MentiPresentation) => void;
}

const SLIDE_TYPE_INFO: Record<MentiSlideType, { label: string; icon: any; color: string; desc: string }> = {
  wordcloud: { label: 'Wortwolke', icon: Cloud, color: 'text-sky-600 bg-sky-50', desc: 'Schüler senden Begriffe, die als lebendige Schlagwortwolke wachsen' },
  choice: { label: 'Multiple Choice', icon: BarChart2, color: 'text-teal-600 bg-teal-50', desc: 'Klassische Abstimmung mit animierten Balkendiagrammen' },
  open: { label: 'Offene Frage', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50', desc: 'Schüler tippen Sätze oder Fragen, sichtbar als Kärtchen-Mosaik' },
  scales: { label: 'Bewertungsskala', icon: Sliders, color: 'text-amber-600 bg-amber-50', desc: 'Thesen mit Schiebereglern (1-5 Sterne) bewerten' },
  matrix: { label: '2×2 Matrix', icon: Grid2X2, color: 'text-violet-600 bg-violet-50', desc: 'Thesen auf 2 Achsen einordnen (z. B. Nutzen vs. Aufwand, Pro vs. Kontra)' },
  ranking: { label: 'Rangfolge / Ranking', icon: ListOrdered, color: 'text-cyan-600 bg-cyan-50', desc: 'Schüler ordnen Elemente per Drag & Drop in die richtige Reihenfolge' },
  quiz: { label: 'Quiz-Rennen', icon: Award, color: 'text-rose-600 bg-rose-50', desc: 'Wettbewerb mit Zeitlimit, Punkten und Live-Treppchen' },
  content: { label: 'Info & Merksatz', icon: FileText, color: 'text-emerald-600 bg-emerald-50', desc: 'Erklärungen, Hausaufgaben oder Überschriften ohne Abstimmung' },
};

const SUBJECT_LIST = [
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
  'Ethik / Religion',
  'Kunst',
  'Musik',
  'Sport'
];

export const MentiEditor: React.FC<MentiEditorProps> = ({
  initialPresentation,
  onClose,
  onStartPresenter
}) => {
  const { saveMentiPresentation } = useAuth();

  const [presentation, setPresentation] = useState<MentiPresentation>(initialPresentation);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [showTypeSelector, setShowTypeSelector] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'slides' | 'preview' | 'settings'>('preview');

  // Close modal on Escape key
  useEffect(() => {
    if (!showTypeSelector) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTypeSelector(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTypeSelector]);

  const activeSlide: MentiSlide = presentation.slides[activeSlideIndex] || presentation.slides[0] || {
    id: 's-default',
    type: 'wordcloud',
    question: 'Neue Frage eingeben'
  };

  const updateActiveSlide = (updater: (prev: MentiSlide) => MentiSlide) => {
    setPresentation(prev => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = updater(updatedSlides[activeSlideIndex]);
      return { ...prev, slides: updatedSlides, updatedAt: Date.now() };
    });
    setIsSaved(false);
  };

  const handleSave = async () => {
    await saveMentiPresentation(presentation);
    setIsSaved(true);
  };

  const handleAddSlide = (type: MentiSlideType) => {
    const newSlide: MentiSlide = {
      id: `slide-${Date.now()}`,
      type,
      question: type === 'wordcloud' ? 'Welche 3 Worte beschreiben das Thema?' :
                type === 'choice' ? 'Welche Option ist richtig?' :
                type === 'open' ? 'Was denkst du darüber?' :
                type === 'scales' ? 'Bewerte die folgenden Thesen:' :
                type === 'matrix' ? 'Ordne die Elemente im Koordinatenfeld ein:' :
                type === 'ranking' ? 'Bringe die Elemente in die richtige Reihenfolge:' :
                type === 'quiz' ? 'Schnelligkeitsfrage: Wer weiß es?' : 'Merksatz zur heutigen Stunde',
      maxWordsPerUser: type === 'wordcloud' ? 3 : undefined,
      options: (type === 'choice' || type === 'quiz') ? [
        { id: 'opt-1', text: 'Erste Antwort', isCorrect: true },
        { id: 'opt-2', text: 'Zweite Antwort' },
        { id: 'opt-3', text: 'Dritte Antwort' }
      ] : undefined,
      scales: type === 'scales' ? [
        { id: 'sc-1', statement: 'Ich habe das Prinzip verstanden', lowLabel: 'Nein', highLabel: 'Ja' },
        { id: 'sc-2', statement: 'Die Aufgabe war leicht', lowLabel: 'Schwer', highLabel: 'Leicht' }
      ] : undefined,
      matrixConfig: type === 'matrix' ? {
        xLowLabel: 'Geringer Nutzen',
        xHighLabel: 'Hoher Nutzen',
        yLowLabel: 'Geringer Aufwand',
        yHighLabel: 'Hoher Aufwand',
        items: [
          { id: 'mat-1', label: 'These A' },
          { id: 'mat-2', label: 'These B' }
        ]
      } : undefined,
      rankingItems: type === 'ranking' ? [
        { id: 'rnk-1', text: 'Erster Schritt (zuerst)' },
        { id: 'rnk-2', text: 'Zweiter Schritt' },
        { id: 'rnk-3', text: 'Dritter Schritt (zuletzt)' }
      ] : undefined,
      timeLimitSeconds: type === 'quiz' ? 20 : undefined,
      points: type === 'quiz' ? 1000 : undefined,
      bulletPoints: type === 'content' ? ['Erster wichtiger Punkt', 'Zweiter wichtiger Punkt'] : undefined,
      emoji: type === 'content' ? '💡' : undefined
    };

    setPresentation(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
      updatedAt: Date.now()
    }));
    setActiveSlideIndex(presentation.slides.length);
    setShowTypeSelector(false);
    setIsSaved(false);
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToCopy = presentation.slides[index];
    const copy: MentiSlide = {
      ...JSON.parse(JSON.stringify(slideToCopy)),
      id: `slide-${Date.now()}`,
      question: `${slideToCopy.question} (Kopie)`
    };
    const updated = [...presentation.slides];
    updated.splice(index + 1, 0, copy);
    setPresentation(prev => ({ ...prev, slides: updated }));
    setActiveSlideIndex(index + 1);
    setIsSaved(false);
  };

  const handleDeleteSlide = (index: number) => {
    if (presentation.slides.length <= 1) {
      alert('Eine Abfrage muss mindestens eine Folie enthalten.');
      return;
    }
    const updated = presentation.slides.filter((_, idx) => idx !== index);
    setPresentation(prev => ({ ...prev, slides: updated }));
    setActiveSlideIndex(Math.max(0, index - 1));
    setIsSaved(false);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= presentation.slides.length) return;
    const updated = [...presentation.slides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPresentation(prev => ({ ...prev, slides: updated }));
    setActiveSlideIndex(targetIdx);
    setIsSaved(false);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans select-none overflow-hidden text-slate-900">
      
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={async () => {
              if (!isSaved) await handleSave();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />

          {/* Editable Title */}
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={presentation.title}
              onChange={(e) => {
                setPresentation(prev => ({ ...prev, title: e.target.value }));
                setIsSaved(false);
              }}
              className="font-black text-sm text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-slate-300 outline-none truncate max-w-[280px] sm:max-w-md"
              placeholder="Titel der Präsentation"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <select
            value={presentation.subject || 'Fächerübergreifend'}
            onChange={(e) => {
              setPresentation(prev => ({ ...prev, subject: e.target.value }));
              setIsSaved(false);
            }}
            className="hidden md:block py-1.5 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
          >
            {SUBJECT_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            value={presentation.folder || ''}
            onChange={(e) => {
              setPresentation(prev => ({ ...prev, folder: e.target.value }));
              setIsSaved(false);
            }}
            placeholder="📁 Ordner (z.B. Klasse 7a)"
            className="hidden lg:block py-1.5 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 outline-none w-36 placeholder:text-slate-400"
          />

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isSaved 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs active:scale-95'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Gespeichert' : 'Speichern'}</span>
          </button>

          <button
            onClick={async () => {
              await handleSave();
              onStartPresenter(presentation);
            }}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Präsentieren</span>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet View Switcher (< lg) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-100 border-b border-slate-200 p-1.5 shrink-0 text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('slides')}
          className={`flex-1 py-2 rounded-xl text-center transition-all ${
            mobileTab === 'slides'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Folien ({presentation.slides.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 rounded-xl text-center transition-all ${
            mobileTab === 'preview'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Vorschau
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('settings')}
          className={`flex-1 py-2 rounded-xl text-center transition-all ${
            mobileTab === 'settings'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bearbeiten
        </button>
      </div>

      {/* Main Workspace (3 columns: Slide Deck | Preview Canvas | Settings Panel) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Slide Deck Navigation */}
        <div className={`w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 ${mobileTab === 'slides' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Folien ({presentation.slides.length})
            </span>
            <button
              onClick={() => setShowTypeSelector(true)}
              className="p-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all flex items-center gap-1 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neu</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {presentation.slides.map((slide, idx) => {
              const info = SLIDE_TYPE_INFO[slide.type] || SLIDE_TYPE_INFO.wordcloud;
              const Icon = info.icon;
              const isActive = idx === activeSlideIndex;

              return (
                <div
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    if (window.innerWidth < 1024) setMobileTab('preview');
                  }}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                    isActive 
                      ? 'bg-teal-50/60 border-teal-500 shadow-xs ring-1 ring-teal-500' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-black text-slate-400 tabular-nums w-4">
                      {idx + 1}
                    </span>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${info.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-900 block truncate">
                        {slide.question || 'Neue Frage'}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">
                        {info.label}
                      </span>
                    </div>
                  </div>

                  {/* Move / Duplicate / Delete Quick Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-20"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'down'); }}
                      disabled={idx === presentation.slides.length - 1}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-20"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateSlide(idx); }}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400"
                      title="Folie duplizieren"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlide(idx); }}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                      title="Folie löschen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live 16:9 Slide Preview */}
        <div className={`flex-1 bg-slate-100 items-center justify-center p-3 sm:p-6 overflow-hidden relative ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="w-full max-w-4xl aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 rounded-3xl shadow-2xl border border-slate-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            
            {/* Top Preview Banner */}
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Smartboard Live-Vorschau</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono text-[11px]">
                Folie {activeSlideIndex + 1} / {presentation.slides.length}
              </span>
            </div>

            {/* Central Question & Slide Visualization */}
            <div className="my-auto text-center space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeSlide.question || 'Hier steht deine Frage'}
                </h2>
                {activeSlide.description && (
                  <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto">
                    {activeSlide.description}
                  </p>
                )}
              </div>

              {/* Dynamic Type Mock Preview */}
              {activeSlide.type === 'wordcloud' && (
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto py-4">
                  <span className="px-5 py-2.5 rounded-2xl bg-teal-500/20 text-teal-300 font-black text-2xl border border-teal-500/30">
                    Schule
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 font-bold text-lg border border-sky-500/30">
                    Lernen
                  </span>
                  <span className="px-6 py-3 rounded-2xl bg-emerald-500/30 text-emerald-200 font-black text-3xl border border-emerald-500/40">
                    Zukunft
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-base border border-purple-500/30">
                    Freunde
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-semibold text-sm border border-amber-500/30">
                    Digital
                  </span>
                </div>
              )}

              {activeSlide.type === 'choice' && (
                <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                  {(activeSlide.options || []).map((opt, i) => (
                    <div
                      key={opt.id || i}
                      className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-left flex items-center justify-between"
                    >
                      <span className="text-sm font-bold text-slate-100">{opt.text}</span>
                      <span className="text-xs font-mono font-black text-teal-400">0 %</span>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.type === 'open' && (
                <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto py-2">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-left text-xs text-slate-200">
                    „Schüler-Kommentare erscheinen hier als Karten...“
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-left text-xs text-slate-200">
                    „Live auf dem Smartboard sichtbar.“
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-left text-xs text-slate-200">
                    „100 % anonym & übersichtlich.“
                  </div>
                </div>
              )}

              {activeSlide.type === 'scales' && (
                <div className="space-y-2 max-w-lg mx-auto">
                  {(activeSlide.scales || []).map((sc, i) => (
                    <div key={sc.id || i} className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-left">
                      <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                        <span>{sc.statement}</span>
                        <span className="text-amber-400">Ø 4.2</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-400 w-3/4 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.type === 'quiz' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 text-rose-300 font-black border border-rose-500/30 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{activeSlide.timeLimitSeconds || 20} Sekunden Zeit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(activeSlide.options || []).map((opt, i) => (
                      <div
                        key={opt.id || i}
                        className={`p-3 rounded-xl border text-left text-xs font-bold ${
                          opt.isCorrect 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                            : 'bg-white/10 border-white/15 text-slate-200'
                        }`}
                      >
                        {opt.text} {opt.isCorrect && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSlide.type === 'content' && (
                <div className="space-y-3 max-w-lg mx-auto text-left bg-white/5 p-5 rounded-2xl border border-white/10">
                  <div className="text-4xl text-center mb-2">{activeSlide.emoji || '💡'}</div>
                  {(activeSlide.bulletPoints || []).map((pt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matrix 2x2 Preview */}
              {activeSlide.type === 'matrix' && (
                <div className="max-w-md mx-auto relative bg-white/5 p-5 rounded-2xl border border-white/10">
                  <div className="text-center text-[10px] font-bold text-teal-300 uppercase mb-1">
                    ▲ {activeSlide.matrixConfig?.yHighLabel || 'Hoher Aufwand'}
                  </div>
                  <div className="relative aspect-square max-h-52 w-full mx-auto border-2 border-dashed border-white/20 rounded-xl bg-slate-900/40 p-2 flex items-center justify-center">
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/30" />
                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/30" />
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full text-[9px] font-bold text-slate-400 p-2">
                      <span className="text-left">II</span>
                      <span className="text-right">I</span>
                      <span className="text-left self-end">III</span>
                      <span className="text-right self-end">IV</span>
                    </div>
                    {/* Sample items badge */}
                    <div className="absolute top-1/3 right-1/4 px-2 py-1 bg-teal-500 text-white rounded-md text-[10px] font-bold shadow-md animate-pulse">
                      📍 {activeSlide.matrixConfig?.items?.[0]?.label || 'These A'}
                    </div>
                  </div>
                  <div className="text-center text-[10px] font-bold text-slate-400 uppercase mt-1">
                    ▼ {activeSlide.matrixConfig?.yLowLabel || 'Geringer Aufwand'}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-1 px-1">
                    <span>◄ {activeSlide.matrixConfig?.xLowLabel || 'Geringer Nutzen'}</span>
                    <span>{activeSlide.matrixConfig?.xHighLabel || 'Hoher Nutzen'} ►</span>
                  </div>
                </div>
              )}

              {/* Ranking Preview */}
              {activeSlide.type === 'ranking' && (
                <div className="max-w-md mx-auto space-y-2">
                  {(activeSlide.rankingItems || []).map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="p-3 bg-white/10 border border-white/15 rounded-xl flex items-center gap-3 text-left"
                    >
                      <span className="w-7 h-7 rounded-lg bg-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200 flex-1 truncate">
                        {item.text}
                      </span>
                      <span className="text-slate-400 text-xs">≡</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Preview Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/10">
              <span>HBS Kahla • Live-Menti</span>
              <span>PIN: 000 000</span>
            </div>
          </div>
        </div>

        {/* Right: Slide Settings Panel */}
        <div className={`w-full lg:w-80 bg-white border-l border-slate-200 p-5 overflow-y-auto shrink-0 space-y-5 ${mobileTab === 'settings' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Slide Type Selector */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              Folientyp
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SLIDE_TYPE_INFO).map(([typeKey, info]) => {
                const isCurrent = activeSlide.type === typeKey;
                const Icon = info.icon;
                return (
                  <button
                    key={typeKey}
                    onClick={() => updateActiveSlide(s => ({ ...s, type: typeKey as MentiSlideType }))}
                    className={`p-2 rounded-xl text-left border text-xs font-bold flex items-center gap-2 transition-all ${
                      isCurrent 
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              Deine Frage / Überschrift
            </label>
            <textarea
              rows={3}
              value={activeSlide.question}
              onChange={(e) => updateActiveSlide(s => ({ ...s, question: e.target.value }))}
              placeholder="Welche Frage möchtest du stellen?"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              Zusatz-Info / Anleitung (optional)
            </label>
            <input
              type="text"
              value={activeSlide.description || ''}
              onChange={(e) => updateActiveSlide(s => ({ ...s, description: e.target.value }))}
              placeholder="z. B. Tippe bis zu 3 Stichworte ein"
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Specific Settings for Wordcloud */}
          {activeSlide.type === 'wordcloud' && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                Wörter pro Schüler
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => updateActiveSlide(s => ({ ...s, maxWordsPerUser: num }))}
                    className={`py-1.5 rounded-xl border text-xs font-black transition-all ${
                      (activeSlide.maxWordsPerUser || 3) === num 
                        ? 'bg-teal-600 text-white border-teal-600' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {num} {num === 1 ? 'Wort' : 'Wörter'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specific Settings for Choice / Quiz */}
          {(activeSlide.type === 'choice' || activeSlide.type === 'quiz') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Antwortoptionen
                </label>
                <button
                  onClick={() => updateActiveSlide(s => ({
                    ...s,
                    options: [...(s.options || []), { id: `opt-${Date.now()}`, text: `Option ${(s.options?.length || 0) + 1}` }]
                  }))}
                  className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Option hinzufügen
                </button>
              </div>

              <div className="space-y-2">
                {(activeSlide.options || []).map((opt, optIdx) => (
                  <div key={opt.id || optIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => {
                          const updated = [...(s.options || [])];
                          updated[optIdx] = { ...updated[optIdx], text: val };
                          return { ...s, options: updated };
                        });
                      }}
                      className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white outline-none"
                    />

                    {/* Mark as correct toggle */}
                    <button
                      onClick={() => {
                        updateActiveSlide(s => {
                          const updated = (s.options || []).map((o, idx) => ({
                            ...o,
                            isCorrect: idx === optIdx ? !o.isCorrect : (s.type === 'quiz' ? false : o.isCorrect)
                          }));
                          return { ...s, options: updated };
                        });
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        opt.isCorrect 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200'
                      }`}
                      title={opt.isCorrect ? 'Als richtige Antwort markiert' : 'Als richtig markieren'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove Option */}
                    {(activeSlide.options?.length || 0) > 2 && (
                      <button
                        onClick={() => {
                          updateActiveSlide(s => ({
                            ...s,
                            options: (s.options || []).filter((_, idx) => idx !== optIdx)
                          }));
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Quiz Timer Setting */}
              {activeSlide.type === 'quiz' && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Zeitlimit für Antwort
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 20, 30, 60].map(sec => (
                      <button
                        key={sec}
                        onClick={() => updateActiveSlide(s => ({ ...s, timeLimitSeconds: sec }))}
                        className={`py-1.5 rounded-xl border text-xs font-black transition-all ${
                          (activeSlide.timeLimitSeconds || 20) === sec 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specific Settings for Scales */}
          {activeSlide.type === 'scales' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Bewertungs-Thesen
                </label>
                <button
                  onClick={() => updateActiveSlide(s => ({
                    ...s,
                    scales: [...(s.scales || []), { id: `sc-${Date.now()}`, statement: 'Neue These', lowLabel: 'Wenig', highLabel: 'Sehr' }]
                  }))}
                  className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> These hinzufügen
                </button>
              </div>

              <div className="space-y-2">
                {(activeSlide.scales || []).map((sc, scIdx) => (
                  <div key={sc.id || scIdx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <input
                      type="text"
                      value={sc.statement}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => {
                          const updated = [...(s.scales || [])];
                          updated[scIdx] = { ...updated[scIdx], statement: val };
                          return { ...s, scales: updated };
                        });
                      }}
                      placeholder="These eingeben..."
                      className="w-full p-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <input
                        type="text"
                        value={sc.lowLabel || 'Gar nicht'}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveSlide(s => {
                            const updated = [...(s.scales || [])];
                            updated[scIdx] = { ...updated[scIdx], lowLabel: val };
                            return { ...s, scales: updated };
                          });
                        }}
                        placeholder="Links (1)"
                        className="p-1 rounded bg-white border border-slate-200"
                      />
                      <input
                        type="text"
                        value={sc.highLabel || 'Voll & ganz'}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveSlide(s => {
                            const updated = [...(s.scales || [])];
                            updated[scIdx] = { ...updated[scIdx], highLabel: val };
                            return { ...s, scales: updated };
                          });
                        }}
                        placeholder="Rechts (5)"
                        className="p-1 rounded bg-white border border-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specific Settings for Content */}
          {activeSlide.type === 'content' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Symbol / Emoji
                </label>
                <div className="flex gap-2">
                  {['💡', '⭐', '📌', '🏆', '🎯', '🚀'].map(em => (
                    <button
                      key={em}
                      onClick={() => updateActiveSlide(s => ({ ...s, emoji: em }))}
                      className={`w-9 h-9 rounded-xl text-lg border flex items-center justify-center ${
                        activeSlide.emoji === em ? 'bg-teal-100 border-teal-400' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Stichpunkte (pro Zeile einer)
                </label>
                <textarea
                  rows={4}
                  value={(activeSlide.bulletPoints || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateActiveSlide(s => ({ ...s, bulletPoints: lines }));
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  placeholder="Erster Punkt&#10;Zweiter Punkt"
                />
              </div>
            </div>
          )}

          {/* Specific Settings for 2x2 Matrix */}
          {activeSlide.type === 'matrix' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Achsenbeschriftungen
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">X-Achse links:</span>
                    <input
                      type="text"
                      value={activeSlide.matrixConfig?.xLowLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => ({
                          ...s,
                          matrixConfig: { ...s.matrixConfig, xLowLabel: val } as any
                        }));
                      }}
                      className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                      placeholder="Geringer Nutzen"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">X-Achse rechts:</span>
                    <input
                      type="text"
                      value={activeSlide.matrixConfig?.xHighLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => ({
                          ...s,
                          matrixConfig: { ...s.matrixConfig, xHighLabel: val } as any
                        }));
                      }}
                      className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                      placeholder="Hoher Nutzen"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Y-Achse unten:</span>
                    <input
                      type="text"
                      value={activeSlide.matrixConfig?.yLowLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => ({
                          ...s,
                          matrixConfig: { ...s.matrixConfig, yLowLabel: val } as any
                        }));
                      }}
                      className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                      placeholder="Geringer Aufwand"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Y-Achse oben:</span>
                    <input
                      type="text"
                      value={activeSlide.matrixConfig?.yHighLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => ({
                          ...s,
                          matrixConfig: { ...s.matrixConfig, yHighLabel: val } as any
                        }));
                      }}
                      className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                      placeholder="Hoher Aufwand"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Elemente / Thesen ({(activeSlide.matrixConfig?.items || []).length})
                  </label>
                  <button
                    onClick={() => {
                      const items = activeSlide.matrixConfig?.items || [];
                      updateActiveSlide(s => ({
                        ...s,
                        matrixConfig: {
                          ...s.matrixConfig,
                          items: [...items, { id: `mat-${Date.now()}`, label: `These ${items.length + 1}` }]
                        } as any
                      }));
                    }}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Element
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(activeSlide.matrixConfig?.items || []).map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveSlide(s => {
                            const updated = [...(s.matrixConfig?.items || [])];
                            updated[idx] = { ...updated[idx], label: val };
                            return { ...s, matrixConfig: { ...s.matrixConfig, items: updated } as any };
                          });
                        }}
                        className="flex-1 p-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 font-medium"
                      />
                      {(activeSlide.matrixConfig?.items || []).length > 1 && (
                        <button
                          onClick={() => {
                            updateActiveSlide(s => ({
                              ...s,
                              matrixConfig: {
                                ...s.matrixConfig,
                                items: (s.matrixConfig?.items || []).filter((_, i) => i !== idx)
                              } as any
                            }));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specific Settings for Ranking */}
          {activeSlide.type === 'ranking' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Reihenfolge-Elemente ({(activeSlide.rankingItems || []).length})
                </label>
                {(activeSlide.rankingItems || []).length < 6 && (
                  <button
                    onClick={() => {
                      const items = activeSlide.rankingItems || [];
                      updateActiveSlide(s => ({
                        ...s,
                        rankingItems: [...items, { id: `rnk-${Date.now()}`, text: `Neues Element ${items.length + 1}` }]
                      }));
                    }}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Element
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {(activeSlide.rankingItems || []).map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-1.5">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveSlide(s => {
                          const updated = [...(s.rankingItems || [])];
                          updated[idx] = { ...updated[idx], text: val };
                          return { ...s, rankingItems: updated };
                        });
                      }}
                      className="flex-1 p-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 font-medium"
                    />
                    {(activeSlide.rankingItems || []).length > 2 && (
                      <button
                        onClick={() => {
                          updateActiveSlide(s => ({
                            ...s,
                            rankingItems: (s.rankingItems || []).filter((_, i) => i !== idx)
                          }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Tipp: Die Reihenfolge hier entspricht der Vorgabe. Schüler sortieren sie per Drag & Drop auf dem Smartphone.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Slide Modal / Dropdown */}
      {showTypeSelector && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setShowTypeSelector(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-fadeIn cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Neuen Folientyp auswählen</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTypeSelector(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(SLIDE_TYPE_INFO).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleAddSlide(key as MentiSlideType)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-left flex flex-col gap-1.5 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${info.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900 group-hover:text-teal-700">
                        {info.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
