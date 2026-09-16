import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

export const QrCodeWidget: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://regelschule-kahla.de');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(urlInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-between p-1 text-hbs-slate-dark select-none h-full">
      {/* URL Input Bar */}
      <div className="w-full flex items-center gap-1.5 pb-2 mb-2 border-b border-white/40">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Web-Link oder Text eingeben..."
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white/80 border border-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-hbs-blue/20 truncate"
        />
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-white/70 hover:bg-white text-hbs-blue border border-white/80 shadow-2xs transition-all active:scale-95 shrink-0"
          title="Link kopieren"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* QR Code Card */}
      <div className="my-auto p-3 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center">
        <QRCodeSVG
          value={urlInput || 'https://regelschule-kahla.de'}
          size={160}
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-2 text-center w-full">
        <span className="text-[10px] font-bold text-hbs-slate-muted block truncate">
          Schüler scannen mit Kamera oder iPad
        </span>
      </div>
    </div>
  );
};
