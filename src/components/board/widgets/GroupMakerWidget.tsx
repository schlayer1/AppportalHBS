import React, { useState } from 'react';
import { Users, Shuffle, Edit2, Check, QrCode } from 'lucide-react';
import { SAL1KE_GROUP_COLORS, createShuffledGroupBag, QrGroupSession } from '../../../types/gruppenTypes';
import { syncGruppenLiveSession } from '../../../services/firebase';

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

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 mt-2">
        <button
          onClick={handleGenerateGroups}
          className="w-full min-h-[42px] rounded-2xl bg-hbs-teal hover:bg-hbs-teal-deep text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hbs-teal/20 cursor-pointer"
        >
          <Shuffle className="w-4 h-4" />
          <span>Gruppen neu mischen</span>
        </button>

        {groups.length >= 2 && (
          <button
            onClick={async () => {
              const count = Math.max(2, Math.min(12, groups.length));
              const totalStudents = groups.reduce((acc, g) => acc + g.length, 0);
              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
              let suffix = '';
              for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
              const code = `HBS${suffix}`;
              const now = Date.now();
              const session: QrGroupSession = {
                id: `grp-${now}`,
                code,
                pinCode: code,
                title: 'Sucht euch einen Platz und baut eure Station auf',
                groupCount: count,
                groupNames: Array.from({ length: count }, (_, i) => `Gruppe ${i + 1}`),
                groupColors: SAL1KE_GROUP_COLORS.slice(0, count),
                maxSeats: Math.max(totalStudents + 4, 29),
                assignedCount: 0,
                groupCounts: Array(count).fill(0),
                remainingBag: createShuffledGroupBag(count),
                deviceAssignments: {},
                preassignedGroups: groups.slice(0, count).map((members, idx) => ({
                  groupIndex: idx,
                  groupName: `Gruppe ${idx + 1}`,
                  members
                })),
                isOpen: true,
                authorId: 'board',
                authorName: 'Digitale Tafel',
                createdAt: now,
                updatedAt: now,
                expiresAt: now + 7 * 86400000
              };
              await syncGruppenLiveSession(session);
              window.location.hash = '#gruppen';
            }}
            className="w-full min-h-[38px] rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Überträgt diese Teams direkt in das Vollbild-Tool 'Gruppen per QR-Code'"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Als QR-Gruppenlos starten</span>
          </button>
        )}
      </div>
    </div>
  );
};
