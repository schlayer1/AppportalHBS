import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const playVisualChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
};

export const VisualTimerWidget: React.FC = () => {
  const [totalMinutes, setTotalMinutes] = useState(15);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            if (!isMuted) playVisualChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, isMuted]);

  const handleSetDuration = (mins: number) => {
    setIsRunning(false);
    setIsFinished(false);
    setTotalMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsRemaining(totalMinutes * 60);
  };

  const fraction = (totalMinutes * 60) > 0 ? secondsRemaining / (totalMinutes * 60) : 0;
  const degrees = fraction * 360;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none">
      
      {/* Time-Timer Style Visual Clock Face (Conic Gradient Pie) */}
      <div className="relative w-44 h-44 rounded-full border-4 border-white/90 bg-white/80 shadow-md flex items-center justify-center my-1 overflow-hidden">
        
        {/* Visual Pie Slice (Conic Gradient) */}
        <div
          className={`absolute inset-1 rounded-full transition-all duration-300 ${
            isFinished ? 'opacity-0' : 'opacity-90'
          }`}
          style={{
            background: `conic-gradient(from 0deg, #ef4444 0deg, #ef4444 ${degrees}deg, #e2e8f0 ${degrees}deg, #e2e8f0 360deg)`
          }}
        />

        {/* 12 Clock Tick Marks */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-2 bg-hbs-slate-dark/30 z-10"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-80px)`
            }}
          />
        ))}

        {/* Center Pivot & Digital Overlap */}
        <div className="relative z-20 w-20 h-20 rounded-full bg-white/95 border-2 border-white shadow-md flex flex-col items-center justify-center text-center p-1">
          <span className={`text-base font-black font-mono tracking-tight ${
            isFinished ? 'text-red-600 animate-pulse' : 'text-hbs-slate-dark'
          }`}>
            {timeFormatted}
          </span>
          <span className="text-[9px] font-extrabold text-hbs-slate-muted uppercase">
            {isFinished ? 'Vorbei' : isRunning ? 'Läuft' : 'Halt'}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2 my-2">
        <button
          onClick={() => {
            if (secondsRemaining === 0) {
              setSecondsRemaining(totalMinutes * 60);
              setIsFinished(false);
            }
            setIsRunning(!isRunning);
          }}
          className={`min-h-[42px] px-5 rounded-2xl flex items-center gap-2 text-xs font-black shadow-sm transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={handleReset}
          className="min-h-[42px] min-w-[42px] p-2.5 rounded-2xl bg-white/80 hover:bg-white text-hbs-slate-dark border border-white/70 shadow-xs flex items-center justify-center transition-all active:scale-95"
          title="Zurücksetzen"
          aria-label="Zurücksetzen"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`min-h-[42px] min-w-[42px] p-2.5 rounded-2xl border shadow-xs flex items-center justify-center transition-all active:scale-95 ${
            isMuted
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white/80 hover:bg-white text-hbs-slate-muted hover:text-hbs-slate-dark border-white/70'
          }`}
          title={isMuted ? 'Ton aus' : 'Ton an'}
          aria-label="Ton an/aus"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Visual Timer Presets */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-1">
        {[5, 10, 15, 30].map((m) => (
          <button
            key={m}
            onClick={() => handleSetDuration(m)}
            className={`py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              totalMinutes === m && !isRunning
                ? 'bg-red-500 text-white border-red-500 shadow-2xs'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border-white/80'
            }`}
          >
            {m} min
          </button>
        ))}
      </div>
    </div>
  );
};
