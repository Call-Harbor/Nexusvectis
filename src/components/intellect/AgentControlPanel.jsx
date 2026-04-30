import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Zap, Brain, ChevronUp, ChevronDown, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

const MOCK_AGENTS = [
  { id: "harbor_fleet_analyst", name: "Fleet Analyst", category: "Fleet", status: "running", color: "#06b6d4", priority: 2, cpu: 34, memory: 512, tokensPerMin: 1200, tasksCompleted: 47 },
  { id: "harbor_route_optimizer", name: "Route Optimizer", category: "Routing", status: "running", color: "#10b981", priority: 3, cpu: 61, memory: 768, tokensPerMin: 2100, tasksCompleted: 23 },
  { id: "harbor_risk_engine", name: "Risk Engine", category: "Risk", status: "running", color: "#ef4444", priority: 1, cpu: 22, memory: 384, tokensPerMin: 800, tasksCompleted: 88 },
  { id: "harbor_demand_forecaster", name: "Demand Forecaster", category: "Analytics", status: "idle", color: "#f59e0b", priority: 2, cpu: 5, memory: 256, tokensPerMin: 0, tasksCompleted: 31 },
  { id: "harbor_financial_ai", name: "Financial AI", category: "Finance", status: "running", color: "#8b5cf6", priority: 2, cpu: 48, memory: 640, tokensPerMin: 1600, tasksCompleted: 12 },
  { id: "harbor_maintenance_bot", name: "Maintenance Bot", category: "Fleet", status: "idle", color: "#64748b", priority: 1, cpu: 3, memory: 192, tokensPerMin: 0, tasksCompleted: 64 },
  { id: "harbor_sustainability_ai", name: "Sustainability AI", category: "ESG", status: "running", color: "#22c55e", priority: 1, cpu: 18, memory: 320, tokensPerMin: 650, tasksCompleted: 19 },
  { id: "harbor_security_ai", name: "Security AI", category: "Security", status: "running", color: "#ec4899", priority: 4, cpu: 72, memory: 896, tokensPerMin: 2800, tasksCompleted: 5 },
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

export default function AgentControlPanel({ onClose }) {
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  const setPriority = (id, delta) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, priority: Math.min(4, Math.max(1, a.priority + delta)) } : a));
    setPendingChanges(prev => ({ ...prev, [id]: true }));
  };

  const setResourceAlloc = (id, field, val) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    setPendingChanges(prev => ({ ...prev, [id]: true }));
  };

  const applyChanges = (id) => {
    setPendingChanges(prev => { const next = { ...prev }; delete next[id]; return next; });
    toast.success(`Applied changes to ${agents.find(a => a.id === id)?.name}`);
  };

  const toggleStatus = (id) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "running" ? "idle" : "running", cpu: a.status === "running" ? 0 : Math.floor(Math.random() * 60) + 10, tokensPerMin: a.status === "running" ? 0 : Math.floor(Math.random() * 2000) + 500 } : a));
    const agent = agents.find(a => a.id === id);
    toast.info(`${agent?.name} ${agent?.status === "running" ? "paused" : "resumed"}`);
  };

  const selected = agents.find(a => a.id === selectedId);

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
            <p className="text-[10px] font-mono" style={{ color: "#475569" }}>{agents.filter(a => a.status === "running").length} running · {agents.length} total</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Agent List */}
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
                    <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "#475569" }}>{agent.cpu}% CPU</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-black font-mono" style={{ color: PRIORITY_COLORS[agent.priority] }}>{PRIORITY_LABELS[agent.priority]}</div>
                  <div className="text-[9px] font-mono" style={{ color: "#334155" }}>{agent.tokensPerMin > 0 ? `${(agent.tokensPerMin / 1000).toFixed(1)}k tok/min` : "idle"}</div>
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
                              <button key={lvl} onClick={(e) => { e.stopPropagation(); setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, priority: lvl } : a)); setPendingChanges(prev => ({ ...prev, [agent.id]: true })); }}
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

                      {/* Resource Allocation */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Token Budget (k/min)</p>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input type="range" min={100} max={5000} step={100} value={agent.tokensPerMin}
                            onChange={e => setResourceAlloc(agent.id, "tokensPerMin", parseInt(e.target.value))}
                            className="flex-1 accent-cyan-400 cursor-pointer" />
                          <span className="text-xs font-mono font-bold w-16 text-right" style={{ color: agent.color }}>{(agent.tokensPerMin / 1000).toFixed(1)}k</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Memory Allocation (MB)</p>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input type="range" min={64} max={2048} step={64} value={agent.memory}
                            onChange={e => setResourceAlloc(agent.id, "memory", parseInt(e.target.value))}
                            className="flex-1 accent-violet-400 cursor-pointer" />
                          <span className="text-xs font-mono font-bold w-16 text-right" style={{ color: "#8b5cf6" }}>{agent.memory}MB</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Tasks Done", value: agent.tasksCompleted },
                          { label: "CPU Usage", value: `${agent.cpu}%` },
                          { label: "Status", value: agent.status },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "#475569" }}>{s.label}</p>
                            <p className="text-xs font-black text-white">{s.value}</p>
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
                          <button onClick={() => applyChanges(agent.id)}
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
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" style={{ color: "#10b981" }} />
          <span className="text-[10px] font-mono" style={{ color: "#475569" }}>
            {agents.reduce((s, a) => s + a.tokensPerMin, 0).toLocaleString()} tok/min total
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