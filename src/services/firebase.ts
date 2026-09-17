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

export let db: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase Init-Warnung (Offline-Fallback wird genutzt):", err);
}

// Initial seed teachers matching official Heimbürgeschule Kollegiumsliste (ohne Schulleitung, da extra Login-Feld)
export const INITIAL_SEED_TEACHERS: PortalUser[] = [
  { id: "t-allerdt", name: "Allerdt", pin: "6300", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-dengler", name: "Dengler", pin: "8991", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-funk", name: "Funk", pin: "1091", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-graefe", name: "Gräfe", pin: "6169", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-gruchmann", name: "Gruchmann", pin: "4444", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-haase", name: "Haase", pin: "8511", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-halm", name: "Halm", pin: "1350", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-herold", name: "Herold", pin: "2116", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-illessy", name: "Illessy", pin: "2479", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-keim", name: "Keim", pin: "9672", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-keller", name: "Keller", pin: "6079", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-kleinfeld", name: "Kleinfeld", pin: "5901", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-koenig", name: "König", pin: "2699", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-koenitzern", name: "Könitzer N", pin: "2535", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-koentizert", name: "Könitzer T", pin: "7909", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-mange", name: "Mange", pin: "3518", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-meier", name: "Meier", pin: "8652", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-nn", name: "nn", pin: "1266", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-nowak", name: "Nowak", pin: "6652", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-ottma", name: "Ottma", pin: "7710", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-petzold", name: "Petzold", pin: "6244", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-piel", name: "Piel", pin: "8814", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-schirmer", name: "Schirmer", pin: "8386", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-schmidt", name: "Schmidt", pin: "6403", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-schwappach", name: "Schwappach", pin: "7673", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-seifert", name: "Seifert", pin: "3314", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-surowy", name: "Surowy", pin: "9330", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-teubert", name: "Teubert", pin: "5812", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-thum", name: "Thum", pin: "2012", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-vogel", name: "Vogel", pin: "1027", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-voigt", name: "Voigt", pin: "5067", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-wagner", name: "Wagner", pin: "7734", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-weber", name: "Weber", pin: "2540", role: "teacher", active: true, createdAt: Date.now() },
  { id: "t-wesely", name: "Wesely", pin: "7484", role: "teacher", active: true, createdAt: Date.now() }
];

import { MentiPresentation, MentiLiveSession } from "../types/mentiTypes";
import { DEFAULT_MENTI_TEMPLATES } from "../data/defaultMentiTemplates";
import { KahootGame, KahootLiveSession } from "../types/kahootTypes";
import { DEFAULT_KAHOOT_GAMES } from "../data/defaultKahootTemplates";

export interface PortalCloudData {
  users: PortalUser[];
  preferences: Record<string, UserPreferences>; // key: userId
  boardTemplates: SavedBoardTemplate[];
  mentiPresentations?: MentiPresentation[];
  activeMentiSession?: MentiLiveSession | null;
  kahootGames?: KahootGame[];
  activeKahootSession?: KahootLiveSession | null;
  updatedAt: number;
}

const LOCAL_STORAGE_BACKUP_KEY = "hbs_portal_cloud_cache_v1";

// Helper: load cached cloud data
export const getCachedPortalData = (): PortalCloudData => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.mentiPresentations || parsed.mentiPresentations.length === 0) {
        parsed.mentiPresentations = DEFAULT_MENTI_TEMPLATES;
      }
      if (!parsed.kahootGames || parsed.kahootGames.length === 0) {
        parsed.kahootGames = DEFAULT_KAHOOT_GAMES;
      }
      return parsed;
    }
  } catch (e) {
    console.warn("Cache read error:", e);
  }
  return {
    users: INITIAL_SEED_TEACHERS,
    preferences: {},
    boardTemplates: [],
    mentiPresentations: DEFAULT_MENTI_TEMPLATES,
    kahootGames: DEFAULT_KAHOOT_GAMES,
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
        mentiPresentations: Array.isArray(data.mentiPresentations) && data.mentiPresentations.length > 0 
          ? data.mentiPresentations 
          : (localCache.mentiPresentations || DEFAULT_MENTI_TEMPLATES),
        activeMentiSession: data.activeMentiSession || localCache.activeMentiSession || null,
        kahootGames: Array.isArray(data.kahootGames) && data.kahootGames.length > 0
          ? data.kahootGames
          : (localCache.kahootGames || DEFAULT_KAHOOT_GAMES),
        activeKahootSession: data.activeKahootSession || localCache.activeKahootSession || null,
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
      if (!st.name || st.name.toLowerCase().includes('schulleitung')) return;
      const existingIdx = existingUsers.findIndex(u => u.name.trim().toLowerCase() === st.name.trim().toLowerCase());
      
      const pinToUse = st.pin && String(st.pin).length === 4 
        ? String(st.pin) 
        : Math.floor(1000 + Math.random() * 9000).toString();

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
