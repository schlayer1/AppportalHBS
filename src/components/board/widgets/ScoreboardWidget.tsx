import React, { useState } from 'react';
import { Trophy, Minus, RotateCcw } from 'lucide-react';

interface TeamScore {
  id: number;
  name: string;
  points: number;
  color: string;
}

const DEFAULT_TEAMS: TeamScore[] = [
  { id: 1, name: 'Team Rot', points: 0, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 2, name: 'Team Blau', points: 0, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 3, name: 'Team Grün', points: 0, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 4, name: 'Team Gelb', points: 0, color: 'text-amber-600 bg-amber-50 border-amber-200' }
];

export const ScoreboardWidget: React.FC = () => {
  const [teams, setTeams] = useState<TeamScore[]>(DEFAULT_TEAMS);
  const [activeTeamCount, setActiveTeamCount] = useState<number>(2);

  const changePoints = (id: number, delta: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, points: Math.max(0, t.points + delta) } : t))
    );
  };

  const resetAll = () => {
    setTeams((prev) => prev.map((t) => ({ ...t, points: 0 })));
  };

  const handleNameChange = (id: number, newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t))
    );
  };

  const displayedTeams = teams.slice(0, activeTeamCount);

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Punktestand</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Team count picker */}
          <div className="flex items-center gap-0.5 bg-white/60 p-0.5 rounded-xl border border-white/80">
            {[2, 3, 4].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setActiveTeamCount(cnt)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  activeTeamCount === cnt ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>

          <button
            onClick={resetAll}
            className="p-1 rounded-lg bg-white/70 hover:bg-white text-hbs-slate-muted hover:text-red-500 border border-white/80"
            title="Punkte auf 0 zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className={`grid gap-2 my-auto ${activeTeamCount === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-2'}`}>
        {displayedTeams.map((team) => (
          <div
            key={team.id}
            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between bg-white/80 shadow-2xs ${team.color}`}
          >
            <input
              type="text"
              value={team.name}
              onChange={(e) => handleNameChange(team.id, e.target.value)}
              className="text-center font-black text-xs bg-transparent border-b border-transparent hover:border-black/20 focus:border-hbs-blue focus:outline-none w-full truncate"
            />

            <span className="text-3xl sm:text-4xl font-black font-mono my-2 text-hbs-slate-dark">
              {team.points}
            </span>

            <div className="flex items-center gap-1.5 w-full justify-center">
              <button
                onClick={() => changePoints(team.id, -1)}
                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-100 text-hbs-slate-dark flex items-center justify-center font-black text-sm border border-black/10 shadow-2xs transition-transform active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => changePoints(team.id, 1)}
                className="w-9 h-7 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white flex items-center justify-center font-black text-xs shadow-2xs transition-transform active:scale-90"
              >
                +1
              </button>
              <button
                onClick={() => changePoints(team.id, 5)}
                className="w-8 h-7 rounded-xl bg-white hover:bg-slate-100 text-hbs-blue flex items-center justify-center font-black text-[11px] border border-black/10 shadow-2xs transition-transform active:scale-90"
              >
                +5
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
