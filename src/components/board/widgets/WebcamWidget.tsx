import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Pause, Play, FlipHorizontal } from 'lucide-react';

export const WebcamWidget: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsActive(true);
      setIsFrozen(false);
    } catch (err) {
      console.error('Kamera-Fehler:', err);
      setErrorMsg('Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.');
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsFrozen(false);
  };

  const toggleFreeze = () => {
    if (!videoRef.current) return;
    if (isFrozen) {
      videoRef.current.play();
      setIsFrozen(false);
    } else {
      videoRef.current.pause();
      setIsFrozen(true);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5">
          <button
            onClick={isActive ? stopCamera : startCamera}
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-hbs-blue hover:bg-hbs-blue-deep text-white'
            }`}
          >
            {isActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{isActive ? 'Kamera aus' : 'Kamera / Visualizer starten'}</span>
          </button>
        </div>

        {isActive && (
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFreeze}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
                isFrozen
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white/70 hover:bg-white text-hbs-slate-dark border-white/80'
              }`}
              title={isFrozen ? 'Livebild fortsetzen' : 'Standbild einfrieren (für Arbeitsblatt)'}
            >
              {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80"
              title="Spiegeln"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Video Viewport */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-white shadow-inner flex items-center justify-center min-h-[180px] relative">
        {errorMsg ? (
          <div className="p-3 text-center text-xs text-red-400 font-bold">
            {errorMsg}
          </div>
        ) : !isActive ? (
          <div className="flex flex-col items-center justify-center text-center p-3 text-slate-400">
            <Camera className="w-8 h-8 mb-1.5 opacity-50" />
            <span className="text-xs font-bold">Dokumentenkamera oder Webcam</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Zeigt Arbeitsblätter oder Experimente live</span>
          </div>
        ) : null}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-contain ${isMirrored ? '-scale-x-100' : ''} ${
            !isActive ? 'hidden' : 'block'
          }`}
        />

        {isFrozen && (
          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
            Standbild aktiv
          </div>
        )}
      </div>
    </div>
  );
};
