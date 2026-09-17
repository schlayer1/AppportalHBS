import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  LayoutTemplate, 
  Check, 
  Trash2, 
  Save,
  Filter,
  UserCheck,
  Tag
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

const SUBJECTS = [
  'Mathematik', 'Deutsch', 'Englisch', 'Biologie', 'Physik', 
  'Chemie', 'Geschichte', 'Erdkunde', 'Wirtschaft', 'Informatik', 
  'Kunst', 'Musik', 'Sport', 'Religion/Ethik'
];

const GRADES = [
  'Klasse 5', 'Klasse 6', 'Klasse 7', 'Klasse 8', 'Klasse 9', 'Klasse 10',
  'Klassen 5-7', 'Klassen 8-10', 'Alle Jahrgänge'
];

export const BoardTemplatesDrawer: React.FC<BoardTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  onOpenSaveModal
}) => {
  const { boardTemplates, deleteBoardTemplate, currentUser, isAdmin } = useAuth();
  const [tab, setTab] = useState<'all' | 'mine' | 'school' | 'substitution'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  if (!isOpen) return null;

  const myTemplates = boardTemplates.filter(t => currentUser && t.authorId === currentUser.id);
  const schoolTemplates = boardTemplates.filter(t => t.isSchoolTemplate);
  const substitutionTemplates = boardTemplates.filter(t => t.isSubstitution);

  const displayedTemplates = boardTemplates.filter(tmpl => {
    // Tab filter
    if (tab === 'mine' && (!currentUser || tmpl.authorId !== currentUser.id)) return false;
    if (tab === 'school' && !tmpl.isSchoolTemplate) return false;
    if (tab === 'substitution' && !tmpl.isSubstitution) return false;

    // Subject filter
    if (selectedSubject !== 'all' && tmpl.subject !== selectedSubject) return false;

    // Grade filter
    if (selectedGrade !== 'all' && tmpl.grade !== selectedGrade) return false;

    return true;
  });

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
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100/80 border-b border-slate-200 shrink-0 text-center">
          <button
            onClick={() => setTab('all')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all truncate ${
              tab === 'all'
                ? 'bg-white text-hbs-slate-dark shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Alle ({boardTemplates.length})
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all truncate ${
              tab === 'mine'
                ? 'bg-white text-hbs-teal-deep shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Meine ({myTemplates.length})
          </button>
          <button
            onClick={() => setTab('school')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all truncate ${
              tab === 'school'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            Schule ({schoolTemplates.length})
          </button>
          <button
            onClick={() => setTab('substitution')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all truncate ${
              tab === 'substitution'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'text-orange-700 hover:text-orange-900'
            }`}
            title="Vertretungsstunden"
          >
            🚨 Vertr. ({substitutionTemplates.length})
          </button>
        </div>

        {/* Secondary Subject & Grade Filter Bar */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="grid grid-cols-2 gap-2 flex-1">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-[11px] font-medium bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-hbs-teal-deep"
            >
              <option value="all">Alle Fächer</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full text-[11px] font-medium bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-hbs-teal-deep"
            >
              <option value="all">Alle Stufen</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          {(selectedSubject !== 'all' || selectedGrade !== 'all') && (
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedGrade('all');
              }}
              className="text-[10px] text-hbs-teal-deep hover:underline font-bold shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {displayedTemplates.length === 0 ? (
            <div className="p-8 text-center text-hbs-slate-muted flex flex-col items-center justify-center h-48">
              <LayoutTemplate className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-xs font-bold text-hbs-slate-dark">Keine Tafelbilder gefunden</span>
              <span className="text-[11px] text-hbs-slate-muted mt-1 max-w-xs">
                Für diese Filtereinstellung sind derzeit keine Vorlagen vorhanden.
              </span>
            </div>
          ) : (
            displayedTemplates.map((tmpl) => {
              const canDelete = isAdmin || (currentUser && tmpl.authorId === currentUser.id);

              return (
                <div
                  key={tmpl.id}
                  className={`p-3 bg-white rounded-2xl border transition-all flex flex-col justify-between gap-2.5 group ${
                    tmpl.isSubstitution 
                      ? 'border-orange-200 hover:border-orange-400 bg-orange-50/20 shadow-2xs' 
                      : 'border-slate-200 hover:border-hbs-teal-deep/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-hbs-slate-dark">
                          {tmpl.title}
                        </h4>
                        {tmpl.isSubstitution && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-900 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" />
                            Vertretung {tmpl.substitutionClass ? `(${tmpl.substitutionClass})` : ''}
                          </span>
                        )}
                        {tmpl.isSchoolTemplate && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase tracking-wider">
                            Schulvorlage
                          </span>
                        )}
                      </div>

                      {/* Subject & Grade tags */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {tmpl.subject && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100">
                            <Tag className="w-2.5 h-2.5" />
                            {tmpl.subject}
                          </span>
                        )}
                        {tmpl.grade && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-100">
                            {tmpl.grade}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {tmpl.screen.widgets.length} Widgets
                        </span>
                      </div>

                      {tmpl.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                          {tmpl.description}
                        </p>
                      )}

                      {/* Substitution Notes */}
                      {tmpl.isSubstitution && tmpl.substitutionNotes && (
                        <div className="mt-2 p-2 rounded-xl bg-orange-100/70 border border-orange-200 text-[11px] text-orange-950">
                          <span className="font-bold text-orange-900">Arbeitsauftrag / Info:</span> {tmpl.substitutionNotes}
                        </div>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => deleteBoardTemplate(tmpl.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        title="Tafelbild löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-hbs-slate-muted truncate">
                      {tmpl.authorName} • {new Date(tmpl.createdAt).toLocaleDateString('de-DE')}
                    </span>

                    <button
                      onClick={() => handleSelect(tmpl)}
                      className={`px-3 py-1 rounded-xl text-white text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
                        tmpl.isSubstitution 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-hbs-teal-deep hover:bg-[#005f56]'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{tmpl.isSubstitution ? 'Übernehmen' : 'Laden'}</span>
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
