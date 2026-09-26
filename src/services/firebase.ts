import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  arrayUnion,
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

import { MentiPresentation, MentiLiveSession, MentiLiveReaction } from "../types/mentiTypes";
import { DEFAULT_MENTI_TEMPLATES } from "../data/defaultMentiTemplates";
import { KahootGame, KahootLiveSession, KahootParticipant } from "../types/kahootTypes";
import { DEFAULT_KAHOOT_GAMES } from "../data/defaultKahootTemplates";
import { OncooSession, OncooCard, OncooHelpItem, OncooTargetVote, OncooDuettPair, DEFAULT_ONCOO_TEMPLATES } from "../types/oncooTypes";

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

// =========================================================
// REAL-TIME CLASSROOM SESSIONS: KAHOOT, MENTI, ONCOO & POLLS
// =========================================================

/**
 * Safely strips any undefined values from objects/arrays recursively
 * before sending to Firestore, preventing "Unsupported field value: undefined" runtime errors.
 */
export const sanitizeForFirestore = <T>(data: T): T => {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
};

/**
 * Syncs the active Kahoot live session to Firestore.
 * Writes to dedicated document and mirrors to schools/HBS_portal and portal_data.
 */
export const syncKahootLiveSession = async (
  session: Partial<KahootLiveSession> & { sessionCode: string }
): Promise<void> => {
  if (!db || !session.sessionCode) return;
  try {
    const cleanCode = (session.sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const dataToWrite: any = sanitizeForFirestore({ ...session, sessionCode: cleanCode, updatedAt: Date.now() });

    // If caller did not provide participants explicitly, do NOT overwrite participants in Firestore
    if (!session.participants) {
      delete dataToWrite.participants;
    }

    await setDoc(sessionDocRef, dataToWrite, { merge: true });

    // Mirror to schools/HBS_portal with setDoc (never crashes if doc is missing)
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, sanitizeForFirestore({ activeKahootSession: dataToWrite }), { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Kahoot sync to cloud warning:", err);
  }
};

/**
 * Subscribes in real-time to a Kahoot session by its PIN.
 */
export const subscribeToKahootSession = (
  sessionCode: string,
  callback: (session: KahootLiveSession | null) => void
): (() => void) => {
  if (!db || !sessionCode) return () => {};
  try {
    const cleanCode = sessionCode.replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as KahootLiveSession);
      } else {
        // Fallback check schools/HBS_portal
        const schoolDocRef = doc(db!, 'schools', 'HBS_portal');
        getDoc(schoolDocRef).then((sSnap) => {
          if (sSnap.exists() && sSnap.data().activeKahootSession?.sessionCode === cleanCode) {
            callback(sSnap.data().activeKahootSession as KahootLiveSession);
          } else {
            callback(null);
          }
        }).catch(() => callback(null));
      }
    }, (err) => {
      console.warn("Kahoot snapshot error:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to Kahoot session:", err);
    return () => {};
  }
};

export const getKahootLiveSessionFromCloud = async (sessionCode: string): Promise<KahootLiveSession | null> => {
  if (!db || !sessionCode) return null;
  try {
    const cleanCode = sessionCode.replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      return snap.data() as KahootLiveSession;
    }
  } catch (err) {
    console.warn("Error getting Kahoot session from cloud:", err);
  }
  return null;
};

/**
 * Student joins the Kahoot lobby from their smartphone via QR code / PIN.
 */
export const joinKahootSessionInCloud = async (
  sessionCode: string,
  participant: KahootParticipant
): Promise<boolean> => {
  if (!db || !sessionCode) return false;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const snap = await getDoc(sessionDocRef);
    let participants: KahootParticipant[] = [];

    if (snap.exists()) {
      const data = snap.data() as KahootLiveSession;
      participants = Array.isArray(data.participants) ? data.participants : [];
    }
    const cleanParticipant = sanitizeForFirestore(participant);
    const updated = [...participants.filter(p => p.id !== cleanParticipant.id), cleanParticipant];

    const dataToWrite = sanitizeForFirestore({
      sessionCode: cleanCode,
      participants: updated,
      updatedAt: Date.now()
    });

    await setDoc(sessionDocRef, dataToWrite, { merge: true });

    // Mirror to schools/HBS_portal
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, sanitizeForFirestore({
      activeKahootSession: {
        ...(snap.exists() ? snap.data() : {}),
        sessionCode: cleanCode,
        participants: updated,
        updatedAt: Date.now()
      }
    }), { merge: true }).catch(() => {});

    return true;
  } catch (err) {
    console.warn("Error joining Kahoot session in cloud:", err);
    return false;
  }
};

/**
 * Student submits their answer in Kahoot from their smartphone for a specific question.
 */
export const submitKahootAnswerInCloud = async (
  sessionCode: string,
  studentId: string,
  optionId: string,
  questionIndex: number,
  studentInfo?: { nickname?: string; avatar?: string }
): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const snap = await getDoc(sessionDocRef);
    let participants: KahootParticipant[] = [];
    if (snap.exists()) {
      const data = snap.data() as KahootLiveSession;
      participants = Array.isArray(data.participants) ? data.participants : [];
    }

    let found = false;
    const updated = participants.map(p => {
      if (p.id === studentId) {
        found = true;
        return {
          ...p,
          lastAnswerId: optionId,
          lastAnswerTime: Date.now(),
          answeredQuestionIndex: questionIndex
        };
      }
      return p;
    });

    // If student was not yet in participants list, upsert them immediately
    if (!found) {
      updated.push({
        id: studentId,
        nickname: studentInfo?.nickname || 'Schüler',
        avatar: studentInfo?.avatar || '🦊',
        score: 0,
        streak: 0,
        lastAnswerId: optionId,
        lastAnswerTime: Date.now(),
        answeredQuestionIndex: questionIndex
      });
    }

    const answersReceived = updated.filter(p => p.answeredQuestionIndex === questionIndex && p.lastAnswerId).length;

    const dataToWrite = sanitizeForFirestore({
      participants: updated,
      answersReceived,
      updatedAt: Date.now()
    });

    await setDoc(sessionDocRef, dataToWrite, { merge: true });

    // Mirror to schools/HBS_portal
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, sanitizeForFirestore({
      activeKahootSession: {
        ...(snap.exists() ? snap.data() : {}),
        participants: updated,
        answersReceived,
        updatedAt: Date.now()
      }
    }), { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Error submitting Kahoot answer in cloud:", err);
  }
};

/**
 * Syncs the active Menti live session to Firestore.
 */
export const syncMentiLiveSession = async (session: MentiLiveSession): Promise<void> => {
  if (!db || !session.sessionCode) return;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${session.sessionCode}`);
    await setDoc(sessionDocRef, { ...session, updatedAt: Date.now() }, { merge: true });

    // Mirror to schools/HBS_portal
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, { activeMentiSession: session }, { merge: true }).catch(() => {});

    // Mirror to portal_data
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    await setDoc(portalDocRef, { activeMentiSession: session }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Menti sync to cloud warning:", err);
  }
};

export const getMentiLiveSessionFromCloud = async (sessionCode: string): Promise<MentiLiveSession | null> => {
  if (!db || !sessionCode) return null;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${sessionCode}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      return snap.data() as MentiLiveSession;
    }
  } catch (err) {
    console.warn("Error getting Menti session from cloud:", err);
  }
  return null;
};

/**
 * Subscribes in real-time to a Menti session by its PIN.
 */
export const subscribeToMentiSession = (
  sessionCode: string,
  callback: (session: MentiLiveSession | null) => void
): (() => void) => {
  if (!db || !sessionCode) return () => {};
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${sessionCode}`);
    const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as MentiLiveSession);
      } else {
        const schoolDocRef = doc(db!, 'schools', 'HBS_portal');
        getDoc(schoolDocRef).then((sSnap) => {
          if (sSnap.exists() && sSnap.data().activeMentiSession?.sessionCode === sessionCode) {
            callback(sSnap.data().activeMentiSession as MentiLiveSession);
          } else {
            callback(null);
          }
        }).catch(() => callback(null));
      }
    }, (err) => {
      console.warn("Menti snapshot error:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to Menti session:", err);
    return () => {};
  }
};

/**
 * Student submits a vote or answer in Menti from their smartphone.
 */
export const submitMentiVoteInCloud = async (
  sessionCode: string,
  slideId: string,
  payload: any
): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${sessionCode}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      const data = snap.data() as MentiLiveSession;
      const responses = data.responses || {};
      let slideResp = responses[slideId];

      if (payload.optionId) {
        // Choice or Quiz
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? slideResp : {};
        obj[payload.optionId] = (obj[payload.optionId] || 0) + 1;
        responses[slideId] = obj;
      } else if (payload.word) {
        // Wordcloud
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? slideResp : {};
        obj[payload.word] = (obj[payload.word] || 0) + 1;
        responses[slideId] = obj;
      } else if (payload.text) {
        // Open-ended thoughts
        const arr = Array.isArray(slideResp) ? slideResp : [];
        arr.push({
          id: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text: payload.text,
          timestamp: Date.now()
        });
        responses[slideId] = arr;
      } else if (payload.ratings) {
        // Scales
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? slideResp : {};
        Object.entries(payload.ratings).forEach(([scaleId, val]) => {
          const current = obj[scaleId] || { sum: 0, count: 0 };
          obj[scaleId] = {
            sum: current.sum + Number(val),
            count: current.count + 1
          };
        });
        responses[slideId] = obj;
      } else if (payload.rankingOrder) {
        // Ranking
        const arr = Array.isArray(slideResp) ? slideResp : [];
        arr.push(payload.rankingOrder);
        responses[slideId] = arr;
      } else if (payload.matrixCoords) {
        // 2x2 Matrix
        const arr = Array.isArray(slideResp) ? slideResp : [];
        arr.push(payload.matrixCoords);
        responses[slideId] = arr;
      }

      const newCount = (data.participantsCount || 0) + 1;

      await setDoc(sessionDocRef, {
        responses,
        participantsCount: newCount,
        updatedAt: Date.now()
      }, { merge: true });

      const schoolDocRef = doc(db, 'schools', 'HBS_portal');
      await setDoc(schoolDocRef, {
        'activeMentiSession.responses': responses,
        'activeMentiSession.participantsCount': newCount
      }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn("Error submitting Menti vote in cloud:", err);
  }
};

/**
 * Student submits a floating reaction in Menti (❤️, 👍, 💡, 👏, 🎉).
 */
export const submitMentiReactionInCloud = async (
  sessionCode: string,
  reaction: MentiLiveReaction
): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${sessionCode}`);
    await setDoc(sessionDocRef, {
      recentReactions: arrayUnion(reaction),
      updatedAt: Date.now()
    }, { merge: true });

    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, {
      'activeMentiSession.recentReactions': arrayUnion(reaction)
    }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Reaction error:", err);
  }
};

/**
 * Syncs the active Oncoo session to Firestore.
 */
export const syncOncooLiveSession = async (session: OncooSession): Promise<void> => {
  if (!db || !session.pinCode) return;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${session.pinCode}`);
    await setDoc(sessionDocRef, { ...session, updatedAt: Date.now() }, { merge: true });

    // Mirror to portal_data
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    await setDoc(portalDocRef, { activeOncooSession: session }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Oncoo sync to cloud warning:", err);
  }
};

export const getOncooLiveSessionFromCloud = async (pinCode: string): Promise<OncooSession | null> => {
  if (!db || !pinCode) return null;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${pinCode}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      return snap.data() as OncooSession;
    }
  } catch (err) {
    console.warn("Error getting Oncoo session from cloud:", err);
  }
  return null;
};

/**
 * Subscribes in real-time to an Oncoo session by its PIN.
 */
export const subscribeToOncooSession = (
  pinCode: string,
  callback: (session: OncooSession | null) => void
): (() => void) => {
  if (!db || !pinCode) return () => {};
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${pinCode}`);
    const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as OncooSession);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn("Oncoo snapshot error:", err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to Oncoo session:", err);
    return () => {};
  }
};

/**
 * Student submits an action in Oncoo (card, target rating, help, tandem report, placemat note).
 */
export const submitOncooActionInCloud = async (
  pinCode: string,
  payload: {
    card?: OncooCard;
    vote?: OncooTargetVote;
    targetRating?: { studentName: string; ratings: Record<string, number> };
    helpItem?: OncooHelpItem;
    studentName?: string;
    tandemFinished?: { studentName: string };
    placematUpdate?: { groupIndex: number; cornerKey: string; note: string };
  }
): Promise<void> => {
  if (!db || !pinCode) return;
  try {
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${pinCode}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      const sess = snap.data() as OncooSession;

      // 1. Kartenabfrage
      if (payload.card && sess.toolType === 'kartenabfrage' && sess.kartenabfrage) {
        const existing = sess.kartenabfrage.cards || [];
        if (!existing.some(c => c.id === payload.card!.id)) {
          sess.kartenabfrage.cards = [payload.card, ...existing];
        }
      }

      // 2. Zielscheibe
      if ((payload.vote || payload.targetRating) && sess.toolType === 'zielscheibe' && sess.zielscheibe) {
        const voteToPush: OncooTargetVote = payload.vote || {
          id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          studentAlias: payload.targetRating?.studentName || 'Schüler',
          scores: payload.targetRating?.ratings || {},
          createdAt: Date.now()
        };
        const existingVotes = sess.zielscheibe.votes || [];
        if (!existingVotes.some(v => v.id === voteToPush.id)) {
          sess.zielscheibe.votes = [...existingVotes, voteToPush];
        }
      }

      // 3. Helfersystem
      if (payload.helpItem && sess.toolType === 'helfersystem' && sess.helfersystem) {
        const existingItems = sess.helfersystem.items || [];
        if (!existingItems.some((i: OncooHelpItem) => i.id === payload.helpItem!.id)) {
          sess.helfersystem.items = [payload.helpItem, ...existingItems];
        }
      }

      // 4. Lerntempoduett
      const studentName = payload.studentName || payload.tandemFinished?.studentName;
      if (studentName && sess.toolType === 'lerntempoduett' && sess.lerntempoduett) {
        const sName = String(studentName).trim();
        const currentQueue = sess.lerntempoduett.waitingQueue || [];
        const currentPairs = sess.lerntempoduett.pairs || [];
        const isAlreadyIn = currentQueue.includes(sName) || currentPairs.some(p => p.student1 === sName || p.student2 === sName);
        if (!isAlreadyIn) {
          if (currentQueue.length > 0) {
            const partner = currentQueue[0];
            const remainingQueue = currentQueue.slice(1);
            const newPair: OncooDuettPair = {
              id: `pair-${Date.now()}`,
              student1: partner,
              student2: sName,
              tableNumber: currentPairs.length + 1,
              pairedAt: Date.now(),
              phase: sess.lerntempoduett.currentPhase || 2
            };
            sess.lerntempoduett.waitingQueue = remainingQueue;
            sess.lerntempoduett.pairs = [...currentPairs, newPair];
          } else {
            sess.lerntempoduett.waitingQueue = [...currentQueue, sName];
          }
        }
      }

      // 5. Placemat
      if (payload.placematUpdate && sess.toolType === 'placemat' && sess.placemat) {
        const { groupIndex, cornerKey, note } = payload.placematUpdate;
        if (note && cornerKey && sess.placemat.groups) {
          const groups = sess.placemat.groups.map((grp, gIdx) => {
            if (gIdx !== groupIndex) return grp;
            const key = cornerKey as 'cornerA' | 'cornerB' | 'cornerC' | 'cornerD';
            const corner = grp[key];
            if (!corner) return grp;
            return {
              ...grp,
              [key]: {
                ...corner,
                notes: [...(corner.notes || []), note]
              }
            };
          });
          sess.placemat.groups = groups;
        }
      }

      sess.updatedAt = Date.now();
      await setDoc(sessionDocRef, sess, { merge: true });
    }
  } catch (err) {
    console.warn("Error submitting Oncoo action in cloud:", err);
  }
};

