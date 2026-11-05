/**
 * Hilfsfunktionen für Dateiverwaltung, Formatierung und Typ-Erkennung
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'ppt',
  'pptx',
  'odp',
  'xls',
  'xlsx',
  'ods',
  'txt',
  'md',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'mp3',
  'm4a',
  'wav'
];

export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB pro Einzeldatei
export const TOTAL_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB Free Tier
