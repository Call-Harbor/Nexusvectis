import { useMemo } from "react";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Users, Clock } from "lucide-react";

const getColor = (wait) => wait <= 10 ? "#10b981" : wait <= 20 ? "#f59e0b" : wait <= 30 ? "#f97316" : "#f43f5e";
const getStatusColor = { open: "#10b981", degraded: "#f59e0b", closed: "#f43f5e" };

function LaneCard({ lane }) {
  const wait = lane.wait_minutes || 0;
  const color = getColor(wait);
  const statusColor = getStatusColor[lane.status] || "#64748b";
  const queuePct = Math.min(100, ((lane.queue_length || 0) / 80) * 100);
  const throughputPct = Math.min(100, ((lane.throughput_per_hour || 0) / 300) * 100);
  const staffed = (lane.staff_assigned || 0) >= (lane.staff_required || 2);
  const slaBreached = wait > 20;

  return (
    <div className="rounded-xl p-3" style={{ background: `${color}07`, border: `1px solid ${color}25` }}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
          <span className="text-[11px] font-black text-white">{lane.name}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
            style={{ background: "rgba(100,116,139,0.2)", color: "#64748b" }}>
            {lane.lane_type?.replace(/_/g, " ") || "standard"}
          </span>
          {slaBreached && (
            <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse"
              style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
              SLA ⚠
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[8px] text-slate-600 uppercase tracking-widest">WAIT TIME</p>
            <p className="text-lg font-black leading-none font-mono" style={{ color }}>{wait}m</p>
          </div>
        </div>
      </div>

      {/* Queue bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] text-slate-600 uppercase tracking-widest">QUEUE: {lane.queue_length || 0} pax</span>
            <span className="text-[8px] font-bold" style={{ color }}>{Math.round(queuePct)}% capacity</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${queuePct}%`, background: color }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center px-2 py-1.5 rounded-lg" style={{ background: "rgba(6,182,212,0.08)" }}>
          <p className="text-[7px] text-slate-600 uppercase tracking-widest">Throughput/h</p>
          <p className="text-sm font-black text-cyan-400">{lane.throughput_per_hour || 180}</p>
        </div>
        <div className="text-center px-2 py-1.5 rounded-lg" style={{ background: staffed ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)" }}>
          <p className="text-[7px] text-slate-600 uppercase tracking-widest">Staff</p>
          <p className="text-sm font-black" style={{ color: staffed ? "#10b981" : "#f43f5e" }}>{lane.staff_assigned || 0}/{lane.staff_required || 2}</p>
        </div>
        <div className="text-center px-2 py-1.5 rounded-lg" style={{ background: "rgba(100,116,139,0.08)" }}>
          <p className="text-[7px] text-slate-600 uppercase tracking-widest">Status</p>
          <p className="text-[9px] font-black uppercase" style={{ color: statusColor }}>{lane.status}</p>
        </div>
      </div>
    </div>
  );
}

export default function SecurityMonitor({ securityLanes, staff }) {
  const securityStaff = staff.filter(s => s.role === "security_officer");

  const metrics = useMemo(() => {
    const totalQueue = securityLanes.reduce((s, l) => s + (l.queue_length || 0), 0);
    const avgWait = securityLanes.length > 0
      ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
      : 0;
    const openLanes = securityLanes.filter(l => l.status === "open").length;
    const slaBreaches = securityLanes.filter(l => (l.wait_minutes || 0) > 20).length;
    const understaffed = securityLanes.filter(l => (l.staff_assigned || 0) < (l.staff_required || 2)).length;
    const totalThroughput = securityLanes.reduce((s, l) => s + (l.throughput_per_hour || 0), 0);
    const maxWait = Math.max(...securityLanes.map(l => l.wait_minutes || 0), 0);
    return { totalQueue, avgWait, openLanes, slaBreaches, understaffed, totalThroughput, maxWait };
  }, [securityLanes]);

  const systemColor = metrics.slaBreaches > 1 ? "#f43f5e" : metrics.slaBreaches > 0 ? "#f59e0b" : "#10b981";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.95)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60" style={{ background: "rgba(0,12,28,0.9)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400">SECURITY CONTROL</h2>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: systemColor }} />
          </div>
          <div className="flex items-center gap-2">
            {metrics.slaBreaches > 0 && (
              <span className="flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-lg"
              style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}>
              <AlertTriangle className="w-2.5 h-2.5" />{metrics.slaBreaches} SLA BREACH
              </span>
            )}
            {metrics.understaffed > 0 && (
              <span className="flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-lg"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Users className="w-2.5 h-2.5" />{metrics.understaffed} UNDERSTAFFED
              </span>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Queue Total", val: metrics.totalQueue, color: getColor(metrics.avgWait), sub: "pax" },
              { label: "Avg Wait", val: `${metrics.avgWait}m`, color: getColor(metrics.avgWait), sub: `max ${metrics.maxWait}m` },
              { label: "Open Lanes", val: `${metrics.openLanes}/${securityLanes.length}`, color: "#06b6d4", sub: "active" },
              { label: "Throughput", val: metrics.totalThroughput, color: "#8b5cf6", sub: "pax/h" },
              { label: "Sec. Staff", val: securityStaff.filter(s => s.status === "on_duty" || s.status === "assigned").length, color: "#10b981", sub: `of ${securityStaff.length}` },
          ].map(k => (
            <div key={k.label} className="text-center px-2 py-2 rounded-xl"
              style={{ background: `${k.color}09`, border: `1px solid ${k.color}20` }}>
              <p className="text-[7px] uppercase tracking-widest mb-0.5" style={{ color: `${k.color}70` }}>{k.label}</p>
              <p className="text-base font-black leading-none font-mono" style={{ color: k.color }}>{k.val}</p>
              <p className="text-[7px] mt-0.5" style={{ color: `${k.color}50` }}>{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lane cards */}
      <div className="p-4 space-y-2 max-h-[450px] overflow-y-auto">
        {securityLanes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-700">
            <Shield className="w-8 h-8 mb-3" />
            <p className="text-sm font-bold">No security lanes configured</p>
            <p className="text-xs mt-1">Go to Infrastructure to add lanes</p>
          </div>
        )}
        {securityLanes.map(lane => <LaneCard key={lane.id} lane={lane} />)}
      </div>

      {/* Security staff */}
      {securityStaff.length > 0 && (
        <div className="px-4 pb-4 border-t border-slate-800/40 pt-3">
          <p className="text-[8px] tracking-widest uppercase text-slate-600 mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> SECURITY STAFF
          </p>
          <div className="flex flex-wrap gap-1.5">
            {securityStaff.slice(0, 16).map(s => {
              const sc = s.status === "on_duty" ? "#10b981" : s.status === "assigned" ? "#06b6d4" : s.status === "on_break" ? "#f59e0b" : "#334155";
              return (
                <div key={s.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: `${sc}12`, color: sc, border: `1px solid ${sc}25` }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc }} />
                  {s.name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}