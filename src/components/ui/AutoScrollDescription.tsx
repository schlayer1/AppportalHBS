import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutoScrollDescriptionProps {
  text: string;
  className?: string;
  speed?: number; // pixels per second (downward glide)
  topPauseMs?: number;
  bottomPauseMs?: number;
}

export const AutoScrollDescription: React.FC<AutoScrollDescriptionProps> = ({
  text,
  className = "text-xs sm:text-sm text-slate-600 leading-relaxed mb-4",
  speed = 10.5, // Calm, comfortable, readable pace (~10.5 px/s)
  topPauseMs = 3800, // 3.8s pause at top for relaxed reading of the beginning
  bottomPauseMs = 3400, // 3.4s pause at bottom to absorb the ending
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showTopMask, setShowTopMask] = useState(false);
  const [showBottomMask, setShowBottomMask] = useState(false);

  // Animation state refs (running decoupled from React renders for 60/120fps smoothness)
  const currentYRef = useRef(0);
  const maxScrollRef = useRef(0);
  const phaseRef = useRef<'TOP_PAUSE' | 'SCROLLING_DOWN' | 'BOTTOM_PAUSE' | 'SCROLLING_UP'>('TOP_PAUSE');
  const returnStartTimeRef = useRef<number | null>(null);
  const returnDurationRef = useRef<number>(1.8);
  const returnStartPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const isHoveredRef = useRef(false);

  // Direct DOM update for 60/120fps silky smoothness without triggering React re-renders
  const applyTransform = (y: number) => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.style.transform = `translate3d(0, -${y.toFixed(2)}px, 0)`;
    }
    // Update masks only on threshold crossings to avoid React thrashing
    const hasScrolledDown = y > 4;
    setShowTopMask(prev => (prev !== hasScrolledDown ? hasScrolledDown : prev));

    const hasMoreBelow = y < maxScrollRef.current - 4;
    setShowBottomMask(prev => (prev !== hasMoreBelow ? hasMoreBelow : prev));
  };

  // Measure overflow using ResizeObserver
  const measure = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerHeight = containerRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;
    const overflow = Math.max(0, contentHeight - containerHeight);

    if (overflow > 4) {
      setIsOverflowing(true);
      setMaxScroll(overflow);
      maxScrollRef.current = overflow;
      setShowBottomMask(true);
    } else {
      setIsOverflowing(false);
      setMaxScroll(0);
      maxScrollRef.current = 0;
      currentYRef.current = 0;
      setShowTopMask(false);
      setShowBottomMask(false);
      if (scrollWrapperRef.current) {
        scrollWrapperRef.current.style.transform = 'none';
      }
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

  // Main high-performance animation loop
  useEffect(() => {
    if (!isOverflowing || maxScroll <= 0) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    currentYRef.current = 0;
    applyTransform(0);
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
        returnStartTimeRef.current = performance.now();
        returnStartPosRef.current = currentYRef.current;
        // Dynamic return duration: smooth ease-in-out over 1.6s to 2.2s
        returnDurationRef.current = Math.max(1.6, Math.min(2.4, currentYRef.current / 28));
        lastTimeRef.current = performance.now();
      }, bottomPauseMs);
    };

    startTopPause();

    const animate = (now: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
      }
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // max 50ms delta clamp
      lastTimeRef.current = now;

      // Animate only if visible in viewport, not hovered, and tab is active
      if (isVisibleRef.current && !isHoveredRef.current && !document.hidden) {
        if (phaseRef.current === 'SCROLLING_DOWN') {
          const limit = maxScrollRef.current;
          // Soft acceleration ramp at start and soft deceleration ramp near end
          const easeThreshold = Math.min(10, limit * 0.25);
          let speedFactor = 1.0;

          if (currentYRef.current < easeThreshold) {
            speedFactor = Math.max(0.2, currentYRef.current / easeThreshold);
          } else if (currentYRef.current > limit - easeThreshold) {
            speedFactor = Math.max(0.2, (limit - currentYRef.current) / easeThreshold);
          }

          currentYRef.current += speed * speedFactor * dt;

          if (currentYRef.current >= limit) {
            currentYRef.current = limit;
            applyTransform(limit);
            startBottomPause();
          } else {
            applyTransform(currentYRef.current);
          }
        } else if (phaseRef.current === 'SCROLLING_UP') {
          // Butter-smooth cubic ease-in-out glide back to top
          const elapsed = (now - (returnStartTimeRef.current || now)) / 1000;
          const progress = Math.min(1, elapsed / returnDurationRef.current);
          
          // Cubic ease-in-out curve
          const ease = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const newY = Math.max(0, returnStartPosRef.current * (1 - ease));
          currentYRef.current = newY;
          applyTransform(newY);

          if (progress >= 1 || newY <= 0.1) {
            currentYRef.current = 0;
            applyTransform(0);
            startTopPause();
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOverflowing, maxScroll, speed, topPauseMs, bottomPauseMs, text]);

  // Support manual mouse wheel scrolling when hovering
  const handleWheel = (e: React.WheelEvent) => {
    if (!isOverflowing || maxScrollRef.current <= 0) return;
    e.stopPropagation();
    
    // Smooth manual scrub
    const delta = e.deltaY;
    const newY = Math.min(maxScrollRef.current, Math.max(0, currentYRef.current + delta * 0.35));
    currentYRef.current = newY;
    applyTransform(newY);

    if (newY >= maxScrollRef.current) {
      phaseRef.current = 'BOTTOM_PAUSE';
    } else if (newY <= 0) {
      phaseRef.current = 'TOP_PAUSE';
    } else {
      phaseRef.current = delta > 0 ? 'SCROLLING_DOWN' : 'SCROLLING_UP';
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    lastTimeRef.current = performance.now();
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      className={`relative h-[4.25rem] overflow-hidden select-text group/desc cursor-default ${className}`}
      title={text}
    >
      {/* Scrollable text container - zero React re-renders during motion */}
      <div
        ref={scrollWrapperRef}
        style={{ willChange: isOverflowing ? 'transform' : 'auto' }}
        className="w-full"
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
          className={`absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-b from-white via-white/85 to-transparent pointer-events-none transition-opacity duration-500 ${
            showTopMask ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Subtle bottom fade mask when more text is available below */}
      {isOverflowing && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none transition-opacity duration-500 ${
            showBottomMask ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
