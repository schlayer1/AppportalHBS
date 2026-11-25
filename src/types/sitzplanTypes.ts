export type TableKind = 'single' | 'pair' | 'group' | 'row';

export type FixtureKind =
  | 'board'
  | 'desk'
  | 'door'
  | 'window'
  | 'cabinet'
  | 'sink'
  | 'carpet'
  | 'bin'
  | 'stool'
  | 'readingTable'
  | 'bookshelf'
  | 'bench';

export interface TableItem {
  id: string;
  kind: TableKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  seats: number;
  z?: number;
}

export interface FixtureItem {
  id: string;
  kind: FixtureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  z?: number;
}

export interface RoomLayout {
  w: number;
  h: number;
  tables: TableItem[];
  fixtures: FixtureItem[];
}

export interface StudentProfile {
  id: string;
  name: string;
  concentration: number; // 1..5
  teamwork: number; // 1..5
  talkative: number; // 1..5
  support: boolean;
  front: boolean;
  solo?: boolean;
}

export type RelationKind = 'never' | 'apart' | 'good' | 'together';

export interface RelationRule {
  a: string;
  b: string;
  kind: RelationKind;
}

export interface SeatPlan {
  id: string;
  name: string;
  seed: number;
  assignment: Record<string, string>; // seatId -> studentId
  locked: string[]; // seatId[]
  createdAt: number;
  basePlanId?: string;
}

export type PlanRoleType = 'klassenleitung' | 'fachlehrer';

export const FACHRAUM_SUBJECTS = [
  'Klassenraum',
  'Chemie',
  'Physik',
  'Kunst',
  'Biologie',
  'Informatik',
  'Musik',
  'Werken',
] as const;

export interface SitzplanClass {
  id: string;
  name: string; // Display name e.g. "Klasse 4b" or "7a · Chemie"
  classLabel?: string; // Normalized class name for shared overview e.g. "7a"
  roleType?: PlanRoleType;
  subject?: string; // e.g. "Klassenraum" | "Chemie" | "Physik" | "Kunst" | "Biologie"
  roomLabel?: string; // e.g. "Raum 204" or "Chemieraum"
  authorId?: string;
  authorName?: string;
  sharedPlanId?: string | null; // planId currently published to colleagues
  sharedUpdatedAt?: number;
  updatedAt?: number;
  room: RoomLayout;
  students: StudentProfile[];
  relations: RelationRule[];
  plans: SeatPlan[];
  activePlanId: string | null;
}

export interface RoomTemplate {
  id: string;
  name: string;
  room: RoomLayout;
}

export interface SitzplanWorkspaceData {
  version: number;
  authorId: string;
  authorName: string;
  classes: SitzplanClass[];
  activeClassId: string;
  expert: boolean;
  roomTemplates: RoomTemplate[];
  updatedAt: number;
}

/**
 * Privacy-safe snapshot stored in R2 under sitzplan/shared/plans/{id}.json
 * Contains NO private pedagogical ratings or relationship rules.
 */
export interface SharedSeatingPlan {
  id: string; // e.g. `${authorId}__${classId}`
  classId: string;
  planId: string;
  planName: string;
  classLabel: string; // Normalized class name e.g. "Klasse 4b" / "7a"
  roleType: PlanRoleType;
  subject: string; // e.g. "Klassenleitung" | "Chemie" | "Physik" | "Kunst" | "Biologie"
  roomLabel?: string;
  authorId: string;
  authorName: string;
  notes?: string;
  room: RoomLayout;
  assignment: Record<string, string>;
  students: Array<{ id: string; name: string }>;
  updatedAt: number;
}

export interface SeatSlot {
  id: string;
  tableId: string;
  index: number;
  x: number;
  y: number;
}

export interface SeatGraph {
  seats: SeatSlot[];
  byId: Map<string, SeatSlot>;
  neighbors: Map<string, Set<string>>;
  tableOf: Map<string, string>;
  frontness: Map<string, number>;
  front: Set<string>;
}

export type EvaluationSeverity = 'hard' | 'warn' | 'info' | 'good';

export interface EvaluationItem {
  key: string;
  ruleId: string;
  cost: number;
  severity: EvaluationSeverity;
  students: string[];
  message: string;
}

export interface PlanReport {
  total: number;
  items: EvaluationItem[];
  hard: { total: number; ok: number };
  wishes: { total: number; ok: number; missed: EvaluationItem[] };
  problems: EvaluationItem[];
  front: { total: number; ok: number };
  tables: Array<{ tableId: string; names: string[]; talk: number; team: number }>;
  unplaced: string[];
}

export interface SwapSuggestion {
  seatA: string;
  seatB: string;
  delta: number;
  resolved: EvaluationItem[];
  created: EvaluationItem[];
  message: string;
}

export interface RuleConflict {
  scope: 'relation' | 'room';
  level: 'error' | 'warn';
  students: string[];
  message: string;
}
