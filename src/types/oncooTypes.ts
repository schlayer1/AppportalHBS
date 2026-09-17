export type OncooToolType = 
  | 'kartenabfrage'   // Digitale Kartenabfrage / Pinnwand
  | 'zielscheibe'     // Zielscheiben-Evaluation
  | 'lerntempoduett'  // Lerntempoduett (Tandem-Partnerfindung)
  | 'helfersystem'    // Helfersystem / Schülerbörse
  | 'placemat';       // Placemat (4-Felder Think-Pair-Share)

// 1. KARTENABFRAGE
export type OncooCardColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface OncooCard {
  id: string;
  text: string;
  color: OncooCardColor;
  columnId?: string;
  x?: number; // optional free canvas offset
  y?: number;
  authorAlias?: string;
  createdAt: number;
  likes?: number;
}

export interface OncooColumn {
  id: string;
  title: string;
  color?: string;
}

// 2. ZIELSCHEIBE
export interface OncooTargetCriterion {
  id: string;
  label: string;
  description?: string;
}

export interface OncooTargetVote {
  id: string;
  studentAlias?: string;
  // criterionId -> score 1..5
  scores: Record<string, number>;
  createdAt: number;
}

// 3. LERNTEMPODUETT
export interface OncooDuettTask {
  phaseNumber: number;
  title: string;
  description: string;
}

export interface OncooDuettPair {
  id: string;
  student1: string;
  student2: string;
  tableNumber?: number;
  pairedAt: number;
  phase: number;
}

// 4. HELFERSYSTEM
export interface OncooHelpItem {
  id: string;
  type: 'seek' | 'offer'; // seek help or offer help
  studentName: string;
  topic: string;
  status: 'open' | 'matched' | 'resolved';
  helperName?: string;
  createdAt: number;
}

// 5. PLACEMAT
export interface OncooPlacematGroup {
  id: string;
  groupName: string;
  cornerA: { author: string; notes: string[] };
  cornerB: { author: string; notes: string[] };
  cornerC: { author: string; notes: string[] };
  cornerD: { author: string; notes: string[] };
  consensus: string;
  phase: 'think' | 'pair' | 'share';
}

// FULL SESSION OBJECT
export interface OncooSession {
  id: string;
  toolType: OncooToolType;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  authorId: string;
  authorName: string;
  isShared: boolean;
  createdAt: number;
  updatedAt: number;
  pinCode: string;
  isActive: boolean;
  isLocked?: boolean; // freeze incoming student submissions

  // Tool specific configurations and current live data
  kartenabfrage?: {
    question: string;
    columns: OncooColumn[];
    cards: OncooCard[];
    allowMultipleCards: boolean;
    maxCardsPerStudent: number;
    showAuthor: boolean;
    allowLikes: boolean;
  };

  zielscheibe?: {
    title: string;
    rings: number; // 5
    criteria: OncooTargetCriterion[];
    votes: OncooTargetVote[];
    minLabel?: string; // "Trifft gar nicht zu"
    maxLabel?: string; // "Trifft voll zu"
  };

  lerntempoduett?: {
    taskTitle: string;
    phases: OncooDuettTask[];
    currentPhase: number;
    waitingQueue: string[];
    pairs: OncooDuettPair[];
  };

  helfersystem?: {
    exerciseTitle: string;
    topics: string[];
    items: OncooHelpItem[];
  };

  placemat?: {
    topic: string;
    groups: OncooPlacematGroup[];
  };
}

export const DEFAULT_ONCOO_TEMPLATES: OncooSession[] = [
  {
    id: 'oncoo-tmpl-1',
    toolType: 'kartenabfrage',
    title: 'Brainstorming: Erneuerbare Energien & Zukunft',
    description: 'Ideensammlung für den Physik- und Geografieunterricht Klasse 8–10',
    subject: 'Physik',
    grade: 'Klasse 8–10',
    authorId: 'system',
    authorName: 'Heimbürgeschule Fachschaft',
    isShared: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    pinCode: '748291',
    isActive: false,
    kartenabfrage: {
      question: 'Welche Chancen und Herausforderungen bieten erneuerbare Energien in Thüringen?',
      columns: [
        { id: 'col-1', title: '☀️ Solarenergie & Photovoltaik', color: 'yellow' },
        { id: 'col-2', title: '💨 Windkraft & Speicher', color: 'blue' },
        { id: 'col-3', title: '🌱 Biomasse & Geothermie', color: 'green' },
        { id: 'col-4', title: '⚡ Netzausbau & Akzeptanz', color: 'orange' },
      ],
      cards: [
        { id: 'c-1', text: 'Dächer von Schulen und Hallen für PV nutzen', color: 'yellow', columnId: 'col-1', authorAlias: 'Tim', createdAt: Date.now() - 3600000, likes: 4 },
        { id: 'c-2', text: 'Windräder im Wald sind umstritten wegen Rodung', color: 'blue', columnId: 'col-2', authorAlias: 'Lea', createdAt: Date.now() - 3400000, likes: 2 },
        { id: 'c-3', text: 'Batteriespeicher in Wohnsiedlungen zur Netzstabilisierung', color: 'blue', columnId: 'col-2', authorAlias: 'Jonas', createdAt: Date.now() - 3200000, likes: 5 },
        { id: 'c-4', text: 'Biogas aus Abfällen statt Mais-Monokulturen', color: 'green', columnId: 'col-3', authorAlias: 'Sophie', createdAt: Date.now() - 3000000, likes: 3 },
      ],
      allowMultipleCards: true,
      maxCardsPerStudent: 3,
      showAuthor: true,
      allowLikes: true
    }
  },
  {
    id: 'oncoo-tmpl-2',
    toolType: 'zielscheibe',
    title: 'Stunden-Reflexion & Selbstevaluation',
    description: 'Schnelle Zielscheiben-Rückmeldung am Ende einer Doppelstunde',
    subject: 'Fächerübergreifend',
    grade: 'Alle Klassen',
    authorId: 'system',
    authorName: 'Heimbürgeschule Kollegium',
    isShared: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    pinCode: '392810',
    isActive: false,
    zielscheibe: {
      title: 'Wie hast du die heutige Stunde empfunden?',
      rings: 5,
      minLabel: '1 = Gar nicht',
      maxLabel: '5 = Voll und ganz',
      criteria: [
        { id: 'crit-1', label: 'Verständlichkeit', description: 'Waren Erklärungen und Aufgaben klar?' },
        { id: 'crit-2', label: 'Arbeitstempo', description: 'Hat die Zeit für die Aufgaben gut gereicht?' },
        { id: 'crit-3', label: 'Eigene Mitarbeit', description: 'Hast du aktiv und konzentriert mitgearbeitet?' },
        { id: 'crit-4', label: 'Lernzuwachs', description: 'Hast du heute etwas Neues verstanden?' },
      ],
      votes: [
        { id: 'v-1', studentAlias: 'Schüler 1', scores: { 'crit-1': 5, 'crit-2': 4, 'crit-3': 4, 'crit-4': 5 }, createdAt: Date.now() - 1800000 },
        { id: 'v-2', studentAlias: 'Schüler 2', scores: { 'crit-1': 4, 'crit-2': 3, 'crit-3': 5, 'crit-4': 4 }, createdAt: Date.now() - 1700000 },
        { id: 'v-3', studentAlias: 'Schüler 3', scores: { 'crit-1': 5, 'crit-2': 5, 'crit-3': 4, 'crit-4': 4 }, createdAt: Date.now() - 1600000 },
        { id: 'v-4', studentAlias: 'Schüler 4', scores: { 'crit-1': 4, 'crit-2': 4, 'crit-3': 3, 'crit-4': 4 }, createdAt: Date.now() - 1500000 },
      ]
    }
  },
  {
    id: 'oncoo-tmpl-3',
    toolType: 'lerntempoduett',
    title: 'Mathe-Tandem: Quadratische Gleichungen & pq-Formel',
    description: 'Kooperative Partnerprüfung nach individueller Rechenphase',
    subject: 'Mathematik',
    grade: 'Klasse 9',
    authorId: 'system',
    authorName: 'Fachschaft Mathematik',
    isShared: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    pinCode: '581920',
    isActive: false,
    lerntempoduett: {
      taskTitle: 'Einzelarbeit: Lehrbuch S. 78 Nr. 3 & 4 lösen',
      currentPhase: 1,
      phases: [
        { phaseNumber: 1, title: 'Einzelarbeit', description: 'Jeder rechnet die Aufgaben 3a-d und 4 im Heft.' },
        { phaseNumber: 2, title: 'Tandem-Vergleich', description: 'Vergleicht eure Rechenwege und korrigiert Vorzeichenfehler.' },
        { phaseNumber: 3, title: 'Expertenaufgabe', description: 'Gemeinsam die Anwendungsaufgabe Nr. 7 bearbeiten.' },
      ],
      waitingQueue: ['Lukas B.'],
      pairs: [
        { id: 'pair-1', student1: 'Felix M.', student2: 'Hannah K.', tableNumber: 3, pairedAt: Date.now() - 600000, phase: 2 },
        { id: 'pair-2', student1: 'Noah S.', student2: 'Emma W.', tableNumber: 5, pairedAt: Date.now() - 300000, phase: 2 },
      ]
    }
  },
  {
    id: 'oncoo-tmpl-4',
    toolType: 'helfersystem',
    title: 'Offene Hilfebörse: Deutsch Grammatik & Satzglieder',
    description: 'Peer-Teaching: Schüler helfen Schülern bei Übungsaufgaben',
    subject: 'Deutsch',
    grade: 'Klasse 6–7',
    authorId: 'system',
    authorName: 'Fachschaft Deutsch',
    isShared: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    pinCode: '194820',
    isActive: false,
    helfersystem: {
      exerciseTitle: 'Stationenlernen: Subjekt, Prädikat, Dativ- und Akkusativobjekt',
      topics: [
        'Station 1: Subjekt & Prädikat erfragen',
        'Station 2: Dativobjekt (Wem-Fall)',
        'Station 3: Akkusativobjekt (Wen-Fall)',
        'Station 4: Adverbiale Bestimmungen',
      ],
      items: [
        { id: 'h-1', type: 'offer', studentName: 'Mia T.', topic: 'Station 2: Dativobjekt (Wem-Fall)', status: 'matched', helperName: 'Paul G.', createdAt: Date.now() - 900000 },
        { id: 'h-2', type: 'seek', studentName: 'Paul G.', topic: 'Station 2: Dativobjekt (Wem-Fall)', status: 'matched', helperName: 'Mia T.', createdAt: Date.now() - 900000 },
        { id: 'h-3', type: 'offer', studentName: 'Jan N.', topic: 'Station 1: Subjekt & Prädikat erfragen', status: 'open', createdAt: Date.now() - 400000 },
        { id: 'h-4', type: 'seek', studentName: 'Ben R.', topic: 'Station 3: Akkusativobjekt (Wen-Fall)', status: 'open', createdAt: Date.now() - 200000 },
      ]
    }
  },
  {
    id: 'oncoo-tmpl-5',
    toolType: 'placemat',
    title: 'Placemat: Chancen & Risiken von KI im Unterricht',
    description: 'Kooperative 4-Felder-Methode mit Gruppenkonsens',
    subject: 'Ethik / Medien',
    grade: 'Klasse 8–10',
    authorId: 'system',
    authorName: 'Medienbildung HBS',
    isShared: true,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
    pinCode: '620194',
    isActive: false,
    placemat: {
      topic: 'Wie verändert Künstliche Intelligenz das Lernen und Arbeiten an unserer Schule?',
      groups: [
        {
          id: 'grp-1',
          groupName: 'Tisch 1 (Gruppe Alpha)',
          phase: 'pair',
          cornerA: { author: 'Schüler A (Norden)', notes: ['Erklärt schwierige Mathe-Themen rund um die Uhr', 'Spart Zeit bei Zusammenfassungen'] },
          cornerB: { author: 'Schüler B (Osten)', notes: ['Gefahr, dass man nicht mehr selbst nachdenkt', 'Falsche Quellenangaben (Halluzinationen)'] },
          cornerC: { author: 'Schüler C (Süden)', notes: ['Kann personalisierte Vokabeltests erstellen', 'Super für Sprachübungen'] },
          cornerD: { author: 'Schüler D (Westen)', notes: ['Datenschutz und Urheberrecht unklar', 'Macht Schule moderner'] },
          consensus: 'KI ist ein starkes Lernwerkzeug für Erklärungen und Übungen, darf aber das eigene Denken und Formulieren nicht ersetzen.'
        }
      ]
    }
  }
];
