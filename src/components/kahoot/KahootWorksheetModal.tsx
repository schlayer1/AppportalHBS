import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer
} from 'lucide-react';
import { KahootGame } from '../../types/kahootTypes';

interface KahootWorksheetModalProps {
  game: KahootGame;
  onClose: () => void;
}

export const KahootWorksheetModal: React.FC<KahootWorksheetModalProps> = ({
  game,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'worksheet' | 'solutions' | 'both'>('both');
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [includeNotesSection, setIncludeNotesSection] = useState<boolean>(true);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const totalPoints = game.questions.reduce((acc, q) => acc + (q.points ? Math.round(q.points / 1000) : 1), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      {/* Print-specific stylesheet injected inline */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #kahoot-print-sheet, #kahoot-print-sheet * {
            visibility: visible;
          }
          #kahoot-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 20mm;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Outer Modal Container */}
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 border border-slate-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Toolbar (hidden when printing) */}
        <header className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Notfall-Arbeitsblatt (A4 Druckversion)</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold">
                  PDF / Print
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {game.title} • {game.questions.length} Fragen • Bei WLAN-Ausfall oder für Stillarbeit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Jetzt Drucken</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Settings Bar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 no-print">
          <div className="flex items-center gap-2">
            <span>Druckumfang:</span>
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  activeTab === 'both' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Beides (Arbeitsblatt + Lösungsbogen)
              </button>
              <button
                onClick={() => setActiveTab('worksheet')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  activeTab === 'worksheet' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nur Schülerblatt
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  activeTab === 'solutions' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nur Lösungsbogen (Lehrkraft)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={includeExplanations} 
                onChange={e => setIncludeExplanations(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Erklärungen im Lösungsbogen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={includeNotesSection} 
                onChange={e => setIncludeNotesSection(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Notizzeilen pro Aufgabe</span>
            </label>
          </div>
        </div>

        {/* Printable Paper Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-200/60 flex justify-center">
          <div id="kahoot-print-sheet" className="w-full max-w-[210mm] bg-white p-8 sm:p-12 shadow-md border border-slate-300 font-sans text-slate-900">
            
            {/* 1. STUDENT WORKSHEET */}
            {(activeTab === 'worksheet' || activeTab === 'both') && (
              <div className={(activeTab === 'both' ? 'page-break' : '')}>
                {/* Header with School Branding */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/Siegel_schwarz.png" 
                      alt="HBS Siegel" 
                      className="w-14 h-14 object-contain shrink-0" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/Siegel_bunt.png';
                      }}
                    />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
                        Staatliche Regelschule Heimbürgeschule Kahla
                      </h3>
                      <h1 className="text-xl font-black text-slate-950 tracking-tight">
                        {game.title}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mt-0.5">
                        {game.subject && <span>Fach: <strong>{game.subject}</strong></span>}
                        {game.grade && <span>• Klassenstufe: <strong>{game.grade}</strong></span>}
                        <span>• Aufgaben: <strong>{game.questions.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-bold text-slate-600 border border-slate-300 rounded-xl p-2.5 bg-slate-50 min-w-[170px]">
                    <div className="text-[10px] uppercase text-slate-400 font-black">Bewertung</div>
                    <div className="text-base font-black text-slate-900 mt-1">
                      ____ / {totalPoints} Pkt
                    </div>
                  </div>
                </div>

                {/* Student Info Fields Bar */}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-4 mb-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block">Name, Vorname:</span>
                    <div className="border-b-2 border-dotted border-slate-400 mt-3 pt-1"></div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block">Klasse:</span>
                    <div className="border-b-2 border-dotted border-slate-400 mt-3 pt-1"></div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block">Datum:</span>
                    <div className="border-b-2 border-dotted border-slate-400 mt-3 pt-1"></div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs text-slate-700">
                  <p className="font-bold">
                    Hinweis: Kreuze bei jeder Frage die zutreffende Antwort an. Pro richtige Antwort gibt es die angegebene Punktzahl.
                  </p>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {game.questions.map((q, qIndex) => {
                    const points = q.points ? Math.round(q.points / 1000) : 1;
                    return (
                      <div key={q.id} className="border border-slate-200 rounded-2xl p-4 bg-white break-inside-avoid">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs flex items-center justify-center shrink-0">
                              {qIndex + 1}
                            </span>
                            <span>{q.question}</span>
                          </h4>
                          <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                            ({points} {points === 1 ? 'Punkt' : 'Punkte'})
                          </span>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt) => {
                            const shapeSymbol = opt.shape === 'triangle' ? '▲' : opt.shape === 'diamond' ? '◆' : opt.shape === 'circle' ? '●' : '■';
                            return (
                              <div 
                                key={opt.id}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                              >
                                <div className="w-5 h-5 rounded border-2 border-slate-400 flex items-center justify-center shrink-0">
                                  {/* Empty square for student to check */}
                                </div>
                                <span className="font-mono text-xs text-slate-500 shrink-0">
                                  {shapeSymbol}
                                </span>
                                <span className="break-words">
                                  {opt.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes line */}
                        {includeNotesSection && (
                          <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Notizen / Rechnung:</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  Heimbürgeschule Kahla • Notfall-Arbeitsblatt • Generiert über HBS Schulportal
                </div>
              </div>
            )}

            {/* 2. TEACHER SOLUTION SHEET */}
            {(activeTab === 'solutions' || activeTab === 'both') && (
              <div className={(activeTab === 'both' ? 'mt-12 pt-8 border-t-4 border-purple-600' : '')}>
                {/* Solution Header */}
                <div className="flex items-start justify-between border-b-2 border-purple-800 pb-4 mb-6">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      Nur für Lehrkraft / Vertretungsunterricht
                    </span>
                    <h1 className="text-xl font-black text-slate-950 mt-1">
                      Lösungsbogen: {game.title}
                    </h1>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Gesamtpunkte: {totalPoints} Pkt • Erstellt für {game.grade || 'alle Stufen'}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-right">
                    <span className="text-xs font-black text-purple-900 block">
                      Musterlösung
                    </span>
                    <span className="text-[10px] font-bold text-purple-600">
                      100 % Vollständig
                    </span>
                  </div>
                </div>

                {/* Questions Solutions List */}
                <div className="space-y-4">
                  {game.questions.map((q, qIndex) => {
                    const points = q.points ? Math.round(q.points / 1000) : 1;
                    return (
                      <div key={q.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 break-inside-avoid">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-700 text-white text-xs flex items-center justify-center shrink-0">
                              {qIndex + 1}
                            </span>
                            <span>{q.question}</span>
                          </h4>
                          <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded shrink-0">
                            {points} Pkt
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt) => {
                            const isCorrect = !!opt.isCorrect;
                            const shapeSymbol = opt.shape === 'triangle' ? '▲' : opt.shape === 'diamond' ? '◆' : opt.shape === 'circle' ? '●' : '■';
                            return (
                              <div 
                                key={opt.id}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                                    : 'bg-white border-slate-200 text-slate-500 opacity-60'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 font-black text-xs ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'border border-slate-300'
                                }`}>
                                  {isCorrect && '✓'}
                                </div>
                                <span className="font-mono text-xs shrink-0">
                                  {shapeSymbol}
                                </span>
                                <span className="break-words flex-1">
                                  {opt.text}
                                </span>
                                {isCorrect && (
                                  <span className="text-[10px] uppercase tracking-wider font-black text-emerald-700 shrink-0">
                                    Richtig
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {includeExplanations && q.explanation && (
                          <div className="mt-3 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                            <span className="font-bold shrink-0">💡 Erklärung:</span>
                            <p className="font-medium">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  Heimbürgeschule Kahla • Vertraulicher Lösungsbogen für die Lehrkraft
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
