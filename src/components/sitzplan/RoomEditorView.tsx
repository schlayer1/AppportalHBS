import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  BookOpen,
  Copy,
  DoorOpen,
  Droplets,
  GripHorizontal,
  HelpCircle,
  Layers,
  Layers2,
  LayoutGrid,
  LayoutTemplate,
  Library,
  Monitor,
  PanelLeft,
  PenLine,
  Presentation,
  RectangleHorizontal,
  RotateCw,
  Rows3,
  Save,
  Square,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  FixtureItem,
  FixtureKind,
  RoomLayout,
  RoomTemplate,
  SitzplanClass,
  TableItem,
  TableKind,
} from '../../types/sitzplanTypes';
import {
  EXPERT_HIDDEN_IN_SIMPLE,
  FIXTURE_SPECS,
  ROOM_TEMPLATE_PRESETS,
  RESIZABLE_FIXTURES,
  RoomTemplatePresetId,
  SIMPLE_FIXTURES,
  TABLE_SPECS,
  WALL_DOCKED_FIXTURES,
  bringToFrontOrBack,
  buildSeatGraph,
  clampToRoom,
  dockToWall,
  genId,
  generateRoomFromTemplate,
  getRoomSeats,
  normalizeTableSpec,
  orderRoomObjects,
  recognizeDrawnTable,
  resizeRoom,
  rotateOffset,
} from './sitzplanEngine';
import {
  FixtureShape,
  RoomFloor,
  SITZPLAN_PALETTE,
  TableShape,
  TouchWorkspace,
  useIsMobileViewport,
} from './RoomSvgElements';

interface RoomEditorViewProps {
  cls: SitzplanClass;
  expert: boolean;
  roomTemplates: RoomTemplate[];
  onUpdateRoom: (fn: (r: RoomLayout) => RoomLayout) => void;
  onUpsertTable: (t: TableItem) => void;
  onRemoveTable: (id: string) => void;
  onUpsertFixture: (f: FixtureItem) => void;
  onRemoveFixture: (id: string) => void;
  onSaveRoomTemplate: (name: string, room: RoomLayout) => void;
  onRemoveRoomTemplate: (id: string) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'warn') => void;
}

const TABLE_KINDS: TableKind[] = ['single', 'pair', 'group', 'row'];
const TABLE_ICONS: Record<TableKind, React.ComponentType<{ className?: string }>> = {
  single: Square,
  pair: RectangleHorizontal,
  group: LayoutGrid,
  row: Rows3,
};

const FIXTURE_ICONS: Record<FixtureKind, React.ComponentType<{ className?: string }>> = {
  board: Presentation,
  desk: Monitor,
  door: DoorOpen,
  window: PanelLeft,
  cabinet: Archive,
  sink: Droplets,
  carpet: Square,
  bin: Trash2,
  stool: Square,
  readingTable: BookOpen,
  bookshelf: Library,
  bench: RectangleHorizontal,
};

const SNAP_DIST = 12;
const TOOLBAR_POS_KEY = 'hbs_sitzplan_room_toolbar_pos';

const formatMeters = (cm: number) =>
  (cm / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

export const RoomEditorView: React.FC<RoomEditorViewProps> = ({
  cls,
  expert,
  roomTemplates,
  onUpdateRoom,
  onUpsertTable,
  onRemoveTable,
  onUpsertFixture,
  onRemoveFixture,
  onSaveRoomTemplate,
  onRemoveRoomTemplate,
  onNotify,
}) => {
  const isMobile = useIsMobileViewport();
  const room = cls.room;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [drawEnabledMobile, setDrawEnabledMobile] = useState(false);
  const canDraw = !isMobile || drawEnabledMobile;

  const [selected, setSelected] = useState<{ type: 'table' | 'fixture'; id: string } | null>(null);
  const [drawPoints, setDrawPoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    item: { kind?: TableKind; fixture?: FixtureKind };
    x: number;
    y: number;
    sx: number;
    sy: number;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number }>({});
  const [undoStack, setUndoStack] = useState<RoomLayout[]>([]);
  const [tempViewBox, setTempViewBox] = useState<string | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  // Confirm / Prompt inline modals (no native window.confirm/prompt)
  const [confirmState, setConfirmState] = useState<{
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [templateNameModal, setTemplateNameModal] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarDragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeEdgeRef = useRef<'r' | 'b' | 'rb' | null>(null);
  const objectDragRef = useRef<{
    mode: 'move' | 'rotate' | 'resize';
    type: 'table' | 'fixture';
    id: string;
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);

  const frontSeats = useMemo(() => {
    const g = buildSeatGraph(room);
    return g.seats.filter((s) => g.front.has(s.id));
  }, [room]);

  const totalSeats = useMemo(() => getRoomSeats(room).length, [room]);

  const selectedTable =
    selected?.type === 'table'
      ? room.tables.find((t) => t.id === selected.id)
      : undefined;
  const selectedFixture =
    selected?.type === 'fixture'
      ? room.fixtures.find((f) => f.id === selected.id)
      : undefined;
  const selectedAny = selectedTable ?? selectedFixture;

  const visibleRoom = useMemo(
    () =>
      expert
        ? room
        : {
            ...room,
            fixtures: room.fixtures.filter((f) => !EXPERT_HIDDEN_IN_SIMPLE.includes(f.kind)),
          },
    [room, expert]
  );

  // Restore saved toolbar position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TOOLBAR_POS_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        setToolbarPos({
          x: Math.max(0, Math.min(parsed.x, window.innerWidth - 420)),
          y: Math.max(0, Math.min(parsed.y, window.innerHeight - 200)),
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-29), structuredClone(room)]);
  };

  const handleUndo = () => {
    const prevRoom = undoStack[undoStack.length - 1];
    if (!prevRoom) return;
    setUndoStack((s) => s.slice(0, -1));
    onUpdateRoom(() => prevRoom);
    setSelected(null);
  };

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const getObj = (type: 'table' | 'fixture', id: string) =>
    type === 'table'
      ? room.tables.find((t) => t.id === id)
      : room.fixtures.find((f) => f.id === id);

  const snapAndClamp = (
    obj: { id: string; w: number; h: number; rot: number },
    rawX: number,
    rawY: number
  ) => {
    const halfExtents = (o: { w: number; h: number; rot: number }) =>
      Math.round(o.rot / 90) % 2 === 1
        ? { ew: o.h / 2, eh: o.w / 2 }
        : { ew: o.w / 2, eh: o.h / 2 };

    const { ew, eh } = halfExtents(obj);
    let sx = Math.round(rawX / 10) * 10;
    let sy = Math.round(rawY / 10) * 10;
    let guideX: number | undefined;
    let guideY: number | undefined;
    let bestDx = SNAP_DIST;
    let bestDy = SNAP_DIST;

    for (const other of room.tables) {
      if (other.id === obj.id) continue;
      const oe = halfExtents(other);
      for (const anchorX of [other.x - oe.ew, other.x, other.x + oe.ew]) {
        for (const offset of [-ew, 0, ew]) {
          const d = Math.abs(rawX + offset - anchorX);
          if (d < bestDx) {
            bestDx = d;
            sx = anchorX - offset;
            guideX = anchorX;
          }
        }
      }
      for (const anchorY of [other.y - oe.eh, other.y, other.y + oe.eh]) {
        for (const offset of [-eh, 0, eh]) {
          const d = Math.abs(rawY + offset - anchorY);
          if (d < bestDy) {
            bestDy = d;
            sy = anchorY - offset;
            guideY = anchorY;
          }
        }
      }
    }
    setSnapGuides({ x: guideX, y: guideY });
    return clampToRoom(obj, sx, sy, room.w, room.h);
  };

  const startObjDrag = (
    e: React.PointerEvent,
    type: 'table' | 'fixture',
    id: string,
    mode: 'move' | 'rotate' | 'resize' = 'move'
  ) => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    const pt = toSvgCoords(e.clientX, e.clientY);
    const target = getObj(type, id);
    if (!target) return;
    setSelected({ type, id });
    objectDragRef.current = {
      mode,
      type,
      id,
      dx: pt.x - target.x,
      dy: pt.y - target.y,
      moved: false,
    };
  };

  const startRoomResize = (e: React.PointerEvent, edge: 'r' | 'b' | 'rb') => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    pushUndo();
    setSelected(null);
    resizeEdgeRef.current = edge;
    setTempViewBox(`-30 -30 ${Math.max(room.w, 1200) + 120} ${Math.max(room.h, 900) + 120}`);
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canDraw) {
      if (e.target === e.currentTarget) setSelected(null);
      return;
    }
    if (drawPoints) {
      setDrawPoints(null);
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrawPoints([toSvgCoords(e.clientX, e.clientY)]);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toSvgCoords(e.clientX, e.clientY);
    if (resizeEdgeRef.current) {
      const edge = resizeEdgeRef.current;
      onUpdateRoom((r) =>
        resizeRoom(r, edge === 'b' ? r.w : pt.x, edge === 'r' ? r.h : pt.y)
      );
      return;
    }
    if (drawPoints) {
      setDrawPoints((prev) => (prev ? [...prev, pt] : prev));
      return;
    }
    const drag = objectDragRef.current;
    if (!drag) return;
    const obj = getObj(drag.type, drag.id);
    if (!obj) return;
    if (!drag.moved) {
      pushUndo();
      drag.moved = true;
    }

    if (drag.type === 'table') {
      const next: TableItem = { ...(obj as TableItem) };
      if (drag.mode === 'move') {
        Object.assign(next, snapAndClamp(next, pt.x - drag.dx, pt.y - drag.dy));
      } else if (drag.mode === 'rotate') {
        const deg = (Math.atan2(pt.y - next.y, pt.x - next.x) * 180) / Math.PI + 90;
        next.rot = ((Math.round(deg / 15) * 15) % 360 + 360) % 360;
        Object.assign(next, clampToRoom(next, next.x, next.y, room.w, room.h));
      }
      onUpsertTable(next);
    } else {
      const next: FixtureItem = { ...(obj as FixtureItem) };
      const isWall = WALL_DOCKED_FIXTURES.includes(next.kind);
      if (drag.mode === 'move') {
        if (isWall) {
          Object.assign(next, dockToWall(next, pt.x - drag.dx, pt.y - drag.dy, room.w, room.h));
        } else {
          Object.assign(next, snapAndClamp(next, pt.x - drag.dx, pt.y - drag.dy));
        }
      } else if (drag.mode === 'rotate') {
        const deg = (Math.atan2(pt.y - next.y, pt.x - next.x) * 180) / Math.PI + 90;
        next.rot = ((Math.round(deg / 15) * 15) % 360 + 360) % 360;
        if (isWall) {
          next.rot = dockToWall(next, next.x, next.y, room.w, room.h).rot;
        } else {
          Object.assign(next, clampToRoom(next, next.x, next.y, room.w, room.h));
        }
      } else if (drag.mode === 'resize') {
        const rad = (-next.rot * Math.PI) / 180;
        const lx = (pt.x - next.x) * Math.cos(rad) - (pt.y - next.y) * Math.sin(rad);
        const ly = (pt.x - next.x) * Math.sin(rad) + (pt.y - next.y) * Math.cos(rad);
        const minSize = next.kind === 'carpet' ? { w: 80, h: 60 } : { w: 50, h: 30 };
        next.w = Math.round(Math.max(minSize.w, Math.min(Math.max(room.w, room.h), 2 * Math.abs(lx))) / 10) * 10;
        next.h = Math.round(Math.max(minSize.h, Math.min(Math.max(room.w, room.h), 2 * Math.abs(ly))) / 10) * 10;
        Object.assign(next, clampToRoom(next, next.x, next.y, room.w, room.h));
      }
      onUpsertFixture(next);
    }
  };

  const handleSvgPointerUp = () => {
    if (resizeEdgeRef.current) {
      resizeEdgeRef.current = null;
      setTempViewBox(null);
      return;
    }
    objectDragRef.current = null;
    setSnapGuides({});
    if (!drawPoints) return;

    const recognized = drawPoints.length > 4 ? recognizeDrawnTable(drawPoints) : null;
    setDrawPoints(null);
    if (!recognized) {
      setSelected(null);
      return;
    }
    pushUndo();
    const tbl = normalizeTableSpec({
      id: genId('t'),
      kind: recognized.kind,
      x: Math.round(Math.min(room.w, Math.max(0, recognized.x))),
      y: Math.round(Math.min(room.h, Math.max(0, recognized.y))),
      w: 0,
      h: 0,
      rot: ((Math.round(recognized.rot / 15) * 15) % 360 + 360) % 360,
      seats: 0,
    });
    onUpsertTable({ ...tbl, ...clampToRoom(tbl, tbl.x, tbl.y, room.w, room.h) });
    setSelected({ type: 'table', id: tbl.id });
  };

  const addItemAt = (
    item: { kind?: TableKind; fixture?: FixtureKind },
    pos?: { x: number; y: number }
  ) => {
    setPaletteOpen(false);
    pushUndo();
    const p = pos ?? { x: room.w / 2, y: room.h / 2 };
    if (item.kind) {
      const tbl = normalizeTableSpec({
        id: genId('t'),
        kind: item.kind,
        x: Math.round(p.x),
        y: Math.round(p.y),
        w: 0,
        h: 0,
        rot: 0,
        seats: 0,
      });
      const clamped = clampToRoom(tbl, tbl.x, tbl.y, room.w, room.h);
      onUpsertTable({ ...tbl, ...clamped });
      setSelected({ type: 'table', id: tbl.id });
    } else if (item.fixture) {
      const spec = FIXTURE_SPECS[item.fixture];
      const base: FixtureItem = {
        id: genId('f'),
        kind: item.fixture,
        x: Math.round(p.x),
        y: Math.round(p.y),
        w: spec.w,
        h: spec.h,
        rot: 0,
      };
      const docked = WALL_DOCKED_FIXTURES.includes(base.kind)
        ? dockToWall(base, p.x, p.y, room.w, room.h)
        : clampToRoom(base, p.x, p.y, room.w, room.h);
      onUpsertFixture({ ...base, ...docked });
      setSelected({ type: 'fixture', id: base.id });
    }
  };

  // Drag ghost from desktop palette
  useEffect(() => {
    if (!dragGhost) return;
    const onMove = (e: PointerEvent) => {
      setDragGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : null));
    };
    const onUp = (e: PointerEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const movedShort = Math.hypot(e.clientX - dragGhost.sx, e.clientY - dragGhost.sy) < 8;
      if (movedShort) {
        addItemAt(dragGhost.item);
      } else if (
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        addItemAt(dragGhost.item, toSvgCoords(e.clientX, e.clientY));
      }
      setDragGhost(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragGhost]);

  // Keyboard shortcuts (Undo / Delete)
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('input,textarea,select,[contenteditable]')) return;
    if (document.querySelector('[role="dialog"],[role="menu"],[role="alertdialog"]')) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }
    if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
      deleteSelected();
    }
  };
  useEffect(() => {
    const fn = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const deleteSelected = () => {
    if (!selected) return;
    pushUndo();
    if (selected.type === 'table') onRemoveTable(selected.id);
    else onRemoveFixture(selected.id);
    setSelected(null);
  };

  const rotate90Selected = () => {
    pushUndo();
    if (selectedTable) {
      const next = { ...selectedTable, rot: (selectedTable.rot + 90) % 360 };
      onUpsertTable({ ...next, ...clampToRoom(next, next.x, next.y, room.w, room.h) });
    } else if (selectedFixture && !WALL_DOCKED_FIXTURES.includes(selectedFixture.kind)) {
      const next = { ...selectedFixture, rot: (selectedFixture.rot + 90) % 360 };
      onUpsertFixture({ ...next, ...clampToRoom(next, next.x, next.y, room.w, room.h) });
    }
  };

  const duplicateSelected = () => {
    if (!selectedTable) return;
    pushUndo();
    const copy: TableItem = {
      ...selectedTable,
      id: genId('t'),
      ...clampToRoom(selectedTable, selectedTable.x + 40, selectedTable.y + 40, room.w, room.h),
    };
    onUpsertTable(copy);
    setSelected({ type: 'table', id: copy.id });
  };

  const changeTableKind = (kind: TableKind) => {
    if (!selectedTable) return;
    pushUndo();
    const next = normalizeTableSpec({ ...selectedTable, kind });
    onUpsertTable({ ...next, ...clampToRoom(next, next.x, next.y, room.w, room.h) });
  };

  const reorderZ = (dir: 'front' | 'back') => {
    if (!selected) return;
    pushUndo();
    onUpdateRoom((r) => bringToFrontOrBack(r, selected.id, dir));
    setSelected(null);
  };

  const applyPresetTemplate = (presetId: RoomTemplatePresetId) => {
    setTemplatesOpen(false);
    const apply = () => {
      pushUndo();
      onUpdateRoom((r) => generateRoomFromTemplate(presetId, r, cls.students.length));
      setSelected(null);
    };
    if (room.tables.length > 0) {
      setConfirmState({
        message: 'Vorhandene Tische durch die Vorlage ersetzen? (Rückgängig ist möglich)',
        confirmLabel: 'Ersetzen',
        onConfirm: () => {
          setConfirmState(null);
          apply();
        },
      });
    } else {
      apply();
    }
  };

  const applySavedTemplate = (tpl: RoomTemplate) => {
    setTemplatesOpen(false);
    const apply = () => {
      pushUndo();
      const cloned = structuredClone(tpl.room);
      const stamp = genId('');
      cloned.tables = cloned.tables.map((t) => ({ ...t, id: `t${stamp}${t.id}` }));
      cloned.fixtures = cloned.fixtures.map((f) => ({ ...f, id: `f${stamp}${f.id}` }));
      onUpdateRoom(() => cloned);
      setSelected(null);
    };
    if (room.tables.length > 0 || room.fixtures.length > 0) {
      setConfirmState({
        message: `Raum durch „${tpl.name}“ ersetzen? (Rückgängig ist möglich)`,
        confirmLabel: 'Ersetzen',
        onConfirm: () => {
          setConfirmState(null);
          apply();
        },
      });
    } else {
      apply();
    }
  };

  const visibleFixtures = (Object.keys(FIXTURE_SPECS) as FixtureKind[]).filter(
    (k) => expert || SIMPLE_FIXTURES.includes(k)
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 bg-hbs-bg">
      {/* Left Furniture Palette */}
      <aside
        aria-label="Möbel"
        className={`w-[8.8rem] shrink-0 auto-rows-min grid-cols-2 content-start gap-1.5 overflow-y-auto border-r border-hbs-slate-border bg-white p-2 ${
          paletteOpen ? 'grid fixed inset-y-0 left-0 z-40 shadow-2xl pt-4' : 'hidden md:grid'
        }`}
      >
        <div className="col-span-full flex items-center justify-between md:hidden mb-1">
          <span className="text-sm font-black text-hbs-slate-dark">Möbel</span>
          <button
            type="button"
            aria-label="Möbelauswahl schließen"
            onClick={() => setPaletteOpen(false)}
            className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-hbs-blue-soft"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleUndo}
          disabled={!undoStack.length}
          className="hidden md:flex w-full min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold text-hbs-slate hover:bg-hbs-blue-soft hover:text-hbs-blue disabled:opacity-35 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          <span>Rückgängig</span>
        </button>

        <button
          type="button"
          onClick={() => setTemplatesOpen((v) => !v)}
          className="col-span-full md:col-span-1 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-hbs-blue bg-hbs-blue-soft/70 hover:bg-hbs-blue-soft md:flex-col md:gap-0.5 md:py-1.5 md:text-[11px] transition-colors"
        >
          <LayoutTemplate className="w-4 h-4 text-hbs-blue" />
          <span>Vorlagen</span>
        </button>

        <div className="col-span-2 my-1 h-px bg-hbs-slate-border/70" />

        {TABLE_KINDS.map((kind) => {
          const Icon = TABLE_ICONS[kind];
          return (
            <button
              key={kind}
              type="button"
              aria-label={TABLE_SPECS[kind].label}
              onClick={() => (isMobile ? addItemAt({ kind }) : undefined)}
              onPointerDown={(e) => {
                if (isMobile) return;
                e.preventDefault();
                setPaletteOpen(false);
                setDragGhost({
                  item: { kind },
                  x: e.clientX,
                  y: e.clientY,
                  sx: e.clientX,
                  sy: e.clientY,
                });
              }}
              className={`flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-hbs-slate-border/80 bg-hbs-bg/60 px-1 py-2 text-center text-[10.5px] font-bold leading-tight text-hbs-slate-dark transition-colors hover:border-hbs-blue/40 hover:bg-hbs-blue-soft ${
                isMobile ? 'touch-pan-y' : 'touch-none cursor-grab active:cursor-grabbing'
              }`}
            >
              <Icon className="w-4 h-4 text-hbs-blue" />
              <span>{TABLE_SPECS[kind].label}</span>
            </button>
          );
        })}

        <div className="col-span-2 my-1 h-px bg-hbs-slate-border/70" />

        {visibleFixtures.map((fk) => {
          const Icon = FIXTURE_ICONS[fk];
          return (
            <button
              key={fk}
              type="button"
              aria-label={FIXTURE_SPECS[fk].label}
              onClick={() => (isMobile ? addItemAt({ fixture: fk }) : undefined)}
              onPointerDown={(e) => {
                if (isMobile) return;
                e.preventDefault();
                setPaletteOpen(false);
                setDragGhost({
                  item: { fixture: fk },
                  x: e.clientX,
                  y: e.clientY,
                  sx: e.clientX,
                  sy: e.clientY,
                });
              }}
              className={`flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-hbs-slate-border/80 bg-hbs-bg/60 px-1 py-2 text-center text-[10.5px] font-bold leading-tight text-hbs-slate-dark transition-colors hover:border-hbs-teal/40 hover:bg-hbs-teal-light ${
                isMobile ? 'touch-pan-y' : 'touch-none cursor-grab active:cursor-grabbing'
              }`}
            >
              <Icon className="w-4 h-4 text-hbs-teal" />
              <span>{FIXTURE_SPECS[fk].label}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Canvas Section */}
      <section ref={sectionRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-2 sm:p-3">
        {/* Top Bar inside Room Editor */}
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs sm:text-sm text-hbs-slate-muted shrink-0">
          <span className="min-w-0">
            <strong className="font-black text-hbs-slate-dark">{room.tables.length}</strong> Tische ·{' '}
            <strong className="font-black text-hbs-slate-dark">{totalSeats}</strong> Plätze (
            <span className="text-hbs-teal font-bold">▲ {frontSeats.length}</span> vorne)
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Rückgängig"
              disabled={!undoStack.length}
              onClick={handleUndo}
              className="md:hidden min-h-[44px] min-w-[44px] grid place-items-center rounded-xl bg-white border border-hbs-slate-border text-hbs-slate disabled:opacity-35"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              aria-label="Möbel und Vorlagen"
              onClick={() => setPaletteOpen((v) => !v)}
              className="md:hidden min-h-[44px] px-3 rounded-xl bg-hbs-blue text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Möbel</span>
            </button>

            <button
              type="button"
              aria-pressed={drawEnabledMobile}
              onClick={() => {
                setDrawEnabledMobile((v) => !v);
                setDrawPoints(null);
              }}
              className={`md:hidden min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                drawEnabledMobile
                  ? 'bg-hbs-amber text-white border-hbs-amber'
                  : 'bg-white text-hbs-slate border-hbs-slate-border'
              }`}
            >
              <PenLine className="w-4 h-4" />
              <span>{drawEnabledMobile ? 'Zeichnen an' : 'Zeichnen'}</span>
            </button>

            {(room.tables.length > 0 || room.fixtures.length > 0) && (
              <button
                type="button"
                aria-label="Raum leeren"
                onClick={() =>
                  setConfirmState({
                    message: 'Alle Tische und Einrichtung aus dem Raum entfernen?',
                    confirmLabel: 'Leeren',
                    danger: true,
                    onConfirm: () => {
                      setConfirmState(null);
                      pushUndo();
                      onUpdateRoom((r) => ({ ...r, tables: [], fixtures: [] }));
                      setSelected(null);
                    },
                  })
                }
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Leeren</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                aria-label="Hilfe zum Raumeditor"
                onClick={() => setHelpOpen((v) => !v)}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl bg-white border border-hbs-slate-border text-hbs-slate-muted hover:text-hbs-blue hover:border-hbs-blue/40 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {helpOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setHelpOpen(false)} />
                  <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-hbs-slate-border bg-white p-4 shadow-hbs-modal text-xs text-hbs-slate space-y-2">
                    <p className="font-black text-hbs-slate-dark text-sm">So richtest du den Raum ein</p>
                    <ul className="space-y-1.5 list-disc pl-4">
                      <li><strong>Zeichnen:</strong> Freie Fläche umranden – erzeugt automatisch den passenden Tisch.</li>
                      <li><strong>Hinzufügen:</strong> Aus der Leiste links in den Raum ziehen.</li>
                      <li><strong>Verschieben:</strong> Objekt direkt greifen (mit magnetischer Ausrichtung).</li>
                      <li><strong>Antippen:</strong> Tischart ändern, Drehen, Duplizieren, Löschen.</li>
                      <li><strong>Wand:</strong> Tafel, Tür, Fenster &amp; Waschbecken docken an Wänden an.</li>
                      {expert && (
                        <li><strong>Raumgröße:</strong> An den blauen Griffen ziehen (bis 20 × 20 m).</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SVG Room Floor Canvas */}
        <TouchWorkspace drawing={canDraw}>
          <svg
            ref={svgRef}
            viewBox={tempViewBox ?? `-30 -30 ${room.w + 60} ${room.h + 60}`}
            className={`min-h-0 w-full flex-1 rounded-2xl bg-white/80 border border-hbs-slate-border shadow-hbs-card ${
              canDraw ? 'touch-none cursor-crosshair' : 'touch-manipulation'
            }`}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={() => {
              setDrawPoints(null);
              objectDragRef.current = null;
              resizeEdgeRef.current = null;
              setTempViewBox(null);
              setSnapGuides({});
            }}
          >
            <RoomFloor w={room.w} h={room.h} gridId="hbs-room-editor-grid" />

            {orderRoomObjects(visibleRoom, selected?.id).map((entry) => (
              <g
                key={entry.object.id}
                data-room-object={entry.object.id}
                data-object-kind={entry.object.kind}
                onPointerDown={(e) => startObjDrag(e, entry.type, entry.object.id, 'move')}
                style={{ cursor: 'move' }}
              >
                {entry.type === 'fixture' ? (
                  <FixtureShape
                    f={entry.object}
                    selected={selected?.id === entry.object.id}
                  />
                ) : (
                  <TableShape
                    t={entry.object}
                    selected={selected?.id === entry.object.id}
                    showSeats
                  />
                )}
              </g>
            ))}

            {/* Front seats indicators */}
            {frontSeats.map((s) => (
              <g
                key={s.id}
                transform={`translate(${s.x} ${s.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <circle r={6} fill={SITZPLAN_PALETTE.board} />
                <path d="M0 -3 L2.7 1.8 H-2.7 Z" fill="#FFFFFF" />
              </g>
            ))}

            {/* Alignment guides */}
            {snapGuides.x !== undefined && (
              <line
                x1={snapGuides.x}
                x2={snapGuides.x}
                y1={0}
                y2={room.h}
                stroke={SITZPLAN_PALETTE.primary}
                strokeDasharray="6 6"
                strokeWidth={2}
              />
            )}
            {snapGuides.y !== undefined && (
              <line
                y1={snapGuides.y}
                y2={snapGuides.y}
                x1={0}
                x2={room.w}
                stroke={SITZPLAN_PALETTE.primary}
                strokeDasharray="6 6"
                strokeWidth={2}
              />
            )}

            {/* Rotate handle */}
            {selectedAny &&
              !(selectedFixture && WALL_DOCKED_FIXTURES.includes(selectedFixture.kind)) && (() => {
                const offset = rotateOffset(0, -selectedAny.h / 2 - 60, selectedAny.rot);
                return (
                  <g>
                    <line
                      x1={selectedAny.x}
                      y1={selectedAny.y}
                      x2={selectedAny.x + offset.x}
                      y2={selectedAny.y + offset.y}
                      stroke={SITZPLAN_PALETTE.primary}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={selectedAny.x + offset.x}
                      cy={selectedAny.y + offset.y}
                      r={20}
                      fill="#FFFFFF"
                      stroke={SITZPLAN_PALETTE.primary}
                      strokeWidth={3}
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) =>
                        startObjDrag(e, selected!.type, selected!.id, 'rotate')
                      }
                    />
                  </g>
                );
              })()}

            {/* Resize handle (carpet & cabinet in Erweitert) */}
            {expert &&
              selectedFixture &&
              RESIZABLE_FIXTURES.includes(selectedFixture.kind) && (() => {
                const corner = rotateOffset(
                  selectedFixture.w / 2,
                  selectedFixture.h / 2,
                  selectedFixture.rot
                );
                return (
                  <g
                    transform={`translate(${selectedFixture.x + corner.x} ${selectedFixture.y + corner.y})`}
                    style={{ cursor: 'nwse-resize' }}
                    onPointerDown={(e) =>
                      startObjDrag(e, 'fixture', selectedFixture.id, 'resize')
                    }
                  >
                    <circle r={18} fill={SITZPLAN_PALETTE.primary} stroke="#FFFFFF" strokeWidth={3} />
                    <path
                      d="M-6 6 L6 -6 M1 -6 H6 V-1 M-6 1 V6 H-1"
                      stroke="#FFFFFF"
                      strokeWidth={2.2}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })()}

            {/* Room size handles (Erweitert) */}
            {expert && (
              <g>
                <text
                  x={room.w / 2}
                  y={-10}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="#4A5568"
                  style={{ pointerEvents: 'none' }}
                >
                  {formatMeters(room.w)} m
                </text>
                <text
                  x={-10}
                  y={room.h / 2}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="#4A5568"
                  transform={`rotate(-90 -10 ${room.h / 2})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {formatMeters(room.h)} m
                </text>
                {/* Right edge */}
                <g
                  transform={`translate(${room.w} ${room.h / 2})`}
                  style={{ cursor: 'ew-resize' }}
                  onPointerDown={(e) => startRoomResize(e, 'r')}
                >
                  <rect x={-22} y={-40} width={44} height={80} fill="transparent" />
                  <rect
                    x={-7}
                    y={-28}
                    width={14}
                    height={56}
                    rx={7}
                    fill={SITZPLAN_PALETTE.primary}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  />
                </g>
                {/* Bottom edge */}
                <g
                  transform={`translate(${room.w / 2} ${room.h})`}
                  style={{ cursor: 'ns-resize' }}
                  onPointerDown={(e) => startRoomResize(e, 'b')}
                >
                  <rect x={-40} y={-22} width={80} height={44} fill="transparent" />
                  <rect
                    x={-28}
                    y={-7}
                    width={56}
                    height={14}
                    rx={7}
                    fill={SITZPLAN_PALETTE.primary}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  />
                </g>
                {/* Corner */}
                <g
                  transform={`translate(${room.w} ${room.h})`}
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={(e) => startRoomResize(e, 'rb')}
                >
                  <circle r={26} fill="transparent" />
                  <circle r={13} fill={SITZPLAN_PALETTE.primary} stroke="#FFFFFF" strokeWidth={3} />
                </g>
              </g>
            )}

            {/* Freehand Draw Stroke */}
            {drawPoints && (
              <polyline
                points={drawPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={SITZPLAN_PALETTE.primary}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </TouchWorkspace>

        {/* Selection Floating Toolbar */}
        {selectedAny && (
          <div
            ref={toolbarRef}
            style={!isMobile && toolbarPos ? { left: toolbarPos.x, top: toolbarPos.y } : undefined}
            onPointerMove={(e) => {
              const drag = toolbarDragRef.current;
              const tb = toolbarRef.current;
              const sec = sectionRef.current;
              if (!drag || !tb || !sec) return;
              const tbRect = tb.getBoundingClientRect();
              const secRect = sec.getBoundingClientRect();
              setToolbarPos({
                x: Math.max(0, Math.min(e.clientX - secRect.left - drag.dx, secRect.width - tbRect.width)),
                y: Math.max(0, Math.min(e.clientY - secRect.top - drag.dy, secRect.height - tbRect.height)),
              });
            }}
            onPointerUp={() => {
              if (!toolbarDragRef.current) return;
              toolbarDragRef.current = null;
              if (toolbarPos) {
                try {
                  localStorage.setItem(TOOLBAR_POS_KEY, JSON.stringify(toolbarPos));
                } catch {
                  // ignore
                }
              }
            }}
            className={`absolute z-20 flex max-w-[96%] flex-wrap items-center justify-center gap-1 rounded-2xl border border-hbs-slate-border bg-white/95 backdrop-blur p-1.5 shadow-hbs-modal ${
              !toolbarPos ? 'bottom-4 left-1/2 -translate-x-1/2' : ''
            }`}
          >
            <button
              type="button"
              aria-label="Werkzeugleiste verschieben"
              onPointerDown={(e) => {
                e.stopPropagation();
                const tb = toolbarRef.current;
                const sec = sectionRef.current;
                if (!tb || !sec) return;
                const tbRect = tb.getBoundingClientRect();
                const secRect = sec.getBoundingClientRect();
                toolbarDragRef.current = {
                  dx: e.clientX - tbRect.left,
                  dy: e.clientY - tbRect.top,
                };
                setToolbarPos({
                  x: tbRect.left - secRect.left,
                  y: tbRect.top - secRect.top,
                });
                e.currentTarget.setPointerCapture?.(e.pointerId);
              }}
              className="hidden md:flex h-11 w-6 touch-none items-center justify-center rounded-xl text-hbs-slate-muted hover:bg-hbs-blue-soft cursor-grab"
            >
              <GripHorizontal className="w-4 h-4" />
            </button>

            {selectedTable ? (
              TABLE_KINDS.map((kind) => {
                const Icon = TABLE_ICONS[kind];
                const active = selectedTable.kind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => changeTableKind(kind)}
                    className={`flex h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 text-[10.5px] font-bold transition-colors ${
                      active
                        ? 'border-hbs-blue bg-hbs-blue-light text-hbs-blue'
                        : 'border-transparent hover:bg-hbs-blue-soft text-hbs-slate'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{TABLE_SPECS[kind].label}</span>
                  </button>
                );
              })
            ) : (
              <span className="px-3 text-xs font-black text-hbs-slate-dark">
                {FIXTURE_SPECS[selectedFixture!.kind].label}
              </span>
            )}

            <div className="mx-1 h-8 w-px bg-hbs-slate-border" />

            {!(selectedFixture && WALL_DOCKED_FIXTURES.includes(selectedFixture.kind)) && (
              <button
                type="button"
                aria-label="Um 90° drehen"
                title="Um 90° drehen"
                onClick={rotate90Selected}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-hbs-blue-soft hover:text-hbs-blue"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {expert && selectedFixture?.kind !== 'carpet' && (
              <>
                <button
                  type="button"
                  aria-label="Nach vorne"
                  title="Nach vorne"
                  onClick={() => reorderZ('front')}
                  className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-hbs-blue-soft"
                >
                  <Layers2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Nach hinten"
                  title="Nach hinten"
                  onClick={() => reorderZ('back')}
                  className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-hbs-blue-soft"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </>
            )}

            {selectedTable && (
              <button
                type="button"
                aria-label="Duplizieren"
                title="Duplizieren"
                onClick={duplicateSelected}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-hbs-slate-border bg-white text-hbs-slate hover:bg-hbs-blue-soft hover:text-hbs-blue"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              aria-label="Löschen"
              title="Löschen"
              onClick={deleteSelected}
              className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              aria-label="Auswahl aufheben"
              onClick={() => setSelected(null)}
              className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* Templates Popover/Drawer */}
      {templatesOpen && (
        <div
          className="fixed inset-0 z-40 bg-hbs-slate-dark/30 backdrop-blur-[1px]"
          onClick={() => setTemplatesOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-3 right-3 bottom-20 md:bottom-auto md:right-auto md:left-36 md:top-24 max-h-[calc(100dvh-8rem)] w-auto md:w-72 space-y-1 overflow-y-auto rounded-2xl border border-hbs-slate-border bg-white p-3 shadow-hbs-modal"
          >
            <p className="px-2 pb-1 text-xs text-hbs-slate-muted">
              {cls.students.length > 0 ? (
                <>
                  Vorlage passend für{' '}
                  <strong className="text-hbs-slate-dark">{cls.students.length} Kinder</strong>
                </>
              ) : (
                'Vorlage für 24 Plätze – lege zuerst Kinder an, dann passt sie sich an'
              )}
            </p>
            {ROOM_TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPresetTemplate(preset.id)}
                className="block w-full min-h-[44px] rounded-xl px-3 py-2 text-left hover:bg-hbs-blue-soft transition-colors"
              >
                <span className="block text-sm font-bold text-hbs-slate-dark">
                  {preset.label}
                </span>
                <span className="block text-xs text-hbs-slate-muted">{preset.hint}</span>
              </button>
            ))}

            <div className="my-2 h-px bg-hbs-slate-border" />

            <button
              type="button"
              disabled={!room.tables.length && !room.fixtures.length}
              onClick={() => {
                setTemplatesOpen(false);
                setTemplateNameModal(cls.name ? `${cls.name}-Raum` : 'Mein Raum');
              }}
              className="flex w-full min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-hbs-blue hover:bg-hbs-blue-soft disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>Aktuellen Raum speichern</span>
            </button>

            {roomTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center rounded-xl hover:bg-hbs-blue-soft"
              >
                <button
                  type="button"
                  onClick={() => applySavedTemplate(tpl)}
                  className="min-w-0 flex-1 min-h-[44px] px-3 py-2 text-left"
                >
                  <span className="block truncate text-sm font-bold text-hbs-slate-dark">
                    {tpl.name}
                  </span>
                  <span className="block text-xs text-hbs-slate-muted">
                    {tpl.room.tables.length} Tische · {getRoomSeats(tpl.room).length} Plätze
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Vorlage ${tpl.name} löschen`}
                  onClick={() =>
                    setConfirmState({
                      message: `Vorlage „${tpl.name}“ löschen?`,
                      confirmLabel: 'Löschen',
                      danger: true,
                      onConfirm: () => {
                        setConfirmState(null);
                        onRemoveRoomTemplate(tpl.id);
                      },
                    })
                  }
                  className="min-h-[44px] min-w-[44px] grid place-items-center text-hbs-slate-muted hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag Ghost from Palette */}
      {dragGhost && (() => {
        const rect = svgRef.current?.getBoundingClientRect();
        const scale = rect ? Math.min(rect.width / (room.w + 60), rect.height / (room.h + 60)) : 0.6;
        const tblGhost = dragGhost.item.kind
          ? normalizeTableSpec({ id: 'ghost', kind: dragGhost.item.kind, x: 0, y: 0, w: 0, h: 0, rot: 0, seats: 0 })
          : null;
        let fixGhost: FixtureItem | null = dragGhost.item.fixture
          ? {
              id: 'ghost',
              kind: dragGhost.item.fixture,
              x: 0,
              y: 0,
              ...FIXTURE_SPECS[dragGhost.item.fixture],
              rot: 0,
            }
          : null;

        let gx = dragGhost.x;
        let gy = dragGhost.y;
        if (
          fixGhost &&
          rect &&
          WALL_DOCKED_FIXTURES.includes(fixGhost.kind) &&
          dragGhost.x >= rect.left &&
          dragGhost.x <= rect.right &&
          dragGhost.y >= rect.top &&
          dragGhost.y <= rect.bottom
        ) {
          const svgPt = toSvgCoords(dragGhost.x, dragGhost.y);
          const docked = dockToWall(fixGhost, svgPt.x, svgPt.y, room.w, room.h);
          const ctm = svgRef.current?.getScreenCTM();
          if (ctm) {
            gx = ctm.a * docked.x + ctm.c * docked.y + ctm.e;
            gy = ctm.b * docked.x + ctm.d * docked.y + ctm.f;
          }
          fixGhost = { ...fixGhost, rot: docked.rot };
        }

        const box = Math.max(tblGhost ? tblGhost.w : fixGhost!.w, tblGhost ? tblGhost.h : fixGhost!.h) + 140;
        return (
          <svg
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-lg"
            style={{ left: gx, top: gy }}
            width={box * scale}
            height={box * scale}
            viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
          >
            {tblGhost ? <TableShape t={tblGhost} /> : <FixtureShape f={fixGhost!} />}
          </svg>
        );
      })()}

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4">
            <p className="text-sm font-bold text-hbs-slate-dark">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-bold text-white ${
                  confirmState.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-hbs-blue hover:bg-hbs-blue-deep'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Room Template Modal */}
      {templateNameModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = templateNameModal.trim();
              if (trimmed) {
                onSaveRoomTemplate(trimmed, room);
                onNotify(`Vorlage „${trimmed}“ gespeichert`, 'success');
              }
              setTemplateNameModal(null);
            }}
            className="w-full max-w-sm rounded-2xl border border-hbs-slate-border bg-white p-5 shadow-hbs-modal space-y-4"
          >
            <h3 className="text-base font-black text-hbs-slate-dark">Raumvorlage speichern</h3>
            <input
              autoFocus
              value={templateNameModal}
              onChange={(e) => setTemplateNameModal(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Name der Vorlage"
              className="w-full min-h-[44px] rounded-xl border border-hbs-slate-border px-3 text-sm font-semibold focus:border-hbs-blue focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTemplateNameModal(null)}
                className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!templateNameModal.trim()}
                className="min-h-[44px] px-4 rounded-xl bg-hbs-blue text-white text-sm font-bold hover:bg-hbs-blue-deep disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
