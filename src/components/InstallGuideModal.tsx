import React, { useState } from 'react';
import { X, Tablet, Smartphone, Laptop, Share2, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-hbs-modal border border-hbs-slate-border/80 w-full max-w-xl p-6 sm:p-8 relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-hbs-blue px-3 py-1 bg-hbs-blue-soft rounded-full border border-hbs-blue/15">
            Praxis-Tipp für Kolleginnen & Kollegen
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight mt-2.5">
            Als App auf dem Startbildschirm ablegen
          </h2>
          <p className="text-xs sm:text-sm font-medium text-hbs-slate-muted mt-1">
            Nutzen Sie das Portal und alle Schulapps ohne lästige Browser-Adresszeile wie eine echte App.
          </p>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex items-center justify-center bg-hbs-blue-soft/70 p-1.5 rounded-2xl gap-1 mb-6 border border-hbs-blue/15">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-white text-hbs-blue-deep shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Tablet className="w-4 h-4 text-hbs-blue" />
            <span>Apple iPad & iPhone</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-white text-hbs-blue-deep shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Smartphone className="w-4 h-4 text-hbs-teal" />
            <span>Android Geräte</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'desktop'
                ? 'bg-white text-hbs-blue-deep shadow-xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Laptop className="w-4 h-4 text-hbs-slate-muted" />
            <span>Laptop / PC</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark">In Safari öffnen</h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    Öffnen Sie das Schul-Portal oder die gewünschte App im <strong>Safari-Browser</strong> auf Ihrem iPad oder iPhone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                    <span>Auf das Teilen-Symbol tippen</span>
                    <Share2 className="w-4 h-4 text-hbs-blue" />
                  </h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    Tippen Sie oben rechts (am iPad) bzw. unten in der Mitte (am iPhone) auf das Viereck mit dem nach oben zeigenden Pfeil.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark flex items-center gap-1.5">
                    <span>„Zum Home-Bildschirm“ wählen</span>
                    <PlusSquare className="w-4 h-4 text-hbs-blue" />
                  </h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    Wischen Sie im Menü nach unten und wählen Sie den Eintrag <strong>„Zum Home-Bildschirm“</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-blue-light text-hbs-blue-deep font-black text-sm flex items-center justify-center shrink-0">
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
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark">In Google Chrome öffnen</h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    Rufen Sie die gewünschte Schul-App in Google Chrome auf.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0">
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

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-hbs-teal-light text-hbs-teal-deep font-black text-sm flex items-center justify-center shrink-0">
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
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-hbs-slate-dark font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark">Adresszeile im Browser prüfen</h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    In Chrome, Edge oder Brave erscheint ganz rechts in der URL-Leiste ein kleines Computer-/Installations-Symbol.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/50">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-hbs-slate-dark font-black text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-hbs-slate-dark">Auf „Installieren“ klicken</h4>
                  <p className="text-xs text-hbs-slate-muted mt-0.5">
                    Die App wird direkt auf Ihrem Windows- oder Mac-Schreibtisch angelegt und öffnet in einem sauberen eigenen Programmfenster.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-hbs-blue text-white font-bold text-xs sm:text-sm hover:bg-hbs-blue-deep transition-colors"
          >
            Verstanden
          </button>
        </div>

      </div>
    </div>
  );
};
