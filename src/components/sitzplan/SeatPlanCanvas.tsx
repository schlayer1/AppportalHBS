import { forwardRef, useMemo, useRef, useState } from 'react';
import { RoomLayout } from '../../types/sitzplanTypes';
import { buildSeatGraph, orderRoomObjects } from './sitzplanEngine';
import { FixtureShape, RoomFloor, SITZPLAN_PALETTE, TableShape } from './RoomSvgElements';

interface SeatPlanCanvasProps {
  room: RoomLayout;
  assignment: Record<string, string>;
  locked?: string[];
  students: Array<{ id: string; name: string }>;
  selectedSeat?: string | null;
  highlightStudentIds?: Set<string>;
  warnStudentIds?: Set<string>;
  interactive?: boolean;
  teacherPerspective?: boolean; // true = "Tafel im Rücken" (180° gedreht, Namen aufrecht)
  gridId?: string;
  onSeatTap?: (seatId: string) => void;
  onSwap?: (seatA: string, seatB: string) => void;
  onLockToggle?: (seatId: string) => void;
  onBackgroundTap?: () => void;
}

export function truncateSeatName(name: string, maxLen = 8): string {
  if (name.length <= maxLen) return name;
  const match = name.match(/^(.*?)\s+(\S{1,2}\.?)$/);
  if (match) {
    return match[1].slice(0, Math.max(3, maxLen - match[2].length - 2)) + '… ' + match[2];
  }
  return name.slice(0, maxLen - 1) + '…';
}

export async function exportSeatPlanSvgAsPng(
  svgEl: SVGSVGElement,
  fileName: string
): Promise<void> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const srcEls = svgEl.querySelectorAll('*');
  const dstEls = clone.querySelectorAll('*');
  srcEls.forEach((el, idx) => {
    const cs = getComputedStyle(el);
    const dst = dstEls[idx];
    if (dst) {
      if (cs.fill) dst.setAttribute('fill', cs.fill);
      if (cs.stroke) dst.setAttribute('stroke', cs.stroke);
      if (el.tagName === 'text') {
        dst.setAttribute('font-family', '"Plus Jakarta Sans", Helvetica, Arial, sans-serif');
      }
    }
  });
  clone.querySelectorAll('[data-noprint]').forEach((el) => el.remove());
  const vb = svgEl.viewBox.baseVal;
  clone.setAttribute('width', String(vb.width * 2));
  clone.setAttribute('height', String(vb.height * 2));
  const serialized = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = vb.width * 2;
  canvas.height = vb.height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Zeichenfläche nicht verfügbar');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${fileName.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.png`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => link.remove(), 1000);
}

export const SeatPlanCanvas = forwardRef<SVGSVGElement, SeatPlanCanvasProps>(
  function SeatPlanCanvas(
    {
      room,
      assignment,
      locked = [],
      students,
      selectedSeat,
      highlightStudentIds,
      warnStudentIds,
      interactive = true,
      teacherPerspective = false,
      gridId = 'hbs-sitzplan-seat-grid',
      onSeatTap,
      onSwap,
      onLockToggle,
      onBackgroundTap,
    },
    ref
  ) {
    const graph = useMemo(() => buildSeatGraph(room), [room]);
    const studentNames = useMemo(
      () => new Map(students.map((s) => [s.id, s.name])),
      [students]
    );
    const lockedSet = useMemo(() => new Set(locked), [locked]);

    const [dragState, setDragState] = useState<{
      seat: string;
      x: number;
      y: number;
      moved: boolean;
      fixed: boolean;
    } | null>(null);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const findSeatAtPoint = (clientX: number, clientY: number) =>
      document.elementFromPoint(clientX, clientY)?.closest('[data-seat]')?.getAttribute('data-seat') ??
      null;

    const roomContent = (
      <>
        <RoomFloor w={room.w} h={room.h} gridId={gridId} />
        {orderRoomObjects(room).map((entry) =>
          entry.type === 'fixture' ? (
            <FixtureShape
              key={entry.object.id}
              f={entry.object}
              teacherPerspective={teacherPerspective}
            />
          ) : (
            <TableShape key={entry.object.id} t={entry.object} showSeats={false} />
          )
        )}

        {graph.seats.map((seat) => {
          const studId = assignment[seat.id];
          const name = studId ? studentNames.get(studId) : undefined;
          const isSelected = selectedSeat === seat.id;
          const isDragging = dragState?.seat === seat.id && dragState.moved;
          const isHighlighted = Boolean(studId && highlightStudentIds?.has(studId));
          const isWarn = Boolean(studId && warnStudentIds?.has(studId));
          const isLocked = lockedSet.has(seat.id);

          return (
            <g
              key={seat.id}
              data-seat={seat.id}
              transform={`translate(${seat.x} ${seat.y})${teacherPerspective ? ' rotate(180)' : ''}`}
              style={{
                cursor: interactive ? 'pointer' : undefined,
                opacity: isDragging ? 0.35 : 1,
              }}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId);
                startPosRef.current = { x: e.clientX, y: e.clientY };
                setDragState({
                  seat: seat.id,
                  x: e.clientX,
                  y: e.clientY,
                  moved: false,
                  fixed: !studId || isLocked,
                });
              }}
            >
              <rect
                x={-31}
                y={-22}
                width={62}
                height={44}
                rx={14}
                fill={
                  name
                    ? isHighlighted
                      ? SITZPLAN_PALETTE.accent
                      : '#FFFFFF'
                    : SITZPLAN_PALETTE.seat
                }
                stroke={
                  isSelected
                    ? SITZPLAN_PALETTE.primary
                    : isWarn
                      ? SITZPLAN_PALETTE.never
                      : name
                        ? SITZPLAN_PALETTE.seatStroke
                        : '#CBD5E1'
                }
                strokeWidth={isSelected ? 4 : isWarn ? 3 : 1.5}
                strokeDasharray={name ? undefined : '5 4'}
              />
              <text
                y={5}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill={name ? SITZPLAN_PALETTE.wall : SITZPLAN_PALETTE.seatStroke}
                style={{
                  pointerEvents: 'none',
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                }}
              >
                {name ? truncateSeatName(name) : 'frei'}
              </text>

              {graph.front.has(seat.id) && (
                <g transform="translate(-28 -19)" style={{ pointerEvents: 'none' }}>
                  <circle r={6} fill={SITZPLAN_PALETTE.board} />
                  <path d="M0 -3 L2.7 1.8 H-2.7 Z" fill="#FFFFFF" />
                </g>
              )}

              {interactive && onLockToggle && isLocked && (
                <g
                  data-noprint="true"
                  transform="translate(27 -18)"
                  role="button"
                  tabIndex={0}
                  aria-label={`${name ?? 'Freier Platz'}: Platz lösen`}
                  aria-pressed={isLocked}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLockToggle(seat.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onLockToggle(seat.id);
                    }
                  }}
                >
                  <title>Platz lösen</title>
                  <circle
                    r={13}
                    fill={SITZPLAN_PALETTE.primary}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                  <path
                    d="M-4 -1 h8 v6 h-8z M-2.5 -1 v-2.5 a2.5 2.5 0 0 1 5 0 v2.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={1.6}
                  />
                </g>
              )}
            </g>
          );
        })}
      </>
    );

    return (
      <div className="relative h-full w-full">
        <svg
          ref={ref}
          viewBox={`-12 -12 ${room.w + 24} ${room.h + 24}`}
          className="touch-none h-full w-full"
          onPointerMove={(e) => {
            if (!dragState || !startPosRef.current) return;
            const moved =
              !dragState.fixed &&
              (dragState.moved ||
                Math.hypot(e.clientX - startPosRef.current.x, e.clientY - startPosRef.current.y) > 8);
            setDragState({ ...dragState, x: e.clientX, y: e.clientY, moved });
          }}
          onPointerUp={(e) => {
            if (!dragState) return;
            if (dragState.moved) {
              const targetSeat = findSeatAtPoint(e.clientX, e.clientY);
              if (targetSeat && targetSeat !== dragState.seat) {
                onSwap?.(dragState.seat, targetSeat);
              }
            } else {
              onSeatTap?.(dragState.seat);
            }
            setDragState(null);
          }}
          onPointerCancel={() => {
            setDragState(null);
            startPosRef.current = null;
          }}
          onPointerDown={(e) => {
            if (interactive && e.target instanceof Element && !e.target.closest('[data-seat]')) {
              onBackgroundTap?.();
            }
          }}
        >
          {teacherPerspective ? (
            <g transform={`rotate(180 ${room.w / 2} ${room.h / 2})`}>{roomContent}</g>
          ) : (
            roomContent
          )}
        </svg>

        {dragState?.moved && assignment[dragState.seat] && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hbs-blue px-4 py-2 text-sm font-bold text-white shadow-lg"
            style={{ left: dragState.x, top: dragState.y }}
          >
            {studentNames.get(assignment[dragState.seat] ?? '')}
          </div>
        )}
      </div>
    );
  }
);
