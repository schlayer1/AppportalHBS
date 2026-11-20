import React, { useState, useEffect, useCallback } from 'react';
import {
  Dices,
  RotateCcw,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  AlertCircle,
  Lock,
  Users,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  SAL1KE_GROUP_COLORS,
  QrGroupSession,
  PreassignedGroupTeam
} from '../../types/gruppenTypes';
import {
  claimGruppenSlotInCloud,
  getGruppenLiveSessionFromCloud,
  subscribeToGruppenSession
} from '../../services/firebase';

interface GruppenStudentClientProps {
  onClose: () => void;
}

const SEVEN_DAYS_MS = 7 * 86400000;
const DEVICE_TOKEN_KEY = 'hbs_gruppen_device_token_v1';

/**
 * Cleans up expired `tools-g-*` entries older than 7 days in localStorage,
 * exactly matching sal1ke's `gruppe.js` privacy guarantee.
 */
function cleanupExpiredGroupTokens(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tools-g-')) {
        const val = localStorage.getItem(k) || '';
        const parts = val.split('.');
        const ts = Number(parts[1] || 0);
        if (!ts || Date.now() - ts >= SEVEN_DAYS_MS) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {
    // private mode
  }
}

/**
 * Gets or generates a persistent anonymous device token for this browser
 * so that re-scanning or refreshing in the same round returns the same group.
 */
function getOrCreateDeviceToken(): string {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing && existing.length >= 8) return existing;
    const generated = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, generated);
    return generated;
  } catch {
    return `ephem_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Checks if this device already stored its group locally for `tools-g-<CODE>`
 * (format: `<groupIndex>.<timestamp>`, matching sal1ke's `gruppe.js`).
 */
function getStoredGroupIndex(code: string, maxGroupCount: number): number | null {
  try {
    cleanupExpiredGroupTokens();
    const raw = localStorage.getItem(`tools-g-${code}`);
    if (!raw) return null;
    const g = parseInt(raw.split('.')[0], 10);
    return Number.isInteger(g) && g >= 0 && g < maxGroupCount ? g : null;
  } catch {
    return null;
  }
}

function storeGroupIndex(code: string, groupIndex: number): void {
  try {
    localStorage.setItem(`tools-g-${code}`, `${groupIndex}.${Date.now()}`);
  } catch {
    // private mode fallback
  }
}

export const GruppenStudentClient: React.FC<GruppenStudentClientProps> = ({ onClose }) => {
  // Extract code from URL (?gruppen=CODE or #gruppen=CODE)
  const [pinInput, setPinInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const qPin = params.get('gruppen');
    if (qPin && qPin !== '1' && qPin !== 'true') return qPin.trim().toUpperCase();
    const hashMatch = window.location.hash.match(/gruppen=([A-Za-z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1].trim().toUpperCase();
    return '';
  });

  const [activeCode, setActiveCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const qPin = params.get('gruppen');
    if (qPin && qPin !== '1' && qPin !== 'true') return qPin.trim().toUpperCase();
    const hashMatch = window.location.hash.match(/gruppen=([A-Za-z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1].trim().toUpperCase();
    return '';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assignedGroupIndex, setAssignedGroupIndex] = useState<number | null>(null);
  const [session, setSession] = useState<QrGroupSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'closed' | 'full' | 'not_found' | 'error' | null>(null);

  const performGroupDraw = useCallback(async (targetCode: string) => {
    const cleanCode = targetCode.replace(/\s+/g, '').toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const existingSession = await getGruppenLiveSessionFromCloud(cleanCode);
      if (!existingSession) {
        setErrorType('not_found');
        setErrorMessage('Diese Runde gibt es nicht mehr. Bitte prüfe den Code am Smartboard.');
        setIsLoading(false);
        return;
      }

      setSession(existingSession);
      const groupCount = Math.max(2, Math.min(12, existingSession.groupCount || 5));

      // 1. Check local storage (`tools-g-<CODE>`) first — just like sal1ke's `kennt()` in `gruppe.js`
      const localStored = getStoredGroupIndex(cleanCode, groupCount);
      const deviceToken = getOrCreateDeviceToken();

      if (localStored !== null) {
        setAssignedGroupIndex(localStored);
        // Ensure this device's locally stored group is also registered in the cloud session
        // (e.g. if the teacher updated the round settings while keeping the same code)
        if (existingSession.deviceAssignments?.[deviceToken] !== localStored) {
          claimGruppenSlotInCloud(cleanCode, deviceToken, localStored)
            .then((res) => {
              if (res.session) setSession(res.session);
            })
            .catch(() => {});
        }
        setIsLoading(false);
        return;
      }

      // 2. Otherwise claim a fair round-robin slot in cloud using deviceToken
      const result = await claimGruppenSlotInCloud(cleanCode, deviceToken);

      if (
        (result.status === 'assigned' || result.status === 'already_assigned') &&
        typeof result.groupIndex === 'number'
      ) {
        storeGroupIndex(cleanCode, result.groupIndex);
        setAssignedGroupIndex(result.groupIndex);
        if (result.session) setSession(result.session);
      } else if (result.status === 'full') {
        setErrorType('full');
        setErrorMessage('Alle Plätze dieser Runde sind vergeben. Sag deiner Lehrkraft Bescheid.');
      } else if (result.status === 'closed') {
        setErrorType('closed');
        setErrorMessage('Diese Runde ist geschlossen.');
      } else {
        setErrorType('not_found');
        setErrorMessage(result.message || 'Diese Runde gibt es nicht mehr.');
      }
    } catch {
      setErrorType('error');
      setErrorMessage('Das hat nicht geklappt. Bitte die Seite neu laden.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCode) {
      performGroupDraw(activeCode);
    }
  }, [activeCode, performGroupDraw]);

  // Subscribe to live session updates (e.g. teacher updates task title or group names)
  useEffect(() => {
    if (!activeCode) return;
    const unsub = subscribeToGruppenSession(activeCode, (liveSess) => {
      if (liveSess) {
        setSession(liveSess);
      }
    });
    return () => unsub();
  }, [activeCode]);

  // Apply full-viewport group color & Safari theme-color meta when a group is assigned
  // (Replica of sal1ke's `zeige(g)` in `gruppe.js`: "die Farbe trägt body: So färbt Safari am iPhone auch den Bereich ganz oben")
  useEffect(() => {
    if (assignedGroupIndex === null) return;
    const colors = session?.groupColors && session.groupColors.length > 0
      ? session.groupColors
      : SAL1KE_GROUP_COLORS;
    const activeColor = colors[assignedGroupIndex % colors.length];

    const prevBg = document.body.style.backgroundColor;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const prevTheme = metaTheme?.getAttribute('content') || '#FFFFFF';
    const prevTitle = document.title;

    document.body.style.backgroundColor = activeColor;
    metaTheme?.setAttribute('content', activeColor);
    const customName = session?.groupNames?.[assignedGroupIndex];
    document.title = customName || `Gruppe ${assignedGroupIndex + 1}`;

    return () => {
      document.body.style.backgroundColor = prevBg;
      metaTheme?.setAttribute('content', prevTheme);
      document.title = prevTitle;
    };
  }, [assignedGroupIndex, session]);

  // ============================================================================
  // CASE 1: ASSIGNED GROUP FULLSCREEN COLOR DISPLAY (sal1ke `geraet.html` style)
  // ============================================================================
  if (assignedGroupIndex !== null) {
    const colors = session?.groupColors && session.groupColors.length > 0
      ? session.groupColors
      : SAL1KE_GROUP_COLORS;
    const activeColor = colors[assignedGroupIndex % colors.length];
    const rawGroupName = session?.groupNames?.[assignedGroupIndex] || `Gruppe ${assignedGroupIndex + 1}`;

    // Check if the name is standard "Gruppe X" / "Tisch X" / "Team X" or a custom name like "Station A"
    const standardMatch = rawGroupName.match(/^(Gruppe|Tisch|Team|Station)\s+(.+)$/i);
    const topWord = standardMatch ? standardMatch[1] : 'Deine Gruppe';
    const bigSymbol = standardMatch ? standardMatch[2] : rawGroupName;

    const preassignedTeam: PreassignedGroupTeam | undefined = session?.preassignedGroups?.find(
      (t) => t.groupIndex === assignedGroupIndex
    );

    return (
      <div
        style={{ backgroundColor: activeColor }}
        className="min-h-screen w-full flex flex-col justify-between text-white select-none p-5 sm:p-8 transition-colors duration-500"
      >
        {/* Top bar: subtle HBS seal & Code */}
        <header className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3 opacity-90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-sm shrink-0">
              <img src="/Siegel_bunt.png" alt="HBS Siegel" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block">
                Heimbürgeschule Kahla
              </span>
              <span className="text-xs font-black text-white tracking-tight">
                Runde {activeCode}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setAssignedGroupIndex(null);
              setActiveCode('');
              setPinInput('');
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Anderer Code</span>
          </button>
        </header>

        {/* Center: Huge Group Number / Name (visible across the classroom!) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center my-6 px-2" aria-live="polite">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-3 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zugelost</span>
          </div>

          <p className="text-2xl sm:text-4xl font-extrabold uppercase tracking-widest text-white/90">
            {topWord}
          </p>

          <p
            className={`font-black leading-none tracking-tight text-white drop-shadow-md my-2 ${
              bigSymbol.length <= 3
                ? 'text-[130px] sm:text-[180px] md:text-[210px]'
                : 'text-5xl sm:text-7xl md:text-8xl max-w-xl break-words'
            }`}
          >
            {bigSymbol}
          </p>

          {/* If not a standard "Gruppe X", also show badge "Gruppe X" below for unambiguous orientation */}
          {!standardMatch && (
            <span className="mt-2 px-4 py-1.5 rounded-full bg-black/20 text-white/90 text-sm font-bold border border-white/20">
              Gruppe {assignedGroupIndex + 1} von {session?.groupCount || 5}
            </span>
          )}

          {/* Optional preassigned members from Tafel GroupMaker */}
          {preassignedTeam && preassignedTeam.members.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-black/20 border border-white/20 max-w-md w-full backdrop-blur-xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/85 mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Mitglieder in diesem Team</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {preassignedTeam.members.map((member, mIdx) => (
                  <span
                    key={mIdx}
                    className="px-3 py-1 rounded-xl bg-white/20 text-white text-xs sm:text-sm font-bold"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Bottom: Task Prompt & Privacy Note (matching sal1ke `.los-auftrag` & `.los-fuss` + individual group task) */}
        <footer className="w-full max-w-xl mx-auto text-center space-y-3 pb-2">
          {(() => {
            const specificGroupTask = session?.groupTasks?.[assignedGroupIndex]?.trim();
            const generalTitle = session?.title?.trim();

            if (specificGroupTask) {
              return (
                <div className="p-4 sm:p-6 rounded-2xl bg-black/25 border-2 border-white/35 backdrop-blur-xs shadow-xl space-y-1.5">
                  <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-white/85 bg-white/15 px-2.5 py-0.5 rounded-full">
                    Arbeitsauftrag für {rawGroupName}
                  </span>
                  <p className="text-lg sm:text-2xl font-black text-white leading-snug">
                    {specificGroupTask}
                  </p>
                  {generalTitle && generalTitle !== specificGroupTask && (
                    <p className="text-xs sm:text-sm font-semibold text-white/80 pt-1">
                      {generalTitle}
                    </p>
                  )}
                </div>
              );
            }

            if (generalTitle) {
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-black/20 border border-white/25 backdrop-blur-xs shadow-lg">
                  <p className="text-base sm:text-xl font-extrabold text-white leading-snug">
                    {generalTitle}
                  </p>
                </div>
              );
            }

            return null;
          })()}

          <p className="text-xs font-medium text-white/80 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Dein Gerät merkt sich nur die Nummer deiner Gruppe für diese Runde (keine Namen).</span>
          </p>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // CASE 2: CODE ENTRY OR STATUS / ERROR SCREEN
  // ============================================================================
  return (
    <div className="min-h-screen w-full bg-hbs-bg flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs">
            <img src="/Siegel_bunt.png" alt="HBS Siegel" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-hbs-blue block">
              Heimbürgeschule Kahla
            </span>
            <h1 className="text-sm sm:text-base font-black text-hbs-slate-dark">
              HBS Gruppenlos per QR-Code
            </h1>
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-hbs-blue-soft text-hbs-slate text-xs font-bold border border-hbs-slate-border flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zum Portal</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center my-4">
        <div className="bg-white rounded-3xl border border-hbs-slate-border/80 shadow-hbs-card p-6 sm:p-8 max-w-md w-full text-center space-y-6">
          {isLoading ? (
            <div className="py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-hbs-blue-light text-hbs-blue flex items-center justify-center mx-auto animate-bounce">
                <Dices className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-hbs-slate-dark">Einen Moment …</h2>
              <p className="text-sm text-hbs-slate-muted">
                Deine Gruppe wird fair zugelost.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="py-4 space-y-5">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                  errorType === 'closed'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {errorType === 'closed' ? (
                  <Lock className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-hbs-slate">
                  Runde: {activeCode}
                </span>
                <h2 className="text-xl font-black text-hbs-slate-dark">{errorMessage}</h2>
                {errorType === 'full' && (
                  <p className="text-xs text-hbs-slate-muted">
                    Deine Lehrkraft kann am Smartboard mit einem Klick auf „+ 10 Plätze mehr“ weitere Plätze freigeben. Danach einfach auf „Erneut versuchen“ tippen!
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => performGroupDraw(activeCode)}
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Erneut versuchen</span>
                </button>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setErrorType(null);
                    setActiveCode('');
                  }}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark font-bold text-sm transition-all cursor-pointer"
                >
                  Anderer Code
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = pinInput.trim().toUpperCase();
                if (cleaned) {
                  setActiveCode(cleaned);
                }
              }}
              className="space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-hbs-teal-light text-hbs-teal border border-hbs-teal/20 flex items-center justify-center mx-auto shadow-xs">
                <Dices className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-hbs-teal bg-hbs-teal-light px-2.5 py-0.5 rounded-full border border-hbs-teal/20 mb-2">
                  <Sparkles className="w-3 h-3" /> Ohne Anmeldung
                </span>
                <h2 className="text-2xl font-black text-hbs-slate-dark tracking-tight">
                  Gruppe ziehen
                </h2>
                <p className="text-xs sm:text-sm text-hbs-slate-muted mt-1">
                  Gib den Runden-Code vom Smartboard ein, um deine Gruppe zu erhalten:
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  placeholder="z. B. HBS42"
                  maxLength={12}
                  autoFocus
                  className="w-full h-14 px-4 rounded-2xl bg-hbs-bg border-2 border-hbs-slate-border focus:border-hbs-blue text-center text-2xl font-black tracking-widest text-hbs-slate-dark uppercase focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!pinInput.trim()}
                className="w-full min-h-[52px] rounded-2xl bg-hbs-blue hover:bg-hbs-blue-deep disabled:opacity-50 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Dices className="w-5 h-5" />
                <span>Meine Gruppe anzeigen</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-2">
        <p className="text-xs text-hbs-slate-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-hbs-teal" />
          <span>100% DSGVO-konform · Dein Gerät speichert nur deine Gruppennummer.</span>
        </p>
      </footer>
    </div>
  );
};
