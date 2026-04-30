import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Zap, ChevronUp, ChevronDown, RefreshCw, AlertTriangle, Check, Loader2, Cpu, HardDrive, Activity, Gauge, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

// ─── Agent definitions (identity + visual metadata) ───────────────────────
const AGENT_DEFS = [
  { id: "harbor_fleet_analyst",    name: "Fleet Analyst",      category: "Fleet",      color: "#06b6d4", keywords: ["fleet","vehicle","truck","flåde"] },
  { id: "harbor_route_optimizer",  name: "Route Optimizer",    category: "Routing",    color: "#10b981", keywords: ["route","rute","optimize"] },
  { id: "harbor_risk_engine",      name: "Risk Engine",        category: "Risk",       color: "#ef4444", keywords: ["risk","risiko"] },
  { id: "harbor_demand_forecaster",name: "Demand Forecaster",  category: "Analytics",  color: "#f59e0b", keywords: ["demand","forecast"] },
  { id: "harbor_financial_ai",     name: "Financial AI",       category: "Finance",    color: "#8b5cf6", keywords: ["financial","invoice","faktura"] },
  { id: "harbor_maintenance_bot",  name: "Maintenance Bot",    category: "Fleet",      color: "#64748b", keywords: ["maintenance","predictive","vedligehold"] },
  { id: "harbor_sustainability_ai",name: "Sustainability AI",  category: "ESG",        color: "#22c55e", keywords: ["sustainability","co2","green","esg"] },
  { id: "harbor_security_ai",      name: "Security AI",        category: "Risk",       color: "#ec4899", keywords: ["security","sikkerhed","anomaly"] },
  { id: "harbor_compliance_guard", name: "Compliance Guard",   category: "Compliance", color: "#f97316", keywords: ["compliance","regulatory","adr"] },
  { id: "harbor_ops_commander",    name: "Ops Commander",      category: "Operations", color: "#06b6d4", keywords: ["ops","operation","dispatch"] },
  { id: "harbor_customer_intel",   name: "Customer Intel",     category: "CRM",        color: "#a78bfa", keywords: ["customer","kunde","crm"] },
  { id: "harbor_strategy_ai",      name: "Strategy AI",        category: "Strategy",   color: "#818cf8", keywords: ["strategy","strategi","market"] },
];

const PRIORITY_LABELS = { 1: "Low", 2: "Normal", 3: "High", 4: "Critical" };
const PRIORITY_COLORS = { 1: "#64748b", 2: "#06b6d4", 3: "#f59e0b", 4: "#ef4444" };

function ResourceBar({ value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
    </div>
  );
}

// ─── Compute per-agent stats from real data ───────────────────────────────
function buildAgentStats(executions, fleetAIUsage) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;

  return AGENT_DEFS.map(def => {
    // Executions where this agent is involved (agents_involved array)
    const myExecs = executions.filter(ex => {
      const ts = ex.started_at ? new Date(ex.started_at).getTime() : new Date(ex.created_date || 0).getTime();
      return now - ts < windowMs && (ex.agents_involved || []).includes(def.id);
    });

    // FleetAI commands matching this agent's keywords
    const myCommands = fleetAIUsage.filter(u => {
      const ts = new Date(u.created_date || 0).getTime();
      if (now - ts > windowMs) return false;
      const cmd = (u.command || "").toLowerCase();
      return def.keywords.some(kw => cmd.includes(kw));
    });

    const running = myExecs.filter(e => e.status === "running");
    const completed = myExecs.filter(e => e.status === "completed");
    const failed = myExecs.filter(e => e.status === "failed");
    const totalTokens = myExecs.reduce((s, e) => s + (e.tokens_used || 0), 0);
    const avgLatency = myExecs.length > 0
      ? Math.round(myExecs.reduce((s, e) => s + (e.latency_ms || 0), 0) / myExecs.length)
      : 0;

    // Derive a CPU-like "activity" score from real usage
    const activityScore = Math.min(99, running.length * 20 + myCommands.length * 3 + completed.length * 1);

    // Status: running if any active executions or recent commands
    const status = running.length > 0 ? "running" : myCommands.length > 0 ? "running" : "idle";

    // Tokens per min estimate from last hour
    const hourCommands = fleetAIUsage.filter(u => {
      const ts = new Date(u.created_date || 0).getTime();
      return now - ts < 60 * 60 * 1000 && def.keywords.some(kw => (u.command || "").toLowerCase().includes(kw));
    });
    const tokensPerMin = Math.round((totalTokens / 60) + hourCommands.length * 50);

    return {
      ...def,
      status,
      cpu: activityScore,
      tasksCompleted: completed.length,
      tasksFailed: failed.length,
      runningTasks: running.length,
      tokensUsed24h: totalTokens,
      tokensPerMin,
      avgLatency,
      commandCount: myCommands.length,
      priority: running.length > 2 ? 3 : running.length > 0 ? 2 : 1,
      memory: 128 + myExecs.length * 32, // derived from executions
    };
  });
}

export default function AgentControlPanel({ onClose }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [overrides, setOverrides] = useState({}); // local priority/token overrides
  const [showResourceManager, setShowResourceManager] = useState(false);
  const [resourceAllocs, setResourceAllocs] = useState({}); // { agent_id: { cpu, memory, priority, tokensPerMin } }

  const fetchData = async () => {
    try {
      const [executions, fleetAIUsage] = await Promise.all([
        base44.entities.AgentExecution.list("-created_date", 300),
        base44.entities.FleetAIUsage.list("-created_date", 300),
      ]);
      const stats = buildAgentStats(executions, fleetAIUsage);
      // Merge in any local overrides
      setAgents(stats.map(a => ({ ...a, ...(overrides[a.id] || {}) })));
    } catch (e) {
      toast.error("Failed to load agent data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const setPriority = (id, delta) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, priority: Math.min(4, Math.max(1, a.priority + delta)) } : a));
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], priority: Math.min(4, Math.max(1, (agents.find(a => a.id === id)?.priority || 2) + delta)) } }));
    setPendingChanges(prev => ({ ...prev, [id]: true }));
  };

  const setResourceAlloc = (id, field, val) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    setPendingChanges(prev => ({ ...prev, [id]: true }));
  };

  // Advanced resource allocation
  const updateResourceAlloc = (id, field, val) => {
    setResourceAllocs(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: val }
    }));
    setPendingChanges(prev => ({ ...prev, [id]: true }));
  };

  const applyResourceChanges = async (id) => {
    try {
      const alloc = resourceAllocs[id];
      if (!alloc) {
        toast.error("No changes to apply");
        return;
      }
      // Simulate resource allocation change
      setAgents(prev => prev.map(a => a.id === id ? {
        ...a,
        priority: alloc.priority ?? a.priority,
        cpu: alloc.cpu ?? a.cpu,
        memory: alloc.memory ?? a.memory,
        tokensPerMin: alloc.tokensPerMin ?? a.tokensPerMin
      } : a));
      toast.success(`Resource allocation applied to ${agents.find(a => a.id === id)?.name}`);
      applyChanges(id);
    } catch (e) {
      toast.error("Failed to apply resource allocation");
    }
  };

  const applyChanges = (id) => {
    setPendingChanges(prev => { const next = { ...prev }; delete next[id]; return next; });
    toast.success(`Applied changes to ${agents.find(a => a.id === id)?.name}`);
  };

  const toggleStatus = (id) => {
    setAgents(prev => prev.map(a => a.id === id
      ? { ...a, status: a.status === "running" ? "idle" : "running" }
      : a
    ));
    const agent = agents.find(a => a.id === id);
    toast.info(`${agent?.name} ${agent?.status === "running" ? "paused" : "resumed"}`);
  };

  const runningCount = agents.filter(a => a.status === "running").length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed top-20 right-6 w-[420px] max-h-[80vh] flex flex-col rounded-2xl z-50 overflow-hidden"
      style={{ background: "rgba(8,15,30,0.97)", border: "1px solid rgba(6,182,212,0.25)", backdropFilter: "blur(24px)", boxShadow: "0 0 60px rgba(6,182,212,0.1)" }}
    >
      {/* Header */}
       <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(6,182,212,0.12)" }}>
         <div className="flex items-center gap-2.5">
           <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}>
             <Sliders className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
           </div>
           <div>
             <p className="text-white font-black text-sm tracking-widest uppercase font-mono">Agent Control</p>
             <p className="text-[10px] font-mono" style={{ color: "#475569" }}>
               {loading ? "Loading..." : `${runningCount} running · ${agents.length} total · real data`}
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <button onClick={() => setShowResourceManager(!showResourceManager)} title="Resource Manager" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: showResourceManager ? "#06b6d4" : "#64748b" }}>
             <Gauge className="w-3.5 h-3.5" />
           </button>
           <button onClick={fetchData} title="Refresh" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
             <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
           </button>
           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
             <X className="w-4 h-4 text-slate-400" />
           </button>
         </div>
       </div>

      <div className="flex-1 overflow-y-auto min-h-0">
         {loading ? (
           <div className="flex items-center justify-center py-16">
             <div className="text-center">
               <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "#06b6d4" }} />
               <p className="text-[10px] font-mono" style={{ color: "#334155" }}>Loading platform data...</p>
             </div>
           </div>
         ) : showResourceManager ? (
           <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 mb-3">
               <Gauge className="w-4 h-4" style={{ color: "#06b6d4" }} />
               <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#475569" }}>Global Resource Manager</p>
             </div>

             {/* Global Stats */}
             <div className="grid grid-cols-2 gap-2">
               <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                 <p className="text-[9px] font-mono mb-1" style={{ color: "#64748b" }}>Total CPU</p>
                 <p className="text-lg font-black" style={{ color: "#3b82f6" }}>{agents.reduce((s, a) => s + (a.cpu || 0), 0)}%</p>
               </div>
               <div className="p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                 <p className="text-[9px] font-mono mb-1" style={{ color: "#64748b" }}>Total Memory</p>
                 <p className="text-lg font-black" style={{ color: "#8b5cf6" }}>{agents.reduce((s, a) => s + (a.memory || 128), 0)}MB</p>
               </div>
               <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                 <p className="text-[9px] font-mono mb-1" style={{ color: "#64748b" }}>Running Agents</p>
                 <p className="text-lg font-black" style={{ color: "#22c55e" }}>{runningCount}/{agents.length}</p>
               </div>
               <div className="p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                 <p className="text-[9px] font-mono mb-1" style={{ color: "#64748b" }}>Token Usage</p>
                 <p className="text-lg font-black" style={{ color: "#10b981" }}>{(agents.reduce((s, a) => s + (a.tokensPerMin || 0), 0) / 1000).toFixed(1)}k/min</p>
               </div>
             </div>

             {/* Per-Agent Resource Editor */}
             <div className="border-t border-white/10 pt-3">
               <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Agent Allocations</p>
               <div className="space-y-2 max-h-[300px] overflow-y-auto">
                 {agents.map(agent => (
                   <div key={agent.id} className="p-2.5 rounded-lg" style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}20` }}>
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold truncate flex-1">{agent.name}</span>
                       <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${agent.color}18`, color: agent.color }}>{agent.category}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-[9px]">
                       <div>
                         <div className="flex justify-between mb-0.5">
                           <span style={{ color: "#64748b" }}>CPU</span>
                           <span style={{ color: agent.color, fontWeight: "bold" }}>{resourceAllocs[agent.id]?.cpu ?? agent.cpu}%</span>
                         </div>
                         <input type="range" min={5} max={100} step={5} value={resourceAllocs[agent.id]?.cpu ?? agent.cpu}
                           onChange={e => updateResourceAlloc(agent.id, "cpu", parseInt(e.target.value))}
                           className="w-full accent-blue-400 cursor-pointer h-1.5" />
                       </div>
                       <div>
                         <div className="flex justify-between mb-0.5">
                           <span style={{ color: "#64748b" }}>Memory</span>
                           <span style={{ color: agent.color, fontWeight: "bold" }}>{resourceAllocs[agent.id]?.memory ?? agent.memory}MB</span>
                         </div>
                         <input type="range" min={128} max={2048} step={128} value={resourceAllocs[agent.id]?.memory ?? agent.memory}
                           onChange={e => updateResourceAlloc(agent.id, "memory", parseInt(e.target.value))}
                           className="w-full accent-purple-400 cursor-pointer h-1.5" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Quick presets */}
             <div className="border-t border-white/10 pt-3">
               <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Presets</p>
               <div className="flex gap-2">
                 <button onClick={() => {
                   agents.forEach(a => {
                     updateResourceAlloc(a.id, "cpu", 20);
                     updateResourceAlloc(a.id, "memory", 256);
                   });
                   toast.success("Applied low-resource preset");
                 }} className="flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}>
                   Low
                 </button>
                 <button onClick={() => {
                   agents.forEach(a => {
                     updateResourceAlloc(a.id, "cpu", 50);
                     updateResourceAlloc(a.id, "memory", 768);
                   });
                   toast.success("Applied balanced preset");
                 }} className="flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
                   Balanced
                 </button>
                 <button onClick={() => {
                   agents.forEach(a => {
                     updateResourceAlloc(a.id, "cpu", 85);
                     updateResourceAlloc(a.id, "memory", 1024);
                   });
                   toast.success("Applied high-performance preset");
                 }} className="flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
                   High
                 </button>
               </div>
             </div>
           </div>
         ) : (
           <div className="p-3 space-y-1.5">
            {agents.map(agent => (
              <motion.div key={agent.id} layout
                onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)}
                className="rounded-xl cursor-pointer transition-all"
                style={{
                  background: selectedId === agent.id ? `${agent.color}0d` : "rgba(255,255,255,0.02)",
                  border: selectedId === agent.id ? `1px solid ${agent.color}40` : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Agent Row */}
                <div className="flex items-center gap-3 p-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: agent.color, boxShadow: agent.status === "running" ? `0 0 8px ${agent.color}` : "none" }} />
                    {agent.status === "running" && (
                      <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full" style={{ background: agent.color }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate">{agent.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}30` }}>{agent.category}</span>
                      {pendingChanges[agent.id] && <span className="text-[9px] font-mono text-amber-400">● unsaved</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <ResourceBar value={agent.cpu} color={agent.color} />
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "#475569" }}>{agent.cpu}% activity</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-black font-mono" style={{ color: PRIORITY_COLORS[agent.priority] }}>{PRIORITY_LABELS[agent.priority]}</div>
                    <div className="text-[9px] font-mono" style={{ color: "#334155" }}>
                      {agent.runningTasks > 0 ? `${agent.runningTasks} active` : agent.status === "running" ? "active" : "idle"}
                    </div>
                  </div>
                </div>

                {/* Expanded Controls */}
                <AnimatePresence>
                  {selectedId === agent.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden" style={{ borderTop: `1px solid ${agent.color}20` }}>
                      <div className="p-4 space-y-4">

                        {/* Priority Control */}
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Priority Level</p>
                          <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); setPriority(agent.id, -1); }} disabled={agent.priority === 1}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                            </button>
                            <div className="flex-1 flex gap-1">
                              {[1, 2, 3, 4].map(lvl => (
                                <button key={lvl} onClick={(e) => { e.stopPropagation(); setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, priority: lvl } : a)); setOverrides(prev => ({ ...prev, [agent.id]: { ...prev[agent.id], priority: lvl } })); setPendingChanges(prev => ({ ...prev, [agent.id]: true })); }}
                                  className="flex-1 h-7 rounded-lg text-[9px] font-black font-mono transition-all"
                                  style={{
                                    background: agent.priority === lvl ? `${PRIORITY_COLORS[lvl]}25` : "rgba(255,255,255,0.03)",
                                    border: agent.priority === lvl ? `1px solid ${PRIORITY_COLORS[lvl]}60` : "1px solid rgba(255,255,255,0.06)",
                                    color: agent.priority === lvl ? PRIORITY_COLORS[lvl] : "#475569",
                                  }}>
                                  {PRIORITY_LABELS[lvl]}
                                </button>
                              ))}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setPriority(agent.id, 1); }} disabled={agent.priority === 4}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                              <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
                            </button>
                          </div>
                        </div>

                        {/* Token Budget slider */}
                         <div>
                           <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Token Budget (k/min)</p>
                           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                             <input type="range" min={100} max={5000} step={100} value={agent.tokensPerMin}
                               onChange={e => setResourceAlloc(agent.id, "tokensPerMin", parseInt(e.target.value))}
                               className="flex-1 accent-cyan-400 cursor-pointer" />
                             <span className="text-xs font-mono font-bold w-16 text-right" style={{ color: agent.color }}>{(agent.tokensPerMin / 1000).toFixed(1)}k</span>
                           </div>
                         </div>

                         {/* CPU & Memory allocation (advanced) */}
                         <div className="border-t border-white/10 pt-4">
                           <p className="text-[10px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#475569" }}>
                             <Cpu className="w-3 h-3" /> CPU & Memory Allocation
                           </p>

                           {/* CPU Allocation */}
                           <div className="mb-3">
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-[9px] font-mono" style={{ color: "#64748b" }}>CPU Limit (%)</span>
                               <span className="text-xs font-bold" style={{ color: agent.color }}>{resourceAllocs[agent.id]?.cpu ?? agent.cpu}%</span>
                             </div>
                             <input type="range" min={5} max={100} step={5} value={resourceAllocs[agent.id]?.cpu ?? agent.cpu}
                               onChange={e => updateResourceAlloc(agent.id, "cpu", parseInt(e.target.value))}
                               onClick={e => e.stopPropagation()}
                               className="w-full accent-blue-400 cursor-pointer" />
                           </div>

                           {/* Memory Allocation */}
                           <div className="mb-3">
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-[9px] font-mono" style={{ color: "#64748b" }}>Memory (MB)</span>
                               <span className="text-xs font-bold" style={{ color: agent.color }}>{resourceAllocs[agent.id]?.memory ?? agent.memory}MB</span>
                             </div>
                             <input type="range" min={128} max={2048} step={128} value={resourceAllocs[agent.id]?.memory ?? agent.memory}
                               onChange={e => updateResourceAlloc(agent.id, "memory", parseInt(e.target.value))}
                               onClick={e => e.stopPropagation()}
                               className="w-full accent-purple-400 cursor-pointer" />
                           </div>

                           {/* Max Concurrent Tasks */}
                           <div>
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-[9px] font-mono" style={{ color: "#64748b" }}>Max Tasks</span>
                               <span className="text-xs font-bold" style={{ color: agent.color }}>{resourceAllocs[agent.id]?.maxTasks ?? 5}</span>
                             </div>
                             <input type="range" min={1} max={20} step={1} value={resourceAllocs[agent.id]?.maxTasks ?? 5}
                               onChange={e => updateResourceAlloc(agent.id, "maxTasks", parseInt(e.target.value))}
                               onClick={e => e.stopPropagation()}
                               className="w-full accent-emerald-400 cursor-pointer" />
                           </div>
                         </div>

                        {/* Real Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Completed", value: agent.tasksCompleted },
                            { label: "Failed", value: agent.tasksFailed, warn: agent.tasksFailed > 0 },
                            { label: "Tokens 24h", value: agent.tokensUsed24h > 1000 ? `${(agent.tokensUsed24h / 1000).toFixed(1)}k` : agent.tokensUsed24h },
                            { label: "Avg Latency", value: agent.avgLatency > 0 ? `${agent.avgLatency}ms` : "—" },
                            { label: "Commands", value: agent.commandCount },
                            { label: "Status", value: agent.status },
                          ].map(s => (
                            <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)", border: s.warn ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "#475569" }}>{s.label}</p>
                              <p className="text-xs font-black" style={{ color: s.warn ? "#ef4444" : "white" }}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                         <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                           <button onClick={() => toggleStatus(agent.id)}
                             className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold font-mono transition-all"
                             style={{ background: agent.status === "running" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", border: agent.status === "running" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)", color: agent.status === "running" ? "#ef4444" : "#10b981" }}>
                             <RefreshCw className="w-3 h-3" />
                             {agent.status === "running" ? "Pause" : "Resume"}
                           </button>
                           {pendingChanges[agent.id] && (
                             <button onClick={() => resourceAllocs[agent.id] ? applyResourceChanges(agent.id) : applyChanges(agent.id)}
                               className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold font-mono transition-all"
                               style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}>
                               <Check className="w-3 h-3" />
                               Apply
                             </button>
                           )}
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" style={{ color: "#10b981" }} />
          <span className="text-[10px] font-mono" style={{ color: "#475569" }}>
            {agents.reduce((s, a) => s + (a.tokensUsed24h || 0), 0).toLocaleString()} tokens used 24h
          </span>
        </div>
        {Object.keys(pendingChanges).length > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400">{Object.keys(pendingChanges).length} unsaved</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}