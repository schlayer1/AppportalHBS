import { BackgroundPreset } from './types';

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ========== 1. DIE 5 SANFTEN, ABLENKUNGSFREIEN VERLÄUFE ==========
  {
    id: 'gradient-sage',
    name: 'Sanftes Salbeigrün',
    category: 'verlauf',
    className: 'bg-gradient-sage',
    previewColor: '#d8e7de',
    description: 'Beruhigend, augenfreundlich & modern'
  },
  {
    id: 'gradient-sand',
    name: 'Warmer Sand & Leinen',
    category: 'verlauf',
    className: 'bg-gradient-sand',
    previewColor: '#efe6d8',
    description: 'Edles Buch- & Naturpapier-Gefühl'
  },
  {
    id: 'gradient-sky',
    name: 'Morgenhimmel Hellblau',
    category: 'verlauf',
    className: 'bg-gradient-sky',
    previewColor: '#dbe8f6',
    description: 'Frisch, konzentrationsfördernd & hell'
  },
  {
    id: 'gradient-lavender',
    name: 'Sanfter Lavendelnebel',
    category: 'verlauf',
    className: 'bg-gradient-lavender',
    previewColor: '#e5dded',
    description: 'Harmonisch, entspannend & kreativ'
  },
  {
    id: 'gradient-slate-soft',
    name: 'Schiefer Soft (Dunkel)',
    category: 'verlauf',
    className: 'bg-gradient-slate-soft',
    previewColor: '#1d2734',
    description: 'Blendfreier Kontrast für helle Räume'
  },

  // ========== 2. DIE 5 TYPISCHEN SCHUL-LINIERUNGEN ==========
  {
    id: 'lineature-math-chalk',
    name: 'Mathe-Kariert (Kreidetafel)',
    category: 'linierung',
    className: 'lineature-math-chalk',
    previewColor: '#173225',
    description: '5mm Rechengitter auf klassischer Schultafel'
  },
  {
    id: 'lineature-primary-4lines',
    name: 'Grundschul-Lineatur (4 Linien)',
    category: 'linierung',
    className: 'lineature-primary-4lines',
    previewColor: '#173225',
    description: 'Schreibschrift mit Ober-, Mittel- & Unterlänge'
  },
  {
    id: 'lineature-single-lines',
    name: 'Einfache Schreiblinien',
    category: 'linierung',
    className: 'lineature-single-lines',
    previewColor: '#173225',
    description: 'Breite Zeilenabstände für Sekundarstufe'
  },
  {
    id: 'lineature-music-staves',
    name: 'Musik-Notenlinien (5er-System)',
    category: 'linierung',
    className: 'lineature-music-staves',
    previewColor: '#173225',
    description: 'Klassische Notensysteme für den Musikunterricht'
  },
  {
    id: 'lineature-coordinate-grid',
    name: 'Koordinaten- & Millimetergitter',
    category: 'linierung',
    className: 'lineature-coordinate-grid',
    previewColor: '#173225',
    description: 'Präzises Gitter für Geometrie, Mathe & Physik'
  },

  // ========== 3. KLASSIKER & NATUR ==========
  {
    id: 'chalkboard',
    name: 'Klassische Schultafel Grün',
    category: 'tafel',
    className: 'chalkboard-bg',
    previewColor: '#173225',
    description: 'Traditionelle grüne Schultafel'
  },
  {
    id: 'slate-dark',
    name: 'Schiefer Anthrazit',
    category: 'tafel',
    className: 'slate-board-bg',
    previewColor: '#1a232f',
    description: 'Moderne dunkle Schiefertafel'
  },
  {
    id: 'math-grid',
    name: 'Mathe-Kästchen (Hell)',
    category: 'papier',
    className: 'math-grid-bg',
    previewColor: '#e2e8f0',
    description: 'Weißes Schulheft-Karoraster'
  },
  {
    id: 'lined-paper',
    name: 'Schreibblock (Hell)',
    category: 'papier',
    className: 'lined-paper-bg',
    previewColor: '#f1f5f9',
    description: 'Weißes liniertes Notizblatt'
  },
  {
    id: 'nature-lake',
    name: 'Bergsee & Weite',
    category: 'natur',
    style: {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    previewColor: '#2b5278',
    description: 'Beruhigende Berglandschaft'
  },
  {
    id: 'nature-forest',
    name: 'Morgenwald',
    category: 'natur',
    style: {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    previewColor: '#1b4332',
    description: 'Sanftes Waldlicht'
  },
  {
    id: 'minimal-aurora',
    name: 'Aurora Sanft',
    category: 'modern',
    style: {
      background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), rgba(255, 255, 255, 0)), linear-gradient(135deg, #eef2f6 0%, #e0e7ff 100%)'
    },
    previewColor: '#818cf8',
    description: 'Moderne diffuse Farbwolke'
  }
];
