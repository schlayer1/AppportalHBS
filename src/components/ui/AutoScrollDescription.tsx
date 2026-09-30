import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutoScrollDescriptionProps {
  text: string;
  className?: string;
  speed?: number; // pixels per second (downward)
  topPauseMs?: number;
  bottomPauseMs?: number;
}

export const AutoScrollDescription: React.FC<AutoScrollDescriptionProps> = ({
  text,
  className = "text-xs sm:text-sm text-slate-600 leading-relaxed mb-4",
  speed = 20,
  topPauseMs = 3000,
  bottomPauseMs = 2500,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [maxScroll, setMaxScroll] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animation state refs (to avoid stale closures inside requestAnimationFrame)
  const currentYRef = useRef(0);
  const phaseRef = useRef<'TOP_PAUSE' | 'SCROLLING_DOWN' | 'BOTTOM_PAUSE' | 'SCROLLING_UP'>('TOP_PAUSE');
  const pauseTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const isHoveredRef = useRef(false);

  isHoveredRef.current = isHovered;

  // Measure overflow using ResizeObserver
  const measure = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerHeight = containerRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;
    const overflow = Math.max(0, contentHeight - containerHeight);

    if (overflow > 4) {
      setIsOverflowing(true);
      setMaxScroll(overflow);
    } else {
      setIsOverflowing(false);
      setMaxScroll(0);
      currentYRef.current = 0;
      setTranslateY(0);
      phaseRef.current = 'TOP_PAUSE';
    }
  }, []);

  useEffect(() => {
    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [measure, text]);

  // Viewport intersection observer to save CPU when off-screen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!isOverflowing || maxScroll <= 0) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    // Reset to start on overflow / text change
    currentYRef.current = 0;
    setTranslateY(0);
    phaseRef.current = 'TOP_PAUSE';
    lastTimeRef.current = null;

    let timeoutId: NodeJS.Timeout | null = null;

    const startTopPause = () => {
      phaseRef.current = 'TOP_PAUSE';
      timeoutId = setTimeout(() => {
        phaseRef.current = 'SCROLLING_DOWN';
        lastTimeRef.current = performance.now();
      }, topPauseMs);
    };

    const startBottomPause = () => {
      phaseRef.current = 'BOTTOM_PAUSE';
      timeoutId = setTimeout(() => {
        phaseRef.current = 'SCROLLING_UP';
        lastTimeRef.current = performance.now();
      }, bottomPauseMs);
    };

    startTopPause();

    const animate = (now: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
      }
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // clamp delta
      lastTimeRef.current = now;

      // Only animate if visible, not hovered, and document is active
      if (isVisibleRef.current && !isHoveredRef.current && !document.hidden) {
        if (phaseRef.current === 'SCROLLING_DOWN') {
          currentYRef.current += speed * dt;
          if (currentYRef.current >= maxScroll) {
            currentYRef.current = maxScroll;
            setTranslateY(maxScroll);
            startBottomPause();
          } else {
            setTranslateY(currentYRef.current);
          }
        } else if (phaseRef.current === 'SCROLLING_UP') {
          // Return to top at a slightly faster pace (~35px/s)
          currentYRef.current -= Math.max(speed * 1.6, 32) * dt;
          if (currentYRef.current <= 0) {
            currentYRef.current = 0;
            setTranslateY(0);
            startTopPause();
          } else {
            setTranslateY(currentYRef.current);
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (timeoutId) clearTimeout(timeoutId);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isOverflowing, maxScroll, speed, topPauseMs, bottomPauseMs, text]);

  // Support manual mouse wheel scrolling when hovering
  const handleWheel = (e: React.WheelEvent) => {
    if (!isOverflowing || maxScroll <= 0) return;
    e.stopPropagation();
    
    // Smooth manual scrub
    const delta = e.deltaY;
    const newY = Math.min(maxScroll, Math.max(0, currentYRef.current + delta * 0.4));
    currentYRef.current = newY;
    setTranslateY(newY);

    if (newY >= maxScroll) {
      phaseRef.current = 'BOTTOM_PAUSE';
    } else if (newY <= 0) {
      phaseRef.current = 'TOP_PAUSE';
    } else {
      phaseRef.current = delta > 0 ? 'SCROLLING_DOWN' : 'SCROLLING_UP';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      className={`relative h-[4.25rem] overflow-hidden select-text group/desc cursor-default ${className}`}
      title={text}
    >
      {/* Scrollable text container */}
      <div
        style={{
          transform: isOverflowing ? `translate3d(0, -${translateY}px, 0)` : 'none',
          willChange: isOverflowing ? 'transform' : 'auto',
          transition: isHovered ? 'none' : undefined,
        }}
        className="w-full transition-transform"
      >
        <p
          ref={contentRef}
          className="m-0 p-0 text-slate-600 leading-relaxed break-words"
        >
          {text}
        </p>
      </div>

      {/* Subtle top fade mask when scrolled down */}
      {isOverflowing && (
        <div
          className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-300 ${
            translateY > 4 ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Subtle bottom fade mask when more text is available below */}
      {isOverflowing && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none transition-opacity duration-300 ${
            translateY < maxScroll - 4 ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
