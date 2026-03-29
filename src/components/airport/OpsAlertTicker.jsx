import { useMemo } from "react";
import { AlertTriangle, Info, CheckCircle, Zap } from "lucide-react";
import moment from "moment";

export default function OpsAlertTicker({ flights, securityLanes, tasks, gates, bags }) {
  const alerts = useMemo(() => {
    const list = [];

    // Critical delays
    flights.filter(f => (f.delay_minutes || 0) > 45).forEach(f => {
      list.push({ type: "critical", icon: AlertTriangle, color: "#f43f5e", msg: `${f.flight_number} FORSINKET +${f.delay_minutes}m · ${f.origin}→${f.destination}`, time: new Date() });
    });

    // Cancelled flights
    flights.filter(f => f.status === "cancelled").forEach(f => {
      list.push({ type: "critical", icon: AlertTriangle, color: "#f43f5e", msg: `${f.flight_number} AFLYST · ${f.origin}→${f.destination}`, time: new Date() });
    });

    // Boarding now
    flights.filter(f => f.status === "boarding").forEach(f => {
      list.push({ type: "info", icon: Zap, color: "#8b5cf6", msg: `BOARDING: ${f.flight_number} · Gate ${f.gate || "TBA"} · ${f.destination}`, time: new Date() });
    });

    // High security wait
    securityLanes.filter(l => (l.wait_minutes || 0) > 20).forEach(l => {
      list.push({ type: "warning", icon: AlertTriangle, color: "#f59e0b", msg: `SEC LANE "${l.name}": ${l.wait_minutes}min ventetid · ${l.queue_length || 0} i kø`, time: new Date() });
    });

    // Delayed tasks
    tasks.filter(t => t.status === "delayed").slice(0, 3).forEach(t => {
      list.push({ type: "warning", icon: AlertTriangle, color: "#f97316", msg: `GROUND OP FORSINKET: ${t.task_type || t.title || "Opgave"} · ${t.aircraft_registration || ""}`, time: new Date() });
    });

    // Missing bags
    (bags || []).filter(b => b.status === "missing").slice(0, 3).forEach(b => {
      list.push({ type: "critical", icon: AlertTriangle, color: "#f43f5e", msg: `BAGAGE MANGLER: ${b.tag_number || b.id?.slice(0,8)} · Fly ${b.flight_number || "?"}`, time: new Date() });
    });

    // Gate conflicts (multiple flights at same gate)
    const gateCounts = {};
    flights.filter(f => f.gate && !["departed","landed","cancelled"].includes(f.status)).forEach(f => {
      gateCounts[f.gate] = (gateCounts[f.gate] || []).concat(f);
    });
    Object.entries(gateCounts).filter(([, fs]) => fs.length > 1).forEach(([gate, fs]) => {
      list.push({ type: "warning", icon: AlertTriangle, color: "#f59e0b", msg: `GATE KONFLIKT: Gate ${gate} · ${fs.map(f => f.flight_number).join(" & ")} tildelt samme gate`, time: new Date() });
    });

    if (list.length === 0) {
      list.push({ type: "ok", icon: CheckCircle, color: "#10b981", msg: "Alle systemer operative · Ingen aktive alarmer", time: new Date() });
    }

    return list;
  }, [flights, securityLanes, tasks, gates, bags]);

  const critical = alerts.filter(a => a.type === "critical").length;
  const warnings = alerts.filter(a => a.type === "warning").length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,5,15,0.95)", border: "1.5px solid rgba(51,65,85,0.4)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60"
        style={{ background: "rgba(0,8,20,0.8)" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: critical > 0 ? "#f43f5e" : warnings > 0 ? "#f59e0b" : "#10b981" }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: critical > 0 ? "#f43f5e" : warnings > 0 ? "#f59e0b" : "#10b981" }}>
            OPS ALERT FEED
          </span>
        </div>
        <div className="flex items-center gap-3">
          {critical > 0 && <span className="text-[9px] font-black text-red-400">{critical} KRITISKE</span>}
          {warnings > 0 && <span className="text-[9px] font-black text-amber-400">{warnings} ADVARSLER</span>}
          <span className="text-[8px] text-slate-700 font-mono">{moment().format("HH:mm:ss")}</span>
        </div>
      </div>

      {/* Alert list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/30">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ background: i === 0 && a.type === "critical" ? `${a.color}06` : "transparent" }}>
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
              </div>
              <p className="text-[10px] font-bold flex-1 leading-tight" style={{ color: a.type === "ok" ? "#475569" : "#cbd5e1" }}>
                {a.msg}
              </p>
              <span className="text-[8px] text-slate-700 font-mono flex-shrink-0">{moment(a.time).format("HH:mm")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}