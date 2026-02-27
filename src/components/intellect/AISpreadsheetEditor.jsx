import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Download, Plus, Trash2, Sparkles, Loader2, X, Check,
  Share2, BarChart3, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Code2, Sigma, FunctionSquare, ChevronDown, Undo2, Redo2, Copy, Clipboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const getColName = (idx) => idx < 26 ? ALPHABET[idx] : ALPHABET[Math.floor(idx / 26) - 1] + ALPHABET[idx % 26];

const INITIAL_ROWS = 22;
const INITIAL_COLS = 8;
const COL_WIDTH = 110;
const ROW_HEIGHT = 26;

/* ─── Formula evaluator ─── */
function evaluateFormula(formula, rows) {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).trim().toUpperCase();

  // Helper: parse cell ref like A1 → value
  const cellVal = (ref) => {
    const col = ref.charCodeAt(0) - 65;
    const row = parseInt(ref.slice(1)) - 1;
    const raw = rows[row]?.[col]?.value ?? '';
    if (raw.startsWith('=')) return parseFloat(evaluateFormula(raw, rows)) || 0;
    return parseFloat(raw) || 0;
  };

  // Helper: parse range A1:A5
  const rangeVals = (rangeStr) => {
    const [start, end] = rangeStr.split(':');
    const c1 = start.charCodeAt(0) - 65, r1 = parseInt(start.slice(1)) - 1;
    const c2 = end.charCodeAt(0) - 65, r2 = parseInt(end.slice(1)) - 1;
    const vals = [];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const raw = rows[r]?.[c]?.value ?? '';
      vals.push(parseFloat(raw) || 0);
    }
    return vals;
  };

  try {
    // SUM(A1:A5)
    if (/^SUM\((.+)\)$/.test(expr)) {
      const arg = expr.match(/^SUM\((.+)\)$/)[1];
      const vals = arg.includes(':') ? rangeVals(arg) : arg.split(',').map(cellVal);
      return vals.reduce((a, b) => a + b, 0).toString();
    }
    // AVERAGE(A1:A5)
    if (/^AVERAGE\((.+)\)$/.test(expr)) {
      const arg = expr.match(/^AVERAGE\((.+)\)$/)[1];
      const vals = arg.includes(':') ? rangeVals(arg) : arg.split(',').map(cellVal);
      return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    }
    // COUNT
    if (/^COUNT\((.+)\)$/.test(expr)) {
      const arg = expr.match(/^COUNT\((.+)\)$/)[1];
      const vals = arg.includes(':') ? rangeVals(arg) : arg.split(',').map(cellVal);
      return vals.filter(v => !isNaN(v) && v !== 0).length.toString();
    }
    // MAX / MIN
    if (/^MAX\((.+)\)$/.test(expr)) {
      const arg = expr.match(/^MAX\((.+)\)$/)[1];
      const vals = arg.includes(':') ? rangeVals(arg) : arg.split(',').map(cellVal);
      return Math.max(...vals).toString();
    }
    if (/^MIN\((.+)\)$/.test(expr)) {
      const arg = expr.match(/^MIN\((.+)\)$/)[1];
      const vals = arg.includes(':') ? rangeVals(arg) : arg.split(',').map(cellVal);
      return Math.min(...vals).toString();
    }
    // IF(condition, true_val, false_val)
    if (/^IF\((.+),(.+),(.+)\)$/.test(expr)) {
      const [, cond, tv, fv] = expr.match(/^IF\((.+),(.+),(.+)\)$/);
      // Simple comparisons: A1>B1
      const evalCond = (c) => {
        const m = c.trim().match(/^([A-Z]\d+|[\d.]+)\s*([><=!]+)\s*([A-Z]\d+|[\d.]+)$/);
        if (!m) return false;
        const l = /^[A-Z]\d+$/.test(m[1]) ? cellVal(m[1]) : parseFloat(m[1]);
        const r = /^[A-Z]\d+$/.test(m[3]) ? cellVal(m[3]) : parseFloat(m[3]);
        return m[2] === '>' ? l > r : m[2] === '<' ? l < r : m[2] === '>=' ? l >= r : m[2] === '<=' ? l <= r : m[2] === '=' || m[2] === '==' ? l === r : l !== r;
      };
      return evalCond(cond) ? tv.trim() : fv.trim();
    }
    // Simple arithmetic with cell refs: =A1+B1*2
    const resolved = expr.replace(/([A-Z]\d+)/g, (_, ref) => cellVal(ref));
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${resolved})`)();
    return isNaN(result) ? '#ERR' : result.toString();
  } catch {
    return '#ERR';
  }
}

function makeCell(value = '', fmt = {}) { return { value, fmt }; }
function makeGrid(r, c) { return Array(r).fill(null).map(() => Array(c).fill(null).map(() => makeCell())); }

const DEFAULT_CELL_FMT = { bold: false, italic: false, align: 'left', bg: '', color: '' };

function cellRef(r, c) { return `${getColName(c)}${r + 1}`; }

export default function AISpreadsheetEditor() {
  const [sheetName, setSheetName] = useState("Untitled Spreadsheet");
  const [grid, setGrid] = useState(() => makeGrid(INITIAL_ROWS, INITIAL_COLS));
  const [selected, setSelected] = useState({ r: 0, c: 0 });
  const [selection, setSelection] = useState(null); // {r1,c1,r2,c2}
  const [editingCell, setEditingCell] = useState(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [history, setHistory] = useState([]);
  const [colWidths, setColWidths] = useState(() => Array(INITIAL_COLS).fill(COL_WIDTH));
  const inputRef = useRef(null);
  const gridRef = useRef(null);

  const numCols = grid[0]?.length || INITIAL_COLS;
  const numRows = grid.length;

  // Formula bar sync
  useEffect(() => {
    const cell = grid[selected.r]?.[selected.c];
    setFormulaBarValue(cell?.value || '');
  }, [selected, grid]);

  const getDisplayValue = useCallback((r, c) => {
    const cell = grid[r]?.[c];
    if (!cell) return '';
    const raw = cell.value;
    if (raw.startsWith('=')) {
      try { return evaluateFormula(raw, grid); }
      catch { return '#ERR'; }
    }
    return raw;
  }, [grid]);

  const setCell = (r, c, value, fmt = null) => {
    setHistory(h => [...h.slice(-50), grid.map(row => row.map(cell => ({ ...cell })))]);
    setGrid(prev => prev.map((row, ri) =>
      ri === r ? row.map((cell, ci) => ci === c ? { value, fmt: fmt !== null ? fmt : cell.fmt } : cell) : row
    ));
  };

  const setCellFmt = (r, c, fmtPatch) => {
    setGrid(prev => prev.map((row, ri) =>
      ri === r ? row.map((cell, ci) => ci === c ? { ...cell, fmt: { ...DEFAULT_CELL_FMT, ...cell.fmt, ...fmtPatch } } : cell) : row
    ));
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(prev);
  };

  const handleFormulaBarChange = (val) => {
    setFormulaBarValue(val);
    setCell(selected.r, selected.c, val);
  };

  const addRow = () => setGrid(prev => [...prev, Array(numCols).fill(null).map(() => makeCell())]);
  const addCol = () => { setGrid(prev => prev.map(row => [...row, makeCell()])); setColWidths(w => [...w, COL_WIDTH]); };
  const deleteRow = (idx) => { if (numRows > 1) setGrid(prev => prev.filter((_, i) => i !== idx)); };
  const deleteCol = (idx) => { if (numCols > 1) { setGrid(prev => prev.map(row => row.filter((_, i) => i !== idx))); setColWidths(w => w.filter((_, i) => i !== idx)); } };

  const handleKeyDown = (e, r, c) => {
    const { key, shiftKey } = e;
    if (key === 'Enter') { e.preventDefault(); setEditingCell(null); if (r < numRows - 1) setSelected({ r: r + 1, c }); }
    else if (key === 'Tab') { e.preventDefault(); setEditingCell(null); if (c < numCols - 1) setSelected({ r, c: c + 1 }); else if (r < numRows - 1) setSelected({ r: r + 1, c: 0 }); }
    else if (key === 'ArrowUp' && !editingCell) { e.preventDefault(); if (r > 0) setSelected({ r: r - 1, c }); }
    else if (key === 'ArrowDown' && !editingCell) { e.preventDefault(); if (r < numRows - 1) setSelected({ r: r + 1, c }); }
    else if (key === 'ArrowLeft' && !editingCell) { e.preventDefault(); if (c > 0) setSelected({ r, c: c - 1 }); }
    else if (key === 'ArrowRight' && !editingCell) { e.preventDefault(); if (c < numCols - 1) setSelected({ r, c: c + 1 }); }
    else if (key === 'Escape') setEditingCell(null);
    else if (key === 'Delete' && !editingCell) setCell(r, c, '');
  };

  const saveSpreadsheet = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const csv = grid.map(row => row.map(cell => `"${getDisplayValue(grid.indexOf(row), row.indexOf(cell))}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], `${sheetName}.csv`, { type: 'text/csv' });
      await base44.integrations.Core.UploadFile({ file });
      setLastSaved(new Date());
    } catch { toast.error('Save failed'); }
    finally { setIsSaving(false); }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const dataText = grid.slice(0, 8).map((row, ri) =>
        row.map((cell, ci) => `${cellRef(ri, ci)}:${getDisplayValue(ri, ci)}`).join(' | ')
      ).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data analyst. Analyze this spreadsheet data:\n${dataText}\n\nProvide: summary, 3 key trends, 3 actionable recommendations, and suggest 3 useful formulas the user could add.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            trends: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            suggested_formulas: { type: 'array', items: { type: 'object', properties: { formula: { type: 'string' }, description: { type: 'string' } } } }
          }
        }
      });
      setAiData(result);
      setShowAI(true);
    } catch { toast.error('AI analysis failed'); }
    finally { setAiLoading(false); }
  };

  const downloadCSV = () => {
    const csv = grid.map((row, ri) => row.map((_, ci) => `"${getDisplayValue(ri, ci)}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${sheetName}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Build chart data from first 2 columns
  const chartData = grid.slice(1, 10).map((row, i) => ({
    name: getDisplayValue(i + 1, 0) || `Row ${i + 2}`,
    value: parseFloat(getDisplayValue(i + 1, 1)) || 0,
  })).filter(d => d.value !== 0);

  const currentCell = grid[selected.r]?.[selected.c];
  const currentFmt = { ...DEFAULT_CELL_FMT, ...currentCell?.fmt };

  const FORMULA_EXAMPLES = [
    { label: '=SUM(A1:A5)', desc: 'Sum a range' },
    { label: '=AVERAGE(B1:B10)', desc: 'Average values' },
    { label: '=IF(A1>0,"Yes","No")', desc: 'Conditional' },
    { label: '=MAX(C1:C20)', desc: 'Maximum value' },
    { label: '=COUNT(A1:A20)', desc: 'Count non-empty' },
  ];

  return (
    <div className="flex flex-col h-full bg-white select-none">

      {/* ── Title bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <input value={sheetName} onChange={e => setSheetName(e.target.value)}
          className="text-sm font-medium text-gray-800 bg-transparent border-0 outline-none hover:bg-gray-100 focus:bg-gray-100 rounded px-1.5 py-0.5 w-48"
          placeholder="Untitled spreadsheet" />
        <div className="flex items-center gap-1 ml-auto">
          {isSaving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
          {lastSaved && !isSaving && <span className="text-xs text-gray-400">Saved</span>}
          <Button size="sm" variant="ghost" onClick={saveSpreadsheet} className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100">Save</Button>
          <Button size="sm" variant="ghost" onClick={downloadCSV} className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100"><Download className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setShowChart(v => !v)} className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100"><BarChart3 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" onClick={generateAI} disabled={aiLoading} className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg">
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            AI Analyze
          </Button>
        </div>
      </div>

      {/* ── Formatting Toolbar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-1 flex items-center gap-0.5">
        <button title="Undo" onClick={undo} className="h-6 w-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Bold */}
        <button title="Bold" onClick={() => setCellFmt(selected.r, selected.c, { bold: !currentFmt.bold })}
          className={`h-6 w-6 flex items-center justify-center rounded text-xs font-bold transition-all ${currentFmt.bold ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
          <Bold className="w-3.5 h-3.5" />
        </button>
        {/* Italic */}
        <button title="Italic" onClick={() => setCellFmt(selected.r, selected.c, { italic: !currentFmt.italic })}
          className={`h-6 w-6 flex items-center justify-center rounded transition-all ${currentFmt.italic ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
          <Italic className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Align */}
        {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([align, Icon]) => (
          <button key={align} title={`Align ${align}`} onClick={() => setCellFmt(selected.r, selected.c, { align })}
            className={`h-6 w-6 flex items-center justify-center rounded transition-all ${currentFmt.align === align ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Cell color */}
        <label title="Cell background" className="h-6 w-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 cursor-pointer relative">
          <span className="text-xs font-bold" style={{ borderBottom: `3px solid ${currentFmt.bg || '#ffff00'}` }}>A</span>
          <input type="color" value={currentFmt.bg || '#ffffff'} onChange={e => setCellFmt(selected.r, selected.c, { bg: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Formula shortcuts */}
        <button title="Insert SUM formula" onClick={() => { const v = `=SUM(A1:A${numRows})`; setCell(selected.r, selected.c, v); setFormulaBarValue(v); }}
          className="h-6 px-1.5 flex items-center gap-0.5 rounded text-gray-500 hover:bg-gray-100 text-xs">
          <Sigma className="w-3 h-3" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Add row/col */}
        <button onClick={addRow} className="h-6 px-1.5 flex items-center gap-0.5 rounded text-gray-500 hover:bg-gray-100 text-xs">
          <Plus className="w-3 h-3" />Row
        </button>
        <button onClick={addCol} className="h-6 px-1.5 flex items-center gap-0.5 rounded text-gray-500 hover:bg-gray-100 text-xs">
          <Plus className="w-3 h-3" />Col
        </button>
      </div>

      {/* ── Formula Bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-1 flex items-center gap-2">
        <div className="w-14 h-6 border border-gray-200 rounded flex items-center justify-center text-xs font-mono text-gray-600 bg-gray-50 flex-shrink-0">
          {cellRef(selected.r, selected.c)}
        </div>
        <div className="flex items-center text-gray-300 flex-shrink-0">
          <FunctionSquare className="w-4 h-4 text-gray-400" />
        </div>
        <input
          value={formulaBarValue}
          onChange={e => handleFormulaBarChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setCell(selected.r, selected.c, formulaBarValue); setSelected(s => ({ ...s, r: Math.min(numRows - 1, s.r + 1) })); } }}
          placeholder="Value or =FORMULA()"
          className="flex-1 h-6 text-xs font-mono text-gray-800 bg-transparent outline-none border-0 px-1"
        />
        {formulaBarValue.startsWith('=') && (
          <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">
            = {(() => { try { return evaluateFormula(formulaBarValue, grid); } catch { return '#ERR'; } })()}
          </span>
        )}
      </div>

      {/* ── Chart (collapsible) ── */}
      <AnimatePresence>
        {showChart && chartData.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 160, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 border-b border-gray-200 bg-gray-50 overflow-hidden px-4 py-2"
          >
            <p className="text-[10px] text-gray-400 mb-1 uppercase font-semibold">Chart Preview — Col A (labels) vs Col B (values)</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', background: '#1e293b', border: 'none', color: '#fff' }} />
                <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <table className="border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          {/* Column headers */}
          <thead className="sticky top-0 z-20 bg-gray-50">
            <tr>
              <th className="sticky left-0 z-30 bg-gray-50 border-b border-r border-gray-200" style={{ width: 44, minWidth: 44 }} />
              {Array(numCols).fill(null).map((_, ci) => (
                <th key={ci}
                  className={`border-b border-r border-gray-200 text-center font-semibold text-gray-500 text-[11px] select-none relative group
                    ${selected.c === ci ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50'}`}
                  style={{ width: colWidths[ci], minWidth: 60, height: ROW_HEIGHT }}
                >
                  {getColName(ci)}
                  <button onClick={() => deleteCol(ci)}
                    className="absolute right-0.5 top-0.5 hidden group-hover:flex text-red-400 hover:text-red-600 text-[8px] w-3.5 h-3.5 items-center justify-center">
                    ✕
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, ri) => (
              <tr key={ri} className="group/row">
                {/* Row number */}
                <td className={`sticky left-0 z-10 border-b border-r border-gray-200 text-center text-[11px] font-semibold text-gray-400 select-none
                  ${selected.r === ri ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50'}`}
                  style={{ width: 44, minWidth: 44, height: ROW_HEIGHT }}
                >
                  <div className="flex items-center justify-between px-1">
                    <span>{ri + 1}</span>
                    <button onClick={() => deleteRow(ri)}
                      className="hidden group-hover/row:flex text-red-400 hover:text-red-600 text-[8px] w-3 h-3 items-center justify-center">✕</button>
                  </div>
                </td>
                {row.map((cell, ci) => {
                  const isSelected = selected.r === ri && selected.c === ci;
                  const isEditing = editingCell?.r === ri && editingCell?.c === ci;
                  const fmt = { ...DEFAULT_CELL_FMT, ...cell.fmt };
                  const displayVal = getDisplayValue(ri, ci);
                  const isFormula = cell.value.startsWith('=');
                  const isError = displayVal === '#ERR';

                  return (
                    <td key={ci}
                      onClick={() => { setSelected({ r: ri, c: ci }); setEditingCell(null); }}
                      onDoubleClick={() => setEditingCell({ r: ri, c: ci })}
                      onKeyDown={e => handleKeyDown(e, ri, ci)}
                      tabIndex={0}
                      className={`border-b border-r border-gray-200 relative cursor-cell outline-none
                        ${isSelected ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/30 z-10' : 'hover:bg-gray-50'}
                        ${isError ? 'text-red-500' : ''}`}
                      style={{ width: colWidths[ci], height: ROW_HEIGHT, backgroundColor: fmt.bg || undefined }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          ref={inputRef}
                          value={cell.value}
                          onChange={e => { setCell(ri, ci, e.target.value); setFormulaBarValue(e.target.value); }}
                          onKeyDown={e => handleKeyDown(e, ri, ci)}
                          onBlur={() => setEditingCell(null)}
                          className="absolute inset-0 w-full h-full px-1.5 text-xs font-mono outline-none border-0 bg-white z-20"
                          style={{ textAlign: fmt.align }}
                        />
                      ) : (
                        <div
                          className={`px-1.5 truncate h-full flex items-center
                            ${fmt.bold ? 'font-semibold' : ''}
                            ${fmt.italic ? 'italic' : ''}
                            ${isFormula && !isError ? 'text-emerald-700' : 'text-gray-800'}
                            ${isError ? 'text-red-500 font-bold' : ''}`}
                          style={{ textAlign: fmt.align, color: fmt.color || undefined, justifyContent: fmt.align === 'right' ? 'flex-end' : fmt.align === 'center' ? 'center' : 'flex-start' }}
                        >
                          {displayVal}
                          {isFormula && !isError && <Code2 className="w-2 h-2 text-emerald-400 ml-1 flex-shrink-0" />}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Add row button */}
            <tr>
              <td colSpan={numCols + 1} className="border-t border-gray-200">
                <button onClick={addRow} className="w-full h-6 text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 transition-all">
                  <Plus className="w-3 h-3" /> Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── AI Analysis Panel ── */}
      <AnimatePresence>
        {showAI && aiData && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="flex-shrink-0 border-t border-gray-200 bg-white max-h-64 overflow-y-auto shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-gray-800">AI Data Analysis</p>
              </div>
              <button onClick={() => setShowAI(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {aiData.summary && (
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">{aiData.summary}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {aiData.trends?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Trends</p>
                    <div className="space-y-1.5">
                      {aiData.trends.map((t, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-emerald-500 mt-0.5">↑</span>{t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiData.recommendations?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Recommendations</p>
                    <div className="space-y-1.5">
                      {aiData.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-blue-500 mt-0.5">•</span>{r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {aiData.suggested_formulas?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Suggested Formulas</p>
                  <div className="flex flex-wrap gap-2">
                    {aiData.suggested_formulas.map((f, i) => (
                      <button key={i}
                        onClick={() => { setCell(selected.r, selected.c, f.formula); setFormulaBarValue(f.formula); toast.success('Formula inserted'); }}
                        title={f.description}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-mono hover:bg-emerald-100 transition-all flex items-center gap-1"
                      >
                        <Code2 className="w-3 h-3" />
                        {f.formula}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formula reference (collapsible) ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-1 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 font-semibold uppercase">Formulas:</span>
        {FORMULA_EXAMPLES.map((f, i) => (
          <button key={i} title={f.desc}
            onClick={() => { setCell(selected.r, selected.c, f.label); setFormulaBarValue(f.label); }}
            className="px-2 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-mono text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
          >
            {f.label}
          </button>
        ))}
        <span className="text-[10px] text-gray-400 ml-auto">{numRows}×{numCols}</span>
      </div>

      <style>{`
        td:focus { outline: none; }
        table { border-collapse: collapse; }
      `}</style>
    </div>
  );
}