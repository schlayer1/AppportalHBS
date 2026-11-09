import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Palette, 
  Highlighter
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface TextWidgetProps {
  data?: Record<string, any>;
  onUpdateData?: (data: Record<string, any>) => void;
}

const TEXT_COLORS = [
  { name: 'Standard', color: '#0f172a' },
  { name: 'HBS Blau', color: '#003366' },
  { name: 'Korrektur-Rot', color: '#dc2626' },
  { name: 'Smaragd-Grün', color: '#16a34a' },
  { name: 'Lila', color: '#9333ea' },
  { name: 'Orange', color: '#ea580c' }
];

const HIGHLIGHT_COLORS = [
  { name: 'Kein Marker', color: 'transparent' },
  { name: 'Gelb', color: '#fef08a' },
  { name: 'Hellgrün', color: '#bbf7d0' },
  { name: 'Hellblau', color: '#bae6fd' },
  { name: 'Rosa', color: '#fbcfe8' }
];

export const TextWidget: React.FC<TextWidgetProps> = ({ data, onUpdateData }) => {
  const [mode, setMode] = useState<'text' | 'checklist'>(data?.mode || 'text');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge' | 'giant'>(data?.fontSize || 'large');
  
  // Note HTML state (rich text with Word formatting)
  const [noteHtml, setNoteHtml] = useState<string>(
    data?.noteHtml !== undefined
      ? data.noteHtml
      : (data?.noteText !== undefined
          ? data.noteText.replace(/\n/g, '<br/>')
          : '<b>🎯 Stundenziel:</b> Arbeitsblatt S. 42 Aufgaben 1 bis 4 bearbeiten.<br/><br/>📌 <i>Bei Fragen:</i> Zuerst Flüsterpartner fragen!')
  );

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    data?.checklist || [
      { id: '1', text: 'Hausaufgaben vergleichen', done: true },
      { id: '2', text: 'Lehrbuch S. 42 lesen & besprechen', done: false },
      { id: '3', text: 'Stillarbeit: Aufgaben 1-4 im Heft', done: false },
      { id: '4', text: 'Ergebnisse an der Tafel sichern', done: false }
    ]
  );

  const [newTodoInput, setNewTodoInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Sync back to board data
  useEffect(() => {
    if (onUpdateData) {
      const plainText = editorRef.current?.innerText || noteHtml.replace(/<[^>]+>/g, ' ');
      const compiledText = mode === 'text' 
        ? plainText 
        : checklist.map((c) => `${c.done ? '✓' : '○'} ${c.text}`).join('\n');

      onUpdateData({
        mode,
        fontSize,
        noteHtml,
        noteText: plainText,
        checklist,
        text: compiledText
      });
    }
  }, [mode, fontSize, noteHtml, checklist, onUpdateData]);

  // Synchronize initial editor innerHTML safely
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== noteHtml) {
        editorRef.current.innerHTML = noteHtml;
      }
    }
    isInternalChangeRef.current = false;
  }, [noteHtml]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      setNoteHtml(editorRef.current.innerHTML);
    }
  }, []);

  // Word-style formatting execution
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newTodoInput.trim(),
      done: false
    };
    setChecklist([...checklist, newItem]);
    setNewTodoInput('');
  };

  const removeTodo = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const fontSizeClass = {
    normal: 'text-xs sm:text-sm',
    large: 'text-sm sm:text-base',
    huge: 'text-base sm:text-lg',
    giant: 'text-lg sm:text-2xl font-bold'
  }[fontSize];

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between font-sans">
      {/* Top Header Bar & Formatting Toolbar */}
      <div className="flex flex-col gap-1 pb-1.5 mb-1.5 border-b border-white/40 shrink-0">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80">
            <button
              onClick={() => setMode('text')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                mode === 'text' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted hover:bg-white'
              }`}
            >
              <AlignLeft className="w-3 h-3" />
              <span>Freitext</span>
            </button>

            <button
              onClick={() => setMode('checklist')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                mode === 'checklist' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted hover:bg-white'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>Checkliste</span>
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-0.5 bg-white/70 p-0.5 rounded-xl border border-white/80">
            {(['normal', 'large', 'huge', 'giant'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  fontSize === s ? 'bg-white text-hbs-blue shadow-2xs' : 'text-hbs-slate-muted hover:bg-white/60'
                }`}
                title={`Schriftgröße: ${s}`}
              >
                {s[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Word Toolbar for Freitext Mode */}
        {mode === 'text' && (
          <div className="flex items-center gap-0.5 bg-white/80 p-1 rounded-xl border border-white/90 shadow-2xs flex-wrap relative">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Fett (Strg+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Kursiv (Strg+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Unterstrichen (Strg+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            {/* Text Color Picker Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all flex items-center gap-0.5"
                title="Schriftfarbe wählen"
              >
                <Palette className="w-3.5 h-3.5 text-hbs-blue" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 flex gap-1 animate-scaleUp">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeCommand('foreColor', c.color);
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-115 transition-transform"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Text Highlighter Marker Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all flex items-center gap-0.5"
                title="Textmarker / Hintergrundfarbe"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              </button>

              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 flex gap-1 animate-scaleUp">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.color}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeCommand('hiliteColor', h.color);
                        setShowHighlightPicker(false);
                      }}
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-115 transition-transform flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: h.color }}
                      title={h.name}
                    >
                      {h.color === 'transparent' ? '✕' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Aufzählungsliste"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('insertOrderedList'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Nummerierte Liste"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Linksbündig"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Zentriert"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 active:scale-95 transition-all"
              title="Rechtsbündig"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body Area - Dynamically expands with widget size */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col">
        {mode === 'checklist' ? (
          <div className="space-y-1.5 flex-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-2 rounded-xl flex items-center justify-between gap-2 border cursor-pointer transition-all ${
                  item.done
                    ? 'bg-white/40 text-hbs-slate-muted line-through border-transparent'
                    : 'bg-white/80 hover:bg-white text-hbs-slate-dark border-white/90 shadow-2xs font-bold'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'border-hbs-slate-border bg-white'
                    }`}
                  >
                    {item.done && <span className="text-[10px] font-black">✓</span>}
                  </div>
                  <span className={`${fontSizeClass} truncate`}>{item.text}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTodo(item.id);
                  }}
                  className="text-hbs-slate-muted hover:text-red-500 p-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add Todo Input */}
            <form onSubmit={handleAddTodo} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                placeholder="Neuer Schritt / Aufgabe..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/80 border border-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-xl bg-hbs-blue text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Rich Text Word Editor */
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            className={`w-full flex-1 p-3 rounded-2xl bg-white/90 border border-white font-medium focus:outline-none focus:ring-2 focus:ring-hbs-blue/30 overflow-y-auto leading-relaxed shadow-inner ${fontSizeClass}`}
            style={{ minHeight: '120px' }}
            data-placeholder="Aufgabenstellung, Tafelnotiz oder Stundenziele hier eintragen..."
          />
        )}
      </div>
    </div>
  );
};
