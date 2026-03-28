import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";

const TASK_ICONS = {
  deboarding: "🚪", cleaning: "🧹", catering: "🍽️", fueling: "⛽",
  baggage_unload: "📦", baggage_load: "📦", boarding: "✈️",
  pushback: "🚜", water_service: "💧", lavatory: "🚽", deicing: "❄️"
};

const STATUS_COLOR = {
  pending: "#64748b", in_progress: "#06b6d4", completed: "#10b981",
  delayed: "#f43f5e", skipped: "#475569"
};

export default function TurnaroundPanel({ flights, tasks }) {
  const [selectedFlight, setSelectedFlight] = useState(null);

  const activeFlight = selectedFlight || flights.find(f => ["at_gate", "boarding", "deboarding"].includes(f.status));

  const flightTasks = tasks.filter(t => t.flight_id === activeFlight?.id)
    .sort((a, b) => new Date(a.scheduled_start || 0) - new Date(b.scheduled_start || 0));

  const completedCount = flightTasks.filter(t => t.status === "completed").length;
  const progress = flightTasks.length > 0 ? Math.round((completedCount / flightTasks.length) * 100) : 0;
  const hasDelay = flightTasks.some(t => t.status === "delayed");

  return (
    <div className="rounded-xl overflow-hidden h-full" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: "#8b5cf6" }}>TURNAROUND TRACKER</h2>
        <select
          className="w-full text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none"
          value={activeFlight?.id || ""}
          onChange={e => setSelectedFlight(flights.find(f => f.id === e.target.value) || null)}
        >
          <option value="">— Select flight —</option>
          {flights.filter(f => f.flight_type !== "arrival" || f.status === "at_gate").map(f => (
            <option key={f.id} value={f.id}>{f.flight_number} · {f.status}</option>
          ))}
        </select>
      </div>

      {activeFlight ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{activeFlight.flight_number}</p>
              <p className="text-[10px] text-slate-400">{activeFlight.origin} → {activeFlight.destination} · {activeFlight.aircraft_type}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Progress</p>
              <p className="text-lg font-bold" style={{ color: progress === 100 ? "#10b981" : "#06b6d4" }}>{progress}%</p>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: hasDelay ? "#f43f5e" : "#8b5cf6" }} />
          </div>

          {hasDelay && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] text-red-400">Delay detected — AI recommends resequencing</span>
            </div>
          )}

          <div className="space-y-1.5 overflow-auto max-h-[280px]">
            {flightTasks.map(task => {
              const color = STATUS_COLOR[task.status] || "#64748b";
              return (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: `${color}0a`, border: `1px solid ${color}22` }}>
                  <span className="text-base">{TASK_ICONS[task.task_type] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white capitalize">{task.task_type?.replace(/_/g, " ")}</p>
                    {task.assigned_crew && <p className="text-[9px] text-slate-500">{task.assigned_crew}</p>}
                  </div>
                  {task.delay_minutes > 0 && (
                    <span className="text-[9px] text-red-400 font-bold">+{task.delay_minutes}m</span>
                  )}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}20` }}>
                    {task.status?.replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
            {flightTasks.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-4">No tasks found for this flight</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-slate-600 text-xs">Select a flight to track turnaround</div>
      )}
    </div>
  );
}