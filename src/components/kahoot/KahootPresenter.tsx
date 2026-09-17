import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  ChevronRight, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Users, 
  Clock, 
  Check, 
  Flame, 
  Trophy,
  Volume2,
  VolumeX
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  KahootGame, 
  KahootQuestion, 
  KahootSessionStage, 
  KahootLiveSession, 
  KahootParticipant, 
  KahootShape,
  KahootGameMode
} from '../../types/kahootTypes';
import { useAuth } from '../../context/AuthContext';

interface KahootPresenterProps {
  game: KahootGame;
  onExit: () => void;
}

const SHAPE_CONFIG: Record<KahootShape, { label: string; icon: string; bgClass: string; barColor: string }> = {
  triangle: { label: 'Rot', icon: '🔺', bgClass: 'bg-red-600', barColor: 'bg-red-500' },
  diamond: { label: 'Blau', icon: '🔷', bgClass: 'bg-blue-600', barColor: 'bg-blue-500' },
  circle: { label: 'Gelb', icon: '🟡', bgClass: 'bg-amber-500', barColor: 'bg-amber-400' },
  square: { label: 'Grün', icon: '🟩', bgClass: 'bg-emerald-600', barColor: 'bg-emerald-500' }
};

import { classroomAudio } from '../../utils/classroomAudio';
const audio = classroomAudio;

export const KahootPresenter: React.FC<KahootPresenterProps> = ({
  game,
  onExit
}) => {
  const { updateActiveKahootSession } = useAuth();

  const [sessionCode] = useState<string>(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  });

  const [stage, setStage] = useState<KahootSessionStage>('lobby');
  const [gameMode, setGameMode] = useState<KahootGameMode>('individual');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [participants, setParticipants] = useState<KahootParticipant[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [getReadyCount, setGetReadyCount] = useState<number>(3);

  const currentQ: KahootQuestion = game.questions[currentQuestionIndex] || game.questions[0];
  const [timeLeft, setTimeLeft] = useState<number>(currentQ.timeLimitSeconds || 20);
  const [isAnswerOpen, setIsAnswerOpen] = useState<boolean>(true);

  // Student join URL
  const studentJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?kahoot=${sessionCode}`
    : `https://portal.schule.de/?kahoot=${sessionCode}`;

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Sync to Firestore, localStorage & BroadcastChannel
  const syncSessionToCloud = (partial?: Partial<KahootLiveSession>) => {
    const sessionState: KahootLiveSession = {
      gameId: game.id,
      gameTitle: game.title,
      sessionCode,
      stage: partial?.stage || stage,
      gameMode: partial?.gameMode || gameMode,
      currentQuestionIndex: partial?.currentQuestionIndex !== undefined ? partial.currentQuestionIndex : currentQuestionIndex,
      totalQuestions: game.questions.length,
      activeQuestion: currentQ,
      timeLeft: partial?.timeLeft !== undefined ? partial.timeLeft : timeLeft,
      isAnswerOpen: partial?.isAnswerOpen !== undefined ? partial.isAnswerOpen : isAnswerOpen,
      participants: partial?.participants || participants,
      answersReceived: (partial?.participants || participants).filter(p => p.lastAnswerId).length,
      updatedAt: Date.now()
    };

    updateActiveKahootSession(sessionState);

    // Save to local storage for instant fallback
    try {
      localStorage.setItem(`hbs_kahoot_session_${sessionCode}`, JSON.stringify(sessionState));
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({
          type: 'STAGE_CHANGE',
          payload: sessionState
        });
      }
    } catch (e) {}

    if (db) {
      try {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        updateDoc(portalDocRef, {
          activeKahootSession: sessionState
        }).catch(err => console.warn('Kahoot sync warning:', err));
      } catch (e) {
        console.warn('Firebase error:', e);
      }
    }
  };

  // Push updates when stage / index / answer status change
  useEffect(() => {
    syncSessionToCloud();
  }, [stage, currentQuestionIndex, isAnswerOpen, participants.length, gameMode]);

  // BroadcastChannel listener for local & instant communication
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`hbs_kahoot_${sessionCode}`);
      broadcastRef.current = channel;
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (!type || !payload) return;

        if (type === 'STUDENT_JOIN_LOBBY') {
          const { participant } = payload;
          if (participant) {
            setParticipants(prev => {
              const filtered = prev.filter(p => p.id !== participant.id);
              const updated = [...filtered, participant];
              return updated;
            });
            audio.playTick();
            // Confirm to student
            channel?.postMessage({
              type: 'JOIN_CONFIRMED',
              payload: { stage, currentQuestionIndex }
            });
          }
        } else if (type === 'STUDENT_ANSWER') {
          const { studentId, optionId } = payload;
          setParticipants(prev => {
            return prev.map(p => {
              if (p.id === studentId) {
                return {
                  ...p,
                  lastAnswerId: optionId,
                  lastAnswerTime: Date.now()
                };
              }
              return p;
            });
          });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error in KahootPresenter:', e);
    }

    return () => {
      if (channel) channel.close();
      broadcastRef.current = null;
    };
  }, [sessionCode, stage, currentQuestionIndex]);

  // Firestore Snapshot Listener: Listen for students joining or answering
  useEffect(() => {
    if (!db) return;
    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      const unsubscribe = onSnapshot(portalDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const liveSess = d.activeKahootSession as KahootLiveSession;
          if (liveSess && liveSess.sessionCode === sessionCode) {
            if (Array.isArray(liveSess.participants)) {
              setParticipants(liveSess.participants);
            }
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Snapshot listener error:', e);
    }
  }, [sessionCode]);

  // Handle stage transitions
  const handleStartGame = () => {
    setStage('get_ready');
    setGetReadyCount(3);
    syncSessionToCloud({ stage: 'get_ready' });
  };

  // 3-2-1 Get Ready Countdown
  useEffect(() => {
    if (stage !== 'get_ready') return;
    const interval = setInterval(() => {
      setGetReadyCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStage('question');
          setTimeLeft(currentQ.timeLimitSeconds || 20);
          setIsAnswerOpen(true);
          // Clear last answers for this question
          setParticipants(prevParts => prevParts.map(p => ({
            ...p,
            lastAnswerId: undefined,
            lastAnswerTime: undefined,
            lastAnswerCorrect: undefined,
            lastPointsEarned: 0
          })));
          audio.playTick();
          return 0;
        }
        audio.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, currentQ]);

  // Question Timer Countdown & Tension Loop
  useEffect(() => {
    if (stage !== 'question' || !isAnswerOpen || timeLeft <= 0) {
      classroomAudio.stopTensionLoop();
      return;
    }

    classroomAudio.startTensionLoop();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        if (prev <= 5) {
          audio.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      classroomAudio.stopTensionLoop();
    };
  }, [stage, isAnswerOpen, timeLeft]);

  // Check if all students answered
  useEffect(() => {
    if (stage === 'question' && isAnswerOpen && participants.length > 0) {
      const allAnswered = participants.every(p => p.lastAnswerId);
      if (allAnswered) {
        handleTimeUp();
      }
    }
  }, [participants, stage, isAnswerOpen]);

  const handleTimeUp = () => {
    classroomAudio.stopTensionLoop();
    setIsAnswerOpen(false);
    audio.playReveal();
    // Calculate points and streaks for participants
    const correctOpt = currentQ.options.find(o => o.isCorrect);
    const updatedParticipants = participants.map(p => {
      if (!p.lastAnswerId) return p;
      const isCorrect = p.lastAnswerId === correctOpt?.id;
      let earned = 0;
      let streak = isCorrect ? (p.streak || 0) + 1 : 0;

      if (isCorrect) {
        // Speed bonus: (timeLeft / totalTime) * 500 + 500
        const totalSec = currentQ.timeLimitSeconds || 20;
        const speedBonus = Math.round((Math.max(1, timeLeft) / totalSec) * (currentQ.points / 2));
        const basePoints = Math.round(currentQ.points / 2);
        earned = basePoints + speedBonus;
      }

      return {
        ...p,
        score: (p.score || 0) + earned,
        streak,
        lastAnswerCorrect: isCorrect,
        lastPointsEarned: earned
      };
    });

    // Sort participants by score descending
    updatedParticipants.sort((a, b) => b.score - a.score);
    setParticipants(updatedParticipants);
    setStage('reveal');
  };

  const handleNextFromReveal = () => {
    setStage('scoreboard');
  };

  const handleNextFromScoreboard = () => {
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setStage('get_ready');
      setGetReadyCount(3);
    } else {
      setStage('podium');
      audio.playFanfare();
    }
  };

  // Answer counts for reveal
  const answerCounts = currentQ.options.reduce((acc, opt) => {
    acc[opt.id] = participants.filter(p => p.lastAnswerId === opt.id).length;
    return acc;
  }, {} as Record<string, number>);

  const maxVotes = Math.max(...Object.values(answerCounts), 1);

  // Leaderboard Top 5
  const leaderboard = [...participants].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* Top Smartboard Control Bar */}
      <header className="h-16 px-6 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-black text-sm">
              K!
            </span>
            <span className="font-black text-lg tracking-tight hidden sm:inline">
              {game.title}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl">
            <span className="text-xs font-bold text-purple-200">PIN:</span>
            <span className="text-sm sm:text-base font-mono font-black tracking-widest text-amber-300">
              {sessionCode.slice(0, 3)} {sessionCode.slice(3)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participants.length} Spieler</span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const muted = classroomAudio.toggleMute();
              setIsSoundMuted(muted);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-slate-200"
            title={isSoundMuted ? 'Ton einschalten' : 'Ton stummschalten'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-slate-200"
            title="Vollbild"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-all"
            title="Präsentation beenden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* STAGE 1: LOBBY */}
      {stage === 'lobby' && (
        <main className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full">
          
          <div className="text-center space-y-2 mt-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Trete jetzt dem Quiz bei!
            </h1>
            <p className="text-sm sm:text-base text-purple-200/90 font-medium">
              Öffne die Schulseite oder scanne den QR-Code mit deinem Smartphone / Tablet.
            </p>
          </div>

          {/* Game Mode Switcher: Einzelspieler vs Tischgruppen (Team-Modus) */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
            <button
              onClick={() => setGameMode('individual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                gameMode === 'individual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>👤 Einzelspieler</span>
            </button>
            <button
              onClick={() => setGameMode('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                gameMode === 'team'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 Team-Modus (Tischgruppen)</span>
            </button>
          </div>

          {/* Center Card with PIN & QR Code */}
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
            <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0">
              <QRCodeSVG
                value={studentJoinUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                {gameMode === 'team' ? 'Team-Spiel-PIN' : 'Spiel-PIN'}
              </span>
              <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-widest bg-black/40 px-6 py-2 rounded-2xl border border-white/20 shadow-inner">
                {sessionCode.slice(0, 3)} {sessionCode.slice(3)}
              </div>
              <span className="text-xs text-slate-300 font-mono">
                {studentJoinUrl}
              </span>
              {gameMode === 'team' && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-xl">
                  👥 Tischgruppen-Modus: Ein Gerät pro Tisch genügt!
                </span>
              )}
            </div>
          </div>

          {/* Participant Bubbles */}
          <div className="w-full flex-1 max-h-48 overflow-y-auto px-4 py-2 mt-4">
            <div className="flex items-center justify-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-purple-300">
              <Users className="w-4 h-4" />
              <span>In der Lobby: {participants.length} {gameMode === 'team' ? 'Teams' : 'Spieler'}</span>
            </div>

            {participants.length === 0 ? (
              <div className="text-center text-sm text-purple-300/60 animate-pulse mt-4">
                {gameMode === 'team'
                  ? 'Warte auf Tischgruppen... Schließt euch zusammen und tretet bei!'
                  : 'Warte auf Spieler... Scanne den QR-Code oder gib den PIN ein!'}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {participants.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border backdrop-blur-md shadow-md animate-bounceIn ${
                      gameMode === 'team'
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                        : 'bg-white/15 border-white/25 text-white'
                    }`}
                  >
                    <span className="text-lg">{p.avatar || (gameMode === 'team' ? '👥' : '🦊')}</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white flex items-center gap-1">
                        {gameMode === 'team' && (
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.2 bg-amber-500/40 text-amber-300 rounded">
                            Team
                          </span>
                        )}
                        {p.nickname}
                      </span>
                      {p.teamMembers && p.teamMembers.length > 0 && (
                        <span className="text-[10px] text-purple-200/80 font-medium">
                          {p.teamMembers.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={participants.length === 0}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-lg shadow-xl shadow-purple-600/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>Quiz starten ({participants.length} {gameMode === 'team' ? 'Teams' : 'bereit'})</span>
          </button>
        </main>
      )}

      {/* STAGE 2: GET READY */}
      {stage === 'get_ready' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="text-sm font-black uppercase tracking-widest text-purple-300">
            Frage {currentQuestionIndex + 1} von {game.questions.length}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black max-w-3xl leading-tight">
            {currentQ.question}
          </h2>
          <div className="w-28 h-28 rounded-full bg-purple-600/40 border-4 border-purple-400 flex items-center justify-center text-6xl font-black font-mono animate-pingOnce">
            {getReadyCount}
          </div>
          <span className="text-sm text-purple-200 font-bold">
            Bereitmachen!
          </span>
        </main>
      )}

      {/* STAGE 3: QUESTION (COUNTDOWN ACTIVE) */}
      {stage === 'question' && (
        <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full justify-between">
          
          {/* Question Banner */}
          <div className="relative bg-slate-900/90 border-2 border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center justify-center min-h-[140px]">
            <div className="absolute top-3 left-4 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                Frage {currentQuestionIndex + 1} / {game.questions.length}
              </span>
              {gameMode === 'team' && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Team-Modus
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug max-w-4xl">
              {currentQ.question}
            </h2>

            {/* Answers Counter Badge */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-900/70 border border-purple-500/40 text-xs font-bold text-purple-200">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{participants.filter(p => p.lastAnswerId).length} / {participants.length} geantwortet</span>
            </div>
          </div>

          {/* Center Timer & Skip Button */}
          <div className="flex items-center justify-center my-4 gap-6">
            <div className="flex items-center gap-3 bg-black/40 px-6 py-2.5 rounded-2xl border border-white/20 shadow-lg">
              <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
              <span className={`text-4xl sm:text-5xl font-mono font-black ${timeLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>

            <button
              onClick={handleTimeUp}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-black transition-all border border-white/10"
              title="Zeit vorzeitig beenden"
            >
              Auflösen
            </button>
          </div>

          {/* 4 Colored Shape Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt) => {
              const shapeMeta = SHAPE_CONFIG[opt.shape] || SHAPE_CONFIG.triangle;
              return (
                <div
                  key={opt.id}
                  className={`rounded-3xl p-5 sm:p-6 flex items-center gap-4 shadow-xl border-2 border-white/15 transition-all ${
                    opt.color === 'red' ? 'bg-red-600' :
                    opt.color === 'blue' ? 'bg-blue-600' :
                    opt.color === 'yellow' ? 'bg-amber-500' :
                    'bg-emerald-600'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl drop-shadow-md shrink-0">
                    {shapeMeta.icon}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-white leading-tight">
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>

        </main>
      )}

      {/* STAGE 4: REVEAL (ANSWER DISTRIBUTION & CORRECT HIGHLIGHT) */}
      {stage === 'reveal' && (
        <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full justify-between">
          
          <div className="bg-slate-900/90 border-2 border-white/20 rounded-3xl p-5 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {currentQ.question}
            </h2>
            {currentQ.explanation && (
              <p className="mt-2 text-xs sm:text-sm text-purple-200/90 bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/60 max-w-2xl mx-auto">
                💡 <span className="font-bold">Erklärung:</span> {currentQ.explanation}
              </p>
            )}
          </div>

          {/* Bars representation of votes */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 items-end h-56 px-4">
            {currentQ.options.map(opt => {
              const votes = answerCounts[opt.id] || 0;
              const heightPercent = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
              const shapeMeta = SHAPE_CONFIG[opt.shape] || SHAPE_CONFIG.triangle;

              return (
                <div key={opt.id} className="flex flex-col items-center h-full justify-end">
                  <span className="text-base sm:text-xl font-black font-mono text-white mb-2">
                    {votes}
                  </span>
                  <div
                    style={{ height: `${Math.max(12, heightPercent)}%` }}
                    className={`w-full rounded-2xl transition-all duration-700 flex items-center justify-center shadow-lg ${
                      opt.isCorrect 
                        ? `${shapeMeta.bgClass} ring-4 ring-white` 
                        : `${shapeMeta.bgClass} opacity-40`
                    }`}
                  >
                    <span className="text-2xl">{shapeMeta.icon}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Option details with correct checkmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map(opt => {
              const shapeMeta = SHAPE_CONFIG[opt.shape] || SHAPE_CONFIG.triangle;
              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                    opt.isCorrect 
                      ? `${shapeMeta.bgClass} border-white shadow-xl ring-2 ring-white/50 scale-[1.01]` 
                      : 'bg-black/30 border-white/10 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{shapeMeta.icon}</span>
                    <span className="font-black text-base">{opt.text}</span>
                  </div>

                  {opt.isCorrect && (
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black shadow-md">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action to scoreboard */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleNextFromReveal}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Weiter zur Rangliste</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </main>
      )}

      {/* STAGE 5: SCOREBOARD (TOP 5 LEADERBOARD) */}
      {stage === 'scoreboard' && (
        <main className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 max-w-4xl mx-auto w-full">
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              <span>Zwischenstand</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black">
              Top 5 Rangliste
            </h2>
          </div>

          {/* Leaderboard rows */}
          <div className="w-full space-y-3 my-6">
            {leaderboard.map((player, idx) => (
              <div
                key={player.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-base font-mono ${
                    idx === 0 ? 'bg-amber-400 text-slate-900 shadow-md' :
                    idx === 1 ? 'bg-slate-300 text-slate-900' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-2xl">{player.avatar || (gameMode === 'team' ? '👥' : '🦊')}</span>
                  <div className="flex flex-col text-left">
                    <span className="text-base sm:text-lg font-black flex items-center gap-1.5">
                      {gameMode === 'team' && (
                        <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded">
                          Team
                        </span>
                      )}
                      {player.nickname}
                    </span>
                    {player.teamMembers && player.teamMembers.length > 0 && (
                      <span className="text-xs text-purple-300/80 font-medium">
                        {player.teamMembers.join(', ')}
                      </span>
                    )}
                  </div>

                  {player.streak && player.streak >= 2 && (
                    <span className="px-2 py-0.5 rounded-lg bg-orange-500/30 border border-orange-400/50 text-orange-300 text-xs font-black flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                      {player.streak}x Serie!
                    </span>
                  )}
                </div>

                <div className="text-lg sm:text-xl font-mono font-black text-purple-200">
                  {player.score.toLocaleString('de-DE')} Pkt
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextFromScoreboard}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>
              {currentQuestionIndex < game.questions.length - 1 
                ? 'Nächste Frage ▶' 
                : 'Zum Siegerpodest! 🏆'}
            </span>
          </button>

        </main>
      )}

      {/* STAGE 6: PODIUM CEREMONY */}
      {stage === 'podium' && (
        <main className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 max-w-5xl mx-auto w-full relative">
          
          {/* Confetti simulation bubbles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['🎉', '⭐', '✨', '🎈', '🏆', '🎊', '🥇', '🥈', '🥉'].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-3xl animate-bounce"
                style={{
                  left: `${(i * 11) % 95}%`,
                  top: `${(i * 17) % 80}%`,
                  animationDuration: `${1.5 + (i % 3) * 0.5}s`
                }}
              >
                {emoji}
              </span>
            ))}
          </div>

          <div className="text-center space-y-1 relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              🏆 Siegerehrung! 🏆
            </h1>
            <p className="text-sm text-purple-200 font-bold">
              Großartige Leistung aller Teilnehmer an der Heimbürgeschule!
            </p>
          </div>

          {/* 3-Step Olympic Podium */}
          <div className="flex items-end justify-center gap-4 sm:gap-6 my-8 w-full max-w-2xl h-80 relative z-10">
            
            {/* 2nd Place */}
            <div className="flex-1 flex flex-col items-center">
              {participants[1] && (
                <div className="mb-2 text-center">
                  <span className="text-3xl sm:text-4xl">{participants[1].avatar || (gameMode === 'team' ? '👥' : '🚀')}</span>
                  <div className="text-xs sm:text-sm font-black text-white">
                    {gameMode === 'team' && <span className="text-[10px] text-amber-300 mr-1">👥</span>}
                    {participants[1].nickname}
                  </div>
                  {participants[1].teamMembers && participants[1].teamMembers.length > 0 && (
                    <div className="text-[10px] text-slate-300 truncate max-w-[120px]">{participants[1].teamMembers.join(', ')}</div>
                  )}
                  <div className="text-xs font-mono text-slate-300">{participants[1].score} Pkt</div>
                </div>
              )}
              <div className="w-full h-44 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-3xl border-t-4 border-slate-300 flex flex-col items-center justify-center text-white shadow-2xl">
                <span className="text-4xl font-black">2</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Silber</span>
              </div>
            </div>

            {/* 1st Place Champion */}
            <div className="flex-1 flex flex-col items-center">
              {participants[0] && (
                <div className="mb-2 text-center animate-bounce">
                  <div className="text-2xl">👑</div>
                  <span className="text-4xl sm:text-5xl">{participants[0].avatar || (gameMode === 'team' ? '👥' : '🦊')}</span>
                  <div className="text-sm sm:text-base font-black text-amber-300">
                    {gameMode === 'team' && <span className="text-xs text-amber-400 mr-1">👥 Team</span>}
                    {participants[0].nickname}
                  </div>
                  {participants[0].teamMembers && participants[0].teamMembers.length > 0 && (
                    <div className="text-[11px] text-amber-200/90 font-medium truncate max-w-[140px]">{participants[0].teamMembers.join(', ')}</div>
                  )}
                  <div className="text-xs font-mono font-black text-amber-200">{participants[0].score} Pkt</div>
                </div>
              )}
              <div className="w-full h-60 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-3xl border-t-4 border-yellow-200 flex flex-col items-center justify-center text-slate-900 shadow-2xl">
                <span className="text-5xl font-black">1</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">Champion</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex-1 flex flex-col items-center">
              {participants[2] && (
                <div className="mb-2 text-center">
                  <span className="text-3xl sm:text-4xl">{participants[2].avatar || (gameMode === 'team' ? '👥' : '🦁')}</span>
                  <div className="text-xs sm:text-sm font-black text-white">
                    {gameMode === 'team' && <span className="text-[10px] text-amber-300 mr-1">👥</span>}
                    {participants[2].nickname}
                  </div>
                  {participants[2].teamMembers && participants[2].teamMembers.length > 0 && (
                    <div className="text-[10px] text-slate-300 truncate max-w-[120px]">{participants[2].teamMembers.join(', ')}</div>
                  )}
                  <div className="text-xs font-mono text-slate-300">{participants[2].score} Pkt</div>
                </div>
              )}
              <div className="w-full h-32 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-3xl border-t-4 border-amber-600 flex flex-col items-center justify-center text-white shadow-2xl">
                <span className="text-3xl font-black">3</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">Bronze</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => {
                setStage('lobby');
                setCurrentQuestionIndex(0);
                setParticipants([]);
              }}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Neu starten</span>
            </button>

            <button
              onClick={onExit}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xl transition-all active:scale-95"
            >
              Beenden & Schließen
            </button>
          </div>

        </main>
      )}

    </div>
  );
};
