export default function SecurityMonitor({ securityLanes, staff }) {
  const securityStaff = staff.filter(s => s.role === "security_officer");

  const getColor = (wait) => wait <= 10 ? "#10b981" : wait <= 20 ? "#f59e0b" : "#f43f5e";

  const totalQueue = securityLanes.reduce((s, l) => s + (l.queue_length || 0), 0);
  const avgWait = securityLanes.length > 0
    ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
    : 0;
  const openLanes = securityLanes.filter(l => l.status === "open").length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#10b981" }}>SECURITY MONITOR</h2>
        <div className="flex gap-4 text-center">
          <div><p className="text-[8px] text-slate-500 uppercase tracking-widest">Queue</p><p className="font-bold text-white">{totalQueue}</p></div>
          <div><p className="text-[8px] text-slate-500 uppercase tracking-widest">Avg Wait</p><p className="font-bold" style={{ color: getColor(avgWait) }}>{avgWait}m</p></div>
          <div><p className="text-[8px] text-slate-500 uppercase tracking-widest">Open Lanes</p><p className="font-bold text-white">{openLanes}</p></div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {securityLanes.map(lane => {
          const wait = lane.wait_minutes || 0;
          const color = getColor(wait);
          const queuePct = Math.min(100, ((lane.queue_length || 0) / 100) * 100);
          return (
            <div key={lane.id} className="rounded-lg px-3 py-2.5" style={{ background: `${color}08`, border: `1px solid ${color}22` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: lane.status === "open" ? "#10b981" : lane.status === "degraded" ? "#f59e0b" : "#f43f5e" }} />
                  <span className="text-[11px] font-semibold text-white">{lane.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(100,116,139,0.2)", color: "#64748b" }}>
                    {lane.lane_type?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px]" style={{ color }}>{wait}m wait</span>
                  <span className="text-[10px] text-slate-400">{lane.queue_length || 0} pax</span>
                  <span className="text-[10px] text-slate-500">{lane.staff_assigned || 0}/{lane.staff_required || 0} staff</span>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-800">
                <div className="h-full rounded-full transition-all" style={{ width: `${queuePct}%`, background: color }} />
              </div>
            </div>
          );
        })}

        {securityLanes.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No security lanes configured</p>
        )}

        {securityStaff.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/60">
            <p className="text-[9px] tracking-widest uppercase text-slate-500 mb-2">SECURITY STAFF ON DUTY</p>
            <div className="flex flex-wrap gap-1.5">
              {securityStaff.slice(0, 12).map(s => (
                <span key={s.id} className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: s.status === "on_duty" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)", color: s.status === "on_duty" ? "#10b981" : "#475569" }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}