import React from 'react';
import { QrCode, Star, ArrowUpRight, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { SchoolApp } from '../config/apps';
import { AnimatedAppIcon } from './AnimatedAppIcon';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface CompactAppCardProps {
  app: SchoolApp;
  onOpenDetails: (app: SchoolApp) => void;
  onOpenQr: (app: SchoolApp) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (appId: string) => void;
  isReorderMode?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onDeleteCustom?: () => void;
}

export const CompactAppCard: React.FC<CompactAppCardProps> = ({
  app,
  onOpenDetails,
  onOpenQr,
  isFavorite = false,
  onToggleFavorite,
  isReorderMode = false,
  onMoveLeft,
  onMoveRight,
  onDeleteCustom
}) => {
  const { tiltX, tiltY, isSupported } = useDeviceOrientation();

  // Vibrant iOS-Widget Gradients & Accents strictly adhering to Stitch school palette
  const themeStyles = {
    blue: {
      gradient: 'from-[#0B7BA7] via-[#006185] to-[#004C6A]',
      glow: 'rgba(11, 123, 167, 0.25)',
      badge: 'bg-[#E6F4F8] text-[#006185] border-[#B8E2F0]',
      cardBorder: 'hover:border-[#0B7BA7]/60 active:border-[#0B7BA7]',
      btnBg: 'bg-[#0B7BA7] hover:bg-[#006185] text-white shadow-[#0B7BA7]/25',
    },
    amber: {
      gradient: 'from-[#F39200] via-[#E28300] to-[#C96E00]',
      glow: 'rgba(243, 146, 0, 0.3)',
      badge: 'bg-[#FEF7EE] text-[#A76300] border-[#FCE1BF]',
      cardBorder: 'hover:border-[#F39200]/60 active:border-[#F39200]',
      btnBg: 'bg-[#F39200] hover:bg-[#D47900] text-white shadow-[#F39200]/30',
    },
    teal: {
      gradient: 'from-[#00A896] via-[#008F80] to-[#006B5F]',
      glow: 'rgba(0, 168, 150, 0.25)',
      badge: 'bg-[#E6FAF7] text-[#006B5F] border-[#BAF2E9]',
      cardBorder: 'hover:border-[#00A896]/60 active:border-[#00A896]',
      btnBg: 'bg-[#00A896] hover:bg-[#008F80] text-white shadow-[#00A896]/25',
    },
    slate: {
      gradient: 'from-[#2C3E50] via-[#1F2D3A] to-[#091D2E]',
      glow: 'rgba(44, 62, 80, 0.25)',
      badge: 'bg-slate-100 text-[#091D2E] border-slate-300',
      cardBorder: 'hover:border-slate-500 active:border-slate-600',
      btnBg: 'bg-[#091D2E] hover:bg-black text-white shadow-slate-900/20',
    },
  }[app.badgeColor];

  // Subtle mobile gyroscope motion
  const gyroStyle: React.CSSProperties = isSupported
    ? {
        transform: `perspective(700px) rotateX(${(-tiltY * 4).toFixed(1)}deg) rotateY(${(tiltX * 4).toFixed(1)}deg)`,
        transition: 'transform 0.2s ease-out',
      }
    : {};

  return (
    <div
      style={gyroStyle}
      className={`group relative bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_10px_25px_-5px_rgba(9,29,46,0.08),0_4px_10px_-2px_rgba(9,29,46,0.04),inset_0_1px_1px_0_rgba(255,255,255,1)] hover:shadow-[0_20px_35px_-10px_rgba(11,123,167,0.18)] active:scale-[0.97] transition-all duration-200 flex flex-col justify-between overflow-hidden ${themeStyles.cardBorder}`}
    >
      {/* Ambient background glow inside the card */}
      <div 
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ backgroundColor: themeStyles.glow }}
      />

      <div>
        {/* Top Row: Vibrant Squircle App Icon + Favorite + Info */}
        <div className="flex items-start justify-between gap-2 mb-3.5 relative z-10">
          
          {/* iOS-Style App Icon Squircle */}
          <div 
            onClick={() => onOpenDetails(app)}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-3 bg-gradient-to-br ${themeStyles.gradient} text-white shadow-md flex items-center justify-center cursor-pointer transition-transform duration-200 group-hover:scale-105 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4)] shrink-0`}
            style={{ minWidth: '3.25rem', minHeight: '3.25rem' }}
          >
            <AnimatedAppIcon iconName={app.icon} className="w-7 h-7 text-white" size={28} />
          </div>

          {/* Quick Badges / Actions */}
          <div className="flex items-center gap-1">
            {isReorderMode && (
              <div className="flex items-center gap-0.5 bg-amber-100 p-0.5 rounded-lg border border-amber-300">
                {onMoveLeft && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
                    className="p-1 rounded bg-white hover:bg-amber-200 text-amber-950 shadow-2xs"
                    title="Verschieben"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}
                {onMoveRight && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
                    className="p-1 rounded bg-white hover:bg-amber-200 text-amber-950 shadow-2xs"
                    title="Verschieben"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {onDeleteCustom && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteCustom(); }}
                    className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 shadow-2xs"
                    title="Löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(app.id);
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isFavorite 
                    ? 'text-amber-500 bg-amber-50 shadow-xs' 
                    : 'text-slate-300 hover:text-amber-500'
                }`}
                title="Favorit"
                aria-label="Favorit"
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            <button
              onClick={() => onOpenQr(app)}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-hbs-blue hover:bg-hbs-blue-soft flex items-center justify-center transition-colors"
              title="QR-Code anzeigen"
              aria-label="QR-Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle: Title & Badge */}
        <div 
          onClick={() => onOpenDetails(app)}
          className="cursor-pointer mb-3 relative z-10"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${themeStyles.badge}`}>
              {app.badge}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-black text-hbs-slate-dark tracking-tight leading-snug group-hover:text-hbs-blue transition-colors line-clamp-1">
            {app.shortTitle}
          </h4>
          <p className="text-xs text-hbs-slate-muted line-clamp-2 mt-0.5 leading-relaxed">
            {app.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Row: Tactile Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 relative z-10">
        <a
          href={app.url}
          target={app.url.startsWith('#') ? undefined : "_blank"}
          rel={app.url.startsWith('#') ? undefined : "noopener noreferrer"}
          className={`flex-1 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-95 transition-all select-none shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3)] ${themeStyles.btnBg}`}
        >
          <span>Starten</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => onOpenDetails(app)}
          className="min-h-[40px] px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold transition-colors active:scale-95"
          title="Details & Infos"
        >
          Info
        </button>
      </div>

    </div>
  );
};
