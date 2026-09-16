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

  // Styling maps based on badgeColor from DESIGN.md
  const colorStyles = {
    blue: {
      cardBorder: 'hover:border-hbs-blue/50',
      iconBg: 'bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20',
      badgeBg: 'bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20',
      actionBtn: 'bg-hbs-blue hover:bg-hbs-blue-deep text-white shadow-xs hover:shadow',
      qrBtn: 'hover:bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20',
    },
    amber: {
      cardBorder: 'hover:border-hbs-amber/50',
      iconBg: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
      badgeBg: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
      actionBtn: 'bg-hbs-amber hover:bg-hbs-amber-dark text-white shadow-xs hover:shadow',
      qrBtn: 'hover:bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
    },
    teal: {
      cardBorder: 'hover:border-hbs-teal/50',
      iconBg: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25',
      badgeBg: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25',
      actionBtn: 'bg-hbs-teal hover:bg-hbs-teal-deep text-white shadow-xs hover:shadow',
      qrBtn: 'hover:bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25',
    },
    slate: {
      cardBorder: 'hover:border-hbs-slate/50',
      iconBg: 'bg-slate-100 text-hbs-slate-dark border-slate-200',
      badgeBg: 'bg-slate-100 text-hbs-slate-dark border-slate-200',
      actionBtn: 'bg-hbs-slate-dark hover:bg-black text-white shadow-xs hover:shadow',
      qrBtn: 'hover:bg-slate-100 text-hbs-slate-dark border-slate-200',
    }
  }[app.badgeColor];

  return (
    <div className={`group bg-white rounded-3xl p-6 sm:p-7 border border-hbs-slate-border/70 shadow-hbs-card hover:shadow-hbs-hover transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${colorStyles.cardBorder}`}>
      
      {/* Top Banner accent if featured for students */}
      {app.isFeaturedStudentQr && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-hbs-amber to-amber-500 py-1 px-4 text-center text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs">
          <Sparkles className="w-3 h-3" />
          <span>Direkt im Unterricht einsetzbar • Schneller QR-Scan für Schüler</span>
        </div>
      )}

      <div>
        {/* Header row: Icon & Badges */}
        <div className={`flex items-start justify-between gap-3 ${app.isFeaturedStudentQr ? 'mt-4' : ''} mb-4`}>
          <div className={`w-14 h-14 rounded-2xl p-3 flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-105 ${colorStyles.iconBg}`}>
            <Icon className="w-8 h-8" />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${colorStyles.badgeBg}`}>
              {app.badge}
            </span>
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
          <p className="text-xs font-semibold text-hbs-blue mt-0.5">
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
              className="text-[11px] font-medium text-hbs-slate-muted bg-hbs-bg px-2.5 py-1 rounded-lg border border-hbs-slate-border/50"
            >
              {tag}
            </span>
          ))}
          {app.offlineReady && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> PWA-fähig
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
        
        {/* Prominent QR button for student apps */}
        {app.isFeaturedStudentQr && (
          <button
            onClick={() => onOpenQr(app)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-hbs-amber hover:from-amber-600 hover:to-hbs-amber-dark text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>QR-Code für Schüler anzeigen (Beamer / Smartboard)</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Main Launch Button */}
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${colorStyles.actionBtn}`}
          >
            <span>App öffnen</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Standard QR Code button */}
          {!app.isFeaturedStudentQr && (
            <button
              onClick={() => onOpenQr(app)}
              className={`p-2.5 rounded-xl border font-semibold text-xs transition-colors flex items-center justify-center bg-white ${colorStyles.qrBtn}`}
              title="QR-Code zum Scannen anzeigen"
              aria-label="QR-Code anzeigen"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
