import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Play, Pause, Brain, Zap, Target, TrendingUp, AlertTriangle,
  ChevronRight, Plus, Trash2, RefreshCw, Loader2, BarChart2,
  Globe, Settings, CheckCircle2, Clock, ArrowUpRight, X, Cpu
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ── Neon card shell ─────────────────────────────────────────────────
function NeonCard({ children, className = "", color = "#06b6d4" }) {
  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden ${className}`}
      style={{ background: "rgba(2,8,20,0.85)", borderColor: `${color}20`, boxShadow: `0 0 30px ${color}08` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${color}06 0%, transparent 60%)` }} />
      {children}
    </div>
  );
}

// ── Dimension sliders ───────────────────────────────────────────────
const LEVERS = [
  { id: "org_growth", label: "Org Acquisition Rate", unit: "%/mo", min: -10, max: 50, default: 10, color: "#06b6d4", icon: Globe },
  { id: "vehicle_growth", label: "Fleet Expansion / Org", unit: "%/mo", min: -5, max: 30, default: 8, color: "#10b981", icon: Zap },
  { id: "churn", label: "Customer Churn Rate", unit: "%/mo", min: 0, max: 20, default: 2, color: "#ef4444", icon: AlertTriangle },
  { id: "arpu_change", label: "ARPU Change", unit: "%/mo", min: -10, max: 25, default: 3, color: "#f59e0b", icon: TrendingUp },
  { id: "addon_adoption", label: "Add-on Adoption", unit: "% orgs", min: 0, max: 100, default: 20, color: "#8b5cf6", icon: Layers },
  { id: "api_usage", label: "API Usage Growth", unit: "%/mo", min: 0, max: 60, default: 15, color: "#ec4899", icon: Cpu },
  { id: "market_expansion", label: "Market Expansion (new geo)", unit: "x factor", min: 1, max: 5, default: 1, color: "#22c55e", icon: Globe },
  { id: "competitor_pressure", label: "Competitive Pressure", unit: "1-10", min: 1, max: 10, default: 4, color: "#94a3b8", icon: Target },
];

const PRESET_SCENARIOS = [
  {
    id: "aggressive_growth", label: "Aggressive Growth", color: "#10b981", icon: "🚀",
    description: "Max growth, minimal churn risk. Best-case execution.",
    values: { org_growth: 35, vehicle_growth: 22, churn: 1.2, arpu_change: 12, addon_adoption: 55, api_usage: 45, market_expansion: 2.5, competitor_pressure: 5 }
  },
  {
    id: "steady_state", label: "Steady State", color: "#06b6d4", icon: "⚖️",
    description: "Sustainable, predictable trajectory. Balanced.",
    values: { org_growth: 10, vehicle_growth: 8, churn: 2, arpu_change: 3, addon_adoption: 20, api_usage: 15, market_expansion: 1, competitor_pressure: 4 }
  },
  {
    id: "competitive_war", label: "Competitive War", color: "#f59e0b", icon: "⚔️",
    description: "Heavy pressure from Samsara/Motive. Price war scenario.",
    values: { org_growth: 5, vehicle_growth: 3, churn: 7, arpu_change: -5, addon_adoption: 10, api_usage: 8, market_expansion: 1, competitor_pressure: 9 }
  },
  {
    id: "market_disruption", label: "Market Disruption", color: "#8b5cf6", icon: "🌊",
    description: "NexusVectis disrupts with breakthrough AI. Viral growth.",
    values: { org_growth: 45, vehicle_growth: 30, churn: 0.8, arpu_change: 18, addon_adoption: 70, api_usage: 60, market_expansion: 3.5, competitor_pressure: 6 }
  },
];

// Simulate future state from current data + levers
function runSimulation(baseData, levers, months) {
  const { orgs, mrr, vehicles } = baseData;
  const timeline = [];

  let currentOrgs = orgs;
  let currentMRR = mrr;
  let currentVehicles = vehicles;

  for (let m = 0; m < months; m++) {
    const orgGain = currentOrgs * (levers.org_growth / 100);
    const churnLoss = currentOrgs * (levers.churn / 100);
    const netOrgDelta = orgGain - churnLoss;

    currentOrgs = Math.max(1, currentOrgs + netOrgDelta);
    currentVehicles = currentVehicles * (1 + levers.vehicle_growth / 100);

    const addonRevenue = currentOrgs * (levers.addon_adoption / 100) * 2000 / 12;
    const apiRevenue = currentVehicles * (levers.api_usage / 100) * 0.5;
    const baseMRR = currentOrgs * (currentMRR / orgs) * (1 + levers.arpu_change / 100);
    currentMRR = (baseMRR + addonRevenue * 0.1 + apiRevenue) * levers.market_expansion;

    const noise = 1 + (Math.sin(m * 1.3) * 0.03);
    timeline.push({
      month: m + 1,
      orgs: Math.round(currentOrgs),
      mrr: Math.round(currentMRR * noise),
      vehicles: Math.round(currentVehicles),
      health: Math.min(100, Math.max(0, 70 + (levers.org_growth - levers.churn * 2 - levers.competitor_pressure) * 1.2)),
    });
  }
  return timeline;
}

// Multi-dimensional outcome radar
function OutcomeRadar({ scenarios }) {
  const dimensions = ["Revenue", "Growth", "Resilience", "Market Share", "Profitability", "Innovation"];
  const data = dimensions.map((dim, i) => {
    const row = { dimension: dim };
    scenarios.forEach(s => {
      const seed = s.id.charCodeAt(0);
      row[s.id] = Math.min(100, Math.max(10, 40 + (seed + i * 11) % 55 + Object.values(s.values)[i % 8] * 0.5));
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#64748b", fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        {scenarios.map(s => (
          <Radar key={s.id} name={s.label} dataKey={s.id} stroke={s.color} fill={s.color} fillOpacity={0.12} strokeWidth={1.5} />
        ))}
        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default function AdminScenarioSimulator() {
  const [levers, setLevers] = useState(Object.fromEntries(LEVERS.map(l => [l.id, l.default])));
  const [months, setMonths] = useState(18);
  const [activePreset, setActivePreset] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiNarrative, setAiNarrative] = useState(null);
  const [comparePresets, setComparePresets] = useState(["aggressive_growth", "steady_state"]);
  const [simulating, setSimulating] = useState(false);
  const [animFrame, setAnimFrame] = useState(0);

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["allVehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const baseData = useMemo(() => {
    const paid = invoices.filter(i => i.status === "paid");
    const lastMonthInvoices = paid.filter(i => {
      const d = new Date(i.created_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() - 1;
    });
    const mrr = lastMonthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0) || 5000;
    return { orgs: Math.max(organizations.length, 1), mrr, vehicles: Math.max(vehicles.length, 10) };
  }, [organizations, invoices, vehicles]);

  // Run simulation for current levers
  const simData = useMemo(() => runSimulation(baseData, levers, months), [baseData, levers, months]);

  // Run all preset simulations for comparison
  const presetSimData = useMemo(() => {
    return PRESET_SCENARIOS.map(p => ({
      ...p,
      sim: runSimulation(baseData, p.values, months),
    }));
  }, [baseData, months]);

  const selectedPresetSims = presetSimData.filter(p => comparePresets.includes(p.id));

  // Animate simulation on mount
  useEffect(() => {
    setSimulating(true);
    const t = setTimeout(() => setSimulating(false), 800);
    return () => clearTimeout(t);
  }, [levers, months]);

  const applyPreset = (preset) => {
    setLevers(preset.values);
    setActivePreset(preset.id);
  };

  const runAINarrative = async () => {
    setAiRunning(true);
    try {
      const endState = simData[simData.length - 1];
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic AI advisor simulating the future of NexusVectis, a European enterprise fleet AI platform.

Simulation parameters over ${months} months:
- Org acquisition: +${levers.org_growth}%/month
- Fleet growth: +${levers.vehicle_growth}%/month  
- Churn: ${levers.churn}%/month
- ARPU change: +${levers.arpu_change}%/month
- Add-on adoption: ${levers.addon_adoption}%
- API growth: +${levers.api_usage}%/month
- Market expansion: ${levers.market_expansion}x
- Competitive pressure: ${levers.competitor_pressure}/10

Projected outcome in ${months} months:
- Organizations: ${endState.orgs}
- Monthly Revenue: €${endState.mrr.toLocaleString()}
- Vehicles tracked: ${endState.vehicles}
- Health score: ${endState.health}/100

Provide a JSON strategic narrative:
- headline: one punchy strategic statement (max 15 words)
- verdict: "strong" | "risky" | "critical" | "exceptional"  
- narrative: 3-paragraph strategic analysis of this trajectory
- key_milestones: array of 4 inflection points to watch (month, event, action_required)
- strategic_moves: array of 3 moves to execute RIGHT NOW to improve this trajectory
- biggest_risk: the single biggest risk in this simulation and how to hedge it`,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            verdict: { type: "string" },
            narrative: { type: "string" },
            key_milestones: { type: "array", items: { type: "object" } },
            strategic_moves: { type: "array", items: { type: "object" } },
            biggest_risk: { type: "string" }
          }
        },
        model: "claude_sonnet_4_6"
      });
      setAiNarrative(res);
      toast.success("AI Strategic Narrative generated");
    } catch {
      toast.error("AI analysis failed");
    }
    setAiRunning(false);
  };

  const endState = simData[simData.length - 1] || {};
  const verdictColors = { strong: "#10b981", exceptional: "#06b6d4", risky: "#f59e0b", critical: "#ef4444" };

  return (
    <AdminLayout currentPage="AdminScenarioSimulator">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
                <Layers className="w-5 h-5 text-violet-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Strategic Scenario Simulator</h1>
            </div>
            <p className="text-slate-400 text-sm">Multi-dimensional simulation engine — model any future, 10 moves ahead of competitors</p>
          </div>
          <Button onClick={runAINarrative} disabled={aiRunning}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white gap-2">
            {aiRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {aiRunning ? "Simulating..." : "AI Strategic Narrative"}
          </Button>
        </div>

        {/* Preset scenarios */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {PRESET_SCENARIOS.map(p => (
            <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => applyPreset(p)}
              className="p-4 rounded-2xl border text-left transition-all"
              style={{
                background: activePreset === p.id ? `${p.color}10` : "rgba(2,8,20,0.7)",
                borderColor: activePreset === p.id ? `${p.color}40` : "rgba(51,65,85,0.3)",
                boxShadow: activePreset === p.id ? `0 0 20px ${p.color}15` : "none"
              }}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <p className="text-white text-sm font-bold">{p.label}</p>
              <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{p.description}</p>
              {activePreset === p.id && <Badge className="mt-2 text-[8px]" style={{ background: `${p.color}20`, color: p.color, borderColor: `${p.color}30` }}>ACTIVE</Badge>}
            </motion.button>
          ))}
        </div>

        {/* Two-column layout: levers + output */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Levers panel */}
          <div className="col-span-1">
            <NeonCard color="#8b5cf6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Simulation Levers</h3>
                <button onClick={() => { setLevers(Object.fromEntries(LEVERS.map(l => [l.id, l.default]))); setActivePreset(null); }}
                  className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 border border-slate-800 px-2 py-0.5 rounded-lg">Reset</button>
              </div>
              <div className="space-y-4">
                {LEVERS.map(lever => {
                  const Icon = lever.icon;
                  const val = levers[lever.id];
                  const pct = ((val - lever.min) / (lever.max - lever.min)) * 100;
                  return (
                    <div key={lever.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3 opacity-60" style={{ color: lever.color }} />
                          <span className="text-slate-400 text-[10px]">{lever.label}</span>
                        </div>
                        <span className="text-white text-xs font-bold font-mono">{val}{lever.unit.includes("%") ? "%" : lever.unit.includes("x") ? "x" : ""}</span>
                      </div>
                      <input type="range" min={lever.min} max={lever.max} step={0.5} value={val}
                        onChange={e => { setLevers(prev => ({ ...prev, [lever.id]: parseFloat(e.target.value) })); setActivePreset(null); }}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, ${lever.color} ${pct}%, #1e293b ${pct}%)` }} />
                    </div>
                  );
                })}
              </div>

              {/* Horizon */}
              <div className="mt-5 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-[10px]">Forecast Horizon</span>
                  <span className="text-white text-xs font-mono font-bold">{months} months</span>
                </div>
                <div className="flex gap-1.5">
                  {[6, 12, 18, 24, 36].map(m => (
                    <button key={m} onClick={() => setMonths(m)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-mono border transition-all ${months === m ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-white"}`}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </NeonCard>
          </div>

          {/* Output panel */}
          <div className="col-span-2 space-y-4">
            {/* Projected end-state KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Orgs at end", value: endState.orgs?.toLocaleString(), base: baseData.orgs, color: "#06b6d4" },
                { label: "MRR at end", value: `€${(endState.mrr || 0).toLocaleString()}`, base: `€${baseData.mrr.toLocaleString()}`, color: "#10b981" },
                { label: "Vehicles", value: endState.vehicles?.toLocaleString(), base: baseData.vehicles, color: "#f59e0b" },
                { label: "Health Score", value: `${endState.health || 0}/100`, base: "70/100", color: endState.health > 70 ? "#10b981" : endState.health > 40 ? "#f59e0b" : "#ef4444" },
              ].map((k, i) => (
                <div key={i} className="p-3 rounded-xl border bg-slate-900/50" style={{ borderColor: `${k.color}20` }}>
                  <p className="text-xl font-black" style={{ color: k.color }}>{k.value || "—"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{k.label}</p>
                  <p className="text-[9px] text-slate-600 mt-1">Now: {k.base}</p>
                </div>
              ))}
            </div>

            {/* Simulation chart */}
            <NeonCard color="#06b6d4">
              <h3 className="text-white font-semibold text-sm mb-3">Simulated Trajectory</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={simData}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 8 }} label={{ value: "months", position: "insideRight", fill: "#475569", fontSize: 9 }} />
                  <YAxis yAxisId="left" stroke="#334155" tick={{ fontSize: 8 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#334155" tick={{ fontSize: 8 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }}
                    formatter={(v, n) => [n === "mrr" ? `€${v.toLocaleString()}` : v, n === "mrr" ? "MRR" : n === "orgs" ? "Orgs" : "Vehicles"]} />
                  <Area yAxisId="left" type="monotone" dataKey="mrr" stroke="#06b6d4" fill="url(#mrrGrad)" strokeWidth={2} name="mrr" />
                  <Area yAxisId="right" type="monotone" dataKey="orgs" stroke="#10b981" fill="url(#orgGrad)" strokeWidth={1.5} name="orgs" />
                </AreaChart>
              </ResponsiveContainer>
            </NeonCard>
          </div>
        </div>

        {/* Multi-scenario comparison */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <NeonCard color="#f59e0b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Scenario Comparison — MRR</h3>
              <div className="flex gap-1.5">
                {PRESET_SCENARIOS.map(p => (
                  <button key={p.id}
                    onClick={() => setComparePresets(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="px-2 py-0.5 rounded text-[9px] border transition-all"
                    style={{
                      background: comparePresets.includes(p.id) ? `${p.color}15` : "transparent",
                      borderColor: comparePresets.includes(p.id) ? `${p.color}30` : "#334155",
                      color: comparePresets.includes(p.id) ? p.color : "#64748b"
                    }}>
                    {p.icon}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" type="number" domain={[1, months]} stroke="#334155" tick={{ fontSize: 8 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 8 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }}
                  formatter={(v) => [`€${v.toLocaleString()}`, "MRR"]} />
                {selectedPresetSims.map(p => (
                  <Line key={p.id} data={p.sim} type="monotone" dataKey="mrr" stroke={p.color} strokeWidth={2} dot={false} name={p.label} />
                ))}
                <Line data={simData} type="monotone" dataKey="mrr" stroke="#ffffff" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="Custom" />
              </LineChart>
            </ResponsiveContainer>
          </NeonCard>

          <NeonCard color="#8b5cf6">
            <h3 className="text-white font-semibold mb-4">Multi-Dimensional Outcome Radar</h3>
            <OutcomeRadar scenarios={selectedPresetSims.length > 0 ? selectedPresetSims : PRESET_SCENARIOS.slice(0, 2)} />
          </NeonCard>
        </div>

        {/* AI Narrative */}
        <AnimatePresence>
          {aiNarrative && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <NeonCard color="#8b5cf6">
                <div className="flex items-center gap-3 mb-5">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <div>
                    <h3 className="text-white font-bold">AI Strategic Narrative</h3>
                    {aiNarrative.headline && <p className="text-violet-300 text-sm">{aiNarrative.headline}</p>}
                  </div>
                  {aiNarrative.verdict && (
                    <Badge className="ml-auto text-xs font-bold px-3 py-1"
                      style={{ background: `${verdictColors[aiNarrative.verdict] || "#06b6d4"}20`, color: verdictColors[aiNarrative.verdict] || "#06b6d4", borderColor: `${verdictColors[aiNarrative.verdict] || "#06b6d4"}30` }}>
                      {aiNarrative.verdict?.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {aiNarrative.narrative && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/40 mb-5">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{aiNarrative.narrative}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-5">
                  {/* Key milestones */}
                  <div>
                    <p className="text-violet-400 text-xs font-mono uppercase tracking-wider mb-3">◆ Key Milestones</p>
                    <div className="space-y-2">
                      {(aiNarrative.key_milestones || []).map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-violet-400" />
                            <span className="text-violet-300 text-[10px] font-mono">Month {m.month || i * 4 + 4}</span>
                          </div>
                          <p className="text-white text-xs font-semibold">{m.event}</p>
                          {m.action_required && <p className="text-slate-400 text-[10px] mt-1">{m.action_required}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic moves */}
                  <div>
                    <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-3">⚡ Execute NOW</p>
                    <div className="space-y-2">
                      {(aiNarrative.strategic_moves || []).map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                          <p className="text-white text-xs font-semibold">{m.title || m.move}</p>
                          <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{m.description || m.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Biggest risk */}
                  <div>
                    <p className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3">☠ Critical Risk</p>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 h-[calc(100%-28px)]">
                      <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
                      <p className="text-slate-300 text-sm leading-relaxed">{aiNarrative.biggest_risk}</p>
                    </div>
                  </div>
                </div>
              </NeonCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}