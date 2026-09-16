import React from 'react';
import { ExternalLink as ExternalLinkIcon, GraduationCap, School, CloudSun } from 'lucide-react';
import { ExternalLink } from '../config/apps';
import { SpotlightCard } from './ui/spotlight-card';

interface ExternalLinksProps {
  links: ExternalLink[];
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'GraduationCap': return GraduationCap;
    case 'School': return School;
    case 'CloudSun': return CloudSun;
    default: return School;
  }
};

export const ExternalLinks: React.FC<ExternalLinksProps> = ({ links }) => {
  return (
    <div className="mt-12 sm:mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue px-3 py-1 bg-hbs-blue-soft rounded-full border border-hbs-blue/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
            Zentrale Schulsysteme
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight mt-2">
            Offizielle Portale & Plattformen
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-medium text-hbs-slate-muted">
          Direkter Schnellzugriff auf externe Schulportale des Landes Thüringen und EduPage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {links.map((item) => {
          const Icon = getIconComponent(item.icon);
          return (
            <SpotlightCard
              key={item.id}
              spotlightColor="rgba(11, 123, 167, 0.06)"
              className="p-6 sm:p-7 group hover:border-hbs-blue/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-hbs-blue-soft text-hbs-blue-deep p-2.5 flex items-center justify-center border border-hbs-blue/15 group-hover:scale-105 transition-transform duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-hbs-slate-muted bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-hbs-slate-dark group-hover:text-hbs-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-bold text-hbs-blue mt-0.5">
                  {item.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-hbs-slate-muted mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-hbs-blue-soft/70 hover:bg-hbs-blue hover:text-white border border-hbs-blue/20 text-xs sm:text-sm font-bold text-hbs-blue-deep flex items-center justify-between transition-all duration-150 active:scale-[0.98] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] select-none"
                >
                  <span>Portal öffnen</span>
                  <ExternalLinkIcon className="w-4 h-4 opacity-80" />
                </a>
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};
