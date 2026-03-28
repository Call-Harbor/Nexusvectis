import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GitBranch, Loader2, RefreshCw, CheckCircle } from "lucide-react";

const STATUS_COLOR = { open: "#10b981", occupied: "#f59e0b", maintenance: "#f97316", closed: "#64748b" };
const TYPE_ICON = { jetbridge: "🛬", bus_gate: "🚌", remote_stand: "🅿️" };

export default function GateAllocationAI({ gates, flights }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));
  const occupiedGates = gates.filter(g => g.status === "occupied").length;
  const openGates = gates.filter(g => g.status === "open").length;

  const runAllocation = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Gate Allocation AI. Optimize gate assignments.

Current state:
- Total gates: ${gates.length}
- Occupied: ${occupiedGates} | Open: ${openGates} | Maintenance: ${gates.filter(g => g.status === "maintenance").length}
- Active/upcoming flights: ${flights.filter(f => !["cancelled","completed"].includes(f.status)).length}
- Delayed flights: ${flights.filter(f => (f.delay_minutes || 0) > 10).map(f => `${f.flight_number}(+${f.delay_minutes}m)`).join(", ") || "none"}
- Schengen flights: ${flights.filter(f => f.schengen).length} | Non-Schengen: ${flights.filter(f => !f.schengen).length}
- Wide-body flights: ${flights.filter(f => ["B777","B787","A330","A350","A380","B747"].some(t => f.aircraft_type?.includes(t))).length}

Return JSON:
- summary: string (2 sentences on current state)
- conflicts: array of {flight_number: string, issue: string, severity: "low"|"medium"|"high"} (max 4)
- reassignments: array of {flight_number: string, current_gate: string, suggested_gate: string, reason: string} (max 5)
- optimizations: array of strings (3 actionable tips)
- utilization_pct: number
- efficiency_score: number (0-100)`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            conflicts: { type: "array", items: { type: "object", properties: { flight_number: { type: "string" }, issue: { type: "string" }, severity: { type: "string" } } } },
            reassignments: { type: "array", items: { type: "object", properties: { flight_number: { type: "string" }, current_gate: { type: "string" }, suggested_gate: { type: "string" }, reason: { type: "string" } } } },
            optimizations: { type: "array", items: { type: "string" } },
            utilization_pct: { type: "number" },
            efficiency_score: { type: "number" }
          }
        }
      });
      setPlan(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sevColor = { low: "#10b981", medium: "#f59e0b", high: "#f43f5e" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.6)" }}>
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-violet-400">GATE & STAND ALLOCATION AI</h2>
            <p className="text-[9px] text-slate-500">{occupiedGates} occupied · {openGates} available · {gates.length} total</p>
          </div>
        </div>
        <button onClick={runAllocation} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Optimizing...</> : <><RefreshCw className="w-3.5 h-3.5" />Run AI Optimizer</>}
        </button>
      </div>

      {/* Gate grid */}
      <div className="rounded-xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(0,10,25,0.5)" }}>
        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-3">GATE STATUS GRID</p>
        <div className="flex flex-wrap gap-2">
          {gates.map(g => {
            const flight = g.current_flight_id ? flightMap[g.current_flight_id] : null;
            const color = STATUS_COLOR[g.status] || "#64748b";
            return (
              <div key={g.id} className="relative rounded-lg px-2.5 py-2 min-w-[70px] text-center cursor-pointer hover:opacity-80 transition-all"
                style={{ border: `1px solid ${color}40`, background: `${color}10` }}>
                <p className="text-[10px] font-bold" style={{ color }}>{g.gate_code}</p>
                <p className="text-[8px] text-slate-500">{TYPE_ICON[g.gate_type] || "🚪"} {g.terminal}</p>
                {flight && <p className="text-[8px] text-slate-400 truncate">{flight.flight_number}</p>}
                {g.pax_waiting > 0 && <p className="text-[8px]" style={{ color: "#f59e0b" }}>{g.pax_waiting} pax</p>}
              </div>
            );
          })}
          {gates.length === 0 && <p className="text-slate-600 text-xs">No gates configured</p>}
        </div>
      </div>

      {plan && (
        <div className="space-y-4">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Efficiency Score</p>
              <p className="text-2xl font-bold text-violet-400">{plan.efficiency_score}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Utilization</p>
              <p className="text-2xl font-bold text-cyan-400">{plan.utilization_pct}%</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Conflicts Found</p>
              <p className="text-2xl font-bold text-red-400">{plan.conflicts?.length || 0}</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 px-1">{plan.summary}</p>

          {plan.conflicts?.length > 0 && (
            <div className="rounded-xl p-3 space-y-2" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-red-400 mb-2">CONFLICTS</p>
              {plan.conflicts.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.flight_number}</span>
                  <span className="text-[10px] text-slate-300">{c.issue}</span>
                </div>
              ))}
            </div>
          )}

          {plan.reassignments?.length > 0 && (
            <div className="rounded-xl p-3 space-y-2" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-violet-400 mb-2">SUGGESTED REASSIGNMENTS</p>
              {plan.reassignments.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="text-violet-400 font-bold">{r.flight_number}</span>
                  <span className="text-slate-500">{r.current_gate || "?"}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-cyan-400 font-bold">{r.suggested_gate}</span>
                  <span className="text-slate-400 flex-1">{r.reason}</span>
                </div>
              ))}
            </div>
          )}

          {plan.optimizations?.length > 0 && (
            <div className="rounded-xl p-3 space-y-1.5" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 mb-2">OPTIMIZATION TIPS</p>
              {plan.optimizations.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-300">{o}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}