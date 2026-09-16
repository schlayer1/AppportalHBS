import React from 'react';
import { cn } from '../../lib/utils';

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      children,
      className,
      shimmerColor = "rgba(255, 255, 255, 0.35)",
      background = "linear-gradient(to right, #F39200, #E08200)",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative overflow-hidden min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 select-none",
          className
        )}
        style={{ background }}
        {...props}
      >
        {/* Shimmer sweep animation */}
        <span
          className="absolute inset-0 block w-full h-full pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          }}
        />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
