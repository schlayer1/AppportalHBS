import React, { useState } from 'react';
import { 
  Search, 
  Check, 
  ExternalLink, 
  Copy, 
  RotateCcw, 
  Youtube,
  Tv,
  QrCode,
  BookOpen,
  Atom,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QuickSearchCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  topics: { label: string; query: string }[];
}

const EDUCATIONAL_SEARCH_PRESETS: QuickSearchCategory[] = [
  {
    category: 'MINT & Naturwissenschaften',
    icon: Atom,
    topics: [
      { label: 'Physik Experimente', query: 'Physik Experimente Schule Schülerversuche' },
      { label: 'Wasserkreislauf', query: 'Wasserkreislauf Grundschule Erklärung' },
      { label: 'Photosynthese', query: 'Photosynthese einfach erklärt' },
      { label: 'Satz des Pythagoras', query: 'Satz des Pythagoras einfach erklärt' },
      { label: 'Chemie Schauversuche', query: 'Chemie Experimente Schule erstaunlich' }
    ]
  },
  {
    category: 'Gesellschaft & Geschichte',
    icon: Globe,
    topics: [
      { label: 'Römisches Reich', query: 'Römisches Reich Doku Schule' },
      { label: 'Mauerfall 1989', query: 'Mauerfall 1989 DDR Wende Doku' },
      { label: 'Demokratie & Wahlen', query: 'Demokratie einfach erklärt Jugendliche' },
      { label: 'Klimawandel erklärt', query: 'Klimawandel Ursachen Folgen Schule' },
      { label: 'Logo! Nachrichten', query: 'logo ZDF Kindernachrichten aktuell' }
    ]
  },
  {
    category: 'Beliebte Bildungskanäle',
    icon: Tv,
    topics: [
      { label: 'Terra X Doku', query: 'Terra X ZDF Geschichte Natur' },
      { label: 'MrWissen2go', query: 'MrWissen2go Geschichte Politik' },
      { label: 'Sendung mit der Maus', query: 'Sendung mit der Maus Sachgeschichten' },
      { label: 'Kurzgesagt DE', query: 'Kurzgesagt Dinge erklärt deutsch' },
      { label: 'Simpleclub', query: 'Simpleclub Schule Zusammenfassung' }
    ]
  },
  {
    category: 'Heimbürgeschule & Region',
    icon: School,
    topics: [
      { label: 'Heimbürgeschule Kahla', query: 'Heimbürgeschule Kahla' },
      { label: 'Leuchtenburg Kahla', query: 'Leuchtenburg Kahla Thüringen Geschichte' },
      { label: 'Saaletal Thüringen', query: 'Saaletal Thüringen Natur und Kultur' }
    ]
  }
];

function School({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}

export const VideoWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'qr'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('Physik Experimente Schule');
  const [currentQuery, setCurrentQuery] = useState<string>('Physik Experimente Schule');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [embedSrc, setEmbedSrc] = useState<string>(
    'https://www.youtube-nocookie.com/embed?listType=search&list=Physik+Experimente+Schule&autoplay=0&rel=0&modestbranding=1'
  );
  const [isSearchMode, setIsSearchMode] = useState<boolean>(true);
  const [showSearchDrawer, setShowSearchDrawer] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [copied, setCopied] = useState<boolean>(false);

  // Parse YouTube video ID from various URL formats
  const parseYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle Search Submission
  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (customQuery || searchQuery).trim();
    if (!queryToUse) return;

    // If the query is actually a URL, auto-switch to URL mode
    if (/^https?:\/\//i.test(queryToUse) || queryToUse.includes('youtu')) {
      handleUrlSubmit(undefined, queryToUse);
      return;
    }

    setCurrentQuery(queryToUse);
    setSearchQuery(queryToUse);
    setIsSearchMode(true);
    setCurrentVideoUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(queryToUse)}`);
    setEmbedSrc(
      `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(queryToUse)}&autoplay=0&rel=0&modestbranding=1`
    );
    setIframeKey(Date.now());
    setShowSearchDrawer(false);
  };

  // Handle Direct URL Submission
  const handleUrlSubmit = (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const urlToUse = (customUrl || videoUrlInput).trim();
    if (!urlToUse) return;

    const ytId = parseYouTubeId(urlToUse);
    if (ytId) {
      setIsSearchMode(false);
      setCurrentVideoUrl(`https://www.youtube.com/watch?v=${ytId}`);
      setEmbedSrc(`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1`);
    } else {
      setIsSearchMode(false);
      setCurrentVideoUrl(urlToUse);
      setEmbedSrc(urlToUse);
    }
    setIframeKey(Date.now());
    setShowSearchDrawer(false);
  };

  const handleCopyCurrentLink = () => {
    const url = isSearchMode 
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuery)}`
      : currentVideoUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenOnYouTube = () => {
    const url = isSearchMode 
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuery)}`
      : currentVideoUrl || 'https://www.youtube.com';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between min-h-0 relative">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 pb-2 mb-1.5 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Youtube className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-hbs-slate-dark truncate block">
              {isSearchMode ? `Suche: "${currentQuery}"` : 'Unterrichts-Video'}
            </span>
          </div>
        </div>

        {/* Action Button Pills */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowSearchDrawer(!showSearchDrawer)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs ${
              showSearchDrawer
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white/80 hover:bg-white text-hbs-slate-dark border-white'
            }`}
            title="Video oder Thema auf YouTube suchen"
          >
            <Search className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Suche</span>
          </button>

          <button
            onClick={handleReload}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95"
            title="Video neu laden"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCurrentLink}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-slate-dark border border-white/80 transition-all active:scale-95"
            title="YouTube-Link kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleOpenOnYouTube}
            className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-red-600 border border-white/80 transition-all active:scale-95"
            title="Auf YouTube im neuen Tab öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Search & URL Drawer */}
      {showSearchDrawer && (
        <div className="absolute top-11 inset-x-1 bottom-1 z-30 p-3 bg-white/95 rounded-2xl border border-white shadow-2xl backdrop-blur-md flex flex-col gap-2.5 animate-fadeIn overflow-y-auto">
          {/* Tabs: Suche vs. Direkter Link vs. Schüler-QR */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'search'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-hbs-slate-dark hover:bg-white'
                }`}
              >
                🔍 YouTube-Suche
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'url'
                    ? 'bg-hbs-blue text-white shadow-xs'
                    : 'text-hbs-slate-dark hover:bg-white'
                }`}
              >
                🔗 Direkt-Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'qr'
                    ? 'bg-hbs-teal-deep text-white shadow-xs'
                    : 'text-hbs-slate-dark hover:bg-white'
                }`}
              >
                📱 Schüler-QR
              </button>
            </div>

            <button
              onClick={() => setShowSearchDrawer(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-100"
            >
              Schließen ✕
            </button>
          </div>

          {/* TAB 1: YOUTUBE SEARCH */}
          {activeTab === 'search' && (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-red-500/30 focus-within:bg-white">
                  <Search className="w-4 h-4 text-red-600 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Thema auf YouTube suchen (z. B. Photosynthese, Römisches Reich)..."
                    className="flex-1 bg-transparent text-xs font-bold text-hbs-slate-dark placeholder:text-hbs-slate-muted focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Suchen</span>
                </button>
              </form>

              {/* Presets by Topic */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <span className="text-[10px] font-black uppercase text-hbs-slate-muted tracking-wider block">
                  Unterrichts-Themen & Bildungskanäle:
                </span>
                {EDUCATIONAL_SEARCH_PRESETS.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-hbs-slate-dark">
                        <Icon className="w-3.5 h-3.5 text-red-600" />
                        <span>{cat.category}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.topics.map((t) => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => handleSearchSubmit(undefined, t.query)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200/80 text-xs font-bold text-hbs-slate-dark transition-all active:scale-95 shadow-2xs"
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT URL INPUT */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-3 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <div>
                <label className="text-xs font-bold text-hbs-slate-dark block mb-1">
                  YouTube-Link oder Video-Adresse einfügen:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... oder youtu.be/..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                  >
                    Laden
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-hbs-slate-muted leading-relaxed">
                Unterstützt normale YouTube-Links, YouTube Shorts, Mobil-Links (`youtu.be`) sowie datenschutzfreundliche Einbettungen ohne Werbetracking (`youtube-nocookie.com`).
              </p>
            </form>
          )}

          {/* TAB 3: STUDENT QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 text-center sm:text-left">
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-md shrink-0">
                <QRCodeSVG
                  value={
                    isSearchMode
                      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuery)}`
                      : currentVideoUrl || 'https://www.youtube.com'
                  }
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="max-w-xs space-y-1.5">
                <span className="text-xs font-black text-hbs-slate-dark flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-red-600" />
                  <span>Video auf Schüler-Geräten öffnen</span>
                </span>
                <p className="text-[11px] text-hbs-slate-muted leading-relaxed">
                  Schülerinnen und Schüler können den QR-Code mit dem iPad oder Smartphone von der Tafel scannen, um das Video oder die Suchergebnisse direkt auf ihrem Gerät anzuschauen.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Video Viewport */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-black border-2 border-white shadow-inner min-h-0 relative">
        <iframe
          key={iframeKey}
          src={embedSrc}
          title="Unterrichts-Video Player"
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};
