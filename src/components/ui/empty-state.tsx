import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-10 sm:p-14 text-center border border-dashed border-hbs-slate-border shadow-hbs-card flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-hbs-blue-soft border border-hbs-blue/15 flex items-center justify-center text-hbs-blue mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-hbs-slate-dark tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-hbs-slate-muted mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all duration-150 active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] flex items-center justify-center"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
