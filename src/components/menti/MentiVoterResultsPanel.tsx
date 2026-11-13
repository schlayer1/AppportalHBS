import React from 'react';
import { BarChart3, MessageSquare, Cloud, Sliders, Target, ListOrdered, CheckCircle2, Users } from 'lucide-react';
import { MentiSlide } from '../../types/mentiTypes';

interface MentiVoterResultsPanelProps {
  slide: MentiSlide;
  slideResponses: any;
  participantsCount?: number;
  compact?: boolean;
}

const BAR_COLORS = [
  'bg-teal-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-sky-500'
];

export const MentiVoterResultsPanel: React.FC<MentiVoterResultsPanelProps> = ({
  slide,
  slideResponses,
  participantsCount,
  compact = false
}) => {
  const resp = slideResponses;

  // 1. WORD CLOUD
  if (slide.type === 'wordcloud') {
    const counts: Record<string, number> = (resp && typeof resp === 'object' && !Array.isArray(resp)) ? resp : {};
    const entries = Object.entries(counts)
      .filter(([_, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    const maxCount = Math.max(...entries.map(([_, c]) => Number(c)), 1);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <Cloud className="w-3.5 h-3.5" />
            <span>Eingaben der Wortwolke ({entries.length} Begriffe)</span>
          </span>
          {participantsCount !== undefined && participantsCount > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <Users className="w-3 h-3" /> {participantsCount}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400 italic">
            Noch keine Begriffe vorhanden — deine Eingabe wird gleich sichtbar!
          </div>
        ) : (
          <div className={`flex flex-wrap items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/70 via-white to-sky-50/70 border border-teal-100 ${compact ? 'max-h-56 overflow-y-auto' : ''}`}>
            {entries.map(([word, count], idx) => {
              const weight = Number(count) / maxCount;
              const isTop = weight >= 0.7;
              return (
                <span
                  key={word}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold transition-all shadow-2xs ${
                    isTop
                      ? 'bg-teal-600 text-white text-sm sm:text-base'
                      : idx % 3 === 0
                      ? 'bg-indigo-100 text-indigo-900 text-xs sm:text-sm'
                      : idx % 2 === 0
                      ? 'bg-amber-100 text-amber-900 text-xs sm:text-sm'
                      : 'bg-white text-slate-800 border border-slate-200 text-xs'
                  }`}
                >
                  <span>{word}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isTop ? 'bg-white/25 text-white' : 'bg-black/10 text-slate-700'
                  }`}>
                    {String(count)}×
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. MULTIPLE CHOICE & QUIZ
  if (slide.type === 'choice' || slide.type === 'quiz') {
    const counts: Record<string, number> = (resp && typeof resp === 'object' && !Array.isArray(resp)) ? resp : {};
    const options = slide.options || [];
    const totalVotes = options.reduce((sum, opt) => sum + Number(counts[opt.id] || 0), 0);

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Aktuelle Stimmenverteilung ({totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'})</span>
          </span>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => {
            const count = Number(counts[opt.id] || 0);
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];

            return (
              <div key={opt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-black flex items-center justify-center shrink-0 text-slate-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="truncate">{opt.text}</span>
                    {slide.type === 'quiz' && opt.isCorrect && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </span>
                  <span className="font-mono font-black text-slate-700 shrink-0 text-[11px]">
                    {pct}% ({count})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. OPEN-ENDED PINBOARD / FREE TEXT
  if (slide.type === 'open') {
    const items: { id?: string; text: string; timestamp?: number }[] = Array.isArray(resp) ? [...resp].reverse() : [];

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Alle eingereichten Beiträge ({items.length})</span>
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400 italic">
            Noch keine Textbeiträge sichtbar.
          </div>
        ) : (
          <div className={`space-y-2 ${compact ? 'max-h-60' : 'max-h-80'} overflow-y-auto pr-1`}>
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-2xs"
              >
                <p className="font-medium break-words">„{item.text}“</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. SCALES (LIKERT 1..5)
  if (slide.type === 'scales') {
    const stats: Record<string, { sum: number; count: number }> = (resp && typeof resp === 'object' && !Array.isArray(resp)) ? resp : {};
    const scales = slide.scales || [];

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <Sliders className="w-3.5 h-3.5" />
            <span>Durchschnittliche Bewertungen</span>
          </span>
        </div>

        <div className="space-y-2">
          {scales.map((sc, idx) => {
            const st = stats[sc.id] || { sum: 0, count: 0 };
            const avg = st.count > 0 ? st.sum / st.count : 0;
            const pct = (avg / 5) * 100;

            return (
              <div key={sc.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800 truncate">{sc.statement}</span>
                  <span className="font-mono font-black text-teal-700 shrink-0">
                    Ø {avg > 0 ? avg.toFixed(1) : '–'} / 5 ({st.count})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. MATRIX 2X2
  if (slide.type === 'matrix') {
    const votes: { x: number; y: number; label?: string }[] = Array.isArray(resp) ? resp : [];

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <Target className="w-3.5 h-3.5" />
            <span>Alle Positionierungen ({votes.length})</span>
          </span>
        </div>

        <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-slate-50 rounded-2xl border border-slate-300 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="bg-amber-500/5 border-r border-b border-slate-200 p-1.5">
              <span className="text-[9px] font-bold text-amber-800/70 line-clamp-1">
                {slide.matrixConfig?.quadrantTL || 'Oben Links'}
              </span>
            </div>
            <div className="bg-emerald-500/5 border-b border-slate-200 p-1.5 text-right">
              <span className="text-[9px] font-bold text-emerald-800/70 line-clamp-1">
                {slide.matrixConfig?.quadrantTR || 'Oben Rechts'}
              </span>
            </div>
            <div className="bg-slate-500/5 border-r border-slate-200 p-1.5 flex items-end">
              <span className="text-[9px] font-bold text-slate-700/70 line-clamp-1">
                {slide.matrixConfig?.quadrantBL || 'Unten Links'}
              </span>
            </div>
            <div className="bg-blue-500/5 p-1.5 flex items-end justify-end">
              <span className="text-[9px] font-bold text-blue-800/70 line-clamp-1">
                {slide.matrixConfig?.quadrantBR || 'Unten Rechts'}
              </span>
            </div>
          </div>

          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300" />

          {votes.map((pt, idx) => (
            <div
              key={idx}
              className="absolute w-3 h-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-teal-600 border border-white shadow-sm"
              style={{ left: `${pt.x}%`, bottom: `${pt.y}%` }}
              title={pt.label || `Teilnehmer ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // 6. RANKING
  if (slide.type === 'ranking') {
    const submissions: string[][] = Array.isArray(resp) ? resp : [];
    const items = slide.rankingItems || [];
    const totalItems = items.length;

    const rankedItems = items.map(item => {
      let totalPoints = 0;
      let count = 0;
      submissions.forEach(order => {
        if (!Array.isArray(order)) return;
        const pos = order.indexOf(item.id);
        if (pos !== -1) {
          totalPoints += (totalItems - pos);
          count += 1;
        }
      });
      const avgScore = count > 0 ? totalPoints / count : 0;
      return { ...item, avgScore, count };
    }).sort((a, b) => b.avgScore - a.avgScore);

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-teal-700">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Gruppen-Rangfolge ({submissions.length} Abgaben)</span>
          </span>
        </div>

        <div className="space-y-1.5">
          {rankedItems.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className={`w-6 h-6 rounded-lg font-black flex items-center justify-center shrink-0 ${
                idx === 0 ? 'bg-amber-400 text-amber-950' :
                idx === 1 ? 'bg-slate-300 text-slate-800' :
                idx === 2 ? 'bg-amber-700/20 text-amber-900' :
                'bg-white border border-slate-200 text-slate-600'
              }`}>
                #{idx + 1}
              </span>
              <span className="font-bold text-slate-800 flex-1 truncate">{item.text}</span>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                Ø {item.avgScore.toFixed(1)} Pkt
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
