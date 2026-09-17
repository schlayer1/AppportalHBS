import React, { useState, useEffect } from 'react';
import { 
  X, 
  Link2, 
  Globe, 
  BookOpen, 
  Star, 
  Laptop, 
  Calculator, 
  GraduationCap, 
  Video, 
  Compass, 
  Bookmark, 
  Plus, 
  Check 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AddCustomLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Globe', icon: Globe },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Star', icon: Star },
  { name: 'Laptop', icon: Laptop },
  { name: 'Calculator', icon: Calculator },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Video', icon: Video },
  { name: 'Compass', icon: Compass }
];

export const AddCustomLinkModal: React.FC<AddCustomLinkModalProps> = ({ isOpen, onClose }) => {
  const { addCustomApp } = useAuth();

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<'kollegium' | 'unterricht' | 'verwaltung' | 'tools' | 'meine'>('unterricht');
  const [selectedIcon, setSelectedIcon] = useState('Globe');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setIsSubmitting(true);
    try {
      await addCustomApp({
        title: title.trim(),
        url: cleanUrl,
        category,
        icon: selectedIcon,
        badge: 'Mein Link',
        description: description.trim()
      });
      setTitle('');
      setUrl('');
      setDescription('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-hbs-blue-soft text-hbs-blue-deep flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-hbs-slate-dark">
                Neuen Link / App ablegen
              </h2>
              <p className="text-xs text-hbs-slate-muted">
                Wird in Ihrem persönlichen Dashboard gespeichert & synchronisiert
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Titel des Links / der App:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Mathe-Trainer Schlaukopf, Padlet 7b, Wikipedia..."
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Web-Adresse (URL):
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-hbs-slate-light absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
                Kategorie:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="unterricht">Unterricht & Schüler</option>
                <option value="kollegium">Kollegium & Organisation</option>
                <option value="tools">Werkzeuge</option>
                <option value="meine">Meine Favoriten</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
                Icon wählen:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-hbs-blue text-white shadow-2xs'
                          : 'text-hbs-slate-muted hover:text-hbs-slate-dark hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Notiz / Kurzbeschreibung (optional):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wozu dient dieser Link im Unterricht oder Alltag..."
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-hbs-slate-muted hover:bg-slate-100 rounded-xl"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-hbs-blue to-hbs-blue-deep hover:from-hbs-blue-deep hover:to-[#093d56] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Link im Dashboard speichern</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
