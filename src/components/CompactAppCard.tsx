import React from 'react';
import { ExternalLink, Info, Star } from 'lucide-react';
import { SchoolApp } from '../config/apps';
import { AnimatedAppIcon } from './AnimatedAppIcon';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface CompactAppCardProps {
  app: SchoolApp;
  onOpenDetails: (app: SchoolApp) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (appId: string) => void;
}

export const CompactAppCard: React.FC<CompactAppCardProps> = ({
  app,
  onOpenDetails,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { tiltX, tiltY, isSupported } = useDeviceOrientation();

  const colorStyles = {
    blue: {
      border: 'hover:border-hbs-blue/50 active:border-hbs-blue',
      iconBg: 'bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      badge: 'bg-hbs-blue-soft text-hbs-blue-deep',
    },
    amber: {
      border: 'hover:border-hbs-amber/50 active:border-hbs-amber',
      iconBg: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      badge: 'bg-hbs-amber-light text-hbs-amber-dark',
    },
    teal: {
      border: 'hover:border-hbs-teal/50 active:border-hbs-teal',
      iconBg: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      badge: 'bg-hbs-teal-light text-hbs-teal-deep',
    },
    slate: {
      border: 'hover:border-slate-400 active:border-slate-500',
      iconBg: 'bg-slate-100 text-hbs-slate-dark border-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
      badge: 'bg-slate-100 text-hbs-slate-dark',
    },
  }[app.badgeColor];

  // Dynamic Gyroscope transform style on supported mobile devices
  const gyroStyle: React.CSSProperties = isSupported
    ? {
        transform: `perspective(600px) rotateX(${(-tiltY * 5).toFixed(1)}deg) rotateY(${(tiltX * 5).toFixed(1)}deg)`,
        transition: 'transform 0.2s ease-out',
      }
    : {};

  return (
    <div
      style={gyroStyle}
      className={`group relative bg-white rounded-2xl p-3.5 sm:p-4 border border-hbs-slate-border/80 shadow-hbs-card hover:shadow-hbs-hover active:scale-[0.98] transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ${colorStyles.border}`}
    >
      {/* Top Row: Animated Icon & Favorite Star */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div 
          onClick={() => onOpenDetails(app)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-2.5 flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 cursor-pointer ${colorStyles.iconBg}`}
        >
          <AnimatedAppIcon iconName={app.icon} className="w-6 h-6" size={24} />
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isFavorite 
                  ? 'text-amber-500 bg-amber-50' 
                  : 'text-slate-300 hover:text-amber-500'
              }`}
              title="Favorit"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Info Details trigger */}
          <button
            onClick={() => onOpenDetails(app)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-hbs-slate-light hover:text-hbs-blue hover:bg-slate-100 transition-colors"
            title="Details & QR-Code"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Title & Badge */}
      <div 
        onClick={() => onOpenDetails(app)}
        className="cursor-pointer mb-3"
      >
        <h4 className="text-xs sm:text-sm font-bold text-hbs-slate-dark tracking-tight line-clamp-1 group-hover:text-hbs-blue transition-colors">
          {app.shortTitle}
        </h4>
        <p className="text-[11px] text-hbs-slate-muted line-clamp-1 mt-0.5">
          {app.subtitle}
        </p>
      </div>

      {/* Bottom Action: Direct Launch Button */}
      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full min-h-[38px] py-2 px-2.5 rounded-xl bg-hbs-blue-soft/80 hover:bg-hbs-blue text-hbs-blue-deep hover:text-white border border-hbs-blue/15 text-[11px] sm:text-xs font-bold flex items-center justify-between transition-all duration-150 active:scale-95 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]"
      >
        <span>Öffnen</span>
        <ExternalLink className="w-3 h-3 opacity-80" />
      </a>
    </div>
  );
};
