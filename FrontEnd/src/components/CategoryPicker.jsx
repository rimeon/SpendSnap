import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { PREDEFINED_CATEGORIES } from '../utils/categories';

/**
 * CategoryPicker — Beautiful custom dropdown with fallback for AI suggestions
 * and support for custom manual text entries.
 */
const CategoryPicker = ({ value, onChange, aiSuggestion, aiLoading }) => {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (cat) => { onChange(cat); setOpen(false); setCustomMode(false); };
  const handleCustomSave = () => {
    if (customInput.trim()) { onChange(customInput.trim()); setCustomMode(false); setOpen(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <label htmlFor="sub-category" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
        Category
        {aiLoading && <span className="ml-2 text-[var(--accent)] normal-case text-[9px] animate-pulse">AI thinking…</span>}
        {aiSuggestion && !aiLoading && (
          <span className="ml-2 normal-case text-[9px] text-[var(--accent)]">
            AI suggests: <button type="button" onClick={() => onChange(aiSuggestion)} className="underline hover:opacity-85">{aiSuggestion}</button>
          </span>
        )}
      </label>
      <button
        id="sub-category"
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-zinc-950/60 border border-white/[0.04] text-zinc-100 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none transition-all cursor-pointer"
      >
        <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>{value || 'Select a category…'}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-[200] mt-1.5 w-full bg-[#141416] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto p-2">
            {PREDEFINED_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  value === cat ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="border-t border-white/[0.04] p-2 bg-zinc-950/40">
            {customMode ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Type custom category…"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSave()}
                  className="flex-1 bg-[#0b0b0c] border border-white/[0.05] rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
                />
                <button type="button" onClick={handleCustomSave} className="px-3.5 py-1.5 bg-[var(--accent)] text-zinc-950 text-sm font-bold rounded-lg hover:opacity-90 cursor-pointer">Add</button>
              </div>
            ) : (
              <button type="button" onClick={() => setCustomMode(true)} className="w-full text-left px-3 py-2 text-sm text-[var(--accent)] font-bold hover:opacity-90 transition-colors cursor-pointer">
                + Add custom category…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
