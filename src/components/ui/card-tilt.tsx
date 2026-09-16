import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface CardTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  maxRotation?: number; // max tilt degrees (e.g. 10)
  perspective?: number;
  scale?: number;
  children: React.ReactNode;
  disabled?: boolean;
}

export const CardTilt: React.FC<CardTiltProps> = ({
  maxRotation = 8,
  perspective = 1000,
  scale = 1.02,
  children,
  className,
  disabled = false,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const rotateX = ((mouseY / height) * 2 - 1) * -maxRotation;
      const rotateY = ((mouseX / width) * 2 - 1) * maxRotation;

      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`,
        transition: 'transform 0.1s ease-out',
      });
    },
    [disabled, maxRotation, perspective, scale]
  );

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
    });
  }, [disabled, perspective]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      className={cn('will-change-transform', className)}
      {...props}
    >
      {children}
    </div>
  );
};
