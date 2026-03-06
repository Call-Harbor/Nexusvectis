import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Route, Database, Cpu, Shield, Globe, Activity, 
  ArrowRight, Layers, Brain, Satellite,
  TrendingUp, AlertTriangle, Wrench, BarChart3, Lock, Server,
  Network, Eye, FlaskConical, Workflow, GitBranch, Radar,
  Package, Users, FileText, MapPin, Wind, DollarSign,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Target, Gauge,
  Terminal, Radio, Crosshair, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ACRONYM = [
  { letter: "H", word: "Holographic", color: "text-cyan-400", shadow: "0 0 40px #06b6d4" },
  { letter: "A", word: "Autonomous", color: "text-violet-400", shadow: "0 0 40px #8b5cf6" },
  { letter: "R", word: "Routing", color: "text-emerald-400", shadow: "0 0 40px #10b981" },
  { letter: "B", word: "& Base", color: "text-amber-400", shadow: "0 0 40px #f59e0b" },
  { letter: "O", word: "Operations", color: "text-orange-400", shadow: "0 0 40px #f97316" },
  { letter: "R", word: "Regulator", color: "text-rose-400", shadow: "0 0 40px #fb7185" },
];

const HERO_STATS = [
  { value: "49", label: "PARALLEL ANALYSES", sub: "fired per command", color: "text-amber-400" },
  { value: "128K", label: "TOKEN CONTEXT", sub: "per single query", color: "text-cyan-400" },
  { value: "15+", label: "ENTITY ACTIONS", sub: "fully autonomous", color: "text-violet-400" },
  { value: "6", label: "REASONING STEPS", sub: "every response", color: "text-emerald-400" },
];

const ARCHITECTURE_STEPS = [
  { step: "01", title: "Parse", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/5", desc: "Decode what the operator actually needs — not just what they typed", detail: "HARBOR's intent engine disassembles every input into three layers: the explicit request, the implicit operational need, and the unstated constraint. It determines in milliseconds whether the operator needs an answer, a visualization, a platform action, an escalation — or all four simultaneously. Ambiguity is resolved before processing begins, not after." },
  { step: "02", title: "Knowledge Sweep", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5", desc: "Traverse the full HARBOR corpus and injected org knowledge", detail: "In parallel, HARBOR queries its embedded domain knowledge — 48 logistics verticals, 200+ regulatory frameworks, benchmark databases from 6 transport modes — and the organization's own injected training data from the HARBOR Trainer. Custom SOPs, tariff tables, and operational playbooks become part of HARBOR's reasoning context automatically." },
  { step: "03", title: "Context Sweep", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", desc: "Hydrate with live platform reality — not stale assumptions", detail: "HARBOR pulls real-time operational state: exact vehicle GPS positions and statuses, every unresolved alert, all active route deviations, current shipment ETAs with confidence intervals, maintenance schedules, warehouse utilization rates, and open exception tickets. Every answer is grounded in what is actually happening right now — not a static snapshot." },
  { step: "04", title: "Causal Reasoning", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", desc: "Find root causes — never treat symptoms", detail: "HARBOR constructs causal dependency graphs before forming a single conclusion. A truck with a 67% efficiency score is not the problem — it's the downstream effect of a driver assignment error, compounded by a miscalibrated tire pressure sensor, compounded by a suboptimal depot departure window. HARBOR traces the full causal chain and reports the actual lever to pull, not the surface metric." },
  { step: "05", title: "Synthesize", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5", desc: "Model consequences across three time horizons — all quantified", detail: "Every recommendation is stress-tested across three consequence layers before surfacing: immediate operational impact (1st order, hours), ripple effects on interdependent systems (2nd order, days), and strategic drift (3rd order, 1–6 months). All impacts are converted to EUR. HARBOR will not surface a recommendation that solves one problem while silently creating two others." },
  { step: "06", title: "Proact", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/5", desc: "Deliver what you asked — plus what you should have asked", detail: "HARBOR's proactive intelligence layer runs continuously alongside every query, scanning for anomalies, regulatory deadline exposures, cost leakage, emerging demand signals, and fleet health degradation. The single most critical unsolicited finding is appended to every response. Operators consistently report that the proactive insight is more valuable than their original question." },
];

const INTEGRATIONS = [
  { icon: Network, label: "IntellectMode", desc: "HARBOR's primary command surface. Every natural language input is parsed for intent, routed to harborCore, and resolved into one of 12 action types — ANSWER, OPEN_WINDOW, SHOW_ANALYSIS, CREATE_DOCUMENT, SHOW_3D, and more. Hologram windows are orchestrated in real time.", color: "text-cyan-400", badge: "Live" },
  { icon: Radar, label: "Fleet AI API", desc: "Production-grade external API with Bearer token auth. Keys are SHA-256 hashed on creation and never stored in plaintext. Every inference call loads a saved FleetAIModel snapshot, routes through harborCore, and logs latency, status, and response to APIUsage for billing and audit.", color: "text-violet-400", badge: "REST API" },
  { icon: FlaskConical, label: "HARBOR Trainer", desc: "Operator-facing knowledge injection layer. Upload FAQs, crawl documentation URLs, attach SOPs and rate tables. On Save Model, all data is persisted as a FleetAIModel entity with snapshot ID. Next HARBOR query automatically ingests the corpus as 6K-char context chunks — no re-training, no waiting.", color: "text-emerald-400", badge: "ML Pipeline" },
  { icon: Eye, label: "mistralCommand → harborCore", desc: "The core reasoning chain. mistralCommand handles auth, rate limiting, file preprocessing, and conversation history. harborCore injects live context + training data, calls Mistral Large with JSON mode, self-heals malformed responses, and returns structured action objects in under 3 seconds.", color: "text-amber-400", badge: "Core Engine" },
  { icon: GitBranch, label: "Autonomous Entity Actions", desc: "HARBOR doesn't just advise — it executes. 15+ direct platform mutations triggered by AI intent: CREATE_VEHICLE, CREATE_ROUTE, ASSIGN_DRIVER, CREATE_SHIPMENT, CREATE_ALERT, UPDATE_VEHICLES, DELETE_ROUTES, BULK_UPDATE_STATUS. Zero form-filling required from the operator.", color: "text-orange-400", badge: "Autonomous" },
  { icon: Workflow, label: "49-Thread Parallel Analysis", desc: "Alongside every main HARBOR response, 49 lightweight micro-LLM analyses fire simultaneously: efficiency scoring, anomaly detection, ETA prediction, maintenance risk, CO2 impact, route optimization, cost saving, demand signals, and more — all returned in the same response envelope.", color: "text-rose-400", badge: "Parallel" },
];

const DOMAIN_DEEP = [
  { icon: Globe, label: "Maritime", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5", specs: ["AIS Class A/B signal processing", "SOLAS chapter compliance monitoring", "CII/EEXI carbon intensity scoring", "IMO 2030/2050 trajectory modeling", "Bunker optimization: MDO, HFO, LNG, methanol", "Port State Control deficiency prediction", "MARPOL Annex VI NOx/SOx tracking", "Ballast water management compliance"] },
  { icon: Zap, label: "Aviation", color: "text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/5", specs: ["ADS-B transponder integration", "IATA TACT cargo rating engine", "Weight & balance manifest optimization", "DGR Class 1–9 handling compliance", "Slot coordination and ground time optimization", "ETOPS diversion airport pre-qualification", "Fuel tankering decision modeling", "ACMI cost vs. capacity tradeoff analysis"] },
  { icon: Route, label: "Road Transport", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", specs: ["EC 561/2006 drivers hours enforcement", "ADR hazmat transport rule engine", "Cabotage restriction monitoring (EU/CH/UK)", "LEZ/ULEZ zone avoidance routing", "Tachograph data interpretation", "Cold chain temperature SLA monitoring", "LNG/EV range planning for alternative powertrains", "Cross-border customs clearance pre-filing"] },
  { icon: Database, label: "Supply Chain", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5", specs: ["Network design: hub-and-spoke vs. direct", "Total Cost of Ownership (TCO) modeling", "Cold chain HACCP compliance monitoring", "Reverse logistics flow optimization", "Supplier risk scoring (geopolitical, financial)", "Inventory turnover and stockout prediction", "Multimodal intermodal transhipment optimizer", "Carbon footprint: Scope 1, 2, 3 calculation"] },
  { icon: DollarSign, label: "Finance & Rates", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", specs: ["Freight rate forward curve modeling", "Fuel surcharge index auto-calculation", "Activity-based costing per shipment", "FX exposure quantification (EUR/USD/DKK/GBP)", "Invoice anomaly detection vs. contracted rates", "P&L impact per route and vehicle", "Break-even analysis for new lanes", "Accessorial charge leakage identification"] },
  { icon: Lock, label: "Sustainability", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/5", specs: ["EU ETS allowance consumption tracking", "FuelEU Maritime blending mandate modeling", "Science Based Targets (SBTi) alignment", "CSRD Scope 3 category 4 (upstream transport)", "CO2e per tonne-km benchmark vs. industry", "Green corridor prioritization", "SAF uplift optimization for aviation", "IMO CII rating trajectory and penalty exposure"] },
];

const USE_CASES = [
  { 
    title: "Deep Fleet Analysis", 
    query: `"Analyser mine lavest-ydende køretøjer og find den skjulte årsag"`, 
    response: "HARBOR calls runDeepAnalysis() — a 400+ word structured prompt that generates 22 data points across every vehicle. An AdvancedFleetAnalysisHologram window opens with 5 tabs: Overview (fleet health score), Performance (radar + scatter charts), Anomalies (root cause traces), Costs (EUR breakdown per vehicle), Actions (prioritized interventions with ROI). Every recommendation is quantified. The lowest-performing vehicle gets a full causal chain: not 'Truck-4 is slow' but 'Truck-4 loses 18% efficiency due to suboptimal tire pressure × driver behavior score 64 × depot exit window mismatch — combined EUR impact: €2,340/month.'", 
    icon: BarChart3, color: "text-cyan-400" 
  },
  { 
    title: "Route Creation — Zero Form-Filling", 
    query: `"Opret en prioriteret rute fra København til Hamburg til mandag morgen"`, 
    response: "HARBOR parses intent → action: CREATE_ROUTE, priority: high, departure: Monday. Calls planRoute() to calculate waypoints, distance (306 km), estimated duration (3.8h), CO2 footprint (183 kg). Creates a Route entity with ai_optimized: true, priority: high, status: planned. Invalidates route cache. Opens optional 3D map window showing the route with waypoints rendered. Total time from command to created route: under 4 seconds. The operator touched zero forms.", 
    icon: Route, color: "text-emerald-400" 
  },
  { 
    title: "Knowledge Injection via HARBOR Trainer", 
    query: `Operator uploads company SOP and rate table as FAQ in FleetAITrainer`, 
    response: "Document is uploaded via UploadFile integration and stored as training_data on a FleetAIModel entity with a snapshot ID. From that moment forward, every HARBOR query for that organization automatically receives the injected knowledge as 6K-char context chunks, inserted as alternating user/assistant turns before the actual query. HARBOR now knows your specific rate agreements, your operational procedures, and your naming conventions — permanently, without any re-training cycle.", 
    icon: FlaskConical, color: "text-amber-400" 
  },
  { 
    title: "External API Inference", 
    query: `POST /functions/harborModelInference\n{ "model_id": "snap_abc123", "input": { "vehicle_id": "V-042", "context": {...} } }`, 
    response: "harborModelInference validates the Bearer token via SHA-256 hash comparison, verifies the FleetAIModel snapshot belongs to the requesting organization, routes the inference payload to harborCore in 'inference' mode, logs response time + status to APIUsage, and returns: { status: 'success', model: 'snap_abc123', result: { prediction: '...', confidence: 0.91, recommended_actions: [...], anomalies: [...], risk_score: 74 } }. Every call is metered and billed.", 
    icon: Server, color: "text-violet-400" 
  },
];

const PERFORMANCE_SPECS = [
  { label: "Context Window", value: "128K tokens", note: "Mistral Large — per query", color: "text-cyan-400" },
  { label: "Primary Model", value: "Mistral Large", note: "reasoning, commands, chat", color: "text-violet-400" },
  { label: "Vision Model", value: "Pixtral Large", note: "image & document analysis", color: "text-emerald-400" },
  { label: "Knowledge Base", value: "Trainable", note: "via HARBOR Trainer injection", color: "text-amber-400" },
  { label: "API Auth", value: "Bearer Key", note: "SHA-256 hashed, scoped per org", color: "text-orange-400" },
  { label: "Modes", value: "3", note: "chat · command · inference", color: "text-rose-400" },
];

// Corner brackets decoration (same as FleetAITrainer)
const CornerBrackets = ({ color = 'amber' }) => {
  const c = color === 'amber' ? 'border-amber-500/60' : color === 'cyan' ? 'border-cyan-500/60' : 'border-violet-500/60';
  return (
    <>
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${c}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${c}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${c}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${c}`} />
    </>
  );
};

// Scanning line animation
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent z-10 pointer-events-none"
    initial={{ top: '0%' }}
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
  />
);

function ExpandableStep({ step, i }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className={`relative rounded-lg border ${step.border} ${step.bg} overflow-hidden`}
    >
      <CornerBrackets color={step.color.includes('cyan') ? 'cyan' : step.color.includes('violet') ? 'violet' : 'amber'} />
      <button onClick={() => setOpen(!open)} className="w-full p-5 text-left flex items-center gap-4">
        <div className={`text-4xl font-black font-mono ${step.color} flex-shrink-0`} style={{ textShadow: step.color.includes('cyan') ? '0 0 20px rgba(6,182,212,0.5)' : '0 0 20px rgba(139,92,246,0.5)' }}>{step.step}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg font-mono tracking-widest uppercase">{step.title}</p>
          <p className="text-slate-400 text-sm">{step.desc}</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-0 border-t border-white/10">
              <p className="text-slate-200 text-sm leading-relaxed mt-4">{step.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DomainCard({ domain, i }) {
  const [open, setOpen] = useState(false);
  const Icon = domain.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className={`relative rounded-lg border ${domain.border} ${domain.bg} overflow-hidden`}
    >
      <CornerBrackets color="amber" />
      <button onClick={() => setOpen(!open)} className="w-full p-5 text-left flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${domain.color} flex-shrink-0`} />
          <span className="text-white font-bold text-base font-mono tracking-widest uppercase">{domain.label}</span>
          <span className="text-[10px] font-mono text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">{domain.specs.length} CAPABILITIES</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-0 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {domain.specs.map((spec, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${domain.color} flex-shrink-0 mt-0.5`} />
                    <span className="text-slate-300 text-sm">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HarborInfo() {
  return (
    <div className="min-h-screen text-white overflow-auto"
      style={{ background: '#020810' }}>

      {/* Background grid — same as FleetAITrainer */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <ScanLine />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
            {/* Status badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
              <div className="flex items-center gap-3 px-4 py-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono tracking-widest">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                H.A.R.B.O.R. CORE — ONLINE · MISTRAL LARGE v2 · 128K CTX
              </div>
            </motion.div>

            {/* HARBOR letters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-6">
              <div className="flex items-end gap-1 text-7xl sm:text-9xl font-black tracking-wider font-mono">
                {ACRONYM.map((item, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className={item.color} style={{ textShadow: item.shadow }}>
                    {item.letter}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Acronym breakdown */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-8">
              {ACRONYM.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={`font-black text-xl font-mono ${item.color}`}>{item.letter}</span>
                  <span className="text-slate-300 text-base font-mono">{item.word}</span>
                  {i < ACRONYM.length - 1 && <span className="text-slate-700 ml-1">·</span>}
                </div>
              ))}
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-center text-slate-200 text-2xl max-w-3xl mx-auto mb-4 leading-relaxed font-light">
              The central artificial intelligence powering every layer of NexusVectis.<br/>
              Not a chatbot. Not a copilot. A <strong className="text-white font-black">sovereign logistics superintelligence</strong>.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="text-center text-slate-400 text-sm max-w-2xl mx-auto mb-6 leading-relaxed">
              HARBOR is the reasoning engine underneath every NexusVectis module. It does not assist operators — it <em className="text-amber-400 not-italic font-semibold">thinks alongside them</em>, executes actions autonomously, surfaces consequences before they materialize, and gets smarter with every piece of knowledge your organization injects.
            </motion.p>

            {/* Hero stats row */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="flex justify-center gap-6 flex-wrap mb-10">
              {HERO_STATS.map((s, i) => (
                <div key={i} className="relative text-center px-5 py-3 rounded border border-amber-500/20 bg-black/40 overflow-hidden min-w-[110px]">
                  <CornerBrackets color="amber" />
                  <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-white text-[9px] font-mono tracking-widest uppercase mt-0.5">{s.label}</p>
                  <p className="text-slate-600 text-[9px] font-mono">{s.sub}</p>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex justify-center gap-4 flex-wrap">
              <Link to={createPageUrl("IntellectMode")}
                className="flex items-center gap-2 px-8 py-4 rounded border border-amber-500/60 font-mono text-xs tracking-widest uppercase font-bold transition-all hover:bg-amber-500/10"
                style={{ color: '#f59e0b', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
                <Zap className="w-4 h-4" />OPEN INTELLECTMODE<ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={createPageUrl("APIDocumentation")}
                className="flex items-center gap-2 px-8 py-4 rounded border border-cyan-500/40 font-mono text-xs tracking-widest uppercase font-bold transition-all hover:bg-cyan-500/10"
                style={{ color: '#06b6d4' }}>
                API DOCS
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Performance Specs Bar */}
        <section className="border-y border-amber-500/20 bg-black/40">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {PERFORMANCE_SPECS.map((spec, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="relative text-center p-3 rounded border border-amber-500/15 bg-black/30 overflow-hidden">
                  <CornerBrackets color="amber" />
                  <p className={`text-xl font-black font-mono ${spec.color}`}>{spec.value}</p>
                  <p className="text-white text-[10px] font-mono tracking-widest uppercase mt-1">{spec.label}</p>
                  <p className="text-slate-600 text-[10px] mt-0.5">{spec.note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Cognitive Architecture */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-amber-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.3)' }}>COGNITIVE ARCHITECTURE</h2>
            </div>
            <p className="text-slate-300 text-base max-w-3xl mb-1">Every HARBOR response is the output of a deterministic 6-step reasoning pipeline. No shortcuts. No hallucinated confidence. Every step is traceable.</p>
            <p className="text-slate-500 text-xs font-mono tracking-wide max-w-2xl">Click any step to see exactly what happens inside HARBOR's reasoning engine at that stage.</p>
          </div>
          <div className="space-y-3">
            {ARCHITECTURE_STEPS.map((step, i) => <ExpandableStep key={i} step={step} i={i} />)}
          </div>
        </section>

        {/* Platform Integrations */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Network className="w-6 h-6 text-cyan-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#06b6d4', textShadow: '0 0 30px rgba(6,182,212,0.3)' }}>PLATFORM INTEGRATIONS</h2>
            </div>
            <p className="text-slate-300 text-base max-w-3xl mb-1">HARBOR is not a feature — it is the central nervous system of NexusVectis. Six integration surfaces. One reasoning engine behind all of them.</p>
            <p className="text-slate-500 text-xs font-mono tracking-wide max-w-2xl">Every module that produces intelligence routes through HARBOR. There is no parallel AI — there is only HARBOR.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="relative p-5 rounded-lg border border-amber-500/20 bg-black/40 hover:border-amber-500/50 transition-all group overflow-hidden">
                  <CornerBrackets color="amber" />
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-amber-500/30 text-amber-400 bg-amber-500/10`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-white font-bold mb-2 font-mono text-xs tracking-widest uppercase">{item.label}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Domain Expertise */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-violet-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#8b5cf6', textShadow: '0 0 30px rgba(139,92,246,0.3)' }}>DOMAIN EXPERTISE</h2>
            </div>
            <p className="text-slate-300 text-base max-w-3xl mb-1">HARBOR carries embedded regulatory intelligence across 6 logistics verticals and 200+ compliance frameworks. It does not need to look this up — it knows it.</p>
            <p className="text-slate-500 text-xs font-mono tracking-wide max-w-2xl">Expand each domain to review the full capability matrix. Each capability represents a live reasoning rule inside HARBOR — not documentation.</p>
          </div>
          <div className="space-y-3">
            {DOMAIN_DEEP.map((domain, i) => <DomainCard key={i} domain={domain} i={i} />)}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-6 h-6 text-emerald-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#10b981', textShadow: '0 0 30px rgba(16,185,129,0.3)' }}>EXAMPLE USE CASES</h2>
            </div>
            <p className="text-slate-300 text-base max-w-3xl mb-1">What HARBOR actually does when you type a command. Not what it says — what it executes, what data it produces, and what windows it opens.</p>
            <p className="text-slate-500 text-xs font-mono tracking-wide max-w-2xl">Every response shown here is a real output from the HARBOR system. No demos. No mockups.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="relative p-6 rounded-lg border border-amber-500/20 bg-black/40 overflow-hidden">
                  <CornerBrackets color="amber" />
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`w-4 h-4 ${uc.color}`} />
                    <span className="text-white font-bold font-mono text-xs tracking-widest uppercase">{uc.title}</span>
                  </div>
                  <div className="mb-4 p-3 rounded border border-cyan-500/20 bg-black/60">
                    <p className="text-[9px] font-mono text-amber-400/60 mb-1 tracking-widest">OPERATOR QUERY</p>
                    <p className="text-cyan-300 text-xs font-mono italic">{uc.query}</p>
                  </div>
                  <div className="p-3 rounded border border-amber-500/15 bg-amber-500/5">
                    <p className="text-[9px] font-semibold font-mono mb-1 text-amber-400/60 tracking-widest">HARBOR RESPONSE</p>
                    <p className="text-slate-200 text-xs leading-relaxed">{uc.response}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Technical Foundation */}
        <section className="max-w-6xl mx-auto px-6 py-16 pb-24">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-6 h-6 text-rose-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#fb7185', textShadow: '0 0 30px rgba(251,113,133,0.3)' }}>TECHNICAL FOUNDATION</h2>
            </div>
            <p className="text-slate-300 text-base max-w-3xl mb-1">The infrastructure stack that makes HARBOR possible. State-of-the-art models, a precisely engineered data pipeline, and zero-tolerance response standards.</p>
            <p className="text-slate-500 text-xs font-mono tracking-wide max-w-2xl">Everything that goes in, and everything that comes out — specified to the token.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* AI Models */}
            <div className="relative p-6 rounded-lg border border-violet-500/20 bg-black/40 overflow-hidden">
              <CornerBrackets color="violet" />
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-violet-400" />
                <h3 className="text-white font-bold font-mono text-xs tracking-widest uppercase">AI MODELS</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "mistral-large-latest", role: "Default model — commands, chat, analysis, JSON mode", badge: "128K ctx" },
                  { name: "pixtral-large-latest", role: "Used when image_urls are present in the request", badge: "Vision" },
                  { name: "FleetAIModel (DB)", role: "Org training data injected as context chunks per query", badge: "Knowledge" },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded border border-violet-500/20 bg-black/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold text-xs font-mono">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-violet-500/30 text-violet-400 bg-violet-500/10">{m.badge}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{m.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Pipeline */}
            <div className="relative p-6 rounded-lg border border-cyan-500/20 bg-black/40 overflow-hidden">
              <CornerBrackets color="cyan" />
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold font-mono text-xs tracking-widest uppercase">DATA PIPELINE</h3>
              </div>
              <div className="space-y-3">
                {[
                  { layer: "Live Context", desc: "vehicles, alerts, routes, shipments — injected when context not pre-supplied" },
                  { layer: "Knowledge Base", desc: "FleetAIModel.training_data split into 6K-char chunks, injected as user/assistant pairs" },
                  { layer: "Conversation History", desc: "Last 10 non-system turns — filtered by role: user | assistant" },
                  { layer: "File Attachments", desc: "Text files fetched and prepended; images passed as image_url array to Pixtral" },
                  { layer: "Format Directive", desc: "Mode-specific output instructions: command → JSON object, chat → markdown, inference → structured JSON" },
                ].map((d, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-white text-xs font-semibold font-mono">{d.layer}: </span>
                      <span className="text-slate-400 text-xs">{d.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Standards */}
            <div className="relative p-6 rounded-lg border border-amber-500/20 bg-black/40 overflow-hidden">
              <CornerBrackets color="amber" />
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-bold font-mono text-xs tracking-widest uppercase">RESPONSE STANDARDS</h3>
              </div>
              <div className="space-y-2">
                {[
                  "command mode: JSON with action, parameters, message, open_window",
                  "chat mode: markdown with headers and bullets",
                  "inference mode: structured JSON result object",
                  "Self-healing: extracts JSON from code blocks if parse fails",
                  "Fallback: wraps plain text in correct format per mode",
                  "Max tokens: 6000 (chat/command), 1000 (inference)",
                  "Temperature: 0.3 (command), 0.4 (chat/inference)",
                  "JSON mode enforced when mode=command or response_schema set",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </div>
                    <span className="text-slate-300 text-xs font-mono">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}