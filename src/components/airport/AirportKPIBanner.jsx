import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

function MiniBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function TrendIcon({ delta }) {
  if (delta > 0) return <TrendingUp className="w-3 h-3" style={{ color: "#f43f5e" }} />;
  if (delta < 0) return <TrendingDown className="w-3 h-3" style={{ color: "#10b981" }} />;
  return <Minus className="w-3 h-3 text-slate-600" />;
}

export default function AirportKPIBanner({ flights, securityLanes, gates, tasks, bags, staff }) {
  const metrics = useMemo(() => {
    const totalFlights = flights.length;
    const onTimeCount = flights.filter(f => (f.delay_minutes || 0) <= 5 && f.status !== "cancelled").length;
    const otp = totalFlights > 0 ? Math.round((onTimeCount / totalFlights) * 100) : 0;

    const avgSecurity = securityLanes.length > 0
      ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
      : 0;
    const maxSecurity = 45;

    const activeGates = gates.filter(g => g.status === "occupied").length;
    const totalGates = gates.length;

    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const delayedTasks = tasks.filter(t => t.status === "delayed").length;
    const allPendingTasks = pendingTasks + delayedTasks;

    const criticalFlights = flights.filter(f => (f.delay_minutes || 0) > 45 || f.status === "cancelled").length;
    const boardingFlights = flights.filter(f => f.status === "boarding").length;

    const staffOnDuty = (staff || []).filter(s => s.status === "on_duty" || s.status === "assigned").length;
    const totalStaff = (staff || []).length;

    const openLanes = securityLanes.filter(l => l.status === "open").length;
    const totalLanes = securityLanes.length;

    const missedBags = (bags || []).filter(b => b.status === "offloaded" || b.status === "missing").length;

    return { otp, avgSecurity, maxSecurity, activeGates, totalGates, allPendingTasks, delayedTasks, criticalFlights, boardingFlights, staffOnDuty, totalStaff, openLanes, totalLanes, missedBags, totalFlights };
  }, [flights, securityLanes, gates, tasks, bags, staff]);

  const kpis = [
    {
      label: "ON-TIME PERF",
      value: `${metrics.otp}%`,
      sub: `${metrics.otp >= 80 ? "▲ NORM" : metrics.otp >= 60 ? "▼ LOW" : "⚠ CRITICAL"}`,
      color: metrics.otp >= 80 ? "#10b981" : metrics.otp >= 60 ? "#f59e0b" : "#f43f5e",
      bar: metrics.otp, barMax: 100,
      delta: metrics.otp >= 80 ? -1 : 1,
      icon: metrics.otp >= 80 ? CheckCircle : AlertTriangle,
    },
    {
      label: "SEC WAIT TIME",
      value: `${metrics.avgSecurity}m`,
      sub: `${metrics.openLanes}/${metrics.totalLanes} lanes open`,
      color: metrics.avgSecurity <= 10 ? "#10b981" : metrics.avgSecurity <= 20 ? "#f59e0b" : "#f43f5e",
      bar: metrics.avgSecurity, barMax: metrics.maxSecurity,
      delta: metrics.avgSecurity > 15 ? 1 : -1,
      icon: Clock,
    },
    {
      label: "ACTIVE GATES",
      value: metrics.activeGates,
      sub: `${metrics.totalGates > 0 ? Math.round((metrics.activeGates / Math.max(metrics.totalGates,1)) * 100) : 0}% occupied`,
      color: "#06b6d4",
      bar: metrics.activeGates, barMax: Math.max(metrics.totalGates, 1),
      delta: 0,
      icon: Zap,
    },
    {
      label: "BOARDING NOW",
      value: metrics.boardingFlights,
      sub: `${metrics.totalFlights} flights total`,
      color: metrics.boardingFlights > 0 ? "#8b5cf6" : "#334155",
      bar: metrics.boardingFlights, barMax: Math.max(metrics.totalFlights, 1),
      delta: 0,
      icon: null,
      pulse: metrics.boardingFlights > 0,
    },
    {
      label: "PENDING TASKS",
      value: metrics.allPendingTasks,
      sub: `${metrics.delayedTasks} delayed`,
      color: metrics.allPendingTasks > 15 ? "#f43f5e" : metrics.allPendingTasks > 5 ? "#f59e0b" : "#10b981",
      bar: metrics.allPendingTasks, barMax: 30,
      delta: metrics.allPendingTasks > 10 ? 1 : 0,
      icon: null,
    },
    {
      label: "HIGH-RISK FLY",
      value: metrics.criticalFlights,
      sub: metrics.criticalFlights > 0 ? "REQUIRES ACTION" : "ALL NORMAL",
      color: metrics.criticalFlights > 0 ? "#f43f5e" : "#10b981",
      bar: metrics.criticalFlights, barMax: 10,
      delta: metrics.criticalFlights > 0 ? 1 : 0,
      icon: metrics.criticalFlights > 0 ? AlertTriangle : CheckCircle,
      pulse: metrics.criticalFlights > 0,
    },
    {
      label: "STAFF",
      value: metrics.staffOnDuty,
      sub: `of ${metrics.totalStaff} on duty`,
      color: metrics.staffOnDuty > 0 ? "#22d3ee" : "#f59e0b",
      bar: metrics.staffOnDuty, barMax: Math.max(metrics.totalStaff, 1),
      delta: 0,
      icon: null,
    },
    {
      label: "BAGGAGE RISK",
      value: metrics.missedBags,
      sub: metrics.missedBags > 0 ? "OFFLOADED/MISSING" : "OK",
      color: metrics.missedBags > 20 ? "#f43f5e" : metrics.missedBags > 5 ? "#f59e0b" : "#10b981",
      bar: metrics.missedBags, barMax: 50,
      delta: metrics.missedBags > 10 ? 1 : 0,
      icon: null,
      pulse: metrics.missedBags > 20,
    },
  ];

  return (
    <div className="flex items-stretch border-b border-slate-800/50 divide-x divide-slate-800/40"
      style={{ background: "linear-gradient(180deg, rgba(0,5,15,0.98) 0%, rgba(0,8,20,0.95) 100%)" }}>
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0 relative overflow-hidden"
            style={{ background: `${k.color}05` }}>
            {/* Glow line top */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.color}40, transparent)` }} />

            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="text-[8px] tracking-widest uppercase font-black leading-tight"
                style={{ color: `${k.color}70` }}>{k.label}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                {k.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: k.color }} />}
                {Icon && <Icon className="w-3 h-3 flex-shrink-0" style={{ color: `${k.color}60` }} />}
              </div>
            </div>

            <div className="flex items-end justify-between gap-1">
              <p className="text-xl font-black leading-none font-mono" style={{ color: k.color }}>{k.value}</p>
              <TrendIcon delta={k.delta} />
            </div>

            <MiniBar value={k.bar} max={k.barMax} color={k.color} />

            <p className="text-[8px] mt-1.5 font-bold truncate" style={{ color: `${k.color}55` }}>{k.sub}</p>
          </div>
        );
      })}
    </div>
  );
}