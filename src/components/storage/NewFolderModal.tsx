import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, color: string, subject?: string) => Promise<void>;
  isShared: boolean;
}

const FOLDER_COLORS = [
  { id: 'blue', label: 'Blau', bgClass: 'bg-blue-500' },
  { id: 'amber', label: 'Gelb / Bernstein', bgClass: 'bg-amber-500' },
  { id: 'emerald', label: 'Grün', bgClass: 'bg-emerald-500' },
  { id: 'purple', label: 'Lila', bgClass: 'bg-purple-500' },
  { id: 'rose', label: 'Rot / Rose', bgClass: 'bg-rose-500' },
  { id: 'teal', label: 'Türkis', bgClass: 'bg-teal-500' },
  { id: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-500' },
  { id: 'slate', label: 'Grau', bgClass: 'bg-slate-600' }
];

const SUBJECTS = [
  'Allgemein',
  'Mathematik',
  'Deutsch',
  'Englisch',
  'Biologie',
  'Physik',
  'Chemie',
  'Geschichte',
  'Geografie',
  'Wirtschaft / Recht',
  'Ethik / Religion',
  'Informatik',
  'Kunst',
  'Musik',
  'Sport',
  'Klassenleitung / Orga'
];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  isShared
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedSubject, setSelectedSubject] = useState(isShared ? 'Mathematik' : 'Allgemein');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setErrorMsg('Bitte geben Sie einen Ordnernamen ein.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onCreateFolder(trimmed, selectedColor, selectedSubject);
      setFolderName('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Fehler beim Erstellen des Ordners.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-hbs-slate-dark">
                Neuen Ordner erstellen
              </h3>
              <p className="text-xs text-hbs-slate-muted">
                {isShared ? 'Im Kollegiums-Austauschbereich' : 'In Ihrem persönlichen Bereich'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Ordnername
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="z.B. Klasse 8 - Geometrie"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-hbs-blue text-sm font-bold text-hbs-slate-dark placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Fach / Kategorie
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-hbs-blue text-sm font-bold text-hbs-slate-dark bg-white"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-hbs-slate-muted mb-2">
              Ordnerfarbe
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedColor(col.id)}
                  className={`w-7 h-7 rounded-full ${col.bgClass} transition-all ${
                    selectedColor === col.id ? 'ring-4 ring-offset-2 ring-hbs-blue scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={col.label}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="px-5 py-2.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep disabled:opacity-50 text-white text-xs font-black shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Ordner erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
