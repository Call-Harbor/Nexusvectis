import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, AlertTriangle, CheckCircle } from "lucide-react";

const CRANE_TYPE_COLOR = { STS: "#06b6d4", RTG: "#8b5cf6", RMG: "#10b981", mobile: "#f59e0b", reachstacker: "#f97316" };
const STATUS_COLOR = { available: "#10b981", working: "#06b6d4", maintenance: "#f59e0b", breakdown: "#f43f5e", standby: "#64748b" };

export default function CraneSchedulingAI({ cranes, portCalls, berths, yardZones, orgId }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCrane, setSelectedCrane] = useState(null);

  const berthMap = Object.fromEntries(berths.map(b => [b.id, b]));
  const activeCalls = portCalls.filter(p => ["berthed", "operations"].includes(p.status));
  const totalMovesToday = cranes.reduce((s, c) => s + (c.total_moves_today || 0), 0);
  const avgUtil = cranes.length ? Math.round(cranes.reduce((s, c) => s + (c.utilization_pct || 0), 0) / cranes.length) : 0;
  const breakdowns = cranes.filter(c => c.status === "breakdown").length;

  const runScheduler = async () => {
    setLoading(true);
    setSchedule(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Crane Scheduling AI for a container terminal. Optimize crane-to-vessel assignments.

Cranes (${cranes.length} total):
${cranes.map(c => `  ${c.name} [${c.type}]: status=${c.status}, moves/h=${c.moves_per_hour || "?"}, today=${c.total_moves_today || 0} moves, util=${c.utilization_pct || 0}%, berth=${berthMap[c.berth_id]?.name || "unassigned"}`).join("\n")}

Active port calls (${activeCalls.length}):
${activeCalls.map(p => `  Call ${p.call_number || p.id}: ${p.total_moves || 0} moves total, ${p.completed_moves || 0} done, cranes=${(p.assigned_cranes || []).length}, priority=${p.priority}`).join("\n")}

Return JSON with:
- overall_throughput_gain_pct: number
- assignments: array of max 8 {crane_name, vessel_call_id, task ("loading"|"unloading"|"yard_move"|"standby"), priority ("critical"|"high"|"normal"), estimated_moves, start_offset_minutes, parallel_operations (string|null), efficiency_gain_pct}
- repositioning_savings: number
- bottlenecks: array of 3 strings
- sequence_optimizations: array of 3 strings
- breakdown_contingency: string
- energy_savings_kwh: number`,
        response_json_schema: {
          type: "object", properties: {
            overall_throughput_gain_pct: { type: "number" },
            assignments: { type: "array", items: { type: "object", properties: { crane_name: { type: "string" }, vessel_call_id: { type: "string" }, task: { type: "string" }, priority: { type: "string" }, estimated_moves: { type: "number" }, start_offset_minutes: { type: "number" }, parallel_operations: { type: "string" }, efficiency_gain_pct: { type: "number" } } } },
            repositioning_savings: { type: "number" },
            bottlenecks: { type: "array", items: { type: "string" } },
            sequence_optimizations: { type: "array", items: { type: "string" } },
            breakdown_contingency: { type: "string" },
            energy_savings_kwh: { type: "number" }
          }
        }
      });
      setSchedule(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const prioColor = { critical: "#f43f5e", high: "#f59e0b", normal: "#10b981" };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Cranes", val: cranes.length, color: "#06b6d4" },
          { label: "Working", val: cranes.filter(c => c.status === "working").length, color: "#10b981" },
          { label: "Breakdowns", val: breakdowns, color: breakdowns > 0 ? "#f43f5e" : "#10b981" },
          { label: "Moves Today", val: totalMovesToday.toLocaleString(), color: "#8b5cf6" },
          { label: "Avg Utilization", val: `${avgUtil}%`, color: avgUtil > 80 ? "#f43f5e" : avgUtil > 60 ? "#f59e0b" : "#10b981" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Crane list */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(0,10,25,0.5)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400">CRANE STATUS</p>
            <button onClick={runScheduler} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Optimizing...</> : <><Zap className="w-3 h-3" />AI Schedule</>}
            </button>
          </div>
          <div className="space-y-1.5">
            {cranes.length === 0 && <p className="text-slate-600 text-xs text-center py-4">No cranes registered</p>}
            {cranes.map(c => {
              const isSelected = selectedCrane?.id === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedCrane(isSelected ? null : c)}
                  className="w-full text-left rounded-lg p-2.5 transition-all"
                  style={{ background: isSelected ? "rgba(6,182,212,0.1)" : "rgba(15,23,42,0.5)", border: `1px solid ${isSelected ? "rgba(6,182,212,0.4)" : "rgba(30,41,59,0.6)"}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-white">{c.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold"
                      style={{ background: `${STATUS_COLOR[c.status] || "#64748b"}15`, color: STATUS_COLOR[c.status] || "#64748b" }}>{c.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-slate-500">
                    <span className="font-bold" style={{ color: CRANE_TYPE_COLOR[c.type] || "#64748b" }}>{c.type}</span>
                    <span>{c.moves_per_hour || "?"}m/h</span>
                    <span className="ml-auto">{c.total_moves_today || 0} today</span>
                  </div>
                  {(c.utilization_pct || 0) > 0 && (
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.utilization_pct)}%`, background: (c.utilization_pct || 0) > 85 ? "#f43f5e" : "#06b6d4" }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Crane detail */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(139,92,246,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-violet-400 mb-3">CRANE DETAILS</p>
          {selectedCrane ? (
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: `${CRANE_TYPE_COLOR[selectedCrane.type] || "#64748b"}15`, border: `1px solid ${CRANE_TYPE_COLOR[selectedCrane.type] || "#64748b"}30` }}>🏗️</div>
                <div>
                  <p className="font-bold text-white">{selectedCrane.name}</p>
                  <p className="text-[9px]" style={{ color: CRANE_TYPE_COLOR[selectedCrane.type] || "#64748b" }}>{selectedCrane.type}</p>
                </div>
              </div>
              {[
                { label: "Status", val: selectedCrane.status, color: STATUS_COLOR[selectedCrane.status] },
                { label: "Max moves/h", val: selectedCrane.moves_per_hour || "—" },
                { label: "Current moves/h", val: selectedCrane.current_moves_per_hour || "—", color: "#06b6d4" },
                { label: "Moves today", val: selectedCrane.total_moves_today || 0, color: "#8b5cf6" },
                { label: "Utilization", val: `${selectedCrane.utilization_pct || 0}%`, color: (selectedCrane.utilization_pct || 0) > 80 ? "#f43f5e" : "#10b981" },
                { label: "Energy kWh", val: selectedCrane.energy_kwh_today || 0 },
                { label: "Outreach (m)", val: selectedCrane.outreach_m || "—" },
                { label: "Max lift (t)", val: selectedCrane.max_lift_tons || "—" },
                { label: "Next maintenance", val: selectedCrane.next_maintenance || "—" },
                { label: "Berth", val: berthMap[selectedCrane.berth_id]?.name || "Unassigned" },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-semibold" style={{ color: row.color || "white" }}>{row.val}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-600 text-xs text-center py-8">Select a crane for details</p>
        </div>

        {/* AI result */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 mb-3">AI SCHEDULE RESULT</p>
          {loading && <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>}
          {!loading && !schedule && <p className="text-slate-600 text-xs text-center py-8">Click "AI Schedule" to optimize</p>}
          {schedule && !loading && (
            <div className="space-y-3">
              <div className="rounded-lg p-3 text-center" style={{ border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
                <p className="text-[8px] uppercase text-slate-500">Throughput Gain</p>
                <p className="text-3xl font-bold text-emerald-400">+{schedule.overall_throughput_gain_pct}%</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 text-center" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.06)" }}>
                  <p className="text-[7px] uppercase text-slate-500">Repositioning Saved</p>
                  <p className="text-lg font-bold text-cyan-400">{schedule.repositioning_savings}</p>
                </div>
                <div className="rounded-lg p-2 text-center" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
                  <p className="text-[7px] uppercase text-slate-500">Energy Saved kWh</p>
                  <p className="text-lg font-bold text-emerald-400">{schedule.energy_savings_kwh}</p>
                </div>
              </div>
              {schedule.bottlenecks?.length > 0 && (
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-red-400 mb-1">BOTTLENECKS</p>
                  {schedule.bottlenecks.map((b, i) => (
                    <p key={i} className="text-[9px] text-slate-300 mb-0.5 flex gap-1"><AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />{b}</p>
                  ))}
                </div>
              )}
              {schedule.sequence_optimizations?.length > 0 && (
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-emerald-400 mb-1">SEQUENCE OPTIMIZATIONS</p>
                  {schedule.sequence_optimizations.map((s, i) => (
                    <p key={i} className="text-[9px] text-slate-300 mb-0.5 flex gap-1"><CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />{s}</p>
                  ))}
                </div>
              )}
              {schedule.breakdown_contingency && (
                <div className="rounded-lg p-2.5" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.06)" }}>
                  <p className="text-[8px] uppercase text-amber-400 mb-1">BREAKDOWN CONTINGENCY</p>
                  <p className="text-[9px] text-slate-300">{schedule.breakdown_contingency}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignments */}
      {schedule?.assignments?.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 mb-3">OPTIMIZED CRANE ASSIGNMENTS</p>
          <div className="grid grid-cols-4 gap-2">
            {schedule.assignments.map((a, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${prioColor[a.priority] || "#64748b"}25` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white">{a.crane_name}</span>
                  <span className="text-[8px] px-1 py-0.5 rounded uppercase font-bold"
                    style={{ background: `${prioColor[a.priority] || "#64748b"}20`, color: prioColor[a.priority] || "#64748b" }}>{a.priority}</span>
                </div>
                <p className="text-[8px] text-cyan-400 mb-1 capitalize">{a.task?.replace(/_/g, " ")}</p>
                <div className="space-y-0.5 text-[8px] text-slate-500">
                  <div className="flex justify-between"><span>Moves</span><span className="text-white">{a.estimated_moves}</span></div>
                  <div className="flex justify-between"><span>Start T+</span><span className="text-white">{a.start_offset_minutes}m</span></div>
                  <div className="flex justify-between"><span>Effekt</span><span className="text-emerald-400">+{a.efficiency_gain_pct}%</span></div>
                  {a.parallel_operations && <p className="text-violet-400 mt-1">∥ {a.parallel_operations}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}