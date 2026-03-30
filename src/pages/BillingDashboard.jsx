import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, TrendingDown, DollarSign, Package, Zap, AlertTriangle,
  Users, Activity, Globe, ChevronUp, ChevronDown, Search, Shield, Lock
} from "lucide-react";
import moment from "moment";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];

const WATERMARK = "🔒 INTERNAL — NEXUSVECTIS CONFIDENTIAL";

function StatCard({ title, value, sub, icon: Icon, color = "cyan", trend, trendValue }) {
  const colors = {
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/10",
    green: "text-green-400 border-green-500/20 bg-green-500/10",
    red: "text-red-400 border-red-500/20 bg-red-500/10",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    pink: "text-pink-400 border-pink-500/20 bg-pink-500/10",
  };
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
            <p className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</p>
            {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color].split(' ').slice(1).join(' ')}`}>
            <Icon className={`w-5 h-5 ${colors[color].split(' ')[0]}`} />
          </div>
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{trendValue}% vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingDashboard() {
  const [orgSearch, setOrgSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ['billing-me'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: invoices = [] } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 500),
    enabled: isAdmin
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['billing-orgs'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: isAdmin
  });

  const analytics = useMemo(() => {
    if (!organizations.length) return null;

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const cancelledInvoices = invoices.filter(i => i.status === 'cancelled');

    // Monthly revenue map
    const monthMap = {};
    invoices.filter(i => i.status !== 'cancelled').forEach(inv => {
      const m = inv.period_month?.slice(0, 7) || moment(inv.created_date).format('YYYY-MM');
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, vehicles: 0, resources: 0, fleetAI: 0, api: 0, harbor: 0, addons: 0, count: 0 };
      monthMap[m].revenue += inv.total_amount || 0;
      monthMap[m].vehicles += (inv.vehicle_count * inv.vehicle_price_euro) || 0;
      monthMap[m].resources += (inv.resource_count * inv.resource_price_euro) || 0;
      monthMap[m].fleetAI += (Math.floor((inv.fleetai_commands || 0) / 100) * (inv.fleetai_price_per_100 || 5));
      monthMap[m].api += (Math.floor((inv.api_calls || 0) / 100) * (inv.api_price_per_100 || 5));
      monthMap[m].harbor += ((inv.harbor_intelligence_calls || 0) * (inv.harbor_intelligence_price_per_call || 0.25));
      monthMap[m].addons += ((inv.addon_airport_ops_price || 0) + (inv.addon_port_command_price || 0) + (inv.addon_transit_control_price || 0));
      monthMap[m].count += 1;
    });

    const monthlyRevenue = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

    // MRR — last full month
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 1];
    const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
    const mrr = lastMonth?.revenue || 0;
    const mrrGrowth = prevMonth?.revenue ? Math.round(((mrr - prevMonth.revenue) / prevMonth.revenue) * 100) : 0;
    const arr = mrr * 12;

    // Total all-time paid
    const totalRevenue = paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const avgInvoice = invoices.length > 0 ? invoices.reduce((s, i) => s + (i.total_amount || 0), 0) / invoices.length : 0;

    // Product distribution (all time)
    const dist = { vehicles: 0, resources: 0, fleetAI: 0, api: 0, harbor: 0, addons: 0 };
    invoices.filter(i => i.status !== 'cancelled').forEach(inv => {
      dist.vehicles += (inv.vehicle_count * inv.vehicle_price_euro) || 0;
      dist.resources += (inv.resource_count * inv.resource_price_euro) || 0;
      dist.fleetAI += (Math.floor((inv.fleetai_commands || 0) / 100) * 5);
      dist.api += (Math.floor((inv.api_calls || 0) / 100) * 5);
      dist.harbor += ((inv.harbor_intelligence_calls || 0) * 0.25);
      dist.addons += ((inv.addon_airport_ops_price || 0) + (inv.addon_port_command_price || 0) + (inv.addon_transit_control_price || 0));
    });
    const productDistribution = [
      { name: 'Vehicles', value: Math.round(dist.vehicles) },
      { name: 'Resources', value: Math.round(dist.resources) },
      { name: 'FLEET AI', value: Math.round(dist.fleetAI) },
      { name: 'API Calls', value: Math.round(dist.api) },
      { name: 'Harbor Intel', value: Math.round(dist.harbor) },
      { name: 'Add-ons', value: Math.round(dist.addons) },
    ].filter(p => p.value > 0);

    // Forecast next 3 months (weighted avg of last 3 months)
    const recentMonths = monthlyRevenue.slice(-3);
    const weights = [0.2, 0.3, 0.5];
    const weightedAvg = recentMonths.reduce((s, m, i) => s + m.revenue * weights[i], 0);
    const growthRate = mrrGrowth > 0 ? 1 + (mrrGrowth / 100) * 0.5 : 1;
    const forecast = Array.from({ length: 3 }, (_, i) => ({
      month: moment().add(i + 1, 'months').format('YYYY-MM'),
      revenue: Math.round(weightedAvg * Math.pow(growthRate, i + 1)),
      isForecast: true
    }));

    const combinedTrend = [
      ...monthlyRevenue.map(m => ({ ...m, isForecast: false })),
      ...forecast
    ];

    // Per-organization revenue
    const orgRevMap = {};
    invoices.filter(i => i.status !== 'cancelled').forEach(inv => {
      if (!orgRevMap[inv.organization_id]) orgRevMap[inv.organization_id] = { revenue: 0, invoiceCount: 0, lastInvoice: null, avgInvoice: 0 };
      orgRevMap[inv.organization_id].revenue += inv.total_amount || 0;
      orgRevMap[inv.organization_id].invoiceCount += 1;
      if (!orgRevMap[inv.organization_id].lastInvoice || new Date(inv.created_date) > new Date(orgRevMap[inv.organization_id].lastInvoice)) {
        orgRevMap[inv.organization_id].lastInvoice = inv.created_date;
      }
    });
    Object.values(orgRevMap).forEach(o => o.avgInvoice = o.invoiceCount > 0 ? Math.round(o.revenue / o.invoiceCount) : 0);

    // Per-org current asset counts for estimated MRR
    const orgVehicleCount = {};
    const orgResourceCount = {};
    const orgFleetAICount = {};
    const orgAPICount = {};
    allVehicles.forEach(v => { orgVehicleCount[v.organization_id] = (orgVehicleCount[v.organization_id] || 0) + 1; });
    allResources.forEach(r => { orgResourceCount[r.organization_id] = (orgResourceCount[r.organization_id] || 0) + 1; });
    allFleetAI.filter(f => f.success).forEach(f => { orgFleetAICount[f.organization_id] = (orgFleetAICount[f.organization_id] || 0) + 1; });
    allAPIUsage.filter(a => a.status_code < 400).forEach(a => { orgAPICount[a.organization_id] = (orgAPICount[a.organization_id] || 0) + 1; });

    const orgLeaderboard = organizations
      .map(org => {
        const vCount = orgVehicleCount[org.id] || 0;
        const rCount = orgResourceCount[org.id] || 0;
        const aiCount = orgFleetAICount[org.id] || 0;
        const apiCount = orgAPICount[org.id] || 0;
        const addonCount = [org.addon_airport_ops, org.addon_port_command, org.addon_transit_control].filter(Boolean).length;
        const estimatedMRR = (vCount * 15) + (rCount * 40) + (Math.ceil(aiCount / 100) * 5) + (Math.ceil(apiCount / 100) * 5) + (addonCount * 2000);
        return {
          ...org,
          revenue: orgRevMap[org.id]?.revenue || 0,
          invoiceCount: orgRevMap[org.id]?.invoiceCount || 0,
          avgInvoice: orgRevMap[org.id]?.avgInvoice || 0,
          lastInvoice: orgRevMap[org.id]?.lastInvoice,
          hasAddons: org.addon_airport_ops || org.addon_port_command || org.addon_transit_control,
          activeAddons: addonCount,
          estimatedMRR,
          vehicleCount: vCount,
          resourceCount: rCount,
          fleetAICount: aiCount,
          apiCount
        };
      })
      .sort((a, b) => (b.revenue || b.estimatedMRR) - (a.revenue || a.estimatedMRR));

    // Churn / status health
    const collectionRate = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;
    const overdueRate = invoices.length > 0 ? Math.round((overdueInvoices.length / invoices.length) * 100) : 0;

    // Addon revenue per type
    const addonBreakdown = [
      { name: 'Airport Ops', value: Math.round(invoices.reduce((s, i) => s + (i.addon_airport_ops_price || 0), 0)) },
      { name: 'Port Command', value: Math.round(invoices.reduce((s, i) => s + (i.addon_port_command_price || 0), 0)) },
      { name: 'Transit Control', value: Math.round(invoices.reduce((s, i) => s + (i.addon_transit_control_price || 0), 0)) },
    ].filter(a => a.value > 0);

    // Radar: avg per-org metrics
    const radarData = [{
      metric: 'Vehicles', value: Math.round(organizations.reduce((s, o) => s + (invoices.filter(i => i.organization_id === o.id).reduce((ss, i) => ss + (i.vehicle_count || 0), 0) / Math.max(1, invoices.filter(i => i.organization_id === o.id).length)), 0) / Math.max(1, organizations.length))
    }];

    return {
      mrr, mrrGrowth, arr, totalRevenue, avgInvoice,
      monthlyRevenue, combinedTrend, productDistribution, forecast,
      orgLeaderboard, collectionRate, overdueRate,
      paidCount: paidInvoices.length, pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length, cancelledCount: cancelledInvoices.length,
      totalInvoices: invoices.length, addonBreakdown,
      activeAddonOrgs: organizations.filter(o => o.addon_airport_ops || o.addon_port_command || o.addon_transit_control).length,
      addonRevMRR: Math.round((organizations.filter(o => o.addon_airport_ops).length + organizations.filter(o => o.addon_port_command).length + organizations.filter(o => o.addon_transit_control).length) * 2000)
    };
  }, [invoices, organizations]);

  const filteredOrgs = analytics?.orgLeaderboard?.filter(o =>
    o.name?.toLowerCase().includes(orgSearch.toLowerCase()) ||
    o.admin_email?.toLowerCase().includes(orgSearch.toLowerCase())
  ) || [];

  const tabs = ['overview', 'revenue', 'organizations', 'addons'];

  if (authLoading) {
    return (
      <AdminLayout currentPage="BillingDashboard">
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout currentPage="BillingDashboard">
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <Card className="bg-slate-900 border-red-500/40 max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Access Restricted</h2>
              <p className="text-slate-400 text-sm">This dashboard is for internal NexusVectis administrators only.</p>
              <Badge className="mt-4 bg-red-500/20 text-red-400 border-red-500/30">Unauthorized</Badge>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const tooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8 };
  const tooltipLabelStyle = { color: '#e2e8f0', fontSize: 12 };

  return (
    <AdminLayout currentPage="BillingDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Confidential Banner */}
          <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-400 text-xs font-semibold tracking-wide">{WATERMARK}</p>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Revenue Intelligence</h1>
              <p className="text-slate-400 text-sm">Real-time billing analytics · {moment().format('MMMM YYYY')} · Admin only</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live data
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-900/60 border border-slate-800 rounded-lg p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && analytics && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="MRR" value={`€${Math.round(analytics.mrr).toLocaleString()}`} sub="Monthly Recurring Revenue" icon={TrendingUp} color="cyan" trend={analytics.mrrGrowth >= 0 ? 'up' : 'down'} trendValue={Math.abs(analytics.mrrGrowth)} />
                <StatCard title="ARR" value={`€${Math.round(analytics.arr).toLocaleString()}`} sub="Annualized run rate" icon={Activity} color="violet" />
                <StatCard title="Total Collected" value={`€${Math.round(analytics.totalRevenue).toLocaleString()}`} sub="All paid invoices" icon={DollarSign} color="green" />
                <StatCard title="Avg. Invoice" value={`€${Math.round(analytics.avgInvoice).toLocaleString()}`} sub="Across all invoices" icon={Package} color="amber" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Collection Rate" value={`${analytics.collectionRate}%`} sub={`${analytics.paidCount} paid`} icon={TrendingUp} color="green" />
                <StatCard title="Overdue Rate" value={`${analytics.overdueRate}%`} sub={`${analytics.overdueCount} overdue`} icon={AlertTriangle} color="red" />
                <StatCard title="Active Add-on Orgs" value={analytics.activeAddonOrgs} sub="Organizations with addons" icon={Zap} color="violet" />
                <StatCard title="Add-on MRR" value={`€${analytics.addonRevMRR.toLocaleString()}`} sub="From active subscriptions" icon={Zap} color="pink" />
              </div>

              {/* Invoice Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader className="pb-3"><CardTitle className="text-white text-sm">Invoice Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: 'Paid', value: analytics.paidCount },
                          { name: 'Pending', value: analytics.pendingCount },
                          { name: 'Overdue', value: analytics.overdueCount },
                          { name: 'Cancelled', value: analytics.cancelledCount }
                        ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {['#10b981', '#f59e0b', '#ef4444', '#64748b'].map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 lg:col-span-2">
                  <CardHeader className="pb-3"><CardTitle className="text-white text-sm">Revenue by Product (All Time)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.productDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                        <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `€${v.toLocaleString()}`} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={v => [`€${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {analytics.productDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'revenue' && analytics && (
            <>
              {/* Combined trend + forecast */}
              <Card className="bg-slate-900/60 border-slate-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Revenue Trend & 3-Month Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={analytics.combinedTrend}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={v => [`€${Math.round(v).toLocaleString()}`, 'Revenue']} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#revGrad)" name="Actual Revenue" dot={(props) => props.payload.isForecast ? null : <circle cx={props.cx} cy={props.cy} r={3} fill="#06b6d4" />} strokeDasharray={(d) => d?.isForecast ? "5 5" : undefined} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Stacked breakdown */}
              <Card className="bg-slate-900/60 border-slate-800 mb-6">
                <CardHeader><CardTitle className="text-white text-sm">Monthly Revenue Breakdown by Product</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `€${v.toLocaleString()}`} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={v => [`€${Math.round(v).toLocaleString()}`]} />
                      <Legend />
                      <Bar dataKey="vehicles" stackId="a" fill="#06b6d4" name="Vehicles" />
                      <Bar dataKey="resources" stackId="a" fill="#8b5cf6" name="Resources" />
                      <Bar dataKey="fleetAI" stackId="a" fill="#ec4899" name="FLEET AI" />
                      <Bar dataKey="api" stackId="a" fill="#f59e0b" name="API" />
                      <Bar dataKey="harbor" stackId="a" fill="#10b981" name="Harbor" />
                      <Bar dataKey="addons" stackId="a" fill="#3b82f6" name="Add-ons" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Forecast table */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-400" /> Forecast Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {analytics.forecast.map((f, i) => (
                      <div key={i} className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4 text-center">
                        <p className="text-slate-400 text-xs mb-1">{f.month}</p>
                        <p className="text-violet-300 text-xl font-bold">€{f.revenue.toLocaleString()}</p>
                        <p className="text-slate-500 text-xs mt-1">Projected MRR</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ORGANIZATIONS TAB */}
          {activeTab === 'organizations' && analytics && (
            <>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  className="pl-10 bg-slate-900/60 border-slate-800 text-white"
                />
              </div>

              <Card className="bg-slate-900/60 border-slate-800 mb-6">
                <CardHeader><CardTitle className="text-white text-sm">Organization Revenue Leaderboard</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Organization</th>
                          <th className="px-4 py-3 text-left">Country</th>
                          <th className="px-4 py-3 text-right">Total Revenue</th>
                          <th className="px-4 py-3 text-right">Est. MRR</th>
                          <th className="px-4 py-3 text-right">Invoices</th>
                          <th className="px-4 py-3 text-right">Vehicles</th>
                          <th className="px-4 py-3 text-right">Resources</th>
                          <th className="px-4 py-3 text-right">AI / API</th>
                          <th className="px-4 py-3 text-right">Add-ons</th>
                          <th className="px-4 py-3 text-right">Last Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.map((org, i) => (
                          <tr key={org.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-500 font-mono">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white font-medium">{org.name}</p>
                                <p className="text-slate-500 text-xs">{org.admin_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{org.headquarters_country || '—'}</td>
                            <td className="px-4 py-3 text-right text-cyan-400 font-semibold">€{Math.round(org.revenue).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-emerald-400 font-semibold">€{Math.round(org.estimatedMRR).toLocaleString()}</span>
                              <span className="text-slate-600 text-xs block">estimated</span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-300">{org.invoiceCount}</td>
                            <td className="px-4 py-3 text-right text-slate-300">{org.vehicleCount}</td>
                            <td className="px-4 py-3 text-right text-slate-300">{org.resourceCount}</td>
                            <td className="px-4 py-3 text-right text-slate-400 text-xs">{org.fleetAICount} / {org.apiCount}</td>
                            <td className="px-4 py-3 text-right">
                              {org.activeAddons > 0
                                ? <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">{org.activeAddons} active</Badge>
                                : <span className="text-slate-600">—</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400 text-xs">
                              {org.lastInvoice ? moment(org.lastInvoice).fromNow() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 revenue bar */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader><CardTitle className="text-white text-sm">Top 8 Organizations by Revenue</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.orgLeaderboard.slice(0, 8).map(o => ({ name: o.name.slice(0, 15), revenue: Math.round(o.revenue) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `€${v.toLocaleString()}`} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={v => [`€${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {analytics.orgLeaderboard.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* ADD-ONS TAB */}
          {activeTab === 'addons' && analytics && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Airport Ops Active', count: organizations.filter(o => o.addon_airport_ops).length, color: 'cyan' },
                  { label: 'Port Command Active', count: organizations.filter(o => o.addon_port_command).length, color: 'violet' },
                  { label: 'Transit Control Active', count: organizations.filter(o => o.addon_transit_control).length, color: 'pink' },
                ].map(a => (
                  <Card key={a.label} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="pt-5 text-center">
                      <p className="text-slate-400 text-xs mb-2">{a.label}</p>
                      <p className={`text-3xl font-bold text-${a.color}-400`}>{a.count}</p>
                      <p className="text-slate-500 text-xs mt-1">€{(a.count * 2000).toLocaleString()} / month</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader><CardTitle className="text-white text-sm">Add-on Revenue Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.addonBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={analytics.addonBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: €${value.toLocaleString()}`}>
                            {analytics.addonBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${v.toLocaleString()}`, 'Revenue']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-slate-500">No add-on revenue recorded yet</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader><CardTitle className="text-white text-sm">Organizations With Active Add-ons</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-64 overflow-y-auto">
                      {analytics.orgLeaderboard.filter(o => o.hasAddons).map(org => (
                        <div key={org.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/20">
                          <div>
                            <p className="text-white text-sm font-medium">{org.name}</p>
                            <p className="text-slate-500 text-xs">{org.headquarters_country}</p>
                          </div>
                          <div className="flex gap-1">
                            {org.addon_airport_ops && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">Airport</Badge>}
                            {org.addon_port_command && <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Port</Badge>}
                            {org.addon_transit_control && <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">Transit</Badge>}
                          </div>
                        </div>
                      ))}
                      {analytics.orgLeaderboard.filter(o => o.hasAddons).length === 0 && (
                        <p className="text-slate-500 text-sm p-4">No organizations with active add-ons</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add-on revenue over time */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader><CardTitle className="text-white text-sm">Add-on Revenue Over Time</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={analytics.monthlyRevenue}>
                      <defs>
                        <linearGradient id="addonGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `€${v.toLocaleString()}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${Math.round(v).toLocaleString()}`, 'Add-on Revenue']} />
                      <Area type="monotone" dataKey="addons" stroke="#8b5cf6" strokeWidth={2} fill="url(#addonGrad)" name="Add-on Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Footer watermark */}
          <div className="mt-8 text-center text-slate-700 text-xs">
            {WATERMARK} · Generated {moment().format('YYYY-MM-DD HH:mm')} · Logged as {currentUser?.email}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}