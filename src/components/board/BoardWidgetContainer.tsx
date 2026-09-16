import React, { useRef, useState, useCallback } from 'react';
import { Minus, X, GripHorizontal } from 'lucide-react';
import { BoardWidgetInstance } from './types';

interface BoardWidgetContainerProps {
  widget: BoardWidgetInstance;
  onPositionChange: (x: number, y: number) => void;
  onClose: () => void;
  onToggleMinimize: () => void;
  onFocus: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const BoardWidgetContainer: React.FC<BoardWidgetContainerProps> = ({
  widget,
  onPositionChange,
  onClose,
  onToggleMinimize,
  onFocus,
  icon,
  children
}) => {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, widgetX: 0, widgetY: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only start dragging when pressing on the header bar or drag handle
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
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

    // Calculate new position within reasonable screen boundaries
    const newX = Math.max(8, Math.min(window.innerWidth - 100, dragStartRef.current.widgetX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 80, dragStartRef.current.widgetY + dy));

    onPositionChange(newX, newY);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      onPointerDown={() => onFocus()}
      style={{
        transform: `translate3d(${widget.x}px, ${widget.y}px, 0)`,
        zIndex: widget.zIndex,
        width: widget.width,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      className={`absolute top-0 left-0 rounded-3xl ios-glass overflow-hidden flex flex-col transition-shadow select-none duration-150 ${
        isDragging ? 'shadow-2xl opacity-95 scale-[1.01]' : 'shadow-xl'
      }`}
    >
      {/* Header / Grab Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-11 px-3.5 bg-white/40 border-b border-white/50 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none backdrop-blur-sm"
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

      {/* Content Body */}
      {!widget.isMinimized && (
        <div className="p-4 flex-1 flex flex-col overflow-auto bg-white/20">
          {children}
        </div>
      )}
    </div>
  );
};
