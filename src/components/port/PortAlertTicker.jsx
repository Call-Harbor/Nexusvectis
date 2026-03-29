import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Ship, Anchor, Zap, Wind, CheckCircle } from "lucide-react";

const SEVERITY = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.4)", Icon: AlertTriangle },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.35)", Icon: Wind },
  info:     { color: "#06b6d4", bg: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.25)",  Icon: Ship },
  ok:       { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", Icon: CheckCircle },
};

function buildAlerts(portCalls, cranes, yardZones, gates) {
  const alerts = [];

  portCalls.filter(pc => (pc.delay_minutes || 0) > 60).forEach(pc =>
    alerts.push({ id: `delay-${pc.id}`, sev: "critical", text: `Port call ${pc.id?.slice(-4)} forsinket ${pc.delay_minutes}min — kritisk forsinkelse` })
  );

  portCalls.filter(pc => pc.status === "approaching").forEach(pc =>
    alerts.push({ id: `approach-${pc.id}`, sev: "info", text: `Skib nærmer sig — ETA ${pc.eta ? new Date(pc.eta).toLocaleTimeString("da-DK", {hour:"2-digit",minute:"2-digit"}) : "ukendt"}` })
  );

  portCalls.filter(pc => pc.status === "berthed" || pc.status === "operations").forEach(pc =>
    alerts.push({ id: `ops-${pc.id}`, sev: "ok", text: `Aktiv havneoperaton — fortøjet ved kaj` })
  );

  cranes.filter(c => c.status === "breakdown").forEach(c =>
    alerts.push({ id: `crane-${c.id}`, sev: "critical", text: `KRAN NEDBRUD: ${c.name} — øjeblikkelig service påkrævet` })
  );

  cranes.filter(c => c.status === "maintenance").forEach(c =>
    alerts.push({ id: `maint-${c.id}`, sev: "warning", text: `Kran ${c.name} i vedligeholdelse — reduceret kapacitet` })
  );

  yardZones.filter(z => (z.utilization_pct || 0) > 90).forEach(z =>
    alerts.push({ id: `yard-${z.id}`, sev: "critical", text: `YARD ZONE ${z.name} KRITISK: ${z.utilization_pct}% kapacitet — omfordel containere` })
  );

  yardZones.filter(z => (z.utilization_pct || 0) > 75 && (z.utilization_pct || 0) <= 90).forEach(z =>
    alerts.push({ id: `yardhigh-${z.id}`, sev: "warning", text: `Yard zone ${z.name} høj belastning (${z.utilization_pct}%)` })
  );

  gates.filter(g => g.status === "closed").forEach(g =>
    alerts.push({ id: `gate-${g.id}`, sev: "warning", text: `Port gate ${g.name} lukket — trafik omdirigeret` })
  );

  if (alerts.length === 0) {
    alerts.push({ id: "all-clear", sev: "ok", text: "Alle systemer operationelle — ingen aktive advarsler" });
  }

  return alerts;
}

export default function PortAlertTicker({ portCalls = [], cranes = [], yardZones = [], gates = [] }) {
  const alerts = buildAlerts(portCalls, cranes, yardZones, gates);
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (alerts.length <= 1) return;
    intervalRef.current = setInterval(() => setIdx(i => (i + 1) % alerts.length), 4000);
    return () => clearInterval(intervalRef.current);
  }, [alerts.length]);

  const current = alerts[idx % alerts.length];
  const cfg = SEVERITY[current.sev];
  const Icon = cfg.Icon;
  const criticals = alerts.filter(a => a.sev === "critical").length;
  const warnings = alerts.filter(a => a.sev === "warning").length;

  return (
    <div className="rounded-xl px-4 py-2.5 flex items-center gap-4"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon className="w-4 h-4 animate-pulse" style={{ color: cfg.color }} />
        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: cfg.color }}>
          {current.sev === "critical" ? "KRITISK" : current.sev === "warning" ? "ADVARSEL" : current.sev === "ok" ? "OK" : "INFO"}
        </span>
      </div>
      <div className="flex-1 text-xs font-semibold text-white truncate">{current.text}</div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {criticals > 0 && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
            {criticals} KRITISK
          </span>
        )}
        {warnings > 0 && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
            {warnings} ADVARSEL
          </span>
        )}
        <div className="flex gap-1">
          {alerts.slice(0, Math.min(8, alerts.length)).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx % alerts.length ? cfg.color : "rgba(100,116,139,0.3)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}