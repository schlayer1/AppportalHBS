import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'blue' | 'amber' | 'teal' | 'slate' | 'outline' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'blue',
  children,
  ...props
}) => {
  const variants = {
    blue: 'bg-hbs-blue-soft text-hbs-blue-deep border-hbs-blue/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
    amber: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
    teal: 'bg-hbs-teal-light text-hbs-teal-deep border-hbs-teal/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
    slate: 'bg-slate-100 text-hbs-slate-dark border-slate-200',
    outline: 'bg-transparent text-hbs-slate-muted border-hbs-slate-border/80',
    neutral: 'bg-slate-50 text-hbs-slate-muted border-slate-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors select-none tabular-nums',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
