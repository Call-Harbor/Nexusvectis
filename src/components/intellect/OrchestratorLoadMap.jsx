import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Network, Brain, RefreshCw, Pause, Play, TrendingUp } from "lucide-react";

// ─── All 50+ agents grouped by domain ─────────────────────────────────────────
const AGENT_GROUPS = [
  {
    label: "Fleet", color: "#06b6d4",
    agents: [
      { id: "harbor_fleet_analyst",    name: "Fleet Analyst" },
      { id: "harbor_maintenance_bot",  name: "Maintenance Bot" },
      { id: "harbor_vehicle_tracker",  name: "Vehicle Tracker" },
      { id: "harbor_fuel_optimizer",   name: "Fuel Optimizer" },
      { id: "harbor_fleet_scheduler",  name: "Fleet Scheduler" },
    ],
  },
  {
    label: "Routing", color: "#10b981",
    agents: [
      { id: "harbor_route_optimizer",  name: "Route Optimizer" },
      { id: "harbor_multimodal_ai",    name: "Multimodal AI" },
      { id: "harbor_eta_predictor",    name: "ETA Predictor" },
      { id: "harbor_traffic_ai",       name: "Traffic AI" },
    ],
  },
  {
    label: "Risk", color: "#ef4444",
    agents: [
      { id: "harbor_risk_engine",      name: "Risk Engine" },
      { id: "harbor_security_ai",      name: "Security AI" },
      { id: "harbor_anomaly_detector", name: "Anomaly Detect" },
      { id: "harbor_fraud_guard",      name: "Fraud Guard" },
    ],
  },
  {
    label: "Analytics", color: "#f59e0b",
    agents: [
      { id: "harbor_demand_forecaster","name": "Demand Forecast" },
      { id: "harbor_data_miner",       name: "Data Miner" },
      { id: "harbor_kpi_engine",       name: "KPI Engine" },
      { id: "harbor_benchmark_ai",     name: "Benchmark AI" },
      { id: "harbor_trend_spotter",    name: "Trend Spotter" },
    ],
  },
  {
    label: "Finance", color: "#8b5cf6",
    agents: [
      { id: "harbor_financial_ai",     name: "Financial AI" },
      { id: "harbor_invoice_bot",      name: "Invoice Bot" },
      { id: "harbor_tco_calculator",   name: "TCO Calculator" },
      { id: "harbor_budget_ai",        name: "Budget AI" },
    ],
  },
  {
    label: "ESG", color: "#22c55e",
    agents: [
      { id: "harbor_sustainability_ai","name": "Sustainability AI" },
      { id: "harbor_co2_tracker",      name: "CO₂ Tracker" },
      { id: "harbor_green_router",     name: "Green Router" },
    ],
  },
  {
    label: "Compliance", color: "#f97316",
    agents: [
      { id: "harbor_compliance_guard", name: "Compliance Guard" },
      { id: "harbor_regulatory_ai",    name: "Regulatory AI" },
      { id: "harbor_adr_checker",      name: "ADR Checker" },
      { id: "harbor_audit_bot",        name: "Audit Bot" },
    ],
  },
  {
    label: "Operations", color: "#06b6d4",
    agents: [
      { id: "harbor_ops_commander",    name: "Ops Commander" },
      { id: "harbor_dispatch_ai",      name: "Dispatch AI" },
      { id: "harbor_exception_mgr",    name: "Exception Mgr" },
      { id: "harbor_shift_planner",    name: "Shift Planner" },
    ],
  },
  {
    label: "CRM / HR", color: "#ec4899",
    agents: [
      { id: "harbor_customer_intel",   name: "Customer Intel" },
      { id: "harbor_driver_coach",     name: "Driver Coach" },
      { id: "harbor_crm_ai",           name: "CRM AI" },
      { id: "harbor_hr_analyst",       name: "HR Analyst" },
    ],
  },
  {
    label: "Strategy / AI", color: "#a78bfa",
    agents: [
      { id: "harbor_strategy_ai",      name: "Strategy AI" },
      { id: "harbor_market_scout",     name: "Market Scout" },
      { id: "harbor_nlp_engine",       name: "NLP Engine" },
      { id: "harbor_document_ai",      name: "Document AI" },
      { id: "harbor_api_integrator",   name: "API Integrator" },
      { id: "harbor_visualizer",       name: "Visualizer" },
    ],
  },
];

// Flatten all agents with group metadata
const ALL_AGENTS = AGENT_GROUPS.flatMap(g =>
  g.agents.map(a => ({ ...a, group: g.label, color: g.color }))
);

// ─── Deterministic seeded pseudo-random (reproducible per tick) ─────────────
function seededRand(seed) {
  let x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

// ─── Generate a realistic load snapshot ────────────────────────────────────
function generateLoad(tick) {
  return ALL_AGENTS.map((agent, i) => {
    const base = 20 + seededRand(i * 7.3) * 40;           // stable baseline per agent
    const wave = Math.sin(tick * 0.08 + i * 0.9) * 18;    // slow oscillation
    const spike = seededRand(tick * 3.1 + i) > 0.91 ? 35 + seededRand(tick + i) * 40 : 0; // rare spike
    const noise = (seededRand(tick * 11 + i) - 0.5) * 12; // high-freq noise
    return Math.min(99, Math.max(1, base + wave + spike + noise));
  });
}

// ─── Heat color based on load ──────────────────────────────────────────────
function heatColor(load) {
  if (load < 25) return "#1e293b"; // idle — dark slate
  if (load < 45) return "#0e7490"; // low  — teal
  if (load < 65) return "#0891b2"; // med  — cyan
  if (load < 80) return "#f59e0b"; // high — amber
  if (load < 92) return "#ef4444"; // hot  — red
  return "#7c3aed";                // overload — violet
}

function loadLabel(l) {
  if (l < 25) return "idle";
  if (l < 45) return "low";
  if (l < 65) return "med";
  if (l < 80) return "high";
  if (l < 92) return "hot";
  return "OVLD";
}

// ─── Sparkline history display ──────────────────────────────────────────────
function Sparkline({ history, color }) {
  if (!history || history.length < 2) return null;
  const h = 28, w = 80;
  const max = 100, min = 0;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function OrchestratorLoadMap() {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loads, setLoads] = useState(() => generateLoad(0));
  const [historyMap, setHistoryMap] = useState(() =>
    Object.fromEntries(ALL_AGENTS.map(a => [a.id, [generateLoad(0)[ALL_AGENTS.indexOf(a)]]]))
  );
  const [hovered, setHovered] = useState(null);
  const [viewMode, setViewMode] = useState("heatmap"); // heatmap | bars
  const intervalRef = useRef(null);

  // ── Tick engine ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        const newLoads = generateLoad(next);
        setLoads(newLoads);
        setHistoryMap(prev => {
          const updated = { ...prev };
          ALL_AGENTS.forEach((agent, i) => {
            const arr = [...(prev[agent.id] || []), newLoads[i]];
            updated[agent.id] = arr.slice(-40); // keep last 40 ticks
          });
          return updated;
        });
        return next;
      });
    }, 600);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
  const activeAgents = loads.filter(l => l >= 25).length;
  const hotAgents = loads.filter(l => l >= 80).length;
  const topAgent = ALL_AGENTS[loads.indexOf(Math.max(...loads))];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#020818", color: "#e2e8f0" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "rgba(6,182,212,0.15)", background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Network className="w-4 h-4" style={{ color: "#a78bfa" }} />
            <span className="text-[11px] font-mono font-black tracking-widest uppercase" style={{ color: "#a78bfa" }}>Orchestrator Load Map</span>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
            {paused ? "PAUSED" : "LIVE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {["heatmap", "bars"].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all"
              style={{ background: viewMode === m ? "rgba(6,182,212,0.15)" : "transparent", color: viewMode === m ? "#06b6d4" : "#475569", border: viewMode === m ? "1px solid rgba(6,182,212,0.35)" : "1px solid transparent" }}>
              {m}
            </button>
          ))}
          <button onClick={() => setPaused(p => !p)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-px flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
        {[
          { label: "Avg Load", value: `${totalLoad.toFixed(0)}%`, color: totalLoad > 70 ? "#ef4444" : totalLoad > 45 ? "#f59e0b" : "#10b981", icon: Activity },
          { label: "Active", value: `${activeAgents}/${ALL_AGENTS.length}`, color: "#06b6d4", icon: Zap },
          { label: "Hot Agents", value: hotAgents, color: hotAgents > 3 ? "#ef4444" : "#f59e0b", icon: TrendingUp },
          { label: "Peak Agent", value: topAgent?.name || "—", color: "#a78bfa", icon: Brain },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2" style={{ background: "#020818" }}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <div>
              <p className="text-[8px] font-mono uppercase tracking-widest leading-none" style={{ color: "#334155" }}>{label}</p>
              <p className="text-xs font-black leading-tight mt-0.5" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.3)" }}>
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#334155" }}>Load:</span>
        {[
          { label: "Idle <25%", color: "#1e293b" },
          { label: "Low <45%", color: "#0e7490" },
          { label: "Med <65%", color: "#0891b2" },
          { label: "High <80%", color: "#f59e0b" },
          { label: "Hot <92%", color: "#ef4444" },
          { label: "OVLD 92%+", color: "#7c3aed" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color, border: "1px solid rgba(255,255,255,0.1)" }} />
            <span className="text-[8px] font-mono" style={{ color: "#475569" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Main visualizer */}
      <div className="flex-1 overflow-auto p-3">
        {viewMode === "heatmap" ? (
          <div className="space-y-3">
            {AGENT_GROUPS.map((group) => (
              <div key={group.label}>
                {/* Group label */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
                  <span className="text-[9px] font-mono uppercase tracking-widest font-bold" style={{ color: group.color }}>{group.label}</span>
                  <div className="flex-1 h-px" style={{ background: `${group.color}20` }} />
                </div>

                {/* Agent cells */}
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(group.agents.length, 5)}, 1fr)` }}>
                  {group.agents.map((agent) => {
                    const idx = ALL_AGENTS.findIndex(a => a.id === agent.id);
                    const load = loads[idx] ?? 0;
                    const bgColor = heatColor(load);
                    const isHot = load >= 80;
                    const isHovered = hovered === agent.id;

                    return (
                      <motion.div
                        key={agent.id}
                        layout
                        onMouseEnter={() => setHovered(agent.id)}
                        onMouseLeave={() => setHovered(null)}
                        animate={{ scale: isHovered ? 1.04 : 1 }}
                        className="relative rounded-lg p-2 cursor-default overflow-hidden"
                        style={{
                          background: bgColor,
                          border: isHot ? `1px solid ${bgColor}` : "1px solid rgba(255,255,255,0.06)",
                          boxShadow: isHot ? `0 0 10px ${bgColor}60` : "none",
                          minHeight: 64,
                        }}
                      >
                        {/* Pulse glow for hot agents */}
                        {isHot && (
                          <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="absolute inset-0 rounded-lg"
                            style={{ background: `${bgColor}40` }}
                          />
                        )}

                        <div className="relative z-10">
                          <p className="text-[9px] font-mono font-bold leading-tight text-white truncate">{agent.name}</p>
                          <div className="flex items-end justify-between mt-1.5">
                            <span className="text-[11px] font-black" style={{ color: load > 45 ? "#fff" : "#94a3b8" }}>
                              {load.toFixed(0)}%
                            </span>
                            <span className="text-[7px] font-mono uppercase" style={{ color: load > 45 ? "rgba(255,255,255,0.7)" : "#334155" }}>
                              {loadLabel(load)}
                            </span>
                          </div>
                          {/* Mini bar */}
                          <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                            <motion.div
                              animate={{ width: `${load}%` }}
                              transition={{ duration: 0.4 }}
                              className="h-full rounded-full"
                              style={{ background: load > 80 ? "#fff" : "rgba(255,255,255,0.6)" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* BAR VIEW */
          <div className="space-y-1">
            {ALL_AGENTS.map((agent, i) => {
              const load = loads[i] ?? 0;
              const history = historyMap[agent.id] || [];

              return (
                <motion.div
                  key={agent.id}
                  onMouseEnter={() => setHovered(agent.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg group transition-all"
                  style={{
                    background: hovered === agent.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Group dot */}
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: agent.color }} />

                  {/* Name */}
                  <span className="text-[10px] font-mono w-32 flex-shrink-0 truncate" style={{ color: "#64748b" }}>{agent.name}</span>

                  {/* Bar track */}
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      animate={{ width: `${load}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: heatColor(load), boxShadow: load > 80 ? `0 0 6px ${heatColor(load)}` : "none" }}
                    />
                  </div>

                  {/* Sparkline */}
                  <div className="flex-shrink-0">
                    <Sparkline history={history} color={heatColor(load)} />
                  </div>

                  {/* Load % */}
                  <span className="text-[10px] font-black w-8 text-right flex-shrink-0" style={{ color: heatColor(load) }}>
                    {load.toFixed(0)}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (() => {
          const agent = ALL_AGENTS.find(a => a.id === hovered);
          const idx = ALL_AGENTS.findIndex(a => a.id === hovered);
          const load = loads[idx] ?? 0;
          const history = historyMap[hovered] || [];
          if (!agent) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl pointer-events-none"
              style={{ background: "rgba(10,15,30,0.98)", border: `1px solid ${agent.color}40`, boxShadow: `0 0 20px ${agent.color}30`, minWidth: 200 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
                <span className="text-xs font-black text-white">{agent.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto" style={{ background: `${agent.color}15`, color: agent.color }}>{agent.group}</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-mono" style={{ color: "#475569" }}>Current Load</p>
                  <p className="text-xl font-black" style={{ color: heatColor(load) }}>{load.toFixed(1)}%</p>
                  <p className="text-[9px] font-mono uppercase" style={{ color: heatColor(load) }}>{loadLabel(load)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono mb-1" style={{ color: "#475569" }}>40-tick history</p>
                  <Sparkline history={history} color={heatColor(load)} />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[9px] font-mono" style={{ color: "#334155" }}>ID: <span style={{ color: "#475569" }}>{agent.id}</span></p>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Bottom ticker */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
        <span className="text-[9px] font-mono" style={{ color: "#1e293b" }}>
          Tick #{tick} · {ALL_AGENTS.length} agents monitored · 600ms refresh
        </span>
        <div className="flex items-center gap-3">
          {AGENT_GROUPS.map(g => (
            <div key={g.label} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} />
              <span className="text-[8px] font-mono" style={{ color: "#334155" }}>{g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}