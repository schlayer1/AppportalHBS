import React from 'react';
import { ExternalLink, GraduationCap, School, CloudSun, Globe } from 'lucide-react';

const LINKS = [
  {
    name: 'EduPage',
    desc: 'Stundenplan & Vertretung',
    url: 'https://regelschule-kahla.edupage.org/',
    icon: GraduationCap,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
  },
  {
    name: 'Schulcloud (TSC)',
    desc: 'Thüringer Lernplattform',
    url: 'https://schulportal-thueringen.de/thueringer_schulcloud/startseite_thueringer_schulcloud',
    icon: CloudSun,
    color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
  },
  {
    name: 'Schulportal (TSP)',
    desc: 'Offizielles Landesportal',
    url: 'https://schulportal-thueringen.de/start',
    icon: School,
    color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
  },
  {
    name: 'Schulwebsite HBS',
    desc: 'Heimbürgeschule Kahla',
    url: 'https://regelschule-kahla.de',
    icon: Globe,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
  }
];

export const HyperlinkWidget: React.FC = () => {
  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      <div className="pb-2 mb-2 border-b border-white/40">
        <span className="text-xs font-black text-hbs-slate-dark">
          Schnellzugriff auf Schulsysteme
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-auto">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all active:scale-95 shadow-2xs ${link.color}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-5 h-5" />
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div>
                <span className="text-xs font-black block truncate">{link.name}</span>
                <span className="text-[10px] opacity-75 block truncate">{link.desc}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
