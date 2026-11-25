import {
  EvaluationItem,
  FixtureItem,
  FixtureKind,
  PlanReport,
  RelationKind,
  RelationRule,
  RoomLayout,
  RuleConflict,
  SeatGraph,
  SeatSlot,
  SitzplanClass,
  StudentProfile,
  SwapSuggestion,
  TableItem,
  TableKind,
} from '../../types/sitzplanTypes';

export const TABLE_SPECS: Record<
  TableKind,
  { w: number; h: number; seats: number; label: string }
> = {
  single: { w: 70, h: 50, seats: 1, label: 'Einzeltisch' },
  pair: { w: 130, h: 50, seats: 2, label: 'Zweiertisch' },
  group: { w: 130, h: 120, seats: 4, label: 'Gruppentisch' },
  row: { w: 260, h: 50, seats: 4, label: 'Tischreihe' },
};

export const FIXTURE_SPECS: Record<
  FixtureKind,
  { w: number; h: number; label: string }
> = {
  board: { w: 360, h: 18, label: 'Tafel' },
  desk: { w: 130, h: 60, label: 'Lehrerpult' },
  door: { w: 64, h: 14, label: 'Tür' },
  window: { w: 200, h: 10, label: 'Fenster' },
  cabinet: { w: 160, h: 45, label: 'Schrank' },
  sink: { w: 60, h: 45, label: 'Waschbecken' },
  carpet: { w: 220, h: 160, label: 'Teppich' },
  bin: { w: 40, h: 40, label: 'Mülleimer' },
  stool: { w: 35, h: 35, label: 'Hocker' },
  readingTable: { w: 60, h: 60, label: 'Lesetisch' },
  bookshelf: { w: 100, h: 35, label: 'Bücherregal' },
  bench: { w: 100, h: 45, label: 'Sitzbank' },
};

export const SIMPLE_FIXTURES: FixtureKind[] = ['board', 'desk', 'door', 'window'];
export const WALL_DOCKED_FIXTURES: FixtureKind[] = ['board', 'door', 'window', 'sink'];
export const RESIZABLE_FIXTURES: FixtureKind[] = ['carpet', 'cabinet'];
export const EXPERT_HIDDEN_IN_SIMPLE: FixtureKind[] = ['bin'];

export const MAX_ROOM_SIZE = 2000;

let idCounter = 0;
export function genId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${(idCounter++).toString(36)}`;
}

export function rotateOffset(x: number, y: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: x * c - y * s, y: x * s + y * c };
}

export function getTableLocalSeats(t: TableItem): Array<{ x: number; y: number }> {
  const count = Math.max(
    0,
    Number.isFinite(t.seats) ? t.seats : TABLE_SPECS[t.kind]?.seats ?? 0
  );
  const res: Array<{ x: number; y: number }> = [];
  if (count === 0) return res;
  if (t.kind === 'group') {
    const top = Math.ceil(count / 2);
    const bottom = count - top;
    for (let i = 0; i < top; i++) {
      res.push({ x: -t.w / 2 + (t.w * (i + 0.5)) / top, y: -t.h / 2 - 30 });
    }
    for (let i = 0; i < bottom; i++) {
      res.push({ x: -t.w / 2 + (t.w * (i + 0.5)) / bottom, y: t.h / 2 + 30 });
    }
    return res;
  }
  for (let i = 0; i < count; i++) {
    res.push({ x: -t.w / 2 + (t.w * (i + 0.5)) / count, y: t.h / 2 + 30 });
  }
  return res;
}

export function getTableWorldSeats(t: TableItem): SeatSlot[] {
  return getTableLocalSeats(t).map((local, index) => {
    const world = rotateOffset(local.x, local.y, t.rot);
    return {
      id: `${t.id}:${index}`,
      tableId: t.id,
      index,
      x: t.x + world.x,
      y: t.y + world.y,
    };
  });
}

export function getRoomSeats(room: RoomLayout): SeatSlot[] {
  return room.tables.flatMap(getTableWorldSeats);
}

export function buildSeatGraph(room: RoomLayout): SeatGraph {
  const seats = getRoomSeats(room);
  const byId = new Map(seats.map((s) => [s.id, s]));
  const neighbors = new Map<string, Set<string>>();
  const tableOf = new Map<string, string>();

  for (const s of seats) {
    neighbors.set(s.id, new Set());
    tableOf.set(s.id, s.tableId);
  }

  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const a = seats[i];
      const b = seats[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= 80) {
        neighbors.get(a.id)!.add(b.id);
        neighbors.get(b.id)!.add(a.id);
      }
    }
  }

  const board = room.fixtures.find((f) => f.kind === 'board');
  const bx = board ? board.x : room.w / 2;
  const by = board ? board.y : 0;
  const dists = seats.map((s) => Math.hypot(s.x - bx, s.y - by));
  const minD = Math.min(...dists, 0);
  const maxD = Math.max(...dists, 1);
  const frontness = new Map<string, number>();
  seats.forEach((s, idx) => {
    frontness.set(s.id, maxD === minD ? 0 : (dists[idx] - minD) / (maxD - minD));
  });

  const boardAxis = (((board?.rot ?? 0) + 90) * Math.PI) / 180;
  const proj = seats.map((s) =>
    Math.abs((s.x - bx) * Math.cos(boardAxis) + (s.y - by) * Math.sin(boardAxis))
  );
  const minP = Math.min(...proj);
  const sortedP = [...proj].sort((a, b) => a - b);
  const q25 = sortedP[Math.max(0, Math.ceil(seats.length * 0.25) - 1)] ?? minP;
  const threshold = Math.min(minP + 140, q25);

  const front = new Set<string>(
    seats.filter((_, idx) => proj[idx] <= threshold + 0.5).map((s) => s.id)
  );

  return { seats, byId, neighbors, tableOf, frontness, front };
}

export function normalizeTableSpec(t: TableItem): TableItem {
  const spec = TABLE_SPECS[t.kind];
  return { ...t, w: spec.w, h: spec.h, seats: spec.seats };
}

export function clampToRoom(
  obj: { w: number; h: number; rot: number },
  x: number,
  y: number,
  roomW: number,
  roomH: number
): { x: number; y: number } {
  const rad = (obj.rot * Math.PI) / 180;
  const halfW = (Math.abs(Math.cos(rad)) * obj.w + Math.abs(Math.sin(rad)) * obj.h) / 2;
  const halfH = (Math.abs(Math.sin(rad)) * obj.w + Math.abs(Math.cos(rad)) * obj.h) / 2;
  const clamp = (val: number, half: number, max: number) =>
    2 * half >= max ? max / 2 : Math.min(max - half, Math.max(half, val));
  return {
    x: Math.round(clamp(x, halfW, roomW)),
    y: Math.round(clamp(y, halfH, roomH)),
  };
}

export function dockToWall(
  f: { kind: FixtureKind; w: number; h: number },
  x: number,
  y: number,
  roomW: number,
  roomH: number
): { x: number; y: number; rot: number } {
  const isEdge = f.kind === 'door' || f.kind === 'window';
  const offset = isEdge ? 0 : f.h / 2 + 3;
  const candidates = [
    { d: Math.abs(y), rot: 0, x, y: offset },
    { d: Math.abs(roomH - y), rot: 180, x, y: roomH - offset },
    { d: Math.abs(x), rot: 270, x: offset, y },
    { d: Math.abs(roomW - x), rot: 90, x: roomW - offset, y },
  ];
  const best = candidates.reduce((a, b) => (b.d < a.d ? b : a));
  const halfW = f.w / 2;
  const clampEdge = (val: number, max: number) =>
    Math.round(Math.min(max - halfW, Math.max(halfW, val)));
  if (best.rot === 0 || best.rot === 180) {
    return { x: clampEdge(best.x, roomW), y: Math.round(best.y), rot: best.rot };
  }
  return { x: Math.round(best.x), y: clampEdge(best.y, roomH), rot: best.rot };
}

export function computeMinRoomSize(room: RoomLayout): { w: number; h: number } {
  let w = 300;
  let h = 300;
  const visit = (o: { x: number; y: number; w: number; h: number; rot: number }) => {
    const rad = (o.rot * Math.PI) / 180;
    const hw = (Math.abs(Math.cos(rad)) * o.w + Math.abs(Math.sin(rad)) * o.h) / 2;
    const hh = (Math.abs(Math.sin(rad)) * o.w + Math.abs(Math.cos(rad)) * o.h) / 2;
    w = Math.max(w, o.x + hw);
    h = Math.max(h, o.y + hh);
  };
  room.tables.forEach(visit);
  room.fixtures.filter((f) => !WALL_DOCKED_FIXTURES.includes(f.kind)).forEach(visit);
  return { w: Math.ceil(w / 25) * 25, h: Math.ceil(h / 25) * 25 };
}

export function resizeRoom(room: RoomLayout, nextW: number, nextH: number): RoomLayout {
  const min = computeMinRoomSize(room);
  const snap = (val: number, minVal: number) =>
    Math.min(MAX_ROOM_SIZE, Math.max(minVal, Math.round(val / 25) * 25));
  const w = snap(nextW, min.w);
  const h = snap(nextH, min.h);
  if (w === room.w && h === room.h) return room;

  const fixtures = room.fixtures.map((f) => {
    if (!WALL_DOCKED_FIXTURES.includes(f.kind)) return f;
    const normRot = ((Math.round(f.rot) % 360) + 360) % 360;
    const onRight = normRot === 90 && f.x >= room.w / 2;
    const onBottom = normRot === 180 && f.y >= room.h / 2;
    const x = onRight ? f.x + (w - room.w) : f.x;
    const y = onBottom ? f.y + (h - room.h) : f.y;
    return { ...f, ...dockToWall(f, x, y, w, h) };
  });

  return { ...room, w, h, fixtures };
}

export type OrderedRoomObject =
  | { type: 'fixture'; object: FixtureItem }
  | { type: 'table'; object: TableItem };

export function orderRoomObjects(
  room: RoomLayout,
  selectedId?: string
): OrderedRoomObject[] {
  const items: OrderedRoomObject[] = [
    ...room.fixtures.map((object) => ({ type: 'fixture' as const, object })),
    ...room.tables.map((object) => ({ type: 'table' as const, object })),
  ];
  const isEdge = (e: OrderedRoomObject) =>
    e.type === 'fixture' && (e.object.kind === 'window' || e.object.kind === 'door');
  const isCarpet = (e: OrderedRoomObject) =>
    e.type === 'fixture' && e.object.kind === 'carpet';

  return items
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      if (isCarpet(a.entry) !== isCarpet(b.entry)) return isCarpet(a.entry) ? -1 : 1;
      if (isEdge(a.entry) !== isEdge(b.entry)) return isEdge(a.entry) ? 1 : -1;
      if (a.entry.object.id === selectedId && b.entry.object.id !== selectedId) return 1;
      if (b.entry.object.id === selectedId && a.entry.object.id !== selectedId) return -1;
      const za = a.entry.object.z ?? a.index - items.length;
      const zb = b.entry.object.z ?? b.index - items.length;
      return za - zb || a.index - b.index;
    })
    .map((x) => x.entry);
}

export function getNextZIndex(room: RoomLayout): number {
  return (
    Math.max(
      room.tables.length + room.fixtures.length,
      ...orderRoomObjects(room).map((x) => x.object.z ?? 0)
    ) + 1
  );
}

export function bringToFrontOrBack(
  room: RoomLayout,
  id: string,
  dir: 'front' | 'back'
): RoomLayout {
  const ordered = orderRoomObjects(room);
  const found = ordered.find((x) => x.object.id === id);
  if (!found) return room;
  const rest = ordered.filter((x) => x.object.id !== id);
  const next = dir === 'front' ? [...rest, found] : [found, ...rest];
  const zMap = new Map(next.map((x, idx) => [x.object.id, idx]));
  return {
    ...room,
    tables: room.tables.map((t) => ({ ...t, z: zMap.get(t.id) ?? 0 })),
    fixtures: room.fixtures.map((f) => ({ ...f, z: zMap.get(f.id) ?? 0 })),
  };
}

export function sanitizeClassPlans(cls: SitzplanClass): SitzplanClass {
  const seatIds = new Set(getRoomSeats(cls.room).map((s) => s.id));
  let changed = false;
  const plans = cls.plans.map((p) => {
    const okAssign = Object.keys(p.assignment).every((s) => seatIds.has(s));
    const okLock = p.locked.every((s) => seatIds.has(s));
    if (okAssign && okLock) return p;
    changed = true;
    return {
      ...p,
      assignment: Object.fromEntries(
        Object.entries(p.assignment).filter(([s]) => seatIds.has(s))
      ),
      locked: p.locked.filter((s) => seatIds.has(s)),
    };
  });
  return changed ? { ...cls, plans } : cls;
}

export function recognizeDrawnTable(
  pts: Array<{ x: number; y: number }>
): {
  kind: TableKind;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
} | null {
  if (pts.length < 4) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = maxX - minX;
  const dy = maxY - minY;
  if (Math.max(dx, dy) < 25) return null;

  const vertical = dy > dx;
  const longSide = Math.max(dx, dy);
  const shortSide = Math.max(Math.min(dx, dy), 1);
  const ratio = longSide / shortSide;

  let kind: TableKind;
  let seats: number;
  if (longSide <= 95 && ratio < 1.8) {
    kind = 'single';
    seats = 1;
  } else if (ratio >= 2.6 && longSide > 190) {
    kind = 'row';
    seats = Math.max(3, Math.round(longSide / 65));
  } else if (ratio >= 1.6) {
    kind = longSide > 190 ? 'row' : 'pair';
    seats = kind === 'row' ? Math.max(3, Math.round(longSide / 65)) : 2;
  } else {
    kind = 'group';
    seats = longSide * shortSide > 26000 ? 6 : 4;
  }

  const spec = TABLE_SPECS[kind];
  let w = Math.max(longSide, spec.w * 0.6);
  let h = Math.max(shortSide, spec.h * 0.6);
  if (kind === 'group') {
    w = Math.max(dx, 90);
    h = Math.max(dy, 80);
  } else if (kind === 'single') {
    w = Math.max(dx, 50);
    h = Math.max(dy, 40);
  }
  const rot = kind === 'group' || kind === 'single' ? 0 : vertical ? 90 : 0;

  return {
    kind,
    seats,
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    w: Math.round(w),
    h: Math.round(h),
    rot,
  };
}

export type RoomTemplatePresetId =
  | 'rows'
  | 'singles'
  | 'longRows'
  | 'herringbone'
  | 'u'
  | 'doubleU'
  | 'groups'
  | 'uGroups';

export const ROOM_TEMPLATE_PRESETS: Array<{
  id: RoomTemplatePresetId;
  label: string;
  hint: string;
}> = [
  { id: 'rows', label: 'Reihen', hint: 'Zweiertische mit Mittelgang' },
  { id: 'singles', label: 'Einzeltische', hint: 'Prüfungsordnung mit Abstand' },
  { id: 'longRows', label: 'Lange Reihen', hint: 'Vierer-Tischreihen hintereinander' },
  { id: 'herringbone', label: 'Fischgräte', hint: 'Schräge Zweiertische zur Tafel' },
  { id: 'u', label: 'U-Form', hint: 'Hufeisen, offen zur Tafel' },
  { id: 'doubleU', label: 'Doppel-U', hint: 'Inneres und äußeres U' },
  { id: 'groups', label: 'Gruppeninseln', hint: 'Vierertische im Raum' },
  { id: 'uGroups', label: 'U + Gruppen', hint: 'Hufeisen außen, Inseln innen' },
];

let templateTblCounter = 0;
function makeTemplateTable(kind: TableKind, x: number, y: number, rot = 0): TableItem {
  const spec = TABLE_SPECS[kind];
  return {
    id: `t${Date.now().toString(36)}${(templateTblCounter++).toString(36)}`,
    kind,
    x: Math.round(x),
    y: Math.round(y),
    rot,
    w: spec.w,
    h: spec.h,
    seats: spec.seats,
  };
}

function layoutGrid(
  kind: TableKind,
  count: number,
  cols: number,
  roomW: number,
  dx: number,
  dy: number,
  startY = 190,
  rot = 0
): { tables: TableItem[]; h: number } {
  const tables: TableItem[] = [];
  const rows = Math.ceil(count / cols);
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, count - r * cols);
    const startX = roomW / 2 - ((inRow - 1) * dx) / 2;
    for (let c = 0; c < inRow; c++) {
      tables.push(makeTemplateTable(kind, startX + c * dx, startY + r * dy, rot));
    }
  }
  return { tables, h: startY + (rows - 1) * dy + 130 };
}

function layoutU(
  pairCount: number,
  centerX: number,
  topY: number,
  maxWidth: number
): { tables: TableItem[]; h: number; width: number; top: number; yb: number } {
  const tables: TableItem[] = [];
  const maxBottom = Math.max(1, Math.floor((maxWidth - 120) / 140));
  const bottom = Math.min(maxBottom, Math.max(1, Math.round(pairCount / 3), pairCount - 8));
  const sides = Math.max(1, Math.ceil((pairCount - bottom) / 2));
  const width = Math.max(bottom * 140 + 120, 300);
  const leftX = centerX - width / 2;
  const rightX = centerX + width / 2;
  for (let i = 0; i < sides; i++) {
    const y = topY + i * 135;
    tables.push(makeTemplateTable('pair', leftX, y, 90), makeTemplateTable('pair', rightX, y, 270));
  }
  const yb = topY + (sides - 1) * 135 + 115;
  for (let i = 0; i < bottom; i++) {
    tables.push(makeTemplateTable('pair', leftX + ((i + 1) * width) / (bottom + 1), yb, 0));
  }
  return { tables, h: yb + 120, width, top: topY, yb };
}

export function generateRoomFromTemplate(
  preset: RoomTemplatePresetId,
  room: RoomLayout,
  studentCount = 0
): RoomLayout {
  const w = room.w;
  const target = studentCount > 0 ? studentCount : 24;
  const need = (perTable: number) => Math.ceil(target / perTable);
  let out: { tables: TableItem[]; h: number };

  if (preset === 'rows') {
    out = layoutGrid('pair', need(2), 4, w, w * 0.2, 140);
  } else if (preset === 'singles') {
    const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(target * 1.4))));
    out = layoutGrid('single', need(1), cols, w, 140, 125);
  } else if (preset === 'longRows') {
    out = layoutGrid('row', need(4), 3, w, 300, 140);
  } else if (preset === 'herringbone') {
    out = layoutGrid('pair', need(2), 4, w, w * 0.2, 140);
    out.tables.forEach((t) => {
      t.rot = t.x < w / 2 ? 20 : -20;
    });
  } else if (preset === 'groups') {
    out = layoutGrid('group', need(4), 3, w, w * 0.28, 230, 230);
  } else if (preset === 'u' || ((preset === 'doubleU' || preset === 'uGroups') && target < 14)) {
    out = layoutU(need(2), w / 2, 180, w * 0.9);
  } else if (preset === 'doubleU') {
    const totalPairs = need(2);
    const innerCount = Math.max(2, Math.floor(totalPairs * 0.35));
    const outer = layoutU(totalPairs - innerCount, w / 2, 160, w * 0.85);
    const inner = layoutU(innerCount, w / 2, 250, outer.width - 340);
    out = { tables: [...outer.tables, ...inner.tables], h: outer.h };
  } else {
    let groups = Math.max(1, Math.round(target / 12));
    let outer = layoutU(Math.ceil((target - groups * 4) / 2), w / 2, 170, w * 0.9);
    const maxGroups = Math.max(1, Math.floor((outer.width - 260) / 240));
    if (groups > maxGroups) {
      groups = maxGroups;
      outer = layoutU(Math.ceil((target - groups * 4) / 2), w / 2, 170, w * 0.9);
    }
    const innerGroups = layoutGrid(
      'group',
      groups,
      groups,
      w,
      240,
      0,
      Math.max(300, (outer.top + outer.yb) / 2)
    );
    out = { tables: [...outer.tables, ...innerGroups.tables], h: outer.h };
  }

  const h = Math.max(room.h, Math.ceil(out.h / 50) * 50);
  const fixtures = room.fixtures.some((f) => f.kind === 'board')
    ? room.fixtures
    : [
        ...room.fixtures,
        {
          id: genId('f'),
          kind: 'board' as FixtureKind,
          x: w / 2,
          y: 22,
          w: 360,
          h: 18,
          rot: 0,
        },
      ];

  return { ...room, h, tables: out.tables, fixtures };
}

// ============================================================
// RULES, CONFLICT DETECTION & SIMULATED ANNEALING SOLVER
// ============================================================

export const DEFAULT_WEIGHTS = {
  hardNever: 10000,
  neverSameTable: 30,
  apartNeighbor: 60,
  apartSameTable: 35,
  goodNeighbor: -14,
  goodSameTable: -7,
  togetherMissed: 55,
  togetherOnlyTable: 20,
  distraction: 8,
  calmNeighbor: 5,
  talkBalance: 6,
  teamLow: 14,
  teamBurden: 10,
  front: 40,
  support: 20,
  solo: 45,
  repeatNeighbor: 25,
  repeatTable: 10,
  backAgain: 20,
};

export const RELATION_LABELS: Record<RelationKind, string> = {
  never: 'Nicht zusammensetzen',
  apart: 'Eher trennen',
  good: 'Gute Kombination',
  together: 'Unbedingt zusammen',
};

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export interface RotationHistory {
  neighbors: Set<string>;
  sameTable: Set<string>;
  back: Set<string>;
}

export function buildRotationHistory(
  graph: SeatGraph,
  assignment: Record<string, string>
): RotationHistory {
  const hist: RotationHistory = {
    neighbors: new Set(),
    sameTable: new Set(),
    back: new Set(),
  };
  const entries = Object.entries(assignment).filter(([seatId]) => graph.byId.has(seatId));
  for (const [seatId, studentId] of entries) {
    if ((graph.frontness.get(seatId) ?? 0) > 0.66) hist.back.add(studentId);
    for (const [otherSeat, otherStudent] of entries) {
      if (otherSeat <= seatId || otherStudent === studentId) continue;
      if (graph.neighbors.get(seatId)?.has(otherSeat)) {
        hist.neighbors.add(pairKey(studentId, otherStudent));
      } else if (
        graph.tableOf.get(seatId) !== undefined &&
        graph.tableOf.get(seatId) === graph.tableOf.get(otherSeat)
      ) {
        hist.sameTable.add(pairKey(studentId, otherStudent));
      }
    }
  }
  return hist;
}

export interface EvalContext {
  graph: SeatGraph;
  history?: RotationHistory;
  students: Map<string, StudentProfile>;
  relations: RelationRule[];
  weights: typeof DEFAULT_WEIGHTS;
}

export function createEvalContext(
  cls: SitzplanClass,
  weights = DEFAULT_WEIGHTS,
  previousAssignment?: Record<string, string>
): EvalContext {
  const graph = buildSeatGraph(cls.room);
  return {
    graph,
    history: previousAssignment ? buildRotationHistory(graph, previousAssignment) : undefined,
    students: new Map(cls.students.map((s) => [s.id, s])),
    relations: cls.relations,
    weights,
  };
}

function forEachNeighborPair(
  ctx: EvalContext,
  assignment: Record<string, string>,
  cb: (a: StudentProfile, b: StudentProfile) => void
) {
  for (const [seatA, studAId] of Object.entries(assignment)) {
    for (const seatB of ctx.graph.neighbors.get(seatA) ?? []) {
      if (seatB <= seatA) continue;
      const studBId = assignment[seatB];
      if (!studBId) continue;
      const a = ctx.students.get(studAId);
      const b = ctx.students.get(studBId);
      if (a && b) cb(a, b);
    }
  }
}

function groupByTable(
  ctx: EvalContext,
  assignment: Record<string, string>
): Map<string, StudentProfile[]> {
  const map = new Map<string, StudentProfile[]>();
  for (const [seatId, studentId] of Object.entries(assignment)) {
    const tId = ctx.graph.tableOf.get(seatId);
    const st = ctx.students.get(studentId);
    if (!tId || !st) continue;
    if (!map.has(tId)) map.set(tId, []);
    map.get(tId)!.push(st);
  }
  return map;
}

export function evaluatePlan(
  ctx: EvalContext,
  assignment: Record<string, string>
): { total: number; items: EvaluationItem[] } {
  const seatOfStudent = new Map<string, string>();
  for (const [seatId, studId] of Object.entries(assignment)) {
    seatOfStudent.set(studId, seatId);
  }
  const nameOf = (id: string) => ctx.students.get(id)?.name ?? '?';
  const items: EvaluationItem[] = [];
  const w = ctx.weights;

  // 1. Relations
  for (const rel of ctx.relations) {
    const sA = seatOfStudent.get(rel.a);
    const sB = seatOfStudent.get(rel.b);
    if (!sA || !sB) continue;
    const isNeighbor = ctx.graph.neighbors.get(sA)?.has(sB) ?? false;
    const sameTable =
      ctx.graph.tableOf.get(sA) !== undefined &&
      ctx.graph.tableOf.get(sA) === ctx.graph.tableOf.get(sB);
    const nA = nameOf(rel.a);
    const nB = nameOf(rel.b);
    const key = `rel:${pairKey(rel.a, rel.b)}`;
    const students = [rel.a, rel.b];

    if (rel.kind === 'never') {
      if (isNeighbor) {
        items.push({
          key,
          ruleId: 'never',
          cost: w.hardNever,
          severity: 'hard',
          students,
          message: `${nA} und ${nB} sitzen direkt nebeneinander, obwohl sie nicht zusammengesetzt werden dürfen.`,
        });
      } else if (sameTable) {
        items.push({
          key,
          ruleId: 'never',
          cost: w.neverSameTable,
          severity: 'warn',
          students,
          message: `${nA} und ${nB} sitzen am selben Tisch (nicht direkt nebeneinander).`,
        });
      }
    } else if (rel.kind === 'apart') {
      if (isNeighbor) {
        items.push({
          key,
          ruleId: 'apart',
          cost: w.apartNeighbor,
          severity: 'warn',
          students,
          message: `${nA} und ${nB} sollten eher getrennt sitzen, sind aber direkte Nachbarn.`,
        });
      } else if (sameTable) {
        items.push({
          key,
          ruleId: 'apart',
          cost: w.apartSameTable,
          severity: 'warn',
          students,
          message: `${nA} und ${nB} sollten eher getrennt sitzen, sind aber am selben Tisch.`,
        });
      }
    } else if (rel.kind === 'good') {
      if (isNeighbor) {
        items.push({
          key,
          ruleId: 'good',
          cost: w.goodNeighbor,
          severity: 'good',
          students,
          message: `${nA} und ${nB} arbeiten gut zusammen und sitzen nebeneinander.`,
        });
      } else if (sameTable) {
        items.push({
          key,
          ruleId: 'good',
          cost: w.goodSameTable,
          severity: 'good',
          students,
          message: `${nA} und ${nB} arbeiten gut zusammen und teilen sich einen Tisch.`,
        });
      } else {
        items.push({
          key,
          ruleId: 'goodMissed',
          cost: 0,
          severity: 'info',
          students,
          message: `Wunsch nicht umgesetzt: ${nA} und ${nB} (gute Kombination) sitzen getrennt.`,
        });
      }
    } else if (rel.kind === 'together') {
      if (isNeighbor) {
        items.push({
          key,
          ruleId: 'together',
          cost: 0,
          severity: 'good',
          students,
          message: `${nA} und ${nB} sitzen wie gewünscht direkt nebeneinander.`,
        });
      } else if (sameTable) {
        items.push({
          key,
          ruleId: 'togetherMissed',
          cost: w.togetherOnlyTable,
          severity: 'warn',
          students,
          message: `${nA} und ${nB} sollen nebeneinander sitzen, sind aber nur am selben Tisch.`,
        });
      } else {
        items.push({
          key,
          ruleId: 'togetherMissed',
          cost: w.togetherMissed,
          severity: 'warn',
          students,
          message: `Wunsch nicht umgesetzt: ${nA} und ${nB} sollen zusammen sitzen.`,
        });
      }
    }
  }

  // 2. Distraction & Calm
  forEachNeighborPair(ctx, assignment, (a, b) => {
    if (a.talkative >= 4 && b.talkative >= 4) {
      items.push({
        key: `talk:${pairKey(a.id, b.id)}`,
        ruleId: 'distraction',
        cost: w.distraction * (a.talkative - 3) * (b.talkative - 3) * 2,
        severity: 'warn',
        students: [a.id, b.id],
        message: `${a.name} und ${b.name} sind beide sehr gesprächig und sitzen nebeneinander.`,
      });
    }
    for (const [calm, other] of [
      [a, b],
      [b, a],
    ]) {
      if (calm.concentration <= 2 && other.talkative >= 4) {
        items.push({
          key: `calm:${calm.id}:${other.id}`,
          ruleId: 'calm',
          cost: w.calmNeighbor * (3 - calm.concentration) * (other.talkative - 2),
          severity: 'warn',
          students: [calm.id, other.id],
          message: `${calm.name} braucht eher Ruhe, sitzt aber neben ${other.name} (gesprächig).`,
        });
      } else if (calm.concentration <= 2 && other.talkative <= 2) {
        items.push({
          key: `calmok:${calm.id}:${other.id}`,
          ruleId: 'calmOk',
          cost: -2,
          severity: 'good',
          students: [calm.id, other.id],
          message: `${calm.name} hat mit ${other.name} einen ruhigen Sitznachbarn.`,
        });
      }
    }
  });

  // 3. Balance & Teamwork
  const tables = [...groupByTable(ctx, assignment).entries()];
  const multiTables = tables.filter(([, list]) => list.length >= 2);
  if (multiTables.length >= 2) {
    const allMulti = multiTables.flatMap(([, list]) => list);
    const avgTalk = allMulti.reduce((sum, s) => sum + s.talkative, 0) / allMulti.length;
    for (const [tableId, list] of multiTables) {
      const tableAvg = list.reduce((sum, s) => sum + s.talkative, 0) / list.length;
      const diff = Math.abs(tableAvg - avgTalk);
      if (diff >= 1) {
        items.push({
          key: `bal:${tableId}`,
          ruleId: 'balance',
          cost: w.talkBalance * diff * diff * list.length,
          severity: 'info',
          students: list.map((s) => s.id),
          message: `Am Tisch von ${list.map((s) => s.name).join(', ')} ist die Gesprächigkeit ${
            tableAvg > avgTalk ? 'deutlich höher' : 'deutlich niedriger'
          } als im Klassenschnitt.`,
        });
      }
    }
  }

  for (const [tableId, list] of tables) {
    if (list.length < 2) continue;
    const avgTeam = list.reduce((sum, s) => sum + s.teamwork, 0) / list.length;
    if (avgTeam <= 2) {
      items.push({
        key: `teamlow:${tableId}`,
        ruleId: 'teamLow',
        cost: w.teamLow * list.length,
        severity: 'warn',
        students: list.map((s) => s.id),
        message: `Am Tisch von ${list.map((s) => s.name).join(', ')} fehlt ein Kind, das die Zusammenarbeit trägt.`,
      });
    }
    const strong = list.filter((s) => s.teamwork >= 4);
    const weak = list.filter((s) => s.teamwork <= 2);
    if (strong.length === 1 && weak.length >= 2) {
      items.push({
        key: `burden:${strong[0].id}`,
        ruleId: 'teamBurden',
        cost: w.teamBurden * (weak.length - 1),
        severity: 'info',
        students: list.map((s) => s.id),
        message: `${strong[0].name} trägt am Tisch allein die Verantwortung für die Zusammenarbeit.`,
      });
    } else if (strong.length >= 1 && weak.length >= 1 && weak.length <= strong.length + 1) {
      items.push({
        key: `mix:${tableId}`,
        ruleId: 'teamMix',
        cost: -3,
        severity: 'good',
        students: list.map((s) => s.id),
        message: `Am Tisch von ${list.map((s) => s.name).join(', ')} können sich die Kinder gut gegenseitig unterstützen.`,
      });
    }
  }

  // 4. Front & Support
  for (const [seatId, studentId] of Object.entries(assignment)) {
    const st = ctx.students.get(studentId);
    if (!st) continue;
    const fDist = ctx.graph.frontness.get(seatId) ?? 0;
    if (st.front) {
      if (ctx.graph.front.has(seatId)) {
        items.push({
          key: `front:${studentId}`,
          ruleId: 'frontOk',
          cost: 0,
          severity: 'good',
          students: [studentId],
          message: `${st.name} sitzt wie gewünscht nah an der Tafel.`,
        });
      } else {
        items.push({
          key: `front:${studentId}`,
          ruleId: 'front',
          cost: w.front * Math.max(fDist, 0.3),
          severity: 'warn',
          students: [studentId],
          message: `${st.name} soll möglichst vorne sitzen, sitzt aber eher weit von der Tafel entfernt.`,
        });
      }
    }
    if (st.support && fDist > 0.6) {
      items.push({
        key: `sup:${studentId}`,
        ruleId: 'support',
        cost: w.support * fDist,
        severity: 'info',
        students: [studentId],
        message: `${st.name} hat besonderen Unterstützungsbedarf und sitzt weit hinten.`,
      });
    }
  }

  // 5. Solo
  for (const [seatId, studentId] of Object.entries(assignment)) {
    const st = ctx.students.get(studentId);
    if (!st?.solo) continue;
    const occNeighbors = [...(ctx.graph.neighbors.get(seatId) ?? [])]
      .map((nId) => assignment[nId])
      .filter((id): id is string => Boolean(id) && ctx.students.has(id));
    if (occNeighbors.length > 0) {
      items.push({
        key: `solo:${studentId}`,
        ruleId: 'solo',
        cost: w.solo * occNeighbors.length,
        severity: 'warn',
        students: [studentId, ...occNeighbors],
        message: `${st.name} braucht einen Einzelplatz, hat aber ${
          occNeighbors.length === 1
            ? 'einen direkten Sitznachbarn'
            : `${occNeighbors.length} direkte Sitznachbarn`
        }.`,
      });
    } else {
      items.push({
        key: `solo:${studentId}`,
        ruleId: 'soloOk',
        cost: 0,
        severity: 'good',
        students: [studentId],
        message: `${st.name} hat wie gewünscht einen Einzelplatz ohne direkte Nachbarn.`,
      });
    }
  }

  // 6. Rotation memory
  if (ctx.history) {
    const hist = ctx.history;
    forEachNeighborPair(ctx, assignment, (a, b) => {
      if (hist.neighbors.has(pairKey(a.id, b.id))) {
        items.push({
          key: `rep:${pairKey(a.id, b.id)}`,
          ruleId: 'repeatNeighbor',
          cost: w.repeatNeighbor,
          severity: 'info',
          students: [a.id, b.id],
          message: `${a.name} und ${b.name} saßen schon im Vorplan direkt nebeneinander.`,
        });
      }
    });

    for (const [seatId, studentId] of Object.entries(assignment)) {
      const st = ctx.students.get(studentId);
      if (!st) continue;
      for (const [otherSeat, otherStudent] of Object.entries(assignment)) {
        if (
          otherSeat > seatId &&
          ctx.graph.tableOf.get(seatId) !== undefined &&
          ctx.graph.tableOf.get(seatId) === ctx.graph.tableOf.get(otherSeat) &&
          !ctx.graph.neighbors.get(seatId)?.has(otherSeat) &&
          hist.sameTable.has(pairKey(studentId, otherStudent))
        ) {
          items.push({
            key: `rept:${pairKey(studentId, otherStudent)}`,
            ruleId: 'repeatTable',
            cost: w.repeatTable,
            severity: 'info',
            students: [studentId, otherStudent],
            message: `${st.name} und ${nameOf(otherStudent)} saßen schon im Vorplan am selben Tisch.`,
          });
        }
      }
      if (hist.back.has(studentId)) {
        if ((ctx.graph.frontness.get(seatId) ?? 0) > 0.66) {
          items.push({
            key: `back:${studentId}`,
            ruleId: 'backAgain',
            cost: w.backAgain,
            severity: 'info',
            students: [studentId],
            message: `${st.name} saß schon im Vorplan hinten und sitzt wieder hinten.`,
          });
        } else {
          items.push({
            key: `back:${studentId}`,
            ruleId: 'rotatedForward',
            cost: 0,
            severity: 'good',
            students: [studentId],
            message: `${st.name} ist aus der hinteren Reihe nach vorne rotiert.`,
          });
        }
      }
    }
  }

  return {
    total: items.reduce((sum, item) => sum + item.cost, 0),
    items,
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function swapSeats(
  assignment: Record<string, string>,
  seatA: string,
  seatB: string
): void {
  const a = assignment[seatA];
  const b = assignment[seatB];
  if (b) assignment[seatA] = b;
  else delete assignment[seatA];
  if (a) assignment[seatB] = a;
  else delete assignment[seatB];
}

export function solveSeatingPlan({
  cls,
  seed,
  fixed = {},
  iterations = 9000,
  previousAssignment,
}: {
  cls: SitzplanClass;
  seed: number;
  fixed?: Record<string, string>;
  iterations?: number;
  previousAssignment?: Record<string, string>;
}): {
  assignment: Record<string, string>;
  cost: number;
  items: EvaluationItem[];
  unplaced: string[];
} {
  const ctx = createEvalContext(cls, DEFAULT_WEIGHTS, previousAssignment);
  const rand = mulberry32(seed);
  const allSeatIds = ctx.graph.seats.map((s) => s.id);
  const lockedAssign: Record<string, string> = {};
  const lockedStudents = new Set<string>();

  for (const [seatId, studId] of Object.entries(fixed)) {
    if (ctx.graph.byId.has(seatId) && ctx.students.has(studId) && !lockedStudents.has(studId)) {
      lockedAssign[seatId] = studId;
      lockedStudents.add(studId);
    }
  }

  const freeSeats = allSeatIds.filter((s) => !(s in lockedAssign));
  const freeStudents = cls.students
    .map((s) => s.id)
    .filter((id) => !lockedStudents.has(id));

  for (let i = freeStudents.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [freeStudents[i], freeStudents[j]] = [freeStudents[j], freeStudents[i]];
  }

  const sortedStudents = [...freeStudents].sort(
    (a, b) => Number(ctx.students.get(b)!.front) - Number(ctx.students.get(a)!.front)
  );
  const sortedSeats = [...freeSeats].sort(
    (a, b) => (ctx.graph.frontness.get(a) ?? 0) - (ctx.graph.frontness.get(b) ?? 0)
  );

  const current: Record<string, string> = { ...lockedAssign };
  const frontStudents = sortedStudents.filter((id) => ctx.students.get(id)!.front);
  const otherStudents = sortedStudents.filter((id) => !ctx.students.get(id)!.front);
  const unplaced: string[] = [];
  const remainingSeats = sortedSeats.slice(frontStudents.length);

  frontStudents.forEach((studId, idx) => {
    const sId = sortedSeats[idx];
    if (sId) current[sId] = studId;
    else unplaced.push(studId);
  });

  const shuffledRest = [...remainingSeats];
  for (let i = shuffledRest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledRest[i], shuffledRest[j]] = [shuffledRest[j], shuffledRest[i]];
  }
  otherStudents.forEach((studId, idx) => {
    const sId = shuffledRest[idx];
    if (sId) current[sId] = studId;
    else unplaced.push(studId);
  });

  let curCost = evaluatePlan(ctx, current).total;
  let best = { ...current };
  let bestCost = curCost;

  if (freeSeats.length >= 2) {
    let temp = 60;
    const decay = Math.pow(0.02 / temp, 1 / iterations);
    for (let step = 0; step < iterations; step++) {
      const a = freeSeats[Math.floor(rand() * freeSeats.length)];
      const b = freeSeats[Math.floor(rand() * freeSeats.length)];
      if (a === b || (!current[a] && !current[b])) continue;
      swapSeats(current, a, b);
      const nextCost = evaluatePlan(ctx, current).total;
      const delta = nextCost - curCost;
      if (delta <= 0 || rand() < Math.exp(-delta / temp)) {
        curCost = nextCost;
        if (nextCost < bestCost) {
          bestCost = nextCost;
          best = { ...current };
        }
      } else {
        swapSeats(current, a, b);
      }
      temp *= decay;
    }
  }

  const finalEval = evaluatePlan(ctx, best);
  return {
    assignment: best,
    cost: finalEval.total,
    items: finalEval.items,
    unplaced,
  };
}

export function findSwapSuggestions(
  ctx: EvalContext,
  assignment: Record<string, string>,
  locked: string[],
  limit = 3
): SwapSuggestion[] {
  const isProblem = (item: EvaluationItem) =>
    item.severity === 'hard' || item.severity === 'warn';
  const baseEval = evaluatePlan(ctx, assignment);
  const baseProblems = new Map(
    baseEval.items.filter(isProblem).map((item) => [item.key, item])
  );
  const lockedSet = new Set(locked);
  const movableSeats = ctx.graph.seats
    .map((s) => s.id)
    .filter((id) => !lockedSet.has(id));

  const candidates: SwapSuggestion[] = [];
  const draft = { ...assignment };

  for (let i = 0; i < movableSeats.length; i++) {
    for (let j = i + 1; j < movableSeats.length; j++) {
      const seatA = movableSeats[i];
      const seatB = movableSeats[j];
      if (!draft[seatA] && !draft[seatB]) continue;
      swapSeats(draft, seatA, seatB);
      const nextEval = evaluatePlan(ctx, draft);
      swapSeats(draft, seatA, seatB);

      const delta = nextEval.total - baseEval.total;
      if (delta >= -1) continue;
      const nextProblems = new Map(
        nextEval.items.filter(isProblem).map((item) => [item.key, item])
      );
      const resolved = [...baseProblems.values()].filter((p) => !nextProblems.has(p.key));
      const created = [...nextProblems.values()].filter((p) => !baseProblems.has(p.key));
      candidates.push({ seatA, seatB, delta, resolved, created, message: '' });
    }
  }

  candidates.sort((a, b) => a.delta - b.delta);
  const usedSeats = new Set<string>();
  const out: SwapSuggestion[] = [];

  for (const cand of candidates) {
    if (usedSeats.has(cand.seatA) || usedSeats.has(cand.seatB)) continue;
    usedSeats.add(cand.seatA);
    usedSeats.add(cand.seatB);
    const nameA = ctx.students.get(assignment[cand.seatA] ?? '')?.name;
    const nameB = ctx.students.get(assignment[cand.seatB] ?? '')?.name;
    const actionText =
      nameA && nameB
        ? `Wenn ${nameA} und ${nameB} die Plätze tauschen`
        : `Wenn ${nameA ?? nameB} auf den freien Platz wechselt`;
    const resLen = cand.resolved.length;
    const benefitText =
      resLen > 0
        ? resLen === 1
          ? 'wird eine ungünstige Situation vermieden'
          : `werden ${resLen} ungünstige Situationen vermieden`
        : 'passt der Plan insgesamt besser zu den Regeln';
    const sideEffect =
      cand.created.length === 1
        ? ' (dafür entsteht 1 kleinerer Nachteil)'
        : cand.created.length > 1
          ? ` (dafür entstehen ${cand.created.length} kleinere Nachteile)`
          : '';
    cand.message = `${actionText}, ${benefitText}${sideEffect}.`;
    out.push(cand);
    if (out.length >= limit) break;
  }

  return out;
}

export function computePlanReport(
  ctx: EvalContext,
  assignment: Record<string, string>,
  relations: RelationRule[]
): PlanReport {
  const { total, items } = evaluatePlan(ctx, assignment);
  const placedIds = new Set(
    Object.entries(assignment)
      .filter(([seatId]) => ctx.graph.byId.has(seatId))
      .map(([, studId]) => studId)
  );
  const unplaced = [...ctx.students.keys()].filter((id) => !placedIds.has(id));
  const neverRules = relations.filter((r) => r.kind === 'never');
  const hardCount = items.filter((i) => i.severity === 'hard').length;
  const wishRules = relations.filter((r) => r.kind === 'good' || r.kind === 'together');
  const wishOk = items.filter(
    (i) => i.severity === 'good' && (i.ruleId === 'good' || i.ruleId === 'together')
  ).length;
  const missed = items.filter(
    (i) => i.ruleId === 'togetherMissed' || i.ruleId === 'goodMissed'
  );
  const problems = items.filter(
    (i) =>
      i.severity === 'hard' ||
      (i.severity === 'warn' && !['togetherMissed', 'front'].includes(i.ruleId))
  );
  const frontStudents = [...ctx.students.values()].filter(
    (s) => s.front && placedIds.has(s.id)
  );
  const frontOk = items.filter((i) => i.ruleId === 'frontOk').length;

  const tableGroups = new Map<string, string[]>();
  for (const [seatId, studentId] of Object.entries(assignment)) {
    const tId = ctx.graph.tableOf.get(seatId);
    if (!tId) continue;
    if (!tableGroups.has(tId)) tableGroups.set(tId, []);
    tableGroups.get(tId)!.push(studentId);
  }
  const tables = [...tableGroups.entries()].map(([tableId, studIds]) => {
    const list = studIds
      .map((id) => ctx.students.get(id))
      .filter((s): s is StudentProfile => Boolean(s));
    return {
      tableId,
      names: list.map((s) => s.name),
      talk: list.reduce((sum, s) => sum + s.talkative, 0) / Math.max(1, list.length),
      team: list.reduce((sum, s) => sum + s.teamwork, 0) / Math.max(1, list.length),
    };
  });

  return {
    total,
    items,
    hard: { total: neverRules.length, ok: neverRules.length - hardCount },
    wishes: { total: wishRules.length, ok: wishOk, missed },
    problems,
    front: { total: frontStudents.length, ok: frontOk },
    tables,
    unplaced,
  };
}

export function explainStudentPlacement(
  ctx: EvalContext,
  assignment: Record<string, string>,
  items: EvaluationItem[],
  studentId: string
): { neighbors: string[]; tablemates: string[]; items: EvaluationItem[] } {
  const seatEntry = Object.entries(assignment).find(([, sId]) => sId === studentId);
  if (!seatEntry) return { neighbors: [], tablemates: [], items: [] };
  const seatId = seatEntry[0];
  const neighbors = [...(ctx.graph.neighbors.get(seatId) ?? [])]
    .map((nId) => assignment[nId])
    .filter((id): id is string => Boolean(id))
    .map((id) => ctx.students.get(id)?.name ?? '?');
  const tId = ctx.graph.tableOf.get(seatId);
  const tablemates = Object.entries(assignment)
    .filter(
      ([otherSeat, otherStud]) =>
        otherStud !== studentId &&
        tId !== undefined &&
        ctx.graph.tableOf.get(otherSeat) === tId &&
        !ctx.graph.neighbors.get(seatId)?.has(otherSeat)
    )
    .map(([, id]) => ctx.students.get(id)?.name ?? '?');
  const order: Record<string, number> = { hard: 0, warn: 1, info: 2, good: 3 };
  return {
    neighbors,
    tablemates,
    items: items
      .filter((item) => item.students.includes(studentId))
      .sort((a, b) => order[a.severity] - order[b.severity]),
  };
}

export function detectConflicts(cls: SitzplanClass): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  const names = new Map(cls.students.map((s) => [s.id, s.name]));
  const nameOf = (id: string) => names.get(id) ?? '?';
  const relMap = new Map<string, RelationKind>();
  for (const r of cls.relations) {
    relMap.set(pairKey(r.a, r.b), r.kind);
  }
  const getRel = (a: string, b: string) => relMap.get(pairKey(a, b));

  const togetherAdj = new Map<string, string[]>();
  for (const r of cls.relations) {
    if (r.kind === 'together') {
      if (!togetherAdj.has(r.a)) togetherAdj.set(r.a, []);
      if (!togetherAdj.has(r.b)) togetherAdj.set(r.b, []);
      togetherAdj.get(r.a)!.push(r.b);
      togetherAdj.get(r.b)!.push(r.a);
    }
  }

  const graph = buildSeatGraph(cls.room);
  let maxNeighbors = 0;
  for (const n of graph.neighbors.values()) {
    maxNeighbors = Math.max(maxNeighbors, n.size);
  }

  for (const [id, partners] of togetherAdj) {
    if (cls.room.tables.length > 0 && partners.length > maxNeighbors) {
      conflicts.push({
        scope: 'relation',
        level: 'error',
        students: [id, ...partners],
        message: `${nameOf(id)} soll neben ${partners.length} ${
          partners.length === 1 ? 'Kind' : 'Kindern'
        } sitzen, ein Platz hat im Raum aber höchstens ${maxNeighbors} direkte Nachbarn.`,
      });
    }
    for (let i = 0; i < partners.length; i++) {
      for (let j = i + 1; j < partners.length; j++) {
        const sA = partners[i];
        const sB = partners[j];
        const kind = getRel(sA, sB);
        if (kind === 'never' || kind === 'apart') {
          conflicts.push({
            scope: 'relation',
            level: kind === 'never' ? 'error' : 'warn',
            students: [sA, id, sB],
            message: `${nameOf(sA)} und ${nameOf(sB)} sollen beide neben ${nameOf(
              id
            )} sitzen, aber nicht zusammen („${
              kind === 'never' ? 'Nicht zusammensetzen' : 'Eher trennen'
            }“). Das ist nur an einer Reihe mit ${nameOf(id)} in der Mitte lösbar.`,
          });
        }
      }
    }
  }

  const totalSeats = graph.seats.length;
  if (cls.room.tables.length > 0 && totalSeats < cls.students.length) {
    conflicts.push({
      scope: 'room',
      level: 'error',
      students: [],
      message: `Im Raum gibt es ${totalSeats} Sitzplätze, aber ${cls.students.length} Kinder.`,
    });
  }

  const frontStudents = cls.students.filter((s) => s.front);
  if (cls.room.tables.length > 0 && frontStudents.length > graph.front.size) {
    conflicts.push({
      scope: 'room',
      level: 'warn',
      students: frontStudents.map((s) => s.id),
      message: `${frontStudents.length} Kinder sollen vorne sitzen, es gibt aber nur ${graph.front.size} tafelnahe Plätze.`,
    });
  }

  const soloStudents = cls.students.filter((s) => s.solo);
  const isolatedSeats = [...graph.neighbors.values()].filter((n) => n.size === 0).length;
  if (cls.room.tables.length > 0 && soloStudents.length > isolatedSeats) {
    conflicts.push({
      scope: 'room',
      level: 'warn',
      students: soloStudents.map((s) => s.id),
      message: `${soloStudents.length} Kinder brauchen einen Einzelplatz, im Raum gibt es aber nur ${isolatedSeats} Plätze ohne direkte Nachbarn (z. B. Einzeltische).`,
    });
  }

  const neverCounts = new Map<string, number>();
  for (const r of cls.relations) {
    if (r.kind === 'never') {
      neverCounts.set(r.a, (neverCounts.get(r.a) ?? 0) + 1);
      neverCounts.set(r.b, (neverCounts.get(r.b) ?? 0) + 1);
    }
  }
  for (const [id, cnt] of neverCounts) {
    if (cnt >= Math.max(4, cls.students.length - 3)) {
      conflicts.push({
        scope: 'relation',
        level: 'warn',
        students: [id],
        message: `${nameOf(id)} darf neben sehr vielen Kindern nicht sitzen (${cnt}). Das schränkt die Planung stark ein.`,
      });
    }
  }

  return conflicts;
}

const DEMO_RAW: Array<[string, number, number, number, boolean?, boolean?]> = [
  ['Mia', 4, 5, 3],
  ['Paul', 2, 3, 5],
  ['Lena', 5, 4, 2],
  ['Jonas', 3, 2, 4],
  ['Emma', 4, 4, 3, false, true],
  ['Ben', 2, 2, 5],
  ['Sofia', 5, 5, 2],
  ['Noah', 3, 3, 3],
  ['Hannah', 3, 4, 4],
  ['Elias', 1, 2, 4, true, true],
  ['Lea', 4, 3, 1],
  ['Finn', 3, 4, 5],
  ['Ida', 5, 3, 2],
  ['Luis', 2, 3, 3],
  ['Clara', 4, 5, 3],
  ['Emil', 3, 1, 2],
  ['Marie', 4, 4, 4],
  ['Anton', 2, 4, 3, false, true],
  ['Ella', 3, 3, 2],
  ['Theo', 4, 2, 4],
];

export function createDemoClass(
  authorId: string,
  authorName: string,
  withTables = false,
  customId?: string,
  customName = 'Klasse 4b (Musterklasse)',
  isDemo = true
): SitzplanClass {
  const students: StudentProfile[] = DEMO_RAW.map(
    ([name, concentration, teamwork, talkative, support, front], idx) => ({
      id: `s${idx + 1}`,
      name,
      concentration,
      teamwork,
      talkative,
      support: !!support,
      front: !!front,
    })
  );

  const tables: TableItem[] = [];
  if (withTables) {
    let n = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        tables.push({
          id: `t${n++}`,
          kind: 'pair',
          x: 180 + c * 230,
          y: 190 + r * 150,
          w: 130,
          h: 50,
          rot: 0,
          seats: 2,
        });
      }
    }
    tables.push(
      { id: `t${n++}`, kind: 'group', x: 860, y: 230, w: 130, h: 120, rot: 0, seats: 4 },
      { id: `t${n++}`, kind: 'group', x: 860, y: 470, w: 130, h: 120, rot: 0, seats: 4 }
    );
  }

  return {
    id: customId || genId('c'),
    name: customName,
    classLabel: isDemo ? 'Klasse 4b (Musterklasse)' : customName,
    isDemo,
    roleType: 'klassenleitung',
    subject: 'Klassenraum',
    authorId,
    authorName,
    updatedAt: Date.now(),
    room: {
      w: 1000,
      h: 700,
      tables,
      fixtures: withTables
        ? [
            { id: 'f1', kind: 'board', x: 450, y: 22, w: 360, h: 18, rot: 0 },
            { id: 'f2', kind: 'desk', x: 820, y: 80, w: 130, h: 60, rot: 0 },
            { id: 'f3', kind: 'door', x: 960, y: 680, w: 64, h: 14, rot: 180 },
            { id: 'f4', kind: 'window', x: 12, y: 350, w: 200, h: 10, rot: 270 },
          ]
        : [{ id: 'f1', kind: 'board', x: 500, y: 22, w: 360, h: 18, rot: 0 }],
    },
    students,
    relations: [
      { a: 's2', b: 's6', kind: 'never' },
      { a: 's4', b: 's12', kind: 'apart' },
      { a: 's1', b: 's7', kind: 'good' },
      { a: 's3', b: 's13', kind: 'together' },
      { a: 's10', b: 's15', kind: 'good' },
      { a: 's16', b: 's8', kind: 'together' },
      { a: 's20', b: 's2', kind: 'apart' },
    ],
    plans: [],
    activePlanId: null,
  };
}

export function nextVariantName(plans: { name: string }[]): string {
  const existing = new Set(plans.map((p) => p.name));
  for (let i = 0; i < 26; i++) {
    const candidate = `Variante ${String.fromCharCode(65 + i)}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `Variante ${plans.length + 1}`;
}

export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1103515245) + 12345) >>> 1;
}

export function getClassPlacementStatus(cls: SitzplanClass): {
  placed: number;
  total: number;
  capacity: number;
  complete: boolean;
} {
  const plan = cls.plans.find((p) => p.id === cls.activePlanId) ?? cls.plans[0];
  const seats = getRoomSeats(cls.room);
  const seatSet = new Set(seats.map((s) => s.id));
  const studSet = new Set(cls.students.map((s) => s.id));
  const placed = new Set(
    Object.entries(plan?.assignment ?? {})
      .filter(([seatId, studId]) => seatSet.has(seatId) && studSet.has(studId))
      .map(([, studId]) => studId)
  ).size;
  return {
    placed,
    total: studSet.size,
    capacity: seats.length,
    complete: studSet.size > 0 && placed === studSet.size,
  };
}
