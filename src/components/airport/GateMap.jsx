import { useState } from "react";
import { Plane } from "lucide-react";

const STATUS_COLOR = {
  open: "#10b981",
  occupied: "#06b6d4",
  maintenance: "#f59e0b",
  closed: "#f43f5e",
};

export default function GateMap({ gates, flights, onSelectGate }) {
  const [selected, setSelected] = useState(null);

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));

  const handleClick = (gate) => {
    setSelected(gate.id === selected ? null : gate.id);
    onSelectGate && onSelectGate(gate);
  };

  // Group by concourse / terminal
  const groups = gates.reduce((acc, g) => {
    const key = g.concourse || g.terminal || "Main";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const selectedGate = gates.find(g => g.id === selected);
  const selectedFlight = selectedGate?.current_flight_id ? flightMap[selectedGate.current_flight_id] : null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#06b6d4" }}>GATE STATUS MAP</h2>
        <div className="flex items-center gap-3 text-[9px]">
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
              <span className="text-slate-400 capitalize">{s}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {Object.entries(groups).map(([concourse, cgates]) => (
          <div key={concourse}>
            <p className="text-[9px] tracking-widest uppercase text-slate-500 mb-2">Concourse {concourse}</p>
            <div className="flex flex-wrap gap-2">
              {cgates.map(gate => {
                const color = STATUS_COLOR[gate.status] || "#64748b";
                const isSelected = selected === gate.id;
                const flight = gate.current_flight_id ? flightMap[gate.current_flight_id] : null;
                return (
                  <button
                    key={gate.id}
                    onClick={() => handleClick(gate)}
                    className="relative flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all"
                    style={{
                      background: `${color}12`,
                      border: `2px solid ${isSelected ? color : `${color}40`}`,
                      boxShadow: isSelected ? `0 0 12px ${color}44` : "none",
                    }}
                  >
                    <span className="text-[11px] font-bold" style={{ color }}>{gate.gate_code}</span>
                    {flight && <Plane className="w-3 h-3 mt-0.5" style={{ color: `${color}88` }} />}
                    {gate.boarding_active && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {gates.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-6">No gates configured</p>
        )}
      </div>

      {selectedGate && (
        <div className="mx-4 mb-4 p-3 rounded-lg" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-white">Gate {selectedGate.gate_code}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${STATUS_COLOR[selectedGate.status]}22`, color: STATUS_COLOR[selectedGate.status] }}>
              {selectedGate.status?.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
            <span>Type: {selectedGate.gate_type?.replace(/_/g, " ")}</span>
            <span>Schengen: {selectedGate.schengen ? "Yes" : "No"}</span>
            <span>PAX waiting: {selectedGate.pax_waiting || 0}</span>
          </div>
          {selectedFlight && (
            <div className="mt-2 pt-2 border-t border-slate-800/60">
              <p className="text-[11px] font-semibold" style={{ color: "#06b6d4" }}>{selectedFlight.flight_number} — {selectedFlight.airline}</p>
              <p className="text-[10px] text-slate-400">{selectedFlight.origin} → {selectedFlight.destination} · Status: {selectedFlight.status}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}