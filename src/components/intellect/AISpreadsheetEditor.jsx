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

  // Normalise: support semicolons as argument separators (European locale like Excel/Sheets)
  // Replace semicolons outside quotes with commas
  let src = formula.slice(1).trim();
  let normExpr = '';
  let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') inStr = !inStr;
    normExpr += (!inStr && ch === ';') ? ',' : ch;
  }
  const expr = normExpr.toUpperCase();
  // Keep original-case version for string operations
  const exprOrig = normExpr;

  /* ── helpers ── */

  const parseColIdx = (col) => col.length === 1 ? col.charCodeAt(0) - 65 : (col.charCodeAt(0) - 64) * 26 + col.charCodeAt(1) - 65;

  // Get raw cell value (string), resolving formulas recursively
  const cellRaw = (ref) => {
    const m = ref.trim().toUpperCase().match(/^\$?([A-Z]+)\$?(\d+)$/);
    if (!m) return '';
    const col = parseColIdx(m[1]);
    const row = parseInt(m[2]) - 1;
    const raw = rows[row]?.[col]?.value ?? '';
    if (raw.startsWith('=')) return evaluateFormula(raw, rows);
    return raw;
  };

  // Get numeric cell value
  const cellVal = (ref) => { const raw = cellRaw(ref); const n = parseFloat(raw); return isNaN(n) ? 0 : n; };

  // Resolve arg to string (strip quotes or get cell value)
  const argStr = (a) => {
    a = a.trim();
    if (/^\$?[A-Z]+\$?\d+$/i.test(a)) return cellRaw(a);
    if (/^".*"$/.test(a)) return a.slice(1, -1);
    return a;
  };

  // Resolve arg to number
  const argNum = (a) => {
    a = a.trim();
    if (/^\$?[A-Z]+\$?\d+$/i.test(a)) return cellVal(a);
    return parseFloat(a) || 0;
  };

  // Parse cell ref to {r, c}
  const parseRef = (r) => {
    const m = r.trim().toUpperCase().match(/^\$?([A-Z]+)\$?(\d+)$/);
    if (!m) throw new Error('bad ref');
    return { c: parseColIdx(m[1]), r: parseInt(m[2]) - 1 };
  };

  // All raw values from a range string "A1:B5"
  const rangeRaws = (rangeStr) => {
    const parts = rangeStr.split(':');
    const s = parseRef(parts[0]), e = parseRef(parts[1]);
    const vals = [];
    for (let r = s.r; r <= e.r; r++)
      for (let c = s.c; c <= e.c; c++) {
        const raw = rows[r]?.[c]?.value ?? '';
        vals.push(raw.startsWith('=') ? evaluateFormula(raw, rows) : raw);
      }
    return vals;
  };

  const rangeVals = (rangeStr) => rangeRaws(rangeStr).map(v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; });

  // Split top-level args (respects nested parens and quoted strings)
  const splitArgs = (str) => {
    const args = []; let depth = 0, cur = '', inQ = false;
    for (const ch of str) {
      if (ch === '"') inQ = !inQ;
      if (!inQ) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; continue; }
      }
      cur += ch;
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  // Get all numeric values from an arg that may be a range, list, or single ref
  const getVals = (arg) => {
    if (!arg) return [];
    if (arg.includes(':')) return rangeVals(arg);
    return splitArgs(arg).flatMap(a => {
      a = a.trim();
      if (a.includes(':')) return rangeVals(a);
      if (/^\$?[A-Z]+\$?\d+$/i.test(a)) return [cellVal(a)];
      const n = parseFloat(a);
      return [isNaN(n) ? 0 : n];
    });
  };

  // Get all raw string values from an arg (range or list)
  const getRaws = (arg) => {
    if (!arg) return [];
    if (arg.includes(':')) return rangeRaws(arg);
    return splitArgs(arg).flatMap(a => {
      a = a.trim();
      if (a.includes(':')) return rangeRaws(a);
      return [argStr(a)];
    });
  };

  // Evaluate a condition string like "A1>5" or "A1<>B2"
  const evalCond = (cStr) => {
    cStr = cStr.trim();
    // Handle nested formula as a boolean
    if (cStr.startsWith('=')) {
      const v = evaluateFormula(cStr, rows);
      return v === 'TRUE' || parseFloat(v) !== 0;
    }
    const m = cStr.match(/^(\$?[A-Z]+\$?\d+|[\d.-]+|"[^"]*"|TRUE|FALSE)\s*([><=!<>]{1,2})\s*(\$?[A-Z]+\$?\d+|[\d.-]+|"[^"]*"|TRUE|FALSE)$/i);
    if (!m) {
      // bare cell ref or value treated as truthy if non-empty/non-zero
      if (/^\$?[A-Z]+\$?\d+$/i.test(cStr)) { const r = cellRaw(cStr); return r !== '' && r !== '0' && r !== 'FALSE'; }
      return !!cStr;
    }
    const lRaw = /^\$?[A-Z]+\$?\d+$/i.test(m[1]) ? cellRaw(m[1]) : m[1].replace(/^"|"$/g, '');
    const rRaw = /^\$?[A-Z]+\$?\d+$/i.test(m[3]) ? cellRaw(m[3]) : m[3].replace(/^"|"$/g, '');
    const lN = parseFloat(lRaw), rN = parseFloat(rRaw);
    const l = isNaN(lN) ? lRaw : lN;
    const r = isNaN(rN) ? rRaw : rN;
    switch (m[2]) {
      case '>': return l > r;
      case '<': return l < r;
      case '>=': return l >= r;
      case '<=': return l <= r;
      case '<>': case '!=': return l != r;
      default: return l == r;
    }
  };

  // Extract inner args string of a function call (handles nested parens)
  const fnArgs = (name) => {
    const upper = expr;
    const prefix = name + '(';
    if (!upper.startsWith(prefix)) return null;
    // Find matching close paren
    let depth = 0, start = name.length;
    for (let i = start; i < upper.length; i++) {
      if (upper[i] === '(') depth++;
      else if (upper[i] === ')') { depth--; if (depth === 0) { return upper.slice(start + 1, i); } }
    }
    return null;
  };

  // Resolve a formula-branch value (may be "=X" or a direct value/ref)
  const resolveVal = (v) => {
    v = v.trim();
    if (v.startsWith('=')) return evaluateFormula(v, rows);
    if (/^\$?[A-Z]+\$?\d+$/i.test(v)) return cellRaw(v);
    return v.replace(/^"|"$/g, '');
  };

  try {
    // ── MATH & STATS ──────────────────────────────────────────
    {
      const a = fnArgs('SUM'); if (a !== null) { return getVals(a).reduce((x, y) => x + y, 0).toString(); }
    }
    {
      const a = fnArgs('AVERAGE') ?? fnArgs('AVG');
      if (a !== null) { const v = getVals(a); if (!v.length) return '#DIV/0!'; return (v.reduce((x, y) => x + y, 0) / v.length).toString(); }
    }
    {
      const a = fnArgs('MAX'); if (a !== null) { const v = getVals(a); return v.length ? Math.max(...v).toString() : '0'; }
    }
    {
      const a = fnArgs('MIN'); if (a !== null) { const v = getVals(a); return v.length ? Math.min(...v).toString() : '0'; }
    }
    {
      const a = fnArgs('MEDIAN');
      if (a !== null) { const v = [...getVals(a)].sort((x, y) => x - y); const mid = Math.floor(v.length / 2); return v.length % 2 ? v[mid].toString() : ((v[mid - 1] + v[mid]) / 2).toString(); }
    }
    {
      const a = fnArgs('MODE');
      if (a !== null) { const v = getVals(a); const freq = {}; v.forEach(x => { freq[x] = (freq[x] || 0) + 1; }); return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '#N/A'; }
    }
    {
      const a = fnArgs('STDEV') ?? fnArgs('STDEVS');
      if (a !== null) { const v = getVals(a); if (v.length < 2) return '#DIV/0!'; const mean = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1)).toString(); }
    }
    {
      const a = fnArgs('STDEVP');
      if (a !== null) { const v = getVals(a); if (!v.length) return '#DIV/0!'; const mean = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length).toString(); }
    }
    {
      const a = fnArgs('VAR') ?? fnArgs('VARS');
      if (a !== null) { const v = getVals(a); if (v.length < 2) return '#DIV/0!'; const mean = v.reduce((a, b) => a + b, 0) / v.length; return (v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1)).toString(); }
    }
    {
      const a = fnArgs('COUNT');
      if (a !== null) { return getRaws(a).filter(v => v !== '' && !isNaN(parseFloat(v))).length.toString(); }
    }
    {
      const a = fnArgs('COUNTA'); if (a !== null) { return getRaws(a).filter(v => v !== '').length.toString(); }
    }
    {
      const a = fnArgs('COUNTBLANK'); if (a !== null) { return getRaws(a).filter(v => v === '').length.toString(); }
    }
    {
      const a = fnArgs('PRODUCT'); if (a !== null) { return getVals(a).reduce((x, y) => x * y, 1).toString(); }
    }
    {
      const a = fnArgs('SUMPRODUCT');
      if (a !== null) { const args = splitArgs(a); const arrays = args.map(x => getVals(x)); const len = Math.min(...arrays.map(x => x.length)); let sum = 0; for (let i = 0; i < len; i++) sum += arrays.reduce((p, arr) => p * arr[i], 1); return sum.toString(); }
    }
    {
      const a = fnArgs('LARGE');
      if (a !== null) { const [rng, k] = splitArgs(a); const v = [...getVals(rng)].sort((x, y) => y - x); return (v[argNum(k) - 1] ?? '#NUM!').toString(); }
    }
    {
      const a = fnArgs('SMALL');
      if (a !== null) { const [rng, k] = splitArgs(a); const v = [...getVals(rng)].sort((x, y) => x - y); return (v[argNum(k) - 1] ?? '#NUM!').toString(); }
    }
    {
      const a = fnArgs('RANK');
      if (a !== null) { const [ref, rng, ord] = splitArgs(a); const val = argNum(ref); const v = [...getVals(rng)].sort((x, y) => argNum(ord || '0') ? x - y : y - x); const idx = v.indexOf(val); return idx >= 0 ? (idx + 1).toString() : '#N/A'; }
    }
    {
      const a = fnArgs('ROUND');
      if (a !== null) { const [v, d] = splitArgs(a); const num = argNum(v); const dec = argNum(d); const f = 10 ** dec; return (Math.round(num * f) / f).toString(); }
    }
    {
      const a = fnArgs('ROUNDUP');
      if (a !== null) { const [v, d] = splitArgs(a); const num = argNum(v); const dec = argNum(d); const f = 10 ** dec; return (Math.ceil(num * f) / f).toString(); }
    }
    {
      const a = fnArgs('ROUNDDOWN');
      if (a !== null) { const [v, d] = splitArgs(a); const num = argNum(v); const dec = argNum(d); const f = 10 ** dec; return (Math.floor(num * f) / f).toString(); }
    }
    {
      const a = fnArgs('MROUND');
      if (a !== null) { const [v, mult] = splitArgs(a); return (Math.round(argNum(v) / argNum(mult)) * argNum(mult)).toString(); }
    }
    {
      const a = fnArgs('FLOOR');
      if (a !== null) { const [v, sig] = splitArgs(a); const s = argNum(sig) || 1; return (Math.floor(argNum(v) / s) * s).toString(); }
    }
    {
      const a = fnArgs('CEILING');
      if (a !== null) { const [v, sig] = splitArgs(a); const s = argNum(sig) || 1; return (Math.ceil(argNum(v) / s) * s).toString(); }
    }
    {
      const a = fnArgs('INT'); if (a !== null) { return Math.floor(argNum(a)).toString(); }
    }
    {
      const a = fnArgs('ABS'); if (a !== null) { return Math.abs(argNum(a)).toString(); }
    }
    {
      const a = fnArgs('SQRT'); if (a !== null) { const n = argNum(a); return n < 0 ? '#NUM!' : Math.sqrt(n).toString(); }
    }
    {
      const a = fnArgs('POWER') ?? fnArgs('POW');
      if (a !== null) { const [b, e] = splitArgs(a); return Math.pow(argNum(b), argNum(e)).toString(); }
    }
    {
      const a = fnArgs('MOD');
      if (a !== null) { const [n, d] = splitArgs(a); const dn = argNum(d); if (dn === 0) return '#DIV/0!'; return (argNum(n) % dn).toString(); }
    }
    {
      const a = fnArgs('LOG');
      if (a !== null) { const [v, base] = splitArgs(a); return (Math.log(argNum(v)) / Math.log(base !== undefined ? argNum(base) : 10)).toString(); }
    }
    {
      const a = fnArgs('LOG10'); if (a !== null) { return Math.log10(argNum(a)).toString(); }
    }
    {
      const a = fnArgs('LN'); if (a !== null) { return Math.log(argNum(a)).toString(); }
    }
    {
      const a = fnArgs('EXP'); if (a !== null) { return Math.exp(argNum(a)).toString(); }
    }
    if (expr === 'PI()') return Math.PI.toString();
    if (expr === 'RAND()') return Math.random().toString();
    {
      const a = fnArgs('RANDBETWEEN');
      if (a !== null) { const [lo, hi] = splitArgs(a); return (Math.floor(Math.random() * (argNum(hi) - argNum(lo) + 1)) + argNum(lo)).toString(); }
    }
    {
      const a = fnArgs('TRUNC');
      if (a !== null) { const [v, d] = splitArgs(a); const dec = d !== undefined ? argNum(d) : 0; const f = 10 ** dec; return (Math.trunc(argNum(v) * f) / f).toString(); }
    }
    {
      const a = fnArgs('SIGN'); if (a !== null) { const n = argNum(a); return (n > 0 ? 1 : n < 0 ? -1 : 0).toString(); }
    }
    {
      const a = fnArgs('GCD');
      if (a !== null) { const gcd = (x, y) => y === 0 ? x : gcd(y, x % y); return getVals(a).map(Math.abs).reduce(gcd).toString(); }
    }
    {
      const a = fnArgs('LCM');
      if (a !== null) { const gcd = (x, y) => y === 0 ? x : gcd(y, x % y); const lcm = (x, y) => (x / gcd(x, y)) * y; return getVals(a).map(Math.abs).reduce(lcm).toString(); }
    }
    {
      const a = fnArgs('FACT');
      if (a !== null) { let n = argNum(a); let f = 1; while (n > 1) { f *= n--; } return f.toString(); }
    }
    {
      const a = fnArgs('PERCENTILE') ?? fnArgs('PERCENTILE.INC');
      if (a !== null) { const [rng, k] = splitArgs(a); const v = [...getVals(rng)].sort((x, y) => x - y); const pct = argNum(k); const idx = pct * (v.length - 1); const lo = Math.floor(idx); return (v[lo] + (v[lo + 1] !== undefined ? v[lo + 1] - v[lo] : 0) * (idx - lo)).toString(); }
    }
    {
      const a = fnArgs('QUARTILE') ?? fnArgs('QUARTILE.INC');
      if (a !== null) { const [rng, q] = splitArgs(a); const v = [...getVals(rng)].sort((x, y) => x - y); const pct = [0, 0.25, 0.5, 0.75, 1][argNum(q)]; const idx = pct * (v.length - 1); const lo = Math.floor(idx); return (v[lo] + (v[lo + 1] !== undefined ? v[lo + 1] - v[lo] : 0) * (idx - lo)).toString(); }
    }

    // ── TEXT ─────────────────────────────────────────────────
    {
      const a = fnArgs('CONCATENATE') ?? fnArgs('CONCAT');
      if (a !== null) { return getRaws(a).join(''); }
    }
    {
      const a = fnArgs('LEFT');
      if (a !== null) { const [v, n] = splitArgs(a); return argStr(v).slice(0, argNum(n !== undefined ? n : '1')); }
    }
    {
      const a = fnArgs('RIGHT');
      if (a !== null) { const [v, n] = splitArgs(a); const s = argStr(v); return s.slice(Math.max(0, s.length - argNum(n !== undefined ? n : '1'))); }
    }
    {
      const a = fnArgs('MID');
      if (a !== null) { const [v, st, n] = splitArgs(a); const s = argStr(v); const start = argNum(st) - 1; return s.slice(start, start + argNum(n)); }
    }
    {
      const a = fnArgs('LEN'); if (a !== null) { return argStr(a).length.toString(); }
    }
    {
      const a = fnArgs('UPPER'); if (a !== null) { return argStr(a).toUpperCase(); }
    }
    {
      const a = fnArgs('LOWER'); if (a !== null) { return argStr(a).toLowerCase(); }
    }
    {
      const a = fnArgs('PROPER');
      if (a !== null) { return argStr(a).toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); }
    }
    {
      const a = fnArgs('TRIM'); if (a !== null) { return argStr(a).trim().replace(/\s+/g, ' '); }
    }
    {
      const a = fnArgs('SUBSTITUTE');
      if (a !== null) { const [v, old, nw, inst] = splitArgs(a); const s = argStr(v); const o = argStr(old); const n = argStr(nw); if (inst !== undefined) { let cnt = 0; return s.replace(new RegExp(o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), m => { cnt++; return cnt === argNum(inst) ? n : m; }); } return s.replaceAll(o, n); }
    }
    {
      const a = fnArgs('REPLACE');
      if (a !== null) { const [v, st, n, nw] = splitArgs(a); const s = argStr(v); const start = argNum(st) - 1; return s.slice(0, start) + argStr(nw) + s.slice(start + argNum(n)); }
    }
    {
      const a = fnArgs('FIND');
      if (a !== null) { const [find, src, start] = splitArgs(a); const f = argStr(find); const s = argStr(src); const idx = s.indexOf(f, start !== undefined ? argNum(start) - 1 : 0); return idx < 0 ? '#VALUE!' : (idx + 1).toString(); }
    }
    {
      const a = fnArgs('SEARCH');
      if (a !== null) { const [find, src, start] = splitArgs(a); const f = argStr(find).toLowerCase(); const s = argStr(src).toLowerCase(); const idx = s.indexOf(f, start !== undefined ? argNum(start) - 1 : 0); return idx < 0 ? '#VALUE!' : (idx + 1).toString(); }
    }
    {
      const a = fnArgs('TEXT');
      if (a !== null) {
        const [v, fmt] = splitArgs(a); const n = argNum(v); const f = argStr(fmt);
        if (f.includes('%')) return (n * 100).toFixed(f.match(/\.0+/)?.[0].length - 1 || 0) + '%';
        if (f.includes('.')) { const dec = (f.split('.')[1] || '').replace(/[^0#]/g, '').length; return n.toFixed(dec); }
        if (f.toUpperCase().includes('YYYY')) { const d = new Date(n); return isNaN(d) ? '#VALUE!' : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
        return n.toFixed(0);
      }
    }
    {
      const a = fnArgs('VALUE'); if (a !== null) { const n = parseFloat(argStr(a).replace(/[,$]/g, '')); return isNaN(n) ? '#VALUE!' : n.toString(); }
    }
    {
      const a = fnArgs('REPT');
      if (a !== null) { const [v, n] = splitArgs(a); return argStr(v).repeat(Math.max(0, argNum(n))); }
    }
    {
      const a = fnArgs('CHAR'); if (a !== null) { return String.fromCharCode(argNum(a)); }
    }
    {
      const a = fnArgs('CODE'); if (a !== null) { const s = argStr(a); return s.length ? s.charCodeAt(0).toString() : '#VALUE!'; }
    }
    {
      const a = fnArgs('EXACT');
      if (a !== null) { const [x, y] = splitArgs(a); return argStr(x) === argStr(y) ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('TEXTJOIN');
      if (a !== null) { const args = splitArgs(a); const delim = argStr(args[0]); const ignoreEmpty = args[1]?.toUpperCase() === 'TRUE' || args[1] === '1'; const vals = args.slice(2).flatMap(x => getRaws(x)); return (ignoreEmpty ? vals.filter(v => v !== '') : vals).join(delim); }
    }
    {
      const a = fnArgs('NUMBERVALUE');
      if (a !== null) { const [v] = splitArgs(a); const n = parseFloat(argStr(v).replace(',', '.')); return isNaN(n) ? '#VALUE!' : n.toString(); }
    }

    // ── LOGICAL ──────────────────────────────────────────────
    {
      const a = fnArgs('IF');
      if (a !== null) {
        const args = splitArgs(a);
        const cond = evalCond(args[0]);
        const branch = cond ? (args[1] ?? '') : (args[2] ?? '');
        // If branch is itself a formula expression, evaluate it
        if (branch.startsWith('=')) return evaluateFormula(branch, rows);
        if (/^\$?[A-Z]+\$?\d+$/i.test(branch.trim())) return cellRaw(branch.trim());
        return branch.replace(/^"|"$/g, '');
      }
    }
    {
      const a = fnArgs('IFS');
      if (a !== null) { const args = splitArgs(a); for (let i = 0; i < args.length - 1; i += 2) if (evalCond(args[i])) return resolveVal(args[i + 1]); return '#N/A'; }
    }
    {
      const a = fnArgs('AND');
      if (a !== null) { return splitArgs(a).every(x => evalCond(x)) ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('OR');
      if (a !== null) { return splitArgs(a).some(x => evalCond(x)) ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('NOT'); if (a !== null) { return !evalCond(a) ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('XOR');
      if (a !== null) { const t = splitArgs(a).filter(x => evalCond(x)).length; return t % 2 === 1 ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('IFERROR');
      if (a !== null) {
        const [v, fb] = splitArgs(a);
        try {
          let res;
          if (v.trim().startsWith('=')) res = evaluateFormula(v.trim(), rows);
          else res = resolveVal(v);
          return (res === '#ERR' || res === '#N/A' || res === '#DIV/0!' || res === '#VALUE!' || res === '#NUM!' || res === '#REF!') ? resolveVal(fb) : res;
        } catch { return resolveVal(fb); }
      }
    }
    {
      const a = fnArgs('IFNA');
      if (a !== null) { const [v, fb] = splitArgs(a); const res = resolveVal(v); return res === '#N/A' ? resolveVal(fb) : res; }
    }
    {
      const a = fnArgs('SWITCH');
      if (a !== null) { const args = splitArgs(a); const val = resolveVal(args[0]); for (let i = 1; i < args.length - 1; i += 2) if (val === resolveVal(args[i])) return resolveVal(args[i + 1]); return args.length % 2 === 0 ? resolveVal(args[args.length - 1]) : '#N/A'; }
    }
    {
      const a = fnArgs('ISBLANK'); if (a !== null) { return resolveVal(a) === '' ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('ISNUMBER'); if (a !== null) { const v = resolveVal(a); return (!isNaN(parseFloat(v)) && v !== '') ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('ISTEXT'); if (a !== null) { const v = resolveVal(a); return (isNaN(parseFloat(v)) && v !== '') ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('ISERROR'); if (a !== null) { const v = resolveVal(a); return v.startsWith('#') ? 'TRUE' : 'FALSE'; }
    }
    {
      const a = fnArgs('ISNA'); if (a !== null) { return resolveVal(a) === '#N/A' ? 'TRUE' : 'FALSE'; }
    }
    if (expr === 'TRUE()' || expr === 'TRUE') return 'TRUE';
    if (expr === 'FALSE()' || expr === 'FALSE') return 'FALSE';

    // ── LOOKUP & REFERENCE ───────────────────────────────────
    {
      const a = fnArgs('VLOOKUP');
      if (a !== null) {
        const args = splitArgs(a); const lv = resolveVal(args[0]); const rangeStr = args[1]; const colIdx = argNum(args[2]);
        if (rangeStr.includes(':')) {
          const s = parseRef(rangeStr.split(':')[0]), e = parseRef(rangeStr.split(':')[1]);
          for (let r = s.r; r <= e.r; r++) {
            const first = cellRaw(`${String.fromCharCode(65 + s.c)}${r + 1}`);
            if (first === lv || (!isNaN(parseFloat(first)) && parseFloat(first) === parseFloat(lv))) {
              return cellRaw(`${String.fromCharCode(65 + s.c + colIdx - 1)}${r + 1}`);
            }
          }
        }
        return '#N/A';
      }
    }
    {
      const a = fnArgs('HLOOKUP');
      if (a !== null) {
        const args = splitArgs(a); const lv = resolveVal(args[0]); const rangeStr = args[1]; const rowIdx = argNum(args[2]);
        if (rangeStr.includes(':')) {
          const s = parseRef(rangeStr.split(':')[0]), e = parseRef(rangeStr.split(':')[1]);
          for (let c = s.c; c <= e.c; c++) {
            const first = cellRaw(`${String.fromCharCode(65 + c)}${s.r + 1}`);
            if (first === lv || (!isNaN(parseFloat(first)) && parseFloat(first) === parseFloat(lv))) {
              return cellRaw(`${String.fromCharCode(65 + c)}${s.r + rowIdx}`);
            }
          }
        }
        return '#N/A';
      }
    }
    {
      const a = fnArgs('INDEX');
      if (a !== null) {
        const [rangeStr, rowNum, colNum] = splitArgs(a);
        if (rangeStr.includes(':')) {
          const s = parseRef(rangeStr.split(':')[0]);
          const r = s.r + argNum(rowNum) - 1;
          const c = s.c + (colNum !== undefined ? argNum(colNum) - 1 : 0);
          return cellRaw(`${String.fromCharCode(65 + c)}${r + 1}`);
        }
        return '';
      }
    }
    {
      const a = fnArgs('MATCH');
      if (a !== null) {
        const [lookup, range] = splitArgs(a); const lv = resolveVal(lookup); const raws = getRaws(range);
        const idx = raws.findIndex(v => v === lv || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(lv)));
        return idx >= 0 ? (idx + 1).toString() : '#N/A';
      }
    }
    {
      const a = fnArgs('CHOOSE');
      if (a !== null) { const args = splitArgs(a); const i = argNum(args[0]); return resolveVal(args[i] ?? ''); }
    }
    {
      const a = fnArgs('OFFSET');
      if (a !== null) {
        const [ref, rows2, cols2] = splitArgs(a); const base = parseRef(ref.trim());
        const r = base.r + argNum(rows2); const c = base.c + argNum(cols2);
        return cellRaw(`${String.fromCharCode(65 + c)}${r + 1}`);
      }
    }
    {
      const a = fnArgs('ROW');
      if (a !== null && a.trim()) { try { return (parseRef(a.trim()).r + 1).toString(); } catch { return '#REF!'; } }
      if (a !== null) return '1'; // ROW() with no arg returns row of current cell (simplified)
    }
    {
      const a = fnArgs('COLUMN');
      if (a !== null && a.trim()) { try { return (parseRef(a.trim()).c + 1).toString(); } catch { return '#REF!'; } }
      if (a !== null) return '1';
    }

    // ── CONDITIONAL AGGREGATES ──────────────────────────────
    {
      const a = fnArgs('COUNTIF');
      if (a !== null) {
        const [range, criterion] = splitArgs(a);
        const raws = getRaws(range);
        const crit = resolveVal(criterion);
        const op = crit.match(/^([><=!<>]{1,2})(.+)$/);
        if (op) { const num = parseFloat(op[2]); return raws.filter(v => { const n = parseFloat(v); switch (op[1]) { case '>': return n > num; case '<': return n < num; case '>=': return n >= num; case '<=': return n <= num; case '<>': case '!=': return v !== op[2]; default: return n === num || v === op[2]; } }).length.toString(); }
        return raws.filter(v => v === crit || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(crit))).length.toString();
      }
    }
    {
      const a = fnArgs('SUMIF');
      if (a !== null) {
        const args = splitArgs(a); const raws = getRaws(args[0]); const crit = resolveVal(args[1]); const sumVals = getVals(args[2] ?? args[0]);
        return raws.reduce((sum, v, i) => (v === crit || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(crit))) ? sum + (sumVals[i] || 0) : sum, 0).toString();
      }
    }
    {
      const a = fnArgs('AVERAGEIF');
      if (a !== null) {
        const args = splitArgs(a); const raws = getRaws(args[0]); const crit = resolveVal(args[1]); const avgVals = getVals(args[2] ?? args[0]);
        const matched = raws.map((v, i) => (v === crit || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(crit))) ? avgVals[i] : null).filter(v => v !== null);
        return matched.length ? (matched.reduce((a, b) => a + b, 0) / matched.length).toString() : '#DIV/0!';
      }
    }
    {
      const a = fnArgs('COUNTIFS');
      if (a !== null) {
        const args = splitArgs(a); let count = -1;
        const criteria = [];
        for (let i = 0; i < args.length; i += 2) criteria.push({ raws: getRaws(args[i]), crit: resolveVal(args[i + 1]) });
        const len = Math.min(...criteria.map(c => c.raws.length));
        let total = 0;
        for (let i = 0; i < len; i++) if (criteria.every(c => { const v = c.raws[i]; return v === c.crit || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(c.crit)); })) total++;
        return total.toString();
      }
    }
    {
      const a = fnArgs('SUMIFS');
      if (a !== null) {
        const args = splitArgs(a); const sumVals = getVals(args[0]);
        const criteria = [];
        for (let i = 1; i < args.length; i += 2) criteria.push({ raws: getRaws(args[i]), crit: resolveVal(args[i + 1]) });
        const len = Math.min(sumVals.length, ...criteria.map(c => c.raws.length));
        let total = 0;
        for (let i = 0; i < len; i++) if (criteria.every(c => { const v = c.raws[i]; return v === c.crit || (!isNaN(parseFloat(v)) && parseFloat(v) === parseFloat(c.crit)); })) total += sumVals[i] || 0;
        return total.toString();
      }
    }

    // ── DATE & TIME ──────────────────────────────────────────
    if (expr === 'TODAY()') { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    if (expr === 'NOW()') { return new Date().toLocaleString(); }
    {
      const a = fnArgs('YEAR'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : d.getFullYear().toString(); }
    }
    {
      const a = fnArgs('MONTH'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : (d.getMonth() + 1).toString(); }
    }
    {
      const a = fnArgs('DAY'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : d.getDate().toString(); }
    }
    {
      const a = fnArgs('HOUR'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : d.getHours().toString(); }
    }
    {
      const a = fnArgs('MINUTE'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : d.getMinutes().toString(); }
    }
    {
      const a = fnArgs('SECOND'); if (a !== null) { const d = new Date(argStr(a)); return isNaN(d) ? '#VALUE!' : d.getSeconds().toString(); }
    }
    {
      const a = fnArgs('WEEKDAY');
      if (a !== null) { const [v, type] = splitArgs(a); const d = new Date(argStr(v)); if (isNaN(d)) return '#VALUE!'; const dow = d.getDay(); const t = argNum(type || '1'); return (t === 2 ? (dow === 0 ? 7 : dow) : t === 3 ? (dow === 0 ? 6 : dow - 1) : dow + 1).toString(); }
    }
    {
      const a = fnArgs('DATE');
      if (a !== null) { const [y, mo, d] = splitArgs(a).map(argNum); const dt = new Date(y, mo - 1, d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
    }
    {
      const a = fnArgs('DAYS');
      if (a !== null) { const [end, start] = splitArgs(a); return Math.round((new Date(argStr(end)) - new Date(argStr(start))) / 86400000).toString(); }
    }
    {
      const a = fnArgs('DATEDIF');
      if (a !== null) { const [s, e, unit] = splitArgs(a); const d1 = new Date(argStr(s)), d2 = new Date(argStr(e)); const u = argStr(unit).toUpperCase(); if (u === 'D') return Math.round((d2 - d1) / 86400000).toString(); if (u === 'M') return ((d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth()).toString(); if (u === 'Y') return (d2.getFullYear() - d1.getFullYear()).toString(); return '#VALUE!'; }
    }
    {
      const a = fnArgs('EDATE');
      if (a !== null) { const [d, n] = splitArgs(a); const dt = new Date(argStr(d)); dt.setMonth(dt.getMonth() + argNum(n)); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
    }
    {
      const a = fnArgs('NETWORKDAYS');
      if (a !== null) { const [s, e] = splitArgs(a); let d1 = new Date(argStr(s)), d2 = new Date(argStr(e)); let count = 0; while (d1 <= d2) { const dow = d1.getDay(); if (dow !== 0 && dow !== 6) count++; d1.setDate(d1.getDate() + 1); } return count.toString(); }
    }
    {
      const a = fnArgs('WORKDAY');
      if (a !== null) { const [s, n] = splitArgs(a); const dt = new Date(argStr(s)); let days = argNum(n); const dir = days > 0 ? 1 : -1; while (days !== 0) { dt.setDate(dt.getDate() + dir); if (dt.getDay() !== 0 && dt.getDay() !== 6) days -= dir; } return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
    }
    {
      const a = fnArgs('EOMONTH');
      if (a !== null) { const [s, n] = splitArgs(a); const dt = new Date(argStr(s)); dt.setMonth(dt.getMonth() + argNum(n) + 1, 0); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
    }

    // ── FINANCIAL ────────────────────────────────────────────
    {
      const a = fnArgs('PMT');
      if (a !== null) { const [rate, nper, pv, fv, type] = splitArgs(a).map(argNum); if (rate === 0) return (-pv / nper).toString(); const pvAdj = pv * Math.pow(1 + rate, nper); const pvFv = (fv || 0); return (-(pvAdj + pvFv) / ((Math.pow(1 + rate, nper) - 1) / rate * (1 + (type || 0) * rate))).toString(); }
    }
    {
      const a = fnArgs('FV');
      if (a !== null) { const [rate, nper, pmt, pv, type] = splitArgs(a).map(argNum); return (-(pmt * (1 + rate * (type || 0)) * ((Math.pow(1 + rate, nper) - 1) / rate) + (pv || 0) * Math.pow(1 + rate, nper))).toString(); }
    }
    {
      const a = fnArgs('PV');
      if (a !== null) { const [rate, nper, pmt, fv, type] = splitArgs(a).map(argNum); return (-(pmt * (1 + rate * (type || 0)) * ((1 - Math.pow(1 + rate, -nper)) / rate) + (fv || 0) * Math.pow(1 + rate, -nper))).toString(); }
    }
    {
      const a = fnArgs('NPV');
      if (a !== null) { const args = splitArgs(a); const rate = argNum(args[0]); const cfs = getVals(args.slice(1).join(',')); return cfs.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i + 1), 0).toString(); }
    }
    {
      const a = fnArgs('NPER');
      if (a !== null) { const [rate, pmt, pv] = splitArgs(a).map(argNum); return (Math.log(-pmt / (-pmt + rate * pv)) / Math.log(1 + rate)).toString(); }
    }
    {
      const a = fnArgs('SLN');
      if (a !== null) { const [cost, salvage, life] = splitArgs(a).map(argNum); return ((cost - salvage) / life).toString(); }
    }

    // ── & CONCATENATION ──────────────────────────────────────
    // Handle A1&B1 or "text"&A1 style concatenation
    if (exprOrig.includes('&')) {
      // Tokenize respecting quoted strings and parens
      const parts = []; let cur2 = '', depth2 = 0, inQ2 = false;
      for (let i = 0; i < exprOrig.length; i++) {
        const ch = exprOrig[i];
        if (ch === '"') inQ2 = !inQ2;
        if (!inQ2) { if (ch === '(') depth2++; else if (ch === ')') depth2--; }
        if (!inQ2 && depth2 === 0 && ch === '&') { parts.push(cur2.trim()); cur2 = ''; }
        else cur2 += ch;
      }
      if (cur2.trim()) parts.push(cur2.trim());
      if (parts.length > 1) return parts.map(p => {
        p = p.trim();
        if (/^\$?[A-Za-z]+\$?\d+$/.test(p)) return cellRaw(p);
        if (/^".*"$/.test(p)) return p.slice(1, -1);
        if (p.startsWith('=')) return evaluateFormula(p, rows);
        // Sub-expression (e.g. function call)
        return evaluateFormula('=' + p, rows);
      }).join('');
    }

    // ── ARITHMETIC with cell refs ────────────────────────────
    // Replace cell refs with their numeric values, then eval
    const resolved = expr.replace(/\$?([A-Z]+)\$?(\d+)/g, (_, col, row) => {
      const c = parseColIdx(col); const r = parseInt(row) - 1;
      const raw = rows[r]?.[c]?.value ?? '0';
      const val = raw.startsWith('=') ? evaluateFormula(raw, rows) : raw;
      const n = parseFloat(val);
      return isNaN(n) ? '0' : n.toString();
    });
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + resolved + ')')();
    if (typeof result === 'boolean') return result ? 'TRUE' : 'FALSE';
    return isNaN(result) ? '#ERR' : result.toString();
  } catch {
    return '#ERR';
  }
}

function makeCell(value = '', fmt = {}) { return { value, fmt }; }
function makeGrid(r, c) { return Array(r).fill(null).map(() => Array(c).fill(null).map(() => makeCell())); }

const DEFAULT_CELL_FMT = { bold: false, italic: false, align: 'left', bg: '', color: '' };

function cellRef(r, c) { return `${getColName(c)}${r + 1}`; }

function SBtn({ onClick, active, children, title, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-6 px-1.5 rounded text-xs flex items-center justify-center transition-all
        ${active
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'text-slate-400 hover:bg-slate-700/60 hover:text-white border border-transparent'}
        ${className}`}
    >
      {children}
    </button>
  );
}

function SDivider() {
  return <div className="w-px h-4 bg-slate-700/50 mx-0.5 flex-shrink-0" />;
}

export default function AISpreadsheetEditor({ initialGrid, initialTitle }) {
  const [sheetName, setSheetName] = useState(initialTitle || "Untitled Spreadsheet");
  const [grid, setGrid] = useState(() => {
    if (initialGrid) {
      // initialGrid is array of arrays of strings
      const rows = initialGrid.map(row => row.map(val => makeCell(String(val ?? ''))));
      // Pad to at least INITIAL_ROWS/COLS
      while (rows.length < INITIAL_ROWS) rows.push(Array(Math.max(INITIAL_COLS, rows[0]?.length || INITIAL_COLS)).fill(null).map(() => makeCell()));
      rows.forEach(row => { while (row.length < INITIAL_COLS) row.push(makeCell()); });
      return rows;
    }
    return makeGrid(INITIAL_ROWS, INITIAL_COLS);
  });
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
    { label: '=MIN(C1:C20)', desc: 'Minimum value' },
    { label: '=COUNT(A1:A20)', desc: 'Count numbers' },
    { label: '=COUNTA(A1:A20)', desc: 'Count non-empty' },
    { label: '=MEDIAN(A1:A10)', desc: 'Median value' },
    { label: '=STDEV(A1:A10)', desc: 'Standard deviation' },
    { label: '=ROUND(A1,2)', desc: 'Round to 2 decimals' },
    { label: '=ABS(A1)', desc: 'Absolute value' },
    { label: '=SQRT(A1)', desc: 'Square root' },
    { label: '=POWER(A1,2)', desc: 'Power/Exponent' },
    { label: '=MOD(A1,B1)', desc: 'Modulo' },
    { label: '=COUNTIF(A1:A10,"Yes")', desc: 'Count matching cells' },
    { label: '=SUMIF(A1:A10,"Yes",B1:B10)', desc: 'Sum matching cells' },
    { label: '=VLOOKUP(A1,B1:C10,2)', desc: 'Vertical lookup' },
    { label: '=IFERROR(A1/B1,0)', desc: 'Handle errors' },
    { label: '=LEFT(A1,3)', desc: 'Left characters' },
    { label: '=RIGHT(A1,3)', desc: 'Right characters' },
    { label: '=MID(A1,2,4)', desc: 'Middle characters' },
    { label: '=LEN(A1)', desc: 'Text length' },
    { label: '=UPPER(A1)', desc: 'Uppercase' },
    { label: '=LOWER(A1)', desc: 'Lowercase' },
    { label: '=TRIM(A1)', desc: 'Remove spaces' },
    { label: '=CONCATENATE(A1,B1)', desc: 'Combine text' },
    { label: '=TEXT(A1,"0.00")', desc: 'Format as text' },
    { label: '=TODAY()', desc: 'Today\'s date' },
    { label: '=NOW()', desc: 'Current date & time' },
    { label: '=YEAR(A1)', desc: 'Extract year' },
    { label: '=MONTH(A1)', desc: 'Extract month' },
    { label: '=DAY(A1)', desc: 'Extract day' },
    { label: '=PMT(A1,B1,C1)', desc: 'Loan payment' },
    { label: '=NPV(A1,B1:B5)', desc: 'Net present value' },
    { label: '=LARGE(A1:A10,1)', desc: 'Nth largest value' },
    { label: '=SMALL(A1:A10,1)', desc: 'Nth smallest value' },
    { label: '=RANK(A1,A1:A10)', desc: 'Rank of value' },
    { label: '=AND(A1>0,B1>0)', desc: 'Both conditions true' },
    { label: '=OR(A1>0,B1>0)', desc: 'Either condition true' },
    { label: '=NOT(A1>0)', desc: 'Negate condition' },
    { label: '=ISBLANK(A1)', desc: 'Check if blank' },
    { label: '=ISNUMBER(A1)', desc: 'Check if number' },
    { label: '=SUMPRODUCT(A1:A5,B1:B5)', desc: 'Sum of products' },
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