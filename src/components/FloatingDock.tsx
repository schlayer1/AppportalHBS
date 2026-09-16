import React, { useState } from 'react';
import { 
  Projector, 
  Wrench, 
  QrCode, 
  Coffee, 
  CalendarDays, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { SchoolApp } from '../config/apps';

interface FloatingDockProps {
  onOpenQuickTools: () => void;
  isSmartboardMode: boolean;
  onToggleSmartboardMode: () => void;
  onOpenQr: (app: SchoolApp) => void;
  onOpenInstallGuide: () => void;
  apps: SchoolApp[];
}

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: React.ReactNode;
  isActive?: boolean;
}

const DockItem: React.FC<DockItemProps> = ({ icon, label, onClick, badge, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex flex-col items-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-11 px-3 py-1.5 rounded-xl bg-hbs-slate-dark text-white text-xs font-bold whitespace-nowrap shadow-xl pointer-events-none animate-fadeIn z-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          {label}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-hbs-slate-dark rotate-45" />
        </div>
      )}

      {/* Dock Button */}
      <button
        onClick={onClick}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
          isActive
            ? 'bg-gradient-to-br from-hbs-amber to-amber-600 text-white shadow-md scale-110 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4)]'
            : 'bg-white/90 hover:bg-hbs-blue-soft text-hbs-slate-dark hover:text-hbs-blue border border-slate-200/80 hover:border-hbs-blue/30 shadow-xs hover:scale-110'
        }`}
        aria-label={label}
      >
        {icon}
        {badge}
      </button>

      {/* Active Dot Indicator */}
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-hbs-amber mt-1" />
      )}
    </div>
  );
};

export const FloatingDock: React.FC<FloatingDockProps> = ({
  onOpenQuickTools,
  isSmartboardMode,
  onToggleSmartboardMode,
  onOpenQr,
  onOpenInstallGuide,
  apps
}) => {
  const studentTranslator = apps.find(a => a.id === 'schueler-translator');
  const getraenkeApp = apps.find(a => a.id === 'getraenkefundus');
  const vertretungApp = apps.find(a => a.id === 'vertretungsstatistik');

  return (
    <aside 
      aria-label="Schnellstart-Leiste" 
      className="fixed bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-auto max-w-[95vw]"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_15px_40px_-5px_rgba(9,29,46,0.22),0_4px_12px_rgba(0,0,0,0.06)] rounded-3xl px-2.5 sm:px-3.5 py-2 flex items-center gap-2 sm:gap-3 shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]">
        
        {/* Smartboard Mode Switch */}
        <DockItem
          icon={<Projector className="w-4 h-4 sm:w-5 sm:h-5" />}
          label={isSmartboardMode ? "Smartboard-Modus beenden" : "Smartboard-Modus aktivieren"}
          onClick={onToggleSmartboardMode}
          isActive={isSmartboardMode}
          badge={
            isSmartboardMode ? (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
            ) : undefined
          }
        />

        {/* Quick Tools Drawer Trigger */}
        <DockItem
          icon={<Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-hbs-blue" />}
          label="Unterrichts-Quick-Tools (Timer, Zufall, Lärm)"
          onClick={onOpenQuickTools}
          badge={
            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-hbs-teal text-white text-[9px] font-black">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          }
        />

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-slate-200 my-auto" />

        {/* Schüler Translator QR Quick Link */}
        {studentTranslator && (
          <DockItem
            icon={<QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-hbs-amber-dark" />}
            label="Schüler-Translator QR"
            onClick={() => onOpenQr(studentTranslator)}
          />
        )}

        {/* Getränkekasse Quick Link */}
        {getraenkeApp && !isSmartboardMode && (
          <DockItem
            icon={<Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-hbs-teal-deep" />}
            label="Getränkefundus Lehrerzimmer"
            onClick={() => window.open(getraenkeApp.url, '_blank')}
          />
        )}

        {/* Vertretungsstatistik Quick Link */}
        {vertretungApp && !isSmartboardMode && (
          <DockItem
            icon={<CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-hbs-blue-deep" />}
            label="Vertretungsstatistik & AZV"
            onClick={() => window.open(vertretungApp.url, '_blank')}
          />
        )}

        {/* PWA Guide */}
        <DockItem
          icon={<Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-hbs-slate-muted" />}
          label="Als App auf iPad/Smartphone ablegen"
          onClick={onOpenInstallGuide}
        />

      </div>
    </aside>
  );
};
