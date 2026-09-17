import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TableTentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TargetPreset = 'portal' | 'menti' | 'kahoot' | 'oncoo' | 'tafel' | 'custom';

export const TableTentGeneratorModal: React.FC<TableTentGeneratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://portal.schule.de';

  const [preset, setPreset] = useState<TargetPreset>('portal');
  const [pinCode, setPinCode] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('Appportal Heimbürgeschule');
  const [subtitle, setSubtitle] = useState<string>('Direktzugang für den Unterricht');
  const [tableNumber, setTableNumber] = useState<string>('Tisch 1');
  const [showTableField, setShowTableField] = useState<boolean>(true);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute final destination URL based on preset & PIN
  let finalUrl = baseUrl;
  if (preset === 'portal') {
    finalUrl = baseUrl;
  } else if (preset === 'menti') {
    finalUrl = pinCode.trim() ? `${baseUrl}?menti=${pinCode.trim()}` : `${baseUrl}#menti`;
  } else if (preset === 'kahoot') {
    finalUrl = pinCode.trim() ? `${baseUrl}?kahoot=${pinCode.trim()}` : `${baseUrl}#kahoot`;
  } else if (preset === 'oncoo') {
    finalUrl = pinCode.trim() ? `${baseUrl}?oncoo=${pinCode.trim()}` : `${baseUrl}#oncoo`;
  } else if (preset === 'tafel') {
    finalUrl = `${baseUrl}?board=guest`;
  } else if (preset === 'custom') {
    finalUrl = customUrl.trim() || baseUrl;
  }

  const handleSelectPreset = (p: TargetPreset) => {
    setPreset(p);
    if (p === 'portal') {
      setTitle('Appportal Heimbürgeschule');
      setSubtitle('Alle Unterrichts-Apps mit einem Scan');
    } else if (p === 'menti') {
      setTitle('HBS Menti Live-Abstimmung');
      setSubtitle('Direkte Teilnahme ohne Login');
    } else if (p === 'kahoot') {
      setTitle('HBS Kahoot! Quiz-Arena');
      setSubtitle('Spiele mit Smartphone oder Tablet mit');
    } else if (p === 'oncoo') {
      setTitle('HBS Oncoo Lerntools');
      setSubtitle('Kartenabfrage, Zielscheibe & Lerntempoduett');
    } else if (p === 'tafel') {
      setTitle('Digitale Tafel • Schüleransicht');
      setSubtitle('Tafelbild live auf deinem Gerät ansehen');
    } else if (p === 'custom') {
      setTitle('Unterrichtsmaterial & Webtool');
      setSubtitle('Kamera öffnen und QR-Code scannen');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #table-tent-print-sheet, #table-tent-print-sheet * {
            visibility: visible;
          }
          #table-tent-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 8mm 12mm;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .fold-line {
            border-top: 1.5px dashed #64748b !important;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-5xl max-h-[94vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 border border-slate-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header toolbar */}
        <header className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>QR-Code Tischaufsteller-Generator</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-300 font-bold">
                  A4 Falt-Prisma
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Erstelle beidseitige Dreiecks-Aufsteller für Schülertische im Klassenzimmer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-black text-xs shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Jetzt Drucken (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Configuration Bar */}
        <div className="p-4 sm:px-6 bg-slate-100 border-b border-slate-200 space-y-3 no-print text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-slate-500 uppercase tracking-wider text-[10px] w-full sm:w-auto">
              Ziel der QR-Codes:
            </span>

            {[
              { id: 'portal', label: 'Gesamtes Appportal' },
              { id: 'menti', label: 'HBS Menti Live' },
              { id: 'kahoot', label: 'HBS Kahoot!' },
              { id: 'oncoo', label: 'HBS Oncoo' },
              { id: 'tafel', label: 'Digitale Tafel' },
              { id: 'custom', label: 'Eigener Link' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPreset(item.id as TargetPreset)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  preset === item.id 
                    ? 'bg-teal-700 text-white shadow-xs' 
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(preset === 'menti' || preset === 'kahoot' || preset === 'oncoo') && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Optionaler Sitzungs-PIN:
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  placeholder="z. B. 482 109"
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-xs"
                />
              </div>
            )}

            {preset === 'custom' && (
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Webadresse / URL:
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://meine-seite.de"
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Aufsteller-Titel:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-slate-300 font-bold text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Untertitel / Zweck:
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-slate-300 font-medium text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Tisch-Beschriftung:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  disabled={!showTableField}
                  placeholder="z. B. Tisch 3"
                  className="flex-1 p-2 rounded-xl bg-white border border-slate-300 font-bold text-xs disabled:opacity-40"
                />
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={showTableField}
                    onChange={e => setShowTableField(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Aktiv</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Canvas (A4 Landscape Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex justify-center">
          <div 
            id="table-tent-print-sheet" 
            className="w-full max-w-[210mm] bg-white p-6 sm:p-8 shadow-xl border border-slate-300 font-sans text-slate-900 flex flex-col justify-between"
            style={{ minHeight: '290mm' }}
          >

            {/* ================= PANEL 1: RÜCKSEITE (180° KOPFÜBER FÜR GEGENÜBERLIEGENDE SCHÜLER) ================= */}
            <div className="rotate-180 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between flex-1 mb-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <img 
                    src="/Siegel_schwarz.png" 
                    alt="HBS" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/Siegel_bunt.png';
                    }}
                  />
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Staatliche Regelschule Heimbürgeschule Kahla
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      {title}
                    </div>
                    {subtitle && (
                      <div className="text-[9px] font-semibold text-slate-600">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {showTableField && (
                  <div className="px-3 py-1 rounded-lg border-2 border-slate-900 text-xs font-black">
                    {tableNumber || 'Tisch'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-around gap-4 py-3">
                {/* QR Code */}
                <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs shrink-0">
                  <QRCodeSVG
                    value={finalUrl}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                {/* 3-Step Instruction */}
                <div className="space-y-1.5 text-[11px] font-bold text-slate-700 flex-1 max-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>Kamera am Handy öffnen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>QR-Code fokussieren</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                    <span>Link antippen & mitmachen</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-200">
                    🔒 Ohne Passwort • 100 % DSGVO-konform
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 text-center uppercase tracking-wider font-bold">
                Seite B • Heimbürgeschule Kahla
              </div>
            </div>

            {/* ================= FALT-TRENNLINIE 1 ================= */}
            <div className="fold-line py-1 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono select-none my-1">
              <span>✂ - - - - - - - - - - - - - - HIER NACH INNEN FALTEN (FALZLINIE) - - - - - - - - - - - - - - ✂</span>
            </div>

            {/* ================= PANEL 2: VORDERSEITE (NORMAL LESBAR FÜR DIESE TISCHSEITE) ================= */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between flex-1 my-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <img 
                    src="/Siegel_schwarz.png" 
                    alt="HBS" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/Siegel_bunt.png';
                    }}
                  />
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Staatliche Regelschule Heimbürgeschule Kahla
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      {title}
                    </div>
                    {subtitle && (
                      <div className="text-[9px] font-semibold text-slate-600">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {showTableField && (
                  <div className="px-3 py-1 rounded-lg border-2 border-slate-900 text-xs font-black">
                    {tableNumber || 'Tisch'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-around gap-4 py-3">
                {/* QR Code */}
                <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs shrink-0">
                  <QRCodeSVG
                    value={finalUrl}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                {/* 3-Step Instruction */}
                <div className="space-y-1.5 text-[11px] font-bold text-slate-700 flex-1 max-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>Kamera am Handy öffnen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>QR-Code fokussieren</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                    <span>Link antippen & mitmachen</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-200">
                    🔒 Ohne Passwort • 100 % DSGVO-konform
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 text-center uppercase tracking-wider font-bold">
                Seite A • Heimbürgeschule Kahla
              </div>
            </div>

            {/* ================= FALT-TRENNLINIE 2 ================= */}
            <div className="fold-line py-1 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono select-none my-1">
              <span>✂ - - - - - - - - - - - - - - HIER NACH INNEN FALTEN (BODENKLAPPE) - - - - - - - - - - - - - - ✂</span>
            </div>

            {/* ================= PANEL 3: BODEN / KLEBE- & FALT-LASCHE ================= */}
            <div className="border border-dashed border-slate-400 rounded-xl p-3 bg-slate-100/70 text-center space-y-1 my-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 block">
                BODEN-STANDFLÄCHE / KLEBELASCHE
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                Diese Lasche nach innen knicken und mit Seite B zusammenfügen (Klebestift oder Büroklammer).
              </p>
              <div className="text-[9px] text-slate-400 font-mono">
                Ziel-Link: {finalUrl}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
