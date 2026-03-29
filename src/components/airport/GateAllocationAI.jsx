import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GitBranch, Loader2, RefreshCw, CheckCircle, AlertTriangle, Zap, ArrowRight } from "lucide-react";

const STATUS_COLOR = { open: "#10b981", occupied: "#f59e0b", maintenance: "#f97316", closed: "#f43f5e" };
const TYPE_ICON = { jetbridge: "🛬", bus_gate: "🚌", remote_stand: "🅿️" };

export default function GateAllocationAI({ gates, flights }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredGate, setHoveredGate] = useState(null);

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));
  const occupiedGates = gates.filter(g => g.status === "occupied").length;
  const openGates = gates.filter(g => g.status === "open").length;
  const maintenanceGates = gates.filter(g => g.status === "maintenance").length;
  const utilization = gates.length > 0 ? Math.round((occupiedGates / gates.length) * 100) : 0;

  const runAllocation = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Gate Allocation AI. Optimize gate assignments for maximum efficiency.

Current state:
- Total gates: ${gates.length} | Occupied: ${occupiedGates} | Open: ${openGates} | Maintenance: ${maintenanceGates}
- Utilization: ${utilization}%
- Active/upcoming flights: ${flights.filter(f => !["cancelled","completed"].includes(f.status)).length}
- Delayed flights: ${flights.filter(f => (f.delay_minutes || 0) > 10).map(f => `${f.flight_number}(+${f.delay_minutes}m)`).join(", ") || "none"}
- Schengen flights: ${flights.filter(f => f.schengen).length} | Non-Schengen: ${flights.filter(f => !f.schengen).length}
- Wide-body flights: ${flights.filter(f => ["B777","B787","A330","A350","A380","B747"].some(t => f.aircraft_type?.includes(t))).length}
- Boarding now: ${flights.filter(f => f.status === "boarding").map(f => `${f.flight_number} gate ${f.gate || "?"}`).join(", ") || "none"}

Gates detail:
${gates.slice(0, 15).map(g => `  ${g.gate_code}: ${g.status}, type:${g.gate_type}, terminal:${g.terminal}, schengen:${g.schengen}`).join("\n")}

Return JSON:
- summary: string (2 sentences)
- conflicts: array of {flight_number, issue, severity: "low"|"medium"|"high"} max 4
- reassignments: array of {flight_number, current_gate, suggested_gate, reason} max 5
- optimizations: array of 4 actionable strings
- utilization_pct: number
- efficiency_score: number 0-100
- gates_freed_potential: number`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            conflicts: { type: "array", items: { type: "object", properties: { flight_number: { type: "string" }, issue: { type: "string" }, severity: { type: "string" } } } },
            reassignments: { type: "array", items: { type: "object", properties: { flight_number: { type: "string" }, current_gate: { type: "string" }, suggested_gate: { type: "string" }, reason: { type: "string" } } } },
            optimizations: { type: "array", items: { type: "string" } },
            utilization_pct: { type: "number" },
            efficiency_score: { type: "number" },
            gates_freed_potential: { type: "number" }
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
      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{ border: "1.5px solid rgba(139,92,246,0.25)", background: "rgba(0,8,20,0.95)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-violet-400">GATE & STAND ALLOCATION AI</h2>
            <p className="text-[9px] text-slate-500">{occupiedGates} optaget · {openGates} ledig · {maintenanceGates} vedligehold · {gates.length} i alt</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Udnyttelse", val: `${utilization}%`, color: utilization > 85 ? "#f43f5e" : utilization > 60 ? "#f59e0b" : "#10b981" },
              { label: "Optaget", val: occupiedGates, color: "#f59e0b" },
              { label: "Ledige", val: openGates, color: "#10b981" },
            ].map(k => (
              <div key={k.label} className="text-center px-3 py-2 rounded-xl" style={{ background: `${k.color}08`, border: `1px solid ${k.color}20` }}>
                <p className="text-[7px] uppercase text-slate-600">{k.label}</p>
                <p className="text-lg font-black" style={{ color: k.color }}>{k.val}</p>
              </div>
            ))}
          </div>
          <button onClick={runAllocation} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(139,92,246,0.15)", border: "1.5px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Optimerer...</> : <><RefreshCw className="w-3.5 h-3.5" />Kør AI Optimizer</>}
          </button>
        </div>
      </div>

      {/* Gate grid */}
      <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.6)", background: "rgba(0,8,20,0.9)" }}>
        <p className="text-[9px] font-black tracking-widest uppercase text-slate-500 mb-3">GATE STATUS GRID</p>
        {gates.length === 0 ? (
          <p className="text-slate-600 text-xs text-center py-6">Ingen gates konfigureret — gå til Infrastructure</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gates.map(g => {
              const flight = g.current_flight_id ? flightMap[g.current_flight_id] : null;
              const color = STATUS_COLOR[g.status] || "#64748b";
              const isHov = hoveredGate === g.id;
              return (
                <div key={g.id}
                  onMouseEnter={() => setHoveredGate(g.id)}
                  onMouseLeave={() => setHoveredGate(null)}
                  className="relative rounded-xl px-3 py-2.5 min-w-[72px] text-center cursor-pointer transition-all"
                  style={{ border: `1.5px solid ${color}${isHov ? "80" : "35"}`, background: `${color}${isHov ? "18" : "0c"}`, boxShadow: isHov ? `0 0 12px ${color}25` : "none" }}>
                  <p className="text-[11px] font-black leading-none" style={{ color }}>{g.gate_code}</p>
                  <p className="text-[8px] text-slate-600 mt-0.5">{TYPE_ICON[g.gate_type] || "🚪"} {g.terminal}</p>
                  {flight && <p className="text-[8px] font-bold truncate mt-0.5" style={{ color: "#a78bfa" }}>{flight.flight_number}</p>}
                  {g.pax_waiting > 0 && <p className="text-[8px] font-bold" style={{ color: "#f59e0b" }}>{g.pax_waiting}</p>}
                  {g.boarding_active && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {plan && (
        <div className="space-y-4">
          {/* Score cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Efficiency Score", val: plan.efficiency_score, color: plan.efficiency_score > 70 ? "#10b981" : plan.efficiency_score > 50 ? "#f59e0b" : "#f43f5e", suffix: "/100" },
              { label: "Udnyttelse", val: plan.utilization_pct, color: "#8b5cf6", suffix: "%" },
              { label: "Konflikter", val: plan.conflicts?.length || 0, color: (plan.conflicts?.length || 0) > 0 ? "#f43f5e" : "#10b981", suffix: "" },
              { label: "Gates frigivet", val: plan.gates_freed_potential || 0, color: "#06b6d4", suffix: " mulige" },
            ].map(k => (
              <div key={k.label} className="rounded-2xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
                <p className="text-[8px] uppercase tracking-widest text-slate-500">{k.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.val}<span className="text-sm">{k.suffix}</span></p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-300 px-1 py-2 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.5)" }}>{plan.summary}</p>

          <div className="grid grid-cols-2 gap-4">
            {plan.conflicts?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(244,63,94,0.25)", background: "rgba(0,8,20,0.9)" }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-red-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />KONFLIKTER
                </p>
                <div className="space-y-2">
                  {plan.conflicts.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: `${sevColor[c.severity] || "#64748b"}08`, border: `1px solid ${sevColor[c.severity] || "#64748b"}20` }}>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.flight_number}</span>
                      <span className="text-[10px] text-slate-300">{c.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.reassignments?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(139,92,246,0.25)", background: "rgba(0,8,20,0.9)" }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-violet-400 mb-3 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />FORESLÅEDE OMBYTNINGER
                </p>
                <div className="space-y-2">
                  {plan.reassignments.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-xl" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <span className="text-violet-400 font-black w-14 flex-shrink-0">{r.flight_number}</span>
                      <span className="text-slate-500">{r.current_gate || "?"}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                      <span className="text-cyan-400 font-black">{r.suggested_gate}</span>
                      <span className="text-slate-400 flex-1 text-[9px]">{r.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {plan.optimizations?.length > 0 && (
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.9)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />OPTIMERINGSFORSLAG
              </p>
              <div className="grid grid-cols-2 gap-2">
                {plan.optimizations.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-slate-300">{o}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}