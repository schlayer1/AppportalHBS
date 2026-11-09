import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Smile, 
  GraduationCap, 
  Dog, 
  Apple, 
  Trophy, 
  Car, 
  Heart,
  Copy,
  Check
} from 'lucide-react';

interface StickerCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emojis: string[];
}

const CATEGORIES: StickerCategory[] = [
  {
    id: 'school',
    name: 'Schule & Lernen',
    icon: GraduationCap,
    emojis: [
      '🎓', '🏫', '📚', '📖', '📝', '✏️', '🖊️', '🖋️', '📏', '📐', 
      '📌', '📍', '📎', '✂️', '🔬', '🔭', '🧪', '🧫', '🧬', '💻', 
      '🖥️', '⌨️', '🖱️', '🧮', '🎒', '📁', '📂', '📄', '📃', '📊', 
      '📈', '📉', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🔔', '💡', 
      '🎯', '🧠', '🧭', '🎨', '🎭', '🎬', '🎤', '🎵', '🎶', '🎹',
      '⭐', '🌟', '✨', '💯', '✔️', '✅', '❌', '❓', '❗', '⏰'
    ]
  },
  {
    id: 'smileys',
    name: 'Smileys & Gefühle',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', 
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', 
      '🤑', '🤗', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😏', 
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤯', '🤠', 
      '🥳', '😎', '🤓', '🧐', '😕', '🥺', '😮', '😲', '😳', '😭', 
      '😱', '😤', '😡', '🤬', '💀', '💩', '🤡', '👻', '👽', '🤖'
    ]
  },
  {
    id: 'nature',
    name: 'Tiere & Natur',
    icon: Dog,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', 
      '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', 
      '🐜', '🐢', '🐍', '🦎', '🐙', '🦑', '🐠', '🐬', '🐳', '🦈', 
      '🐊', '🦓', '🦍', '🐘', '🦒', '🦘', '🌲', '🌳', '🌴', '🌵', 
      '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌸', '🌹'
    ]
  },
  {
    id: 'food',
    name: 'Essen & Trinken',
    icon: Apple,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', 
      '🍒', '🍑', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥕', '🌽', 
      '🌶️', '🥒', '🍞', '🥐', '🥖', '🥨', '🧀', '🍳', '🥞', '🧇', 
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', 
      '🍣', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', 
      '🍬', '🍭', '🍿', '🥛', '🍼', '☕', '🧃', '🥤', '🧋', '🍵'
    ]
  },
  {
    id: 'sports',
    name: 'Sport & Spiele',
    icon: Trophy,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', 
      '🏒', '🏑', '🥊', '🥋', '🛹', '🛼', '⛸️', '🎿', '🏂', '🏋️', 
      '🤸', '⛹️', '🤺', '🤾', '🧗', '🚵', '🚴', '🏊', '🏄', '🚣', 
      '🏇', '🧘', '🎯', '🎳', '🎮', '🕹️', '🎲', '🧩', '♟️', '🎪', 
      '🎨', '🎭', '🎤', '🎧', '🎷', '🎸', '🎺', '🎻', '🥁', '🎟️'
    ]
  },
  {
    id: 'travel',
    name: 'Reisen & Orte',
    icon: Car,
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', 
      '🛻', '🚚', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚨', '✈️', '🛫', 
      '🚀', '🛸', '🚁', '⛵', '🚤', '🛳️', '🚢', '⚓', '🚦', '🚧', 
      '🌍', '🌎', '🌏', '🗺️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🏕️', 
      '🏠', '🏡', '🏢', '🏫', '🏰', '🗼', '🗽', '⛪', '🕌', '⛩️'
    ]
  },
  {
    id: 'symbols',
    name: 'Herzen & Symbole',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', 
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', 
      '✝️', '☪️', '🕉️', '☯️', '⚛️', '☣️', '☢️', '⚠️', '⛔', '🚫', 
      '💯', '💢', '♨️', '❗', '❓', '‼️', '⁉️', '🔆', '🔅', '🔱', 
      '♻️', '✅', '✔️', '☑️', '❌', '❎', '➕', '➖', '➗', '✖️', 
      '💲', '💱', '©️', '®️', '™️', '🔴', '🟠', '🟡', '🟢', '🔵'
    ]
  }
];

export const StickersWidget: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('school');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🏆');
  const [stickerLabel, setStickerLabel] = useState<string>('Super Leistung!');
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter emojis based on search or category
  const displayedEmojis = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchedCats = CATEGORIES.filter((cat) => cat.name.toLowerCase().includes(q));
      if (matchedCats.length > 0) {
        return matchedCats.flatMap((c) => c.emojis);
      }
      // Return all emojis for visual selection when searching
      const all: string[] = [];
      CATEGORIES.forEach((cat) => {
        cat.emojis.forEach((em) => {
          if (!all.includes(em)) all.push(em);
        });
      });
      return all;
    }

    const found = CATEGORIES.find((c) => c.id === activeCategory);
    return found ? found.emojis : CATEGORIES[0].emojis;
  }, [activeCategory, searchQuery]);

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleCopyEmoji = () => {
    navigator.clipboard.writeText(selectedEmoji);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emojiSizeClass = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-7xl',
    xl: 'text-9xl'
  }[size];

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between font-sans">
      {/* Top Header & Search */}
      <div className="flex flex-col gap-1.5 pb-1.5 mb-1 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Emoji / WhatsApp Sticker suchen..."
              className="w-full pl-8 pr-3 py-1 rounded-xl bg-white/80 border border-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
            />
          </div>

          {/* Size Selector */}
          <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80 shrink-0">
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  size === s ? 'bg-hbs-blue text-white shadow-2xs' : 'text-slate-500 hover:bg-white'
                }`}
                title={`Größe: ${s.toUpperCase()}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Tab Bar */}
        {!searchQuery && (
          <div className="flex items-center gap-1 overflow-x-auto touch-pan-x scrollbar-none py-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-hbs-blue text-white shadow-2xs'
                      : 'bg-white/70 hover:bg-white text-slate-700 border border-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Featured Sticker Display */}
      <div className="my-auto py-2 px-4 rounded-3xl bg-white/85 border-2 border-white shadow-sm flex flex-col items-center text-center relative group">
        <div className="relative">
          <span className={`${emojiSizeClass} transition-transform duration-300 drop-shadow-md inline-block select-text`}>
            {selectedEmoji}
          </span>
          <button
            onClick={handleCopyEmoji}
            className="absolute -top-1 -right-6 p-1 rounded-lg bg-white/90 hover:bg-white text-slate-600 shadow-2xs border border-slate-200 transition-all opacity-0 group-hover:opacity-100"
            title="Emoji in Zwischenablage kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <input
          type="text"
          value={stickerLabel}
          onChange={(e) => setStickerLabel(e.target.value)}
          placeholder="Motto / Beschriftung..."
          className="mt-1 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100/90 text-amber-900 border border-amber-300/80 text-center shadow-2xs max-w-[240px] focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Grid of All WhatsApp Emoji Choices */}
      <div className="w-full mt-2 pt-1.5 border-t border-white/40 max-h-36 overflow-y-auto">
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
          {displayedEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}_${idx}`}
              onClick={() => handleSelectEmoji(emoji)}
              className={`h-8 rounded-xl text-lg flex items-center justify-center border transition-all active:scale-90 hover:scale-115 hover:z-10 ${
                selectedEmoji === emoji
                  ? 'bg-hbs-blue text-white border-hbs-blue shadow-2xs scale-110'
                  : 'bg-white/60 hover:bg-white text-hbs-slate-dark border-white/80'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
