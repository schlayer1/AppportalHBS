import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { StorageFolder, StorageFile } from '../types/storageTypes';

const FOLDERS_COLLECTION = 'hbs_storage_folders';
const FILES_COLLECTION = 'hbs_storage_files';

const LOCAL_FOLDERS_CACHE_KEY = 'hbs_storage_folders_cache_v1';
const LOCAL_FILES_CACHE_KEY = 'hbs_storage_files_cache_v1';

// Vordefinierte Fachschaftsordner für den Austauschbereich
export const DEFAULT_SHARED_FOLDERS: StorageFolder[] = [
  {
    id: 'shared-mathe',
    name: 'Mathematik',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'blue',
    subject: 'Mathematik',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-deutsch',
    name: 'Deutsch',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'amber',
    subject: 'Deutsch',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-englisch',
    name: 'Englisch & Fremdsprachen',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'purple',
    subject: 'Englisch',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-bio',
    name: 'Biologie & Naturwissenschaften',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'emerald',
    subject: 'Biologie',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-geschichte',
    name: 'Geschichte & Geografie',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'rose',
    subject: 'Geschichte',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-physik',
    name: 'Physik & Chemie',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Fachschaft',
    color: 'teal',
    subject: 'Physik',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-orga',
    name: 'Schulleitung & Organisation',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Schulleitung',
    color: 'slate',
    subject: 'Verwaltung',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  },
  {
    id: 'shared-allgemein',
    name: 'Allgemeines Kollegium',
    parentId: null,
    isShared: true,
    ownerId: 'system',
    ownerName: 'Kollegium',
    color: 'indigo',
    subject: 'Allgemein',
    createdAt: 1704067200000,
    updatedAt: 1704067200000
  }
];

// Lokale Hilfsfunktionen für Caching
export function getCachedFolders(): StorageFolder[] {
  try {
    const raw = localStorage.getItem(LOCAL_FOLDERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Fehler beim Lesen des Ordner-Caches:', e);
  }
  return DEFAULT_SHARED_FOLDERS;
}

export function setCachedFolders(folders: StorageFolder[]) {
  try {
    localStorage.setItem(LOCAL_FOLDERS_CACHE_KEY, JSON.stringify(folders));
  } catch (e) {
    console.warn('Fehler beim Speichern des Ordner-Caches:', e);
  }
}

export function getCachedFiles(): StorageFile[] {
  try {
    const raw = localStorage.getItem(LOCAL_FILES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Fehler beim Lesen des Datei-Caches:', e);
  }
  return [];
}

export function setCachedFiles(files: StorageFile[]) {
  try {
    localStorage.setItem(LOCAL_FILES_CACHE_KEY, JSON.stringify(files));
  } catch (e) {
    console.warn('Fehler beim Speichern des Datei-Caches:', e);
  }
}

/**
 * Abonniert Ordner und Dateien in Echtzeit via Firestore onSnapshot
 */
export function subscribeToStorage(
  callback: (data: { folders: StorageFolder[]; files: StorageFile[] }) => void
): () => void {
  let currentFolders = getCachedFolders();
  let currentFiles = getCachedFiles();

  if (!db) {
    callback({ folders: currentFolders, files: currentFiles });
    return () => {};
  }

  let unsubFolders: (() => void) | null = null;
  let unsubFiles: (() => void) | null = null;

  try {
    const foldersCol = collection(db, FOLDERS_COLLECTION);
    unsubFolders = onSnapshot(
      foldersCol,
      (snap) => {
        if (!snap.empty) {
          const list: StorageFolder[] = [];
          snap.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as Omit<StorageFolder, 'id'>) });
          });
          currentFolders = list;
          setCachedFolders(list);
        } else {
          // Falls noch keine Ordner in Firestore existieren: Seed-Ordner anlegen
          initSeedFolders();
        }
        callback({ folders: currentFolders, files: currentFiles });
      },
      (err) => {
        console.warn('Firestore Folders onSnapshot Fehler:', err);
      }
    );

    const filesCol = collection(db, FILES_COLLECTION);
    unsubFiles = onSnapshot(
      filesCol,
      (snap) => {
        const list: StorageFile[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<StorageFile, 'id'>) });
        });
        currentFiles = list;
        setCachedFiles(list);
        callback({ folders: currentFolders, files: currentFiles });
      },
      (err) => {
        console.warn('Firestore Files onSnapshot Fehler:', err);
      }
    );
  } catch (err) {
    console.warn('Konnte Storage-Subscription nicht starten:', err);
  }

  return () => {
    if (unsubFolders) unsubFolders();
    if (unsubFiles) unsubFiles();
  };
}

/**
 * Initialisiert die Standard-Austauschordner in Firestore, falls leer
 */
export async function initSeedFolders(): Promise<void> {
  if (!db) return;
  try {
    for (const folder of DEFAULT_SHARED_FOLDERS) {
      const docRef = doc(db, FOLDERS_COLLECTION, folder.id);
      await setDoc(docRef, folder, { merge: true });
    }
  } catch (err) {
    console.warn('Fehler beim Initialisieren der Standard-Ordner:', err);
  }
}

/**
 * Erstellt einen neuen Ordner
 */
export async function createStorageFolder(
  folder: Omit<StorageFolder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StorageFolder> {
  const newFolder: StorageFolder = {
    ...folder,
    id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (db) {
    const docRef = doc(db, FOLDERS_COLLECTION, newFolder.id);
    await setDoc(docRef, newFolder);
  }

  const cached = getCachedFolders();
  cached.push(newFolder);
  setCachedFolders(cached);

  return newFolder;
}

/**
 * Benennt einen Ordner um
 */
export async function updateStorageFolder(
  id: string,
  updates: Partial<Pick<StorageFolder, 'name' | 'color' | 'subject' | 'grade'>>
): Promise<void> {
  if (db) {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  }

  const cached = getCachedFolders();
  const index = cached.findIndex((f) => f.id === id);
  if (index !== -1) {
    cached[index] = { ...cached[index], ...updates, updatedAt: Date.now() };
    setCachedFolders(cached);
  }
}

/**
 * Löscht einen Ordner
 */
export async function deleteStorageFolder(id: string): Promise<void> {
  if (db) {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await deleteDoc(docRef);
  }

  const cached = getCachedFolders().filter((f) => f.id !== id);
  setCachedFolders(cached);
}

/**
 * Speichert Metadaten einer neu hochgeladenen Datei in Firestore
 */
export async function addStorageFileRecord(
  fileData: Omit<StorageFile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StorageFile> {
  const newFile: StorageFile = {
    ...fileData,
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (db) {
    const docRef = doc(db, FILES_COLLECTION, newFile.id);
    await setDoc(docRef, newFile);
  }

  const cached = getCachedFiles();
  cached.push(newFile);
  setCachedFiles(cached);

  return newFile;
}

/**
 * Aktualisiert Dateimetadaten (z.B. Umbenennen, Verschieben)
 */
export async function updateStorageFileRecord(
  id: string,
  updates: Partial<Pick<StorageFile, 'name' | 'folderId' | 'isShared' | 'subject' | 'grade' | 'description' | 'tags'>>
): Promise<void> {
  if (db) {
    const docRef = doc(db, FILES_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  }

  const cached = getCachedFiles();
  const index = cached.findIndex((f) => f.id === id);
  if (index !== -1) {
    cached[index] = { ...cached[index], ...updates, updatedAt: Date.now() };
    setCachedFiles(cached);
  }
}

/**
 * Löscht Dateimetadaten aus Firestore
 */
export async function deleteStorageFileRecord(id: string): Promise<void> {
  if (db) {
    const docRef = doc(db, FILES_COLLECTION, id);
    await deleteDoc(docRef);
  }

  const cached = getCachedFiles().filter((f) => f.id !== id);
  setCachedFiles(cached);
}
