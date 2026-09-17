import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  KeyRound, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  HelpCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Cpu, 
  Activity, 
  Layers, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { 
  geminiService, 
  DEFAULT_SCHOOL_GEMINI_KEY, 
  GeminiTestResult, 
  CANDIDATE_FLASH_MODELS 
} from '../../services/geminiService';

export interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (key: string) => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [availableModels, setAvailableModels] = useState<string[]>(CANDIDATE_FLASH_MODELS);
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<GeminiTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  const isUsingCustom = geminiService.isUsingCustomKey();

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(geminiService.getApiKey());
      setSelectedModel(geminiService.getSelectedModelPreference());
      setTestResult(null);
      setTestError(null);
      setIsSavedSuccess(false);

      // Asynchron verfügbare Modelle abfragen
      geminiService.discoverAvailableModels().then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models);
        }
      });
    }
  }, [isOpen]);

  // Schließen bei Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    geminiService.saveApiKey(apiKeyInput.trim());
    geminiService.setSelectedModelPreference(selectedModel);
    setIsSavedSuccess(true);
    if (onKeyUpdated) {
      onKeyUpdated(geminiService.getApiKey());
    }
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 2000);
  };

  const handleResetDefault = () => {
    geminiService.resetToSchoolKey();
    setApiKeyInput(DEFAULT_SCHOOL_GEMINI_KEY);
    setSelectedModel('auto');
    setTestResult(null);
    setTestError(null);
    setIsSavedSuccess(true);
    if (onKeyUpdated) {
      onKeyUpdated(DEFAULT_SCHOOL_GEMINI_KEY);
    }
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      // Temporär den eingegebenen Schlüssel testen
      const result = await geminiService.testConnection(apiKeyInput.trim());
      setTestResult(result);
      // Gleichzeitig verfügbare Modelle aktualisieren
      const discovered = await geminiService.discoverAvailableModels(apiKeyInput.trim());
      setAvailableModels(discovered);
    } catch (err: any) {
      setTestError(err?.message || 'Verbindung zu Google Gemini fehlgeschlagen.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0 shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md p-2 shadow-inner border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
                  Heimbürgeschule Kahla
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black tracking-wide">
                  Google Gemini KI
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                KI-Studio & Modell-Einstellungen
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
            title="Schließen"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-slate-700 text-xs">
          
          {/* Status Indicator Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    Status der KI-Anbindung:
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isUsingCustom 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isUsingCustom ? 'Persönlicher Key' : 'Schul-Schlüssel aktiv'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Bereit für Quiz-Generierung (Kahoot), Live-Abfragen (Menti) & Unterrichtsideen.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold shadow-2xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? (
                <span className="w-3 h-3 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-purple-600" />
              )}
              <span>{isTesting ? 'Prüfe...' : 'Jetzt testen'}</span>
            </button>
          </div>

          {/* Test Result / Error Card */}
          {testResult && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-emerald-900">
                  Verbindung erfolgreich verifiziert!
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                <div className="p-2 rounded-xl bg-white/70 border border-emerald-150 flex flex-col">
                  <span className="text-[10px] text-emerald-700 font-semibold">Aktives Modell</span>
                  <span className="text-xs font-black text-emerald-900 font-mono truncate">{testResult.activeModel}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/70 border border-emerald-150 flex flex-col">
                  <span className="text-[10px] text-emerald-700 font-semibold">Antwortzeit</span>
                  <span className="text-xs font-black text-emerald-900">{testResult.latencyMs} ms</span>
                </div>
                <div className="p-2 rounded-xl bg-white/70 border border-emerald-150 flex flex-col col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-700 font-semibold">Erkannte Modelle</span>
                  <span className="text-xs font-black text-emerald-900">{testResult.modelsCount} aktiv</span>
                </div>
              </div>
            </div>
          )}

          {testError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-xs">Verbindungsfehler</span>
                <span className="text-[11px] text-red-800 leading-normal">{testError}</span>
              </div>
            </div>
          )}

          {/* API Key Input Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Google Gemini API-Schlüssel</span>
              </label>

              {isUsingCustom && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Auf Schul-Key zurücksetzen</span>
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                  setTestError(null);
                }}
                placeholder="AQ... oder AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  title={showKey ? 'Schlüssel verbergen' : 'Schlüssel anzeigen'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Der Schlüssel wird ausschließlich lokal in Ihrem Browser gespeichert und für unterrichtliche KI-Anfragen verwendet. Standardmäßig ist der offizielle Heimbürgeschule-Schlüssel hinterlegt.
            </p>
          </div>

          {/* Model Selection Dropdown (Future-Proof Engine) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>KI-Modell & Zukunftssicherheit</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Automatische Kaskadierung
              </span>
            </div>

            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setTestResult(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              <option value="auto">
                ⚡ Automatisch (Empfohlen: Zukunftssichere Echtzeit-Erkennung & Fallback)
              </option>
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m === 'gemini-3.6-flash'
                    ? '✨ Gemini 3.6 Flash (Verifiziert, rasend schnell & stabil)'
                    : m === 'gemini-flash-latest'
                    ? '🚀 Gemini Flash Latest (Immer das aktuellste Google Flash-Modell)'
                    : m === 'gemini-3.7-flash'
                    ? '💎 Gemini 3.7 Flash'
                    : m === 'gemini-3.8-flash'
                    ? '🌟 Gemini 3.8 Flash'
                    : m === 'gemini-3.1-flash-lite'
                    ? '🍃 Gemini 3.1 Flash Lite (Ultra-leicht)'
                    : `Modell: ${m}`}
                </option>
              ))}
            </select>

            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-150 flex items-start gap-2.5 text-[11px] text-indigo-950">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Zukunftssichere Kaskadierung:</strong> Sollte Google ein Modell einstellen oder vorübergehend überlasten, wechselt das System automatisch und ohne Unterbrechung zum nächstbesten verfügbaren Modell (z. B. von 3.6 auf Flash-Latest). Veraltete Modelle (wie 1.5, 2.0 oder 2.5) werden automatisch gefiltert.
              </div>
            </div>
          </div>

          {/* Privacy & Didactics Callout */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Datenschutz & Schulpraxis:</strong> Es werden keine Klarnamen von Schülerinnen oder Schülern an die KI übertragen. Generiert werden ausschließlich fachdidaktische Aufgaben, Multiple-Choice-Optionen und Themenzusammenfassungen auf Basis der Lehrpläne.
            </div>
          </div>

          {/* Step-by-Step Instructions Toggle */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs text-purple-700 font-bold flex items-center justify-between hover:underline py-1"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Wie erstelle ich einen eigenen kostenlosen Google AI Studio Key?</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {showInstructions ? 'Ausblenden' : 'Anleitung anzeigen'}
              </span>
            </button>

            {showInstructions && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 text-[11px] leading-relaxed text-slate-700 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    Öffnen Sie das offizielle Google AI Studio:{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-purple-700 font-bold underline inline-flex items-center gap-0.5"
                    >
                      aistudio.google.com/app/apikey
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    Melden Sie sich mit Ihrem Google-Konto an und klicken Sie auf <strong>„Create API Key“</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    Kopieren Sie den Schlüssel und fügen Sie ihn hier ein. Klicken Sie anschließend auf <strong>„Speichern & Übernehmen“</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs transition-all active:scale-95"
          >
            Schließen
          </button>

          <div className="flex items-center gap-2">
            {isSavedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Gespeichert!
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Speichern & Übernehmen</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
