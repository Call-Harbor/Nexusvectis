import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import WorkerHologramControl from "./WorkerHologramControl";
import OrchestrationMonitor from "./OrchestrationMonitor";
import CustomWorkerBuilder from "./CustomWorkerBuilder";
import AgentSmartRouter from "./AgentSmartRouter";
import AgentObservabilityPanel from "./AgentObservabilityPanel";
import WorkflowVersionManager from "./WorkflowVersionManager";
import AgentEvalSuite from "./AgentEvalSuite";
import AgentSharedMemoryPanel from "./AgentSharedMemoryPanel";
import {
  Brain, Send, X, Plus, Trash2, MessageSquare, Loader2,
  Sparkles, User, Copy, CheckCheck, Minimize2, Maximize2,
  Pencil, Paperclip, Image, Film, FileText, Download,
  ImagePlus, Wand2, XCircle, Zap, Network, Grid3x3,
  Play, Eye, ChevronDown, AlertCircle, CheckCircle2,
  Clock, Activity, Settings, UserPlus, GitBranch, FlaskConical, Route, Database,
  Cpu, BarChart3, Shield, Layers, Star, TrendingUp, Search,
  ChevronRight, Terminal, Code2, RefreshCw, Filter, Swords,
  Workflow, MessageCircle, Bot, Gauge, ArrowRight, Lock, Globe
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const AGENT_NAME = "harbor_intellect";

// ── AI WORKER REGISTRY ───────────────────────────────────────────────────────
const AI_WORKERS = [
  { id: "harbor_fleet_analyst",     name: "Fleet Analyst",       emoji: "📊", color: "#06b6d4", tier: "core",    specialty: "Vehicle performance, utilization, CO2 metrics" },
  { id: "harbor_route_optimizer",   name: "Route Optimizer",     emoji: "🗺️", color: "#8b5cf6", tier: "core",    specialty: "Multi-modal routing, cost reduction, CO2 minimization" },
  { id: "harbor_demand_forecaster", name: "Demand Forecaster",   emoji: "🔮", color: "#10b981", tier: "core",    specialty: "30/60/90-day demand signals, capacity planning" },
  { id: "harbor_driver_coach",      name: "Driver Coach",        emoji: "🏆", color: "#f59e0b", tier: "core",    specialty: "Driver performance, safety scores, coaching plans" },
  { id: "harbor_ops_commander",     name: "Ops Commander",       emoji: "⚡", color: "#ef4444", tier: "core",    specialty: "Real-time operations, dispatch, SLA management" },
  { id: "harbor_risk_engine",       name: "Risk Engine",         emoji: "⚠️", color: "#ef4444", tier: "core",    specialty: "Quantitative risk scoring, EMV, geopolitical exposure" },
  { id: "harbor_compliance_guard",  name: "Compliance Guard",    emoji: "🛡️", color: "#10b981", tier: "core",    specialty: "EU transport law, CSRD, GDPR, IMO 2030 compliance" },
  { id: "harbor_security_ai",       name: "Security AI",         emoji: "🔒", color: "#ef4444", tier: "core",    specialty: "Cybersecurity, cargo security, threat modeling" },
  { id: "harbor_financial_ai",      name: "Financial AI",        emoji: "💰", color: "#f59e0b", tier: "core",    specialty: "TCO, cost-per-km, FX risk, budget optimization" },
  { id: "harbor_customer_intel",    name: "Customer Intel",      emoji: "👥", color: "#8b5cf6", tier: "core",    specialty: "Health scoring, churn prediction, LTV, expansion" },
  { id: "harbor_market_scout",      name: "Market Scout",        emoji: "🔍", color: "#06b6d4", tier: "advanced", specialty: "Freight rates, competitor intel, market trends" },
  { id: "harbor_strategy_ai",       name: "Strategy AI",         emoji: "🧠", color: "#a78bfa", tier: "advanced", specialty: "Corporate strategy, M&A, competitive positioning" },
  { id: "harbor_maintenance_bot",   name: "Maintenance Bot",     emoji: "🔧", color: "#06b6d4", tier: "core",    specialty: "Predictive failure detection, Weibull analysis" },
  { id: "sales_agent",              name: "Sales Closer",        emoji: "🤝", color: "#ec4899", tier: "advanced", specialty: "Deal scoring, pipeline, MEDDIC qualification" },
  { id: "pricing_optimizer",        name: "Pricing AI",          emoji: "💵", color: "#f59e0b", tier: "advanced", specialty: "Dynamic freight pricing, yield management" },
  { id: "quality_assurance",        name: "QA Engineer",         emoji: "✅", color: "#10b981", tier: "ops",     specialty: "Process quality, SLA compliance, Six Sigma" },
  { id: "project_manager",          name: "Project Manager",     emoji: "📋", color: "#06b6d4", tier: "ops",     specialty: "Critical path, WBS, risk registers, Agile" },
  { id: "training_coordinator",     name: "Training Coach",      emoji: "🎓", color: "#a78bfa", tier: "ops",     specialty: "Skill gap analysis, certifications, learning ROI" },
  { id: "backend_developer",        name: "Backend Dev",         emoji: "⚙️", color: "#06b6d4", tier: "tech",    specialty: "API design, database architecture, microservices" },
  { id: "frontend_developer",       name: "Frontend Dev",        emoji: "🎨", color: "#8b5cf6", tier: "tech",    specialty: "React, Tailwind, Core Web Vitals, accessibility" },
  { id: "devops_engineer",          name: "DevOps Ops",          emoji: "🚀", color: "#ef4444", tier: "tech",    specialty: "CI/CD, Kubernetes, Terraform, monitoring" },
  { id: "data_scientist",           name: "Data Scientist",      emoji: "📈", color: "#10b981", tier: "tech",    specialty: "ML models, statistical analysis, AUC/RMSE/F1" },
  { id: "database_architect",       name: "DB Architect",        emoji: "🗄️", color: "#f59e0b", tier: "tech",    specialty: "Schema design, query optimization, scaling" },
  { id: "harbor_api_integrator",    name: "API Integrator",      emoji: "🔗", color: "#06b6d4", tier: "tech",    specialty: "AIS, ADS-B, ERP integration, OAuth2, mTLS" },
  { id: "webhook_specialist",       name: "Webhook Specialist",  emoji: "⚡", color: "#f59e0b", tier: "tech",    specialty: "Event-driven, CloudEvents, retry, idempotency" },
  { id: "content_writer",           name: "Content Writer",      emoji: "✍️", color: "#ec4899", tier: "creative", specialty: "B2B blog, whitepapers, case studies, SEO" },
  { id: "seo_specialist",           name: "SEO Specialist",      emoji: "🔎", color: "#10b981", tier: "creative", specialty: "Keyword clusters, technical SEO, E-E-A-T" },
  { id: "social_media_mgr",         name: "Social Media Mgr",    emoji: "📱", color: "#8b5cf6", tier: "creative", specialty: "LinkedIn B2B strategy, thought leadership" },
  { id: "email_marketer",           name: "Email Marketer",      emoji: "📧", color: "#f59e0b", tier: "creative", specialty: "B2B drip campaigns, segmentation, A/B testing" },
  { id: "video_producer",           name: "Video Producer",      emoji: "🎬", color: "#ef4444", tier: "creative", specialty: "Scripts, storyboards, platform-specific specs" },
  { id: "brand_strategist",         name: "Brand Strategist",    emoji: "🎯", color: "#a78bfa", tier: "creative", specialty: "Brand pyramid, positioning, differentiation" },
  { id: "recruiter_ai",             name: "Recruiter AI",        emoji: "👔", color: "#06b6d4", tier: "hr",      specialty: "JD writing, candidate scoring, salary benchmarks" },
  { id: "hr_generalist",            name: "HR Generalist",       emoji: "💼", color: "#8b5cf6", tier: "hr",      specialty: "EU/DK employment law, Funktionærloven, GDPR" },
  { id: "performance_coach",        name: "Performance Coach",   emoji: "🏅", color: "#10b981", tier: "hr",      specialty: "OKR design, 360-feedback, GROW coaching" },
  { id: "harbor_data_miner",        name: "Data Miner",          emoji: "⛏️", color: "#64748b", tier: "analytics", specialty: "Anomaly detection, pattern recognition, 3σ rule" },
  { id: "business_intelligence",    name: "BI Analyst",          emoji: "📊", color: "#06b6d4", tier: "analytics", specialty: "KPI frameworks, data modeling, executive reports" },
  { id: "analytics_specialist",     name: "Analytics Specialist",emoji: "📉", color: "#f59e0b", tier: "analytics", specialty: "Funnel analysis, A/B testing, power analysis" },
  { id: "harbor_sustainability_ai", name: "Sustainability AI",   emoji: "🌍", color: "#22c55e", tier: "esg",     specialty: "Scope 1/2/3, EU ETS, FuelEU Maritime, CSRD" },
  { id: "carbon_auditor",           name: "Carbon Auditor",      emoji: "♻️", color: "#10b981", tier: "esg",     specialty: "GHG Protocol, SBTi alignment, carbon markets" },
  { id: "harbor_document_ai",       name: "Document AI",         emoji: "📄", color: "#8b5cf6", tier: "docs",    specialty: "CMR, Bill of Lading, customs, Incoterms 2020" },
  { id: "technical_writer",         name: "Technical Writer",    emoji: "📖", color: "#06b6d4", tier: "docs",    specialty: "API docs, OpenAPI 3.1, DITA, runbooks" },
  { id: "harbor_nlp_engine",        name: "NLP Engine",          emoji: "💬", color: "#8b5cf6", tier: "docs",    specialty: "Classification, sentiment, entity extraction, MT" },
  { id: "harbor_visualizer",        name: "Visualizer",          emoji: "🎨", color: "#f59e0b", tier: "design",  specialty: "Chart selection, dashboard architecture, WCAG AA" },
  { id: "ux_designer",              name: "UX Designer",         emoji: "✨", color: "#8b5cf6", tier: "design",  specialty: "JTBD, journey mapping, usability heuristics" },
  { id: "graphic_designer",         name: "Graphic Designer",    emoji: "🖼️", color: "#ec4899", tier: "design",  specialty: "Brand visual identity, CRAP principles" },
  { id: "harbor_simulation_ai",     name: "Simulation AI",       emoji: "🌐", color: "#10b981", tier: "advanced", specialty: "Monte Carlo, stress testing, digital twins" },
  { id: "forecasting_ai",           name: "Forecasting AI",      emoji: "🔮", color: "#a78bfa", tier: "advanced", specialty: "SARIMA, trend decomposition, leading indicators" },
  { id: "harbor_port_ai",           name: "Port Operations AI",  emoji: "🚢", color: "#06b6d4", tier: "specialist", specialty: "Berth scheduling, JIT arrival, TEU throughput" },
  { id: "harbor_airport_ai",        name: "Airport Ops AI",      emoji: "✈️", color: "#8b5cf6", tier: "specialist", specialty: "Turnaround, IATA A-CDM, gate allocation, TOBT" },
  { id: "harbor_transit_ai",        name: "Transit AI",          emoji: "🚌", color: "#10b981", tier: "specialist", specialty: "Bus/rail scheduling, DRT, OTP%, NeTEx" },
  { id: "harbor_energy_ai",         name: "Energy AI",           emoji: "💡", color: "#f59e0b", tier: "specialist", specialty: "EV charging, demand response, renewable integration" },
];

const TIER_COLORS = {
  core: "#06b6d4", advanced: "#8b5cf6", ops: "#10b981", tech: "#3b82f6",
  creative: "#ec4899", hr: "#a78bfa", analytics: "#f59e0b", esg: "#22c55e",
  docs: "#64748b", design: "#f472b6", specialist: "#ef4444"
};

const QUICK_PROMPTS = [
  { text: "Analyze fleet performance & give strategic report", icon: "📊" },
  { text: "Risk assessment across all active operations", icon: "⚠️" },
  { text: "Optimize all active routes and estimate savings", icon: "🗺️" },
  { text: "Give compliance overview — EU law, CSRD, GDPR", icon: "🛡️" },
  { text: "What's total CO₂ exposure and reduction pathway?", icon: "🌍" },
  { text: "Customer health report — who's at risk of churn?", icon: "👥" },
];

const PROMPT_TEMPLATES = [
  { label: "Fleet Status", prompt: "Analyze complete fleet status and performance metrics" },
  { label: "Predictive Maintenance", prompt: "Analyze predictive maintenance for all vehicles" },
  { label: "Route Optimization", prompt: "Optimize all active routes for efficiency and cost" },
  { label: "Cost Analysis", prompt: "Perform detailed cost analysis of current operations" },
  { label: "Demand Forecast", prompt: "Forecast demand for the next 30/60/90 days" },
  { label: "Risk Assessment", prompt: "Assess operational risks and provide mitigation strategies" },
  { label: "Performance Analytics", prompt: "Generate performance analytics and KPI report" },
  { label: "Sustainability Report", prompt: "Generate sustainability and CO2 emissions report" },
];

const ORCHESTRATION_MODES = [
  { key: "parallel", label: "Parallel", desc: "All agents run simultaneously — max speed", color: "#10b981", icon: Layers },
  { key: "sequential", label: "Sequential", desc: "Each agent builds on the previous output", color: "#06b6d4", icon: ArrowRight },
  { key: "hierarchical", label: "Hierarchical", desc: "Workers report to a supervisor who synthesizes", color: "#f59e0b", icon: Workflow },
  { key: "debate", label: "Debate", desc: "Agents argue, Referee synthesizes verdict", color: "#ec4899", icon: Swords },
];

// ── THINKING INDICATOR ───────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay }}
          style={{ background: "#06b6d4", boxShadow: "0 0 6px rgba(6,182,212,0.8)" }} />
      ))}
    </div>
  );
}

// ── FILE ATTACHMENT ──────────────────────────────────────────────────────────
function FileAttachment({ url }) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext))
    return <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
      <img src={url} alt="attachment" className="max-w-xs max-h-64 rounded-xl object-cover border border-cyan-500/20" />
    </a>;
  if (["mp4","mov","webm","avi"].includes(ext))
    return <video src={url} controls className="mt-2 max-w-xs rounded-xl border border-cyan-500/20" style={{ maxHeight: 200 }} />;
  return <a href={url} target="_blank" rel="noopener noreferrer"
    className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono inline-flex"
    style={{ color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
    <FileText className="w-3.5 h-3.5" />
    {url.split("/").pop().split("?")[0]}
    <Download className="w-3 h-3 ml-1" />
  </a>;
}

// ── CONFIDENCE BADGE ─────────────────────────────────────────────────────────
function ConfidenceBadge({ score }) {
  if (!score && score !== 0) return null;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "High" : score >= 60 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ml-2"
      style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
      <Gauge className="w-2.5 h-2.5" />
      {score}% {label}
    </span>
  );
}

// ── TOOL CALL DISPLAY ────────────────────────────────────────────────────────
function ToolCallBadge({ tc }) {
  const isRunning = tc.status === "running" || tc.status === "in_progress";
  const isDone = tc.status === "completed" || tc.status === "success";
  const color = isDone ? "#10b981" : isRunning ? "#f59e0b" : "#64748b";
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono py-0.5">
      <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "animate-pulse" : ""}`} style={{ background: color }} />
      <span style={{ color: "#94a3b8" }}>{tc.name?.replace(/_/g, " ") || "Tool"}</span>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color }} />}
      {isDone && <CheckCheck className="w-3 h-3 ml-auto" style={{ color }} />}
    </div>
  );
}

// ── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ message, allWorkers }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (isSystem) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const generatedImages = !isUser && message.content ? [...message.content.matchAll(imageUrlRegex)].map(m => m[0]) : [];

  // Detect if this is a multi-agent result (has agent_name metadata)
  const agentName = message.agent_name;
  const agentEmoji = message.agent_emoji;
  const confidence = message.confidence_score;
  const agentColor = allWorkers?.find(w => w.name === agentName)?.color || "#06b6d4";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 text-sm"
          style={{ background: agentEmoji ? `${agentColor}20` : "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: `1px solid ${agentEmoji ? agentColor + "40" : "rgba(6,182,212,0.3)"}` }}>
          {agentEmoji || <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />}
        </div>
      )}
      <div className={`max-w-[82%] relative ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: agentEmoji ? agentColor : "#8b5cf6" }}>
              {agentName || "H.A.R.B.O.R INTELLECT"}
            </span>
            {confidence != null && <ConfidenceBadge score={confidence} />}
          </div>
        )}
        {isUser && message.file_urls?.length > 0 && (
          <div className="flex flex-col gap-1 items-end mb-1">
            {message.file_urls.map((url, i) => <FileAttachment key={i} url={url} />)}
          </div>
        )}
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
            isUser ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white" : "text-slate-200"
          }`} style={!isUser ? { background: "rgba(10,15,35,0.9)", border: "1px solid rgba(6,182,212,0.12)" } : {}}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none
                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                  [&_strong]:text-cyan-300 [&_em]:text-violet-300
                  [&_code]:text-emerald-300 [&_code]:bg-emerald-500/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono
                  [&_pre]:bg-black/60 [&_pre]:border [&_pre]:border-slate-700/50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto
                  [&_pre_code]:bg-transparent [&_pre_code]:text-slate-300 [&_pre_code]:px-0 [&_pre_code]:py-0
                  [&_h1]:text-lg [&_h1]:text-cyan-400 [&_h1]:font-black [&_h1]:mt-4 [&_h1]:mb-2
                  [&_h2]:text-base [&_h2]:text-cyan-400 [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5
                  [&_h3]:text-sm [&_h3]:text-cyan-300 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                  [&_ul]:pl-4 [&_ul>li]:relative [&_ul>li]:pl-2 [&_ul>li]:mb-1 [&_ul>li]:text-slate-300
                  [&_ol]:pl-4 [&_ol>li]:mb-1 [&_ol>li]:text-slate-300
                  [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-sm
                  [&_th]:text-left [&_th]:font-mono [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-widest [&_th]:py-2 [&_th]:px-3 [&_th]:text-cyan-400
                  [&_td]:py-2 [&_td]:px-3 [&_td]:text-slate-300 [&_td]:border-b [&_td]:border-slate-700/30
                  [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/40 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-slate-400
                  [&_hr]:border-slate-700/40 [&_hr]:my-4"
                components={{
                  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 transition-colors">{children}</a>,
                  img: ({ src, alt }) => <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={alt} className="max-w-sm rounded-xl border border-cyan-500/30 my-2" /></a>,
                  code: ({ inline, className, children }) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-emerald-500/8">{children}</code>;
                    return (
                      <div className="relative group/code my-3">
                        <pre className="rounded-xl p-4 overflow-x-auto" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(100,116,139,0.2)" }}>
                          <code className="text-xs text-slate-300 font-mono">{children}</code>
                        </pre>
                        <button onClick={() => { navigator.clipboard.writeText(String(children)); toast.success("Kopieret!"); }}
                          className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1"
                          style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                }}
              >{message.content}</ReactMarkdown>
            )}
            {message.tool_calls?.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-slate-700/30 pt-3">
                {message.tool_calls.map((tc, i) => <ToolCallBadge key={i} tc={tc} />)}
              </div>
            )}
          </div>
        )}
        {generatedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {generatedImages.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={`generated-${i}`} className="max-w-xs rounded-xl border border-violet-500/30" style={{ maxHeight: 280 }} />
              </a>
            ))}
          </div>
        )}
        {!isUser && message.file_urls?.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">{message.file_urls.map((url, i) => <FileAttachment key={i} url={url} />)}</div>
        )}
        {!isUser && message.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            <button onClick={handleCopy}
              className="px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all"
              style={{ color: "#64748b", background: "rgba(15,23,42,0.6)" }}>
              {copied ? <><CheckCheck className="w-3 h-3 text-green-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
          style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
          <User className="w-4 h-4" style={{ color: "#8b5cf6" }} />
        </div>
      )}
    </motion.div>
  );
}

// ── ORCHESTRATION RESULT CARD ────────────────────────────────────────────────
function OrchestratorResultCard({ result, allWorkers }) {
  const [expanded, setExpanded] = useState(true);
  const worker = allWorkers.find(w => w.id === result.agent_id) || {};
  const color = worker.color || "#06b6d4";

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: `${color}06`, border: `1px solid ${color}25` }}>
      <button onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ borderBottom: expanded ? `1px solid ${color}15` : "none" }}>
        <span className="text-base">{result.agent_emoji || worker.emoji || "🤖"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono" style={{ color }}>{result.agent_name}</span>
            {result.confidence?.score != null && <ConfidenceBadge score={result.confidence.score} />}
            {result.tier && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${TIER_COLORS[result.tier] || color}15`, color: TIER_COLORS[result.tier] || color }}>{result.tier.toUpperCase()}</span>}
          </div>
          {result.domain && <span className="text-[10px] text-slate-500">{result.domain}</span>}
        </div>
        {result.tokens_estimated && <span className="text-[9px] font-mono text-slate-600">~{result.tokens_estimated}t</span>}
        <ChevronRight className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} style={{ color: "#475569" }} />
      </button>
      <AnimatePresence>
        {expanded && result.reply && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-4 py-3">
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none text-slate-300
                  [&_strong]:text-white [&_code]:text-emerald-300 [&_code]:bg-emerald-500/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]
                  [&_h2]:text-cyan-400 [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-cyan-300 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                  [&_ul>li]:text-slate-300 [&_ol>li]:text-slate-300
                  [&_table]:w-full [&_th]:text-left [&_th]:text-[10px] [&_th]:font-mono [&_th]:uppercase [&_th]:tracking-widest [&_th]:py-1.5 [&_th]:px-2 [&_th]:text-cyan-400
                  [&_td]:py-1.5 [&_td]:px-2 [&_td]:border-b [&_td]:border-slate-700/30"
              >{result.reply}</ReactMarkdown>
              {result.confidence && (
                <div className="mt-3 pt-3 border-t border-slate-700/30">
                  <p className="text-[10px] font-mono text-slate-500">
                    <span style={{ color }}>Confidence reasoning:</span> {result.confidence.reasoning}
                    {result.confidence.data_quality && ` • Data quality: ${result.confidence.data_quality}`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {expanded && result.error && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden">
            <div className="px-4 py-3">
              <p className="text-xs text-red-400 font-mono">⚠ {result.error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── ORCHESTRATOR RESULT PANEL ────────────────────────────────────────────────
function OrchestratorResultPanel({ data, allWorkers, onClose }) {
  const [tab, setTab] = useState("results");

  const results = data.results || (data.reply ? [{ agent_id: data.agent, agent_name: data.agent_name, agent_emoji: data.agent_emoji, reply: data.reply }] : []);
  const synthesis = results.find(r => r.tier === "synthesis" || r.agent_id === "harbor_synthesis_engine");
  const agentResults = results.filter(r => r.tier !== "synthesis" && r.agent_id !== "harbor_synthesis_engine");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(5,10,25,0.98)", border: "1px solid rgba(6,182,212,0.2)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}>
            <Network className="w-4 h-4" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <p className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>
              H.A.R.B.O.R Orchestrator · {data.mode?.toUpperCase()}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {data.agents_invoked} agents · {data.meta?.response_time_ms}ms · Est. €{data.meta?.billing?.cost_estimate_eur?.toFixed(2)}
              {data.meta?.average_confidence != null && ` · Avg conf: ${data.meta.average_confidence}%`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {["results", "routing", "meta"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
              style={{ background: tab === t ? "rgba(6,182,212,0.15)" : "transparent", color: tab === t ? "#06b6d4" : "#475569", border: tab === t ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent" }}>
              {t}
            </button>
          ))}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-all" style={{ color: "#64748b" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
        {tab === "results" && (
          <>
            {synthesis && (
              <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔮</span>
                  <span className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#a78bfa" }}>Synthesis Engine — Executive Summary</span>
                </div>
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_strong]:text-purple-300 [&_h2]:text-purple-400 [&_h3]:text-purple-300 text-slate-300">
                  {synthesis.reply}
                </ReactMarkdown>
              </div>
            )}
            {agentResults.map((r, i) => (
              <OrchestratorResultCard key={i} result={r} allWorkers={allWorkers} />
            ))}
            {data.failed_agents?.length > 0 && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-xs font-mono text-red-400 mb-1">⚠ Failed agents ({data.failed_agents.length})</p>
                {data.failed_agents.map((f, i) => <p key={i} className="text-[11px] text-red-400/70">{f.id}: {f.error}</p>)}
              </div>
            )}
          </>
        )}
        {tab === "routing" && data.routing && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Routing Reasoning</p>
              <p className="text-xs text-slate-300">{data.routing.reasoning}</p>
            </div>
            {data.routing.confidence != null && (
              <p className="text-[11px] font-mono" style={{ color: "#06b6d4" }}>Router confidence: {data.routing.confidence}% · Complexity: {data.routing.estimated_complexity}</p>
            )}
          </div>
        )}
        {tab === "meta" && (
          <div className="space-y-2">
            {[
              ["Mode", data.mode], ["Agents", data.agents_invoked], ["Success", data.successful],
              ["Failed", data.failed], ["Response time", `${data.meta?.response_time_ms}ms`],
              ["Model", data.meta?.model], ["Output format", data.meta?.output_format],
              ["Tokens est.", data.meta?.total_tokens_estimated], ["Cost est.", `€${data.meta?.billing?.cost_estimate_eur?.toFixed(2)}`],
              ["Avg confidence", data.meta?.average_confidence != null ? `${data.meta.average_confidence}%` : "N/A"],
              ["Context enriched", data.meta?.context_enriched ? "Yes" : "No"],
              ["Request ID", data.request_id]
            ].map(([k, v]) => v != null && (
              <div key={k} className="flex justify-between text-xs font-mono py-1.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span style={{ color: "#475569" }}>{k}</span>
                <span className="text-white">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── ORCHESTRATION PANEL ───────────────────────────────────────────────────────
function OrchestrationPanel({ onExecute, onClose, allWorkers, isRunning }) {
  const [mode, setMode] = useState("parallel");
  const [selectedAgents, setSelectedAgents] = useState(["harbor_fleet_analyst", "harbor_risk_engine"]);
  const [message, setMessage] = useState("");
  const [synthesis, setSynthesis] = useState(true);
  const [confidence, setConfidence] = useState(false);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [searchFilter, setSearchFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [maxAgents, setMaxAgents] = useState(6);
  const [superAgent, setSuperAgent] = useState("harbor_strategy_ai");

  const tiers = ["all", ...new Set(AI_WORKERS.map(w => w.tier))];
  const filtered = AI_WORKERS.filter(w => {
    const matchTier = tierFilter === "all" || w.tier === tierFilter;
    const matchSearch = !searchFilter || w.name.toLowerCase().includes(searchFilter.toLowerCase()) || w.specialty.toLowerCase().includes(searchFilter.toLowerCase());
    return matchTier && matchSearch;
  });

  const toggleAgent = (id) => setSelectedAgents(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id].slice(0, maxAgents));

  const handleRun = () => {
    if (!message.trim() && selectedAgents.length === 0) return;
    onExecute({ mode, agents: selectedAgents, message: message.trim(), synthesis, confidence_scores: confidence, output_format: outputFormat, supervisor_agent: superAgent, max_agents: maxAgents });
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden flex-shrink-0 border-t" style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(2,6,20,0.98)" }}>
      <div className="p-4 space-y-4">
        {/* Mode selector */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Orchestration Mode</p>
          <div className="grid grid-cols-4 gap-1.5">
            {ORCHESTRATION_MODES.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={{ background: mode === m.key ? `${m.color}15` : "rgba(255,255,255,0.02)", border: `1px solid ${mode === m.key ? m.color + "50" : "rgba(255,255,255,0.06)"}` }}>
                  <Icon className="w-4 h-4 mb-1.5" style={{ color: mode === m.key ? m.color : "#475569" }} />
                  <p className="text-[10px] font-bold font-mono" style={{ color: mode === m.key ? m.color : "#64748b" }}>{m.label}</p>
                  <p className="text-[9px] leading-tight mt-0.5" style={{ color: "#334155" }}>{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">Task / Question</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            placeholder="What should the agents analyze or accomplish?"
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-black/40 text-white placeholder-slate-600 outline-none resize-none"
            style={{ border: "1px solid rgba(6,182,212,0.2)" }} />
        </div>

        {/* Agent picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Select Agents ({selectedAgents.length}/{maxAgents})</p>
            <div className="flex items-center gap-2">
              <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search..."
                className="px-2 py-1 rounded-lg text-[10px] font-mono bg-black/40 text-white outline-none w-28"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
                className="px-2 py-1 rounded-lg text-[10px] font-mono bg-black/40 text-white outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {tiers.map(t => <option key={t} value={t}>{t === "all" ? "All tiers" : t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
            {filtered.map(w => {
              const isSelected = selectedAgents.includes(w.id);
              return (
                <button key={w.id} onClick={() => toggleAgent(w.id)}
                  className="p-2 rounded-xl text-left transition-all group"
                  style={{ background: isSelected ? `${w.color}15` : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? w.color + "50" : "rgba(255,255,255,0.05)"}` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold" style={{ color: isSelected ? w.color : "#94a3b8" }}>{w.emoji} {w.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: w.color }} />}
                  </div>
                  <p className="text-[9px] leading-tight" style={{ color: "#475569" }}>{w.specialty.slice(0, 45)}...</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options row */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer">
            <input type="checkbox" checked={synthesis} onChange={e => setSynthesis(e.target.checked)} className="w-3 h-3 accent-violet-500" />
            Synthesis
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer">
            <input type="checkbox" checked={confidence} onChange={e => setConfidence(e.target.checked)} className="w-3 h-3 accent-cyan-500" />
            Confidence scores
          </label>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            Format:
            <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-white outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              {["text", "markdown", "executive", "json"].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {mode === "hierarchical" && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              Supervisor:
              <select value={superAgent} onChange={e => setSuperAgent(e.target.value)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-white outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                {AI_WORKERS.filter(w => selectedAgents.includes(w.id) || w.tier === "advanced" || w.tier === "core").map(w => (
                  <option key={w.id} value={w.id}>{w.emoji} {w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Run */}
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
          <motion.button onClick={handleRun} disabled={isRunning || (!message.trim() && selectedAgents.length === 0)}
            whileHover={!isRunning ? { scale: 1.02 } : {}} whileTap={!isRunning ? { scale: 0.98 } : {}}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: isRunning ? "rgba(6,182,212,0.1)" : "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.2))", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)", boxShadow: isRunning ? "none" : "0 0 20px rgba(6,182,212,0.15)" }}>
            {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Orchestrating {selectedAgents.length} agents...</>
              : <><Zap className="w-4 h-4" /> Launch {selectedAgents.length} agents · {mode}</>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── CONVERSATION SIDEBAR ─────────────────────────────────────────────────────
function ConversationSidebar({ conversations, activeId, onSelect, onCreate, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
        <button onClick={onCreate} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all"
          style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4" }}>
          <Plus className="w-4 h-4" /> New Conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-center py-8 text-slate-600 text-xs font-mono">No conversations yet</p>
        )}
        {conversations.map(conv => (
          <div key={conv.id} onClick={() => editingId !== conv.id && onSelect(conv)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${activeId === conv.id ? "text-white" : "text-slate-500 hover:text-white"}`}
            style={activeId === conv.id ? { background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" } : { border: "1px solid transparent" }}>
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 text-cyan-600" />
            {editingId === conv.id ? (
              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                onBlur={() => { if (editValue.trim()) onRename(conv.id, editValue.trim()); setEditingId(null); }}
                onKeyDown={e => { if (e.key === "Enter" && editValue.trim()) { onRename(conv.id, editValue.trim()); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-transparent border-b border-cyan-500/50 text-white text-[11px] font-mono outline-none" />
            ) : (
              <span className="flex-1 truncate font-mono text-[11px]">{conv.metadata?.name || "Chat"}</span>
            )}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditValue(conv.metadata?.name || "Chat"); }}
                className="p-1 rounded hover:bg-cyan-500/20 hover:text-cyan-400"><Pencil className="w-2.5 h-2.5" /></button>
              <button onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                className="p-1 rounded hover:bg-red-500/20 hover:text-red-400"><Trash2 className="w-2.5 h-2.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOLOGRAM / KEYWORD TRIGGERS ───────────────────────────────────────────────
const KEYWORD_WINDOW_MAP = [
  { keywords: /fleet.?map|live.?track|vehicle.?map/i, window: "fleet_map" },
  { keywords: /route.?optim/i, window: "route_optimizer" },
  { keywords: /predictive.?maint/i, window: "predictive_maintenance" },
  { keywords: /demand.?forecast/i, window: "demand_forecast" },
  { keywords: /risk.?assess/i, window: "risk_assessment" },
  { keywords: /performance.?analyt/i, window: "performance_analytics" },
  { keywords: /satellite.?weather/i, window: "satellite_weather" },
  { keywords: /news.?intel/i, window: "news_intelligence" },
  { keywords: /swarm.?intel/i, window: "swarm_intelligence" },
  { keywords: /digital.?twin/i, window: "digital_twin" },
  { keywords: /document.?editor/i, window: "document_editor" },
  { keywords: /spreadsheet/i, window: "spreadsheet_editor" },
  { keywords: /image.?gen/i, window: "image_generator" },
  { keywords: /project.?man/i, window: "project_management" },
];

const getHologramSystemContext = (resolvedOrgId) => `You are H.A.R.B.O.R INTELLECT — an advanced superintelligence AI that can control hologram windows in the IntellectMode interface.

IMPORTANT: Your organization ID is: ${resolvedOrgId || 'unknown'}
When filtering data or analyzing, always use this organization ID.

When you want to open a window, use: [OPEN:window_type]
When you want to click: [CLICK:button_label]
When you want to type: [TYPE:field_label:value]
When you want to scroll: [SCROLL:down] or [SCROLL:up]

Available windows: fleet_map, route_optimizer, predictive_maintenance, demand_forecast, risk_assessment, performance_analytics, satellite_weather, news_intelligence, swarm_intelligence, digital_twin, document_editor, spreadsheet_editor, image_generator, project_management, airport_ops, port_command, vehicle_builder, deep_analysis, fleet_3d_viewer.

Narrate every action you take like a skilled human operator. Be decisive and insightful. Always respond in English.`;

const dispatchAIAction = (type, label, selector, value) => {
  window.dispatchEvent(new CustomEvent("harbor_ai_action", { detail: { type, label, selector, value } }));
};

const executeAgentActions = (content, onOpenWindow) => {
  const allMatches = [...content.matchAll(/\[(OPEN|CLICK|TYPE|SCROLL):([^\]]+)\]/gi)];
  let delay = 300;
  allMatches.forEach((m) => {
    const cmd = m[1].toUpperCase();
    const args = m[2].split(":");
    const d = delay;
    if (cmd === "OPEN" && onOpenWindow) {
      const tagIdx = content.indexOf(m[0]);
      const surrounding = content.slice(Math.max(0, tagIdx - 80), tagIdx + 80).replace(m[0], "").trim();
      setTimeout(() => onOpenWindow(args[0], { x: 80 + Math.random() * 200, y: 60 + Math.random() * 100 }, null, surrounding || null), d);
      delay += 800;
    } else if (cmd === "CLICK") {
      setTimeout(() => dispatchAIAction("click", args[0]), d); delay += 700;
    } else if (cmd === "TYPE") {
      setTimeout(() => dispatchAIAction("type", args[0], null, args.slice(1).join(":")), d); delay += 600;
    } else if (cmd === "SCROLL") {
      setTimeout(() => dispatchAIAction("scroll", args[0] || "down"), d); delay += 500;
    }
  });
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function HarborSuperAgentChat({ onClose, onOpenWindow }) {
  const getDeletedIds = () => { try { return new Set(JSON.parse(localStorage.getItem("harbor_deleted_convs") || "[]")); } catch { return new Set(); } };

  const [deletedIds, setDeletedIds] = useState(getDeletedIds);
  const [orgId, setOrgId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [contextEnrichment, setContextEnrichment] = useState(true);
  const [confidenceScores, setConfidenceScores] = useState(true);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [temperatureHint, setTemperatureHint] = useState("balanced");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Custom workers
  const [customWorkers, setCustomWorkers] = useState([]);
  const [showWorkerBuilder, setShowWorkerBuilder] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerPoolTab, setWorkerPoolTab] = useState("built-in");
  const [showWorkerPool, setShowWorkerPool] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");

  // Orchestration
  const [showOrchestrationPanel, setShowOrchestrationPanel] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationResults, setOrchestrationResults] = useState([]); // [{id, data}]
  const [orchestrations, setOrchestrations] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [workerHolograms, setWorkerHolograms] = useState([]);
  const [performanceHistory, setPerformanceHistory] = useState([]);

  // Advanced panels
  const [showSmartRouter, setShowSmartRouter] = useState(false);
  const [showObservability, setShowObservability] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);
  const [showEvalSuite, setShowEvalSuite] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingOptions, setPendingOptions] = useState({});

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const activeConversationRef = useRef(null);
  const lastAssistantMsgIdRef = useRef(null);

  const allWorkers = [
    ...AI_WORKERS,
    ...customWorkers.map(w => ({ id: `custom_${w.id}`, name: w.name, emoji: w.emoji, color: w.color || "#8b5cf6", tier: "custom", specialty: w.specialty || "Custom AI Worker", isCustom: true, rawId: w.id }))
  ];

  // ── INIT ───────────────────────────────────────────────────────────────────
  const loadCustomWorkers = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const workers = await base44.entities.CustomAIWorker.filter({ created_by: user.email });
      setCustomWorkers(workers || []);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      // Load org ID and conversations in parallel
      const resolveOrgId = async () => {
        try {
          const user = await base44.auth.me();
          if (!user) return;
          const cached = localStorage.getItem(`harbor_org_id_${user.email}`);
          if (cached) { setOrgId(cached); return; }
          if (user.organization_id) {
            setOrgId(user.organization_id);
            localStorage.setItem(`harbor_org_id_${user.email}`, user.organization_id);
            return;
          }
          const members = await base44.entities.OrganizationMember.filter({ user_email: user.email });
          if (members?.length > 0) {
            setOrgId(members[0].organization_id);
            localStorage.setItem(`harbor_org_id_${user.email}`, members[0].organization_id);
          }
        } catch (e) { console.error('[OrgID] Load error:', e); }
      };

      await Promise.all([resolveOrgId(), loadConversations(), loadCustomWorkers()]);
    };
    init();
    return () => { unsubscribeRef.current?.(); };
  }, []);

  useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && isUserScrolledUpRef.current) return;
    requestAnimationFrame(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight; });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { scrollToBottom(true); }, [orchestrations]);

  const handleScrollContainerScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isUserScrolledUpRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) > 100;
  }, []);

  // ── CONVERSATIONS ──────────────────────────────────────────────────────────
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      const currentDeletedIds = getDeletedIds();
      // Only show conversations created from HarborSuperAgentChat (tagged with source)
      const active = (convs || []).filter(c =>
        !currentDeletedIds.has(c.id) && c.metadata?.source === "super_agent_chat"
      );
      setConversations(active);
      if (active.length > 0) await selectConversation(active[0]);
    } catch { toast.error("Could not load conversations"); }
    setIsLoading(false);
  };

  const processHologramCommands = useCallback((content) => {
    if (!content) return;
    executeAgentActions(content, onOpenWindow);
    if (!/\[(OPEN|CLICK|TYPE|SCROLL):/i.test(content) && onOpenWindow) {
      for (const mapping of KEYWORD_WINDOW_MAP) {
        if (mapping.keywords.test(content)) { onOpenWindow(mapping.window, { x: 80, y: 60 }); break; }
      }
    }
  }, [onOpenWindow]);

  const subscribeToConversation = (convId) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant" && last.id !== lastAssistantMsgIdRef.current) {
        lastAssistantMsgIdRef.current = last.id;
        setIsSending(false);
        if (last.content) processHologramCommands(last.content);
      }
      // Safety: if last message is from user and we've been waiting >15s, reset sending state
      if (last?.role === "user") {
        clearTimeout(window._harborSendTimeout);
        window._harborSendTimeout = setTimeout(() => setIsSending(false), 15000);
      }
    });
  };

  const selectConversation = async (conv) => {
    unsubscribeRef.current?.();
    setIsSending(false);
    lastAssistantMsgIdRef.current = null;
    isUserScrolledUpRef.current = false;
    setActiveConversation(conv);
    const full = await base44.agents.getConversation(conv.id);
    const msgs = full.messages || [];
    setMessages(msgs);
    const lastAsst = [...msgs].reverse().find(m => m.role === "assistant");
    if (lastAsst?.id) lastAssistantMsgIdRef.current = lastAsst.id;
    subscribeToConversation(conv.id);
  };

  const createNewConversation = async () => {
    lastAssistantMsgIdRef.current = null;
    setIsSending(false);
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Chat ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, source: "super_agent_chat" }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
    subscribeToConversation(conv.id);

    const resolvedOrgId = orgId || (() => {
      try { const keys = Object.keys(localStorage).filter(k => k.startsWith("harbor_org_id_")); return keys.length > 0 ? localStorage.getItem(keys[0]) : null; } catch { return null; }
    })();

    const systemMsg = getHologramSystemContext(resolvedOrgId);
    base44.agents.addMessage(conv, { role: "system", content: systemMsg }).catch(() => {});
    return conv;
  };

  const renameConversation = (convId, newName) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, metadata: { ...c.metadata, name: newName } } : c));
    if (activeConversation?.id === convId) setActiveConversation(prev => ({ ...prev, metadata: { ...prev.metadata, name: newName } }));
  };

  const deleteConversation = (convId) => {
    const updated = getDeletedIds(); updated.add(convId);
    localStorage.setItem("harbor_deleted_convs", JSON.stringify([...updated]));
    setDeletedIds(updated);
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== convId);
      if (activeConversationRef.current?.id === convId) {
        unsubscribeRef.current?.(); setIsSending(false); lastAssistantMsgIdRef.current = null;
        if (remaining.length > 0) selectConversation(remaining[0]);
        else { setActiveConversation(null); setMessages([]); activeConversationRef.current = null; }
      }
      return remaining;
    });
  };

  // ── FILE UPLOAD ────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    for (const file of files) {
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        const file_url = res?.data?.file_url || res?.file_url;
        if (!file_url) throw new Error("Upload failed");
        const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "file";
        setAttachments(prev => [...prev, { url: file_url, name: file.name, type }]);
        if (orgId) {
          base44.entities.FleetDriveFile.create({ organization_id: orgId, name: file.name, file_url, file_type: type, file_size_bytes: file.size, mime_type: file.type, folder: "chat_uploads", source: "chat" }).catch(() => {});
        }
      } catch { toast.error(`Upload failed: ${file.name}`); }
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const generateImage = async () => {
    if (!imageGenPrompt.trim() || !activeConversation) return;
    setIsGeneratingImage(true);
    const prompt = imageGenPrompt.trim();
    setImageGenPrompt(""); setShowImageGen(false);
    await base44.agents.addMessage(activeConversation, { role: "user", content: `Generate an image: ${prompt}` });
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      await base44.agents.addMessage(activeConversation, { role: "assistant", content: `Here is your generated image:\n\n![${prompt}](${url})`, file_urls: [url] });
    } catch { toast.error("Image generation failed"); }
    setIsGeneratingImage(false);
  };

  // ── ORCHESTRATOR EXECUTION ─────────────────────────────────────────────────
   const executeOrchestration = useCallback(async (params) => {
    setIsOrchestrating(true);
    setShowOrchestrationPanel(false);
    const orchId = `orch_${Date.now()}`;

    try {
      const response = await base44.functions.invoke("harborOrchestratorAPI", {
        ...params,
        context_enrichment: contextEnrichment,
        confidence_scores: confidenceScores,
        output_format: outputFormat,
        temperature_hint: temperatureHint,
        retry_on_fail: true,
        request_id: orchId,
      });

      const data = response.data;
      setOrchestrationResults(prev => [{ id: orchId, data, timestamp: Date.now() }, ...prev]);
      toast.success(`⚡ ${data.agents_invoked || 1} agent${(data.agents_invoked || 1) > 1 ? "s" : ""} completed`);

      // Track performance
      if (data.results) {
        data.results.forEach(r => setPerformanceHistory(prev => [...prev.slice(-200), { workerId: r.agent_id, success: !r.error, timestamp: Date.now() }]));
      }
    } catch (err) {
      toast.error(`Orchestration failed: ${err.message}`);
    }
    setIsOrchestrating(false);
  }, []);

  // ── SEND MESSAGE ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text !== undefined ? text : input).trim();
    if ((!msg && attachments.length === 0) || isSending) return;

    let conv = activeConversationRef.current;
    if (!conv) { conv = await createNewConversation(); if (!conv) return; }

    const fileUrls = attachments.map(a => a.url);
    setIsSending(true);
    isUserScrolledUpRef.current = false;
    setInput(""); setAttachments([]);
    if (inputRef.current) inputRef.current.style.height = "24px";
    scrollToBottom(true);

    try {
      const messageContent = orgId 
        ? `[ORG:${orgId}]\n\n${msg || "(files attached)"}`
        : msg || "(files attached)";
      await base44.agents.addMessage(conv, { 
        role: "user", 
        content: messageContent,
        ...(fileUrls.length > 0 && { file_urls: fileUrls }),
      });
      if (orgId) base44.entities.FleetAIUsage.create({ organization_id: orgId, command: msg || "(files)", action: "HARBOR_SUPER_AGENT_CHAT", success: true }).catch(() => {});
    } catch (err) {
      toast.error(`Message not sent: ${err?.message}`);
      if (msg) setInput(msg);
      setIsSending(false);
    }
    inputRef.current?.focus();
  }, [input, attachments, isSending, orgId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const visibleMessages = messages.filter(m => m.role !== "system");

  // Worker pool filtered
  const filteredBuiltIn = AI_WORKERS.filter(w => !workerSearch || w.name.toLowerCase().includes(workerSearch.toLowerCase()) || w.specialty.toLowerCase().includes(workerSearch.toLowerCase()));

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        top: isMaximized ? 8 : "2%", left: isMaximized ? 8 : "2%",
        right: isMaximized ? 8 : "2%", bottom: isMaximized ? 8 : "2%",
        background: "rgba(1,5,15,0.98)",
        border: "1px solid rgba(6,182,212,0.25)",
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        boxShadow: "0 0 100px rgba(6,182,212,0.08), 0 0 200px rgba(139,92,246,0.04)"
      }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
        <div className="absolute top-0 left-1/3 w-64 h-16 opacity-10 blur-3xl" style={{ background: "linear-gradient(180deg, #06b6d4, transparent)" }} />
        <div className="absolute bottom-0 right-1/3 w-64 h-16 opacity-8 blur-3xl" style={{ background: "linear-gradient(0deg, #8b5cf6, transparent)" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), rgba(139,92,246,0.4), transparent)" }} />
      </div>

      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.015)" }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.35)" }}>
              <Brain className="w-5 h-5" style={{ color: "#06b6d4" }} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>H.A.R.B.O.R INTELLECT</h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                style={{ color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
                {allWorkers.length}+ WORKERS
              </span>
              {isOrchestrating && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1"
                  style={{ color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)" }}>
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> ORCHESTRATING
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-mono tracking-widest" style={{ color: "rgba(6,182,212,0.35)" }}>
                Multi-Agent AI · Claude Sonnet 4.6 · 7 Orchestration Modes
              </p>
              {orgId && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-widest"
                  style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)", color: "#16a34a" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#16a34a", boxShadow: "0 0 4px #16a34a" }} />
                  ORG: {orgId.slice(0, 8)}...
                </div>
              )}
              {!orgId && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-widest"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
                  No Org
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[
            { key: "orch", label: "ORCHESTRATE", icon: Network, color: "#06b6d4", active: showOrchestrationPanel, action: () => setShowOrchestrationPanel(p => !p) },
            { key: "workers", label: `${allWorkers.length} WORKERS`, icon: Grid3x3, color: "#a78bfa", active: showWorkerPool, action: () => setShowWorkerPool(p => !p) },
            { key: "router", icon: Route, color: "#10b981", active: showSmartRouter, action: () => setShowSmartRouter(p => !p) },
            { key: "obs", icon: Activity, color: "#f59e0b", active: showObservability, action: () => setShowObservability(p => !p) },
            { key: "mem", icon: Database, color: "#a78bfa", active: showMemoryPanel, action: () => setShowMemoryPanel(p => !p) },
            { key: "vers", icon: GitBranch, color: "#a78bfa", active: showVersionManager, action: () => setShowVersionManager(p => !p) },
            { key: "eval", icon: FlaskConical, color: "#f59e0b", active: showEvalSuite, action: () => setShowEvalSuite(p => !p) },
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <motion.button key={btn.key} onClick={btn.action} whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all"
                style={{ background: btn.active ? `${btn.color}20` : `${btn.color}06`, color: btn.color, border: `1px solid ${btn.active ? btn.color + "50" : btn.color + "20"}` }}>
                <Icon className="w-3 h-3" />
                {btn.label && <span className="hidden xl:inline">{btn.label}</span>}
              </motion.button>
            );
          })}
          <button onClick={() => setShowSidebar(p => !p)} className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all"
            style={{ color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }}>
            <MessageSquare className="w-3 h-3" /><span className="hidden sm:inline">{showSidebar ? "Hide" : "Chats"}</span>
          </button>
          <button onClick={() => setIsMaximized(p => !p)} className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-all" style={{ color: "#64748b" }}>
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all" style={{ color: "#64748b" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── WORKER POOL DRAWER ── */}
      <AnimatePresence>
        {showWorkerPool && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b" style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(4,8,22,0.98)" }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  {["built-in", "custom"].map(tab => (
                    <button key={tab} onClick={() => setWorkerPoolTab(tab)}
                      className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all"
                      style={{ background: workerPoolTab === tab ? "rgba(6,182,212,0.15)" : "transparent", color: workerPoolTab === tab ? "#06b6d4" : "#64748b", border: workerPoolTab === tab ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent" }}>
                      {tab === "built-in" ? `Built-in (${AI_WORKERS.length})` : `Custom (${customWorkers.length})`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#475569" }} />
                    <input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Search..."
                      className="pl-7 pr-3 py-1 rounded-lg text-[10px] font-mono bg-black/40 text-white outline-none w-32"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                  <motion.button onClick={() => { setEditingWorker(null); setShowWorkerBuilder(true); }} whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                    <UserPlus className="w-3 h-3" /> Create Worker
                  </motion.button>
                </div>
              </div>
              {workerPoolTab === "built-in" && (
                <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto">
                  {filteredBuiltIn.map(w => (
                    <div key={w.id} className="p-2 rounded-lg group" style={{ background: `${w.color}08`, border: `1px solid ${w.color}18` }}>
                      <p className="text-[11px] font-bold" style={{ color: w.color }}>{w.emoji} {w.name}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5 leading-tight truncate">{w.specialty}</p>
                      <span className="text-[8px] font-mono mt-0.5 inline-block" style={{ color: TIER_COLORS[w.tier] || "#64748b" }}>{w.tier}</span>
                    </div>
                  ))}
                </div>
              )}
              {workerPoolTab === "custom" && (
                <div>
                  {customWorkers.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500 mb-3">No custom workers yet</p>
                      <motion.button onClick={() => { setEditingWorker(null); setShowWorkerBuilder(true); }} whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                        + Create your first worker
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
                      {customWorkers.map(w => (
                        <div key={w.id} className="group p-2.5 rounded-lg relative" style={{ background: `${w.color || "#8b5cf6"}10`, border: `1px solid ${w.color || "#8b5cf6"}25` }}>
                          <p className="text-xs font-bold" style={{ color: w.color || "#a78bfa" }}>{w.emoji} {w.name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight truncate">{w.specialty}</p>
                          <button onClick={() => { setEditingWorker(w); setShowWorkerBuilder(true); }}
                            className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700" style={{ color: "#64748b" }}>
                            <Settings className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className="flex-shrink-0 overflow-hidden"
              style={{ borderRight: "1px solid rgba(6,182,212,0.08)", background: "rgba(4,8,20,0.9)" }}>
              <div style={{ width: 220 }}>
                <ConversationSidebar conversations={conversations} activeId={activeConversation?.id}
                  onSelect={selectConversation} onCreate={createNewConversation} onDelete={deleteConversation} onRename={renameConversation} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(6,182,212,0.3)" }}>
                  <Brain className="w-8 h-8 animate-pulse" style={{ color: "#06b6d4" }} />
                  <motion.div className="absolute inset-0 rounded-2xl border" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ borderColor: "#06b6d4" }} />
                </div>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.6)" }}>Initializing H.A.R.B.O.R...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Message feed */}
              <div ref={scrollContainerRef} onScroll={handleScrollContainerScroll}
                className="flex-1 overflow-y-auto p-5 space-y-5" style={{ overflowAnchor: "none" }}>
                {/* Empty state */}
                {visibleMessages.length === 0 && orchestrationResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border flex items-center justify-center"
                      style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.04)" }}>
                      <Sparkles className="w-8 h-8" style={{ color: "#06b6d4" }} />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Ready for command</h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        {allWorkers.length}+ specialized AI workers standing by. Use ORCHESTRATE for multi-agent analysis, or chat directly with H.A.R.B.O.R Intellect.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                      {QUICK_PROMPTS.map((p, i) => (
                        <button key={i} onClick={() => sendMessage(p.text)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[11px] leading-snug transition-all hover:text-white group"
                          style={{ color: "#64748b", background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.08)" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; e.currentTarget.style.background = "rgba(6,182,212,0.07)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.08)"; e.currentTarget.style.background = "rgba(6,182,212,0.03)"; }}>
                          <span className="text-base flex-shrink-0">{p.icon}</span>
                          {p.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {visibleMessages.map((msg, i) => <MessageBubble key={i} message={msg} allWorkers={allWorkers} />)}

                {/* Orchestration results (inline) */}
                {orchestrationResults.map(item => (
                  <OrchestratorResultPanel key={item.id} data={item.data} allWorkers={allWorkers} onClose={() => setOrchestrationResults(prev => prev.filter(r => r.id !== item.id))} />
                ))}

                {/* Legacy orchestration monitors */}
                {orchestrations.filter(o => o.conversationId === activeConversation?.id).map(orch => (
                  <OrchestrationMonitor key={orch.id} orchestration={orch}
                    onViewOutput={(worker, output) => setSelectedOutput({ worker, output })}
                    onOpenHologram={(worker, task) => setWorkerHolograms(prev => [...prev, { workerId: worker.id, task, isActive: true }])} />
                ))}

                {/* Worker Hologram Controls */}
                {workerHolograms.map((holo, i) => (
                  <WorkerHologramControl key={holo.workerId} worker={AI_WORKERS.find(w => w.id === holo.workerId)} task={holo.task} isActive={holo.isActive}
                    onComplete={(result) => setWorkerHolograms(prev => result.cancelled ? prev.filter(h => h.workerId !== result.worker?.id) : prev.map(h => h.workerId === result.worker?.id ? { ...h, isActive: false } : h))} />
                ))}

                {/* Smart Router */}
                {showSmartRouter && (
                  <AgentSmartRouter task={input} allWorkers={allWorkers} performanceHistory={performanceHistory}
                    onSelectWorker={(worker) => { setShowSmartRouter(false); toast.success(`${worker.emoji} ${worker.name} selected`); }}
                    onClose={() => setShowSmartRouter(false)} />
                )}
                {showObservability && <AgentObservabilityPanel orchestrations={orchestrations} onClose={() => setShowObservability(false)} />}
                {showVersionManager && <WorkflowVersionManager currentTasks={pendingTasks} currentOptions={pendingOptions}
                  onLoadVersion={(v) => { setPendingTasks(v.tasks); setPendingOptions(v.options || {}); setShowVersionManager(false); setShowOrchestrationPanel(true); toast.success(`Loaded: ${v.name}`); }}
                  onClose={() => setShowVersionManager(false)} />}
                {showEvalSuite && <AgentEvalSuite allWorkers={allWorkers} orgId={orgId} onClose={() => setShowEvalSuite(false)} />}
                {showMemoryPanel && <AgentSharedMemoryPanel orgId={orgId} onClose={() => setShowMemoryPanel(false)} />}

                {/* Thinking indicator */}
                {isSending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
                      <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(10,15,35,0.9)", border: "1px solid rgba(6,182,212,0.12)" }}>
                      <ThinkingDots />
                      <span className="text-[10px] text-slate-500 font-mono">H.A.R.B.O.R thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── ORCHESTRATION PANEL ── */}
              <AnimatePresence>
                {showOrchestrationPanel && (
                  <OrchestrationPanel
                    onExecute={executeOrchestration}
                    onClose={() => setShowOrchestrationPanel(false)}
                    allWorkers={allWorkers}
                    isRunning={isOrchestrating}
                  />
                )}
              </AnimatePresence>

              {/* Advanced Options Panel */}
              {showAdvancedOptions && visibleMessages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="px-5 pb-2 flex gap-3 overflow-x-auto flex-shrink-0 text-[10px] font-mono"
                  style={{ borderTop: "1px solid rgba(6,182,212,0.08)", paddingTop: 12 }}>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={contextEnrichment} onChange={e => setContextEnrichment(e.target.checked)} className="w-3 h-3 accent-cyan-500" />
                    <span style={{ color: contextEnrichment ? "#06b6d4" : "#64748b" }}>Context</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={confidenceScores} onChange={e => setConfidenceScores(e.target.checked)} className="w-3 h-3 accent-cyan-500" />
                    <span style={{ color: confidenceScores ? "#06b6d4" : "#64748b" }}>Confidence</span>
                  </label>
                  <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}
                    className="px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 outline-none"
                    style={{ border: "1px solid rgba(6,182,212,0.15)" }}>
                    <option value="text">Text</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="executive">Executive</option>
                  </select>
                  <select value={temperatureHint} onChange={e => setTemperatureHint(e.target.value)}
                    className="px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 outline-none"
                    style={{ border: "1px solid rgba(6,182,212,0.15)" }}>
                    <option value="precise">Precise</option>
                    <option value="balanced">Balanced</option>
                    <option value="creative">Creative</option>
                  </select>
                </motion.div>
              )}

              {/* Quick prompts strip */}
              {visibleMessages.length > 0 && (
                <div className="px-5 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
                  <button onClick={() => setShowAdvancedOptions(p => !p)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-mono transition-all whitespace-nowrap"
                    style={{ color: showAdvancedOptions ? "#06b6d4" : "#64748b", border: `1px solid ${showAdvancedOptions ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.1)"}`, background: showAdvancedOptions ? "rgba(6,182,212,0.08)" : "rgba(6,182,212,0.03)" }}>
                    ⚙️ {showAdvancedOptions ? "Hide" : "Show"}
                  </button>
                  {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p.text)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all whitespace-nowrap"
                      style={{ color: "#64748b", border: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; }}>
                      {p.icon} {p.text.length > 38 ? p.text.slice(0, 38) + "…" : p.text}
                    </button>
                  ))}
                </div>
              )}

              {/* ── INPUT BAR ── */}
              <div className="flex-shrink-0 p-4" style={{ borderTop: "1px solid rgba(6,182,212,0.08)" }}>
                {/* Image gen bar */}
                {showImageGen && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-3 rounded-2xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)" }}>
                    <Wand2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8b5cf6" }} />
                    <input autoFocus value={imageGenPrompt} onChange={e => setImageGenPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") generateImage(); if (e.key === "Escape") setShowImageGen(false); }}
                      placeholder="Describe the image... (Enter)"
                      className="flex-1 bg-transparent text-sm text-white placeholder-violet-400/40 outline-none" />
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b5cf6" }} />
                      : <button onClick={generateImage} className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.15)" }}>Generate</button>}
                    <button onClick={() => setShowImageGen(false)}><XCircle className="w-4 h-4 text-slate-500 hover:text-red-400" /></button>
                  </motion.div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((a, i) => (
                      <div key={i} className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono"
                        style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
                        {a.type === "image" ? <Image className="w-3 h-3" /> : a.type === "video" ? <Film className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        <span className="max-w-[100px] truncate">{a.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-1 opacity-0 group-hover:opacity-100">
                          <XCircle className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.csv,.xlsx,.xls,.docx,.txt,.json" className="hidden" onChange={handleFileUpload} />

                <div className="relative flex items-end gap-2 rounded-2xl p-3"
                  style={{ background: "rgba(8,14,32,0.9)", border: "1px solid rgba(6,182,212,0.18)" }}>
                  <div className="flex items-center gap-0.5 flex-shrink-0 pb-0.5">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-slate-800/60 disabled:opacity-40"
                      style={{ color: isUploading ? "#06b6d4" : "#475569" }}>
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setShowImageGen(p => !p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-violet-500/20"
                      style={{ color: showImageGen ? "#8b5cf6" : "#475569" }}>
                      <ImagePlus className="w-3.5 h-3.5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-cyan-500/20"
                          style={{ color: "#475569" }}
                          title="Quick prompts">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {PROMPT_TEMPLATES.map((template) => (
                          <DropdownMenuItem key={template.label} onClick={() => setInput(orgId ? `[ORG:${orgId}]\n\n${template.prompt}` : template.prompt)}>
                            <span className="text-sm">{template.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <motion.button onClick={() => setShowOrchestrationPanel(p => !p)} whileHover={{ scale: 1.1 }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: showOrchestrationPanel ? "#06b6d4" : "#475569", background: showOrchestrationPanel ? "rgba(6,182,212,0.15)" : "transparent" }}
                      title="Launch Multi-Agent Orchestration">
                      <Zap className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Command H.A.R.B.O.R... or press ⚡ for multi-agent orchestration"
                    disabled={isSending} rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed"
                    style={{ minHeight: 24, maxHeight: 140, overflowY: "auto" }}
                    onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }} />
                  <motion.button onClick={() => sendMessage()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={(!input.trim() && attachments.length === 0) || isSending}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: (input.trim() || attachments.length > 0) && !isSending ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(6,182,212,0.08)",
                      boxShadow: (input.trim() || attachments.length > 0) && !isSending ? "0 0 20px rgba(6,182,212,0.25)" : "none"
                    }}>
                    {isSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </motion.button>
                </div>
                <p className="text-[9px] font-mono text-slate-700 text-center mt-1.5 tracking-wider">
                  {allWorkers.length}+ AI Workers · Claude Sonnet 4.6 · 7 modes · Confidence · Context · Advanced Options
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CUSTOM WORKER BUILDER ── */}
      <AnimatePresence>
        {showWorkerBuilder && (
          <CustomWorkerBuilder onClose={() => { setShowWorkerBuilder(false); setEditingWorker(null); }} editingWorker={editingWorker}
            onWorkerCreated={() => { loadCustomWorkers(); setShowWorkerBuilder(false); setEditingWorker(null); setWorkerPoolTab("custom"); setShowWorkerPool(true); }} />
        )}
      </AnimatePresence>

      {/* ── OUTPUT VIEWER MODAL ── */}
      <AnimatePresence>
        {selectedOutput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md rounded-[20px]"
            onClick={() => setSelectedOutput(null)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="w-4/5 max-w-3xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "rgba(3,6,18,0.99)", border: `1px solid ${selectedOutput.worker.color}40`, boxShadow: `0 0 60px ${selectedOutput.worker.color}12` }}>
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
                style={{ borderColor: selectedOutput.worker.color + "20", background: selectedOutput.worker.color + "06" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: selectedOutput.worker.color + "15", border: `1px solid ${selectedOutput.worker.color}30` }}>
                    {selectedOutput.worker.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-black font-mono tracking-wider" style={{ color: selectedOutput.worker.color }}>{selectedOutput.worker.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Analysis Output</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOutput(null)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors" style={{ color: "#64748b" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ReactMarkdown
                  className="prose prose-sm prose-invert max-w-none"
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-black mt-0 mb-4 pb-3 border-b" style={{ color: selectedOutput.worker.color, borderColor: selectedOutput.worker.color + "30" }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mt-6 mb-3" style={{ color: selectedOutput.worker.color + "cc" }}>{children}</h2>,
                    p: ({ children }) => <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>,
                    li: ({ children }) => <li className="text-sm text-slate-300 mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    code: ({ inline, children }) => inline
                      ? <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: selectedOutput.worker.color + "15", color: selectedOutput.worker.color }}>{children}</code>
                      : <pre className="rounded-xl p-4 my-3 overflow-x-auto" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(100,116,139,0.15)" }}><code className="text-xs text-slate-300">{children}</code></pre>,
                  }}>
                  {typeof selectedOutput.output === "string" ? selectedOutput.output : JSON.stringify(selectedOutput.output, null, 2)}
                </ReactMarkdown>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}