import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Copy, 
  Check, 
  Sparkles, 
  Languages, 
  RotateCcw, 
  Presentation,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  startDictationSession, 
  ActiveDictationSession, 
  isSpeechRecognitionSupported 
} from '../../services/speechDictationService';

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onApplyText?: (text: string) => void;
  applyButtonLabel?: string;
  onSendToBoard?: (noteText: string) => void;
}

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  onApplyText,
  applyButtonLabel = 'Text übernehmen',
  onSendToBoard
}) => {
  const [transcript, setTranscript] = useState<string>(initialText);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'de-DE' | 'en-US' | 'fr-FR' | 'es-ES'>('de-DE');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeSessionRef = useRef<ActiveDictationSession | null>(null);
  const timerRef = useRef<any>(null);

  const stopRecording = useCallback(async () => {
    if (!activeSessionRef.current && !isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      if (activeSessionRef.current) {
        const finalResult = await activeSessionRef.current.stop();
        if (finalResult && finalResult.trim().length > 0) {
          setTranscript(finalResult.trim());
        }
        activeSessionRef.current = null;
      }
    } catch (err) {
      console.warn('Fehler beim Beenden der Aufnahme:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    if (!isSpeechRecognitionSupported()) {
      setErrorMsg('Mikrofonzugriff oder Spracherkennung wird von diesem Browser leider nicht unterstützt.');
      return;
    }

    try {
      setIsRecording(true);
      setRecordingSeconds(0);

      const session = await startDictationSession({
        language: selectedLanguage,
        onInterimText: (interim) => {
          setTranscript(interim);
        },
        onFinalText: (final) => {
          setTranscript(final);
        },
        onError: (err) => {
          setErrorMsg(err);
        }
      });

      activeSessionRef.current = session;
    } catch (err: any) {
      console.error('Fehler beim Starten der Aufnahme:', err);
      setErrorMsg('Mikrofon konnte nicht aktiviert werden. Bitte Berechtigung im Browser erteilen.');
      setIsRecording(false);
    }
  }, [selectedLanguage]);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  // Synchronisiere initialen Text wenn Modal öffnet
  useEffect(() => {
    if (isOpen) {
      setTranscript(initialText);
      setErrorMsg(null);
      setRecordingSeconds(0);
    } else {
      if (activeSessionRef.current || isRecording) {
        stopRecording();
      }
    }
  }, [isOpen, initialText, stopRecording, isRecording]);

  // Timer für Aufnahme-Dauer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Tastenkombination ESC zum Schließen
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopRecording();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stopRecording]);

  // Unmount Cleanup
  useEffect(() => {
    return () => {
      if (activeSessionRef.current) {
        activeSessionRef.current.stop().catch(() => {});
        activeSessionRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col cursor-default animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  HBS Sprachdiktat & Whisper KI
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  0 € Free Tier
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sprechen statt tippen für Tafelnotizen, Arbeitsblätter & Quizfragen
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Sprachauswahl & Timer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                disabled={isRecording}
                className="bg-transparent border-none text-xs font-bold focus:outline-none pr-2 cursor-pointer disabled:opacity-50"
              >
                <option value="de-DE">🇩🇪 Deutsch</option>
                <option value="en-US">🇬🇧 Englisch</option>
                <option value="fr-FR">🇫🇷 Französisch</option>
                <option value="es-ES">🇪🇸 Spanisch</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>{formatTimer(recordingSeconds)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Zentraler Pulsierender Mikrofon-Button */}
          <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={handleToggleRecord}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 relative ${
                isRecording 
                  ? 'bg-rose-600 text-white shadow-rose-400/50 scale-105' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-400/40'
              }`}
            >
              {/* Animierte Schallwellen-Ringe bei aktiver Aufnahme */}
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-35" />
                  <span className="absolute -inset-2 rounded-full border-2 border-rose-400/60 animate-pulse" />
                </>
              )}

              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isRecording ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <span className="text-xs font-bold text-slate-700 mt-3 block">
              {isProcessing ? (
                <span className="text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  KI verarbeitet Audio mit Whisper...
                </span>
              ) : isRecording ? (
                <span className="text-rose-600 font-bold">
                  Aufnahme läuft... Klicken zum Beenden
                </span>
              ) : (
                'Klicken zum Sprechen'
              )}
            </span>
          </div>

          {/* Fehleranzeige */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Diktat-Textfeld */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Erkannter Text:
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {transcript.trim() ? transcript.trim().split(/\s+/).length : 0} Wörter • {transcript.length} Zeichen
              </span>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Hier erscheint Ihr gesprochener Text Wort für Wort..."
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 text-xs font-bold transition-all flex items-center gap-1"
                title="Text leeren"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Leeren</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopieren</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSendToBoard && (
              <button
                type="button"
                disabled={!transcript.trim()}
                onClick={() => {
                  onSendToBoard(transcript.trim());
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Auf Tafel werfen</span>
              </button>
            )}

            {onApplyText && (
              <button
                type="button"
                disabled={!transcript.trim()}
                onClick={() => {
                  onApplyText(transcript.trim());
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{applyButtonLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
