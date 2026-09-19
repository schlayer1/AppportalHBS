import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { PortalUser, UserPreferences, SavedBoardTemplate } from '../types/user';
import { FeatureRequest, RequestStatus } from '../types/requestTypes';

// Official Firebase Project Config provided for App-Portal Integration (terminkalender-7f269)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAr8Q3RslUSuaJbIIGiINGV24nm26jYoLQ",
  authDomain: "terminkalender-7f269.firebaseapp.com",
  projectId: "terminkalender-7f269",
  storageBucket: "terminkalender-7f269.firebasestorage.app",
  messagingSenderId: "919163141331",
  appId: "1:919163141331:web:12c659f5c2946e7c7e2826"
};

export const DEFAULT_SCHOOL_ID = "HBS";
export const MASTER_ADMIN_PIN = "Year2003?!%";

// Dedicated Collections under terminkalender-7f269 to avoid interference with existing collections
export const PORTAL_COLLECTION = "hbs_appportal";
export const PORTAL_DATA_DOC = "portal_data";
export const REQUESTS_COLLECTION = "hbs_feature_requests";

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
import { OncooSession, DEFAULT_ONCOO_TEMPLATES } from "../types/oncooTypes";

export interface PortalCloudData {
  users: PortalUser[];
  preferences: Record<string, UserPreferences>; // key: userId
  boardTemplates: SavedBoardTemplate[];
  mentiPresentations?: MentiPresentation[];
  activeMentiSession?: MentiLiveSession | null;
  kahootGames?: KahootGame[];
  activeKahootSession?: KahootLiveSession | null;
  oncooSessions?: OncooSession[];
  activeOncooSession?: OncooSession | null;
  updatedAt: number;
}

const LOCAL_STORAGE_BACKUP_KEY = "hbs_portal_cloud_cache_v2";
const REQUESTS_CACHE_KEY = "hbs_requests_cache_v1";

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
      if (!parsed.oncooSessions || parsed.oncooSessions.length === 0) {
        parsed.oncooSessions = DEFAULT_ONCOO_TEMPLATES;
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
    oncooSessions: DEFAULT_ONCOO_TEMPLATES,
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
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
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
        oncooSessions: Array.isArray(data.oncooSessions) && data.oncooSessions.length > 0
          ? data.oncooSessions
          : (localCache.oncooSessions || DEFAULT_ONCOO_TEMPLATES),
        activeOncooSession: data.activeOncooSession || localCache.activeOncooSession || null,
        updatedAt: data.updatedAt || Date.now()
      };
      setCachedPortalData(merged);
      return merged;
    } else {
      // First-time setup in new collection: initialize Firestore with seed data
      await savePortalDataToCloud(localCache);
      return localCache;
    }
  } catch (err) {
    console.warn("Firestore fetch error, using local cached data:", err);
    return localCache;
  }
};

/**
 * Subscribes in real-time to the portal data document using onSnapshot.
 * This guarantees that when a teacher changes favorites or settings on an iMac,
 * their iPhone immediately receives the update without a manual page refresh.
 */
export const subscribeToPortalData = (callback: (data: PortalCloudData) => void): (() => void) => {
  if (!db) {
    return () => {};
  }
  try {
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    const unsubscribe = onSnapshot(portalDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PortalCloudData;
        const localCache = getCachedPortalData();
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
          oncooSessions: Array.isArray(data.oncooSessions) && data.oncooSessions.length > 0
            ? data.oncooSessions
            : (localCache.oncooSessions || DEFAULT_ONCOO_TEMPLATES),
          activeOncooSession: data.activeOncooSession || localCache.activeOncooSession || null,
          updatedAt: data.updatedAt || Date.now()
        };
        setCachedPortalData(merged);
        callback(merged);
      }
    }, (error) => {
      console.warn("Firestore onSnapshot error:", error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach Firestore onSnapshot:", err);
    return () => {};
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
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    await setDoc(portalDocRef, updatedData, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore save error:", err);
    return false;
  }
};

// ==========================================
// FEATURE REQUESTS & KOLLEGIUMS-FEEDBACK
// ==========================================

const DEFAULT_INITIAL_REQUESTS: FeatureRequest[] = [
  {
    id: 'req-init-1',
    title: 'Digitale Stempeluhr & Anwesenheit für Fachräume',
    description: 'Eine schnelle Möglichkeit für Kolleginnen und Kollegen, Raumbuchungen oder Fachraumnutzungen direkt über das Portal einzusehen.',
    category: 'wunsch',
    authorName: 'Kollegium',
    authorId: 'system',
    createdAt: Date.now() - 86400000 * 2,
    votes: ['system-demo-1', 'system-demo-2'],
    status: 'in_pruefung',
    adminComment: 'Prüfen wir für die nächste Version.'
  },
  {
    id: 'req-init-2',
    title: 'Export von Menti-Wortwolken als Vektorgrafik (SVG)',
    description: 'Wortwolken am Ende einer Stunde direkt als druckbares PDF oder SVG für Schülerhefte exportieren.',
    category: 'unterricht',
    authorName: 'Fachlehrer Deutsch/Ethik',
    authorId: 'system',
    createdAt: Date.now() - 86400000 * 4,
    votes: ['system-demo-1', 'system-demo-3', 'system-demo-4'],
    status: 'in_planung'
  },
  {
    id: 'req-init-3',
    title: 'Freie Videolinks & MP4 auf der Digitalen Tafel',
    description: 'Direkte Videodateien ohne YouTube-Werbung auf dem Smartboard abspielen können.',
    category: 'app_idee',
    authorName: 'Kollegium Heimbürgeschule',
    authorId: 'system',
    createdAt: Date.now() - 86400000 * 6,
    votes: ['system-demo-1', 'system-demo-2', 'system-demo-3', 'system-demo-4', 'system-demo-5'],
    status: 'umgesetzt',
    adminComment: 'In Version 2.3 vollständig umgesetzt!'
  }
];

export const getCachedRequests = (): FeatureRequest[] => {
  try {
    const raw = localStorage.getItem(REQUESTS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_INITIAL_REQUESTS;
};

export const setCachedRequests = (requests: FeatureRequest[]) => {
  try {
    localStorage.setItem(REQUESTS_CACHE_KEY, JSON.stringify(requests));
  } catch {}
};

export const subscribeToFeatureRequests = (callback: (requests: FeatureRequest[]) => void): (() => void) => {
  if (!db) {
    callback(getCachedRequests());
    return () => {};
  }
  try {
    const reqDocRef = doc(db, PORTAL_COLLECTION, REQUESTS_COLLECTION);
    const unsubscribe = onSnapshot(reqDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const list: FeatureRequest[] = Array.isArray(data.items) ? data.items : [];
        setCachedRequests(list);
        callback(list);
      } else {
        const fallback = getCachedRequests();
        setDoc(reqDocRef, { items: fallback, updatedAt: Date.now() }).catch(() => {});
        callback(fallback);
      }
    }, (err) => {
      console.warn("Feature requests onSnapshot error:", err);
      callback(getCachedRequests());
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to feature requests:", err);
    callback(getCachedRequests());
    return () => {};
  }
};

export const submitFeatureRequest = async (newReq: Omit<FeatureRequest, 'id' | 'createdAt' | 'votes' | 'status'>): Promise<FeatureRequest> => {
  const req: FeatureRequest = {
    ...newReq,
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: Date.now(),
    votes: [newReq.authorId],
    status: 'eingereicht'
  };

  const current = getCachedRequests();
  const updated = [req, ...current];
  setCachedRequests(updated);

  if (db) {
    try {
      const reqDocRef = doc(db, PORTAL_COLLECTION, REQUESTS_COLLECTION);
      await setDoc(reqDocRef, { items: updated, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Error saving request to cloud:", e);
    }
  }

  return req;
};

export const toggleVoteFeatureRequest = async (requestId: string, voterId: string): Promise<void> => {
  const current = getCachedRequests();
  const updated = current.map((r) => {
    if (r.id !== requestId) return r;
    const hasVoted = r.votes.includes(voterId);
    const newVotes = hasVoted ? r.votes.filter(v => v !== voterId) : [...r.votes, voterId];
    return { ...r, votes: newVotes };
  });

  setCachedRequests(updated);

  if (db) {
    try {
      const reqDocRef = doc(db, PORTAL_COLLECTION, REQUESTS_COLLECTION);
      await setDoc(reqDocRef, { items: updated, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Error updating vote in cloud:", e);
    }
  }
};

export const updateFeatureRequestStatus = async (
  requestId: string, 
  status: RequestStatus, 
  adminComment?: string
): Promise<void> => {
  const current = getCachedRequests();
  const updated = current.map((r) => {
    if (r.id !== requestId) return r;
    return { 
      ...r, 
      status, 
      adminComment: adminComment !== undefined ? adminComment : r.adminComment 
    };
  });

  setCachedRequests(updated);

  if (db) {
    try {
      const reqDocRef = doc(db, PORTAL_COLLECTION, REQUESTS_COLLECTION);
      await setDoc(reqDocRef, { items: updated, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Error updating request status in cloud:", e);
    }
  }
};

export const deleteFeatureRequest = async (requestId: string): Promise<void> => {
  const current = getCachedRequests();
  const updated = current.filter(r => r.id !== requestId);
  setCachedRequests(updated);

  if (db) {
    try {
      const reqDocRef = doc(db, PORTAL_COLLECTION, REQUESTS_COLLECTION);
      await setDoc(reqDocRef, { items: updated, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Error deleting request in cloud:", e);
    }
  }
};

/**
 * Synchronizes / imports teacher roster directly from a Vertretungsstatistik document
 */
export const syncTeachersFromVertretungsstatistik = async (): Promise<{ added: number; updated: number; total: number }> => {
  if (!db) throw new Error("Keine Datenbankverbindung");

  try {
    const vertretungDocRef = doc(db, "schools", "HBS");
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
        if (existingUsers[existingIdx].pin !== pinToUse) {
          existingUsers[existingIdx].pin = pinToUse;
          updated++;
        }
      } else {
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

