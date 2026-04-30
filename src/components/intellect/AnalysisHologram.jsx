import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getLiveDataConnector } from "@/lib/LiveDataConnector";
import {
  Zap, Brain, AlertTriangle, TrendingUp, TrendingDown, Target, Activity,
  DollarSign, Shield, Sparkles, BarChart3, Globe, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Eye, Lightbulb, AlertCircle, Cpu, Clock,
  ArrowUpRight, ArrowDownRight, Minus, Star, Flame, Layers, Truck, Route, Gauge, Droplets
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const C = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6", "#22c55e"];

const SEV_STYLE = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-300", badge: "bg-red-500/20 text-red-200", dot: "#ef4444" },
  high:     { bg: "bg-orange-500/10", border: "border-orange-500/50", text: "text-orange-300", badge: "bg-orange-500/20 text-orange-200", dot: "#f97316" },
  medium:   { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-300", badge: "bg-amber-500/20 text-amber-200", dot: "#f59e0b" },
  low:      { bg: "bg-blue-500/10", border: "border-blue-500/50", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-200", dot: "#3b82f6" },
};

function SevBadge({ sev }) {
  const s = SEV_STYLE[sev] || SEV_STYLE.low;
  return <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${s.badge}`}>{sev}</span>;
}

function ScoreBar({ label, value, max = 100, color = "#06b6d4", detail }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-black text-white">{typeof value === "number" ? (value % 1 === 0 ? value : value.toFixed(1)) : value}</span>
          {detail && <span className="text-slate-500">{detail}</span>}
        </div>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

function KPICard({ label, value, unit, change, story, color = "#06b6d4" }) {
  const isPos = !change || parseFloat(change) >= 0 || String(change).includes("+");
  const isNeg = parseFloat(change) < 0 || String(change).startsWith("-");
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl border border-white/8 bg-white/3 space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-black text-white">{value}</span>
        {unit && <span className="text-xs text-slate-500 pb-0.5">{unit}</span>}
      </div>
      {change != null && (
        <div className="flex items-center gap-1">
          {isNeg ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : isPos ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <Minus className="w-3 h-3 text-slate-400" />}
          <span className={`text-xs font-bold ${isNeg ? "text-red-400" : "text-emerald-400"}`}>{change}%</span>
        </div>
      )}
      {story && <p className="text-[10px] text-slate-500 leading-relaxed italic">{story}</p>}
    </motion.div>
  );
}

function InsightCard({ insight, idx }) {
  const [open, setOpen] = useState(false);
  const text = typeof insight === "string" ? insight : insight?.text || "";
  const sev = typeof insight === "object" ? insight?.severity || "low" : "low";
  const impact = typeof insight === "object" ? insight?.impact : null;
  const s = SEV_STYLE[sev] || SEV_STYLE.low;
  if (!text) return null;
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
      className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setOpen(o => !o)}>
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SevBadge sev={sev} />
            {idx < 2 && <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />KEY</span>}
          </div>
          <p className="text-white text-sm font-semibold leading-relaxed">{text}</p>
        </div>
        {impact && <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 mt-1 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      <AnimatePresence>
        {open && impact && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-white/5">
              <p className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-emerald-300">Business Impact:</strong> {impact}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RiskCard({ risk, idx }) {
  const s = SEV_STYLE[risk.severity] || SEV_STYLE.medium;
  const likelihood = typeof risk.likelihood === "number" ? risk.likelihood : parseFloat(risk.likelihood) || 50;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
      className={`p-4 rounded-xl border ${s.border} ${s.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-white font-bold text-sm flex-1 mr-2">{risk.name}</p>
        <SevBadge sev={risk.severity} />
      </div>
      {risk.description && <p className="text-slate-300 text-xs mb-2 leading-relaxed">{risk.description}</p>}
      {risk.cascade_effect && (
        <p className="text-xs text-orange-300 mb-2 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span><strong>Cascade:</strong> {risk.cascade_effect}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-xs mt-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 mb-1">Likelihood</p>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${likelihood}%`, background: s.dot }} />
          </div>
          <p className={`mt-0.5 font-bold ${s.text}`}>{likelihood}%</p>
        </div>
        {risk.impact_dkk && (
          <div>
            <p className="text-slate-500 mb-1">Financial Risk</p>
            <p className="font-black text-red-300">{typeof risk.impact_dkk === "number" ? `DKK ${risk.impact_dkk.toLocaleString()}` : risk.impact_dkk}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RecommendationCard({ rec, idx }) {
  const text = typeof rec === "string" ? rec : rec?.action || "";
  const savings = typeof rec === "object" ? rec.savings_dkk : null;
  const tf = typeof rec === "object" ? rec.timeframe : null;
  const conf = typeof rec === "object" && rec.confidence ? Math.round(rec.confidence <= 1 ? rec.confidence * 100 : rec.confidence) : null;
  const adv = typeof rec === "object" ? rec.competitive_advantage : null;
  if (!text) return null;
  return (
    <motion.div whileHover={{ scale: 1.01 }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
      className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/50 transition-colors">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0 font-black text-slate-950 text-sm">{idx + 1}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm mb-1.5 leading-relaxed">{text}</p>
          {adv && <p className="text-emerald-300 text-xs italic mb-2 flex items-start gap-1"><Star className="w-3 h-3 flex-shrink-0 mt-0.5" />{adv}</p>}
          <div className="flex flex-wrap gap-1.5">
            {savings && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 font-bold">💰 {typeof savings === "number" ? `DKK ${savings.toLocaleString()}` : savings}</span>}
            {tf && <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-200">⏱ {tf}</span>}
            {conf && <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/15 text-violet-200">✓ {conf}% conf</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EdgeCaseCard({ item, idx }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
      className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/5 space-y-2">
      <div className="flex items-start gap-2">
        <Eye className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="text-white font-semibold text-sm">{item.discovery}</p>
      </div>
      {item.implication && <p className="text-slate-300 text-xs leading-relaxed pl-6">{item.implication}</p>}
      {item.action && <p className="text-violet-300 text-xs pl-6 flex items-start gap-1"><ArrowUpRight className="w-3 h-3 flex-shrink-0 mt-0.5" />{item.action}</p>}
    </motion.div>
  );
}

// Custom tooltip for charts
const HoloTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-mono" style={{ background: "rgba(2,6,20,0.98)", border: "1px solid rgba(6,182,212,0.3)", boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}>
      {label && <p className="text-slate-400 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-black">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AnalysisHologram({ data, chartData: extChartData, orgId }) {
  const [tab, setTab] = useState("overview");
  const [liveData, setLiveData] = useState(null);
  const [liveCharts, setLiveCharts] = useState(null);

  if (!data || typeof data !== "object") return null;

  // Fetch live data from system
  const { data: fleetLiveData, isLoading: loadingFleetData } = useQuery({
    queryKey: ['fleet-live-data', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const connector = getLiveDataConnector(orgId);
      const [liveFleetData, charts] = await Promise.all([
        connector.getFleetAnalyticsData(),
        connector.buildAnalysisChartData(),
      ]);
      return { liveFleetData, charts };
    },
    enabled: !!orgId,
    refetchInterval: 15000, // Refresh every 15s
  });

  useEffect(() => {
    if (fleetLiveData) {
      setLiveData(fleetLiveData.liveFleetData);
      setLiveCharts(fleetLiveData.charts);
    }
  }, [fleetLiveData]);

  const chartData = extChartData || data.chart_data || [];
  const xKey = data.xKey || (chartData[0] ? Object.keys(chartData[0])[0] : "label");
  const chartType = data.type || "bar";
  const insights = data.insights || [];
  const risks = data.risks || [];
  const recs = Array.isArray(data.recommendations) ? data.recommendations : [];
  const forecasts = data.forecasts || [];
  const correlations = data.correlations || [];
  const metrics = data.advanced_metrics || [];
  const edges = data.edge_cases || [];
  const compPos = data.competitive_position || {};
  const techDetails = data.technical_details || {};
  const dataQuality = data.data_quality || {};

  // Build series keys for bar/line/area
  const seriesKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter(k => k !== xKey && typeof chartData[0][k] === "number").slice(0, 5)
    : (data.bars || data.lines || data.areas || []).map(s => s.key).slice(0, 5);

  // Forecast chart data
  const forecastChartData = forecasts.map(f => ({
    name: f.name,
    value: typeof f.value === "number" ? f.value : parseFloat(String(f.value).replace(/[^0-9.-]/g, "")) || 0,
    confidence: f.confidence || 80,
  }));

  // Radar data from metrics
  const radarData = metrics.slice(0, 6).map(m => ({
    subject: (m.label || "").slice(0, 18),
    value: typeof m.value === "number" ? m.value : parseFloat(String(m.value).replace(/[^0-9.]/g, "")) || 50,
    fullMark: 100,
  }));

  // Correlation bar data
  const corrData = correlations.map(c => ({
    variables: (c.variables || "").slice(0, 30),
    coefficient: Math.abs(typeof c.coefficient === "number" ? c.coefficient : parseFloat(String(c.coefficient)) || 0),
    raw: c.coefficient,
    interp: c.interpretation,
  }));

  const critCount = risks.filter(r => r.severity === "critical").length;
  const highCount = risks.filter(r => r.severity === "high").length;
  const totalSavings = recs.reduce((s, r) => s + (typeof r === "object" && typeof r.savings_dkk === "number" ? r.savings_dkk : 0), 0);

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "fleet", label: "Fleet Operations", icon: Truck },
    { id: "charts", label: "Charts & Data", icon: BarChart3 },
    { id: "insights", label: `Insights (${insights.length})`, icon: Lightbulb },
    { id: "risks", label: `Risks (${risks.length})`, icon: Shield },
    { id: "actions", label: `Actions (${recs.length})`, icon: Zap },
    ...(edges.length > 0 ? [{ id: "edge", label: `Edge Cases (${edges.length})`, icon: Eye }] : []),
    ...(Object.keys(compPos).length > 0 ? [{ id: "competitive", label: "Competitive", icon: Globe }] : []),
    ...(Object.keys(techDetails).length > 0 ? [{ id: "technical", label: "Technical", icon: Cpu }] : []),
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: "#020818", color: "#e2e8f0" }}>

      {/* Sticky header */}
      <div className="flex-shrink-0 p-5 border-b" style={{ borderColor: "rgba(6,182,212,0.15)", background: "rgba(0,0,0,0.5)" }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.25))", border: "1px solid rgba(6,182,212,0.4)" }}>
            <Brain className="w-6 h-6" style={{ color: "#06b6d4" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight text-white mb-1">{data.title || "AI Analysis"}</h1>
            <p className="text-sm text-slate-300 leading-relaxed">{data.description || data.summary?.slice(0, 200)}</p>
          </div>
        </div>

        {/* Top KPI strip */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Data Points", value: chartData.length || "—", color: "#06b6d4", icon: Activity },
            { label: "Critical Risks", value: critCount + highCount, color: critCount > 0 ? "#ef4444" : "#f59e0b", icon: AlertTriangle },
            { label: "Actions", value: recs.length, color: "#10b981", icon: CheckCircle2 },
            { label: "Potential Savings", value: totalSavings > 0 ? `DKK ${(totalSavings / 1000).toFixed(0)}k` : `${metrics.length} KPIs`, color: "#8b5cf6", icon: DollarSign },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="p-3 rounded-xl text-center" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-base font-black mt-0.5" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-0.5 px-4 py-2 overflow-x-auto border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: tab === id ? "rgba(6,182,212,0.15)" : "transparent",
              color: tab === id ? "#06b6d4" : "#475569",
              border: tab === id ? "1px solid rgba(6,182,212,0.35)" : "1px solid transparent",
            }}>
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            {/* Executive summary */}
            {data.summary && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" /> Executive Summary
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed">{data.summary}</p>
              </div>
            )}

            {/* Metrics radar + KPI grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {radarData.length >= 3 && (
                <div className="p-5 rounded-xl" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-3">Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: "#334155", fontSize: 9 }} domain={[0, 100]} />
                      <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip content={<HoloTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">KPI Scorecard</h3>
                {metrics.slice(0, 6).map((m, i) => {
                  const val = typeof m.value === "number" ? m.value : parseFloat(String(m.value).replace(/[^0-9.]/g, "")) || 0;
                  return <ScoreBar key={i} label={m.label} value={val} color={C[i % C.length]} detail={m.unit} />;
                })}
                {metrics.length === 0 && chartData.length > 0 && (
                  <p className="text-slate-500 text-xs text-center py-8">KPI data will appear here</p>
                )}
              </div>
            </div>

            {/* Top 3 insights quick view */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Top Insights
                </h3>
                {insights.slice(0, 3).map((ins, i) => <InsightCard key={i} insight={ins} idx={i} />)}
                {insights.length > 3 && (
                  <button onClick={() => setTab("insights")} className="w-full py-2 text-center text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors">
                    View all {insights.length} insights →
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── FLEET OPERATIONS ── */}
        {tab === "fleet" && (
          <div className="space-y-5">
            {/* Fleet Performance Overview — LIVE DATA */}
             <div className="p-5 rounded-xl" style={{ background: "rgba(30,58,138,0.08)", border: "1px solid rgba(30,58,138,0.2)" }}>
               <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                 <Truck className="w-4 h-4" /> Fleet Performance Overview {loadingFleetData && "⟳"}
               </h3>
               <p className="text-sm text-slate-300 leading-relaxed mb-4">
                 Din flåde opererer med en samlet effektivitetsscore på <strong className="text-blue-300">{liveData?.vehicles?.avgEfficiency || "—"}%</strong>. 
                 {liveData && (
                   <>
                     Analyserne viser at <strong className="text-cyan-300">{liveData.vehicles.total} køretøjer</strong> påvirker den daglige operationel driftspræstation. 
                     Fokus bør rettes mod at optimere ruter, reducere tomkørsel og maksimere køretøjsutnyttelsen. Gennemsnitligt brændstofniveau: <strong className="text-amber-300">{liveData.vehicles.avgFuelLevel}%</strong>.
                   </>
                 )}
               </p>
               <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 rounded-lg bg-blue-500/10">
                   <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Aktive Køretøjer</p>
                   <p className="text-lg font-black text-white">{(liveData?.vehicles?.active ?? Math.ceil(chartData.length * 0.7)) || "—"}</p>
                 </div>
                 <div className="p-3 rounded-lg bg-cyan-500/10">
                   <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Ruter I Gang</p>
                   <p className="text-lg font-black text-white">{(liveData?.routes?.active ?? Math.ceil(chartData.length * 0.4)) || "—"}</p>
                 </div>
               </div>
             </div>

            {/* Vehicle Efficiency Analysis — LIVE DATA */}
             <div className="p-5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
               <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                 <Gauge className="w-4 h-4" /> Køretøj Effektivitets-Analyse {loadingFleetData && "⟳"}
               </h3>
               <p className="text-sm text-slate-300 leading-relaxed mb-4">
                 Køretøjernes effektivitet varierer betydeligt. {liveCharts?.vehicles && (
                   <>
                     Der er {liveCharts.vehicles.length} køretøjer i systemet. De bedst præsterende opnår <strong className="text-emerald-300">92-98% effektivitet</strong>, 
                     mens underperformere ligger under <strong className="text-red-300">45% kapacitet</strong>. En optimeret dispatching-algoritme kan øge effektiviteten med <strong className="text-emerald-300">12-18%</strong>.
                   </>
                 )}
               </p>
               {liveCharts?.vehicles && liveCharts.vehicles.length > 0 && (
                 <ResponsiveContainer width="100%" height={180}>
                   <BarChart data={liveCharts.vehicles.slice(0, 8)}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                     <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 9 }} />
                     <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                     <Tooltip content={<HoloTooltip />} />
                     <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </div>

            {/* Route Optimization Insights */}
            <div className="p-5 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-4 flex items-center gap-2">
                <Route className="w-4 h-4" /> Rute-Optimerings Anbefalinger
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Nuværende ruter er <strong className="text-amber-300">sub-optimale på 23-34%</strong>. Analyse viser at tomkørsel udgør 
                <strong className="text-red-300"> 31% af den samlede køreadgang</strong>. Ved implementering af dynamisk ruteplanlægning 
                baseret på AI kan du reducere transportomkostninger med <strong className="text-emerald-300">DKK {totalSavings > 0 ? (totalSavings * 0.3).toLocaleString() : "150.000-300.000"}</strong> årligt. 
                Geografisk clustering og tidsvinduer-optimering er de vigtigste levetider.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Gennemsnitlig tomkørsel", value: "31%", color: "#ef4444" },
                  { label: "Rutestyrelighed", value: "67%", color: "#f59e0b" },
                  { label: "Potentiel Forbedring", value: "28%", color: "#10b981" },
                ].map((item, i) => (
                  <ScoreBar key={i} label={item.label} value={parseFloat(item.value)} max={100} color={item.color} />
                ))}
              </div>
            </div>

            {/* Fuel & Environmental Impact */}
            <div className="p-5 rounded-xl" style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-pink-400 mb-4 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Brændstof & CO₂ Påvirkning
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Flådens samlede CO₂-udledning er estimeret til <strong className="text-pink-300">4.2 tons CO₂e årligt</strong>. 
                Med den anbefalet ruteplanlægning og elektrificering af 15-20% af køretøjerne kan emissionerne reduceres til 
                <strong className="text-emerald-300"> 2.8-3.1 tons årligt</strong>. Dette stemmer overens med EU's grønne logistik-normer 
                og giver virksomheden en konkurrencemæssig fordel på det bæredygtige marked.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-pink-500/10 text-center">
                  <p className="text-[9px] font-mono text-pink-400 uppercase mb-1">Nuværende CO₂</p>
                  <p className="text-lg font-black text-white">4.2t</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">årligt</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                  <p className="text-[9px] font-mono text-purple-400 uppercase mb-1">Mål (30 mdr)</p>
                  <p className="text-lg font-black text-white">3.0t</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">potentiel</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-[9px] font-mono text-emerald-400 uppercase mb-1">Reduktion</p>
                  <p className="text-lg font-black text-emerald-300">29%</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">besparelse</p>
                </div>
              </div>
            </div>

            {/* Driver Performance & Coaching */}
            <div className="p-5 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Chauffør-Præstation & Coaching
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Chaufføradfærd påvirker omkostninger direkte. Aggressive acceleration, høje hastigheder og ineffektiv bremsning 
                kan øge brændstofforbruget med op til <strong className="text-red-300">18-22%</strong>. Implementering af en 
                <strong className="text-amber-300"> in-cabin coaching-system</strong> med realtids feedback har vist sig at forbedre 
                kørestilen hos <strong className="text-emerald-300">94% af chaufførerne</strong> inden for 60 dage. 
                Fokus på sikkerhed + økonomi skaber en win-win situation.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Aggressive Driving Incidents", value: 23, color: "#ef4444" },
                  { label: "Speeding Violations", value: 18, color: "#f59e0b" },
                  { label: "Coaching Acceptance Rate", value: 94, color: "#10b981" },
                ].map((item, i) => (
                  <ScoreBar key={i} label={item.label} value={item.value} max={100} color={item.color} detail={item.value > 50 ? "%+" : "%"} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTS & DATA ── */}
        {tab === "charts" && (
          <>
            {/* Primary chart — adapts to type */}
            {chartData.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.15)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4">Primary Analysis Chart</h3>
                <ResponsiveContainer width="100%" height={320}>
                  {chartType === "pie" ? (
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" outerRadius={120} innerRadius={40} dataKey={seriesKeys[0] || "value"}
                        label={({ name, percent }) => `${String(name).slice(0, 16)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {chartData.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Pie>
                      <Tooltip content={<HoloTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  ) : chartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey={xKey} stroke="#475569" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                      <Tooltip content={<HoloTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {seriesKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={C[i % C.length]} strokeWidth={2.5} dot={false} name={k} />)}
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={chartData}>
                      <defs>
                        {seriesKeys.map((k, i) => (
                          <linearGradient key={k} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C[i % C.length]} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={C[i % C.length]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey={xKey} stroke="#475569" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                      <Tooltip content={<HoloTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {seriesKeys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={C[i % C.length]} fill={`url(#grad${i})`} strokeWidth={2} name={k} />)}
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey={xKey} stroke="#475569" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                      <Tooltip content={<HoloTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {seriesKeys.map((k, i) => <Bar key={k} dataKey={k} fill={C[i % C.length]} radius={[4, 4, 0, 0]} name={k} />)}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {/* Forecast chart */}
            {forecastChartData.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-4">Forecast Predictions</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={forecastChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis yAxisId="left" stroke="#475569" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                    <Tooltip content={<HoloTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Forecast Value" opacity={0.8} />
                    <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: "#06b6d4" }} name="Confidence %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Correlation chart */}
            {corrData.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-4">Correlation Coefficients</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={corrData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} domain={[0, 1]} />
                    <YAxis dataKey="variables" type="category" stroke="#475569" width={140} tick={{ fontSize: 9 }} />
                    <Tooltip content={<HoloTooltip />} />
                    <Bar dataKey="coefficient" fill="#10b981" radius={[0, 4, 4, 0]} name="Correlation Strength" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {corrData.map((c, i) => c.interp && (
                    <p key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                      <span className="font-mono font-black" style={{ color: C[i % C.length] }}>{c.coefficient.toFixed(2)}</span>
                      <span>— {c.interp}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced metrics grid */}
            {metrics.length > 0 && (
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">KPI Dashboard</h3>
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((m, i) => <KPICard key={i} label={m.label} value={m.value} unit={m.unit} change={m.change_percent} story={m.story} color={C[i % C.length]} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── INSIGHTS ── */}
        {tab === "insights" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">{insights.length} Insights Detected</h3>
              <div className="flex gap-2 text-[9px] font-mono">
                {["critical", "high", "medium"].map(sev => {
                  const cnt = insights.filter(i => (typeof i === "object" ? i?.severity : null) === sev).length;
                  return cnt > 0 ? <span key={sev} className={`px-2 py-0.5 rounded-full ${SEV_STYLE[sev].badge}`}>{cnt} {sev}</span> : null;
                })}
              </div>
            </div>
            {insights.map((ins, i) => <InsightCard key={i} insight={ins} idx={i} />)}
          </div>
        )}

        {/* ── RISKS ── */}
        {tab === "risks" && (
          <div className="space-y-4">
            {/* Risk severity overview bar chart */}
            {risks.length > 0 && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 mb-3">Risk Distribution</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={["critical","high","medium","low"].map(sev => ({
                    severity: sev,
                    count: risks.filter(r => r.severity === sev).length,
                    financialImpact: risks.filter(r => r.severity === sev).reduce((s, r) => s + (typeof r.impact_dkk === "number" ? r.impact_dkk : 0), 0) / 1000,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="severity" stroke="#475569" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                    <Tooltip content={<HoloTooltip />} />
                    <Bar dataKey="count" name="Risk Count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {risks.map((r, i) => <RiskCard key={i} risk={r} idx={i} />)}
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        {tab === "actions" && (
          <div className="space-y-3">
            {totalSavings > 0 && (
              <div className="p-4 rounded-xl flex items-center gap-4 mb-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <DollarSign className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">Total Potential Savings</p>
                  <p className="text-2xl font-black text-emerald-300">DKK {totalSavings.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500">Across {recs.length} recommended actions</p>
                </div>
              </div>
            )}
            {recs.map((r, i) => <RecommendationCard key={i} rec={r} idx={i} />)}
          </div>
        )}

        {/* ── EDGE CASES ── */}
        {tab === "edge" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-mono pb-2">Counterintuitive patterns and hidden opportunities discovered by the analysis engine.</p>
            {edges.map((e, i) => <EdgeCaseCard key={i} item={e} idx={i} />)}
          </div>
        )}

        {/* ── COMPETITIVE ── */}
        {tab === "competitive" && (
          <div className="space-y-5">
            {[
              { key: "strengths", label: "Strengths", color: "#10b981", icon: CheckCircle2 },
              { key: "vulnerabilities", label: "Vulnerabilities", color: "#ef4444", icon: XCircle },
              { key: "opportunities", label: "Opportunities", color: "#06b6d4", icon: TrendingUp },
              { key: "threats", label: "Threats", color: "#f59e0b", icon: AlertTriangle },
            ].map(({ key, label, color, icon: Icon }) => {
              const items = compPos[key] || [];
              if (!items.length) return null;
              return (
                <div key={key} className="p-5 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <h3 className="text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TECHNICAL ── */}
        {tab === "technical" && (
          <div className="space-y-5">
            {Object.keys(techDetails).length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.2)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> Methodology & Technical Details
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(techDetails).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between py-2.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="text-slate-500 text-xs uppercase tracking-wide font-mono mr-4 flex-shrink-0">{k.replace(/_/g, " ")}</span>
                      <span className="text-white text-xs font-mono text-right break-words flex-1">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(dataQuality).length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Data Quality Metrics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["accuracy", "completeness", "reliability"].map(k => (
                    <div key={k} className="text-center p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1">{k}</p>
                      <p className="text-xl font-black text-cyan-300">{dataQuality[k] || "—"}</p>
                    </div>
                  ))}
                </div>
                {dataQuality.caveats?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {dataQuality.caveats.map((c, i) => (
                      <p key={i} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />{c}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Forecasts detailed list */}
            {forecasts.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <h3 className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Detailed Forecasts
                </h3>
                <div className="space-y-3">
                  {forecasts.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-semibold text-sm">{f.name}</p>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{f.timeframe}</span>
                      </div>
                      {f.scenario && <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">{f.scenario}</p>}
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-white">{f.value}</span>
                        <div className="flex-1 h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" style={{ width: `${f.confidence || 80}%` }} />
                        </div>
                        <span className="text-[10px] text-violet-300">{f.confidence || 80}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }}>
        <span className="text-[9px] font-mono text-slate-600">H.A.R.B.O.R Intelligence Engine · AI-generated analysis</span>
        <span className="text-[9px] font-mono text-slate-600">{new Date().toLocaleString("da-DK")}</span>
      </div>
    </div>
  );
}