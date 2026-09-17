import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Trash2, 
  Key, 
  AlertCircle, 
  Loader2, 
  ArrowRight
} from 'lucide-react';
import { 
  AiQuizRequest, 
  generateQuizQuestionsWithAi, 
  getStoredApiKey, 
  setStoredApiKey, 
  convertDraftToKahootQuestion 
} from '../../services/aiQuizGenerator';
import { AiGeneratedQuestionDraft, KahootQuestion } from '../../types/kahootTypes';

interface KahootAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: KahootQuestion[]) => void;
  defaultSubject?: string;
  defaultGrade?: string;
}

const SUBJECTS = [
  'Mathematik', 'Deutsch', 'Englisch', 'Biologie', 'Physik', 
  'Chemie', 'Geschichte', 'Geografie', 'Wirtschaft / Recht', 
  'Ethik / Religion', 'Informatik', 'Kunst', 'Musik', 'Sport'
];

const GRADES = [
  'Klasse 5', 'Klasse 6', 'Klasse 7', 'Klasse 8', 'Klasse 9', 'Klasse 10'
];

export const KahootAiModal: React.FC<KahootAiModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  defaultSubject = 'Biologie',
  defaultGrade = 'Klasse 7'
}) => {
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [subject, setSubject] = useState<string>(defaultSubject);
  const [grade, setGrade] = useState<string>(defaultGrade);
  const [topic, setTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'einfach' | 'mittel' | 'schwer'>('mittel');
  const [contextText, setContextText] = useState<string>('');
  
  // API Key management
  const [apiKey, setApiKey] = useState<string>(() => getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review Drafts
  const [drafts, setDrafts] = useState<AiGeneratedQuestionDraft[]>([]);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    if (!topic.trim()) {
      setErrorMsg('Bitte gib ein Unterrichtsthema oder Stichworte ein.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (apiKey) setStoredApiKey(apiKey);

      const request: AiQuizRequest = {
        subject,
        grade,
        topic: topic.trim(),
        questionCount,
        difficulty,
        contextText: contextText.trim() || undefined,
        apiKey: apiKey.trim() || undefined
      };

      const result = await generateQuizQuestionsWithAi(request);
      setDrafts(result);
      setStep('review');
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Generieren der Fragen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraftQuestion = (index: number, newText: string) => {
    const updated = [...drafts];
    updated[index].question = newText;
    setDrafts(updated);
  };

  const handleUpdateDraftOption = (qIndex: number, optIndex: number, newText: string) => {
    const updated = [...drafts];
    updated[qIndex].options[optIndex].text = newText;
    setDrafts(updated);
  };

  const handleSetCorrectOption = (qIndex: number, correctOptIndex: number) => {
    const updated = [...drafts];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === correctOptIndex
    }));
    setDrafts(updated);
  };

  const handleDeleteDraft = (index: number) => {
    const updated = drafts.filter((_, idx) => idx !== index);
    setDrafts(updated);
  };

  const handleFinishImport = () => {
    const converted = drafts.map((d, i) => convertDraftToKahootQuestion(d, i));
    onImportQuestions(converted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  KI-Quiz-Generator
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'config' 
                  ? 'Lehrplan-Thema eingeben und Quizfragen blitzschnell formulieren lassen' 
                  : 'Fragen prüfen, korrigieren und direkt in dein Quiz übernehmen'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CONFIGURATION FORM */}
          {step === 'config' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Schulfach
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Klassenstufe
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic / Prompt */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Unterrichtsthema oder Inhalt <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="z. B. Die Französische Revolution, Photosynthese, Bruchrechnung"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Question Count & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Anzahl der Fragen
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 5, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          questionCount === cnt 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Schwierigkeitsgrad
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['einfach', 'mittel', 'schwer'] as const).map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-2 rounded-xl text-xs font-black capitalize transition-all border ${
                          difficulty === diff 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Text Context */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Textauszug / Schulbuch-Absatz (optional)
                </label>
                <textarea
                  rows={3}
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Kopiere hier optional einen Text aus dem Schulbuch oder Arbeitsblatt hinein, aus dem die KI konkrete Fragen formulieren soll..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* API Key Toggle & Input */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{apiKey ? '✓ Gemini API-Key hinterlegt (Klicken zum Ändern)' : 'Gemini API-Key eingeben (optional)'}</span>
                </button>

                {showKeyInput && (
                  <div className="mt-2 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5 animate-fadeIn">
                    <span className="text-[11px] text-purple-950 font-bold block">
                      Google Gemini API-Key:
                    </span>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      Wird sicher in deinem lokalen Browser gespeichert. Wenn kein Key hinterlegt ist, erstellt die KI automatisch qualitativ hochwertige Lehrplan-Vorlagen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & TEACHER EDITING */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-950">
                  {drafts.length} Fragen generiert. Du kannst Fragen & Antworten vor der Übernahme anpassen:
                </span>
                <span className="text-[11px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-bold">
                  Korrekturmodus
                </span>
              </div>

              <div className="space-y-4">
                {drafts.map((draft, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-white border-2 border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center font-mono shrink-0">
                        {qIdx + 1}
                      </span>
                      
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Fragetext
                        </label>
                        <input
                          type="text"
                          value={draft.question}
                          onChange={(e) => handleUpdateDraftQuestion(qIdx, e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteDraft(qIdx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                        title="Frage verwerfen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Answer Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {draft.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                            opt.isCorrect 
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                              opt.isCorrect 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'bg-white border border-slate-300 text-slate-400 hover:border-emerald-500'
                            }`}
                            title={opt.isCorrect ? 'Richtige Lösung' : 'Als richtig markieren'}
                          >
                            {opt.isCorrect ? <Check className="w-3.5 h-3.5" /> : (optIdx + 1)}
                          </button>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateDraftOption(qIdx, optIdx, e.target.value)}
                            className="flex-1 bg-transparent text-xs font-medium outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {draft.explanation && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600">Erklärung:</span> {draft.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          {step === 'config' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>KI formuliert Fragen...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Fragen generieren</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('config')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                ← Zurück zur Konfiguration
              </button>

              <button
                type="button"
                onClick={handleFinishImport}
                disabled={drafts.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{drafts.length} Fragen in Quiz übernehmen</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
