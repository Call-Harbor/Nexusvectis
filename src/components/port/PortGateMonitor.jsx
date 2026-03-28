import { Truck, Train, ArrowRight, ArrowLeft } from "lucide-react";

export default function PortGateMonitor({ gates, railSlots }) {
  const now = new Date();
  const upcomingRail = railSlots.filter(r => r.status !== "completed" && r.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_arrival || a.scheduled_departure) - new Date(b.scheduled_arrival || b.scheduled_departure));

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Gate Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#f59e0b" }}>GATE MONITOR</h2>
        {gates.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ border: "1px solid rgba(245,158,11,0.1)", color: "rgba(100,116,139,0.4)" }}>
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-xs tracking-widest">Ingen gates konfigureret</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gates.map(gate => {
              const queueColor = gate.queue_trucks > 20 ? "#f43f5e" : gate.queue_trucks > 10 ? "#f59e0b" : "#10b981";
              const laneUtil = gate.lanes_total > 0 ? Math.round((gate.lanes_open / gate.lanes_total) * 100) : 0;
              return (
                <div key={gate.id} className="rounded-xl p-4" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.04)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: gate.status === "open" ? "#10b981" : "#f43f5e", boxShadow: `0 0 5px ${gate.status === "open" ? "#10b981" : "#f43f5e"}` }} />
                      <p className="text-sm font-bold text-white">{gate.name}</p>
                    </div>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded tracking-widest uppercase"
                      style={{ background: gate.status === "open" ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)", color: gate.status === "open" ? "#10b981" : "#f43f5e" }}>
                      {gate.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>KØ</p>
                      <p className="text-xl font-bold" style={{ color: queueColor }}>{gate.queue_trucks}</p>
                      <p className="text-[7px]" style={{ color: "rgba(100,116,139,0.4)" }}>trucks</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>LANES</p>
                      <p className="text-xl font-bold text-white">{gate.lanes_open}/{gate.lanes_total}</p>
                      <p className="text-[7px]" style={{ color: "rgba(100,116,139,0.4)" }}>åbne</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>I DAG</p>
                      <p className="text-xl font-bold" style={{ color: "#f59e0b" }}>{gate.trucks_today || 0}</p>
                      <p className="text-[7px]" style={{ color: "rgba(100,116,139,0.4)" }}>trucks</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>LANE KAPACITET</p>
                      <p className="text-[7px]" style={{ color: "#f59e0b" }}>{laneUtil}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${laneUtil}%`, background: "#f59e0b" }} />
                    </div>
                  </div>
                  {gate.avg_processing_min > 0 && (
                    <p className="text-[8px] mt-2" style={{ color: "rgba(100,116,139,0.5)" }}>
                      Gns. behandlingstid: <span className="text-white font-bold">{gate.avg_processing_min} min</span>
                      {gate.anpr_enabled && <span className="ml-2" style={{ color: "#10b981" }}>· ANPR aktiv</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rail Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#10b981" }}>JERNBANE SLOTS</h2>
        {upcomingRail.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ border: "1px solid rgba(16,185,129,0.1)", color: "rgba(100,116,139,0.4)" }}>
            <Train className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-xs tracking-widest">Ingen togslots planlagt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRail.map(slot => {
              const statusColor = slot.status === "loading" ? "#10b981" : slot.status === "delayed" ? "#f43f5e" : slot.status === "arriving" ? "#f59e0b" : "#8b5cf6";
              const fillPct = slot.teu_capacity > 0 ? Math.round((slot.teu_loaded / slot.teu_capacity) * 100) : 0;
              const arrDate = slot.scheduled_arrival ? new Date(slot.scheduled_arrival) : null;
              const depDate = slot.scheduled_departure ? new Date(slot.scheduled_departure) : null;
              return (
                <div key={slot.id} className="rounded-xl p-4" style={{ border: `1px solid ${statusColor}22`, background: `${statusColor}05` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4" style={{ color: statusColor }} />
                      <p className="text-sm font-bold text-white">{slot.train_id || "Tog"} · Spor {slot.track}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.direction === "inbound" ? <ArrowRight className="w-3 h-3" style={{ color: "#10b981" }} /> : <ArrowLeft className="w-3 h-3" style={{ color: "#f43f5e" }} />}
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest"
                        style={{ background: `${statusColor}22`, color: statusColor }}>{slot.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2 text-center">
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>ANKOMST</p>
                      <p className="text-[9px] font-bold text-white">{arrDate ? arrDate.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : "–"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>AFGANG</p>
                      <p className="text-[9px] font-bold text-white">{depDate ? depDate.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : "–"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>VOGNE</p>
                      <p className="text-[9px] font-bold text-white">{slot.wagons || "–"}</p>
                    </div>
                  </div>
                  {slot.teu_capacity > 0 && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>TEU LOAD</p>
                        <p className="text-[8px] font-bold" style={{ color: statusColor }}>{slot.teu_loaded}/{slot.teu_capacity} TEU ({fillPct}%)</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: statusColor }} />
                      </div>
                    </div>
                  )}
                  {slot.operator && <p className="text-[7px] mt-1" style={{ color: "rgba(100,116,139,0.4)" }}>Operatør: {slot.operator}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}