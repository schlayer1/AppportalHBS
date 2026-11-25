import {
  SharedSeatingPlan,
  SitzplanWorkspaceData,
} from '../types/sitzplanTypes';
import {
  uploadFileToR2,
  getR2DownloadUrl,
  deleteFileFromR2,
} from './r2StorageService';

const IDB_NAME = 'hbs-sitzplan-db';
const IDB_STORE = 'keyval';
const WORKSPACE_PREFIX = 'sitzplan/teachers';
const SHARED_PLANS_PREFIX = 'sitzplan/shared/plans';
const SHARED_CACHE_KEY = 'hbs_sitzplan_shared_cache_v1';

interface R2ListObject {
  key: string;
  size: number;
  etag: string;
  lastModified: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openSitzplanDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      req.result.onclose = () => {
        dbPromise = null;
      };
      resolve(req.result);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openSitzplanDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(`hbs_sp_${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openSitzplanDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(`hbs_sp_${key}`, JSON.stringify(value));
    } catch {
      // ignore storage quota errors
    }
  }
}

function sanitizeSlug(input: string): string {
  return (input || 'unbekannt')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'item';
}

export function getTeacherWorkspaceR2Key(authorId: string): string {
  return `${WORKSPACE_PREFIX}/${sanitizeSlug(authorId)}/workspace.json`;
}

export function getSharedPlanR2Key(sharedId: string): string {
  return `${SHARED_PLANS_PREFIX}/${sanitizeSlug(sharedId)}.json`;
}

export async function loadLocalTeacherWorkspace(
  authorId: string
): Promise<SitzplanWorkspaceData | null> {
  return idbGet<SitzplanWorkspaceData>(`workspace_${authorId}`);
}

export async function saveLocalTeacherWorkspace(
  authorId: string,
  data: SitzplanWorkspaceData
): Promise<void> {
  await idbSet(`workspace_${authorId}`, data);
}

/**
 * Lädt den persönlichen Arbeitsbereich aus Cloudflare R2 (falls vorhanden).
 * Gibt null zurück, falls noch keine Cloud-Datei existiert oder R2 offline ist.
 */
export async function fetchTeacherWorkspaceFromR2(
  authorId: string
): Promise<SitzplanWorkspaceData | null> {
  const key = getTeacherWorkspaceR2Key(authorId);
  try {
    const url = await getR2DownloadUrl(key);
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404 || res.status === 403) {
      return null;
    }
    if (!res.ok) return null;
    const parsed = (await res.json()) as SitzplanWorkspaceData;
    if (!parsed || !Array.isArray(parsed.classes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Speichert den vollständigen persönlichen Arbeitsbereich der Lehrkraft
 * direkt als JSON-Objekt in Cloudflare R2 (hält Firestore schlank).
 */
export async function syncTeacherWorkspaceToR2(
  authorId: string,
  data: SitzplanWorkspaceData
): Promise<{ ok: boolean; error?: string }> {
  const key = getTeacherWorkspaceR2Key(authorId);
  try {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'workspace.json', { type: 'application/json' });
    await uploadFileToR2(file, key);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Cloudflare R2 Upload fehlgeschlagen' };
  }
}

/**
 * Listet alle Objekte unter sitzplan/shared/plans/ via /api/r2-presign (ListObjectsV2).
 */
async function listSharedObjectsInR2(): Promise<R2ListObject[]> {
  const res = await fetch('/api/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'list',
      prefix: `${SHARED_PLANS_PREFIX}/`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `R2-Listing fehlgeschlagen (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.objects) ? data.objects : [];
}

/**
 * Gibt einen Sitzplan (ohne private pädagogische Einschätzungen/Beziehungen)
 * für das gesamte Kollegium in Cloudflare R2 frei.
 */
export async function publishSharedPlanToR2(
  plan: SharedSeatingPlan
): Promise<{ ok: boolean; key: string; error?: string }> {
  const key = getSharedPlanR2Key(plan.id);
  try {
    const blob = new Blob([JSON.stringify(plan)], { type: 'application/json' });
    const file = new File([blob], `${sanitizeSlug(plan.id)}.json`, {
      type: 'application/json',
    });
    await uploadFileToR2(file, key);

    // Update local cache immediately
    const cache = (await idbGet<Record<string, { etag: string; plan: SharedSeatingPlan }>>(SHARED_CACHE_KEY)) || {};
    cache[key] = { etag: String(plan.updatedAt), plan };
    await idbSet(SHARED_CACHE_KEY, cache);

    return { ok: true, key };
  } catch (err: any) {
    return { ok: false, key, error: err?.message || 'Freigabe fehlgeschlagen' };
  }
}

/**
 * Hebt die Freigabe eines Sitzplans im Kollegium wieder auf und löscht die Datei aus R2.
 */
export async function unpublishSharedPlanFromR2(sharedId: string): Promise<void> {
  const key = getSharedPlanR2Key(sharedId);
  await deleteFileFromR2(key);
  const cache = (await idbGet<Record<string, { etag: string; plan: SharedSeatingPlan }>>(SHARED_CACHE_KEY)) || {};
  delete cache[key];
  await idbSet(SHARED_CACHE_KEY, cache);
}

/**
 * Lädt die Übersicht aller freigegebenen Sitzpläne aus Cloudflare R2.
 * Nutzt ETag-Caching in IndexedDB, sodass unveränderte Pläne nicht erneut geladen werden.
 */
export async function fetchAllSharedPlansFromR2(): Promise<{
  plans: SharedSeatingPlan[];
  fromCacheOnly: boolean;
  error?: string;
}> {
  const cache =
    (await idbGet<Record<string, { etag: string; plan: SharedSeatingPlan }>>(
      SHARED_CACHE_KEY
    )) || {};

  try {
    const objects = await listSharedObjectsInR2();
    const jsonObjects = objects.filter((o) => o.key.endsWith('.json'));
    const nextCache: Record<string, { etag: string; plan: SharedSeatingPlan }> = {};

    const results = await Promise.all(
      jsonObjects.map(async (obj) => {
        const cached = cache[obj.key];
        if (cached && obj.etag && cached.etag === obj.etag) {
          nextCache[obj.key] = cached;
          return cached.plan;
        }
        try {
          const url = await getR2DownloadUrl(obj.key);
          const resp = await fetch(url, { cache: 'no-store' });
          if (!resp.ok) return cached?.plan ?? null;
          const plan = (await resp.json()) as SharedSeatingPlan;
          if (!plan || !plan.id || !plan.room) return null;
          nextCache[obj.key] = { etag: obj.etag || String(plan.updatedAt), plan };
          return plan;
        } catch {
          if (cached) {
            nextCache[obj.key] = cached;
            return cached.plan;
          }
          return null;
        }
      })
    );

    await idbSet(SHARED_CACHE_KEY, nextCache);
    const plans = results
      .filter((p): p is SharedSeatingPlan => Boolean(p))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { plans, fromCacheOnly: false };
  } catch (err: any) {
    const cachedPlans = Object.values(cache)
      .map((entry) => entry.plan)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      plans: cachedPlans,
      fromCacheOnly: true,
      error: err?.message || 'Cloudflare R2 Übersicht derzeit nicht erreichbar',
    };
  }
}
