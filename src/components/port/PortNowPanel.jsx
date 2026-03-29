import { useMemo } from "react";
import { Ship, Anchor, Zap, Package, Activity, AlertTriangle } from "lucide-react";
import moment from "moment";

const STATUS_COLOR = {
  planned:    "#64748b",
  approaching:"#f59e0b",
  berthed:    "#06b6d4",
  operations: "#10b981",
  completed:  "#8b5cf6",
  delayed:    "#f43f5e",
};

export default function PortNowPanel({ portCalls = [], cranes = [], yardZones = [], gates = [] }) {
  const active = portCalls.filter(pc => ["approaching","berthed","operations"].includes(pc.status));
  const upcoming = portCalls.filter(pc => pc.status === "planned").slice(0, 5);
  const avgYard = yardZones.length > 0
    ? Math.round(yardZones.reduce((s, z) => s + (z.utilization_pct || 0), 0) / yardZones.length)
    : 0;
  const cranesWorking = cranes.filter(c => c.status === "working").length;
  const cranesBroken = cranes.filter(c => c.status === "breakdown").length;

  return (
    <div className="w-72 flex-shrink-0 space-y-3">
      {/* Active Operations */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(6,182,212,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-cyan-400">ACTIVE OPERATIONS</p>
          <span className="ml-auto text-[9px] font-black text-cyan-300">{active.length}</span>
        </div>
        {active.length === 0 && (
          <p className="text-[10px] text-slate-600 text-center py-3">No active operations</p>
        )}
        {active.map(pc => {
          const color = STATUS_COLOR[pc.status] || "#64748b";
          return (
            <div key={pc.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: color }} />
                <span className="text-[10px] font-bold text-white truncate">{pc.id?.slice(-6).toUpperCase()}</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                {pc.status?.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Crane Status */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(51,65,85,0.3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-amber-400">CRANES</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "TOTAL", val: cranes.length, color: "#06b6d4" },
            { label: "ACTIVE", val: cranesWorking, color: "#10b981" },
            { label: "FAULT", val: cranesBroken, color: cranesBroken > 0 ? "#f43f5e" : "#334155" },
          ].map(k => (
            <div key={k.label} className="text-center rounded-xl p-2" style={{ background: `${k.color}08`, border: `1px solid ${k.color}20` }}>
              <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
              <p className="text-xl font-black leading-none" style={{ color: k.color }}>{k.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Yard Utilization */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(51,65,85,0.3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-3.5 h-3.5 text-violet-400" />
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-violet-400">YARD ZONES</p>
        </div>
        <div className="space-y-2">
          {yardZones.slice(0, 5).map(z => {
            const pct = z.utilization_pct || 0;
            const color = pct > 90 ? "#f43f5e" : pct > 75 ? "#f59e0b" : "#10b981";
            return (
              <div key={z.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-white font-bold truncate max-w-[100px]">{z.name}</span>
                  <span className="text-[9px] font-black font-mono" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
          {yardZones.length === 0 && <p className="text-[10px] text-slate-600 text-center py-2">No yard zones</p>}
        </div>
        {yardZones.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[8px] text-slate-600 uppercase tracking-widest">AVG LOAD</span>
            <span className="text-sm font-black" style={{ color: avgYard > 85 ? "#f43f5e" : avgYard > 70 ? "#f59e0b" : "#10b981" }}>{avgYard}%</span>
          </div>
        )}
      </div>

      {/* Upcoming Port Calls */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(51,65,85,0.3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Anchor className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-slate-400">UPCOMING CALLS</p>
        </div>
        {upcoming.length === 0 && <p className="text-[10px] text-slate-600 text-center py-2">No scheduled calls</p>}
        {upcoming.map(pc => (
          <div key={pc.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
            <span className="text-[9px] font-bold text-white">{pc.id?.slice(-6).toUpperCase()}</span>
            <span className="text-[9px] text-slate-500 font-mono">
              {pc.eta ? moment(pc.eta).format("DD/MM HH:mm") : "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}