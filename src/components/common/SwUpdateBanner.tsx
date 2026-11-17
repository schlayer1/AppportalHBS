import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export const SW_UPDATE_EVENT = 'hbs-sw-update-available';

export const SwUpdateBanner: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdateAvailable = (e: Event) => {
      const customEvent = e as CustomEvent<{ worker?: ServiceWorker }>;
      if (customEvent.detail?.worker) {
        setWaitingWorker(customEvent.detail.worker);
        setIsDismissed(false);
      }
    };

    window.addEventListener(SW_UPDATE_EVENT, handleUpdateAvailable);

    // Check if a waiting worker already exists on mount
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          setWaitingWorker(reg.waiting);
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener(SW_UPDATE_EVENT, handleUpdateAvailable);
    };
  }, []);

  if (!waitingWorker || isDismissed) return null;

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <div
      role="region"
      aria-label="Portal-Aktualisierung"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-24 right-4 left-4 sm:left-auto sm:max-w-sm z-50 no-print"
    >
      <div className="bg-hbs-slate-dark text-white rounded-2xl p-3.5 shadow-2xl border border-white/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-hbs-teal/20 border border-hbs-teal/40 text-hbs-teal flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate">
              Neue Portal-Version verfügbar
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              Updates & Korrekturen jetzt laden
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl bg-hbs-teal hover:bg-hbs-teal-deep text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Lädt…' : 'Aktualisieren'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Hinweis später anzeigen"
            title="Später"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
