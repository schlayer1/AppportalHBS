import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  X,
  Users
} from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { KahootLiveSession, KahootParticipant, KahootShape } from '../../types/kahootTypes';

interface KahootStudentPlayerProps {
  initialPin?: string;
  onClose?: () => void;
}

const AVATARS = ['🦊', '🚀', '🦁', '⚡', '🐼', '🦄', '⚽', '🍕', '🐱', '🦖', '🌟', '🎸'];

const SHAPE_CONFIG: Record<KahootShape, { icon: string; bgClass: string; activeClass: string }> = {
  triangle: { icon: '🔺', bgClass: 'bg-red-600 active:bg-red-700', activeClass: 'border-red-400' },
  diamond: { icon: '🔷', bgClass: 'bg-blue-600 active:bg-blue-700', activeClass: 'border-blue-400' },
  circle: { icon: '🟡', bgClass: 'bg-amber-500 active:bg-amber-600', activeClass: 'border-amber-400' },
  square: { icon: '🟩', bgClass: 'bg-emerald-600 active:bg-emerald-700', activeClass: 'border-emerald-400' }
};

export const KahootStudentPlayer: React.FC<KahootStudentPlayerProps> = ({
  initialPin = '',
  onClose
}) => {
  const [pinCode, setPinCode] = useState<string>(() => {
    if (initialPin) return initialPin.replace(/\s+/g, '');
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('kahoot');
      if (p) return p.replace(/\s+/g, '');
    }
    return '';
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [session, setSession] = useState<KahootLiveSession | null>(null);
  const [hasEnteredPin, setHasEnteredPin] = useState<boolean>(!!pinCode);
  const [hasJoinedLobby, setHasJoinedLobby] = useState<boolean>(false);

  // Student profile
  const [studentId] = useState<string>(() => {
    return 'p-' + Math.random().toString(36).substring(2, 9);
  });
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('hbs_kahoot_nickname') || '';
  });
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊');

  // Team mode state
  const [teamMembersStr, setTeamMembersStr] = useState<string>('');
  const [teamConsultationLeft, setTeamConsultationLeft] = useState<number>(0);

  // Answer state for current question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lastQuestionIndex, setLastQuestionIndex] = useState<number>(-1);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Load fallback session from localStorage when pinCode is set
  useEffect(() => {
    if (pinCode && !session) {
      try {
        const stored = localStorage.getItem(`hbs_kahoot_session_${pinCode}`);
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
      channel = new BroadcastChannel(`hbs_kahoot_${pinCode}`);
      broadcastRef.current = channel;
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STAGE_CHANGE' && payload) {
          setSession(payload);
        } else if (type === 'JOIN_CONFIRMED') {
          setHasJoinedLobby(true);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error in student player:', e);
    }

    return () => {
      if (channel) channel.close();
      broadcastRef.current = null;
    };
  }, [pinCode]);

  // Snapshot listener for active Kahoot session from Firestore
  useEffect(() => {
    if (!db) return;
    try {
      const portalDocRef = doc(db, 'schools', 'HBS_portal');
      const unsubscribe = onSnapshot(portalDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const sess = d.activeKahootSession as KahootLiveSession;
          if (sess) {
            // Verify PIN code matches!
            if (!pinCode || sess.sessionCode === pinCode) {
              setSession(sess);
            }
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Student player snapshot listener error:', e);
    }
  }, [pinCode]);

  // When question changes, reset selected answer and start team consultation countdown
  useEffect(() => {
    if (session && session.currentQuestionIndex !== lastQuestionIndex) {
      setLastQuestionIndex(session.currentQuestionIndex);
      setSelectedOptionId(null);
      if (session.gameMode === 'team') {
        setTeamConsultationLeft(5);
      } else {
        setTeamConsultationLeft(0);
      }
    }
  }, [session?.currentQuestionIndex, lastQuestionIndex, session?.gameMode]);

  // Team consultation 5s countdown
  useEffect(() => {
    if (teamConsultationLeft <= 0) return;
    const timer = setInterval(() => {
      setTeamConsultationLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [teamConsultationLeft]);

  // Find my current participant state in session
  const myParticipant = session?.participants?.find(p => p.id === studentId);

  // Handle PIN submit
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = enteredPin.replace(/\s+/g, '');
    if (clean.length >= 4) {
      setPinCode(clean);
      setHasEnteredPin(true);
    }
  };

  // Join the lobby
  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    localStorage.setItem('hbs_kahoot_nickname', nickname.trim());

    const isTeam = session?.gameMode === 'team';
    const members = teamMembersStr
      ? teamMembersStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newParticipant: KahootParticipant = {
      id: studentId,
      nickname: nickname.trim(),
      avatar: selectedAvatar,
      score: 0,
      streak: 0,
      isTeam,
      teamMembers: members
    };

    // Broadcast locally
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_JOIN_LOBBY',
        payload: { participant: newParticipant }
      });
    }

    // Set joined immediately so student doesn't hang
    setHasJoinedLobby(true);

    // Update local state so lobby shows player right away
    setSession(prev => {
      if (!prev) return prev;
      const currentList = prev.participants || [];
      return {
        ...prev,
        participants: [...currentList.filter(p => p.id !== studentId), newParticipant]
      };
    });

    if (db && session) {
      const currentList = session.participants || [];
      const updatedList = [...currentList.filter(p => p.id !== studentId), newParticipant];

      try {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(portalDocRef, {
          'activeKahootSession.participants': updatedList
        });
      } catch (err) {
        console.warn('Error joining lobby in cloud:', err);
      }
    }
  };

  // Student submits their answer
  const handleSelectOption = async (optionId: string) => {
    if (selectedOptionId) return;
    if (session && (session.stage !== 'question' || !session.isAnswerOpen)) return;

    setSelectedOptionId(optionId);

    // Broadcast locally
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_ANSWER',
        payload: { studentId, optionId }
      });
    }

    if (db && session) {
      const currentList = session.participants || [];
      const updatedList = currentList.map(p => {
        if (p.id === studentId) {
          return {
            ...p,
            lastAnswerId: optionId,
            lastAnswerTime: Date.now()
          };
        }
        return p;
      });

      try {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(portalDocRef, {
          'activeKahootSession.participants': updatedList
        });
      } catch (err) {
        console.warn('Error submitting answer in cloud:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col font-sans select-none overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
      
      {/* Top Simple Mobile Header */}
      <header className="h-14 px-4 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-black text-xs">
            K!
          </span>
          <span className="font-black text-sm tracking-tight text-purple-200">
            HBS Kahoot Player
          </span>
        </div>

        <div className="flex items-center gap-2">
          {myParticipant && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold">
              <span>{myParticipant.avatar}</span>
              <span>{myParticipant.nickname}</span>
              <span className="text-amber-400 font-mono">({myParticipant.score} Pkt)</span>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* VIEW 1: ENTER PIN */}
      {!hasEnteredPin && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/30 border-2 border-purple-400 flex items-center justify-center text-3xl mb-6 shadow-xl animate-bounce">
            🎲
          </div>
          <h1 className="text-2xl font-black text-center mb-1">
            Spiel-PIN eingeben
          </h1>
          <p className="text-xs text-purple-200/80 text-center mb-6">
            Den 6-stelligen Code siehst du vorne auf dem Smartboard.
          </p>

          <form onSubmit={handlePinSubmit} className="w-full space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={enteredPin}
              onChange={e => setEnteredPin(e.target.value)}
              placeholder="z. B. 839 201"
              maxLength={7}
              className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-2xl font-mono font-black text-center text-amber-300 placeholder:text-white/30 focus:border-purple-400 focus:outline-none"
              autoFocus
            />

            <button
              type="submit"
              disabled={enteredPin.replace(/\s+/g, '').length < 4}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 font-black text-sm tracking-wider uppercase transition-all shadow-lg active:scale-95 disabled:opacity-40"
            >
              Weiter
            </button>
          </form>
        </main>
      )}

      {/* VIEW 2: ENTER NICKNAME & CHOOSE AVATAR */}
      {hasEnteredPin && !hasJoinedLobby && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
          <h1 className="text-2xl font-black text-center mb-1">
            {session?.gameMode === 'team' ? '👥 Eure Tischgruppe' : 'Wähle deinen Namen'}
          </h1>
          <p className="text-xs text-purple-200/80 text-center mb-5">
            {session?.gameMode === 'team' 
              ? 'Wählt euer Maskottchen und gebt euren Team-Namen ein.' 
              : 'Wähle ein Emoji und deinen Spitznamen für das Quiz.'}
          </p>

          <form onSubmit={handleJoinLobby} className="w-full space-y-4">
            {/* Avatar Selector */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-2 text-center">
                {session?.gameMode === 'team' ? 'Team-Maskottchen:' : 'Dein Avatar:'}
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
                {AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === emoji 
                        ? 'bg-purple-600 ring-2 ring-white scale-110 shadow-md' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname / Team Name Input */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-1">
                {session?.gameMode === 'team' ? 'Team-Name:' : 'Spitzname:'}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder={session?.gameMode === 'team' ? 'z. B. Einstein-Falken oder Tisch 2' : 'Dein Vorname oder Nick...'}
                maxLength={24}
                className="w-full p-3.5 rounded-2xl bg-white/10 border-2 border-white/20 text-base font-bold text-center text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Team Members Input (if team mode) */}
            {session?.gameMode === 'team' && (
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-1">
                  Team-Mitglieder (optional):
                </label>
                <input
                  type="text"
                  value={teamMembersStr}
                  onChange={e => setTeamMembersStr(e.target.value)}
                  placeholder="z. B. Anna, Tim, Felix, Sophie"
                  maxLength={50}
                  className="w-full p-3 rounded-2xl bg-white/10 border-2 border-white/20 text-xs font-bold text-center text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 font-black text-sm tracking-wider uppercase transition-all shadow-xl active:scale-95 disabled:opacity-40"
            >
              {session?.gameMode === 'team' ? 'Als Team beitreten! 👥' : 'Ins Spiel einsteigen! 🚀'}
            </button>
          </form>
        </main>
      )}

      {/* VIEW 3: IN LOBBY (WAITING FOR TEACHER TO START) */}
      {hasJoinedLobby && session?.stage === 'lobby' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm mx-auto">
          <div className="w-24 h-24 rounded-full bg-purple-600/30 border-4 border-purple-400 flex items-center justify-center text-5xl animate-pulse">
            {selectedAvatar}
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase font-black tracking-widest text-purple-300">
              {session?.gameMode === 'team' ? 'Team registriert' : 'Du bist dabei!'}
            </span>
            <h2 className="text-2xl font-black">
              {nickname}
            </h2>
            {teamMembersStr && (
              <p className="text-xs text-purple-200/80 font-medium">
                Mitglieder: {teamMembersStr}
              </p>
            )}
          </div>
          <p className="text-xs text-purple-200/70 pt-2">
            Warte auf den Start durch die Lehrkraft am Smartboard...
          </p>
        </main>
      )}

      {/* VIEW 4: GET READY (3s COUNTDOWN) */}
      {hasJoinedLobby && session?.stage === 'get_ready' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="text-sm font-black uppercase tracking-widest text-purple-300">
            Nächste Frage
          </div>
          <h2 className="text-3xl font-black">
            Bereitmachen! ⏳
          </h2>
          <p className="text-sm text-purple-200">
            Schau nach vorne auf das Smartboard!
          </p>
        </main>
      )}

      {/* VIEW 5: QUESTION - THE CLASSIC 4-COLOR GAMEPAD */}
      {hasJoinedLobby && session?.stage === 'question' && (
        <main className="flex-1 flex flex-col p-3 w-full justify-between">
          
          {selectedOptionId ? (
            // Answer submitted confirmation screen
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-4xl shadow-xl animate-bounce">
                ✓
              </div>
              <h2 className="text-2xl font-black">Antwort gesendet!</h2>
              <p className="text-xs text-purple-200">
                Warten auf die Auflösung... Schau auf das Smartboard!
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">
              {/* Team Consultation Banner */}
              {session?.gameMode === 'team' && teamConsultationLeft > 0 && (
                <div className="p-3 mb-2 rounded-2xl bg-amber-500/25 border-2 border-amber-400 text-amber-100 text-center animate-pulse shrink-0">
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-300 flex items-center justify-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Team-Beratungsphase</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold mt-0.5">
                    Sprecht euch am Tisch ab! Freigabe in <span className="font-mono text-base font-black text-amber-300">{teamConsultationLeft}s</span>
                  </div>
                </div>
              )}

              {/* Gamepad Buttons */}
              <div className="flex-1 grid grid-cols-2 gap-3 h-full max-h-[85vh]">
                {session?.activeQuestion?.options.map((opt, idx) => {
                  const shapeMeta = SHAPE_CONFIG[opt.shape] || SHAPE_CONFIG.triangle;
                  const isLockedByConsultation = session?.gameMode === 'team' && teamConsultationLeft > 0;

                  return (
                    <button
                      key={opt.id || idx}
                      onClick={() => !isLockedByConsultation && handleSelectOption(opt.id)}
                      disabled={isLockedByConsultation}
                      className={`min-h-[140px] sm:min-h-[180px] rounded-3xl flex items-center justify-center text-6xl sm:text-7xl shadow-2xl transition-all active:scale-90 select-none touch-manipulation cursor-pointer ${
                        isLockedByConsultation ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        opt.color === 'red' ? 'bg-red-600 active:bg-red-700' :
                        opt.color === 'blue' ? 'bg-blue-600 active:bg-blue-700' :
                        opt.color === 'yellow' ? 'bg-amber-500 active:bg-amber-600' :
                        'bg-emerald-600 active:bg-emerald-700'
                      }`}
                    >
                      <span className="drop-shadow-lg pointer-events-none">
                        {shapeMeta.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      )}

      {/* VIEW 6: REVEAL / SCOREBOARD FEEDBACK */}
      {hasJoinedLobby && (session?.stage === 'reveal' || session?.stage === 'scoreboard') && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm mx-auto">
          {myParticipant?.lastAnswerCorrect ? (
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-5xl shadow-2xl animate-bounceIn">
              🎉
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-red-500/80 flex items-center justify-center text-5xl shadow-2xl">
              😢
            </div>
          )}

          <h2 className="text-2xl font-black">
            {myParticipant?.lastAnswerCorrect ? 'Richtig!' : 'Leider falsch!'}
          </h2>

          {myParticipant?.lastAnswerCorrect && (
            <div className="text-lg font-mono font-black text-amber-300">
              +{myParticipant.lastPointsEarned || 0} Punkte!
            </div>
          )}

          {myParticipant?.streak && myParticipant.streak >= 2 && (
            <div className="px-3 py-1 rounded-xl bg-orange-500/30 border border-orange-400 text-orange-300 text-xs font-black flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
              <span>{myParticipant.streak}er Serie! 🔥</span>
            </div>
          )}

          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 w-full text-center">
            <span className="text-xs text-purple-200 block">Gesamtpunktzahl:</span>
            <span className="text-2xl font-mono font-black text-white">
              {myParticipant?.score || 0} Pkt
            </span>
          </div>
        </main>
      )}

      {/* VIEW 7: PODIUM FINALE */}
      {hasJoinedLobby && session?.stage === 'podium' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm mx-auto">
          <div className="text-6xl animate-bounce">
            🏆
          </div>
          <h2 className="text-2xl font-black text-amber-300">
            Quiz beendet!
          </h2>
          <p className="text-sm text-purple-200">
            Toll mitgespielt! Schau nach vorne auf das Smartboard für die feierliche Siegerehrung.
          </p>
          <div className="p-4 bg-white/10 rounded-2xl border border-white/20 w-full">
            <span className="text-xs text-purple-200 block">Dein Endergebnis:</span>
            <span className="text-3xl font-mono font-black text-amber-300">
              {myParticipant?.score || 0} Pkt
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-black uppercase"
            >
              Zurück zum Portal
            </button>
          )}
        </main>
      )}

    </div>
  );
};
