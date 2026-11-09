import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Check,
  Zap, 
  Users, 
  Clock, 
  ArrowRight,
  X,
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { 
  OncooSession, 
  OncooCardColor, 
  OncooCard, 
  OncooTargetVote, 
  OncooHelpItem 
} from '../../types/oncooTypes';
import { getCachedPortalData, subscribeToOncooSession, submitOncooActionInCloud, getOncooLiveSessionFromCloud } from '../../services/firebase';

interface OncooStudentClientProps {
  initialCode?: string;
  onClose?: () => void;
}

const CARD_COLORS: { id: OncooCardColor; label: string; bg: string; border: string; text: string }[] = [
  { id: 'yellow', label: 'Gelb', bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-950' },
  { id: 'green', label: 'Grün', bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-950' },
  { id: 'blue', label: 'Blau', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-950' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-950' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-950' },
];

export const OncooStudentClient: React.FC<OncooStudentClientProps> = ({
  initialCode = '',
  onClose
}) => {
  const [pinCode, setPinCode] = useState<string>(() => {
    if (initialCode) return initialCode.trim().replace(/\s+/g, '');
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('oncoo');
      if (p && p.trim().length >= 6) return p.trim().replace(/\s+/g, '');
      const hash = window.location.hash.replace('#oncoo=', '').replace('#oncoo', '').trim();
      if (hash && hash.length >= 6) return hash.replace(/\s+/g, '');
    }
    return '';
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [session, setSession] = useState<OncooSession | null>(null);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [isSearchingSession, setIsSearchingSession] = useState<boolean>(false);
  const [sessionNotFound, setSessionNotFound] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('hbs_oncoo_student_name') || '';
  });

  // Tool Specific Student States:
  // 1. Kartenabfrage
  const [cardText, setCardText] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<OncooCardColor>('yellow');
  const [mySentCards, setMySentCards] = useState<OncooCard[]>([]);

  // 2. Zielscheibe
  const [targetScores, setTargetScores] = useState<Record<string, number>>({});
  const [hasVotedTarget, setHasVotedTarget] = useState<boolean>(false);

  // 3. Lerntempoduett
  const [hasReportedFinished, setHasReportedFinished] = useState<boolean>(false);
  const [myTandemPartner, setMyTandemPartner] = useState<{ name: string; table: number } | null>(null);

  // 4. Helfersystem
  const [helpMode, setHelpMode] = useState<'seek' | 'offer'>('seek');
  const [helpTopic, setHelpTopic] = useState<string>('');
  const [hasSubmittedHelp, setHasSubmittedHelp] = useState<boolean>(false);

  // 5. Placemat
  const [placematGroupIndex, setPlacematGroupIndex] = useState<number>(0);
  const [placematCorner, setPlacematCorner] = useState<'cornerA' | 'cornerB' | 'cornerC' | 'cornerD'>('cornerA');
  const [placematNote, setPlacematNote] = useState<string>('');
  const [myPlacematNotes, setMyPlacematNotes] = useState<string[]>([]);
  const [placematTab, setPlacematTab] = useState<'corner' | 'consensus'>('corner');
  const [placematConsensusText, setPlacematConsensusText] = useState<string>('');
  const [hasSubmittedConsensus, setHasSubmittedConsensus] = useState<boolean>(false);

  // Broadcast Channel for live sync
  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  // Auto-join and live Firestore subscription + polling
  useEffect(() => {
    if (!pinCode || pinCode.trim().length < 6) {
      setHasJoined(false);
      setSession(null);
      setIsSearchingSession(false);
      setSessionNotFound(false);
      return;
    }

    const cleanPin = pinCode.trim().replace(/\s+/g, '');
    setIsSearchingSession(true);
    setSessionNotFound(false);

    // 1. Check local cache ONLY if PIN strictly matches!
    const cloud = getCachedPortalData();
    const localMatch = (cloud.oncooSessions || []).find(s => s.pinCode?.replace(/\s+/g, '') === cleanPin) ||
      (cloud.activeOncooSession?.pinCode?.replace(/\s+/g, '') === cleanPin ? cloud.activeOncooSession : null);

    if (localMatch) {
      setSession(localMatch);
      setHasJoined(true);
      setIsSearchingSession(false);
      if (localMatch.toolType === 'zielscheibe' && localMatch.zielscheibe) {
        setTargetScores(prev => {
          if (Object.keys(prev).length > 0) return prev;
          const defaults: Record<string, number> = {};
          localMatch.zielscheibe?.criteria.forEach(c => { defaults[c.id] = 4; });
          return defaults;
        });
      }
    }

    // 2. Helper to apply live session from Firestore or broadcast
    const applySession = (liveSess: OncooSession | null) => {
      if (liveSess && liveSess.pinCode?.replace(/\s+/g, '') === cleanPin) {
        setSession(liveSess);
        setHasJoined(true);
        setIsSearchingSession(false);
        setSessionNotFound(false);

        // Zielscheibe initial defaults
        if (liveSess.toolType === 'zielscheibe' && liveSess.zielscheibe) {
          setTargetScores(prev => {
            if (Object.keys(prev).length > 0) return prev;
            const defaults: Record<string, number> = {};
            liveSess.zielscheibe?.criteria.forEach(c => { defaults[c.id] = 4; });
            return defaults;
          });
        }

        // Lerntempoduett pair matching for student
        if (liveSess.toolType === 'lerntempoduett' && liveSess.lerntempoduett && studentName) {
          const sName = studentName.trim().toLowerCase();
          const pair = liveSess.lerntempoduett.pairs?.find(
            p => p.student1.trim().toLowerCase() === sName || p.student2.trim().toLowerCase() === sName
          );
          if (pair) {
            const partner = pair.student1.trim().toLowerCase() === sName ? pair.student2 : pair.student1;
            setMyTandemPartner({ name: partner, table: pair.tableNumber || 1 });
          }
        }
      }
    };

    // 3. Connect to Firestore
    const unsub = subscribeToOncooSession(cleanPin, applySession);

    // Initial fetch
    getOncooLiveSessionFromCloud(cleanPin).then(live => {
      if (live) applySession(live);
    });

    // 2.5s polling heartbeat
    const heartbeat = setInterval(async () => {
      const live = await getOncooLiveSessionFromCloud(cleanPin);
      if (live) applySession(live);
    }, 2500);

    // Timeout: if still not joined after 6 seconds, show not found
    const timeout = setTimeout(() => {
      setIsSearchingSession(prev => {
        if (prev && !hasJoined) {
          setSessionNotFound(true);
        }
        return false;
      });
    }, 6000);

    // 4. BroadcastChannel for same-origin tabs
    try {
      const channel = new BroadcastChannel(`hbs_oncoo_${cleanPin}`);
      broadcastRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === 'PAIR_FORMED' && studentName) {
          const pair = event.data.payload;
          if (pair.student1 === studentName) {
            setMyTandemPartner({ name: pair.student2, table: pair.tableNumber });
          } else if (pair.student2 === studentName) {
            setMyTandemPartner({ name: pair.student1, table: pair.tableNumber });
          }
        } else if (event.data?.type === 'SESSION_UPDATE' && event.data.payload) {
          applySession(event.data.payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    return () => {
      unsub();
      clearInterval(heartbeat);
      clearTimeout(timeout);
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
    };
  }, [pinCode, studentName]);

  // Submit Card
  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardText.trim() || !session) return;

    const newCard: OncooCard = {
      id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: cardText.trim(),
      color: selectedColor,
      authorAlias: studentName.trim() || 'Schüler',
      createdAt: Date.now(),
      likes: 0
    };

    // Broadcast to teacher presenter locally
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: { card: newCard }
      });
    }

    // Cloud push across all devices
    if (pinCode) {
      submitOncooActionInCloud(pinCode, { card: newCard });
    }

    setMySentCards(prev => [newCard, ...prev]);
    setCardText('');
  };

  // Submit Target Evaluation
  const handleSubmitTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || hasVotedTarget) return;

    const vote: OncooTargetVote = {
      id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentAlias: studentName.trim() || 'Schüler',
      scores: targetScores,
      createdAt: Date.now()
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: { vote }
      });
    }

    // Cloud push
    if (pinCode) {
      submitOncooActionInCloud(pinCode, {
        targetRating: {
          studentName: studentName.trim() || 'Schüler',
          ratings: targetScores
        }
      });
    }

    setHasVotedTarget(true);
  };

  // Report finished in Lerntempoduett
  const handleReportFinished = () => {
    if (!studentName.trim() || !session) return;
    localStorage.setItem('hbs_oncoo_student_name', studentName.trim());

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: { studentName: studentName.trim() }
      });
    }

    // Cloud push
    if (pinCode) {
      submitOncooActionInCloud(pinCode, {
        tandemFinished: { studentName: studentName.trim() }
      });
    }

    setHasReportedFinished(true);
  };

  // Submit Help Item
  const handleSubmitHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !helpTopic.trim() || !session) return;

    const item: OncooHelpItem = {
      id: `help-${Date.now()}`,
      type: helpMode,
      studentName: studentName.trim(),
      topic: helpTopic.trim(),
      status: 'open',
      createdAt: Date.now()
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: { helpItem: item }
      });
    }

    // Cloud push
    if (pinCode) {
      submitOncooActionInCloud(pinCode, { helpItem: item });
    }

    setHasSubmittedHelp(true);
  };

  // Submit Placemat Note
  const handleSubmitPlacematNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placematNote.trim() || !session || session.isLocked) return;

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: {
          placematUpdate: {
            groupIndex: placematGroupIndex,
            cornerKey: placematCorner,
            note: placematNote.trim()
          },
          studentName: studentName.trim() || undefined
        }
      });
    }

    // Cloud push
    if (pinCode) {
      submitOncooActionInCloud(pinCode, {
        placematUpdate: {
          groupIndex: placematGroupIndex,
          cornerKey: placematCorner,
          note: placematNote.trim()
        },
        studentName: studentName.trim() || undefined
      });
    }

    setMyPlacematNotes(prev => [...prev, placematNote.trim()]);
    setPlacematNote('');
  };

  // Submit Placemat Consensus
  const handleSubmitPlacematConsensus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || session.isLocked || !placematConsensusText.trim()) return;

    const payload = {
      placematConsensusUpdate: {
        groupIndex: placematGroupIndex,
        consensus: placematConsensusText.trim()
      },
      studentName: studentName.trim() || undefined
    };

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload
      });
    }

    if (pinCode) {
      await submitOncooActionInCloud(pinCode, payload);
    }

    setHasSubmittedConsensus(true);
    setTimeout(() => setHasSubmittedConsensus(false), 3000);
  };

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 font-sans flex flex-col justify-between pb-[calc(1rem+env(safe-area-inset-bottom))]">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            HBS
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 leading-tight">
              HBS Oncoo • Schülermodus
            </h1>
            <span className="text-[10px] text-slate-500 block">
              Heimbürgeschule Kahla
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasJoined && (
            <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">
              PIN: {pinCode}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
        
        {/* ================= STEP 1: PIN ENTRY & CONNECTION STATES ================= */}
        {!hasJoined && (
          <>
            {isSearchingSession && !sessionNotFound ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Sitzung wird verbunden...
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    PIN: {pinCode}
                  </p>
                </div>
              </div>
            ) : sessionNotFound ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Sitzung nicht gefunden
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Unter der PIN <span className="font-mono font-black text-rose-600">{pinCode}</span> wurde keine aktive Oncoo-Sitzung gefunden. Bitte vergleiche die PIN mit der Anzeige an der Tafel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPinCode('');
                    setEnteredPin('');
                    setSessionNotFound(false);
                    setIsSearchingSession(false);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md transition-all active:scale-95"
                >
                  Andere PIN eingeben
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <Users className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Sitzung beitreten
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gib den 6-stelligen PIN-Code von der Tafel oder dem Beamer ein:
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (enteredPin.trim().length >= 6) {
                      setPinCode(enteredPin.trim().replace(/\s+/g, ''));
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-3xl font-mono font-black tracking-widest py-3 rounded-2xl border-2 border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all bg-slate-50 text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enteredPin.trim().length < 6}
                    className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Beitreten</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* ================= STEP 2: ACTIVE SESSION TOOL UI ================= */}
        {hasJoined && session && (
          <div className="space-y-4 animate-in fade-in">
            
            {/* Lock status banner */}
            {session.isLocked && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Eingaben pausiert – Die Lehrkraft hat neue Beiträge vorübergehend gesperrt.</span>
              </div>
            )}

            {/* Student Alias Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-bold">Dein Name / Alias:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  localStorage.setItem('hbs_oncoo_student_name', e.target.value);
                }}
                placeholder="z. B. Max oder Gast"
                className="text-right text-base font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-rose-500 outline-none w-36"
              />
            </div>

            {/* 1. KARTENABFRAGE */}
            {session.toolType === 'kartenabfrage' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                    Kartenabfrage
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-snug mt-0.5">
                    {session.kartenabfrage?.question || session.title}
                  </h3>
                </div>

                <form onSubmit={handleSubmitCard} className="space-y-3">
                  {/* Color Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Farbe des Kärtchens
                    </label>
                    <div className="flex items-center justify-between gap-1.5">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(c.id)}
                          className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${c.bg} ${c.text} ${
                            selectedColor === c.id ? `${c.border} ring-2 ring-slate-800 scale-105 shadow-sm` : 'border-transparent opacity-60'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Dein Text / Stichwort
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={140}
                      value={cardText}
                      onChange={(e) => setCardText(e.target.value)}
                      placeholder="Schreibe deinen Gedanken auf die Karte..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-base font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    />
                    <div className="text-right text-[10px] text-slate-400">
                      {cardText.length} / 140 Zeichen
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!cardText.trim()}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Karte absenden</span>
                  </button>
                </form>

                {/* Sent Cards Log */}
                {mySentCards.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Deine gesendeten Karten ({mySentCards.length})
                    </span>
                    <div className="space-y-1.5">
                      {mySentCards.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span className="truncate">{c.text}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ZIELSCHEIBE */}
            {session.toolType === 'zielscheibe' && (() => {
              const totalRings = Math.max(2, Math.min(10, session.zielscheibe?.rings || 5));
              const minLbl = session.zielscheibe?.minLabel || 'trifft nicht zu';
              const maxLbl = session.zielscheibe?.maxLabel || 'trifft voll zu';

              return (
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                      Zielscheiben-Evaluation
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug mt-0.5">
                      {session.zielscheibe?.title || session.title}
                    </h3>
                  </div>

                  {!hasVotedTarget ? (
                    <form onSubmit={handleSubmitTarget} className="space-y-4">
                      <p className="text-xs text-slate-500">
                        Bewerte jedes Kriterium von 1 ({minLbl}) bis {totalRings} ({maxLbl}):
                      </p>

                      <div className="space-y-3">
                        {session.zielscheibe?.criteria.map((crit) => {
                          const val = targetScores[crit.id] || Math.round(totalRings / 2) || 1;
                          return (
                            <div key={crit.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800">{crit.label}</span>
                                <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  {val} von {totalRings}
                                </span>
                              </div>

                              {/* 1 to totalRings Pill Buttons */}
                              <div className={`grid gap-1 ${
                                totalRings <= 5 ? 'grid-cols-5' : totalRings <= 8 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-5 sm:grid-cols-10'
                              }`}>
                                {Array.from({ length: totalRings }, (_, i) => i + 1).map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => setTargetScores(prev => ({ ...prev, [crit.id]: num }))}
                                    className={`py-2 min-h-[38px] rounded-xl text-xs font-black transition-all touch-manipulation cursor-pointer active:scale-95 ${
                                      val === num
                                        ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-300'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Bewertung auf die Zielscheibe setzen</span>
                      </button>
                    </form>
                  ) : (
                    <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-emerald-950">Vielen Dank!</h4>
                      <p className="text-xs text-emerald-800">
                        Deine Klebepunkte sind auf der Zielscheibe am Beamer eingegangen.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. LERNTEMPODUETT */}
            {session.toolType === 'lerntempoduett' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Lerntempoduett
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {session.lerntempoduett?.taskTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Bearbeite zuerst deine Aufgaben eigenständig. Sobald du fertig gerechnet hast, klicke unten auf den Button.
                  </p>
                </div>

                {!hasReportedFinished ? (
                  <button
                    type="button"
                    onClick={handleReportFinished}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>🚀 Ich bin fertig! Partner suchen</span>
                  </button>
                ) : myTandemPartner ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2 animate-in zoom-in">
                    <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                      🎉 Dein Tandem-Partner:
                    </span>
                    <h4 className="text-xl font-black text-emerald-900">
                      {myTandemPartner.name}
                    </h4>
                    <p className="text-xs font-bold text-emerald-800">
                      Geht zusammen an <strong>Tisch {myTandemPartner.table}</strong> und vergleicht eure Lösungen!
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-pulse">
                    <Clock className="w-6 h-6 mx-auto text-amber-600" />
                    <h4 className="text-sm font-black">Warteschlange aktiv...</h4>
                    <p className="text-xs text-amber-800">
                      Sobald ein Mitschüler ebenfalls fertig ist, wird euch automatisch ein Tisch zugewiesen.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. HELFERSYSTEM */}
            {session.toolType === 'helfersystem' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                    Helfersystem
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {session.helfersystem?.exerciseTitle}
                  </h3>
                </div>

                {!hasSubmittedHelp ? (
                  <form onSubmit={handleSubmitHelp} className="space-y-4">
                    {/* Mode Choice */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHelpMode('seek')}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          helpMode === 'seek'
                            ? 'bg-red-50 border-red-500 text-red-950 font-black ring-2 ring-red-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-lg block mb-1">🆘</span>
                        <span className="text-xs block">Brauche Hilfe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHelpMode('offer')}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          helpMode === 'offer'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-lg block mb-1">💡</span>
                        <span className="text-xs block">Kann helfen</span>
                      </button>
                    </div>

                    {/* Topic Selection */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Station / Aufgabe wählen:
                      </label>
                      <select
                        value={helpTopic}
                        onChange={(e) => setHelpTopic(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                      >
                        <option value="">Bitte auswählen...</option>
                        {session.helfersystem?.topics.map((t, idx) => (
                          <option key={idx} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!helpTopic}
                      className={`w-full py-3 rounded-xl font-black text-xs text-white shadow-md transition-all active:scale-95 ${
                        helpMode === 'seek' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {helpMode === 'seek' ? 'Hilferuf an die Klasse senden' : 'Hilfe anbieten'}
                    </button>
                  </form>
                ) : (
                  <div className="p-5 text-center space-y-2 bg-purple-50 rounded-2xl border border-purple-200">
                    <CheckCircle2 className="w-8 h-8 text-purple-600 mx-auto" />
                    <h4 className="text-sm font-black text-purple-950">Eintrag übermittelt!</h4>
                    <p className="text-xs text-purple-800">
                      Dein Eintrag ist an der Hilfebörse sichtbar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. PLACEMAT */}
            {session.toolType === 'placemat' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                    Placemat (Think-Pair-Share)
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {session.placemat?.topic}
                  </h3>
                </div>

                {/* Table / Group selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Dein Gruppentisch:
                  </label>
                  <select
                    value={placematGroupIndex}
                    onChange={(e) => {
                      const newIdx = Number(e.target.value);
                      setPlacematGroupIndex(newIdx);
                      setPlacematConsensusText(session.placemat?.groups?.[newIdx]?.consensus || '');
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:border-rose-500"
                  >
                    {(session.placemat?.groups || [
                      { groupName: 'Tisch 1' },
                      { groupName: 'Tisch 2' },
                      { groupName: 'Tisch 3' },
                      { groupName: 'Tisch 4' }
                    ]).map((g, idx) => (
                      <option key={idx} value={idx}>{g.groupName || `Tisch ${idx + 1}`}</option>
                    ))}
                  </select>
                </div>

                {/* Mode Tabs: Außenfeld (Think) vs Gruppenkonsens (Share) */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPlacematTab('corner')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      placematTab === 'corner' ? 'bg-white text-rose-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✏️ Mein Außenfeld (Think)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlacematTab('consensus');
                      if (!placematConsensusText && session.placemat?.groups?.[placematGroupIndex]?.consensus) {
                        setPlacematConsensusText(session.placemat.groups[placematGroupIndex].consensus);
                      }
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      placematTab === 'consensus' ? 'bg-white text-rose-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🤝 Gruppenkonsens (Share)</span>
                  </button>
                </div>

                {placematTab === 'corner' ? (
                  <form onSubmit={handleSubmitPlacematNote} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Dein Quadrant (Ecke) am Tisch
                      </label>
                      <select
                        value={placematCorner}
                        onChange={(e) => setPlacematCorner(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                      >
                        <option value="cornerA">Quadrant A (Norden)</option>
                        <option value="cornerB">Quadrant B (Osten)</option>
                        <option value="cornerC">Quadrant C (Süden)</option>
                        <option value="cornerD">Quadrant D (Westen)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Dein Gedanke für dein Außenfeld
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={placematNote}
                        onChange={(e) => setPlacematNote(e.target.value)}
                        placeholder="Stichpunkt eingeben..."
                        className="w-full p-3 rounded-2xl border border-slate-200 text-base font-medium focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={session.isLocked || !placematNote.trim()}
                      className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all active:scale-95"
                    >
                      In mein Feld eintragen
                    </button>

                    {/* Central consensus display if already formulated */}
                    {session.placemat?.groups?.[placematGroupIndex]?.consensus && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 text-rose-950 space-y-1 animate-in fade-in">
                        <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">
                          🤝 Vereinbarter Gruppenkonsens:
                        </span>
                        <p className="text-xs font-bold leading-relaxed">
                          {session.placemat.groups[placematGroupIndex].consensus}
                        </p>
                      </div>
                    )}

                    {myPlacematNotes.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          Deine Notizen auf dem Tischset:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-1">
                          {myPlacematNotes.map((n, idx) => (
                            <li key={idx}>• {n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </form>
                ) : (
                  /* Gruppenkonsens Share Mode */
                  <div className="space-y-4">
                    {/* View all 4 corners of current table */}
                    {(() => {
                      const curGroup = session.placemat?.groups?.[placematGroupIndex];
                      if (!curGroup) return null;
                      return (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Notizen aller 4 Ecken an {curGroup.groupName || `Tisch ${placematGroupIndex + 1}`}:
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-left">
                            {[
                              { key: 'cornerA' as const, label: 'A (Norden)', corner: curGroup.cornerA, bg: 'bg-blue-50 border-blue-200 text-blue-950', badge: 'text-blue-700' },
                              { key: 'cornerB' as const, label: 'B (Osten)', corner: curGroup.cornerB, bg: 'bg-purple-50 border-purple-200 text-purple-950', badge: 'text-purple-700' },
                              { key: 'cornerD' as const, label: 'D (Westen)', corner: curGroup.cornerD, bg: 'bg-amber-50 border-amber-200 text-amber-950', badge: 'text-amber-700' },
                              { key: 'cornerC' as const, label: 'C (Süden)', corner: curGroup.cornerC, bg: 'bg-emerald-50 border-emerald-200 text-emerald-950', badge: 'text-emerald-700' },
                            ].map((c) => (
                              <div key={c.key} className={`p-2.5 rounded-xl border ${c.bg}`}>
                                <span className={`text-[10px] font-black uppercase block mb-1 ${c.badge}`}>
                                  {c.label} {c.corner?.author ? `[${c.corner.author}]` : ''}
                                </span>
                                {c.corner?.notes && c.corner.notes.length > 0 ? (
                                  <ul className="space-y-0.5 text-xs">
                                    {c.corner.notes.map((note, nIdx) => (
                                      <li key={nIdx} className="leading-snug">• {note}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Noch keine Notizen</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Consensus Input & Submit */}
                    <form onSubmit={handleSubmitPlacematConsensus} className="space-y-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[11px] font-black text-rose-700 block mb-1">
                          🤝 Formuliert hier euren gemeinsamen Gruppenkonsens:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={placematConsensusText}
                          onChange={(e) => setPlacematConsensusText(e.target.value)}
                          placeholder="Fasst hier die gemeinsamen Ergebnisse eures Tisches zusammen..."
                          className="w-full p-3 rounded-2xl border-2 border-rose-300 text-base font-medium focus:outline-none focus:border-rose-600 bg-rose-50/30"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={session.isLocked || !placematConsensusText.trim()}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Konsens an die Tafel senden</span>
                      </button>

                      {hasSubmittedConsensus && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-in fade-in">
                          ✓ Gruppenkonsens erfolgreich übertragen!
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[10px] text-slate-400 border-t border-slate-200 bg-white">
        Staatliche Regelschule Heimbürgeschule Kahla • 100 % DSGVO-konform ohne Login
      </footer>

    </div>
  );
};
