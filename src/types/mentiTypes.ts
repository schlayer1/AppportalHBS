export type MentiSlideType = 
  | 'wordcloud'     // Wortwolke
  | 'choice'        // Multiple Choice (Balkendiagramm)
  | 'open'          // Offene Fragen / Sprechblasen-Pinnwand
  | 'scales'        // Bewertungsskalen (Likert 1-5)
  | 'quiz'          // Quiz-Wettbewerb mit Zeitlimit & Leaderboard
  | 'matrix'        // 2x2 Matrix / Priorisierungs-Quadrant
  | 'ranking'       // Rangfolge / Sortieraufgabe
  | 'content';      // Infofolie (Text, Merksatz)

export interface MentiChoiceOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface MentiScaleStatement {
  id: string;
  statement: string;
  lowLabel?: string;  // e.g. "Stimmt gar nicht"
  highLabel?: string; // e.g. "Stimmt voll"
}

export interface MentiMatrixItem {
  id: string;
  label: string;
}

export interface MentiMatrixConfig {
  xLowLabel: string;   // e.g. "Geringer Nutzen"
  xHighLabel: string;  // e.g. "Hoher Nutzen"
  yLowLabel: string;   // e.g. "Geringer Aufwand"
  yHighLabel: string;  // e.g. "Hoher Aufwand"
  quadrantTL?: string;
  quadrantTR?: string;
  quadrantBL?: string;
  quadrantBR?: string;
  items?: MentiMatrixItem[];
}

export interface MentiRankingItem {
  id: string;
  text: string;
}

export interface MentiSlide {
  id: string;
  type: MentiSlideType;
  question: string;
  description?: string;
  
  // Choice options
  options?: MentiChoiceOption[];
  allowMultiple?: boolean;

  // Wordcloud options
  maxWordsPerUser?: number; // 1, 2 or 3

  // Scales options
  scales?: MentiScaleStatement[];

  // Matrix options
  matrixConfig?: MentiMatrixConfig;

  // Ranking options
  rankingItems?: MentiRankingItem[];

  // Quiz options
  timeLimitSeconds?: number; // 15, 30, 45, 60
  points?: number; // default 1000

  // Infofolie
  bulletPoints?: string[];
  emoji?: string;
}

export interface MentiSurveySettings {
  isEnabled: boolean;             // Whether async survey is active
  surveyCode: string;             // 6-digit or slug code, e.g. "582194"
  expiresAt: number | null;       // Timestamp when survey expires (null = unlimited / until manual close)
  durationDays: number | null;    // Configured duration preset: 2, 7, 14, 30 or null
  allowViewResultsAfterVote?: boolean; // Can colleagues see live results after submitting?
  createdAt: number;
  closedAt?: number | null;
}

export interface MentiPresentation {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  folder?: string; // e.g. "Klasse 7a", "Vertretung", "Mathematik"
  tags?: string[];
  authorId: string;
  authorName: string;
  isShared: boolean; // Shared with the whole school
  createdAt: number;
  updatedAt: number;
  slides: MentiSlide[];
  
  // Asynchronous Survey Settings & Results
  surveySettings?: MentiSurveySettings;
  responsesCount?: number;

  // Archived results from last run
  archivedResponses?: Record<string, any>;
  lastRunAt?: number;
}

export interface MentiLiveReaction {
  id: string;
  emoji: string;
  xOffset: number; // percentage across screen (0-100)
  timestamp: number;
}

export interface MentiLiveSession {
  presentationId: string;
  presentationTitle: string;
  sessionCode: string; // 6-digit PIN e.g. "492815"
  currentSlideIndex: number;
  isVotingOpen: boolean;
  showResults: boolean;
  activeSlide: MentiSlide;
  totalSlides: number;
  participantsCount: number;
  
  // Responses indexed by slideId
  responses: Record<string, any>;

  // Quiz leaderboard: sorted participants
  quizLeaderboard?: { name: string; score: number }[];

  // Realtime reactions
  recentReactions?: MentiLiveReaction[];
  
  updatedAt: number;

  // Asynchronous Survey / Audience-Paced Mode
  isSurveyMode?: boolean;
  slides?: MentiSlide[];           // All slides so voters navigate independently
  expiresAt?: number | null;       // Timestamp when survey expires
  isClosed?: boolean;              // Manually closed
  allowViewResults?: boolean;      // Whether voters can view intermediate results
  authorName?: string;
  authorId?: string;
}
