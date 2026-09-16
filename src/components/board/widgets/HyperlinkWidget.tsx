import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCcw, 
  Copy, 
  Check, 
  Search, 
  GraduationCap, 
  CloudSun, 
  School, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';

interface PresetLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PRESET_LINKS: PresetLink[] = [
  {
    name: 'EduPage HBS',
    url: 'https://regelschule-kahla.edupage.org/',
    icon: GraduationCap,
    color: 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200'
  },
  {
    name: 'Thüringer Schulcloud',
    url: 'https://schulportal-thueringen.de/thueringer_schulcloud/startseite_thueringer_schulcloud',
    icon: CloudSun,
    color: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200'
  },
  {
    name: 'Schulportal TSP',
    url: 'https://schulportal-thueringen.de/start',
    icon: School,
    color: 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border-amber-200'
  },
  {
    name: 'HBS Schulwebsite',
    url: 'https://regelschule-kahla.de',
    icon: Globe,
    color: 'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 border-indigo-200'
  },
  {
    name: 'Wikipedia',
    url: 'https://de.m.wikipedia.org/',
    icon: BookOpen,
    color: 'bg-slate-500/10 text-slate-800 hover:bg-slate-500/20 border-slate-200'
  }
];

export const HyperlinkWidget: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('https://regelschule-kahla.edupage.org/');
  const [inputUrl, setInputUrl] = useState<string>('https://regelschule-kahla.edupage.org/');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [copied, setCopied] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const cleanUrl = (raw: string): string => {
    let trimmed = raw.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleNavigate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = cleanUrl(inputUrl);
    if (sanitized) {
      setCurrentUrl(sanitized);
      setInputUrl(sanitized);
      setIframeKey(Date.now());
    }
  };

  const handleSelectPreset = (url: string) => {
    setCurrentUrl(url);
    setInputUrl(url);
    setIframeKey(Date.now());
    setShowPresets(false);
  };

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  const handleCopyLink = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-1 text-hbs-slate-dark select-none min-h-0">
      {/* Top Navigation & URL Bar */}
      <div className="flex flex-col gap-1.5 pb-2 mb-1.5 border-b border-white/40 shrink-0">
        <form onSubmit={handleNavigate} className="flex items-center gap-1.5 w-full">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 border border-white focus-within:ring-2 focus-within:ring-hbs-blue/30 focus-within:bg-white shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-hbs-blue shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Web-Link eingeben (z. B. edupage.org, wikipedia.org)..."
              className="flex-1 bg-transparent text-xs font-bold text-hbs-slate-dark placeholder:text-hbs-slate-muted/60 focus:outline-none min-w-0"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
            title="Link in Live-Voransicht laden"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laden</span>
          </button>

          {/* Preset Toggler */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className={`p-1.5 rounded-xl border transition-all active:scale-95 shrink-0 ${
              showPresets
                ? 'bg-hbs-blue text-white border-hbs-blue'
                : 'bg-white/70 hover:bg-white text-hbs-slate-dark border-white/80'
            }`}
            title="Schul-Shortcuts anzeigen"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Reload iFrame */}
          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95 shrink-0"
            title="Seite neu laden"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95 shrink-0"
            title="Link kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Open in New Tab */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-blue border border-white/80 transition-all active:scale-95 shrink-0"
            title="Im neuen Tab öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Shortcut Pills (Flyout or Inline) */}
        {showPresets && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/70 rounded-xl border border-white animate-fadeIn">
            <span className="text-[10px] font-black uppercase text-hbs-slate-muted w-full mb-0.5">
              Schnellwahl Heimbürgeschule:
            </span>
            {PRESET_LINKS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${preset.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Live iFrame Viewport */}
      <div className="flex-1 w-full min-h-0 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-inner relative flex flex-col">
        {currentUrl ? (
          <iframe
            key={iframeKey}
            src={currentUrl}
            title="Live Web-Voransicht"
            className="w-full h-full flex-1 border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-hbs-slate-muted">
            <Globe className="w-10 h-10 mb-2 opacity-40 text-hbs-blue" />
            <span className="text-xs font-bold">Kein Link ausgewählt</span>
            <span className="text-[10px] text-hbs-slate-muted/80 mt-0.5">
              Gib oben eine Web-Adresse ein oder wähle einen Schul-Shortcut
            </span>
          </div>
        )}

        {/* Security / X-Frame-Options Information Bar (collapsible) */}
        <div className="absolute bottom-1 right-2 z-20">
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-2 py-0.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-sm transition-all"
            title="Hinweis zu gesperrten Webseiten"
          >
            <Info className="w-3 h-3 text-hbs-amber" />
            <span>Seite lädt nicht?</span>
          </button>
        </div>

        {showHint && (
          <div className="absolute bottom-7 right-2 left-2 z-30 p-2.5 rounded-xl bg-slate-900/90 text-white text-[11px] backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
            <span className="leading-snug">
              Einige Webseiten (z. B. Google-Suche oder bestimmte Login-Portale) verbieten browserseitig die Einbettung in iFrames (X-Frame-Options). Klicke in dem Fall oben rechts auf <span className="font-bold text-hbs-blue">„Im neuen Tab öffnen“ ↗️</span>.
            </span>
            <button
              onClick={() => setShowHint(false)}
              className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold shrink-0"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
