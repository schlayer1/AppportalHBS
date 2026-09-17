import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Trash2, 
  Settings2, 
  Layers, 
  MessageSquare,
  Sliders,
  Award
} from 'lucide-react';
import { MentiSlide, MentiSlideType } from '../../types/mentiTypes';
import { geminiService } from '../../services/geminiService';

export interface MentiAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySlides: (slides: MentiSlide[], meta?: { title: string; topic: string; subject: string; grade: string }) => void;
  onOpenSettings?: () => void;
}

const DIDACTIC_GOALS = [
  {
    id: 'mix',
    title: 'Komplettes Stundenpaket (Empfohlen)',
    desc: 'Perfekte Dramaturgie: Einstiegs-Wortwolke, Wissensabfrage & Reflexionsskala.',
    icon: Layers
  },
  {
    id: 'einstieg',
    title: 'Stundeneinstieg & Vorwissen',
    desc: 'Wortwolke und offene Kärtchen-Sammlung zur Aktivierung aller Schüler.',
    icon: MessageSquare
  },
  {
    id: 'quiz',
    title: 'Lernzielkontrolle & Wissens-Quiz',
    desc: 'Multiple-Choice und Quiz-Wettbewerb mit Countdown und Leaderboard.',
    icon: Award
  },
  {
    id: 'meinung',
    title: 'Diskussion, Skalen & Meinungsbild',
    desc: 'Likert-Bewertungsskalen (1-5) und offene Thesen für Pro/Contra-Debatten.',
    icon: Sliders
  }
];

const SUBJECTS = [
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

const GRADES = [
  'Klasse 5',
  'Klasse 6',
  'Klasse 7',
  'Klasse 8',
  'Klasse 9',
  'Klasse 10',
  'Alle Jahrgänge'
];

export const MentiAiModal: React.FC<MentiAiModalProps> = ({
  isOpen,
  onClose,
  onApplySlides,
  onOpenSettings
}) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  
  // Input form state
  const [subject, setSubject] = useState<string>('Biologie');
  const [grade, setGrade] = useState<string>('Klasse 8');
  const [topic, setTopic] = useState<string>('');
  const [goal, setGoal] = useState<string>('mix');
  const [slideCount, setSlideCount] = useState<number>(3);
  
  // Loading & Result state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<MentiSlide[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Bitte geben Sie ein Unterrichtsthema oder Stichworte ein.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const prompt = `Du bist ein erfahrener Gymnasial- und Realschullehrer an der Staatlichen Regelschule Heimbürgeschule Kahla.
Erstelle genau ${slideCount} interaktive Folien für das interaktive HBS Menti-Portal.
Fach: "${subject}"
Klassenstufe: "${grade}"
Unterrichtsthema: "${topic.trim()}"
Didaktisches Ziel: "${goal}" (z. B. Mix, Einstieg, Quiz oder Meinung)

UNTERSTÜTZTE FOLIEN-TYPEN:
- "wordcloud" (Wortwolke, Frage erfordert 1-3 Stichworte, Feld "maxWordsPerUser": 3)
- "choice" (Multiple-Choice, Frage + Array von 3-4 Optionen mit Text)
- "quiz" (Wettbewerbs-Quizfrage mit exakt 1 korrekter Antwort und 3 Distraktoren, isCorrect: true/false, Zeitlimit 20s)
- "scales" (Likert-Skala 1-5, Frage + Array "scales" mit je 2-3 Thesen/Statements mit lowLabel und highLabel)
- "open" (Offene Kärtchen-Sammlung / Brainstorming-Frage)

WICHTIGE DIDAKTISCHE VORGABEN:
1. Passend für Thüringer Lehrpläne und die angegebene Klassenstufe formulieren.
2. Fragen klar, packend und interaktiv für Schüler gestalten.
3. Antworte STRIKT im folgenden JSON-Format ohne Markdown-Codeblöcke:
{
  "presentationTitle": "Passender prägnanter Titel für die Abfrage",
  "slides": [
    {
      "type": "wordcloud",
      "question": "Fragetext hier?",
      "maxWordsPerUser": 3
    },
    {
      "type": "choice",
      "question": "Fragetext hier?",
      "options": [
        { "text": "Option A" },
        { "text": "Option B" },
        { "text": "Option C" }
      ]
    },
    {
      "type": "scales",
      "question": "Wie schätzt ihr folgende Aussagen ein?",
      "scales": [
        { "statement": "Aussage 1", "lowLabel": "Stimmt gar nicht", "highLabel": "Stimmt voll" },
        { "statement": "Aussage 2", "lowLabel": "Trifft nicht zu", "highLabel": "Trifft zu" }
      ]
    }
  ]
}`;

      const res = await geminiService.executeWithCascade({
        prompt,
        systemInstruction: 'Du bist ein erfahrener Fachdidaktiker und erstellst hochwertige interaktive Unterrichtsfolien als valides JSON.',
        temperature: 0.35,
        responseMimeType: 'application/json',
      });

      const cleanJson = geminiService.cleanJsonOutput(res.text);
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        const mappedSlides: MentiSlide[] = parsed.slides.map((s: any, idx: number) => {
          const slideId = `slide-${Date.now()}-${idx + 1}`;
          const type: MentiSlideType = ['wordcloud', 'choice', 'quiz', 'scales', 'open', 'matrix', 'ranking', 'content'].includes(s.type)
            ? s.type
            : 'choice';

          return {
            id: slideId,
            type,
            question: String(s.question || 'Neue Frage'),
            maxWordsPerUser: s.maxWordsPerUser || (type === 'wordcloud' ? 3 : undefined),
            options: Array.isArray(s.options) ? s.options.map((opt: any, oIdx: number) => ({
              id: `opt-${Date.now()}-${idx}-${oIdx}`,
              text: String(opt.text || opt.label || `Option ${oIdx + 1}`),
              isCorrect: Boolean(opt.isCorrect)
            })) : undefined,
            scales: Array.isArray(s.scales) ? s.scales.map((sc: any, scIdx: number) => ({
              id: `scale-${Date.now()}-${idx}-${scIdx}`,
              statement: String(sc.statement || sc.text || `These ${scIdx + 1}`),
              lowLabel: String(sc.lowLabel || 'Stimmt nicht'),
              highLabel: String(sc.highLabel || 'Stimmt voll')
            })) : undefined,
          };
        });

        setGeneratedTitle(parsed.presentationTitle || `${topic} (${subject})`);
        setGeneratedSlides(mappedSlides);
        setStep('review');
      } else {
        throw new Error('Das empfangene Format konnte nicht verarbeitet werden.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Fehler bei der KI-Generierung. Bitte prüfe den API-Schlüssel.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = (index: number, newText: string) => {
    const updated = [...generatedSlides];
    updated[index].question = newText;
    setGeneratedSlides(updated);
  };

  const handleDeleteSlide = (index: number) => {
    setGeneratedSlides(generatedSlides.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    if (generatedSlides.length === 0) return;
    onApplySlides(generatedSlides, {
      title: generatedTitle || `${topic} – Live-Abfrage`,
      topic,
      subject,
      grade
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-200">
                  HBS Menti Studio
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black">
                  Gemini KI-Generator
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {step === 'input' ? 'Interaktive Folien mit KI generieren' : 'Generierte Folien prüfen & übernehmen'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
                title="KI-Modell & API-Key konfigurieren"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-700 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-600 font-bold text-xs">✕</button>
            </div>
          )}

          {step === 'input' ? (
            <>
              {/* Subject & Grade Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-xs text-slate-800 mb-1">
                    Unterrichtsfach:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none cursor-pointer"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-800 mb-1">
                    Klassenstufe:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none cursor-pointer"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block font-bold text-xs text-slate-800 mb-1">
                  Unterrichtsthema oder Leitfrage:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="z. B. Photosynthese & Blattaufbau, Weimarer Republik, Prozentrechnung..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-all"
                />
              </div>

              {/* Didactic Goal Selection */}
              <div>
                <label className="block font-bold text-xs text-slate-800 mb-2">
                  Didaktischer Schwerpunkt:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIDACTIC_GOALS.map((dg) => {
                    const Icon = dg.icon;
                    const isSelected = goal === dg.id;
                    return (
                      <button
                        key={dg.id}
                        type="button"
                        onClick={() => setGoal(dg.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-xs font-black ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                            {dg.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal pl-8">
                          {dg.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slide Count Slider / Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-bold text-xs text-slate-800">
                  Anzahl der Folien:
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSlideCount(cnt)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        slideCount === cnt
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cnt} Folien
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Review Step */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Titel der Abfrage</span>
                  <input
                    type="text"
                    value={generatedTitle}
                    onChange={(e) => setGeneratedTitle(e.target.value)}
                    className="w-full font-black text-sm text-slate-900 border-b border-dashed border-slate-300 hover:border-teal-500 focus:border-teal-600 focus:outline-none bg-transparent"
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  {generatedSlides.length} {generatedSlides.length === 1 ? 'Folie' : 'Folien'}
                </span>
              </div>

              {generatedSlides.map((slide, sIdx) => (
                <div 
                  key={slide.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[10px] flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        {slide.type === 'wordcloud' && 'Wortwolke'}
                        {slide.type === 'choice' && 'Multiple Choice'}
                        {slide.type === 'quiz' && 'Quiz-Wettbewerb'}
                        {slide.type === 'scales' && 'Bewertungsskala'}
                        {slide.type === 'open' && 'Offene Fragen'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSlide(sIdx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Diese Folie verwerfen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={slide.question}
                    onChange={(e) => handleUpdateQuestion(sIdx, e.target.value)}
                    className="w-full font-bold text-xs text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none"
                  />

                  {/* Preview of options or scales */}
                  {slide.options && slide.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {slide.options.map((opt, oIdx) => (
                        <div key={opt.id || oIdx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] flex items-center justify-between gap-1 text-slate-700">
                          <span className="truncate">{opt.text}</span>
                          {opt.isCorrect && (
                            <span className="text-[10px] text-emerald-600 font-bold">✓ Richtig</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {slide.scales && slide.scales.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1">
                      {slide.scales.map((sc, scIdx) => (
                        <div key={sc.id || scIdx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                          {sc.statement}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Gemini generiert Folien...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Folien jetzt entwerfen</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
              >
                Zurück zum Formular
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={generatedSlides.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>In Menti-Präsentation übernehmen</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
