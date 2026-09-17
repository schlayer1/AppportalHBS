import { BoardScreen } from '../components/board/types';

export interface PortalUser {
  id: string; // e.g. "t1" or "user-12345"
  name: string; // e.g. "Mustermann"
  pin: string; // 4-digit PIN (e.g. "1234")
  role: 'teacher' | 'admin';
  active: boolean;
  createdAt: number;
  lastLoginAt?: number;
}

export interface CustomUserApp {
  id: string;
  title: string;
  url: string;
  category?: 'kollegium' | 'unterricht' | 'verwaltung' | 'tools' | 'meine';
  icon?: string;
  badge?: string;
  description?: string;
  createdAt: number;
}

export interface SavedBoardTemplate {
  id: string;
  title: string;
  description?: string;
  subject?: string; // e.g. "Mathematik", "Deutsch", "Englisch", "Physik", etc.
  grade?: string; // e.g. "Klasse 5", "Klasse 6", etc.
  isSubstitution?: boolean; // true if this is a substitution lesson
  substitutionClass?: string; // e.g. "7b"
  substitutionNotes?: string; // Instructions for substitute teacher
  targetDate?: string; // e.g. "2026-09-18"
  authorId: string;
  authorName: string;
  isSchoolTemplate: boolean; // true = visible for all teachers
  screen: BoardScreen; // full board state (widgets, contents, positions, sizes, background)
  createdAt: number;
  updatedAt: number;
}

export type PortalViewMode = 'bento' | 'compact' | 'smartboard';

export interface UserPreferences {
  userId: string;
  appOrder?: string[]; // ordered array of school app and custom app IDs
  favorites?: string[]; // favorite app IDs
  customApps?: CustomUserApp[];
  portalViewMode?: PortalViewMode;
  updatedAt: number;
}
