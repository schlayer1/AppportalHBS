import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  LayoutTemplate, 
  Check, 
  Trash2, 
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BoardScreen } from './types';
import { SavedBoardTemplate } from '../../types/user';

interface BoardTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (screen: BoardScreen) => void;
  onOpenSaveModal: () => void;
}

export const BoardTemplatesDrawer: React.FC<BoardTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  onOpenSaveModal
}) => {
  const { boardTemplates, deleteBoardTemplate, currentUser, isAdmin } = useAuth();
  const [tab, setTab] = useState<'all' | 'mine' | 'school'>('all');

  if (!isOpen) return null;

  const myTemplates = boardTemplates.filter(t => currentUser && t.authorId === currentUser.id);
  const schoolTemplates = boardTemplates.filter(t => t.isSchoolTemplate);

  const displayedTemplates = tab === 'mine' 
    ? myTemplates 
    : tab === 'school' 
    ? schoolTemplates 
    : boardTemplates;

  const handleSelect = (tmpl: SavedBoardTemplate) => {
    onLoadTemplate(tmpl.screen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slideInRight">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-hbs-teal-deep/10 text-hbs-teal-deep flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-hbs-slate-dark">
                Tafelbilder & Vorlagen
              </h2>
              <p className="text-[11px] text-hbs-slate-muted">
                Gespeicherte Tafelstände laden oder sichern
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Save Current Board Button */}
        <div className="p-3 bg-teal-50/60 border-b border-teal-100 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-bold text-teal-950 truncate">
            Aktuellen Tafelstand sichern?
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSaveModal();
            }}
            className="px-3 py-1.5 rounded-xl bg-hbs-teal-deep hover:bg-[#005f56] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Jetzt speichern</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/80 border-b border-slate-200 shrink-0">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'all'
                ? 'bg-white text-hbs-slate-dark shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Alle ({boardTemplates.length})
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'mine'
                ? 'bg-white text-hbs-teal-deep shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Meine ({myTemplates.length})
          </button>
          <button
            onClick={() => setTab('school')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'school'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Schulvorlagen ({schoolTemplates.length})
          </button>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {displayedTemplates.length === 0 ? (
            <div className="p-8 text-center text-hbs-slate-muted flex flex-col items-center justify-center h-48">
              <LayoutTemplate className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-xs font-bold text-hbs-slate-dark">Keine Tafelbilder gefunden</span>
              <span className="text-[11px] text-hbs-slate-muted mt-1 max-w-xs">
                Klicken Sie oben auf „Jetzt speichern“, um das aktuelle Tafelbild für spätere Stunden abzulegen.
              </span>
            </div>
          ) : (
            displayedTemplates.map((tmpl) => {
              const canDelete = isAdmin || (currentUser && tmpl.authorId === currentUser.id);

              return (
                <div
                  key={tmpl.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-hbs-teal-deep/50 shadow-2xs transition-all flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <h4 className="text-xs font-black text-hbs-slate-dark truncate">
                          {tmpl.title}
                        </h4>
                        {tmpl.isSchoolTemplate && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase tracking-wider">
                            Schulvorlage
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-hbs-slate-muted flex items-center gap-2">
                        <span>{tmpl.screen.widgets.length} Widgets</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] truncate">{tmpl.screen.backgroundId}</span>
                      </p>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => deleteBoardTemplate(tmpl.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Tafelbild löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-hbs-slate-muted">
                      {tmpl.authorName} • {new Date(tmpl.createdAt).toLocaleDateString('de-DE')}
                    </span>

                    <button
                      onClick={() => handleSelect(tmpl)}
                      className="px-3 py-1 rounded-xl bg-hbs-teal-deep hover:bg-[#005f56] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Laden</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
