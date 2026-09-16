import React, { useState } from 'react';
import { Dices } from 'lucide-react';

const playDiceClick = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + Math.random() * 200, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
};

export const DiceWidget: React.FC = () => {
  const [numDice, setNumDice] = useState<number>(1);
  const [diceValues, setDiceValues] = useState<number[]>([4]);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const rollDice = () => {
    setIsRolling(true);
    let count = 0;
    const maxSteps = 12;

    const interval = setInterval(() => {
      const tempVals = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(tempVals);
      playDiceClick();
      count++;

      if (count >= maxSteps) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const handleSetDiceCount = (count: number) => {
    setNumDice(count);
    setDiceValues(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
  };

  const sum = diceValues.reduce((a, b) => a + b, 0);

  // Render dice pips (dots)
  const renderDiceFace = (val: number) => {
    // 3x3 grid positions for 1 to 6
    const pipPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    const activePips = pipPositions[val] || [4];

    return (
      <div
        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-slate-200 shadow-lg p-2.5 grid grid-cols-3 grid-rows-3 gap-1 transition-transform duration-100 ${
          isRolling ? 'rotate-12 scale-95 shadow-md' : 'scale-100 shadow-xl'
        }`}
      >
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activePips.includes(i) && (
              <div className="w-3 h-3 rounded-full bg-hbs-slate-dark shadow-inner" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none h-full">
      {/* Dice Selector Bar */}
      <div className="flex items-center gap-1.5 mb-2 bg-white/60 p-1 rounded-xl border border-white/80">
        {[1, 2, 3].map((count) => (
          <button
            key={count}
            onClick={() => handleSetDiceCount(count)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              numDice === count
                ? 'bg-hbs-blue text-white shadow-2xs'
                : 'text-hbs-slate-dark hover:bg-white/60'
            }`}
          >
            {count} {count === 1 ? 'Würfel' : 'Würfel'}
          </button>
        ))}
      </div>

      {/* Dice Faces Display */}
      <div className="my-auto py-2 flex items-center justify-center gap-3">
        {diceValues.map((val, idx) => (
          <div key={idx}>
            {renderDiceFace(val)}
          </div>
        ))}
      </div>

      {/* Sum Badge (if more than 1 die) */}
      {numDice > 1 && (
        <div className="mb-2 text-center">
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/80 border border-white/90 text-xs font-black text-hbs-blue shadow-2xs">
            Augensumme: {sum}
          </span>
        </div>
      )}

      {/* Roll Action Button */}
      <button
        onClick={rollDice}
        disabled={isRolling}
        className="w-full min-h-[44px] rounded-2xl bg-hbs-blue hover:bg-hbs-blue-deep disabled:opacity-40 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hbs-blue/25"
      >
        <Dices className="w-5 h-5" />
        <span>{isRolling ? 'Würfelt...' : 'Jetzt würfeln'}</span>
      </button>
    </div>
  );
};
