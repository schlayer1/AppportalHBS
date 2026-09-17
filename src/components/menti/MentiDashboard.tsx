import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Play, 
  Edit3, 
  Copy, 
  Trash2, 
  Share2, 
  Search, 
  FolderOpen, 
  BarChart2, 
  Users, 
  Layers, 
  Sparkles,
  ArrowLeft,
  Calendar,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MentiPresentation } from '../../types/mentiTypes';

interface MentiDashboardProps {
  onBackToPortal: () => void;
  onEditPresentation: (presentation: MentiPresentation) => void;
  onStartPresenter: (presentation: MentiPresentation) => void;
  onOpenArchive?: (presentation: MentiPresentation) => void;
}

const SUBJECT_LIST = [
  'Alle Fächer',
  'Fächerübergreifend',
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
  'Kunst',
  'Musik',
  'Sport'
];

export const MentiDashboard: React.FC<MentiDashboardProps> = ({
  onBackToPortal,
  onEditPresentation,
  onStartPresenter,
}) => {
  const { 
    mentiPresentations, 
    currentUser, 
    isAdmin, 
    saveMentiPresentation, 
    deleteMentiPresentation, 
    toggleShareMentiPresentation, 
    duplicateMentiPresentation 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'mine' | 'school' | 'archive'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Alle Fächer');
  const [selectedFolder, setSelectedFolder] = useState('Alle Ordner');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract distinct folders
  const availableFolders = useMemo(() => {
    const folders = new Set<string>();
    mentiPresentations.forEach(p => {
      if (p.folder && p.folder.trim()) {
        folders.add(p.folder.trim());
      }
    });
    return Array.from(folders).sort();
  }, [mentiPresentations]);

  // Filter lists
  const myPresentations = mentiPresentations.filter(
    p => currentUser && (p.authorId === currentUser.id || p.authorId === 'guest')
  );

  const schoolPresentations = mentiPresentations.filter(
    p => p.isShared && (!currentUser || p.authorId !== currentUser.id)
  );

  const archivedPresentations = mentiPresentations.filter(
    p => p.archivedResponses && Object.keys(p.archivedResponses).length > 0
  );

  const currentList = activeTab === 'mine' 
    ? myPresentations 
    : activeTab === 'school' 
    ? schoolPresentations 
    : archivedPresentations;

  const filteredList = currentList.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.authorName && p.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.folder && p.folder.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = 
      selectedSubject === 'Alle Fächer' || p.subject === selectedSubject;

    const matchesFolder = 
      selectedFolder === 'Alle Ordner' || 
      (selectedFolder === 'Ohne Ordner' ? !p.folder : p.folder === selectedFolder);

    return matchesSearch && matchesSubject && matchesFolder;
  });

  const handleAssignFolder = (pres: MentiPresentation) => {
    const folderName = window.prompt(
      `Ordner für "${pres.title}" eingeben oder auswählen (z.B. "Klasse 7a", "Vertretung", "Mathematik"):`,
      pres.folder || ''
    );
    if (folderName !== null) {
      saveMentiPresentation({
        ...pres,
        folder: folderName.trim() || undefined,
        updatedAt: Date.now()
      });
    }
  };

  const handleCreateNew = () => {
    const newPresentation: MentiPresentation = {
      id: `menti-${Date.now()}`,
      title: 'Neue interaktive Abfrage',
      description: 'Erstellt am ' + new Date().toLocaleDateString('de-DE'),
      subject: 'Fächerübergreifend',
      grade: 'Alle Jahrgänge',
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Kollege',
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: [
        {
          id: `slide-${Date.now()}-1`,
          type: 'wordcloud',
          question: 'Welche Gedanken fallen euch zu diesem Thema ein?',
          maxWordsPerUser: 3
        },
        {
          id: `slide-${Date.now()}-2`,
          type: 'choice',
          question: 'Welche Aussage trifft am besten zu?',
          options: [
            { id: 'opt-1', text: 'Option A' },
            { id: 'opt-2', text: 'Option B' },
            { id: 'opt-3', text: 'Option C' }
          ]
        }
      ]
    };
    saveMentiPresentation(newPresentation);
    onEditPresentation(newPresentation);
  };

  const handleDuplicate = async (id: string) => {
    const duplicated = await duplicateMentiPresentation(id);
    setCopiedId(duplicated.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F8FC] via-white to-[#EEF5FB] flex flex-col font-sans select-none text-slate-900">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
            title="Zurück zur Portal-Übersicht"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App-Portal</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900">
                  HBS Menti
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                  Live-Abfragen & Wortwolken
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Interaktive Folien, Live-Votings & Quiz-Wettbewerbe für das Smartboard
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action: + Neue Präsentation erstellen */}
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Neue Abfrage erstellen</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Banner / Value Proposition */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              100 % Kostenfrei & DSGVO-Konform
            </span>
            <h2 className="text-xl font-black">
              Interaktive Unterrichts-Abfragen in Echtzeit
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Schüler scannen den QR-Code oder tippen den 6-stelligen PIN ein. Ergebnisse erscheinen live und animiert als Wortwolke, Balkendiagramm oder Quiz auf dem Smartboard.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-white text-teal-950 font-black text-xs shadow-md hover:bg-slate-100 transition-all active:scale-95"
            >
              Jetzt starten
            </button>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 border border-slate-300/50">
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'mine' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Meine Abfragen ({myPresentations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'school' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kollegiums-Vorlagen ({schoolPresentations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'archive' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Ergebnis-Archiv ({archivedPresentations.length})</span>
            </button>
          </div>

          {/* Search & Subject Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Abfragen durchsuchen..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {SUBJECT_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Alle Ordner">📁 Alle Ordner</option>
              <option value="Ohne Ordner">Ohne Ordner</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>📁 {f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Folder Navigation Pills */}
        {availableFolders.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-slate-400" />
              <span>Ordner:</span>
            </span>
            <button
              onClick={() => setSelectedFolder('Alle Ordner')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFolder === 'Alle Ordner'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Alle ({currentList.length})
            </button>
            {availableFolders.map((f) => {
              const count = currentList.filter(p => p.folder === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedFolder === f
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>{f}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Presentations Grid */}
        {filteredList.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800">
              Keine Abfragen in dieser Ansicht gefunden
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {activeTab === 'mine' 
                ? 'Erstelle deine erste interaktive Abfrage mit Wortwolken, Multiple-Choice oder Quiz!'
                : 'Derzeit sind keine freigegebenen Vorlagen für diesen Filter hinterlegt.'}
            </p>
            {activeTab === 'mine' && (
              <button
                onClick={handleCreateNew}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Jetzt erste Abfrage anlegen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((pres) => {
              const isOwner = currentUser && (pres.authorId === currentUser.id || pres.authorId === 'guest');
              const canDelete = isAdmin || isOwner;

              return (
                <div
                  key={pres.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header & Preview */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pres.subject && (
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100">
                            {pres.subject}
                          </span>
                        )}
                        {/* Folder Badge & Quick Assign */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignFolder(pres);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                            pres.folder
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                          }`}
                          title="Ordner zuweisen oder ändern"
                        >
                          <FolderOpen className="w-2.5 h-2.5 text-amber-600" />
                          <span>{pres.folder || '+ Ordner'}</span>
                        </button>
                        {pres.grade && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-100">
                            {pres.grade}
                          </span>
                        )}
                        {pres.isShared && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5" />
                            Schulvorlage
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                        {pres.slides.length} {pres.slides.length === 1 ? 'Folie' : 'Folien'}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                      {pres.title}
                    </h3>

                    {pres.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {pres.description}
                      </p>
                    )}

                    {/* Slide Types Badges */}
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {pres.slides.slice(0, 4).map((s, idx) => (
                        <span
                          key={s.id || idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium capitalize"
                        >
                          {s.type === 'wordcloud' && '☁️ Wortwolke'}
                          {s.type === 'choice' && '📊 Wahl'}
                          {s.type === 'open' && '💬 Offen'}
                          {s.type === 'scales' && '⚖️ Skalen'}
                          {s.type === 'quiz' && '🏆 Quiz'}
                          {s.type === 'content' && '📄 Info'}
                        </span>
                      ))}
                      {pres.slides.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{pres.slides.length - 4} mehr
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                      {pres.authorName}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Duplicate button */}
                      <button
                        onClick={() => handleDuplicate(pres.id)}
                        className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-600 transition-all active:scale-95 border border-slate-200/80"
                        title="Als Vorlage duplizieren"
                      >
                        {copiedId === pres.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Share toggle */}
                      {isOwner && (
                        <button
                          onClick={() => toggleShareMentiPresentation(pres.id)}
                          className={`p-1.5 rounded-xl transition-all active:scale-95 border ${
                            pres.isShared 
                              ? 'bg-amber-100 text-amber-800 border-amber-300' 
                              : 'bg-white hover:bg-slate-200 text-slate-600 border-slate-200/80'
                          }`}
                          title={pres.isShared ? 'Freigabe aufheben' : 'Für Kollegium freigeben'}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit button */}
                      {isOwner && (
                        <button
                          onClick={() => onEditPresentation(pres)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 border border-slate-200/80 flex items-center gap-1"
                          title="Folien bearbeiten"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete button */}
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Möchtest du "${pres.title}" wirklich löschen?`)) {
                              deleteMentiPresentation(pres.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all border border-slate-200/80"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Start Presentation Button */}
                      <button
                        onClick={() => onStartPresenter(pres)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                        title="Am Beamer / Smartboard präsentieren"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Präsentieren</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
