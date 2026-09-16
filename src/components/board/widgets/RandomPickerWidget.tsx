import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Edit2, Check, UserCheck } from 'lucide-react';

const DEFAULT_NAMES = [
  'Anna', 'Ben', 'Clara', 'David', 'Elias', 
  'Felix', 'Greta', 'Hanna', 'Jonas', 'Lara', 
  'Max', 'Noah', 'Paul', 'Sophie', 'Tim'
];

export const RandomPickerWidget: React.FC = () => {
  const [namesInput, setNamesInput] = useState(() => {
    return localStorage.getItem('hbs_board_picker_names') || DEFAULT_NAMES.join(', ');
  });

  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [removeAfterPick, setRemoveAfterPick] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize available names from namesInput
  useEffect(() => {
    const list = namesInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    setAvailableNames(list);
  }, [namesInput]);

  const handlePick = () => {
    if (availableNames.length === 0) return;

    setIsRolling(true);
    let count = 0;
    const maxSteps = 18;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      const tempName = availableNames[randomIndex];
      setPickedName(tempName);
      count++;

      if (count >= maxSteps) {
        clearInterval(interval);
        setIsRolling(false);
        const finalName = availableNames[randomIndex];
        setPickedName(finalName);

        if (removeAfterPick) {
          setAvailableNames((prev) => prev.filter((_, i) => i !== randomIndex));
        }
      }
    }, 70);
  };

  const handleResetPool = () => {
    const list = namesInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    setAvailableNames(list);
    setPickedName(null);
  };

  const saveNames = () => {
    setIsEditing(false);
    localStorage.setItem('hbs_board_picker_names', namesInput);
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <UserCheck className="w-4 h-4 text-hbs-blue" />
          <span>Pool: {availableNames.length} Schüler</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetPool}
            className="p-1 rounded-lg bg-white/70 hover:bg-white text-hbs-slate-muted hover:text-hbs-slate-dark border border-white/80"
            title="Pool zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (isEditing) saveNames();
              else setIsEditing(true);
            }}
            className="p-1 rounded-lg bg-white/70 hover:bg-white text-hbs-blue border border-white/80"
            title={isEditing ? 'Speichern' : 'Namen bearbeiten'}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="my-2 flex-1 flex flex-col">
          <label className="text-[10px] font-bold text-hbs-slate-muted mb-1">Namen (mit Komma oder Zeilenumbruch trennen):</label>
          <textarea
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            className="w-full flex-1 p-2 text-xs rounded-xl bg-white/90 border border-white font-mono focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
            rows={5}
          />
          <button
            onClick={saveNames}
            className="mt-2 py-1.5 rounded-xl bg-hbs-blue text-white text-xs font-bold"
          >
            Liste übernehmen
          </button>
        </div>
      ) : (
        /* Winner / Slot Display */
        <div className="my-auto py-3 flex flex-col items-center justify-center">
          <div className="w-full min-h-[90px] rounded-2xl bg-white/80 border-2 border-white shadow-sm flex flex-col items-center justify-center p-3 text-center">
            {isRolling ? (
              <span className="text-3xl font-black text-hbs-blue font-mono tracking-wider animate-pulse">
                {pickedName}
              </span>
            ) : pickedName ? (
              <div className="animate-scaleIn flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-black text-hbs-slate-dark tracking-tight drop-shadow-xs">
                  {pickedName} 🎉
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-hbs-teal-deep mt-1">
                  Ausgewählt!
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-hbs-slate-muted">
                Klicke auf "Ziehen", um zu starten
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="space-y-2 pt-2 border-t border-white/30">
        <button
          onClick={handlePick}
          disabled={isRolling || availableNames.length === 0}
          className="w-full min-h-[44px] rounded-2xl bg-hbs-blue hover:bg-hbs-blue-deep disabled:opacity-40 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hbs-blue/25"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isRolling ? 'Zufall läuft...' : 'Namen ziehen'}</span>
        </button>

        <div className="flex items-center justify-between text-[11px] font-bold text-hbs-slate-dark/80 px-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={removeAfterPick}
              onChange={(e) => setRemoveAfterPick(e.target.checked)}
              className="rounded text-hbs-blue accent-hbs-blue"
            />
            <span>Nicht doppelt ziehen</span>
          </label>

          {availableNames.length === 0 && (
            <span className="text-amber-600 font-black">Alle waren dran!</span>
          )}
        </div>
      </div>
    </div>
  );
};
