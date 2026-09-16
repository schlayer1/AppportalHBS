import React, { useState } from 'react';
import { CheckSquare, AlignLeft, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export const TextWidget: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'checklist'>('checklist');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  
  // Note text state
  const [noteText, setNoteText] = useState(
    '🎯 Stundenziel: Arbeitsblatt S. 42 Aufgaben 1 bis 4 bearbeiten.\n\n📌 Bei Fragen: Zuerst Flüsterpartner fragen!'
  );

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', text: 'Hausaufgaben vergleichen', done: true },
    { id: '2', text: 'Lehrbuch S. 42 lesen & besprechen', done: false },
    { id: '3', text: 'Stillarbeit: Aufgaben 1-4 im Heft', done: false },
    { id: '4', text: 'Ergebnisse an der Tafel sichern', done: false }
  ]);

  const [newTodoInput, setNewTodoInput] = useState('');

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
    huge: 'text-base sm:text-lg'
  }[fontSize];

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1 bg-white/60 p-0.5 rounded-xl border border-white/80">
          <button
            onClick={() => setMode('checklist')}
            className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
              mode === 'checklist' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>Checkliste</span>
          </button>
          <button
            onClick={() => setMode('text')}
            className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
              mode === 'text' ? 'bg-hbs-blue text-white shadow-2xs' : 'text-hbs-slate-muted'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
            <span>Freitext</span>
          </button>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center gap-0.5 bg-white/60 p-0.5 rounded-xl border border-white/80">
          {(['normal', 'large', 'huge'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                fontSize === s ? 'bg-white text-hbs-blue shadow-2xs' : 'text-hbs-slate-muted'
              }`}
            >
              {s[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto max-h-56 pr-1">
        {mode === 'checklist' ? (
          <div className="space-y-1.5">
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
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className={`w-full h-full min-h-[140px] p-3 rounded-2xl bg-white/80 border border-white font-medium focus:outline-none focus:ring-2 focus:ring-hbs-blue/20 ${fontSizeClass}`}
            placeholder="Aufgabenstellung, Tafelnotiz oder Stundenziele hier eintragen..."
          />
        )}
      </div>
    </div>
  );
};
