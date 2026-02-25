import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Dna, Brain, Zap, AlertTriangle, CheckCircle2, Loader2, 
  Activity, Lock, Eye, Wifi, Satellite, Database, Radio, GitMerge,
  RefreshCw, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import moment from "moment";

// ─── Layer Card ──────────────────────────────────────────────────────────────
function LayerCard({ icon: Icon, color, title, subtitle, active, threatCount, lastAction }) {
  const colorMap = {
    amber: { border: "border-amber-500/40", icon: "text-amber-400", bg: "bg-amber-500/10", pulse: "bg-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    violet: { border: "border-violet-500/40", icon: "text-violet-400", bg: "bg-violet-500/10", pulse: "bg-violet-400", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    cyan: { border: "border-cyan-500/40", icon: "text-cyan-400", bg: "bg-cyan-500/10", pulse: "bg-cyan-400", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  };
  const c = colorMap[color];

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${c.icon}`} />
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${active ? c.pulse + ' animate-pulse' : 'bg-slate-600'}`} />
          <span className={`text-[10px] font-mono ${active ? c.icon : 'text-slate-500'}`}>{active ? 'ACTIVE' : 'IDLE'}</span>
        </div>
      </div>
      <p className={`text-xs font-mono ${c.icon} uppercase tracking-wider`}>{subtitle}</p>
      {threatCount > 0 && (
        <Badge className={`${c.badge} w-fit text-[10px]`}>{threatCount} threats handled</Badge>
      )}
      {lastAction && (
        <p className="text-[10px] text-slate-500 truncate">{lastAction}</p>
      )}
    </div>
  );
}

// ─── Threat Row ───────────────────────────────────────────────────────────────
function ThreatRow({ log }) {
  const isCyber = log.action?.includes('CYBER') || log.action?.includes('GPS') || log.action?.includes('API_ABUSE') || log.action?.includes('BRUTE') || log.action?.includes('INJECTION') || log.action?.includes('LOCKDOWN') || log.action?.includes('CASCADE') || log.action?.includes('IMMUNITY');
  const isAI = log.action?.includes('AI');

  const color = log.severity === 'critical' ? 'text-red-400 border-red-500/20 bg-red-500/5' 
    : log.severity === 'high' ? 'text-orange-400 border-orange-500/20 bg-orange-500/5'
    : log.severity === 'medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
    : 'text-slate-400 border-slate-700/30 bg-slate-800/30';

  return (
    <div className={`p-3 rounded-lg border ${color} mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-xs font-mono font-semibold truncate">{log.action}</span>
            {isCyber && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">CYBER</Badge>}
            {isAI && <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[9px]">AI</Badge>}
            <Badge className={`text-[9px] border-0 ${
              log.status === 'blocked' ? 'bg-red-500/20 text-red-400' 
              : log.status === 'failed' ? 'bg-orange-500/20 text-orange-400'
              : 'bg-emerald-500/20 text-emerald-400'
            }`}>{log.status}</Badge>
          </div>
          {log.details && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{log.details}</p>}
        </div>
        <span className="text-[10px] text-slate-600 whitespace-nowrap">{moment(log.created_date).fromNow()}</span>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function ImmuneSystemPanel({ orgId }) {
  const [running, setRunning] = useState(false);
  const [lastCycleResult, setLastCycleResult] = useState(null);

  // Latest SecurityAudit entries from immunity engine
  const { data: auditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['immunityAuditLogs', orgId],
    queryFn: () => orgId 
      ? base44.entities.SecurityAudit.filter({ organization_id: orgId }, '-created_date', 30)
      : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.SecurityAudit.subscribe((event) => {
      if (event.type === 'create') refetchLogs();
    });
    return unsub;
  }, [refetchLogs]);

  // Compute immunity layers from audit data
  const immunityAudits = auditLogs.filter(l => l.user_email === 'immunity-engine@system');
  const lastCycle = immunityAudits.find(l => l.action === 'AUTONOMOUS_IMMUNITY_CYCLE_V2');
  const cyberThreatsDetected = auditLogs.filter(l => 
    l.action?.includes('API_ABUSE') || l.action?.includes('BRUTE') || 
    l.action?.includes('ACCOUNT_LOCKDOWN') || l.action?.includes('LOCKED')
  );
  const gpsThreatLogs = auditLogs.filter(l => l.action?.includes('GPS'));
  const aiLogs = auditLogs.filter(l => l.action?.includes('AI'));
  const hasThreats = cyberThreatsDetected.length > 0 || gpsThreatLogs.length > 0;

  // Innate defense: offline vehicles + GPS + data integrity (from audit details)
  const innateActions = auditLogs.filter(l => 
    l.action?.includes('GPS') || l.action?.includes('OFFLINE') || 
    l.action?.includes('FUEL') || l.action?.includes('INJECTION') ||
    l.action?.includes('ROUTE_DATA') || l.action?.includes('GHOST')
  ).length;

  // Adaptive AI
  const adaptiveActions = auditLogs.filter(l => 
    l.action?.includes('API_ABUSE') || l.action?.includes('BRUTE') || 
    l.action?.includes('ACCOUNT') || l.action?.includes('AI') || 
    l.action?.includes('CASCADE') || l.action?.includes('LOCKDOWN')
  ).length;

  // Memory: total cycle count
  const memoryCycles = immunityAudits.filter(l => l.action === 'AUTONOMOUS_IMMUNITY_CYCLE_V2').length;

  // Overall health
  const criticalCount = auditLogs.filter(l => l.severity === 'critical').length;
  const healthScore = Math.max(0, 100 - (criticalCount * 8) - (cyberThreatsDetected.length * 5));

  const runCycle = async () => {
    setRunning(true);
    toast.info("Running immunity cycle...");
    const res = await base44.functions.invoke('autonomousImmunityEngine', {});
    setLastCycleResult(res.data);
    await refetchLogs();
    setRunning(false);
    toast.success(`Immunity cycle complete — ${res.data?.total_actions_taken || 0} actions taken`);
  };

  const recentThreats = auditLogs.filter(l => l.severity === 'critical' || l.severity === 'high').slice(0, 10);

  return (
    <div className="space-y-5">

      {/* Header + status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-violet-400" />
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${hasThreats ? 'bg-red-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Fleet Immune System</h2>
            <p className="text-xs text-slate-400">Autonomous · Self-Healing · Always-On</p>
          </div>
          <Badge className={`${hasThreats ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
            {hasThreats ? `⚠ THREATS DETECTED` : '✓ HEALTHY'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {lastCycle && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              Last cycle: {moment(lastCycle.created_date).fromNow()}
            </div>
          )}
          <Button
            onClick={runCycle}
            disabled={running}
            size="sm"
            className="bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
          >
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {running ? 'Running...' : 'Run Cycle Now'}
          </Button>
        </div>
      </div>

      {/* Health score */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 flex flex-col items-center justify-center">
          <p className={`text-4xl font-black ${healthScore > 80 ? 'text-emerald-400' : healthScore > 60 ? 'text-yellow-400' : 'text-red-400'}`}>{healthScore}</p>
          <p className="text-slate-400 text-xs text-center mt-1">Immune Health Score</p>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <p className="text-red-400 font-bold text-xl">{criticalCount}</p>
            <p className="text-slate-500 text-xs">Critical Events</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <p className="text-amber-400 font-bold text-xl">{cyberThreatsDetected.length}</p>
            <p className="text-slate-500 text-xs">Cyber Threats</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <p className="text-cyan-400 font-bold text-xl">{memoryCycles}</p>
            <p className="text-slate-500 text-xs">Immunity Cycles</p>
          </div>
        </div>
      </div>

      {/* Three immunity layers */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Three-Layer Defense — Modeled After Human Immune System</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LayerCard
            icon={Shield}
            color="amber"
            title="Innate Defense"
            subtitle="First response · seconds"
            active={innateActions > 0}
            threatCount={innateActions}
            lastAction={auditLogs.find(l => l.action?.includes('GPS') || l.action?.includes('OFFLINE'))?.details?.slice(0, 60)}
          />
          <LayerCard
            icon={Dna}
            color="violet"
            title="Adaptive AI Defense"
            subtitle="Targeted response · minutes"
            active={adaptiveActions > 0}
            threatCount={adaptiveActions}
            lastAction={auditLogs.find(l => l.action?.includes('API_ABUSE') || l.action?.includes('AI'))?.details?.slice(0, 60)}
          />
          <LayerCard
            icon={Brain}
            color="cyan"
            title="Immune Memory"
            subtitle="Long-term protection · permanent"
            active={memoryCycles > 0}
            threatCount={memoryCycles}
            lastAction={lastCycle?.details?.slice(0, 60)}
          />
        </div>
      </div>

      {/* Cyber threat subsystems */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">AI-Powered Cyber Sentinels</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { icon: Satellite, label: "GPS Spoofing Detection", count: auditLogs.filter(l => l.action?.includes('GPS')).length, color: "cyan" },
            { icon: Activity, label: "Abnormal Login Patterns", count: auditLogs.filter(l => l.action?.includes('ACCOUNT')).length, color: "violet" },
            { icon: Radio, label: "API Abuse Detection", count: auditLogs.filter(l => l.action?.includes('API_ABUSE') || l.action?.includes('BRUTE')).length, color: "amber" },
            { icon: Database, label: "Data Manipulation", count: auditLogs.filter(l => l.action?.includes('INJECTION') || l.action?.includes('FUEL_DATA') || l.action?.includes('ROUTE_DATA')).length, color: "emerald" },
            { icon: GitMerge, label: "Federated Privacy Guard", count: memoryCycles, color: "violet" },
            { icon: Wifi, label: "Swarm-Coordinated Response", count: auditLogs.filter(l => l.action?.includes('CASCADE') || l.action?.includes('LOCKDOWN')).length, color: "cyan" },
          ].map((item, i) => {
            const Icon = item.icon;
            const colorMap = {
              cyan: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5",
              violet: "border-violet-500/20 text-violet-400 bg-violet-500/5",
              amber: "border-amber-500/20 text-amber-400 bg-amber-500/5",
              emerald: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
            };
            return (
              <div key={i} className={`p-3 rounded-xl border ${colorMap[item.color]} flex items-center gap-3`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${colorMap[item.color].split(' ')[2]?.replace('bg-', 'text-')}`} />
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{item.label}</p>
                  <p className="text-slate-500 text-[10px]">{item.count} events logged</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last cycle result */}
      {lastCycleResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <p className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Last Cycle Complete
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-white font-bold">{lastCycleResult.organizations_processed}</p>
              <p className="text-slate-500 text-[10px]">Orgs Scanned</p>
            </div>
            <div>
              <p className="text-white font-bold">{lastCycleResult.total_actions_taken}</p>
              <p className="text-slate-500 text-[10px]">Actions Taken</p>
            </div>
            <div>
              <p className="text-white font-bold">{lastCycleResult.results?.[0]?.cycle_number || '—'}</p>
              <p className="text-slate-500 text-[10px]">Cycle #</p>
            </div>
          </div>
          {lastCycleResult.immunity_log?.length > 0 && (
            <div className="mt-3 space-y-1">
              {lastCycleResult.immunity_log.slice(0, 4).map((entry, i) => (
                <div key={i} className={`text-[10px] flex items-center gap-2 ${entry.severity === 'critical' ? 'text-red-400' : entry.severity === 'high' ? 'text-orange-400' : 'text-slate-400'}`}>
                  <span className="font-mono">[{entry.severity?.toUpperCase()}]</span>
                  <span>{entry.action}: {entry.details}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Recent high-severity threats */}
      {recentThreats.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Recent Threats Detected & Logged
          </p>
          <div className="max-h-64 overflow-y-auto space-y-0 pr-1">
            {recentThreats.map(log => <ThreatRow key={log.id} log={log} />)}
          </div>
        </div>
      )}

      {recentThreats.length === 0 && !running && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 text-sm">No critical threats detected — fleet immune system nominal</p>
        </div>
      )}

    </div>
  );
}