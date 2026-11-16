/**
 * Google Gemini KI Service für das HBS App-Portal
 * Nutzt primär den sicheren Serverless-Proxy (/api/gemini mit GEMINI_API_KEY Secret)
 * ohne Offenlegung des Schulschlüssels im Browser-Bundle.
 * Unterstützt optional einen persönlichen Kollegen-Key (BYOK) aus localStorage.
 */

export const STORAGE_KEYS = {
  API_KEY: 'hbs_gemini_api_key',
  SELECTED_MODEL: 'hbs_gemini_selected_model',
  CACHED_MODEL: 'hbs_gemini_cached_working_model',
};

// Zukunftssichere Free-Tier-Modelle in bevorzugter Prioritätsreihenfolge
export const CANDIDATE_FLASH_MODELS = [
  'gemini-4-hydrogen',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

export interface GeminiTestResult {
  success: boolean;
  activeModel: string;
  latencyMs: number;
  modelsCount: number;
  message: string;
}

class GeminiService {
  private inMemoryWorkingModel: string | null = null;

  /**
   * Gibt einen optional vom Nutzer gesetzten persönlichen Key aus localStorage zurück.
   * Der offizielle Schul-Key liegt ausschließlich serverseitig in Vercel (GEMINI_API_KEY).
   */
  public getApiKey(): string {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (stored && stored.trim().length > 0 && stored.trim() !== 'serverless-proxy') {
        return stored.trim();
      }
    } catch {
      // ignore storage error
    }
    return '';
  }

  /**
   * Speichert einen persönlichen API-Key des Kollegen (leer = Server-Schulschlüssel nutzen)
   */
  public saveApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      const trimmed = (key || '').trim();
      if (!trimmed || trimmed === 'serverless-proxy') {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      } else {
        localStorage.setItem(STORAGE_KEYS.API_KEY, trimmed);
      }
      this.inMemoryWorkingModel = null;
    } catch {
      // ignore
    }
  }

  /**
   * Prüft, ob ein individueller BYOK-Schlüssel oder der sichere Server-Schulschlüssel verwendet wird
   */
  public isUsingCustomKey(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Setzt auf den sicheren Server-Schulschlüssel zurück
   */
  public resetToSchoolKey(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_MODEL);
      this.inMemoryWorkingModel = null;
    } catch {
      // ignore
    }
  }

  /**
   * Gibt das vom Benutzer bevorzugte Modell zurück ('auto' oder konkreter Name)
   */
  public getSelectedModelPreference(): string {
    if (typeof window === 'undefined') return 'auto';
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'auto';
    } catch {
      return 'auto';
    }
  }

  /**
   * Speichert die Modellpräferenz
   */
  public setSelectedModelPreference(model: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (model === 'auto') {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_MODEL);
      } else {
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
      }
      this.inMemoryWorkingModel = null;
    } catch {
      // ignore
    }
  }

  /**
   * Liefert die verifizierte Modellliste ohne zusätzlichen Vorab-API-Roundtrip.
   */
  public async discoverAvailableModels(): Promise<string[]> {
    return CANDIDATE_FLASH_MODELS;
  }

  /**
   * Führt einen Live-End-to-End-Test der Verbindung durch (/api/gemini + ggf. BYOK-Key)
   */
  public async testConnection(apiKeyOverride?: string): Promise<GeminiTestResult> {
    const startTime = performance.now();

    const response = await this.executeWithCascade({
      key: apiKeyOverride?.trim() || undefined,
      prompt: 'Antworte nur mit dem Wort "Bereit".',
      systemInstruction: 'Du bist ein KI-Assistent für Schulen. Antworte extrem kurz.',
      temperature: 0.1,
      preferredModel: this.getSelectedModelPreference(),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      activeModel: response.modelUsed,
      latencyMs,
      modelsCount: CANDIDATE_FLASH_MODELS.length,
      message: `Verbindung erfolgreich! Modell "${response.modelUsed}" ist einsatzbereit (${latencyMs} ms).`,
    };
  }

  /**
   * Sendet eine Anfrage primär über den sicheren Vercel Serverless Proxy (/api/gemini).
   * Direktaufruf erfolgt nur noch als Fallback bei rein statischem Hosting (404),
   * falls die Lehrkraft explizit einen persönlichen BYOK-Key hinterlegt hat.
   */
  public async executeWithCascade(options: {
    key?: string;
    prompt: string;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: 'application/json' | 'text/plain';
    preferredModel?: string;
    availableModels?: string[];
  }): Promise<{ text: string; modelUsed: string }> {
    const customKey = options.key?.trim() || this.getApiKey();
    const preference = options.preferredModel || this.getSelectedModelPreference();
    const requestedModel =
      preference && preference !== 'auto'
        ? preference
        : this.inMemoryWorkingModel || 'auto';

    // 1. Primärer Pfad: Sicherer Serverless-Proxy (/api/gemini)
    try {
      const proxyResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: customKey || 'serverless-proxy',
          systemPrompt: options.systemInstruction || '',
          userPrompt: options.prompt,
          model: requestedModel,
          temperature: options.temperature ?? 0.3,
          responseMimeType: options.responseMimeType,
        }),
      });

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        if (data?.text) {
          const usedModel = data.model || CANDIDATE_FLASH_MODELS[0];
          this.inMemoryWorkingModel = usedModel;
          try {
            localStorage.setItem(STORAGE_KEYS.CACHED_MODEL, usedModel);
          } catch {
            // ignore
          }
          return { text: data.text, modelUsed: usedModel };
        }
      }

      if (proxyResponse.status !== 404) {
        const errJson = await proxyResponse.json().catch(() => ({}));
        throw new Error(errJson?.error || `HTTP ${proxyResponse.status} vom Gemini-Proxy`);
      }
    } catch (proxyErr: any) {
      if (proxyErr?.message && !proxyErr.message.includes('404')) {
        throw proxyErr;
      }
    }

    // 2. Fallback nur bei fehlendem Proxy (404) UND vorhandenem persönlichem Key
    if (!customKey) {
      throw new Error(
        'Der Gemini-Server-Proxy (/api/gemini) ist nicht erreichbar und es ist kein persönlicher API-Schlüssel hinterlegt.'
      );
    }

    const candidateModels: string[] = [];
    if (preference && preference !== 'auto') candidateModels.push(preference);
    if (this.inMemoryWorkingModel && !candidateModels.includes(this.inMemoryWorkingModel)) {
      candidateModels.push(this.inMemoryWorkingModel);
    }
    for (const model of options.availableModels || CANDIDATE_FLASH_MODELS) {
      if (!candidateModels.includes(model)) candidateModels.push(model);
    }

    let lastError: any = null;
    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(customKey)}`;
      try {
        const bodyPayload: any = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: options.systemInstruction
                    ? `${options.systemInstruction}\n\n${options.prompt}`
                    : options.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: 4096,
          },
        };

        if (options.responseMimeType === 'application/json') {
          bodyPayload.generationConfig.responseMimeType = 'application/json';
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            this.inMemoryWorkingModel = model;
            return { text, modelUsed: model };
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);
          if (res.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid'))) {
            throw new Error('Der Gemini API-Schlüssel ist ungültig. Bitte prüfen Sie den hinterlegten Schlüssel.');
          }
        }
      } catch (err: any) {
        lastError = err;
        if (err?.message && err.message.includes('ungültig')) {
          throw err;
        }
      }
    }

    throw lastError || new Error('Kein funktionierendes Gemini-Modell erreichbar.');
  }

  /**
   * Bereinigt Markdown-JSON-Blöcke (```json ... ```) zu validem JSON-String
   */
  public cleanJsonOutput(rawText: string): string {
    return rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
  }
}

export const geminiService = new GeminiService();
