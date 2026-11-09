import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Lock, 
  Unlock, 
  ExternalLink, 
  CheckCircle2, 
  QrCode,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MentiPresentation, MentiSurveySettings, MentiLiveSession } from '../../types/mentiTypes';
import { syncMentiLiveSession } from '../../services/firebase';

interface MentiShareSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: MentiPresentation;
  onSavePresentation: (updated: MentiPresentation) => Promise<MentiPresentation>;
}

export const MentiShareSurveyModal: React.FC<MentiShareSurveyModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onSavePresentation
}) => {
  const existingSettings = presentation.surveySettings;

  // Generate 6-digit survey PIN if none exists
  const [surveyCode] = useState<string>(() => {
    if (existingSettings?.surveyCode) return existingSettings.surveyCode;
    return Math.floor(100000 + Math.random() * 900000).toString();
  });

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return existingSettings ? existingSettings.isEnabled : true;
  });

  const [durationDays, setDurationDays] = useState<number | null>(() => {
    if (existingSettings?.durationDays !== undefined) return existingSettings.durationDays;
    return 7; // Default: 7 days like real Mentimeter
  });

  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    if (existingSettings?.expiresAt !== undefined) return existingSettings.expiresAt;
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  });

  const [allowViewResults, setAllowViewResults] = useState<boolean>(() => {
    return existingSettings?.allowViewResultsAfterVote || false;
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showQrExpanded, setShowQrExpanded] = useState<boolean>(false);

  // Recalculate expiresAt when durationDays changes
  const handleDurationChange = (days: number | null) => {
    setDurationDays(days);
    if (days === null) {
      setExpiresAt(null);
    } else {
      setExpiresAt(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  };

  const handleExtendDuration = (additionalDays: number = 7) => {
    const base = expiresAt && expiresAt > Date.now() ? expiresAt : Date.now();
    const newExpires = base + additionalDays * 24 * 60 * 60 * 1000;
    setExpiresAt(newExpires);
    setIsEnabled(true);
  };

  // Direct share link for colleagues
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?menti=${surveyCode}`
    : `https://portal.schule.de/?menti=${surveyCode}`;

  const isExpired = Boolean(expiresAt && Date.now() > expiresAt);
  const isCurrentlyActive = isEnabled && !isExpired;

  // Format expiration date string
  const formatExpirationString = (timestamp: number | null) => {
    if (!timestamp) return 'Dauerhaft aktiv (ohne automatisches Ablaufdatum)';
    const date = new Date(timestamp);
    const diffMs = timestamp - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diffMs <= 0) return `Abgelaufen am ${formattedDate}`;
    if (diffDays === 1) return `Läuft morgen um ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr ab`;
    return `Gültig bis ${formattedDate} (noch ca. ${diffDays} Tage)`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Save changes to Presentation & sync to Cloud Firestore
  const handleSaveAndApply = async () => {
    setIsSaving(true);
    try {
      const updatedSettings: MentiSurveySettings = {
        isEnabled,
        surveyCode,
        expiresAt,
        durationDays,
        allowViewResultsAfterVote: allowViewResults,
        createdAt: existingSettings?.createdAt || Date.now(),
        closedAt: isEnabled ? null : Date.now()
      };

      const updatedPresentation: MentiPresentation = {
        ...presentation,
        surveySettings: updatedSettings,
        updatedAt: Date.now()
      };

      // 1. Sync directly to Firestore session doc so it is immediately reachable via URL
      const sessionDoc: MentiLiveSession = {
        presentationId: presentation.id,
        presentationTitle: presentation.title,
        sessionCode: surveyCode,
        currentSlideIndex: 0,
        isVotingOpen: isEnabled && !isExpired,
        showResults: true,
        activeSlide: presentation.slides[0],
        totalSlides: presentation.slides.length,
        participantsCount: presentation.responsesCount || 0,
        responses: presentation.archivedResponses || {},
        updatedAt: Date.now(),
        // Async survey specifics:
        isSurveyMode: true,
        slides: presentation.slides,
        expiresAt,
        isClosed: !isEnabled,
        allowViewResults,
        authorName: presentation.authorName,
        authorId: presentation.authorId
      };

      await syncMentiLiveSession(sessionDoc);

      // 2. Persist in presentation state / Portal Data
      await onSavePresentation(updatedPresentation);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving survey settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-teal-100 text-[10px] font-black uppercase tracking-wider">
                  Asynchrone Umfrage
                </span>
                {isCurrentlyActive ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-emerald-950 text-[10px] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse" />
                    Aktiv & Gültig
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-rose-400 text-rose-950 text-[10px] font-black flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    {isExpired ? 'Gültigkeit abgelaufen' : 'Pausiert / Geschlossen'}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5 line-clamp-1">
                {presentation.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left text-slate-800">
          
          {/* Explanation Box */}
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-100 text-teal-900 text-xs leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-950">Wie beim echten Mentimeter:</p>
              <p className="text-teal-800 mt-0.5">
                Verschicke den Link per Mail oder Schulchat an Kollegen. Die Umfrage funktioniert 
                <strong> auch dann, wenn du ausgeloggt bist</strong>. Kollegen blättern selbstständig durch alle Folien, 
                und du siehst die Ergebnisse jederzeit gesammelt im Dashboard!
              </p>
            </div>
          </div>

          {/* Master Activation Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                {isEnabled ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                <span>Umfrage für Kollegen freigeben</span>
              </label>
              <p className="text-xs text-slate-500">
                {isEnabled 
                  ? 'Kollegen können über den Link jederzeit anonym teilnehmen.'
                  : 'Umfrage ist pausiert. Niemand kann neue Antworten einreichen.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Share Link & QR Box */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Direkter Teilnahme-Link (Audience Pace):
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-mono text-slate-700 select-all overflow-x-auto">
                <span className="truncate">{shareUrl}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrExpanded(!showQrExpanded)}
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                title="QR-Code anzeigen"
              >
                <QrCode className="w-4 h-4 text-teal-600" />
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                title="Im neuen Tab testen"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </a>
            </div>

            {/* QR Code Expansion Panel */}
            {showQrExpanded && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
                  <QRCodeSVG value={shareUrl} size={160} level="M" />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">PIN: {surveyCode}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Zum Abscannen vom Smartphone oder Einbinden in Infomaterial</p>
                </div>
              </div>
            )}
          </div>

          {/* Validity / Expiration Duration Picker */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Gültigkeitsdauer der Umfrage</span>
              </label>

              {expiresAt && (
                <button
                  type="button"
                  onClick={() => handleExtendDuration(7)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>+7 Tage verlängern</span>
                </button>
              )}
            </div>

            {/* Presets (Mentimeter-style: 2, 7, 14, 30 days, unlimited) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: '2 Tage', days: 2, sub: 'Schnellumfrage' },
                { label: '7 Tage', days: 7, sub: 'Standard Menti' },
                { label: '14 Tage', days: 14, sub: '2 Wochen' },
                { label: '30 Tage', days: 30, sub: '1 Monat' },
                { label: 'Dauerhaft', days: null, sub: 'Kein Ablauf' }
              ].map(preset => {
                const isSelected = durationDays === preset.days;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleDurationChange(preset.days)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 font-black'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-xs">{preset.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{preset.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Current Expiration Status Box */}
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Calendar className="w-4 h-4 shrink-0 text-slate-500" />
              <span>{formatExpirationString(expiresAt)}</span>
            </div>
          </div>

          {/* Option: Allow viewing results after participation */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>Ergebnisse nach Teilnahme für Kollegen anzeigen</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Teilnehmer sehen nach ihrer Stimmabgabe den aktuellen Zwischenstand (anonyme Diagramme).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAllowViewResults(!allowViewResults)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                allowViewResults ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  allowViewResults ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            Abbrechen
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Wird synchronisiert...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Gespeichert & Aktiv!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Freigabe speichern</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
