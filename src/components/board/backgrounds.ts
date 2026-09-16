import { BackgroundPreset } from './types';

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'chalkboard',
    name: 'Schultafel Grün',
    category: 'tafel',
    className: 'chalkboard-bg',
    previewColor: '#173225'
  },
  {
    id: 'slate-dark',
    name: 'Schiefer Anthrazit',
    category: 'tafel',
    className: 'slate-board-bg',
    previewColor: '#1a232f'
  },
  {
    id: 'math-grid',
    name: 'Mathe-Kästchen',
    category: 'papier',
    className: 'math-grid-bg',
    previewColor: '#e2e8f0'
  },
  {
    id: 'lined-paper',
    name: 'Schreib-Lineatur',
    category: 'papier',
    className: 'lined-paper-bg',
    previewColor: '#f1f5f9'
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
    previewColor: '#2b5278'
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
    previewColor: '#1b4332'
  },
  {
    id: 'minimal-aurora',
    name: 'Aurora Sanft',
    category: 'modern',
    style: {
      background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), rgba(255, 255, 255, 0)), linear-gradient(135deg, #eef2f6 0%, #e0e7ff 100%)'
    },
    previewColor: '#818cf8'
  }
];
