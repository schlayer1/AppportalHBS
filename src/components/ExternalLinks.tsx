import React from 'react';
import { ExternalLink as ExternalLinkIcon, GraduationCap, School, CloudSun } from 'lucide-react';
import { ExternalLink } from '../config/apps';

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
    <div className="mt-10 sm:mt-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight">
            Offizielle Portale & Plattformen
          </h2>
          <p className="text-xs sm:text-sm font-medium text-hbs-slate-muted mt-0.5">
            Direkter Schnellzugriff auf EduPage und die Landesportale Thüringen
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {links.map((item) => {
          const Icon = getIconComponent(item.icon);
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-hbs-blue/50 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden shadow-[inset_0_1px_1px_0_rgba(255,255,255,1)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-hbs-blue-soft text-hbs-blue p-2.5 flex items-center justify-center border border-hbs-blue/15 group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-black text-hbs-slate-dark group-hover:text-hbs-blue transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs font-bold text-hbs-blue truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-hbs-blue group-hover:text-white text-slate-400 flex items-center justify-center transition-all duration-200 shrink-0 border border-slate-200/80 group-hover:border-hbs-blue">
                <ExternalLinkIcon className="w-4 h-4" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
