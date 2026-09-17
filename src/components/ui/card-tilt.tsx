import React from 'react';
import { cn } from '../../lib/utils';

interface CardTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  maxRotation?: number; // kept for API compatibility
  perspective?: number;
  scale?: number;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * CardTilt: Provides subtle, premium hover elevation without warping coordinates.
 * Dynamic 3D rotation (rotateX/rotateY on mousemove) was previously dropping
 * click events on PC because mouse micro-movements during mousedown/mouseup shifted
 * the button under the cursor and caused browsers to cancel click synthesis.
 */
export const CardTilt: React.FC<CardTiltProps> = ({
  children,
  className,
  disabled = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        !disabled && 'hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
