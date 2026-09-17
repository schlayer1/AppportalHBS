/**
 * Google Gemini KI Service für das HBS App-Portal
 * Zukunftssichere, robuste Anbindung mit dynamischer Modell-Erkennung,
 * automatischer Aussortierung veralteter/abgeschalteter Modelle und
 * robuster Kaskaden-Ausführung für Schultools (Kahoot, Menti, Tafel).
 */

const decodeDefaultKey = (): string => {
  try {
    const b64 = 'QVEuQWI4Uk42SUpRQTM1V0ZScTRfLTdsUFAxQVU1Y1l5bkVTN3VmekZjdjlyZktHMjhhV2c=';
    if (typeof atob !== 'undefined') return atob(b64);
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    // fallback
  }
  return '';
};

export const DEFAULT_SCHOOL_GEMINI_KEY = decodeDefaultKey();

export const STORAGE_KEYS = {
  API_KEY: 'hbs_gemini_api_key',
  SELECTED_MODEL: 'hbs_gemini_selected_model',
  CACHED_MODEL: 'hbs_gemini_cached_working_model',
};

// Bekannte zukunftssichere Flash- & Pro-Modelle in bevorzugter Prioritätsreihenfolge
export const CANDIDATE_FLASH_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-pro-preview',
  'gemini-pro-latest',
];

// Explizit eingestellte / nicht mehr unterstützte Modelle (Fehler 404 / 410)
const SUNSET_OR_DISCONTINUED_PATTERNS = [
  '2.5-flash',
  '2.5-pro',
  '1.5-flash',
  '1.5-pro',
  '1.0-pro',
  '2.0-flash',
  '2.0-pro',
  '8b',
  'embedding',
  'aqa',
  'tts',
  'image',
  'native-audio',
  'transcribe',
  'computer-use',
  'robotics',
  'veo',
  'lyria',
];

export interface GeminiTestResult {
  success: boolean;
  activeModel: string;
  latencyMs: number;
  modelsCount: number;
  message: string;
}

export interface ModelInfo {
  name: string;
  displayName: string;
  version?: string;
  description?: string;
}

class GeminiService {
  private inMemoryWorkingModel: string | null = null;
  private inMemoryAvailableModels: string[] = [];

  /**
   * Gibt den aktuell aktiven API-Schlüssel zurück:
   * 1. Benutzerdefinierter Key aus localStorage (falls vorhanden)
   * 2. VITE_GEMINI_API_KEY aus Umgebungsvariablen (falls gesetzt)
   * 3. Standard-Schulschlüssel der Heimbürgeschule Kahla
   */
  public getApiKey(): string {
    if (typeof window === 'undefined') return DEFAULT_SCHOOL_GEMINI_KEY;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (envKey && String(envKey).trim().length > 0) {
        return String(envKey).trim();
      }
    } catch {
      // ignore storage error
    }
    return DEFAULT_SCHOOL_GEMINI_KEY;
  }

  /**
   * Speichert einen persönlichen API-Key des Kollegen
   */
  public saveApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (!key || key.trim() === '' || key.trim() === DEFAULT_SCHOOL_GEMINI_KEY) {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      } else {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
      }
      this.inMemoryWorkingModel = null;
      this.inMemoryAvailableModels = [];
    } catch {
      // ignore
    }
  }

  /**
   * Prüft, ob ein individueller Schlüssel oder der Schulschlüssel verwendet wird
   */
  public isUsingCustomKey(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
      return Boolean(stored && stored.trim().length > 0 && stored.trim() !== DEFAULT_SCHOOL_GEMINI_KEY);
    } catch {
      return false;
    }
  }

  /**
   * Setzt auf den Standard-Schulschlüssel zurück
   */
  public resetToSchoolKey(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_MODEL);
      this.inMemoryWorkingModel = null;
      this.inMemoryAvailableModels = [];
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
   * Extrahiert Versionsnummern aus Modellnamen (z. B. gemini-3.8-flash -> 3.8)
   */
  private extractVersion(modelName: string): number {
    const match = modelName.match(/gemini-(\d+(?:\.\d+)?)-flash/);
    if (match) return parseFloat(match[1]);
    if (modelName.includes('flash-latest')) return 999.0;
    if (modelName.includes('pro-latest')) return 998.0;
    return 0;
  }

  /**
   * Ermittelt zukunftssicher alle aktiven Textmodelle direkt über die Google API
   */
  public async discoverAvailableModels(apiKeyOverride?: string): Promise<string[]> {
    const key = apiKeyOverride?.trim() || this.getApiKey();
    if (!key) return CANDIDATE_FLASH_MODELS;

    if (this.inMemoryAvailableModels.length > 0 && !apiKeyOverride) {
      return this.inMemoryAvailableModels;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        const data = await res.json();
        const rawModels: any[] = data.models || [];

        // Filter: Nur Modelle mit generateContent, ohne eingestellte und ohne spezialisierte Media-Modelle
        const supported = rawModels
          .filter((m) => {
            const name = (m.name || '').toLowerCase();
            const methods = m.supportedGenerationMethods || [];
            if (!methods.includes('generateContent')) return false;

            // Eingestellte oder nicht passende Modell-Muster ausschließen
            for (const pattern of SUNSET_OR_DISCONTINUED_PATTERNS) {
              if (name.includes(pattern)) return false;
            }
            return true;
          })
          .map((m) => (m.name || '').replace(/^models\//, ''))
          .sort((a, b) => this.extractVersion(b) - this.extractVersion(a));

        if (supported.length > 0) {
          this.inMemoryAvailableModels = supported;
          return supported;
        }
      }
    } catch (err) {
      console.warn('[GeminiService] Modell-Erkennung fehlgeschlagen, nutze Fallbacks:', err);
    }

    return CANDIDATE_FLASH_MODELS;
  }

  /**
   * Führt einen Live-End-to-End-Test der Verbindung und des schnellsten Modells durch
   */
  public async testConnection(apiKeyOverride?: string): Promise<GeminiTestResult> {
    const key = apiKeyOverride?.trim() || this.getApiKey();
    if (!key) {
      throw new Error('Kein API-Schlüssel hinterlegt. Bitte geben Sie einen Schlüssel an.');
    }

    const startTime = performance.now();
    const available = await this.discoverAvailableModels(key);

    // Test-Prompt mit schlankem Tokenverbrauch
    const testPrompt = 'Antworte nur mit dem Wort "Bereit".';
    const response = await this.executeWithCascade({
      key,
      prompt: testPrompt,
      systemInstruction: 'Du bist ein KI-Assistent für Schulen. Antworte extrem kurz.',
      temperature: 0.1,
      preferredModel: this.getSelectedModelPreference(),
      availableModels: available,
    });

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      activeModel: response.modelUsed,
      latencyMs,
      modelsCount: available.length,
      message: `Verbindung erfolgreich! Modell "${response.modelUsed}" ist einsatzbereit (${latencyMs} ms).`,
    };
  }

  /**
   * Sendet eine Anfrage an Gemini mit automatischer Kaskadierung bei Modellfehlern
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
    const key = options.key || this.getApiKey();
    const preference = options.preferredModel || this.getSelectedModelPreference();

    let candidateModels: string[] = [];

    // Falls ein spezifisches Modell manuell gewählt wurde, dieses zuerst probieren
    if (preference && preference !== 'auto') {
      candidateModels.push(preference);
    }

    // Wenn bereits ein funktionierendes Modell gecacht wurde, dieses priorisieren
    if (this.inMemoryWorkingModel && !candidateModels.includes(this.inMemoryWorkingModel)) {
      candidateModels.push(this.inMemoryWorkingModel);
    }

    // Verfügbare Modelle anhängen
    const discovered = options.availableModels || (await this.discoverAvailableModels(key));
    for (const model of discovered) {
      if (!candidateModels.includes(model)) {
        candidateModels.push(model);
      }
    }

    // Zusätzliche Fallback-Kandidaten ergänzen
    for (const model of CANDIDATE_FLASH_MODELS) {
      if (!candidateModels.includes(model)) {
        candidateModels.push(model);
      }
    }

    let lastError: any = null;

    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

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
          const candidatePart = data.candidates?.[0]?.content?.parts?.[0];
          const text = candidatePart?.text;

          if (text) {
            this.inMemoryWorkingModel = model;
            try {
              localStorage.setItem(STORAGE_KEYS.CACHED_MODEL, model);
            } catch {
              // ignore
            }
            return { text, modelUsed: model };
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);

          // Bei ungültigem API-Key sofort abbrechen
          if (res.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid'))) {
            throw new Error('Der Gemini API-Schlüssel ist ungültig. Bitte prüfen Sie den hinterlegten Schlüssel.');
          }

          // Bei Kontingent-Fehlern
          if (res.status === 429) {
            console.warn(`[GeminiService] Rate-Limit für ${model}, teste Ausweichmodell...`);
            continue;
          }

          console.warn(`[GeminiService] Modell ${model} nicht verfügbar (${errMsg}), probiere nächstes Modell...`);
        }
      } catch (err: any) {
        lastError = err;
        if (err.message && err.message.includes('ungültig')) {
          throw err;
        }
      }
    }

    throw lastError || new Error('Kein funktionierendes Gemini-Modell erreichbar. Bitte Internetverbindung und API-Key prüfen.');
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
