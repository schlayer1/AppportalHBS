import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div 
        className={`bg-white rounded-3xl shadow-hbs-modal border border-hbs-slate-border/80 w-full transition-all duration-300 relative flex flex-col ${
          isBeamerMode 
            ? 'max-w-3xl p-8 sm:p-10' 
            : 'max-w-lg p-6 sm:p-8'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          {app.isFeaturedStudentQr && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hbs-amber-light text-hbs-amber-dark text-xs font-bold mb-2.5 border border-hbs-amber/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>QR-Code für Schülerinnen und Schüler</span>
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight">
            {app.title}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-hbs-slate-muted mt-1">
            {app.subtitle}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className={`p-5 sm:p-6 bg-white rounded-3xl border-2 border-hbs-blue/20 shadow-md flex items-center justify-center transition-all ${
            isBeamerMode ? 'scale-110 sm:scale-125 my-6 sm:my-8' : ''
          }`}>
            <QRCodeSVG
              value={app.url}
              size={isBeamerMode ? 280 : 200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/Siegel_bunt.png",
                x: undefined,
                y: undefined,
                height: isBeamerMode ? 48 : 36,
                width: isBeamerMode ? 48 : 36,
                excavate: true,
              }}
            />
          </div>

          <p className="text-xs font-semibold text-hbs-blue-deep mt-4 text-center">
            📱 Mit der Kamera von iPad oder Smartphone scannen, um die App direkt zu öffnen.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
          
          {/* Quick URL preview & copy */}
          <div className="flex items-center gap-2 bg-hbs-bg p-2 rounded-xl border border-hbs-slate-border/60">
            <span className="text-xs text-hbs-slate-muted font-mono truncate px-2 flex-1">
              {app.url}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-hbs-slate-dark hover:bg-hbs-blue-soft hover:text-hbs-blue border border-slate-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>

          {/* Bottom buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsBeamerMode(!isBeamerMode)}
              className="flex items-center gap-1.5 text-xs font-bold text-hbs-blue hover:text-hbs-blue-deep bg-hbs-blue-soft px-3 py-2 rounded-xl border border-hbs-blue/20 transition-colors"
            >
              {isBeamerMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isBeamerMode ? 'Normalansicht' : 'Beamer-Modus'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-colors"
                title="Drucken / PDF speichern"
              >
                <Printer className="w-4 h-4" />
              </button>

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hbs-blue text-white text-xs font-bold hover:bg-hbs-blue-deep transition-all shadow-xs"
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
