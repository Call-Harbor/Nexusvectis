/**
 * Operations overview strip — live KPI cards (zone 1).
 * TODO(observability): webhook heartbeat, queue depth, last-ingest timestamps per feed.
 * TODO(cost/latency): surface rollup when billing/metrics APIs exist.
 */
import { Truck, AlertTriangle, Route, Package, Activity, ChevronRight } from "lucide-react";

export default function MissionControlStrip({
  vehicles = [],
  alerts = [],
  routes = [],
  shipments = [],
  orgId,
  onKpiClick,
}) {
  const activeVehicles = vehicles.filter((v) => v.status === "active" || v.status === "in_transit").length;
  const criticalAlerts = alerts.filter(
    (a) =>
      a.type === "critical" ||
      a.severity === "critical" ||
      (a.status !== "resolved" && String(a.type || "").includes("critical"))
  ).length;
  const openAlerts = alerts.filter((a) => !a.is_resolved).length;

  const items = [
    {
      key: "vehicles",
      label: "Vehicles",
      value: vehicles.length,
      sub: `${activeVehicles} active`,
      icon: Truck,
      accent: "text-cyan-400",
    },
    {
      key: "alerts",
      label: "Open alerts",
      value: openAlerts,
      sub: criticalAlerts ? `${criticalAlerts} critical` : "None critical",
      icon: AlertTriangle,
      accent: criticalAlerts ? "text-amber-400" : "text-slate-400",
    },
    {
      key: "routes",
      label: "Routes",
      value: routes.length,
      sub: "In workspace",
      icon: Route,
      accent: "text-violet-400",
    },
    {
      key: "shipments",
      label: "Shipments",
      value: shipments.length,
      sub: "In org",
      icon: Package,
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="relative z-20 border-b border-cyan-500/15 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <Activity className="w-3.5 h-3.5 text-cyan-500/80" aria-hidden />
          Operations overview
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onKpiClick?.(it.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/50 min-w-[120px] text-left transition-colors hover:border-cyan-500/35 hover:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 group"
              title={`Open ${it.label.toLowerCase()} — review status in module`}
            >
              <it.icon className={`w-3.5 h-3.5 flex-shrink-0 ${it.accent}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wide text-slate-500">{it.label}</p>
                <p className="text-sm font-semibold text-white tabular-nums">{it.value}</p>
                <p className="text-[10px] text-slate-500 truncate">{it.sub}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-500/70 flex-shrink-0" aria-hidden />
            </button>
          ))}
        </div>
        {orgId && (
          <span className="text-[10px] font-mono text-slate-600 truncate max-w-[140px]" title={orgId}>
            Org {orgId.slice(0, 8)}…
          </span>
        )}
      </div>
    </div>
  );
}
