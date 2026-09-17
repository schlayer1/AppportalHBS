import React, { useState, useRef, useEffect } from 'react';
import { 
  EyeOff, 
  Sun, 
  Sliders, 
  ArrowDown, 
  ArrowUp,
  X,
  Palette
} from 'lucide-react';
import { BoardWidgetInstance } from '../types';

interface CurtainWidgetProps {
  widget?: BoardWidgetInstance;
  onClose: () => void;
  data?: Record<string, any>;
  onUpdateData?: (data: Record<string, any>) => void;
}

export const CurtainWidget: React.FC<CurtainWidgetProps> = ({
  onClose,
  data,
  onUpdateData
}) => {
  const [mode, setMode] = useState<'curtain' | 'spotlight'>(data?.mode || 'curtain');
  // 'bottom-up' = covers solutions at bottom; 'top-down' = covers from top
  const [direction, setDirection] = useState<'bottom-up' | 'top-down'>(data?.direction || 'bottom-up');
  // progress: 0 = completely covered, 100 = completely open / revealed
  const [progress, setProgress] = useState<number>(data?.progress !== undefined ? data.progress : 50);
  const [theme, setTheme] = useState<'chalk' | 'slate' | 'wood'>(data?.theme || 'chalk');

  // Spotlight State
  const [spotlightPos, setSpotlightPos] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400
  });
  const [spotlightRadius, setSpotlightRadius] = useState<number>(data?.spotlightRadius || 140);

  const isDraggingHandleRef = useRef(false);
  const isDraggingSpotlightRef = useRef(false);

  useEffect(() => {
    if (onUpdateData) {
      onUpdateData({
        mode,
        direction,
        progress,
        theme,
        spotlightRadius
      });
    }
  }, [mode, direction, progress, theme, spotlightRadius, onUpdateData]);

  // Handle Dragging the Curtain Roller Blind
  const handleHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingHandleRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingHandleRef.current) return;
    e.preventDefault();

    const windowH = window.innerHeight;
    const clientY = Math.max(0, Math.min(windowH, e.clientY));

    if (direction === 'bottom-up') {
      // clientY is where the top edge of the cover is
      // If clientY is 0 (top of screen), covered = 100% -> progress = 0%
      // If clientY is windowH (bottom of screen), covered = 0% -> progress = 100%
      const revealedPercentage = Math.round((clientY / windowH) * 100);
      setProgress(revealedPercentage);
    } else {
      // top-down: clientY is where the bottom edge of the cover is
      // If clientY is 0, covered = 0% -> progress = 100%
      // If clientY is windowH, covered = 100% -> progress = 0%
      const revealedPercentage = Math.round(((windowH - clientY) / windowH) * 100);
      setProgress(revealedPercentage);
    }
  };

  const handleHandlePointerUp = (e: React.PointerEvent) => {
    isDraggingHandleRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Handle Dragging Spotlight
  const handleSpotlightPointerDown = (e: React.PointerEvent) => {
    isDraggingSpotlightRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSpotlightPos({ x: e.clientX, y: e.clientY });
  };

  const handleSpotlightPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSpotlightRef.current) return;
    e.preventDefault();
    setSpotlightPos({ x: e.clientX, y: e.clientY });
  };

  const handleSpotlightPointerUp = (e: React.PointerEvent) => {
    isDraggingSpotlightRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'slate':
        return 'bg-[#1a232f] border-slate-700 shadow-2xl';
      case 'wood':
        return 'bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#451a03] border-amber-800 shadow-2xl';
      case 'chalk':
      default:
        return 'bg-[#173225] border-[#1e4d38] shadow-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] select-none pointer-events-none font-sans">
      
      {/* MODE 1: FULL-BOARD ROLLER BLIND (TAFEL-ROLLE / VORHANG) */}
      {mode === 'curtain' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* The Actual Solid Board Cover Overlay */}
          <div
            className={`absolute left-0 right-0 ${getThemeClass()} pointer-events-auto transition-[height] duration-75 flex flex-col justify-between overflow-hidden`}
            style={{
              [direction === 'bottom-up' ? 'bottom' : 'top']: 0,
              height: `${100 - progress}%`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
            }}
          >
            {/* Realistic Blackboard / Fabric Texture */}
            <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_8px)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />

            {/* Top/Bottom Wood Trim */}
            <div className="h-2 w-full bg-black/40 border-b border-white/10 shrink-0" />

            {/* Helpful Teacher Guidance in Center if closed */}
            {progress < 85 && (
              <div className="my-auto text-center px-4 py-6 pointer-events-none opacity-80">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/20 text-white text-xs font-bold mb-1.5 backdrop-blur-xs">
                  <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tafelbild verdeckt ({100 - progress}%)</span>
                </div>
                <p className="text-xs text-white/80 max-w-md mx-auto">
                  Ziehe den Holzgriff an der Leiste, um Aufgaben oder Lösungen schrittweise für die Klasse aufzudecken.
                </p>
              </div>
            )}

            {/* GRIP HANDLE BAR (The interactive pull rail) */}
            <div
              onPointerDown={handleHandlePointerDown}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              className={`w-full py-2 px-4 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-t-2 border-b-2 border-amber-700/80 shadow-2xl flex items-center justify-between cursor-row-resize select-none shrink-0 touch-none ${
                direction === 'bottom-up' ? 'order-first' : 'order-last'
              }`}
            >
              {/* Left Grip Texture & Label */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-3 rounded-full bg-amber-200/40 border border-amber-100/50 flex items-center justify-center gap-1 shadow-inner">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
                <span className="text-xs font-black text-amber-100 tracking-wide flex items-center gap-1">
                  <span>↕ Tafel-Vorhang</span>
                  <span className="text-[10px] font-medium text-amber-300 hidden sm:inline">
                    ({progress}% aufgedeckt)
                  </span>
                </span>
              </div>

              {/* Center Quick Percentage Shortcuts */}
              <div 
                className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {[
                  { label: 'Ganz zu', val: 0 },
                  { label: '25%', val: 25 },
                  { label: '50%', val: 50 },
                  { label: '75%', val: 75 },
                  { label: 'Offen', val: 100 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setProgress(item.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                      progress === item.val
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-amber-200 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right Options (Direction, Theme, Spotlight, Close) */}
              <div 
                className="flex items-center gap-1.5"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Direction Toggle */}
                <button
                  type="button"
                  onClick={() => setDirection(d => d === 'bottom-up' ? 'top-down' : 'bottom-up')}
                  className="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-amber-200 border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title={direction === 'bottom-up' ? 'Von unten aufdecken (Lösungen verdecken)' : 'Von oben aufdecken'}
                >
                  {direction === 'bottom-up' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{direction === 'bottom-up' ? 'Von unten' : 'Von oben'}</span>
                </button>

                {/* Theme Selector */}
                <button
                  type="button"
                  onClick={() => setTheme(t => t === 'chalk' ? 'slate' : t === 'slate' ? 'wood' : 'chalk')}
                  className="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-amber-200 border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title="Farbe des Tafel-Vorhangs wechseln"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{theme === 'chalk' ? 'Grün' : theme === 'slate' ? 'Schiefer' : 'Holz'}</span>
                </button>

                {/* Switch to Spotlight */}
                <button
                  type="button"
                  onClick={() => setMode('spotlight')}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title="In den Spotlight-Fokusmodus wechseln"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Spotlight</span>
                </button>

                {/* Close Vorhang */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-all shadow-xs"
                  title="Tafel-Vorhang schließen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: SPOTLIGHT / FOKUS-LICHT */}
      {mode === 'spotlight' && (
        <div
          onPointerDown={handleSpotlightPointerDown}
          onPointerMove={handleSpotlightPointerMove}
          onPointerUp={handleSpotlightPointerUp}
          className="absolute inset-0 pointer-events-auto cursor-move touch-none overflow-hidden"
          style={{
            background: `radial-gradient(circle ${spotlightRadius}px at ${spotlightPos.x}px ${spotlightPos.y}px, transparent ${spotlightRadius - 2}px, rgba(9, 29, 46, 0.88) ${spotlightRadius + 2}px)`
          }}
        >
          {/* Glowing Focus Ring around the spotlight area */}
          <div
            className="absolute pointer-events-none rounded-full border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${spotlightPos.x}px`,
              top: `${spotlightPos.y}px`,
              width: `${spotlightRadius * 2}px`,
              height: `${spotlightRadius * 2}px`
            }}
          >
            <div className="w-full h-full rounded-full border border-white/40 animate-pulse" />
          </div>

          {/* Floating Control Bar for Spotlight (Fixed at bottom center) */}
          <div 
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-white pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Spotlight aktiv</span>
            </div>

            <span className="text-slate-600">•</span>

            {/* Radius size controls */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Größe:</span>
              {[90, 140, 220].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSpotlightRadius(sz)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    spotlightRadius === sz ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sz === 90 ? 'Klein' : sz === 140 ? 'Mittel' : 'Groß'}
                </button>
              ))}
            </div>

            <span className="text-slate-600">•</span>

            {/* Switch back to Curtain */}
            <button
              type="button"
              onClick={() => setMode('curtain')}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 text-slate-200"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Zum Vorhang</span>
            </button>

            {/* Close Spotlight */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all ml-1"
              title="Spotlight beenden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
