import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertTriangle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

const playAlarmTone = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export const SoundLevelWidget: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [maxThreshold, setMaxThreshold] = useState(65); // 0 to 100
  const [sensitivity, setSensitivity] = useState(1.4); // multiplier
  const [alarmActive, setAlarmActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastAlarmTimeRef = useRef<number>(0);

  const startListening = async () => {
    try {
      setPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100 * sensitivity));
        setAudioLevel(normalized);

        // Check threshold
        if (normalized >= maxThreshold) {
          setAlarmActive(true);
          const now = Date.now();
          if (now - lastAlarmTimeRef.current > 1800) {
            lastAlarmTimeRef.current = now;
            if (!isMuted) playAlarmTone();
          }
        } else if (normalized < maxThreshold - 10) {
          setAlarmActive(false);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.error('Mikrofon-Zugriff fehlgeschlagen:', err);
      setPermissionDenied(true);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
    setAlarmActive(false);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Mic Status Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-hbs-blue hover:bg-hbs-blue-deep text-white'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Messung stoppen' : 'Mikrofon aktivieren'}</span>
          </button>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
            isMuted ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white/70 text-hbs-slate-dark border-white/80'
          }`}
          title={isMuted ? 'Alarmton stumm' : 'Alarmton aktiv'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {permissionDenied ? (
        <div className="my-auto p-3 rounded-2xl bg-red-50 border border-red-200 text-center text-xs text-red-700">
          <p className="font-black">Mikrofon-Zugriff verweigert</p>
          <p className="text-[11px] mt-0.5">Bitte erlaube im Browser den Zugriff auf das Mikrofon.</p>
        </div>
      ) : (
        /* Visualizer Meter */
        <div className="my-2 space-y-2">
          {/* Decibel Meter Bar */}
          <div className="relative h-10 w-full rounded-2xl bg-slate-900/80 p-1.5 overflow-hidden flex items-center shadow-inner">
            {/* Threshold Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-[0_0_8px_rgba(239,68,68,1)]"
              style={{ left: `${maxThreshold}%` }}
              title={`Schwellenwert: ${maxThreshold}%`}
            />

            {/* Moving Volume Bar */}
            <div
              className={`h-full rounded-xl transition-all duration-75 ${
                audioLevel >= maxThreshold
                  ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : audioLevel >= maxThreshold - 15
                  ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(4, audioLevel)}%` }}
            />
          </div>

          {/* Alarm Status Box */}
          <div
            className={`p-2 rounded-xl text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              alarmActive
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : isListening
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-white/60 text-hbs-slate-muted border border-white/80'
            }`}
          >
            {alarmActive ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Zu laut im Klassenzimmer!</span>
              </>
            ) : isListening ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lautstärke ist im grünen Bereich ({audioLevel}%)</span>
              </>
            ) : (
              <span>Klicke auf "Mikrofon aktivieren"</span>
            )}
          </div>
        </div>
      )}

      {/* Sliders for Threshold & Sensitivity */}
      <div className="space-y-2 pt-2 border-t border-white/30 text-[11px] font-bold">
        <div className="flex items-center justify-between gap-2">
          <span className="text-hbs-slate-muted">Schwellenwert (Alarm):</span>
          <span className="font-mono">{maxThreshold}%</span>
          <input
            type="range"
            min="30"
            max="95"
            value={maxThreshold}
            onChange={(e) => setMaxThreshold(Number(e.target.value))}
            className="w-24 accent-red-500"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-hbs-slate-muted">Empfindlichkeit:</span>
          <span className="font-mono">{sensitivity.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-24 accent-hbs-blue"
          />
        </div>
      </div>
    </div>
  );
};
