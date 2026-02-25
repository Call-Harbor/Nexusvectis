import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Dna, Brain, Zap, AlertTriangle, CheckCircle2, Loader2,
  Activity, Lock, Eye, Wifi, Satellite, Database, Radio, GitMerge,
  RefreshCw, Clock, ChevronDown, ChevronUp, Bug
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import moment from "moment";

// ─── Animated health ring ──────────────────────────────────────────────────────
function HealthRing({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-slate-500">health</span>
      </div>
    </div>
  );
}

// ─── Layer Card ───────────────────────────────────────────────────────────────
function LayerCard({ icon: Icon, color, title, subtitle, active, count, lastAction, expanded, onToggle }) {
  const cm = {
    amber: { border: "border-amber-500/40", icon: "text-amber-400", bg: "bg-amber-500/8", pulse: "bg-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    violet: { border: "border-violet-500/40", icon: "text-violet-400", bg: "bg-violet-500/8", pulse: "bg-violet-400", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    cyan: { border: "border-cyan-500/40", icon: "text-cyan-400", bg: "bg-cyan-500/8", pulse: "bg-cyan-400", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  };
  const c = cm[color];
  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`} style={{ background: 'rgba(15,23,42,0.6)' }}>
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-all">
        <div className={`p-2 rounded-lg ${color === 'amber' ? 'bg-amber-500/10' : color === 'violet' ? 'bg-violet-500/10' : 'bg-cyan-500/10'}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-semibold">{title}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? c.pulse + ' animate-pulse' : 'bg-slate-600'}`} />
          </div>
          <p className={`text-[10px] font-mono ${c.icon} uppercase tracking-wide`}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <Badge className={`${c.badge} text-[9px]`}>{count} events</Badge>}
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && lastAction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/60 px-3 py-2"
          >
            <p className="text-[10px] text-slate-400 leading-relaxed">{lastAction}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Threat timeline row ──────────────────────────────────────────────────────
function ThreatRow({ log, isNew }) {
  const isCyber = /GPS|API_ABUSE|BRUTE|INJECTION|FUEL_DATA|ROUTE_DATA|GHOST|LOCKDOWN|CASCADE/.test(log.action);
  const isAI = log.action?.includes('AI');
  const colors = {
    critical: 'border-red-500/20 bg-red-500/5',
    high: 'border-orange-500/20 bg-orange-500/5',
    medium: 'border-yellow-500/20 bg-yellow-500/5',
    low: 'border-slate-700/30 bg-slate-800/20',
  };
  const textColors = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-slate-400' };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-2.5 rounded-lg border ${colors[log.severity] || colors.low} mb-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`text-[10px] font-mono font-bold truncate ${textColors[log.severity] || 'text-slate-400'}`}>{log.action}</span>
            {isCyber && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[8px]">CYBER</Badge>}
            {isAI && <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[8px]">MISTRAL AI</Badge>}
            <Badge className={`text-[8px] border-0 ${log.status === 'blocked' ? 'bg-red-500/20 text-red-400' : log.status === 'failed' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {log.status}
            </Badge>
          </div>
          {log.details && <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">{log.details}</p>}
        </div>
        <span className="text-[9px] text-slate-600 whitespace-nowrap flex-shrink-0">{moment(log.created_date).fromNow()}</span>
      </div>
    </motion.div>
  );
}

// ─── Sentinel status badge ────────────────────────────────────────────────────
function Sentinel({ icon: Icon, label, count, color }) {
  const colors = {
    cyan: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5",
    violet: "border-violet-500/20 text-violet-400 bg-violet-500/5",
    amber: "border-amber-500/20 text-amber-400 bg-amber-500/5",
    emerald: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
    red: "border-red-500/20 text-red-400 bg-red-500/5",
  };
  return (
    <div className={`p-2.5 rounded-xl border ${colors[color]} flex items-center gap-2`}>
      <Icon className={`w-4 h-4 flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-white text-[10px] font-semibold truncate">{label}</p>
        <p className="text-slate-500 text-[9px]">{count} events logged</p>
      </div>
      {count > 0 && (
        <div className="ml-auto w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ImmuneSystemPanel({ orgId }) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [newLogIds, setNewLogIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: auditLogs = [], refetch } = useQuery({
    queryKey: ['immunityAuditLogs', orgId],
    queryFn: () => orgId
      ? base44.entities.SecurityAudit.filter({ organization_id: orgId }, '-created_date', 40)
      : [],
    enabled: !!orgId,
    refetchInterval: 20000,
  });

  useEffect(() => {
    const unsub = base44.entities.SecurityAudit.subscribe((event) => {
      if (event.type === 'create') {
        refetch();
        setNewLogIds(prev => new Set([...prev, event.id]));
        setTimeout(() => setNewLogIds(prev => { const n = new Set(prev); n.delete(event.id); return n; }), 5000);
      }
    });
    return unsub;
  }, [refetch]);

  const immunityLogs = auditLogs.filter(l => l.user_email === 'immunity-engine@system');
  const lastCycle = immunityLogs.find(l => l.action === 'AUTONOMOUS_IMMUNITY_CYCLE_V2');
  const cycleCount = immunityLogs.filter(l => l.action === 'AUTONOMOUS_IMMUNITY_CYCLE_V2').length;

  const gpsThreats = auditLogs.filter(l => /GPS/.test(l.action));
  const apiThreats = auditLogs.filter(l => /API_ABUSE|BRUTE/.test(l.action));
  const accountThreats = auditLogs.filter(l => /ACCOUNT/.test(l.action));
  const dataThreats = auditLogs.filter(l => /INJECTION|FUEL_DATA|ROUTE_DATA|GHOST/.test(l.action));
  const aiActions = auditLogs.filter(l => /AI_EXCEPTION|AI_STRATEGIC|AI_ASSESSMENT|CASCADE|LOCKDOWN/.test(l.action));
  const physicalThreats = auditLogs.filter(l => /OFFLINE|CRITICAL_FUEL|QUARANTINE|SHIPMENT/.test(l.action));

  const criticalCount = auditLogs.filter(l => l.severity === 'critical').length;
  const highCount = auditLogs.filter(l => l.severity === 'high').length;
  const blockedCount = auditLogs.filter(l => l.status === 'blocked').length;
  const healthScore = Math.max(0, 100 - (criticalCount * 6) - (highCount * 2) - ((gpsThreats.length + apiThreats.length) * 4));

  const hasActiveThreat = criticalCount > 0 || gpsThreats.length > 0 || apiThreats.length > 0 || accountThreats.length > 0;

  const recentThreats = auditLogs
    .filter(l => l.severity === 'critical' || l.severity === 'high')
    .slice(0, 12);

  const runCycle = async () => {
    setRunning(true);
    toast.info("Fleet Immune System — running autonomous cycle...", { duration: 2000 });
    const res = await base44.functions.invoke('autonomousImmunityEngine', {});
    setLastResult(res.data);
    await refetch();
    setRunning(false);
    const actions = res.data?.total_actions_taken || 0;
    toast.success(`Immunity cycle complete — ${actions} protective action${actions !== 1 ? 's' : ''} taken`, { duration: 4000 });
  };

  const layers = [
    {
      icon: Shield, color: 'amber', title: 'Innate Defense', subtitle: 'First response · seconds',
      count: physicalThreats.length + gpsThreats.length + dataThreats.length,
      active: physicalThreats.length > 0 || gpsThreats.length > 0,
      lastAction: lastCycle?.details || 'Scanning fleet for GPS spoofing, null island coordinates, impossible speeds, offline vehicles, critical fuel...'
    },
    {
      icon: Dna, color: 'violet', title: 'Adaptive AI Defense', subtitle: 'Mistral AI · targeted response',
      count: aiActions.length + apiThreats.length + accountThreats.length,
      active: aiActions.length > 0,
      lastAction: aiActions[0]?.details || 'Analyzing threats with Mistral AI — generating targeted countermeasures and cascade risk simulation...'
    },
    {
      icon: Brain, color: 'cyan', title: 'Immune Memory', subtitle: 'Long-term protection · permanent',
      count: cycleCount,
      active: cycleCount > 0,
      lastAction: lastCycle ? `Cycle complete: ${lastCycle.details?.slice(0, 120)}...` : 'SecurityAudit log capturing all events — threat pattern fingerprinting across cycles...'
    },
  ];

  return (
    <div className="space-y-5">

      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className={`w-8 h-8 ${hasActiveThreat ? 'text-red-400' : 'text-violet-400'}`} />
            <motion.div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${hasActiveThreat ? 'bg-red-400' : 'bg-emerald-400'}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Fleet Immune System</h2>
            <p className="text-xs text-slate-400">Autonomous · Self-Healing · Runs every 10 min</p>
          </div>
          <Badge className={`${hasActiveThreat ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'} text-xs`}>
            {hasActiveThreat ? `⚠ THREATS ACTIVE` : '✓ HEALTHY'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {lastCycle && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {moment(lastCycle.created_date).fromNow()}
            </div>
          )}
          <Button
            onClick={runCycle}
            disabled={running}
            size="sm"
            className="bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
          >
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {running ? 'Running Cycle...' : 'Run Cycle Now'}
          </Button>
        </div>
      </div>

      {/* Health overview */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/50 border border-slate-700/50">
        <HealthRing score={healthScore} />
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Immunity Cycles', value: cycleCount, color: 'text-violet-400' },
            { label: 'Critical Events', value: criticalCount, color: 'text-red-400' },
            { label: 'Cyber Threats', value: gpsThreats.length + apiThreats.length + dataThreats.length, color: 'text-amber-400' },
            { label: 'Actions Blocked', value: blockedCount, color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Three layers — expandable */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Three-Layer Defense — Human Immune System Model</p>
        <div className="space-y-2">
          {layers.map((layer, i) => (
            <LayerCard
              key={i}
              {...layer}
              expanded={expandedLayer === i}
              onToggle={() => setExpandedLayer(expandedLayer === i ? null : i)}
            />
          ))}
        </div>
      </div>

      {/* AI Cyber Sentinels */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">AI-Powered Cyber Sentinels — Always Watching</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Sentinel icon={Satellite} label="GPS Spoofing Detection" count={gpsThreats.length} color="cyan" />
          <Sentinel icon={Activity} label="Abnormal Login Patterns" count={accountThreats.length} color="violet" />
          <Sentinel icon={Radio} label="API Abuse / Brute Force" count={apiThreats.length} color="amber" />
          <Sentinel icon={Database} label="Data Manipulation" count={dataThreats.length} color="red" />
          <Sentinel icon={GitMerge} label="Federated Privacy Guard" count={cycleCount} color="violet" />
          <Sentinel icon={Wifi} label="Swarm-Coordinated Defense" count={aiActions.filter(l => /CASCADE|LOCKDOWN/.test(l.action)).length} color="cyan" />
        </div>
      </div>

      {/* Last cycle result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-400 font-bold text-sm">Cycle Complete — {moment().format('HH:mm:ss')}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div>
                <p className="text-white font-bold text-lg">{lastResult.organizations_processed}</p>
                <p className="text-slate-500 text-[10px]">Orgs Scanned</p>
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-lg">{lastResult.total_actions_taken}</p>
                <p className="text-slate-500 text-[10px]">Actions Taken</p>
              </div>
              <div>
                <p className="text-violet-400 font-bold text-lg">{lastResult.immunity_log?.length || 0}</p>
                <p className="text-slate-500 text-[10px]">Log Entries</p>
              </div>
            </div>
            {lastResult.immunity_log?.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lastResult.immunity_log.slice(0, 5).map((entry, i) => (
                  <div key={i} className={`text-[10px] flex items-start gap-2 ${
                    entry.severity === 'critical' ? 'text-red-400'
                    : entry.severity === 'high' ? 'text-orange-400'
                    : entry.severity === 'warning' ? 'text-amber-400'
                    : 'text-slate-400'
                  }`}>
                    <span className="font-mono flex-shrink-0">[{(entry.severity || 'info').toUpperCase()}]</span>
                    <span>{entry.action}: {entry.details}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threat timeline */}
      {recentThreats.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Threat Timeline — High/Critical Events
          </p>
          <div className="max-h-72 overflow-y-auto pr-1">
            <AnimatePresence>
              {recentThreats.map(log => (
                <ThreatRow key={log.id} log={log} isNew={newLogIds.has(log.id)} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {recentThreats.length === 0 && !running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-emerald-400 text-sm font-semibold">Fleet immune system nominal</p>
            <p className="text-slate-500 text-xs">No critical threats detected across {auditLogs.length} logged events</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}