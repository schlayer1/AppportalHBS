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
  fitMode?: 'fill' | 'contain';
  gridId?: string;
  onSeatTap?: (seatId: string) => void;
  onSwap?: (seatA: string, seatB: string) => void;
  onLockToggle?: (seatId: string) => void;
  onBackgroundTap?: () => void;
}

export interface SeatPlanExportMeta {
  title: string;
  subtitle: string;
  teacherPerspective: boolean;
  validFromDate: string;
  logoSrc?: string;
}

export function truncateSeatName(name: string, maxLen = 8): string {
  if (name.length <= maxLen) return name;
  const match = name.match(/^(.*?)\s+(\S{1,2}\.?)$/);
  if (match) {
    return match[1].slice(0, Math.max(3, maxLen - match[2].length - 2)) + '… ' + match[2];
  }
  return name.slice(0, maxLen - 1) + '…';
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function serializeSvgToImage(svgEl: SVGSVGElement): {
  img: HTMLImageElement;
  svgW: number;
  svgH: number;
} {
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
  const svgW = Math.max(100, vb.width || 1000);
  const svgH = Math.max(100, vb.height || 700);
  clone.setAttribute('width', String(svgW * 2));
  clone.setAttribute('height', String(svgH * 2));
  const serialized = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
  return { img, svgW, svgH };
}

/**
 * Erzeugt ein hochauflösendes DIN-A4-Querformat-Blatt (2339×1654 px)
 * mit HBS-Schullogo oben links, Titel, Perspektive, „Gültig ab“-Vermerk und Legende.
 */
export async function renderSeatPlanSheetCanvas(
  svgEl: SVGSVGElement,
  meta: SeatPlanExportMeta
): Promise<HTMLCanvasElement> {
  const W = 2339;
  const H = 1654;
  const PAD_X = 72;

  const { img: svgImg, svgW, svgH } = serializeSvgToImage(svgEl);
  await svgImg.decode();

  let logoImg: HTMLImageElement | null = null;
  try {
    const candidate = new Image();
    candidate.crossOrigin = 'anonymous';
    candidate.src = meta.logoSrc || '/Siegel_bunt.png';
    await candidate.decode();
    logoImg = candidate;
  } catch {
    logoImg = null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Zeichenfläche nicht verfügbar');

  // White paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  const fontSans = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  // Header Top-Left: School Logo + Title
  const logoSize = 114;
  if (logoImg) {
    ctx.drawImage(logoImg, PAD_X, 50, logoSize, logoSize);
  }
  const textX = logoImg ? PAD_X + logoSize + 24 : PAD_X;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.font = `800 22px ${fontSans}`;
  ctx.fillStyle = '#0B7BA7';
  ctx.fillText('HEIMBÜRGESCHULE KAHLA · SITZPLAN', textX, 54);

  ctx.font = `900 44px ${fontSans}`;
  ctx.fillStyle = '#0F293A';
  ctx.fillText(meta.title, textX, 86, 1180);

  if (meta.subtitle) {
    ctx.font = `600 23px ${fontSans}`;
    ctx.fillStyle = '#4A6572';
    ctx.fillText(meta.subtitle, textX, 140, 1180);
  }

  // Header Top-Right: Perspective Badge + "Gültig ab: ..."
  const badgeLabel = meta.teacherPerspective
    ? 'Lehrerperspektive (Tafel im Rücken)'
    : 'Schülerperspektive (Tafel oben)';
  ctx.font = `700 22px ${fontSans}`;
  const badgeTextW = ctx.measureText(badgeLabel).width;
  const badgeW = badgeTextW + 44;
  const badgeH = 44;
  const badgeX = W - PAD_X - badgeW;
  const badgeY = 54;

  drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 22);
  ctx.fillStyle = '#EBF7FC';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(11, 123, 167, 0.35)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0B7BA7';
  ctx.fillText(badgeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = `800 26px ${fontSans}`;
  ctx.fillStyle = '#0F293A';
  ctx.fillText(`Gültig ab: ${meta.validFromDate}`, W - PAD_X, 118);

  // Header Divider
  ctx.beginPath();
  ctx.moveTo(PAD_X, 198);
  ctx.lineTo(W - PAD_X, 198);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Room Frame
  const frameX = PAD_X;
  const frameY = 222;
  const frameW = W - PAD_X * 2;
  const frameH = H - frameY - 122;

  drawRoundedRectPath(ctx, frameX, frameY, frameW, frameH, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();

  const innerPad = 24;
  const availW = frameW - innerPad * 2;
  const availH = frameH - innerPad * 2;
  const scale = Math.min(availW / svgW, availH / svgH);
  const drawW = svgW * scale;
  const drawH = svgH * scale;
  const drawX = frameX + (frameW - drawW) / 2;
  const drawY = frameY + (frameH - drawH) / 2;
  ctx.drawImage(svgImg, drawX, drawY, drawW, drawH);

  // Footer Legend + Perspective Hint
  const footerY = H - 72;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Green ▲ badge
  ctx.beginPath();
  ctx.arc(PAD_X + 14, footerY, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#1B4D3E';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(PAD_X + 14, footerY - 6);
  ctx.lineTo(PAD_X + 20, footerY + 4);
  ctx.lineTo(PAD_X + 8, footerY + 4);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.font = `600 21px ${fontSans}`;
  ctx.fillStyle = '#4A6572';
  ctx.fillText('Nah an der Tafel', PAD_X + 36, footerY);

  // Free seat pill
  const freeX = PAD_X + 250;
  ctx.save();
  drawRoundedRectPath(ctx, freeX, footerY - 12, 36, 24, 8);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.font = `600 21px ${fontSans}`;
  ctx.fillStyle = '#4A6572';
  ctx.fillText('Freier Platz', freeX + 48, footerY);

  ctx.textAlign = 'right';
  ctx.fillText(
    meta.teacherPerspective
      ? 'Blickrichtung: Vom Lehrerpult/der Tafel in den Raum hinein'
      : 'Blickrichtung: Aus dem Raum zur Tafel',
    W - PAD_X,
    footerY
  );

  return canvas;
}

export async function exportSeatPlanSvgAsPng(
  svgEl: SVGSVGElement,
  fileName: string,
  meta?: SeatPlanExportMeta
): Promise<void> {
  const canvas = meta
    ? await renderSeatPlanSheetCanvas(svgEl, meta)
    : await (async () => {
        const { img, svgW, svgH } = serializeSvgToImage(svgEl);
        await img.decode();
        const c = document.createElement('canvas');
        c.width = svgW * 2;
        c.height = svgH * 2;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('Zeichenfläche nicht verfügbar');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        return c;
      })();

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${fileName.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.png`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => link.remove(), 5000);
}

/**
 * Baut eine standardkonforme DIN-A4-Querformat-PDF-1.4-Datei direkt im Browser
 * aus dem hochauflösenden Sitzplan-Canvas (ohne Abhängigkeit von window.print).
 */
export function buildA4LandscapePdfBlobFromJpeg(
  jpegBytes: Uint8Array,
  imgWidth: number,
  imgHeight: number
): Blob {
  const encoder = new TextEncoder();
  const pageW = '841.89';
  const pageH = '595.28';
  const contentStr = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentLen = encoder.encode(contentStr).length;

  const chunks: Uint8Array[] = [];
  let byteOffset = 0;
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    byteOffset += b.length;
  };
  const pushStr = (s: string) => pushBytes(encoder.encode(s));

  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const offsets: number[] = [0];

  offsets.push(byteOffset);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets.push(byteOffset);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets.push(byteOffset);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets.push(byteOffset);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  offsets.push(byteOffset);
  pushStr(`5 0 obj\n<< /Length ${contentLen} >>\nstream\n${contentStr}endstream\nendobj\n`);

  const xrefOffset = byteOffset;
  pushStr(`xref\n0 ${offsets.length}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const totalBytes = byteOffset;
  const pdfBuffer = new ArrayBuffer(totalBytes);
  const pdfBytes = new Uint8Array(pdfBuffer);
  let writePos = 0;
  for (const chunk of chunks) {
    pdfBytes.set(chunk, writePos);
    writePos += chunk.length;
  }

  return new Blob([pdfBuffer], { type: 'application/pdf' });
}

export async function exportSeatPlanSvgAsPdf(
  svgEl: SVGSVGElement,
  fileName: string,
  meta: SeatPlanExportMeta
): Promise<void> {
  const canvas = await renderSeatPlanSheetCanvas(svgEl, meta);
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PDF-Bilddaten konnten nicht erstellt werden.'))),
      'image/jpeg',
      0.94
    );
  });
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdfBlob = buildA4LandscapePdfBlobFromJpeg(jpegBytes, canvas.width, canvas.height);

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 5000);
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
      fitMode = 'fill',
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

    const isContain = fitMode === 'contain';
    return (
      <div className={isContain ? 'relative w-full flex items-center justify-center' : 'relative h-full w-full'}>
        <svg
          ref={ref}
          viewBox={`-42 -42 ${room.w + 84} ${room.h + 84}`}
          preserveAspectRatio="xMidYMid meet"
          className={
            isContain
              ? 'touch-none block w-full h-auto max-h-[54vh] print:max-h-[145mm]'
              : 'touch-none h-full w-full'
          }
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
