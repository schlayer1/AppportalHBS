import React, { useRef, useState, useEffect } from 'react';
import { Pen, Highlighter, Eraser, RotateCcw, Trash2, PenLine } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  width: number;
  isHighlighter?: boolean;
}

const COLORS = [
  { id: '#091D2E', label: 'Dunkelblau' },
  { id: '#ef4444', label: 'Rot' },
  { id: '#10b981', label: 'Grün' },
  { id: '#f59e0b', label: 'Gelb' },
  { id: '#3b82f6', label: 'Hellblau' },
  { id: '#ffffff', label: 'Weiß' }
];

interface DrawWidgetProps {
  data?: Record<string, any>;
  onUpdateData?: (data: Record<string, any>) => void;
}

export const DrawWidget: React.FC<DrawWidgetProps> = ({ data, onUpdateData }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#091D2E');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [penOnly, setPenOnly] = useState<boolean>(data?.penOnly || false);
  const [paths, setPaths] = useState<Path[]>(data?.paths || []);
  const currentPathRef = useRef<Path | null>(null);
  const isDrawingRef = useRef(false);

  // Redraw canvas whenever paths change
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach((p) => {
      if (p.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(p.points[0].x, p.points[0].y);

      for (let i = 1; i < p.points.length; i++) {
        ctx.lineTo(p.points[i].x, p.points[i].y);
      }

      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = p.isHighlighter ? 0.35 : 1.0;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });
  };

  useEffect(() => {
    redraw();
    if (onUpdateData) {
      onUpdateData({ paths });
    }
  }, [paths, onUpdateData]);

  // Dynamically resize canvas to fit container on widget resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const w = Math.floor(rect.width);
          const h = Math.floor(rect.height);
          if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
            canvasRef.current.width = w;
            canvasRef.current.height = h;
            redraw();
          }
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [paths]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Palm Rejection: Ignore touch (finger / palm) when stylus-only mode is enabled
    if (penOnly && e.pointerType === 'touch') {
      return;
    }

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    currentPathRef.current = {
      points: [{ x, y }],
      color: tool === 'eraser' ? '#f8fafc' : color,
      width: tool === 'highlighter' ? strokeWidth * 3 : tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      isHighlighter: tool === 'highlighter'
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (penOnly && e.pointerType === 'touch') return;
    if (!isDrawingRef.current || !currentPathRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPathRef.current.points.push({ x, y });

    // Draw live segment
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const p = currentPathRef.current;
      const pts = p.points;
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = p.isHighlighter ? 0.35 : 1.0;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (penOnly && e && e.pointerType === 'touch') return;
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (isDrawingRef.current && currentPathRef.current) {
      isDrawingRef.current = false;
      setPaths((prev) => [...prev, currentPathRef.current!]);
      currentPathRef.current = null;
    }
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Tool & Color Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-white/40">
        {/* Tool Switcher */}
        <div className="flex items-center gap-1 bg-white/60 p-0.5 rounded-xl border border-white/80">
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-lg ${tool === 'pen' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'}`}
            title="Stift"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded-lg ${tool === 'highlighter' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'}`}
            title="Textmarker"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg ${tool === 'eraser' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'}`}
            title="Radierer"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color Palette & Stroke Width */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1.5 bg-white/60 p-1 rounded-xl border border-white/80">
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-4 h-4 rounded-full border border-black/20 transition-transform ${
                    color === c.id ? 'scale-125 ring-2 ring-hbs-blue/50' : ''
                  }`}
                  style={{ backgroundColor: c.id }}
                  title={c.label}
                />
              ))}
            </div>

            <div className="w-[1px] h-3.5 bg-black/20 mx-0.5" />

            <div className="flex items-center gap-1">
              {[2, 5, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                    strokeWidth === w ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
                  }`}
                >
                  {w === 2 ? 'S' : w === 5 ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Palm Rejection (Stylus Only) Toggle */}
        <button
          onClick={() => {
            const next = !penOnly;
            setPenOnly(next);
            if (onUpdateData) {
              onUpdateData({ paths, penOnly: next });
            }
          }}
          className={`p-1.5 rounded-lg flex items-center gap-1 border transition-all text-xs font-bold ${
            penOnly
              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
              : 'bg-white/70 hover:bg-white text-hbs-slate-muted border-white/80'
          }`}
          title={penOnly ? "Handballenschutz AKTIV: Reagiert nur auf Stift/Stylus (Finger werden ignoriert)" : "Handballenschutz aktivieren: Nur Stift (Apple Pencil / Stylus) zeichnet"}
        >
          <PenLine className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">{penOnly ? 'Nur Stift' : 'Stift'}</span>
        </button>

        {/* Actions (Undo & Clear) */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-hbs-slate-dark disabled:opacity-30 border border-white/80"
            title="Rückgängig"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg bg-white/70 hover:bg-red-50 text-hbs-slate-muted hover:text-red-500 disabled:opacity-30 border border-white/80"
            title="Tafel leeren"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 min-h-0 rounded-2xl bg-white/90 border border-white shadow-inner overflow-hidden relative touch-none">
        {penOnly && (
          <div className="absolute top-2 right-2 z-10 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none shadow-xs backdrop-blur-xs flex items-center gap-1">
            <PenLine className="w-2.5 h-2.5" />
            <span>Handballenschutz aktiv</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={360}
          height={260}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
};
