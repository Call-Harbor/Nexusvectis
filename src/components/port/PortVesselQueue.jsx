import { Ship, Clock, AlertTriangle } from "lucide-react";

const STATUS_COLORS = {
  planned: "#8b5cf6", approaching: "#f59e0b", berthed: "#06b6d4",
  operations: "#10b981", completed: "#334455", cancelled: "#f43f5e", delayed: "#f43f5e",
};

export default function PortVesselQueue({ portCalls, vessels, onSelectPortCall }) {
  const getVessel = (id) => vessels.find(v => v.id === id);
  const queue = [...portCalls]
    .filter(p => p.status !== "completed" && p.status !== "cancelled")
    .sort((a, b) => new Date(a.eta) - new Date(b.eta));

  return (
    <div className="space-y-3">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#8b5cf6" }}>VESSEL QUEUE</h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {queue.length === 0 && (
          <div className="text-center py-12" style={{ color: "rgba(100,116,139,0.4)" }}>
            <Ship className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-[10px] tracking-widest">No scheduled calls</p>
          </div>
        )}
        {queue.map(pc => {
          const vessel = getVessel(pc.vessel_id);
          const color = STATUS_COLORS[pc.status] || "#94a3b8";
          const etaDate = new Date(pc.eta);
          const now = new Date();
          const hoursUntil = ((etaDate - now) / 3600000).toFixed(1);
          const isDelayed = pc.status === "delayed";
          const progress = pc.total_moves > 0 ? Math.round((pc.completed_moves / pc.total_moves) * 100) : 0;

          return (
            <div
              key={pc.id}
              className="rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01]"
              style={{ border: `1px solid ${color}33`, background: `${color}06` }}
              onClick={() => onSelectPortCall(pc)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                    <p className="text-xs font-bold" style={{ color }}>{vessel?.name || "Unknown vessel"}</p>
                    {isDelayed && <AlertTriangle className="w-3 h-3" style={{ color: "#f43f5e" }} />}
                  </div>
                  <p className="text-[8px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(100,116,139,0.5)" }}>
                    {vessel?.type} · {vessel?.operator}
                  </p>
                </div>
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                  {pc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                <div>
                  <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>ETA</p>
                  <p className="text-[10px] font-bold text-white">
                    {etaDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })} {etaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>IN</p>
                  <p className="text-[10px] font-bold" style={{ color: hoursUntil < 3 ? "#f43f5e" : hoursUntil < 12 ? "#f59e0b" : "#10b981" }}>
                    {hoursUntil > 0 ? `${hoursUntil}h` : "MOORED"}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>MOVES</p>
                  <p className="text-[10px] font-bold text-white">{pc.total_moves || "–"}</p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>PRIORITY</p>
                  <p className="text-[10px] font-bold" style={{ color: pc.priority === "critical" ? "#f43f5e" : pc.priority === "high" ? "#f59e0b" : "#94a3b8" }}>
                    {pc.priority?.toUpperCase() || "–"}
                  </p>
                </div>
              </div>

              {pc.status === "operations" && pc.total_moves > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>PROGRESS</p>
                    <p className="text-[7px]" style={{ color }}>{progress}%</p>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}