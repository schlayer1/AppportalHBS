import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Smartphone, 
  Share2, 
  Check, 
  Youtube, 
  FileText,
  Download,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { BoardScreen } from './types';
import { PORTAL_CONFIG } from '../../config/apps';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ExportBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: BoardScreen;
}

export const ExportBoardModal: React.FC<ExportBoardModalProps> = ({
  isOpen,
  onClose,
  activeScreen
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'visual' | 'protocol' | 'share'>('visual');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract texts, notes, and links from active widgets
  const textWidgets = activeScreen.widgets.filter((w) => w.type === 'text');
  const videoWidgets = activeScreen.widgets.filter((w) => w.type === 'video');
  const linkWidgets = activeScreen.widgets.filter((w) => w.type === 'hyperlink' || w.type === 'embed');

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?boardShare=active`
    : 'https://appportalhbs.vercel.app/?boardShare=active';

  // Trigger Board Snapshot Capture when Modal Opens
  useEffect(() => {
    if (!isOpen) {
      setSnapshotUrl(null);
      return;
    }

    const captureBoard = async () => {
      setIsCapturing(true);
      try {
        const boardCanvasEl = document.getElementById('classroom-board-canvas');
        if (!boardCanvasEl) {
          setIsCapturing(false);
          return;
        }

        // Calculate bounding box of active widgets so we don't capture 2800px of empty space
        let captureW = Math.max(1200, window.innerWidth);
        let captureH = Math.max(700, window.innerHeight);

        if (activeScreen.widgets.length > 0) {
          const maxX = Math.max(...activeScreen.widgets.map((w) => w.x + w.width));
          const maxY = Math.max(...activeScreen.widgets.map((w) => w.y + (w.isMinimized ? 44 : w.height)));
          captureW = Math.max(window.innerWidth, Math.min(2800, maxX + 80));
          captureH = Math.max(window.innerHeight, Math.min(1800, maxY + 80));
        }

        const canvas = await html2canvas(boardCanvasEl, {
          width: captureW,
          height: captureH,
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null,
          ignoreElements: (el: Element) => {
            return (
              el.classList.contains('no-print') ||
              el.classList.contains('board-dock') ||
              el.classList.contains('board-topbar') ||
              el.tagName === 'IFRAME'
            );
          }
        });

        const dataUrl = canvas.toDataURL('image/png');
        setSnapshotUrl(dataUrl);

        // Synchronize shared board data to Firestore & localStorage for student devices
        syncBoardForStudents(dataUrl);
      } catch (err) {
        console.warn('Fehler bei der Snapshot-Erstellung des Tafelbildes:', err);
      } finally {
        setIsCapturing(false);
      }
    };

    // Small delay to allow modal render
    const timeout = setTimeout(captureBoard, 150);
    return () => clearTimeout(timeout);
  }, [isOpen, activeScreen]);

  const syncBoardForStudents = async (imgUrl: string) => {
    const notesList = textWidgets
      .map((w) => w.data?.text || w.data?.noteText)
      .filter(Boolean);

    const tasksList: { id: string; text: string; done: boolean }[] = [];
    textWidgets.forEach((w) => {
      if (Array.isArray(w.data?.checklist)) {
        w.data.checklist.forEach((c: any) => {
          tasksList.push({ id: c.id, text: c.text, done: !!c.done });
        });
      }
    });

    const mediaList = [
      ...videoWidgets.map((v) => ({ title: v.title || 'Lernvideo', url: v.data?.url || '', type: 'video' as const })),
      ...linkWidgets.map((l) => ({ title: l.title || 'Weblink', url: l.data?.url || '', type: 'link' as const }))
    ];

    const sharedPayload = {
      title: activeScreen.title || 'Tafelbild',
      teacherName: currentUser?.name || 'Fachlehrer',
      targetDate: new Date().toLocaleDateString('de-DE'),
      notes: notesList,
      tasks: tasksList,
      mediaLinks: mediaList,
      snapshotUrl: imgUrl,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem('hbs_live_shared_board', JSON.stringify(sharedPayload));
      if (db) {
        const portalDocRef = doc(db, 'schools', 'HBS_portal');
        await updateDoc(portalDocRef, {
          sharedBoard: sharedPayload
        });
      }
    } catch (e) {
      console.warn('Fehler beim Publizieren des Schüler-Tafelbildes:', e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSnapshot = (format: 'png' | 'jpeg' = 'png') => {
    if (!snapshotUrl) return;
    const cleanTitle = (activeScreen.title || 'Tafelbild').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
    const filename = `Tafelbild_HBS_${cleanTitle}_${new Date().toISOString().split('T')[0]}.${format === 'jpeg' ? 'jpg' : 'png'}`;

    if (format === 'jpeg') {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
          const a = document.createElement('a');
          a.href = jpegUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      img.src = snapshotUrl;
      return;
    }

    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print Mode 1: Print the VISUAL BOARD snapshot in landscape DIN A4
  const handlePrintVisualBoard = () => {
    if (!snapshotUrl) return;
    setIsPrinting(true);

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
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tafelbild - ${activeScreen.title}</title>
            <style>
              @page {
                size: landscape;
                margin: 8mm;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: white;
                color: #0f172a;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #003366;
                padding-bottom: 6px;
                margin-bottom: 10px;
              }
              .school-name {
                font-size: 8pt;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #003366;
              }
              .title {
                font-size: 14pt;
                font-weight: 900;
                margin: 2px 0;
                color: #0f172a;
              }
              .meta {
                font-size: 8.5pt;
                color: #64748b;
              }
              .crest {
                height: 40px;
                width: auto;
              }
              .board-box {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .board-img {
                width: 100%;
                max-height: calc(100vh - 90px);
                object-fit: contain;
                border-radius: 6px;
                border: 1px solid #cbd5e1;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="school-name">Staatliche Regelschule „Geschwister Scholl“ Kahla</div>
                <div class="title">${activeScreen.title}</div>
                <div class="meta">Datum: ${new Date().toLocaleDateString('de-DE')} • Lehrkraft: ${currentUser?.name || 'Fachlehrer'}</div>
              </div>
              <img src="/Siegel_bunt.png" class="crest" alt="Siegel" />
            </div>
            <div class="board-box">
              <img src="${snapshotUrl}" class="board-img" alt="Tafelbild" />
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        setIsPrinting(false);
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }, 500);
    } else {
      setIsPrinting(false);
    }
  };

  // Print Mode 2: Print the CLEAN LESSON PROTOCOL / HANDOUT in portrait DIN A4
  const handlePrintProtocol = () => {
    setIsPrinting(true);

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
      const textSections = textWidgets.map((w, idx) => {
        const title = w.title || `Abschnitt ${idx + 1}`;
        const content = w.data?.text || w.data?.noteText || 'Keine Einträge.';
        return `
          <div style="margin-bottom: 14px; padding: 10px; background: #f8fafc; border-left: 3px solid #003366; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 10pt; color: #003366; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 9pt; color: #1e293b; white-space: pre-wrap; line-height: 1.5;">${content}</div>
          </div>
        `;
      }).join('');

      const mediaSections = (videoWidgets.length > 0 || linkWidgets.length > 0) ? `
        <div style="margin-top: 16px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
            Unterrichtsmaterialien & Links:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 8.5pt; color: #334155;">
            ${videoWidgets.map((v) => `<li>Video: <b>${v.title || 'YouTube-Video'}</b></li>`).join('')}
            ${linkWidgets.map((l) => `<li>Link: <b>${l.title || 'Web-Ressource'}</b></li>`).join('')}
          </ul>
        </div>
      ` : '';

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tafelprotokoll - ${activeScreen.title}</title>
            <style>
              @page {
                size: portrait;
                margin: 12mm;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: white;
                color: #0f172a;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #003366;
                padding-bottom: 8px;
                margin-bottom: 16px;
              }
              .school-name {
                font-size: 9pt;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #003366;
              }
              .title {
                font-size: 16pt;
                font-weight: 900;
                margin: 2px 0;
                color: #0f172a;
              }
              .meta {
                font-size: 9pt;
                color: #64748b;
              }
              .crest {
                height: 48px;
                width: auto;
              }
              .footer {
                margin-top: 24px;
                padding-top: 8px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 7.5pt;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="school-name">Staatliche Regelschule „Geschwister Scholl“ Kahla</div>
                <div class="title">Stundenprotokoll: ${activeScreen.title}</div>
                <div class="meta">Datum: ${new Date().toLocaleDateString('de-DE')} • Lehrkraft: ${currentUser?.name || 'Fachlehrer'}</div>
              </div>
              <img src="/Siegel_bunt.png" class="crest" alt="Siegel" />
            </div>

            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
              Tafelanschriften & Aufgaben:
            </div>

            ${textSections || '<p style="font-size: 9pt; color: #94a3b8; font-style: italic;">Keine Textfelder auf dieser Tafel hinterlegt.</p>'}
            ${mediaSections}

            <div class="footer">
              <span>HBS App-Portal • Digitales Klassenzimmer</span>
              <span>Seite 1 / 1</span>
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        setIsPrinting(false);
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }, 500);
    } else {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Tafelbild drucken & teilen
              </h2>
              <p className="text-xs text-slate-500">
                Tafelansicht als PDF drucken, Bild herunterladen oder für Schüler freigeben
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-0 bg-slate-50/30 border-b border-slate-100 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'visual'
                ? 'border-hbs-blue text-hbs-blue bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Tafelbild drucken (Visuell)</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'protocol'
                ? 'border-hbs-blue text-hbs-blue bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tafelprotokoll / Merkblatt</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'share'
                ? 'border-hbs-blue text-hbs-blue bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Schüler-QR & Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-800 space-y-5">
          
          {/* TAB 1: VISUAL BOARD (Snapshot Preview & Print) */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-hbs-blue uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Druckfertiges Tafelbild</span>
                  </span>
                  <p className="text-xs text-slate-600">
                    Druckt die gesamte Tafel mit allen aktiven Widgets, Zeichnungen und Notizen im Querformat DIN A4.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadSnapshot('png')}
                    disabled={!snapshotUrl || isCapturing}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    title="Verlustfreies PNG herunterladen"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>PNG</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSnapshot('jpeg')}
                    disabled={!snapshotUrl || isCapturing}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    title="Kompaktes JPEG herunterladen"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>JPG</span>
                  </button>

                  <button
                    onClick={handlePrintVisualBoard}
                    disabled={!snapshotUrl || isCapturing || isPrinting}
                    className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    title="Als PDF drucken oder speichern"
                  >
                    {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    <span>Als PDF drucken</span>
                  </button>
                </div>
              </div>

              {/* Snapshot Preview Box */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-inner flex flex-col items-center justify-center min-h-[260px] relative">
                {isCapturing ? (
                  <div className="p-8 text-center space-y-2 text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-hbs-blue-light" />
                    <p className="text-xs font-bold text-slate-300">Tafelbild wird hochauflösend erfasst...</p>
                  </div>
                ) : snapshotUrl ? (
                  <img
                    src={snapshotUrl}
                    alt="Tafelbild Vorschau"
                    className="w-full h-auto max-h-[380px] object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tafelbild konnte nicht geladen werden.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROTOCOL / WORKSHEET (Printable text version) */}
          {activeTab === 'protocol' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Stundenmitschrift zum Ausdrucken
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schriftliche Zusammenfassung aller Tafeltexte für Schülermappen oder kranke Schüler.
                  </p>
                </div>

                <button
                  onClick={handlePrintProtocol}
                  disabled={isPrinting}
                  className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Protokoll drucken</span>
                </button>
              </div>

              {/* Printable Document Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
                {/* School Header */}
                <div className="border-b-2 border-hbs-blue pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-hbs-blue tracking-wider block">
                      {PORTAL_CONFIG.schoolName}
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Stundenprotokoll: {activeScreen.title}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Datum: {new Date().toLocaleDateString('de-DE')} • Lehrkraft: {currentUser?.name || 'Fachlehrer'}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border">
                    <img src="/Siegel_bunt.png" alt="Wappen" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Active Tafeltexte */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                    Tafeltexte & Aufgaben ({textWidgets.length}):
                  </span>
                  {textWidgets.length > 0 ? (
                    <div className="space-y-2">
                      {textWidgets.map((w, idx) => (
                        <div key={w.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800 block mb-1">
                            {w.title || `Abschnitt ${idx + 1}`}
                          </span>
                          <p className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                            {w.data?.text || w.data?.noteText || 'Kein Textinhalt hinterlegt.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Keine Textfelder auf dieser Tafel aktiv.</p>
                  )}
                </div>

                {/* Active Videos / Links */}
                {(videoWidgets.length > 0 || linkWidgets.length > 0) && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                      Unterrichtsmedien & Links:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {videoWidgets.map((w) => (
                        <div key={w.id} className="p-2.5 rounded-xl bg-red-50 text-red-900 border border-red-200 flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="truncate font-bold">{w.title || 'YouTube-Video'}</span>
                        </div>
                      ))}
                      {linkWidgets.map((w) => (
                        <div key={w.id} className="p-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate font-bold">{w.title || 'Web-Link'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT QR & SHARING */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-hbs-blue-soft via-sky-50 to-emerald-50 border border-hbs-blue/20 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                  <QRCodeSVG value={shareUrl} size={130} level="M" />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span className="text-xs font-black text-hbs-blue uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                    <Smartphone className="w-4 h-4 text-hbs-blue" />
                    <span>Schüler-QR für Handys & iPads</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Schülerinnen und Schüler scannen diesen Code am Stundenende direkt von der Tafel ab. Das Tafelbild, die Hausaufgaben und alle Weblinks öffnen sich direkt ohne Passwortabfrage auf ihren Smartphones oder Tablets.
                  </p>
                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                      <span>{copied ? 'Link kopiert!' : 'Freigabe-Link kopieren'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block">Live im Klassenzimmer geteilt</span>
                  Änderungen am Tafelbild werden automatisch aktualisiert, wenn du den Export öffnest.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Tipp: Das ausgedruckte Querformat-Tafelbild eignet sich ideal für Fehlzeiten-Ordner.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Schließen
            </button>
            {activeTab === 'visual' && (
              <button
                onClick={handlePrintVisualBoard}
                disabled={!snapshotUrl || isCapturing || isPrinting}
                className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Tafelbild drucken</span>
              </button>
            )}
            {activeTab === 'protocol' && (
              <button
                onClick={handlePrintProtocol}
                disabled={isPrinting}
                className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Protokoll drucken</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
