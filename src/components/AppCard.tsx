import React, { useState } from 'react';
import { 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Languages, 
  Headphones, 
  Coffee, 
  CalendarDays, 
  Briefcase, 
  Compass, 
  Layers,
  RotateCw,
  Star,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolApp } from '../config/apps';
import { SpotlightCard } from './ui/spotlight-card';
import { BorderBeam } from './ui/border-beam';
import { ShimmerButton } from './ui/shimmer-button';
import { Badge } from './ui/badge';
import { CardTilt } from './ui/card-tilt';

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Languages': return Languages;
    case 'Headphones': return Headphones;
    case 'Coffee': return Coffee;
    case 'CalendarDays': return CalendarDays;
    case 'Briefcase': return Briefcase;
    case 'Compass': return Compass;
    default: return Layers;
  }
};

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
  const Icon = getIconComponent(app.icon);

  const colorStyles = {
    blue: {
      spotlight: 'rgba(11, 123, 167, 0.08)',
      iconBg: 'bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      actionBtn: 'bg-hbs-blue hover:bg-hbs-blue-deep text-white shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
      qrBtn: 'hover:bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/25',
    },
    amber: {
      spotlight: 'rgba(243, 146, 0, 0.08)',
      iconBg: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      actionBtn: 'bg-hbs-amber hover:bg-hbs-amber-dark text-white shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
      qrBtn: 'hover:bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
    },
    teal: {
      spotlight: 'rgba(0, 168, 150, 0.08)',
      iconBg: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      actionBtn: 'bg-hbs-teal hover:bg-hbs-teal-deep text-white shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
      qrBtn: 'hover:bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25',
    },
    slate: {
      spotlight: 'rgba(44, 62, 80, 0.06)',
      iconBg: 'bg-slate-100 text-hbs-slate-dark border-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      actionBtn: 'bg-hbs-slate-dark hover:bg-black text-white shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
      qrBtn: 'hover:bg-slate-100 text-hbs-slate-dark border-slate-200',
    }
  }[app.badgeColor];

  return (
    <div className="relative [perspective:1200px] w-full min-h-[440px]">
      {/* 3D Flip Container */}
      <div 
        className={`w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        
        {/* ================= FRONT SIDE ================= */}
        <div className="w-full h-full [backface-visibility:hidden]">
          <CardTilt disabled={isFlipped || isSmartboardMode} className="w-full h-full">
            <SpotlightCard 
              spotlightColor={colorStyles.spotlight}
              className={`p-6 sm:p-7 flex flex-col justify-between relative group hover:border-hbs-blue/40 w-full h-full ${
                app.isFeaturedStudentQr ? 'border-hbs-amber/40 ring-1 ring-hbs-amber/20' : ''
              }`}
            >
              {/* Border Beam on Featured Card */}
              {app.isFeaturedStudentQr && (
                <BorderBeam size={250} duration={12} colorFrom="#F39200" colorTo="#0B7BA7" />
              )}

              {/* Top Banner accent if featured */}
              {app.isFeaturedStudentQr && (
                <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-hbs-amber to-amber-500 py-1.5 px-4 text-center text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Direkt im Unterricht • QR-Scan für Schüler</span>
                </div>
              )}

              <div className={app.isFeaturedStudentQr ? 'mt-4' : ''}>
                {/* Header row: Floating 3D Icon & Action Buttons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {/* Floating Z-Depth Icon */}
                  <div 
                    style={{ transform: 'translateZ(26px)' }}
                    className={`w-14 h-14 rounded-2xl p-3 flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shrink-0 ${colorStyles.iconBg}`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Top-Right Badges & Favorite Toggle */}
                  <div className="flex items-center gap-1.5">
                    {/* Favorite Star Button with 44px min touch target */}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(app.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-150 active:scale-[0.98] ${
                          isFavorite
                            ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs'
                            : 'bg-white text-hbs-slate-light border-slate-200 hover:text-amber-500'
                        }`}
                        title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        aria-label="Favorit umschalten"
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    )}

                    {/* 3D Flip Toggle Button */}
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-hbs-slate-muted hover:text-hbs-blue hover:bg-hbs-blue-soft flex items-center justify-center transition-all duration-150 active:scale-[0.98] shadow-xs"
                      title="3D-Details & Anleitung anzeigen"
                      aria-label="Karte drehen"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badge & Category Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant={app.badgeColor}>
                    {app.badge}
                  </Badge>
                  {app.privacyBadge && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-hbs-slate-light bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      <ShieldCheck className="w-3 h-3 text-hbs-teal" />
                      {app.privacyBadge}
                    </span>
                  )}
                </div>

                {/* Titles */}
                <div className="mb-2">
                  <h3 
                    style={{ transform: 'translateZ(18px)' }}
                    className="text-lg sm:text-xl font-bold text-hbs-slate-dark tracking-tight leading-snug group-hover:text-hbs-blue transition-colors"
                  >
                    {app.title}
                  </h3>
                  <p className="text-xs font-bold text-hbs-blue mt-0.5">
                    {app.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-hbs-slate-muted leading-relaxed mb-4">
                  {app.description}
                </p>

                {/* SMARTBOARD MODE EXTRA: Directly Visible Large QR Code */}
                {isSmartboardMode && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-hbs-blue/30 shadow-md my-3 flex flex-col items-center justify-center">
                    <QRCodeSVG
                      value={app.url}
                      size={140}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/Siegel_bunt.png",
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                    />
                    <span className="text-[11px] font-bold text-hbs-blue-deep mt-2">
                      📱 Jetzt mit iPad / Smartphone scannen
                    </span>
                  </div>
                )}

                {/* Tags (when not in smartboard mode to keep it compact) */}
                {!isSmartboardMode && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {app.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-[11px] font-medium text-hbs-slate-muted bg-hbs-bg px-2.5 py-1 rounded-lg border border-hbs-slate-border/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {app.offlineReady && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
                        <CheckCircle2 className="w-3 h-3" /> PWA-fähig
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                {app.isFeaturedStudentQr && !isSmartboardMode && (
                  <ShimmerButton
                    onClick={() => onOpenQr(app)}
                    className="w-full text-xs sm:text-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR-Code für Schüler anzeigen (Beamer)</span>
                  </ShimmerButton>
                )}

                <div className="flex items-center gap-2">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 select-none ${colorStyles.actionBtn}`}
                  >
                    <span>App öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {!app.isFeaturedStudentQr && (
                    <button
                      onClick={() => onOpenQr(app)}
                      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border font-semibold text-xs transition-all duration-150 active:scale-[0.98] flex items-center justify-center bg-white shadow-xs hover:shadow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] ${colorStyles.qrBtn}`}
                      title="QR-Code zum Scannen anzeigen"
                      aria-label="QR-Code anzeigen"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </SpotlightCard>
          </CardTilt>
        </div>

        {/* ================= BACK SIDE (FLIP) ================= */}
        <div className="w-full h-full absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="w-full h-full rounded-3xl bg-white border border-hbs-blue/30 p-6 sm:p-7 shadow-2xl shadow-hbs-blue/10 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
            
            <div>
              {/* Back Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-hbs-blue-soft text-hbs-blue">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-hbs-blue">
                      Didaktischer Leitfaden
                    </span>
                    <h4 className="text-sm font-bold text-hbs-slate-dark">
                      {app.shortTitle}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setIsFlipped(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark transition-colors active:scale-[0.98]"
                  title="Zurück zur Vorderseite"
                  aria-label="Zurückdrehen"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Pedagogical Highlight Box */}
              {app.pedagogicalValue && (
                <div className="my-3 p-3 rounded-2xl bg-hbs-blue-soft/60 border border-hbs-blue/15 text-xs text-hbs-blue-deep leading-relaxed font-medium">
                  💡 <strong>Schulalltag-Nutzen:</strong> {app.pedagogicalValue}
                </div>
              )}

              {/* 3-Step Quick Guide */}
              {app.quickGuide && (
                <div className="space-y-2 mt-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-slate-muted block">
                    3-Schritte-Praxisstart:
                  </span>
                  {app.quickGuide.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-hbs-slate-dark font-medium">
                      <span className="w-5 h-5 rounded-full bg-hbs-blue text-white flex items-center justify-center font-bold text-[10px] shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setIsFlipped(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold transition-all active:scale-[0.98]"
              >
                Vorderseite
              </button>

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${colorStyles.actionBtn}`}
              >
                <span>Direkt starten</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
