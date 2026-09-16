import React, { useState } from 'react';
import { Users, Shuffle, Edit2, Check } from 'lucide-react';

const DEFAULT_NAMES = [
  'Anna', 'Ben', 'Clara', 'David', 'Elias', 
  'Felix', 'Greta', 'Hanna', 'Jonas', 'Lara', 
  'Max', 'Noah', 'Paul', 'Sophie', 'Tim', 'Mia'
];

export const GroupMakerWidget: React.FC = () => {
  const [namesInput, setNamesInput] = useState(() => {
    return localStorage.getItem('hbs_board_picker_names') || DEFAULT_NAMES.join(', ');
  });

  const [mode, setMode] = useState<'byGroupCount' | 'byGroupSize'>('byGroupCount');
  const [groupTarget, setGroupTarget] = useState(4); // 4 groups or 4 students
  const [groups, setGroups] = useState<string[][]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerateGroups = () => {
    const list = namesInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (list.length === 0) return;

    // Shuffle array (Fisher-Yates)
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let numGroups = 1;
    if (mode === 'byGroupCount') {
      numGroups = Math.max(1, Math.min(groupTarget, shuffled.length));
    } else {
      const size = Math.max(1, groupTarget);
      numGroups = Math.max(1, Math.ceil(shuffled.length / size));
    }

    const result: string[][] = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((student, index) => {
      result[index % numGroups].push(student);
    });

    setGroups(result);
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <Users className="w-4 h-4 text-hbs-blue" />
          <span>Gruppen-Generator</span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 rounded-lg bg-white/70 hover:bg-white text-hbs-blue border border-white/80"
          title={isEditing ? 'Speichern' : 'Namen bearbeiten'}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isEditing ? (
        <div className="my-2 flex-1 flex flex-col">
          <label className="text-[10px] font-bold text-hbs-slate-muted mb-1">Schülerliste:</label>
          <textarea
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            className="w-full flex-1 p-2 text-xs rounded-xl bg-white/90 border border-white font-mono focus:outline-none"
            rows={5}
          />
          <button
            onClick={() => {
              setIsEditing(false);
              localStorage.setItem('hbs_board_picker_names', namesInput);
            }}
            className="mt-2 py-1.5 rounded-xl bg-hbs-blue text-white text-xs font-bold"
          >
            Namen speichern
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="my-2 flex items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-white/80">
              <button
                onClick={() => setMode('byGroupCount')}
                className={`px-2 py-1 rounded-lg text-[10px] ${
                  mode === 'byGroupCount' ? 'bg-hbs-blue text-white shadow-2xs font-black' : 'text-hbs-slate-muted'
                }`}
              >
                Anzahl Gruppen
              </button>
              <button
                onClick={() => setMode('byGroupSize')}
                className={`px-2 py-1 rounded-lg text-[10px] ${
                  mode === 'byGroupSize' ? 'bg-hbs-blue text-white shadow-2xs font-black' : 'text-hbs-slate-muted'
                }`}
              >
                Schüler / Gruppe
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setGroupTarget(Math.max(2, groupTarget - 1))}
                className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center font-black border border-white/80"
              >
                -
              </button>
              <span className="w-7 text-center font-black text-sm">{groupTarget}</span>
              <button
                onClick={() => setGroupTarget(groupTarget + 1)}
                className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center font-black border border-white/80"
              >
                +
              </button>
            </div>
          </div>

          {/* Groups Display Grid */}
          <div className="flex-1 max-h-48 overflow-y-auto my-1">
            {groups.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {groups.map((team, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white/70 border border-white/90 shadow-2xs">
                    <span className="text-[11px] font-black text-hbs-blue block mb-1">
                      Team {idx + 1} ({team.length})
                    </span>
                    <ul className="text-xs space-y-0.5 text-hbs-slate-dark font-medium">
                      {team.map((student, sIdx) => (
                        <li key={sIdx} className="truncate">• {student}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-center text-xs text-hbs-slate-muted">
                Klicke auf "Gruppen mischen"
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Button */}
      <button
        onClick={handleGenerateGroups}
        className="w-full min-h-[42px] mt-2 rounded-2xl bg-hbs-teal hover:bg-hbs-teal-deep text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hbs-teal/20"
      >
        <Shuffle className="w-4 h-4" />
        <span>Gruppen neu mischen</span>
      </button>
    </div>
  );
};
