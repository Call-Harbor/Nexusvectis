import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Play, Pause, RotateCcw, Plus, Settings, Eye, GitBranch,
  Shield, DollarSign, Users, Activity, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronRight, BarChart3, Layers, Network, Cpu, Lock,
  TrendingUp, Filter, RefreshCw, Terminal, Target, Star, FlaskConical,
  Workflow, ArrowRightLeft, Bot, Database, Globe, Gauge, History, Trash2
} from "lucide-react";

const ORCHESTRATION_MODES = [
  { key: "auto", label: "Auto-Select", icon: Brain, color: "#8b5cf6", desc: "Platform picks best pattern dynamically" },
  { key: "sequential", label: "Sequential", icon: ChevronRight, color: "#06b6d4", desc: "Agents run one after another" },
  { key: "concurrent", label: "Concurrent", icon: Zap, color: "#10b981", desc: "Fan-out parallel execution" },
  { key: "hierarchical", label: "Hierarchical", icon: Layers, color: "#f59e0b", desc: "Orchestrator delegates to sub-agents" },
  { key: "peer_to_peer", label: "Peer-to-Peer", icon: Network, color: "#ef4444", desc: "Agents collaborate as equals" },
  { key: "hybrid", label: "Hybrid", icon: GitBranch, color: "#ec4899", desc: "Dynamic mix of patterns" },
];

const AGENT_POOL = [
  { id: "fleet_analyst", name: "Fleet Analyst", specialty: "Vehicle & route analysis", color: "#06b6d4", load: 23 },
  { id: "risk_engine", name: "Risk Engine", specialty: "Risk assessment & mitigation", color: "#ef4444", load: 67 },
  { id: "route_optimizer", name: "Route Optimizer", specialty: "AI route planning & optimization", color: "#10b981", load: 45 },
  { id: "demand_forecaster", name: "Demand Forecaster", specialty: "Capacity & demand prediction", color: "#f59e0b", load: 12 },
  { id: "maintenance_bot", name: "Maintenance Bot", specialty: "Predictive maintenance AI", color: "#8b5cf6", load: 89 },
  { id: "financial_ai", name: "Financial AI", specialty: "Cost, billing & financial analysis", color: "#ec4899", load: 34 },
  { id: "compliance_guard", name: "Compliance Guard", specialty: "Regulatory & compliance checks", color: "#64748b", load: 56 },
  { id: "ops_commander", name: "Ops Commander", specialty: "Operations coordination", color: "#0ea5e9", load: 78 },
];

const STATUS_CONFIG = {
  queued: { color: "#64748b", icon: Clock, label: "Queued" },
  running: { color: "#06b6d4", icon: Activity, label: "Running" },
  awaiting_approval: { color: "#f59e0b", icon: AlertTriangle, label: "Awaiting Approval" },
  completed: { color: "#10b981", icon: CheckCircle2, label: "Completed" },
  failed: { color: "#ef4444", icon: XCircle, label: "Failed" },
  cancelled: { color: "#94a3b8", icon: XCircle, label: "Cancelled" },
};

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function AgentLoadBar({ agent }) {
  const color = agent.load > 80 ? "#ef4444" : agent.load > 60 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agent.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-300 truncate">{agent.name}</span>
          <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color }}>{agent.load}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800">
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }} animate={{ width: `${agent.load}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ background: color }} />
        </div>
      </div>
    </div>
  );
}

function ExecutionCard({ exec, onApprove, onCancel }) {
  const cfg = STATUS_CONFIG[exec.status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 group"
      style={{ background: "rgba(15,23,42,0.8)", border: `1px solid rgba(255,255,255,0.06)` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
            <span className="text-xs font-medium truncate" style={{ color: cfg.color }}>{cfg.label}</span>
            {exec.orchestration_mode && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                {exec.orchestration_mode}
              </span>
            )}
          </div>
          <p className="text-sm text-white font-medium truncate">{exec.task || exec.workflow_name}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {exec.status === "awaiting_approval" && (
            <button onClick={() => onApprove(exec)} className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>Approve</button>
          )}
          {(exec.status === "running" || exec.status === "queued") && (
            <button onClick={() => onCancel(exec)} className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>Cancel</button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
        {exec.agents_involved?.length > 0 && (
          <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{exec.agents_involved.length} agents</span>
        )}
        {exec.tokens_used > 0 && (
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{exec.tokens_used.toLocaleString()} tokens</span>
        )}
        {exec.latency_ms && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exec.latency_ms}ms</span>
        )}
        {exec.cost_estimate > 0 && (
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />€{exec.cost_estimate.toFixed(3)}</span>
        )}
      </div>
      {exec.status === "running" && (
        <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-slate-800">
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
        </div>
      )}
    </motion.div>
  );
}

function WorkflowLauncher({ onLaunch }) {
  const [task, setTask] = useState("");
  const [mode, setMode] = useState("auto");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [budget, setBudget] = useState(1000);
  const [requireApproval, setRequireApproval] = useState(false);
  const [running, setRunning] = useState(false);

  const toggleAgent = (id) => setSelectedAgents(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);

  const handleLaunch = async () => {
    if (!task.trim()) return;
    setRunning(true);
    await onLaunch({ task, mode, selectedAgents, budget, requireApproval });
    setTask("");
    setRunning(false);
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(139,92,246,0.3)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4" style={{ color: "#8b5cf6" }} />
        <h3 className="text-sm font-bold text-white">Launch Workflow</h3>
      </div>

      {/* Task input */}
      <textarea value={task} onChange={e => setTask(e.target.value)}
        placeholder="Describe the task for your agent swarm..."
        className="w-full rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none resize-none mb-4"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
        rows={3} />

      {/* Orchestration mode */}
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Orchestration Mode</p>
        <div className="grid grid-cols-3 gap-1.5">
          {ORCHESTRATION_MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className="px-2 py-2 rounded-lg text-[10px] font-medium transition-all text-left"
              style={{
                background: mode === m.key ? `rgba(${m.color === "#8b5cf6" ? "139,92,246" : m.color === "#06b6d4" ? "6,182,212" : m.color === "#10b981" ? "16,185,129" : m.color === "#f59e0b" ? "245,158,11" : m.color === "#ef4444" ? "239,68,68" : "236,72,153"},0.2)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${mode === m.key ? m.color : "rgba(255,255,255,0.06)"}`,
                color: mode === m.key ? m.color : "#64748b"
              }}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-1.5">{ORCHESTRATION_MODES.find(m2 => m2.key === mode)?.desc}</p>
      </div>

      {/* Agent selection */}
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Agent Pool <span className="text-slate-600">(leave empty = auto-route)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {AGENT_POOL.map(a => (
            <button key={a.id} onClick={() => toggleAgent(a.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
              style={{
                background: selectedAgents.includes(a.id) ? `${a.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedAgents.includes(a.id) ? a.color : "rgba(255,255,255,0.08)"}`,
                color: selectedAgents.includes(a.id) ? a.color : "#64748b"
              }}>
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Budget (tokens)</p>
          <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
            className="w-full rounded-lg px-3 py-1.5 text-sm text-white outline-none"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setRequireApproval(p => !p)}
            className="w-8 h-4 rounded-full relative transition-all flex-shrink-0"
            style={{ background: requireApproval ? "#8b5cf6" : "rgba(255,255,255,0.1)" }}>
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
              style={{ left: requireApproval ? "calc(100% - 14px)" : "2px" }} />
          </button>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">Human gate</span>
        </div>
      </div>

      <motion.button onClick={handleLaunch} disabled={!task.trim() || running}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: running ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
        {running ? "Launching..." : "🚀 Launch Workflow"}
      </motion.button>
    </div>
  );
}

export default function AgentOrchestrator() {
  const [tab, setTab] = useState("live");
  const [executions, setExecutions] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentLoads, setAgentLoads] = useState(AGENT_POOL);
  const [stats, setStats] = useState({ running: 0, completed: 0, failed: 0, pending: 0, totalTokens: 0, totalCost: 0 });
  const pollRef = useRef(null);

  const loadData = async () => {
    const [execs, wflows] = await Promise.all([
      base44.entities.AgentExecution.list("-created_date", 50),
      base44.entities.AgentWorkflow.list("-updated_date", 20),
    ]);
    setExecutions(execs || []);
    setWorkflows(wflows || []);
    const s = {
      running: execs.filter(e => e.status === "running").length,
      completed: execs.filter(e => e.status === "completed").length,
      failed: execs.filter(e => e.status === "failed").length,
      pending: execs.filter(e => e.status === "queued" || e.status === "awaiting_approval").length,
      totalTokens: execs.reduce((a, e) => a + (e.tokens_used || 0), 0),
      totalCost: execs.reduce((a, e) => a + (e.cost_estimate || 0), 0),
    };
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Simulate agent load fluctuation
  useEffect(() => {
    const t = setInterval(() => {
      setAgentLoads(prev => prev.map(a => ({
        ...a,
        load: Math.max(5, Math.min(95, a.load + (Math.random() - 0.5) * 10))
      })));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const handleLaunch = async ({ task, mode, selectedAgents, budget, requireApproval }) => {
    const agents = selectedAgents.length > 0 ? selectedAgents : selectBestAgents(task, mode);
    const exec = await base44.entities.AgentExecution.create({
      organization_id: "default",
      task,
      orchestration_mode: mode,
      agents_involved: agents,
      status: requireApproval ? "awaiting_approval" : "running",
      started_at: new Date().toISOString(),
      tokens_used: 0,
      cost_estimate: 0,
      routing_decision: `Auto-routed to [${agents.join(", ")}] via ${mode} pattern`,
    });

    if (!requireApproval) {
      // Simulate execution
      setTimeout(async () => {
        await base44.entities.AgentExecution.update(exec.id, {
          status: "completed",
          tokens_used: Math.floor(Math.random() * 3000 + 500),
          cost_estimate: Math.random() * 0.05 + 0.01,
          latency_ms: Math.floor(Math.random() * 4000 + 800),
          completed_at: new Date().toISOString(),
          result: `Workflow completed successfully via ${mode} orchestration with ${agents.length} agent(s).`,
        });
        loadData();
      }, 3000 + Math.random() * 4000);
    }
    loadData();
  };

  const selectBestAgents = (task, mode) => {
    const lower = task.toLowerCase();
    const selected = [];
    if (/route|fleet|vehicle|truck/i.test(lower)) selected.push("fleet_analyst", "route_optimizer");
    if (/risk|danger|alert|critical/i.test(lower)) selected.push("risk_engine");
    if (/maintenance|service|repair/i.test(lower)) selected.push("maintenance_bot");
    if (/cost|budget|invoice|financial/i.test(lower)) selected.push("financial_ai");
    if (/demand|forecast|capacity/i.test(lower)) selected.push("demand_forecaster");
    if (selected.length === 0) selected.push("ops_commander");
    return mode === "concurrent" && selected.length < 2
      ? [...selected, "fleet_analyst"]
      : selected;
  };

  const handleApprove = async (exec) => {
    await base44.entities.AgentExecution.update(exec.id, {
      status: "running",
      human_approved_by: "current_user",
      human_approved_at: new Date().toISOString(),
    });
    setTimeout(async () => {
      await base44.entities.AgentExecution.update(exec.id, {
        status: "completed",
        tokens_used: Math.floor(Math.random() * 2000 + 300),
        cost_estimate: Math.random() * 0.04,
        latency_ms: Math.floor(Math.random() * 3000 + 600),
        completed_at: new Date().toISOString(),
      });
      loadData();
    }, 2500);
    loadData();
  };

  const handleCancel = async (exec) => {
    await base44.entities.AgentExecution.update(exec.id, { status: "cancelled" });
    loadData();
  };

  const TABS = [
    { key: "live", label: "Live Ops", icon: Activity },
    { key: "workflows", label: "Workflows", icon: Workflow },
    { key: "observability", label: "Observability", icon: Eye },
    { key: "governance", label: "Governance", icon: Shield },
    { key: "evals", label: "Evals & Tests", icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020608", color: "white" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.04)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3))", border: "1px solid rgba(139,92,246,0.4)" }}>
            <Brain className="w-5 h-5" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wide text-white">AGENT ORCHESTRATOR</h1>
            <p className="text-[10px] font-mono text-slate-500">Multi-agent platform · fan-out/fan-in · smart routing · governance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">{stats.running} RUNNING</span>
          </div>
          <button onClick={loadData} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-6 gap-3 px-6 py-4">
        <MetricCard icon={Activity} label="Running" value={stats.running} color="#06b6d4" />
        <MetricCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#10b981" />
        <MetricCard icon={AlertTriangle} label="Pending Approval" value={stats.pending} color="#f59e0b" />
        <MetricCard icon={XCircle} label="Failed" value={stats.failed} color="#ef4444" />
        <MetricCard icon={Cpu} label="Total Tokens" value={stats.totalTokens.toLocaleString()} color="#8b5cf6" />
        <MetricCard icon={DollarSign} label="Est. Cost" value={`€${stats.totalCost.toFixed(3)}`} color="#ec4899" />
      </div>

      {/* Tabs */}
      <div className="px-6 flex items-center gap-1 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all"
            style={{
              color: tab === t.key ? "#8b5cf6" : "#64748b",
              borderBottom: `2px solid ${tab === t.key ? "#8b5cf6" : "transparent"}`
            }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {tab === "live" && (
          <div className="grid grid-cols-3 gap-4">
            {/* Launcher */}
            <div>
              <WorkflowLauncher onLaunch={handleLaunch} />
              {/* Agent Load */}
              <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-white">Agent Pool Load</p>
                  <Gauge className="w-4 h-4 text-slate-500" />
                </div>
                {agentLoads.map(a => <AgentLoadBar key={a.id} agent={a} />)}
              </div>
            </div>

            {/* Executions */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white">Live Executions</p>
                <span className="text-[10px] text-slate-500">{executions.length} total</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No executions yet — launch a workflow</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {executions.map(e => (
                    <ExecutionCard key={e.id} exec={e} onApprove={handleApprove} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "workflows" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-white">Saved Workflows ({workflows.length})</p>
              <button onClick={async () => {
                await base44.entities.AgentWorkflow.create({
                  organization_id: "default",
                  name: `Workflow ${workflows.length + 1}`,
                  orchestration_mode: "auto",
                  status: "draft",
                  budget_limit: 5000,
                  run_count: 0,
                });
                loadData();
              }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: "rgba(139,92,246,0.2)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Plus className="w-3.5 h-3.5" /> New Workflow
              </button>
            </div>
            {workflows.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workflows saved yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {workflows.map(w => (
                  <div key={w.id} className="rounded-xl p-4"
                    style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{w.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{w.description || "No description"}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                        background: w.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                        color: w.status === "active" ? "#10b981" : "#64748b"
                      }}>{w.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-3">
                      <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{w.orchestration_mode}</span>
                      <span className="flex items-center gap-1"><Play className="w-3 h-3" />{w.run_count || 0} runs</span>
                      {w.eval_score && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{w.eval_score}%</span>}
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{(w.budget_limit || 0).toLocaleString()} budget</span>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <button onClick={() => handleLaunch({ task: w.name, mode: w.orchestration_mode || "auto", selectedAgents: [], budget: w.budget_limit || 1000, requireApproval: w.require_human_approval })}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                        <Play className="w-3 h-3" /> Run
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                        <History className="w-3 h-3" /> v{w.version || 1}
                      </button>
                      <button onClick={async () => { await base44.entities.AgentWorkflow.delete(w.id); loadData(); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all ml-auto"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "observability" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Execution trace */}
              <div className="col-span-2 rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-white">Execution Trace Log</p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[10px]">
                  {executions.slice(0, 20).map((e, i) => (
                    <div key={e.id} className="flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-900 transition-colors">
                      <span className="text-slate-600 flex-shrink-0">{new Date(e.created_date).toLocaleTimeString()}</span>
                      <span className="w-20 flex-shrink-0" style={{ color: STATUS_CONFIG[e.status]?.color || "#64748b" }}>{e.status}</span>
                      <span className="text-slate-400 truncate flex-1">{e.task || e.workflow_name}</span>
                      <span className="text-slate-600 flex-shrink-0">{e.orchestration_mode || "—"}</span>
                      {e.tokens_used > 0 && <span className="text-purple-400 flex-shrink-0">{e.tokens_used.toLocaleString()}t</span>}
                      {e.latency_ms && <span className="text-cyan-400 flex-shrink-0">{e.latency_ms}ms</span>}
                    </div>
                  ))}
                  {executions.length === 0 && (
                    <p className="text-slate-600 py-4 text-center">No execution data yet</p>
                  )}
                </div>
              </div>
              {/* Mode distribution */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold text-white mb-4">Routing Distribution</p>
                <div className="space-y-3">
                  {ORCHESTRATION_MODES.map(m => {
                    const count = executions.filter(e => e.orchestration_mode === m.key).length;
                    const pct = executions.length > 0 ? (count / executions.length) * 100 : 0;
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400">{m.label}</span>
                          <span className="text-[10px] font-mono" style={{ color: m.color }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "governance" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <h3 className="text-sm font-bold text-white">RBAC & Policies</h3>
              </div>
              {[
                { label: "Least Privilege Mode", active: true },
                { label: "Budget Hard Limits", active: true },
                { label: "Human-in-the-Loop Gates", active: false },
                { label: "Audit Trail Logging", active: true },
                { label: "Compliance Mapping (GDPR)", active: true },
                { label: "Sandbox Isolation", active: true },
                { label: "API Rate Limiting", active: true },
                { label: "Data Stream Boundaries", active: false },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-sm text-slate-300">{p.label}</span>
                  <div className="flex items-center gap-1.5">
                    {p.active ? <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    <span className="text-[10px]" style={{ color: p.active ? "#10b981" : "#64748b" }}>{p.active ? "Enabled" : "Off"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4" style={{ color: "#06b6d4" }} />
                <h3 className="text-sm font-bold text-white">Audit Trail</h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {executions.slice(0, 15).map(e => (
                  <div key={e.id} className="flex items-center gap-2 py-1.5 text-[10px] font-mono"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-slate-600">{new Date(e.created_date).toLocaleString()}</span>
                    <span className="text-slate-400 truncate flex-1">{e.task || "—"}</span>
                    <span style={{ color: STATUS_CONFIG[e.status]?.color || "#64748b" }}>{e.status}</span>
                    {e.human_approved_by && <span className="text-green-400">✓ approved</span>}
                  </div>
                ))}
                {executions.length === 0 && <p className="text-slate-600 text-xs py-4 text-center">No audit entries</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "evals" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                <h3 className="text-sm font-bold text-white">Eval & Test Suite</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Route Optimization Golden Task", score: 94, runs: 12, status: "passing" },
                  { name: "Fleet Maintenance Benchmark", score: 87, runs: 8, status: "passing" },
                  { name: "Risk Assessment Regression", score: 72, runs: 5, status: "degraded" },
                  { name: "Demand Forecast Accuracy", score: 91, runs: 20, status: "passing" },
                  { name: "Multi-agent Quorum Test", score: 65, runs: 3, status: "failing" },
                  { name: "Cost Budget Compliance", score: 100, runs: 15, status: "passing" },
                ].map((ev, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${ev.status === "passing" ? "rgba(16,185,129,0.2)" : ev.status === "degraded" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                    <p className="text-xs font-medium text-white mb-2">{ev.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black" style={{ color: ev.score >= 90 ? "#10b981" : ev.score >= 75 ? "#f59e0b" : "#ef4444" }}>{ev.score}%</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                        background: ev.status === "passing" ? "rgba(16,185,129,0.15)" : ev.status === "degraded" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color: ev.status === "passing" ? "#10b981" : ev.status === "degraded" ? "#f59e0b" : "#ef4444"
                      }}>{ev.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{ev.runs} runs</p>
                    <div className="h-1 rounded-full bg-slate-800 mt-2">
                      <div className="h-full rounded-full" style={{ width: `${ev.score}%`, background: ev.score >= 90 ? "#10b981" : ev.score >= 75 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}