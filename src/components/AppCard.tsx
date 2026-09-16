import React from 'react';
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
  Layers 
} from 'lucide-react';
import { SchoolApp } from '../config/apps';
import { SpotlightCard } from './ui/spotlight-card';
import { BorderBeam } from './ui/border-beam';
import { ShimmerButton } from './ui/shimmer-button';
import { Badge } from './ui/badge';

// Helper to resolve icon by string name
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
}

export const AppCard: React.FC<AppCardProps> = ({ app, onOpenQr }) => {
  const Icon = getIconComponent(app.icon);

  // Styling maps strictly based on Stitch / DESIGN.md colors
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
    <SpotlightCard 
      spotlightColor={colorStyles.spotlight}
      className={`p-6 sm:p-7 flex flex-col justify-between relative group hover:border-hbs-blue/40 ${
        app.isFeaturedStudentQr ? 'border-hbs-amber/40 ring-1 ring-hbs-amber/20' : ''
      }`}
    >
      {/* Magic UI Border Beam on Featured Card */}
      {app.isFeaturedStudentQr && (
        <BorderBeam size={250} duration={12} colorFrom="#F39200" colorTo="#0B7BA7" />
      )}

      {/* Top Banner accent if featured for students */}
      {app.isFeaturedStudentQr && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-hbs-amber to-amber-500 py-1.5 px-4 text-center text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Direkt im Unterricht • QR-Scan für Schüler</span>
        </div>
      )}

      <div className={app.isFeaturedStudentQr ? 'mt-4' : ''}>
        {/* Header row: Icon & Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl p-3 flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shrink-0 ${colorStyles.iconBg}`}>
            <Icon className="w-8 h-8" />
          </div>

          <div className="flex flex-col items-end gap-1.5">
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
        </div>

        {/* Titles */}
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-hbs-slate-dark tracking-tight leading-snug group-hover:text-hbs-blue transition-colors">
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

        {/* Tags */}
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
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
        
        {/* Magic UI Shimmer Button for Student QR Feature */}
        {app.isFeaturedStudentQr && (
          <ShimmerButton
            onClick={() => onOpenQr(app)}
            className="w-full text-xs sm:text-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>QR-Code für Schüler anzeigen (Beamer / Smartboard)</span>
          </ShimmerButton>
        )}

        <div className="flex items-center gap-2">
          {/* Main Launch Button with 44px touch height */}
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 select-none ${colorStyles.actionBtn}`}
          >
            <span>App öffnen</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Standard QR Code button with 44px min touch target */}
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
  );
};
