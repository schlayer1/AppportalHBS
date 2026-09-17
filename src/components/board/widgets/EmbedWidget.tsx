import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Edit2, 
  Check, 
  ExternalLink, 
  Atom, 
  FlaskConical, 
  Dna, 
  Compass, 
  Calculator
} from 'lucide-react';

interface SimulationPreset {
  name: string;
  url: string;
  category: 'physik' | 'chemie' | 'biologie' | 'geo' | 'mathe';
  tag: string;
}

const SIMULATION_PRESETS: SimulationPreset[] = [
  // PHYSIK
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

  // CHEMIE
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

  // BIOLOGIE
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

  // GEOGRAFIE & ASTRONOMIE
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

  // MATHEMATIK
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
  }
];

interface EmbedWidgetProps {
  data?: Record<string, any>;
  onUpdateData?: (data: Record<string, any>) => void;
}

export const EmbedWidget: React.FC<EmbedWidgetProps> = ({ data, onUpdateData }) => {
  const [embedUrl, setEmbedUrl] = useState<string>(
    data?.url || 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html'
  );
  const [toolTitle, setToolTitle] = useState<string>(
    data?.title || 'PhET Stromkreis-Labor'
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(embedUrl);
  const [activeCategory, setActiveCategory] = useState<'all' | 'physik' | 'chemie' | 'biologie' | 'geo' | 'mathe'>('all');

  useEffect(() => {
    if (onUpdateData) {
      onUpdateData({
        url: embedUrl,
        title: toolTitle
      });
    }
  }, [embedUrl, toolTitle, onUpdateData]);

  const handleApply = (urlToSet?: string, titleToSet?: string) => {
    const finalUrl = (urlToSet || tempUrl).trim();
    if (finalUrl) {
      setEmbedUrl(finalUrl);
      if (titleToSet) setToolTitle(titleToSet);
      setIsEditing(false);
    }
  };

  const filteredPresets = SIMULATION_PRESETS.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-black truncate max-w-[210px]">
          <Globe className="w-4 h-4 text-hbs-blue shrink-0" />
          <span className="truncate">{toolTitle || 'Web-Simulation'}</span>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-hbs-blue border border-white/80 transition-all active:scale-95"
            title="In neuem Tab / Vollbild öffnen"
          >
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
          >
            {isEditing ? <Check className="w-3 h-3 text-emerald-600" /> : <Edit2 className="w-3 h-3" />}
            <span>{isEditing ? 'Fertig' : 'Simulation wählen'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Configuration & Simulation Library View */
        <div className="flex-1 overflow-y-auto p-3 bg-white/85 backdrop-blur-md rounded-2xl border border-white space-y-3 min-h-0 text-slate-800">
          {/* Custom URL input */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Eigene Simulations- oder Website-URL:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
              />
              <button
                onClick={() => handleApply()}
                className="px-3.5 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold transition-all active:scale-95"
              >
                Laden
              </button>
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
              Naturwissenschaftliche Simulationen:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Alle', icon: Globe },
                { id: 'physik', label: 'Physik', icon: Atom },
                { id: 'chemie', label: 'Chemie', icon: FlaskConical },
                { id: 'biologie', label: 'Biologie', icon: Dna },
                { id: 'geo', label: 'Geo & Astro', icon: Compass },
                { id: 'mathe', label: 'Mathematik', icon: Calculator }
              ].map((cat) => {
                const CatIcon = cat.icon;
                const isSel = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 ${
                      isSel 
                        ? 'bg-hbs-blue text-white shadow-2xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <CatIcon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Simulation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {filteredPresets.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setTempUrl(p.url);
                  handleApply(p.url, p.name);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 group ${
                  embedUrl === p.url 
                    ? 'bg-hbs-blue-soft border-hbs-blue shadow-2xs' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 group-hover:text-hbs-blue truncate">
                    {p.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-500 uppercase shrink-0">
                    {p.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Live Simulation iFrame Viewport */
        <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-white shadow-inner min-h-0 relative">
          <iframe
            src={embedUrl}
            title={toolTitle}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            allow="fullscreen; accelerometer; gyroscope"
          />
        </div>
      )}
    </div>
  );
};
