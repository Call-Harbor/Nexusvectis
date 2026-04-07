import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bot, Send, X, Loader2, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { useHologramAIAgent } from "./HologramAIAgent";
import { toast } from "sonner";

// Map task keywords to window types
const TASK_WINDOW_MAP = [
  { keywords: /rute|route|routing/i, window: "route_optimizer" },
  { keywords: /fleet map|flåde|live track/i, window: "fleet_map" },
  { keywords: /vedligehold|maintenance/i, window: "predictive_maintenance" },
  { keywords: /performance|ydelse/i, window: "performance_analytics" },
  { keywords: /prognose|forecast|demand/i, window: "demand_forecast" },
  { keywords: /risiko|risk/i, window: "risk_assessment" },
  { keywords: /dokument|document|kontrakt|contract/i, window: "document_editor" },
  { keywords: /regneark|spreadsheet/i, window: "spreadsheet_editor" },
  { keywords: /vejr|weather/i, window: "satellite_weather" },
  { keywords: /nyheder|news/i, window: "news_intelligence" },
  { keywords: /projekt|project/i, window: "project_management" },
  { keywords: /port|havn/i, window: "port_command" },
  { keywords: /lufthavn|airport/i, window: "airport_ops" },
  { keywords: /analyse|analysis/i, window: "deep_analysis" },
  { keywords: /3d|globe/i, window: "fleet_3d_viewer" },
];

function pickWindow(task) {
  for (const entry of TASK_WINDOW_MAP) {
    if (entry.keywords.test(task)) return entry.window;
  }
  return "fleet_map"; // default
}

const EXAMPLE_TASKS = [
  "Åbn rute-optimering og optimer alle aktive ruter",
  "Gå til vedligeholdelse og marker Truck-01 som klar",
  "Åbn performance dashboard og tjek efficiency scores",
  "Åbn demand forecast og vis prognosen for næste måned",
];

/**
 * AITaskRunner — lets the user type a task in natural language,
 * then picks the right hologram window and runs the AI agent inside it.
 */
export default function AITaskRunner({ onOpenWindow, windowRefs, orgId, onClose }) {
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const { runTask } = useHologramAIAgent();

  const execute = async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setDone(false);
    setSteps([{ text: "Analyserer opgave...", status: "running" }]);

    try {
      // 1. Ask LLM which window to open and what the precise task is
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `Given this user task: "${task}"

Which hologram window should be opened and what is the precise sub-task?

Available windows: route_optimizer, fleet_map, predictive_maintenance, demand_forecast, risk_assessment, performance_analytics, satellite_weather, news_intelligence, swarm_intelligence, digital_twin, document_editor, spreadsheet_editor, deep_analysis, fleet_3d_viewer, airport_ops, port_command, project_management, image_generator.

Return JSON: { "window": "window_type", "task": "precise task description in English", "reason": "why this window" }`,
        response_json_schema: {
          type: "object",
          properties: {
            window: { type: "string" },
            task: { type: "string" },
            reason: { type: "string" }
          }
        }
      });

      const windowType = plan.window || pickWindow(task);
      const preciseTask = plan.task || task;

      setSteps([
        { text: `Åbner hologram: ${windowType.replace(/_/g, " ")}`, status: "done" },
        { text: `AI agent klar: ${preciseTask.slice(0, 55)}...`, status: "running" },
      ]);

      // 2. Open the window
      onOpenWindow(windowType, preciseTask);

      // 3. Wait longer for window + content to render
      await new Promise(r => setTimeout(r, 2200));

      // 4. Find the newest ref (last added)
      const refs = Object.entries(windowRefs.current || {});
      const newestRef = refs.length > 0 ? refs[refs.length - 1][1] : null;

      if (!newestRef) {
        setSteps(prev => [...prev, { text: "Vindue ikke fundet - prøv at åbne det manuelt", status: "error" }]);
        setRunning(false);
        return;
      }

      setSteps(prev => [...prev.slice(0, -1),
        { text: `Udfører i ${windowType.replace(/_/g, " ")}...`, status: "running" },
      ]);

      // 5. Run AI agent inside window
      const result = await runTask(newestRef, windowType, preciseTask, orgId);

      setSteps(prev => [
        ...prev.slice(0, -1),
        { text: result?.summary || "Opgave udført ✓", status: "done" },
      ]);
      setDone(true);
      toast.success(`✅ ${result?.summary || "Opgave udført"}`);
    } catch (err) {
      setSteps(prev => [...prev, { text: `Fejl: ${err.message}`, status: "error" }]);
      toast.error(err.message);
    }

    setRunning(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      className="fixed bottom-48 right-6 z-50 w-[400px] rounded-2xl overflow-hidden"
      style={{
        background: "rgba(2,8,18,0.97)",
        border: "1px solid rgba(6,182,212,0.4)",
        boxShadow: "0 0 60px rgba(6,182,212,0.15), 0 0 120px rgba(139,92,246,0.08)"
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.04)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <p className="text-[11px] font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>AI Udfør Opgave</p>
            <p className="text-[9px] text-slate-500 font-mono">Åbner hologrammer og arbejder som et menneske</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: "#64748b" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border"
            style={{ background: "rgba(15,23,42,0.8)", borderColor: "rgba(6,182,212,0.25)" }}>
            <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
            <input
              ref={inputRef}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && execute()}
              placeholder="Beskriv hvad AI'en skal gøre..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
              disabled={running}
            />
          </div>
          <motion.button
            onClick={execute}
            disabled={!task.trim() || running}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
            style={{
              background: task.trim() && !running ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(6,182,212,0.1)",
              boxShadow: task.trim() && !running ? "0 0 20px rgba(6,182,212,0.4)" : "none"
            }}
          >
            {running ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </motion.button>
        </div>

        {/* Steps */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-1.5">
              {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-[10px] font-mono">
                  {step.status === "running" ? (
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#06b6d4" }} />
                  ) : step.status === "done" ? (
                    <CheckCircle2 className="w-3 h-3" style={{ color: "#10b981" }} />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span style={{ color: step.status === "done" ? "#94a3b8" : step.status === "error" ? "#f87171" : "#06b6d4" }}>
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example tasks */}
        {steps.length === 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2">Eksempler</p>
            {EXAMPLE_TASKS.map((ex, i) => (
              <button key={i} onClick={() => { setTask(ex); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all hover:text-cyan-300"
                style={{ color: "#64748b", background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.08)" }}>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}