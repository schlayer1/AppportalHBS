export const SAL1KE_GROUP_COLORS: string[] = [
  '#1565C0', // Gruppe 1: Kräftiges Blau
  '#C2410C', // Gruppe 2: Rost-Orange / Terrakotta
  '#2E7D32', // Gruppe 3: Waldgrün
  '#8E24AA', // Gruppe 4: Violett
  '#00796B', // Gruppe 5: Petrol / Dunkel-Teal
  '#C2185B', // Gruppe 6: Beere / Magenta
  '#9A6B00', // Gruppe 7: Ocker / Goldbraun
  '#3B4A6B', // Gruppe 8: Schieferblau
  '#6D28D9', // Gruppe 9: Tiefes Indigo
  '#3F7D20', // Gruppe 10: Moosgrün
  '#0E7C86', // Gruppe 11: Ozean-Türkis
  '#A84A00'  // Gruppe 12: Kupferbraun
];

export interface PreassignedGroupTeam {
  groupIndex: number;
  groupName: string;
  members: string[];
}

export interface QrGroupSession {
  id: string;
  code: string;
  pinCode: string;
  title: string; // Arbeitsauftrag, e.g. "Sucht euch einen Platz und baut eure Station auf"
  subject?: string;
  grade?: string;
  groupCount: number; // 2..12
  groupNames: string[]; // e.g. ["Gruppe 1", "Gruppe 2", ...] or ["Station A", ...]
  groupColors: string[]; // hex colors matching SAL1KE_GROUP_COLORS
  maxSeats: number; // default e.g. 29, expandable via "+10 Plätze mehr" up to 300
  assignedCount: number; // total devices assigned so far
  groupCounts: number[]; // per-group count (hidden on projector stage, viewable in teacher cheat sheet)
  remainingBag: number[]; // fair round-robin random permutation bag of group indices (0..groupCount-1)
  deviceAssignments: Record<string, number>; // deviceToken -> groupIndex (0..groupCount-1)
  preassignedGroups?: PreassignedGroupTeam[]; // optional teams imported from Digital Blackboard GroupMaker
  isOpen: boolean; // Runde offen (true) / geschlossen (false)
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // 7 days TTL (7 * 86400000 ms)
}

export interface QrGroupClaimResult {
  status: 'assigned' | 'already_assigned' | 'closed' | 'full' | 'not_found' | 'error';
  groupIndex?: number;
  groupName?: string;
  groupColor?: string;
  session?: QrGroupSession;
  message?: string;
}

export interface QrGroupPreset {
  id: string;
  label: string;
  title: string;
  groupCount: number;
  maxSeats: number;
  groupNames: string[];
}

export const DEFAULT_GRUPPEN_PRESETS: QrGroupPreset[] = [
  {
    id: 'standard-5',
    label: '5 Gruppen (Klassensatz)',
    title: 'Sucht euch einen Platz und baut eure Station auf',
    groupCount: 5,
    maxSeats: 30,
    groupNames: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4', 'Gruppe 5']
  },
  {
    id: 'grupos-4',
    label: '4 Tischgruppen',
    title: 'Setzt euch an euren Gruppentisch und verteilt die Rollen',
    groupCount: 4,
    maxSeats: 28,
    groupNames: ['Tisch 1', 'Tisch 2', 'Tisch 3', 'Tisch 4']
  },
  {
    id: 'stationen-6',
    label: '6 Lernstationen (A–F)',
    title: 'Geht direkt zu eurer Start-Station für den Stationslauf',
    groupCount: 6,
    maxSeats: 30,
    groupNames: ['Station A', 'Station B', 'Station C', 'Station D', 'Station E', 'Station F']
  },
  {
    id: 'pro-contra-2',
    label: '2 Debattier-Lager (Pro / Contra)',
    title: 'Sammelt in eurem Lager 3 starke Argumente für die Debatte',
    groupCount: 2,
    maxSeats: 30,
    groupNames: ['Team Pro (Dafür)', 'Team Contra (Dagegen)']
  },
  {
    id: 'experten-8',
    label: '8 Kleingruppen / Tandems',
    title: 'Findet euch in eurer Kleingruppe zusammen und startet mit Aufgabe 1',
    groupCount: 8,
    maxSeats: 28,
    groupNames: ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6', 'Team 7', 'Team 8']
  }
];

/**
 * Generates a fresh shuffled permutation bag [0..groupCount-1] using Fisher-Yates.
 * Matches sal1ke's round-robin random order guarantee:
 * "Die Gruppen sind immer gleich groß (höchstens eine Person Unterschied),
 *  und wer nacheinander scannt, kommt in verschiedene Gruppen."
 */
export function createShuffledGroupBag(groupCount: number, avoidFirstIndex?: number): number[] {
  const bag = Array.from({ length: groupCount }, (_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  // Notice: in pop() order, the next drawn item is bag[bag.length - 1].
  // If avoidFirstIndex is given and groupCount > 1, ensure the next drawn item differs from the previous draw
  // so two consecutive scans across bag boundaries never land in the same group.
  if (
    typeof avoidFirstIndex === 'number' &&
    bag.length > 1 &&
    bag[bag.length - 1] === avoidFirstIndex
  ) {
    const swapIdx = Math.floor(Math.random() * (bag.length - 1));
    [bag[bag.length - 1], bag[swapIdx]] = [bag[swapIdx], bag[bag.length - 1]];
  }
  return bag;
}
