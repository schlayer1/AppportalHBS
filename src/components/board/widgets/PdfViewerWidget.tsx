import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  PenTool, 
  Highlighter, 
  Eraser, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Trash2
} from 'lucide-react';

interface AnnotationStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isHighlighter?: boolean;
}

export const PdfViewerWidget: React.FC = () => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Arbeitsblatt.pdf');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(100);

  // Annotation Tool State
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const penColor = '#dc2626'; // red default for teacher corrections
  const penWidth = 3;
  const [isAnnotating, setIsAnnotating] = useState<boolean>(true);

  // Drawing Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<AnnotationStroke[]>([]);

  // Load a sample worksheet template
  const loadSampleSheet = (type: 'math' | 'english' | 'blank') => {
    setCurrentPage(1);
    if (type === 'math') {
      setFileName('Mathe_Geometrie_Klasse7.pdf');
      setTotalPages(4);
    } else if (type === 'english') {
      setFileName('English_Grammar_Check.pdf');
      setTotalPages(2);
    } else {
      setFileName('Arbeitsblatt_Vorlage.pdf');
      setTotalPages(1);
    }
    clearCanvas();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPdfDataUrl(url);
      setCurrentPage(1);
      clearCanvas();
    }
  };

  // Canvas Drawing Logic
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.stroke();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'eraser') {
      // Erase strokes near point
      strokesRef.current = strokesRef.current.filter(stroke => {
        return !stroke.points.some(pt => Math.hypot(pt.x - x, pt.y - y) < 20);
      });
      redrawCanvas();
      return;
    }

    currentStrokeRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isAnnotating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      strokesRef.current = strokesRef.current.filter(stroke => {
        return !stroke.points.some(pt => Math.hypot(pt.x - x, pt.y - y) < 20);
      });
      redrawCanvas();
      return;
    }

    currentStrokeRef.current.push({ x, y });

    // Draw live stroke segment
    const ctx = canvas.getContext('2d');
    if (!ctx || currentStrokeRef.current.length < 2) return;

    const pts = currentStrokeRef.current;
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = tool === 'highlighter' ? '#facc15' : penColor;
    ctx.lineWidth = tool === 'highlighter' ? 18 : penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = tool === 'highlighter' ? 0.35 : 1.0;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (tool !== 'eraser' && currentStrokeRef.current.length > 1) {
      strokesRef.current.push({
        points: [...currentStrokeRef.current],
        color: tool === 'highlighter' ? '#facc15' : penColor,
        width: tool === 'highlighter' ? 18 : penWidth,
        isHighlighter: tool === 'highlighter'
      });
    }
    currentStrokeRef.current = [];
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Adjust canvas resolution to actual displayed dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redrawCanvas();
    }
  }, [zoom, currentPage]);

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between min-h-0 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-1 pb-1.5 mb-1 border-b border-white/40 shrink-0">
        {/* Document Info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-hbs-slate-dark truncate max-w-[140px] sm:max-w-[200px]">
            {fileName}
          </span>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1">
          {/* Annotation Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80">
            <button
              type="button"
              onClick={() => { setTool('pen'); setIsAnnotating(true); }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                tool === 'pen' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-white'
              }`}
              title="Korrekturstift (Rot)"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => { setTool('highlighter'); setIsAnnotating(true); }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                tool === 'highlighter' ? 'bg-amber-400 text-amber-950 shadow-2xs' : 'text-slate-600 hover:bg-white'
              }`}
              title="Textmarker (Gelb)"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => { setTool('eraser'); setIsAnnotating(true); }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                tool === 'eraser' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-white'
              }`}
              title="Radiergummi"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={clearCanvas}
              className="p-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Alle Markierungen auf dieser Seite löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upload Button */}
          <label className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-hbs-blue border border-white cursor-pointer shadow-2xs flex items-center gap-1">
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">PDF laden</span>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Document & Annotation Viewport */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-inner flex flex-col relative min-h-0">
        {/* Document Content */}
        <div className="flex-1 overflow-auto p-4 flex justify-center items-start relative select-none">
          {pdfDataUrl ? (
            <object
              data={pdfDataUrl}
              type="application/pdf"
              className="w-full h-full pointer-events-none"
            >
              <p className="text-center p-4 text-xs font-bold text-slate-400">PDF-Vorschau aktiv</p>
            </object>
          ) : (
            /* Render Interactive Visual Worksheet (Interactive Sample) */
            <div 
              className="w-full max-w-lg bg-white shadow-sm border border-slate-200 rounded-xl p-5 space-y-4 font-sans text-slate-800 transition-transform"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <div className="border-b-2 border-hbs-blue pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-hbs-blue">
                    Staatliche Regelschule Heimbürgeschule Kahla
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    Unterrichtsmaterial: {fileName.replace('.pdf', '')}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border text-slate-600">
                  Seite {currentPage}/{totalPages}
                </span>
              </div>

              {/* Sample Worksheet Exercises */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-black text-slate-900 block mb-1">Aufgabe 1: Verständnisfragen</span>
                  <p className="text-slate-600">
                    1. Erkläre in eigenen Worten den Unterschied zwischen den beiden Kernbegriffen.
                  </p>
                  <p className="text-slate-600 mt-1">
                    2. Notiere die passende Formel und berechne das Ergebnis für a = 6 cm und b = 8 cm.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60">
                  <span className="font-black text-amber-900 block mb-1">Aufgabe 2: Lösung eintragen</span>
                  <div className="h-10 border-b border-dashed border-amber-300 flex items-end text-slate-400 italic text-[11px]">
                    (Hier kann mit dem digitalen Stift direkt auf der Tafel ausgefüllt werden...)
                  </div>
                </div>
              </div>

              {/* Quick Template Switcher */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Vorlagen:</span>
                <button
                  type="button"
                  onClick={() => loadSampleSheet('math')}
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold"
                >
                  📐 Mathe
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleSheet('english')}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                >
                  🇬🇧 Englisch
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleSheet('blank')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold"
                >
                  📄 Blanko
                </button>
              </div>
            </div>
          )}

          {/* Interactive Annotation Canvas Overlay */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 z-20 touch-none cursor-crosshair"
            style={{ pointerEvents: isAnnotating ? 'auto' : 'none' }}
          />
        </div>

        {/* Bottom Paging & Zoom Navigation Bar */}
        <div className="h-9 px-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 z-30">
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
              title="Vorherige Seite"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono">
              Seite {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
              title="Nächste Seite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Annotation Status Tip */}
          <span className="hidden sm:inline text-[10px] font-bold text-slate-400">
            ✏️ Stift-Annotation aktiv
          </span>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1 rounded hover:bg-slate-200"
              title="Verkleinern"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-1 rounded hover:bg-slate-200"
              title="Vergrößern"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
