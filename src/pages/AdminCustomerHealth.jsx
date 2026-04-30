import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Brain, Loader2, Users, Zap, Star, ArrowUpRight, ArrowDownRight,
  Activity, BarChart2, Clock, Shield
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, Legend
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

function HealthBar({ score, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-800">
      <motion.div className="h-1.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${score}%` }}
        transition={{ duration: 0.8 }} style={{ background: color }} />
    </div>
  );
}

function HealthBadge({ score }) {
  if (score >= 80) return <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[9px]">Healthy</Badge>;
  if (score >= 50) return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[9px]">At Risk</Badge>;
  return <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[9px]">Critical</Badge>;
}

export default function AdminCustomerHealth() {
  const [scanning, setScanning] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [sortBy, setSortBy] = useState("health");

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
  const { data: fleetAIUsage = [] } = useQuery({
    queryKey: ["fleetAIUsage"],
    queryFn: () => base44.entities.FleetAIUsage.list("-created_date", 500),
  });

  // Build health scores per org
  const customerData = useMemo(() => {
    return organizations.map(org => {
      const orgInvoices = invoices.filter(i => i.organization_id === org.id);
      const paidInvoices = orgInvoices.filter(i => i.status === "paid");
      const overdueInvoices = orgInvoices.filter(i => i.status === "overdue");
      const orgVehicles = vehicles.filter(v => v.organization_id === org.id);
      const orgAI = fleetAIUsage.filter(u => u.organization_id === org.id);
      const totalRevenue = paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

      // Days since last invoice
      const lastInvoice = orgInvoices.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      const daysSinceInvoice = lastInvoice
        ? Math.floor((Date.now() - new Date(lastInvoice.created_date)) / 86400000)
        : 999;

      // Health scoring
      let health = 100;
      if (overdueInvoices.length > 0) health -= 30;
      if (daysSinceInvoice > 60) health -= 20;
      if (daysSinceInvoice > 90) health -= 15;
      if (orgVehicles.length === 0) health -= 10;
      if (orgAI.length === 0) health -= 15;
      if (paidInvoices.length === 0) health -= 20;
      health = Math.max(5, Math.min(100, health));

      // LTV estimate (total revenue * projected months remaining)
      const avgMonthlyRev = paidInvoices.length > 0 ? totalRevenue / Math.max(paidInvoices.length, 1) : 0;
      const ltv = avgMonthlyRev * 24; // 2-year LTV estimate

      // Churn probability
      const churnProb = Math.max(0, Math.min(95, 100 - health + (overdueInvoices.length * 15)));

      return {
        ...org,
        health,
        churnProb,
        ltv,
        totalRevenue,
        vehicleCount: orgVehicles.length,
        aiUsage: orgAI.length,
        invoiceCount: orgInvoices.length,
        overdueCount: overdueInvoices.length,
        daysSinceInvoice,
        avgMonthlyRev,
        engagementScore: Math.min(100, orgAI.length * 5 + orgVehicles.length * 3),
      };
    });
  }, [organizations, invoices, vehicles, fleetAIUsage]);

  const sorted = useMemo(() => {
    return [...customerData].sort((a, b) => {
      if (sortBy === "health") return a.health - b.health;
      if (sortBy === "ltv") return b.ltv - a.ltv;
      if (sortBy === "churn") return b.churnProb - a.churnProb;
      return b.totalRevenue - a.totalRevenue;
    });
  }, [customerData, sortBy]);

  // Summary stats
  const critical = customerData.filter(c => c.health < 50).length;
  const atRisk = customerData.filter(c => c.health >= 50 && c.health < 80).length;
  const healthy = customerData.filter(c => c.health >= 80).length;
  const totalLTV = customerData.reduce((s, c) => s + c.ltv, 0);
  const avgHealth = customerData.length > 0 ? Math.round(customerData.reduce((s, c) => s + c.health, 0) / customerData.length) : 0;

  // Health distribution for chart
  const healthBuckets = [
    { range: "0-20", count: customerData.filter(c => c.health < 20).length, color: "#ef4444" },
    { range: "20-40", count: customerData.filter(c => c.health >= 20 && c.health < 40).length, color: "#f97316" },
    { range: "40-60", count: customerData.filter(c => c.health >= 40 && c.health < 60).length, color: "#f59e0b" },
    { range: "60-80", count: customerData.filter(c => c.health >= 60 && c.health < 80).length, color: "#84cc16" },
    { range: "80-100", count: customerData.filter(c => c.health >= 80).length, color: "#10b981" },
  ];

  const runAIScan = async () => {
    setScanning(true);
    try {
      const criticalOrgs = sorted.slice(0, 3).map(o => `${o.name} (health: ${o.health}, churn: ${o.churnProb}%, LTV: €${o.ltv.toFixed(0)})`).join("; ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a customer success AI analyst for NexusVectis, a fleet management SaaS platform.

Customer health overview:
- Total customers: ${customerData.length}
- Critical (health < 50): ${critical}
- At risk (50-80): ${atRisk}
- Healthy (80+): ${healthy}
- Average health score: ${avgHealth}/100
- Total estimated LTV: €${totalLTV.toLocaleString()}
- Most at-risk: ${criticalOrgs}

Provide a JSON with:
- immediate_actions: array of 3 specific interventions to run THIS WEEK for at-risk customers (title, action, expected_impact)
- retention_playbook: array of 3 proven retention tactics tailored to this data profile (title, description, timing)
- expansion_targets: array of top 2 customers to target for upsell based on health + usage patterns (criteria, approach)
- health_prediction: brief paragraph predicting health trends over next 90 days
- red_flags: array of 2 systemic warning signals in this customer portfolio`,
        response_json_schema: {
          type: "object",
          properties: {
            immediate_actions: { type: "array", items: { type: "object" } },
            retention_playbook: { type: "array", items: { type: "object" } },
            expansion_targets: { type: "array", items: { type: "object" } },
            health_prediction: { type: "string" },
            red_flags: { type: "array", items: { type: "object" } }
          }
        }
      });
      setAiInsights(res);
      toast.success("Customer health scan complete");
    } catch {
      toast.error("Scan failed");
    }
    setScanning(false);
  };

  return (
    <AdminLayout currentPage="AdminCustomerHealth">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Customer Health Monitor</h1>
            </div>
            <p className="text-slate-400 text-sm">Churn prediction, engagement scoring, LTV analysis & AI-powered retention intelligence</p>
          </div>
          <Button onClick={runAIScan} disabled={scanning}
            className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white gap-2">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {scanning ? "Scanning..." : "AI Health Scan"}
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Avg Health Score", value: `${avgHealth}/100`, icon: Heart, color: avgHealth >= 70 ? "#10b981" : avgHealth >= 50 ? "#f59e0b" : "#ef4444" },
            { label: "Healthy", value: healthy, icon: CheckCircle2, color: "#10b981" },
            { label: "At Risk", value: atRisk, icon: AlertTriangle, color: "#f59e0b" },
            { label: "Critical", value: critical, icon: Shield, color: "#ef4444" },
            { label: "Total LTV (est.)", value: `€${(totalLTV / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#8b5cf6" },
          ].map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <NeonCard color={k.color}>
                <k.icon className="w-4 h-4 mb-2 opacity-60" style={{ color: k.color }} />
                <p className="text-2xl font-black text-white">{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
              </NeonCard>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Health distribution */}
          <NeonCard color="#10b981">
            <h3 className="text-white font-semibold mb-4">Health Score Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={healthBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#334155" tick={{ fontSize: 10 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                  formatter={v => [v, "Customers"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {healthBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </NeonCard>

          {/* Engagement vs Churn scatter */}
          <NeonCard color="#8b5cf6">
            <h3 className="text-white font-semibold mb-4">Engagement vs Churn Risk</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="engagementScore" name="Engagement" stroke="#334155" tick={{ fontSize: 9 }} label={{ value: "Engagement", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 9 }} />
                <YAxis dataKey="churnProb" name="Churn %" stroke="#334155" tick={{ fontSize: 9 }} label={{ value: "Churn %", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 9 }} />
                <ZAxis dataKey="ltv" range={[40, 400]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }}
                  formatter={(v, n) => [n === "Churn %" ? `${v}%` : v, n]} />
                <Scatter data={customerData} fill="#8b5cf6" fillOpacity={0.8}>
                  {customerData.map((c, i) => (
                    <Cell key={i} fill={c.health >= 80 ? "#10b981" : c.health >= 50 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-[9px] text-slate-600 mt-2">Bubble size = estimated LTV · Color = health status</p>
          </NeonCard>
        </div>

        {/* Customer table */}
        <NeonCard color="#06b6d4" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Customer Health Leaderboard</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">Sort by:</span>
              {[["health", "Health"], ["churn", "Churn Risk"], ["ltv", "LTV"], ["revenue", "Revenue"]].map(([key, label]) => (
                <button key={key} onClick={() => setSortBy(key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${sortBy === key ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-slate-900/40 border-slate-800 text-slate-500"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sorted.map((org, i) => (
              <motion.div key={org.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-slate-800/60 hover:bg-slate-900/40 transition-all">
                <div className="w-6 text-slate-600 text-xs font-mono text-right flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-white text-sm font-medium truncate">{org.name}</p>
                    <HealthBadge score={org.health} />
                    {org.overdueCount > 0 && <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[8px]">{org.overdueCount} overdue</Badge>}
                  </div>
                  <HealthBar score={org.health} color={org.health >= 80 ? "#10b981" : org.health >= 50 ? "#f59e0b" : "#ef4444"} />
                </div>
                <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-white text-sm font-bold">{org.health}</p>
                    <p className="text-[9px] text-slate-600">health</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${org.churnProb > 50 ? "text-red-400" : org.churnProb > 25 ? "text-amber-400" : "text-green-400"}`}>{org.churnProb}%</p>
                    <p className="text-[9px] text-slate-600">churn risk</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-bold">{org.vehicleCount}</p>
                    <p className="text-[9px] text-slate-600">vehicles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-violet-400 text-sm font-bold">€{(org.ltv / 1000).toFixed(0)}K</p>
                    <p className="text-[9px] text-slate-600">est. LTV</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {sorted.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-sm">No customer data available</div>
            )}
          </div>
        </NeonCard>

        {/* AI Insights */}
        <AnimatePresence>
          {aiInsights && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <NeonCard color="#ec4899">
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5 text-pink-400" />
                  <h3 className="text-white font-bold">AI Customer Success Report</h3>
                  <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/25 text-[9px] ml-2">LIVE</Badge>
                </div>

                {aiInsights.health_prediction && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/40 mb-5">
                    <p className="text-slate-300 text-sm leading-relaxed">{aiInsights.health_prediction}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-5">
                  {/* Immediate actions */}
                  <div>
                    <p className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3">⚡ This Week</p>
                    <div className="space-y-2">
                      {(aiInsights.immediate_actions || []).map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                          <p className="text-white text-xs font-semibold">{a.title}</p>
                          <p className="text-slate-400 text-[10px] mt-1">{a.action}</p>
                          {a.expected_impact && <p className="text-green-400 text-[9px] mt-1 font-mono">{a.expected_impact}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retention playbook */}
                  <div>
                    <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">📋 Retention Playbook</p>
                    <div className="space-y-2">
                      {(aiInsights.retention_playbook || []).map((r, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                          <p className="text-white text-xs font-semibold">{r.title}</p>
                          <p className="text-slate-400 text-[10px] mt-1">{r.description}</p>
                          {r.timing && <p className="text-amber-400 text-[9px] mt-1 font-mono">{r.timing}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion + red flags */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-green-400 text-xs font-mono uppercase tracking-wider mb-2">↑ Expansion Targets</p>
                      <div className="space-y-2">
                        {(aiInsights.expansion_targets || []).map((e, i) => (
                          <div key={i} className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                            <p className="text-white text-xs font-semibold">{e.criteria || e.title}</p>
                            <p className="text-slate-400 text-[10px] mt-1">{e.approach || e.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-pink-400 text-xs font-mono uppercase tracking-wider mb-2">🚩 Red Flags</p>
                      <div className="space-y-2">
                        {(aiInsights.red_flags || []).map((f, i) => (
                          <div key={i} className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/15">
                            <p className="text-slate-300 text-[10px]">{f.signal || f.description || f}</p>
                          </div>
                        ))}
                      </div>
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