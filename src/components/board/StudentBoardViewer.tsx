import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Youtube, 
  Download, 
  CheckCircle2, 
  Calendar, 
  User, 
  ArrowLeft,
  Share2,
  ZoomIn
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PORTAL_CONFIG } from '../../config/apps';

interface SharedBoardData {
  title: string;
  teacherName?: string;
  subject?: string;
  grade?: string;
  targetDate?: string;
  notes?: string[];
  tasks?: { id: string; text: string; done: boolean }[];
  mediaLinks?: { title: string; url: string; type: 'video' | 'link' }[];
  snapshotUrl?: string;
  updatedAt?: number;
}

interface StudentBoardViewerProps {
  onClose?: () => void;
}

export const StudentBoardViewer: React.FC<StudentBoardViewerProps> = ({ onClose }) => {
  const [boardData, setBoardData] = useState<SharedBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    // 1. Try to load from Firestore live stream
    if (db) {
      try {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        const unsubscribe = onSnapshot(portalDocRef, (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            if (d.sharedBoard) {
              setBoardData(d.sharedBoard as SharedBoardData);
              setLoading(false);
              return;
            }
          }
          // Fallback to local cache if no cloud data
          loadFromLocalCache();
        });
        return () => unsubscribe();
      } catch (e) {
        console.warn('Firestore load error in StudentBoardViewer:', e);
        loadFromLocalCache();
      }
    } else {
      loadFromLocalCache();
    }
  }, []);

  const loadFromLocalCache = () => {
    try {
      const cached = localStorage.getItem('hbs_live_shared_board');
      if (cached) {
        setBoardData(JSON.parse(cached));
      } else {
        // Fallback default from URL search params if present
        const params = new URLSearchParams(window.location.search);
        const titleParam = params.get('boardShare');
        setBoardData({
          title: titleParam && titleParam !== 'active' ? decodeURIComponent(titleParam) : 'Aktuelles Tafelbild',
          teacherName: 'Fachlehrer',
          targetDate: new Date().toLocaleDateString('de-DE'),
          notes: ['Die Inhalte dieses Tafelbildes wurden für deine Klasse freigegeben.'],
          tasks: [
            { id: '1', text: 'Tafelbild ins Heft übernehmen', done: false },
            { id: '2', text: 'Hausaufgaben bis zur nächsten Stunde erledigen', done: false }
          ]
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDownloadSnapshot = () => {
    if (!boardData?.snapshotUrl) return;
    const a = document.createElement('a');
    a.href = boardData.snapshotUrl;
    a.download = `Tafelbild_${(boardData.title || 'HBS').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-hbs-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Tafelbild wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-hbs-blue selection:text-white">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-sm border border-slate-700 flex items-center justify-center shrink-0">
            <img src="/Siegel_bunt.png" alt="HBS Siegel" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-hbs-blue-light block leading-none">
              {PORTAL_CONFIG.schoolName}
            </span>
            <h1 className="text-sm font-black text-white leading-tight mt-0.5 truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
              {boardData?.title || 'Tafelbild'}
            </h1>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Schließen</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Info Banner */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-hbs-blue-light" />
                {boardData?.targetDate || new Date().toLocaleDateString('de-DE')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-hbs-teal-light" />
                {boardData?.teacherName || 'Fachlehrer'}
              </span>
              {boardData?.subject && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-hbs-blue/20 text-hbs-blue-light text-[11px] font-bold">
                    {boardData.subject}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Dieses Tafelbild steht dir zum Nacharbeiten, Abschreiben ins Heft und Lernen zur Verfügung.
            </p>
          </div>

          {boardData?.snapshotUrl && (
            <button
              onClick={handleDownloadSnapshot}
              className="px-3.5 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Bild speichern</span>
            </button>
          )}
        </div>

        {/* Visual Board Snapshot (if available) */}
        {boardData?.snapshotUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-hbs-blue-light" />
                <span>Originale Tafelansicht</span>
              </span>
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-xs text-hbs-blue-light hover:underline flex items-center gap-1"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{isZoomed ? 'Normalansicht' : 'Vergrößern'}</span>
              </button>
            </div>

            <div 
              onClick={() => setIsZoomed(!isZoomed)}
              className={`rounded-2xl overflow-hidden border-2 border-slate-700 bg-black/40 shadow-xl cursor-pointer transition-all ${
                isZoomed ? 'scale-100' : 'hover:border-hbs-blue/50'
              }`}
            >
              <img
                src={boardData.snapshotUrl}
                alt="Tafelbild Screenshot"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
            </div>
          </div>
        )}

        {/* Tasks & Checklist */}
        {boardData?.tasks && boardData.tasks.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Aufgaben & Hausaufgaben ({boardData.tasks.length})</span>
            </span>

            <div className="space-y-2">
              {boardData.tasks.map((task) => {
                const isDone = checkedTasks[task.id] ?? task.done;
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-950/30 border-emerald-800/40 text-slate-400 line-through'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-700/80 text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 text-slate-900'
                            : 'border-slate-500 bg-slate-800'
                        }`}
                      >
                        {isDone && <span className="text-xs font-black">✓</span>}
                      </div>
                      <span className="text-xs sm:text-sm">{task.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tafeltexte & Notizen */}
        {boardData?.notes && boardData.notes.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-hbs-blue-light" />
              <span>Tafelnotizen & Hefteintrag</span>
            </span>

            <div className="space-y-3">
              {boardData.notes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/80 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media & Web Links */}
        {boardData?.mediaLinks && boardData.mediaLinks.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Unterrichtsmedien & Weblinks</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {boardData.mediaLinks.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-700/80 hover:border-sky-500/50 flex items-center justify-between gap-2 text-xs font-bold text-sky-300 transition-all group"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.type === 'video' ? (
                      <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <span className="truncate group-hover:text-sky-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 shrink-0">Öffnen ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        {PORTAL_CONFIG.schoolName} • Digitales Klassenzimmer
      </footer>
    </div>
  );
};
