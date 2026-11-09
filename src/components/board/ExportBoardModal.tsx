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
  Sparkles,
  Cloud,
  FolderCheck,
  RefreshCw,
  Layers,
  GraduationCap,
  BookOpen,
  Calendar
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { BoardScreen } from './types';
import { PORTAL_CONFIG } from '../../config/apps';
import { useAuth } from '../../context/AuthContext';
import { db, PORTAL_COLLECTION } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { uploadFileToR2, getR2DownloadUrl } from '../../services/r2StorageService';
import { getCachedFolders, createStorageFolder, addStorageFileRecord } from '../../services/storageFirestoreService';

interface ExportBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: BoardScreen;
  screens?: BoardScreen[];
  activeScreenIndex?: number;
}

const SCHOOL_SUBJECTS = [
  'Mathematik',
  'Deutsch',
  'Englisch',
  'Physik',
  'Biologie',
  'Chemie',
  'Geschichte',
  'Geografie',
  'Ethik / Religion',
  'Kunst',
  'Musik',
  'Sport',
  'Wirtschaft / Recht',
  'Sonstiges'
];

const GRADE_LEVELS = [
  'Klasse 5a',
  'Klasse 5b',
  'Klasse 6a',
  'Klasse 6b',
  'Klasse 7a',
  'Klasse 7b',
  'Klasse 8a',
  'Klasse 8b',
  'Klasse 9a',
  'Klasse 9b',
  'Klasse 10a',
  'Klasse 10b',
  'Stufenübergreifend'
];

export const ExportBoardModal: React.FC<ExportBoardModalProps> = ({
  isOpen,
  onClose,
  activeScreen,
  screens = [activeScreen],
  activeScreenIndex = 0
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'visual' | 'protocol' | 'share'>('visual');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Metadata State
  const [title, setTitle] = useState(activeScreen.title || 'Tafelbild');
  const [subject, setSubject] = useState<string>('Mathematik');
  const [grade, setGrade] = useState<string>('Klasse 7b');
  const [dateStr, setDateStr] = useState<string>(new Date().toLocaleDateString('de-DE'));
  const [timeStr, setTimeStr] = useState<string>(
    new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  );

  // Multi-screen export scope: 'current' (aktuelle Tafel) oder 'all' (alle Tafelseiten)
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');

  // Cloudflare R2 Upload status
  const [r2Status, setR2Status] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [r2Message, setR2Message] = useState<string>('');
  const [sharedR2Url, setSharedR2Url] = useState<string | null>(null);

  // Sync title when active screen title changes
  useEffect(() => {
    if (activeScreen?.title) {
      setTitle(activeScreen.title);
    }
  }, [activeScreen?.title]);

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

  // Board Snapshot Capture (Runs strictly ONCE when modal is opened, preventing print dialog loop)
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSnapshotUrl(dataUrl);

      // Local quick sync for instant student view
      syncBoardForStudents(dataUrl);
    } catch (err) {
      console.warn('Fehler bei der Snapshot-Erstellung des Tafelbildes:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSnapshotUrl(null);
      setR2Status('idle');
      return;
    }
    const timeout = setTimeout(captureBoard, 150);
    return () => clearTimeout(timeout);
  }, [isOpen]);

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
      title,
      subject,
      grade,
      teacherName: currentUser?.name || 'Fachlehrer',
      targetDate: `${dateStr} • ${timeStr} Uhr`,
      notes: notesList,
      tasks: tasksList,
      mediaLinks: mediaList,
      snapshotUrl: imgUrl,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem('hbs_live_shared_board', JSON.stringify(sharedPayload));
      if (db) {
        // Firestore 1MB safety guard: only store image string if it is a compact URL (< 500KB)
        const isUrlOrSmall = imgUrl.startsWith('http') || imgUrl.length < 500000;
        const firestorePayload = isUrlOrSmall
          ? sharedPayload
          : { ...sharedPayload, snapshotUrl: '' };

        const portalDocRef = doc(db, PORTAL_COLLECTION, 'shared_board');
        await setDoc(portalDocRef, {
          sharedBoard: firestorePayload
        }, { merge: true });

        const schoolDocRef = doc(db, 'schools', 'HBS_portal');
        await setDoc(schoolDocRef, {
          sharedBoard: firestorePayload
        }, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Fehler beim Publizieren des Schüler-Tafelbildes:', e);
    }
  };

  // Upload Snapshot to Cloudflare R2 and save in Teacher's "Tafelbilder" folder
  const handleSaveToR2AndShare = async () => {
    if (!snapshotUrl) return;
    setR2Status('uploading');
    setR2Message('Wird vorbereitet und zu Cloudflare R2 hochgeladen...');

    try {
      // 1. Fetch blob from snapshotUrl
      const blobRes = await fetch(snapshotUrl);
      const blob = await blobRes.blob();

      // 2. Prepare file & target R2 key
      const teacherId = currentUser?.id || 'kollegium';
      const cleanTitle = (title || 'Tafelbild').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
      const cleanGrade = grade.replace(/\s+/g, '_');
      const filename = `Tafelbild_${cleanGrade}_${subject}_${cleanTitle}_${dateStr.replace(/\./g, '-')}.jpg`;
      const r2Key = `tafelbilder/${teacherId}/${Date.now()}_${filename}`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // 3. Upload to Cloudflare R2
      await uploadFileToR2(file, r2Key);
      const publicDownloadUrl = await getR2DownloadUrl(r2Key);
      setSharedR2Url(publicDownloadUrl);

      // 4. Ensure teacher's "Tafelbilder" folder exists in personal storage
      if (currentUser?.id) {
        const folders = getCachedFolders();
        let tafelbilderFolder = folders.find(
          (f) => !f.isShared && f.ownerId === currentUser.id && f.name.toLowerCase() === 'tafelbilder'
        );

        if (!tafelbilderFolder) {
          tafelbilderFolder = await createStorageFolder({
            name: 'Tafelbilder',
            parentId: null,
            isShared: false,
            ownerId: currentUser.id,
            ownerName: currentUser.name || 'Fachlehrer',
            color: 'teal',
            subject
          });
        }

        // 5. Register in hbs_storage_files
        await addStorageFileRecord({
          name: filename,
          folderId: tafelbilderFolder.id,
          isShared: false,
          ownerId: currentUser.id,
          ownerName: currentUser.name || 'Fachlehrer',
          r2Key,
          fileSize: blob.size,
          mimeType: 'image/jpeg',
          fileExtension: 'jpg',
          subject,
          grade,
          description: `Tafelbild "${title}" vom ${dateStr} um ${timeStr} Uhr für ${grade} (${subject})`,
          tags: ['Tafelbild', subject, grade]
        });
      }

      // 6. Update Firestore with compact R2 URL (< 150 bytes, completely solves 1MB limit!)
      await syncBoardForStudents(publicDownloadUrl);

      setR2Status('success');
      setR2Message('Erfolgreich in Cloudflare R2 im Ordner "Tafelbilder" gesichert und für Schüler freigegeben!');
    } catch (err: any) {
      console.warn('R2 Upload & Share Fehler:', err);
      // Fallback
      await syncBoardForStudents(snapshotUrl);
      setR2Status('error');
      setR2Message(err?.message || 'Fehler beim Upload zu Cloudflare R2. Lokale Freigabe bleibt aktiv.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download JPG snapshot (Single Screen or Multi-Screens)
  const handleDownloadSnapshot = (format: 'png' | 'jpeg' = 'jpeg') => {
    if (!snapshotUrl) return;
    const cleanTitle = (title || 'Tafelbild').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
    const cleanGrade = grade.replace(/\s+/g, '_');

    if (exportScope === 'all' && screens.length > 1) {
      // Download current screen with page index
      const filename = `Tafelbild_HBS_Seite_${activeScreenIndex + 1}_${cleanGrade}_${subject}_${cleanTitle}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      const a = document.createElement('a');
      a.href = snapshotUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const filename = `Tafelbild_HBS_${cleanGrade}_${subject}_${cleanTitle}_${dateStr.replace(/\./g, '-')}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print Mode 1: Print the VISUAL BOARD snapshot in landscape DIN A4 (Single or Multi-Page)
  const handlePrintVisualBoard = () => {
    if (!snapshotUrl || isPrinting) return;
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
    if (!frameDoc) {
      setIsPrinting(false);
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tafelbild - ${title} (${grade})</title>
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
              margin-bottom: 8px;
            }
            .school-name {
              font-size: 8pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #003366;
            }
            .title {
              font-size: 13pt;
              font-weight: 900;
              margin: 2px 0;
              color: #0f172a;
            }
            .meta {
              font-size: 8pt;
              color: #64748b;
            }
            .crest {
              height: 38px;
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
              max-height: calc(100vh - 85px);
              object-fit: contain;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="school-name">Staatliche Regelschule Heimbürgeschule Kahla</div>
              <div class="title">${title} • ${grade} (${subject})</div>
              <div class="meta">Datum & Uhrzeit: ${dateStr} um ${timeStr} Uhr • Lehrkraft: ${currentUser?.name || 'Fachlehrer'}${screens.length > 1 ? ` • Tafel ${activeScreenIndex + 1} von ${screens.length}` : ''}</div>
            </div>
            <img src="/Siegel_bunt.png" class="crest" alt="Siegel" />
          </div>
          <div class="board-box">
            <img id="print-board-img" src="${snapshotUrl}" class="board-img" alt="Tafelbild" />
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    const doPrint = () => {
      setIsPrinting(false);
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Drucken abgebrochen oder fehlgeschlagen:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }
    };

    const imgEl = frameDoc.getElementById('print-board-img') as HTMLImageElement | null;
    if (imgEl && !imgEl.complete) {
      imgEl.onload = () => setTimeout(doPrint, 250);
      imgEl.onerror = () => doPrint();
    } else {
      setTimeout(doPrint, 350);
    }
  };

  // Print Mode 2: Print the CLEAN LESSON PROTOCOL in portrait DIN A4
  const handlePrintProtocol = () => {
    if (isPrinting) return;
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
    if (!frameDoc) {
      setIsPrinting(false);
      return;
    }

    const textSections = textWidgets.map((w, idx) => {
      const wTitle = w.title || `Abschnitt ${idx + 1}`;
      const content = w.data?.text || w.data?.noteText || 'Keine Einträge.';
      return `
        <div style="margin-bottom: 14px; padding: 10px; background: #f8fafc; border-left: 3px solid #003366; border-radius: 4px;">
          <div style="font-weight: bold; font-size: 10pt; color: #003366; margin-bottom: 4px;">${wTitle}</div>
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
          <title>Tafelprotokoll - ${title}</title>
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
              <div class="school-name">Staatliche Regelschule Heimbürgeschule Kahla</div>
              <div class="title">Stundenprotokoll: ${title}</div>
              <div class="meta">Klasse: ${grade} • Fach: ${subject} • Datum: ${dateStr} um ${timeStr} Uhr • Lehrkraft: ${currentUser?.name || 'Fachlehrer'}</div>
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
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Drucken fehlgeschlagen:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }
    }, 500);
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
                Tafelbild drucken, speichern & teilen
              </h2>
              <p className="text-xs text-slate-500">
                Cloudflare R2 Speicher, PDF-Druck im Querformat und Schüler-Freigabelink
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-0 bg-slate-50/30 border-b border-slate-100 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'visual'
                ? 'border-hbs-blue text-hbs-blue bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Tafelbild drucken & exportieren</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'share'
                ? 'border-hbs-blue text-hbs-blue bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Schüler-QR & Cloud-Speicher</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-800 space-y-5">
          
          {/* Metadata Section: Klasse, Fach, Titel, Datum & Uhrzeit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5 text-hbs-blue" />
                <span>Thema / Titel</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thema der Stunde..."
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-hbs-teal-deep" />
                <span>Klasse</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-hbs-blue/30 cursor-pointer"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fach</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-hbs-blue/30 cursor-pointer"
              >
                {SCHOOL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Datum & Uhrzeit</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] font-bold text-slate-800"
                />
                <input
                  type="text"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* TAB 1: VISUAL BOARD (Snapshot Preview & Print) */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-hbs-blue uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Druckfertiges Tafelbild (Querformat DIN A4)</span>
                  </span>
                  <p className="text-xs text-slate-600">
                    Erfasst die Tafel inklusive aller Werkzeuge, Notizen und Freihand-Zeichnungen.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Refresh snapshot button */}
                  <button
                    onClick={captureBoard}
                    disabled={isCapturing}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Tafelansicht neu erfassen"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleDownloadSnapshot('jpeg')}
                    disabled={!snapshotUrl || isCapturing}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Als JPG-Bild herunterladen"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>JPG Export</span>
                  </button>

                  <button
                    onClick={handlePrintVisualBoard}
                    disabled={!snapshotUrl || isCapturing || isPrinting}
                    className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Zuverlässig als Querformat-PDF drucken"
                  >
                    {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    <span>Als PDF drucken</span>
                  </button>
                </div>
              </div>

              {/* Multi-Screen Selector (If more than 1 screen exists) */}
              {screens.length > 1 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-bold text-amber-900">
                      Du hast {screens.length} Tafelseiten angelegt (Aktuell: Seite {activeScreenIndex + 1})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-amber-300">
                    <button
                      onClick={() => setExportScope('current')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        exportScope === 'current'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aktuelle Tafel
                    </button>
                    <button
                      onClick={() => setExportScope('all')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        exportScope === 'all'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Alle {screens.length} Tafeln
                    </button>
                  </div>
                </div>
              )}

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
                    Tafelbild wird geladen...
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
                    Stundenmitschrift zum Ausdrucken (Hochformat DIN A4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schriftliche Zusammenfassung aller Tafeltexte für Schülerhefter oder kranke Schüler.
                  </p>
                </div>

                <button
                  onClick={handlePrintProtocol}
                  disabled={isPrinting}
                  className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Protokoll drucken</span>
                </button>
              </div>

              {/* Printable Document Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
                <div className="border-b-2 border-hbs-blue pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-hbs-blue tracking-wider block">
                      {PORTAL_CONFIG.schoolName}
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Stundenprotokoll: {title}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Klasse: {grade} • Fach: {subject} • Datum: {dateStr} • Lehrkraft: {currentUser?.name || 'Fachlehrer'}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border">
                    <img src="/Siegel_bunt.png" alt="Wappen" className="w-full h-full object-contain" />
                  </div>
                </div>

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

          {/* TAB 3: STUDENT QR & CLOUDFLARE R2 SHARING */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              {/* Cloudflare R2 Cloud Storage Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-hbs-teal-deep" />
                    <span className="text-xs font-black text-hbs-teal-deep uppercase tracking-wider">
                      Cloudflare R2 Schul-Speicher
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-lg">
                    Sichere dieses Tafelbild direkt in deinem persönlichen Ordner <b className="text-hbs-teal-deep">"Tafelbilder"</b>. Dadurch erhalten Schülerinnen und Schüler das Tafelbild in voller Auflösung ohne Firestore-Limit.
                  </p>
                  {r2Message && (
                    <div className={`text-xs font-bold mt-1.5 flex flex-col gap-1 ${
                      r2Status === 'success' ? 'text-emerald-700' : r2Status === 'error' ? 'text-red-600' : 'text-sky-700'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {r2Status === 'success' && <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {r2Status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />}
                        <span>{r2Message}</span>
                      </div>
                      {sharedR2Url && (
                        <a
                          href={sharedR2Url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-hbs-teal-deep hover:underline text-[11px] font-bold block ml-5"
                        >
                          Tafelbild in R2 öffnen ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveToR2AndShare}
                  disabled={!snapshotUrl || r2Status === 'uploading'}
                  className="px-4 py-2.5 rounded-xl bg-hbs-teal-deep hover:bg-hbs-teal-light text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {r2Status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>In Mein Speicher ablegen & freigeben</span>
                </button>
              </div>

              {/* Student QR & Link Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-hbs-blue-soft via-sky-50 to-slate-50 border border-hbs-blue/20 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                  <QRCodeSVG value={shareUrl} size={135} level="M" />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span className="text-xs font-black text-hbs-blue uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                    <Smartphone className="w-4 h-4 text-hbs-blue" />
                    <span>Schüler-QR für Handys & iPads</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Schüler scannen diesen QR-Code am Stundenende direkt von der Tafel ab. Das Tafelbild ({grade} • {subject}), alle Hausaufgaben und Links öffnen sich sofort und ohne Login auf ihren Geräten.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                      <span>{copied ? 'Link kopiert!' : 'Freigabe-Link kopieren'}</span>
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-bold text-hbs-blue border border-slate-200 transition-all cursor-pointer"
                    >
                      Schüleransicht testen ↗
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block">Live im Klassenzimmer aktiv</span>
                  Freigabe gilt für Klasse <b className="text-hbs-blue">{grade}</b> im Fach <b className="text-hbs-blue">{subject}</b> am {dateStr} um {timeStr} Uhr.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Tipp: Das Querformat-Tafelbild eignet sich ideal für Klassenordner und Fehlzeiten-Unterlagen.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Schließen
            </button>
            {activeTab === 'visual' && (
              <button
                onClick={handlePrintVisualBoard}
                disabled={!snapshotUrl || isCapturing || isPrinting}
                className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Tafelbild drucken</span>
              </button>
            )}
            {activeTab === 'protocol' && (
              <button
                onClick={handlePrintProtocol}
                disabled={isPrinting}
                className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
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
