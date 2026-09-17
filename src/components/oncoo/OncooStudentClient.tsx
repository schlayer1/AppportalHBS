import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Check,
  Zap, 
  Users, 
  Clock, 
  ArrowRight,
  X
} from 'lucide-react';
import { 
  OncooSession, 
  OncooCardColor, 
  OncooCard, 
  OncooTargetVote, 
  OncooHelpItem 
} from '../../types/oncooTypes';
import { getCachedPortalData } from '../../services/firebase';

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
    if (initialCode) return initialCode;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('oncoo');
      if (p && p.length >= 6) return p;
      const hash = window.location.hash.replace('#oncoo=', '').replace('#oncoo', '');
      if (hash && hash.length >= 6) return hash;
    }
    return '';
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [session, setSession] = useState<OncooSession | null>(null);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
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
  const [placematCorner, setPlacematCorner] = useState<'cornerA' | 'cornerB' | 'cornerC' | 'cornerD'>('cornerA');
  const [placematNote, setPlacematNote] = useState<string>('');
  const [myPlacematNotes, setMyPlacematNotes] = useState<string[]>([]);

  // Broadcast Channel for live sync
  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  // Auto-join if PIN is present
  useEffect(() => {
    if (pinCode && pinCode.length >= 6) {
      attemptJoinSession(pinCode);
    }
  }, [pinCode]);

  const attemptJoinSession = (pin: string) => {
    const cloud = getCachedPortalData();
    const found = (cloud.oncooSessions || []).find(s => s.pinCode === pin) || cloud.activeOncooSession;

    if (found) {
      setSession(found);
      setHasJoined(true);
      setPinCode(pin);

      // Initialize default scores for Zielscheibe
      if (found.toolType === 'zielscheibe' && found.zielscheibe) {
        const defaults: Record<string, number> = {};
        found.zielscheibe.criteria.forEach(c => {
          defaults[c.id] = 4; // default good rating
        });
        setTargetScores(defaults);
      }

      // Initialize broadcast channel
      try {
        const channel = new BroadcastChannel(`hbs_oncoo_${pin}`);
        broadcastRef.current = channel;

        // Check if student is already in a pair for Lerntempoduett
        channel.onmessage = (event) => {
          if (event.data?.type === 'PAIR_FORMED' && studentName) {
            const pair = event.data.payload;
            if (pair.student1 === studentName) {
              setMyTandemPartner({ name: pair.student2, table: pair.tableNumber });
            } else if (pair.student2 === studentName) {
              setMyTandemPartner({ name: pair.student1, table: pair.tableNumber });
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    } else {
      // Create lightweight fallback session for student
      const fallback: OncooSession = {
        id: `oncoo-session-${pin}`,
        toolType: 'kartenabfrage',
        title: 'Unterrichts-Sitzung',
        authorId: 'system',
        authorName: 'Lehrkraft',
        isShared: true,
        pinCode: pin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        kartenabfrage: {
          question: 'Welche Gedanken oder Fragen hast du zu diesem Thema?',
          columns: [],
          cards: [],
          allowMultipleCards: true,
          maxCardsPerStudent: 5,
          showAuthor: true,
          allowLikes: true
        }
      };
      setSession(fallback);
      setHasJoined(true);
      setPinCode(pin);
    }
  };

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

    // Broadcast to teacher presenter
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: { card: newCard }
      });
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

    setHasSubmittedHelp(true);
  };

  // Submit Placemat Note
  const handleSubmitPlacematNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placematNote.trim() || !session) return;

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STUDENT_SUBMISSION',
        payload: {
          placematUpdate: {
            groupIndex: 0,
            cornerKey: placematCorner,
            note: placematNote.trim()
          }
        }
      });
    }

    setMyPlacematNotes(prev => [...prev, placematNote.trim()]);
    setPlacematNote('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      
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
        
        {/* ================= STEP 1: PIN ENTRY ================= */}
        {!hasJoined && (
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
                  attemptJoinSession(enteredPin.trim());
                }
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
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

        {/* ================= STEP 2: ACTIVE SESSION TOOL UI ================= */}
        {hasJoined && session && (
          <div className="space-y-4 animate-in fade-in">
            
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
                placeholder="Name eingeben..."
                className="text-xs font-bold text-slate-900 border-b border-slate-300 focus:border-rose-500 focus:outline-none px-2 py-0.5 text-right w-36"
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
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
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
            {session.toolType === 'zielscheibe' && (
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
                      Bewerte jedes Kriterium von 1 (trifft gar nicht zu) bis 5 (trifft voll zu):
                    </p>

                    <div className="space-y-3">
                      {session.zielscheibe?.criteria.map((crit) => {
                        const val = targetScores[crit.id] || 4;
                        return (
                          <div key={crit.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">{crit.label}</span>
                              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                {val} von 5
                              </span>
                            </div>

                            {/* 1 to 5 Pill Buttons */}
                            <div className="flex items-center justify-between gap-1">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setTargetScores(prev => ({ ...prev, [crit.id]: num }))}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    val === num
                                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
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
            )}

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
                    Placemat
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {session.placemat?.topic}
                  </h3>
                </div>

                <form onSubmit={handleSubmitPlacematNote} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Dein Quadrant (Ecke)
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
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
                  >
                    In mein Feld eintragen
                  </button>
                </form>

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
