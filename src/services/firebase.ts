import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  arrayUnion,
  runTransaction,
  Firestore
} from 'firebase/firestore';
import { PortalUser, TeacherGender, UserPreferences, SavedBoardTemplate } from '../types/user';
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

// Authoritative teacher/PIN source: Vertretungsstatistik (statistik-91f25)
export const STATISTIK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCnleowgQT4XoMK5P5b_t1uWYGsWoYxT80",
  authDomain: "statistik-91f25.firebaseapp.com",
  projectId: "statistik-91f25",
  storageBucket: "statistik-91f25.firebasestorage.app",
  messagingSenderId: "277742289737",
  appId: "1:277742289737:web:b87043732524cc283d5098"
};

export const DEFAULT_SCHOOL_ID = "HBS";
export const MASTER_ADMIN_PIN = "Year2003?!%";

// Dedicated Collections under terminkalender-7f269 to avoid interference with existing collections
export const PORTAL_COLLECTION = "hbs_appportal";
export const PORTAL_DATA_DOC = "portal_data";
export const REQUESTS_COLLECTION = "hbs_feature_requests";

export let db: Firestore | null = null;
export let statistikDb: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase Init-Warnung (Offline-Fallback wird genutzt):", err);
}

try {
  const existingStatistikApp = getApps().find(a => a.name === 'hbs-statistik-source');
  const statistikApp = existingStatistikApp || initializeApp(STATISTIK_FIREBASE_CONFIG, 'hbs-statistik-source');
  statistikDb = getFirestore(statistikApp);
} catch (err) {
  console.warn("Statistik-Firebase Init-Warnung (Sync-Fallback):", err);
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
  const updatedData = sanitizeForFirestore({ ...data, updatedAt: Date.now() });
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

export interface StatistikTeacherRaw {
  id?: string;
  name?: string;
  pin?: string;
  gender?: string;
  active?: boolean;
}

export const normalizeTeacherGender = (val: unknown): TeacherGender => {
  if (val === 'f' || val === 'm' || val === 'd') return val;
  return '';
};

const generateUniquePin = (usedPins: Set<string>): string => {
  for (let i = 0; i < 200; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000).toString();
    if (candidate !== '1234' && !usedPins.has(candidate)) {
      usedPins.add(candidate);
      return candidate;
    }
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Merges teacher roster entries from Vertretungsstatistik (statistik-91f25/schools/HBS)
 * into existing portal users, preserving admin roles & portal IDs while syncing PINs, gender, and new hires.
 */
export const mergeStatistikTeachersIntoUsers = (
  existingUsers: PortalUser[],
  sourceTeachers: StatistikTeacherRaw[]
): { users: PortalUser[]; added: number; updated: number } => {
  const nextUsers = existingUsers.map(u => ({ ...u }));
  const usedPins = new Set(nextUsers.map(u => String(u.pin || '').trim()).filter(Boolean));
  let added = 0;
  let updated = 0;

  sourceTeachers.forEach((st) => {
    const rawName = (st?.name || '').trim();
    if (!rawName || rawName.toLowerCase().includes('schulleitung')) return;

    const cleanLower = rawName.toLowerCase();
    const stId = st.id ? String(st.id).trim() : '';
    const existingIdx = nextUsers.findIndex(u =>
      (stId && (u.sourceTeacherId === stId || u.id === `t-${stId}` || u.id === stId)) ||
      u.name.trim().toLowerCase() === cleanLower
    );

    const rawPin = st.pin !== undefined && st.pin !== null ? String(st.pin).trim() : '';
    const validPin = /^\d{4,}$/.test(rawPin) ? rawPin : '';
    const hasGenderField = st.gender !== undefined && st.gender !== null;
    const incomingGender = normalizeTeacherGender(st.gender);
    const incomingActive = st.active !== false;

    if (existingIdx >= 0) {
      const target = nextUsers[existingIdx];
      let changed = false;

      if (validPin && target.pin !== validPin) {
        target.pin = validPin;
        usedPins.add(validPin);
        changed = true;
      }
      if (hasGenderField && (target.gender || '') !== incomingGender) {
        target.gender = incomingGender;
        changed = true;
      }
      if (target.name !== rawName) {
        target.name = rawName;
        changed = true;
      }
      if (stId && target.sourceTeacherId !== stId) {
        target.sourceTeacherId = stId;
        changed = true;
      }
      if (target.active !== incomingActive) {
        target.active = incomingActive;
        changed = true;
      }
      if (changed) updated++;
    } else {
      const pinToUse = validPin || generateUniquePin(usedPins);
      usedPins.add(pinToUse);
      nextUsers.push({
        id: stId ? `t-${stId}` : `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sourceTeacherId: stId || undefined,
        name: rawName,
        gender: incomingGender,
        pin: pinToUse,
        role: "teacher",
        active: incomingActive,
        createdAt: Date.now()
      });
      added++;
    }
  });

  return { users: nextUsers, added, updated };
};

export const loadStatistikTeachersFromCloud = async (): Promise<StatistikTeacherRaw[]> => {
  if (statistikDb) {
    try {
      const snap = await getDoc(doc(statistikDb, "schools", DEFAULT_SCHOOL_ID));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.teachers)) return data.teachers;
      }
    } catch (err) {
      console.warn("Statistik Firestore read error, trying REST fallback:", err);
    }
  }
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/statistik-91f25/databases/(default)/documents/schools/${DEFAULT_SCHOOL_ID}`
    );
    if (!res.ok) return [];
    const docJson = await res.json();
    const values = docJson?.fields?.teachers?.arrayValue?.values;
    if (!Array.isArray(values)) return [];
    return values.map((v: any) => {
      const f = v?.mapValue?.fields || {};
      return {
        id: f.id?.stringValue ?? '',
        name: f.name?.stringValue ?? '',
        pin: f.pin?.stringValue ?? '',
        gender: f.gender?.stringValue ?? '',
        active: f.active?.booleanValue !== undefined ? Boolean(f.active.booleanValue) : true,
      };
    });
  } catch (err) {
    console.warn("Statistik REST fallback error:", err);
    return [];
  }
};

export const subscribeToStatistikTeachers = (callback: (teachers: StatistikTeacherRaw[]) => void): (() => void) => {
  if (!statistikDb) {
    loadStatistikTeachersFromCloud().then(list => {
      if (list.length > 0) callback(list);
    });
    return () => {};
  }
  try {
    const vertretungDocRef = doc(statistikDb, "schools", DEFAULT_SCHOOL_ID);
    const unsubscribe = onSnapshot(
      vertretungDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.teachers)) {
            callback(data.teachers);
          }
        }
      },
      (err) => {
        console.warn("Statistik onSnapshot error, using REST fallback:", err);
        loadStatistikTeachersFromCloud().then(list => {
          if (list.length > 0) callback(list);
        });
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach Statistik onSnapshot:", err);
    return () => {};
  }
};

/**
 * Synchronizes / imports teacher roster directly from Vertretungsstatistik (statistik-91f25/schools/HBS)
 */
export const syncTeachersFromVertretungsstatistik = async (): Promise<{ added: number; updated: number; total: number }> => {
  try {
    const sourceTeachers = await loadStatistikTeachersFromCloud();

    if (sourceTeachers.length === 0) {
      throw new Error("Keine Lehrkräfte in der Vertretungsstatistik (schools/HBS) gefunden.");
    }

    const currentPortalData = await loadPortalDataFromCloud();
    const merged = mergeStatistikTeachersIntoUsers(currentPortalData.users, sourceTeachers);

    currentPortalData.users = merged.users;
    await savePortalDataToCloud(currentPortalData);

    return { added: merged.added, updated: merged.updated, total: merged.users.length };
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
 * Writes to dedicated document and mirrors to schools/HBS_portal.
 */
export const syncKahootLiveSession = async (
  session: Partial<KahootLiveSession> & { sessionCode: string }
): Promise<void> => {
  if (!db || !session.sessionCode) return;
  try {
    const cleanCode = (session.sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const dataToWrite: any = sanitizeForFirestore({
      ...session,
      sessionCode: cleanCode,
      updatedAt: session.updatedAt || Date.now()
    });

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
 * Uses Firestore runTransaction + playerProfiles map to prevent concurrent write races
 * and avoids overwriting teacherSeq / updatedAt with student device clock time.
 */
export const joinKahootSessionInCloud = async (
  sessionCode: string,
  participant: KahootParticipant
): Promise<boolean> => {
  if (!db || !sessionCode) return false;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `kahoot_${cleanCode}`);
    const cleanParticipant = sanitizeForFirestore(participant);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(sessionDocRef);
      const data = snap.exists() ? (snap.data() as KahootLiveSession) : null;
      const existingParticipants = Array.isArray(data?.participants) ? data!.participants : [];
      const updatedParticipants = [
        ...existingParticipants.filter(p => p.id !== cleanParticipant.id),
        cleanParticipant
      ];
      const existingProfiles = (data?.playerProfiles && typeof data.playerProfiles === 'object')
        ? data.playerProfiles
        : {};

      tx.set(
        sessionDocRef,
        sanitizeForFirestore({
          sessionCode: cleanCode,
          participants: updatedParticipants,
          playerProfiles: {
            ...existingProfiles,
            [cleanParticipant.id]: cleanParticipant
          }
        }),
        { merge: true }
      );
    });

    // Mirror participant profile to schools/HBS_portal without overwriting presenter stage/index
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, sanitizeForFirestore({
      activeKahootSession: {
        sessionCode: cleanCode,
        playerProfiles: {
          [cleanParticipant.id]: cleanParticipant
        }
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
 * Uses Firestore runTransaction + nested responses map so simultaneous answers never overwrite each other
 * and teacher's stage/currentQuestionIndex/teacherSeq are never overwritten or blocked by phone clock skew.
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
    const qKey = String(questionIndex);
    const answerTime = Date.now();

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(sessionDocRef);
      const data = snap.exists() ? (snap.data() as KahootLiveSession) : null;
      const existingParticipants = Array.isArray(data?.participants) ? data!.participants : [];
      const existingProfiles = (data?.playerProfiles && typeof data.playerProfiles === 'object')
        ? { ...data.playerProfiles }
        : {};
      const existingResponses = (data?.responses && typeof data.responses === 'object')
        ? { ...data.responses }
        : {};
      const qResponses = (existingResponses[qKey] && typeof existingResponses[qKey] === 'object')
        ? { ...existingResponses[qKey] }
        : {};

      qResponses[studentId] = {
        optionId,
        answeredAt: answerTime,
        ...(studentInfo?.nickname ? { nickname: studentInfo.nickname } : {}),
        ...(studentInfo?.avatar ? { avatar: studentInfo.avatar } : {})
      };
      existingResponses[qKey] = qResponses;

      let found = false;
      const updatedParticipants = existingParticipants.map(p => {
        if (p.id === studentId) {
          found = true;
          return {
            ...p,
            lastAnswerId: optionId,
            lastAnswerTime: answerTime,
            answeredQuestionIndex: questionIndex
          };
        }
        return p;
      });

      if (!found) {
        const profile = existingProfiles[studentId];
        const newEntry: KahootParticipant = {
          id: studentId,
          nickname: profile?.nickname || studentInfo?.nickname || 'Schüler',
          avatar: profile?.avatar || studentInfo?.avatar || '🦊',
          score: profile?.score || 0,
          streak: profile?.streak || 0,
          lastAnswerId: optionId,
          lastAnswerTime: answerTime,
          answeredQuestionIndex: questionIndex
        };
        updatedParticipants.push(newEntry);
        existingProfiles[studentId] = newEntry;
      }

      const answersReceived = Object.keys(qResponses).length;

      tx.set(
        sessionDocRef,
        sanitizeForFirestore({
          responses: existingResponses,
          participants: updatedParticipants,
          playerProfiles: existingProfiles,
          answersReceived
        }),
        { merge: true }
      );
    });
  } catch (err) {
    console.warn("Error submitting Kahoot answer in cloud:", err);
  }
};

/**
 * Syncs the active Menti live session or asynchronous survey to Firestore.
 * Set includeResponses=false when only updating presenter controls so concurrent votes are preserved.
 */
export const syncMentiLiveSession = async (
  session: MentiLiveSession,
  options?: { includeResponses?: boolean }
): Promise<void> => {
  if (!db || !session.sessionCode) return;
  try {
    const cleanCode = (session.sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);
    const payloadObj: any = { ...session, sessionCode: cleanCode, updatedAt: Date.now() };
    if (options?.includeResponses === false) {
      delete payloadObj.responses;
      delete payloadObj.participantsCount;
    }
    const dataToWrite = sanitizeForFirestore(payloadObj);
    await setDoc(sessionDocRef, dataToWrite, { merge: true });

    // Mirror to schools/HBS_portal & portal_data if live session
    if (!session.isSurveyMode) {
      const schoolDocRef = doc(db, 'schools', 'HBS_portal');
      await setDoc(schoolDocRef, { activeMentiSession: dataToWrite }, { merge: true }).catch(() => {});

      const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
      await setDoc(portalDocRef, { activeMentiSession: dataToWrite }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn("Menti sync to cloud warning:", err);
  }
};

export const getMentiLiveSessionFromCloud = async (sessionCode: string): Promise<MentiLiveSession | null> => {
  if (!db || !sessionCode) return null;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);
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
 * Resets collected responses for a Menti session / survey in Firestore.
 */
export const resetMentiSessionResponsesInCloud = async (sessionCode: string): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);
    await setDoc(sessionDocRef, {
      responses: {},
      participantsCount: 0,
      updatedAt: Date.now()
    }, { merge: true });

    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, {
      'activeMentiSession.responses': {},
      'activeMentiSession.participantsCount': 0
    }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Error resetting Menti session responses in cloud:", err);
  }
};

/**
 * Closes an asynchronous Menti survey in Firestore.
 */
export const closeMentiSurveyInCloud = async (sessionCode: string): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);
    await setDoc(sessionDocRef, {
      isClosed: true,
      isVotingOpen: false,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn("Error closing Menti survey in cloud:", err);
  }
};

/**
 * Reopens / extends an asynchronous Menti survey in Firestore.
 */
export const reopenMentiSurveyInCloud = async (sessionCode: string, expiresAt: number | null): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);
    await setDoc(sessionDocRef, {
      isClosed: false,
      isVotingOpen: true,
      expiresAt,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn("Error reopening Menti survey in cloud:", err);
  }
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
 * Uses Firestore runTransaction to guarantee zero dropped votes under concurrent classroom usage.
 */
export const submitMentiVoteInCloud = async (
  sessionCode: string,
  slideId: string,
  payload: any
): Promise<void> => {
  if (!db || !sessionCode) return;
  try {
    const cleanCode = (sessionCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `menti_${cleanCode}`);

    let updatedResponses: Record<string, any> | null = null;
    let updatedCount = 0;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(sessionDocRef);
      if (!snap.exists()) return;

      const data = snap.data() as MentiLiveSession;
      const responses = { ...(data.responses || {}) };
      const slideResp = responses[slideId];

      if (payload.optionId) {
        // Choice or Quiz
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? { ...slideResp } : {};
        obj[payload.optionId] = (obj[payload.optionId] || 0) + 1;
        responses[slideId] = obj;

        // If quiz score info is supplied, update leaderboard map
        if (payload.quizNickname) {
          const scoresKey = `${slideId}_scores`;
          const scoresMap = (typeof responses[scoresKey] === 'object' && responses[scoresKey] !== null)
            ? { ...responses[scoresKey] }
            : {};
          scoresMap[payload.quizNickname] = {
            name: payload.quizNickname,
            isCorrect: Boolean(payload.quizIsCorrect),
            score: Number(payload.quizScore || 0)
          };
          responses[scoresKey] = scoresMap;
        }
      } else if (Array.isArray(payload.words)) {
        // Batch Wordcloud submission from a single user
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? { ...slideResp } : {};
        payload.words.forEach((rawWord: string) => {
          const clean = String(rawWord || '').trim();
          if (clean) {
            obj[clean] = (obj[clean] || 0) + 1;
          }
        });
        responses[slideId] = obj;
      } else if (payload.word) {
        // Single Wordcloud word
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? { ...slideResp } : {};
        obj[payload.word] = (obj[payload.word] || 0) + 1;
        responses[slideId] = obj;
      } else if (payload.text) {
        // Open-ended thoughts
        const arr = Array.isArray(slideResp) ? [...slideResp] : [];
        arr.push({
          id: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text: payload.text,
          timestamp: Date.now()
        });
        responses[slideId] = arr;
      } else if (payload.ratings) {
        // Scales
        const obj = (typeof slideResp === 'object' && !Array.isArray(slideResp) && slideResp !== null) ? { ...slideResp } : {};
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
        const arr = Array.isArray(slideResp) ? [...slideResp] : [];
        arr.push(payload.rankingOrder);
        responses[slideId] = arr;
      } else if (payload.matrixCoords) {
        // 2x2 Matrix
        const arr = Array.isArray(slideResp) ? [...slideResp] : [];
        arr.push(payload.matrixCoords);
        responses[slideId] = arr;
      }

      const shouldIncrement = payload.incrementParticipant !== false;
      updatedCount = shouldIncrement ? (data.participantsCount || 0) + 1 : (data.participantsCount || 0);
      updatedResponses = responses;

      tx.set(
        sessionDocRef,
        sanitizeForFirestore({
          responses,
          participantsCount: updatedCount,
          updatedAt: Date.now()
        }),
        { merge: true }
      );
    });

    if (updatedResponses) {
      const schoolDocRef = doc(db, 'schools', 'HBS_portal');
      await setDoc(schoolDocRef, sanitizeForFirestore({
        'activeMentiSession.responses': updatedResponses,
        'activeMentiSession.participantsCount': updatedCount
      }), { merge: true }).catch(() => {});
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
    const cleanPin = (session.pinCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${cleanPin}`);
    const dataToWrite = sanitizeForFirestore({ ...session, pinCode: cleanPin, updatedAt: Date.now() });
    await setDoc(sessionDocRef, dataToWrite, { merge: true });

    // Mirror to portal_data
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    await setDoc(portalDocRef, { activeOncooSession: dataToWrite }, { merge: true }).catch(() => {});

    // Mirror to schoolDocRef
    const schoolDocRef = doc(db, 'schools', 'HBS_portal');
    await setDoc(schoolDocRef, { activeOncooSession: dataToWrite }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn("Oncoo sync to cloud warning:", err);
  }
};

export const getOncooLiveSessionFromCloud = async (pinCode: string): Promise<OncooSession | null> => {
  if (!db || !pinCode) return null;
  try {
    const cleanPin = (pinCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${cleanPin}`);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      return snap.data() as OncooSession;
    }

    // Fallback: check portal_data
    const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
    const pSnap = await getDoc(portalDocRef);
    if (pSnap.exists()) {
      const active = pSnap.data()?.activeOncooSession;
      if (active && String(active.pinCode || '').replace(/\s+/g, '') === cleanPin) {
        return active as OncooSession;
      }
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
    const cleanPin = (pinCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${cleanPin}`);
    const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as OncooSession);
      } else {
        // Fallback: check portal_data
        const portalDocRef = doc(db!, PORTAL_COLLECTION, PORTAL_DATA_DOC);
        getDoc(portalDocRef).then((pSnap) => {
          if (pSnap.exists()) {
            const active = pSnap.data()?.activeOncooSession;
            if (active && String(active.pinCode || '').replace(/\s+/g, '') === cleanPin) {
              callback(active as OncooSession);
              return;
            }
          }
          callback(null);
        }).catch(() => callback(null));
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
    placematConsensusUpdate?: { groupIndex: number; consensus: string };
  }
): Promise<void> => {
  if (!db || !pinCode) return;
  try {
    const cleanPin = (pinCode || '').replace(/\s+/g, '');
    const sessionDocRef = doc(db, PORTAL_COLLECTION, `oncoo_${cleanPin}`);
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
                author: (payload.studentName && (!corner.author || corner.author.startsWith('Schüler '))) ? payload.studentName : corner.author,
                notes: [...(corner.notes || []), note]
              }
            };
          });
          sess.placemat.groups = groups;
        }
      }

      // 5b. Placemat Consensus Update
      if (payload.placematConsensusUpdate && sess.toolType === 'placemat' && sess.placemat) {
        const { groupIndex, consensus } = payload.placematConsensusUpdate;
        if (sess.placemat.groups && sess.placemat.groups[groupIndex]) {
          sess.placemat.groups = sess.placemat.groups.map((grp, gIdx) => {
            if (gIdx !== groupIndex) return grp;
            return {
              ...grp,
              consensus: typeof consensus === 'string' ? consensus : ''
            };
          });
        }
      }

      sess.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(sess);
      await setDoc(sessionDocRef, sanitized, { merge: true });

      // Mirror to portal_data
      const portalDocRef = doc(db, PORTAL_COLLECTION, PORTAL_DATA_DOC);
      await setDoc(portalDocRef, { activeOncooSession: sanitized }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn("Error submitting Oncoo action in cloud:", err);
  }
};

