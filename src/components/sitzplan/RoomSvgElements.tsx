import React, { useEffect, useRef, useState } from 'react';
import { FixtureItem, TableItem } from '../../types/sitzplanTypes';
import { getTableLocalSeats } from './sitzplanEngine';

export const SITZPLAN_PALETTE = {
  floor: '#FFFDF8',
  floorGrid: '#E6EEF5',
  wall: '#091D2E',
  table: '#F5E7D0',
  tableStroke: '#B8976A',
  seat: '#F0F8FA',
  seatStroke: '#7A99AD',
  board: '#1B4D3E',
  boardFrame: '#8E6C48',
  fixture: '#E6F4F8',
  accent: '#E6FAF7',
  accentFg: '#006B5F',
  primary: '#0B7BA7',
  amber: '#F39200',
  teal: '#00A896',
  never: '#DC2626',
  apart: '#F39200',
  good: '#00A896',
  together: '#0B7BA7',
  card: '#FFFFFF',
};

export const RoomFloor: React.FC<{ w: number; h: number; gridId?: string }> = ({
  w,
  h,
  gridId = 'hbs-sitzplan-grid',
}) => (
  <>
    <defs>
      <pattern id={gridId} width="50" height="50" patternUnits="userSpaceOnUse">
        <path
          d="M 50 0 L 0 0 0 50"
          fill="none"
          stroke={SITZPLAN_PALETTE.floorGrid}
          strokeWidth="1"
        />
      </pattern>
    </defs>
    <rect x={0} y={0} width={w} height={h} fill={SITZPLAN_PALETTE.floor} />
    <rect x={0} y={0} width={w} height={h} fill={`url(#${gridId})`} />
    <rect
      x={0}
      y={0}
      width={w}
      height={h}
      fill="none"
      stroke={SITZPLAN_PALETTE.wall}
      strokeWidth={6}
      rx={4}
    />
  </>
);

export const TableShape: React.FC<{
  t: TableItem;
  selected?: boolean;
  showSeats?: boolean;
}> = ({ t, selected, showSeats = true }) => {
  const rx = t.kind === 'single' ? 6 : 10;
  const innerRx = t.kind === 'single' ? 3 : 6;
  const seats = showSeats ? getTableLocalSeats(t) : [];

  return (
    <g transform={`translate(${t.x} ${t.y}) rotate(${t.rot})`}>
      {seats.map((s, idx) => (
        <g key={idx}>
          <circle
            cx={s.x}
            cy={s.y + 1.5}
            r={19}
            fill={SITZPLAN_PALETTE.tableStroke}
            opacity={0.18}
          />
          <circle
            cx={s.x}
            cy={s.y}
            r={18}
            fill={SITZPLAN_PALETTE.seat}
            stroke={SITZPLAN_PALETTE.seatStroke}
            strokeWidth={1.5}
          />
        </g>
      ))}
      <rect
        x={-t.w / 2}
        y={-t.h / 2 + 2}
        width={t.w}
        height={t.h}
        rx={rx}
        fill={SITZPLAN_PALETTE.tableStroke}
        opacity={0.25}
      />
      <rect
        x={-t.w / 2}
        y={-t.h / 2}
        width={t.w}
        height={t.h}
        rx={rx}
        fill={SITZPLAN_PALETTE.table}
        stroke={selected ? SITZPLAN_PALETTE.primary : SITZPLAN_PALETTE.tableStroke}
        strokeWidth={selected ? 3.5 : 1.5}
      />
      <rect
        x={-t.w / 2 + 5}
        y={-t.h / 2 + 5}
        width={t.w - 10}
        height={t.h - 10}
        rx={innerRx}
        fill="none"
        stroke={SITZPLAN_PALETTE.tableStroke}
        strokeOpacity={0.35}
        strokeWidth={1}
      />
    </g>
  );
};

const UprightFixtureText: React.FC<{
  text: string;
  w: number;
  h: number;
  rot: number;
  fill: string;
  teacherPerspective?: boolean;
}> = ({ text, w, h, rot, fill, teacherPerspective = false }) => {
  const fontSize = Math.min(14, h * 0.55, (w - 8) / (text.length * 0.58));
  if (fontSize < 7) return null;
  const effectiveRot = ((rot + (teacherPerspective ? 180 : 0)) % 360 + 360) % 360;
  const flip = effectiveRot > 90 && effectiveRot <= 270;
  return (
    <text
      transform={flip ? 'rotate(180)' : undefined}
      y={fontSize * 0.35}
      textAnchor="middle"
      fontSize={fontSize}
      fontWeight={700}
      fill={fill}
      style={{ pointerEvents: 'none', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {text}
    </text>
  );
};

export const FixtureShape: React.FC<{
  f: FixtureItem;
  selected?: boolean;
  teacherPerspective?: boolean;
}> = ({ f, selected, teacherPerspective = false }) => {
  const selStroke = selected ? SITZPLAN_PALETTE.primary : undefined;
  const strokeW = selected ? 3 : 1.5;
  const { w, h } = f;

  let inner: React.ReactNode;

  switch (f.kind) {
    case 'stool':
      inner = (
        <>
          <ellipse cy={2} rx={w / 2} ry={h / 2} fill={SITZPLAN_PALETTE.tableStroke} opacity={0.25} />
          <ellipse
            rx={w / 2}
            ry={h / 2}
            fill={SITZPLAN_PALETTE.table}
            stroke={selStroke ?? SITZPLAN_PALETTE.tableStroke}
            strokeWidth={strokeW}
          />
          <ellipse
            rx={w * 0.36}
            ry={h * 0.36}
            fill="none"
            stroke={SITZPLAN_PALETTE.tableStroke}
            strokeOpacity={0.5}
          />
        </>
      );
      break;
    case 'readingTable':
      inner = (
        <>
          <ellipse cy={3} rx={w / 2} ry={h / 2} fill={SITZPLAN_PALETTE.tableStroke} opacity={0.25} />
          <ellipse
            rx={w / 2}
            ry={h / 2}
            fill={SITZPLAN_PALETTE.table}
            stroke={selStroke ?? SITZPLAN_PALETTE.tableStroke}
            strokeWidth={strokeW + 0.5}
          />
          <ellipse
            rx={w / 2 - 5}
            ry={h / 2 - 5}
            fill="none"
            stroke={SITZPLAN_PALETTE.tableStroke}
            strokeOpacity={0.4}
          />
          <UprightFixtureText
            text="Lesetisch"
            w={w * 0.8}
            h={h * 0.6}
            rot={f.rot}
            fill={SITZPLAN_PALETTE.wall}
            teacherPerspective={teacherPerspective}
          />
        </>
      );
      break;
    case 'bookshelf':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={3}
            fill={SITZPLAN_PALETTE.table}
            stroke={selStroke ?? SITZPLAN_PALETTE.tableStroke}
            strokeWidth={strokeW + 0.5}
          />
          {Array.from({ length: 8 }, (_, idx) => (
            <rect
              key={idx}
              x={-w / 2 + 7 + (idx * (w - 14)) / 8}
              y={-h / 2 + 5}
              width={(w - 14) / 8 - 2}
              height={h - 10}
              rx={1}
              fill={
                idx % 3 === 0
                  ? SITZPLAN_PALETTE.primary
                  : idx % 3 === 1
                    ? SITZPLAN_PALETTE.teal
                    : SITZPLAN_PALETTE.boardFrame
              }
              opacity={0.65}
            />
          ))}
        </>
      );
      break;
    case 'bench':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={7}
            fill={SITZPLAN_PALETTE.fixture}
            stroke={selStroke ?? SITZPLAN_PALETTE.wall}
            strokeWidth={strokeW}
          />
          <rect
            x={-w / 2 + 5}
            y={-h / 2 + 5}
            width={w - 10}
            height={h - 10}
            rx={5}
            fill={SITZPLAN_PALETTE.accent}
            stroke={SITZPLAN_PALETTE.primary}
            strokeOpacity={0.35}
          />
          <line
            x1={0}
            x2={0}
            y1={-h / 2 + 7}
            y2={h / 2 - 7}
            stroke={SITZPLAN_PALETTE.primary}
            strokeOpacity={0.3}
          />
        </>
      );
      break;
    case 'board':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={3}
            fill={SITZPLAN_PALETTE.board}
            stroke={selStroke ?? SITZPLAN_PALETTE.boardFrame}
            strokeWidth={selected ? 4 : 3}
          />
          <UprightFixtureText
            text="Tafel · Vorne"
            w={w}
            h={h}
            rot={f.rot}
            fill={SITZPLAN_PALETTE.floor}
            teacherPerspective={teacherPerspective}
          />
        </>
      );
      break;
    case 'door':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill={SITZPLAN_PALETTE.floor}
            stroke={selStroke ?? SITZPLAN_PALETTE.wall}
            strokeWidth={strokeW}
          />
          <line
            x1={-w / 2}
            x2={w / 2}
            y1={0}
            y2={0}
            stroke={SITZPLAN_PALETTE.wall}
            strokeWidth={2}
          />
        </>
      );
      break;
    case 'window':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill={SITZPLAN_PALETTE.card}
            stroke={selStroke ?? SITZPLAN_PALETTE.wall}
            strokeWidth={strokeW}
          />
          <line
            x1={-w / 2}
            x2={w / 2}
            y1={0}
            y2={0}
            stroke={SITZPLAN_PALETTE.primary}
            strokeOpacity={0.55}
            strokeWidth={2}
          />
          {[-1 / 6, 1 / 6].map((frac) => (
            <line
              key={frac}
              x1={w * frac}
              x2={w * frac}
              y1={-h / 2}
              y2={h / 2}
              stroke={SITZPLAN_PALETTE.wall}
              strokeWidth={1.5}
            />
          ))}
        </>
      );
      break;
    case 'sink':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={6}
            fill={SITZPLAN_PALETTE.card}
            stroke={selStroke ?? SITZPLAN_PALETTE.wall}
            strokeWidth={strokeW}
          />
          <ellipse
            cx={0}
            cy={h * 0.08}
            rx={w * 0.36}
            ry={h * 0.3}
            fill={SITZPLAN_PALETTE.fixture}
            stroke={SITZPLAN_PALETTE.wall}
            strokeWidth={1.5}
          />
          <circle cx={0} cy={h * 0.08} r={2.5} fill={SITZPLAN_PALETTE.wall} />
          <rect x={-3} y={-h / 2 + 2} width={6} height={h * 0.25} rx={2} fill={SITZPLAN_PALETTE.wall} />
        </>
      );
      break;
    case 'bin':
      inner = (
        <>
          <circle
            r={w / 2}
            fill={SITZPLAN_PALETTE.fixture}
            stroke={selStroke ?? SITZPLAN_PALETTE.wall}
            strokeWidth={selected ? 3 : 2}
          />
          <circle r={w / 2 - 5} fill="none" stroke={SITZPLAN_PALETTE.wall} strokeWidth={1} opacity={0.5} />
          {[-1, 0, 1].map((n) => (
            <line
              key={n}
              x1={n * w * 0.18}
              x2={n * w * 0.18}
              y1={-w * 0.2}
              y2={w * 0.2}
              stroke={SITZPLAN_PALETTE.wall}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ))}
        </>
      );
      break;
    case 'cabinet': {
      const doors = Math.max(1, Math.round(w / 60));
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={3}
            fill={SITZPLAN_PALETTE.table}
            stroke={selStroke ?? SITZPLAN_PALETTE.tableStroke}
            strokeWidth={strokeW + 0.5}
          />
          {Array.from({ length: doors - 1 }, (_, idx) => (
            <line
              key={idx}
              x1={-w / 2 + ((idx + 1) * w) / doors}
              x2={-w / 2 + ((idx + 1) * w) / doors}
              y1={-h / 2}
              y2={h / 2}
              stroke={SITZPLAN_PALETTE.tableStroke}
              strokeWidth={1}
            />
          ))}
          <UprightFixtureText
            text="Schrank"
            w={w}
            h={h}
            rot={f.rot}
            fill={SITZPLAN_PALETTE.wall}
            teacherPerspective={teacherPerspective}
          />
        </>
      );
      break;
    }
    case 'carpet':
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={Math.min(w, h) * 0.2}
            fill={SITZPLAN_PALETTE.accent}
            fillOpacity={0.72}
            stroke={selStroke ?? SITZPLAN_PALETTE.teal}
            strokeOpacity={selected ? 1 : 0.45}
            strokeWidth={strokeW + 0.5}
          />
          <rect
            x={-w / 2 + 8}
            y={-h / 2 + 8}
            width={Math.max(0, w - 16)}
            height={Math.max(0, h - 16)}
            rx={Math.min(w, h) * 0.15}
            fill="none"
            stroke={SITZPLAN_PALETTE.teal}
            strokeOpacity={0.35}
            strokeDasharray="6 5"
          />
          <UprightFixtureText
            text="Teppich"
            w={w}
            h={h}
            rot={f.rot}
            fill={SITZPLAN_PALETTE.accentFg}
            teacherPerspective={teacherPerspective}
          />
        </>
      );
      break;
    default:
      inner = (
        <>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={6}
            fill={SITZPLAN_PALETTE.table}
            stroke={selStroke ?? SITZPLAN_PALETTE.tableStroke}
            strokeWidth={strokeW + 0.5}
          />
          <rect
            x={-w / 2 + 4}
            y={-h / 2 + 4}
            width={Math.max(0, w - 8)}
            height={Math.max(0, h - 8)}
            rx={4}
            fill="none"
            stroke={SITZPLAN_PALETTE.tableStroke}
            strokeOpacity={0.45}
          />
          <UprightFixtureText
            text="Lehrerpult"
            w={w}
            h={h}
            rot={f.rot}
            fill={SITZPLAN_PALETTE.wall}
            teacherPerspective={teacherPerspective}
          />
        </>
      );
  }

  return <g transform={`translate(${f.x} ${f.y}) rotate(${f.rot})`}>{inner}</g>;
};

export function useIsMobileViewport(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);
  return isMobile;
}

/**
 * Touch-Pinch & Pan Workspace für iPhone/iPad (2-Finger-Zoom & -Pan ohne Objekt-Drag zu stören)
 */
export const TouchWorkspace: React.FC<{
  children: React.ReactNode;
  drawing?: boolean;
}> = ({ children, drawing = false }) => {
  const isMobile = useIsMobileViewport();
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; scale: number; midX: number; midY: number; x: number; y: number } | null>(null);
  const panStartRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!isMobile) {
    return <>{children}</>;
  }

  const clampPos = (scale: number, x: number, y: number) => {
    const el = containerRef.current;
    if (!el || scale <= 1) return { scale: 1, x: 0, y: 0 };
    const maxX = (el.clientWidth * (scale - 1)) / 2 + 40;
    const maxY = (el.clientHeight * (scale - 1)) / 2 + 40;
    return {
      scale,
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden touch-none"
      onTouchStart={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          touchesRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
        }
        if (e.touches.length === 2) {
          const [a, b] = [e.touches[0], e.touches[1]];
          const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          pinchStartRef.current = {
            dist,
            scale: transform.scale,
            midX: (a.clientX + b.clientX) / 2,
            midY: (a.clientY + b.clientY) / 2,
            x: transform.x,
            y: transform.y,
          };
          panStartRef.current = null;
        } else if (e.touches.length === 1 && transform.scale > 1.05 && !drawing) {
          const target = e.target as Element | null;
          if (!target?.closest('[data-room-object],[data-seat]')) {
            panStartRef.current = {
              clientX: e.touches[0].clientX,
              clientY: e.touches[0].clientY,
              x: transform.x,
              y: transform.y,
            };
          }
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && pinchStartRef.current) {
          e.preventDefault();
          const [a, b] = [e.touches[0], e.touches[1]];
          const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          const midX = (a.clientX + b.clientX) / 2;
          const midY = (a.clientY + b.clientY) / 2;
          const nextScale = Math.max(1, Math.min(3, (pinchStartRef.current.scale * dist) / Math.max(1, pinchStartRef.current.dist)));
          const dx = midX - pinchStartRef.current.midX;
          const dy = midY - pinchStartRef.current.midY;
          setTransform(clampPos(nextScale, pinchStartRef.current.x + dx, pinchStartRef.current.y + dy));
        } else if (e.touches.length === 1 && panStartRef.current) {
          const dx = e.touches[0].clientX - panStartRef.current.clientX;
          const dy = e.touches[0].clientY - panStartRef.current.clientY;
          setTransform(clampPos(transform.scale, panStartRef.current.x + dx, panStartRef.current.y + dy));
        }
      }}
      onTouchEnd={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          touchesRef.current.delete(e.changedTouches[i].identifier);
        }
        if (e.touches.length < 2) pinchStartRef.current = null;
        if (e.touches.length === 0) panStartRef.current = null;
      }}
    >
      <div
        className="h-full w-full origin-center transition-transform duration-75"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
      {transform.scale > 1.08 && (
        <button
          type="button"
          onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
          className="absolute bottom-3 right-3 z-20 rounded-full bg-white/95 border border-hbs-slate-border px-3 py-1.5 text-xs font-bold text-hbs-slate-dark shadow-md"
        >
          Zoom 100%
        </button>
      )}
    </div>
  );
};
