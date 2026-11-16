/**
 * Gemeinsame Sicherheits- und Origin-Prüfung für Vercel Serverless APIs.
 * Verhindert Missbrauch über fremde Websites oder unautorisierte Cross-Origin-Aufrufe,
 * ohne den Schulbetrieb auf der eigenen Vercel-/Custom-Domain zu beeinträchtigen.
 */

function extractHost(urlStr: string): string | null {
  try {
    return new URL(urlStr).host.toLowerCase();
  } catch {
    return null;
  }
}

function isOriginAllowed(urlStr: string, requestHost: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    const host = parsed.host.toLowerCase();

    // 1. Gleicher Host wie die laufende App (Vercel Production, Preview oder Custom Domain)
    if (requestHost && host === requestHost.toLowerCase()) {
      return true;
    }

    // 2. Lokale Entwicklung
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // 3. Optional explizit konfigurierte Origins (kommagetrennt in ALLOWED_ORIGINS)
    const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (extraOrigins.includes(parsed.origin.toLowerCase())) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Prüft CORS & Same-Origin/Referer für API-Endpunkte.
 * Gibt `true` zurück, wenn die Anfrage normal weiterverarbeitet werden darf;
 * gibt `false` zurück, wenn OPTIONS schon beantwortet oder die Herkunft mit 403 blockiert wurde.
 */
export function applyOriginProtection(
  req: any,
  res: any,
  extraHeaders: string[] = []
): boolean {
  const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const requestHost = Array.isArray(rawHost) ? rawHost[0] : String(rawHost);

  const rawOrigin = req.headers?.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : (rawOrigin || '');

  const rawReferer = req.headers?.referer;
  const referer = Array.isArray(rawReferer) ? rawReferer[0] : (rawReferer || '');

  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    ...extraHeaders
  ].join(', ');

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
  res.setHeader('Vary', 'Origin');

  if (origin && isOriginAllowed(origin, requestHost)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    if (origin && !isOriginAllowed(origin, requestHost)) {
      res.status(403).json({ error: 'CORS: Herkunft nicht erlaubt.' });
      return false;
    }
    res.status(200).end();
    return false;
  }

  // Bei POST muss entweder ein erlaubter Origin- oder ein erlaubter Referer-Header vorliegen
  if (origin) {
    if (!isOriginAllowed(origin, requestHost)) {
      res.status(403).json({ error: 'Zugriff verweigert: Unzulässige Herkunft (Origin).' });
      return false;
    }
    return true;
  }

  if (referer && isOriginAllowed(referer, requestHost)) {
    return true;
  }

  // Fallback-Check: Wenn Host gesetzt ist und direkt vom lokalen Vite-Dev-Proxy aufgerufen wird
  const refHost = referer ? extractHost(referer) : null;
  if (refHost && requestHost && refHost === requestHost.toLowerCase()) {
    return true;
  }

  res.status(403).json({ error: 'Zugriff verweigert: Fehlender oder ungültiger Origin-Header.' });
  return false;
}
