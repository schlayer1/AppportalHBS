import React, { useState, useEffect } from 'react';
import { X, Save, Check, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { BoardScreen } from './types';
import { useAuth } from '../../context/AuthContext';

interface SaveBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: BoardScreen;
}

const SCHOOL_SUBJECTS = [
  'Mathematik',
  'Deutsch',
  'Englisch',
  'Physik',
  'Biologie',
  'Chemie',
  'Geschichte',
  'Geografie',
  'Ethik / Religion',
  'Kunst',
  'Musik',
  'Sport',
  'Wirtschaft / Recht',
  'Sonstiges'
];

const GRADE_LEVELS = [
  'Klasse 5',
  'Klasse 6',
  'Klasse 7',
  'Klasse 8',
  'Klasse 9',
  'Klasse 10',
  'Stufenübergreifend'
];

export const SaveBoardModal: React.FC<SaveBoardModalProps> = ({
  isOpen,
  onClose,
  currentScreen
}) => {
  const { saveBoardTemplate, isAdmin } = useAuth();

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [title, setTitle] = useState(
    currentScreen.title && currentScreen.title !== 'Tafel 1' 
      ? currentScreen.title 
      : `Unterrichtsstunde am ${new Date().toLocaleDateString('de-DE')}`
  );
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Mathematik');
  const [grade, setGrade] = useState('Klasse 7');
  const [isSchoolTemplate, setIsSchoolTemplate] = useState(false);

  // Substitution options
  const [isSubstitution, setIsSubstitution] = useState(false);
  const [substitutionClass, setSubstitutionClass] = useState('7b');
  const [substitutionNotes, setSubstitutionNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await saveBoardTemplate(
        title.trim(), 
        currentScreen, 
        isSchoolTemplate,
        {
          description: description.trim(),
          subject,
          grade,
          isSubstitution,
          substitutionClass: isSubstitution ? substitutionClass.trim() : undefined,
          substitutionNotes: isSubstitution ? substitutionNotes.trim() : undefined,
          targetDate: new Date().toISOString().split('T')[0]
        }
      );
      onClose();
    } catch (err) {
      console.error('Fehler beim Speichern des Tafelbildes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-hbs-teal-deep/10 text-hbs-teal-deep flex items-center justify-center">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-hbs-slate-dark">
                Tafelbild speichern
              </h2>
              <p className="text-xs text-hbs-slate-muted">
                Speichert alle {currentScreen.widgets.length} Widgets, Inhalte & Hintergrund
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Bezeichnung des Tafelbildes:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Mathe 7b – Satz des Pythagoras"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-hbs-slate-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-teal-deep/20 focus:border-hbs-teal-deep transition-all"
              required
              autoFocus
            />
          </div>

          {/* Subject & Grade level selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-hbs-blue" />
                <span>Schulfach:</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 focus:bg-white focus:outline-none"
              >
                {SCHOOL_SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>Klassenstufe:</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 focus:bg-white focus:outline-none"
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Short Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Notizen / Lernziele (optional):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z. B. Einführung mit YouTube-Video und 10-Min-Timer"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Substitution lesson checkbox & fields */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSubstitution}
                onChange={(e) => setIsSubstitution(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Als Vertretungsstunde markieren</span>
              </span>
            </label>

            {isSubstitution && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Zielklasse für Vertretung:
                  </label>
                  <input
                    type="text"
                    value={substitutionClass}
                    onChange={(e) => setSubstitutionClass(e.target.value)}
                    placeholder="z. B. 7b, 8a, 10c"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Hinweise / Arbeitsauftrag an Vertretungslehrkraft:
                  </label>
                  <textarea
                    rows={2}
                    value={substitutionNotes}
                    onChange={(e) => setSubstitutionNotes(e.target.value)}
                    placeholder="z. B. Video schauen, Arbeitsblatt ausgeben, Aufgaben 1-4 im Buch lösen lassen."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* School Template Toggle (Admins only) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all">
                <input
                  type="checkbox"
                  checked={isSchoolTemplate}
                  onChange={(e) => setIsSchoolTemplate(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-hbs-teal-deep focus:ring-hbs-teal-deep border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-bold text-hbs-slate-dark block">
                    Als Schulvorlage für alle Kollegen freigeben
                  </span>
                  <span className="text-[11px] text-hbs-slate-muted block mt-0.5 leading-relaxed">
                    Erscheint bei allen Lehrkräften im Vorlagen-Menü unter „Schulvorlagen“.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-hbs-slate-muted hover:bg-slate-100 transition-all"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-hbs-teal-deep hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-hbs-teal-deep/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Speichern...' : 'Tafelbild speichern'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
