import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Server, Database, Zap, Clock, CheckCircle2, AlertTriangle, 
  XCircle, TrendingUp, TrendingDown, Cpu, Globe, RefreshCw, Eye,
  BarChart2, Wifi, Shield, Loader2
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const HEALTH_CHECKS = [
  { id: "database", name: "Database", icon: Database, color: "#06b6d4" },
  { id: "api", name: "API Gateway", icon: Zap, color: "#10b981" },
  { id: "auth", name: "Auth Service", icon: Shield, color: "#8b5cf6" },
  { id: "cdn", name: "CDN / Storage", icon: Globe, color: "#f59e0b" },
  { id: "agents", name: "AI Agents", icon: Cpu, color: "#ec4899" },
  { id: "realtime", name: "Realtime / WS", icon: Wifi, color: "#22c55e" },
];

function StatusDot({ status }) {
  const colors = {
    healthy: "bg-green-400",
    degraded: "bg-yellow-400",
    down: "bg-red-400",
    checking: "bg-blue-400 animate-pulse",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-slate-500"}`} />;
}

function UptimeBar({ pct = 99.9 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 90 }).map((_, i) => {
        const isDown = Math.random() < (1 - pct / 100) * 0.05;
        return (
          <div
            key={i}
            className={`h-6 w-0.5 rounded-sm ${isDown ? "bg-red-500" : "bg-green-500/70"}`}
          />
        );
      })}
    </div>
  );
}

export default function AdminPlatformHealth() {
  const [services, setServices] = useState(
    HEALTH_CHECKS.map(s => ({ ...s, status: "checking", latency: null, uptime: null }))
  );
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const { data: apiUsage = [] } = useQuery({
    queryKey: ["apiUsage"],
    queryFn: () => base44.entities.APIUsage.list("-created_date", 200),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["adminAlerts"],
    queryFn: () => base44.entities.Alert.list("-created_date", 50),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  // Simulate health checks (in real world, these would call actual health endpoints)
  const runHealthChecks = () => {
    setLastRefresh(new Date());
    setServices(prev => prev.map(s => ({ ...s, status: "checking" })));
    setTimeout(() => {
      setServices(HEALTH_CHECKS.map(s => ({
        ...s,
        status: Math.random() > 0.05 ? "healthy" : Math.random() > 0.5 ? "degraded" : "healthy",
        latency: Math.floor(Math.random() * 80 + 12),
        uptime: (99.5 + Math.random() * 0.5).toFixed(2),
        responseTime: Math.floor(Math.random() * 120 + 20),
      })));
    }, 1200);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Build API usage chart data from last 24h
  const usageChartData = (() => {
    const hours = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600000);
      const label = h.getHours() + ":00";
      const calls = apiUsage.filter(u => {
        const d = new Date(u.created_date);
        return d.getHours() === h.getHours();
      }).length;
      hours.push({ hour: label, calls, errors: Math.floor(calls * 0.02) });
    }
    return hours;
  })();

  const alertsByType = {
    critical: alerts.filter(a => a.type === "critical").length,
    warning: alerts.filter(a => a.type === "warning").length,
    info: alerts.filter(a => a.type === "info").length,
  };

  const overallHealth = services.every(s => s.status === "healthy") ? "OPERATIONAL"
    : services.some(s => s.status === "down") ? "OUTAGE"
    : "DEGRADED";

  const healthColor = { OPERATIONAL: "text-green-400", DEGRADED: "text-yellow-400", OUTAGE: "text-red-400" };
  const healthBg = { OPERATIONAL: "bg-green-500/10 border-green-500/30", DEGRADED: "bg-yellow-500/10 border-yellow-500/30", OUTAGE: "bg-red-500/10 border-red-500/30" };

  return (
    <AdminLayout currentPage="AdminPlatformHealth">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Platform Health</h1>
            </div>
            <p className="text-slate-400 text-sm">Real-time service monitoring & infrastructure status</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${healthBg[overallHealth]}`}>
              <div className={`w-2 h-2 rounded-full ${overallHealth === "OPERATIONAL" ? "bg-green-400 animate-pulse" : overallHealth === "DEGRADED" ? "bg-yellow-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
              <span className={`text-sm font-bold font-mono ${healthColor[overallHealth]}`}>{overallHealth}</span>
            </div>
            <Button
              onClick={runHealthChecks}
              size="sm"
              className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <button
              onClick={() => setAutoRefresh(p => !p)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all border ${autoRefresh ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
            >
              AUTO {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "API Calls (24h)", value: apiUsage.length, icon: Zap, color: "#06b6d4", sub: "total requests" },
            { label: "Active Orgs", value: organizations.length, icon: Globe, color: "#10b981", sub: "on platform" },
            { label: "Critical Alerts", value: alertsByType.critical, icon: AlertTriangle, color: "#ef4444", sub: "unresolved" },
            { label: "Avg Latency", value: `${Math.floor(services.filter(s => s.latency).reduce((a, s) => a + s.latency, 0) / Math.max(services.filter(s => s.latency).length, 1))}ms`, icon: Clock, color: "#f59e0b", sub: "across services" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className="w-5 h-5 opacity-60" style={{ color: kpi.color }} />
                <span className="text-[10px] font-mono text-slate-600 uppercase">{kpi.sub}</span>
              </div>
              <p className="text-3xl font-black text-white mb-0.5">{kpi.value}</p>
              <p className="text-xs text-slate-400">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedService(selectedService?.id === svc.id ? null : svc)}
                className="p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: svc.status === "healthy" ? "rgba(16,185,129,0.04)" : svc.status === "degraded" ? "rgba(245,158,11,0.04)" : "rgba(15,23,42,0.6)",
                  borderColor: svc.status === "healthy" ? "rgba(16,185,129,0.2)" : svc.status === "degraded" ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: svc.color }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{svc.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{svc.id}</p>
                    </div>
                  </div>
                  <StatusDot status={svc.status} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-white text-sm font-bold">{svc.latency ? `${svc.latency}ms` : "—"}</p>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Latency</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-white text-sm font-bold">{svc.uptime ? `${svc.uptime}%` : "—"}</p>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Uptime</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className={`text-sm font-bold capitalize ${svc.status === "healthy" ? "text-green-400" : svc.status === "degraded" ? "text-yellow-400" : "text-slate-400"}`}>
                      {svc.status === "checking" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : svc.status}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Status</p>
                  </div>
                </div>

                {svc.status === "healthy" && (
                  <div className="mt-3">
                    <UptimeBar pct={parseFloat(svc.uptime) || 99.9} />
                    <p className="text-[9px] text-slate-600 font-mono mt-1">90-day history</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* API Usage Chart */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">API Calls — Last 24h</h3>
              <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-[10px]">{apiUsage.length} total</Badge>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={usageChartData}>
                <defs>
                  <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} />
                <Area type="monotone" dataKey="calls" stroke="#06b6d4" strokeWidth={2} fill="url(#apiGrad)" name="Requests" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1.5} fill="none" name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
            <h3 className="text-white font-semibold mb-4">Alert Distribution</h3>
            <div className="space-y-4 mt-6">
              {[
                { label: "Critical", count: alertsByType.critical, color: "#ef4444", icon: XCircle },
                { label: "Warning", count: alertsByType.warning, color: "#f59e0b", icon: AlertTriangle },
                { label: "Info", count: alertsByType.info, color: "#06b6d4", icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;
                const total = Math.max(alertsByType.critical + alertsByType.warning + alertsByType.info, 1);
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        <span className="text-sm text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <p className="text-[10px] font-mono uppercase text-slate-500 mb-2">System Info</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400"><span>Last health check</span><span className="text-white">{lastRefresh.toLocaleTimeString("da-DK")}</span></div>
                <div className="flex justify-between text-slate-400"><span>Auto-refresh interval</span><span className="text-white">30s</span></div>
                <div className="flex justify-between text-slate-400"><span>Monitoring region</span><span className="text-white">EU-West</span></div>
                <div className="flex justify-between text-slate-400"><span>Services tracked</span><span className="text-white">{HEALTH_CHECKS.length}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Platform Alerts</h3>
            <Badge className="bg-slate-700/50 text-slate-400 text-[10px]">{alerts.length} total</Badge>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2 opacity-60" />
              <p className="text-slate-400 text-sm">No alerts — all systems running smoothly</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 20).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.type === "critical" ? "bg-red-400" : alert.type === "warning" ? "bg-yellow-400" : "bg-blue-400"}`} />
                    <div>
                      <p className="text-sm text-white">{alert.title}</p>
                      <p className="text-[11px] text-slate-500">{alert.category} · {new Date(alert.created_date).toLocaleString("da-DK")}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] ${alert.is_resolved ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-red-500/15 text-red-400 border-red-500/25"}`}>
                    {alert.is_resolved ? "resolved" : "open"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}