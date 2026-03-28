import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Stepper({ value, onChange, min = 0, step = 1, color = "#06b6d4" }) {
  return (
    <div className="flex items-center gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(51,65,85,0.6)" }}>
      <button onPointerDown={e => { e.preventDefault(); onChange(Math.max(min, (value || 0) - step)); }}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold active:bg-slate-700 transition-colors"
        style={{ background: "rgba(30,41,59,0.9)", color: "#94a3b8" }}>−</button>
      <div className="flex-1 h-14 flex items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{value ?? 0}</span>
      </div>
      <button onPointerDown={e => { e.preventDefault(); onChange((value || 0) + step); }}
        className="w-14 h-14 flex items-center justify-center text-2xl font-bold active:bg-slate-700 transition-colors"
        style={{ background: "rgba(30,41,59,0.9)", color: "#94a3b8" }}>+</button>
    </div>
  );
}

export function Chips({ options, value, onChange, color = "#06b6d4", fmt = v => v }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} onPointerDown={e => { e.preventDefault(); onChange(o); }}
          className="h-11 px-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
          style={{ background: value === o ? `${color}30` : "rgba(30,41,59,0.7)", color: value === o ? color : "#64748b", border: `1.5px solid ${value === o ? color : "rgba(51,65,85,0.5)"}` }}>
          {fmt(o)}
        </button>
      ))}
    </div>
  );
}

export function StatusGrid({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <button key={o.val} onPointerDown={e => { e.preventDefault(); onChange(o.val); }}
          className="h-14 rounded-2xl text-sm font-bold transition-all active:scale-95"
          style={{ background: value === o.val ? `${o.color}25` : "rgba(20,30,50,0.6)", color: o.color, border: `2px solid ${value === o.val ? o.color : "rgba(51,65,85,0.4)"}` }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SaveBtn({ onClick, loading, color = "#06b6d4", label = "Gem ændringer" }) {
  return (
    <button onPointerDown={e => { e.preventDefault(); if (!loading) onClick(); }} disabled={loading}
      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all"
      style={{ background: `${color}20`, border: `2px solid ${color}60`, color }}>
      {loading ? <><RefreshCw className="w-5 h-5 animate-spin" />Gemmer...</> : <><CheckCircle2 className="w-5 h-5" />{label}</>}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {hint && <p className="text-xs" style={{ color: hint.color }}>{hint.text}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ color, isOpen, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${isOpen ? color : "rgba(51,65,85,0.4)"}`, background: "rgba(5,15,35,0.8)" }}>
      {children}
    </div>
  );
}

export function Loader() {
  return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-slate-600 animate-spin" /></div>;
}

export function Empty({ text }) {
  return <p className="text-slate-600 text-sm text-center py-12">{text}</p>;
}

export function AlertPill({ text, sev }) {
  const c = sev === "critical" ? "#f43f5e" : "#f59e0b";
  return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: `${c}10`, border: `1px solid ${c}30` }}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c }} />
      <span style={{ color: c }}>{text}</span>
    </div>
  );
}

export function KPI({ label, value, unit, color = "#06b6d4", alert }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: `${color}08`, border: `1.5px solid ${color}20` }}>
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color: alert ? "#f43f5e" : color }}>{value}</p>
      {unit && <p className="text-[10px] text-slate-500 mt-0.5">{unit}</p>}
    </div>
  );
}

export function SectionTitle({ label, color }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3" style={{ color }}>
      <span className="w-1 h-3 rounded-full inline-block" style={{ background: color }} />{label}
    </p>
  );
}