import React from 'react';
import { LogOut, Smartphone, Search, X, Sparkles } from 'lucide-react';
import { PORTAL_CONFIG } from '../config/apps';

interface HeaderProps {
  onLogout: () => void;
  onOpenInstallGuide: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  appCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLogout,
  onOpenInstallGuide,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  appCount
}) => {
  return (
    <header className="bg-white border-b border-hbs-slate-border/70 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-hbs-blue-soft p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0">
              <img 
                src="/Siegel_bunt.png" 
                alt="Heimbürgeschule Wappen" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue truncate">
                  {PORTAL_CONFIG.schoolName}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal bg-hbs-teal-light px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Kollegiumshub
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight leading-tight truncate">
                {PORTAL_CONFIG.portalTitle}
              </h1>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA / Homescreen button */}
            <button
              onClick={onOpenInstallGuide}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-hbs-blue-soft text-hbs-blue-deep hover:bg-hbs-blue-light border border-hbs-blue/20 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow"
              title="Anleitung: Als App auf iPad oder Smartphone ablegen"
            >
              <Smartphone className="w-4 h-4 text-hbs-blue shrink-0" />
              <span className="hidden sm:inline">Als App installieren</span>
              <span className="sm:hidden">PWA</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl text-hbs-slate-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
              title="Portal sperren / Abmelden"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Sub-Bar */}
        <div className="pb-4 pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-hbs-blue text-white shadow-xs'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue'
              }`}
            >
              Alle Apps ({appCount})
            </button>
            <button
              onClick={() => setSelectedCategory('kollegium')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'kollegium'
                  ? 'bg-hbs-blue text-white shadow-xs'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue'
              }`}
            >
              ☕ Lehrerzimmer & Kollegium
            </button>
            <button
              onClick={() => setSelectedCategory('unterricht')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'unterricht'
                  ? 'bg-hbs-blue text-white shadow-xs'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue'
              }`}
            >
              🎒 Unterricht & Schüler
            </button>
            <button
              onClick={() => setSelectedCategory('portale')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'portale'
                  ? 'bg-hbs-blue text-white shadow-xs'
                  : 'bg-hbs-blue-soft/70 text-hbs-slate-muted hover:bg-hbs-blue-soft hover:text-hbs-blue'
              }`}
            >
              🌐 Schul-Portale
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-hbs-slate-light">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="App oder Funktion suchen..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-hbs-bg rounded-xl border border-hbs-slate-border text-hbs-slate-dark placeholder-hbs-slate-light/80 focus:outline-none focus:border-hbs-blue focus:ring-2 focus:ring-hbs-blue/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-hbs-slate-light hover:text-hbs-slate-dark"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
