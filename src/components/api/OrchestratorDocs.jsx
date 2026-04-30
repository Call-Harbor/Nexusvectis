import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Brain, Zap, ChevronDown, ChevronRight, Network, Shield, BarChart3, Truck, Route, Users, Globe, FileText, Code2, Activity, Star, Layers } from "lucide-react";
import { toast } from "sonner";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all flex-shrink-0"
      style={{ background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#10b981" : "#64748b", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}` }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-[11px] font-mono overflow-auto text-slate-300" style={{ maxHeight: 320, lineHeight: 1.7 }}>{code}</pre>
    </div>
  );
}

function syntaxHL(json) {
  return json
    .replace(/("[\w_-]+")(\s*:)/g, '<span style="color:#06b6d4">$1</span>$2')
    .replace(/:\s*(".*?")/g, ': <span style="color:#10b981">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#f59e0b">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:#a78bfa">$1</span>');
}

function JsonBlock({ data, label }) {
  const str = JSON.stringify(data, null, 2);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: "#64748b" }}>{label}</span>
        <CopyButton text={str} />
      </div>
      <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <pre className="p-4 text-[11px] font-mono overflow-auto" style={{ maxHeight: 300, color: "#94a3b8", lineHeight: 1.6 }}>
          <code dangerouslySetInnerHTML={{ __html: syntaxHL(str) }} />
        </pre>
      </div>
    </div>
  );
}

const AGENTS = [
  { id: "harbor_fleet_analyst", name: "Fleet Analyst", category: "Fleet", color: "#06b6d4", icon: Truck, description: "Analyzes fleet utilization, vehicle health scores, idle time, and operational efficiency across all transport types.", capabilities: ["Fleet utilization metrics", "Vehicle health scoring", "Idle time analysis", "Multi-modal performance comparison"], bestFor: "Overall fleet health dashboards and efficiency reports" },
  { id: "harbor_route_optimizer", name: "Route Optimizer", category: "Routing", color: "#10b981", icon: Route, description: "Optimizes routes for cost, time, CO₂, and fuel using real-time traffic and weather data.", capabilities: ["Multi-stop route optimization", "CO₂ minimization", "Toll cost calculation", "Traffic-aware replanning"], bestFor: "Reducing transport costs and delivery times" },
  { id: "harbor_risk_engine", name: "Risk Engine", category: "Risk", color: "#ef4444", icon: Shield, description: "Identifies and scores operational, financial, and compliance risks across fleet and supply chain.", capabilities: ["Risk scoring (0–100)", "Financial exposure estimation", "Compliance flag detection", "Cascading risk analysis"], bestFor: "Risk dashboards, compliance audits, insurance reporting" },
  { id: "harbor_demand_forecaster", name: "Demand Forecaster", category: "Analytics", color: "#f59e0b", icon: BarChart3, description: "Forecasts shipment demand, capacity needs, and seasonal patterns using ML time-series models.", capabilities: ["30/60/90 day demand curves", "Seasonal adjustment", "Fleet capacity planning", "Confidence intervals"], bestFor: "Capacity planning, fleet procurement decisions" },
  { id: "harbor_financial_ai", name: "Financial AI", category: "Finance", color: "#8b5cf6", icon: Activity, description: "Performs TCO analysis, ROI calculations, budget forecasting, and invoice anomaly detection.", capabilities: ["TCO modeling", "ROI projections", "Budget variance analysis", "Invoice anomaly detection"], bestFor: "CFO dashboards, cost reduction initiatives" },
  { id: "harbor_maintenance_bot", name: "Maintenance Bot", category: "Fleet", color: "#64748b", icon: Zap, description: "Predicts component failures, schedules preventive maintenance, and estimates repair costs.", capabilities: ["Failure probability scoring", "Days-to-failure prediction", "Maintenance scheduling", "Parts cost estimation"], bestFor: "Predictive maintenance programs, downtime reduction" },
  { id: "harbor_compliance_guard", name: "Compliance Guard", category: "Compliance", color: "#f97316", icon: Shield, description: "Monitors regulatory compliance across driver hours, vehicle inspections, and cross-border rules.", capabilities: ["Driver hours compliance", "Vehicle inspection tracking", "ADR/hazmat rules", "Cross-border regulation checks"], bestFor: "EU regulatory compliance, audit trails" },
  { id: "harbor_sustainability_ai", name: "Sustainability AI", category: "ESG", color: "#22c55e", icon: Globe, description: "Calculates Scope 1/2/3 emissions, generates ESG reports, and recommends green alternatives.", capabilities: ["Scope 1/2/3 emissions", "EU ETS compliance", "Carbon offset pricing", "Green route suggestions"], bestFor: "ESG reporting, sustainability targets, carbon accounting" },
  { id: "harbor_customer_intel", name: "Customer Intel", category: "CRM", color: "#ec4899", icon: Users, description: "Analyzes customer shipment patterns, SLA compliance, and identifies churn risk and upsell opportunities.", capabilities: ["SLA compliance tracking", "Churn risk scoring", "Upsell opportunity identification", "Customer profitability analysis"], bestFor: "Customer success teams, account reviews" },
  { id: "harbor_data_miner", name: "Data Miner", category: "Analytics", color: "#06b6d4", icon: Layers, description: "Runs deep pattern recognition across historical fleet data to surface hidden correlations and anomalies.", capabilities: ["Anomaly detection", "Correlation mining", "Trend breakpoint detection", "Outlier identification"], bestFor: "Data science teams, investigation of unexpected patterns" },
  { id: "harbor_driver_coach", name: "Driver Coach", category: "HR", color: "#a78bfa", icon: Users, description: "Scores driver behavior, identifies coaching opportunities, and tracks safety improvements over time.", capabilities: ["Driver scoring (0–100)", "Harsh braking/acceleration detection", "Fuel efficiency coaching", "Safety incident tracking"], bestFor: "Driver performance programs, insurance reduction" },
  { id: "harbor_market_scout", name: "Market Scout", category: "Strategy", color: "#fbbf24", icon: Globe, description: "Monitors freight market rates, competitor activity, and emerging logistics trends.", capabilities: ["Market rate benchmarking", "Competitor analysis", "Trend detection", "Opportunity identification"], bestFor: "Pricing strategy, competitive positioning" },
  { id: "harbor_ops_commander", name: "Ops Commander", category: "Operations", color: "#06b6d4", icon: Network, description: "Provides command-level situational awareness across all active operations, escalations, and exceptions.", capabilities: ["Real-time operations overview", "Exception management", "Escalation prioritization", "Dispatch recommendations"], bestFor: "Control room dashboards, operations managers" },
  { id: "harbor_document_ai", name: "Document AI", category: "Documents", color: "#94a3b8", icon: FileText, description: "Extracts, classifies, and validates logistics documents including CMR, BOL, and customs forms.", capabilities: ["CMR/BOL extraction", "Customs form validation", "Document classification", "Data reconciliation"], bestFor: "Document processing automation, customs compliance" },
  { id: "harbor_strategy_ai", name: "Strategy AI", category: "Strategy", color: "#8b5cf6", icon: Brain, description: "Generates long-term strategic recommendations for network design, fleet mix, and market expansion.", capabilities: ["Network optimization", "Fleet mix modeling", "Market expansion analysis", "Strategic roadmap generation"], bestFor: "C-suite strategy sessions, annual planning" },
  { id: "harbor_security_ai", name: "Security AI", category: "Security", color: "#ef4444", icon: Shield, description: "Detects cargo theft patterns, route security risks, and suspicious activity in fleet telemetry.", capabilities: ["Theft pattern detection", "Route security scoring", "Anomalous stop detection", "Geofence breach alerting"], bestFor: "High-value cargo operations, insurance compliance" },
  { id: "harbor_api_integrator", name: "API Integrator", category: "Tech", color: "#06b6d4", icon: Code2, description: "Generates integration code, maps data schemas, and validates API connections between systems.", capabilities: ["Code generation", "Schema mapping", "API validation", "Integration testing"], bestFor: "Development teams, system integration projects" },
  { id: "harbor_nlp_engine", name: "NLP Engine", category: "AI", color: "#a78bfa", icon: Brain, description: "Natural language processing for logistics documents, customer communications, and command interpretation.", capabilities: ["Intent classification", "Entity extraction", "Sentiment analysis", "Command parsing"], bestFor: "Customer service automation, document understanding" },
];

const MODES = [
  {
    id: "auto", label: "auto", color: "#06b6d4",
    title: "Auto-Routing",
    description: "The orchestrator analyzes your message and automatically selects the most relevant agents. Ideal for general queries where you don't know which agents to use.",
    when: "Use when: you want the smartest result without specifying agents manually.",
    example: { message: "Give me a full operational briefing for today", mode: "auto" },
    response: { mode: "auto", agents_selected: ["harbor_ops_commander", "harbor_risk_engine", "harbor_fleet_analyst"], synthesis: "Fleet running at 84% utilization with 2 critical maintenance alerts. Route CPH→HAM showing 23% delay risk.", total_latency_ms: 4200 }
  },
  {
    id: "parallel", label: "parallel", color: "#10b981",
    title: "Parallel Execution",
    description: "All specified agents run simultaneously and their outputs are synthesized into a unified response. Fastest mode for multi-domain analysis.",
    when: "Use when: you need multiple domain perspectives at once (e.g. risk + sustainability + finance).",
    example: { message: "Analyze risk, sustainability impact, and cost for our current routes", mode: "parallel", agents: ["harbor_risk_engine", "harbor_sustainability_ai", "harbor_financial_ai"] },
    response: { mode: "parallel", results: [{ agent: "harbor_risk_engine", output: "Risk score: 67/100. Two high-severity exposures." }, { agent: "harbor_sustainability_ai", output: "CO₂: 2,340kg this week. 12% above target." }, { agent: "harbor_financial_ai", output: "Current route costs 18% above benchmark." }], synthesis: "High-priority: reroute CPH→HAM to reduce both risk and emissions simultaneously.", total_latency_ms: 3800 }
  },
  {
    id: "sequential", label: "sequential", color: "#8b5cf6",
    title: "Sequential Chain",
    description: "Agents run one after another, with each agent's output feeding into the next as context. Use for workflows where order matters.",
    when: "Use when: agents have dependencies (e.g. first analyze fleet health, then plan maintenance, then estimate cost).",
    example: { message: "Identify failing vehicles, plan maintenance, then estimate repair budget", mode: "sequential", agents: ["harbor_maintenance_bot", "harbor_financial_ai"] },
    response: { mode: "sequential", chain: [{ agent: "harbor_maintenance_bot", output: "3 vehicles at >70% failure probability: TRUCK-004, SHIP-002, DRONE-01" }, { agent: "harbor_financial_ai", input_context: "maintenance_bot_output", output: "Estimated repair budget: €34,200. TRUCK-004 most urgent (€18k)." }], total_latency_ms: 5600 }
  },
  {
    id: "debate", label: "debate", color: "#f59e0b",
    title: "Agent Debate",
    description: "Multiple agents analyze the same problem from different perspectives, then a synthesizer produces a balanced conclusion.",
    when: "Use when: you want conflicting expert opinions reconciled (e.g. cost vs. sustainability tradeoffs).",
    example: { message: "Should we switch our Hamburg route to electric trucks?", mode: "debate", agents: ["harbor_financial_ai", "harbor_sustainability_ai", "harbor_risk_engine"] },
    response: { mode: "debate", positions: [{ agent: "harbor_financial_ai", stance: "Against", reasoning: "€180k upfront cost, 4.2yr payback period." }, { agent: "harbor_sustainability_ai", stance: "For", reasoning: "Reduces CO₂ by 78%, qualifies for €40k EU green subsidy." }, { agent: "harbor_risk_engine", stance: "Neutral", reasoning: "Charging infrastructure risk moderate. Suggest phased rollout." }], consensus: "Phased rollout recommended: 2 electric trucks in Q3 to validate economics before full fleet conversion.", total_latency_ms: 7200 }
  },
  {
    id: "hierarchical", label: "hierarchical", color: "#ec4899",
    title: "Hierarchical",
    description: "A supervisor agent breaks your task into subtasks, delegates to specialist agents, then aggregates results.",
    when: "Use when: your task is complex and naturally decomposes into sub-problems across domains.",
    example: { message: "Full quarterly review: operations, finance, compliance, and sustainability", mode: "hierarchical" },
    response: { mode: "hierarchical", supervisor: "harbor_strategy_ai", delegated_to: ["harbor_ops_commander", "harbor_financial_ai", "harbor_compliance_guard", "harbor_sustainability_ai"], synthesis: "Q2 Summary: Ops efficiency +4%, costs up 7% (fuel), compliance 94%, CO₂ down 8%. Priority: fuel hedging strategy.", total_latency_ms: 9100 }
  },
  {
    id: "broadcast", label: "broadcast", color: "#a78bfa",
    title: "Broadcast",
    description: "Your message is sent to all 50+ agents simultaneously. Each responds independently. Best for comprehensive intelligence sweeps.",
    when: "Use when: you want maximum coverage across every domain — no blind spots.",
    example: { message: "What are the top 3 opportunities to improve fleet performance right now?", mode: "broadcast" },
    response: { mode: "broadcast", agents_invoked: 52, top_responses: [{ agent: "harbor_route_optimizer", insight: "Consolidating 4 overlapping routes saves €12,400/month." }, { agent: "harbor_driver_coach", insight: "Top 10% driver fuel efficiency gap: 18% potential savings." }, { agent: "harbor_maintenance_bot", insight: "Proactive maintenance on 5 vehicles prevents €28k in emergency repairs." }], total_latency_ms: 8400 }
  },
];

const COMBO_RECIPES = [
  {
    title: "Full Fleet Health Audit",
    mode: "parallel",
    agents: ["harbor_fleet_analyst", "harbor_maintenance_bot", "harbor_risk_engine"],
    description: "Combines utilization analysis, predictive maintenance, and risk scoring for a complete fleet health snapshot.",
    example_message: "Run a complete fleet health audit across all vehicles"
  },
  {
    title: "Cost Reduction Analysis",
    mode: "sequential",
    agents: ["harbor_route_optimizer", "harbor_financial_ai"],
    description: "First optimizes routes, then feeds results to Financial AI to quantify savings and calculate ROI.",
    example_message: "Identify route optimizations and calculate their financial impact"
  },
  {
    title: "ESG & Compliance Report",
    mode: "parallel",
    agents: ["harbor_sustainability_ai", "harbor_compliance_guard"],
    description: "Simultaneously generates Scope 1/2/3 emissions data and checks regulatory compliance status.",
    example_message: "Generate our monthly ESG and compliance status report"
  },
  {
    title: "Strategic Investment Decision",
    mode: "debate",
    agents: ["harbor_financial_ai", "harbor_sustainability_ai", "harbor_market_scout", "harbor_risk_engine"],
    description: "Four agents debate a major decision from cost, sustainability, market, and risk angles before consensus.",
    example_message: "Should we expand our fleet by 20 electric trucks in Q3?"
  },
  {
    title: "Customer Retention Deep Dive",
    mode: "sequential",
    agents: ["harbor_customer_intel", "harbor_strategy_ai"],
    description: "Customer Intel identifies at-risk accounts, then Strategy AI generates targeted retention playbooks.",
    example_message: "Identify churning customers and create retention strategies"
  },
  {
    title: "Ops + Security Emergency",
    mode: "parallel",
    agents: ["harbor_ops_commander", "harbor_security_ai", "harbor_risk_engine"],
    description: "Rapid multi-agent response for operational incidents, security breaches, or critical risk events.",
    example_message: "We have a cargo incident on TRUCK-004 — what's the full situation and response plan?"
  },
];

export default function OrchestratorDocs() {
  const [selectedMode, setSelectedMode] = useState("auto");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [codeLang, setCodeLang] = useState("curl");

  const categories = ["All", ...Array.from(new Set(AGENTS.map(a => a.category)))];
  const filteredAgents = categoryFilter === "All" ? AGENTS : AGENTS.filter(a => a.category === categoryFilter);
  const activeMode = MODES.find(m => m.id === selectedMode);

  const generateOrchestratorCode = (lang, example) => {
    const url = "https://api.nexusvectis.com/functions/harborOrchestratorAPI";
    const body = JSON.stringify(example, null, 2);
    if (lang === "curl") return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: sk_live_YOUR_API_KEY" \\\n  -d '${body}'`;
    if (lang === "python") return `import requests\n\nresponse = requests.post(\n    "${url}",\n    headers={\n        "Content-Type": "application/json",\n        "X-API-Key": "sk_live_YOUR_API_KEY"\n    },\n    json=${body}\n)\nprint(response.json())`;
    if (lang === "javascript") return `const response = await fetch("${url}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "sk_live_YOUR_API_KEY"\n  },\n  body: JSON.stringify(${body})\n});\nconst data = await response.json();\nconsole.log(data);`;
    return "";
  };

  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="p-8 rounded-2xl relative overflow-hidden" style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }} />
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(6,182,212,0.2))", border: "1px solid rgba(167,139,250,0.4)" }}>
            <Network className="w-6 h-6" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-black tracking-widest uppercase" style={{ color: "#a78bfa" }}>ULTRA PREMIUM</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>€0.50/call</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">H.A.R.B.O.R. Orchestrator API</h1>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "#64748b" }}>
              The world's most advanced multi-agent logistics intelligence engine. Coordinate 50+ specialized AI agents in 6 orchestration modes — from simple parallel analysis to full hierarchical reasoning and agent debate. Each agent is a domain expert; the orchestrator makes them work as one superintelligence.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Specialized Agents", value: "50+", color: "#a78bfa" },
            { label: "Orchestration Modes", value: "6", color: "#06b6d4" },
            { label: "Avg Latency", value: "3–8s", color: "#10b981" },
            { label: "Cost / Call", value: "€0.50", color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#475569" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Orchestration Modes */}
      <div>
        <h2 className="text-xl font-black text-white mb-1">Orchestration Modes</h2>
        <p className="text-xs mb-5" style={{ color: "#475569" }}>Choose how agents collaborate to solve your task. The <code className="text-cyan-400">mode</code> parameter controls the execution strategy.</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setSelectedMode(m.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-black font-mono uppercase tracking-widest transition-all"
              style={{ background: selectedMode === m.id ? `${m.color}20` : "rgba(255,255,255,0.03)", color: selectedMode === m.id ? m.color : "#475569", border: selectedMode === m.id ? `1px solid ${m.color}50` : "1px solid rgba(255,255,255,0.06)" }}>
              {m.label}
            </button>
          ))}
        </div>

        {activeMode && (
          <motion.div key={activeMode.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${activeMode.color}25` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded" style={{ background: `${activeMode.color}18`, color: activeMode.color, border: `1px solid ${activeMode.color}40` }}>mode: "{activeMode.id}"</span>
                </div>
                <h3 className="text-lg font-black text-white mb-2">{activeMode.title}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>{activeMode.description}</p>
                <div className="p-3 rounded-lg" style={{ background: `${activeMode.color}0a`, border: `1px solid ${activeMode.color}20` }}>
                  <p className="text-[11px] font-mono" style={{ color: activeMode.color }}>💡 {activeMode.when}</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-2 mb-3">
                  {["curl", "python", "javascript"].map(l => (
                    <button key={l} onClick={() => setCodeLang(l)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                      style={{ background: codeLang === l ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)", color: codeLang === l ? "#06b6d4" : "#475569", border: codeLang === l ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                      {l}
                    </button>
                  ))}
                </div>
                <CodeBlock code={generateOrchestratorCode(codeLang, activeMode.example)} lang={codeLang} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-3" style={{ color: "#64748b" }}>Request Body</p>
                <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <pre className="p-4 text-[11px] font-mono overflow-auto text-slate-300" style={{ maxHeight: 200, lineHeight: 1.6 }}>
                    <code dangerouslySetInnerHTML={{ __html: syntaxHL(JSON.stringify(activeMode.example, null, 2)) }} />
                  </pre>
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-3" style={{ color: "#64748b" }}>Example Response</p>
                <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <pre className="p-4 text-[11px] font-mono overflow-auto text-slate-300" style={{ maxHeight: 240, lineHeight: 1.6 }}>
                    <code dangerouslySetInnerHTML={{ __html: syntaxHL(JSON.stringify(activeMode.response, null, 2)) }} />
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Request Schema */}
      <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-lg font-black text-white mb-4">Request Schema</h2>
        <div className="space-y-2">
          {[
            { param: "message", type: "string", required: true, desc: "Natural language instruction for the agent(s). Be specific — agents use this to determine what analysis to perform." },
            { param: "mode", type: "string", required: false, desc: "Orchestration mode: auto (default), parallel, sequential, debate, hierarchical, broadcast." },
            { param: "agents", type: "string[]", required: false, desc: "Agent IDs to invoke. Omit for auto-routing. Required for parallel, sequential, and debate modes. See agent list below." },
            { param: "context", type: "object", required: false, desc: "Additional context injected into every agent prompt (e.g. organization name, date range, custom constraints)." },
            { param: "max_agents", type: "number", required: false, desc: "Cap on agents invoked in broadcast/auto mode. Default: unlimited." },
            { param: "synthesis", type: "boolean", required: false, desc: "Whether to produce a unified synthesis of all agent outputs. Default: true." },
          ].map(p => (
            <div key={p.param} className="flex gap-4 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex-shrink-0 w-44">
                <code className="text-sm font-mono font-bold" style={{ color: "#06b6d4" }}>{p.param}</code>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: "#475569" }}>{p.type}</span>
                  {p.required && <span className="text-[8px] font-black px-1 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>REQUIRED</span>}
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Catalog */}
      <div>
        <h2 className="text-xl font-black text-white mb-1">Agent Catalog</h2>
        <p className="text-xs mb-4" style={{ color: "#475569" }}>Use these exact agent IDs in the <code className="text-cyan-400">agents</code> array. Click any agent for full details.</p>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ background: categoryFilter === cat ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)", color: categoryFilter === cat ? "#06b6d4" : "#475569", border: categoryFilter === cat ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAgents.map(agent => {
            const Icon = agent.icon;
            const isOpen = selectedAgent === agent.id;
            return (
              <motion.div key={agent.id} layout className="rounded-xl overflow-hidden" style={{ background: isOpen ? `${agent.color}06` : "rgba(255,255,255,0.02)", border: isOpen ? `1px solid ${agent.color}30` : "1px solid rgba(255,255,255,0.05)" }}>
                <button className="w-full text-left p-4" onClick={() => setSelectedAgent(isOpen ? null : agent.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-white">{agent.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}25` }}>{agent.category}</span>
                      </div>
                      <code className="text-[10px] font-mono" style={{ color: "#334155" }}>{agent.id}</code>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CopyButton text={agent.id} />
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden" style={{ borderTop: `1px solid ${agent.color}15` }}>
                      <div className="p-4 space-y-3">
                        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{agent.description}</p>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Capabilities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.capabilities.map(c => (
                              <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${agent.color}0d`, color: agent.color, border: `1px solid ${agent.color}20` }}>{c}</span>
                            ))}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-[10px] font-mono" style={{ color: "#475569" }}>Best for: <span style={{ color: "#94a3b8" }}>{agent.bestFor}</span></p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Combination Recipes */}
      <div>
        <h2 className="text-xl font-black text-white mb-1">Combination Recipes</h2>
        <p className="text-xs mb-5" style={{ color: "#475569" }}>Proven agent combinations for common enterprise use cases. Copy and adapt these patterns.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COMBO_RECIPES.map(recipe => (
            <div key={recipe.title} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-black text-white mb-1">{recipe.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{recipe.description}</p>
                </div>
                <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                  {recipe.mode}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {recipe.agents.map(a => {
                  const agent = AGENTS.find(ag => ag.id === a);
                  return (
                    <span key={a} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: agent ? `${agent.color}12` : "rgba(255,255,255,0.05)", color: agent?.color || "#64748b", border: `1px solid ${agent ? agent.color + "25" : "rgba(255,255,255,0.08)"}` }}>
                      {a}
                    </span>
                  );
                })}
              </div>
              <div className="rounded-lg p-3 flex items-center justify-between gap-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <code className="text-[10px] font-mono text-slate-400 flex-1 min-w-0 truncate">"{recipe.example_message}"</code>
                <CopyButton text={JSON.stringify({ message: recipe.example_message, mode: recipe.mode, agents: recipe.agents }, null, 2)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}