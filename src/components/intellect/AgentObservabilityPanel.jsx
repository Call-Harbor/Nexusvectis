import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Zap, AlertCircle, CheckCircle2, TrendingUp, BarChart2, X } from "lucide-react";

/**
 * Full Observability Panel — traces every agent call with latency,
 * tokens, errors, handoffs, and workflow bottlenecks.
 */

function MetricPill({ label, value, color = "#06b6d4", icon: PillIcon }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl"
      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-1">
        {PillIcon && <PillIcon className="w-3 h-3" style={{ color }} />}
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: `${color}80` }}>{label}</span>
      </div>
      <span className="text-sm font-black font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

export default function AgentObservabilityPanel({ orchestrations, onClose }) {
  const [filter, setFilter] = useState("all"); // all | running | done | error
  const [selectedOrch, setSelectedOrch] = useState(null);

  const allTraces = useMemo(() => {
    const traces = [];
    for (const orch of orchestrations) {
      for (const worker of orch.workers) {
        const output = orch.outputs?.[worker.id];
        const latency = output && orch.startedAt
          ? Math.round((Date.now() - orch.startedAt) / 1000)
          : null;
        traces.push({
          orchId: orch.id,
          orchMode: orch.orchMode,
          workerId: worker.id,
          workerName: worker.name,
          workerEmoji: worker.emoji,
          workerColor: worker.color,
          status: worker.status,
          latency_s: latency,
          tokens_est: output ? Math.round((typeof output === 'string' ? output.length : JSON.stringify(output).length) / 4) : 0,
          budget: orch.budget,
          timestamp: new Date(orch.startedAt).toLocaleTimeString(),
          hasOutput: !!output,
        });
      }
    }
    return traces;
  }, [orchestrations]);

  const filtered = filter === "all" ? allTraces : allTraces.filter(t => t.status === filter);

  const totalTokens = allTraces.reduce((s, t) => s + (t.tokens_est || 0), 0);
  const avgLatency = allTraces.filter(t => t.latency_s).length > 0
    ? Math.round(allTraces.filter(t => t.latency_s).reduce((s, t) => s + t.latency_s, 0) / allTraces.filter(t => t.latency_s).length)
    : 0;
  const errorRate = allTraces.length > 0
    ? Math.round((allTraces.filter(t => t.status === "error").length / allTraces.length) * 100)
    : 0;
  const successCount = allTraces.filter(t => t.status === "done").length;

  const statusColors = { done: "#10b981", running: "#06b6d4", queued: "#f59e0b", error: "#ef4444" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(8,12,28,0.98)", border: "1px solid rgba(6,182,212,0.25)", maxHeight: 520 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.02)" }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#06b6d4" }} />
          <h3 className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Full Observability</h3>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>
            {allTraces.length} traces
          </span>
        </div>
        <button onClick={onClose} style={{ color: "#64748b" }} className="hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2 px-5 py-3 flex-shrink-0">
        <MetricPill label="Tokens Est." value={totalTokens.toLocaleString()} color="#06b6d4" icon={Zap} />
        <MetricPill label="Avg Latency" value={`${avgLatency}s`} color="#f59e0b" icon={Clock} />
        <MetricPill label="Success" value={successCount} color="#10b981" icon={CheckCircle2} />
        <MetricPill label="Error Rate" value={`${errorRate}%`} color={errorRate > 20 ? "#ef4444" : "#10b981"} icon={AlertCircle} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 pb-3 flex-shrink-0">
        {["all", "running", "done", "error"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all capitalize"
            style={{
              background: filter === f ? `${statusColors[f] || "#06b6d4"}20` : "rgba(255,255,255,0.03)",
              color: filter === f ? (statusColors[f] || "#06b6d4") : "#64748b",
              border: `1px solid ${filter === f ? (statusColors[f] || "#06b6d4") + "40" : "rgba(255,255,255,0.06)"}`
            }}>
            {f} {f === "all" ? `(${allTraces.length})` : `(${allTraces.filter(t => t.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Trace list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">No traces yet — run an orchestration first</div>
        )}
        {filtered.map((trace, i) => (
          <motion.div key={`${trace.orchId}_${trace.workerId}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${statusColors[trace.status]}20`, borderLeft: `2px solid ${statusColors[trace.status]}` }}>
            <span className="text-base flex-shrink-0">{trace.workerEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: trace.workerColor }}>{trace.workerName}</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded capitalize" style={{ background: `${statusColors[trace.status]}15`, color: statusColors[trace.status] }}>{trace.status}</span>
                {trace.orchMode && <span className="text-[8px] font-mono text-slate-600">{trace.orchMode}</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-slate-500">
                {trace.latency_s && <span><Clock className="w-2.5 h-2.5 inline mr-0.5" />{trace.latency_s}s</span>}
                {trace.tokens_est > 0 && <span><Zap className="w-2.5 h-2.5 inline mr-0.5" />~{trace.tokens_est} tokens</span>}
                {trace.budget && <span style={{ color: trace.tokens_est > trace.budget * 0.8 ? "#ef4444" : "#64748b" }}>
                  budget: {trace.budget.toLocaleString()}
                </span>}
                <span className="text-slate-600">{trace.timestamp}</span>
              </div>
            </div>
            {/* Token usage bar */}
            {trace.budget > 0 && (
              <div className="w-16 flex flex-col items-end gap-0.5">
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (trace.tokens_est / trace.budget) * 100)}%`, background: trace.tokens_est > trace.budget * 0.8 ? "#ef4444" : "#10b981" }} />
                </div>
                <span className="text-[8px] font-mono" style={{ color: "#64748b" }}>
                  {Math.round((trace.tokens_est / trace.budget) * 100)}% budget
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Budget summary */}
      {orchestrations.length > 0 && (
        <div className="px-5 py-3 border-t flex items-center justify-between text-[9px] font-mono flex-shrink-0"
          style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.01)" }}>
          <span style={{ color: "#64748b" }}>{orchestrations.length} orchestrations tracked</span>
          <span style={{ color: totalTokens > 10000 ? "#f59e0b" : "#10b981" }}>
            {totalTokens.toLocaleString()} estimated tokens total
          </span>
        </div>
      )}
    </motion.div>
  );
}