import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Target, 
  Zap, 
  Heart, 
  Users, 
  Check, 
  Clock, 
  Copy,
  UserCheck,
  Printer,
  Download,
  Presentation
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  OncooSession, 
  OncooCard, 
  OncooCardColor, 
  OncooColumn, 
  OncooDuettPair
} from '../../types/oncooTypes';
import { useAuth } from '../../context/AuthContext';

interface OncooPresenterProps {
  session: OncooSession;
  onExit: () => void;
}

const CARD_COLOR_CLASSES: Record<OncooCardColor, {
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  yellow: {
    bg: 'bg-amber-100 hover:bg-amber-200/90',
    border: 'border-amber-300 shadow-amber-900/5',
    text: 'text-amber-950',
    badge: 'bg-amber-200 text-amber-900'
  },
  green: {
    bg: 'bg-emerald-100 hover:bg-emerald-200/90',
    border: 'border-emerald-300 shadow-emerald-900/5',
    text: 'text-emerald-950',
    badge: 'bg-emerald-200 text-emerald-900'
  },
  blue: {
    bg: 'bg-blue-100 hover:bg-blue-200/90',
    border: 'border-blue-300 shadow-blue-900/5',
    text: 'text-blue-950',
    badge: 'bg-blue-200 text-blue-900'
  },
  pink: {
    bg: 'bg-pink-100 hover:bg-pink-200/90',
    border: 'border-pink-300 shadow-pink-900/5',
    text: 'text-pink-950',
    badge: 'bg-pink-200 text-pink-900'
  },
  orange: {
    bg: 'bg-orange-100 hover:bg-orange-200/90',
    border: 'border-orange-300 shadow-orange-900/5',
    text: 'text-orange-950',
    badge: 'bg-orange-200 text-orange-900'
  }
};

export const OncooPresenter: React.FC<OncooPresenterProps> = ({
  session: initialSession,
  onExit
}) => {
  const { saveOncooSession, updateActiveOncooSession } = useAuth();
  const [session, setSession] = useState<OncooSession>(initialSession);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filter & interaction state for Kartenabfrage
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState<boolean>(false);
  const [newColumnTitle, setNewColumnTitle] = useState<string>('');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState<boolean>(false);
  const [newCardText, setNewCardText] = useState<string>('');
  const [newCardColor, setNewCardColor] = useState<OncooCardColor>('yellow');
  const [newCardColumn, setNewCardColumn] = useState<string>('inbox');

  // Placemat active group
  const [activePlacematGroupIndex, setActivePlacematGroupIndex] = useState<number>(0);

  // Student join URL
  const studentJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?oncoo=${session.pinCode}`
    : `https://appportalhbs.vercel.app?oncoo=${session.pinCode}`;

  // Broadcast & Sync Session
  useEffect(() => {
    // Set as active session for cloud & local storage
    updateActiveOncooSession(session);
    saveOncooSession(session);
  }, [session, updateActiveOncooSession, saveOncooSession]);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Listen to cross-tab updates (simulating live student inputs in demo/school network)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`hbs_oncoo_${session.pinCode}`);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === 'STUDENT_SUBMISSION') {
          const payload = event.data.payload;
          handleStudentSubmission(payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
    return () => {
      if (channel) channel.close();
      channelRef.current = null;
    };
  }, [session.pinCode, session.isLocked]);

  const handleStudentSubmission = (payload: any) => {
    if (session.isLocked) return;

    setSession((prev) => {
      // 1. Kartenabfrage: new card
      if (prev.toolType === 'kartenabfrage' && payload.card) {
        const text = String(payload.card.text || '').trim();
        if (!text) return prev;
        const existing = prev.kartenabfrage?.cards || [];
        if (payload.card.id && existing.some(c => c.id === payload.card.id)) return prev;
        const safeCard: OncooCard = {
          id: payload.card.id || `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          text,
          color: payload.card.color || 'yellow',
          columnId: payload.card.columnId,
          createdAt: payload.card.createdAt || Date.now(),
          authorAlias: payload.card.authorAlias ? String(payload.card.authorAlias).trim() : undefined
        };
        return {
          ...prev,
          kartenabfrage: {
            ...prev.kartenabfrage!,
            cards: [safeCard, ...existing]
          }
        };
      }

      // 2. Zielscheibe: new vote
      if (prev.toolType === 'zielscheibe' && payload.vote) {
        const existingVotes = prev.zielscheibe?.votes || [];
        if (payload.vote.id && existingVotes.some(v => v.id === payload.vote.id)) return prev;
        return {
          ...prev,
          zielscheibe: {
            ...prev.zielscheibe!,
            votes: [...existingVotes, payload.vote]
          }
        };
      }

      // 3. Lerntempoduett: finished student
      if (prev.toolType === 'lerntempoduett' && payload.studentName) {
        const sName = String(payload.studentName).trim();
        if (!sName) return prev;
        const currentQueue = prev.lerntempoduett?.waitingQueue || [];
        const currentPairs = prev.lerntempoduett?.pairs || [];

        // Check if student is already paired or in queue
        const isAlreadyIn = currentQueue.includes(sName) || currentPairs.some(p => p.student1 === sName || p.student2 === sName);
        if (isAlreadyIn) return prev;

        if (currentQueue.length > 0) {
          // Match with the first in queue!
          const partner = currentQueue[0];
          const remainingQueue = currentQueue.slice(1);
          const newPair: OncooDuettPair = {
            id: `pair-${Date.now()}`,
            student1: partner,
            student2: sName,
            tableNumber: currentPairs.length + 1,
            pairedAt: Date.now(),
            phase: prev.lerntempoduett?.currentPhase || 2
          };

          // Notify students immediately via BroadcastChannel
          try {
            channelRef.current?.postMessage({
              type: 'PAIR_FORMED',
              payload: newPair
            });
          } catch (e) {}

          return {
            ...prev,
            lerntempoduett: {
              ...prev.lerntempoduett!,
              waitingQueue: remainingQueue,
              pairs: [...currentPairs, newPair]
            }
          };
        } else {
          // Add to waiting queue
          return {
            ...prev,
            lerntempoduett: {
              ...prev.lerntempoduett!,
              waitingQueue: [...currentQueue, sName]
            }
          };
        }
      }

      // 4. Helfersystem: item
      if (prev.toolType === 'helfersystem' && payload.helpItem) {
        const existing = prev.helfersystem?.items || [];
        if (payload.helpItem.id && existing.some(i => i.id === payload.helpItem.id)) return prev;
        return {
          ...prev,
          helfersystem: {
            ...prev.helfersystem!,
            items: [payload.helpItem, ...existing]
          }
        };
      }

      // 5. Placemat: note update
      if (prev.toolType === 'placemat' && payload.placematUpdate) {
        const { groupIndex, cornerKey, note } = payload.placematUpdate;
        if (!note || !cornerKey) return prev;
        const groups = (prev.placemat?.groups || []).map((grp, gIdx) => {
          if (gIdx !== groupIndex) return grp;
          const key = cornerKey as 'cornerA' | 'cornerB' | 'cornerC' | 'cornerD';
          const corner = grp[key];
          if (!corner) return grp;
          return {
            ...grp,
            [key]: {
              ...corner,
              notes: [...(corner.notes || []), note]
            }
          };
        });

        return {
          ...prev,
          placemat: {
            ...prev.placemat!,
            groups
          }
        };
      }

      return prev;
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Card like toggle
  const handleLikeCard = (cardId: string) => {
    setSession((prev) => {
      if (!prev.kartenabfrage) return prev;
      const cards = prev.kartenabfrage.cards.map((c) => {
        if (c.id === cardId) {
          return { ...c, likes: (c.likes || 0) + 1 };
        }
        return c;
      });
      return {
        ...prev,
        kartenabfrage: { ...prev.kartenabfrage, cards }
      };
    });
  };

  // Move card to column
  const handleMoveCard = (cardId: string, targetColumnId: string) => {
    setSession((prev) => {
      if (!prev.kartenabfrage) return prev;
      const cards = prev.kartenabfrage.cards.map((c) => {
        if (c.id === cardId) {
          return { ...c, columnId: targetColumnId === 'inbox' ? undefined : targetColumnId };
        }
        return c;
      });
      return {
        ...prev,
        kartenabfrage: { ...prev.kartenabfrage, cards }
      };
    });
  };

  // Delete card
  const handleDeleteCard = (cardId: string) => {
    setSession((prev) => {
      if (!prev.kartenabfrage) return prev;
      const cards = prev.kartenabfrage.cards.filter((c) => c.id !== cardId);
      return {
        ...prev,
        kartenabfrage: { ...prev.kartenabfrage, cards }
      };
    });
  };

  // Add Column
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    const newCol: OncooColumn = {
      id: `col-${Date.now()}`,
      title: newColumnTitle.trim()
    };
    setSession((prev) => {
      if (!prev.kartenabfrage) return prev;
      return {
        ...prev,
        kartenabfrage: {
          ...prev.kartenabfrage,
          columns: [...prev.kartenabfrage.columns, newCol]
        }
      };
    });
    setNewColumnTitle('');
    setIsAddColumnModalOpen(false);
  };

  // Add Card manually from teacher screen
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardText.trim()) return;
    const card: OncooCard = {
      id: `card-${Date.now()}`,
      text: newCardText.trim(),
      color: newCardColor,
      columnId: newCardColumn === 'inbox' ? undefined : newCardColumn,
      authorAlias: 'Lehrkraft',
      createdAt: Date.now(),
      likes: 0
    };
    setSession((prev) => {
      if (!prev.kartenabfrage) return prev;
      return {
        ...prev,
        kartenabfrage: {
          ...prev.kartenabfrage,
          cards: [card, ...prev.kartenabfrage.cards]
        }
      };
    });
    setNewCardText('');
    setIsAddCardModalOpen(false);
  };

  // Count total participants
  const participantCount = React.useMemo(() => {
    if (session.toolType === 'kartenabfrage') {
      const aliases = new Set(session.kartenabfrage?.cards.map(c => c.authorAlias).filter(Boolean));
      return aliases.size || session.kartenabfrage?.cards.length || 0;
    }
    if (session.toolType === 'zielscheibe') {
      return session.zielscheibe?.votes.length || 0;
    }
    if (session.toolType === 'lerntempoduett') {
      const q = session.lerntempoduett?.waitingQueue.length || 0;
      const p = (session.lerntempoduett?.pairs.length || 0) * 2;
      return q + p;
    }
    if (session.toolType === 'helfersystem') {
      return session.helfersystem?.items.length || 0;
    }
    return 4;
  }, [session]);

  const [boardExportToast, setBoardExportToast] = useState<boolean>(false);

  // 1. Export clustered cards to Digital Blackboard (ClassroomBoard)
  const handleExportToBoard = () => {
    try {
      const STORAGE_KEY = 'hbs_board_deck_v1';
      const saved = localStorage.getItem(STORAGE_KEY);
      let screens = [];
      if (saved) {
        try { screens = JSON.parse(saved); } catch (e) { screens = []; }
      }
      if (!Array.isArray(screens) || screens.length === 0) {
        screens = [{ id: 'screen-1', title: 'Tafel 1', backgroundId: 'chalkboard', widgets: [] }];
      }

      const q = session.kartenabfrage?.question || session.title;
      let text = `📌 ONCOO KARTENABFRAGE: ${q}\n\n`;

      session.kartenabfrage?.columns.forEach((col) => {
        const colCards = session.kartenabfrage!.cards.filter(c => c.columnId === col.id);
        text += `📁 ${col.title} (${colCards.length} Karten):\n`;
        if (colCards.length === 0) {
          text += `  (Keine Karten zugeordnet)\n`;
        } else {
          colCards.forEach(c => {
            text += `  • ${c.text}${c.authorAlias ? ` [${c.authorAlias}]` : ''}\n`;
          });
        }
        text += `\n`;
      });

      const unassigned = session.kartenabfrage?.cards.filter(c => !c.columnId) || [];
      if (unassigned.length > 0) {
        text += `📥 Ungeordnete Ideen (${unassigned.length}):\n`;
        unassigned.forEach(c => {
          text += `  • ${c.text}\n`;
        });
      }

      const newWidget = {
        id: `oncoo-result-${Date.now()}`,
        type: 'text' as const,
        title: `Oncoo: ${q.slice(0, 20)}...`,
        x: 60 + Math.floor(Math.random() * 60),
        y: 80 + Math.floor(Math.random() * 60),
        width: 440,
        height: 320,
        zIndex: 50,
        data: { text }
      };

      screens[0].widgets = [...(screens[0].widgets || []), newWidget];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
      setBoardExportToast(true);
      setTimeout(() => setBoardExportToast(false), 3500);
    } catch (err) {
      console.warn('Fehler beim Export auf Tafel:', err);
    }
  };

  // 2. Printable Handout in DIN A4
  const handlePrintKartenabfrage = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      const q = session.kartenabfrage?.question || session.title;
      const columnsHtml = (session.kartenabfrage?.columns || []).map((col) => {
        const colCards = (session.kartenabfrage?.cards || []).filter(c => c.columnId === col.id);
        return `
          <div style="flex: 1; min-width: 180px; border: 1.5px solid #003366; border-radius: 8px; overflow: hidden; background: #ffffff; margin: 4px;">
            <div style="background: #003366; color: #ffffff; padding: 6px 10px; font-weight: 800; font-size: 10.5pt; display: flex; justify-content: space-between;">
              <span>${col.title}</span>
              <span style="opacity: 0.8; font-size: 9pt;">(${colCards.length})</span>
            </div>
            <div style="padding: 8px; display: flex; flex-direction: column; gap: 6px;">
              ${colCards.length === 0 ? '<div style="font-size: 8.5pt; color: #94a3b8; font-style: italic;">Keine Karten zugeordnet</div>' : ''}
              ${colCards.map(c => `
                <div style="padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 9pt; color: #0f172a; line-height: 1.35;">
                  ${c.text}
                  ${c.authorAlias ? `<div style="font-size: 7pt; color: #64748b; font-weight: bold; margin-top: 2px;">— ${c.authorAlias}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');

      const unassignedCards = (session.kartenabfrage?.cards || []).filter(c => !c.columnId);
      const unassignedHtml = unassignedCards.length > 0 ? `
        <div style="margin-top: 14px; padding: 10px; border: 1px dashed #94a3b8; border-radius: 8px; background: #f1f5f9;">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
            Weitere Ideen / Ungeordnete Karten (${unassignedCards.length}):
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${unassignedCards.map(c => `
              <div style="padding: 4px 8px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 8.5pt; color: #1e293b;">
                ${c.text} ${c.authorAlias ? `<span style="color: #64748b; font-size: 7pt;">(${c.authorAlias})</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Oncoo Kartenabfrage - ${q}</title>
            <style>
              @page { size: landscape; margin: 10mm; }
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #0f172a; background: white; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 6px; margin-bottom: 12px; }
              .school { font-size: 8pt; font-weight: 800; color: #003366; text-transform: uppercase; letter-spacing: 0.05em; }
              .title { font-size: 14pt; font-weight: 900; margin: 2px 0; }
              .meta { font-size: 8.5pt; color: #64748b; }
              .crest { height: 40px; }
              .columns-container { display: flex; align-items: flex-start; justify-content: stretch; gap: 8px; flex-wrap: wrap; }
              .footer { margin-top: 14px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 7.5pt; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="school">Staatliche Regelschule „Geschwister Scholl“ Kahla • Oncoo Kartenabfrage</div>
                <div class="title">Thema: ${q}</div>
                <div class="meta">Datum: ${new Date().toLocaleDateString('de-DE')} • PIN: ${session.pinCode} • Karten gesamt: ${session.kartenabfrage?.cards.length || 0}</div>
              </div>
              <img src="/Siegel_bunt.png" class="crest" alt="Siegel" />
            </div>
            <div class="columns-container">
              ${columnsHtml}
            </div>
            ${unassignedHtml}
            <div class="footer">
              <span>HBS App-Portal • Kooperatives Lernen (Oncoo)</span>
              <span>Seite 1 / 1</span>
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }, 400);
    }
  };

  // 3. Download Markdown / Text Documentation
  const handleDownloadText = () => {
    const q = session.kartenabfrage?.question || session.title;
    let md = `# Oncoo Kartenabfrage: ${q}\n`;
    md += `Datum: ${new Date().toLocaleDateString('de-DE')} • PIN: ${session.pinCode}\n\n`;

    session.kartenabfrage?.columns.forEach(col => {
      const colCards = session.kartenabfrage!.cards.filter(c => c.columnId === col.id);
      md += `## ${col.title} (${colCards.length} Karten)\n`;
      colCards.forEach(c => {
        md += `- ${c.text}${c.authorAlias ? ` (von ${c.authorAlias})` : ''}\n`;
      });
      md += `\n`;
    });

    const unassigned = session.kartenabfrage?.cards.filter(c => !c.columnId) || [];
    if (unassigned.length > 0) {
      md += `## Weitere ungeordnete Karten (${unassigned.length})\n`;
      unassigned.forEach(c => {
        md += `- ${c.text}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Oncoo_Kartenabfrage_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between select-none">
      
      {/* ================= 1. TOP TEACHER BEAMER BAR ================= */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-md">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
            title="Sitzung verlassen"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Beenden</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                {session.toolType === 'kartenabfrage' ? '📌 Kartenabfrage' :
                 session.toolType === 'zielscheibe' ? '🎯 Zielscheibe' :
                 session.toolType === 'lerntempoduett' ? '⚡ Lerntempoduett' :
                 session.toolType === 'helfersystem' ? '🤝 Helfersystem' : '📋 Placemat'}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300 truncate max-w-[200px] sm:max-w-xs font-bold">
                {session.title}
              </span>
            </div>
          </div>
        </div>

        {/* Center: PIN-CODE BADGE (For Students to join) */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-2xl shadow-inner">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Beitreten: appportalhbs.vercel.app
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold">PIN:</span>
              <span className="text-sm sm:text-base font-black tracking-widest text-amber-400 font-mono">
                {session.pinCode}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Großen QR-Code für den Beamer öffnen"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden md:inline">QR-Code</span>
          </button>
        </div>

        {/* Right: Controls (Lock, Participant Count, Fullscreen, Reset) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{participantCount}</span>
          </div>

          {/* Lock / Freeze inputs */}
          <button
            type="button"
            onClick={() => setSession(s => ({ ...s, isLocked: !s.isLocked }))}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              session.isLocked 
                ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={session.isLocked ? 'Eingaben gesperrt (Klick zum Entsperren)' : 'Eingaben aktiv (Klick zum Sperren)'}
          >
            {session.isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="Vollbild umschalten"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>

      </header>

      {/* ================= 2. MAIN TOOL CANVAS ================= */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
        
        {/* ======================================================== */}
        {/* A. KARTENABFRAGE (DIGITALE PINNWAND)                    */}
        {/* ======================================================== */}
        {session.toolType === 'kartenabfrage' && session.kartenabfrage && (
          <div className="flex flex-col h-full space-y-4">
            
            {/* Top Prompt & Action Bar */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                  Zentrale Leitfrage
                </span>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  {session.kartenabfrage.question}
                </h2>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                
                {/* Color Filters */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedColorFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedColorFilter === 'all' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Alle ({session.kartenabfrage.cards.length})
                  </button>
                  {(['yellow', 'green', 'blue', 'pink', 'orange'] as OncooCardColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColorFilter(c)}
                      className={`w-6 h-6 rounded-lg border transition-all ${CARD_COLOR_CLASSES[c].bg} ${
                        selectedColorFilter === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Nach Farbe ${c} filtern`}
                    />
                  ))}
                </div>

                {/* Print Handout PDF */}
                <button
                  type="button"
                  onClick={handlePrintKartenabfrage}
                  className="px-3 py-1.5 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Druckbogen im DIN A4 Querformat drucken / als PDF speichern"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Druckbogen</span>
                </button>

                {/* Export to Blackboard */}
                <button
                  type="button"
                  onClick={handleExportToBoard}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Ergebnisse als Widget auf die Digitale Tafel exportieren"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Auf Tafel</span>
                </button>

                {/* Download Text / Markdown */}
                <button
                  type="button"
                  onClick={handleDownloadText}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Karten als Textdatei (.md) herunterladen"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Export</span>
                </button>

                {/* Add Column Button */}
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Spalte</span>
                </button>

                {/* Add Card Button */}
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Kärtchen</span>
                </button>
              </div>
            </div>

            {/* Board Columns & Cards Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start min-h-[500px]">
              
              {/* 1. Inbox / Unassigned Cards Column */}
              <div className="bg-slate-800/50 rounded-2xl p-3 border-2 border-dashed border-slate-700 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>Eingang / Ungeordnet</span>
                  </span>
                  <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {session.kartenabfrage.cards.filter(c => !c.columnId).length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {session.kartenabfrage.cards
                    .filter(c => !c.columnId && (selectedColorFilter === 'all' || c.color === selectedColorFilter))
                    .map((card) => (
                      <div
                        key={card.id}
                        className={`p-3.5 rounded-2xl border ${CARD_COLOR_CLASSES[card.color].bg} ${CARD_COLOR_CLASSES[card.color].border} ${CARD_COLOR_CLASSES[card.color].text} shadow-md transition-all hover:scale-[1.02] flex flex-col justify-between gap-2.5 group`}
                      >
                        <p className="text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-wrap">
                          {card.text}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-semibold opacity-75 pt-1 border-t border-black/10">
                          <span>{card.authorAlias || 'Anonym'}</span>
                          
                          <div className="flex items-center gap-1">
                            {/* Move to column dropdown */}
                            <select
                              value="inbox"
                              onChange={(e) => handleMoveCard(card.id, e.target.value)}
                              className="text-[10px] bg-white/70 rounded px-1.5 py-0.5 border border-black/10 text-slate-800"
                            >
                              <option value="inbox">In Spalte...</option>
                              {session.kartenabfrage?.columns.map(col => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                              ))}
                            </select>

                            {/* Likes */}
                            <button
                              type="button"
                              onClick={() => handleLikeCard(card.id)}
                              className="p-1 rounded hover:bg-black/10 flex items-center gap-0.5"
                              title="Kärtchen liken"
                            >
                              <Heart className={`w-3 h-3 ${card.likes ? 'fill-red-500 text-red-500' : ''}`} />
                              <span>{card.likes || 0}</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-red-700"
                              title="Kärtchen löschen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 2. Custom Category Columns */}
              {session.kartenabfrage.columns.map((column) => {
                const colCards = session.kartenabfrage!.cards.filter(
                  c => c.columnId === column.id && (selectedColorFilter === 'all' || c.color === selectedColorFilter)
                );

                return (
                  <div key={column.id} className="bg-slate-800/70 rounded-2xl p-3 border border-slate-700 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
                      <h4 className="text-xs font-black text-white truncate max-w-[150px]">
                        {column.title}
                      </h4>
                      <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        {colCards.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {colCards.map((card) => (
                        <div
                          key={card.id}
                          className={`p-3.5 rounded-2xl border ${CARD_COLOR_CLASSES[card.color].bg} ${CARD_COLOR_CLASSES[card.color].border} ${CARD_COLOR_CLASSES[card.color].text} shadow-md transition-all hover:scale-[1.02] flex flex-col justify-between gap-2.5 group`}
                        >
                          <p className="text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-wrap">
                            {card.text}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-semibold opacity-75 pt-1 border-t border-black/10">
                            <span>{card.authorAlias || 'Anonym'}</span>
                            
                            <div className="flex items-center gap-1">
                              <select
                                value={column.id}
                                onChange={(e) => handleMoveCard(card.id, e.target.value)}
                                className="text-[10px] bg-white/70 rounded px-1.5 py-0.5 border border-black/10 text-slate-800"
                              >
                                <option value="inbox">In Eingang</option>
                                {session.kartenabfrage?.columns.map(col => (
                                  <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleLikeCard(card.id)}
                                className="p-1 rounded hover:bg-black/10 flex items-center gap-0.5"
                                title="Kärtchen liken"
                              >
                                <Heart className={`w-3 h-3 ${card.likes ? 'fill-red-500 text-red-500' : ''}`} />
                                <span>{card.likes || 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-1 rounded hover:bg-red-500/20 text-red-700"
                                title="Kärtchen löschen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* B. ZIELSCHEIBE (EVALUATIONS-DARTBOARD)                   */}
        {/* ======================================================== */}
        {session.toolType === 'zielscheibe' && session.zielscheibe && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
            
            {/* Left: The Concentric Target SVG */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-2xl aspect-square p-4 bg-slate-950/60 rounded-3xl border border-slate-800 shadow-2xl">
              
              <svg viewBox="-250 -250 500 500" className="w-full h-full max-h-[550px] select-none">
                
                {/* 5 Concentric Rings (1 = Außen, 5 = Zentrum) */}
                {[
                  { r: 220, label: '1' },
                  { r: 175, label: '2' },
                  { r: 130, label: '3' },
                  { r: 85, label: '4' },
                  { r: 40, label: '5' },
                ].map((ring, idx) => (
                  <circle
                    key={ring.r}
                    cx="0"
                    cy="0"
                    r={ring.r}
                    fill={idx % 2 === 0 ? '#1e293b' : '#0f172a'}
                    stroke="#475569"
                    strokeWidth="1.5"
                    className="transition-colors"
                  />
                ))}

                {/* Bulls Eye Glow in Center */}
                <circle cx="0" cy="0" r="18" fill="#e11d48" className="animate-pulse" />

                {/* Sector Dividers based on criteria count */}
                {session.zielscheibe.criteria.map((crit, idx, arr) => {
                  const angle = (idx * 2 * Math.PI) / arr.length - Math.PI / 2;
                  const x = 220 * Math.cos(angle);
                  const y = 220 * Math.sin(angle);
                  return (
                    <line
                      key={crit.id}
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  );
                })}

                {/* Plot incoming student vote dots */}
                {session.zielscheibe.votes.map((vote) => {
                  return Object.entries(vote.scores).map(([critId, score]) => {
                    const idx = session.zielscheibe!.criteria.findIndex(c => c.id === critId);
                    if (idx === -1) return null;
                    const totalSectors = session.zielscheibe!.criteria.length;
                    
                    // Sector center angle
                    const sectorStart = (idx * 2 * Math.PI) / totalSectors - Math.PI / 2;
                    const sectorEnd = ((idx + 1) * 2 * Math.PI) / totalSectors - Math.PI / 2;
                    const midAngle = (sectorStart + sectorEnd) / 2;
                    
                    // Ring radius (score: 1..5, 5 = nearest center, 1 = outermost)
                    const normalizedRadius = 220 - ((score - 0.5) / 5) * 200;
                    
                    // Deterministic pseudorandom jitter per vote
                    const jitterAngle = midAngle + ((Math.sin(score * 17 + idx * 23) * 0.3) * (Math.PI / totalSectors));
                    const jitterRadius = normalizedRadius + (Math.cos(score * 31 + idx * 7) * 12);

                    const dotX = jitterRadius * Math.cos(jitterAngle);
                    const dotY = jitterRadius * Math.sin(jitterAngle);

                    return (
                      <circle
                        key={`${vote.id}-${critId}`}
                        cx={dotX}
                        cy={dotY}
                        r="6"
                        fill="#f43f5e"
                        stroke="#ffe4e6"
                        strokeWidth="1.5"
                        className="transition-all duration-300 drop-shadow-md animate-in zoom-in"
                      />
                    );
                  });
                })}

                {/* Criteria labels around the outside perimeter */}
                {session.zielscheibe.criteria.map((crit, idx, arr) => {
                  const sectorStart = (idx * 2 * Math.PI) / arr.length - Math.PI / 2;
                  const sectorEnd = ((idx + 1) * 2 * Math.PI) / arr.length - Math.PI / 2;
                  const midAngle = (sectorStart + sectorEnd) / 2;
                  const labelRadius = 238;
                  const lx = labelRadius * Math.cos(midAngle);
                  const ly = labelRadius * Math.sin(midAngle);

                  return (
                    <text
                      key={crit.id}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#38bdf8"
                      fontSize="11"
                      fontWeight="bold"
                      className="drop-shadow"
                    >
                      {crit.label}
                    </text>
                  );
                })}

              </svg>

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Zentrum = 5 (Trifft voll zu)</span>
                <span>Außen = 1 (Trifft gar nicht zu)</span>
              </div>
            </div>

            {/* Right: Statistics & Score breakdown per axis */}
            <div className="w-full lg:w-96 bg-slate-950/70 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white">Auswertung</h3>
                  <span className="text-xs text-slate-400">
                    {session.zielscheibe.votes.length} abgegebene Bewertungen
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              {/* Criteria Score Bars */}
              <div className="space-y-3.5">
                {session.zielscheibe.criteria.map((crit) => {
                  const votes = session.zielscheibe!.votes
                    .map(v => v.scores[crit.id])
                    .filter((s): s is number => typeof s === 'number');

                  const avg = votes.length > 0
                    ? (votes.reduce((a, b) => a + b, 0) / votes.length).toFixed(1)
                    : '-';

                  const percentage = votes.length > 0 ? (Number(avg) / 5) * 100 : 0;

                  return (
                    <div key={crit.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-200">{crit.label}</span>
                        <span className="text-emerald-400 font-mono text-sm">{avg} / 5.0</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {crit.description && (
                        <span className="text-[10px] text-slate-400 block">{crit.description}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reset votes */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Möchtest du alle Stimmen auf dieser Zielscheibe zurücksetzen?')) {
                    setSession(s => ({
                      ...s,
                      zielscheibe: { ...s.zielscheibe!, votes: [] }
                    }));
                  }
                }}
                className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ergebnisse zurücksetzen</span>
              </button>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* C. LERNTEMPODUETT                                        */}
        {/* ======================================================== */}
        {session.toolType === 'lerntempoduett' && session.lerntempoduett && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Phase Step Banner */}
            <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                  Aktuelle Phase {session.lerntempoduett.currentPhase} von {session.lerntempoduett.phases.length}
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  {session.lerntempoduett.taskTitle}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {session.lerntempoduett.phases[session.lerntempoduett.currentPhase - 1]?.description}
                </p>
              </div>

              {/* Next phase button */}
              <button
                type="button"
                onClick={() => {
                  setSession(prev => {
                    if (!prev.lerntempoduett) return prev;
                    const next = Math.min(prev.lerntempoduett.phases.length, prev.lerntempoduett.currentPhase + 1);
                    return {
                      ...prev,
                      lerntempoduett: { ...prev.lerntempoduett, currentPhase: next }
                    };
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shrink-0 flex items-center gap-2"
              >
                <span>Nächste Phase starten</span>
                <Zap className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Waiting Queue & Paired Tandems */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Waiting List */}
              <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Warteliste ({session.lerntempoduett.waitingQueue.length})</span>
                  </span>
                </div>

                {session.lerntempoduett.waitingQueue.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Aktuell wartet niemand. Schüler klicken auf „Ich bin fertig“, um hier zu erscheinen.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {session.lerntempoduett.waitingQueue.map((student, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-between">
                        <span>{student}</span>
                        <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Wartet auf Tandem...
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tandem Matches (Pairs) */}
              <div className="md:col-span-2 bg-slate-950/70 p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>Gebildete Tandems ({session.lerntempoduett.pairs.length})</span>
                  </span>
                </div>

                {session.lerntempoduett.pairs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Noch keine Tandems gebildet. Sobald sich zwei Schüler fertig melden, werden sie gekoppelt.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {session.lerntempoduett.pairs.map((pair) => (
                      <div key={pair.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-blue-400">
                            Tisch {pair.tableNumber || '-'}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                            Partnervergleich
                          </span>
                        </div>
                        <div className="flex items-center justify-around py-2 font-black text-sm text-white">
                          <span>{pair.student1}</span>
                          <span className="text-slate-500 font-normal">🤝</span>
                          <span>{pair.student2}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* D. HELFERSYSTEM (PEER-TEACHING HILFEBÖRSE)               */}
        {/* ======================================================== */}
        {session.toolType === 'helfersystem' && session.helfersystem && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700">
              <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                Aufgabe / Thema
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">
                {session.helfersystem.exerciseTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* HELP SEEKERS (Hilfe gesucht) */}
              <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                    <span>🆘 Hilfe gesucht</span>
                  </span>
                  <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                    {session.helfersystem.items.filter(i => i.type === 'seek').length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {session.helfersystem.items.filter(i => i.type === 'seek').map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-red-950/30 border border-red-800/40 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-black text-white block">{item.studentName}</span>
                        <span className="text-[11px] text-red-300 font-semibold">{item.topic}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'matched' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {item.status === 'matched' ? 'In Hilfe' : 'Wartet'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HELP PROVIDERS (Helfer bereit) */}
              <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <span>💡 Helfer bereit</span>
                  </span>
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    {session.helfersystem.items.filter(i => i.type === 'offer').length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {session.helfersystem.items.filter(i => i.type === 'offer').map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-black text-white block">{item.studentName}</span>
                        <span className="text-[11px] text-emerald-300 font-semibold">{item.topic}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        Bereit
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* E. PLACEMAT (4-FELDER THINK-PAIR-SHARE)                  */}
        {/* ======================================================== */}
        {session.toolType === 'placemat' && session.placemat && (
          <div className="space-y-4 max-w-5xl mx-auto">
            
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-rose-400 tracking-wider">
                  Thema der Placemat
                </span>
                <h3 className="text-base font-black text-white">{session.placemat.topic}</h3>
              </div>

              {/* Group tabs */}
              <div className="flex items-center gap-1.5">
                {session.placemat.groups.map((grp, gIdx) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setActivePlacematGroupIndex(gIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activePlacematGroupIndex === gIdx
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {grp.groupName}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Placemat Canvas */}
            {session.placemat.groups[activePlacematGroupIndex] && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 grid grid-cols-3 grid-rows-3 gap-3 aspect-video max-h-[600px]">
                
                {/* North Corner A */}
                <div className="col-span-3 bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-black text-blue-400">{session.placemat.groups[activePlacematGroupIndex].cornerA.author}</span>
                  <div className="text-xs text-slate-200 mt-1 space-y-1">
                    {session.placemat.groups[activePlacematGroupIndex].cornerA.notes.map((n, i) => (
                      <p key={i}>• {n}</p>
                    ))}
                  </div>
                </div>

                {/* West Corner D */}
                <div className="row-span-1 col-span-1 bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-black text-amber-400">{session.placemat.groups[activePlacematGroupIndex].cornerD.author}</span>
                  <div className="text-xs text-slate-200 mt-1 space-y-1">
                    {session.placemat.groups[activePlacematGroupIndex].cornerD.notes.map((n, i) => (
                      <p key={i}>• {n}</p>
                    ))}
                  </div>
                </div>

                {/* CENTER CONSENSUS FIELD */}
                <div className="row-span-1 col-span-1 bg-gradient-to-br from-rose-950/80 to-red-900/60 rounded-2xl p-4 border-2 border-rose-500 shadow-xl flex flex-col justify-center items-center text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 mb-1">
                    Gruppenkonsens
                  </span>
                  <p className="text-xs font-bold text-white leading-relaxed">
                    {session.placemat.groups[activePlacematGroupIndex].consensus || 'Wird in der Share-Phase gemeinsam formuliert...'}
                  </p>
                </div>

                {/* East Corner B */}
                <div className="row-span-1 col-span-1 bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-black text-purple-400">{session.placemat.groups[activePlacematGroupIndex].cornerB.author}</span>
                  <div className="text-xs text-slate-200 mt-1 space-y-1">
                    {session.placemat.groups[activePlacematGroupIndex].cornerB.notes.map((n, i) => (
                      <p key={i}>• {n}</p>
                    ))}
                  </div>
                </div>

                {/* South Corner C */}
                <div className="col-span-3 bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                  <span className="text-xs font-black text-emerald-400">{session.placemat.groups[activePlacematGroupIndex].cornerC.author}</span>
                  <div className="text-xs text-slate-200 mt-1 space-y-1">
                    {session.placemat.groups[activePlacematGroupIndex].cornerC.notes.map((n, i) => (
                      <p key={i}>• {n}</p>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ================= 3. QR-CODE BEAMER MODAL ================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                Schüler-Beitritt
              </span>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Mit Smartphone oder iPad scannen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Keine App und kein Login erforderlich
              </p>
            </div>

            {/* Huge QR Code */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm inline-block">
              <QRCodeSVG
                value={studentJoinUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">Oder manuell aufrufen:</span>
              <span className="text-sm font-black text-slate-800 font-mono">appportalhbs.vercel.app</span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-slate-500">PIN:</span>
                <span className="text-lg font-black text-rose-600 tracking-widest font-mono">
                  {session.pinCode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(studentJoinUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link kopiert!' : 'Direktlink für Teams / Chat kopieren'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= 4. ADD COLUMN MODAL ================= */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-3">Neue Spalte hinzufügen</h3>
            <form onSubmit={handleAddColumn} className="space-y-3">
              <input
                type="text"
                required
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Spaltentitel (z. B. Vorteile, Fragen...)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Spalte anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. ADD CARD MODAL ================= */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Kärtchen hinzufügen</h3>
            <form onSubmit={handleAddCard} className="space-y-3">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Farbe</label>
                <div className="flex items-center gap-2">
                  {(['yellow', 'green', 'blue', 'pink', 'orange'] as OncooCardColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCardColor(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition-all ${CARD_COLOR_CLASSES[c].bg} ${
                        newCardColor === c ? 'border-black scale-110' : 'border-transparent opacity-60'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Text auf dem Kärtchen</label>
                <textarea
                  required
                  rows={3}
                  value={newCardText}
                  onChange={(e) => setNewCardText(e.target.value)}
                  placeholder="Gedanke oder Stichpunkt..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {session.kartenabfrage && session.kartenabfrage.columns.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Spalte zuweisen</label>
                  <select
                    value={newCardColumn}
                    onChange={(e) => setNewCardColumn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  >
                    <option value="inbox">Eingang (ungeordnet)</option>
                    {session.kartenabfrage.columns.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Kärtchen anpinnen
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Toast for Board Export */}
      {boardExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <Presentation className="w-5 h-5 text-emerald-200 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Erfolgreich übertragen!</div>
            <div className="text-xs opacity-90">Die Kartenabfrage wurde als Text-Widget auf der Digitalen Tafel abgelegt.</div>
          </div>
        </div>
      )}

    </div>
  );
};
