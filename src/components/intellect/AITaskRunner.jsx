import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bot, Send, X, Loader2, CheckCircle2, ChevronRight, Zap, Brain, Eye, MousePointer, Keyboard, ScrollText, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { useHologramAIAgent } from "./HologramAIAgent";
import { toast } from "sonner";

const WINDOW_MAP = [
  // Routes page = CREATE/VIEW/EDIT actual routes between locations
  { keywords: /lav en rute|opret rute|ny rute|create route|new route|lave en route|lav route/i, window: "routes" },
  // Route optimizer = OPTIMIZE/ANALYZE existing routes for efficiency
  { keywords: /optimer rute|route optimiz|optimér|optimer eksist/i, window: "route_optimizer" },
  // Fleet map = live tracking on a map
  { keywords: /fleet map|flåde kort|live track|live map|se på kort|find køretøj|track/i, window: "fleet_map" },
  // Predictive maintenance
  { keywords: /vedligehold|maintenance|service|reparation|nedbrud/i, window: "predictive_maintenance" },
  // Performance analytics
  { keywords: /performance|ydelse|effektivitet|kpi|statistik/i, window: "performance_analytics" },
  // Demand forecast
  { keywords: /prognose|forecast|demand|efterspørgsel|forudsig/i, window: "demand_forecast" },
  // Risk assessment
  { keywords: /risiko|risk|fare|sikkerhed/i, window: "risk_assessment" },
  // Document editor
  { keywords: /dokument|document|kontrakt|skriv brev|rapport/i, window: "document_editor" },
  // Spreadsheet
  { keywords: /regneark|spreadsheet|tabel|excel/i, window: "spreadsheet_editor" },
  // Weather
  { keywords: /vejr|weather|satellit/i, window: "satellite_weather" },
  // News
  { keywords: /nyheder|news/i, window: "news_intelligence" },
  // Project management
  { keywords: /projekt|project|opgaver|tasks/i, window: "project_management" },
  // Port
  { keywords: /port|havn|vessel|skib/i, window: "port_command" },
  // Airport
  { keywords: /lufthavn|airport|fly|terminal/i, window: "airport_ops" },
  // Deep analysis
  { keywords: /analyse|analysis|data indsigt/i, window: "deep_analysis" },
  // Swarm
  { keywords: /swarm|sværm/i, window: "swarm_intelligence" },
  // Digital twin
  { keywords: /digital twin|tvilling/i, window: "digital_twin" },
  // Vehicles/fleet management
  { keywords: /køretøj|vehicle|lastbil|flåde admin|fleet admin/i, window: "fleet" },
  // Shipments
  { keywords: /forsendelse|shipment|levering|pakke/i, window: "shipments" },
  // Alerts
  { keywords: /alert|alarm|advarsel/i, window: "alerts" },
];

function pickWindow(task) {
  for (const e of WINDOW_MAP) {
    if (e.keywords.test(task)) return e.window;
  }
  return "performance_analytics";
}

const PHASE_ICONS = {
  scan: Eye,
  plan: Brain,
  think: Brain,
  click: MousePointer,
  type: Keyboard,
  scroll: ScrollText,
  hover: Eye,
  narrate: CheckCircle2,
  error: X,
};

const PHASE_COLORS = {
  scan: "#06b6d4",
  plan: "#8b5cf6",
  think: "#f59e0b",
  click: "#10b981",
  type: "#a78bfa",
  scroll: "#64748b",
  hover: "#06b6d4",
  narrate: "#10b981",
  error: "#ef4444",
};

const EXAMPLES = [
  "Åbn rute-optimering og optimer alle aktive ruter",
  "Gå til performance dashboard og tjek hvilke køretøjer der er ineffektive",
  "Åbn vedligeholdelse og se hvilke køretøjer der snart skal serviceres",
  "Åbn demand forecast og analyser næste måneds prognoser",
  "Tjek port command og se vessel queue status",
];

export default function AITaskRunner({ onOpenWindow, windowRefs, orgId, onClose }) {
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | scanning | planning | executing | done | error
  const [steps, setSteps] = useState([]);
  const [currentWindowType, setCurrentWindowType] = useState(null);
  const [planPreview, setPlanPreview] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const stepsEndRef = useRef(null);
  const inputRef = useRef(null);
  const { runTask } = useHologramAIAgent();

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const addStep = (text, stepPhase) => {
    setSteps(prev => [...prev, { text, phase: stepPhase, id: Date.now() }]);
  };

  const execute = async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setPhase("scanning");
    setSteps([]);
    setPlanPreview(null);

    try {
      // Phase 1: Determine window
      addStep("Forstår opgaven...", "think");
      setPhase("planning");

      let windowType;
      let preciseTask = task;

      try {
        const plan = await base44.integrations.Core.InvokeLLM({
          prompt: `The user wants to do this task in a logistics operations system: "${task}"\n\nChoose the BEST window/module:\n- "routes" => CREATE a new route between two locations\n- "route_optimizer" => OPTIMIZE or ANALYZE existing routes\n- "fleet_map" => See vehicles on a LIVE MAP\n- "fleet" => Manage/view the vehicle fleet list\n- "predictive_maintenance" => Maintenance scheduling, failure predictions\n- "demand_forecast" => Demand and capacity forecasting\n- "risk_assessment" => Risk analysis\n- "performance_analytics" => KPI dashboards, efficiency statistics\n- "shipments" => View/manage shipments\n- "alerts" => View system alerts\n- "document_editor" => Write/edit documents\n- "spreadsheet_editor" => Tables, Excel-like data entry\n- "satellite_weather" => Weather intelligence\n- "news_intelligence" => Logistics news\n- "project_management" => Project tasks\n- "port_command" => Port and vessel operations\n- "airport_ops" => Airport and flight operations\n- "deep_analysis" => Deep AI data analysis\n- "image_generator" => Generate images with AI\n\nRules: If task says "lav", "opret", "ny rute" or "create route" => pick "routes". If "optimer" routes => pick "route_optimizer".\n\nReturn JSON: { "window": "key", "task": "English description" }`,
          response_json_schema: {
            type: "object",
            properties: { window: { type: "string" }, task: { type: "string" } }
          }
        });
        windowType = plan?.window || pickWindow(task);
        preciseTask = plan?.task || task;
      } catch {
        windowType = pickWindow(task);
      }

      setCurrentWindowType(windowType);
      addStep(`Åbner modul: ${windowType.replace(/_/g, " ")}`, "scan");

      // Phase 2: Open window
      onOpenWindow(windowType, preciseTask);
      addStep(`Hologram aktiveret ✓`, "narrate");

      // Phase 3: Wait for render — give content time to load
      addStep("Venter på interface at loade...", "think");
      await new Promise(r => setTimeout(r, 3500));

      // Phase 4: Find ref with retry
      let newestRef = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const refs = Object.entries(windowRefs.current || {});
        if (refs.length > 0) {
          newestRef = refs[refs.length - 1][1];
          // Check if the window actually has content
          const buttons = newestRef?.querySelectorAll("button") || [];
          const inputs = newestRef?.querySelectorAll("input, textarea, select") || [];
          if (buttons.length > 0 || inputs.length > 0) break;
        }
        addStep(`Venter på vindue indhold... (forsøg ${attempt + 1}/5)`, "think");
        await new Promise(r => setTimeout(r, 1200));
      }

      if (!newestRef) {
        addStep("Vindue ikke tilgængeligt — prøv manuelt", "error");
        setPhase("error");
        setRunning(false);
        return;
      }

      // Phase 5: Run agent with live step reporting
      const result = await runTask(newestRef, windowType, preciseTask, orgId, (step) => {
        addStep(step.text, step.phase);
      });

      addStep(`✅ ${result?.summary || "Opgave fuldført"}`, "narrate");
      setPhase("done");
      toast.success(`✅ ${result?.summary || "Opgave fuldført"}`);

    } catch (err) {
      addStep(`❌ Fejl: ${err.message}`, "error");
      setPhase("error");
      toast.error(err.message);
    }

    setRunning(false);
  };

  const reset = () => {
    setTask("");
    setSteps([]);
    setPhase("idle");
    setCurrentWindowType(null);
    setPlanPreview(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const phaseLabel = {
    idle: "Klar",
    scanning: "Scanner interface...",
    planning: "Planlægger handlinger...",
    executing: "Udfører opgave...",
    done: "Fuldført ✓",
    error: "Fejl",
  }[phase];

  const phaseColor = {
    idle: "#64748b", scanning: "#06b6d4", planning: "#8b5cf6",
    executing: "#10b981", done: "#10b981", error: "#ef4444"
  }[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-52 right-6 z-50 w-[420px] rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "rgba(2,6,16,0.98)",
        border: "1px solid rgba(6,182,212,0.35)",
        boxShadow: "0 0 80px rgba(6,182,212,0.12), 0 0 160px rgba(139,92,246,0.06)",
        maxHeight: "calc(100vh - 280px)"
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.12)", background: "rgba(6,182,212,0.03)" }}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.35)" }}>
            <Zap className="w-4 h-4" style={{ color: "#06b6d4" }} />
            {running && (
              <motion.div className="absolute inset-0 rounded-xl border"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ borderColor: "#06b6d4" }} />
            )}
          </div>
          <div>
            <p className="text-[11px] font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>
              AI Agentfunktion
            </p>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full" animate={running ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ background: phaseColor, boxShadow: `0 0 6px ${phaseColor}` }} />
              <p className="text-[9px] font-mono tracking-wider" style={{ color: phaseColor }}>{phaseLabel}</p>
              {currentWindowType && (
                <p className="text-[9px] font-mono text-slate-600">• {currentWindowType.replace(/_/g, " ")}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(p => !p)} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: "#64748b" }}>
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: "#64748b" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="flex flex-col overflow-hidden">

            {/* Input */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 flex items-start gap-2 px-3 py-2.5 rounded-xl border"
                  style={{ background: "rgba(15,23,42,0.8)", borderColor: running ? "rgba(6,182,212,0.4)" : "rgba(6,182,212,0.2)" }}>
                  <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
                  <textarea
                    ref={inputRef}
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), execute())}
                    placeholder="Beskriv hvad AI'en skal gøre i systemet..."
                    disabled={running}
                    rows={2}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
                  />
                </div>
                <motion.button
                  onClick={phase === "done" || phase === "error" ? reset : execute}
                  disabled={running && phase !== "done"}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 mt-0.5 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                  style={{
                    background: phase === "done" || phase === "error"
                      ? "rgba(100,116,139,0.2)"
                      : (task.trim() && !running ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(6,182,212,0.1)"),
                    boxShadow: task.trim() && !running ? "0 0 20px rgba(6,182,212,0.4)" : "none"
                  }}
                >
                  {running ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : phase === "done" || phase === "error" ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Terminal / Steps Log */}
            {steps.length > 0 ? (
              <div className="mx-4 mb-3 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(6,182,212,0.12)", maxHeight: 220, overflowY: "auto" }}>
                <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}>
                  <Terminal className="w-3 h-3" style={{ color: "#06b6d4" }} />
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#06b6d4" }}>Execution Log</span>
                  <div className="ml-auto flex gap-1">
                    {["#ef4444","#f59e0b","#10b981"].map((c, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: c, opacity: 0.6 }} />)}
                  </div>
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  {steps.map((step, i) => {
                    const Icon = PHASE_ICONS[step.phase] || ChevronRight;
                    const color = PHASE_COLORS[step.phase] || "#64748b";
                    const isLast = i === steps.length - 1;
                    return (
                      <motion.div key={step.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {isLast && running ? (
                            <Loader2 className="w-3 h-3 animate-spin" style={{ color }} />
                          ) : (
                            <Icon className="w-3 h-3" style={{ color }} />
                          )}
                        </div>
                        <span className="text-[10px] font-mono leading-relaxed" style={{ color: isLast && running ? color : "#94a3b8" }}>
                          {step.text}
                        </span>
                      </motion.div>
                    );
                  })}
                  <div ref={stepsEndRef} />
                </div>
              </div>
            ) : (
              /* Example prompts */
              <div className="px-4 pb-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2">Eksempler — klik for at bruge</p>
                <div className="space-y-1">
                  {EXAMPLES.map((ex, i) => (
                    <motion.button key={i} onClick={() => { setTask(ex); setTimeout(() => inputRef.current?.focus(), 50); }}
                      whileHover={{ x: 4 }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono transition-all"
                      style={{ color: "#64748b", background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.07)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.07)"; }}>
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      {ex}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="px-4 pb-3 flex-shrink-0">
              <p className="text-[9px] font-mono text-slate-700 text-center">
                AI åbner det rigtige modul · scanner interface · klikker og skriver som et menneske
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}