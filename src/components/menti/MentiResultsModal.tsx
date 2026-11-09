import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  BarChart3, 
  Users, 
  RotateCcw, 
  Printer, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Presentation,
  MessageSquare,
  TrendingUp,
  Layers,
  Share2,
  RefreshCw
} from 'lucide-react';
import { MentiPresentation, MentiSlide, MentiLiveSession } from '../../types/mentiTypes';
import { 
  getMentiLiveSessionFromCloud, 
  resetMentiSessionResponsesInCloud 
} from '../../services/firebase';

interface MentiResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: MentiPresentation;
  onResetResponses?: (presentationId: string) => Promise<void>;
  onStartPresenter?: (presentation: MentiPresentation) => void;
  onOpenShareModal?: (presentation: MentiPresentation) => void;
}

export const MentiResultsModal: React.FC<MentiResultsModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onResetResponses,
  onStartPresenter,
  onOpenShareModal
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [liveSession, setLiveSession] = useState<MentiLiveSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const surveyCode = presentation.surveySettings?.surveyCode;

  // Load responses from Firestore when modal opens
  const fetchCloudResponses = async () => {
    setIsLoading(true);
    try {
      if (surveyCode) {
        const cloudData = await getMentiLiveSessionFromCloud(surveyCode);
        if (cloudData) {
          setLiveSession(cloudData);
        }
      }
    } catch (e) {
      console.warn('Could not load survey results from cloud:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCloudResponses();
    }
  }, [isOpen, surveyCode]);

  // Merge responses: prefer live Firestore data, fallback to archived presentation responses
  const mergedResponses: Record<string, any> = useMemo(() => {
    return liveSession?.responses || presentation.archivedResponses || {};
  }, [liveSession?.responses, presentation.archivedResponses]);

  const totalParticipants = liveSession?.participantsCount ?? presentation.responsesCount ?? 0;

  const slides = presentation.slides || [];
  const activeSlide: MentiSlide | undefined = slides[activeSlideIndex] || slides[0];

  // Compute Word Cloud data for active slide
  const wordCloudData = useMemo(() => {
    if (!activeSlide || activeSlide.type !== 'wordcloud') return [];
    const counts: Record<string, number> = mergedResponses[activeSlide.id] || {};
    const entries = Object.entries(counts).filter(([_, count]) => count > 0);
    if (entries.length === 0) return [];
    const maxCount = Math.max(...entries.map(([_, c]) => c), 1);
    
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => {
        const ratio = count / maxCount;
        const fontSizeRem = 0.9 + ratio * 1.5; // 0.9rem to 2.4rem
        return { word, count, fontSizeRem };
      });
  }, [activeSlide, mergedResponses]);

  // Compute Choice data for active slide
  const choiceData = useMemo(() => {
    if (!activeSlide || (activeSlide.type !== 'choice' && activeSlide.type !== 'quiz')) return [];
    const counts: Record<string, number> = mergedResponses[activeSlide.id] || {};
    const totalVotes = Object.values(counts).reduce((a, b) => a + Number(b), 0);
    
    return (activeSlide.options || []).map(opt => {
      const count = counts[opt.id] || 0;
      const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        ...opt,
        count,
        percent
      };
    });
  }, [activeSlide, mergedResponses]);

  // Compute Open-ended responses
  const openResponses = useMemo(() => {
    if (!activeSlide || activeSlide.type !== 'open') return [];
    const data = mergedResponses[activeSlide.id];
    return Array.isArray(data) ? data : [];
  }, [activeSlide, mergedResponses]);

  // Compute Scales data
  const scalesData = useMemo(() => {
    if (!activeSlide || activeSlide.type !== 'scales') return [];
    const stats: Record<string, { sum: number; count: number }> = mergedResponses[activeSlide.id] || {};
    return (activeSlide.scales || []).map(sc => {
      const stat = stats[sc.id] || { sum: 0, count: 0 };
      const avg = stat.count > 0 ? (stat.sum / stat.count).toFixed(1) : '–';
      const percent = stat.count > 0 ? ((stat.sum / stat.count) / 5) * 100 : 0;
      return {
        ...sc,
        avg,
        percent,
        count: stat.count
      };
    });
  }, [activeSlide, mergedResponses]);

  // Compute Matrix data
  const matrixData = useMemo(() => {
    if (!activeSlide || activeSlide.type !== 'matrix') return { points: [], avgX: 50, avgY: 50, count: 0 };
    const votes: { x: number; y: number; label?: string }[] = mergedResponses[activeSlide.id] || [];
    if (!Array.isArray(votes) || votes.length === 0) return { points: [], avgX: 50, avgY: 50, count: 0 };
    const sumX = votes.reduce((acc, v) => acc + (v.x || 50), 0);
    const sumY = votes.reduce((acc, v) => acc + (v.y || 50), 0);
    return {
      points: votes,
      avgX: Math.round(sumX / votes.length),
      avgY: Math.round(sumY / votes.length),
      count: votes.length
    };
  }, [activeSlide, mergedResponses]);

  // Compute Ranking data
  const rankingData = useMemo(() => {
    if (!activeSlide || activeSlide.type !== 'ranking') return [];
    const votes: string[][] = mergedResponses[activeSlide.id] || [];
    const items = activeSlide.rankingItems || [];
    if (!Array.isArray(votes) || votes.length === 0 || items.length === 0) return [];

    const scores: Record<string, number> = {};
    items.forEach(it => { scores[it.id] = 0; });

    votes.forEach(orderIds => {
      if (Array.isArray(orderIds)) {
        orderIds.forEach((id, idx) => {
          const points = Math.max(items.length - idx, 1);
          scores[id] = (scores[id] || 0) + points;
        });
      }
    });

    const maxScore = Math.max(...Object.values(scores), 1);
    return items
      .map(it => ({
        ...it,
        score: scores[it.id] || 0,
        percent: Math.round(((scores[it.id] || 0) / maxScore) * 100)
      }))
      .sort((a, b) => b.score - a.score);
  }, [activeSlide, mergedResponses]);

  // Reset results handler
  const handleReset = async () => {
    if (!window.confirm('Möchtest du alle bisherigen Antworten dieser Umfrage wirklich unwiderruflich löschen, um eine neue Runde zu starten?')) {
      return;
    }
    setIsResetting(true);
    try {
      if (surveyCode) {
        await resetMentiSessionResponsesInCloud(surveyCode);
      }
      if (onResetResponses) {
        await onResetResponses(presentation.id);
      }
      setLiveSession(prev => prev ? { ...prev, responses: {}, participantsCount: 0 } : null);
    } catch (e) {
      console.error('Error resetting responses:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-wider border border-teal-500/30">
                  Umfrage-Ergebnisse
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <Users className="w-3 h-3 text-teal-400" />
                  {totalParticipants} {totalParticipants === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                </span>
                {presentation.surveySettings?.isEnabled && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    🟢 Link aktiv (PIN: {surveyCode})
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5 line-clamp-1">
                {presentation.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCloudResponses}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Ergebnisse aus Cloud aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Ergebnisse drucken"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Selector Carousel Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Folien ({slides.length}):
          </span>

          {slides.map((s, idx) => {
            const isCurrent = idx === activeSlideIndex;
            return (
              <button
                key={s.id || idx}
                onClick={() => setActiveSlideIndex(idx)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/10 text-[10px] flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="max-w-[130px] truncate">{s.question || `Folie ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>

        {/* Active Slide Results View */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-left">
          
          {activeSlide && (
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-black uppercase tracking-wider border border-teal-100">
                      {activeSlide.type === 'wordcloud' && '☁️ Wortwolke'}
                      {activeSlide.type === 'choice' && '📊 Multiple Choice'}
                      {activeSlide.type === 'open' && '💬 Offene Antworten'}
                      {activeSlide.type === 'scales' && '⚖️ Bewertungsskala'}
                      {activeSlide.type === 'quiz' && '🏆 Quiz-Frage'}
                      {activeSlide.type === 'matrix' && '🎯 2x2 Matrix'}
                      {activeSlide.type === 'ranking' && '🥇 Rangfolge'}
                      {activeSlide.type === 'content' && '📄 Infofolie'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      Folie {activeSlideIndex + 1} von {slides.length}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    {activeSlide.question}
                  </h3>
                  {activeSlide.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {activeSlide.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(prev => Math.max(prev - 1, 0))}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-all cursor-pointer"
                    title="Vorherige Folie"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={activeSlideIndex === slides.length - 1}
                    onClick={() => setActiveSlideIndex(prev => Math.min(prev + 1, slides.length - 1))}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-all cursor-pointer"
                    title="Nächste Folie"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VISUALIZATION CONTAINER */}
              <div className="min-h-[280px] flex items-center justify-center p-2">

                {/* 1. WORD CLOUD */}
                {activeSlide.type === 'wordcloud' && (
                  <div className="w-full space-y-6">
                    {wordCloudData.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold">Noch keine Begriffe für diese Wortwolke eingegangen.</p>
                      </div>
                    ) : (
                      <>
                        {/* Word cloud tags */}
                        <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-slate-50/70 rounded-3xl border border-slate-100 min-h-[220px]">
                          {wordCloudData.map(({ word, count, fontSizeRem }, idx) => {
                            const colors = [
                              'text-teal-700 bg-teal-50 border-teal-200',
                              'text-emerald-700 bg-emerald-50 border-emerald-200',
                              'text-sky-700 bg-sky-50 border-sky-200',
                              'text-amber-800 bg-amber-50 border-amber-200',
                              'text-purple-700 bg-purple-50 border-purple-200',
                              'text-rose-700 bg-rose-50 border-rose-200'
                            ];
                            const colorClass = colors[idx % colors.length];

                            return (
                              <span
                                key={word}
                                style={{ fontSize: `${fontSizeRem}rem` }}
                                className={`px-4 py-1.5 rounded-2xl font-black border tracking-tight shadow-xs flex items-center gap-2 transition-all ${colorClass}`}
                              >
                                <span>{word}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 font-mono shadow-2xs">
                                  {count}x
                                </span>
                              </span>
                            );
                          })}
                        </div>

                        {/* Frequency ranking table */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex justify-between">
                            <span>Eingereichte Begriffe ({wordCloudData.length})</span>
                            <span>Häufigkeit</span>
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {wordCloudData.map((item, idx) => (
                              <div key={item.word} className="p-2.5 px-4 text-xs flex justify-between items-center">
                                <span className="font-semibold text-slate-800 flex items-center gap-2">
                                  <span className="w-5 text-slate-400 font-mono">{idx + 1}.</span>
                                  {item.word}
                                </span>
                                <span className="font-mono font-bold text-teal-700 px-2 py-0.5 bg-teal-50 rounded-lg">
                                  {item.count} Stimmen
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 2. CHOICE & QUIZ BAR CHARTS */}
                {(activeSlide.type === 'choice' || activeSlide.type === 'quiz') && (
                  <div className="w-full space-y-4 max-w-2xl mx-auto">
                    {choiceData.map((opt, idx) => {
                      const barColors = [
                        'from-teal-500 to-emerald-500',
                        'from-blue-500 to-cyan-500',
                        'from-purple-500 to-indigo-500',
                        'from-amber-500 to-orange-500'
                      ];
                      const bgGrad = barColors[idx % barColors.length];

                      return (
                        <div key={opt.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-slate-800 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-mono">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opt.text}</span>
                              {opt.isCorrect && (
                                <span className="text-emerald-700 text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center gap-1 font-bold">
                                  <Check className="w-3 h-3" /> Richtige Antwort
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-teal-700 font-black">
                              {opt.percent}% <span className="text-xs text-slate-400 font-normal">({opt.count} Stimmen)</span>
                            </span>
                          </div>

                          <div className="h-8 rounded-xl bg-slate-100 border border-slate-200 p-1 overflow-hidden relative">
                            <div
                              style={{ width: `${Math.max(opt.percent, 2)}%` }}
                              className={`h-full rounded-lg bg-gradient-to-r ${bgGrad} transition-all duration-700 shadow-xs`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. OPEN-ENDED THOUGHTS */}
                {activeSlide.type === 'open' && (
                  <div className="w-full">
                    {openResponses.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold">Noch keine schriftlichen Antworten abgegeben.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {openResponses.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 shadow-xs flex flex-col justify-between gap-3 text-left"
                          >
                            <p className="text-sm font-semibold leading-relaxed">
                              „{item.text}“
                            </p>
                            <span className="text-[10px] text-amber-700/60 font-mono">
                              {item.timestamp ? new Date(item.timestamp).toLocaleString('de-DE') : `Antwort #${idx + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SCALES (LIKERT) */}
                {activeSlide.type === 'scales' && (
                  <div className="w-full max-w-2xl mx-auto space-y-4">
                    {scalesData.map(sc => (
                      <div key={sc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-sm font-black text-slate-900">
                          <span>{sc.statement}</span>
                          <span className="font-mono text-amber-800 text-base px-2.5 py-0.5 rounded-xl bg-amber-100 border border-amber-300">
                            Ø {sc.avg} / 5.0
                          </span>
                        </div>

                        <div className="h-3.5 rounded-full bg-slate-200 overflow-hidden relative">
                          <div
                            style={{ width: `${sc.percent}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-500 transition-all duration-700"
                          />
                        </div>

                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>1 = {sc.lowLabel || 'Gar nicht'}</span>
                          <span>{sc.count} Bewertungen</span>
                          <span>5 = {sc.highLabel || 'Voll'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. 2X2 MATRIX */}
                {activeSlide.type === 'matrix' && (
                  <div className="w-full max-w-md mx-auto space-y-2">
                    <div className="text-center text-xs font-black uppercase text-teal-700">
                      ▲ {activeSlide.matrixConfig?.yHighLabel || 'Hoher Aufwand'}
                    </div>

                    <div className="relative aspect-square w-full max-h-[360px] mx-auto rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-xl overflow-hidden p-4">
                      {/* Quadrants */}
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                        <div className="border-r border-b border-white/10 p-2 text-[10px] text-slate-400">II</div>
                        <div className="border-b border-white/10 bg-teal-500/5 p-2 text-[10px] text-teal-300 text-right">I (Optimal)</div>
                        <div className="border-r border-white/10 p-2 text-[10px] text-slate-400 flex items-end">III</div>
                        <div className="p-2 text-[10px] text-slate-400 flex items-end justify-end">IV</div>
                      </div>

                      {/* Axes */}
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-teal-400/40" />
                      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-teal-400/40" />

                      {/* Scatter dots */}
                      {matrixData.points.map((pt, i) => (
                        <div
                          key={i}
                          style={{ left: `${pt.x}%`, bottom: `${pt.y}%` }}
                          className="absolute w-3 h-3 -ml-1.5 -mb-1.5 rounded-full bg-teal-400 ring-2 ring-teal-300/40"
                          title={`Punkt: (${pt.x}%, ${pt.y}%)`}
                        />
                      ))}

                      {/* Average Centroid */}
                      {matrixData.count > 0 && (
                        <div
                          style={{ left: `${matrixData.avgX}%`, bottom: `${matrixData.avgY}%` }}
                          className="absolute -ml-4 -mb-4 z-20 flex flex-col items-center pointer-events-none"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-amber-300/50">
                            Ø
                          </div>
                          <span className="mt-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black shadow-xs whitespace-nowrap">
                            Mittelwert: {matrixData.avgX}% / {matrixData.avgY}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs font-black uppercase text-slate-500">
                      ▼ {activeSlide.matrixConfig?.yLowLabel || 'Geringer Aufwand'}
                    </div>

                    <div className="flex justify-between text-xs font-black uppercase text-slate-600 px-2">
                      <span>◄ {activeSlide.matrixConfig?.xLowLabel || 'Geringer Nutzen'}</span>
                      <span>{activeSlide.matrixConfig?.xHighLabel || 'Hoher Nutzen'} ►</span>
                    </div>
                  </div>
                )}

                {/* 6. RANKING */}
                {activeSlide.type === 'ranking' && (
                  <div className="w-full max-w-xl mx-auto space-y-3">
                    {rankingData.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <TrendingUp className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold">Noch keine Rangfolgen eingereicht.</p>
                      </div>
                    ) : (
                      rankingData.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white relative overflow-hidden flex items-center justify-between gap-4 shadow-xs"
                        >
                          <div
                            style={{ width: `${item.percent}%` }}
                            className="absolute inset-y-0 left-0 bg-teal-50 opacity-80"
                          />

                          <div className="relative z-10 flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                              idx === 0 
                                ? 'bg-amber-400 text-slate-950 shadow-xs' 
                                : idx === 1 
                                ? 'bg-slate-300 text-slate-900' 
                                : idx === 2 
                                ? 'bg-amber-700 text-white' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{item.text}</span>
                          </div>

                          <span className="relative z-10 font-mono font-black text-teal-700 text-xs">
                            {item.score} Rangpunkte
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 7. INFO / CONTENT SLIDE */}
                {activeSlide.type === 'content' && (
                  <div className="max-w-md w-full p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 text-left">
                    <div className="text-4xl text-center">{activeSlide.emoji || '💡'}</div>
                    <div className="font-bold text-slate-800 text-base text-center">Inhaltsfolie</div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {(activeSlide.bulletPoints || []).map((pt, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isResetting || totalParticipants === 0}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              title="Alle Antworten löschen & Umfrage zurücksetzen"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Ergebnisse zurücksetzen</span>
            </button>

            {onOpenShareModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenShareModal(presentation);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Freigabe-Link anpassen</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onStartPresenter && (
              <button
                onClick={() => {
                  onClose();
                  onStartPresenter(presentation);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Am Beamer zeigen</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
