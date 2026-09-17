import React, { useState } from 'react';
import { 
  Plus, 
  Play, 
  Edit3, 
  Copy, 
  Trash2, 
  Share2, 
  Search, 
  HelpCircle, 
  Sparkles,
  ArrowLeft,
  Check,
  Flame,
  Award,
  Users,
  Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { KahootGame, KahootQuestion } from '../../types/kahootTypes';
import { KahootAiModal } from './KahootAiModal';
import { KahootWorksheetModal } from './KahootWorksheetModal';

interface KahootDashboardProps {
  onBackToPortal: () => void;
  onEditGame: (game: KahootGame) => void;
  onStartGame: (game: KahootGame) => void;
}

const SUBJECT_LIST = [
  'Alle Fächer',
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
  'Sport'
];

export const KahootDashboard: React.FC<KahootDashboardProps> = ({
  onBackToPortal,
  onEditGame,
  onStartGame,
}) => {
  const { 
    kahootGames, 
    currentUser, 
    isAdmin, 
    saveKahootGame, 
    deleteKahootGame, 
    toggleShareKahootGame, 
    duplicateKahootGame 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'mine' | 'school'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Alle Fächer');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [targetGameForAi, setTargetGameForAi] = useState<KahootGame | null>(null);

  // Worksheet Modal state
  const [worksheetGame, setWorksheetGame] = useState<KahootGame | null>(null);

  // Filter games
  const myGames = kahootGames.filter(
    g => currentUser && (g.authorId === currentUser.id || g.authorId === 'guest')
  );

  const schoolGames = kahootGames.filter(
    g => g.isShared && (!currentUser || g.authorId !== currentUser.id)
  );

  const currentList = activeTab === 'mine' ? myGames : schoolGames;

  const filteredList = currentList.filter(g => {
    const matchesSearch = 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.authorName && g.authorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = 
      selectedSubject === 'Alle Fächer' || g.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const handleCreateNewBlank = () => {
    const newGame: KahootGame = {
      id: `kahoot-${Date.now()}`,
      title: 'Neues Quiz',
      description: 'Erstellt am ' + new Date().toLocaleDateString('de-DE'),
      subject: 'Mathematik',
      grade: 'Klasse 7',
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Kollege',
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timesPlayed: 0,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          question: 'Hier Fragetext eingeben...',
          timeLimitSeconds: 20,
          points: 1000,
          type: 'quiz',
          options: [
            { id: 'opt-1', text: 'Option 1 (Rot)', isCorrect: true, shape: 'triangle', color: 'red' },
            { id: 'opt-2', text: 'Option 2 (Blau)', isCorrect: false, shape: 'diamond', color: 'blue' },
            { id: 'opt-3', text: 'Option 3 (Gelb)', isCorrect: false, shape: 'circle', color: 'yellow' },
            { id: 'opt-4', text: 'Option 4 (Grün)', isCorrect: false, shape: 'square', color: 'green' }
          ]
        }
      ]
    };
    saveKahootGame(newGame);
    onEditGame(newGame);
  };

  const handleDuplicate = async (id: string) => {
    const duplicated = await duplicateKahootGame(id);
    setCopiedId(duplicated.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAiNew = () => {
    setTargetGameForAi(null);
    setIsAiModalOpen(true);
  };

  const handleOpenAiForGame = (game: KahootGame) => {
    setTargetGameForAi(game);
    setIsAiModalOpen(true);
  };

  const handleImportAiQuestions = (newQuestions: KahootQuestion[]) => {
    if (targetGameForAi) {
      // Append to existing game
      const updated: KahootGame = {
        ...targetGameForAi,
        questions: [...targetGameForAi.questions, ...newQuestions],
        updatedAt: Date.now()
      };
      saveKahootGame(updated);
      onEditGame(updated);
    } else {
      // Create fresh new game with these questions
      const firstQ = newQuestions[0];
      const newGame: KahootGame = {
        id: `kahoot-ai-${Date.now()}`,
        title: 'KI Quiz: ' + (firstQ?.question?.slice(0, 30) || 'Neue Fragen') + '...',
        description: `KI-generiertes Quiz mit ${newQuestions.length} Fragen für den Unterricht.`,
        subject: 'Fächerübergreifend',
        grade: 'Klasse 7',
        authorId: currentUser?.id || 'guest',
        authorName: currentUser?.name || 'Kollege',
        isShared: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timesPlayed: 0,
        questions: newQuestions
      };
      saveKahootGame(newGame);
      onEditGame(newGame);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF5FF] via-white to-[#F3E8FF] flex flex-col font-sans select-none text-slate-900">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
            title="Zurück zur Portal-Übersicht"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">App-Portal</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              K!
            </div>
            <span className="text-base font-black tracking-tight text-slate-800">
              HBS Kahoot!
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAiNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white font-black text-xs shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Mit KI generieren</span>
          </button>

          <button
            onClick={handleCreateNewBlank}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neues Quiz</span>
          </button>
        </div>
      </header>

      {/* Hero / Banner */}
      <section className="px-4 sm:px-8 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider mb-3 text-purple-200 border border-white/10">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Smartboard Live-Wettkampf & Übungsmodus
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Echtes Kahoot-Feeling direkt auf Smartboard & Schülerhandys.
            </h1>
            <p className="mt-2 text-sm text-purple-100/90 font-medium leading-relaxed">
              Spannende 4-Farben-Quizze (🔺🔷🟡🟩), Countdown-Timer, Live-Ranglisten mit Streaks und Siegerpodest. Nutze den KI-Assistenten, um in Sekunden lehrplangerechte Fragen zu erstellen!
            </p>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-6 -bottom-10 opacity-20 pointer-events-none hidden md:flex items-center gap-3 text-8xl font-black">
            <span>🔺</span>
            <span>🔷</span>
            <span>🟡</span>
            <span>🟩</span>
          </div>
        </div>
      </section>

      {/* Tabs & Filters */}
      <main className="flex-1 px-4 sm:px-8 py-4 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-purple-100 pb-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'mine'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Meine Quizze ({myGames.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'school'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kollegiums-Vorlagen ({schoolGames.length})</span>
            </button>
          </div>

          {/* Search & Subject Dropdown */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quiz oder Fach suchen..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              {SUBJECT_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Games Grid */}
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-purple-200 p-12 text-center flex flex-col items-center justify-center my-6">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 text-2xl font-black">
              🎲
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Keine Quizze gefunden
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-6">
              {activeTab === 'mine' 
                ? 'Du hast noch kein Quiz erstellt. Generiere eins mit KI oder starte eine leere Vorlage!'
                : 'Im Kollegium wurden noch keine geteilten Quizze für dieses Fach hinterlegt.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAiNew}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Quiz mit KI erstellen</span>
              </button>
              <button
                onClick={handleCreateNewBlank}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Manuell anlegen</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map(game => (
              <div
                key={game.id}
                className="group bg-white rounded-3xl border border-purple-100/80 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-purple-300 relative overflow-hidden"
              >
                {/* Top badges & play count */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[10px] font-black uppercase tracking-wider border border-purple-200/50">
                      {game.subject || 'Allgemein'} • {game.grade || 'Alle Klassen'}
                    </span>

                    {game.isShared && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Geteilt
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 leading-snug">
                    {game.title}
                  </h3>

                  {game.description && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1.5">
                      {game.description}
                    </p>
                  )}

                  {/* Shapes mini indicator preview */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs">🔺</span>
                    <span className="text-xs">🔷</span>
                    <span className="text-xs">🟡</span>
                    <span className="text-xs">🟩</span>
                    <span className="text-[11px] font-bold text-slate-500 ml-1">
                      {game.questions.length} Fragen
                    </span>
                    {game.timesPlayed !== undefined && game.timesPlayed > 0 && (
                      <span className="text-[11px] font-medium text-slate-400 ml-auto flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        {game.timesPlayed}x gespielt
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartGame(game)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-all active:scale-95"
                      title="Live-Präsentation auf Smartboard starten"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Spielen</span>
                    </button>

                    <button
                      onClick={() => onEditGame(game)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                      title="Quiz bearbeiten"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenAiForGame(game)}
                      className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all active:scale-95"
                      title="✨ Mit KI neue Fragen hinzufügen"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setWorksheetGame(game)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                      title="Notfall-Arbeitsblatt & Lösungsbogen drucken (A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(game.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                      title="Duplizieren"
                    >
                      {copiedId === game.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {(isAdmin || (currentUser && game.authorId === currentUser.id) || game.authorId === 'guest') && (
                      <>
                        <button
                          onClick={() => toggleShareKahootGame(game.id)}
                          className={`p-2 rounded-xl transition-all ${
                            game.isShared 
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={game.isShared ? 'Für Kollegium freigegeben (Klicken zum Entziehen)' : 'Mit Kollegium teilen'}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Möchtest du "${game.title}" wirklich löschen?`)) {
                              deleteKahootGame(game.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* AI Quiz Generator Modal */}
      <KahootAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImportQuestions={handleImportAiQuestions}
        defaultSubject={targetGameForAi?.subject || selectedSubject !== 'Alle Fächer' ? selectedSubject : 'Mathematik'}
        defaultGrade={targetGameForAi?.grade || 'Klasse 7'}
      />

      {/* Emergency Worksheet Modal */}
      {worksheetGame && (
        <KahootWorksheetModal
          game={worksheetGame}
          onClose={() => setWorksheetGame(null)}
        />
      )}

    </div>
  );
};
