import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Globe, Truck, Warehouse, DollarSign, TrendingUp, AlertCircle,
  Users, Building2, Loader2, FileText, Mail, CheckCircle2, Clock,
  Shield, Heart, Crosshair, Layers, Brain, Activity, Zap,
  ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle, Star
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function NeonCard({ children, className = "", color = "#06b6d4", onClick, as: Tag = "div" }) {
  return (
    <Tag onClick={onClick} className={`rounded-2xl border p-5 relative overflow-hidden transition-all ${onClick ? "cursor-pointer hover:scale-[1.01]" : ""} ${className}`}
      style={{ background: "rgba(2,8,20,0.85)", borderColor: `${color}20`, boxShadow: `0 0 30px ${color}06` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${color}05 0%, transparent 60%)` }} />
      {children}
    </Tag>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend, trendLabel }) {
  return (
    <NeonCard color={color}>
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-4 h-4 opacity-60" style={{ color }} />
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 text-green-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
            <span className={`text-[10px] font-mono ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>{trendLabel}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </NeonCard>
  );
}

function ModuleCard({ title, description, page, icon: Icon, color, stats }) {
  return (
    <Link to={`/${page}`}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="p-4 rounded-xl border transition-all cursor-pointer group"
        style={{ background: "rgba(2,8,20,0.7)", borderColor: `${color}15` }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${color}15`}>
        <div className="flex items-start justify-between mb-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
        <p className="text-white text-sm font-semibold mt-2">{title}</p>
        <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{description}</p>
        {stats && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/60">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-xs font-bold" style={{ color }}>{s.value}</p>
                <p className="text-[9px] text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: organizations = [] } = useQuery({ queryKey: ["organizations"], queryFn: () => base44.entities.Organization.list() });
  const { data: allVehicles = [] } = useQuery({ queryKey: ["allVehicles"], queryFn: () => base44.entities.Vehicle.list() });
  const { data: allResources = [] } = useQuery({ queryKey: ["allResources"], queryFn: () => base44.entities.Resource.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ["allInvoices"], queryFn: () => base44.entities.Invoice.list() });
  const { data: contactMessages = [], refetch: refetchMessages } = useQuery({ queryKey: ["contactMessages"], queryFn: () => base44.entities.ContactMessage.list("-created_date", 20) });
  const { data: alerts = [] } = useQuery({ queryKey: ["adminAlerts"], queryFn: () => base44.entities.Alert.list("-created_date", 50) });
  const { data: auditLogs = [] } = useQuery({ queryKey: ["securityAudit"], queryFn: () => base44.entities.SecurityAudit.list("-created_date", 100) });
  const { data: fleetAIUsage = [] } = useQuery({ queryKey: ["fleetAIUsage"], queryFn: () => base44.entities.FleetAIUsage.list("-created_date", 200) });

  const markAsRead = async (id) => {
    await base44.entities.ContactMessage.update(id, { status: "read" });
    refetchMessages();
  };

  // ── Analytics ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    const now = new Date();
    const paid = invoices.filter(i => i.status === "paid");
    const totalRevenue = paid.reduce((s, i) => s + (i.total_amount || 0), 0);

    // Monthly revenue for chart
    const monthlyMap = {};
    paid.forEach(inv => {
      const key = inv.period_month || inv.created_date?.slice(0, 7);
      if (key) monthlyMap[key] = (monthlyMap[key] || 0) + (inv.total_amount || 0);
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, revenue]) => ({ month: month.slice(5), revenue: Math.round(revenue) }));

    // Vehicles added per month
    const vehicleGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (4 - i), 0, 23, 59, 59);
      return {
        month: d.toLocaleString("en-US", { month: "short" }),
        orgs: organizations.filter(o => new Date(o.created_date) >= d && new Date(o.created_date) <= end).length,
        vehicles: allVehicles.filter(v => new Date(v.created_date) >= d && new Date(v.created_date) <= end).length,
      };
    });

    // Current month MRR
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const mrr = invoices.filter(i => i.period_month === currentMonth && i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);

    // Invoice health
    const overdue = invoices.filter(i => i.status === "overdue").length;
    const pending = invoices.filter(i => i.status === "pending").length;

    // Security
    const securityEvents = auditLogs.length;
    const securityFailed = auditLogs.filter(l => l.status === "failed").length;

    // Customer health summary
    const criticalOrgs = organizations.filter(org => {
      const orgInvoices = invoices.filter(i => i.organization_id === org.id);
      return orgInvoices.some(i => i.status === "overdue");
    }).length;

    // AI usage
    const aiCommands = fleetAIUsage.length;

    // Addons
    const addonCount = organizations.filter(o => o.addon_airport_ops || o.addon_port_command || o.addon_transit_control).length;

    return {
      totalRevenue, mrr, monthlyRevenue, vehicleGrowth,
      overdue, pending, securityEvents, securityFailed,
      criticalOrgs, aiCommands, addonCount,
      paidCount: paid.length,
    };
  }, [organizations, allVehicles, invoices, auditLogs, fleetAIUsage]);

  const unreadMessages = contactMessages.filter(m => m.status === "new").length;
  const criticalAlerts = alerts.filter(a => a.type === "critical" && !a.is_resolved).length;

  return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="p-8 min-h-screen">
        {/* Ambient */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <Globe className="w-5 h-5 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Command Overview</h1>
            </div>
            <p className="text-slate-400 text-sm">NexusVectis Internal — Full-platform command center</p>
          </div>
          <div className="flex items-center gap-3">
            {criticalAlerts > 0 && (
              <Link to="/AdminPlatformHealth">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 text-xs font-mono animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />{criticalAlerts} critical alerts
                </div>
              </Link>
            )}
            {unreadMessages > 0 && (
              <Link to="/AdminMessages">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-violet-500/10 border-violet-500/30 text-violet-400 text-xs font-mono">
                  <Mail className="w-3.5 h-3.5" />{unreadMessages} new messages
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <StatCard label="Organizations" value={organizations.length} icon={Building2} color="#06b6d4" trend={0} trendLabel={`${analytics.addonCount} w/ addons`} />
          <StatCard label="Total Vehicles" value={allVehicles.length} icon={Truck} color="#10b981" sub="across all orgs" />
          <StatCard label="Total Revenue" value={`€${(analytics.totalRevenue / 1000).toFixed(0)}K`} icon={DollarSign} color="#f59e0b" sub="all time paid" />
          <StatCard label="MRR (this month)" value={`€${(analytics.mrr || 0).toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" />
          <StatCard label="Overdue Invoices" value={analytics.overdue} icon={AlertCircle} color={analytics.overdue > 0 ? "#ef4444" : "#10b981"} sub={`${analytics.pending} pending`} />
          <StatCard label="AI Commands" value={analytics.aiCommands} icon={Zap} color="#ec4899" sub="FleetAI usage" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <NeonCard color="#06b6d4" className="col-span-2">
            <h3 className="text-white font-semibold mb-4 text-sm">Revenue History</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 9 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 9 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                  formatter={v => [`€${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </NeonCard>

          <NeonCard color="#10b981">
            <h3 className="text-white font-semibold mb-4 text-sm">Platform Growth (6m)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.vehicleGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 9 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="vehicles" fill="#10b981" radius={[3, 3, 0, 0]} name="Vehicles" />
                <Bar dataKey="orgs" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="New Orgs" />
              </BarChart>
            </ResponsiveContainer>
          </NeonCard>
        </div>

        {/* Module quick-access grid */}
        <div className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-4">Quick Access — All Modules</p>
          <div className="grid grid-cols-4 gap-3">
            <ModuleCard title="Org Intelligence" description="Deep-dive into all customer organizations, fleet composition, revenue per org" page="AdminOrganizations" icon={Building2} color="#06b6d4"
              stats={[{ value: organizations.length, label: "orgs" }, { value: analytics.addonCount, label: "w/ addons" }]} />
            <ModuleCard title="Revenue Engine" description="Multi-scenario MRR forecasting, cohort analysis, AI revenue intelligence" page="AdminRevenueEngine" icon={DollarSign} color="#10b981"
              stats={[{ value: `€${(analytics.totalRevenue / 1000).toFixed(0)}K`, label: "total rev" }, { value: analytics.paidCount, label: "paid invoices" }]} />
            <ModuleCard title="Customer Health" description="Churn prediction, engagement scoring, LTV analysis, retention playbook" page="AdminCustomerHealth" icon={Heart} color="#ec4899"
              stats={[{ value: analytics.criticalOrgs, label: "at risk" }, { value: organizations.length - analytics.criticalOrgs, label: "healthy" }]} />
            <ModuleCard title="Competitive Intel" description="8-axis competitor radar, market position trajectory, AI threat scanning" page="AdminCompetitiveIntel" icon={Crosshair} color="#f59e0b" />
            <ModuleCard title="Scenario Simulator" description="Multi-dimensional simulation engine — 8 levers, 4 preset scenarios, AI narrative" page="AdminScenarioSimulator" icon={Layers} color="#8b5cf6" />
            <ModuleCard title="Security Center" description="Audit logs, threat level scoring, API keys, blocked events" page="AdminSecurityCenter" icon={Shield} color="#ef4444"
              stats={[{ value: analytics.securityEvents, label: "events" }, { value: analytics.securityFailed, label: "failures" }]} />
            <ModuleCard title="Platform Health" description="Real-time service monitoring, API usage chart, infrastructure status" page="AdminPlatformHealth" icon={Activity} color="#22c55e"
              stats={[{ value: criticalAlerts, label: "critical" }, { value: alerts.filter(a => !a.is_resolved).length, label: "open alerts" }]} />
            <ModuleCard title="CEO Intelligence" description="Executive strategic overview with AI-powered business intelligence" page="CEODashboard" icon={Brain} color="#a78bfa" />
          </div>
        </div>

        {/* Bottom row: invoices + messages */}
        <div className="grid grid-cols-2 gap-6">
          {/* Invoice status */}
          <NeonCard color="#f59e0b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Invoice Health</h3>
              <Link to="/AdminInvoices" className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total", value: invoices.length, color: "#06b6d4" },
                { label: "Paid", value: invoices.filter(i => i.status === "paid").length, color: "#10b981" },
                { label: "Pending", value: analytics.pending, color: "#f59e0b" },
                { label: "Overdue", value: analytics.overdue, color: "#ef4444" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl text-center bg-slate-900/50 border border-slate-800/50">
                  <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {/* Top orgs by revenue */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {organizations.slice(0, 6).map(org => {
                const rev = invoices.filter(i => i.organization_id === org.id && i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
                const vCount = allVehicles.filter(v => v.organization_id === org.id).length;
                const hasOverdue = invoices.some(i => i.organization_id === org.id && i.status === "overdue");
                return (
                  <div key={org.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-[10px] text-white font-bold">
                        {org.name?.[0]}
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{org.name}</p>
                        <p className="text-slate-500 text-[9px]">{vCount} vehicles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasOverdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      <span className="text-white text-xs font-bold">€{rev.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </NeonCard>

          {/* Contact messages */}
          <NeonCard color="#8b5cf6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">Contact Messages</h3>
                {unreadMessages > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px]">{unreadMessages} new</Badge>
                )}
              </div>
              <Link to="/AdminMessages" className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {contactMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-sm">No messages yet</div>
              ) : contactMessages.map(msg => (
                <div key={msg.id} className={`p-3 rounded-xl border transition-all ${msg.status === "new" ? "bg-violet-500/8 border-violet-500/25" : "bg-slate-900/30 border-slate-800/30"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white text-xs font-medium">{msg.name}</span>
                        <span className="text-slate-500 text-[10px]">{msg.email}</span>
                        {msg.subject && <Badge className="text-[8px] bg-slate-800/60 text-slate-400 border-slate-700/30">{msg.subject}</Badge>}
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-2">{msg.message}</p>
                      <p className="text-slate-600 text-[9px] mt-1">{new Date(msg.created_date).toLocaleString("da-DK")}</p>
                    </div>
                    {msg.status === "new" ? (
                      <button onClick={() => markAsRead(msg.id)}
                        className="flex-shrink-0 flex items-center gap-1 text-[9px] text-violet-400 hover:text-violet-300 border border-violet-500/25 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Read
                      </button>
                    ) : (
                      <Clock className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>
        </div>
      </div>
    </AdminLayout>
  );
}