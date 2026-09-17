import React, { useState, useEffect, useRef } from 'react';
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
import { TextWidget } from './widgets/TextWidget';
import { DrawWidget } from './widgets/DrawWidget';
import { QrCodeWidget } from './widgets/QrCodeWidget';
import { ImageWidget } from './widgets/ImageWidget';
import { StickersWidget } from './widgets/StickersWidget';
import { ScoreboardWidget } from './widgets/ScoreboardWidget';
import { WebcamWidget } from './widgets/WebcamWidget';
import { VideoWidget } from './widgets/VideoWidget';
import { EmbedWidget } from './widgets/EmbedWidget';
import { PdfViewerWidget } from './widgets/PdfViewerWidget';
import { HyperlinkWidget } from './widgets/HyperlinkWidget';
import { PollWidget } from './widgets/PollWidget';
import { CurtainWidget } from './widgets/CurtainWidget';
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
  FileText,
  PenTool,
  QrCode,
  Image as ImageIcon,
  Award,
  Trophy,
  Camera,
  Video,
  Globe,
  Link as LinkIcon,
  BarChart3,
  EyeOff,
  Share2,
  Sparkles, 
  Trash2, 
  ArrowLeft,
  RotateCcw,
  Palette,
  Save,
  FolderOpen
} from 'lucide-react';
import { SaveBoardModal } from './SaveBoardModal';
import { BoardTemplatesDrawer } from './BoardTemplatesDrawer';
import { ExportBoardModal } from './ExportBoardModal';

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
    updateWidgetSize,
    toggleMinimize,
    bringToFront,
    setBackground,
    addScreen,
    switchScreen,
    clearCurrentScreen,
    loadCustomScreen
  } = useBoardManager();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isTemplatesDrawerOpen, setIsTemplatesDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resetScroll = () => {
    scrollContainerRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  };

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
      {/* Subtle Top Bar with School Branding, Centering & Quick Clear */}
      <div className="fixed top-4 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between pointer-events-none z-40">
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full ios-glass text-hbs-slate-dark text-xs font-black shadow-md hover:bg-white transition-all active:scale-95"
            title="Zurück zur Hub-Übersicht"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Zurück zum Portal</span>
            <span className="xs:hidden">Zurück</span>
          </button>

          <button
            onClick={() => setIsBackgroundPickerOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full ios-glass hover:bg-white text-xs font-bold text-hbs-slate-dark/80 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Tafelhintergrund wechseln"
          >
            <Palette className="w-3.5 h-3.5 text-hbs-blue" />
            <span>{activeScreen.title}</span>
            <span className="text-hbs-slate-muted">({activeBgPreset.name})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto relative">
          {/* Direct Background Picker Button */}
          <button
            onClick={() => setIsBackgroundPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-hbs-slate-dark hover:bg-white text-xs font-black transition-all active:scale-95 shadow-sm"
            title="Tafelhintergrund auswählen"
          >
            <Palette className="w-3.5 h-3.5 text-hbs-blue" />
            <span className="hidden sm:inline">Hintergrund</span>
          </button>

          {/* Scroll / Center View Button (especially helpful on mobile phones) */}
          <button
            onClick={resetScroll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-hbs-slate-dark hover:bg-white text-xs font-black transition-all active:scale-95 shadow-sm"
            title="Tafelansicht auf Start zentrieren"
          >
            <RotateCcw className="w-3.5 h-3.5 text-hbs-blue" />
            <span className="hidden md:inline">Zentrieren</span>
          </button>

          {/* Save Board State Button */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-hbs-teal-deep hover:bg-white text-xs font-black transition-all active:scale-95 shadow-sm"
            title="Aktuelles Tafelbild speichern"
          >
            <Save className="w-3.5 h-3.5 text-hbs-teal-deep" />
            <span className="hidden sm:inline">Speichern</span>
          </button>

          {/* Templates & Saved Boards Button */}
          <button
            onClick={() => setIsTemplatesDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-hbs-blue hover:bg-white text-xs font-black transition-all active:scale-95 shadow-sm"
            title="Tafelbilder & Vorlagen öffnen"
          >
            <FolderOpen className="w-3.5 h-3.5 text-hbs-blue" />
            <span>Vorlagen</span>
          </button>

          {/* Export & Share Modal Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass text-indigo-700 hover:bg-white text-xs font-black transition-all active:scale-95 shadow-sm"
            title="Tafelbild für Schüler teilen & als PDF drucken"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Teilen / PDF</span>
          </button>

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

      {/* Scrollable Canvas Viewport (Allows free scrolling/panning in all directions on iPhone & desktop) */}
      <div 
        ref={scrollContainerRef}
        className="w-full h-full overflow-auto touch-pan-x touch-pan-y overscroll-contain relative scroll-smooth focus:outline-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          className={`relative min-w-[max(100vw,2800px)] min-h-[max(100vh,1800px)] transition-colors duration-500 ${
            activeBgPreset.className || ''
          }`}
          style={activeBgPreset.style}
        >
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
            } else if (widget.type === 'text') {
              widgetIcon = <FileText className="w-4 h-4 text-hbs-blue" />;
              widgetContent = <TextWidget />;
            } else if (widget.type === 'draw') {
              widgetIcon = <PenTool className="w-4 h-4 text-purple-600" />;
              widgetContent = <DrawWidget />;
            } else if (widget.type === 'qr-code') {
              widgetIcon = <QrCode className="w-4 h-4 text-hbs-slate-dark" />;
              widgetContent = <QrCodeWidget />;
            } else if (widget.type === 'image') {
              widgetIcon = <ImageIcon className="w-4 h-4 text-emerald-600" />;
              widgetContent = <ImageWidget />;
            } else if (widget.type === 'stickers') {
              widgetIcon = <Award className="w-4 h-4 text-amber-500" />;
              widgetContent = <StickersWidget />;
            } else if (widget.type === 'scoreboard') {
              widgetIcon = <Trophy className="w-4 h-4 text-yellow-600" />;
              widgetContent = <ScoreboardWidget />;
            } else if (widget.type === 'webcam') {
              widgetIcon = <Camera className="w-4 h-4 text-blue-500" />;
              widgetContent = <WebcamWidget />;
            } else if (widget.type === 'video') {
              widgetIcon = <Video className="w-4 h-4 text-red-500" />;
              widgetContent = <VideoWidget />;
            } else if (widget.type === 'embed') {
              widgetIcon = <Globe className="w-4 h-4 text-hbs-teal-deep" />;
              widgetContent = <EmbedWidget />;
            } else if (widget.type === 'pdf') {
              widgetIcon = <FileText className="w-4 h-4 text-red-600" />;
              widgetContent = <PdfViewerWidget />;
            } else if (widget.type === 'hyperlink') {
              widgetIcon = <LinkIcon className="w-4 h-4 text-hbs-blue" />;
              widgetContent = <HyperlinkWidget />;
            } else if (widget.type === 'poll') {
              widgetIcon = <BarChart3 className="w-4 h-4 text-purple-600" />;
              widgetContent = <PollWidget />;
            } else if (widget.type === 'curtain') {
              widgetIcon = <EyeOff className="w-4 h-4 text-slate-700" />;
              widgetContent = <CurtainWidget />;
            }

            return (
              <BoardWidgetContainer
                key={widget.id}
                widget={widget}
                icon={widgetIcon}
                onPositionChange={(x, y) => updateWidgetPosition(widget.id, x, y)}
                onSizeChange={(w, h) => updateWidgetSize(widget.id, w, h)}
                onClose={() => removeWidget(widget.id)}
                onToggleMinimize={() => toggleMinimize(widget.id)}
                onFocus={() => bringToFront(widget.id)}
              >
                {widgetContent}
              </BoardWidgetContainer>
            );
          })}
        </div>
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

      {/* Save Current Board State Modal */}
      <SaveBoardModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentScreen={activeScreen}
      />

      {/* Load Saved Board Templates Drawer */}
      <BoardTemplatesDrawer
        isOpen={isTemplatesDrawerOpen}
        onClose={() => setIsTemplatesDrawerOpen(false)}
        onLoadTemplate={loadCustomScreen}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* Export & Share Board Modal */}
      <ExportBoardModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeScreen={activeScreen}
      />
    </div>
  );
};
