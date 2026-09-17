import React, { useRef, useState, useCallback } from 'react';
import { Minus, X, GripHorizontal } from 'lucide-react';
import { BoardWidgetInstance, BoardWidgetType } from './types';

export const WIDGET_BASE_DIMENSIONS: Partial<Record<BoardWidgetType, { baseWidth: number; baseHeight: number }>> = {
  'clock': { baseWidth: 304, baseHeight: 160 },
  'timer': { baseWidth: 324, baseHeight: 320 },
  'visual-timer': { baseWidth: 304, baseHeight: 300 },
  'stopwatch': { baseWidth: 304, baseHeight: 220 },
  'traffic-light': { baseWidth: 184, baseHeight: 280 },
  'work-symbols': { baseWidth: 304, baseHeight: 220 },
  'sound-level': { baseWidth: 324, baseHeight: 220 },
  'random-picker': { baseWidth: 324, baseHeight: 240 },
  'group-maker': { baseWidth: 344, baseHeight: 300 },
  'dice': { baseWidth: 264, baseHeight: 200 },
  'stickers': { baseWidth: 244, baseHeight: 200 },
  'scoreboard': { baseWidth: 324, baseHeight: 220 },
  'event-countdown': { baseWidth: 284, baseHeight: 200 },
  'calendar': { baseWidth: 324, baseHeight: 260 },
  'poll': { baseWidth: 324, baseHeight: 260 },
  'timetable': { baseWidth: 344, baseHeight: 320 },
  'qr-code': { baseWidth: 244, baseHeight: 240 }
};

interface BoardWidgetContainerProps {
  widget: BoardWidgetInstance;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  onClose: () => void;
  onToggleMinimize: () => void;
  onFocus: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const BoardWidgetContainer: React.FC<BoardWidgetContainerProps> = ({
  widget,
  onPositionChange,
  onSizeChange,
  onClose,
  onToggleMinimize,
  onFocus,
  icon,
  children
}) => {
  // Dragging State
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, widgetX: 0, widgetY: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Resizing State
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [isResizing, setIsResizing] = useState(false);

  // Dynamic Scale Factor Calculation for Scalable Widgets
  const baseDim = WIDGET_BASE_DIMENSIONS[widget.type];
  const availW = Math.max(40, widget.width - 16);
  const availH = Math.max(40, (widget.isMinimized ? 44 : widget.height) - 44 - 16);
  const scale = baseDim
    ? Math.min(availW / baseDim.baseWidth, availH / baseDim.baseHeight)
    : 1;

  // Dragging Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    onFocus();

    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y
    };
    setIsDragging(true);
  }, [onFocus, widget.x, widget.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Generous bounds allowing free placement on virtual canvas
    const newX = Math.max(0, dragStartRef.current.widgetX + dx);
    const newY = Math.max(0, dragStartRef.current.widgetY + dy);

    onPositionChange(newX, newY);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  // Resizing Handlers
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();

    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: widget.width,
      h: widget.height
    };
    setIsResizing(true);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current || !onSizeChange) return;
    e.preventDefault();

    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;

    // Dynamic minimum 140px width, 90px height; Maximum 1600px width, 1200px height
    const newW = Math.max(140, Math.min(1600, resizeStartRef.current.w + dx));
    const newH = Math.max(90, Math.min(1200, resizeStartRef.current.h + dy));

    onSizeChange(newW, newH);
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    setIsResizing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      onPointerDown={() => onFocus()}
      style={{
        transform: `translate3d(${widget.x}px, ${widget.y}px, 0)`,
        zIndex: widget.zIndex,
        width: widget.width,
        height: widget.isMinimized ? 'auto' : widget.height,
        willChange: isDragging || isResizing ? 'transform, width, height' : 'auto'
      }}
      className={`absolute top-0 left-0 rounded-3xl ios-glass overflow-hidden flex flex-col transition-shadow select-none duration-150 ${
        isDragging || isResizing ? 'shadow-2xl opacity-95 scale-[1.01]' : 'shadow-xl'
      }`}
    >
      {/* Header / Grab Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-11 px-3.5 bg-white/40 border-b border-white/50 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none backdrop-blur-sm shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-hbs-slate-dark/40 shrink-0" />
          {icon && <div className="text-hbs-blue shrink-0">{icon}</div>}
          <span className="text-xs font-black text-hbs-slate-dark tracking-tight truncate">
            {widget.title}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1.5 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleMinimize}
            className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark/70 hover:text-hbs-slate-dark flex items-center justify-center border border-white/60 shadow-2xs transition-transform active:scale-90"
            title={widget.isMinimized ? 'Maximieren' : 'Minimieren'}
            aria-label="Minimieren"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center border border-red-200/50 shadow-2xs transition-all active:scale-90"
            title="Schließen"
            aria-label="Schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Body with Dynamic Realtime Content Scaling */}
      {!widget.isMinimized && (
        <div className="p-2 flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center bg-white/20 relative">
          {/* Prevent iframes or embedded objects from capturing pointer events during drag or resize */}
          {(isDragging || isResizing) && (
            <div className="absolute inset-0 z-50 bg-transparent cursor-move" />
          )}
          {baseDim ? (
            <div
              style={{
                width: `${baseDim.baseWidth}px`,
                height: `${baseDim.baseHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                flexShrink: 0
              }}
              className="flex flex-col justify-center items-center select-none w-full h-full"
            >
              {children}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col min-h-0 overflow-auto">
              {children}
            </div>
          )}
        </div>
      )}

      {/* Resize Handle (bottom-right corner) */}
      {!widget.isMinimized && onSizeChange && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          className="absolute bottom-0 right-0 w-7 h-7 cursor-nwse-resize flex items-end justify-end p-1.5 text-hbs-slate-dark/35 hover:text-hbs-blue touch-none z-30 transition-colors"
          title="Fenster frei vergrößern / verkleinern"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
