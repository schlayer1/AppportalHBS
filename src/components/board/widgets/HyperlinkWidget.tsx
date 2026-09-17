import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  Info,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Maximize2,
  Calculator,
  Compass,
  HeartHandshake,
  Layers,
  MapPin,
  HelpCircle,
  Atom,
  FlaskConical,
  Boxes,
  Telescope,
  Wind,
  Zap
} from 'lucide-react';

export type DisplayMode = 'live' | 'preview' | 'wiki';

interface PresetLink {
  name: string;
  url: string;
  category: 'schule' | 'tools' | 'wissen';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  recommendedMode?: DisplayMode;
}

const PRESET_LINKS: PresetLink[] = [
  // Schulsysteme Heimbürgeschule
  {
    name: 'EduPage HBS',
    url: 'https://regelschule-kahla.edupage.org/',
    category: 'schule',
    icon: GraduationCap,
    color: 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 border-emerald-200',
    recommendedMode: 'preview'
  },
  {
    name: 'Thüringer Schulcloud',
    url: 'https://schulportal-thueringen.de/thueringer_schulcloud/startseite_thueringer_schulcloud',
    category: 'schule',
    icon: CloudSun,
    color: 'bg-blue-500/10 text-blue-800 hover:bg-blue-500/20 border-blue-200',
    recommendedMode: 'preview'
  },
  {
    name: 'Schulportal TSP',
    url: 'https://schulportal-thueringen.de/start',
    category: 'schule',
    icon: School,
    color: 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border-amber-200',
    recommendedMode: 'preview'
  },
  {
    name: 'HBS Schulwebsite',
    url: 'https://regelschule-kahla.de',
    category: 'schule',
    icon: Globe,
    color: 'bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/20 border-indigo-200',
    recommendedMode: 'live'
  },
  {
    name: 'Eltern-Mitmachbogen',
    url: 'https://schlayer1.github.io/Mitmachbogen/',
    category: 'schule',
    icon: HeartHandshake,
    color: 'bg-teal-500/10 text-teal-800 hover:bg-teal-500/20 border-teal-200',
    recommendedMode: 'live'
  },
  {
    name: 'Projektkompass',
    url: 'https://schlayer1.github.io/Projektkompass/',
    category: 'schule',
    icon: Compass,
    color: 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border-amber-200',
    recommendedMode: 'live'
  },

  // Interaktive Live-Unterrichtstools (100% Einbettbar)
  {
    name: 'PhET Stromkreis-Labor',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
    category: 'tools',
    icon: Atom,
    color: 'bg-orange-500/10 text-orange-800 hover:bg-orange-500/20 border-orange-200',
    recommendedMode: 'live'
  },
  {
    name: 'Ptable Periodensystem',
    url: 'https://ptable.com/?lang=de',
    category: 'tools',
    icon: FlaskConical,
    color: 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border-amber-200',
    recommendedMode: 'live'
  },
  {
    name: 'LEIFIphysik Portal',
    url: 'https://www.leifiphysik.de/',
    category: 'tools',
    icon: Zap,
    color: 'bg-blue-500/10 text-blue-800 hover:bg-blue-500/20 border-blue-200',
    recommendedMode: 'live'
  },
  {
    name: 'MolView 3D-Chemie',
    url: 'https://molview.org/',
    category: 'tools',
    icon: Boxes,
    color: 'bg-teal-500/10 text-teal-800 hover:bg-teal-500/20 border-teal-200',
    recommendedMode: 'live'
  },
  {
    name: 'Stellarium 3D-Planetarium',
    url: 'https://stellarium-web.org/',
    category: 'tools',
    icon: Telescope,
    color: 'bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/20 border-indigo-200',
    recommendedMode: 'live'
  },
  {
    name: 'Windy Wetter & Strömung',
    url: 'https://www.windy.com/',
    category: 'tools',
    icon: Wind,
    color: 'bg-sky-500/10 text-sky-800 hover:bg-sky-500/20 border-sky-200',
    recommendedMode: 'live'
  },
  {
    name: 'GeoGebra Rechner',
    url: 'https://www.geogebra.org/calculator?embed',
    category: 'tools',
    icon: Calculator,
    color: 'bg-purple-500/10 text-purple-800 hover:bg-purple-500/20 border-purple-200',
    recommendedMode: 'live'
  },
  {
    name: 'LearningApps',
    url: 'https://learningapps.org/',
    category: 'tools',
    icon: Layers,
    color: 'bg-sky-500/10 text-sky-800 hover:bg-sky-500/20 border-sky-200',
    recommendedMode: 'live'
  },
  {
    name: 'OpenStreetMap Karte',
    url: 'https://www.openstreetmap.org/export/embed.html?bbox=11.55%2C50.78%2C11.65%2C50.82&layer=mapnik',
    category: 'tools',
    icon: MapPin,
    color: 'bg-green-500/10 text-green-800 hover:bg-green-500/20 border-green-200',
    recommendedMode: 'live'
  },

  // Wissensrecherche & Wikipedia
  {
    name: 'Wikipedia Kahla',
    url: 'https://de.wikipedia.org/wiki/Kahla',
    category: 'wissen',
    icon: BookOpen,
    color: 'bg-slate-600/10 text-slate-800 hover:bg-slate-600/20 border-slate-200',
    recommendedMode: 'wiki'
  },
  {
    name: 'Wikipedia Einstein',
    url: 'https://de.wikipedia.org/wiki/Albert_Einstein',
    category: 'wissen',
    icon: BookOpen,
    color: 'bg-slate-600/10 text-slate-800 hover:bg-slate-600/20 border-slate-200',
    recommendedMode: 'wiki'
  }
];

// Domains that block iframes via X-Frame-Options or frame-ancestors
const KNOWN_PROTECTED_DOMAINS = [
  'edupage.org',
  'schulportal-thueringen.de',
  'google.com',
  'google.de',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'github.com',
  'spiegel.de',
  'zeit.de'
];

interface WikiData {
  title: string;
  description?: string;
  extract?: string;
  thumbnailUrl?: string;
  pageUrl?: string;
}

export const HyperlinkWidget: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('https://regelschule-kahla.de');
  const [inputUrl, setInputUrl] = useState<string>('https://regelschule-kahla.de');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('live');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [copied, setCopied] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [presetTab, setPresetTab] = useState<'schule' | 'tools' | 'wissen'>('schule');

  // Wikipedia Mode State
  const [wikiSearchTerm, setWikiSearchTerm] = useState<string>('Kahla');
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [wikiLoading, setWikiLoading] = useState<boolean>(false);
  const [wikiError, setWikiError] = useState<string | null>(null);

  // Helper: Sanitize & Auto-Convert Embed URLs (YouTube, GeoGebra, etc.)
  const optimizeUrl = (raw: string): { url: string; modeHint?: DisplayMode } => {
    let trimmed = raw.trim();
    if (!trimmed) return { url: '' };

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);

      // YouTube Converter
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let videoId = '';
        if (parsed.hostname.includes('youtu.be')) {
          videoId = parsed.pathname.slice(1);
        } else if (parsed.pathname.includes('/watch')) {
          videoId = parsed.searchParams.get('v') || '';
        } else if (parsed.pathname.includes('/shorts/')) {
          videoId = parsed.pathname.split('/shorts/')[1] || '';
        }
        if (videoId) {
          return {
            url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
            modeHint: 'live'
          };
        }
      }

      // GeoGebra Converter
      if (parsed.hostname.includes('geogebra.org')) {
        if (!parsed.searchParams.has('embed')) {
          parsed.searchParams.set('embed', 'true');
          return { url: parsed.toString(), modeHint: 'live' };
        }
      }

      // Wikipedia Converter
      if (parsed.hostname.includes('wikipedia.org')) {
        const parts = parsed.pathname.split('/wiki/');
        if (parts[1]) {
          return { url: trimmed, modeHint: 'wiki' };
        }
      }

      // Protected Domains Check
      const isProtected = KNOWN_PROTECTED_DOMAINS.some(d => parsed.hostname.toLowerCase().includes(d));
      if (isProtected) {
        return { url: trimmed, modeHint: 'preview' };
      }

      return { url: trimmed };
    } catch {
      return { url: trimmed };
    }
  };

  // Check if current domain is known to be protected
  const isProtectedDomain = (url: string): boolean => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return KNOWN_PROTECTED_DOMAINS.some(d => hostname.includes(d));
    } catch {
      return false;
    }
  };

  // Fetch Wikipedia Article Summary
  const fetchWiki = async (term: string) => {
    if (!term.trim()) return;
    setWikiLoading(true);
    setWikiError(null);
    try {
      // Decode title if part of a URL
      let cleanTerm = term.trim();
      if (cleanTerm.includes('/wiki/')) {
        cleanTerm = cleanTerm.split('/wiki/')[1];
      }
      cleanTerm = decodeURIComponent(cleanTerm).replace(/_/g, ' ');

      const res = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm.replace(/ /g, '_'))}`);
      if (!res.ok) {
        throw new Error(`Artikel "${cleanTerm}" nicht gefunden.`);
      }
      const data = await res.json();
      setWikiData({
        title: data.title || cleanTerm,
        description: data.description,
        extract: data.extract,
        thumbnailUrl: data.thumbnail?.source,
        pageUrl: data.content_urls?.desktop?.page || `https://de.wikipedia.org/wiki/${encodeURIComponent(cleanTerm)}`
      });
    } catch (err: any) {
      setWikiError(err.message || 'Fehler beim Laden von Wikipedia');
    } finally {
      setWikiLoading(false);
    }
  };

  // If entering wiki mode with a wikipedia URL, auto-fetch
  useEffect(() => {
    if (displayMode === 'wiki') {
      if (currentUrl.includes('wikipedia.org/wiki/')) {
        const topic = currentUrl.split('/wiki/')[1];
        if (topic) {
          fetchWiki(topic);
        }
      } else if (!wikiData && !wikiLoading) {
        fetchWiki(wikiSearchTerm);
      }
    }
  }, [displayMode, currentUrl]);

  // Navigate Handler
  const handleNavigate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { url, modeHint } = optimizeUrl(inputUrl);
    if (url) {
      setCurrentUrl(url);
      setInputUrl(url);
      setIframeKey(Date.now());
      if (modeHint) {
        setDisplayMode(modeHint);
      } else if (displayMode === 'wiki' && !url.includes('wikipedia.org')) {
        setDisplayMode('live');
      }
    }
  };

  // Select Preset Handler
  const handleSelectPreset = (preset: PresetLink) => {
    setCurrentUrl(preset.url);
    setInputUrl(preset.url);
    setIframeKey(Date.now());
    if (preset.recommendedMode) {
      setDisplayMode(preset.recommendedMode);
    }
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

  const handleOpenPopoutWindow = () => {
    if (currentUrl) {
      const width = 1120;
      const height = 760;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);
      window.open(
        currentUrl,
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
    }
  };

  // Extract friendly domain name for UI
  const getDomainName = (rawUrl: string): string => {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./, '');
    } catch {
      return rawUrl;
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-1 text-hbs-slate-dark select-none min-h-0">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col gap-1.5 pb-2 mb-1.5 border-b border-white/40 shrink-0">
        
        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-between gap-1 w-full">
          <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-xl border border-white/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setDisplayMode('live')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                displayMode === 'live'
                  ? 'bg-hbs-blue text-white shadow-xs'
                  : 'text-hbs-slate-dark hover:bg-white/80'
              }`}
              title="Live-Webseite im Tafel-Fenster anzeigen"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live-Web</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                displayMode === 'preview'
                  ? 'bg-hbs-teal-deep text-white shadow-xs'
                  : 'text-hbs-slate-dark hover:bg-white/80'
              }`}
              title="Sichere Vorschaukarte & Schüler-QR-Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Vorschau & Schüler-QR</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('wiki')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                displayMode === 'wiki'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-hbs-slate-dark hover:bg-white/80'
              }`}
              title="Wikipedia Wissens-Lexikon direkt auf der Tafel"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lexikon</span>
            </button>
          </div>

          {/* Preset Launcher Button */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs ${
              showPresets
                ? 'bg-hbs-amber text-white border-amber-500'
                : 'bg-white/80 hover:bg-white text-hbs-slate-dark border-white'
            }`}
            title="Schul-Shortcuts & Werkzeuge wählen"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Schnellwahl</span>
          </button>
        </div>

        {/* URL Input Form & Action Buttons */}
        <form onSubmit={handleNavigate} className="flex items-center gap-1.5 w-full">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/85 border border-white focus-within:ring-2 focus-within:ring-hbs-blue/30 focus-within:bg-white shadow-2xs min-w-0">
            <Globe className="w-3.5 h-3.5 text-hbs-blue shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Web-Link eingeben (z. B. learningapps.org, edupage.org, wikipedia.org)..."
              className="flex-1 bg-transparent text-xs font-bold text-hbs-slate-dark placeholder:text-hbs-slate-muted/60 focus:outline-none min-w-0"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
            title="Link laden"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Laden</span>
          </button>

          {/* Popout Separate Window */}
          <button
            type="button"
            onClick={handleOpenPopoutWindow}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-blue-deep border border-white/80 transition-all active:scale-95 shrink-0"
            title="In separatem Tafel-Schwebefenster öffnen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reload Frame */}
          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95 shrink-0"
            title="Seite neu laden"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95 shrink-0"
            title="Link kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* External Tab */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-blue border border-white/80 transition-all active:scale-95 shrink-0"
            title="Im neuen Tab öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Schnellwahl Flyout Panel */}
        {showPresets && (
          <div className="flex flex-col gap-2 p-2.5 bg-white/95 rounded-2xl border border-white shadow-xl animate-fadeIn z-30">
            {/* Category Sub-tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <button
                type="button"
                onClick={() => setPresetTab('schule')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  presetTab === 'schule'
                    ? 'bg-hbs-teal-deep text-white shadow-2xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100'
                }`}
              >
                🏫 HBS Schulportale
              </button>
              <button
                type="button"
                onClick={() => setPresetTab('tools')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  presetTab === 'tools'
                    ? 'bg-hbs-blue text-white shadow-2xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100'
                }`}
              >
                🎯 Live-Unterrichtstools
              </button>
              <button
                type="button"
                onClick={() => setPresetTab('wissen')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  presetTab === 'wissen'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100'
                }`}
              >
                📚 Wissen & Wikipedia
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESET_LINKS.filter(p => p.category === presetTab).map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-2xs text-left ${preset.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Viewport depending on DisplayMode */}
      <div className="flex-1 w-full min-h-0 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-inner relative flex flex-col">
        
        {/* MODE 1: LIVE IFRAME */}
        {displayMode === 'live' && (
          <div className="w-full h-full flex flex-col relative">
            {/* Protective Hint if domain blocks X-Frame-Options */}
            {isProtectedDomain(currentUrl) && (
              <div className="bg-amber-500/10 border-b border-amber-300/60 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 truncate">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">
                    Hinweis: {getDomainName(currentUrl)} blockiert browserseitig Fremd-Frames (X-Frame-Options).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDisplayMode('preview')}
                  className="px-2 py-0.5 rounded-lg bg-amber-600 text-white text-[10px] font-black shrink-0 hover:bg-amber-700 shadow-2xs"
                >
                  Zu Vorschau & QR wechseln ↗
                </button>
              </div>
            )}

            {currentUrl ? (
              <iframe
                key={iframeKey}
                src={currentUrl}
                title="Live Web-Voransicht"
                style={{ width: '100%', height: '100%', flex: '1 1 0%' }}
                className="border-0 bg-white"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-hbs-slate-muted">
                <Globe className="w-10 h-10 mb-2 opacity-40 text-hbs-blue" />
                <span className="text-xs font-bold">Keine Webseite geladen</span>
                <span className="text-[10px] text-hbs-slate-muted/80 mt-0.5">
                  Gib oben eine Adresse ein oder nutze die Schnellwahl
                </span>
              </div>
            )}

            {/* Quick-Help Button for X-Frame-Options in Bottom Corner */}
            <div className="absolute bottom-2 right-2 z-20">
              <button
                onClick={() => setDisplayMode('preview')}
                className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all active:scale-95"
                title="Sicherheits-Cockpit & Schüler-QR öffnen"
              >
                <QrCode className="w-3.5 h-3.5 text-hbs-amber" />
                <span>Schüler-QR & Cockpit</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: BEAMER-COCKPIT & SCHÜLER-QR */}
        {displayMode === 'preview' && (
          <div className="w-full h-full flex flex-col p-4 bg-gradient-to-b from-slate-50 to-white overflow-y-auto">
            {/* Header Status Card */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-hbs-teal-deep/10 text-hbs-teal-deep border border-hbs-teal-deep/20 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-hbs-slate-dark truncate">
                      {getDomainName(currentUrl)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SSL-Geschützt</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-hbs-slate-muted truncate mt-0.5">
                    {currentUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold transition-all active:scale-95"
                  title="Link kopieren"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Explanation why some sites use Cockpit Mode */}
            {isProtectedDomain(currentUrl) && (
              <div className="mb-3.5 p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-hbs-blue shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-snug">
                  <strong className="font-black">Sicherheitsportal:</strong> Dieses Schulportal (z. B. EduPage/TSP) schützt Ihre Zugangsdaten und blockiert Fremd-Einbettungen. Starten Sie es einfach mit einem Klick in einem separaten Tafel-Fenster oder lassen Sie Schüler mitarbeiten.
                </p>
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={handleOpenPopoutWindow}
                className="px-4 py-3 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Im separaten Tafel-Fenster öffnen</span>
              </button>

              <button
                type="button"
                onClick={handleOpenExternal}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4 text-hbs-blue" />
                <span>Im neuen Browser-Tab öffnen</span>
              </button>
            </div>

            {/* QR Code Section for Classroom / Students */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-md shrink-0">
                <QRCodeSVG
                  value={currentUrl || 'https://regelschule-kahla.de'}
                  size={150}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <span className="text-xs font-black text-hbs-slate-dark flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-hbs-teal-deep" />
                  <span>Schüler-QR-Code für den Unterricht</span>
                </span>
                <p className="text-[11px] text-hbs-slate-muted mt-1 leading-relaxed max-w-xs">
                  Schülerinnen und Schüler können diesen QR-Code mit ihren iPads oder Smartphones an der Tafel scannen, um die Seite zeitgleich im Unterricht aufzurufen.
                </p>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('live')}
                    className="text-[11px] font-bold text-hbs-blue hover:underline"
                  >
                    Trotzdem im iFrame versuchen 🌐
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: WIKIPEDIA WISSENS-LEXIKON */}
        {displayMode === 'wiki' && (
          <div className="w-full h-full flex flex-col p-4 bg-gradient-to-b from-amber-500/5 to-white overflow-y-auto">
            {/* Search Bar for Wikipedia */}
            <div className="flex items-center gap-1.5 mb-3.5">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
                <input
                  type="text"
                  value={wikiSearchTerm}
                  onChange={(e) => setWikiSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchWiki(wikiSearchTerm);
                  }}
                  placeholder="Wikipedia-Thema suchen (z. B. Kahla, Einstein, Photosynthese)..."
                  className="flex-1 text-xs font-bold text-hbs-slate-dark focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchWiki(wikiSearchTerm)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Nachschlagen</span>
              </button>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
              <span className="text-[10px] font-black uppercase text-hbs-slate-muted shrink-0">
                Beliebt:
              </span>
              {['Kahla', 'Albert Einstein', 'Photosynthese', 'Römisches Reich', 'Wasserkreislauf'].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setWikiSearchTerm(topic);
                    fetchWiki(topic);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-200/70 text-[11px] font-bold shrink-0 transition-all active:scale-95 shadow-2xs"
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Content Area */}
            {wikiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-hbs-slate-muted">
                <RotateCcw className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                <span className="text-xs font-bold">Wikipedia-Artikel wird geladen...</span>
              </div>
            ) : wikiError ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <HelpCircle className="w-8 h-8 text-amber-600 mb-2" />
                <span className="text-xs font-bold text-hbs-slate-dark mb-1">{wikiError}</span>
                <span className="text-[11px] text-hbs-slate-muted max-w-sm">
                  Probiere einen anderen Suchbegriff oder öffne Wikipedia im Live-Web.
                </span>
              </div>
            ) : wikiData ? (
              <div className="flex-1 flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-hbs-slate-dark">
                        {wikiData.title}
                      </h2>
                      {wikiData.description && (
                        <p className="text-xs font-semibold text-amber-800 mt-0.5">
                          {wikiData.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(wikiData.pageUrl, '_blank')}
                      className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-2xs"
                    >
                      <span>Vollansicht</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
                    {wikiData.thumbnailUrl && (
                      <img
                        src={wikiData.thumbnailUrl}
                        alt={wikiData.title}
                        className="w-28 h-auto max-h-36 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0 self-center sm:self-start"
                      />
                    )}
                    <p className="text-xs text-hbs-slate-dark leading-relaxed">
                      {wikiData.extract}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-hbs-slate-muted">
                <BookOpen className="w-8 h-8 text-amber-600/40 mb-2" />
                <span className="text-xs font-bold">Wissens-Lexikon bereit</span>
                <span className="text-[10px] text-hbs-slate-muted mt-0.5">
                  Gib oben ein beliebiges Thema ein
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
