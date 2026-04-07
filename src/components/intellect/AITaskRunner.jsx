import { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bot, Send, X, Loader2, CheckCircle2, ChevronRight, Zap, Brain, Eye, MousePointer, Keyboard, ScrollText, Terminal, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useHologramAIAgentAdvanced } from "./HologramAIAgentAdvanced";
import { toast } from "sonner";

const WINDOW_MAP = [
  { keywords: /lav en rute|opret rute|ny rute|create route|new route|lave en route|lav route/i, window: "routes" },
  { keywords: /optimer rute|route optimiz|optimér|optimer eksist/i, window: "route_optimizer" },
  { keywords: /fleet map|flåde kort|live track|live map|se på kort|find køretøj|track/i, window: "fleet_map" },
  { keywords: /vedligehold|maintenance|service|reparation|nedbrud/i, window: "predictive_maintenance" },
  { keywords: /performance|ydelse|effektivitet|kpi|statistik/i, window: "performance_analytics" },
  { keywords: /prognose|forecast|demand|efterspørgsel|forudsig/i, window: "demand_forecast" },
  { keywords: /risiko|risk|fare|sikkerhed/i, window: "risk_assessment" },
  { keywords: /dokument|document|kontrakt|skriv brev|rapport|cmr|bol/i, window: "document_editor" },
  { keywords: /regneark|spreadsheet|tabel|excel/i, window: "spreadsheet_editor" },
  { keywords: /vejr|weather|satellit/i, window: "satellite_weather" },
  { keywords: /nyheder|news/i, window: "news_intelligence" },
  { keywords: /projekt|project|opgaver|kanban/i, window: "project_management" },
  { keywords: /port|havn|vessel|skib|berth|crane/i, window: "port_command" },
  { keywords: /lufthavn|airport|fly|gate|bagage|turnaround/i, window: "airport_ops" },
  { keywords: /dyb analyse|deep analysis|anomali|mønster/i, window: "deep_analysis" },
  { keywords: /swarm|sværm/i, window: "swarm_intelligence" },
  { keywords: /digital twin|tvilling/i, window: "digital_twin" },
  { keywords: /køretøj|vehicle|lastbil|flåde admin|fleet admin/i, window: "fleet" },
  { keywords: /forsendelse|shipment|levering|pakke/i, window: "shipments" },
  { keywords: /alert|alarm|advarsel/i, window: "alerts" },
  { keywords: /crm|kunde|deal|pipeline|salg/i, window: "crm" },
  { keywords: /chauf|driver|kører/i, window: "drivers" },
  { keywords: /faktura|invoice|billing|regning/i, window: "invoices" },
  { keywords: /ressource|resource|depot|lager|warehouse/i, window: "resources" },
  { keywords: /hr|medarbejder|employee|orlov|leave|rekrutter/i, window: "hr" },
  { keywords: /drive|filer|files|upload/i, window: "fleet_drive" },
  { keywords: /paralel|parallel|multiple task/i, window: "parallel_processor" },
  { keywords: /3d|globe|viewer/i, window: "fleet_3d_viewer" },
  { keywords: /builder|byg app|custom app/i, window: "harbor_app_builder" },
  { keywords: /store|installere|add-on/i, window: "fleet_store" },
  { keywords: /billede|image gen|generer billede/i, window: "image_generator" },
  { keywords: /global søg|search everything/i, window: "global_search" },
  { keywords: /browser|hjemmeside|website/i, window: "web_browser" },
  { keywords: /transit|bus|linje|stoppested/i, window: "transit_console" },
  { keywords: /ide|kode|code|deploy/i, window: "ai_dev_ide" },
  { keywords: /neuro|risk fusion/i, window: "neuro_risk" },
  { keywords: /virksomhed|company research|analyst/i, window: "company_analytics" },
  { keywords: /profil|person|people intel/i, window: "profile_search" },
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
  "Lav en ny rute fra København til Aarhus med truck",
  "Åbn fleet map og find alle aktive lastbiler",
  "Åbn vedligeholdelse og vis køretøjer med kritisk service snart",
  "Opret en ny forsendelse fra Hamburg til London",
  "Åbn HR og tilføj en ny medarbejder",
  "Åbn CRM og opret en ny deal",
  "Vis performance analytics og tjek CO₂-emissioner",
  "Åbn port command og se vessel queue status",
  "Åbn airport ops og tjek gate status",
  "Generer et nyt dokument — CMR waybill",
  "Åbn demand forecast og analyser næste måneds kapacitet",
  "Start et nyt projekt i project management",
  "Søg i global search efter alle kritiske alerts",
  "Åbn Fleet Drive og upload en ny fil",
];

export default function AITaskRunner({ onOpenWindow, windowRefs, orgId, onClose }) {
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | scanning | planning | executing | done | error
  const [steps, setSteps] = useState([]);
  const [currentWindowType, setCurrentWindowType] = useState(null);
  const [planPreview, setPlanPreview] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);
  const stepsEndRef = useRef(null);
  const inputRef = useRef(null);
  const { runTask } = useHologramAIAgentAdvanced();

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const addStep = (text, stepPhase) => {
    setSteps(prev => [...prev, { text, phase: stepPhase, id: `${Date.now()}-${Math.random()}-${prev.length}` }]);
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
        const NEXUSVECTIS_KNOWLEDGE = [
          `You are an expert AI operator of NexusVectis — an advanced AI logistics platform.`,
          `The platform uses holographic windows (holograms) that float on the IntellectMode desktop.`,
          `Each hologram is interactive: you click buttons, fill forms, navigate tabs, and read data.`,
          ``,
          `ALL AVAILABLE MODULES (window keys):`,
          `fleet => Vehicle list: add/edit/delete vehicles, tabs: All/Active/Maintenance/Offline`,
          `fleet_map => Live GPS tracking map with moving vehicle dots`,
          `fleet_3d_viewer => 3D globe visualization of entire fleet`,
          `routes => CREATE/VIEW routes. Has: Create Route button, form fields: name/origin/destination/transport/priority`,
          `route_optimizer => AI optimization of EXISTING routes for fuel/time savings`,
          `shipments => Shipment tracking: tracking numbers, status, ETA, cold chain`,
          `alerts => System alerts: critical/warning/info. Dismiss, resolve, filter`,
          `predictive_maintenance => AI maintenance prediction: failure probability, schedule`,
          `performance_analytics => KPI dashboards: efficiency, CO2, on-time delivery`,
          `demand_forecast => AI demand predictions: 30/60/90 day forecasts`,
          `risk_assessment => Operational risk scores, safety incidents, mitigation`,
          `satellite_weather => Real-time satellite weather, storm warnings, route impact`,
          `news_intelligence => Logistics news feed with AI analysis`,
          `document_editor => AI document editor: CMR, BOL, contracts, reports`,
          `spreadsheet_editor => Excel-like spreadsheet for data tables`,
          `project_management => Kanban board: tasks, milestones, team assignments`,
          `swarm_intelligence => Multi-vehicle swarm coordination`,
          `digital_twin => Digital twin federation: virtual asset copies`,
          `neuro_risk => Neuro-symbolic AI risk fusion: advanced multi-source risk modeling`,
          `deep_analysis => Deep AI data analysis: patterns, anomalies, historical trends`,
          `crm => CRM: customers, deals, pipeline, activities, contracts`,
          `drivers => Driver management: profiles, licenses, performance, certifications`,
          `vehicles => Fleet vehicle management (alias for fleet)`,
          `maintenance => Maintenance records and scheduling`,
          `hr => HR Management: employees, leave, performance reviews, recruitment, training`,
          `invoices => Invoice management: billing, PDF generation, payment tracking`,
          `resources => Resource management: warehouses, fuel depots, ports`,
          `fleet_drive => File storage: documents, assets, folders`,
          `fleet_ai_trainer => H.A.R.B.O.R AI trainer: train custom AI workers`,
          `parallel_processor => Parallel task processor: run multiple AI tasks simultaneously`,
          `vehicle_builder => Transport builder and simulator`,
          `harbor_app_builder => H.A.R.B.O.R App Builder: create custom fleet apps`,
          `fleet_store => Fleet Store: install add-on apps`,
          `image_generator => AI image generator for logistics visuals`,
          `image_editor => AI image editor`,
          `global_search => Global search across all entities`,
          `web_browser => In-app web browser`,
          `nexus_chat => Nexus satellite chat`,
          `transit_console => Transit Control: bus lines, stops, demand forecasting, DRT`,
          `port_command => Port Command Center: vessels, berths, containers, cranes, yard`,
          `airport_ops => Airport Ops Center: flights, gates, baggage, ground handling`,
          `ai_dev_ide => Fleet AI IDE & DevOps: code editor, deployment`,
          `company_analytics => Company research and analytics`,
          `profile_search => People intelligence: professional profiles`,
          `dashboard => Main dashboard with fleet overview KPIs`,
          ``,
          `ROUTING RULES (use EXACT window key):`,
          `lav rute / opret rute / ny rute / create route => routes`,
          `optimer rute / route optimiz => route_optimizer`,
          `live track / GPS / find køretøj / fleet map => fleet_map`,
          `service / vedligehold / maintenance => predictive_maintenance`,
          `performance / KPI / effektivitet / CO2 => performance_analytics`,
          `forsendelse / shipment / levering => shipments`,
          `prognose / forecast / efterspørgsel => demand_forecast`,
          `risiko / risk / sikkerhed => risk_assessment`,
          `alert / alarm / advarsel => alerts`,
          `port / havn / vessel / berth / crane => port_command`,
          `lufthavn / airport / fly / gate / bagage => airport_ops`,
          `dokument / CMR / BOL / rapport / kontrakt => document_editor`,
          `regneark / spreadsheet / excel => spreadsheet_editor`,
          `vejr / weather / storm => satellite_weather`,
          `nyheder / news => news_intelligence`,
          `projekt / kanban / opgave => project_management`,
          `swarm / sværm => swarm_intelligence`,
          `digital twin / tvilling => digital_twin`,
          `crm / kunde / deal / pipeline => crm`,
          `chauf / driver / kører => drivers`,
          `faktura / invoice / billing => invoices`,
          `ressource / depot / lager => resources`,
          `medarbejder / employee / hr / orlov => hr`,
          `filer / drive / upload => fleet_drive`,
          `transit / bus / linje => transit_console`,
          `ide / kode / code / deploy => ai_dev_ide`,
          `neuro / risk fusion => neuro_risk`,
          `dyb analyse / deep analysis => deep_analysis`,
          `virksomhed / company research => company_analytics`,
          `profil / person / people intel => profile_search`,
          `billede / image gen => image_generator`,
          `parallel / multiple tasks => parallel_processor`,
          `3d / globe viewer => fleet_3d_viewer`,
          `store / installere => fleet_store`,
          `global søg / search everything => global_search`,
          `browser / hjemmeside => web_browser`,
        ].join('\n');

        const plan = await base44.integrations.Core.InvokeLLM({
          prompt: `${NEXUSVECTIS_KNOWLEDGE}\n\nUser task: "${task}"\n\nPick the single best window key and write a concise English task description.\n\nReturn JSON only: { "window": "exact_window_key", "task": "what to do in this window" }`,
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

      // Phase 2: Open window (instant, don't wait)
      onOpenWindow(windowType, preciseTask);
      addStep(`Hologram aktiveret ✓`, "narrate");
      await new Promise(r => setTimeout(r, 200));

      // Phase 3: Wait for hologram to fully load
      let newestRef = null;
      let contentFound = false;
      for (let attempt = 0; attempt < 15; attempt++) {
        const refs = Object.entries(windowRefs.current || {});
        if (refs.length > 0) {
          newestRef = refs[refs.length - 1][1];
          if (newestRef) {
            const buttons = newestRef?.querySelectorAll("button, [role='button']") || [];
            const inputs = newestRef?.querySelectorAll("input, textarea, select, [role='combobox']") || [];
            const text = newestRef?.textContent?.trim().length > 20;
            if ((buttons.length > 1 || inputs.length > 0) && text) {
              contentFound = true;
              break;
            }
          }
        }
        addStep(`Indlæser hologram (${attempt + 1}/15)...`, "think");
        await new Promise(r => setTimeout(r, 500));
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
      const errorDetails = {
        message: err.message || "Ukendt fejl",
        type: err.name || "Error",
        suggestions: generateSuggestions(err.message, currentWindowType),
        timestamp: new Date().toLocaleString("da-DK")
      };
      setError(errorDetails);
      addStep(`❌ Fejl: ${errorDetails.message}`, "error");
      setPhase("error");
      toast.error(errorDetails.message);
    }

    setRunning(false);
  };

  const generateSuggestions = (errorMsg, wType) => {
    const suggestions = [];
    const msg = errorMsg?.toLowerCase() || "";
    
    if (msg.includes("not found")) suggestions.push("Elementet blev ikke fundet - prøv at specificere opgaven mere klart");
    if (msg.includes("timeout")) suggestions.push("Timeout - vinduet tager for lang tid at loade. Prøv igen eller åbn modulet manuelt");
    if (msg.includes("undefined")) suggestions.push("Modulet er ikke helt loadet. Vent et øjeblik og prøv igen");
    if (msg.includes("disabled")) suggestions.push("Feltet er deaktiveret - tjek formens vilkår eller krav");
    if (msg.includes("permission")) suggestions.push("Adgang nægtet - du har muligvis ikke rettigheder til denne handling");
    if (!suggestions.length) suggestions.push("Prøv at formulere opgaven anderledes eller åbn modulet manuelt");
    
    return suggestions;
  };

  const reset = () => {
    setTask("");
    setSteps([]);
    setPhase("idle");
    setCurrentWindowType(null);
    setPlanPreview(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleRetry = () => {
    setError(null);
    setSteps([]);
    setPhase("idle");
    setTimeout(() => execute(), 100);
  };

  const handleReport = () => {
    const report = `Error Report\nTidspunkt: ${error?.timestamp}\nFejl: ${error?.message}\nType: ${error?.type}\nOpgave: ${task}\nModul: ${currentWindowType || "unknown"}`;
    navigator.clipboard.writeText(report);
    toast.success("Fejlrapport kopieret til clipboard");
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

            {/* Error Panel */}
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-3 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-2 mb-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>Fejl opstod</p>
                      <p className="text-[9px] text-slate-400 mt-1">{error.message}</p>
                    </div>
                  </div>
                  {error.suggestions && error.suggestions.length > 0 && (
                    <div className="mb-2.5 pl-5 border-l" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                      <p className="text-[8px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Forslag:</p>
                      {error.suggestions.map((sug, i) => (
                        <p key={i} className="text-[9px] text-slate-400 mb-1">• {sug}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2.5 border-t" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                    <motion.button onClick={handleRetry} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-all"
                      style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}>
                      ↻ Prøv igen
                    </motion.button>
                    <motion.button onClick={handleReport} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-all"
                      style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(168,85,247,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(168,85,247,0.2)"}>
                      📋 Rapportér
                    </motion.button>
                    <motion.button onClick={reset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-all"
                      style={{ background: "rgba(100,116,139,0.2)", color: "#64748b" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(100,116,139,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(100,116,139,0.2)"}>
                      Lukket
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom hint */}
            {!error && (
              <div className="px-4 pb-3 flex-shrink-0">
                <p className="text-[9px] font-mono text-slate-700 text-center">
                  AI åbner det rigtige modul · scanner interface · klikker og skriver som et menneske
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}