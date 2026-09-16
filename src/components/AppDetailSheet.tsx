import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ExternalLink, Copy, Check, QrCode, GraduationCap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SchoolApp } from '../config/apps';
import { AnimatedAppIcon } from './AnimatedAppIcon';

interface AppDetailSheetProps {
  app: SchoolApp | null;
  onClose: () => void;
  onOpenFullQr: (app: SchoolApp) => void;
}

export const AppDetailSheet: React.FC<AppDetailSheetProps> = ({
  app,
  onClose,
  onOpenFullQr,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!app) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-hbs-slate-dark/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS Bottom Sheet Container */}
      <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl border-t border-hbs-slate-border max-h-[85dvh] flex flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slideUp">
        
        {/* iOS Grab Handle */}
        <div className="w-full pt-3 pb-2 flex items-center justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-hbs-blue-soft text-hbs-blue p-2.5 flex items-center justify-center border border-hbs-blue/15 shrink-0 shadow-xs">
              <AnimatedAppIcon iconName={app.icon} className="w-7 h-7" size={28} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark tracking-tight">
                {app.title}
              </h3>
              <p className="text-xs font-semibold text-hbs-blue mt-0.5">
                {app.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100 flex items-center justify-center shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-4 space-y-4">
          
          {/* Description */}
          <p className="text-xs sm:text-sm text-hbs-slate-muted leading-relaxed">
            {app.description}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-hbs-blue-soft text-hbs-blue border border-hbs-blue/15">
              {app.badge}
            </span>
            {app.privacyBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-slate-light bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-hbs-teal" />
                {app.privacyBadge}
              </span>
            )}
            {app.offlineReady && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> PWA-fähig
              </span>
            )}
          </div>

          {/* Pedagogical Benefit */}
          {app.pedagogicalValue && (
            <div className="p-3.5 rounded-2xl bg-hbs-blue-soft/60 border border-hbs-blue/15 text-xs text-hbs-blue-deep leading-relaxed font-medium">
              💡 <strong>Didaktischer Nutzen:</strong> {app.pedagogicalValue}
            </div>
          )}

          {/* 3-Step Quick Start */}
          {app.quickGuide && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-hbs-bg border border-hbs-slate-border/70">
              <div className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-dark">
                <GraduationCap className="w-4 h-4 text-hbs-blue" />
                <span>Schnellstart im Unterricht:</span>
              </div>
              {app.quickGuide.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-hbs-slate-muted">
                  <span className="w-4 h-4 rounded-full bg-hbs-blue text-white font-bold text-[10px] flex items-center justify-center shrink-0 tabular-nums mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Inline QR Code preview on demand */}
          {showQr ? (
            <div className="p-4 bg-white rounded-2xl border-2 border-hbs-blue/20 shadow-md flex flex-col items-center justify-center animate-fadeIn">
              <QRCodeSVG
                value={app.url}
                size={170}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "/Siegel_bunt.png",
                  x: undefined,
                  y: undefined,
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
              <button
                onClick={() => onOpenFullQr(app)}
                className="mt-3 text-xs font-bold text-hbs-blue hover:underline"
              >
                In Beamer-Vollbildmodus vergrößern &rarr;
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowQr(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-hbs-slate-dark flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4 text-hbs-blue" />
              <span>QR-Code zum Scannen einblenden</span>
            </button>
          )}

        </div>

        {/* Sheet Action Footer */}
        <div className="px-5 sm:px-6 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-hbs-slate-muted" />}
            <span>{copied ? 'Kopiert' : 'Link'}</span>
          </button>

          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
          >
            <span>App direkt öffnen</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
};
