import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Check,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  ArrowLeft,
  ArrowRight,
  Dices,
  Users,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Sparkles,
} from 'lucide-react';

export type DemoId =
  | 'geschichte'
  | 'escape'
  | 'simulation'
  | 'schritte'
  | 'zuordnen'
  | 'karten'
  | 'generator'
  | 'quiz'
  | 'check'
  | 'zufall'
  | 'timer';

interface DemoProps {
  onTried: (id: DemoId) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ============================================================================
 * 1. ENTSCHEIDUNGSGESCHICHTE (Einstieg · Geschichte Kl. 6)
 * ============================================================================ */
interface StoryNode {
  text: string;
  options?: { label: string; next: string }[];
  lessonTitle?: string;
  lessonText?: string;
}

const STORY_NODES: Record<string, StoryNode> = {
  start: {
    text: 'Du leitest im Alten Ägypten die Ernteplanung deines Dorfes am Nil. Die nächste Nilschwemme steht bevor. Was hat für dich Vorrang?',
    options: [
      { label: 'Wir bauen neue Bewässerungskanäle bis zu den höher gelegenen Feldern.', next: 'kanaele' },
      { label: 'Wir bessern zuerst die großen Kornspeicher des Dorfes aus.', next: 'speicher' },
    ],
  },
  kanaele: {
    text: 'Die Flut kommt stark. Durch deine Kanäle wird viel mehr Ackerland bewässert als sonst – doch ein plötzlicher Dammbruch droht ein Feld zu überspülen.',
    options: [
      { label: 'Alle Dorfbewohner rücken sofort aus und sichern gemeinsam den Damm.', next: 'e_bewaesserung' },
      { label: 'Jede Familie kümmert sich nur um ihr eigenes kleines Feldstück.', next: 'e_missernte' },
    ],
  },
  speicher: {
    text: 'Die Kornspeicher sind dicht und trocken. Als die Beamten des Pharaos die Abgaben berechnen, fällt die Ernte wegen eines kurzen Nilhochwassers kleiner aus.',
    options: [
      { label: 'Ihr nutzt die Vorräte aus dem Vorjahr, um die Abgabe zu leisten.', next: 'e_vorrat' },
      { label: 'Ihr verweigert die Abgabe an die Beamten des Pharaos.', next: 'e_tribut' },
    ],
  },
  e_bewaesserung: {
    text: 'Der Damm hält! Das Dorf fährt eine Rekordernte ein, weil das Nilwasser gezielt auf alle Felder geleitet wurde.',
    lessonTitle: 'Bewässerungsfeldbau',
    lessonText:
      'Nur durch gemeinsame Planung von Dämmen und Kanälen konnte die Nilflut im Alten Ägypten sicher genutzt werden.',
  },
  e_missernte: {
    text: 'Ohne Zusammenarbeit bricht der Hauptdamm. Große Teile der Saat werden weggespült, und der Ertrag reicht kaum für den Winter.',
    lessonTitle: 'Abhängigkeit von der Gemeinschaft',
    lessonText:
      'Große Bewässerungssysteme erforderten im Alten Ägypten zentrale Organisation und Zusammenarbeit vieler Menschen.',
  },
  e_vorrat: {
    text: 'Dank der gepflegten Speicher übersteht das Dorf das trockene Jahr ohne Hunger und bleibt handlungsfähig.',
    lessonTitle: 'Vorratswirtschaft',
    lessonText:
      'Überschüsse aus guten Jahren sicherten im Alten Ägypten das Überleben in Zeiten mit zu niedriger Nilflut.',
  },
  e_tribut: {
    text: 'Die Schreiber des Pharaos beschlagnahmen den Restbestand und verhängen zusätzliche Arbeitsdienste am Tempelbau.',
    lessonTitle: 'Tributpflicht & Verwaltung',
    lessonText:
      'Im ägyptischen Staat sicherten Abgaben (Tribute) an Pharao und Tempel die Versorgung von Handwerkern, Beamten und Heer.',
  },
};

export const DemoGeschichte: React.FC<DemoProps> = ({ onTried }) => {
  const [nodeId, setNodeId] = useState<string>('start');
  const [path, setPath] = useState<string[]>([]);

  const node = STORY_NODES[nodeId];

  const handleChoose = (label: string, next: string) => {
    onTried('geschichte');
    setPath((prev) => [...prev, label]);
    setNodeId(next);
  };

  const handleReset = () => {
    setPath([]);
    setNodeId('start');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {path.length === 0 ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-hbs-blue-light text-hbs-blue border border-hbs-blue/20">
            Start · Dorf am Nil
          </span>
        ) : (
          path.map((step, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-hbs-slate border border-slate-200 max-w-full truncate"
            >
              {idx + 1}. {step}
            </span>
          ))
        )}
      </div>

      <p className="text-sm sm:text-base font-medium text-hbs-slate-dark leading-relaxed">
        {node.text}
      </p>

      {node.options ? (
        <div className="grid gap-2.5">
          {node.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChoose(opt.label, opt.next)}
              className="min-h-[44px] text-left px-4 py-3 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border hover:border-hbs-blue text-sm font-semibold text-hbs-slate-dark transition-all active:scale-[0.99] cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-hbs-teal-light border-l-4 border-hbs-teal text-sm text-hbs-slate-dark">
            <strong className="font-extrabold text-hbs-teal-deep block mb-0.5">
              Fachbegriff: {node.lessonTitle}
            </strong>
            <span>{node.lessonText}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-hbs-blue" />
            <span>Einen anderen Weg probieren</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. ESCAPE-RÄTSEL MIT ZAHLENSCHLOSS (Einstieg · Mathematik Kl. 7)
 * ============================================================================ */
const LOCK_CODE = [8, 5, 3];

export const DemoEscape: React.FC<DemoProps> = ({ onTried }) => {
  const [digits, setDigits] = useState<[number, number, number]>([0, 0, 0]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);

  const stepDigit = (idx: 0 | 1 | 2, delta: number) => {
    onTried('escape');
    setDigits((prev) => {
      const next = [...prev] as [number, number, number];
      next[idx] = (next[idx] + delta + 10) % 10;
      return next;
    });
  };

  const handleCheck = () => {
    onTried('escape');
    const matches = digits.filter((d, i) => d === LOCK_CODE[i]).length;
    if (matches === 3) {
      setUnlocked(true);
      setStatusMsg('Die Truhe ist offen! Alle drei Aufgaben sind richtig gelöst (Code 8-5-3).');
    } else {
      setUnlocked(false);
      setStatusMsg(
        matches === 0
          ? 'Das Schloss bleibt zu. Noch keine Ziffer stimmt.'
          : `Das Schloss bleibt zu. ${matches === 1 ? 'Eine Ziffer stimmt' : 'Zwei Ziffern stimmen'} schon.`
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm text-hbs-slate">
        <p className="flex gap-2">
          <b className="text-hbs-blue tabular-nums">1.</b>
          <span>Wie viel sind 20 % von 40?</span>
        </p>
        <p className="flex gap-2">
          <b className="text-hbs-blue tabular-nums">2.</b>
          <span>Ein Pullover kostet 50 €. Er wird um 10 % reduziert. Um wie viel Euro wird er billiger?</span>
        </p>
        <p className="flex gap-2">
          <b className="text-hbs-blue tabular-nums">3.</b>
          <span>Wie viel Prozent sind 6 von 200?</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
        {[0, 1, 2].map((i) => {
          const idx = i as 0 | 1 | 2;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => stepDigit(idx, 1)}
                aria-label={`Ziffer ${i + 1} erhöhen`}
                className="w-11 h-11 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border flex items-center justify-center text-hbs-slate-dark transition-colors active:scale-95 cursor-pointer"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <output
                aria-label={`Ziffer ${i + 1}`}
                className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black tabular-nums transition-colors ${
                  unlocked
                    ? 'bg-hbs-teal-light border-hbs-teal text-hbs-teal-deep'
                    : 'bg-white border-hbs-slate-border text-hbs-slate-dark'
                }`}
              >
                {digits[idx]}
              </output>
              <button
                type="button"
                onClick={() => stepDigit(idx, -1)}
                aria-label={`Ziffer ${i + 1} verringern`}
                className="w-11 h-11 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border flex items-center justify-center text-hbs-slate-dark transition-colors active:scale-95 cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleCheck}
          className={`min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-sm text-white inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
            unlocked ? 'bg-hbs-teal hover:bg-hbs-teal-deep' : 'bg-hbs-blue hover:bg-hbs-blue-deep'
          }`}
        >
          {unlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{unlocked ? 'Truhe geöffnet' : 'Schloss öffnen'}</span>
        </button>

        {statusMsg && (
          <p
            aria-live="polite"
            className={`text-xs sm:text-sm font-bold text-center ${
              unlocked ? 'text-hbs-teal-deep' : 'text-hbs-slate-muted'
            }`}
          >
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. SIMULATION MIT SCHIEBEREGLERN (Erarbeitung · Mathematik / W&R Kl. 8–10)
 * ============================================================================ */
function niceStep(x: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(x, 1))));
  const f = x / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

const euroFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const DemoSimulation: React.FC<DemoProps> = ({ onTried }) => {
  const [rate, setRate] = useState<number>(50);
  const [zins, setZins] = useState<number>(4);
  const [jahre, setJahre] = useState<number>(20);

  const sim = useMemo(() => {
    const r = zins / 100 / 12;
    let b = 0;
    let ein = 0;
    const rows: { ein: number; b: number }[] = [];
    for (let y = 1; y <= jahre; y++) {
      for (let k = 0; k < 12; k++) {
        b = b * (1 + r) + rate;
        ein += rate;
      }
      rows.push({ ein, b });
    }
    const step = niceStep(Math.max(b, 1) / 4);
    const top = Math.ceil(b / step) * step || step;
    const ticks: number[] = [];
    for (let v = 0; v <= top + 0.001; v += step) ticks.push(v);
    return { rows, end: b, ein, zinsen: b - ein, top, ticks };
  }, [rate, zins, jahre]);

  const W = 640;
  const H = 250;
  const maxLabelChars = (sim.top.toLocaleString('de-DE') + ' €').length;
  const L = 18 + 7.8 * maxLabelChars;
  const R = 10;
  const T = 14;
  const B = 28;
  const pw = W - L - R;
  const ph = H - T - B;
  const band = pw / jahre;
  const bw = Math.max(3, band * 0.68);
  const every = jahre <= 10 ? 1 : jahre <= 20 ? 5 : 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-hbs-slate-dark">
            <label htmlFor="sim-rate">Sparrate pro Monat</label>
            <span className="text-hbs-blue tabular-nums">{rate} €</span>
          </div>
          <input
            id="sim-rate"
            type="range"
            min={10}
            max={300}
            step={10}
            value={rate}
            onChange={(e) => {
              onTried('simulation');
              setRate(Number(e.target.value));
            }}
            className="w-full accent-hbs-blue cursor-pointer h-6"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-hbs-slate-dark">
            <label htmlFor="sim-zins">Zinssatz pro Jahr</label>
            <span className="text-hbs-blue tabular-nums">{zins.toLocaleString('de-DE')} %</span>
          </div>
          <input
            id="sim-zins"
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={zins}
            onChange={(e) => {
              onTried('simulation');
              setZins(Number(e.target.value));
            }}
            className="w-full accent-hbs-blue cursor-pointer h-6"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-hbs-slate-dark">
            <label htmlFor="sim-jahre">Laufzeit</label>
            <span className="text-hbs-blue tabular-nums">
              {jahre} {jahre === 1 ? 'Jahr' : 'Jahre'}
            </span>
          </div>
          <input
            id="sim-jahre"
            type="range"
            min={1}
            max={40}
            step={1}
            value={jahre}
            onChange={(e) => {
              onTried('simulation');
              setJahre(Number(e.target.value));
            }}
            className="w-full accent-hbs-blue cursor-pointer h-6"
          />
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
          <div className="bg-white rounded-xl border border-hbs-slate-border px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <span className="text-[11px] font-semibold text-hbs-slate-muted">Endbetrag</span>
            <span className="text-sm sm:text-base font-black text-hbs-slate-dark tabular-nums">
              {euroFmt.format(sim.end)}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-hbs-slate-border px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <span className="text-[11px] font-semibold text-hbs-slate-muted">eingezahlt</span>
            <span className="text-sm sm:text-base font-black text-hbs-slate tabular-nums">
              {euroFmt.format(sim.ein)}
            </span>
          </div>
          <div className="bg-hbs-blue-soft rounded-xl border border-hbs-blue/25 px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <span className="text-[11px] font-bold text-hbs-blue-deep">Zinsen</span>
            <span className="text-sm sm:text-base font-black text-hbs-blue tabular-nums">
              {euroFmt.format(sim.zinsen)}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-2.5 min-w-0">
        <div className="overflow-x-auto bg-white rounded-2xl border border-hbs-slate-border p-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full min-w-[460px] h-auto block"
            role="img"
            aria-label="Säulendiagramm: Kontostand am Ende jedes Jahres, aufgeteilt in eingezahltes Geld und Zinsen"
          >
            {sim.ticks.map((v, idx) => {
              const yy = T + ph - (v / sim.top) * ph;
              return (
                <g key={idx}>
                  <line x1={L} x2={W - R} y1={yy} y2={yy} stroke="#E2E8F0" strokeWidth={1} />
                  <text
                    x={L - 8}
                    y={yy + 4}
                    textAnchor="end"
                    fill="#4A5568"
                    fontSize={12}
                    className="tabular-nums"
                  >
                    {v.toLocaleString('de-DE')} €
                  </text>
                </g>
              );
            })}
            {sim.rows.map((row, i) => {
              const x = L + i * band + (band - bw) / 2;
              const hE = (row.ein / sim.top) * ph;
              const hZ = ((row.b - row.ein) / sim.top) * ph;
              const yr = i + 1;
              const showLabel =
                (yr === 1 || yr % every === 0 || yr === jahre) &&
                !(yr === jahre && yr % every !== 0 && jahre - Math.floor(jahre / every) * every < every / 2 && yr !== 1);

              return (
                <g key={yr}>
                  <rect
                    x={x}
                    y={T + ph - hE}
                    width={bw}
                    height={Math.max(0, hE)}
                    rx={1.5}
                    fill="#94A3B8"
                  />
                  {hZ > 0.2 && (
                    <rect
                      x={x}
                      y={T + ph - hE - hZ}
                      width={bw}
                      height={hZ}
                      rx={1.5}
                      fill="#0B7BA7"
                    />
                  )}
                  {showLabel && (
                    <text
                      x={x + bw / 2}
                      y={H - 8}
                      textAnchor="middle"
                      fill="#4A5568"
                      fontSize={12}
                      className="tabular-nums"
                    >
                      {yr}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-hbs-slate-muted font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
            Selbst eingezahlt
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-hbs-blue inline-block" />
            Zinsen und Zinseszinsen
          </span>
        </div>
        <p className="text-xs text-hbs-slate-muted">
          Modellvereinfachung: Es wird mit monatlicher Einzahlung und monatlicher Verzinsung gerechnet; Steuern, Gebühren und Inflation bleiben unberücksichtigt.
        </p>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. SCHAUBILD SCHRITT FÜR SCHRITT (Erarbeitung · MNT / Geografie Kl. 5–6)
 * ============================================================================ */
const WATER_CYCLE_STEPS = [
  'Der Wasserkreislauf beschreibt, wie Wasser auf der Erde ständig zwischen Meer, Luft und Land zirkuliert.',
  '1. Verdunstung: Die Sonne erwärmt Meere, Seen und Flüsse. Flüssiges Wasser steigt als unsichtbarer Wasserdampf auf.',
  '2. Kondensation: In großer Höhe kühlt der Wasserdampf ab. Es bilden sich winzige Wassertröpfchen – Wolken entstehen.',
  '3. Niederschlag: Werden die Tropfen zu schwer, fallen sie als Regen, Schnee oder Hagel auf das Land.',
  '4. Rückfluss: Das Wasser versickert im Grundwasser oder fließt über Bäche und Flüsse zurück ins Meer. Der Kreislauf schließt sich.',
];

export const DemoSchritte: React.FC<DemoProps> = ({ onTried }) => {
  const [step, setStep] = useState<number>(0);

  const go = (next: number) => {
    onTried('schritte');
    setStep(Math.max(0, Math.min(WATER_CYCLE_STEPS.length - 1, next)));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-hbs-slate-border p-3 overflow-x-auto">
        <svg
          viewBox="0 0 600 245"
          className="w-full min-w-[420px] h-auto block"
          role="img"
          aria-label="Schematische Darstellung des Wasserkreislaufs zwischen Meer, Himmel und Gebirge"
        >
          {/* Sonne */}
          <circle cx="92" cy="48" r="24" fill="#FEF7EE" stroke="#F39200" strokeWidth="2.5" />
          <text x="92" y="53" textAnchor="middle" fill="#A76300" fontSize="12" fontWeight="700">
            Sonne
          </text>

          {/* Meer links */}
          <rect x="16" y="185" width="210" height="44" rx="12" fill="#E6F4F8" stroke="#0B7BA7" strokeWidth="2" />
          <text x="121" y="212" textAnchor="middle" fill="#004C6A" fontSize="14" fontWeight="700">
            Meer &amp; Gewässer
          </text>

          {/* Land & Gebirge rechts */}
          <path
            d="M270 229 L385 125 L470 165 L584 115 L584 229 Z"
            fill="#E6FAF7"
            stroke="#00A896"
            strokeWidth="2"
          />
          <text x="485" y="206" textAnchor="middle" fill="#006B5F" fontSize="14" fontWeight="700">
            Land &amp; Gebirge
          </text>

          {/* Schritt 1: Verdunstung */}
          <g className={`transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            <path
              d="M120 175 L120 96"
              stroke="#F39200"
              strokeWidth={step === 1 ? 4 : 2.5}
              strokeDasharray="6 4"
            />
            <polygon points="113,98 120,84 127,98" fill="#F39200" />
            <text x="132" y="135" fill="#A76300" fontSize="13" fontWeight="700">
              Verdunstung
            </text>
          </g>

          {/* Schritt 2: Wolkenbildung / Kondensation */}
          <g className={`transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <rect
              x="190"
              y="26"
              width="210"
              height="48"
              rx="24"
              fill="#F0F8FA"
              stroke="#0B7BA7"
              strokeWidth={step === 2 ? 3 : 2}
            />
            <text x="295" y="55" textAnchor="middle" fill="#006185" fontSize="13" fontWeight="700">
              Wolken (Kondensation)
            </text>
            <path d="M150 62 L182 54" stroke="#0B7BA7" strokeWidth="2.5" />
            <polygon points="178,48 190,52 181,60" fill="#0B7BA7" />
          </g>

          {/* Schritt 3: Niederschlag */}
          <g className={`transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
            <path
              d="M365 82 L415 132"
              stroke="#0B7BA7"
              strokeWidth={step === 3 ? 4 : 2.5}
            />
            <polygon points="407,134 422,139 418,124" fill="#0B7BA7" />
            <text x="415" y="102" fill="#006185" fontSize="13" fontWeight="700">
              Niederschlag
            </text>
          </g>

          {/* Schritt 4: Rückfluss */}
          <g className={`transition-opacity duration-300 ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}>
            <path
              d="M355 186 L242 204"
              stroke="#00A896"
              strokeWidth={step === 4 ? 4 : 2.5}
            />
            <polygon points="246,196 230,206 248,211" fill="#00A896" />
            <text x="300" y="176" textAnchor="middle" fill="#006B5F" fontSize="13" fontWeight="700">
              Fluss &amp; Grundwasser
            </text>
          </g>
        </svg>
      </div>

      <p aria-live="polite" className="text-sm font-semibold text-hbs-slate-dark min-h-[3.2rem]">
        {WATER_CYCLE_STEPS[step]}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => go(step - 1)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück</span>
        </button>
        <button
          type="button"
          disabled={step === WATER_CYCLE_STEPS.length - 1}
          onClick={() => go(step + 1)}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span>Weiter</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="ml-auto text-xs font-bold text-hbs-slate-muted tabular-nums">
          Schritt {step + 1} von {WATER_CYCLE_STEPS.length}
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. ZUORDNEN PER ZIEHEN ODER ANTIPPEN (Übung · Deutsch Kl. 5–6)
 * ============================================================================ */
type BucketKey = 'nomen' | 'verb' | 'adj';

const WORD_TERMS: { word: string; correct: BucketKey }[] = [
  { word: 'Schulhof', correct: 'nomen' },
  { word: 'Freundschaft', correct: 'nomen' },
  { word: 'entdecken', correct: 'verb' },
  { word: 'rechnen', correct: 'verb' },
  { word: 'mutig', correct: 'adj' },
  { word: 'leise', correct: 'adj' },
];

const WORD_BUCKETS: { key: BucketKey; title: string; hint: string }[] = [
  { key: 'nomen', title: 'Nomen', hint: 'Namen- & Dingwörter' },
  { key: 'verb', title: 'Verb', hint: 'Tun- & Tätigkeitswörter' },
  { key: 'adj', title: 'Adjektiv', hint: 'Wiewörter' },
];

export const DemoZuordnen: React.FC<DemoProps> = ({ onTried }) => {
  const [order, setOrder] = useState<number[]>(() => shuffleArray([0, 1, 2, 3, 4, 5]));
  const [placed, setPlaced] = useState<Record<number, BucketKey>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const moveTerm = (idx: number, bucket: BucketKey | null) => {
    onTried('zuordnen');
    setChecked(false);
    setMessage('');
    setSelectedIdx(null);
    setPlaced((prev) => {
      const next = { ...prev };
      if (bucket === null) delete next[idx];
      else next[idx] = bucket;
      return next;
    });
  };

  const handleCheck = () => {
    onTried('zuordnen');
    const totalPlaced = Object.keys(placed).length;
    if (totalPlaced === 0) {
      setMessage('Lege zuerst ein paar Wörter in die passenden Wortarten-Felder.');
      return;
    }
    setChecked(true);
    let ok = 0;
    Object.entries(placed).forEach(([idxStr, b]) => {
      if (WORD_TERMS[Number(idxStr)].correct === b) ok++;
    });
    const rest = WORD_TERMS.length - totalPlaced;
    if (rest > 0) {
      setMessage(
        `${ok} von ${totalPlaced} Zuordnungen stimmen. ${rest} ${rest === 1 ? 'Wort fehlt' : 'Wörter fehlen'} noch.`
      );
    } else if (ok === WORD_TERMS.length) {
      setMessage('Super! Alle sechs Wörter sind der richtigen Wortart zugeordnet.');
    } else {
      setMessage(`${ok} von ${WORD_TERMS.length} stimmen. Verschiebe die rot markierten Wörter.`);
    }
  };

  const handleReset = () => {
    setPlaced({});
    setSelectedIdx(null);
    setChecked(false);
    setMessage('');
    setOrder(shuffleArray([0, 1, 2, 3, 4, 5]));
  };

  const unplaced = order.filter((idx) => !placed[idx]);

  const renderTerm = (idx: number) => {
    const term = WORD_TERMS[idx];
    const isSelected = selectedIdx === idx;
    const assigned = placed[idx];
    let stateClass = 'bg-white border-hbs-slate-border text-hbs-slate-dark';
    if (checked && assigned) {
      stateClass =
        assigned === term.correct
          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
          : 'bg-rose-50 border-rose-500 text-rose-900';
    } else if (isSelected) {
      stateClass = 'bg-hbs-blue-light border-hbs-blue text-hbs-blue-deep ring-2 ring-hbs-blue/30';
    }

    return (
      <button
        key={idx}
        type="button"
        draggable
        aria-pressed={isSelected}
        onDragStart={(e) => {
          onTried('zuordnen');
          e.dataTransfer.setData('text/plain', String(idx));
        }}
        onClick={(e) => {
          e.stopPropagation();
          onTried('zuordnen');
          if (selectedIdx !== null && selectedIdx !== idx && placed[idx]) {
            moveTerm(selectedIdx, placed[idx]);
            return;
          }
          setSelectedIdx((prev) => (prev === idx ? null : idx));
        }}
        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold cursor-grab active:cursor-grabbing transition-all ${stateClass}`}
      >
        {term.word}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const idx = Number(e.dataTransfer.getData('text/plain'));
          if (!Number.isNaN(idx)) moveTerm(idx, null);
        }}
        onClick={() => {
          if (selectedIdx !== null) moveTerm(selectedIdx, null);
        }}
        aria-label="Noch nicht zugeordnete Wörter"
        className="min-h-[54px] p-2.5 rounded-xl border-2 border-dashed border-hbs-slate-border bg-white/70 flex flex-wrap gap-2 items-center"
      >
        {unplaced.length > 0 ? (
          unplaced.map(renderTerm)
        ) : (
          <span className="text-xs text-hbs-slate-muted font-medium px-1">
            Alle Wörter verteilt – klicke jetzt auf „Prüfen“.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {WORD_BUCKETS.map((b) => {
          const items = order.filter((idx) => placed[idx] === b.key);
          return (
            <div
              key={b.key}
              role="button"
              tabIndex={0}
              aria-label={`${b.title}, hierhin zuordnen`}
              onClick={() => {
                if (selectedIdx !== null) moveTerm(selectedIdx, b.key);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && selectedIdx !== null) {
                  e.preventDefault();
                  moveTerm(selectedIdx, b.key);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const idx = Number(e.dataTransfer.getData('text/plain'));
                if (!Number.isNaN(idx)) moveTerm(idx, b.key);
              }}
              className="min-h-[112px] p-3 rounded-xl bg-white border border-hbs-slate-border hover:border-hbs-blue transition-colors flex flex-col gap-2 cursor-pointer"
            >
              <div>
                <span className="text-sm font-extrabold text-hbs-slate-dark block">{b.title}</span>
                <span className="text-[11px] text-hbs-slate-muted block">{b.hint}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">{items.map(renderTerm)}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCheck}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Prüfen</span>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Zurücksetzen</span>
        </button>
      </div>

      {message && (
        <p aria-live="polite" className="text-xs sm:text-sm font-semibold text-hbs-slate-dark">
          {message}
        </p>
      )}
    </div>
  );
};

/* ============================================================================
 * 6. LERNKARTEN ZUM UMDREHEN (Übung · Englisch Kl. 6–8)
 * ============================================================================ */
const FLASHCARDS: [string, string][] = [
  ['go', 'went · gone'],
  ['buy', 'bought · bought'],
  ['take', 'took · taken'],
  ['write', 'wrote · written'],
  ['think', 'thought · thought'],
  ['begin', 'began · begun'],
];

export const DemoKarten: React.FC<DemoProps> = ({ onTried }) => {
  const [deck, setDeck] = useState<number[]>(() => shuffleArray([0, 1, 2, 3, 4, 5]));
  const [known, setKnown] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);

  const currentCard = deck.length > 0 ? FLASHCARDS[deck[0]] : null;

  const handleReset = () => {
    setDeck(shuffleArray([0, 1, 2, 3, 4, 5]));
    setKnown(0);
    setFlipped(false);
  };

  return (
    <div className="space-y-3">
      <div className="[perspective:1000px]">
        <button
          type="button"
          onClick={() => {
            if (!currentCard) return;
            onTried('karten');
            setFlipped((f) => !f);
          }}
          aria-label="Karte umdrehen"
          className={`w-full h-40 relative [transform-style:preserve-3d] transition-transform duration-500 cursor-pointer ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <span className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border border-hbs-slate-border bg-white flex flex-col items-center justify-center p-4 gap-1 shadow-xs">
            <span className="text-xs font-semibold text-hbs-slate-muted">
              {currentCard ? 'Infinitive' : 'Fertig!'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-hbs-slate-dark">
              {currentCard ? currentCard[0] : 'Geschafft'}
            </span>
            {currentCard && (
              <span className="text-xs text-hbs-slate-muted">Antippen zum Umdrehen</span>
            )}
          </span>

          <span className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border-2 border-hbs-blue/40 bg-hbs-blue-soft flex flex-col items-center justify-center p-4 gap-1 shadow-xs">
            <span className="text-xs font-semibold text-hbs-blue-deep">
              Simple Past · Past Participle
            </span>
            <span className="text-xl sm:text-2xl font-black text-hbs-blue">
              {currentCard ? currentCard[1] : 'Alle Karten sitzen'}
            </span>
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!flipped || !currentCard}
          onClick={() => {
            setDeck((d) => d.slice(1));
            setKnown((k) => k + 1);
            setFlipped(false);
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-teal hover:bg-hbs-teal-deep text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Wusste ich</span>
        </button>
        <button
          type="button"
          disabled={!flipped || !currentCard}
          onClick={() => {
            setDeck((d) => (d.length > 1 ? [...d.slice(1), d[0]] : d));
            setFlipped(false);
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-amber-light border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-hbs-amber-dark" />
          <span>Nochmal üben</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {!currentCard ? (
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-hbs-slate-border text-xs font-bold text-hbs-blue inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Von vorn</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-hbs-slate-muted tabular-nums">
              {known} von {FLASHCARDS.length} Karten sitzen
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 7. AUFGABENGENERATOR OHNE ENDE (Übung · Mathematik Kl. 7–9)
 * ============================================================================ */
function makePercentTask() {
  const ps = [5, 10, 15, 20, 25, 30, 40, 50, 75];
  const p = ps[Math.floor(Math.random() * ps.length)];
  const g = 20 * (2 + Math.floor(Math.random() * 19));
  return { p, g, w: (p * g) / 100 };
}

export const DemoGenerator: React.FC<DemoProps> = ({ onTried }) => {
  const [task, setTask] = useState(makePercentTask);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean | null; text: string }>({ ok: null, text: '' });
  const [streak, setStreak] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTried('generator');
    const cleaned = input.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
    const num = Number(cleaned);
    if (!cleaned || Number.isNaN(num)) {
      setFeedback({ ok: null, text: 'Gib eine Zahl ein, zum Beispiel 12 oder 12,5.' });
      return;
    }
    if (Math.abs(num - task.w) < 0.005) {
      setStreak((s) => s + 1);
      setFeedback({
        ok: true,
        text: `Richtig! ${task.p} % von ${task.g} € sind ${task.w.toLocaleString('de-DE')} €.`,
      });
    } else {
      setStreak(0);
      setFeedback({
        ok: false,
        text: `Noch nicht. Rechenweg: ${task.g} € · ${task.p} : 100 = ${task.w.toLocaleString('de-DE')} €.`,
      });
    }
  };

  const handleNew = () => {
    onTried('generator');
    setTask(makePercentTask());
    setInput('');
    setFeedback({ ok: null, text: '' });
  };

  return (
    <div className="space-y-3">
      <p aria-live="polite" className="text-lg sm:text-xl font-black text-hbs-slate-dark tabular-nums">
        Wie viel sind {task.p} % von {task.g} €?
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <label htmlFor="hw-gen-in" className="sr-only">
          Dein Ergebnis
        </label>
        <input
          id="hw-gen-in"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ergebnis (€)"
          className="w-36 min-h-[44px] px-3 py-2 rounded-xl border border-hbs-slate-border bg-white text-sm font-bold text-hbs-slate-dark tabular-nums focus:outline-none focus:border-hbs-blue"
        />
        <button
          type="submit"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold cursor-pointer"
        >
          Prüfen
        </button>
        <button
          type="button"
          onClick={handleNew}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Dices className="w-4 h-4 text-hbs-blue" />
          <span>Neue Aufgabe</span>
        </button>
      </form>

      {feedback.text && (
        <p
          aria-live="polite"
          className={`text-xs sm:text-sm font-bold ${
            feedback.ok === true
              ? 'text-hbs-teal-deep'
              : feedback.ok === false
              ? 'text-rose-700'
              : 'text-hbs-slate-muted'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="text-xs font-bold text-hbs-slate-muted tabular-nums">
        Richtig in Folge: <span className="text-hbs-blue font-black text-sm">{streak}</span>
      </div>
    </div>
  );
};

/* ============================================================================
 * 8. QUIZ MIT ERKLÄRUNG NACH JEDER ANTWORT (Sicherung · W&R Kl. 8–9)
 * ============================================================================ */
const QUIZ_QUESTIONS = [
  {
    q: 'Wodurch kommt im Alltag ein Kaufvertrag zustande?',
    options: [
      'Durch zwei übereinstimmende Willenserklärungen: Antrag und Annahme',
      'Erst wenn der Kassenbon ausgedruckt ist',
      'Nur durch eine schriftliche Unterschrift',
    ],
    correct: 0,
    explanation:
      'Ein Kaufvertrag braucht Antrag und Annahme. Die meisten Kaufverträge werden mündlich oder durch schlüssiges Handeln an der Kasse geschlossen.',
  },
  {
    q: 'Ein 15-jähriger Schüler kauft sich von seinem Taschengeld ein Spiel für 35 €. Ist der Vertrag wirksam?',
    options: [
      'Nein, Jugendliche unter 18 dürfen gar keine Verträge schließen',
      'Ja, wenn er mit Geld bezahlt, das ihm zur freien Verfügung überlassen wurde',
      'Nur wenn die Eltern vorher schriftlich zustimmen',
    ],
    correct: 1,
    explanation:
      'Das regelt der Taschengeldparagraf (§ 110 BGB). Zahlt ein Minderjähriger mit eigenem Taschengeld ohne Ratenzahlung, wird der Kauf wirksam.',
  },
  {
    q: 'Ist ein Preisschild im Schaufenster rechtlich schon ein verbindlicher Antrag?',
    options: [
      'Ja, das Geschäft muss exakt zu diesem Preis verkaufen',
      'Ja, aber nur während der Öffnungszeiten',
      'Nein, es ist nur eine Aufforderung, selbst einen Kaufantrag zu machen',
    ],
    correct: 2,
    explanation:
      'Die Auslage ist eine Aufforderung zur Abgabe eines Antrags. Den Antrag stellst du erst, wenn du die Ware an der Kasse vorlegst.',
  },
  {
    q: 'Wie lange dürfen Verbraucher einen Online-Kauf in der Regel ohne Angabe von Gründen widerrufen?',
    options: ['7 Tage', '14 Tage', '30 Tage'],
    correct: 1,
    explanation:
      'Bei Käufen im Internet gilt gesetzlich eine Widerrufsfrist von 14 Tagen ab Erhalt der Ware.',
  },
];

export const DemoQuiz: React.FC<DemoProps> = ({ onTried }) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  const isDone = idx >= QUIZ_QUESTIONS.length;
  const q = QUIZ_QUESTIONS[idx];

  const handleSelect = (optIdx: number) => {
    if (chosen !== null) return;
    onTried('quiz');
    setChosen(optIdx);
    if (optIdx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setChosen(null);
    setIdx((i) => i + 1);
  };

  const handleRestart = () => {
    setIdx(0);
    setScore(0);
    setChosen(null);
  };

  if (isDone) {
    return (
      <div className="space-y-3">
        <p className="text-base font-black text-hbs-slate-dark">
          Du hast {score} von {QUIZ_QUESTIONS.length} Fragen richtig beantwortet.
        </p>
        <p className="text-sm text-hbs-slate">
          {score === QUIZ_QUESTIONS.length
            ? 'Alles richtig! Du kennst die wichtigsten Regeln zum Kaufvertrag.'
            : 'Schau dir die Erklärungen bei einem zweiten Durchgang noch einmal in Ruhe an.'}
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Quiz neu starten</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-bold text-hbs-slate-muted tabular-nums">
        <span>
          Frage {idx + 1} von {QUIZ_QUESTIONS.length}
        </span>
        <span>Punkte: {score}</span>
      </div>

      <p className="text-sm sm:text-base font-bold text-hbs-slate-dark">{q.q}</p>

      <div className="grid gap-2">
        {q.options.map((opt, optIdx) => {
          let cls = 'bg-white hover:bg-hbs-blue-soft border-hbs-slate-border text-hbs-slate-dark';
          if (chosen !== null) {
            if (optIdx === q.correct) {
              cls = 'bg-emerald-50 border-emerald-500 text-emerald-900';
            } else if (optIdx === chosen) {
              cls = 'bg-rose-50 border-rose-500 text-rose-900';
            } else {
              cls = 'bg-white border-slate-200 text-slate-400';
            }
          }
          return (
            <button
              key={optIdx}
              type="button"
              disabled={chosen !== null}
              onClick={() => handleSelect(optIdx)}
              className={`min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:cursor-default ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <div className="space-y-2.5 pt-1">
          <p aria-live="polite" className="text-xs sm:text-sm text-hbs-slate bg-white p-3 rounded-xl border border-hbs-slate-border">
            <strong className={chosen === q.correct ? 'text-hbs-teal-deep' : 'text-rose-700'}>
              {chosen === q.correct ? 'Richtig. ' : 'Nicht ganz. '}
            </strong>
            {q.explanation}
          </p>
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{idx === QUIZ_QUESTIONS.length - 1 ? 'Ergebnis anzeigen' : 'Nächste Frage'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 9. LERNCHECKLISTE VOR DER KLASSENARBEIT (Sicherung · Mathematik Kl. 7–8)
 * ============================================================================ */
const CHECKLIST_ITEMS: [string, string][] = [
  [
    'Ich kann Grundwert (G), Prozentwert (W) und Prozentsatz (p %) im Text sicher erkennen.',
    'Markiere in drei Textaufgaben jeweils zuerst, was 100 % entspricht (= Grundwert).',
  ],
  [
    'Ich kann den Prozentwert mit dem Dreisatz oder der Formel W = G · p : 100 berechnen.',
    'Rechne zwei Aufgaben aus dem Kopf (z. B. 10 % und 25 %) und kontrolliere mit der Formel.',
  ],
  [
    'Ich kann Rabatte und Preiserhöhungen in zwei Schritten (oder mit Faktor) ausrechnen.',
    'Übe am Beispiel „Schuhe für 80 € mit 15 % Rabatt“ beide Rechenwege.',
  ],
  [
    'Ich kann Anteile aus einem Kreis- oder Säulendiagramm in Prozent umrechnen.',
    'Zeichne eine kleine Skizze mit 25 %, 50 % und 75 % und ordne einfache Brüche (1/4, 1/2, 3/4) zu.',
  ],
  [
    'Ich prüfe mein Ergebnis am Ende auf Plausibilität (z. B. ob der Teil kleiner als 100 % ist).',
    'Schätze vor jeder Rechnung kurz ab: Ist das Ergebnis größer oder kleiner als die Hälfte?',
  ],
];

const CHECK_STORAGE_KEY = 'hbs_html_werkstatt_check_v1';

export const DemoChecklist: React.FC<DemoProps> = ({ onTried }) => {
  const [answers, setAnswers] = useState<Record<number, 0 | 1 | 2>>(() => {
    try {
      const raw = localStorage.getItem(CHECK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // ignore storage quota errors
    }
  }, [answers]);

  const setLevel = (itemIdx: number, val: 0 | 1 | 2) => {
    onTried('check');
    setAnswers((prev) => ({ ...prev, [itemIdx]: val }));
  };

  const doneCount = Object.keys(answers).length;
  const okCount = CHECKLIST_ITEMS.filter((_, idx) => answers[idx] === 2).length;
  const todoTips = CHECKLIST_ITEMS.filter((_, idx) => answers[idx] === 0 || answers[idx] === 1).map(
    (item) => item[1]
  );

  return (
    <div className="space-y-3">
      <div className="divide-y divide-slate-200/80">
        {CHECKLIST_ITEMS.map(([statement], idx) => (
          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-hbs-slate-dark">{statement}</p>
            <div className="inline-flex rounded-xl border border-hbs-slate-border bg-white overflow-hidden">
              {(
                [
                  { v: 2 as const, label: 'Kann ich', active: 'bg-hbs-teal text-white' },
                  { v: 1 as const, label: 'Fast', active: 'bg-hbs-amber text-white' },
                  { v: 0 as const, label: 'Noch nicht', active: 'bg-rose-600 text-white' },
                ]
              ).map((opt) => {
                const pressed = answers[idx] === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setLevel(idx, opt.v)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-bold border-r last:border-r-0 border-hbs-slate-border transition-colors cursor-pointer ${
                      pressed ? opt.active : 'text-hbs-slate hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="p-3.5 rounded-xl bg-white border border-hbs-slate-border text-xs sm:text-sm text-hbs-slate space-y-2">
        {doneCount === 0 ? (
          <p>Wähle bei jeder Aussage aus, wie sicher du dich fühlst. Danach erscheinen hier konkrete Übungstipps.</p>
        ) : (
          <>
            <p className="font-bold text-hbs-slate-dark">
              {okCount} von {CHECKLIST_ITEMS.length} Punkten kannst du schon sicher.
              {doneCount < CHECKLIST_ITEMS.length &&
                ` (${CHECKLIST_ITEMS.length - doneCount} noch offen)`}
            </p>
            {todoTips.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {todoTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            ) : (
              doneCount === CHECKLIST_ITEMS.length && <p className="text-hbs-teal-deep font-bold">Du bist bestens auf die Klassenarbeit vorbereitet.</p>
            )}
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auswahl löschen</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 10. ZUFALLSAUSWAHL UND GRUPPEN (Organisation · alle Fächer)
 * ============================================================================ */
export const DemoZufall: React.FC<DemoProps> = ({ onTried }) => {
  const [namesText, setNamesText] = useState(
    'Amira, Ben, Can, Dana, Elif, Finn, Greta, Hamza, Ida, Jonas, Kira, Leon, Mia, Noah, Paula, Yusuf'
  );
  const [drawnIndices, setDrawnIndices] = useState<number[]>([]);
  const [picked, setPicked] = useState<string>('Wer ist dran?');
  const [sub, setSub] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groups, setGroups] = useState<string[][]>([]);

  const nameList = useMemo(
    () =>
      namesText
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [namesText]
  );

  const handleDraw = () => {
    onTried('zufall');
    if (nameList.length === 0) {
      setPicked('Trag zuerst Namen ein');
      setSub('');
      return;
    }
    setGroups([]);
    let currentDrawn = drawnIndices;
    let remaining = nameList.map((_, i) => i).filter((i) => !currentDrawn.includes(i));
    let restarted = false;
    if (remaining.length === 0) {
      currentDrawn = [];
      remaining = nameList.map((_, i) => i);
      restarted = true;
    }

    const winnerIdx = remaining[Math.floor(Math.random() * remaining.length)];
    const winnerName = nameList[winnerIdx];
    const nextDrawn = [...currentDrawn, winnerIdx];
    setDrawnIndices(nextDrawn);

    setIsSpinning(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setPicked(nameList[Math.floor(Math.random() * nameList.length)]);
      ticks++;
      if (ticks >= 12) {
        clearInterval(interval);
        setPicked(winnerName);
        setIsSpinning(false);
        const left = nameList.length - nextDrawn.length;
        setSub(
          `${restarted ? 'Alle waren einmal dran, neue Runde gestartet. ' : ''}${
            left > 0 ? `Noch nicht dran: ${left}` : 'Jetzt waren alle einmal dran.'
          }`
        );
      }
    }, 65);
  };

  const handleMakeGroups = () => {
    onTried('zufall');
    if (nameList.length === 0) {
      setPicked('Trag zuerst Namen ein');
      setGroups([]);
      return;
    }
    const shuffled = shuffleArray(nameList);
    let count = Math.max(1, Math.round(shuffled.length / groupSize));
    if (count > 1 && Math.floor(shuffled.length / count) < 2) count--;
    const built: string[][] = Array.from({ length: count }, () => []);
    shuffled.forEach((n, i) => {
      built[i % count].push(n);
    });
    const lo = Math.floor(shuffled.length / count);
    const hi = Math.ceil(shuffled.length / count);
    setGroups(built);
    setPicked(`${count} ${count === 1 ? 'Gruppe' : 'Gruppen'}`);
    setSub(
      lo === hi
        ? `Jede Gruppe hat ${lo} ${lo === 1 ? 'Person' : 'Personen'}.`
        : `Die Gruppen haben ${lo} oder ${hi} Personen.`
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="hw-names" className="sr-only">
          Namensliste
        </label>
        <textarea
          id="hw-names"
          rows={3}
          value={namesText}
          onChange={(e) => {
            setNamesText(e.target.value);
            setDrawnIndices([]);
            setSub('');
          }}
          className="w-full p-3 rounded-xl border border-hbs-slate-border bg-white text-xs sm:text-sm text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
        />
      </div>

      <div className="text-center py-1">
        <p aria-live="polite" className="text-2xl sm:text-3xl font-black text-hbs-blue tracking-tight min-h-[2.2rem]">
          {picked}
        </p>
        {sub && <p className="text-xs text-hbs-slate-muted font-medium mt-0.5">{sub}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={isSpinning}
          onClick={handleDraw}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <Dices className="w-4 h-4" />
          <span>Namen ziehen</span>
        </button>

        <label htmlFor="hw-gsize" className="sr-only">
          Gruppengröße
        </label>
        <select
          id="hw-gsize"
          value={groupSize}
          onChange={(e) => setGroupSize(Number(e.target.value))}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-hbs-slate-border bg-white text-xs font-bold text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
        >
          <option value={2}>2er-Gruppen</option>
          <option value={3}>3er-Gruppen</option>
          <option value={4}>4er-Gruppen</option>
          <option value={5}>5er-Gruppen</option>
        </select>

        <button
          type="button"
          onClick={handleMakeGroups}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-4 h-4 text-hbs-amber-dark" />
          <span>Gruppen bilden</span>
        </button>
      </div>

      {groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {groups.map((grp, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-white border border-hbs-slate-border text-xs text-hbs-slate">
              <strong className="block text-[11px] uppercase tracking-wider text-hbs-amber-dark mb-0.5">
                Gruppe {i + 1}
              </strong>
              <span>{grp.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 11. TIMER FÜR ARBEITSPHASEN (Organisation · alle Fächer)
 * ============================================================================ */
function playTimerBeep() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [0, 0.35, 0.7].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  } catch {
    // ignore WebAudio block
  }
}

export const DemoTimer: React.FC<DemoProps> = ({ onTried }) => {
  const [phaseName, setPhaseName] = useState('Partnerarbeit: Aufgabe 3');
  const [totalSec, setTotalSec] = useState(300);
  const [leftSec, setLeftSec] = useState(300);
  const [running, setRunning] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const endAt = Date.now() + leftSec * 1000;
    const id = setInterval(() => {
      const rem = (endAt - Date.now()) / 1000;
      if (rem <= 0) {
        setLeftSec(0);
        setRunning(false);
        playTimerBeep();
      } else {
        setLeftSec(rem);
      }
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const onFsChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const C = 2 * Math.PI * 54;
  const dashOffset = totalSec > 0 ? C * (1 - leftSec / totalSec) : 0;
  const s = Math.max(0, Math.ceil(leftSec));
  const formatted = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const selectPreset = (mins: number) => {
    onTried('timer');
    setRunning(false);
    setTotalSec(mins * 60);
    setLeftSec(mins * 60);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center gap-3.5 ${
        isFs ? 'bg-hbs-bg p-8 justify-center min-h-screen' : ''
      }`}
    >
      <label htmlFor="hw-phase-name" className="sr-only">
        Name der Arbeitsphase
      </label>
      <input
        id="hw-phase-name"
        type="text"
        value={phaseName}
        onChange={(e) => setPhaseName(e.target.value)}
        className="w-full max-w-xs min-h-[40px] px-3 py-1.5 text-center rounded-xl border border-hbs-slate-border bg-white text-sm font-bold text-hbs-slate-dark focus:outline-none focus:border-hbs-blue"
      />

      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={leftSec === 0 ? '#00A896' : '#0B7BA7'}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: C,
              strokeDashoffset: dashOffset,
              transition: 'stroke-dashoffset 0.25s linear',
            }}
          />
        </svg>
        <span
          role="timer"
          className={`absolute text-4xl font-black tabular-nums tracking-tight ${
            leftSec === 0 ? 'text-hbs-teal animate-pulse' : 'text-hbs-slate-dark'
          }`}
        >
          {formatted}
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Dauer wählen">
        {[3, 5, 10, 15].map((mins) => {
          const active = totalSec === mins * 60;
          return (
            <button
              key={mins}
              type="button"
              aria-pressed={active}
              onClick={() => selectPreset(mins)}
              className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                active
                  ? 'bg-hbs-blue text-white border-hbs-blue'
                  : 'bg-white text-hbs-slate border-hbs-slate-border hover:border-hbs-blue'
              }`}
            >
              {mins} Min.
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            onTried('timer');
            if (!running && leftSec <= 0) setLeftSec(totalSec);
            setRunning((r) => !r);
          }}
          className={`min-h-[44px] px-5 py-2 rounded-xl text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
            running ? 'bg-hbs-amber hover:bg-hbs-amber-dark' : 'bg-hbs-blue hover:bg-hbs-blue-deep'
          }`}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{running ? 'Pause' : leftSec > 0 && leftSec < totalSec ? 'Weiter' : 'Start'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setLeftSec(totalSec);
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Zurücksetzen</span>
        </button>

        {typeof document !== 'undefined' && document.fullscreenEnabled && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft border border-hbs-slate-border text-xs font-bold text-hbs-slate-dark inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFs ? 'Beenden' : 'Vollbild'}</span>
          </button>
        )}
      </div>

      {leftSec === 0 && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-hbs-teal-deep">
          <Sparkles className="w-4 h-4" /> Zeit abgelaufen!
        </span>
      )}
    </div>
  );
};
