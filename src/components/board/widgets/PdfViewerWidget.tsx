import React, { useState } from 'react';
import { FileText, Upload } from 'lucide-react';

export const PdfViewerWidget: React.FC = () => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Arbeitsblatt.pdf');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPdfDataUrl(url);
    }
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black truncate max-w-[200px]">
          <FileText className="w-4 h-4 text-red-600 shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>

        <label className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-hbs-blue border border-white cursor-pointer shadow-2xs flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" />
          <span>PDF laden</span>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 border border-white shadow-inner flex items-center justify-center min-h-[220px]">
        {pdfDataUrl ? (
          <object
            data={pdfDataUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="p-4 text-center text-xs text-hbs-slate-muted">
              <p className="font-bold">PDF wird geladen...</p>
              <a href={pdfDataUrl} target="_blank" rel="noreferrer" className="text-hbs-blue underline mt-1 block">
                In neuem Tab öffnen
              </a>
            </div>
          </object>
        ) : (
          <div className="p-6 text-center text-hbs-slate-muted flex flex-col items-center">
            <FileText className="w-10 h-10 mb-2 opacity-40 text-red-500" />
            <p className="text-xs font-bold">Kein PDF ausgewählt</p>
            <p className="text-[10px] mt-0.5 max-w-[200px]">
              Klicke oben auf "PDF laden", um ein Arbeitsblatt oder eine Klassenarbeit an die Tafel zu werfen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
