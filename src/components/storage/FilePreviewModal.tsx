import React from 'react';
import { X, Download, FileText, Sparkles, Presentation } from 'lucide-react';
import { StorageFile } from '../../types/storageTypes';
import { formatFileSize, formatDate } from '../../utils/fileUtils';

interface FilePreviewModalProps {
  file: StorageFile | null;
  downloadUrl: string | null;
  isLoadingUrl: boolean;
  onClose: () => void;
  onOpenInKahoot?: (file: StorageFile, url: string) => void;
  onOpenInBoard?: (file: StorageFile, url: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  downloadUrl,
  isLoadingUrl,
  onClose,
  onOpenInKahoot,
  onOpenInBoard
}) => {
  if (!file) return null;

  const ext = file.fileExtension.toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext);
  const isAudio = ['mp3', 'm4a', 'wav'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl h-[88vh] max-h-[850px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-hbs-blue text-white flex items-center justify-center shrink-0 font-bold text-xs uppercase shadow-xs">
              {ext || 'FILE'}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-hbs-slate-dark truncate">
                {file.name}
              </h3>
              <p className="text-xs text-hbs-slate-muted truncate">
                {formatFileSize(file.fileSize)} • Hochgeladen von {file.ownerName} am {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 shrink-0">
            {downloadUrl && onOpenInKahoot && (
              <button
                onClick={() => onOpenInKahoot(file, downloadUrl)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                title="Aus diesem Dokument automatisch ein Kahoot-Quiz erstellen"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kahoot-Quiz</span>
              </button>
            )}

            {downloadUrl && onOpenInBoard && (isPdf || isImage) && (
              <button
                onClick={() => onOpenInBoard(file, downloadUrl)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                title="Auf der Digitalen Schultafel öffnen"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Auf Tafel</span>
              </button>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={file.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold transition-all active:scale-95"
                title="Datei herunterladen"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all active:scale-95"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {isLoadingUrl ? (
            <div className="text-center p-8">
              <div className="w-10 h-10 border-4 border-hbs-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-hbs-slate-dark">Sichere Verbindung zu Cloudflare R2 wird hergestellt...</p>
            </div>
          ) : !downloadUrl ? (
            <div className="text-center p-8 text-rose-600">
              <p className="font-bold">Vorschau konnte nicht geladen werden.</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${downloadUrl}#toolbar=1`}
              className="w-full h-full border-none"
              title={file.name}
            />
          ) : isImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              <img
                src={downloadUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-xl shadow-md"
              />
            </div>
          ) : isAudio ? (
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-slate-200 max-w-md w-full mx-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-hbs-slate-dark mb-1">{file.name}</h4>
              <p className="text-xs text-hbs-slate-muted mb-4">{formatFileSize(file.fileSize)}</p>
              <audio controls className="w-full" src={downloadUrl}>
                Ihr Browser unterstützt das Audio-Element nicht.
              </audio>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-slate-200 max-w-md w-full mx-4">
              <div className="w-16 h-16 rounded-2xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-hbs-slate-dark mb-1">{file.name}</h4>
              <p className="text-xs text-hbs-slate-muted mb-4">
                Für das Dateiformat <b>.{ext.toUpperCase()}</b> steht keine Inline-Vorschau zur Verfügung.
              </p>
              <a
                href={downloadUrl}
                download={file.name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-hbs-blue text-white font-bold text-sm shadow-md hover:bg-hbs-blue-deep transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Datei jetzt herunterladen</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
