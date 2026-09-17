import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface StudentPollVoterProps {
  onClose?: () => void;
}

export const StudentPollVoter: React.FC<StudentPollVoterProps> = () => {
  const [pollData, setPollData] = useState<{
    title: string;
    type: 'smiley' | 'choice' | 'stars';
    active: boolean;
  }>({
    title: 'Live-Klassenabstimmung',
    type: 'choice',
    active: true
  });

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Listen to active poll metadata from Firestore
  useEffect(() => {
    if (!db) return;
    try {
      const pollDocRef = doc(db, 'schools', 'HBS_portal');
      const unsubscribe = onSnapshot(pollDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.livePoll) {
            setPollData({
              title: d.livePoll.title || 'Live-Klassenabstimmung',
              type: d.livePoll.type || 'choice',
              active: d.livePoll.active !== false
            });
          }
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore poll listener:', err);
    }
  }, []);

  const handleVote = async (optionId: string) => {
    setIsSubmitting(true);
    setSelectedOption(optionId);
    setHasVoted(true);

    if (db) {
      try {
        const pollDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(pollDocRef, {
          [`livePoll.votes.${optionId}`]: increment(1),
          'livePoll.lastVoteAt': Date.now()
        });
      } catch (err) {
        console.warn('Error saving vote to Firebase:', err);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8FA] via-white to-[#EDF4FF] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white shadow-md border border-slate-200 p-1 flex items-center justify-center">
          <img src="/Siegel_bunt.png" alt="Heimbürgeschule" className="w-full h-full object-contain" />
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-hbs-blue">
          Heimbürgeschule Kahla
        </span>
        <h1 className="text-xl font-black text-slate-900 mt-1">
          {pollData.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live-Abstimmung für das Smartboard
        </p>
      </div>

      {/* Main Voting Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {!hasVoted ? (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
              Wähle deine Antwort:
            </span>

            {pollData.type === 'choice' && (
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'A', label: 'Antwort A', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
                  { id: 'B', label: 'Antwort B', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  { id: 'C', label: 'Antwort C', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
                  { id: 'D', label: 'Antwort D', color: 'bg-purple-600 hover:bg-purple-700 text-white' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    disabled={isSubmitting}
                    className={`w-full py-4 px-5 rounded-2xl font-black text-base shadow-md transition-all active:scale-95 flex items-center justify-between ${opt.color}`}
                  >
                    <span>{opt.label}</span>
                    <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-mono">
                      {opt.id}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {pollData.type === 'smiley' && (
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: '1', emoji: '😊', label: 'Gut verstanden!', color: 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300' },
                  { id: '2', emoji: '😐', label: 'Teils / Geht so', color: 'bg-amber-50 text-amber-900 border-2 border-amber-300' },
                  { id: '3', emoji: '😕', label: 'Noch unklar', color: 'bg-red-50 text-red-900 border-2 border-red-300' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    disabled={isSubmitting}
                    className={`w-full py-4 px-5 rounded-2xl font-black text-base shadow-sm transition-all active:scale-95 flex items-center gap-4 ${opt.color}`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {pollData.type === 'stars' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <span className="text-sm font-bold text-slate-600">Bewerte mit Sternen (1 = wenig, 5 = top):</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleVote(String(star))}
                      disabled={isSubmitting}
                      className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-500 font-black text-lg flex items-center justify-center shadow-sm active:scale-90 hover:bg-amber-400 hover:text-white transition-all"
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Confirmation card */
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Stimme abgegeben!
              </h2>
              {selectedOption && (
                <div className="inline-block mt-2 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  Auswahl: {selectedOption}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Deine Antwort wurde live an die digitale Tafel im Klassenzimmer übertragen.
              </p>
            </div>
            <button
              onClick={() => setHasVoted(false)}
              className="text-xs font-bold text-hbs-blue underline pt-2"
            >
              Antwort ändern
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-2 text-[10px] text-slate-400 font-bold">
        DSGVO-konform • Anonym • Heimbürgeschule Kahla
      </div>
    </div>
  );
};
