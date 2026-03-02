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

  // Helper: get raw string value of cell (preserving strings)
  const cellRaw = (ref) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return '';
    const col = match[1].length === 1 ? match[1].charCodeAt(0) - 65 : (match[1].charCodeAt(0) - 64) * 26 + match[1].charCodeAt(1) - 65;
    const row = parseInt(match[2]) - 1;
    const raw = rows[row]?.[col]?.value ?? '';
    if (raw.startsWith('=')) return evaluateFormula(raw, rows);
    return raw;
  };

  // Helper: parse cell ref → number
  const cellVal = (ref) => {
    const raw = cellRaw(ref.trim());
    return parseFloat(raw) || 0;
  };

  // Helper: parse range A1:B5 → flat array of raw values
  const rangeRaws = (rangeStr) => {
    const [start, end] = rangeStr.split(':');
    const parseRef = (r) => { const m = r.match(/^([A-Z]+)(\d+)$/); return { c: m[1].length === 1 ? m[1].charCodeAt(0) - 65 : (m[1].charCodeAt(0)-64)*26+m[1].charCodeAt(1)-65, r: parseInt(m[2]) - 1 }; };
    const s = parseRef(start.trim()), e = parseRef(end.trim());
    const vals = [];
    for (let r = s.r; r <= e.r; r++) for (let c = s.c; c <= e.c; c++) {
      const raw = rows[r]?.[c]?.value ?? '';
      vals.push(raw.startsWith('=') ? evaluateFormula(raw, rows) : raw);
    }
    return vals;
  };

  const rangeVals = (rangeStr) => rangeRaws(rangeStr).map(v => parseFloat(v) || 0);

  // Helper: split top-level args (respects nested parens)
  const splitArgs = (str) => {
    const args = []; let depth = 0, cur = '';
    for (const ch of str) {
      if (ch === '(' ) depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  // Helper: get vals from arg (range or list)
  const getVals = (arg) => arg.includes(':') ? rangeVals(arg) : splitArgs(arg).map(a => /^[A-Z]+\d+$/.test(a) ? cellVal(a) : parseFloat(a) || 0);
  const getRaws = (arg) => arg.includes(':') ? rangeRaws(arg) : splitArgs(arg).map(a => /^[A-Z]+\d+$/.test(a) ? cellRaw(a) : a.replace(/^"|"$/g, ''));

  // Eval condition (used by IF, IFS, COUNTIF etc.)
  const evalCond = (cStr) => {
    const m = cStr.trim().match(/^([A-Z]+\d+|[\d.]+|"[^"]*")\s*([><=!]{1,2})\s*([A-Z]+\d+|[\d.]+|"[^"]*")$/);
    if (!m) return !!cStr;
    const lv = /^[A-Z]+\d+$/.test(m[1]) ? cellRaw(m[1]) : m[1].replace(/^"|"$/g, '');
    const rv = /^[A-Z]+\d+$/.test(m[3]) ? cellRaw(m[3]) : m[3].replace(/^"|"$/g, '');
    const l = parseFloat(lv) || lv, r = parseFloat(rv) || rv;
    switch (m[2]) { case '>': return l > r; case '<': return l < r; case '>=': return l >= r; case '<=': return l <= r; case '<>': return l !== r; default: return l == r; }
  };

  // Match for single-arg functions
  const m1 = (name) => { const r = new RegExp(`^${name}\\((.+)\\)$`); const m = expr.match(r); return m ? m[1] : null; };

  try {
    // ── MATH & STATS ──────────────────────────────────────────
    if (m1('SUM')) { const a = m1('SUM'); return getVals(a).reduce((x,y)=>x+y,0).toString(); }
    if (m1('AVERAGE') || m1('AVG')) { const a = m1('AVERAGE') || m1('AVG'); const v = getVals(a); return (v.reduce((x,y)=>x+y,0)/v.length).toFixed(4).replace(/\.?0+$/,''); }
    if (m1('AVERAGEIF')) { /* skip advanced */ }
    if (m1('MAX')) { return Math.max(...getVals(m1('MAX'))).toString(); }
    if (m1('MIN')) { return Math.min(...getVals(m1('MIN'))).toString(); }
    if (m1('MEDIAN')) { const v = [...getVals(m1('MEDIAN'))].sort((a,b)=>a-b); const mid = Math.floor(v.length/2); return v.length%2 ? v[mid].toString() : ((v[mid-1]+v[mid])/2).toString(); }
    if (m1('MODE')) { const v = getVals(m1('MODE')); const freq = {}; v.forEach(x=>{freq[x]=(freq[x]||0)+1;}); return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? ''; }
    if (m1('STDEV') || m1('STDEVP')) { const v = getVals(m1('STDEV') || m1('STDEVP')); const mean = v.reduce((a,b)=>a+b,0)/v.length; return Math.sqrt(v.reduce((s,x)=>s+(x-mean)**2,0)/v.length).toFixed(4).replace(/\.?0+$/,''); }
    if (m1('VAR')) { const v = getVals(m1('VAR')); const mean = v.reduce((a,b)=>a+b,0)/v.length; return (v.reduce((s,x)=>s+(x-mean)**2,0)/v.length).toFixed(4).replace(/\.?0+$/,''); }
    if (m1('COUNT')) { return getVals(m1('COUNT')).filter(v=>!isNaN(v)&&v!==0).length.toString(); }
    if (m1('COUNTA')) { return getRaws(m1('COUNTA')).filter(v=>v!=='').length.toString(); }
    if (m1('COUNTBLANK')) { return getRaws(m1('COUNTBLANK')).filter(v=>v==='').length.toString(); }
    if (m1('PRODUCT')) { return getVals(m1('PRODUCT')).reduce((a,b)=>a*b,1).toString(); }
    if (m1('SUMPRODUCT')) { const args = splitArgs(m1('SUMPRODUCT')); const arrays = args.map(a=>getVals(a)); const len = Math.min(...arrays.map(a=>a.length)); let sum=0; for(let i=0;i<len;i++) sum+=arrays.reduce((p,a)=>p*a[i],1); return sum.toString(); }
    if (m1('LARGE')) { const [rng, k] = splitArgs(m1('LARGE')); const v = [...getVals(rng)].sort((a,b)=>b-a); return (v[parseInt(k)-1]||0).toString(); }
    if (m1('SMALL')) { const [rng, k] = splitArgs(m1('SMALL')); const v = [...getVals(rng)].sort((a,b)=>a-b); return (v[parseInt(k)-1]||0).toString(); }
    if (m1('RANK')) { const [ref, rng] = splitArgs(m1('RANK')); const val = /^[A-Z]+\d+$/.test(ref) ? cellVal(ref) : parseFloat(ref); const v = [...getVals(rng)].sort((a,b)=>b-a); return (v.indexOf(val)+1).toString(); }
    if (m1('ROUND')) { const [v, d] = splitArgs(m1('ROUND')); const num = /^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v); const dec = parseFloat(d)||0; return num.toFixed(dec); }
    if (m1('ROUNDUP')) { const [v, d] = splitArgs(m1('ROUNDUP')); const num = /^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v); const dec = parseFloat(d)||0; return (Math.ceil(num*10**dec)/10**dec).toFixed(dec); }
    if (m1('ROUNDDOWN')) { const [v, d] = splitArgs(m1('ROUNDDOWN')); const num = /^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v); const dec = parseFloat(d)||0; return (Math.floor(num*10**dec)/10**dec).toFixed(dec); }
    if (m1('FLOOR')) { const [v, sig] = splitArgs(m1('FLOOR')); const num = /^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v); const s = parseFloat(sig)||1; return (Math.floor(num/s)*s).toString(); }
    if (m1('CEILING')) { const [v, sig] = splitArgs(m1('CEILING')); const num = /^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v); const s = parseFloat(sig)||1; return (Math.ceil(num/s)*s).toString(); }
    if (m1('INT')) { const v = m1('INT'); return Math.floor(/^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v)).toString(); }
    if (m1('ABS')) { const v = m1('ABS'); return Math.abs(/^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v)).toString(); }
    if (m1('SQRT')) { const v = m1('SQRT'); return Math.sqrt(/^[A-Z]+\d+$/.test(v) ? cellVal(v) : parseFloat(v)).toFixed(6).replace(/\.?0+$/,''); }
    if (m1('POWER') || m1('POW')) { const [b,e] = splitArgs(m1('POWER')||m1('POW')); return Math.pow(/^[A-Z]+\d+$/.test(b)?cellVal(b):parseFloat(b), parseFloat(e)).toString(); }
    if (m1('MOD')) { const [a,b] = splitArgs(m1('MOD')); return (/^[A-Z]+\d+$/.test(a)?cellVal(a):parseFloat(a)) % (/^[A-Z]+\d+$/.test(b)?cellVal(b):parseFloat(b)).toString(); }
    if (m1('LOG')) { const [v, base] = splitArgs(m1('LOG')); const n = /^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v); return (Math.log(n)/Math.log(parseFloat(base)||10)).toFixed(6).replace(/\.?0+$/,''); }
    if (m1('LOG10')) { const v = m1('LOG10'); return Math.log10(/^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v)).toFixed(6).replace(/\.?0+$/,''); }
    if (m1('LN')) { const v = m1('LN'); return Math.log(/^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v)).toFixed(6).replace(/\.?0+$/,''); }
    if (m1('EXP')) { const v = m1('EXP'); return Math.exp(/^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v)).toFixed(6).replace(/\.?0+$/,''); }
    if (m1('PI')) { return Math.PI.toString(); }
    if (m1('RAND') || expr === 'RAND()') { return Math.random().toFixed(6); }
    if (m1('RANDBETWEEN')) { const [lo,hi] = splitArgs(m1('RANDBETWEEN')); return (Math.floor(Math.random()*(parseFloat(hi)-parseFloat(lo)+1))+parseFloat(lo)).toString(); }
    if (m1('TRUNC')) { const [v] = splitArgs(m1('TRUNC')); return Math.trunc(/^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v)).toString(); }
    if (m1('SIGN')) { const v = m1('SIGN'); const n=/^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v); return (n>0?1:n<0?-1:0).toString(); }

    // ── TEXT ─────────────────────────────────────────────────
    if (m1('CONCATENATE') || m1('CONCAT')) { const a = m1('CONCATENATE')||m1('CONCAT'); return getRaws(a).join(''); }
    if (expr.includes('&')) { return expr.split('&').map(p=>{ p=p.trim(); if(/^[A-Z]+\d+$/.test(p)) return cellRaw(p); if(/^".*"$/.test(p)) return p.slice(1,-1); return p; }).join(''); }
    if (m1('LEFT')) { const [v, n] = splitArgs(m1('LEFT')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.slice(0, parseInt(n)||1); }
    if (m1('RIGHT')) { const [v, n] = splitArgs(m1('RIGHT')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.slice(-(parseInt(n)||1)); }
    if (m1('MID')) { const [v, st, n] = splitArgs(m1('MID')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.slice(parseInt(st)-1, parseInt(st)-1+parseInt(n)); }
    if (m1('LEN')) { const v = m1('LEN'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.length.toString(); }
    if (m1('UPPER')) { const v = m1('UPPER'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.toUpperCase(); }
    if (m1('LOWER')) { const v = m1('LOWER'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.toLowerCase(); }
    if (m1('PROPER')) { const v = m1('PROPER'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()); }
    if (m1('TRIM')) { const v = m1('TRIM'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.trim(); }
    if (m1('SUBSTITUTE')) { const [v, old, nw] = splitArgs(m1('SUBSTITUTE')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.replaceAll(old.replace(/^"|"$/g,''), nw.replace(/^"|"$/g,'')); }
    if (m1('REPLACE')) { const [v, st, n, nw] = splitArgs(m1('REPLACE')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.slice(0,parseInt(st)-1)+nw.replace(/^"|"$/g,'')+s.slice(parseInt(st)-1+parseInt(n)); }
    if (m1('FIND')) { const [find, src] = splitArgs(m1('FIND')); const f = find.replace(/^"|"$/g,''); const s = /^[A-Z]+\d+$/.test(src)?cellRaw(src):src.replace(/^"|"$/g,''); return (s.indexOf(f)+1).toString(); }
    if (m1('SEARCH')) { const [find, src] = splitArgs(m1('SEARCH')); const f = find.replace(/^"|"$/g,'').toLowerCase(); const s = (/^[A-Z]+\d+$/.test(src)?cellRaw(src):src.replace(/^"|"$/g,'')).toLowerCase(); return (s.indexOf(f)+1).toString(); }
    if (m1('TEXT')) { const [v, fmt2] = splitArgs(m1('TEXT')); const n = /^[A-Z]+\d+$/.test(v)?cellVal(v):parseFloat(v); const f = fmt2.replace(/^"|"$/g,''); if(f.includes('%')) return (n*100).toFixed(0)+'%'; if(f.includes('.00')) return n.toFixed(2); return n.toString(); }
    if (m1('VALUE')) { const v = m1('VALUE'); return parseFloat(/^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,'')).toString(); }
    if (m1('REPT')) { const [v, n] = splitArgs(m1('REPT')); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return s.repeat(parseInt(n)||0); }
    if (m1('CHAR')) { return String.fromCharCode(parseInt(m1('CHAR'))||0); }
    if (m1('CODE')) { const v = m1('CODE'); const s = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,''); return (s.charCodeAt(0)||0).toString(); }
    if (m1('EXACT')) { const [a,b] = splitArgs(m1('EXACT')); const sa=/^[A-Z]+\d+$/.test(a)?cellRaw(a):a.replace(/^"|"$/g,''); const sb=/^[A-Z]+\d+$/.test(b)?cellRaw(b):b.replace(/^"|"$/g,''); return (sa===sb)?'TRUE':'FALSE'; }
    if (m1('TEXTJOIN')) { const [delim, , ...rest] = splitArgs(m1('TEXTJOIN')); const d = delim.replace(/^"|"$/g,''); return rest.flatMap(a=>getRaws(a)).filter(v=>v!=='').join(d); }

    // ── LOGICAL ──────────────────────────────────────────────
    if (m1('IF')) {
      const args = splitArgs(m1('IF'));
      const [cond, tv, fv] = args;
      return evalCond(cond) ? (tv||'').replace(/^"|"$/g,'') : (fv||'').replace(/^"|"$/g,'');
    }
    if (m1('IFS')) {
      const args = splitArgs(m1('IFS'));
      for (let i = 0; i < args.length - 1; i += 2) if (evalCond(args[i])) return args[i+1].replace(/^"|"$/g,'');
      return '#N/A';
    }
    if (m1('AND')) { return splitArgs(m1('AND')).every(a=>evalCond(a)) ? 'TRUE' : 'FALSE'; }
    if (m1('OR')) { return splitArgs(m1('OR')).some(a=>evalCond(a)) ? 'TRUE' : 'FALSE'; }
    if (m1('NOT')) { return !evalCond(m1('NOT')) ? 'TRUE' : 'FALSE'; }
    if (m1('IFERROR')) { const [v, fallback] = splitArgs(m1('IFERROR')); try { const res = v.startsWith('=') ? evaluateFormula(v, rows) : (/^[A-Z]+\d+$/.test(v)?cellRaw(v):v); return res === '#ERR' ? fallback.replace(/^"|"$/g,'') : res; } catch { return fallback.replace(/^"|"$/g,''); } }
    if (m1('IFNA')) { const [v, fallback] = splitArgs(m1('IFNA')); const res = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v; return res === '#N/A' ? fallback.replace(/^"|"$/g,'') : res; }
    if (m1('SWITCH')) { const args = splitArgs(m1('SWITCH')); const val = /^[A-Z]+\d+$/.test(args[0])?cellRaw(args[0]):args[0]; for(let i=1;i<args.length-1;i+=2) if(val===args[i].replace(/^"|"$/g,'')) return args[i+1].replace(/^"|"$/g,''); return args[args.length-1].replace(/^"|"$/g,''); }
    if (m1('ISBLANK')) { const v = m1('ISBLANK'); return (/^[A-Z]+\d+$/.test(v)?cellRaw(v):v)==='' ? 'TRUE' : 'FALSE'; }
    if (m1('ISNUMBER')) { const v = m1('ISNUMBER'); const raw = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v; return !isNaN(parseFloat(raw)) ? 'TRUE' : 'FALSE'; }
    if (m1('ISTEXT')) { const v = m1('ISTEXT'); const raw = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v; return isNaN(parseFloat(raw)) && raw !== '' ? 'TRUE' : 'FALSE'; }
    if (m1('ISERROR')) { const v = m1('ISERROR'); const raw = /^[A-Z]+\d+$/.test(v)?cellRaw(v):v; return raw === '#ERR' || raw === '#N/A' ? 'TRUE' : 'FALSE'; }
    if (expr === 'TRUE()' || expr === 'TRUE') return 'TRUE';
    if (expr === 'FALSE()' || expr === 'FALSE') return 'FALSE';

    // ── LOOKUP ───────────────────────────────────────────────
    if (m1('VLOOKUP')) {
      const [lookup, range, colIdx] = splitArgs(m1('VLOOKUP'));
      const lv = /^[A-Z]+\d+$/.test(lookup)?cellRaw(lookup):lookup.replace(/^"|"$/g,'');
      const parseRef2 = (r) => { const m = r.trim().match(/^([A-Z]+)(\d+)$/); return { c: m[1].length===1?m[1].charCodeAt(0)-65:(m[1].charCodeAt(0)-64)*26+m[1].charCodeAt(1)-65, r: parseInt(m[2])-1 }; };
      if (range.includes(':')) {
        const [s, e] = range.split(':'); const sr = parseRef2(s), er = parseRef2(e);
        const ci = parseInt(colIdx) - 1;
        for (let r = sr.r; r <= er.r; r++) {
          const first = rows[r]?.[sr.c]?.value ?? '';
          if (first === lv || parseFloat(first) === parseFloat(lv)) { return rows[r]?.[sr.c + ci]?.value ?? '#N/A'; }
        }
      }
      return '#N/A';
    }
    if (m1('HLOOKUP')) {
      const [lookup, range, rowIdx] = splitArgs(m1('HLOOKUP'));
      const lv = /^[A-Z]+\d+$/.test(lookup)?cellRaw(lookup):lookup.replace(/^"|"$/g,'');
      const parseRef2 = (r) => { const m = r.trim().match(/^([A-Z]+)(\d+)$/); return { c: m[1].length===1?m[1].charCodeAt(0)-65:(m[1].charCodeAt(0)-64)*26+m[1].charCodeAt(1)-65, r: parseInt(m[2])-1 }; };
      if (range.includes(':')) {
        const [s, e] = range.split(':'); const sr = parseRef2(s), er = parseRef2(e);
        const ri = parseInt(rowIdx) - 1;
        for (let c = sr.c; c <= er.c; c++) {
          const first = rows[sr.r]?.[c]?.value ?? '';
          if (first === lv || parseFloat(first) === parseFloat(lv)) { return rows[sr.r + ri]?.[c]?.value ?? '#N/A'; }
        }
      }
      return '#N/A';
    }
    if (m1('INDEX')) {
      const [range, rowNum, colNum] = splitArgs(m1('INDEX'));
      const parseRef2 = (r) => { const m = r.trim().match(/^([A-Z]+)(\d+)$/); return { c: m[1].length===1?m[1].charCodeAt(0)-65:(m[1].charCodeAt(0)-64)*26+m[1].charCodeAt(1)-65, r: parseInt(m[2])-1 }; };
      if (range.includes(':')) { const [s] = range.split(':'); const sr = parseRef2(s); const r = sr.r + (parseInt(rowNum)||1) - 1; const c = sr.c + (parseInt(colNum||1)||1) - 1; return rows[r]?.[c]?.value ?? ''; }
      return '';
    }
    if (m1('MATCH')) {
      const [lookup, range] = splitArgs(m1('MATCH'));
      const lv = /^[A-Z]+\d+$/.test(lookup)?cellRaw(lookup):lookup.replace(/^"|"$/g,'');
      const raws = getRaws(range);
      const idx = raws.findIndex(v => v === lv || parseFloat(v) === parseFloat(lv));
      return idx >= 0 ? (idx + 1).toString() : '#N/A';
    }
    if (m1('CHOOSE')) { const [idx, ...opts] = splitArgs(m1('CHOOSE')); const i = parseInt(/^[A-Z]+\d+$/.test(idx)?cellVal(idx):idx); return (opts[i-1]||'').replace(/^"|"$/g,''); }

    // ── CONDITIONAL AGGREGATES ──────────────────────────────
    if (m1('COUNTIF')) {
      const [range, criterion] = splitArgs(m1('COUNTIF'));
      const raws = getRaws(range);
      const crit = /^[A-Z]+\d+$/.test(criterion)?cellRaw(criterion):criterion.replace(/^"|"$/g,'');
      const op = crit.match(/^([><=!]{1,2})(.+)$/);
      if (op) { const num = parseFloat(op[2]); return raws.filter(v=>{ const n=parseFloat(v); switch(op[1]){case '>':return n>num;case '<':return n<num;case '>=':return n>=num;case '<=':return n<=num;case '<>':return n!==num;default:return n===num;} }).length.toString(); }
      return raws.filter(v=>v===crit).length.toString();
    }
    if (m1('SUMIF')) {
      const [range, criterion, sumRange] = splitArgs(m1('SUMIF'));
      const raws = getRaws(range); const sumVals = getVals(sumRange||range);
      const crit = /^[A-Z]+\d+$/.test(criterion)?cellRaw(criterion):criterion.replace(/^"|"$/g,'');
      return raws.reduce((sum,v,i)=>v===crit?sum+(sumVals[i]||0):sum,0).toString();
    }

    // ── DATE & TIME ──────────────────────────────────────────
    if (expr === 'TODAY()' || expr === 'TODAY') { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    if (expr === 'NOW()' || expr === 'NOW') { return new Date().toLocaleString(); }
    if (m1('YEAR')) { const v = m1('YEAR'); const d=new Date(/^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,'')); return isNaN(d)?'#ERR':d.getFullYear().toString(); }
    if (m1('MONTH')) { const v = m1('MONTH'); const d=new Date(/^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,'')); return isNaN(d)?'#ERR':(d.getMonth()+1).toString(); }
    if (m1('DAY')) { const v = m1('DAY'); const d=new Date(/^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,'')); return isNaN(d)?'#ERR':d.getDate().toString(); }
    if (m1('WEEKDAY')) { const v = splitArgs(m1('WEEKDAY'))[0]; const d=new Date(/^[A-Z]+\d+$/.test(v)?cellRaw(v):v.replace(/^"|"$/g,'')); return isNaN(d)?'#ERR':(d.getDay()+1).toString(); }
    if (m1('DATE')) { const [y,mo,d]=splitArgs(m1('DATE')).map(Number); const dt=new Date(y,mo-1,d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
    if (m1('DATEDIF') || m1('DAYS')) { const args=splitArgs(m1('DATEDIF')||m1('DAYS')); const d1=new Date(args[0].replace(/^"|"$/g,'')), d2=new Date(args[1].replace(/^"|"$/g,'')); return Math.round((d2-d1)/86400000).toString(); }
    if (m1('EDATE')) { const [d,n]=splitArgs(m1('EDATE')); const dt=new Date(/^[A-Z]+\d+$/.test(d)?cellRaw(d):d.replace(/^"|"$/g,'')); dt.setMonth(dt.getMonth()+parseInt(n)); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

    // ── FINANCIAL ───────────────────────────────────────────
    if (m1('PMT')) { const [rate,nper,pv]=splitArgs(m1('PMT')).map(a=>/^[A-Z]+\d+$/.test(a)?cellVal(a):parseFloat(a)); const r=rate; return r===0?(-pv/nper).toFixed(2):(-(pv*r*Math.pow(1+r,nper))/(Math.pow(1+r,nper)-1)).toFixed(2); }
    if (m1('FV')) { const [rate,nper,pmt,pv]=splitArgs(m1('FV')).map(a=>/^[A-Z]+\d+$/.test(a)?cellVal(a):parseFloat(a||0)); return (Math.pow(1+rate,nper)*(pv||0)+pmt*((Math.pow(1+rate,nper)-1)/rate)).toFixed(2); }
    if (m1('PV')) { const [rate,nper,pmt]=splitArgs(m1('PV')).map(a=>/^[A-Z]+\d+$/.test(a)?cellVal(a):parseFloat(a)); return (pmt*((1-Math.pow(1+rate,-nper))/rate)).toFixed(2); }
    if (m1('NPV')) { const args=splitArgs(m1('NPV')); const rate=/^[A-Z]+\d+$/.test(args[0])?cellVal(args[0]):parseFloat(args[0]); const cashflows=getVals(args.slice(1).join(',')); return cashflows.reduce((sum,cf,i)=>sum+cf/Math.pow(1+rate,i+1),0).toFixed(2); }
    if (m1('RATE')) { return '#N/A (use PMT)'; }
    if (m1('NPER')) { const [rate,pmt,pv]=splitArgs(m1('NPER')).map(a=>parseFloat(a)); return (Math.log(-pmt/(-pmt+rate*pv))/Math.log(1+rate)).toFixed(2); }
    if (m1('SLN')) { const [cost,salvage,life]=splitArgs(m1('SLN')).map(a=>parseFloat(a)); return ((cost-salvage)/life).toFixed(2); }
    if (m1('YIELD') || m1('IRR')) { return '#CALC (complex)'; }
    if (m1('PERCENTILE')) { const [rng,k]=splitArgs(m1('PERCENTILE')); const v=[...getVals(rng)].sort((a,b)=>a-b); const pct=parseFloat(k); const idx=pct*(v.length-1); const lo=Math.floor(idx); return (v[lo]+(v[lo+1]||v[lo]-v[lo])*(idx-lo)).toFixed(4).replace(/\.?0+$/,''); }
    if (m1('QUARTILE')) { const [rng,q]=splitArgs(m1('QUARTILE')); const v=[...getVals(rng)].sort((a,b)=>a-b); const pct=[0,0.25,0.5,0.75,1][parseInt(q)]; const idx=pct*(v.length-1); const lo=Math.floor(idx); return (v[lo]+(v[lo+1]||v[lo]-v[lo])*(idx-lo)).toFixed(4).replace(/\.?0+$/,''); }

    // ── SIMPLE ARITHMETIC with cell refs ────────────────────
    const resolved = expr.replace(/([A-Z]+\d+)/g, (_, ref) => cellVal(ref));
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