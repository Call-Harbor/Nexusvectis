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

const ARCHITECTURE_STEPS = [
  { step: "01", title: "Parse", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/5", desc: "Decode the actual request beneath the stated question", detail: "HARBOR's NLP pipeline distinguishes intent layers: explicit request, implicit need, unstated constraint. It identifies whether the user needs an answer, an action, a visualization, or an escalation — before any reasoning begins." },
  { step: "02", title: "Knowledge Sweep", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5", desc: "Query the HARBOR training corpus and domain expertise", detail: "Traverses the full HARBOR knowledge base — organization-specific training data, regulatory libraries, benchmark databases, and embedded domain expertise across maritime, aviation, road, rail, and supply chain verticals." },
  { step: "03", title: "Context Sweep", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", desc: "Load live fleet, shipment, alert, and route data", detail: "Injects real-time platform state: vehicle positions and statuses, unresolved alerts, active routes, shipment ETAs, maintenance schedules, resource utilization, and open exceptions — all scoped to the operator's organization." },
  { step: "04", title: "Causal Reasoning", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", desc: "Identify root causes — not symptoms", detail: "Applies causal graph analysis to distinguish proximate from root causes. A vehicle showing low efficiency is not the problem — idle time compounding with suboptimal tire pressure compounding with a misconfigured route is. HARBOR traces the full causal chain." },
  { step: "05", title: "Synthesize", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5", desc: "Model 1st, 2nd, and 3rd order consequences", detail: "Every recommendation is stress-tested across three consequence layers: immediate operational impact (1st order), ripple effects on interconnected systems (2nd order), and strategic drift over 1–6 months (3rd order). Quantified in EUR." },
  { step: "06", title: "Proact", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/5", desc: "Surface critical insights the user didn't ask for", detail: "HARBOR's proactive intelligence layer continuously scans for anomalies, regulatory exposures, cost inefficiencies, and emerging risks — then appends the most critical unsolicited finding to every response. You get answers and surprises." },
];

const INTEGRATIONS = [
  { icon: Network, label: "IntellectMode", desc: "Primary AI command interface. HARBOR routes all commands through harborCore, determines action type, and orchestrates hologram window rendering.", color: "text-cyan-400", badge: "Live" },
  { icon: Radar, label: "Fleet AI API", desc: "External developer API via Bearer token. HARBOR validates API keys by SHA-256 hash match, loads FleetAIModel snapshots, and logs every call to APIUsage.", color: "text-violet-400", badge: "REST API" },
  { icon: FlaskConical, label: "HARBOR Trainer", desc: "Knowledge injection UI. Operators upload FAQs, links, SOPs. On Save Model, data is persisted as a FleetAIModel entity and injected into every future HARBOR query.", color: "text-emerald-400", badge: "ML Pipeline" },
  { icon: Eye, label: "mistralCommand / harborCore", desc: "All IntellectMode commands go through mistralCommand → harborCore. Loads org's active FleetAIModel training data, injects live context, calls Mistral Large, self-heals malformed JSON.", color: "text-amber-400", badge: "Core Engine" },
  { icon: GitBranch, label: "Entity Actions", desc: "HARBOR executes 15+ platform operations directly: CREATE_VEHICLE, CREATE_ROUTE, CREATE_SHIPMENT, CREATE_ALERT, UPDATE_VEHICLES, DELETE_ROUTES — all triggered by parsed AI intent.", color: "text-orange-400", badge: "Autonomous" },
  { icon: Workflow, label: "Parallel Micro-Analyses", desc: "Every command fires 49 parallel lightweight LLM micro-analyses simultaneously alongside the main HARBOR response for real-time multi-dimensional insight.", color: "text-rose-400", badge: "Parallel" },
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
  { title: "Deep Fleet Analysis", query: `"Analyser mine lavest-ydende køretøjer"`, response: "HARBOR triggers runDeepAnalysis(): calls InvokeLLM with 400+ word structured prompt, generates 16-22 data points, opens an AdvancedFleetAnalysisHologram window with 5 tabs (Overview, Performance, Anomalies, Costs, Actions), radar charts, scatter plots, cost breakdowns, risk matrices and EUR-quantified action plans.", icon: BarChart3, color: "text-cyan-400" },
  { title: "Create Route (AI-Executed)", query: `"Opret en rute fra København til Hamburg"`, response: "HARBOR parses intent → action: CREATE_ROUTE. Calls planRoute backend function for waypoints, distance and CO2 estimate. Creates a Route entity with ai_optimized: true. Invalidates the routes query cache. Optionally opens a route visualization window — all without user touching any form.", icon: Route, color: "text-emerald-400" },
  { title: "HARBOR Trainer Knowledge Injection", query: `User uploads FAQ file in FleetAITrainer`, response: "File is uploaded via UploadFile integration. Data is stored as training_data on a FleetAIModel entity. On next HARBOR query, harborCore fetches the active FleetAIModel, splits the knowledge base into 6K-char chunks, and injects them as alternating user/assistant messages before the actual query.", icon: FlaskConical, color: "text-amber-400" },
  { title: "API Inference (External Developer)", query: `POST /functions/harborModelInference { model_id: "snap_xyz", input: {...} }`, response: "harborModelInference validates Bearer key via SHA-256 hash, verifies model belongs to org, routes to harborCore in 'inference' mode, logs response time to APIUsage, and returns { status, model, result: { prediction, confidence, recommended_actions, anomalies } }.", icon: Server, color: "text-violet-400" },
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

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-center text-slate-300 text-xl max-w-3xl mx-auto mb-4 leading-relaxed">
              The central artificial intelligence powering every layer of the NexusVectis platform.
              Not a chatbot — a <strong className="text-white">sovereign logistics superintelligence</strong>.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="text-center text-slate-500 text-base max-w-2xl mx-auto mb-10 leading-relaxed font-mono text-xs tracking-wide">
              HARBOR is not an add-on. It is the reasoning engine underneath IntellectMode, Fleet AI API, the HARBOR Trainer, all analytics dashboards, autonomous exception handling, and every predictive model in the platform.
            </motion.p>

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
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-6 h-6 text-amber-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.3)' }}>COGNITIVE ARCHITECTURE</h2>
            </div>
            <p className="text-slate-400 text-base max-w-2xl font-mono text-xs tracking-wide">Every HARBOR response executes a 6-step internal reasoning pipeline before producing output. Click each step to expand.</p>
          </div>
          <div className="space-y-3">
            {ARCHITECTURE_STEPS.map((step, i) => <ExpandableStep key={i} step={step} i={i} />)}
          </div>
        </section>

        {/* Platform Integrations */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Network className="w-6 h-6 text-cyan-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#06b6d4', textShadow: '0 0 30px rgba(6,182,212,0.3)' }}>PLATFORM INTEGRATIONS</h2>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wide max-w-2xl">HARBOR is the intelligence backbone connecting all NexusVectis modules. Every system that needs to reason routes through it.</p>
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
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-6 h-6 text-violet-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#8b5cf6', textShadow: '0 0 30px rgba(139,92,246,0.3)' }}>DOMAIN EXPERTISE</h2>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wide max-w-2xl">HARBOR embeds deep regulatory and operational expertise across every major logistics vertical. Expand each domain to see the full capability list.</p>
          </div>
          <div className="space-y-3">
            {DOMAIN_DEEP.map((domain, i) => <DomainCard key={i} domain={domain} i={i} />)}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Terminal className="w-6 h-6 text-emerald-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#10b981', textShadow: '0 0 30px rgba(16,185,129,0.3)' }}>EXAMPLE USE CASES</h2>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wide max-w-2xl">What HARBOR actually returns when you ask it something. Every answer is quantified, sourced, and actionable.</p>
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
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-6 h-6 text-rose-400" />
              <h2 className="text-4xl font-black font-mono tracking-widest uppercase" style={{ color: '#fb7185', textShadow: '0 0 30px rgba(251,113,133,0.3)' }}>TECHNICAL FOUNDATION</h2>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wide max-w-2xl">Under the hood: the models, data pipeline, and response standards that power HARBOR.</p>
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