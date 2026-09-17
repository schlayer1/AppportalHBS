import React, { useState, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Sun, 
  RotateCcw, 
  Sliders, 
  ArrowDown, 
  ArrowRight 
} from 'lucide-react';

export const CurtainWidget: React.FC = () => {
  const [mode, setMode] = useState<'curtain' | 'spotlight'>('curtain');
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [progress, setProgress] = useState<number>(50); // 0 = fully closed (covered), 100 = fully open (revealed)
  const [curtainTheme, setCurtainTheme] = useState<'chalk' | 'slate' | 'wood'>('chalk');
  
  // Spotlight state
  const [spotlightPos, setSpotlightPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // percentage
  const [spotlightRadius, setSpotlightRadius] = useState<number>(35); // percentage

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Handle Dragging Curtain Handle
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (mode === 'curtain') {
      if (direction === 'vertical') {
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const p = Math.round((y / rect.height) * 100);
        setProgress(p);
      } else {
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const p = Math.round((x / rect.width) * 100);
        setProgress(p);
      }
    } else {
      // Spotlight position
      const x = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
      setSpotlightPos({ x, y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const getCurtainStyle = () => {
    switch (curtainTheme) {
      case 'slate':
        return 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-600 text-slate-200 shadow-2xl';
      case 'wood':
        return 'bg-gradient-to-b from-amber-800 via-amber-900 to-[#3e1f08] border-amber-700 text-amber-100 shadow-2xl';
      case 'chalk':
      default:
        return 'bg-gradient-to-b from-[#1b4332] via-[#2d6a4f] to-[#1b4332] border-emerald-600 text-emerald-100 shadow-2xl';
    }
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between min-h-0 relative font-sans">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-xl border border-white/80">
          <button
            type="button"
            onClick={() => setMode('curtain')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'curtain' ? 'bg-hbs-blue text-white shadow-xs' : 'text-hbs-slate-muted hover:bg-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Vorhang</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('spotlight')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'spotlight' ? 'bg-amber-500 text-white shadow-xs' : 'text-hbs-slate-muted hover:bg-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Spotlight</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {mode === 'curtain' ? (
            <>
              {/* Direction Toggle */}
              <button
                type="button"
                onClick={() => setDirection(d => d === 'vertical' ? 'horizontal' : 'vertical')}
                className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 text-xs font-bold transition-all shadow-2xs"
                title={direction === 'vertical' ? 'Von oben nach unten' : 'Von links nach rechts'}
              >
                {direction === 'vertical' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>

              {/* Theme color */}
              <button
                type="button"
                onClick={() => setCurtainTheme(t => t === 'chalk' ? 'slate' : t === 'slate' ? 'wood' : 'chalk')}
                className="px-2 py-1 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 text-[11px] font-bold transition-all shadow-2xs"
                title="Vorhang-Farbe wechseln"
              >
                {curtainTheme === 'chalk' ? '🟢 Tafel' : curtainTheme === 'slate' ? '⚫ Schiefer' : '🪵 Holz'}
              </button>

              {/* Open / Close shortcut */}
              <button
                type="button"
                onClick={() => setProgress(p => p > 50 ? 0 : 100)}
                className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all shadow-2xs"
                title={progress > 50 ? 'Ganz abdecken' : 'Ganz aufdecken'}
              >
                {progress > 50 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </>
          ) : (
            <>
              {/* Spotlight Radius adjust */}
              <button
                type="button"
                onClick={() => setSpotlightRadius(r => r === 25 ? 40 : r === 40 ? 60 : 25)}
                className="px-2 py-1 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 text-[11px] font-bold shadow-2xs"
                title="Lichtkegel-Größe"
              >
                Radius: {spotlightRadius}%
              </button>
              <button
                type="button"
                onClick={() => setSpotlightPos({ x: 50, y: 50 })}
                className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 shadow-2xs"
                title="Zentrieren"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Interactive Stage */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 rounded-2xl overflow-hidden relative shadow-inner border-2 border-white min-h-0 touch-none cursor-crosshair bg-transparent"
      >
        {mode === 'curtain' ? (
          /* CURTAIN MODE */
          <div className="w-full h-full relative">
            {/* The Covered Region */}
            <div 
              className={`absolute top-0 left-0 transition-all duration-75 ${getCurtainStyle()} flex flex-col justify-end overflow-hidden`}
              style={
                direction === 'vertical'
                  ? { width: '100%', height: `${100 - progress}%` }
                  : { width: `${100 - progress}%`, height: '100%' }
              }
            >
              {/* Realistic blind ridges / stripes effect */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />

              {/* Grip Handle Bar */}
              <div 
                className={`shrink-0 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing ${
                  direction === 'vertical' 
                    ? 'h-8 w-full border-t border-b border-white/20 bg-black/40 backdrop-blur-xs' 
                    : 'w-8 h-full border-l border-r border-white/20 bg-black/40 backdrop-blur-xs'
                }`}
              >
                <div className="flex items-center gap-1">
                  <div className="w-8 h-1.5 rounded-full bg-white/80 shadow-xs" />
                </div>
              </div>
            </div>

            {/* Revealed status label */}
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-white text-[10px] font-mono font-bold pointer-events-none backdrop-blur-xs">
              {progress}% aufgedeckt
            </div>
          </div>
        ) : (
          /* SPOTLIGHT MODE */
          <div 
            className="w-full h-full relative"
            style={{
              background: `radial-gradient(circle ${spotlightRadius}% at ${spotlightPos.x}% ${spotlightPos.y}%, transparent 0%, rgba(0, 0, 0, 0.85) 100%)`
            }}
          >
            {/* Focus Ring Indicator */}
            <div 
              className="absolute pointer-events-none rounded-full border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.5)] -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{
                left: `${spotlightPos.x}%`,
                top: `${spotlightPos.y}%`,
                width: `${spotlightRadius * 1.6}%`,
                height: `${spotlightRadius * 1.6}%`,
              }}
            />

            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-amber-300 text-[10px] font-bold pointer-events-none backdrop-blur-xs">
              💡 Spotlight ziehen zum Fokussieren
            </div>
          </div>
        )}
      </div>

      {/* Footer Preset Buttons for Quick Progress */}
      {mode === 'curtain' && (
        <div className="flex items-center justify-between pt-1.5 px-0.5 shrink-0 text-hbs-slate-muted">
          <div className="flex items-center gap-1">
            {[0, 25, 50, 75, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setProgress(val)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  progress === val 
                    ? 'bg-hbs-blue text-white shadow-2xs' 
                    : 'bg-white/70 hover:bg-white text-hbs-slate-dark border border-white'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
          <span className="text-[10px] font-bold">Griff ziehen ↕</span>
        </div>
      )}
    </div>
  );
};
