import React, { useState } from 'react';
import { Globe, Edit2, Check } from 'lucide-react';

const PRESETS = [
  { name: 'GeoGebra Rechner', url: 'https://www.geogebra.org/calculator?embed' },
  { name: 'PhET Simulationen', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html' },
  { name: 'Wikipedia', url: 'https://de.m.wikipedia.org/' }
];

export const EmbedWidget: React.FC = () => {
  const [embedUrl, setEmbedUrl] = useState('https://www.geogebra.org/calculator?embed');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState(embedUrl);

  const handleApply = () => {
    if (tempUrl.trim()) {
      setEmbedUrl(tempUrl.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black truncate max-w-[200px]">
          <Globe className="w-4 h-4 text-hbs-blue shrink-0" />
          <span className="truncate">Web-Tool Einbettung</span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80 flex items-center gap-1"
        >
          {isEditing ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          <span>{isEditing ? 'Fertig' : 'Tool wählen'}</span>
        </button>
      </div>

      {isEditing ? (
        <div className="my-auto p-3 bg-white/70 rounded-2xl border border-white space-y-2.5">
          <div>
            <label className="text-[10px] font-bold text-hbs-slate-muted block mb-1">
              Website-URL eingeben:
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2.5 py-1 text-xs rounded-xl bg-white border border-white font-bold"
              />
              <button
                onClick={handleApply}
                className="px-3 py-1 rounded-xl bg-hbs-blue text-white text-xs font-bold"
              >
                Laden
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-hbs-slate-muted block mb-1">
              Beliebte Unterrichts-Tools:
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setEmbedUrl(p.url);
                    setTempUrl(p.url);
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-hbs-blue-soft text-xs font-bold text-hbs-slate-dark border border-white shadow-2xs"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* iFrame Viewport */
        <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-white shadow-inner min-h-0">
          <iframe
            src={embedUrl}
            title="Embedded Web Tool"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
    </div>
  );
};
