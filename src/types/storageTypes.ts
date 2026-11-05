/**
 * Typdefinitionen für das Dateiablage- und Ordnersystem im HBS App-Portal
 */

export interface StorageFolder {
  id: string;
  name: string;
  parentId: string | null; // null = Stammverzeichnis
  isShared: boolean; // true = Kollegiums-Austausch, false = Mein Speicher
  ownerId: string; // z.B. "t-keller" oder "system"
  ownerName: string; // z.B. "Keller"
  color?: string; // z.B. "blue", "amber", "teal", "purple", "rose", "emerald", "slate"
  subject?: string; // z.B. "Mathematik", "Deutsch", "Englisch", etc.
  grade?: string; // z.B. "Klasse 5", "Klasse 7"
  createdAt: number;
  updatedAt: number;
}

export interface StorageFile {
  id: string;
  name: string; // Angezeigter Dateiname z.B. "Arbeitsblatt_Dreiecke.pdf"
  folderId: string | null; // null = Stammverzeichnis des jeweiligen Bereichs
  isShared: boolean; // true = Austauschbereich, false = Mein Bereich
  ownerId: string;
  ownerName: string;
  r2Key: string; // Eindeutiger Schlüssel im Cloudflare R2 Bucket
  fileSize: number; // in Bytes
  mimeType: string; // z.B. "application/pdf"
  fileExtension: string; // z.B. "pdf", "docx", "png"
  subject?: string;
  grade?: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export type StorageScope = 'personal' | 'shared';
export type StorageViewLayout = 'grid' | 'table';

export interface StorageQuotaInfo {
  totalBytes: number;
  fileCount: number;
  maxBytes: number; // 10 GB Free Tier = 10 * 1024 * 1024 * 1024
}
