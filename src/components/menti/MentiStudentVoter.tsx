import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  Check,
  BarChart3
} from 'lucide-react';
import { 
  subscribeToMentiSession, 
  getMentiLiveSessionFromCloud, 
  submitMentiVoteInCloud, 
  submitMentiReactionInCloud 
} from '../../services/firebase';
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
    if (initialCode) return initialCode.replace(/\s+/g, '');
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('menti');
      if (p) return p.replace(/\s+/g, '');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      const hp = hashParams.get('menti');
      if (hp) return hp.replace(/\s+/g, '');
      const rawHash = window.location.hash.replace(/^#menti=/, '').replace(/^#/, '');
      if (rawHash && rawHash.length >= 4 && !rawHash.includes('/')) return rawHash.replace(/\s+/g, '');
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

  // Survey Mode State (Audience-Paced)
  const [surveySlideIndex, setSurveySlideIndex] = useState<number>(0);
  const [isSurveyCompleted, setIsSurveyCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && pinCode) {
      return localStorage.getItem(`hbs_menti_completed_${pinCode}`) === 'true';
    }
    return false;
  });
  const [showSurveyResults, setShowSurveyResults] = useState<boolean>(false);

  // State of votes for slides (slideId -> boolean)
  const [votedSlides, setVotedSlides] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined' && pinCode) {
      try {
        const saved = localStorage.getItem(`hbs_menti_voted_${pinCode}`);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Save votedSlides to localStorage
  useEffect(() => {
    if (pinCode && Object.keys(votedSlides).length > 0) {
      try {
        localStorage.setItem(`hbs_menti_voted_${pinCode}`, JSON.stringify(votedSlides));
      } catch {}
    }
  }, [votedSlides, pinCode]);

  const isSurveyMode = Boolean(session?.isSurveyMode || (session?.slides && session.slides.length > 1 && !session.currentSlideIndex));
  const slides = session?.slides || (session?.activeSlide ? [session.activeSlide] : []);
  const activeSlide: MentiSlide | undefined = isSurveyMode ? slides[surveySlideIndex] : session?.activeSlide;

  const [lastActiveSlideId, setLastActiveSlideId] = useState<string | null>(null);
  const hasVotedForCurrentSlide = Boolean(activeSlide?.id && votedSlides[activeSlide.id]);

  // Wordcloud inputs (1 to 3 words)
  const [words, setWords] = useState<string[]>(['', '', '']);

  // Open-ended input
  const [openText, setOpenText] = useState<string>('');

  // Scales values (statementId -> number 1..5)
  const [scaleValues, setScaleValues] = useState<Record<string, number>>({});

  // Matrix coordinates (x: 0..100, y: 0..100)
  const [matrixCoords, setMatrixCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [matrixHasPlaced, setMatrixHasPlaced] = useState<boolean>(false);

  // Ranking order (list of item IDs)
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Load fallback session from localStorage when pinCode is set
  useEffect(() => {
    if (pinCode && !session) {
      try {
        const stored = localStorage.getItem(`hbs_menti_session_${pinCode}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSession(parsed);
        }
      } catch (e) {}
    }
  }, [pinCode, session]);

  // Connect to BroadcastChannel for this PIN
  useEffect(() => {
    if (!pinCode) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`hbs_menti_${pinCode}`);
      broadcastRef.current = channel;
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SESSION_UPDATE' && payload) {
          setSession(payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error in voter:', e);
    }

    return () => {
      if (channel) channel.close();
      broadcastRef.current = null;
    };
  }, [pinCode]);

  // Listen to Firestore active Menti Session with active polling heartbeat
  useEffect(() => {
    if (!pinCode) return;
    const unsubscribe = subscribeToMentiSession(pinCode, (sess) => {
      if (sess) {
        setSession(sess);
      }
    });

    const heartbeat = setInterval(async () => {
      const live = await getMentiLiveSessionFromCloud(pinCode);
      if (live) {
        setSession(live);
      }
    }, 2500);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, [pinCode]);

  // When active slide changes in the session, reset input fields for new slide!
  useEffect(() => {
    if (activeSlide) {
      if (activeSlide.id !== lastActiveSlideId) {
        setLastActiveSlideId(activeSlide.id);
        setWords(['', '', '']);
        setOpenText('');
        // Initialize scales
        if (activeSlide.type === 'scales' && activeSlide.scales) {
          const initialScales: Record<string, number> = {};
          activeSlide.scales.forEach(s => { initialScales[s.id] = 3; });
          setScaleValues(initialScales);
        }
        // Initialize matrix
        if (activeSlide.type === 'matrix') {
          setMatrixCoords({ x: 50, y: 50 });
          setMatrixHasPlaced(false);
        }
        // Initialize ranking
        if (activeSlide.type === 'ranking' && activeSlide.rankingItems) {
          setRankingOrder(activeSlide.rankingItems.map(item => item.id));
        }
      }
    }
  }, [activeSlide?.id, lastActiveSlideId]);

  // Expiration check
  const isExpired = Boolean(
    session?.isClosed || 
    (session?.expiresAt && Date.now() > session.expiresAt)
  );

  // Send realtime floating reaction (❤️, 👍, 💡, 👏, 🎉)
  const handleSendReaction = async (emoji: string) => {
    const reaction = {
      id: `r-${Date.now()}-${Math.random()}`,
      emoji,
      xOffset: Math.floor(Math.random() * 70) + 15,
      timestamp: Date.now()
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_REACTION',
        payload: { reaction }
      });
    }

    if (session && pinCode) {
      submitMentiReactionInCloud(pinCode, reaction);
    }
  };

  // Submit Word Cloud
  const handleSubmitWordCloud = async () => {
    if (!session || !activeSlide) return;
    const cleanWords = words.map(w => w.trim()).filter(w => w.length > 0);
    if (cleanWords.length === 0) return;

    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_WORD_SUBMISSION',
        payload: {
          slideId: activeSlide.id,
          words: cleanWords
        }
      });
    }

    if (pinCode) {
      cleanWords.forEach((w, idx) => {
        const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
        submitMentiVoteInCloud(pinCode, activeSlide.id, { 
          word: capitalized,
          incrementParticipant: isSurveyMode ? (surveySlideIndex === 0 && idx === 0) : true
        });
      });
    }
  };

  // Submit Choice
  const handleSelectChoice = async (optionId: string) => {
    if (!session || !activeSlide || !session.isVotingOpen || isExpired) return;
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_VOTE_OPTION',
        payload: {
          slideId: activeSlide.id,
          optionId
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        optionId,
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Submit Open-ended
  const handleSubmitOpen = async () => {
    if (!session || !activeSlide || !openText.trim() || isExpired) return;
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    const newResponse = {
      id: `resp-${Date.now()}-${Math.random()}`,
      text: openText.trim(),
      timestamp: Date.now()
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_OPEN_SUBMISSION',
        payload: {
          slideId: activeSlide.id,
          item: newResponse
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        text: openText.trim(),
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Submit Scales
  const handleSubmitScales = async () => {
    if (!session || !activeSlide || isExpired) return;
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SCALE_SUBMISSION',
        payload: {
          slideId: activeSlide.id,
          scales: scaleValues
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        ratings: scaleValues,
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Submit Quiz Choice
  const handleSelectQuiz = async (optionId: string, isCorrect: boolean) => {
    if (!session || !activeSlide || !session.isVotingOpen || isExpired) return;
    const finalNick = nickname.trim() || 'Kollege';
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));
    const score = isCorrect ? 1000 : 0;

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_QUIZ_ANSWER',
        payload: {
          slideId: activeSlide.id,
          optionId,
          nickname: finalNick,
          isCorrect,
          score
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        optionId,
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Submit Matrix
  const handleSubmitMatrix = async () => {
    if (!session || !activeSlide || !session.isVotingOpen || isExpired) return;
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    const vote = {
      x: Math.round(matrixCoords.x),
      y: Math.round(matrixCoords.y),
      label: nickname.trim() || undefined
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_MATRIX_VOTE',
        payload: {
          slideId: activeSlide.id,
          vote
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        matrixCoords: vote,
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Submit Ranking
  const handleSubmitRanking = async () => {
    if (!session || !activeSlide || !session.isVotingOpen || rankingOrder.length === 0 || isExpired) return;
    setVotedSlides(prev => ({ ...prev, [activeSlide.id]: true }));

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_RANKING_VOTE',
        payload: {
          slideId: activeSlide.id,
          orderIds: rankingOrder
        }
      });
    }

    if (pinCode) {
      submitMentiVoteInCloud(pinCode, activeSlide.id, { 
        rankingOrder,
        incrementParticipant: isSurveyMode ? (surveySlideIndex === 0) : true
      });
    }
  };

  // Complete Survey Handler
  const handleFinishSurvey = () => {
    setIsSurveyCompleted(true);
    if (pinCode) {
      localStorage.setItem(`hbs_menti_completed_${pinCode}`, 'true');
    }
  };

  // PIN Entry Screen (if not joined automatically)
  if (!hasJoined || !pinCode) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans">
        <div className="max-w-md w-full mx-auto text-center pt-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white shadow-md border border-slate-200 p-2 flex items-center justify-center">
            <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-teal-700">
            Heimbürgeschule Kahla
          </span>
          <h1 className="text-2xl font-black text-slate-900">
            HBS Menti Studio
          </h1>
          <p className="text-xs text-slate-500">
            Gib den 6-stelligen Code ein, um an der Abstimmung oder Umfrage teilzunehmen.
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
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Beitreten</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center pb-4 text-[10px] text-slate-400 font-bold">
          DSGVO-konform • 100 % Anonym • Ohne Registrierung
        </div>
      </div>
    );
  }

  // EXPIRED OR CLOSED SURVEY SCREEN
  if (session && isExpired) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans">
        <header className="max-w-md w-full mx-auto text-center pt-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-md border border-slate-200 p-1.5 flex items-center justify-center mb-2">
            <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {session.presentationTitle || 'HBS Menti'}
          </span>
        </header>

        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Umfrage beendet
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Die Gültigkeitsdauer dieser Umfrage ist abgelaufen oder die Umfrage wurde von der Lehrkraft geschlossen.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 font-mono">
              PIN: {pinCode}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-2xl bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                Zurück zum Portal
              </button>
            )}
          </div>
        </div>

        <div className="text-center pb-4 text-[10px] text-slate-400 font-bold">
          Heimbürgeschule Kahla • Schulapps Portal
        </div>
      </div>
    );
  }

  // SURVEY COMPLETED SCREEN (Audience Pace finished)
  if (isSurveyMode && isSurveyCompleted) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans">
        <header className="max-w-md w-full mx-auto text-center pt-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-md border border-slate-200 p-1 flex items-center justify-center mb-2">
            <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-teal-800">
            {session?.presentationTitle || 'HBS Menti'}
          </span>
        </header>

        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-4">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 text-center space-y-4 animate-scaleUp">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900">
              Vielen Dank für deine Teilnahme!
            </h2>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Deine Antworten wurden erfolgreich und vollkommen anonym übermittelt.
              {session?.authorName && ` Die Lehrkraft (${session.authorName}) kann die Gesamtergebnisse nun einsehen.`}
            </p>

            {/* Optional Intermediate Results Toggle */}
            {session?.allowViewResults && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSurveyResults(!showSurveyResults)}
                  className="px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  <span>{showSurveyResults ? 'Ergebnisse ausblenden' : 'Zwischenstand der Ergebnisse ansehen'}</span>
                </button>
              </div>
            )}

            {/* Inline Results Preview if allowed */}
            {showSurveyResults && session && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 max-h-72 overflow-y-auto text-xs animate-fadeIn">
                <h4 className="font-bold text-slate-900 border-b pb-1">Aktueller Zwischenstand:</h4>
                {slides.map((s, idx) => {
                  const counts = session.responses?.[s.id] || {};
                  return (
                    <div key={s.id || idx} className="space-y-1">
                      <div className="font-semibold text-slate-800">
                        {idx + 1}. {s.question}
                      </div>
                      {s.type === 'choice' && (
                        <div className="space-y-1 pl-2">
                          {(s.options || []).map(opt => (
                            <div key={opt.id} className="flex justify-between text-[11px] text-slate-600">
                              <span>• {opt.text}</span>
                              <span className="font-mono font-bold">{counts[opt.id] || 0} Stimmen</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.type === 'wordcloud' && (
                        <div className="flex flex-wrap gap-1 pl-2">
                          {Object.entries(counts).map(([w, c]) => (
                            <span key={w} className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {w} ({String(c)}x)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSurveyCompleted(false);
                  setSurveySlideIndex(0);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer underline"
              >
                Antworten überprüfen
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pb-4 text-[10px] text-slate-400 font-bold">
          DSGVO-konform • Heimbürgeschule Kahla
        </div>
      </div>
    );
  }

  // PROGRESS BAR CALCULATION FOR SURVEY MODE
  const totalSlidesCount = isSurveyMode ? slides.length : (session?.totalSlides || 1);
  const currentProgressPercent = isSurveyMode 
    ? Math.round(((surveySlideIndex + 1) / Math.max(totalSlidesCount, 1)) * 100)
    : 100;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans select-none">
      
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto text-center pt-2 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white shadow-2xs border border-slate-200 p-0.5 shrink-0">
              <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-black text-slate-800 truncate">
              {session?.presentationTitle || 'HBS Menti'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSurveyMode && (
              <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200">
                Frage {surveySlideIndex + 1} / {totalSlidesCount}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
              PIN: {pinCode}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                title="Verlassen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Survey Mode Progress Bar */}
        {isSurveyMode && (
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>
            {session?.expiresAt && (
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Selbstgesteuerte Umfrage</span>
                <span>Gültig bis {new Date(session.expiresAt).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>
        )}

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
        ) : hasVotedForCurrentSlide && !isSurveyMode ? (
          /* Live Confirmation Screen (only in live presenter mode) */
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
            
            {/* Slide Question & Status */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {activeSlide.type === 'wordcloud' && '☁️ Wortwolke'}
                  {activeSlide.type === 'choice' && '📊 Multiple Choice'}
                  {activeSlide.type === 'open' && '💬 Freitext'}
                  {activeSlide.type === 'scales' && '⚖️ Bewertung'}
                  {activeSlide.type === 'quiz' && '🏆 Quiz'}
                  {activeSlide.type === 'matrix' && '🎯 Matrix'}
                  {activeSlide.type === 'ranking' && '🥇 Rangfolge'}
                  {activeSlide.type === 'content' && '📄 Info'}
                </span>

                {hasVotedForCurrentSlide && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3" /> Gespeichert
                  </span>
                )}
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {activeSlide.question}
              </h2>

              {activeSlide.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {activeSlide.description}
                </p>
              )}
            </div>

            {/* WORD CLOUD INPUTS */}
            {activeSlide.type === 'wordcloud' && (
              <div className="space-y-3 pt-1">
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
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-base font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                ))}

                <button
                  type="button"
                  onClick={handleSubmitWordCloud}
                  disabled={!words.some(w => w.trim().length > 0) || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{hasVotedForCurrentSlide ? 'Begriffe aktualisieren' : 'Wortwolke absenden'}</span>
                </button>
              </div>
            )}

            {/* CHOICE OPTIONS */}
            {activeSlide.type === 'choice' && (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {(activeSlide.options || []).map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectChoice(opt.id)}
                    disabled={!session?.isVotingOpen}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border-2 border-slate-200 hover:border-teal-500 text-left transition-all active:scale-98 flex items-center gap-3 group cursor-pointer"
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
              <div className="space-y-3 pt-1">
                <textarea
                  rows={4}
                  value={openText}
                  onChange={(e) => setOpenText(e.target.value)}
                  placeholder="Schreibe deine Antwort oder Gedanken..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />

                <button
                  type="button"
                  onClick={handleSubmitOpen}
                  disabled={!openText.trim() || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Antwort absenden</span>
                </button>
              </div>
            )}

            {/* SCALES (LIKERT) */}
            {activeSlide.type === 'scales' && (
              <div className="space-y-4 pt-1">
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
                  type="button"
                  onClick={handleSubmitScales}
                  disabled={!session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  Bewertung absenden
                </button>
              </div>
            )}

            {/* QUIZ SELECTION */}
            {activeSlide.type === 'quiz' && (
              <div className="space-y-3 pt-1">
                {!nickname && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Dein Name / Kürzel:</label>
                    <input
                      type="text"
                      maxLength={15}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        localStorage.setItem('hbs_menti_student_nick', e.target.value);
                      }}
                      placeholder="z. B. Kollege oder Name"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {(activeSlide.options || []).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectQuiz(opt.id, !!opt.isCorrect)}
                      disabled={!session?.isVotingOpen}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 text-left font-bold text-sm text-slate-900 transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MATRIX 2X2 QUADRANT */}
            {activeSlide.type === 'matrix' && (
              <div className="space-y-4 pt-1">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    Tippe in das Koordinatenfeld, um deine Position zu setzen:
                  </p>
                </div>

                <div 
                  className="relative w-full aspect-square max-w-[320px] mx-auto bg-slate-50 rounded-2xl border-2 border-slate-300 shadow-inner overflow-hidden select-none touch-none cursor-crosshair"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clientX = e.clientX;
                    const clientY = e.clientY;
                    const pctX = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
                    const pctY = Math.max(5, Math.min(95, ((rect.bottom - clientY) / rect.height) * 100));
                    setMatrixCoords({ x: pctX, y: pctY });
                    setMatrixHasPlaced(true);
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length > 0) {
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pctX = Math.max(5, Math.min(95, ((touch.clientX - rect.left) / rect.width) * 100));
                      const pctY = Math.max(5, Math.min(95, ((rect.bottom - touch.clientY) / rect.height) * 100));
                      setMatrixCoords({ x: pctX, y: pctY });
                      setMatrixHasPlaced(true);
                    }
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="bg-amber-500/5 border-r border-b border-slate-200 p-2 flex flex-col justify-start">
                      <span className="text-[10px] font-black text-amber-700/60 uppercase tracking-wider line-clamp-1">
                        {activeSlide.matrixConfig?.quadrantTL || 'Oben Links'}
                      </span>
                    </div>
                    <div className="bg-emerald-500/5 border-b border-slate-200 p-2 flex flex-col justify-start items-end">
                      <span className="text-[10px] font-black text-emerald-700/60 uppercase tracking-wider line-clamp-1">
                        {activeSlide.matrixConfig?.quadrantTR || 'Oben Rechts'}
                      </span>
                    </div>
                    <div className="bg-slate-500/5 border-r border-slate-200 p-2 flex flex-col justify-end">
                      <span className="text-[10px] font-black text-slate-700/60 uppercase tracking-wider line-clamp-1">
                        {activeSlide.matrixConfig?.quadrantBL || 'Unten Links'}
                      </span>
                    </div>
                    <div className="bg-blue-500/5 p-2 flex flex-col justify-end items-end">
                      <span className="text-[10px] font-black text-blue-700/60 uppercase tracking-wider line-clamp-1">
                        {activeSlide.matrixConfig?.quadrantBR || 'Unten Rechts'}
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 pointer-events-none" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300 pointer-events-none" />

                  {matrixHasPlaced && (
                    <div 
                      className="absolute w-6 h-6 -translate-x-1/2 translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-75"
                      style={{
                        left: `${matrixCoords.x}%`,
                        bottom: `${matrixCoords.y}%`
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-500 border-2 border-white shadow-md flex items-center justify-center animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-slate-500 font-semibold">
                  {matrixHasPlaced 
                    ? `Position gesetzt (X: ${Math.round(matrixCoords.x)}%, Y: ${Math.round(matrixCoords.y)}%)`
                    : 'Tippe ins Feld, um deine Position zu markieren'}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitMatrix}
                  disabled={!matrixHasPlaced || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Position absenden</span>
                </button>
              </div>
            )}

            {/* RANKING LIST */}
            {activeSlide.type === 'ranking' && (
              <div className="space-y-4 pt-1">
                <p className="text-xs font-semibold text-slate-500 text-center">
                  Bringe die Einträge in deine Wunsch-Reihenfolge (Platz 1 = ganz oben):
                </p>

                <div className="space-y-2">
                  {rankingOrder.map((itemId, idx) => {
                    const itemObj = (activeSlide.rankingItems || []).find(it => it.id === itemId);
                    if (!itemObj) return null;
                    return (
                      <div 
                        key={itemId}
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 transition-all shadow-2xs"
                      >
                        <span className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 flex-1 break-words">
                          {itemObj.text}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx > 0) {
                                const newOrder = [...rankingOrder];
                                const temp = newOrder[idx - 1];
                                newOrder[idx - 1] = newOrder[idx];
                                newOrder[idx] = temp;
                                setRankingOrder(newOrder);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 active:scale-95 transition-all text-slate-700 cursor-pointer"
                            title="Nach oben"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === rankingOrder.length - 1}
                            onClick={() => {
                              if (idx < rankingOrder.length - 1) {
                                const newOrder = [...rankingOrder];
                                const temp = newOrder[idx + 1];
                                newOrder[idx + 1] = newOrder[idx];
                                newOrder[idx] = temp;
                                setRankingOrder(newOrder);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 active:scale-95 transition-all text-slate-700 cursor-pointer"
                            title="Nach unten"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitRanking}
                  disabled={rankingOrder.length === 0 || !session?.isVotingOpen}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Rangfolge absenden</span>
                </button>
              </div>
            )}

            {/* CONTENT SLIDE */}
            {activeSlide.type === 'content' && (
              <div className="text-center py-6 space-y-3">
                <div className="text-5xl">{activeSlide.emoji || '💡'}</div>
                <p className="text-sm font-bold text-slate-700">
                  {activeSlide.question}
                </p>
                <div className="space-y-1 text-xs text-slate-500">
                  {(activeSlide.bulletPoints || []).map((pt, i) => (
                    <div key={i}>• {pt}</div>
                  ))}
                </div>
              </div>
            )}

            {/* AUDIENCE-PACE NAVIGATION BUTTONS (SURVEY MODE) */}
            {isSurveyMode && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={surveySlideIndex === 0}
                  onClick={() => setSurveySlideIndex(prev => Math.max(prev - 1, 0))}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zurück</span>
                </button>

                {surveySlideIndex < slides.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setSurveySlideIndex(prev => Math.min(prev + 1, slides.length - 1))}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <span>Nächste Frage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishSurvey}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Umfrage abschließen 🎉</span>
                  </button>
                )}
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
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-125 transition-transform text-xl flex items-center justify-center shadow-2xs cursor-pointer"
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

