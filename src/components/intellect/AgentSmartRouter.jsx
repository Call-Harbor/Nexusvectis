import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Zap, Brain, TrendingUp, Clock, DollarSign, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Smart Agent Router — picks the best agent(s) for a task based on
 * specialty matching, historical performance, cost, and latency.
 */

const ROUTING_CRITERIA = [
  { key: "specialty", label: "Specialty Match", icon: Brain, color: "#06b6d4", weight: 40 },
  { key: "performance", label: "Past Performance", icon: TrendingUp, color: "#10b981", weight: 30 },
  { key: "latency", label: "Low Latency", icon: Clock, color: "#f59e0b", weight: 20 },
  { key: "cost", label: "Cost Efficiency", icon: DollarSign, color: "#8b5cf6", weight: 10 },
];

export async function smartRouteTask(task, allWorkers, performanceHistory = []) {
  // Score each worker for this task
  const scores = allWorkers.map(worker => {
    let score = 0;
    const taskLower = task.toLowerCase();
    const specialtyLower = (worker.specialty || "").toLowerCase();
    const nameLower = (worker.name || "").toLowerCase();

    // Specialty match (keyword overlap)
    const taskWords = taskLower.split(/\W+/).filter(w => w.length > 3);
    const specialtyWords = (specialtyLower + " " + nameLower).split(/\W+/);
    const overlap = taskWords.filter(w => specialtyWords.some(s => s.includes(w) || w.includes(s))).length;
    score += (overlap / Math.max(taskWords.length, 1)) * 40;

    // Historical performance
    const history = performanceHistory.filter(h => h.workerId === worker.id);
    if (history.length > 0) {
      const successRate = history.filter(h => h.success).length / history.length;
      score += successRate * 30;
    } else {
      score += 15; // neutral if no history
    }

    // Latency score (prefer faster workers, lower avg_latency is better)
    const avgLatency = history.length > 0
      ? history.reduce((sum, h) => sum + (h.latency_ms || 2000), 0) / history.length
      : 2000;
    score += Math.max(0, 20 - (avgLatency / 500)) ; // up to 20 pts

    // Cost (custom workers slightly preferred for cost)
    score += worker.isCustom ? 5 : 8;

    return { worker, score: Math.min(100, score), overlap, history: history.length };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

export default function AgentSmartRouter({ task, allWorkers, performanceHistory, onSelectWorker, onClose }) {
  const [scores, setScores] = useState(null);
  const [isRouting, setIsRouting] = useState(false);

  const runRouting = async () => {
    if (!task.trim()) return;
    setIsRouting(true);
    const result = await smartRouteTask(task, allWorkers, performanceHistory);
    setScores(result.slice(0, 8));
    setIsRouting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(8,12,28,0.98)", border: "1px solid rgba(6,182,212,0.25)" }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "#06b6d4" }} />
            <h3 className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Smart Agent Router</h3>
          </div>
          <button onClick={onClose} className="text-[9px] font-mono text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <p className="text-[10px] text-slate-500">AI scores every worker for this task — pick the best match</p>
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 px-3 py-2 rounded-lg text-xs text-slate-300 font-mono"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(6,182,212,0.15)" }}>
            {task.length > 80 ? task.slice(0, 80) + "…" : task || "No task specified"}
          </div>
          <motion.button onClick={runRouting} disabled={isRouting || !task.trim()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
            style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
            {isRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Route"}
          </motion.button>
        </div>

        {/* Criteria legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ROUTING_CRITERIA.map(c => (
            <div key={c.key} className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-full"
              style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>
              <c.icon className="w-2.5 h-2.5" />
              {c.label} {c.weight}%
            </div>
          ))}
        </div>

        {/* Results */}
        {scores && (
          <div className="space-y-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Top Matches</p>
            {scores.map((s, i) => (
              <motion.div key={s.worker.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:border-cyan-400/40"
                style={{ background: i === 0 ? `${s.worker.color}12` : "rgba(15,23,42,0.5)", border: `1px solid ${i === 0 ? s.worker.color + "40" : "rgba(100,116,139,0.15)"}` }}
                onClick={() => onSelectWorker(s.worker)}>
                <div className="text-lg flex-shrink-0">{s.worker.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: s.worker.color }}>{s.worker.name}</span>
                    {i === 0 && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#10b98120", color: "#10b981" }}>BEST MATCH</span>}
                    {s.history > 0 && <span className="text-[8px] text-slate-500 font-mono">{s.history} past runs</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                        transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                        style={{ background: s.score > 60 ? "#10b981" : s.score > 40 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold" style={{ color: s.score > 60 ? "#10b981" : "#f59e0b" }}>{Math.round(s.score)}%</span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: i === 0 ? "#10b981" : "#374151" }} />
              </motion.div>
            ))}
          </div>
        )}

        {!scores && !isRouting && (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-500">Click <strong className="text-cyan-400">Route</strong> to score all {allWorkers.length} workers for this task</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}