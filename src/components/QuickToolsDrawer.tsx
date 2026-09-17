import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Timer, 
  Dices, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  MicOff, 
  AlertTriangle,
  CheckCircle2,
  QrCode
} from 'lucide-react';

interface QuickToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTableTent?: () => void;
}

// Simple Web Audio Bell synthesizer (no external audio file required)
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error('Audio play error', e);
  }
};

export const QuickToolsDrawer: React.FC<QuickToolsDrawerProps> = ({ 
  isOpen, 
  onClose,
  onOpenTableTent 
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'picker' | 'noise'>('timer');

  // ========== 1. TIMER STATE ==========
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min default
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            playChime();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleSetTimer = (secs: number) => {
    setIsTimerRunning(false);
    setInitialSeconds(secs);
    setTimerSeconds(secs);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ========== 2. STUDENT PICKER STATE ==========
  const [namesInput, setNamesInput] = useState(
    'Anna, Ben, Clara, David, Elias, Felix, Greta, Hanna, Jonas, Lara, Max, Noah, Paul, Sophie'
  );
  const [chosenStudent, setChosenStudent] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handlePickStudent = () => {
    const list = namesInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (list.length === 0) return;

    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const randomName = list[Math.floor(Math.random() * list.length)];
      setChosenStudent(randomName);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  // ========== 3. NOISE METER STATE ==========
  const [isMicListening, setIsMicListening] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(25); // 0 - 100
  const [threshold, setThreshold] = useState(65);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsMicListening(false);
    setNoiseLevel(0);
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setNoiseLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.error('Microphone access denied or error', e);
      alert('Mikrofonzugriff wurde verweigert oder ist nicht verfügbar.');
      setIsMicListening(false);
    }
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopMic();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-hbs-slate-dark/60 backdrop-blur-xs flex justify-end animate-fadeIn cursor-pointer"
      onClick={() => {
        stopMic();
        onClose();
      }}
    >
      {/* Slide-over Container */}
      <div 
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-hbs-slate-border/80 relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center border border-hbs-blue/15">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark tracking-tight">
                Unterrichts-Quick-Tools
              </h3>
              <p className="text-xs text-hbs-slate-muted">Praktische Helfer für die Unterrichtsstunde</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopMic();
              onClose();
            }}
            className="w-10 h-10 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-hbs-bg p-1.5 mx-5 sm:mx-6 mt-4 rounded-2xl border border-hbs-slate-border/60">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'timer'
                ? 'bg-white text-hbs-blue shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>
          <button
            onClick={() => setActiveTab('picker')}
            className={`flex-1 min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'picker'
                ? 'bg-white text-hbs-amber-dark shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Zufall</span>
          </button>
          <button
            onClick={() => setActiveTab('noise')}
            className={`flex-1 min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'noise'
                ? 'bg-white text-hbs-teal-deep shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Lärmampel</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* ========== TAB 1: TIMER ========== */}
          {activeTab === 'timer' && (
            <div className="flex flex-col items-center justify-center py-4">
              
              {/* Circular Digital Display */}
              <div className="relative w-56 h-56 flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-slate-100"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-hbs-blue transition-all duration-1000 ease-linear"
                    strokeWidth="7"
                    strokeDasharray={276}
                    strokeDashoffset={
                      initialSeconds > 0
                        ? 276 - (276 * timerSeconds) / initialSeconds
                        : 0
                    }
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-hbs-slate-dark tracking-tight tabular-nums">
                    {formatTime(timerSeconds)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-hbs-blue mt-1">
                    {isTimerRunning ? 'Läuft...' : timerSeconds === 0 ? 'Zeit abgelaufen!' : 'Pause'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`min-h-[48px] px-6 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-hbs-blue hover:bg-hbs-blue-deep text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isTimerRunning ? 'Pausieren' : 'Starten'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(initialSeconds);
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark flex items-center justify-center transition-colors active:scale-95"
                  title="Zurücksetzen"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Presets */}
              <div className="w-full">
                <span className="text-xs font-bold text-hbs-slate-muted block mb-2 text-center uppercase tracking-wider">
                  Schnellwahl:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: '3m', sec: 180 },
                    { label: '5m', sec: 300 },
                    { label: '10m', sec: 600 },
                    { label: '15m', sec: 900 },
                    { label: '20m', sec: 1200 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      onClick={() => handleSetTimer(p.sec)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        initialSeconds === p.sec
                          ? 'bg-hbs-blue-soft text-hbs-blue border-hbs-blue/30'
                          : 'bg-white hover:bg-slate-50 text-hbs-slate-muted border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========== TAB 2: STUDENT PICKER ========== */}
          {activeTab === 'picker' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-hbs-amber-light/70 border border-hbs-amber/20 text-center">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-amber-dark">
                  Ausgeloste Schülerin / Ausgeloster Schüler:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight my-2 min-h-[40px] flex items-center justify-center">
                  {chosenStudent || '—'}
                </div>
                {chosenStudent && (
                  <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ausgewählt
                  </span>
                )}
              </div>

              <button
                onClick={handlePickStudent}
                disabled={isRolling}
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-hbs-amber to-amber-600 hover:from-amber-600 hover:to-hbs-amber text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Dices className="w-5 h-5" />
                <span>{isRolling ? 'Lost aus...' : 'Zufallsschüler ziehen'}</span>
              </button>

              <div>
                <label className="block text-xs font-bold text-hbs-slate-muted mb-1.5 uppercase tracking-wider">
                  Klassenliste (Namen per Komma getrennt):
                </label>
                <textarea
                  rows={4}
                  value={namesInput}
                  onChange={(e) => setNamesInput(e.target.value)}
                  className="w-full p-3 text-xs bg-hbs-bg rounded-xl border border-hbs-slate-border text-hbs-slate-dark focus:outline-none focus:border-hbs-amber"
                  placeholder="Namen hier eingeben..."
                />
              </div>
            </div>
          )}

          {/* ========== TAB 3: NOISE METER ========== */}
          {activeTab === 'noise' && (
            <div className="space-y-5">
              
              {/* Traffic Light Visualizer */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shadow-lg">
                <div className="flex gap-4 p-3 bg-black/50 rounded-2xl border border-slate-700">
                  {/* Green */}
                  <div
                    className={`w-12 h-12 rounded-full transition-all duration-200 border-2 ${
                      noiseLevel < threshold * 0.7
                        ? 'bg-emerald-500 shadow-[0_0_20px_#10b981] border-emerald-300 scale-105'
                        : 'bg-emerald-950 border-emerald-900 opacity-40'
                    }`}
                  />
                  {/* Yellow */}
                  <div
                    className={`w-12 h-12 rounded-full transition-all duration-200 border-2 ${
                      noiseLevel >= threshold * 0.7 && noiseLevel < threshold
                        ? 'bg-amber-400 shadow-[0_0_20px_#f59e0b] border-amber-200 scale-105'
                        : 'bg-amber-950 border-amber-900 opacity-40'
                    }`}
                  />
                  {/* Red */}
                  <div
                    className={`w-12 h-12 rounded-full transition-all duration-200 border-2 ${
                      noiseLevel >= threshold
                        ? 'bg-red-500 shadow-[0_0_25px_#ef4444] border-red-300 scale-110 animate-pulse'
                        : 'bg-red-950 border-red-900 opacity-40'
                    }`}
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider block">
                    {noiseLevel >= threshold ? (
                      <span className="text-red-400 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Zu laut! Bitte leiser arbeiten!
                      </span>
                    ) : noiseLevel >= threshold * 0.7 ? (
                      <span className="text-amber-300">Gesprächspegel</span>
                    ) : (
                      <span className="text-emerald-400">Angenehme Arbeitsruhe</span>
                    )}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono tabular-nums mt-1 block">
                    Pegel: {noiseLevel}% (Schwelle: {threshold}%)
                  </span>
                </div>
              </div>

              {/* Mic Toggle Button */}
              <button
                onClick={isMicListening ? stopMic : startMic}
                className={`w-full min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isMicListening
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-hbs-teal hover:bg-hbs-teal-deep text-white'
                }`}
              >
                {isMicListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isMicListening ? 'Mikrofon stoppen' : 'Mikrofon-Messung starten'}</span>
              </button>

              {/* Threshold Slider */}
              <div className="p-4 rounded-2xl bg-hbs-bg border border-hbs-slate-border/70">
                <div className="flex justify-between text-xs font-bold text-hbs-slate-dark mb-2">
                  <span>Empfindlichkeit / Alarmschwelle:</span>
                  <span className="font-mono text-hbs-blue">{threshold}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-hbs-teal cursor-pointer"
                />
                <span className="text-[11px] text-hbs-slate-muted block mt-1">
                  Reagiert auf das Mikrofon des iPads, Laptops oder Lehrerpults.
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          {onOpenTableTent ? (
            <button
              onClick={() => {
                stopMic();
                onClose();
                onOpenTableTent();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-teal-800 text-xs font-bold hover:bg-teal-50 transition-colors shadow-2xs"
              title="QR-Code Tischaufsteller für Schülertische drucken"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600" />
              <span>Tischaufsteller</span>
            </button>
          ) : <div />}

          <button
            onClick={() => {
              stopMic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-hbs-blue text-white text-xs font-bold hover:bg-hbs-blue-deep transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
