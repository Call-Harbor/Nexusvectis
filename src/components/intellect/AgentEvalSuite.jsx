import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Play, CheckCircle2, XCircle, Loader2, X, Plus, Trophy, Star } from "lucide-react";

/**
 * Agent Eval & Test Suite — golden tasks, benchmark runs, regression tests, quality scoring
 */

const BUILTIN_GOLDEN_TASKS = [
  { id: "gt_1", name: "Fleet Summary", category: "Fleet", prompt: "Give me a complete summary of the fleet's current status, including active vehicles, idle ones, and any maintenance alerts.", expectedKeywords: ["vehicle", "active", "maintenance", "status"], difficulty: "easy" },
  { id: "gt_2", name: "Route Optimization", category: "Logistics", prompt: "Identify the top 3 routes that can be optimized for fuel savings and suggest specific improvements.", expectedKeywords: ["route", "fuel", "optim", "saving"], difficulty: "medium" },
  { id: "gt_3", name: "Risk Assessment", category: "Risk", prompt: "Analyze operational risks across the fleet and rank them by severity with mitigation recommendations.", expectedKeywords: ["risk", "severity", "mitigation", "operational"], difficulty: "hard" },
  { id: "gt_4", name: "CO₂ Report", category: "ESG", prompt: "Calculate total CO₂ emissions for all active shipments and compare against targets.", expectedKeywords: ["co2", "emission", "carbon", "target"], difficulty: "medium" },
  { id: "gt_5", name: "Driver Performance", category: "HR", prompt: "Evaluate the top 5 and bottom 5 drivers by performance score and recommend actions.", expectedKeywords: ["driver", "performance", "score", "recommend"], difficulty: "medium" },
];

const DIFFICULTY_COLORS = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" };

function scoreResponse(output, expectedKeywords) {
  if (!output) return 0;
  const outputLower = (typeof output === "string" ? output : JSON.stringify(output)).toLowerCase();
  const found = expectedKeywords.filter(kw => outputLower.includes(kw.toLowerCase())).length;
  const keywordScore = (found / expectedKeywords.length) * 60;
  const lengthScore = Math.min(40, outputLower.length / 100);
  return Math.round(keywordScore + lengthScore);
}

export default function AgentEvalSuite({ allWorkers, orgId, onClose }) {
  const [goldenTasks, setGoldenTasks] = useState(BUILTIN_GOLDEN_TASKS);
  const [results, setResults] = useState({});
  const [runningTask, setRunningTask] = useState(null);
  const [selectedWorkerForEval, setSelectedWorkerForEval] = useState(allWorkers[0]?.id || "");
  const [newTaskPrompt, setNewTaskPrompt] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const runEval = async (task) => {
    setRunningTask(task.id);
    const startTime = Date.now();
    try {
      const result = await base44.functions.invoke("orchestrateMultipleAIs", {
        task: orgId ? `[ORG: ${orgId}] ${task.prompt}` : task.prompt,
        workerType: selectedWorkerForEval,
        orchestrationId: `eval_${task.id}`,
        taskId: task.id,
        fileUrls: [],
        metadata: { isEval: true, organization_id: orgId }
      });
      const output = result.data?.output || result.data || "";
      const latency = Date.now() - startTime;
      const score = scoreResponse(output, task.expectedKeywords);
      setResults(prev => ({
        ...prev,
        [task.id]: { output, latency_ms: latency, score, passed: score >= 50, runAt: Date.now() }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [task.id]: { error: err.message, score: 0, passed: false, runAt: Date.now() }
      }));
    }
    setRunningTask(null);
  };

  const runAllEvals = async () => {
    for (const task of goldenTasks) {
      await runEval(task);
    }
  };

  const addGoldenTask = () => {
    if (!newTaskName.trim() || !newTaskPrompt.trim()) return;
    setGoldenTasks(prev => [...prev, {
      id: `gt_custom_${Date.now()}`,
      name: newTaskName.trim(),
      category: "Custom",
      prompt: newTaskPrompt.trim(),
      expectedKeywords: [],
      difficulty: "medium",
      isCustom: true,
    }]);
    setNewTaskName("");
    setNewTaskPrompt("");
    setShowAddTask(false);
  };

  const passedCount = Object.values(results).filter(r => r.passed).length;
  const avgScore = Object.values(results).length > 0
    ? Math.round(Object.values(results).reduce((s, r) => s + (r.score || 0), 0) / Object.values(results).length)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(8,12,28,0.98)", border: "1px solid rgba(245,158,11,0.25)", maxHeight: 540 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.02)" }}>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4" style={{ color: "#f59e0b" }} />
          <h3 className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#f59e0b" }}>Eval Suite</h3>
          {avgScore !== null && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: avgScore >= 70 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: avgScore >= 70 ? "#10b981" : "#f59e0b" }}>
              <Star className="w-2.5 h-2.5" /> {avgScore}% avg score
            </span>
          )}
          {passedCount > 0 && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
              {passedCount}/{goldenTasks.length} passed
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ color: "#64748b" }} className="hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
        <select value={selectedWorkerForEval} onChange={e => setSelectedWorkerForEval(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white outline-none font-mono"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(245,158,11,0.2)" }}>
          {allWorkers.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.name}</option>)}
        </select>
        <motion.button onClick={runAllEvals} disabled={!!runningTask}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40"
          style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
          {runningTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Play className="w-3.5 h-3.5" /> Run All</>}
        </motion.button>
        <motion.button onClick={() => setShowAddTask(p => !p)}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
          style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </motion.button>
      </div>

      {/* Add golden task */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b px-5 py-3 space-y-2" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
            <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="Task name"
              className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none font-mono"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139,92,246,0.2)" }} />
            <textarea value={newTaskPrompt} onChange={e => setNewTaskPrompt(e.target.value)} placeholder="Task prompt / golden question..."
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none resize-none font-mono"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139,92,246,0.2)", minHeight: 60 }} />
            <button onClick={addGoldenTask}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
              + Add Golden Task
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {goldenTasks.map((task, i) => {
          const result = results[task.id];
          const isRunning = runningTask === task.id;
          return (
            <motion.div key={task.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="p-3 rounded-xl"
              style={{ background: result?.passed ? "rgba(16,185,129,0.06)" : result && !result.passed ? "rgba(239,68,68,0.06)" : "rgba(15,23,42,0.6)", border: `1px solid ${result?.passed ? "rgba(16,185,129,0.2)" : result && !result.passed ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.12)"}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-white">{task.name}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(100,116,139,0.15)", color: "#64748b" }}>{task.category}</span>
                    <span className="text-[8px] font-mono" style={{ color: DIFFICULTY_COLORS[task.difficulty] }}>{task.difficulty}</span>
                    {task.isCustom && <span className="text-[8px] font-mono" style={{ color: "#a78bfa" }}>custom</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{task.prompt.slice(0, 100)}...</p>

                  {result && (
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono">
                      {result.score !== undefined && (
                        <span style={{ color: result.score >= 70 ? "#10b981" : result.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                          score: {result.score}%
                        </span>
                      )}
                      {result.latency_ms && <span style={{ color: "#64748b" }}>{Math.round(result.latency_ms / 1000)}s</span>}
                      {result.error && <span style={{ color: "#ef4444" }}>Error: {result.error.slice(0, 40)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {result?.passed && <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />}
                  {result && !result.passed && !isRunning && <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />}
                  <motion.button onClick={() => runEval(task)} disabled={isRunning || !!runningTask}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                    style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}