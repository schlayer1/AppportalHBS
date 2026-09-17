import React, { useState } from 'react';
import { X, Save, Check } from 'lucide-react';
import { BoardScreen } from './types';
import { useAuth } from '../../context/AuthContext';

interface SaveBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: BoardScreen;
}

export const SaveBoardModal: React.FC<SaveBoardModalProps> = ({
  isOpen,
  onClose,
  currentScreen
}) => {
  const { saveBoardTemplate, isAdmin, currentUser } = useAuth();

  const [title, setTitle] = useState(
    currentScreen.title && currentScreen.title !== 'Tafel 1' 
      ? currentScreen.title 
      : `Unterrichtsstunde am ${new Date().toLocaleDateString('de-DE')}`
  );
  const [isSchoolTemplate, setIsSchoolTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await saveBoardTemplate(title.trim(), currentScreen, isSchoolTemplate);
      onClose();
    } catch (err) {
      console.error('Fehler beim Speichern des Tafelbildes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
              Bezeichnung des Tafelbildes:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. 7b Mathe – Satz des Pythagoras, Morgenkreis..."
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-teal-deep/30"
              required
              autoFocus
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs text-hbs-slate-muted">
            <div className="flex justify-between font-bold text-hbs-slate-dark">
              <span>Enthaltene Widgets:</span>
              <span>{currentScreen.widgets.length} Stück</span>
            </div>
            <div className="flex justify-between">
              <span>Hintergrund:</span>
              <span className="font-mono">{currentScreen.backgroundId}</span>
            </div>
            <div className="flex justify-between">
              <span>Gespeichert für:</span>
              <span className="font-bold text-hbs-teal-deep">{currentUser ? currentUser.name : 'Tafel-Gast'}</span>
            </div>
          </div>

          {isAdmin && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isSchoolTemplate}
                onChange={(e) => setIsSchoolTemplate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-black text-amber-900 block">
                  Als Schul-Standardvorlage freigeben
                </span>
                <span className="text-[10px] text-amber-800/80 block">
                  Dieses Tafelbild steht allen Lehrkräften als empfohlene Vorlage zur Verfügung.
                </span>
              </div>
            </label>
          )}

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
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-hbs-teal-deep to-[#005f56] hover:from-[#005f56] hover:to-[#004a43] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>In Cloud speichern</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
