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
  Globe,
  Play,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  EDUCATIONAL_CATEGORIES, 
  findPresetForQuery, 
  PresetCategory, 
  PresetTopic 
} from '../../../data/educationalVideos';

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

export const VideoWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'qr'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('Physik Experimente Schule');
  const [currentQuery, setCurrentQuery] = useState<string>('Physik Experimente Schule');
  
  // Active Video State
  const [activeVideoId, setActiveVideoId] = useState<string>('wHfhvltat9o');
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>(
    '5 Experimente zum Selbermachen - Physik für die Schule'
  );
  const [activeChannel, setActiveChannel] = useState<string>('Techtastisch Experimente');
  
  // Direct URL Input State
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  
  // Search Results
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // UI State
  const [showSearchDrawer, setShowSearchDrawer] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [copied, setCopied] = useState<boolean>(false);

  // Parse YouTube video ID from various URL formats
  const parseYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Perform search (via API or Presets)
  const performSearch = async (query: string, autoPlayFirst: boolean = true) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if input is actually a URL
    const ytIdFromUrl = parseYouTubeId(trimmed);
    if (ytIdFromUrl) {
      playVideo(ytIdFromUrl, 'YouTube Video', 'Eingefügter Link');
      setShowSearchDrawer(false);
      return;
    }

    setCurrentQuery(trimmed);
    setIsSearching(true);
    setSearchError(null);

    // 1. Instant Preset Fallback: If query matches a preset, load it immediately
    const preset = findPresetForQuery(trimmed);
    if (preset && autoPlayFirst) {
      playVideo(preset.defaultVideoId, preset.defaultTitle, preset.channel);
    }

    // 2. Fetch live search results via API
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        const list: VideoResult[] = Array.isArray(data.results) ? data.results : [];
        setSearchResults(list);

        if (list.length > 0) {
          if (autoPlayFirst && (!preset || preset.defaultVideoId === list[0].id)) {
            playVideo(list[0].id, list[0].title, list[0].channel);
          }
        } else if (!preset) {
          setSearchError('Keine Videos gefunden. Versuchen Sie einen anderen Suchbegriff.');
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Live YouTube Search API unreachable, falling back to preset/manual mode:', err);
      if (!preset) {
        setSearchError('Live-Suche vorübergehend nicht erreichbar. Nutzen Sie die Bildungskanäle oder Direktlinks.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Search Form Submit
  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || searchQuery;
    performSearch(q, true);
  };

  // Handle Clicking a Preset Topic
  const handlePresetClick = (topic: PresetTopic) => {
    setSearchQuery(topic.query);
    playVideo(topic.defaultVideoId, topic.defaultTitle, topic.channel);
    // Also perform search in background to fetch related videos
    performSearch(topic.query, false);
    setShowSearchDrawer(false);
  };

  // Handle Direct URL Submission
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = videoUrlInput.trim();
    if (!url) return;

    const ytId = parseYouTubeId(url);
    if (ytId) {
      playVideo(ytId, 'YouTube Video', 'Eingefügter Link');
      setShowSearchDrawer(false);
      setVideoUrlInput('');
    } else {
      setSearchError('Ungültige YouTube-URL. Bitte einen gültigen YouTube-Link eingeben.');
    }
  };

  // Play a specific video ID
  const playVideo = (id: string, title: string, channel: string) => {
    setActiveVideoId(id);
    setActiveVideoTitle(title);
    setActiveChannel(channel);
    setIframeKey(Date.now());
  };

  const handleCopyCurrentLink = () => {
    const url = `https://www.youtube.com/watch?v=${activeVideoId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenOnYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${activeVideoId}`, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  // Render category icon
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom className="w-3.5 h-3.5 text-red-600" />;
      case 'Globe':
        return <Globe className="w-3.5 h-3.5 text-red-600" />;
      case 'Tv':
        return <Tv className="w-3.5 h-3.5 text-red-600" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-3.5 h-3.5 text-red-600" />;
    }
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
            <span className="text-xs font-black text-hbs-slate-dark truncate block leading-tight">
              {activeVideoTitle || 'Unterrichts-Video'}
            </span>
            <span className="text-[10px] text-hbs-slate-muted truncate block">
              {activeChannel ? `${activeChannel}` : `Suche: "${currentQuery}"`}
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
            title="Thema oder Video auf YouTube suchen"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
            ) : (
              <Search className="w-3.5 h-3.5 text-red-600" />
            )}
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
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Suchen</span>
                </button>
              </form>

              {searchError && (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-hbs-slate-muted tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suchtreffer ({searchResults.length} Videos)
                    </span>
                    <span className="text-[10px] text-hbs-slate-muted">Klicken zum Abspielen</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {searchResults.map((v) => {
                      const isPlaying = activeVideoId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            playVideo(v.id, v.title, v.channel);
                            setShowSearchDrawer(false);
                          }}
                          className={`p-1.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all hover:shadow-xs text-left ${
                            isPlaying
                              ? 'bg-red-50 border-red-300 ring-1 ring-red-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="w-16 h-11 rounded-lg bg-black shrink-0 relative overflow-hidden">
                            <img
                              src={v.thumbnail}
                              alt={v.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {v.duration && (
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[9px] font-bold text-white rounded">
                                {v.duration}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-hbs-slate-dark line-clamp-1 block leading-snug">
                              {v.title}
                            </span>
                            <span className="text-[10px] text-hbs-slate-muted truncate block">
                              {v.channel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Presets by Topic */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <span className="text-[10px] font-black uppercase text-hbs-slate-muted tracking-wider block">
                  Unterrichts-Themenkatalog & Bildungskanäle:
                </span>
                {EDUCATIONAL_CATEGORIES.map((cat: PresetCategory) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-hbs-slate-dark">
                      {renderCategoryIcon(cat.iconName)}
                      <span>{cat.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.topics.map((t: PresetTopic) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => handlePresetClick(t)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200/80 text-xs font-bold text-hbs-slate-dark transition-all active:scale-95 shadow-2xs flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 text-red-600 fill-red-600 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
                  value={`https://www.youtube.com/watch?v=${activeVideoId}`}
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
                  Schülerinnen und Schüler können den QR-Code mit dem iPad oder Smartphone von der Tafel scannen, um dieses Video direkt auf ihrem Gerät anzuschauen.
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
          src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
          title={activeVideoTitle || 'Unterrichts-Video Player'}
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};
