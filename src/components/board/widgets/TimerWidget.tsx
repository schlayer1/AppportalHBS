import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus } from 'lucide-react';

const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 1.2);

    // Second harmonic bell note
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 1.5);
      } catch {}
    }, 180);
  } catch (e) {
    console.error('Audio play error', e);
  }
};

export const TimerWidget: React.FC = () => {
  const [initialSeconds, setInitialSeconds] = useState(300); // 5 min
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            if (!isMuted) playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, isMuted]);

  const toggleRun = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(initialSeconds);
      setIsFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    setIsFinished(false);
  };

  const addTime = (secsToAdd: number) => {
    setIsFinished(false);
    setSecondsLeft((prev) => prev + secsToAdd);
    setInitialSeconds((prev) => Math.max(prev, secondsLeft + secsToAdd));
  };

  const setPreset = (secs: number) => {
    setIsRunning(false);
    setIsFinished(false);
    setInitialSeconds(secs);
    setSecondsLeft(secs);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress for SVG ring
  const progressPercent = initialSeconds > 0 ? (secondsLeft / initialSeconds) : 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none">
      
      {/* SVG Circular Countdown */}
      <div className="relative w-44 h-44 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="text-white/60"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Animated active progress bar */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`transition-all duration-500 ease-linear ${
              isFinished
                ? 'text-red-500'
                : secondsLeft <= 30
                ? 'text-amber-500'
                : 'text-hbs-blue'
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Center Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-4xl font-black font-mono tracking-tight transition-transform ${
              isFinished ? 'text-red-600 scale-110 animate-bounce' : 'text-hbs-slate-dark'
            }`}
          >
            {timeFormatted}
          </span>
          <span className="text-[10px] font-bold text-hbs-slate-muted uppercase tracking-wider mt-0.5">
            {isFinished ? 'Zeit abgelaufen!' : isRunning ? 'Läuft...' : 'Pausiert'}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2.5 my-2">
        <button
          onClick={toggleRun}
          className={`min-h-[46px] px-6 rounded-2xl flex items-center gap-2 text-sm font-black shadow-md transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-hbs-blue hover:bg-hbs-blue-deep text-white shadow-hbs-blue/25'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={handleReset}
          className="min-h-[46px] min-w-[46px] p-2.5 rounded-2xl bg-white/80 hover:bg-white text-hbs-slate-dark border border-white/70 shadow-xs flex items-center justify-center transition-all active:scale-95"
          title="Zurücksetzen"
          aria-label="Zurücksetzen"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`min-h-[46px] min-w-[46px] p-2.5 rounded-2xl border shadow-xs flex items-center justify-center transition-all active:scale-95 ${
            isMuted
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white/80 hover:bg-white text-hbs-slate-muted hover:text-hbs-slate-dark border-white/70'
          }`}
          title={isMuted ? 'Ton stummgeschaltet' : 'Gong aktiviert'}
          aria-label="Ton an/aus"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-2">
        {[
          { label: '1m', s: 60 },
          { label: '3m', s: 180 },
          { label: '5m', s: 300 },
          { label: '10m', s: 600 }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setPreset(item.s)}
            className={`py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              initialSeconds === item.s && !isRunning
                ? 'bg-hbs-blue text-white border-hbs-blue shadow-2xs'
                : 'bg-white/60 hover:bg-white text-hbs-slate-dark border-white/80'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Quick Add +1m / +5m */}
      <div className="flex items-center justify-center gap-2 mt-2 w-full">
        <button
          onClick={() => addTime(60)}
          className="flex-1 py-1 rounded-xl bg-white/40 hover:bg-white/80 text-[11px] font-bold text-hbs-slate-dark border border-white/60 flex items-center justify-center gap-1 transition-all active:scale-95"
        >
          <Plus className="w-3 h-3" /> 1 min
        </button>
        <button
          onClick={() => addTime(300)}
          className="flex-1 py-1 rounded-xl bg-white/40 hover:bg-white/80 text-[11px] font-bold text-hbs-slate-dark border border-white/60 flex items-center justify-center gap-1 transition-all active:scale-95"
        >
          <Plus className="w-3 h-3" /> 5 min
        </button>
      </div>
    </div>
  );
};
