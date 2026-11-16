import { applyOriginProtection } from './_security';

/**
 * Cloudflare Workers AI - OpenAI Whisper Serverless Proxy
 * Transkribiert eingehende Audiodaten (WebM, WAV, MP3) über Cloudflare Workers AI (@cf/openai/whisper)
 * 100 % Free Tier (10.000 Neurons pro Tag = ca. 240 Min. Audio / Tag kostenlos)
 */

const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // 4 MB Schutzlimit (Vercel Serverless Limit & Free-Tier-Schutz)
const WHISPER_TIMEOUT_MS = 30000;

export const config = {
  api: {
    bodyParser: false, // Erlaubt rohen Binary-Stream für maximale Geschwindigkeit
  },
};

export default async function handler(req: any, res: any) {
  if (!applyOriginProtection(req, res, ['X-CF-Token'])) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind zulässig.' });
  }

  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '').trim();
  const rawHeaderToken = req.headers?.['x-cf-token'];
  const headerToken = Array.isArray(rawHeaderToken) ? rawHeaderToken[0] : rawHeaderToken;

  const apiToken = (
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_AI_API_TOKEN ||
    (typeof headerToken === 'string' ? headerToken : '')
  ).trim();

  if (!accountId) {
    return res.status(500).json({
      error: 'Cloudflare Account-ID fehlt auf dem Server (CLOUDFLARE_ACCOUNT_ID oder R2_ACCOUNT_ID).',
      code: 'NO_ACCOUNT_ID',
    });
  }

  if (!apiToken) {
    return res.status(400).json({
      error: 'Kein Cloudflare API-Token konfiguriert (CLOUDFLARE_API_TOKEN in Vercel erforderlich).',
      code: 'NO_TOKEN',
    });
  }

  try {
    // 1. Audio-Stream mit hartem Größenlimit einlesen
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of req) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_AUDIO_BYTES) {
        return res.status(413).json({
          error: 'Audioaufnahme überschreitet das Limit von 4 MB. Bitte Aufnahme kürzer halten.',
        });
      }
      chunks.push(buf);
    }

    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Keine Audiodaten im Request übermittelt.' });
    }

    // 2. An Cloudflare Workers AI Whisper Endpoint senden
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/openai/whisper`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHISPER_TIMEOUT_MS);

    try {
      const cfResponse = await fetch(cfUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/octet-stream',
        },
        signal: controller.signal,
        body: audioBuffer,
      });

      clearTimeout(timeoutId);

      if (!cfResponse.ok) {
        const errText = await cfResponse.text();
        return res.status(cfResponse.status).json({
          error: `Cloudflare Workers AI Fehler (${cfResponse.status})`,
          details: errText,
        });
      }

      const data = await cfResponse.json();

      return res.status(200).json({
        success: true,
        text: data.result?.text || '',
        vtt: data.result?.vtt || null,
        word_count: data.result?.word_count || 0,
        engine: 'cloudflare-whisper',
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr?.name === 'AbortError';
      return res.status(isTimeout ? 504 : 502).json({
        error: isTimeout
          ? 'Zeitüberschreitung bei Cloudflare Whisper.'
          : 'Verbindungsfehler zu Cloudflare Workers AI.',
        details: fetchErr?.message || String(fetchErr),
      });
    }
  } catch (err: any) {
    console.error('Fehler bei Cloudflare Whisper Spracherkennung:', err);
    return res.status(500).json({
      error: 'Fehler bei der Transkription.',
      details: err?.message || String(err),
    });
  }
}
