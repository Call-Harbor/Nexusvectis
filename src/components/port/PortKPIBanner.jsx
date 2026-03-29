export default function PortKPIBanner({ portCalls, cranes, yardZones, gates, equipment }) {
  const active = portCalls.filter(p => p.status === "operations" || p.status === "berthed");
  const avgTurnaround = active.length
    ? (active.reduce((s, p) => s + (p.actual_turnaround_hours || p.target_turnaround_hours || 0), 0) / active.length).toFixed(1)
    : "–";
  const craneMoves = cranes.reduce((s, c) => s + (c.total_moves_today || 0), 0);
  const avgCraneRate = cranes.filter(c => c.status === "working").length
    ? (cranes.filter(c => c.status === "working").reduce((s, c) => s + (c.current_moves_per_hour || 0), 0) / Math.max(1, cranes.filter(c => c.status === "working").length)).toFixed(1)
    : "–";
  const yardOcc = yardZones.length
    ? (yardZones.reduce((s, z) => s + (z.occupancy_pct || 0), 0) / yardZones.length).toFixed(0)
    : "–";
  const totalQueue = gates.reduce((s, g) => s + (g.queue_trucks || 0), 0);
  const eqWorking = equipment.filter(e => e.status === "working").length;

  const kpis = [
    { label: "ACTIVE VESSELS", value: active.length, unit: "", color: "#06b6d4" },
    { label: "TURNAROUND", value: avgTurnaround, unit: "h", color: "#8b5cf6" },
    { label: "CRANE MOVES TODAY", value: craneMoves, unit: "mv", color: "#10b981" },
    { label: "CRANE RATE", value: avgCraneRate, unit: "mv/h", color: "#10b981" },
    { label: "YARD OCCUPANCY", value: yardOcc === "–" ? "–" : `${yardOcc}%`, unit: "", color: yardOcc > 85 ? "#f43f5e" : yardOcc > 70 ? "#f59e0b" : "#10b981" },
    { label: "TRUCK QUEUE", value: totalQueue, unit: "trucks", color: totalQueue > 20 ? "#f43f5e" : "#f59e0b" },
    { label: "EQUIPMENT ACTIVE", value: eqWorking, unit: `/${equipment.length}`, color: "#06b6d4" },
  ];

  return (
    <div className="flex gap-px border-b border-slate-800/60" style={{ background: "rgba(0,8,20,0.6)" }}>
      {kpis.map(kpi => (
        <div key={kpi.label} className="flex-1 px-4 py-3 border-r border-slate-800/40 last:border-r-0">
          <p className="text-[7px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(100,116,139,0.6)" }}>{kpi.label}</p>
          <p className="text-xl font-bold" style={{ color: kpi.color, textShadow: `0 0 8px ${kpi.color}66` }}>
            {kpi.value}<span className="text-[10px] font-normal ml-1" style={{ color: `${kpi.color}88` }}>{kpi.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}