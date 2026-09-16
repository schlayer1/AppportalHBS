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
        <div className="absolute -top-10 px-2.5 py-1 rounded-lg bg-hbs-slate-dark text-white text-[11px] font-bold whitespace-nowrap shadow-md pointer-events-none animate-fadeIn z-50">
          {label}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-hbs-slate-dark rotate-45" />
        </div>
      )}

      {/* Dock Button with magnification */}
      <button
        onClick={onClick}
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 relative ${
          isActive
            ? 'bg-hbs-amber text-white shadow-md scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]'
            : 'bg-white hover:bg-hbs-blue-soft text-hbs-slate-dark hover:text-hbs-blue border border-hbs-slate-border/70 hover:border-hbs-blue/30 shadow-xs hover:scale-115'
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
    <aside aria-label="Schnellstart-Leiste" className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-xl border border-hbs-slate-border/80 shadow-2xl shadow-hbs-slate-dark/25 rounded-3xl px-3 py-2 flex items-center gap-2 sm:gap-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
        
        {/* Smartboard Mode Switch */}
        <DockItem
          icon={<Projector className="w-5 h-5" />}
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
          icon={<Wrench className="w-5 h-5 text-hbs-blue" />}
          label="Unterrichts-Quick-Tools (Timer, Zufall, Lärm)"
          onClick={onOpenQuickTools}
          badge={
            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-hbs-teal text-white text-[9px] font-black">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          }
        />

        {/* Vertical Divider */}
        <div className="w-[1px] h-7 bg-slate-200 my-auto" />

        {/* Schüler Translator QR Quick Link */}
        {studentTranslator && (
          <DockItem
            icon={<QrCode className="w-5 h-5 text-hbs-amber-dark" />}
            label="Schüler-Translator QR"
            onClick={() => onOpenQr(studentTranslator)}
          />
        )}

        {/* Getränkekasse Quick Link */}
        {getraenkeApp && !isSmartboardMode && (
          <DockItem
            icon={<Coffee className="w-5 h-5 text-hbs-teal-deep" />}
            label="Getränkefundus Lehrerzimmer"
            onClick={() => window.open(getraenkeApp.url, '_blank')}
          />
        )}

        {/* Vertretungsstatistik Quick Link */}
        {vertretungApp && !isSmartboardMode && (
          <DockItem
            icon={<CalendarDays className="w-5 h-5 text-hbs-blue-deep" />}
            label="Vertretungsstatistik & AZV"
            onClick={() => window.open(vertretungApp.url, '_blank')}
          />
        )}

        {/* PWA Guide */}
        <DockItem
          icon={<Smartphone className="w-5 h-5 text-hbs-slate-muted" />}
          label="Als App auf iPad/Smartphone ablegen"
          onClick={onOpenInstallGuide}
        />

      </div>
    </aside>
  );
};
