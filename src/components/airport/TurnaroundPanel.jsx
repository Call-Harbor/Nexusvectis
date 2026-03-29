import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Loader2, Zap, Activity } from "lucide-react";
import moment from "moment";

const TASK_ICONS = {
  deboarding: "🚪", cleaning: "🧹", catering: "🍽️", fueling: "⛽",
  baggage_unload: "📦", baggage_load: "📦", boarding: "✈️",
  pushback: "🚜", water_service: "💧", lavatory: "🚽", deicing: "❄️"
};

const STATUS_COLOR = {
  pending: "#475569", in_progress: "#06b6d4", completed: "#10b981",
  delayed: "#f43f5e", skipped: "#64748b"
};

const STATUS_LABEL = {
  pending: "PENDING", in_progress: "IN PROGRESS", completed: "COMPLETED",
  delayed: "DELAYED", skipped: "SKIPPED"
};

export default function TurnaroundPanel({ flights, tasks }) {
  const [selectedFlight, setSelectedFlight] = useState(null);

  const activeFlight = selectedFlight || flights.find(f => ["at_gate", "boarding", "deboarding"].includes(f.status));
  const flightTasks = tasks.filter(t => t.flight_id === activeFlight?.id)
    .sort((a, b) => new Date(a.scheduled_start || 0) - new Date(b.scheduled_start || 0));

  const completedCount = flightTasks.filter(t => t.status === "completed").length;
  const inProgressCount = flightTasks.filter(t => t.status === "in_progress").length;
  const delayedCount = flightTasks.filter(t => t.status === "delayed").length;
  const progress = flightTasks.length > 0 ? Math.round((completedCount / flightTasks.length) * 100) : 0;
  const hasDelay = flightTasks.some(t => t.status === "delayed");
  const totalDelayMinutes = flightTasks.reduce((s, t) => s + (t.delay_minutes || 0), 0);

  const progressColor = hasDelay ? "#f43f5e" : progress === 100 ? "#10b981" : "#8b5cf6";

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ border: "1px solid rgba(139,92,246,0.25)", background: "rgba(0,8,20,0.95)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60" style={{ background: "rgba(0,12,28,0.9)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-violet-400">TURNAROUND TRACKER</h2>
        </div>
        <select
          className="w-full text-[11px] rounded-xl px-3 py-2 outline-none font-mono"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(139,92,246,0.3)", color: "#e2e8f0" }}
          value={activeFlight?.id || ""}
          onChange={e => setSelectedFlight(flights.find(f => f.id === e.target.value) || null)}>
          <option value="">— Select flight —</option>
          {flights.filter(f => f.flight_type !== "arrival" || f.status === "at_gate").map(f => (
            <option key={f.id} value={f.id}>{f.flight_number} · {f.status}</option>
          ))}
        </select>
      </div>

      {activeFlight ? (
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          {/* Flight info */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-black text-white font-mono">{activeFlight.flight_number}</p>
              <p className="text-[10px] text-slate-400">{activeFlight.origin} → {activeFlight.destination} · {activeFlight.aircraft_type || "—"}</p>
              {activeFlight.gate && <p className="text-[9px] text-cyan-400 mt-0.5">Gate {activeFlight.gate}</p>}
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest">Progress</p>
              <p className="text-2xl font-black" style={{ color: progressColor }}>{progress}%</p>
              {totalDelayMinutes > 0 && (
                <p className="text-[9px] font-black text-red-400">+{totalDelayMinutes}m total delay</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: progressColor }} />
            </div>
            <div className="flex gap-3 text-[8px]">
              {[
                { label: "Completed", count: completedCount, color: "#10b981" },
                { label: "In Progress", count: inProgressCount, color: "#06b6d4" },
                { label: "Delayed", count: delayedCount, color: "#f43f5e" },
                { label: "Pending", count: flightTasks.filter(t => t.status === "pending").length, color: "#475569" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span style={{ color: s.color }}>{s.count} {s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {hasDelay && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 animate-pulse" />
              <span className="text-[9px] text-red-300 font-bold">Delay detected — AI recommends re-sequencing</span>
            </div>
          )}

          {/* Task list */}
          <div className="space-y-1.5 overflow-y-auto flex-1">
            {flightTasks.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-6">No tasks for this flight</p>
            )}
            {flightTasks.map(task => {
              const color = STATUS_COLOR[task.status] || "#64748b";
              const isActive = task.status === "in_progress";
              return (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: `${color}0a`, border: `1px solid ${color}22`, boxShadow: isActive ? `0 0 8px ${color}20` : "none" }}>
                  <span className="text-lg flex-shrink-0">{TASK_ICONS[task.task_type] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white capitalize">{task.task_type?.replace(/_/g, " ")}</p>
                    {task.assigned_crew && <p className="text-[9px] text-slate-500">{task.assigned_crew}</p>}
                  </div>
                  {task.delay_minutes > 0 && (
                    <span className="text-[9px] font-black text-red-400 flex-shrink-0">+{task.delay_minutes}m</span>
                  )}
                  {isActive && <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: color }} />}
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 uppercase"
                    style={{ color, background: `${color}20`, border: `1px solid ${color}30` }}>
                    {STATUS_LABEL[task.status] || task.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-700 p-6">
          <Activity className="w-8 h-8 mb-3" />
          <p className="text-sm font-bold text-center">Select a flight to track turnaround</p>
        </div>
      )}
    </div>
  );
}