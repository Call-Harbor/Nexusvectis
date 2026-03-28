import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Loader2, Clock, AlertTriangle, Zap, CheckCircle } from "lucide-react";

const TASK_ORDER = [
  "deboarding", "cleaning", "lavatory", "water_service",
  "catering", "fueling", "baggage_unload", "baggage_load",
  "boarding", "pushback"
];

const TASK_COLORS = {
  pending: "#64748b", in_progress: "#06b6d4", completed: "#10b981",
  delayed: "#f43f5e", skipped: "#475569"
};

const TASK_ICONS = {
  deboarding: "🚶", cleaning: "🧹", lavatory: "🚽", water_service: "💧",
  catering: "🍽️", fueling: "⛽", baggage_unload: "📦", baggage_load: "📦",
  boarding: "🛫", pushback: "🚜", deicing: "❄️"
};

export default function TurnaroundAI({ flights, tasks }) {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeTurnarounds = flights.filter(f =>
    ["at_gate", "boarding", "landed"].includes(f.status) ||
    (f.flight_type === "turnaround" && f.status !== "departed" && f.status !== "cancelled")
  );

  const getFlightTasks = (flightId) =>
    tasks.filter(t => t.flight_id === flightId)
      .sort((a, b) => TASK_ORDER.indexOf(a.task_type) - TASK_ORDER.indexOf(b.task_type));

  const runAIAnalysis = async (flight) => {
    setSelectedFlight(flight);
    setLoading(true);
    setAiAnalysis(null);
    const flightTasks = getFlightTasks(flight.id);
    const delayedTasks = flightTasks.filter(t => t.status === "delayed" || t.delay_minutes > 0);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Turnaround AI for airport ground operations. Analyze flight turnaround and optimize the jobs-graph.

Flight: ${flight.flight_number} (${flight.aircraft_type || "unknown"})
Status: ${flight.status} | Turnaround status: ${flight.turnaround_status}
Gate: ${flight.gate_id || "TBD"} | PAX: ${flight.pax_total || 0}
Delay: ${flight.delay_minutes || 0} min | Reason: ${flight.delay_reason || "none"}
Target ground time: ${flight.target_ground_minutes || 60} min
Priority: ${flight.priority}

Current task status:
${flightTasks.map(t => `  ${t.task_type}: ${t.status}${t.delay_minutes > 0 ? ` (+${t.delay_minutes}m delay)` : ""} | crew: ${t.assigned_crew || "?"}`).join("\n") || "  No tasks registered"}

Delayed tasks: ${delayedTasks.map(t => t.task_type).join(", ") || "none"}

Analyze as a jobs-graph and return JSON:
- turnaround_health: "on_track"|"at_risk"|"critical"
- estimated_departure_delay: number (minutes)
- critical_path: array of task names forming the bottleneck
- cascade_effects: array of strings (what downstream effects follow from current delays)
- optimized_sequence: array of {task: string, suggested_start_offset: number, parallel_with: string|null, priority: "critical"|"high"|"normal"}
- immediate_actions: array of 4 strings (what to do RIGHT NOW)
- connections_at_risk: number
- time_to_recover_minutes: number`,
        response_json_schema: {
          type: "object",
          properties: {
            turnaround_health: { type: "string" },
            estimated_departure_delay: { type: "number" },
            critical_path: { type: "array", items: { type: "string" } },
            cascade_effects: { type: "array", items: { type: "string" } },
            optimized_sequence: { type: "array", items: { type: "object", properties: { task: { type: "string" }, suggested_start_offset: { type: "number" }, parallel_with: { type: "string" }, priority: { type: "string" } } } },
            immediate_actions: { type: "array", items: { type: "string" } },
            connections_at_risk: { type: "number" },
            time_to_recover_minutes: { type: "number" }
          }
        }
      });
      setAiAnalysis(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const healthColor = { on_track: "#10b981", at_risk: "#f59e0b", critical: "#f43f5e" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-amber-400" />
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-400">TURNAROUND AI — JOBS-GRAPH OPTIMIZER</h2>
        <span className="text-[9px] text-slate-500 ml-2">{activeTurnarounds.length} active turnarounds</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Flight selector */}
        <div className="space-y-2">
          <p className="text-[8px] tracking-widest uppercase text-slate-500">SELECT FLIGHT</p>
          {activeTurnarounds.length === 0 && (
            <p className="text-slate-600 text-xs py-4 text-center">No active turnarounds</p>
          )}
          {activeTurnarounds.map(f => {
            const flTasks = getFlightTasks(f.id);
            const hasDelay = flTasks.some(t => t.status === "delayed") || (f.delay_minutes || 0) > 10;
            const isSelected = selectedFlight?.id === f.id;
            return (
              <button key={f.id} onClick={() => runAIAnalysis(f)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected ? "rgba(245,158,11,0.15)" : hasDelay ? "rgba(244,63,94,0.08)" : "rgba(15,23,42,0.6)",
                  border: `1px solid ${isSelected ? "rgba(245,158,11,0.5)" : hasDelay ? "rgba(244,63,94,0.3)" : "rgba(30,41,59,0.8)"}`
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white">{f.flight_number}</span>
                  {hasDelay && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </div>
                <p className="text-[9px] text-slate-400">{f.aircraft_type || "—"} · Gate {f.gate_id?.slice(0, 6) || "?"}</p>
                <p className="text-[9px]" style={{ color: f.delay_minutes > 0 ? "#f43f5e" : "#64748b" }}>
                  {f.delay_minutes > 0 ? `+${f.delay_minutes}m delay` : "On time"} · {flTasks.length} tasks
                </p>
                {/* Mini task bar */}
                <div className="flex gap-0.5 mt-1.5">
                  {flTasks.slice(0, 10).map(t => (
                    <div key={t.id} className="h-1.5 flex-1 rounded-sm" style={{ background: TASK_COLORS[t.status] || "#64748b" }} title={t.task_type} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Task jobs graph */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(0,10,25,0.5)" }}>
          <p className="text-[8px] tracking-widest uppercase text-slate-500 mb-3">JOBS GRAPH</p>
          {selectedFlight ? (
            <div className="space-y-2">
              {getFlightTasks(selectedFlight.id).length === 0 && (
                <p className="text-slate-600 text-xs text-center py-6">No tasks for this flight</p>
              )}
              {getFlightTasks(selectedFlight.id).map((t, i) => {
                const color = TASK_COLORS[t.status] || "#64748b";
                return (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-sm w-5 flex-shrink-0">{TASK_ICONS[t.task_type] || "⚙️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-semibold text-white capitalize">{t.task_type?.replace(/_/g, " ")}</span>
                        <span className="text-[8px]" style={{ color }}>{t.status}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: t.status === "completed" ? "100%" : t.status === "in_progress" ? "55%" : t.status === "pending" ? "0%" : "20%",
                            background: color
                          }} />
                      </div>
                    </div>
                    {t.delay_minutes > 0 && <span className="text-[8px] text-red-400 flex-shrink-0">+{t.delay_minutes}m</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-600 text-xs text-center py-8">Select a flight to view jobs graph</p>
          )}
        </div>

        {/* AI Analysis */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[8px] tracking-widest uppercase text-amber-400 mb-3">AI ANALYSIS</p>
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
          )}
          {!loading && !aiAnalysis && (
            <p className="text-slate-600 text-xs text-center py-8">Select a flight to run AI analysis</p>
          )}
          {aiAnalysis && !loading && (
            <div className="space-y-3">
              {/* Health */}
              <div className="rounded-lg px-3 py-2 flex items-center gap-2"
                style={{ background: `${healthColor[aiAnalysis.turnaround_health] || "#64748b"}12`, border: `1px solid ${healthColor[aiAnalysis.turnaround_health] || "#64748b"}30` }}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: healthColor[aiAnalysis.turnaround_health] }}>
                  {aiAnalysis.turnaround_health?.replace(/_/g, " ")}
                </span>
                <span className="text-[9px] text-slate-400 ml-auto">+{aiAnalysis.estimated_departure_delay}m est.</span>
              </div>

              {/* Critical path */}
              {aiAnalysis.critical_path?.length > 0 && (
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-red-400 mb-1">CRITICAL PATH</p>
                  <div className="flex flex-wrap gap-1">
                    {aiAnalysis.critical_path.map((p, i) => (
                      <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cascade effects */}
              {aiAnalysis.cascade_effects?.length > 0 && (
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-orange-400 mb-1">CASCADE EFFECTS</p>
                  {aiAnalysis.cascade_effects.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-[9px] text-slate-400 mb-0.5 flex gap-1.5"><AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />{e}</p>
                  ))}
                </div>
              )}

              {/* Connections */}
              <div className="flex gap-3">
                <div className="rounded-lg p-2 flex-1 text-center" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.06)" }}>
                  <p className="text-[7px] uppercase text-slate-500">Connections at risk</p>
                  <p className="text-xl font-bold text-red-400">{aiAnalysis.connections_at_risk}</p>
                </div>
                <div className="rounded-lg p-2 flex-1 text-center" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.06)" }}>
                  <p className="text-[7px] uppercase text-slate-500">Time to recover</p>
                  <p className="text-xl font-bold text-cyan-400">{aiAnalysis.time_to_recover_minutes}m</p>
                </div>
              </div>

              {/* Immediate actions */}
              {aiAnalysis.immediate_actions?.length > 0 && (
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-emerald-400 mb-1">IMMEDIATE ACTIONS</p>
                  {aiAnalysis.immediate_actions.map((a, i) => (
                    <p key={i} className="text-[9px] text-slate-300 mb-0.5 flex gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />{a}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optimized sequence */}
      {aiAnalysis?.optimized_sequence?.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 mb-3">AI OPTIMIZED TASK SEQUENCE</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {aiAnalysis.optimized_sequence.map((s, i) => {
              const prioColor = { critical: "#f43f5e", high: "#f59e0b", normal: "#10b981" };
              return (
                <div key={i} className="flex-shrink-0 rounded-xl p-3 text-center min-w-[90px]"
                  style={{ border: `1px solid ${prioColor[s.priority] || "#64748b"}30`, background: `${prioColor[s.priority] || "#64748b"}08` }}>
                  <span className="text-xl">{TASK_ICONS[s.task] || "⚙️"}</span>
                  <p className="text-[8px] font-semibold text-white mt-1 capitalize">{s.task?.replace(/_/g, " ")}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: prioColor[s.priority] }}>T+{s.suggested_start_offset}m</p>
                  {s.parallel_with && <p className="text-[7px] text-cyan-400 mt-0.5">∥ {s.parallel_with}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}