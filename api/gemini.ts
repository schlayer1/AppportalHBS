import { applyOriginProtection } from './_security';

/**
 * Vercel Serverless Function: /api/gemini
 * Schützt den Schul-GEMINI_API_KEY serverseitig als Vercel Secret
 * und verhindert clientseitige Offenlegung im Browser-Bundle.
 */

export const CANDIDATE_FLASH_MODELS = [
  'gemini-4-hydrogen',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

const REQUEST_TIMEOUT_MS = 45000;

export default async function handler(req: any, res: any) {
  if (!applyOriginProtection(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind für /api/gemini zulässig.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Ungültiges JSON im Request-Body.' });
      }
    }
    body = body || {};

    const {
      systemPrompt,
      userPrompt,
      model,
      temperature = 0.3,
      responseMimeType,
      maxOutputTokens = 4096,
    } = body;

    // 1. Optionaler individueller Lehrkraft-Key (BYOK) aus Request-Body
    // 2. Serverseitiges Vercel Secret GEMINI_API_KEY
    const clientKey =
      typeof body.apiKey === 'string' && body.apiKey.trim() && body.apiKey.trim() !== 'serverless-proxy'
        ? body.apiKey.trim()
        : '';
    const serverKey = (process.env.GEMINI_API_KEY || '').trim();
    const activeKey = clientKey || serverKey;

    if (!activeKey) {
      return res.status(401).json({
        error:
          'Kein Gemini API-Schlüssel konfiguriert. Bitte hinterlege GEMINI_API_KEY in Vercel als Secret oder trage einen persönlichen Schlüssel in den KI-Einstellungen ein.',
      });
    }

    if (!userPrompt && !systemPrompt) {
      return res.status(400).json({ error: 'userPrompt oder systemPrompt erforderlich.' });
    }

    const candidateModels: string[] = [];
    if (typeof model === 'string' && model.trim() && model !== 'auto') {
      candidateModels.push(model.trim());
    }
    for (const m of CANDIDATE_FLASH_MODELS) {
      if (!candidateModels.includes(m)) {
        candidateModels.push(m);
      }
    }

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt || ''}`.trim() : String(userPrompt);
    let lastErrorMessage = '';

    for (const currentModel of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${encodeURIComponent(activeKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const generationConfig: Record<string, any> = {
          temperature: typeof temperature === 'number' ? temperature : 0.3,
          maxOutputTokens: typeof maxOutputTokens === 'number' ? Math.min(maxOutputTokens, 8192) : 4096,
        };
        if (responseMimeType === 'application/json') {
          generationConfig.responseMimeType = 'application/json';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            generationConfig,
          }),
        });

        clearTimeout(timeoutId);

        const data: any = await response.json().catch(() => null);

        if (response.ok && data) {
          const firstCandidate = data.candidates?.[0];
          const text = firstCandidate?.content?.parts?.[0]?.text;
          if (typeof text === 'string' && text.trim().length > 0) {
            return res.status(200).json({ text, model: currentModel });
          }

          const finishReason = firstCandidate?.finishReason;
          const blockReason = data.promptFeedback?.blockReason;
          if (finishReason && finishReason !== 'STOP') {
            lastErrorMessage = `Modell ${currentModel} beendet mit Status "${finishReason}".`;
          } else if (blockReason) {
            lastErrorMessage = `Prompt wurde durch Sicherheitsfilter geblockt (${blockReason}).`;
          } else {
            lastErrorMessage = `Modell ${currentModel} lieferte eine leere Antwort.`;
          }
          continue;
        }

        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        lastErrorMessage = errMsg;

        if (
          response.status === 400 &&
          (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid'))
        ) {
          return res.status(400).json({
            error: 'Der Gemini API-Schlüssel ist ungültig. Bitte prüfen Sie den hinterlegten Schlüssel.',
          });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastErrorMessage =
          err?.name === 'AbortError'
            ? `Zeitüberschreitung nach ${REQUEST_TIMEOUT_MS / 1000}s bei Modell ${currentModel}`
            : err?.message || String(err);
      }
    }

    return res.status(502).json({
      error: `Kein Gemini-Modell erreichbar. Letzter Fehler: ${lastErrorMessage}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Interner Serverfehler im Gemini-Proxy.' });
  }
}
