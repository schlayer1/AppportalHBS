import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface PollOption {
  id: string;
  label: string;
  votes: number;
  color: string;
}

export const PollWidget: React.FC = () => {
  const [pollType, setPollType] = useState<'smiley' | 'choice'>('smiley');
  
  const [smileyOptions, setSmileyOptions] = useState<PollOption[]>([
    { id: '1', label: '😊 Gut verstanden', votes: 0, color: 'bg-emerald-500' },
    { id: '2', label: '😐 Teils / Teils', votes: 0, color: 'bg-amber-500' },
    { id: '3', label: '😕 Noch unklar', votes: 0, color: 'bg-red-500' }
  ]);

  const [choiceOptions, setChoiceOptions] = useState<PollOption[]>([
    { id: 'A', label: 'Antwort A', votes: 0, color: 'bg-blue-500' },
    { id: 'B', label: 'Antwort B', votes: 0, color: 'bg-emerald-500' },
    { id: 'C', label: 'Antwort C', votes: 0, color: 'bg-amber-500' },
    { id: 'D', label: 'Antwort D', votes: 0, color: 'bg-purple-500' }
  ]);

  const currentOptions = pollType === 'smiley' ? smileyOptions : choiceOptions;
  const setOptions = pollType === 'smiley' ? setSmileyOptions : setChoiceOptions;

  const totalVotes = currentOptions.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const handleReset = () => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, votes: 0 })));
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1 bg-white/60 p-0.5 rounded-xl border border-white/80">
          <button
            onClick={() => setPollType('smiley')}
            className={`px-2 py-1 rounded-lg text-xs font-bold ${
              pollType === 'smiley' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
            }`}
          >
            Stimmung 😊
          </button>
          <button
            onClick={() => setPollType('choice')}
            className={`px-2 py-1 rounded-lg text-xs font-bold ${
              pollType === 'choice' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
            }`}
          >
            Quiz A/B/C/D
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-hbs-slate-muted px-1">
            {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}
          </span>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg bg-white/70 hover:bg-white text-hbs-slate-muted hover:text-red-500 border border-white/80"
            title="Abstimmung zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voting & Results List */}
      <div className="space-y-2 my-auto">
        {currentOptions.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left p-2.5 rounded-2xl bg-white/80 hover:bg-white border border-white shadow-2xs transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-1 text-xs font-black">
                <span className="truncate group-hover:text-hbs-blue">{opt.label}</span>
                <span className="font-mono text-hbs-slate-muted ml-2 shrink-0">
                  {opt.votes} ({percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${opt.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 border-t border-white/30 text-[10px] font-bold text-hbs-slate-muted">
        Tippe auf eine Option, um eine Stimme hinzuzufügen
      </div>
    </div>
  );
};
