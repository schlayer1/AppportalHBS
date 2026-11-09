import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Trash2,
  MousePointer
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

  // Annotation vs Browse Mode
  // 'browse': Direct interaction with PDF (flipping, scrolling, zooming)
  // 'annotate': Draw with digital pen/highlighter on top of the document
  const [interactionMode, setInteractionMode] = useState<'browse' | 'annotate'>('annotate');

  // Annotation Tool State
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const penColor = '#dc2626'; // red default for teacher corrections
  const penWidth = 3;

  // Multi-page annotation persistence
  const [pageStrokes, setPageStrokes] = useState<Record<number, AnnotationStroke[]>>({});

  // Drawing Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<AnnotationStroke[]>([]);

  // Redraw canvas with current page strokes
  const redrawCanvas = useCallback(() => {
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
  }, []);

  // Save current strokes before changing page and load new page strokes
  const handlePageChange = useCallback((newPage: number) => {
    const boundedPage = Math.max(1, Math.min(totalPages, newPage));
    if (boundedPage === currentPage) return;

    // Save strokes of current page
    setPageStrokes((prev) => ({
      ...prev,
      [currentPage]: [...strokesRef.current]
    }));

    // Load strokes of new page
    strokesRef.current = pageStrokes[boundedPage] || [];
    setCurrentPage(boundedPage);
    setTimeout(redrawCanvas, 50);
  }, [currentPage, totalPages, pageStrokes, redrawCanvas]);

  // Load a sample worksheet template
  const loadSampleSheet = (type: 'math' | 'english' | 'blank') => {
    // Save current strokes
    setPageStrokes({});
    strokesRef.current = [];
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
    setPdfDataUrl(null);
    clearCanvas();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);

      // Detect page count from raw PDF bytes
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const text = new TextDecoder('latin1').decode(bytes);
        const pageMatches = text.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
          setTotalPages(pageMatches.length);
        } else {
          const countMatch = text.match(/\/Count\s+(\d+)/);
          if (countMatch && parseInt(countMatch[1], 10) > 0) {
            setTotalPages(parseInt(countMatch[1], 10));
          } else {
            setTotalPages(1);
          }
        }
      } catch (e) {
        console.warn('Konnte PDF-Seitenanzahl nicht ermitteln:', e);
        setTotalPages(1);
      }

      const url = URL.createObjectURL(file);
      setPdfDataUrl(url);
      setCurrentPage(1);
      setPageStrokes({});
      strokesRef.current = [];
      clearCanvas();
    }
  };

  // Canvas Drawing Logic
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (interactionMode !== 'annotate') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'eraser') {
      strokesRef.current = strokesRef.current.filter((stroke) => {
        return !stroke.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 24);
      });
      redrawCanvas();
      return;
    }

    currentStrokeRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || interactionMode !== 'annotate') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      strokesRef.current = strokesRef.current.filter((stroke) => {
        return !stroke.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 24);
      });
      redrawCanvas();
      return;
    }

    currentStrokeRef.current.push({ x, y });

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
      const newStroke: AnnotationStroke = {
        points: [...currentStrokeRef.current],
        color: tool === 'highlighter' ? '#facc15' : penColor,
        width: tool === 'highlighter' ? 18 : penWidth,
        isHighlighter: tool === 'highlighter'
      };
      strokesRef.current.push(newStroke);
      setPageStrokes((prev) => ({
        ...prev,
        [currentPage]: [...strokesRef.current]
      }));
    }
    currentStrokeRef.current = [];
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    setPageStrokes((prev) => {
      const copy = { ...prev };
      delete copy[currentPage];
      return copy;
    });
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Adjust canvas resolution dynamically when resized or zoomed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redrawCanvas();
    }
  }, [zoom, currentPage, redrawCanvas]);

  // Construct iframe URL with page and zoom parameters
  const pdfViewerUrl = pdfDataUrl 
    ? `${pdfDataUrl}#page=${currentPage}&zoom=${zoom}&view=FitH` 
    : null;

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none w-full h-full justify-between min-h-0 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-1 pb-1.5 mb-1 border-b border-white/40 shrink-0">
        {/* Document Info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-hbs-slate-dark truncate max-w-[130px] sm:max-w-[180px]">
            {fileName}
          </span>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1">
          {/* Mode Switcher: Blättern vs. Stift-Annotation */}
          <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80">
            <button
              type="button"
              onClick={() => setInteractionMode('browse')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                interactionMode === 'browse'
                  ? 'bg-hbs-blue text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
              title="PDF-Modus: Blättern, Scrollen & Text markieren"
            >
              <MousePointer className="w-3 h-3" />
              <span className="hidden md:inline">Blättern</span>
            </button>

            <button
              type="button"
              onClick={() => setInteractionMode('annotate')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                interactionMode === 'annotate'
                  ? 'bg-hbs-teal-deep text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
              title="Stift-Modus: Direkt auf dem Arbeitsblatt zeichnen"
            >
              <PenTool className="w-3 h-3" />
              <span className="hidden md:inline">Stift</span>
            </button>
          </div>

          {/* Annotation Tool Picker (When Annotate Mode is Active) */}
          {interactionMode === 'annotate' && (
            <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80 animate-fadeIn">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`p-1 rounded-lg text-xs font-bold transition-all ${
                  tool === 'pen' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-white'
                }`}
                title="Korrekturstift (Rot)"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTool('highlighter')}
                className={`p-1 rounded-lg text-xs font-bold transition-all ${
                  tool === 'highlighter' ? 'bg-amber-400 text-amber-950 shadow-2xs' : 'text-slate-600 hover:bg-white'
                }`}
                title="Textmarker (Gelb)"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`p-1 rounded-lg text-xs font-bold transition-all ${
                  tool === 'eraser' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-white'
                }`}
                title="Radiergummi"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={clearCanvas}
                className="p-1 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Markierungen auf dieser Seite löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <label className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-hbs-blue border border-white cursor-pointer shadow-2xs flex items-center gap-1 shrink-0">
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">PDF laden</span>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Document & Annotation Viewport - 100% Responsive Fit */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-inner flex flex-col relative min-h-0">
        <div className="w-full h-full flex-1 relative flex items-center justify-center min-h-0 overflow-auto">
          {pdfViewerUrl ? (
            <iframe
              key={`pdf_frame_${pdfViewerUrl}`}
              src={pdfViewerUrl}
              className={`w-full h-full border-0 bg-white ${
                interactionMode === 'annotate' ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              style={{ width: '100%', height: '100%', minHeight: '100%' }}
              title={fileName}
            />
          ) : (
            /* Render Interactive Visual Worksheet (Interactive Sample) */
            <div 
              className="w-full max-w-lg bg-white shadow-sm border border-slate-200 rounded-xl p-5 space-y-4 font-sans text-slate-800 transition-transform m-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
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
                <span className="px-2 py-0.5 bg-hbs-blue-soft text-hbs-blue text-[10px] font-black rounded-full">
                  Seite {currentPage}/{totalPages}
                </span>
              </div>

              {/* Sample Worksheet Content depending on Page */}
              {currentPage === 1 ? (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800 mb-1">Aufgabe 1: Grundlagen</p>
                    <p className="text-slate-600">
                      Lies den Text aufmerksam durch und markiere die Schlüsselbegriffe mit dem gelben Textmarker. Notiere anschließend Stichpunkte im Heft.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 font-mono text-[11px]">
                    Merksatz: Jedes digitale Tafelbild kann als Arbeitsblatt eingebunden, durchgeblättert und direkt mit dem Rotstift korrigiert werden.
                  </div>
                </div>
              ) : currentPage === 2 ? (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800 mb-1">Aufgabe 2: Vertiefung & Transfer</p>
                    <p className="text-slate-600">
                      Vergleiche deine Ergebnisse mit deinem Sitznachbarn. Beantworte die Kontrollfragen 1 bis 3 in vollständigen Sätzen.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800 mb-1">Aufgabe {currentPage}: Zusatzaufgabe</p>
                    <p className="text-slate-600">
                      Für Schnelle: Erstelle eine eigene Skizze oder formuliere ein eigenes Fazit zur Stunde.
                    </p>
                  </div>
                </div>
              )}

              {/* Sample Templates Switcher */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Beispiel-Vorlagen:</span>
                <div className="flex gap-1">
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
                    className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-bold"
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
            </div>
          )}

          {/* Interactive Annotation Canvas Overlay */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute inset-0 z-20 touch-none ${
              interactionMode === 'annotate' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
          />
        </div>

        {/* Bottom Paging & Zoom Navigation Bar */}
        <div className="h-9 px-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 z-30 shadow-xs">
          {/* Page navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Vorherige Seite (Blättern)"
            >
              <ChevronLeft className="w-4 h-4 text-hbs-blue" />
            </button>

            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              Seite {currentPage} von {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Nächste Seite (Blättern)"
            >
              <ChevronRight className="w-4 h-4 text-hbs-blue" />
            </button>
          </div>

          {/* Current Mode Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span className={`w-2 h-2 rounded-full ${
              interactionMode === 'annotate' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
            }`} />
            <span>
              {interactionMode === 'annotate' ? 'Stift-Annotation' : 'Blättern & Lesen'}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              title="Verkleinern"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <span className="text-[10px] font-mono w-10 text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              className="p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              title="Vergrößern"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 ml-0.5"
              title="Auf 100% zurücksetzen"
            >
              100%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
