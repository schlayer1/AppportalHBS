import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Users, 
  QrCode, 
  Award, 
  Clock, 
  Check, 
  Smartphone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MentiPresentation, MentiSlide, MentiLiveSession, MentiLiveReaction } from '../../types/mentiTypes';
import { useAuth } from '../../context/AuthContext';

interface MentiPresenterProps {
  presentation: MentiPresentation;
  onExit: () => void;
}

export const MentiPresenter: React.FC<MentiPresenterProps> = ({
  presentation,
  onExit
}) => {
  const { updateActiveMentiSession } = useAuth();

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(true);
  const [showResults, setShowResults] = useState<boolean>(true);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // 6-digit Join PIN (stable for the presentation session)
  const [sessionCode] = useState<string>(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  });

  // Local state of votes & responses per slide
  const [slideResponses, setSlideResponses] = useState<Record<string, any>>({});
  const [floatingReactions, setFloatingReactions] = useState<MentiLiveReaction[]>([]);
  const [participantsCount, setParticipantsCount] = useState<number>(0);

  // Quiz timer
  const activeSlide: MentiSlide = presentation.slides[currentSlideIndex] || presentation.slides[0];
  const [timeLeft, setTimeLeft] = useState<number>(activeSlide.timeLimitSeconds || 20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Direct student join URL
  const studentJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?menti=${sessionCode}`
    : `https://portal.schule.de/?menti=${sessionCode}`;

  // Reset timer on slide change
  useEffect(() => {
    if (activeSlide.type === 'quiz') {
      setTimeLeft(activeSlide.timeLimitSeconds || 20);
      setIsTimerRunning(true);
      setShowLeaderboard(false);
    } else {
      setIsTimerRunning(false);
    }
  }, [currentSlideIndex, activeSlide]);

  // Quiz countdown
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVotingOpen(false);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  // Sync session state with Firebase Firestore
  useEffect(() => {
    const sessionState: MentiLiveSession = {
      presentationId: presentation.id,
      presentationTitle: presentation.title,
      sessionCode,
      currentSlideIndex,
      isVotingOpen,
      showResults,
      activeSlide,
      totalSlides: presentation.slides.length,
      participantsCount,
      responses: slideResponses,
      updatedAt: Date.now()
    };

    updateActiveMentiSession(sessionState);

    if (db) {
      try {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        updateDoc(portalDocRef, {
          activeMentiSession: sessionState
        }).catch(err => console.warn('Menti session push warning:', err));
      } catch (e) {
        console.warn('Firebase error:', e);
      }
    }
  }, [currentSlideIndex, isVotingOpen, showResults, sessionCode, presentation.id]);

  // Listen to incoming votes and reactions from Firestore
  useEffect(() => {
    if (!db) return;
    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      const unsubscribe = onSnapshot(portalDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const sess = d.activeMentiSession;
          if (sess && sess.sessionCode === sessionCode) {
            if (sess.responses) {
              setSlideResponses(sess.responses);
            }
            if (sess.participantsCount !== undefined) {
              setParticipantsCount(sess.participantsCount);
            }
            if (sess.recentReactions && sess.recentReactions.length > 0) {
              // Add new reactions
              setFloatingReactions(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const newOnes = sess.recentReactions.filter((r: MentiLiveReaction) => !existingIds.has(r.id));
                return [...prev, ...newOnes];
              });
            }
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Menti snapshot listener error:', e);
    }
  }, [sessionCode]);

  // Clean up old floating reactions
  useEffect(() => {
    if (floatingReactions.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingReactions(prev => prev.filter(r => now - r.timestamp < 3500));
    }, 1000);
    return () => clearInterval(interval);
  }, [floatingReactions]);

  // Keyboard navigation (Left, Right, F, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        if (currentSlideIndex < presentation.slides.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'v' || e.key === 'V') {
        setShowResults(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, presentation.slides.length]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  // Reset current slide votes
  const handleClearSlideVotes = () => {
    if (window.confirm('Möchtest du die Stimmen für diese Folie wirklich zurücksetzen?')) {
      const updated = { ...slideResponses, [activeSlide.id]: null };
      setSlideResponses(updated);
      if (db) {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        updateDoc(portalDocRef, {
          [`activeMentiSession.responses.${activeSlide.id}`]: null
        });
      }
    }
  };

  // Computed data for active slide
  const currentVotes = slideResponses[activeSlide.id] || {};

  // Wordcloud computed words & weights
  const wordCloudData = useMemo(() => {
    if (activeSlide.type !== 'wordcloud') return [];
    const counts: Record<string, number> = currentVotes || {};
    const entries = Object.entries(counts).filter(([_, count]) => count > 0);
    if (entries.length === 0) return [];
    const maxCount = Math.max(...entries.map(([_, c]) => c), 1);
    
    // Sort by frequency
    return entries.map(([word, count]) => {
      // Scale fontSize from 1.1rem to 3.8rem
      const weight = count / maxCount;
      const fontSizeRem = 1.1 + weight * 2.7;
      return { word, count, fontSizeRem, weight };
    });
  }, [activeSlide, currentVotes]);

  // Choice computed options & percentages
  const choiceData = useMemo(() => {
    if (activeSlide.type !== 'choice' && activeSlide.type !== 'quiz') return [];
    const counts: Record<string, number> = currentVotes || {};
    const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

    return (activeSlide.options || []).map(opt => {
      const count = counts[opt.id] || 0;
      const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return { ...opt, count, percent, totalVotes };
    });
  }, [activeSlide, currentVotes]);

  // Open-ended thoughts
  const openResponses: { id: string; text: string; timestamp: number }[] = useMemo(() => {
    if (activeSlide.type !== 'open') return [];
    return Array.isArray(currentVotes) ? currentVotes : [];
  }, [activeSlide, currentVotes]);

  // Scales computed averages
  const scalesData = useMemo(() => {
    if (activeSlide.type !== 'scales') return [];
    const scalesObj: Record<string, { sum: number; count: number }> = currentVotes || {};
    return (activeSlide.scales || []).map(sc => {
      const data = scalesObj[sc.id] || { sum: 0, count: 0 };
      const avg = data.count > 0 ? (data.sum / data.count).toFixed(1) : '-';
      const percent = data.count > 0 ? ((data.sum / data.count) / 5) * 100 : 0;
      return { ...sc, avg, count: data.count, percent };
    });
  }, [activeSlide, currentVotes]);

  // Quiz leaderboard mock / calculation
  const quizScores = useMemo(() => {
    if (activeSlide.type !== 'quiz') return [];
    const quizVotes: Record<string, { name: string; isCorrect: boolean; time: number; score: number }> = currentVotes || {};
    return Object.values(quizVotes)
      .filter(v => v && v.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [activeSlide, currentVotes]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-950 via-[#0A192F] to-[#04202C] text-white flex flex-col justify-between font-sans select-none overflow-hidden z-50">
      
      {/* Floating Emojis Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {floatingReactions.map(r => (
          <div
            key={r.id}
            style={{ left: `${r.xOffset}%` }}
            className="absolute bottom-16 text-3xl animate-floatUp"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Smartboard Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between gap-4 shrink-0 z-30 bg-slate-950/40 backdrop-blur-xs border-b border-white/10">
        {/* Left: Join Instructions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
            <img src="/Siegel_bunt.png" alt="HBS" className="w-full h-full object-contain" />
          </div>

          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-teal-300 block">
              Mit Smartphone oder iPad beitreten:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                Website: <span className="font-bold text-white underline">{window.location.host}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                PIN: <span className="font-black text-amber-300 font-mono tracking-wider text-sm sm:text-base px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30">{sessionCode.slice(0, 3)} {sessionCode.slice(3)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: QR Code & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="Großen QR-Code für Klasse anzeigen"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">QR-Code</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-slate-200">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{participantsCount}</span>
            <span className="hidden md:inline">im Raum</span>
          </div>

          <button
            onClick={onExit}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
            title="Präsentation beenden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 max-w-6xl w-full mx-auto text-center relative z-20 py-4">
        
        {/* Slide Title */}
        <div className="mb-6 max-w-4xl space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {activeSlide.question}
          </h1>
          {activeSlide.description && (
            <p className="text-base sm:text-lg text-slate-300 font-medium">
              {activeSlide.description}
            </p>
          )}
        </div>

        {/* Dynamic Interactive Visualizations */}
        <div className="w-full flex-1 flex items-center justify-center">
          
          {/* WORDCLOUD */}
          {activeSlide.type === 'wordcloud' && (
            <div className="w-full min-h-[320px] flex items-center justify-center p-6">
              {wordCloudData.length === 0 ? (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                  <Smartphone className="w-8 h-8 text-teal-400 animate-bounce" />
                  <span className="font-bold">Warte auf erste Schülereingaben...</span>
                  <span className="text-xs text-slate-500">Begriffe erscheinen live auf der Tafel</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl">
                  {wordCloudData.map(({ word, count, fontSizeRem }, idx) => {
                    const colors = [
                      'text-teal-300 bg-teal-500/20 border-teal-500/40',
                      'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
                      'text-sky-300 bg-sky-500/20 border-sky-500/40',
                      'text-amber-300 bg-amber-500/20 border-amber-500/40',
                      'text-purple-300 bg-purple-500/20 border-purple-500/40',
                      'text-rose-300 bg-rose-500/20 border-rose-500/40'
                    ];
                    const colorClass = colors[idx % colors.length];

                    return (
                      <span
                        key={word}
                        style={{ fontSize: `${fontSizeRem}rem` }}
                        className={`px-4 py-1.5 rounded-2xl font-black border tracking-tight shadow-md transition-all duration-500 animate-fadeIn flex items-center gap-2 ${colorClass}`}
                      >
                        <span>{word}</span>
                        {count > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
                            {count}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CHOICE / BAR CHART */}
          {activeSlide.type === 'choice' && (
            <div className="w-full max-w-3xl space-y-4">
              {choiceData.map((opt, idx) => {
                const barColors = [
                  'from-teal-500 to-emerald-500',
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-indigo-500',
                  'from-amber-500 to-orange-500'
                ];
                const bgGrad = barColors[idx % barColors.length];

                return (
                  <div key={opt.id} className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between text-sm sm:text-base font-black">
                      <span className="text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-slate-300 text-xs flex items-center justify-center font-mono">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt.text}</span>
                        {opt.isCorrect && showResults && (
                          <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 font-bold">
                            <Check className="w-3 h-3" /> Richtig
                          </span>
                        )}
                      </span>
                      {showResults && (
                        <span className="font-mono text-teal-300">
                          {opt.percent}% <span className="text-xs text-slate-400">({opt.count})</span>
                        </span>
                      )}
                    </div>

                    <div className="h-9 sm:h-11 rounded-2xl bg-white/10 border border-white/10 p-1 overflow-hidden relative">
                      <div
                        style={{ width: showResults ? `${Math.max(opt.percent, 2)}%` : '2%' }}
                        className={`h-full rounded-xl bg-gradient-to-r ${bgGrad} transition-all duration-700 shadow-md`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* OPEN-ENDED THOUGHTS */}
          {activeSlide.type === 'open' && (
            <div className="w-full max-w-5xl">
              {openResponses.length === 0 ? (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2 py-12">
                  <Smartphone className="w-8 h-8 text-teal-400 animate-bounce" />
                  <span className="font-bold">Noch keine Wortmeldungen abgegeben...</span>
                  <span className="text-xs text-slate-500">Antworten erscheinen hier als Kärtchen</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto p-2">
                  {openResponses.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/10 border border-white/15 text-left shadow-md animate-fadeIn flex flex-col justify-between gap-2"
                    >
                      <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        „{item.text}“
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCALES (LIKERT) */}
          {activeSlide.type === 'scales' && (
            <div className="w-full max-w-3xl space-y-6">
              {scalesData.map((sc) => (
                <div key={sc.id} className="p-4 rounded-2xl bg-white/10 border border-white/10 text-left space-y-2">
                  <div className="flex items-center justify-between text-sm sm:text-base font-black">
                    <span>{sc.statement}</span>
                    <span className="font-mono text-amber-300 text-lg px-2.5 py-0.5 rounded-xl bg-amber-400/20 border border-amber-400/30">
                      Ø {sc.avg} / 5.0
                    </span>
                  </div>

                  {/* Rating Track */}
                  <div className="h-4 rounded-full bg-white/15 relative overflow-hidden">
                    <div
                      style={{ width: `${sc.percent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-amber-400 transition-all duration-700"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>1 = {sc.lowLabel || 'Gar nicht'}</span>
                    <span>{sc.count} Bewertungen</span>
                    <span>5 = {sc.highLabel || 'Voll'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* QUIZ MODE */}
          {activeSlide.type === 'quiz' && (
            <div className="w-full max-w-3xl space-y-6">
              {/* Timer Bar & Countdown */}
              <div className="flex items-center justify-center gap-3">
                <div className={`px-5 py-2 rounded-full border text-lg font-black font-mono flex items-center gap-2 ${
                  timeLeft <= 5 
                    ? 'bg-rose-500/30 border-rose-500 text-rose-300 animate-pulse' 
                    : 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span>{timeLeft}s Restzeit</span>
                </div>

                {timeLeft === 0 && (
                  <button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>{showLeaderboard ? 'Antworten anzeigen' : 'Rangliste anzeigen'}</span>
                  </button>
                )}
              </div>

              {!showLeaderboard ? (
                /* Question Options */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {choiceData.map((opt) => {
                    const isRevealed = timeLeft === 0;
                    return (
                      <div
                        key={opt.id}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isRevealed && opt.isCorrect
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400 font-black text-base shadow-lg scale-102'
                            : isRevealed
                            ? 'bg-white/5 border-white/10 opacity-50'
                            : 'bg-white/10 border-white/15'
                        }`}
                      >
                        <span className="font-bold">{opt.text}</span>
                        {isRevealed && (
                          <span className="font-mono text-sm">
                            {opt.count} Stimmen
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Leaderboard Podium */
                <div className="bg-white/10 rounded-3xl p-6 border border-white/15 space-y-3">
                  <h3 className="text-xl font-black text-amber-300 flex items-center justify-center gap-2">
                    <Award className="w-6 h-6" />
                    <span>Top-Scorer Rangliste</span>
                  </h3>
                  {quizScores.length === 0 ? (
                    <p className="text-sm text-slate-400">Keine Quiz-Ergebnisse erfasst.</p>
                  ) : (
                    <div className="space-y-2">
                      {quizScores.map((scorer, i) => (
                        <div
                          key={scorer.name}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 font-black text-sm flex items-center justify-center font-mono">
                              {i + 1}
                            </span>
                            <span className="font-black text-base">{scorer.name}</span>
                          </div>
                          <span className="font-mono font-black text-teal-300">
                            {scorer.score} Punkte
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* INFO / CONTENT */}
          {activeSlide.type === 'content' && (
            <div className="max-w-xl w-full bg-white/10 rounded-3xl p-8 border border-white/15 text-left space-y-4 shadow-xl">
              <div className="text-5xl text-center mb-2">{activeSlide.emoji || '💡'}</div>
              {(activeSlide.bulletPoints || []).map((pt, idx) => (
                <div key={idx} className="flex items-center gap-3 text-lg text-slate-100 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Presenter Controls Bar */}
      <footer className="p-4 sm:p-6 flex items-center justify-between gap-3 shrink-0 z-30 bg-slate-950/40 backdrop-blur-xs border-t border-white/10">
        
        {/* Navigation Controls (◀ X / Y ▶) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex <= 0}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-all active:scale-90 border border-white/10"
            title="Vorherige Folie (Pfeil links)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-black">
            {currentSlideIndex + 1} / {presentation.slides.length}
          </span>

          <button
            onClick={() => setCurrentSlideIndex(prev => Math.min(presentation.slides.length - 1, prev + 1))}
            disabled={currentSlideIndex >= presentation.slides.length - 1}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-all active:scale-90 border border-white/10"
            title="Nächste Folie (Pfeil rechts / Leertaste)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Presenter Options (Hide Results, Lock Voting, Reset) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResults(!showResults)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              showResults 
                ? 'bg-white/10 text-white border-white/15' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
            title="Ergebnisse ein- / ausblenden"
          >
            {showResults ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{showResults ? 'Ergebnisse sichtbar' : 'Versteckt'}</span>
          </button>

          <button
            onClick={() => setIsVotingOpen(!isVotingOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isVotingOpen 
                ? 'bg-white/10 text-white border-white/15' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
            title="Abstimmung sperren / öffnen"
          >
            {isVotingOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-rose-400" />}
            <span className="hidden sm:inline">{isVotingOpen ? 'Abstimmung offen' : 'Gesperrt'}</span>
          </button>

          <button
            onClick={handleClearSlideVotes}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all border border-white/10"
            title="Stimmen dieser Folie leeren"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all border border-white/10"
            title="Vollbild umschalten (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {/* QR Code Full Modal Overlay */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 text-slate-900 animate-fadeIn">
            <h3 className="text-base font-black">Mit Smartphone scannen</h3>
            
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md inline-block">
              <QRCodeSVG value={studentJoinUrl} size={220} level="M" />
            </div>

            <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 text-teal-950">
              <span className="text-[11px] font-bold block">Beitritts-PIN:</span>
              <span className="text-2xl font-black font-mono tracking-widest text-teal-700">
                {sessionCode.slice(0, 3)} {sessionCode.slice(3)}
              </span>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md active:scale-95"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
