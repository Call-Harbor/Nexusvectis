import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import WorkerHologramControl from "./WorkerHologramControl";
import OrchestrationMonitor from "./OrchestrationMonitor";
import {
  Brain, Send, X, Plus, Trash2, MessageSquare, Loader2,
  Sparkles, User, Copy, CheckCheck, Minimize2, Maximize2,
  Pencil, Paperclip, Image, Film, FileText, Download,
  ImagePlus, Wand2, XCircle, Zap, Network, Grid3x3,
  Play, Square, Eye, ChevronDown, AlertCircle, CheckCircle2,
  Clock, Activity
} from "lucide-react";
import { toast } from "sonner";

const AGENT_NAME = "harbor_intellect";

// ────────────────────────────────────────────────────────────────────
// AI WORKER POOL
// ────────────────────────────────────────────────────────────────────
const AI_WORKERS = [
  // ─────────────────── FLEET & LOGISTICS ───────────────────
  { id: "harbor_fleet_analyst",     name: "Fleet Analyst",       emoji: "📊", color: "#06b6d4", agent: "harbor_fleet_analyst", specialty: "Vehicle performance, utilization, CO2 metrics" },
  { id: "harbor_route_optimizer",   name: "Route Optimizer",     emoji: "🗺️", color: "#8b5cf6", agent: "harbor_route_optimizer", specialty: "Logistics routing, cost reduction, fuel optimization" },
  { id: "harbor_demand_forecaster", name: "Demand Forecaster",   emoji: "🔮", color: "#10b981", agent: "harbor_demand_forecaster", specialty: "30/60/90-day demand, inventory, capacity planning" },
  { id: "harbor_driver_coach",      name: "Driver Coach",        emoji: "🏆", color: "#f59e0b", agent: "harbor_driver_coach", specialty: "Driver performance, safety scores, training needs" },
  { id: "harbor_ops_commander",     name: "Ops Commander",       emoji: "⚡", color: "#ef4444", agent: "harbor_ops_commander", specialty: "Real-time operations, dispatch, incident response" },

  // ─────────────────── RISK & COMPLIANCE ───────────────────
  { id: "harbor_risk_engine",       name: "Risk Engine",         emoji: "⚠️", color: "#ef4444", agent: "harbor_risk_engine", specialty: "Risk scoring, anomaly detection, exception handling" },
  { id: "harbor_compliance_guard",  name: "Compliance Guard",    emoji: "🛡️", color: "#10b981", agent: "harbor_compliance_guard", specialty: "Regulatory compliance, audit trails, certifications" },
  { id: "harbor_security_ai",       name: "Security AI",         emoji: "🔒", color: "#ef4444", agent: "harbor_security_ai", specialty: "Access control, anomaly detection, threat analysis" },

  // ─────────────────── FINANCE & BUSINESS ───────────────────
  { id: "harbor_financial_ai",      name: "Financial AI",        emoji: "💰", color: "#f59e0b", agent: "harbor_financial_ai", specialty: "Cost analysis, ROI, budget optimization, savings" },
  { id: "harbor_customer_intel",    name: "Customer Intel",      emoji: "👥", color: "#8b5cf6", agent: "harbor_customer_intel", specialty: "Customer analysis, satisfaction, contract performance" },
  { id: "harbor_market_scout",      name: "Market Scout",        emoji: "🔍", color: "#06b6d4", agent: "harbor_market_scout", specialty: "Market intelligence, competitor analysis, trends" },
  { id: "harbor_strategy_ai",       name: "Strategy AI",         emoji: "🧠", color: "#a78bfa", agent: "harbor_strategy_ai", specialty: "Strategic planning, competitive positioning, growth" },
  { id: "sales_agent",              name: "Sales Closer",        emoji: "🤝", color: "#ec4899", specialty: "Deal analysis, pipeline management, revenue forecasting" },
  { id: "pricing_optimizer",        name: "Pricing AI",          emoji: "💵", color: "#f59e0b", specialty: "Dynamic pricing, market rates, profit maximization" },

  // ─────────────────── OPERATIONS & QUALITY ───────────────────
  { id: "harbor_maintenance_bot",   name: "Maintenance Bot",     emoji: "🔧", color: "#06b6d4", agent: "harbor_maintenance_bot", specialty: "Predictive maintenance, failure prediction, scheduling" },
  { id: "quality_assurance",        name: "QA Engineer",         emoji: "✅", color: "#10b981", specialty: "Testing, bug detection, performance validation" },
  { id: "project_manager",          name: "Project Manager",     emoji: "📋", color: "#06b6d4", specialty: "Timeline tracking, resource allocation, milestone planning" },
  { id: "training_coordinator",     name: "Training Coach",      emoji: "🎓", color: "#a78bfa", specialty: "Employee development, skill assessment, course planning" },

  // ─────────────────── DEVELOPMENT & TECH ───────────────────
  { id: "backend_developer",        name: "Backend Dev",         emoji: "⚙️", color: "#06b6d4", specialty: "API design, database optimization, server architecture" },
  { id: "frontend_developer",       name: "Frontend Dev",        emoji: "🎨", color: "#8b5cf6", specialty: "UI/UX implementation, responsive design, performance" },
  { id: "devops_engineer",          name: "DevOps Ops",          emoji: "🚀", color: "#ef4444", specialty: "CI/CD pipelines, deployment, infrastructure automation" },
  { id: "data_scientist",           name: "Data Scientist",      emoji: "📈", color: "#10b981", specialty: "ML models, statistical analysis, predictive analytics" },
  { id: "database_architect",       name: "DB Architect",        emoji: "🗄️", color: "#f59e0b", specialty: "Database design, optimization, scaling strategies" },

  // ─────────────────── CONTENT & MARKETING ───────────────────
  { id: "content_writer",          name: "Content Writer",      emoji: "✍️", color: "#ec4899", specialty: "Blog articles, whitepapers, technical documentation" },
  { id: "seo_specialist",          name: "SEO Specialist",      emoji: "🔎", color: "#10b981", specialty: "Keyword research, optimization, ranking improvements" },
  { id: "social_media_mgr",        name: "Social Media Mgr",    emoji: "📱", color: "#8b5cf6", specialty: "Campaign planning, engagement, audience growth" },
  { id: "email_marketer",          name: "Email Marketer",      emoji: "📧", color: "#f59e0b", specialty: "Campaign design, automation, conversion optimization" },
  { id: "video_producer",          name: "Video Producer",      emoji: "🎬", color: "#ef4444", specialty: "Video editing, scripting, multimedia content creation" },
  { id: "brand_strategist",        name: "Brand Strategist",    emoji: "🎯", color: "#a78bfa", specialty: "Brand positioning, messaging, visual identity" },

  // ─────────────────── HR & PEOPLE ───────────────────
  { id: "recruiter_ai",            name: "Recruiter AI",        emoji: "👔", color: "#06b6d4", specialty: "Candidate screening, job matching, interview prep" },
  { id: "hr_generalist",           name: "HR Generalist",       emoji: "💼", color: "#8b5cf6", specialty: "Policy, benefits, employee relations, compliance" },
  { id: "performance_coach",       name: "Performance Coach",   emoji: "🏅", color: "#10b981", specialty: "Goals setting, feedback, career development" },

  // ─────────────────── DATA & ANALYTICS ───────────────────
  { id: "harbor_data_miner",       name: "Data Miner",          emoji: "⛏️", color: "#64748b", agent: "harbor_data_miner", specialty: "Pattern recognition, historical data, correlations" },
  { id: "business_intelligence",   name: "BI Analyst",          emoji: "📊", color: "#06b6d4", specialty: "Dashboard creation, data modeling, insights" },
  { id: "analytics_specialist",    name: "Analytics Specialist", emoji: "📉", color: "#f59e0b", specialty: "User behavior, funnel analysis, A/B testing" },

  // ─────────────────── SUSTAINABILITY & ESG ───────────────────
  { id: "harbor_sustainability_ai", name: "Sustainability AI",   emoji: "🌍", color: "#22c55e", agent: "harbor_sustainability_ai", specialty: "Carbon footprint, ESG metrics, green optimization" },
  { id: "carbon_auditor",          name: "Carbon Auditor",      emoji: "♻️", color: "#10b981", specialty: "Emissions tracking, sustainability reporting, targets" },

  // ─────────────────── DOCUMENTATION & COMMUNICATION ───────────────────
  { id: "harbor_document_ai",      name: "Document AI",         emoji: "📄", color: "#8b5cf6", agent: "harbor_document_ai", specialty: "CMR, BOL, contracts, automated documentation" },
  { id: "technical_writer",        name: "Technical Writer",    emoji: "📖", color: "#06b6d4", specialty: "Documentation, user guides, API specifications" },
  { id: "harbor_nlp_engine",       name: "NLP Engine",          emoji: "💬", color: "#8b5cf6", agent: "harbor_nlp_engine", specialty: "Language processing, translation, report generation" },

  // ─────────────────── VISUALIZATION & DESIGN ───────────────────
  { id: "harbor_visualizer",       name: "Visualizer",          emoji: "🎨", color: "#f59e0b", agent: "harbor_visualizer", specialty: "Charts, dashboards, heatmaps, live infographics" },
  { id: "ux_designer",             name: "UX Designer",         emoji: "✨", color: "#8b5cf6", specialty: "User experience, wireframes, interaction design" },
  { id: "graphic_designer",        name: "Graphic Designer",    emoji: "🖼️", color: "#ec4899", specialty: "Visual design, branding, creative assets" },

  // ─────────────────── INTEGRATION & APIs ───────────────────
  { id: "harbor_api_integrator",   name: "API Integrator",      emoji: "🔗", color: "#06b6d4", agent: "harbor_api_integrator", specialty: "Data integration, AIS, ADS-B, external APIs" },
  { id: "webhook_specialist",      name: "Webhook Specialist",  emoji: "⚡", color: "#f59e0b", specialty: "Event-driven integration, real-time sync" },

  // ─────────────────── SIMULATION & PLANNING ───────────────────
  { id: "harbor_simulation_ai",    name: "Simulation AI",       emoji: "🌐", color: "#10b981", agent: "harbor_simulation_ai", specialty: "Scenario simulation, digital twins, what-if analysis" },
  { id: "forecasting_ai",          name: "Forecasting AI",      emoji: "🔮", color: "#a78bfa", specialty: "Trend analysis, predictive modeling, scenario planning" },
];

const QUICK_PROMPTS = [
  "Analyze the fleet's overall performance and give me a strategic report",
  "Identify all critical alerts and recommend actions",
  "What is the total CO₂ emissions for all active shipments?",
  "Give me a compliance overview across all modules",
  "Optimize all active routes and estimate savings",
  "Show me a risk assessment of the entire operation",
];

// ────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────
// Note: OrchestrationMonitor is imported from separate optimized component

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay }}
          style={{ background: "#06b6d4", boxShadow: "0 0 8px rgba(6,182,212,0.6)" }} />
      ))}
      <span className="text-xs text-slate-500 ml-2 font-mono">H.A.R.B.O.R thinking...</span>
    </div>
  );
}

function FileAttachment({ url }) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
  const isVideo = ["mp4","mov","webm","avi"].includes(ext);
  if (isImage) return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
      <img src={url} alt="attachment" className="max-w-xs max-h-64 rounded-xl object-cover border border-cyan-500/20" />
    </a>
  );
  if (isVideo) return <video src={url} controls className="mt-2 max-w-xs rounded-xl border border-cyan-500/20" style={{ maxHeight: 200 }} />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all inline-flex"
      style={{ color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
      <FileText className="w-3.5 h-3.5" />
      {url.split("/").pop().split("?")[0]}
      <Download className="w-3 h-3 ml-1" />
    </a>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) return null;

  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const generatedImages = !isUser && message.content ? [...message.content.matchAll(imageUrlRegex)].map(m => m[0]) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
          <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />
        </div>
      )}
      <div className={`max-w-[80%] relative ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && <div className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#8b5cf6" }}>H.A.R.B.O.R INTELLECT</div>}
        {isUser && message.file_urls?.length > 0 && (
          <div className="flex flex-col gap-1 items-end mb-1">
            {message.file_urls.map((url, i) => <FileAttachment key={i} url={url} />)}
          </div>
        )}
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
            isUser ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white" : "text-slate-200"
          }`} style={!isUser ? { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.15)" } : {}}>
            {isUser ? <p>{message.content}</p> : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-cyan-300 [&_code]:text-violet-300 [&_code]:bg-violet-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_h1]:text-lg [&_h1]:text-cyan-400 [&_h2]:text-base [&_h2]:text-cyan-400 [&_h3]:text-sm [&_h3]:text-cyan-400"
                components={{
                  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">{children}</a>,
                  img: ({ src, alt }) => <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={alt} className="max-w-sm rounded-xl border border-cyan-500/30 my-2" /></a>
                }}
              >{message.content}</ReactMarkdown>
            )}
            {message.tool_calls?.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-slate-700/50 pt-3">
                {message.tool_calls.map((tc, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                    <div className={`w-1.5 h-1.5 rounded-full ${tc.status === "completed" ? "bg-green-400" : tc.status === "running" ? "bg-yellow-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className="text-slate-400">{tc.name?.replace(/_/g, " ")}</span>
                    {tc.status === "running" && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin ml-auto" />}
                    {tc.status === "completed" && <CheckCheck className="w-3 h-3 text-green-400 ml-auto" />}
                  </div>
                ))}
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
          <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1"
            style={{ color: "#64748b", background: "rgba(15,23,42,0.5)" }}>
            {copied ? <><CheckCheck className="w-3 h-3 text-green-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
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

// ── OrchestrationMonitor is now imported from separate component ────────────────────

// ── Parallel Task Input ────────────────────────────────────────────────
function ParallelTaskPanel({ onExecute, onClose }) {
  const [tasks, setTasks] = useState([{ id: Date.now(), workerId: AI_WORKERS[0]?.id || '', prompt: '' }]);
  const [filesForOrch, setFilesForOrch] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const fileInputRef = useRef(null);

  const addTask = () => setTasks(prev => [...prev, { id: Date.now(), workerId: AI_WORKERS[0]?.id || '', prompt: '' }]);
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const updateTask = (id, field, value) => setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const validTaskCount = tasks.filter(t => t.prompt.trim()).length;
  
  const handleRun = async () => {
    if (!validTaskCount) return;
    setIsRunning(true);
    try {
      await onExecute(tasks.filter(t => t.prompt.trim()), filesForOrch);
      // Reset after successful execution
      setTasks([{ id: Date.now(), workerId: AI_WORKERS[0]?.id || '', prompt: '' }]);
      setFilesForOrch([]);
      onClose();
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file';
        setFilesForOrch(prev => [...prev, { url: file_url, name: file.name, type }]);
      } catch { console.error('Upload failed'); }
    }
    e.target.value = '';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,15,35,0.95)', border: '1px solid rgba(6,182,212,0.2)' }}>
      {/* Tasks Section */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-3">AI Workers ({tasks.length})</p>
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {tasks.map((task, idx) => {
            const worker = AI_WORKERS.find(w => w.id === task.workerId) || AI_WORKERS[0];
            return (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="group p-3 rounded-xl transition-all"
                style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(100,116,139,0.2)", borderLeft: `3px solid ${worker.color}` }}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${worker.color}20`, color: worker.color }}>{idx + 1}</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <select value={task.workerId} onChange={e => updateTask(task.id, "workerId", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-slate-900/80 border transition-all focus:border-cyan-400 text-white outline-none"
                      style={{ borderColor: "rgba(100,116,139,0.3)" }}>
                      {AI_WORKERS.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.name} — {w.specialty}</option>)}
                    </select>
                    <textarea value={task.prompt} onChange={e => updateTask(task.id, "prompt", e.target.value)}
                      placeholder={`Describe task ${idx + 1}...`}
                      className="w-full px-3 py-2.5 rounded-lg text-xs bg-slate-900/80 border text-white placeholder-slate-500 outline-none resize-none focus:border-cyan-400 transition-all"
                      style={{ borderColor: "rgba(100,116,139,0.3)", minHeight: 60 }} />
                  </div>
                  {tasks.length > 1 && (
                    <motion.button onClick={() => removeTask(task.id)} whileHover={{ scale: 1.1 }}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400"
                      style={{ color: "#64748b" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {filesForOrch.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-5 py-3 border-t" style={{ borderColor: "rgba(6,182,212,0.1)", background: "rgba(139,92,246,0.02)" }}>
          <p className="text-[9px] font-mono tracking-widest uppercase mb-2.5" style={{ color: "#a78bfa" }}>📎 Attached Files ({filesForOrch.length})</p>
          <div className="flex flex-wrap gap-2">
            {filesForOrch.map((f, i) => (
              <motion.div key={i} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-mono group transition-all"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                <span>{f.type === 'image' ? '🖼️' : f.type === 'video' ? '🎬' : '📄'}</span>
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => setFilesForOrch(prev => prev.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <X className="w-2.5 h-2.5 hover:text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.csv,.xlsx,.xls,.docx,.txt,.json" className="hidden" onChange={handleFileUpload} />
      <div className="px-5 py-4 flex gap-2 border-t" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
        <motion.button onClick={() => fileInputRef.current?.click()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all"
          style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
          <Paperclip className="w-3.5 h-3.5" /> Attach
        </motion.button>
        <motion.button onClick={addTask} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all"
          style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
          <Plus className="w-3.5 h-3.5" /> Add Task
        </motion.button>
        <motion.button onClick={handleRun} disabled={isRunning || validTaskCount === 0}
          whileHover={validTaskCount > 0 && !isRunning ? { scale: 1.05 } : {}}
          whileTap={validTaskCount > 0 && !isRunning ? { scale: 0.95 } : {}}
          className="flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: validTaskCount > 0 && !isRunning ? "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.2))" : "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)", boxShadow: validTaskCount > 0 && !isRunning ? "0 0 20px rgba(6,182,212,0.2)" : "none" }}>
          {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Orchestrating</> : <><Play className="w-4 h-4" /> Launch {validTaskCount} {validTaskCount === 1 ? "Task" : "Tasks"}</>}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Sidebar Conversation List ─────────────────────────────────────────────
function ConversationList({ conversations, activeId, onSelect, onCreate, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditValue(conv.metadata?.name || "Chat");
  };

  const commitEdit = (convId) => {
    if (editValue.trim()) onRename(convId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b" style={{ borderColor: "rgba(6,182,212,0.15)" }}>
        <button onClick={onCreate} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all"
          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}>
          <Plus className="w-4 h-4" /> New conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && <div className="text-center py-8 text-slate-500 text-xs font-mono">No conversations yet</div>}
        {conversations.map(conv => (
          <div key={conv.id} onClick={() => editingId !== conv.id && onSelect(conv)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${activeId === conv.id ? "text-white" : "text-slate-400 hover:text-white"}`}
            style={activeId === conv.id ? { background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" } : { border: "1px solid transparent" }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-cyan-500" />
              {editingId === conv.id ? (
                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(conv.id)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(conv.id); if (e.key === "Escape") setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent border-b border-cyan-500/50 text-white text-[11px] font-mono outline-none py-0.5 min-w-0" />
              ) : (
                <span className="truncate font-mono text-[11px]">{conv.metadata?.name || "Chat"}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={(e) => startEdit(e, conv)} className="p-1 rounded hover:bg-cyan-500/20 hover:text-cyan-400"><Pencil className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }} className="p-1 rounded hover:bg-red-500/20 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function HarborSuperAgentChat({ onClose }) {
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

  // Orchestration state
  const [showOrchestrationPanel, setShowOrchestrationPanel] = useState(false);
  const [showWorkerPool, setShowWorkerPool] = useState(false);
  const [orchestrations, setOrchestrations] = useState([]); // [{id, workers, tasks, outputs, status}]
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [workerHolograms, setWorkerHolograms] = useState([]); // [{workerId, task, isActive}]

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const members = await base44.entities.OrganizationMember.filter({ user_email: user.email });
        if (members?.length > 0) setOrgId(members[0].organization_id);
      } catch {}
      await loadConversations();
    };
    init();
    return () => { unsubscribeRef.current?.(); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, orchestrations]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      const currentDeletedIds = getDeletedIds();
      const active = (convs || []).filter(c => !currentDeletedIds.has(c.id));
      setConversations(active);
      if (active.length > 0) await selectConversation(active[0]);
      else await createNewConversation();
    } catch { toast.error("Could not load conversations"); }
    setIsLoading(false);
  };

  const subscribeToConversation = (convId) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") setIsSending(false);
    });
  };

  const selectConversation = async (conv) => {
    unsubscribeRef.current?.();
    setActiveConversation(conv);
    const full = await base44.agents.getConversation(conv.id);
    setMessages(full.messages || []);
    subscribeToConversation(conv.id);
  };

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Chat ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
    subscribeToConversation(conv.id);
    if (orgId) {
      await base44.agents.addMessage(conv, {
        role: "system",
        content: `SYSTEM CONTEXT: organization_id="${orgId}". Always filter entities by this ID.`
      });
    }
  };

  const renameConversation = (convId, newName) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, metadata: { ...c.metadata, name: newName } } : c));
    if (activeConversation?.id === convId) setActiveConversation(prev => ({ ...prev, metadata: { ...prev.metadata, name: newName } }));
  };

  const deleteConversation = (convId) => {
    const updated = getDeletedIds();
    updated.add(convId);
    localStorage.setItem("harbor_deleted_convs", JSON.stringify([...updated]));
    setDeletedIds(updated);
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== convId);
      if (activeConversation?.id === convId) {
        if (remaining.length > 0) selectConversation(remaining[0]);
        else createNewConversation();
      }
      return remaining;
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "file";
        setAttachments(prev => [...prev, { url: file_url, name: file.name, type }]);
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const generateImage = async () => {
    if (!imageGenPrompt.trim() || !activeConversation) return;
    setIsGeneratingImage(true);
    const prompt = imageGenPrompt.trim();
    setImageGenPrompt("");
    setShowImageGen(false);
    await base44.agents.addMessage(activeConversation, { role: "user", content: `Generate a high-quality image: ${prompt}` });
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      await base44.agents.addMessage(activeConversation, {
        role: "assistant",
        content: `Here is your generated image:\n\n![${prompt}](${url})`,
        file_urls: [url]
      });
    } catch { toast.error("Image generation failed"); }
    setIsGeneratingImage(false);
  };

  // ── PARALLEL ORCHESTRATION ──────────────────────────────────────────────
  const executeParallelOrchestration = useCallback(async (parallelTasks, filesForOrch = []) => {
    const orchId = `orch_${Date.now()}`;

    // Create orchestration metadata to track worker conversations separately
    const orchMetadata = {
      orchestrationId: orchId,
      isOrchestration: true,
      timestamp: Date.now()
    };

    // Build worker list
    const workers = parallelTasks.map(task => {
      const workerDef = AI_WORKERS.find(w => w.id === task.workerId) || AI_WORKERS[0];
      return {
        id: `${orchId}_${task.id}`,
        workerId: task.workerId,
        name: workerDef.name,
        emoji: workerDef.emoji,
        color: workerDef.color,
        status: "queued"
      };
    });

    const newOrch = {
      id: orchId,
      conversationId: activeConversation.id,
      workers,
      tasks: parallelTasks,
      outputs: {},
      status: "running",
      startedAt: Date.now()
    };

    setOrchestrations(prev => [newOrch, ...prev]);

    // DO NOT send orchestration messages to main chat - keep them separate

    // Execute ALL tasks in true parallel with org context
    const executions = parallelTasks.map(async (task) => {
      // Ensure org context is included
      const taskWithContext = orgId ? `[ORG: ${orgId}] ${task.prompt}` : task.prompt;
      const workerId = `${orchId}_${task.id}`;

      // Mark as running
      setOrchestrations(prev => prev.map(o =>
        o.id === orchId ? {
          ...o,
          workers: o.workers.map(w => w.id === workerId ? { ...w, status: "running" } : w)
        } : o
      ));

      try {
        const result = await base44.functions.invoke("orchestrateMultipleAIs", {
          task: taskWithContext,
          workerType: task.workerId,
          orchestrationId: orchId,
          taskId: task.id,
          fileUrls: filesForOrch.map(f => f.url),
          metadata: { ...orchMetadata, organization_id: orgId }
        });

        const output = result.data?.output || result.data || "Analysis complete";

        setOrchestrations(prev => prev.map(o =>
          o.id === orchId ? {
            ...o,
            workers: o.workers.map(w => w.id === workerId ? { ...w, status: "done" } : w),
            outputs: { ...o.outputs, [workerId]: output }
          } : o
        ));

        return { workerId: task.workerId, output };
      } catch (err) {
        setOrchestrations(prev => prev.map(o =>
          o.id === orchId ? {
            ...o,
            workers: o.workers.map(w => w.id === workerId ? { ...w, status: "error" } : w),
            outputs: { ...o.outputs, [workerId]: `Error: ${err.message}` }
          } : o
        ));
        return { workerId: task.workerId, error: err.message };
      }
    });

    const results = await Promise.all(executions);

    // Mark orchestration done
    setOrchestrations(prev => prev.map(o =>
      o.id === orchId ? { ...o, status: "done" } : o
    ));

    toast.success(`⚡ ${parallelTasks.length} AI workers completed`);
  }, [activeConversation]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if ((!msg && attachments.length === 0) || isSending || !activeConversation) return;
    const fileUrls = attachments.map(a => a.url);
    setIsSending(true);

    try {
      await base44.agents.addMessage(activeConversation, {
        role: "user",
        content: msg || "(attached files)",
        ...(fileUrls.length > 0 && { file_urls: fileUrls })
      });
      // ONLY clear after successful send
      setInput("");
      setAttachments([]);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = '24px';
      }
      
      if (orgId) {
        base44.entities.FleetAIUsage.create({
          organization_id: orgId,
          user_email: (await base44.auth.me()).email,
          command: msg || "(attached files)",
          action: "HARBOR_SUPER_AGENT_CHAT",
          success: true,
        }).catch(() => {});
      }
    } catch (err) {
      toast.error(`Failed to send: ${err?.message || 'Unknown error'}`);
      setMessages(prev => [...prev, { role: "system", content: `❌ Error: ${err?.message || 'Request failed'}` }]);
      // Keep input & attachments on error so user can retry
    } finally {
      setIsSending(false);
    }
    inputRef.current?.focus();
  }, [input, attachments, activeConversation, isSending, messages, orgId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const visibleMessages = messages.filter(m => m.role !== "system");
  const isThinking = messages.length > 0 && messages[messages.length - 1]?.role === "user" && isSending;

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        top: isMaximized ? 12 : "3%", left: isMaximized ? 12 : "3%",
        right: isMaximized ? 12 : "3%", bottom: isMaximized ? 12 : "3%",
        background: "rgba(2,8,18,0.97)",
        border: "1px solid rgba(6,182,212,0.3)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 80px rgba(6,182,212,0.1), 0 0 160px rgba(139,92,246,0.05)"
      }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
        <div className="absolute top-0 left-1/4 w-96 h-32 opacity-15 blur-3xl" style={{ background: "linear-gradient(180deg, #06b6d4, transparent)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-32 opacity-10 blur-3xl" style={{ background: "linear-gradient(0deg, #8b5cf6, transparent)" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.02)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.4)" }}>
              <Brain className="w-5 h-5" style={{ color: "#06b6d4" }} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>H.A.R.B.O.R INTELLECT</h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                style={{ color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
                {AI_WORKERS.length}+ AI WORKERS
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-widest" style={{ color: "rgba(6,182,212,0.4)" }}>
              Multi-Agent AI Orchestrator • Parallel execution • Live hologram control
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Orchestrate button */}
          <motion.button
            onClick={() => setShowOrchestrationPanel(p => !p)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all"
            style={{
              background: showOrchestrationPanel ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.06)",
              color: "#06b6d4",
              border: `1px solid rgba(6,182,212,${showOrchestrationPanel ? "0.5" : "0.2"})`
            }}>
            <Network className="w-3.5 h-3.5" />
            ORCHESTRATE
          </motion.button>
          {/* Worker Pool button */}
          <motion.button
            onClick={() => setShowWorkerPool(p => !p)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all"
            style={{
              background: showWorkerPool ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.06)",
              color: "#a78bfa",
              border: `1px solid rgba(139,92,246,${showWorkerPool ? "0.5" : "0.2"})`
            }}>
            <Grid3x3 className="w-3.5 h-3.5" />
            {AI_WORKERS.length} WORKERS
          </motion.button>
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider flex items-center gap-1.5"
            style={{ color: "#64748b", border: "1px solid rgba(100,116,139,0.2)", background: "rgba(15,23,42,0.5)" }}>
            <MessageSquare className="w-3 h-3" />
            {showSidebar ? "Hide" : "Chats"}
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 rounded-lg hover:bg-slate-800/60" style={{ color: "#64748b" }}>
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400" style={{ color: "#64748b" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── WORKER POOL DRAWER ── */}
      <AnimatePresence>
        {showWorkerPool && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b border-slate-700/50"
            style={{ background: "rgba(6,182,212,0.02)" }}>
            <div className="p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>{AI_WORKERS.length}+ Specialized AI Workers</p>
              <div className="grid grid-cols-4 gap-2">
                {AI_WORKERS.map(w => (
                  <div key={w.id} className="p-2 rounded-lg" style={{ background: `rgba(${parseInt(w.color.slice(1,3),16)},${parseInt(w.color.slice(3,5),16)},${parseInt(w.color.slice(5,7),16)},0.08)`, border: `1px solid ${w.color}22` }}>
                    <p className="text-xs font-bold" style={{ color: w.color }}>{w.emoji} {w.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{w.specialty}</p>
                  </div>
                ))}
              </div>
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
              style={{ borderRight: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.02)" }}>
              <div style={{ width: 220 }}>
                <ConversationList conversations={conversations} activeId={activeConversation?.id}
                  onSelect={selectConversation} onCreate={createNewConversation}
                  onDelete={deleteConversation} onRename={renameConversation} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(6,182,212,0.3)" }}>
                    <Brain className="w-8 h-8 animate-pulse" style={{ color: "#06b6d4" }} />
                  </div>
                  <motion.div className="absolute inset-0 rounded-2xl border" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }} style={{ borderColor: "#06b6d4" }} />
                </div>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.6)" }}>Initializing H.A.R.B.O.R...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages + Orchestration feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {visibleMessages.length === 0 && orchestrations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border flex items-center justify-center"
                      style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)" }}>
                      <Sparkles className="w-8 h-8" style={{ color: "#06b6d4" }} />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Ready for command</h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        H.A.R.B.O.R Intellect has {AI_WORKERS.length}+ specialized AI workers standing by. Use ORCHESTRATE to run multiple AI tasks in parallel, or chat directly.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                      {QUICK_PROMPTS.slice(0, 4).map((prompt, i) => (
                        <button key={i} onClick={() => sendMessage(prompt)}
                          className="px-3 py-2.5 rounded-xl text-left text-[11px] leading-snug transition-all hover:text-white"
                          style={{ color: "#64748b", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; e.currentTarget.style.background = "rgba(6,182,212,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; e.currentTarget.style.background = "rgba(6,182,212,0.04)"; }}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interleave messages and orchestration monitors */}
                {visibleMessages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

                {/* Live orchestrations - only in current conversation */}
                {orchestrations.filter(o => o.conversationId === activeConversation?.id).map(orch => (
                  <div key={orch.id}>
                    <OrchestrationMonitor
                      orchestration={orch}
                      onViewOutput={(worker, output) => setSelectedOutput({ worker, output })}
                      onOpenHologram={(worker, task) => setWorkerHolograms(prev => [...prev, { workerId: worker.id, task, isActive: true }])}
                    />
                  </div>
                ))}

                {/* Worker Hologram Controls */}
                {workerHolograms.map((holo, i) => (
                  <WorkerHologramControl
                    key={holo.workerId}
                    worker={AI_WORKERS.find(w => w.id === holo.workerId)}
                    task={holo.task}
                    isActive={holo.isActive}
                    onComplete={(result) => {
                      if (result.cancelled) {
                        setWorkerHolograms(prev => prev.filter(h => h.workerId !== result.worker.id));
                      } else {
                        setWorkerHolograms(prev => prev.map(h => h.workerId === result.worker.id ? { ...h, isActive: false } : h));
                      }
                    }}
                  />
                ))}

                {isThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
                      <Brain className="w-4 h-4" style={{ color: "#06b6d4" }} />
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.15)" }}>
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── ORCHESTRATION PANEL ── */}
              <AnimatePresence>
                {showOrchestrationPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex-shrink-0 px-4 pb-3"
                    style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}>
                    <div className="pt-3">
                      <ParallelTaskPanel
                        onExecute={executeParallelOrchestration}
                        onClose={() => setShowOrchestrationPanel(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick prompts */}
              {visibleMessages.length > 0 && (
                <div className="px-5 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
                  {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all whitespace-nowrap"
                      style={{ color: "#64748b", border: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; }}>
                      {p.length > 40 ? p.slice(0, 40) + "..." : p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 p-4" style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}>
                {showImageGen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-3 rounded-2xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)" }}>
                    <Wand2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8b5cf6" }} />
                    <input autoFocus value={imageGenPrompt} onChange={e => setImageGenPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") generateImage(); if (e.key === "Escape") setShowImageGen(false); }}
                      placeholder="Describe the image... (Enter)"
                      className="flex-1 bg-transparent text-sm text-white placeholder-violet-400/40 outline-none font-light" />
                    {isGeneratingImage
                      ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b5cf6" }} />
                      : <button onClick={generateImage} className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.15)" }}>Generate</button>}
                    <button onClick={() => setShowImageGen(false)}><XCircle className="w-4 h-4 text-slate-500 hover:text-red-400" /></button>
                  </motion.div>
                )}

                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((a, i) => (
                      <div key={i} className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono"
                        style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
                        {a.type === "image" ? <Image className="w-3 h-3" /> : a.type === "video" ? <Film className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        <span className="max-w-[120px] truncate">{a.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-1 opacity-0 group-hover:opacity-100">
                          <XCircle className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.csv,.xlsx,.xls,.docx,.txt,.json" className="hidden" onChange={handleFileUpload} />

                <div className="relative flex items-end gap-2 rounded-2xl p-3"
                  style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-slate-700/60 disabled:opacity-40"
                      style={{ color: isUploading ? "#06b6d4" : "#475569" }}>
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setShowImageGen(!showImageGen)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-violet-500/20"
                      style={{ color: showImageGen ? "#8b5cf6" : "#475569" }}>
                      <ImagePlus className="w-3.5 h-3.5" />
                    </button>
                    {/* Inline orchestrate button */}
                    <motion.button
                      onClick={() => setShowOrchestrationPanel(p => !p)}
                      whileHover={{ scale: 1.1 }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: showOrchestrationPanel ? "#06b6d4" : "#475569", background: showOrchestrationPanel ? "rgba(6,182,212,0.15)" : "transparent" }}
                      title="Launch parallel AI orchestration">
                      <Zap className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Command H.A.R.B.O.R... or click ⚡ to launch parallel AI workers"
                    disabled={isSending} rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed font-light"
                    style={{ minHeight: 24, maxHeight: 120, overflowY: "auto" }}
                    onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />

                  <button onClick={() => sendMessage()}
                    disabled={(!input.trim() && attachments.length === 0) || isSending}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: (input.trim() || attachments.length > 0) && !isSending ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(6,182,212,0.1)",
                      boxShadow: (input.trim() || attachments.length > 0) && !isSending ? "0 0 20px rgba(6,182,212,0.3)" : "none"
                    }}>
                    {isSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
                <p className="text-[9px] font-mono text-slate-600 text-center mt-2 tracking-wider">
                  {AI_WORKERS.length}+ AI Workers • Parallel execution • Real-time orchestration • Hologram control
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── OUTPUT VIEWER MODAL ── */}
      <AnimatePresence>
        {selectedOutput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md rounded-[20px]"
            onClick={() => setSelectedOutput(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-4/5 max-w-3xl max-h-[82vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "rgba(5,8,22,0.99)", border: `1px solid ${selectedOutput.worker.color}40`, boxShadow: `0 0 60px ${selectedOutput.worker.color}15` }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b" style={{ borderColor: selectedOutput.worker.color + '20', background: selectedOutput.worker.color + '08' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: selectedOutput.worker.color + '15', border: `1px solid ${selectedOutput.worker.color}30` }}>
                    {selectedOutput.worker.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-black font-mono tracking-wider" style={{ color: selectedOutput.worker.color }}>{selectedOutput.worker.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Analysis Output</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOutput(null)} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: '#64748b' }}><X className="w-4 h-4" /></button>
              </div>
              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ReactMarkdown
                  className="prose prose-sm prose-invert max-w-none"
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-black mt-0 mb-4 pb-3 border-b" style={{ color: selectedOutput.worker.color, borderColor: selectedOutput.worker.color + '30' }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mt-6 mb-3" style={{ color: selectedOutput.worker.color + 'cc' }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-2 text-slate-200">{children}</h3>,
                    p: ({ children }) => <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>,
                    li: ({ children }) => <li className="text-sm text-slate-300 leading-relaxed mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 pl-4 my-3 italic text-slate-400" style={{ borderColor: selectedOutput.worker.color + '60' }}>{children}</blockquote>,
                    hr: () => <hr className="my-5" style={{ borderColor: 'rgba(100,116,139,0.2)' }} />,
                    code: ({ inline, children }) => inline
                      ? <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: selectedOutput.worker.color + '15', color: selectedOutput.worker.color }}>{children}</code>
                      : <pre className="rounded-xl p-4 my-3 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(100,116,139,0.15)' }}><code className="text-xs text-slate-300">{children}</code></pre>,
                    table: ({ children }) => <table className="w-full my-4 text-sm border-collapse">{children}</table>,
                    th: ({ children }) => <th className="text-left text-xs font-mono uppercase tracking-wider py-2 px-3" style={{ color: selectedOutput.worker.color, borderBottom: `1px solid ${selectedOutput.worker.color}30` }}>{children}</th>,
                    td: ({ children }) => <td className="py-2 px-3 text-slate-300 border-b" style={{ borderColor: 'rgba(100,116,139,0.1)' }}>{children}</td>,
                    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: selectedOutput.worker.color }}>{children}</a>,
                  }}
                >
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