/**
 * Cloudflare Web Analytics & Schul-Nutzungsmetriken für das HBS App-Portal
 * 100 % DSGVO-konform, cookie-frei, ohne IP-Tracking und ohne Cookie-Banner-Pflicht.
 */

export const CF_ANALYTICS_TOKEN_STORAGE_KEY = 'hbs_cf_analytics_token';
export const APP_LAUNCH_STATS_STORAGE_KEY = 'hbs_app_launch_stats_v2';

// Standard-Token aus Umgebungsvariablen (falls konfiguriert)
export const DEFAULT_CF_TOKEN = (import.meta as any).env?.VITE_CF_ANALYTICS_TOKEN || '';

/**
 * Holt den gespeicherten Cloudflare Analytics Beacon Token
 */
export function getCloudflareAnalyticsToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CF_ANALYTICS_TOKEN_STORAGE_KEY) || DEFAULT_CF_TOKEN;
}

/**
 * Speichert einen neuen Cloudflare Analytics Beacon Token
 */
export function setCloudflareAnalyticsToken(token: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = token.trim();
  if (trimmed) {
    localStorage.setItem(CF_ANALYTICS_TOKEN_STORAGE_KEY, trimmed);
    initCloudflareWebAnalytics(trimmed);
  } else {
    localStorage.removeItem(CF_ANALYTICS_TOKEN_STORAGE_KEY);
  }
}

/**
 * Initialisiert das offizielle Cloudflare Web Analytics Beacon-Skript
 * mit aktiviertem SPA-Modus (Single Page Application für #tafel, #menti, etc.)
 */
export function initCloudflareWebAnalytics(overrideToken?: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const token = overrideToken || getCloudflareAnalyticsToken();
  if (!token) return false;

  const EXISTING_BEACON_ID = 'cf-web-analytics-beacon';
  const existing = document.getElementById(EXISTING_BEACON_ID);
  if (existing) {
    existing.remove(); // Re-initialisieren bei Token-Wechsel
  }

  try {
    const script = document.createElement('script');
    script.id = EXISTING_BEACON_ID;
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute(
      'data-cf-beacon',
      JSON.stringify({
        token,
        spa: true // Erkennt virtuelle Routenwechsel (#tafel, #menti, #kahoot, #ablage)
      })
    );
    document.head.appendChild(script);
    return true;
  } catch (err) {
    console.warn('Cloudflare Web Analytics Beacon konnte nicht geladen werden:', err);
    return false;
  }
}

/**
 * Registriert den Start einer Schul-App für die schulinterne Nutzungsstatistik (100 % anonym & lokal)
 */
export function recordAppLaunch(appId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(APP_LAUNCH_STATS_STORAGE_KEY);
    const data: { total: number; apps: Record<string, number> } = raw 
      ? JSON.parse(raw) 
      : { total: 0, apps: {} };

    data.total = (data.total || 0) + 1;
    data.apps[appId] = (data.apps[appId] || 0) + 1;

    localStorage.setItem(APP_LAUNCH_STATS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Fehler beim Aufzeichnen des App-Starts:', e);
  }
}

/**
 * Holt aggregierte App-Nutzungsstatistiken
 */
export function getAppLaunchStats(): { total: number; apps: Record<string, number> } {
  if (typeof window === 'undefined') return { total: 0, apps: {} };
  try {
    const raw = localStorage.getItem(APP_LAUNCH_STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.total === 'number' && parsed.apps) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Fehler beim Lesen der App-Statistiken:', e);
  }
  return { total: 0, apps: {} };
}

/**
 * Setzt die lokale App-Statistik zurück
 */
export function resetAppLaunchStats(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(APP_LAUNCH_STATS_STORAGE_KEY);
}

/**
 * Misst die Netzwerk-Latenz zur Cloudflare / Vercel Edge in Millisekunden
 */
export async function measureEdgeLatency(): Promise<number> {
  const start = performance.now();
  try {
    await fetch('/favicon-32x32.png', { method: 'HEAD', cache: 'no-store' });
    const duration = Math.round(performance.now() - start);
    return duration;
  } catch {
    return Math.round(performance.now() - start);
  }
}

/**
 * Ermittelt das aktuelle Client-Gerät (Smartboard, iPad, iMac, Smartphone)
 */
export function detectClientEnvironment(): {
  deviceType: 'Smartboard / Großbild' | 'iPad / Tablet' | 'Desktop / Laptop' | 'Smartphone';
  os: string;
  browser: string;
  resolution: string;
  pixelRatio: number;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Desktop / Laptop',
      os: 'Unbekannt',
      browser: 'Unbekannt',
      resolution: '1920 × 1080',
      pixelRatio: 1
    };
  }

  const ua = navigator.userAgent;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  // OS Detection
  let os = 'Unbekannt';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPad|iPhone|iPod/i.test(ua)) os = 'iOS / iPadOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser Detection
  let browser = 'Unbekannt';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari/i.test(ua)) browser = 'Apple Safari';

  // Device Category
  let deviceType: 'Smartboard / Großbild' | 'iPad / Tablet' | 'Desktop / Laptop' | 'Smartphone' = 'Desktop / Laptop';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (w >= 2000 && isTouch) {
    deviceType = 'Smartboard / Großbild';
  } else if (/iPad|Tablet/i.test(ua) || (isTouch && w >= 600 && w <= 1366)) {
    deviceType = 'iPad / Tablet';
  } else if (/Mobile|iPhone|Android.*Mobile/i.test(ua) || (isTouch && w < 600)) {
    deviceType = 'Smartphone';
  } else {
    deviceType = 'Desktop / Laptop';
  }

  return {
    deviceType,
    os,
    browser,
    resolution: `${w} × ${h}`,
    pixelRatio
  };
}
