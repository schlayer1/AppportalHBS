/**
 * Cloudflare Workers AI - OpenAI Whisper Serverless Proxy
 * Transkribiert eingehende Audiodaten (WebM, WAV, MP3) über Cloudflare Workers AI (@cf/openai/whisper)
 * 100 % Free Tier (10.000 Neurons pro Tag = ca. 240 Min. Audio / Tag kostenlos)
 */

export const config = {
  api: {
    bodyParser: false // Erlaubt rohen Binary-Stream für maximale Geschwindigkeit
  }
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-CF-Token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind zulässig.' });
  }

  const accountId = 
    process.env.R2_ACCOUNT_ID || 
    process.env.CLOUDFLARE_ACCOUNT_ID || 
    '7ab07b5ac6f9ece3f23573e18eb2e5a1';

  const apiToken = 
    process.env.CLOUDFLARE_API_TOKEN || 
    process.env.CF_AI_API_TOKEN || 
    process.env.R2_SECRET_ACCESS_KEY || // Fallback
    req.headers['x-cf-token'];

  if (!apiToken) {
    return res.status(400).json({
      error: 'Kein Cloudflare API-Token konfiguriert (CLOUDFLARE_API_TOKEN in .env erforderlich).',
      code: 'NO_TOKEN'
    });
  }

  try {
    // 1. Audio-Stream aus dem Request einlesen
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Keine Audiodaten im Request übermittelt.' });
    }

    // 2. An Cloudflare Workers AI Whisper Endpoint senden
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/openai/whisper`;

    const cfResponse = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: audioBuffer
    });

    if (!cfResponse.ok) {
      const errText = await cfResponse.text();
      return res.status(cfResponse.status).json({
        error: `Cloudflare Workers AI Fehler (${cfResponse.status})`,
        details: errText
      });
    }

    const data = await cfResponse.json();

    return res.status(200).json({
      success: true,
      text: data.result?.text || '',
      vtt: data.result?.vtt || null,
      word_count: data.result?.word_count || 0,
      engine: 'cloudflare-whisper'
    });
  } catch (err: any) {
    console.error('Fehler bei Cloudflare Whisper Spracherkennung:', err);
    return res.status(500).json({
      error: 'Fehler bei der Transkription.',
      details: err?.message || String(err)
    });
  }
}
