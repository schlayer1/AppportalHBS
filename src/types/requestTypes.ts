export type RequestCategory = 'wunsch' | 'app_idee' | 'problem' | 'unterricht';

export type RequestStatus = 'eingereicht' | 'in_pruefung' | 'in_planung' | 'umgesetzt' | 'geschlossen';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  authorName: string;
  authorId: string;
  createdAt: number;
  votes: string[]; // List of userIds/deviceIds who upvoted
  status: RequestStatus;
  adminComment?: string;
}

export interface ChangelogItem {
  id: string;
  type: 'neu' | 'verbessert' | 'behoben';
  title: string;
  description: string;
  badge?: string;
}

export interface ChangelogRelease {
  version: string;
  title: string;
  date: string;
  isLatest?: boolean;
  highlight?: string;
  items: ChangelogItem[];
}
