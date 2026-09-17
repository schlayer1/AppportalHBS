import React, { useState, useEffect } from 'react';
import { X, Tablet, Smartphone, Laptop, Share2, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      {/* Modal Container: Max 85dvh, Flex-Col */}
      <div 
        className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-hbs-slate-border/80 w-full max-w-xl p-6 sm:p-8 relative flex flex-col max-h-[85dvh] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Fixed Header */}
        <div className="pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue px-3 py-1 bg-hbs-blue-soft rounded-full border border-hbs-blue/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
              Praxis-Tipp für Kolleginnen & Kollegen
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight mt-2">
              Als App auf dem Startbildschirm ablegen
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-hbs-slate-muted mt-0.5">
              Portal und Schul-Apps ohne störende Browser-Leiste nutzen.
            </p>
          </div>

          {/* Close Button with 44px min touch size */}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 py-5 pr-1 space-y-5">
          
          {/* Device Switcher Tabs with 44px min touch target */}
          <div className="flex items-center justify-center bg-hbs-blue-soft/70 p-1.5 rounded-2xl gap-1 border border-hbs-blue/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] select-none ${
                activeTab === 'ios'
                  ? 'bg-white text-hbs-blue-deep shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <Tablet className="w-4 h-4 text-hbs-blue" />
              <span>Apple iPad & iPhone</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] select-none ${
                activeTab === 'android'
                  ? 'bg-white text-hbs-blue-deep shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <Smartphone className="w-4 h-4 text-hbs-teal" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] select-none ${
                activeTab === 'desktop'
                  ? 'bg-white text-hbs-blue-deep shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <Laptop className="w-4 h-4 text-hbs-slate-muted" />
              <span>PC / Laptop</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-3.5">
            {activeTab === 'ios' && (
              <>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark">In Safari öffnen</h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Öffnen Sie das Schul-Portal oder die gewünschte App im <strong>Safari-Browser</strong> auf Ihrem iPad oder iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                      <span>Auf das Teilen-Symbol tippen</span>
                      <Share2 className="w-4 h-4 text-hbs-blue" />
                    </h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Tippen Sie oben rechts (am iPad) bzw. unten in der Mitte (am iPhone) auf das Viereck mit dem Pfeil nach oben.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                      <span>„Zum Home-Bildschirm“ wählen</span>
                      <PlusSquare className="w-4 h-4 text-hbs-blue" />
                    </h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Wischen Sie im Teilen-Menü nach unten und wählen Sie <strong>„Zum Home-Bildschirm“</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                      <span>Hinzufügen bestätigen</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Klicken Sie oben rechts auf <strong>„Hinzufügen“</strong>. Das HBS-Icon liegt nun direkt auf Ihrem Bildschirm und öffnet im Vollbildmodus.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'android' && (
              <>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark">In Google Chrome öffnen</h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Rufen Sie die gewünschte Schul-App in Google Chrome auf Ihrem Android-Tablet oder Smartphone auf.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                      <span>Menü öffnen</span>
                      <MoreVertical className="w-4 h-4 text-hbs-teal" />
                    </h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Tippen Sie oben rechts auf die drei vertikalen Punkte (⋮).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                      <span>„App installieren“ auswählen</span>
                      <Download className="w-4 h-4 text-hbs-teal" />
                    </h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Wählen Sie <strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong>.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'desktop' && (
              <>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-hbs-slate-dark font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark">Adresszeile im Browser prüfen</h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      In Chrome, Edge oder Brave erscheint ganz rechts in der URL-Leiste ein kleines Installations-Symbol.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-hbs-slate-dark font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-hbs-slate-dark">Auf „Installieren“ klicken</h4>
                    <p className="text-xs text-hbs-slate-muted mt-0.5">
                      Die App wird direkt auf Ihrem Schreibtisch abgelegt und öffnet in einem sauberen eigenen Programmfenster.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Fixed Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-hbs-blue text-white font-bold text-xs sm:text-sm hover:bg-hbs-blue-deep active:scale-[0.98] transition-all duration-150 shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] select-none"
          >
            Verstanden
          </button>
        </div>

      </div>
    </div>
  );
};
