import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Layers, 
  Sparkles, 
  ChevronRight,
  Music,
  Code,
  BookOpen,
  History,
  GraduationCap,
  Atom,
  FlaskConical,
  Compass,
  Calculator,
  ArrowRight
} from 'lucide-react';

export interface SimulationPreset {
  name: string;
  url: string;
  category: 'lernen' | 'physik' | 'chemie' | 'biologie' | 'mathe' | 'geo' | 'geschichte' | 'sprachen' | 'musik' | 'informatik';
  tag: string;
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  // 1. LERNEN & INTERAKTION (LearningApps etc.)
  {
    name: '🧩 LearningApps.org (Interaktive Übungen)',
    url: 'https://learningapps.org/',
    category: 'lernen',
    tag: 'Übungen'
  },
  {
    name: '🧠 Schlaukopf Schulquiz & Tests',
    url: 'https://www.schlaukopf.de/',
    category: 'lernen',
    tag: 'Quiz'
  },
  {
    name: '⭐ Anton Lernplattform Web',
    url: 'https://anton.app/de/',
    category: 'lernen',
    tag: 'Lernspiele'
  },

  // 2. PHYSIK
  { 
    name: '⚡ PhET Stromkreis-Labor (DC)', 
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
    category: 'physik',
    tag: 'Elektrizität'
  },
  { 
    name: '🛹 PhET Energie-Skatepark', 
    url: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html',
    category: 'physik',
    tag: 'Mechanik'
  },
  { 
    name: '🚗 PhET Kräfte & Bewegung', 
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html',
    category: 'physik',
    tag: 'Newton'
  },
  { 
    name: '🌈 PhET Lichtbrechung & Optik', 
    url: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html',
    category: 'physik',
    tag: 'Optik'
  },
  { 
    name: '〰️ PhET Wellen auf einer Schnur', 
    url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html',
    category: 'physik',
    tag: 'Wellen'
  },
  { 
    name: '📡 LEIFIphysik Aufgaben & Versuche', 
    url: 'https://www.leifiphysik.de/',
    category: 'physik',
    tag: 'Physik-Portal'
  },

  // 3. CHEMIE
  { 
    name: '📊 Ptable Periodensystem (PSE)', 
    url: 'https://ptable.com/?lang=de',
    category: 'chemie',
    tag: 'Elemente'
  },
  { 
    name: '🧊 PhET Aggregatzustände', 
    url: 'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_all.html',
    category: 'chemie',
    tag: 'Teilchen'
  },
  { 
    name: '🔬 PhET Atombau & Isotope', 
    url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html',
    category: 'chemie',
    tag: 'Atome'
  },
  { 
    name: '🧪 PhET pH-Wert & Säuren', 
    url: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_all.html',
    category: 'chemie',
    tag: 'Säuren/Basen'
  },
  { 
    name: '🧬 MolView 3D-Moleküle', 
    url: 'https://molview.org/',
    category: 'chemie',
    tag: '3D-Molekül'
  },

  // 4. BIOLOGIE
  { 
    name: '🐰 PhET Natürliche Selektion', 
    url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html',
    category: 'biologie',
    tag: 'Evolution'
  },
  { 
    name: '🧫 PhET Membrantransport & Zelle', 
    url: 'https://phet.colorado.edu/sims/html/membrane-transport/latest/membrane-transport_all.html',
    category: 'biologie',
    tag: 'Zellbiologie'
  },

  // 5. MATHEMATIK
  { 
    name: '📐 GeoGebra Grafikrechner', 
    url: 'https://www.geogebra.org/calculator?embed',
    category: 'mathe',
    tag: 'Funktionen'
  },
  { 
    name: '📏 GeoGebra Geometrie', 
    url: 'https://www.geogebra.org/geometry?embed',
    category: 'mathe',
    tag: 'Geometrie'
  },
  { 
    name: '📦 GeoGebra 3D-Körper', 
    url: 'https://www.geogebra.org/3d?embed',
    category: 'mathe',
    tag: '3D-Körper'
  },
  { 
    name: '📈 Desmos Wissenschaftlicher Rechner', 
    url: 'https://www.desmos.com/calculator?embed',
    category: 'mathe',
    tag: 'Rechner'
  },
  { 
    name: '🎲 Mathigon Polypad Virtuelle Mathe-Materialien', 
    url: 'https://mathigon.org/polypad',
    category: 'mathe',
    tag: 'Polypad'
  },

  // 6. GEOGRAFIE & ASTRONOMIE
  { 
    name: '🪐 Stellarium 3D-Planetarium', 
    url: 'https://stellarium-web.org/',
    category: 'geo',
    tag: 'Astronomie'
  },
  { 
    name: '🌪️ Windy Erd- & Windsimulation', 
    url: 'https://embed.windy.com/embed2.html?lat=50.8&lon=11.6&detailLat=50.8&detailLon=11.6&width=650&height=450&zoom=5&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1',
    category: 'geo',
    tag: 'Klima'
  },
  { 
    name: '🗺️ OpenStreetMap Karte', 
    url: 'https://www.openstreetmap.org/export/embed.html?bbox=11.55%2C50.78%2C11.65%2C50.82&layer=mapnik',
    category: 'geo',
    tag: 'Kartografie'
  },

  // 7. GESCHICHTE & KULTUR
  { 
    name: '🏛️ Google Arts & Culture Entdeckungen', 
    url: 'https://artsandculture.google.com/',
    category: 'geschichte',
    tag: 'Museum & Kunst'
  },
  { 
    name: '🕰️ Geacron Historischer Weltatlas', 
    url: 'https://geacron.com/home-en/',
    category: 'geschichte',
    tag: 'Weltgeschichte'
  },

  // 8. MUSIK & KREATIVITÄT
  { 
    name: '🎵 Chrome Music Lab: Song Maker', 
    url: 'https://musiclab.chromeexperiments.com/Song-Maker/',
    category: 'musik',
    tag: 'Komposition'
  },
  { 
    name: '🎹 Chrome Music Lab: Shared Piano', 
    url: 'https://musiclab.chromeexperiments.com/Shared-Piano/',
    category: 'musik',
    tag: 'Klavier'
  },

  // 9. INFORMATIK & MEDIENBILDUNG
  { 
    name: '🐱 Scratch 3.0 Programmier-Editor', 
    url: 'https://scratch.mit.edu/projects/editor/',
    category: 'informatik',
    tag: 'Coding'
  },
  { 
    name: '🤖 MakeCode Micro:bit Editor', 
    url: 'https://makecode.microbit.org/',
    category: 'informatik',
    tag: 'Robotik'
  },

  // 10. DEUTSCH & SPRACHEN
  { 
    name: '📖 Duden Online Wörterbuch & Rechtschreibung', 
    url: 'https://www.duden.de/',
    category: 'sprachen',
    tag: 'Wörterbuch'
  },
  { 
    name: '🌍 DeepL Übersetzer', 
    url: 'https://www.deepl.com/translator',
    category: 'sprachen',
    tag: 'Übersetzung'
  }
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Alle Tools', icon: Sparkles },
  { id: 'lernen', label: 'LearningApps & Üben', icon: GraduationCap },
  { id: 'physik', label: 'Physik', icon: Atom },
  { id: 'chemie', label: 'Chemie', icon: FlaskConical },
  { id: 'mathe', label: 'Mathe', icon: Calculator },
  { id: 'geo', label: 'Geografie', icon: Compass },
  { id: 'geschichte', label: 'Geschichte', icon: History },
  { id: 'musik', label: 'Musik', icon: Music },
  { id: 'informatik', label: 'Informatik', icon: Code },
  { id: 'sprachen', label: 'Sprachen', icon: BookOpen }
];

interface EmbedWidgetProps {
  data?: Record<string, any>;
  onUpdateData?: (data: Record<string, any>) => void;
}

export const EmbedWidget: React.FC<EmbedWidgetProps> = ({ data, onUpdateData }) => {
  const [embedUrl, setEmbedUrl] = useState<string>(
    data?.url || 'https://learningapps.org/'
  );
  const [toolTitle, setToolTitle] = useState<string>(
    data?.title || 'LearningApps & Web-Tools'
  );
  const [urlInput, setUrlInput] = useState<string>(embedUrl);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());

  useEffect(() => {
    if (onUpdateData) {
      onUpdateData({
        url: embedUrl,
        title: toolTitle
      });
    }
  }, [embedUrl, toolTitle, onUpdateData]);

  // Navigate to URL or web search
  const handleNavigate = (targetUrl?: string, titleToSet?: string) => {
    let raw = (targetUrl || urlInput).trim();
    if (!raw) return;

    // Check if it's a domain/URL or search query
    let finalUrl = raw;
    if (!/^https?:\/\//i.test(finalUrl)) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        // Search query via DuckDuckGo SafeSearch
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}&kp=-1&kn=1`;
      }
    }

    setEmbedUrl(finalUrl);
    setUrlInput(finalUrl);
    if (titleToSet) {
      setToolTitle(titleToSet);
    } else {
      try {
        setToolTitle(new URL(finalUrl).hostname.replace('www.', ''));
      } catch {
        setToolTitle(finalUrl);
      }
    }
    setIframeKey(Date.now());
    setIsDrawerOpen(false);
  };

  const filteredPresets = SIMULATION_PRESETS.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between font-sans w-full">
      {/* Browser Navigation Bar */}
      <div className="flex items-center gap-1 pb-1.5 mb-1 border-b border-white/40 shrink-0">
        {/* Reload button */}
        <button
          type="button"
          onClick={() => setIframeKey(Date.now())}
          className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-white/80 active:scale-95 transition-all shadow-2xs"
          title="Seite neu laden"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Browser URL / Search Address Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleNavigate(); }}
          className="flex-1 flex items-center bg-white/90 rounded-xl border border-white/90 shadow-2xs px-2.5 py-1 focus-within:ring-2 focus-within:ring-hbs-blue/30 transition-all min-w-0"
        >
          <Globe className="w-3.5 h-3.5 text-hbs-blue mr-1.5 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Webadresse eingeben oder Begriff suchen..."
            className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none truncate"
          />
          <button
            type="submit"
            className="p-0.5 text-slate-400 hover:text-hbs-blue transition-colors ml-1 shrink-0"
            title="Aufrufen"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Presets & Subject Tools Library Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs shrink-0 cursor-pointer ${
            isDrawerOpen
              ? 'bg-hbs-blue text-white'
              : 'bg-white/80 hover:bg-white text-hbs-blue border border-white/90'
          }`}
          title="Schul- & Fachbereichs-Tools auswählen"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fach-Tools</span>
        </button>

        {/* Fullscreen / Open in new window */}
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-hbs-blue border border-white/80 transition-all active:scale-95 shadow-2xs shrink-0"
          title="In eigenem Tab öffnen"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Viewport: Iframe Browser or Subject Library Drawer */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-inner flex flex-col relative min-h-0">
        {isDrawerOpen ? (
          /* Subject Tools Library Drawer */
          <div className="absolute inset-0 z-20 bg-slate-50/95 backdrop-blur-md flex flex-col p-3 overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-hbs-blue text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Fachbereichs-Tools & Lernplattformen</h4>
                  <p className="text-[10px] text-slate-500">Klicke ein Werkzeug, um es direkt auf der Tafel zu laden</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
              >
                Schließen
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto touch-pan-x scrollbar-none pb-2 mb-2 shrink-0">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-hbs-blue text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 overflow-y-auto">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleNavigate(preset.url, preset.name)}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-hbs-blue hover:shadow-sm text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-black text-slate-800 truncate group-hover:text-hbs-blue">
                      {preset.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono mt-0.5 inline-block">
                      {preset.tag}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-hbs-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Embedded Web View */}
        <iframe
          key={`embed_frame_${iframeKey}`}
          src={embedUrl}
          className="w-full h-full border-0 bg-white"
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
          title={toolTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera; fullscreen"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  );
};
