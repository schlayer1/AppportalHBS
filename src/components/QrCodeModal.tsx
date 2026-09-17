import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Maximize2, Minimize2, Printer, Sparkles } from 'lucide-react';
import { SchoolApp } from '../config/apps';

interface QrCodeModalProps {
  app: SchoolApp | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ app, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isBeamerMode, setIsBeamerMode] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!app) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [app, onClose]);

  if (!app) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      {/* Modal Container: Max 85dvh, Flex-Col */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl shadow-black/40 border border-hbs-slate-border/80 w-full transition-all duration-300 relative flex flex-col max-h-[85dvh] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] cursor-default ${
          isBeamerMode 
            ? 'max-w-3xl p-6 sm:p-8' 
            : 'max-w-lg p-6 sm:p-8'
        }`}
      >
        {/* Fixed Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 shrink-0">
          <div>
            {app.isFeaturedStudentQr && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-amber-light text-hbs-amber-dark text-xs font-bold mb-1.5 border border-hbs-amber/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>QR-Code für Schülerinnen und Schüler</span>
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight">
              {app.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-hbs-slate-muted mt-0.5">
              {app.subtitle}
            </p>
          </div>

          {/* Close Button with 44px touch size */}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 py-4 flex flex-col items-center justify-center">
          <div className={`p-5 sm:p-6 bg-white rounded-3xl border-2 border-hbs-blue/20 shadow-md flex items-center justify-center transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ${
            isBeamerMode ? 'scale-105 sm:scale-120 my-4 sm:my-6' : 'my-2'
          }`}>
            <QRCodeSVG
              value={app.url}
              size={isBeamerMode ? 260 : 190}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/Siegel_bunt.png",
                x: undefined,
                y: undefined,
                height: isBeamerMode ? 44 : 34,
                width: isBeamerMode ? 44 : 34,
                excavate: true,
              }}
            />
          </div>

          <p className="text-xs sm:text-sm font-bold text-hbs-blue-deep mt-3 text-center max-w-sm px-2">
            📱 Mit der Kamera von iPad oder Smartphone scannen, um die App direkt im Unterricht zu öffnen.
          </p>
        </div>

        {/* Fixed Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          
          {/* Quick URL preview & copy */}
          <div className="flex items-center gap-2 bg-hbs-bg p-1.5 rounded-xl border border-hbs-slate-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
            <span className="text-xs text-hbs-slate-muted font-mono truncate px-2.5 flex-1 select-all">
              {app.url}
            </span>
            <button
              onClick={handleCopyLink}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] shrink-0 select-none ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-hbs-slate-dark hover:bg-hbs-blue-soft hover:text-hbs-blue border border-slate-200 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>

          {/* Bottom Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsBeamerMode(!isBeamerMode)}
              className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-hbs-blue hover:text-hbs-blue-deep bg-hbs-blue-soft px-3.5 py-2 rounded-xl border border-hbs-blue/20 active:scale-[0.98] transition-all duration-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] select-none"
            >
              {isBeamerMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isBeamerMode ? 'Normalansicht' : 'Beamer-Modus'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 border border-slate-200 text-xs font-semibold active:scale-[0.98] transition-all duration-150 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]"
                title="Drucken / PDF speichern"
                aria-label="Drucken"
              >
                <Printer className="w-4 h-4" />
              </button>

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-hbs-blue text-white text-xs sm:text-sm font-bold hover:bg-hbs-blue-deep active:scale-[0.98] transition-all duration-150 shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] select-none"
              >
                <span>App öffnen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
