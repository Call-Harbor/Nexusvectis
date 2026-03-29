import { useMemo } from "react";
import moment from "moment";
import { Plane, Clock, AlertTriangle, Zap, ArrowRight } from "lucide-react";

const STATUS_COLOR = {
  boarding: "#8b5cf6",
  on_time: "#10b981",
  delayed: "#f59e0b",
  cancelled: "#f43f5e",
  departed: "#a78bfa",
  landed: "#22d3ee",
  scheduled: "#475569",
};

export default function NowPanel({ flights, securityLanes, gates }) {
  const now = moment();

  const boardingNow = useMemo(() =>
    flights.filter(f => f.status === "boarding")
      .sort((a, b) => new Date(a.scheduled_departure || 0) - new Date(b.scheduled_departure || 0))
      .slice(0, 4),
    [flights]
  );

  const upcomingDepartures = useMemo(() =>
    flights
      .filter(f => {
        const dep = f.scheduled_departure || f.scheduled_time;
        if (!dep) return false;
        const diff = moment(dep).diff(now, "minutes");
        return diff >= 0 && diff <= 90 && f.status !== "departed" && f.status !== "cancelled";
      })
      .sort((a, b) => {
        const ta = a.scheduled_departure || a.scheduled_time;
        const tb = b.scheduled_departure || b.scheduled_time;
        return new Date(ta) - new Date(tb);
      })
      .slice(0, 6),
    [flights]
  );

  const criticalLanes = useMemo(() =>
    securityLanes
      .filter(l => (l.wait_minutes || 0) > 15)
      .sort((a, b) => (b.wait_minutes || 0) - (a.wait_minutes || 0))
      .slice(0, 3),
    [securityLanes]
  );

  const gateConflicts = useMemo(() => {
    const gateCounts = {};
    flights.filter(f => f.gate && !["departed","landed","cancelled"].includes(f.status)).forEach(f => {
      if (!gateCounts[f.gate]) gateCounts[f.gate] = [];
      gateCounts[f.gate].push(f);
    });
    return Object.entries(gateCounts).filter(([, fs]) => fs.length > 1);
  }, [flights]);

  return (
    <div className="space-y-3 w-72 flex-shrink-0">
      {/* Boarding NOW */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,5,15,0.95)", border: "1.5px solid rgba(139,92,246,0.25)" }}>
        <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-800/50"
          style={{ background: "rgba(139,92,246,0.07)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse bg-violet-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">BOARDING NOW</span>
          <span className="ml-auto text-[8px] text-slate-700 font-mono">{boardingNow.length} flights</span>
        </div>
        <div className="divide-y divide-slate-800/30">
          {boardingNow.length === 0 && (
            <p className="px-3 py-3 text-[10px] text-slate-700 text-center">No boarding currently</p>
          )}
          {boardingNow.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
                <Plane className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white font-mono">{f.flight_number}</p>
                <p className="text-[9px] text-slate-500 truncate">{f.destination} · Gate {f.gate || "TBA"}</p>
              </div>
              {f.delay_minutes > 0 && (
                <span className="text-[9px] font-black text-amber-400">+{f.delay_minutes}m</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next 90 min */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,5,15,0.95)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
        <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-800/50"
          style={{ background: "rgba(6,182,212,0.05)" }}>
          <Clock className="w-3 h-3 text-cyan-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500">NEXT 90 MIN</span>
        </div>
        <div className="divide-y divide-slate-800/20 max-h-52 overflow-y-auto">
          {upcomingDepartures.length === 0 && (
            <p className="px-3 py-3 text-[10px] text-slate-700 text-center">No scheduled departures</p>
          )}
          {upcomingDepartures.map(f => {
            const dep = f.scheduled_departure || f.scheduled_time;
            const minsUntil = dep ? moment(dep).diff(now, "minutes") : null;
            const color = STATUS_COLOR[f.status] || "#475569";
            const isUrgent = minsUntil !== null && minsUntil <= 20;
            return (
              <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 transition-colors"
                style={{ background: isUrgent ? "rgba(139,92,246,0.04)" : "transparent" }}>
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-xs font-black font-mono" style={{ color: isUrgent ? "#8b5cf6" : "#475569" }}>
                    {dep ? moment(dep).format("HH:mm") : "--:--"}
                  </p>
                  {minsUntil !== null && (
                    <p className="text-[8px]" style={{ color: isUrgent ? "#8b5cf6" : "#334155" }}>+{minsUntil}m</p>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-white font-mono">{f.flight_number}</span>
                    <span className="text-[9px] font-bold text-slate-500 truncate">{f.destination}</span>
                  </div>
                  <p className="text-[8px] text-slate-700">Gate {f.gate || "TBA"} · {f.pax_total || "?"} pax</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Security hotspots */}
      {criticalLanes.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,5,15,0.95)", border: "1.5px solid rgba(245,158,11,0.25)" }}>
          <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-800/50"
            style={{ background: "rgba(245,158,11,0.06)" }}>
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">SEC HOTSPOTS</span>
          </div>
          <div className="divide-y divide-slate-800/30">
            {criticalLanes.map(l => {
              const color = l.wait_minutes > 30 ? "#f43f5e" : "#f59e0b";
              return (
                <div key={l.id} className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-white">{l.name}</span>
                    <span className="text-xs font-black font-mono" style={{ color }}>{l.wait_minutes}m</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (l.wait_minutes / 45) * 100)}%`, background: color }} />
                  </div>
                  <p className="text-[8px] text-slate-600 mt-0.5">{l.queue_length || 0} in queue · {l.lane_type}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gate conflicts */}
      {gateConflicts.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,5,15,0.95)", border: "1.5px solid rgba(244,63,94,0.3)" }}>
          <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-800/50"
            style={{ background: "rgba(244,63,94,0.06)" }}>
            <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-400">GATE CONFLICTS</span>
          </div>
          <div className="divide-y divide-slate-800/30">
            {gateConflicts.map(([gate, fs]) => (
              <div key={gate} className="px-3 py-2.5">
                <p className="text-xs font-black text-white mb-1">Gate {gate}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {fs.map(f => (
                    <span key={f.id} className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(244,63,94,0.12)", color: "#f87171", border: "1px solid rgba(244,63,94,0.25)" }}>
                      {f.flight_number}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}