import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Lock, 
  ArrowRight,
  X
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MentiLiveSession, MentiSlide } from '../../types/mentiTypes';

interface MentiStudentVoterProps {
  initialCode?: string;
  onClose?: () => void;
}

export const MentiStudentVoter: React.FC<MentiStudentVoterProps> = ({
  initialCode = '',
  onClose
}) => {
  const [pinCode, setPinCode] = useState<string>(() => {
    // Extract PIN from URL query param if present
    if (initialCode) return initialCode;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('menti');
      if (p && p.length === 6) return p;
    }
    return '';
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [session, setSession] = useState<MentiLiveSession | null>(null);
  const [hasJoined, setHasJoined] = useState<boolean>(!!pinCode);

  // Student Nickname (especially for Quiz)
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('hbs_menti_student_nick') || '';
  });

  // State of votes for current slide
  const [hasVotedForCurrentSlide, setHasVotedForCurrentSlide] = useState<boolean>(false);
  const [votedSlideId, setVotedSlideId] = useState<string | null>(null);

  // Wordcloud inputs (1 to 3 words)
  const [words, setWords] = useState<string[]>(['', '', '']);

  // Open-ended input
  const [openText, setOpenText] = useState<string>('');

  // Scales values (statementId -> number 1..5)
  const [scaleValues, setScaleValues] = useState<Record<string, number>>({});

  // Listen to Firestore active Menti Session
  useEffect(() => {
    if (!db) return;
    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      const unsubscribe = onSnapshot(portalDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.activeMentiSession) {
            setSession(d.activeMentiSession);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore voter listener error:', e);
    }
  }, []);

  // When active slide changes in the session, reset vote state for new slide!
  useEffect(() => {
    if (session?.activeSlide) {
      if (session.activeSlide.id !== votedSlideId) {
        setHasVotedForCurrentSlide(false);
        setWords(['', '', '']);
        setOpenText('');
        // Initialize scales
        if (session.activeSlide.type === 'scales' && session.activeSlide.scales) {
          const initialScales: Record<string, number> = {};
          session.activeSlide.scales.forEach(s => { initialScales[s.id] = 3; });
          setScaleValues(initialScales);
        }
      }
    }
  }, [session?.activeSlide?.id, session?.currentSlideIndex]);

  // Send realtime floating reaction (❤️, 👍, 💡, 👏, 🎉)
  const handleSendReaction = async (emoji: string) => {
    if (!db || !session) return;
    const reaction = {
      id: `r-${Date.now()}-${Math.random()}`,
      emoji,
      xOffset: Math.floor(Math.random() * 70) + 15,
      timestamp: Date.now()
    };

    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      await updateDoc(portalDocRef, {
        'activeMentiSession.recentReactions': arrayUnion(reaction)
      });
    } catch (e) {
      console.warn('Reaction error:', e);
    }
  };

  // Submit Word Cloud
  const handleSubmitWordCloud = async () => {
    if (!session || !db) return;
    const cleanWords = words.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    if (cleanWords.length === 0) return;

    setHasVotedForCurrentSlide(true);
    setVotedSlideId(session.activeSlide.id);

    try {
      const updates: Record<string, any> = {};
      cleanWords.forEach(w => {
        // Capitalize first letter
        const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
        updates[`activeMentiSession.responses.${session.activeSlide.id}.${capitalized}`] = increment(1);
      });
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      await updateDoc(portalDocRef, updates);
    } catch (e) {
      console.warn('Submit word error:', e);
    }
  };

  // Submit Choice
  const handleSelectChoice = async (optionId: string) => {
    if (!session || !db || !session.isVotingOpen) return;
    setHasVotedForCurrentSlide(true);
    setVotedSlideId(session.activeSlide.id);

    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      await updateDoc(portalDocRef, {
        [`activeMentiSession.responses.${session.activeSlide.id}.${optionId}`]: increment(1)
      });
    } catch (e) {
      console.warn('Submit choice error:', e);
    }
  };

  // Submit Open-ended
  const handleSubmitOpen = async () => {
    if (!session || !db || !openText.trim()) return;
    setHasVotedForCurrentSlide(true);
    setVotedSlideId(session.activeSlide.id);

    const newResponse = {
      id: `resp-${Date.now()}-${Math.random()}`,
      text: openText.trim(),
      timestamp: Date.now()
    };

    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      await updateDoc(portalDocRef, {
        [`activeMentiSession.responses.${session.activeSlide.id}`]: arrayUnion(newResponse)
      });
    } catch (e) {
      console.warn('Submit open error:', e);
    }
  };

  // Submit Scales
  const handleSubmitScales = async () => {
    if (!session || !db) return;
    setHasVotedForCurrentSlide(true);
    setVotedSlideId(session.activeSlide.id);

    try {
      const updates: Record<string, any> = {};
      Object.entries(scaleValues).forEach(([scId, val]) => {
        updates[`activeMentiSession.responses.${session.activeSlide.id}.${scId}.sum`] = increment(val);
        updates[`activeMentiSession.responses.${session.activeSlide.id}.${scId}.count`] = increment(1);
      });
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      await updateDoc(portalDocRef, updates);
    } catch (e) {
      console.warn('Submit scales error:', e);
    }
  };

  // Submit Quiz Choice
  const handleSelectQuiz = async (optionId: string, isCorrect: boolean) => {
    if (!session || !db || !session.isVotingOpen) return;
    const finalNick = nickname.trim() || 'Schüler';
    setHasVotedForCurrentSlide(true);
    setVotedSlideId(session.activeSlide.id);

    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      // Calculate score: 1000 base if correct
      const score = isCorrect ? 1000 : 0;
      await updateDoc(portalDocRef, {
        [`activeMentiSession.responses.${session.activeSlide.id}.${optionId}`]: increment(1),
        [`activeMentiSession.responses.${session.activeSlide.id}_scores.${finalNick}`]: {
          name: finalNick,
          isCorrect,
          score
        }
      });
    } catch (e) {
      console.warn('Submit quiz error:', e);
    }
  };

  // PIN Entry Screen (if not joined automatically)
  if (!hasJoined || !pinCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full mx-auto text-center pt-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white shadow-md border border-slate-200 p-2 flex items-center justify-center">
            <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-teal-700">
            Heimbürgeschule Kahla
          </span>
          <h1 className="text-2xl font-black text-slate-900">
            HBS Menti Live
          </h1>
          <p className="text-xs text-slate-500">
            Gib den 6-stelligen Code vom Smartboard ein, um an der Abstimmung teilzunehmen.
          </p>
        </div>

        <div className="max-w-xs w-full mx-auto my-auto py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = enteredPin.replace(/\s+/g, '');
              if (clean.length === 6) {
                setPinCode(clean);
                setHasJoined(true);
              }
            }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4"
          >
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block text-center mb-2">
                6-stelliger PIN-Code:
              </label>
              <input
                type="text"
                maxLength={7}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="123 456"
                className="w-full py-3 px-4 text-center font-mono font-black text-2xl tracking-widest rounded-2xl bg-slate-50 border-2 border-teal-500/40 text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={enteredPin.replace(/\s+/g, '').length < 6}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>Beitreten</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center pb-4 text-[10px] text-slate-400 font-bold">
          DSGVO-konform • 100 % Anonym • Ohne Anmeldung
        </div>
      </div>
    );
  }

  // Active Slide Rendering
  const activeSlide: MentiSlide | undefined = session?.activeSlide;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
      
      {/* Header */}
      <header className="max-w-md w-full mx-auto text-center pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white shadow-2xs border border-slate-200 p-0.5">
              <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-black text-slate-800">
              {session?.presentationTitle || 'HBS Menti'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-mono text-[11px] font-bold border border-teal-100">
              PIN: {pinCode}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Verlassen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Voting Lock Warning */}
        {session && !session.isVotingOpen && (
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Abstimmung ist momentan gesperrt</span>
          </div>
        )}
      </header>

      {/* Main Interaction Area */}
      <main className="max-w-md w-full mx-auto my-auto py-4 space-y-4">
        
        {!activeSlide ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800">
              Warte auf die Lehrkraft...
            </h3>
            <p className="text-xs text-slate-500">
              Sobald die Präsentation gestartet wird, erscheint deine Frage hier auf dem Bildschirm.
            </p>
          </div>
        ) : hasVotedForCurrentSlide ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Antwort abgegeben!
            </h3>
            <p className="text-xs text-slate-500">
              Deine Eingabe wurde live an das Smartboard übertragen. Schau nach vorne, um die Ergebnisse zu sehen!
            </p>
            <div className="pt-2 text-[11px] text-slate-400 font-medium">
              Warte auf die nächste Folie...
            </div>
          </div>
        ) : (
          /* Interaction Card based on Type */
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4 animate-fadeIn">
            
            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {activeSlide.question}
            </h2>

            {activeSlide.description && (
              <p className="text-xs text-slate-500">
                {activeSlide.description}
              </p>
            )}

            {/* WORD CLOUD INPUTS */}
            {activeSlide.type === 'wordcloud' && (
              <div className="space-y-3 pt-2">
                {[...Array(activeSlide.maxWordsPerUser || 3)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={30}
                    value={words[i] || ''}
                    onChange={(e) => {
                      const newW = [...words];
                      newW[i] = e.target.value;
                      setWords(newW);
                    }}
                    placeholder={`Begriff ${i + 1}`}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                ))}

                <button
                  onClick={handleSubmitWordCloud}
                  disabled={!words.some(w => w.trim().length > 0) || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Wortwolke absenden</span>
                </button>
              </div>
            )}

            {/* CHOICE OPTIONS */}
            {activeSlide.type === 'choice' && (
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {(activeSlide.options || []).map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectChoice(opt.id)}
                    disabled={!session?.isVotingOpen}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border-2 border-slate-200 hover:border-teal-500 text-left transition-all active:scale-98 flex items-center gap-3 group"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-teal-500 text-slate-700 group-hover:text-teal-700 font-mono font-black text-sm flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* OPEN-ENDED TEXT */}
            {activeSlide.type === 'open' && (
              <div className="space-y-3 pt-2">
                <textarea
                  rows={4}
                  value={openText}
                  onChange={(e) => setOpenText(e.target.value)}
                  placeholder="Schreibe deine Antwort oder Gedanken..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />

                <button
                  onClick={handleSubmitOpen}
                  disabled={!openText.trim() || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Antwort absenden</span>
                </button>
              </div>
            )}

            {/* SCALES (LIKERT) */}
            {activeSlide.type === 'scales' && (
              <div className="space-y-4 pt-2">
                {(activeSlide.scales || []).map((sc) => (
                  <div key={sc.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{sc.statement}</span>
                      <span className="font-mono text-teal-700 font-black text-sm">
                        {scaleValues[sc.id] || 3} / 5
                      </span>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={scaleValues[sc.id] || 3}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setScaleValues(prev => ({ ...prev, [sc.id]: v }));
                      }}
                      className="w-full accent-teal-600 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>{sc.lowLabel || '1 (Wenig)'}</span>
                      <span>{sc.highLabel || '5 (Sehr)'}</span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitScales}
                  disabled={!session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40"
                >
                  Bewertung absenden
                </button>
              </div>
            )}

            {/* QUIZ SPEED SELECTION */}
            {activeSlide.type === 'quiz' && (
              <div className="space-y-3 pt-2">
                {!nickname && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Dein Spielername:</label>
                    <input
                      type="text"
                      maxLength={15}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        localStorage.setItem('hbs_menti_student_nick', e.target.value);
                      }}
                      placeholder="z. B. Max oder Lea"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {(activeSlide.options || []).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectQuiz(opt.id, !!opt.isCorrect)}
                      disabled={!session?.isVotingOpen}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 text-left font-bold text-sm text-slate-900 transition-all active:scale-95 shadow-2xs"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CONTENT SLIDE */}
            {activeSlide.type === 'content' && (
              <div className="text-center py-6 space-y-3">
                <div className="text-5xl">{activeSlide.emoji || '💡'}</div>
                <p className="text-sm font-bold text-slate-700">
                  Schau nach vorne auf das Smartboard!
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Realtime Floating Reactions Dock */}
      <footer className="max-w-md w-full mx-auto pt-2 pb-2">
        <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 pr-1">Reaktion:</span>
          {[
            { emoji: '❤️', label: 'Liebe' },
            { emoji: '👍', label: 'Daumen hoch' },
            { emoji: '💡', label: 'Aha' },
            { emoji: '👏', label: 'Klatschen' },
            { emoji: '🎉', label: 'Party' }
          ].map(r => (
            <button
              key={r.emoji}
              onClick={() => handleSendReaction(r.emoji)}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-125 transition-transform text-xl flex items-center justify-center shadow-2xs"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};
