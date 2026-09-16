import { useState, useEffect, useCallback } from 'react';
import { BoardScreen, BoardWidgetInstance, BoardWidgetType, BoardBackgroundId } from './types';

const STORAGE_KEY = 'hbs_board_deck_v1';

const DEFAULT_SCREEN: BoardScreen = {
  id: 'screen-1',
  title: 'Tafel 1',
  backgroundId: 'chalkboard',
  widgets: [
    {
      id: 'init-clock',
      type: 'clock',
      title: 'Unterrichtsuhr',
      x: 32,
      y: 32,
      width: 320,
      height: 180,
      zIndex: 10
    },
    {
      id: 'init-timer',
      type: 'timer',
      title: 'Countdown-Timer',
      x: 380,
      y: 32,
      width: 340,
      height: 380,
      zIndex: 11
    }
  ]
};

export const useBoardManager = () => {
  const [screens, setScreens] = useState<BoardScreen[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fehler beim Laden des Board-Status:', e);
    }
    return [DEFAULT_SCREEN];
  });

  const [activeScreenIndex, setActiveScreenIndex] = useState<number>(0);

  // Autosave to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
    } catch (e) {
      console.warn('Fehler beim Speichern des Board-Status:', e);
    }
  }, [screens]);

  const activeScreen = screens[activeScreenIndex] || screens[0] || DEFAULT_SCREEN;

  const getMaxZIndex = useCallback(() => {
    if (!activeScreen.widgets || activeScreen.widgets.length === 0) return 10;
    return Math.max(...activeScreen.widgets.map((w) => w.zIndex || 10), 10);
  }, [activeScreen.widgets]);

  const addWidget = useCallback((type: BoardWidgetType, title?: string, data?: Record<string, any>) => {
    const newZ = getMaxZIndex() + 1;
    const offset = (activeScreen.widgets.length % 6) * 35;
    
    // Sensible default sizes based on type
    let w = 320;
    let h = 260;
    let defaultTitle = title || 'Widget';

    if (type === 'clock') {
      w = 320;
      h = 180;
      defaultTitle = 'Unterrichtsuhr';
    } else if (type === 'timer') {
      w = 340;
      h = 380;
      defaultTitle = 'Countdown-Timer';
    } else if (type === 'visual-timer') {
      w = 320;
      h = 360;
      defaultTitle = 'Visueller Timer';
    } else if (type === 'stopwatch') {
      w = 320;
      h = 280;
      defaultTitle = 'Stoppuhr';
    } else if (type === 'calendar') {
      w = 340;
      h = 320;
      defaultTitle = 'Schulkalender';
    } else if (type === 'event-countdown') {
      w = 300;
      h = 260;
      defaultTitle = 'Event-Countdown';
    } else if (type === 'timetable') {
      w = 360;
      h = 380;
      defaultTitle = 'Stundenplan';
    }

    const newWidget: BoardWidgetInstance = {
      id: `w-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title: defaultTitle,
      x: Math.min(60 + offset, window.innerWidth - w - 40),
      y: Math.min(80 + offset, window.innerHeight - h - 120),
      width: w,
      height: h,
      zIndex: newZ,
      data
    };

    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: [...scr.widgets, newWidget]
        };
      });
    });
  }, [activeScreenIndex, activeScreen.widgets.length, getMaxZIndex]);

  const removeWidget = useCallback((id: string) => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: scr.widgets.filter((w) => w.id !== id)
        };
      });
    });
  }, [activeScreenIndex]);

  const updateWidgetPosition = useCallback((id: string, x: number, y: number) => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: scr.widgets.map((w) => (w.id === id ? { ...w, x, y } : w))
        };
      });
    });
  }, [activeScreenIndex]);

  const updateWidgetData = useCallback((id: string, data: Record<string, any>) => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: scr.widgets.map((w) => (w.id === id ? { ...w, data: { ...w.data, ...data } } : w))
        };
      });
    });
  }, [activeScreenIndex]);

  const toggleMinimize = useCallback((id: string) => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: scr.widgets.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
        };
      });
    });
  }, [activeScreenIndex]);

  const bringToFront = useCallback((id: string) => {
    const newZ = getMaxZIndex() + 1;
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          widgets: scr.widgets.map((w) => (w.id === id ? { ...w, zIndex: newZ } : w))
        };
      });
    });
  }, [activeScreenIndex, getMaxZIndex]);

  const setBackground = useCallback((backgroundId: BoardBackgroundId) => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return {
          ...scr,
          backgroundId
        };
      });
    });
  }, [activeScreenIndex]);

  const addScreen = useCallback(() => {
    const newScreenNumber = screens.length + 1;
    const newScreen: BoardScreen = {
      id: `screen-${Date.now()}`,
      title: `Tafel ${newScreenNumber}`,
      backgroundId: activeScreen.backgroundId,
      widgets: []
    };
    setScreens((prev) => [...prev, newScreen]);
    setActiveScreenIndex(screens.length);
  }, [screens.length, activeScreen.backgroundId]);

  const switchScreen = useCallback((index: number) => {
    if (index >= 0 && index < screens.length) {
      setActiveScreenIndex(index);
    }
  }, [screens.length]);

  const deleteScreen = useCallback((index: number) => {
    if (screens.length <= 1) return; // Keep at least one screen
    setScreens((prev) => prev.filter((_, i) => i !== index));
    setActiveScreenIndex((prev) => Math.max(0, prev - 1));
  }, [screens.length]);

  const clearCurrentScreen = useCallback(() => {
    setScreens((prev) => {
      return prev.map((scr, idx) => {
        if (idx !== activeScreenIndex) return scr;
        return { ...scr, widgets: [] };
      });
    });
  }, [activeScreenIndex]);

  return {
    screens,
    activeScreen,
    activeScreenIndex,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetData,
    toggleMinimize,
    bringToFront,
    setBackground,
    addScreen,
    switchScreen,
    deleteScreen,
    clearCurrentScreen
  };
};
