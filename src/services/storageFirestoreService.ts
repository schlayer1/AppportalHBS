import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { StorageFolder, StorageFile, TeacherStorageStats } from '../types/storageTypes';
import { deleteFilesFromR2 } from './r2StorageService';

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

/**
 * Berechnet Statistiken über die Speicherbelegung einer bestimmten Lehrkraft
 */
export function getTeacherStorageStats(
  teacherId: string,
  files: StorageFile[],
  folders: StorageFolder[] = []
): TeacherStorageStats {
  const teacherFiles = files.filter((f) => f.ownerId === teacherId);
  const privateFiles = teacherFiles.filter((f) => !f.isShared);
  const sharedFiles = teacherFiles.filter((f) => f.isShared);
  const teacherFolders = folders.filter((f) => f.ownerId === teacherId && !f.isShared);

  const privateBytes = privateFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  const sharedBytes = sharedFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  return {
    teacherId,
    totalBytes: privateBytes + sharedBytes,
    privateBytes,
    sharedBytes,
    filesCount: teacherFiles.length,
    privateFilesCount: privateFiles.length,
    sharedFilesCount: sharedFiles.length,
    foldersCount: teacherFolders.length
  };
}

/**
 * Berechnet die Speicherbelegung für alle Lehrkräfte in einer Map { [teacherId]: TeacherStorageStats }
 */
export function getAllTeachersStorageStats(
  files: StorageFile[],
  folders: StorageFolder[] = []
): Record<string, TeacherStorageStats> {
  const map: Record<string, TeacherStorageStats> = {};

  files.forEach((f) => {
    if (!f.ownerId) return;
    if (!map[f.ownerId]) {
      map[f.ownerId] = {
        teacherId: f.ownerId,
        totalBytes: 0,
        privateBytes: 0,
        sharedBytes: 0,
        filesCount: 0,
        privateFilesCount: 0,
        sharedFilesCount: 0,
        foldersCount: 0
      };
    }
    const size = f.fileSize || 0;
    map[f.ownerId].totalBytes += size;
    map[f.ownerId].filesCount += 1;
    if (f.isShared) {
      map[f.ownerId].sharedBytes += size;
      map[f.ownerId].sharedFilesCount += 1;
    } else {
      map[f.ownerId].privateBytes += size;
      map[f.ownerId].privateFilesCount += 1;
    }
  });

  folders.forEach((folder) => {
    if (!folder.ownerId || folder.isShared) return;
    if (!map[folder.ownerId]) {
      map[folder.ownerId] = {
        teacherId: folder.ownerId,
        totalBytes: 0,
        privateBytes: 0,
        sharedBytes: 0,
        filesCount: 0,
        privateFilesCount: 0,
        sharedFilesCount: 0,
        foldersCount: 0
      };
    }
    map[folder.ownerId].foldersCount += 1;
  });

  return map;
}

/**
 * 1-Klick-Löschung & Deprovisionierung einer scheidenden Lehrkraft:
 * - Löscht alle privaten Dateien aus Cloudflare R2
 * - Löscht alle privaten Dateieinträge aus Firestore
 * - Löscht alle privaten Ordner aus Firestore
 * - Falls keepSharedMaterials === true: Geteilte Dateien im Austauschbereich bleiben der Fachschaft erhalten
 *   (Besitzer wird auf 'Fachschaft (Ehemalig)' umgeschrieben)
 * - Falls keepSharedMaterials === false: Auch alle geteilten Dateien werden restlos gelöscht
 */
export async function deleteTeacherAndCleanupFiles(
  teacherId: string,
  keepSharedMaterials: boolean = true
): Promise<{ deletedFilesCount: number; keptSharedCount: number; freedBytes: number }> {
  let teacherFiles: StorageFile[] = [];
  let teacherFolders: StorageFolder[] = [];

  // 1. Dateien & Ordner der Lehrkraft laden
  if (db) {
    try {
      const qFiles = query(collection(db, FILES_COLLECTION), where('ownerId', '==', teacherId));
      const snapFiles = await getDocs(qFiles);
      snapFiles.forEach((d) => {
        teacherFiles.push({ id: d.id, ...(d.data() as Omit<StorageFile, 'id'>) });
      });

      const qFolders = query(collection(db, FOLDERS_COLLECTION), where('ownerId', '==', teacherId));
      const snapFolders = await getDocs(qFolders);
      snapFolders.forEach((d) => {
        teacherFolders.push({ id: d.id, ...(d.data() as Omit<StorageFolder, 'id'>) });
      });
    } catch (err) {
      console.warn('Fehler beim Abfragen der Firestore-Dateien der Lehrkraft, nutze Cache-Fallback:', err);
    }
  }

  // Fallback auf lokalen Cache falls Firestore leer oder offline
  if (teacherFiles.length === 0) {
    teacherFiles = getCachedFiles().filter((f) => f.ownerId === teacherId);
  }
  if (teacherFolders.length === 0) {
    teacherFolders = getCachedFolders().filter((f) => f.ownerId === teacherId);
  }

  const privateFiles = teacherFiles.filter((f) => !f.isShared);
  const sharedFiles = teacherFiles.filter((f) => f.isShared);

  const filesToDelete = keepSharedMaterials ? privateFiles : teacherFiles;
  const filesToKeep = keepSharedMaterials ? sharedFiles : [];

  const freedBytes = filesToDelete.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  const r2KeysToDelete = filesToDelete.map((f) => f.r2Key).filter((k): k is string => Boolean(k));

  // 2. Cloudflare R2 Batch-Löschung
  if (r2KeysToDelete.length > 0) {
    try {
      await deleteFilesFromR2(r2KeysToDelete);
    } catch (r2Err) {
      console.error('Fehler bei der R2-Batch-Löschung für Lehrkraft:', r2Err);
    }
  }

  // 3. Firestore: Geteilte Dateien umschreiben (Besitzer wird Fachschaft / Ehemalige Lehrkraft)
  if (keepSharedMaterials && sharedFiles.length > 0 && db) {
    for (const sFile of sharedFiles) {
      try {
        const docRef = doc(db, FILES_COLLECTION, sFile.id);
        await updateDoc(docRef, {
          ownerId: 'system',
          ownerName: 'Fachschaft (Ehemalige Lehrkraft)',
          updatedAt: Date.now()
        });
      } catch (err) {
        console.warn('Fehler beim Umschreiben der geteilten Datei:', sFile.id, err);
      }
    }
  }

  // 4. Firestore: Gelöschte Dateien entfernen
  if (db) {
    for (const delFile of filesToDelete) {
      try {
        await deleteDoc(doc(db, FILES_COLLECTION, delFile.id));
      } catch (err) {
        console.warn('Fehler beim Löschen des Firestore-Dateieintrags:', delFile.id, err);
      }
    }

    // 5. Firestore: Private Ordner der Lehrkraft löschen
    const privateFolders = teacherFolders.filter((f) => !f.isShared);
    for (const folder of privateFolders) {
      try {
        await deleteDoc(doc(db, FOLDERS_COLLECTION, folder.id));
      } catch (err) {
        console.warn('Fehler beim Löschen des Firestore-Ordners:', folder.id, err);
      }
    }
  }

  // 6. Lokale Caches aktualisieren
  const deletedFileIds = new Set(filesToDelete.map((f) => f.id));
  const updatedFiles = getCachedFiles()
    .filter((f) => !deletedFileIds.has(f.id))
    .map((f) => {
      if (keepSharedMaterials && f.ownerId === teacherId && f.isShared) {
        return { ...f, ownerId: 'system', ownerName: 'Fachschaft (Ehemalige Lehrkraft)', updatedAt: Date.now() };
      }
      return f;
    });
  setCachedFiles(updatedFiles);

  const updatedFolders = getCachedFolders().filter((f) => !(f.ownerId === teacherId && !f.isShared));
  setCachedFolders(updatedFolders);

  return {
    deletedFilesCount: filesToDelete.length,
    keptSharedCount: filesToKeep.length,
    freedBytes
  };
}
