import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCw,
  Star,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolApp } from '../config/apps';
import { CardTilt } from './ui/card-tilt';
import { AnimatedAppIcon } from './AnimatedAppIcon';

interface AppCardProps {
  app: SchoolApp;
  onOpenQr: (app: SchoolApp) => void;
  onOpenInstallGuide: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (appId: string) => void;
  isSmartboardMode?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ 
  app, 
  onOpenQr, 
  isFavorite = false,
  onToggleFavorite,
  isSmartboardMode = false 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Vibrant, rich Google Stitch theme definitions
  const theme = {
    blue: {
      gradient: 'from-[#0B7BA7] via-[#006185] to-[#004C6A]',
      softBg: 'bg-gradient-to-b from-[#EBF5F9] via-white to-white',
      border: 'border-[#BDE0EC] hover:border-[#0B7BA7]',
      btnGradient: 'bg-gradient-to-r from-[#0B7BA7] to-[#005E82] text-white shadow-lg shadow-[#0B7BA7]/30 hover:shadow-[#0B7BA7]/40',
      badge: 'bg-[#EBF5F9] text-[#006185] border-[#BDE0EC]',
      glow: 'rgba(11, 123, 167, 0.15)',
    },
    amber: {
      gradient: 'from-[#F39200] via-[#E28300] to-[#C96E00]',
      softBg: 'bg-gradient-to-b from-[#FFF7ED] via-white to-white',
      border: 'border-[#FED7AA] hover:border-[#F39200]',
      btnGradient: 'bg-gradient-to-r from-[#F39200] to-[#D97706] text-white shadow-lg shadow-[#F39200]/30 hover:shadow-[#F39200]/40',
      badge: 'bg-[#FFF7ED] text-[#B45309] border-[#FED7AA]',
      glow: 'rgba(243, 146, 0, 0.18)',
    },
    teal: {
      gradient: 'from-[#00A896] via-[#008F80] to-[#006B5F]',
      softBg: 'bg-gradient-to-b from-[#ECFDF5] via-white to-white',
      border: 'border-[#A7F3D0] hover:border-[#00A896]',
      btnGradient: 'bg-gradient-to-r from-[#00A896] to-[#007A6D] text-white shadow-lg shadow-[#00A896]/30 hover:shadow-[#00A896]/40',
      badge: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
      glow: 'rgba(0, 168, 150, 0.15)',
    },
    slate: {
      gradient: 'from-[#2C3E50] via-[#1F2D3A] to-[#091D2E]',
      softBg: 'bg-gradient-to-b from-[#F1F5F9] via-white to-white',
      border: 'border-slate-300 hover:border-slate-500',
      btnGradient: 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white shadow-lg shadow-slate-900/25 hover:shadow-slate-900/35',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      glow: 'rgba(44, 62, 80, 0.12)',
    }
  }[app.badgeColor];

  return (
    <div className="relative [perspective:1200px] w-full">
      {/* 3D Flip Container */}
      <div 
        className={`w-full duration-500 [transform-style:preserve-3d] transition-transform ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        
        {/* ================= FRONT SIDE ================= */}
        <div className="w-full [backface-visibility:hidden]">
          <CardTilt disabled={isFlipped || isSmartboardMode} className="w-full">
            <div 
              className={`relative rounded-3xl p-6 sm:p-7 border-2 ${theme.border} ${theme.softBg} shadow-[0_12px_30px_-8px_rgba(9,29,46,0.1),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_-10px_rgba(9,29,46,0.18)] transition-all duration-300 flex flex-col justify-between overflow-hidden group`}
            >
              
              {/* Subtle top ambient glow */}
              <div 
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ backgroundColor: theme.glow }}
              />

              {/* Featured banner for student app */}
              {app.isFeaturedStudentQr && (
                <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-[#F39200] to-amber-600 py-1.5 px-4 text-center text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Direkt im Unterricht • QR-Schnellscan</span>
                </div>
              )}

              <div className={app.isFeaturedStudentQr ? 'mt-4' : ''}>
                
                {/* Header row: Vibrant 3D Squircle Icon + Badges & Buttons */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  
                  {/* Rich Gradient Squircle App Icon */}
                  <div 
                    style={{ transform: 'translateZ(26px)' }}
                    className={`w-16 h-16 rounded-2xl p-3.5 bg-gradient-to-br ${theme.gradient} text-white shadow-xl shadow-slate-900/15 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4)]`}
                  >
                    <AnimatedAppIcon iconName={app.icon} className="w-8 h-8 text-white" size={32} />
                  </div>

                  {/* Top-Right Action Badges & Buttons */}
                  <div className="flex items-center gap-1.5">
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(app.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-150 active:scale-95 ${
                          isFavorite
                            ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs'
                            : 'bg-white/90 text-slate-400 border-slate-200 hover:text-amber-500'
                        }`}
                        title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        aria-label="Favorit"
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-10 h-10 rounded-xl bg-white/90 border border-slate-200 text-slate-500 hover:text-hbs-blue hover:bg-hbs-blue-soft flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xs"
                      title="Anleitung & 3D-Rückseite"
                      aria-label="Karte umdrehen"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badge Category Row */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-xs ${theme.badge}`}>
                    {app.badge}
                  </span>
                  {app.privacyBadge && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {app.privacyBadge}
                    </span>
                  )}
                </div>

                {/* Titles */}
                <div className="mb-2.5">
                  <h3 
                    style={{ transform: 'translateZ(18px)' }}
                    className="text-xl sm:text-2xl font-black text-[#091D2E] tracking-tight leading-snug group-hover:text-hbs-blue transition-colors"
                  >
                    {app.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-hbs-blue mt-0.5">
                    {app.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  {app.description}
                </p>

                {/* SMARTBOARD MODE EXTRA: Directly Visible Large QR Code */}
                {isSmartboardMode && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-hbs-blue/30 shadow-md my-4 flex flex-col items-center justify-center animate-fadeIn">
                    <QRCodeSVG
                      value={app.url}
                      size={150}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/Siegel_bunt.png",
                        x: undefined,
                        y: undefined,
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
                    />
                    <span className="text-xs font-black text-hbs-blue-deep mt-2.5">
                      📱 Jetzt mit iPad / Handy scannen
                    </span>
                  </div>
                )}

                {/* Tags */}
                {!isSmartboardMode && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {app.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-[11px] font-semibold text-slate-600 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {app.offlineReady && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" /> PWA-fähig
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Footer with Rich Tactile Buttons */}
              <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2.5">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-h-[46px] px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 select-none shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35)] ${theme.btnGradient}`}
                >
                  <span>App öffnen</span>
                  <ArrowUpRight className="w-4 h-4 opacity-90" />
                </a>

                <button
                  onClick={() => onOpenQr(app)}
                  className="min-h-[46px] min-w-[46px] p-2.5 rounded-2xl border border-slate-200 bg-white/90 hover:bg-hbs-blue-soft text-slate-700 hover:text-hbs-blue font-bold text-xs transition-all active:scale-95 flex items-center justify-center shadow-xs hover:shadow"
                  title="QR-Code zum Scannen anzeigen"
                  aria-label="QR-Code anzeigen"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

            </div>
          </CardTilt>
        </div>

        {/* ================= BACK SIDE (FLIP) ================= */}
        <div className="w-full absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="w-full h-full rounded-3xl bg-white border-2 border-hbs-blue/40 p-6 sm:p-7 shadow-2xl shadow-hbs-blue/15 flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-hbs-blue text-white shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-hbs-blue">
                      Didaktischer Praxis-Leitfaden
                    </span>
                    <h4 className="text-sm font-black text-[#091D2E]">
                      {app.shortTitle}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setIsFlipped(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                  title="Zurück zur Vorderseite"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {app.pedagogicalValue && (
                <div className="my-3.5 p-3.5 rounded-2xl bg-[#EBF5F9] border border-[#BDE0EC] text-xs text-[#006185] leading-relaxed font-semibold shadow-xs">
                  💡 <strong>Schulalltag-Nutzen:</strong> {app.pedagogicalValue}
                </div>
              )}

              {app.quickGuide && (
                <div className="space-y-2 mt-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    3-Schritte-Praxisstart:
                  </span>
                  {app.quickGuide.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-hbs-blue text-white flex items-center justify-center font-black text-[10px] shrink-0 tabular-nums shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setIsFlipped(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95"
              >
                Vorderseite
              </button>

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all ${theme.btnGradient}`}
              >
                <span>Direkt starten</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
