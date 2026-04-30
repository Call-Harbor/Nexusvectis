import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, Zap, Brain, BarChart2,
  Target, AlertTriangle, CheckCircle2, ArrowUpRight, Loader2,
  Calendar, Building2, RefreshCw, Layers, ChevronRight, Star
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Scatter, ScatterChart, ZAxis
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function NeonCard({ children, className = "", color = "#06b6d4" }) {
  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden ${className}`}
      style={{ background: "rgba(2,8,20,0.85)", borderColor: `${color}20`, boxShadow: `0 0 30px ${color}08` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${color}06 0%, transparent 60%)` }} />
      {children}
    </div>
  );
}

const GROWTH_SCENARIOS = {
  conservative: { label: "Conservative", color: "#64748b", multiplier: 1.05, probability: 0.25 },
  base: { label: "Base Case", color: "#06b6d4", multiplier: 1.15, probability: 0.5 },
  optimistic: { label: "Optimistic", color: "#10b981", multiplier: 1.28, probability: 0.2 },
  moonshot: { label: "Moon Shot", color: "#f59e0b", multiplier: 1.55, probability: 0.05 },
};

export default function AdminRevenueEngine() {
  const [forecastMonths, setForecastMonths] = useState(12);
  const [activeScenario, setActiveScenario] = useState("base");
  const [forecasting, setForecasting] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date"),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["allVehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Revenue analytics
  const analytics = useMemo(() => {
    const paid = invoices.filter(i => i.status === "paid");
    const totalRevenue = paid.reduce((s, i) => s + (i.total_amount || 0), 0);
    const avgInvoice = paid.length > 0 ? totalRevenue / paid.length : 0;

    // Monthly revenue
    const monthlyMap = {};
    paid.forEach(inv => {
      const key = inv.period_month || inv.created_date?.slice(0, 7);
      if (key) monthlyMap[key] = (monthlyMap[key] || 0) + (inv.total_amount || 0);
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-18)
      .map(([month, revenue]) => ({ month: month.slice(5), revenue: Math.round(revenue) }));

    // MoM growth
    const recentMonths = monthlyRevenue.slice(-3);
    const prevMonths = monthlyRevenue.slice(-6, -3);
    const recentAvg = recentMonths.reduce((s, m) => s + m.revenue, 0) / Math.max(recentMonths.length, 1);
    const prevAvg = prevMonths.reduce((s, m) => s + m.revenue, 0) / Math.max(prevMonths.length, 1);
    const momGrowth = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

    // Per-org revenue
    const orgRevenue = organizations.map(org => {
      const orgInvoices = paid.filter(i => i.organization_id === org.id);
      const rev = orgInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      const vCount = vehicles.filter(v => v.organization_id === org.id).length;
      return { ...org, revenue: rev, invoiceCount: orgInvoices.length, vehicleCount: vCount, arpu: orgInvoices.length > 0 ? rev / orgInvoices.length : 0 };
    }).sort((a, b) => b.revenue - a.revenue);

    // MRR estimate
    const lastMonth = recentMonths[recentMonths.length - 1]?.revenue || 0;

    return { totalRevenue, avgInvoice, monthlyRevenue, momGrowth, orgRevenue, mrr: lastMonth, recentAvg };
  }, [invoices, organizations, vehicles]);

  // Forecast generator
  const forecastData = useMemo(() => {
    const scenario = GROWTH_SCENARIOS[activeScenario];
    const base = analytics.mrr || analytics.recentAvg || 1000;
    const monthlyGrowth = Math.pow(scenario.multiplier, 1 / 12) - 1;

    const historicalLast3 = analytics.monthlyRevenue.slice(-3).map((m, i) => ({
      month: m.month,
      actual: m.revenue,
      forecast: null,
      type: "actual",
    }));

    const future = Array.from({ length: forecastMonths }, (_, i) => {
      const projected = base * Math.pow(1 + monthlyGrowth, i + 1);
      const month = new Date();
      month.setMonth(month.getMonth() + i + 1);
      return {
        month: `${String(month.getMonth() + 1).padStart(2, "0")}/${month.getFullYear().toString().slice(2)}`,
        actual: null,
        forecast: Math.round(projected),
        lower: Math.round(projected * 0.88),
        upper: Math.round(projected * 1.12),
        type: "forecast",
      };
    });

    return [...historicalLast3, ...future];
  }, [activeScenario, forecastMonths, analytics]);

  const endRevenue = forecastData[forecastData.length - 1]?.forecast || 0;
  const currentMRR = analytics.mrr || analytics.recentAvg || 0;
  const uplift = currentMRR > 0 ? ((endRevenue - currentMRR) / currentMRR) * 100 : 0;

  const runAIForecast = async () => {
    setForecasting(true);
    try {
      const orgSummary = analytics.orgRevenue.slice(0, 5).map(o => `${o.name}: €${o.revenue.toFixed(0)}, ${o.vehicleCount} vehicles`).join("; ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a SaaS revenue intelligence analyst. Analyze this fleet management platform's financials and give deep insights.

Data:
- Total Revenue: €${analytics.totalRevenue.toFixed(0)}
- MRR (est.): €${currentMRR.toFixed(0)}
- MoM Growth: ${analytics.momGrowth.toFixed(1)}%
- Active Orgs: ${organizations.length}
- Top Customers: ${orgSummary}
- Active Scenario: ${activeScenario} (${(GROWTH_SCENARIOS[activeScenario].multiplier * 100 - 100).toFixed(0)}% annual growth target)

Provide a JSON with:
- executive_summary: 2-sentence strategic assessment
- revenue_risks: array of 3 specific revenue risks (title, description, impact_eur)
- growth_levers: array of 3 highest-ROI growth actions (title, description, projected_uplift_pct)
- churn_signals: array of 2 early warning indicators to watch
- pricing_recommendation: specific pricing strategy recommendation
- expansion_moves: top 2 expansion revenue opportunities (upsell/cross-sell)`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            revenue_risks: { type: "array", items: { type: "object" } },
            growth_levers: { type: "array", items: { type: "object" } },
            churn_signals: { type: "array", items: { type: "object" } },
            pricing_recommendation: { type: "string" },
            expansion_moves: { type: "array", items: { type: "object" } }
          }
        }
      });
      setAiInsights(res);
      toast.success("AI Revenue Analysis complete");
    } catch {
      toast.error("Analysis failed");
    }
    setForecasting(false);
  };

  return (
    <AdminLayout currentPage="AdminRevenueEngine">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Revenue Forecasting Engine</h1>
            </div>
            <p className="text-slate-400 text-sm">Multi-scenario MRR forecasting, cohort analysis & AI-powered revenue intelligence</p>
          </div>
          <Button onClick={runAIForecast} disabled={forecasting}
            className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white gap-2">
            {forecasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {forecasting ? "Analyzing..." : "AI Revenue Analysis"}
          </Button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `€${analytics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "#10b981" },
            { label: "Est. MRR", value: `€${currentMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "#06b6d4" },
            { label: "MoM Growth", value: `${analytics.momGrowth >= 0 ? "+" : ""}${analytics.momGrowth.toFixed(1)}%`, icon: analytics.momGrowth >= 0 ? TrendingUp : TrendingDown, color: analytics.momGrowth >= 0 ? "#10b981" : "#ef4444" },
            { label: "Avg Invoice", value: `€${analytics.avgInvoice.toFixed(0)}`, icon: BarChart2, color: "#f59e0b" },
            { label: "Customers", value: organizations.length, icon: Building2, color: "#8b5cf6" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <NeonCard color={kpi.color}>
                <kpi.icon className="w-4 h-4 mb-2 opacity-60" style={{ color: kpi.color }} />
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
              </NeonCard>
            </motion.div>
          ))}
        </div>

        {/* Scenario selector */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-slate-500 text-xs font-mono uppercase mr-1">Scenario:</span>
          {Object.entries(GROWTH_SCENARIOS).map(([key, s]) => (
            <button key={key} onClick={() => setActiveScenario(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                background: activeScenario === key ? `${s.color}15` : "rgba(15,23,42,0.5)",
                borderColor: activeScenario === key ? `${s.color}40` : "rgba(51,65,85,0.4)",
                color: activeScenario === key ? s.color : "#64748b"
              }}>
              {s.label}
              <span className="text-[9px] opacity-60">p={s.probability}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 text-xs">Horizon:</span>
            {[6, 12, 18, 24].map(m => (
              <button key={m} onClick={() => setForecastMonths(m)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${forecastMonths === m ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-slate-900/40 border-slate-800 text-slate-500"}`}>
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Forecast chart */}
        <NeonCard color={GROWTH_SCENARIOS[activeScenario].color} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold">Revenue Forecast — {GROWTH_SCENARIOS[activeScenario].label} Scenario</h3>
              <p className="text-slate-400 text-xs">{forecastMonths}-month projection with confidence band · p={GROWTH_SCENARIOS[activeScenario].probability * 100}% probability</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: GROWTH_SCENARIOS[activeScenario].color }}>€{endRevenue.toLocaleString()}</p>
              <p className="text-xs text-slate-400">projected MRR at end</p>
              <p className="text-xs" style={{ color: uplift >= 0 ? "#10b981" : "#ef4444" }}>
                {uplift >= 0 ? "+" : ""}{uplift.toFixed(1)}% vs current
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={forecastData}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GROWTH_SCENARIOS[activeScenario].color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={GROWTH_SCENARIOS[activeScenario].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 9 }} />
              <YAxis stroke="#334155" tick={{ fontSize: 9 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                formatter={(v, n) => [`€${(v || 0).toLocaleString()}`, n]} />
              <Area type="monotone" dataKey="upper" stroke="none" fill={GROWTH_SCENARIOS[activeScenario].color} fillOpacity={0.08} name="Upper Band" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a" fillOpacity={1} name="Lower Band" />
              <Bar dataKey="actual" fill="#06b6d4" name="Actual" barSize={16} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="forecast" stroke={GROWTH_SCENARIOS[activeScenario].color} strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="Forecast" />
              <ReferenceLine x={analytics.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.month} stroke="#475569" strokeDasharray="4 2" label={{ value: "Today", fill: "#64748b", fontSize: 9 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </NeonCard>

        {/* Scenario comparison */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(GROWTH_SCENARIOS).map(([key, s]) => {
            const monthlyGrowth = Math.pow(s.multiplier, 1 / 12) - 1;
            const projected12m = currentMRR * Math.pow(1 + monthlyGrowth, 12);
            const expectedValue = projected12m * s.probability;
            return (
              <NeonCard key={key} color={s.color} className={activeScenario === key ? "ring-1" : ""} style={{ ...(activeScenario === key && { ringColor: s.color }) }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                  <Badge className="text-[8px]" style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}25` }}>
                    p={s.probability}
                  </Badge>
                </div>
                <p className="text-xl font-black text-white">€{projected12m.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">MRR in 12m</p>
                <p className="text-[10px] mt-2" style={{ color: s.color }}>EV: €{expectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </NeonCard>
            );
          })}
        </div>

        {/* Top customers + AI insights */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Customer Revenue Leaderboard */}
          <NeonCard color="#f59e0b">
            <h3 className="text-white font-semibold mb-4">Customer Revenue Leaderboard</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {analytics.orgRevenue.slice(0, 10).map((org, i) => (
                <div key={org.id}
                  onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-900/50 border border-transparent hover:border-slate-800/60">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                    style={{ background: i < 3 ? "#f59e0b20" : "#1e293b", color: i < 3 ? "#f59e0b" : "#64748b" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{org.name}</p>
                    <p className="text-slate-500 text-[10px]">{org.vehicleCount} vehicles · {org.invoiceCount} invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">€{org.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-slate-500 text-[9px]">ARPU €{org.arpu.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>

          {/* Revenue by month bar */}
          <NeonCard color="#06b6d4">
            <h3 className="text-white font-semibold mb-4">Monthly Revenue History</h3>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={analytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 9 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 9 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                  formatter={v => [`€${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {analytics.monthlyRevenue.map((_, i) => (
                    <rect key={i} fill={i === analytics.monthlyRevenue.length - 1 ? "#8b5cf6" : "#06b6d4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </NeonCard>
        </div>

        {/* AI Insights */}
        <AnimatePresence>
          {aiInsights && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <NeonCard color="#10b981">
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-bold">AI Revenue Intelligence Report</h3>
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[9px] ml-2">LIVE</Badge>
                </div>

                {aiInsights.executive_summary && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/40 mb-5">
                    <p className="text-slate-200 text-sm leading-relaxed">{aiInsights.executive_summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-5">
                  {/* Growth Levers */}
                  <div>
                    <p className="text-green-400 text-xs font-mono uppercase tracking-wider mb-3">↑ Growth Levers</p>
                    <div className="space-y-2">
                      {(aiInsights.growth_levers || []).map((g, i) => (
                        <div key={i} className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white text-xs font-semibold">{g.title}</p>
                            {g.projected_uplift_pct && <Badge className="text-[8px] bg-green-500/20 text-green-300 border-green-500/25">+{g.projected_uplift_pct}%</Badge>}
                          </div>
                          <p className="text-slate-400 text-[10px] leading-relaxed">{g.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue Risks */}
                  <div>
                    <p className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3">⚠ Revenue Risks</p>
                    <div className="space-y-2">
                      {(aiInsights.revenue_risks || []).map((r, i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                          <p className="text-white text-xs font-semibold">{r.title}</p>
                          {r.impact_eur && <p className="text-red-400 text-[9px] font-mono my-0.5">Impact: €{r.impact_eur}</p>}
                          <p className="text-slate-400 text-[10px] leading-relaxed">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion + pricing */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">◈ Expansion Moves</p>
                      <div className="space-y-2">
                        {(aiInsights.expansion_moves || []).map((e, i) => (
                          <div key={i} className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                            <p className="text-white text-xs font-semibold">{e.title}</p>
                            <p className="text-slate-400 text-[10px] mt-1">{e.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {aiInsights.pricing_recommendation && (
                      <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <p className="text-violet-400 text-[9px] font-mono uppercase mb-1">💰 Pricing Strategy</p>
                        <p className="text-slate-300 text-[10px] leading-relaxed">{aiInsights.pricing_recommendation}</p>
                      </div>
                    )}
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