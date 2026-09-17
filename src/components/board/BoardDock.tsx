import React, { useState } from 'react';
import { 
  Clock, 
  Timer, 
  Hourglass,
  Watch,
  Calendar,
  CalendarClock,
  CalendarDays,
  Image as ImageIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  LogOut, 
  LayoutGrid,
  Volume2,
  TrafficCone,
  MessageSquare,
  Users,
  Dices,
  PenTool,
  QrCode,
  FileText,
  Award,
  Trophy,
  Camera,
  Video,
  Globe,
  Link as LinkIcon,
  BarChart3,
  Sparkles,
  Palette,
  EyeOff
} from 'lucide-react';
import { BoardWidgetType } from './types';

interface BoardDockProps {
  onAddWidget: (type: BoardWidgetType) => void;
  onOpenBackgroundPicker: () => void;
  screenIndex: number;
  totalScreens: number;
  onSwitchScreen: (index: number) => void;
  onAddScreen: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExitBoard: () => void;
}

export const BoardDock: React.FC<BoardDockProps> = ({
  onAddWidget,
  onOpenBackgroundPicker,
  screenIndex,
  totalScreens,
  onSwitchScreen,
  onAddScreen,
  isFullscreen,
  onToggleFullscreen,
  onExitBoard
}) => {
  const [showMoreFlyout, setShowMoreFlyout] = useState(false);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none">
      
      {/* "More Tools" iOS Glass Flyout (Werkzeugkasten) */}
      {showMoreFlyout && (
        <div className="mb-3 w-80 sm:w-96 p-4 rounded-3xl ios-glass-dock shadow-2xl border border-white/80 animate-fadeIn text-hbs-slate-dark">
          <div className="flex items-center justify-between pb-2 border-b border-white/40 mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-hbs-slate-dark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-hbs-blue" />
              Werkzeugkasten (Classroomscreen)
            </span>
            <button
              onClick={() => setShowMoreFlyout(false)}
              className="text-[10px] font-bold text-hbs-slate-muted hover:text-hbs-slate-dark px-2 py-0.5 rounded-lg bg-white/50"
            >
              Schließen ✕
            </button>
          </div>

          {/* Quick Action: Tafelhintergrund wählen */}
          <button
            onClick={() => {
              onOpenBackgroundPicker();
              setShowMoreFlyout(false);
            }}
            className="w-full mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-hbs-blue/15 via-white/80 to-hbs-teal/15 hover:from-hbs-blue/25 hover:to-hbs-teal/25 text-hbs-slate-dark border border-white shadow-xs flex items-center justify-between gap-3 transition-all active:scale-98 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-hbs-blue text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-black block text-hbs-slate-dark truncate">Tafelhintergrund wählen</span>
                <span className="text-[10px] text-hbs-slate-muted block truncate font-medium">10 Verläufe & Schul-Linierungen</span>
              </div>
            </div>
            <span className="text-[10px] font-black text-hbs-blue px-2 py-1 rounded-lg bg-white/90 border border-white/80 shadow-2xs shrink-0">
              Wählen →
            </span>
          </button>

          <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
            {[
              { id: '__background__', label: 'Hintergrund', icon: Palette, active: true },
              { id: 'clock', label: 'Uhr', icon: Clock, active: true },
              { id: 'timer', label: 'Timer', icon: Timer, active: true },
              { id: 'visual-timer', label: 'Kuchen-Timer', icon: Hourglass, active: true },
              { id: 'stopwatch', label: 'Stoppuhr', icon: Watch, active: true },
              { id: 'calendar', label: 'Kalender', icon: Calendar, active: true },
              { id: 'event-countdown', label: 'Countdown', icon: CalendarClock, active: true },
              { id: 'timetable', label: 'Stundenplan', icon: CalendarDays, active: true },
              { id: 'sound-level', label: 'Lärmampel', icon: Volume2, active: true },
              { id: 'traffic-light', label: 'Ampel', icon: TrafficCone, active: true },
              { id: 'work-symbols', label: 'Arbeit', icon: MessageSquare, active: true },
              { id: 'random-picker', label: 'Zufall', icon: Users, active: true },
              { id: 'group-maker', label: 'Gruppen', icon: Users, active: true },
              { id: 'dice', label: 'Würfel', icon: Dices, active: true },
              { id: 'text', label: 'Tafeltext', icon: FileText, active: true },
              { id: 'draw', label: 'Zeichnen', icon: PenTool, active: true },
              { id: 'qr-code', label: 'QR-Code', icon: QrCode, active: true },
              { id: 'image', label: 'Bild', icon: ImageIcon, active: true },
              { id: 'stickers', label: 'Sticker', icon: Award, active: true },
              { id: 'scoreboard', label: 'Punkte', icon: Trophy, active: true },
              { id: 'webcam', label: 'Kamera', icon: Camera, active: true },
              { id: 'video', label: 'Video', icon: Video, active: true },
              { id: 'embed', label: 'Web-Tool', icon: Globe, active: true },
              { id: 'pdf', label: 'PDF', icon: FileText, active: true },
              { id: 'hyperlink', label: 'Links & Web', icon: LinkIcon, active: true },
              { id: 'poll', label: 'Abstimmung', icon: BarChart3, active: true },
              { id: 'curtain', label: 'Vorhang', icon: EyeOff, active: true },
            ].map((tool: { id: string; label: string; icon: any; active: boolean; milestone?: string }) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  disabled={!tool.active}
                  onClick={() => {
                    if (tool.id === '__background__') {
                      onOpenBackgroundPicker();
                      setShowMoreFlyout(false);
                    } else if (tool.active) {
                      onAddWidget(tool.id as BoardWidgetType);
                      setShowMoreFlyout(false);
                    }
                  }}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center relative ${
                    tool.id === '__background__'
                      ? 'bg-hbs-blue-soft/50 hover:bg-hbs-blue-soft text-hbs-blue border border-hbs-blue/30 shadow-2xs active:scale-95'
                      : tool.active
                      ? 'bg-white/80 hover:bg-white text-hbs-slate-dark hover:text-hbs-blue border border-white/80 shadow-2xs active:scale-95'
                      : 'bg-black/5 text-hbs-slate-muted/50 border border-transparent cursor-not-allowed opacity-60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold truncate max-w-full">{tool.label}</span>
                  {tool.milestone && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-hbs-blue-soft text-hbs-blue border border-hbs-blue/20">
                      {tool.milestone}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Apple Liquid-Glass Dock */}
      <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-full ios-glass-dock shadow-2xl border border-white/80">
        
        {/* Background Switcher */}
        <button
          onClick={onOpenBackgroundPicker}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/80 shadow-xs transition-transform active:scale-90"
          title="Hintergrund wechseln"
          aria-label="Hintergrund"
        >
          <ImageIcon className="w-5 h-5 text-hbs-blue" />
        </button>

        <div className="w-[1px] h-6 bg-white/60 mx-0.5" />

        {/* Primary Widget: Clock */}
        <button
          onClick={() => onAddWidget('clock')}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/80 shadow-xs transition-transform active:scale-90"
          title="Unterrichtsuhr öffnen"
          aria-label="Unterrichtsuhr"
        >
          <Clock className="w-5 h-5 text-hbs-slate-dark" />
        </button>

        {/* Primary Widget: Timer */}
        <button
          onClick={() => onAddWidget('timer')}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/80 shadow-xs transition-transform active:scale-90"
          title="Countdown-Timer öffnen"
          aria-label="Countdown-Timer"
        >
          <Timer className="w-5 h-5 text-hbs-blue" />
        </button>

        {/* "More Tools" Flyout Toggle */}
        <button
          onClick={() => setShowMoreFlyout(!showMoreFlyout)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border shadow-xs transition-all active:scale-90 ${
            showMoreFlyout
              ? 'bg-hbs-blue text-white border-hbs-blue shadow-hbs-blue/30'
              : 'bg-white/70 hover:bg-white text-hbs-slate-dark border-white/80'
          }`}
          title="Alle Tafel-Werkzeuge"
          aria-label="Werkzeuge"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-6 bg-white/60 mx-0.5" />

        {/* Screen Deck Switcher (< 1/3 > +) */}
        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-full border border-white/80">
          <button
            onClick={() => onSwitchScreen(screenIndex - 1)}
            disabled={screenIndex <= 0}
            className="w-7 h-7 rounded-full hover:bg-white text-hbs-slate-dark disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-all"
            title="Vorherige Tafel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black text-hbs-slate-dark px-1 tabular-nums">
            {screenIndex + 1} / {totalScreens}
          </span>

          <button
            onClick={() => onSwitchScreen(screenIndex + 1)}
            disabled={screenIndex >= totalScreens - 1}
            className="w-7 h-7 rounded-full hover:bg-white text-hbs-slate-dark disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-all"
            title="Nächste Tafel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onAddScreen}
            className="w-7 h-7 rounded-full bg-hbs-blue text-white hover:bg-hbs-blue-deep flex items-center justify-center shadow-xs transition-transform active:scale-90 ml-0.5"
            title="Neue Tafel hinzufügen"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/60 mx-0.5" />

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 hover:bg-white text-hbs-slate-dark flex items-center justify-center border border-white/80 shadow-xs transition-transform active:scale-90"
          title={isFullscreen ? 'Vollbild beenden' : 'Vollbildmodus (Smartboard/Beamer)'}
          aria-label="Vollbild"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Exit Board Button */}
        <button
          onClick={onExitBoard}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-500/15 hover:bg-red-500 text-red-700 hover:text-white flex items-center justify-center border border-red-300/60 shadow-xs transition-all active:scale-90"
          title="Tafelmodus verlassen (zurück zum Portal)"
          aria-label="Tafel verlassen"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
