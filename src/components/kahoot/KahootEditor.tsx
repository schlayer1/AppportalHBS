import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Copy, 
  Sparkles, 
  Clock, 
  Award, 
  Check, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { KahootGame, KahootQuestion, KahootOption, KahootShape } from '../../types/kahootTypes';
import { KahootAiModal } from './KahootAiModal';

interface KahootEditorProps {
  initialGame: KahootGame;
  onClose: () => void;
  onStartPresenter: (game: KahootGame) => void;
}

const SUBJECT_LIST = [
  'Mathematik', 'Deutsch', 'Englisch', 'Biologie', 'Physik', 
  'Chemie', 'Geschichte', 'Geografie', 'Wirtschaft / Recht', 
  'Ethik / Religion', 'Informatik', 'Kunst', 'Musik', 'Sport'
];

const GRADES = [
  'Klasse 5', 'Klasse 6', 'Klasse 7', 'Klasse 8', 'Klasse 9', 'Klasse 10', 'Oberstufe'
];

const SHAPE_CONFIG: { shape: KahootShape; color: 'red' | 'blue' | 'yellow' | 'green'; label: string; icon: string; bgClass: string }[] = [
  { shape: 'triangle', color: 'red', label: 'Rot 🔺 Dreieck', icon: '🔺', bgClass: 'bg-red-500 hover:bg-red-600 text-white' },
  { shape: 'diamond', color: 'blue', label: 'Blau 🔷 Raute', icon: '🔷', bgClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { shape: 'circle', color: 'yellow', label: 'Gelb 🟡 Kreis', icon: '🟡', bgClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { shape: 'square', color: 'green', label: 'Grün 🟩 Quadrat', icon: '🟩', bgClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
];

export const KahootEditor: React.FC<KahootEditorProps> = ({
  initialGame,
  onClose,
  onStartPresenter,
}) => {
  const { saveKahootGame } = useAuth();

  const [game, setGame] = useState<KahootGame>(initialGame);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const currentQ: KahootQuestion | undefined = game.questions[selectedQuestionIndex];

  const handleSave = () => {
    const updated = {
      ...game,
      updatedAt: Date.now()
    };
    saveKahootGame(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleAddQuestion = () => {
    const newQ: KahootQuestion = {
      id: `q-${Date.now()}-${game.questions.length + 1}`,
      question: 'Neue Quizfrage eingeben...',
      timeLimitSeconds: 20,
      points: 1000,
      type: 'quiz',
      options: [
        { id: `opt-${Date.now()}-1`, text: 'Option 1', isCorrect: true, shape: 'triangle', color: 'red' },
        { id: `opt-${Date.now()}-2`, text: 'Option 2', isCorrect: false, shape: 'diamond', color: 'blue' },
        { id: `opt-${Date.now()}-3`, text: 'Option 3', isCorrect: false, shape: 'circle', color: 'yellow' },
        { id: `opt-${Date.now()}-4`, text: 'Option 4', isCorrect: false, shape: 'square', color: 'green' }
      ]
    };

    const newQuestions = [...game.questions, newQ];
    setGame({ ...game, questions: newQuestions });
    setSelectedQuestionIndex(newQuestions.length - 1);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const orig = game.questions[idx];
    const duplicated: KahootQuestion = {
      ...orig,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      options: orig.options.map(o => ({ ...o, id: `opt-${Date.now()}-${Math.random()}` }))
    };

    const newQuestions = [...game.questions];
    newQuestions.splice(idx + 1, 0, duplicated);
    setGame({ ...game, questions: newQuestions });
    setSelectedQuestionIndex(idx + 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (game.questions.length <= 1) {
      alert('Ein Quiz muss mindestens eine Frage enthalten.');
      return;
    }
    const newQuestions = game.questions.filter((_, i) => i !== idx);
    setGame({ ...game, questions: newQuestions });
    setSelectedQuestionIndex(Math.max(0, idx - 1));
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= game.questions.length) return;

    const newQuestions = [...game.questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;

    setGame({ ...game, questions: newQuestions });
    setSelectedQuestionIndex(targetIdx);
  };

  const handleUpdateCurrentQuestion = (updates: Partial<KahootQuestion>) => {
    if (!currentQ) return;
    const updatedQ = { ...currentQ, ...updates };
    const newQuestions = [...game.questions];
    newQuestions[selectedQuestionIndex] = updatedQ;
    setGame({ ...game, questions: newQuestions });
  };

  const handleUpdateOptionText = (optIndex: number, text: string) => {
    if (!currentQ) return;
    const newOpts = [...currentQ.options];
    newOpts[optIndex] = { ...newOpts[optIndex], text };
    handleUpdateCurrentQuestion({ options: newOpts });
  };

  const handleToggleCorrectOption = (optIndex: number) => {
    if (!currentQ) return;
    const newOpts = [...currentQ.options];
    newOpts[optIndex] = { ...newOpts[optIndex], isCorrect: !newOpts[optIndex].isCorrect };
    // Ensure at least one correct option exists
    if (!newOpts.some(o => o.isCorrect)) {
      newOpts[optIndex].isCorrect = true;
    }
    handleUpdateCurrentQuestion({ options: newOpts });
  };

  const handleSetQuestionType = (type: 'quiz' | 'true_false') => {
    if (!currentQ) return;
    if (type === 'true_false') {
      const tfOptions: KahootOption[] = [
        { id: `opt-tf-1`, text: 'Wahr', isCorrect: true, shape: 'diamond', color: 'blue' },
        { id: `opt-tf-2`, text: 'Falsch', isCorrect: false, shape: 'triangle', color: 'red' }
      ];
      handleUpdateCurrentQuestion({ type: 'true_false', options: tfOptions });
    } else {
      const quizOptions: KahootOption[] = [
        { id: `opt-q-1`, text: currentQ.options[0]?.text || 'Option 1', isCorrect: true, shape: 'triangle', color: 'red' },
        { id: `opt-q-2`, text: currentQ.options[1]?.text || 'Option 2', isCorrect: false, shape: 'diamond', color: 'blue' },
        { id: `opt-q-3`, text: 'Option 3', isCorrect: false, shape: 'circle', color: 'yellow' },
        { id: `opt-q-4`, text: 'Option 4', isCorrect: false, shape: 'square', color: 'green' }
      ];
      handleUpdateCurrentQuestion({ type: 'quiz', options: quizOptions });
    }
  };

  const handleImportAiQuestions = (newQuestions: KahootQuestion[]) => {
    const updatedQuestions = [...game.questions, ...newQuestions];
    setGame({ ...game, questions: updatedQuestions });
    setSelectedQuestionIndex(game.questions.length);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col font-sans select-none overflow-hidden text-white">
      
      {/* Top Header */}
      <header className="h-16 bg-slate-950 border-b border-purple-900/40 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleSave();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Zurück zum Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={game.title}
              onChange={e => setGame({ ...game, title: e.target.value })}
              className="bg-transparent hover:bg-white/5 focus:bg-white/10 px-2 py-0.5 rounded-lg font-black text-base text-white border-b border-transparent focus:border-purple-400 outline-none w-64 sm:w-80 truncate"
              placeholder="Quiz-Titel eingeben..."
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-purple-300/80 font-bold">
              <span>{game.subject || 'Fach'}</span>
              <span>•</span>
              <span>{game.grade || 'Stufe'}</span>
              <span>•</span>
              <span>{game.questions.length} Fragen</span>
            </div>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-black text-xs shadow-md transition-all active:scale-95"
            title="✨ Neue Fragen mit KI generieren"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">✨ KI-Fragen ergänzen</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs transition-all active:scale-95 ${
              isSavedRecently 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isSavedRecently ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSavedRecently ? 'Gespeichert!' : 'Speichern'}</span>
          </button>

          <button
            onClick={() => {
              handleSave();
              onStartPresenter(game);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Live Spielen</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Question Deck */}
        <aside className="w-56 sm:w-64 bg-slate-950/90 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Fragen ({game.questions.length})
            </span>
            <button
              onClick={handleAddQuestion}
              className="p-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              title="Neue leere Frage"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neu</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {game.questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex;
              return (
                <div
                  key={q.id || idx}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all relative group ${
                    isSelected 
                      ? 'bg-purple-950/60 border-purple-500 shadow-md ring-2 ring-purple-500/20' 
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="w-5 h-5 rounded-md bg-white/10 text-white text-[11px] font-black flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {q.timeLimitSeconds}s • {q.points} Pkt
                    </span>

                    {/* Actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateQuestion(idx); }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-300"
                        title="Duplizieren"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(idx); }}
                        className="p-1 rounded hover:bg-red-900/50 text-red-400"
                        title="Löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-tight">
                    {q.question || '(Ohne Fragetext)'}
                  </p>

                  {/* Micro color shapes */}
                  <div className="flex items-center gap-1 mt-2">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`w-2.5 h-2.5 rounded-full ${
                          opt.color === 'red' ? 'bg-red-500' :
                          opt.color === 'blue' ? 'bg-blue-500' :
                          opt.color === 'yellow' ? 'bg-amber-400' : 'bg-emerald-500'
                        } ${opt.isCorrect ? 'ring-1 ring-white' : 'opacity-40'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => handleMoveQuestion(selectedQuestionIndex, 'up')}
              disabled={selectedQuestionIndex === 0}
              className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center gap-1"
            >
              <ChevronUp className="w-4 h-4" /> Nach oben
            </button>
            <button
              onClick={() => handleMoveQuestion(selectedQuestionIndex, 'down')}
              disabled={selectedQuestionIndex === game.questions.length - 1}
              className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 text-xs font-bold flex items-center justify-center gap-1"
            >
              <ChevronDown className="w-4 h-4" /> Nach unten
            </button>
          </div>
        </aside>

        {/* CENTER: Canvas Editor */}
        <main className="flex-1 bg-slate-900/50 flex flex-col overflow-y-auto p-4 sm:p-8 items-center justify-start">
          {currentQ ? (
            <div className="max-w-4xl w-full space-y-6">
              
              {/* Question Input Card */}
              <div className="bg-slate-950/80 border-2 border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-400">
                  <span>Frage {selectedQuestionIndex + 1} von {game.questions.length}</span>
                  <span className="text-slate-400">Smartboard-Vollbildanzeige</span>
                </div>

                <textarea
                  rows={2}
                  value={currentQ.question}
                  onChange={e => handleUpdateCurrentQuestion({ question: e.target.value })}
                  placeholder="Gib hier deine Frage ein..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-lg sm:text-xl font-black text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 leading-snug resize-none"
                />

                {/* Optional Explanation */}
                <input
                  type="text"
                  value={currentQ.explanation || ''}
                  onChange={e => handleUpdateCurrentQuestion({ explanation: e.target.value })}
                  placeholder="Optionale Auflösung / Erklärung (wird nach der Antwortrunde gezeigt)..."
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4 Large Kahoot Shape Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options.map((opt, oIdx) => {
                  const shapeMeta = SHAPE_CONFIG.find(s => s.shape === opt.shape) || SHAPE_CONFIG[oIdx % 4];

                  return (
                    <div
                      key={opt.id || oIdx}
                      className={`relative rounded-3xl p-4 sm:p-5 flex items-center gap-3 transition-all border-2 ${
                        opt.color === 'red' ? 'bg-red-600/90 border-red-500 hover:bg-red-600' :
                        opt.color === 'blue' ? 'bg-blue-600/90 border-blue-500 hover:bg-blue-600' :
                        opt.color === 'yellow' ? 'bg-amber-500/90 border-amber-400 hover:bg-amber-500' :
                        'bg-emerald-600/90 border-emerald-500 hover:bg-emerald-600'
                      } ${opt.isCorrect ? 'ring-4 ring-white/40 shadow-xl' : 'opacity-90'}`}
                    >
                      {/* Geometric Shape Icon */}
                      <span className="text-2xl drop-shadow-md shrink-0">
                        {shapeMeta.icon}
                      </span>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={opt.text}
                        onChange={e => handleUpdateOptionText(oIdx, e.target.value)}
                        placeholder={`Antwort ${oIdx + 1}...`}
                        className="flex-1 bg-black/20 hover:bg-black/30 focus:bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-sm sm:text-base font-black text-white placeholder:text-white/60 focus:outline-none"
                      />

                      {/* Correct / Incorrect Check Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleCorrectOption(oIdx)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          opt.isCorrect
                            ? 'bg-white text-emerald-700 shadow-md ring-2 ring-white scale-110'
                            : 'bg-black/30 text-white/40 hover:text-white hover:bg-black/50 border border-white/30'
                        }`}
                        title={opt.isCorrect ? 'Richtige Antwort' : 'Als richtig markieren'}
                      >
                        <Check className={`w-5 h-5 stroke-[3] ${opt.isCorrect ? 'opacity-100' : 'opacity-30'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500">Keine Frage ausgewählt</div>
          )}
        </main>

        {/* RIGHT COLUMN: Settings Panel */}
        <aside className="w-64 bg-slate-950/90 border-l border-slate-800 p-4 space-y-6 overflow-y-auto shrink-0 hidden lg:block">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Frage-Einstellungen
            </h4>

            {currentQ && (
              <div className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                    Fragetyp
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetQuestionType('quiz')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        currentQ.type === 'quiz'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Quiz (4)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuestionType('true_false')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        currentQ.type === 'true_false'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Wahr / Falsch
                    </button>
                  </div>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Zeitlimit
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[10, 20, 30, 60].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleUpdateCurrentQuestion({ timeLimitSeconds: sec })}
                        className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                          currentQ.timeLimitSeconds === sec
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Punkte
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 1000, label: '1000 Pkt' },
                      { val: 2000, label: '2x (2000)' },
                      { val: 0, label: '0 Pkt' },
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handleUpdateCurrentQuestion({ points: p.val })}
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          currentQ.points === p.val
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              Quiz-Metadaten
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Fach</label>
              <select
                value={game.subject || 'Mathematik'}
                onChange={e => setGame({ ...game, subject: e.target.value })}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
              >
                {SUBJECT_LIST.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Klassenstufe</label>
              <select
                value={game.grade || 'Klasse 7'}
                onChange={e => setGame({ ...game, grade: e.target.value })}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
              >
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

      </div>

      {/* AI Generator Modal */}
      <KahootAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImportQuestions={handleImportAiQuestions}
        defaultSubject={game.subject || 'Mathematik'}
        defaultGrade={game.grade || 'Klasse 7'}
      />

    </div>
  );
};
