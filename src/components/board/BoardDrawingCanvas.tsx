import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Check
} from 'lucide-react';
import { BoardDrawingStroke } from './types';

interface BoardDrawingCanvasProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: (active: boolean) => void;
  drawings: BoardDrawingStroke[];
  onAddStroke: (stroke: BoardDrawingStroke) => void;
  onClearDrawings: () => void;
  onUndoStroke: () => void;
}

const CHALK_COLORS = [
  { name: 'Kreideweiß', color: '#ffffff' },
  { name: 'Sonnengelb', color: '#fde047' },
  { name: 'Himmelblau', color: '#38bdf8' },
  { name: 'Kreiderot', color: '#f87171' },
  { name: 'Smaragdgrün', color: '#4ade80' },
  { name: 'Kreideorange', color: '#fb923c' }
];

const STROKE_WIDTHS = [
  { name: 'Fein', width: 3 },
  { name: 'Mittel', width: 6 },
  { name: 'Kräftig', width: 12 }
];

export const BoardDrawingCanvas: React.FC<BoardDrawingCanvasProps> = ({
  isDrawingMode,
  onToggleDrawingMode,
  drawings,
  onAddStroke,
  onClearDrawings,
  onUndoStroke
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Tool settings
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#ffffff');
  const [width, setWidth] = useState<number>(5);

  // Redraw all strokes onto the canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of drawings) {
      if (!stroke.points || stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
      }
      ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.stroke();
      }
    }
  }, [drawings]);

  // Sync canvas size with board canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || 2800;
      canvas.height = parent.clientHeight || 1800;
      redrawCanvas();
    }
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [drawings, redrawCanvas]);

  // Pointer drawing events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'eraser') {
      // Find and remove strokes near the eraser point
      const remaining = drawings.filter((s) => {
        return !s.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 32);
      });
      if (remaining.length !== drawings.length) {
        // Redraw remaining
        onClearDrawings();
        remaining.forEach(onAddStroke);
      }
      return;
    }

    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      const remaining = drawings.filter((s) => {
        return !s.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 32);
      });
      if (remaining.length !== drawings.length) {
        onClearDrawings();
        remaining.forEach(onAddStroke);
      }
      return;
    }

    currentPointsRef.current.push({ x, y });

    // Live preview stroke segment
    const ctx = canvas.getContext('2d');
    if (!ctx || currentPointsRef.current.length < 2) return;

    const pts = currentPointsRef.current;
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = tool === 'highlighter' ? '#fde047' : color;
    ctx.lineWidth = tool === 'highlighter' ? 24 : width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = tool === 'highlighter' ? 0.45 : 1.0;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (tool !== 'eraser' && currentPointsRef.current.length > 1) {
      const newStroke: BoardDrawingStroke = {
        points: [...currentPointsRef.current],
        color: tool === 'highlighter' ? '#fde047' : color,
        width: tool === 'highlighter' ? 24 : width,
        isHighlighter: tool === 'highlighter'
      };
      onAddStroke(newStroke);
    }
    currentPointsRef.current = [];
  };

  return (
    <>
      {/* Absolute Blackboard Drawing Canvas Overlay */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 w-full h-full ${
          isDrawingMode 
            ? 'z-30 pointer-events-auto touch-none cursor-crosshair' 
            : 'z-10 pointer-events-none'
        }`}
      />

      {/* Floating Chalk & Pen Tray Toolbar (Visible when Writing Mode is ON) */}
      {isDrawingMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full ios-glass bg-slate-900/85 text-white backdrop-blur-md shadow-2xl border border-white/20 animate-slideDown no-print">
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-full">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                tool === 'pen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Kreidestift (Freihand schreiben)"
            >
              <PenTool className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                tool === 'highlighter' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Tafel-Textmarker (Gelb)"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                tool === 'eraser' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Tafelschwamm (Radierer)"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Chalk Colors (When Pen Active) */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/10 animate-fadeIn">
              {CHALK_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-120 cursor-pointer ${
                    color === c.color ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Stroke Width Selector */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-full">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.width}
                  type="button"
                  onClick={() => setWidth(sw.width)}
                  className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    width === sw.width ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {sw.name}
                </button>
              ))}
            </div>
          )}

          {/* Undo Stroke */}
          <button
            type="button"
            onClick={onUndoStroke}
            disabled={drawings.length === 0}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Letzten Strich rückgängig machen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Clear Blackboard Sponge */}
          <button
            type="button"
            onClick={() => {
              if (drawings.length > 0 && window.confirm('Möchtest du alle handschriftlichen Notizen auf dieser Tafel abwischen?')) {
                onClearDrawings();
              }
            }}
            disabled={drawings.length === 0}
            className="p-2 rounded-full hover:bg-red-500/30 text-slate-300 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Tafel abwischen (Zeichnungen löschen)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close / Finish Writing Button */}
          <button
            type="button"
            onClick={() => onToggleDrawingMode(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-hbs-teal-deep hover:bg-hbs-teal-light text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer ml-1"
            title="Schreibmodus beenden (Notizen bleiben auf der Tafel sichtbar)"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Fertig</span>
          </button>
        </div>
      )}
    </>
  );
};
