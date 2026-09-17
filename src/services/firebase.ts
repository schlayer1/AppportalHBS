import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  Firestore
} from 'firebase/firestore';
import { PortalUser, UserPreferences, SavedBoardTemplate } from '../types/user';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCnleowgQT4XoMK5P5b_t1uWYGsWoYxT80",
  authDomain: "statistik-91f25.firebaseapp.com",
  projectId: "statistik-91f25",
  storageBucket: "statistik-91f25.firebasestorage.app",
  messagingSenderId: "277742289737",
  appId: "1:277742289737:web:b87043732524cc283d5098"
};

export const DEFAULT_SCHOOL_ID = "HBS";
export const MASTER_ADMIN_PIN = "Year2003?!%";

// Document paths under /schools/ (which is allowed by Firestore rules)
const PORTAL_DOC_ID = "HBS_portal";
const VERTRETUNG_DOC_ID = "HBS"; // The Vertretungsstatistik document containing teachers

let db: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase Init-Warnung (Offline-Fallback wird genutzt):", err);
}

// Initial seed teachers if database is completely empty
export const INITIAL_SEED_TEACHERS: PortalUser[] = [
  { id: "t-admin", name: "Schulleitung (Admin)", pin: "1234", role: "admin", active: true, createdAt: Date.now() },
  { id: "t-1", name: "Fr. Schmidt", pin: "1234", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-2", name: "Hr. Becker", pin: "1234", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-3", name: "Fr. Weber", pin: "1234", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-4", name: "Hr. Lehmann", pin: "1234", role: "teacher", active: true, createdAt: Date.now() }
];

export interface PortalCloudData {
  users: PortalUser[];
  preferences: Record<string, UserPreferences>; // key: userId
  boardTemplates: SavedBoardTemplate[];
  updatedAt: number;
}

const LOCAL_STORAGE_BACKUP_KEY = "hbs_portal_cloud_cache_v1";

// Helper: load cached cloud data
export const getCachedPortalData = (): PortalCloudData => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Cache read error:", e);
  }
  return {
    users: INITIAL_SEED_TEACHERS,
    preferences: {},
    boardTemplates: [],
    updatedAt: Date.now()
  };
};

// Helper: save cached cloud data
export const setCachedPortalData = (data: PortalCloudData) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache write error:", e);
  }
};

/**
 * Loads portal data from Firestore (or fallback cache)
 */
export const loadPortalDataFromCloud = async (): Promise<PortalCloudData> => {
  const localCache = getCachedPortalData();
  if (!db) return localCache;

  try {
    const portalDocRef = doc(db, "schools", PORTAL_DOC_ID);
    const snap = await getDoc(portalDocRef);

    if (snap.exists()) {
      const data = snap.data() as PortalCloudData;
      const merged: PortalCloudData = {
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : localCache.users,
        preferences: data.preferences || localCache.preferences || {},
        boardTemplates: data.boardTemplates || localCache.boardTemplates || [],
        updatedAt: data.updatedAt || Date.now()
      };
      setCachedPortalData(merged);
      return merged;
    } else {
      // First-time setup: initialize Firestore with seed data
      await savePortalDataToCloud(localCache);
      return localCache;
    }
  } catch (err) {
    console.warn("Firestore fetch error, using local cached data:", err);
    return localCache;
  }
};

/**
 * Saves portal data to Firestore (and updates local cache)
 */
export const savePortalDataToCloud = async (data: PortalCloudData): Promise<boolean> => {
  const updatedData = { ...data, updatedAt: Date.now() };
  setCachedPortalData(updatedData);

  if (!db) return true;

  try {
    const portalDocRef = doc(db, "schools", PORTAL_DOC_ID);
    await setDoc(portalDocRef, updatedData, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore save error:", err);
    return false;
  }
};

/**
 * Synchronizes / imports teacher roster directly from the existing Vertretungsstatistik document (schools/HBS)
 */
export const syncTeachersFromVertretungsstatistik = async (): Promise<{ added: number; updated: number; total: number }> => {
  if (!db) throw new Error("Keine Datenbankverbindung");

  try {
    const vertretungDocRef = doc(db, "schools", VERTRETUNG_DOC_ID);
    const snap = await getDoc(vertretungDocRef);

    if (!snap.exists()) {
      throw new Error("Dokument 'schools/HBS' der Vertretungsstatistik nicht gefunden.");
    }

    const vData = snap.data();
    const sourceTeachers = Array.isArray(vData.teachers) ? vData.teachers : [];

    if (sourceTeachers.length === 0) {
      throw new Error("Keine Lehrkräfte in der Vertretungsstatistik gefunden.");
    }

    const currentPortalData = await loadPortalDataFromCloud();
    const existingUsers = [...currentPortalData.users];
    let added = 0;
    let updated = 0;

    sourceTeachers.forEach((st: any) => {
      if (!st.name) return;
      const existingIdx = existingUsers.findIndex(u => u.name.trim().toLowerCase() === st.name.trim().toLowerCase());
      
      const pinToUse = st.pin && String(st.pin).length === 4 ? String(st.pin) : "1234";

      if (existingIdx >= 0) {
        // Update existing user's PIN if provided
        if (existingUsers[existingIdx].pin !== pinToUse) {
          existingUsers[existingIdx].pin = pinToUse;
          updated++;
        }
      } else {
        // Add new teacher
        existingUsers.push({
          id: st.id ? `t-${st.id}` : `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: st.name.trim(),
          pin: pinToUse,
          role: "teacher",
          active: st.active !== false,
          createdAt: Date.now()
        });
        added++;
      }
    });

    currentPortalData.users = existingUsers;
    await savePortalDataToCloud(currentPortalData);

    return { added, updated, total: existingUsers.length };
  } catch (err: any) {
    console.error("Sync error:", err);
    throw err;
  }
};
