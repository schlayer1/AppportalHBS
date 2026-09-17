import React, { useState, useEffect } from 'react';
import { RotateCcw, QrCode, Smartphone, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface PollOption {
  id: string;
  label: string;
  votes: number;
  color: string;
}

export const PollWidget: React.FC = () => {
  const [pollType, setPollType] = useState<'choice' | 'smiley' | 'stars'>('choice');
  const [showQrDrawer, setShowQrDrawer] = useState<boolean>(false);
  const [pollQuestion, setPollQuestion] = useState<string>('Welche Antwort ist richtig?');

  const [votesState, setVotesState] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  });

  // URL for mobile voting
  const voteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?poll=active`
    : 'https://appportalhbs.vercel.app/?poll=active';

  // Synchronize with Firestore
  useEffect(() => {
    if (!db) return;
    try {
      const pollDocRef = doc(db, 'schools', 'HBS_portal');

      // Publish initial state to Firestore if not present
      updateDoc(pollDocRef, {
        livePoll: {
          title: pollQuestion,
          type: pollType,
          active: true,
          updatedAt: Date.now()
        }
      }).catch(() => {});

      // Realtime listener for incoming student votes
      const unsubscribe = onSnapshot(pollDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.livePoll?.votes) {
            setVotesState((prev) => ({ ...prev, ...d.livePoll.votes }));
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Poll Firebase sync error:', e);
    }
  }, [pollType, pollQuestion]);

  // Options definitions
  const choiceOptions: PollOption[] = [
    { id: 'A', label: 'Antwort A', votes: votesState['A'] || 0, color: 'bg-blue-500' },
    { id: 'B', label: 'Antwort B', votes: votesState['B'] || 0, color: 'bg-emerald-500' },
    { id: 'C', label: 'Antwort C', votes: votesState['C'] || 0, color: 'bg-amber-500' },
    { id: 'D', label: 'Antwort D', votes: votesState['D'] || 0, color: 'bg-purple-500' }
  ];

  const smileyOptions: PollOption[] = [
    { id: '1', label: '😊 Gut verstanden', votes: votesState['1'] || 0, color: 'bg-emerald-500' },
    { id: '2', label: '😐 Teils / Teils', votes: votesState['2'] || 0, color: 'bg-amber-500' },
    { id: '3', label: '😕 Noch unklar', votes: votesState['3'] || 0, color: 'bg-red-500' }
  ];

  const starOptions: PollOption[] = [
    { id: '5', label: '★★★★★ (Exzellent)', votes: votesState['5'] || 0, color: 'bg-emerald-500' },
    { id: '4', label: '★★★★☆ (Gut)', votes: votesState['4'] || 0, color: 'bg-blue-500' },
    { id: '3', label: '★★★☆☆ (Befriedigend)', votes: votesState['3'] || 0, color: 'bg-amber-500' },
    { id: '2', label: '★★☆☆☆ (Schwierig)', votes: votesState['2'] || 0, color: 'bg-orange-500' },
    { id: '1', label: '★☆☆☆☆ (Nicht verstanden)', votes: votesState['1'] || 0, color: 'bg-red-500' }
  ];

  const currentOptions = pollType === 'choice' ? choiceOptions : pollType === 'smiley' ? smileyOptions : starOptions;
  const totalVotes = currentOptions.reduce((sum, opt) => sum + opt.votes, 0);

  const handleManualVote = async (id: string) => {
    setVotesState((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    if (db) {
      try {
        const pollDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(pollDocRef, {
          [`livePoll.votes.${id}`]: (votesState[id] || 0) + 1
        });
      } catch {}
    }
  };

  const handleReset = async () => {
    const resetObj: Record<string, number> = {};
    currentOptions.forEach(opt => { resetObj[opt.id] = 0; });
    setVotesState(prev => ({ ...prev, ...resetObj }));

    if (db) {
      try {
        const pollDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(pollDocRef, {
          'livePoll.votes': resetObj,
          'livePoll.updatedAt': Date.now()
        });
      } catch {}
    }
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between min-h-0 relative font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-white/40 shrink-0 gap-1">
        <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80">
          <button
            type="button"
            onClick={() => setPollType('choice')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              pollType === 'choice' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted hover:bg-white'
            }`}
          >
            A/B/C/D
          </button>
          <button
            type="button"
            onClick={() => setPollType('smiley')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              pollType === 'smiley' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted hover:bg-white'
            }`}
          >
            Stimmung 😊
          </button>
          <button
            type="button"
            onClick={() => setPollType('stars')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              pollType === 'stars' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted hover:bg-white'
            }`}
          >
            Sterne ⭐
          </button>
        </div>

        {/* Right QR & Reset Controls */}
        <div className="flex items-center gap-1">
          {/* QR Code Toggle Button */}
          <button
            type="button"
            onClick={() => setShowQrDrawer(!showQrDrawer)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
              showQrDrawer
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white/80 hover:bg-white text-hbs-slate-dark border-white'
            }`}
            title="Schüler-QR-Code zum Abstimmen einblenden"
          >
            <QrCode className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Schüler-QR</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-muted hover:text-red-500 border border-white/80 shadow-2xs active:scale-95"
            title="Abstimmung zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QR Drawer Overlay */}
      {showQrDrawer && (
        <div className="absolute top-11 inset-x-1 bottom-1 z-30 p-3 bg-white/95 rounded-2xl border border-white shadow-2xl backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in">
          <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
            <QRCodeSVG value={voteUrl} size={150} level="M" />
          </div>
          <div className="text-center max-w-xs space-y-1">
            <span className="text-xs font-black text-slate-900 flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-hbs-blue" />
              <span>Mit dem Handy/iPad scannen</span>
            </span>
            <p className="text-[10px] text-slate-500 leading-tight">
              Schüler scannen den QR-Code, stimmen anonym ab und die Balken wachsen live an der Tafel mit!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQrDrawer(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Zurück zu den Ergebnissen ✕
          </button>
        </div>
      )}

      {/* Question header */}
      <div className="px-1 mb-2">
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
          placeholder="Frage eingeben..."
          className="w-full text-xs font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-hbs-blue focus:outline-none py-0.5"
        />
      </div>

      {/* Voting & Results List */}
      <div className="space-y-1.5 my-auto overflow-y-auto pr-0.5 min-h-0 flex-1">
        {currentOptions.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleManualVote(opt.id)}
              className="w-full text-left p-2 rounded-xl bg-white/80 hover:bg-white border border-white shadow-2xs transition-all active:scale-[0.99] group"
              title="Klicken zum manuellen Hochzählen"
            >
              <div className="flex items-center justify-between mb-1 text-xs font-black">
                <span className="truncate group-hover:text-hbs-blue">{opt.label}</span>
                <span className="font-mono text-hbs-slate-muted ml-2 shrink-0">
                  {opt.votes} ({percentage}%)
                </span>
              </div>

              {/* Live progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${opt.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Total Votes */}
      <div className="flex items-center justify-between pt-1.5 px-1 border-t border-white/40 shrink-0 text-[11px] font-bold text-hbs-slate-muted">
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live-Sync aktiv
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Users className="w-3.5 h-3.5 text-hbs-blue" />
          {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}
        </span>
      </div>
    </div>
  );
};
