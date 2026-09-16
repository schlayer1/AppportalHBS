export type BoardWidgetType = 
  | 'clock'
  | 'timer'
  | 'visual-timer'
  | 'stopwatch'
  | 'calendar'
  | 'event-countdown'
  | 'timetable'
  | 'sound-level'
  | 'traffic-light'
  | 'work-symbols'
  | 'random-picker'
  | 'group-maker'
  | 'dice'
  | 'poll'
  | 'scoreboard'
  | 'stickers'
  | 'text'
  | 'draw'
  | 'image'
  | 'qr-code'
  | 'hyperlink'
  | 'video'
  | 'embed'
  | 'webcam'
  | 'pdf';

export interface BoardWidgetInstance {
  id: string;
  type: BoardWidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized?: boolean;
  data?: Record<string, any>;
}

export type BoardBackgroundId = 
  | 'chalkboard'
  | 'math-grid'
  | 'lined-paper'
  | 'slate-dark'
  | 'nature-lake'
  | 'nature-forest'
  | 'minimal-aurora'
  | 'gradient-sage'
  | 'gradient-sand'
  | 'gradient-sky'
  | 'gradient-lavender'
  | 'gradient-slate-soft'
  | 'lineature-math-chalk'
  | 'lineature-primary-4lines'
  | 'lineature-single-lines'
  | 'lineature-music-staves'
  | 'lineature-coordinate-grid';

export interface BoardScreen {
  id: string;
  title: string;
  backgroundId: BoardBackgroundId;
  widgets: BoardWidgetInstance[];
}

export interface BackgroundPreset {
  id: BoardBackgroundId;
  name: string;
  category: 'verlauf' | 'linierung' | 'tafel' | 'papier' | 'natur' | 'modern';
  className?: string;
  style?: React.CSSProperties;
  previewColor: string;
  description?: string;
}
