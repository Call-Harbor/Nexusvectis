import { AlertTriangle } from "lucide-react";

const STATUS_COLOR = {
  checked_in: "#64748b",
  sorting: "#f59e0b",
  loaded: "#10b981",
  in_transit: "#06b6d4",
  at_reclaim: "#8b5cf6",
  collected: "#10b981",
  mishandled: "#f43f5e",
  delayed: "#f97316",
};

export default function BaggageTracker({ bags, flights }) {
  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));

  const rushBags = bags.filter(b => b.is_rush || (b.connection_time_minutes || 999) < 45);
  const mishandled = bags.filter(b => b.status === "mishandled" || b.status === "delayed");

  const statusGroups = bags.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#f59e0b" }}>BAGGAGE INTELLIGENCE</h2>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Rush Tags</p>
            <p className="font-bold text-orange-400">{rushBags.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Mishandled</p>
            <p className="font-bold text-red-400">{mishandled.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Total Tracked</p>
            <p className="font-bold text-white">{bags.length}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Status distribution */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusGroups).map(([status, count]) => {
            const color = STATUS_COLOR[status] || "#64748b";
            return (
              <div key={status} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-slate-300 capitalize">{status.replace(/_/g, " ")}</span>
                <span className="text-[10px] font-bold" style={{ color }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Rush connections */}
        {rushBags.length > 0 && (
          <div>
            <p className="text-[9px] tracking-widest uppercase text-orange-400/70 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> RUSH CONNECTIONS
            </p>
            <div className="space-y-1.5 max-h-[160px] overflow-auto">
              {rushBags.slice(0, 10).map(bag => {
                const flight = flightMap[bag.flight_id];
                const connFlight = bag.connection_flight_id ? flightMap[bag.connection_flight_id] : null;
                const urgent = (bag.connection_time_minutes || 999) < 30;
                return (
                  <div key={bag.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: urgent ? "rgba(244,63,94,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${urgent ? "rgba(244,63,94,0.25)" : "rgba(245,158,11,0.25)"}` }}>
                    <span className="text-[10px] font-mono font-bold text-white">{bag.tag_number}</span>
                    <span className="text-[9px] text-slate-400 flex-1">{flight?.flight_number || bag.flight_id} → {connFlight?.flight_number || "Connect"}</span>
                    <span className="text-[9px] font-bold" style={{ color: urgent ? "#f43f5e" : "#f59e0b" }}>
                      {bag.connection_time_minutes ? `${bag.connection_time_minutes}m` : "RUSH"}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLOR[bag.status] || "#64748b"}22`, color: STATUS_COLOR[bag.status] || "#64748b" }}>
                      {bag.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mishandled */}
        {mishandled.length > 0 && (
          <div>
            <p className="text-[9px] tracking-widest uppercase text-red-400/70 mb-2">MISHANDLED / DELAYED BAGS</p>
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {mishandled.map(bag => (
                <div key={bag.id} className="flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <span className="text-[10px] font-mono text-white">{bag.tag_number}</span>
                  <span className="text-[9px] text-slate-400 flex-1">{bag.passenger_name}</span>
                  <span className="text-[9px] text-slate-400">{bag.current_location || "Unknown"}</span>
                  <span className="text-[9px] font-bold text-red-400 uppercase">{bag.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bags.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No baggage data</p>
        )}
      </div>
    </div>
  );
}