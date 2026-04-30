import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Truck, Route, Shield, BarChart3, Activity, Zap, Globe, Users, Layers, Network, FileText, Code2, Star } from "lucide-react";

const ICON_MAP = { Brain, Truck, Route, Shield, BarChart3, Activity, Zap, Globe, Users, Layers, Network, FileText, Code2, Star };

const SCENARIOS = [
  {
    id: "parallel",
    label: "Parallel",
    color: "#10b981",
    task: "Analyze risk, cost and sustainability for CPH→HAM route",
    agents: [
      { id: "harbor_risk_engine", name: "Risk Engine", icon: "Shield", color: "#ef4444", load: 82, tokens: 1240, status: "running" },
      { id: "harbor_financial_ai", name: "Financial AI", icon: "Activity", color: "#8b5cf6", load: 67, tokens: 980, status: "running" },
      { id: "harbor_sustainability_ai", name: "Sustainability AI", icon: "Globe", color: "#22c55e", load: 74, tokens: 1100, status: "running" },
    ],
    description: "All agents fire simultaneously — results merged into one synthesis.",
    flowType: "parallel",
  },
  {
    id: "sequential",
    label: "Sequential",
    color: "#8b5cf6",
    task: "Identify failing vehicles, plan maintenance, estimate budget",
    agents: [
      { id: "harbor_maintenance_bot", name: "Maintenance Bot", icon: "Zap", color: "#64748b", load: 91, tokens: 1560, status: "done" },
      { id: "harbor_financial_ai", name: "Financial AI", icon: "Activity", color: "#8b5cf6", load: 55, tokens: 870, status: "running" },
    ],
    description: "Output of each agent feeds as context into the next.",
    flowType: "sequential",
  },
  {
    id: "hierarchical",
    label: "Hierarchical",
    color: "#ec4899",
    task: "Full quarterly review: ops, finance, compliance, sustainability",
    supervisor: { id: "harbor_strategy_ai", name: "Strategy AI", icon: "Brain", color: "#8b5cf6" },
    agents: [
      { id: "harbor_ops_commander", name: "Ops Commander", icon: "Network", color: "#06b6d4", load: 78, tokens: 1320, status: "running" },
      { id: "harbor_financial_ai", name: "Financial AI", icon: "Activity", color: "#8b5cf6", load: 62, tokens: 990, status: "running" },
      { id: "harbor_compliance_guard", name: "Compliance Guard", icon: "Shield", color: "#f97316", load: 45, tokens: 720, status: "queued" },
      { id: "harbor_sustainability_ai", name: "Sustainability AI", icon: "Globe", color: "#22c55e", load: 33, tokens: 540, status: "queued" },
    ],
    description: "Supervisor decomposes the task and delegates to specialists.",
    flowType: "hierarchical",
  },
  {
    id: "debate",
    label: "Debate",
    color: "#f59e0b",
    task: "Should we switch Hamburg route to electric trucks?",
    agents: [
      { id: "harbor_financial_ai", name: "Financial AI", icon: "Activity", color: "#8b5cf6", load: 88, tokens: 1480, status: "running", stance: "Against" },
      { id: "harbor_sustainability_ai", name: "Sustainability AI", icon: "Globe", color: "#22c55e", load: 85, tokens: 1390, status: "running", stance: "For" },
      { id: "harbor_risk_engine", name: "Risk Engine", icon: "Shield", color: "#ef4444", load: 79, tokens: 1210, status: "running", stance: "Neutral" },
    ],
    description: "Agents argue opposing views — synthesizer finds consensus.",
    flowType: "debate",
  },
  {
    id: "auto",
    label: "Auto",
    color: "#06b6d4",
    task: "Give me a full operational briefing for today",
    agents: [
      { id: "harbor_ops_commander", name: "Ops Commander", icon: "Network", color: "#06b6d4", load: 88, tokens: 1580, status: "running" },
      { id: "harbor_risk_engine", name: "Risk Engine", icon: "Shield", color: "#ef4444", load: 71, tokens: 1140, status: "running" },
      { id: "harbor_fleet_analyst", name: "Fleet Analyst", icon: "Truck", color: "#06b6d4", load: 65, tokens: 950, status: "done" },
    ],
    description: "Orchestrator picks the best agents automatically from 50+.",
    flowType: "auto",
  },
];

const STATUS_STYLES = {
  running: { color: "#10b981", label: "Running", pulse: true },
  done:    { color: "#06b6d4", label: "Done",    pulse: false },
  queued:  { color: "#475569", label: "Queued",  pulse: false },
  error:   { color: "#ef4444", label: "Error",   pulse: false },
};

function LoadBar({ value, color }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  );
}

function AgentCard({ agent, index, flowType, totalAgents, isAnimating }) {
  const Icon = ICON_MAP[agent.icon] || Brain;
  const st = STATUS_STYLES[agent.status] || STATUS_STYLES.running;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className="relative p-3 rounded-xl flex-1"
      style={{
        background: `${agent.color}08`,
        border: `1px solid ${agent.color}30`,
        minWidth: 140,
      }}
    >
      {/* Status dot */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
        <span className="text-[8px] font-mono" style={{ color: st.color }}>{st.label}</span>
        <span className="relative flex h-2 w-2">
          {st.pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: st.color }} />}
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: st.color }} />
        </span>
      </div>

      {/* Icon + name */}
      <div className="flex items-center gap-2 mb-2 pr-12">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${agent.color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
        </div>
        <div>
          <p className="text-[11px] font-black text-white leading-tight">{agent.name}</p>
          {agent.stance && (
            <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{
              background: agent.stance === "For" ? "rgba(34,197,94,0.15)" : agent.stance === "Against" ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.15)",
              color: agent.stance === "For" ? "#22c55e" : agent.stance === "Against" ? "#ef4444" : "#94a3b8"
            }}>{agent.stance}</span>
          )}
        </div>
      </div>

      {/* Load */}
      <div className="mb-1.5">
        <div className="flex justify-between mb-1">
          <span className="text-[9px] font-mono" style={{ color: "#475569" }}>Load</span>
          <span className="text-[9px] font-mono font-bold" style={{ color: agent.color }}>{agent.load}%</span>
        </div>
        <LoadBar value={agent.load} color={agent.color} />
      </div>

      {/* Tokens */}
      <div className="flex justify-between">
        <span className="text-[9px] font-mono" style={{ color: "#334155" }}>Tokens</span>
        <span className="text-[9px] font-mono" style={{ color: "#475569" }}>{agent.tokens.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

function FlowConnectors({ flowType, agentCount, color }) {
  if (flowType === "parallel" || flowType === "debate" || flowType === "auto") {
    // Fan-out lines from orchestrator
    return (
      <div className="flex items-center justify-center my-2 relative" style={{ height: 32 }}>
        <svg width="100%" height="32" className="absolute inset-0">
          {Array.from({ length: agentCount }).map((_, i) => {
            const x = ((i + 0.5) / agentCount) * 100;
            return (
              <motion.line
                key={i}
                x1="50%" y1="0" x2={`${x}%`} y2="100%"
                stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  if (flowType === "sequential") {
    return (
      <div className="flex items-center gap-1 justify-center my-2">
        {Array.from({ length: agentCount - 1 }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }} />
            <motion.div
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-[10px]" style={{ color }}>▶</motion.div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (flowType === "hierarchical") {
    return (
      <div className="flex items-center justify-center my-2 relative" style={{ height: 32 }}>
        <svg width="100%" height="32" className="absolute inset-0">
          {Array.from({ length: agentCount }).map((_, i) => {
            const x = ((i + 0.5) / agentCount) * 100;
            return (
              <motion.line
                key={i}
                x1="50%" y1="0" x2={`${x}%`} y2="100%"
                stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  return null;
}

export default function OrchestratorFlowVisualizer() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [animKey, setAnimKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setAnimKey(k => k + 1);
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 100), 100);
    return () => clearInterval(timerRef.current);
  }, [activeScenario]);

  const scenario = activeScenario;
  const hasSuper = !!scenario.supervisor;

  return (
    <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-white mb-0.5">Live Orchestration Flow</h2>
          <p className="text-[11px]" style={{ color: "#475569" }}>Select a mode to see how the orchestrator distributes tasks across agents in real-time.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
          <span className="text-[10px] font-mono font-bold" style={{ color: "#10b981" }}>SIMULATING</span>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setActiveScenario(s)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-black font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeScenario.id === s.id ? `${s.color}20` : "rgba(255,255,255,0.03)",
              color: activeScenario.id === s.id ? s.color : "#475569",
              border: activeScenario.id === s.id ? `1px solid ${s.color}50` : "1px solid rgba(255,255,255,0.07)"
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${scenario.id}-${animKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

          {/* Task bar */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${scenario.color}25` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: scenario.color, boxShadow: `0 0 8px ${scenario.color}` }} />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#475569" }}>Task dispatched</span>
              <p className="text-xs font-bold text-white truncate">"{scenario.task}"</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[9px] font-mono" style={{ color: "#475569" }}>Elapsed</span>
              <p className="text-xs font-black" style={{ color: scenario.color }}>{(elapsed / 1000).toFixed(1)}s</p>
            </div>
          </div>

          {/* Orchestrator node */}
          <div className="flex justify-center mb-1">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="px-5 py-3 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.35)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167,139,250,0.2)" }}>
                <Network className="w-4 h-4" style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#a78bfa" }}>H.A.R.B.O.R. Orchestrator</p>
                <p className="text-[9px] font-mono" style={{ color: "#475569" }}>mode: <span style={{ color: scenario.color }}>{scenario.id}</span> · {scenario.agents.length} agents selected</p>
              </div>
              <div className="w-2 h-2 rounded-full animate-pulse ml-2" style={{ background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }} />
            </motion.div>
          </div>

          {/* Supervisor node (hierarchical only) */}
          {hasSuper && (
            <>
              <div className="flex justify-center my-1" style={{ height: 24 }}>
                <svg width="2" height="24"><motion.line x1="1" y1="0" x2="1" y2="24" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="4 3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} /></svg>
              </div>
              <div className="flex justify-center mb-1">
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 }}
                  className="px-4 py-2.5 rounded-xl flex items-center gap-2.5"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.35)" }}>
                  <Brain className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                  <div>
                    <p className="text-[10px] font-black text-white">{scenario.supervisor.name}</p>
                    <p className="text-[9px] font-mono" style={{ color: "#475569" }}>supervisor · decomposing task</p>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Flow connectors */}
          <FlowConnectors flowType={scenario.flowType} agentCount={scenario.agents.length} color={scenario.color} />

          {/* Agent cards */}
          <div className="flex gap-3 flex-wrap">
            {scenario.agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} flowType={scenario.flowType} totalAgents={scenario.agents.length} isAnimating={true} />
            ))}
          </div>

          {/* Synthesis result bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: scenario.agents.length * 0.15 + 0.4 }}
            className="mt-4 flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${scenario.color}20` }}
          >
            <Star className="w-4 h-4 flex-shrink-0" style={{ color: scenario.color }} />
            <div className="flex-1">
              <p className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "#475569" }}>Synthesis output</p>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>{scenario.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] font-mono" style={{ color: "#475569" }}>Total tokens</p>
              <p className="text-xs font-black" style={{ color: scenario.color }}>
                {scenario.agents.reduce((s, a) => s + a.tokens, 0).toLocaleString()}
              </p>
            </div>
          </motion.div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {Object.entries(STATUS_STYLES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: val.color }} />
                <span className="text-[9px] font-mono" style={{ color: "#475569" }}>{val.label}</span>
              </div>
            ))}
            <div className="ml-auto text-[9px] font-mono" style={{ color: "#334155" }}>
              Load % = estimated GPU utilization · Tokens = context window used
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}