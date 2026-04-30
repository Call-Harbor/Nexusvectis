import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Eye, Lock, User,
  Globe, Clock, Zap, TrendingUp, Filter, Search, ChevronDown,
  Activity, Database, Server, FileText, RefreshCw, AlertOctagon,
  Ban, Key, Fingerprint, Cpu, Layers
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEVERITY_STYLES = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

const STATUS_STYLES = {
  success: "bg-green-500/15 text-green-400 border-green-500/25",
  failed: "bg-red-500/15 text-red-400 border-red-500/25",
  blocked: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

function ThreatMeter({ level }) {
  const levels = { low: { pct: 15, color: "#22c55e", label: "LOW" }, medium: { pct: 45, color: "#f59e0b", label: "MEDIUM" }, high: { pct: 75, color: "#f97316", label: "HIGH" }, critical: { pct: 95, color: "#ef4444", label: "CRITICAL" } };
  const l = levels[level] || levels.low;
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={l.color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(l.pct / 100) * 157} 157`} style={{ filter: `drop-shadow(0 0 6px ${l.color}80)` }} />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-2xl font-black" style={{ color: l.color }}>{l.label}</p>
        <p className="text-[10px] text-slate-500 font-mono">THREAT LEVEL</p>
      </div>
    </div>
  );
}

export default function AdminSecurityCenter() {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["securityAudit"],
    queryFn: () => base44.entities.SecurityAudit.list("-created_date", 200),
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => base44.entities.APIKey.list("-created_date"),
  });

  const { data: apiUsage = [] } = useQuery({
    queryKey: ["apiUsage"],
    queryFn: () => base44.entities.APIUsage.list("-created_date", 500),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  // Threat level calculation
  const failedCount = auditLogs.filter(l => l.status === "failed").length;
  const blockedCount = auditLogs.filter(l => l.status === "blocked").length;
  const criticalCount = auditLogs.filter(l => l.severity === "critical").length;
  const threatScore = Math.min(100, (failedCount * 2 + blockedCount * 5 + criticalCount * 10));
  const threatLevel = threatScore > 75 ? "critical" : threatScore > 50 ? "high" : threatScore > 25 ? "medium" : "low";

  // Active API keys
  const activeKeys = apiKeys.filter(k => k.status === "active");

  // Build hourly activity chart
  const activityData = (() => {
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 3600000);
      const hour = h.getHours();
      const logs = auditLogs.filter(l => new Date(l.created_date).getHours() === hour);
      return {
        hour: `${hour}:00`,
        events: logs.length,
        failures: logs.filter(l => l.status === "failed").length,
        blocked: logs.filter(l => l.status === "blocked").length,
      };
    });
  })();

  // Filtered logs
  const filtered = auditLogs
    .filter(l => {
      const q = search.toLowerCase();
      return l.action?.toLowerCase().includes(q) || l.user_email?.toLowerCase().includes(q) || l.resource_type?.toLowerCase().includes(q);
    })
    .filter(l => filterSeverity === "all" || l.severity === filterSeverity)
    .filter(l => filterStatus === "all" || l.status === filterStatus);

  // Top actors
  const actorMap = {};
  auditLogs.forEach(l => {
    if (l.user_email) {
      actorMap[l.user_email] = (actorMap[l.user_email] || 0) + 1;
    }
  });
  const topActors = Object.entries(actorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Action distribution
  const actionMap = {};
  auditLogs.forEach(l => {
    const cat = l.action?.split("_")[0] || "other";
    actionMap[cat] = (actionMap[cat] || 0) + 1;
  });
  const actionData = Object.entries(actionMap).slice(0, 8).map(([name, count]) => ({ name, count }));

  return (
    <AdminLayout currentPage="AdminSecurityCenter">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Security Center</h1>
            </div>
            <p className="text-slate-400 text-sm">Platform security monitoring, audit logs & threat intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            {["24h", "7d", "30d"].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${timeRange === r ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Threat overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Threat meter */}
          <div className="col-span-1 p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 flex flex-col items-center justify-center">
            <ThreatMeter level={threatLevel} />
            <div className="mt-4 text-center">
              <p className="text-white text-sm font-semibold">{auditLogs.length} events</p>
              <p className="text-slate-500 text-xs">in audit log</p>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {[
              { label: "Failed Attempts", value: failedCount, icon: XCircle, color: "#ef4444", sub: "auth & actions" },
              { label: "Blocked Events", value: blockedCount, icon: Ban, color: "#f97316", sub: "security blocks" },
              { label: "Critical Severity", value: criticalCount, icon: AlertOctagon, color: "#ec4899", sub: "high impact" },
              { label: "Active API Keys", value: activeKeys.length, icon: Key, color: "#06b6d4", sub: "across orgs" },
              { label: "API Calls (total)", value: apiUsage.length, icon: Zap, color: "#8b5cf6", sub: "all requests" },
              { label: "Unique Actors", value: Object.keys(actorMap).length, icon: Fingerprint, color: "#10b981", sub: "distinct users" },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className="w-4 h-4 opacity-70" style={{ color: kpi.color }} />
                  <span className="text-[9px] text-slate-600 font-mono uppercase">{kpi.sub}</span>
                </div>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className="text-xs text-slate-400">{kpi.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Activity timeline */}
          <div className="col-span-2 p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
            <h3 className="text-white font-semibold mb-4">Security Events — 24h Timeline</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fill="url(#evGrad)" name="Events" />
                <Area type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={1.5} fill="url(#failGrad)" name="Failures" />
                <Area type="monotone" dataKey="blocked" stroke="#f97316" strokeWidth={1.5} fill="none" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top actors */}
          <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
            <h3 className="text-white font-semibold mb-4">Top Actors</h3>
            <div className="space-y-3">
              {topActors.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">No audit data yet</p>
              ) : topActors.map(([email, count], i) => {
                const maxCount = topActors[0][1];
                return (
                  <div key={email}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300 truncate max-w-[70%]">{email}</span>
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <h4 className="text-white font-semibold text-sm mb-3">Action Types</h4>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={actionData} layout="vertical">
                  <XAxis type="number" stroke="#475569" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fontSize: 9 }} width={60} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">API Keys</h3>
            <div className="flex gap-2">
              <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[10px]">{activeKeys.length} active</Badge>
              <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px]">{apiKeys.filter(k => k.status === "revoked").length} revoked</Badge>
            </div>
          </div>
          {apiKeys.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No API keys configured</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => {
                const org = organizations.find(o => o.id === key.organization_id);
                return (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white text-sm font-medium">{key.name}</p>
                        <p className="text-slate-500 text-xs">{org?.name || "Unknown org"} · {key.key_prefix}••••••••</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {key.last_used && <span className="text-slate-500 text-xs">Last used: {new Date(key.last_used).toLocaleDateString("da-DK")}</span>}
                      <Badge className={key.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/25 text-[9px]" : "bg-slate-700/50 text-slate-500 text-[9px]"}>
                        {key.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Audit Log ({filtered.length})</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="pl-8 h-8 text-xs bg-slate-900/60 border-slate-700 text-white w-48" />
              </div>
              {["all", "critical", "high", "medium", "low"].map(s => (
                <button key={s} onClick={() => setFilterSeverity(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize border transition-all ${filterSeverity === s ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-white"}`}>
                  {s}
                </button>
              ))}
              {["all", "success", "failed", "blocked"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize border transition-all ${filterStatus === s ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-slate-500">No audit events found</p>
              <p className="text-slate-600 text-xs mt-1">Security events will appear here when actions are performed</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {filtered.map(log => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-green-400" : log.status === "failed" ? "bg-red-400" : "bg-orange-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-xs font-medium">{log.action}</span>
                      <span className="text-slate-500 text-[10px]">{log.user_email}</span>
                      {log.resource_type && <span className="text-slate-600 text-[10px]">· {log.resource_type}</span>}
                    </div>
                    {log.details && <p className="text-slate-500 text-[10px] mt-0.5 truncate">{log.details}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.severity && (
                      <Badge className={`text-[9px] ${SEVERITY_STYLES[log.severity] || ""}`}>{log.severity}</Badge>
                    )}
                    <Badge className={`text-[9px] ${STATUS_STYLES[log.status] || ""}`}>{log.status}</Badge>
                    <span className="text-slate-600 text-[10px] font-mono">{new Date(log.created_date).toLocaleTimeString("da-DK")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}