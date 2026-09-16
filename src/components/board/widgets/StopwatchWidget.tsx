import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';

interface LapItem {
  lapNumber: number;
  timeMs: number;
  splitMs: number;
}

export const StopwatchWidget: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapItem[]>([]);
  
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    if (isRunning) {
      startTimeRef.current = performance.now();
      const update = () => {
        const now = performance.now();
        const diff = now - startTimeRef.current;
        setElapsedMs(accumulatedMsRef.current + diff);
        animationFrameId = requestAnimationFrame(update);
      };
      animationFrameId = requestAnimationFrame(update);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning]);

  const toggleRunning = () => {
    if (isRunning) {
      // Pause
      accumulatedMsRef.current = elapsedMs;
      setIsRunning(false);
    } else {
      // Start
      startTimeRef.current = performance.now();
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    accumulatedMsRef.current = 0;
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning && elapsedMs === 0) return;
    const lastLapTime = laps.length > 0 ? laps[0].timeMs : 0;
    const splitMs = elapsedMs - lastLapTime;
    const newLap: LapItem = {
      lapNumber: laps.length + 1,
      timeMs: elapsedMs,
      splitMs
    };
    setLaps([newLap, ...laps]);
  };

  const formatTime = (msTotal: number) => {
    const totalSec = Math.floor(msTotal / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ms = Math.floor((msTotal % 1000) / 10);
    return {
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
      ms: ms.toString().padStart(2, '0')
    };
  };

  const formatted = formatTime(elapsedMs);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none">
      {/* Time Display */}
      <div className="flex items-baseline justify-center gap-1 my-2">
        <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-hbs-slate-dark">
          {formatted.minutes}:{formatted.seconds}
        </span>
        <span className="text-xl font-bold font-mono text-hbs-teal-deep">
          .{formatted.ms}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={toggleRunning}
          className={`min-h-[42px] px-5 rounded-2xl flex items-center gap-2 text-xs font-black shadow-sm transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-hbs-teal hover:bg-hbs-teal-deep text-white shadow-hbs-teal/25'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Stopp' : 'Start'}</span>
        </button>

        <button
          onClick={handleLap}
          disabled={!isRunning}
          className="min-h-[42px] px-3 rounded-2xl bg-white/80 hover:bg-white disabled:opacity-40 text-hbs-slate-dark border border-white/70 shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Runde</span>
        </button>

        <button
          onClick={handleReset}
          className="min-h-[42px] min-w-[42px] p-2.5 rounded-2xl bg-white/80 hover:bg-white text-hbs-slate-dark border border-white/70 shadow-xs flex items-center justify-center transition-all active:scale-95"
          title="Zurücksetzen"
          aria-label="Zurücksetzen"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Lap Times List */}
      {laps.length > 0 && (
        <div className="w-full max-h-32 overflow-y-auto rounded-2xl bg-white/50 border border-white/60 p-2 text-xs space-y-1">
          {laps.map((lap) => {
            const lapFormatted = formatTime(lap.timeMs);
            const splitFormatted = formatTime(lap.splitMs);
            return (
              <div key={lap.lapNumber} className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/60 text-hbs-slate-dark">
                <span className="font-bold text-hbs-slate-muted">Runde {lap.lapNumber}</span>
                <span className="font-mono text-hbs-teal-deep text-[11px]">+{splitFormatted.minutes}:{splitFormatted.seconds}.{splitFormatted.ms}</span>
                <span className="font-mono font-bold">{lapFormatted.minutes}:{lapFormatted.seconds}.{lapFormatted.ms}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
