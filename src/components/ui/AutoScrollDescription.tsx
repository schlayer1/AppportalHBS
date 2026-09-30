import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutoScrollDescriptionProps {
  text: string;
  className?: string;
  isCardHovered?: boolean;
  speed?: number; // pixels per second (downward glide)
  hoverDelayMs?: number; // delay before autoscroll starts on hover
  bottomPauseMs?: number; // pause at bottom
  repeatTopPauseMs?: number; // pause before repeating if still hovering
}

export const AutoScrollDescription: React.FC<AutoScrollDescriptionProps> = ({
  text,
  className = "text-xs sm:text-sm text-slate-600 leading-relaxed mb-4",
  isCardHovered = false,
  speed = 10.5,
  hoverDelayMs = 700, // 700ms intentional hover focus delay (avoids accidental triggers)
  bottomPauseMs = 2800, // 2.8s pause at bottom
  repeatTopPauseMs = 2500, // 2.5s pause at top before repeating
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTopMask, setShowTopMask] = useState(false);
  const [showBottomMask, setShowBottomMask] = useState(false);
  const [isLocalHovered, setIsLocalHovered] = useState(false);

  // Active hover is true if either the entire card is hovered or the description itself
  const isHovered = isCardHovered || isLocalHovered;

  // Animation state refs (running decoupled from React renders for 60/120fps smoothness)
  const currentYRef = useRef(0);
  const maxScrollRef = useRef(0);
  const phaseRef = useRef<'IDLE' | 'DELAY_START' | 'SCROLLING_DOWN' | 'BOTTOM_PAUSE' | 'SCROLLING_UP'>('IDLE');
  const returnStartTimeRef = useRef<number | null>(null);
  const returnDurationRef = useRef<number>(1.8);
  const returnStartPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const applyTransform = (y: number) => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.style.transform = `translate3d(0, -${y.toFixed(2)}px, 0)`;
    }
    // Update mask states only on boundary crossings
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
      maxScrollRef.current = overflow;
      setShowBottomMask(true);
    } else {
      setIsOverflowing(false);
      maxScrollRef.current = 0;
      currentYRef.current = 0;
      setShowTopMask(false);
      setShowBottomMask(false);
      if (scrollWrapperRef.current) {
        scrollWrapperRef.current.style.transform = 'none';
      }
      phaseRef.current = 'IDLE';
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

  // Handle Hover State Changes
  useEffect(() => {
    if (!isOverflowing || maxScrollRef.current <= 0) {
      return;
    }

    // Clear any pending timers
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }

    if (isHovered) {
      // User hovered over the card!
      // If currently idle at top, wait hoverDelayMs before starting gentle downward glide
      if (scrollWrapperRef.current) {
        scrollWrapperRef.current.style.transition = 'none';
      }

      phaseRef.current = 'DELAY_START';
      timerIdRef.current = setTimeout(() => {
        phaseRef.current = 'SCROLLING_DOWN';
        lastTimeRef.current = performance.now();
      }, hoverDelayMs);

      // Start animation loop
      const animate = (now: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = now;
        }
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
        lastTimeRef.current = now;

        if (phaseRef.current === 'SCROLLING_DOWN') {
          const limit = maxScrollRef.current;
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
            phaseRef.current = 'BOTTOM_PAUSE';
            timerIdRef.current = setTimeout(() => {
              phaseRef.current = 'SCROLLING_UP';
              returnStartTimeRef.current = performance.now();
              returnStartPosRef.current = currentYRef.current;
              returnDurationRef.current = Math.max(1.6, Math.min(2.4, currentYRef.current / 28));
              lastTimeRef.current = performance.now();
            }, bottomPauseMs);
          } else {
            applyTransform(currentYRef.current);
          }
        } else if (phaseRef.current === 'SCROLLING_UP') {
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
            phaseRef.current = 'IDLE';
            timerIdRef.current = setTimeout(() => {
              phaseRef.current = 'SCROLLING_DOWN';
              lastTimeRef.current = performance.now();
            }, repeatTopPauseMs);
          }
        }

        rafIdRef.current = requestAnimationFrame(animate);
      };

      rafIdRef.current = requestAnimationFrame(animate);
    } else {
      // User moved mouse away from card!
      // Cancel RAF immediately and smoothly return text to top via CSS transition
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      phaseRef.current = 'IDLE';

      if (currentYRef.current > 0) {
        if (scrollWrapperRef.current) {
          scrollWrapperRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
          scrollWrapperRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
        currentYRef.current = 0;
        setShowTopMask(false);
        setShowBottomMask(true);
      }
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [isHovered, isOverflowing, speed, hoverDelayMs, bottomPauseMs, repeatTopPauseMs]);

  // Support manual mouse wheel scrolling when hovering
  const handleWheel = (e: React.WheelEvent) => {
    if (!isOverflowing || maxScrollRef.current <= 0) return;
    e.stopPropagation();
    
    // Smooth manual scrub
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.style.transition = 'none';
    }
    const delta = e.deltaY;
    const newY = Math.min(maxScrollRef.current, Math.max(0, currentYRef.current + delta * 0.35));
    currentYRef.current = newY;
    applyTransform(newY);

    if (newY >= maxScrollRef.current) {
      phaseRef.current = 'BOTTOM_PAUSE';
    } else if (newY <= 0) {
      phaseRef.current = 'IDLE';
    } else {
      phaseRef.current = delta > 0 ? 'SCROLLING_DOWN' : 'SCROLLING_UP';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsLocalHovered(true)}
      onMouseLeave={() => setIsLocalHovered(false)}
      onWheel={handleWheel}
      className={`relative h-[4.25rem] overflow-hidden select-text group/desc cursor-default ${className}`}
      title={text}
    >
      {/* Scrollable text container */}
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
          className={`absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-b from-white via-white/85 to-transparent pointer-events-none transition-opacity duration-300 ${
            showTopMask ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Subtle bottom fade mask when more text is available below */}
      {isOverflowing && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none transition-opacity duration-300 ${
            showBottomMask ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
