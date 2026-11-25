import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, FileDown, Printer, RotateCcw, X } from 'lucide-react';
import { RoomLayout } from '../../types/sitzplanTypes';
import { SeatPlanCanvas, exportSeatPlanSvgAsPng } from './SeatPlanCanvas';

interface PrintSitzplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  room: RoomLayout;
  assignment: Record<string, string>;
  students: Array<{ id: string; name: string }>;
  initialTeacherPerspective?: boolean;
}

export const PrintSitzplanModal: React.FC<PrintSitzplanModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  room,
  assignment,
  students,
  initialTeacherPerspective = true,
}) => {
  const [teacherPerspective, setTeacherPerspective] = useState(initialTeacherPerspective);
  const printSvgRef = useRef<SVGSVGElement | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePng = async () => {
    if (!printSvgRef.current) return;
    await exportSeatPlanSvgAsPng(
      printSvgRef.current,
      `${title}_${teacherPerspective ? 'Lehrerblick' : 'Raumblick'}`
    );
  };

  const sheetContent = (
    <div className="bg-white text-hbs-slate-dark p-4 sm:p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/Siegel_bunt.png"
              alt="HBS Siegel"
              className="w-7 h-7 object-contain"
            />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue">
              Heimbürgeschule Kahla · Sitzplan
            </span>
          </div>
          <h2 className="text-xl font-black text-hbs-slate-dark mt-0.5">{title}</h2>
          <p className="text-xs font-medium text-hbs-slate-muted">{subtitle}</p>
        </div>

        <div className="text-right text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-hbs-blue-light px-3 py-1 font-bold text-hbs-blue border border-hbs-blue/20">
            {teacherPerspective
              ? 'Lehrerperspektive (Tafel im Rücken)'
              : 'Schülerperspektive (Tafel oben)'}
          </span>
          <p className="text-[11px] text-hbs-slate-muted mt-1">
            Stand: {new Date().toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>

      <div className="w-full aspect-[10/7] max-h-[62vh] mx-auto border border-slate-200 rounded-xl overflow-hidden bg-white p-2">
        <SeatPlanCanvas
          ref={printSvgRef}
          room={room}
          assignment={assignment}
          students={students}
          interactive={false}
          teacherPerspective={teacherPerspective}
          gridId="hbs-sitzplan-print-grid"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-hbs-slate-muted pt-1">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-grid size-4 place-items-center rounded-full bg-[#1B4D3E] text-[8px] text-white">
              ▲
            </span>
            Nah an der Tafel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-5 h-3 rounded border border-dashed border-slate-400 bg-slate-50" />
            Freier Platz
          </span>
        </div>
        <span>
          {teacherPerspective
            ? 'Blickrichtung: Vom Lehrerpult/der Tafel in den Raum hinein'
            : 'Blickrichtung: Aus dem Raum zur Tafel'}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Interactive Modal (hidden when printing) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-hbs-slate-dark/60 p-3 sm:p-5 backdrop-blur-xs print:hidden"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border border-hbs-slate-border bg-white shadow-hbs-modal overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hbs-slate-border p-4 bg-hbs-bg">
            <div>
              <h3 className="text-base sm:text-lg font-black text-hbs-slate-dark">
                Sitzplan drucken &amp; exportieren
              </h3>
              <p className="text-xs text-hbs-slate-muted">
                Wähle die Blickrichtung für den Ausdruck (Standard: Tafel im Rücken).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-white border border-hbs-slate-border p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTeacherPerspective(true)}
                  className={`min-h-[38px] px-3 rounded-lg flex items-center gap-1.5 transition-colors ${
                    teacherPerspective
                      ? 'bg-hbs-blue text-white'
                      : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Lehrerblick (Tafel im Rücken)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherPerspective(false)}
                  className={`min-h-[38px] px-3 rounded-lg flex items-center gap-1.5 transition-colors ${
                    !teacherPerspective
                      ? 'bg-hbs-blue text-white'
                      : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Raumblick (Tafel oben)</span>
                </button>
              </div>

              <button
                type="button"
                aria-label="Schließen"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-hbs-slate-muted hover:bg-slate-200/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-100/80 p-3 sm:p-5">
            <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {sheetContent}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hbs-slate-border bg-white p-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-hbs-slate-border text-sm font-bold text-hbs-slate hover:bg-slate-50"
            >
              Schließen
            </button>
            <button
              type="button"
              onClick={handlePng}
              className="min-h-[44px] px-4 rounded-xl border border-hbs-blue/30 bg-hbs-blue-light text-hbs-blue text-sm font-bold hover:bg-hbs-blue-soft flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Als Bild (PNG)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] px-5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-sm font-bold flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Drucken / Als PDF speichern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated A4 Print Container rendered at document.body via portal */}
      {createPortal(
        <div id="hbs-sitzplan-print-root" className="hidden print:block printable-document">
          {sheetContent}
        </div>,
        document.body
      )}
    </>
  );
};
