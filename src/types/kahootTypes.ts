export type KahootShape = 'triangle' | 'diamond' | 'circle' | 'square';

export interface KahootOption {
  id: string;
  text: string;
  isCorrect: boolean;
  shape: KahootShape;
  color: 'red' | 'blue' | 'yellow' | 'green';
}

export interface KahootQuestion {
  id: string;
  question: string;
  timeLimitSeconds: number; // 10, 20, 30, 60
  points: number; // 1000, 2000
  type: 'quiz' | 'true_false';
  options: KahootOption[];
  explanation?: string;
  image?: string;
}

export interface KahootGame {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  folder?: string; // e.g. "Klasse 8b", "Vertretung", "Geschichte"
  tags?: string[];
  authorId: string;
  authorName: string;
  isShared: boolean;
  createdAt: number;
  updatedAt: number;
  questions: KahootQuestion[];
  timesPlayed?: number;
}

export type KahootGameMode = 'individual' | 'team';

export interface KahootParticipant {
  id: string;
  nickname: string;
  avatar: string; // emoji e.g. 🦊, 🚀, 🦁, ⚡
  score: number;
  streak: number;
  isTeam?: boolean;
  teamMembers?: string[];
  lastAnswerId?: string;
  lastAnswerTime?: number;
  lastAnswerCorrect?: boolean;
  lastPointsEarned?: number;
}

export type KahootSessionStage = 
  | 'lobby'          // Waiting for students to join
  | 'get_ready'      // 3s preview before question
  | 'question'       // Countdown and answer inputs active
  | 'reveal'         // Show correct answer and bar counts
  | 'scoreboard'     // Top 5 Leaderboard
  | 'podium';        // Final 1., 2., 3. place celebration

export interface KahootLiveSession {
  gameId: string;
  gameTitle: string;
  sessionCode: string; // 6 digits e.g. "839 201"
  stage: KahootSessionStage;
  gameMode?: KahootGameMode;
  currentQuestionIndex: number;
  totalQuestions: number;
  activeQuestion?: KahootQuestion;
  timeLeft: number;
  isAnswerOpen: boolean;
  participants: KahootParticipant[];
  answersReceived: number;
  updatedAt: number;
}

export interface AiGeneratedQuestionDraft {
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  timeLimitSeconds?: number;
}
