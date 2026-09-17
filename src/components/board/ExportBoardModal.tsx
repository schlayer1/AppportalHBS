import React from 'react';
import { 
  X, 
  Printer, 
  Smartphone, 
  Share2, 
  Check, 
  Youtube, 
  FileText 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BoardScreen } from './types';
import { PORTAL_CONFIG } from '../../config/apps';
import { useAuth } from '../../context/AuthContext';

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
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Extract texts, notes, and links from active widgets
  const textWidgets = activeScreen.widgets.filter(w => w.type === 'text');
  const videoWidgets = activeScreen.widgets.filter(w => w.type === 'video');
  const linkWidgets = activeScreen.widgets.filter(w => w.type === 'hyperlink' || w.type === 'embed');

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?boardShare=${encodeURIComponent(activeScreen.title)}`
    : 'https://appportalhbs.vercel.app';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Tafelbild exportieren & für Schüler teilen
              </h2>
              <p className="text-xs text-slate-500">
                Stundenmitschrift, Hausaufgaben & Links zum Mitnehmen
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Top QR Code Banner for Students / Parents */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-hbs-blue-soft via-sky-50 to-emerald-50 border border-hbs-blue/20 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
              <QRCodeSVG value={shareUrl} size={110} level="M" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <span className="text-xs font-black text-hbs-blue uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Smartphone className="w-4 h-4 text-hbs-blue" />
                <span>Schüler-QR: Tafelbild auf Handys & iPads</span>
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Schülerinnen und Schüler können den QR-Code am Stundenende von der Tafel scannen, um die Tafelanschriften und Hausaufgaben direkt ins Heft zu übernehmen.
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopiert!' : 'Link kopieren'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Document Summary Preview */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4 print:border-none print:shadow-none">
            {/* School Header */}
            <div className="border-b-2 border-hbs-blue pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-hbs-blue tracking-wider block">
                  {PORTAL_CONFIG.schoolName}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Tafelbild: {activeScreen.title}
                </h3>
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
                Tafeltexte & Notizen ({textWidgets.length}):
              </span>
              {textWidgets.length > 0 ? (
                <div className="space-y-2">
                  {textWidgets.map((w, idx) => (
                    <div key={w.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        Abschnitt {idx + 1}: {w.title}
                      </span>
                      <p className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
                        {w.data?.text || 'Kein Textinhalt.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Keine Textfelder auf dieser Tafel.</p>
              )}
            </div>

            {/* Active Videos / Links */}
            {(videoWidgets.length > 0 || linkWidgets.length > 0) && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  Unterrichtsmedien & Links:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {videoWidgets.map(w => (
                    <div key={w.id} className="p-2 rounded-lg bg-red-50 text-red-900 border border-red-200 flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="truncate font-bold">{w.title || 'YouTube-Video'}</span>
                    </div>
                  ))}
                  {linkWidgets.map(w => (
                    <div key={w.id} className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate font-bold">{w.title || 'Web-Link'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Tipp: Druckansicht eignet sich ideal zum Einkleben ins Hausaufgabenheft.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Schließen
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Als PDF drucken</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
