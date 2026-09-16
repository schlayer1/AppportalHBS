import React, { useState, useEffect } from 'react';
import { useBoardManager } from './useBoardManager';
import { BoardWidgetContainer } from './BoardWidgetContainer';
import { BoardDock } from './BoardDock';
import { BoardBackgroundPicker } from './BoardBackgroundPicker';
import { BACKGROUND_PRESETS } from './backgrounds';
import { ClockWidget } from './widgets/ClockWidget';
import { TimerWidget } from './widgets/TimerWidget';
import { VisualTimerWidget } from './widgets/VisualTimerWidget';
import { StopwatchWidget } from './widgets/StopwatchWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { EventCountdownWidget } from './widgets/EventCountdownWidget';
import { TimetableWidget } from './widgets/TimetableWidget';
import { TrafficLightWidget } from './widgets/TrafficLightWidget';
import { WorkSymbolsWidget } from './widgets/WorkSymbolsWidget';
import { SoundLevelWidget } from './widgets/SoundLevelWidget';
import { RandomPickerWidget } from './widgets/RandomPickerWidget';
import { GroupMakerWidget } from './widgets/GroupMakerWidget';
import { DiceWidget } from './widgets/DiceWidget';
import { 
  Clock, 
  Timer, 
  Hourglass, 
  Watch, 
  Calendar, 
  CalendarClock, 
  CalendarDays, 
  TrafficCone,
  MessageSquare,
  Volume2,
  Users,
  Users2,
  Dices,
  Sparkles, 
  Trash2, 
  ArrowLeft 
} from 'lucide-react';

interface ClassroomBoardProps {
  onExit: () => void;
}

export const ClassroomBoard: React.FC<ClassroomBoardProps> = ({ onExit }) => {
  const {
    screens,
    activeScreen,
    activeScreenIndex,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    toggleMinimize,
    bringToFront,
    setBackground,
    addScreen,
    switchScreen,
    clearCurrentScreen
  } = useBoardManager();

  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Vollbild nicht unterstützt oder abgebrochen', e);
    }
  };

  // Keyboard Shortcuts (F = Fullscreen, Esc = Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Find active background preset
  const activeBgPreset = BACKGROUND_PRESETS.find((p) => p.id === activeScreen.backgroundId) || BACKGROUND_PRESETS[0];

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden select-none z-50 transition-colors duration-500 ${
        activeBgPreset.className || ''
      }`}
      style={activeBgPreset.style}
    >
      {/* Subtle Top Bar with School Branding & Quick Clear */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full ios-glass text-hbs-slate-dark text-xs font-black shadow-md hover:bg-white transition-all active:scale-95"
            title="Zurück zur Hub-Übersicht"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zum Portal</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full ios-glass text-xs font-bold text-hbs-slate-dark/80 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-hbs-amber" />
            <span>{activeScreen.title}</span>
            <span className="text-hbs-slate-muted">({activeBgPreset.name})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {activeScreen.widgets.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Möchtest du wirklich alle Werkzeuge auf dieser Tafel schließen?')) {
                  clearCurrentScreen();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-hbs-slate-muted hover:text-red-600 hover:bg-red-50/80 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Tafel leeren"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tafel leeren</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Canvas Widgets Area */}
      <div className="relative w-full h-full">
        {activeScreen.widgets.map((widget) => {
          let widgetIcon = <Sparkles className="w-4 h-4" />;
          let widgetContent: React.ReactNode = null;

          if (widget.type === 'clock') {
            widgetIcon = <Clock className="w-4 h-4" />;
            widgetContent = <ClockWidget />;
          } else if (widget.type === 'timer') {
            widgetIcon = <Timer className="w-4 h-4" />;
            widgetContent = <TimerWidget />;
          } else if (widget.type === 'visual-timer') {
            widgetIcon = <Hourglass className="w-4 h-4 text-red-500" />;
            widgetContent = <VisualTimerWidget />;
          } else if (widget.type === 'stopwatch') {
            widgetIcon = <Watch className="w-4 h-4 text-hbs-teal-deep" />;
            widgetContent = <StopwatchWidget />;
          } else if (widget.type === 'calendar') {
            widgetIcon = <Calendar className="w-4 h-4 text-hbs-blue" />;
            widgetContent = <CalendarWidget />;
          } else if (widget.type === 'event-countdown') {
            widgetIcon = <CalendarClock className="w-4 h-4 text-amber-500" />;
            widgetContent = <EventCountdownWidget />;
          } else if (widget.type === 'timetable') {
            widgetIcon = <CalendarDays className="w-4 h-4 text-emerald-600" />;
            widgetContent = <TimetableWidget />;
          } else if (widget.type === 'traffic-light') {
            widgetIcon = <TrafficCone className="w-4 h-4 text-red-500" />;
            widgetContent = <TrafficLightWidget />;
          } else if (widget.type === 'work-symbols') {
            widgetIcon = <MessageSquare className="w-4 h-4 text-hbs-blue" />;
            widgetContent = <WorkSymbolsWidget />;
          } else if (widget.type === 'sound-level') {
            widgetIcon = <Volume2 className="w-4 h-4 text-emerald-600" />;
            widgetContent = <SoundLevelWidget />;
          } else if (widget.type === 'random-picker') {
            widgetIcon = <Users className="w-4 h-4 text-hbs-blue" />;
            widgetContent = <RandomPickerWidget />;
          } else if (widget.type === 'group-maker') {
            widgetIcon = <Users2 className="w-4 h-4 text-hbs-teal-deep" />;
            widgetContent = <GroupMakerWidget />;
          } else if (widget.type === 'dice') {
            widgetIcon = <Dices className="w-4 h-4 text-amber-500" />;
            widgetContent = <DiceWidget />;
          }

          return (
            <BoardWidgetContainer
              key={widget.id}
              widget={widget}
              icon={widgetIcon}
              onPositionChange={(x, y) => updateWidgetPosition(widget.id, x, y)}
              onClose={() => removeWidget(widget.id)}
              onToggleMinimize={() => toggleMinimize(widget.id)}
              onFocus={() => bringToFront(widget.id)}
            >
              {widgetContent}
            </BoardWidgetContainer>
          );
        })}
      </div>

      {/* Floating iOS Liquid-Glass Dock */}
      <BoardDock
        onAddWidget={(type) => addWidget(type)}
        onOpenBackgroundPicker={() => setIsBackgroundPickerOpen(true)}
        screenIndex={activeScreenIndex}
        totalScreens={screens.length}
        onSwitchScreen={switchScreen}
        onAddScreen={addScreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onExitBoard={onExit}
      />

      {/* Background Picker Modal */}
      <BoardBackgroundPicker
        isOpen={isBackgroundPickerOpen}
        onClose={() => setIsBackgroundPickerOpen(false)}
        activeBackgroundId={activeScreen.backgroundId}
        onSelectBackground={(id) => setBackground(id)}
      />
    </div>
  );
};
