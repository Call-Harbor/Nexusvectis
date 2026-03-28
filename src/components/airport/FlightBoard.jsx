import { useState } from "react";
import { Plane, Clock, AlertTriangle, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

const STATUS_COLOR = {
  scheduled: "#64748b",
  boarding: "#06b6d4",
  final_call: "#f43f5e",
  departed: "#10b981",
  airborne: "#10b981",
  approaching: "#8b5cf6",
  landed: "#06b6d4",
  at_gate: "#10b981",
  delayed: "#f59e0b",
  cancelled: "#f43f5e",
  diverted: "#f97316",
};

export default function FlightBoard({ flights, gates, onSelect }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const gateMap = Object.fromEntries(gates.map(g => [g.id, g.gate_code]));

  const filtered = flights
    .filter(f => filter === "all" ? true : filter === "arrivals" ? f.flight_type === "arrival" : filter === "departures" ? f.flight_type === "departure" : f.status === "delayed" || (f.delay_minutes || 0) > 15)
    .filter(f => !search || f.flight_number?.toLowerCase().includes(search.toLowerCase()) || f.airline?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.scheduled_time || 0) - new Date(b.scheduled_time || 0));

  const formatTime = (iso) => {
    if (!iso) return "--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/60">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#06b6d4" }}>FLIGHT BOARD</h2>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flight..."
            className="text-[10px] bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1 text-slate-300 outline-none w-28"
          />
          {["all", "arrivals", "departures", "disrupted"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-[9px] px-2 py-1 rounded tracking-widest uppercase font-bold transition-all"
              style={{ background: filter === f ? "rgba(6,182,212,0.2)" : "transparent", color: filter === f ? "#06b6d4" : "#475569", border: `1px solid ${filter === f ? "rgba(6,182,212,0.4)" : "transparent"}` }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-800/60">
              {["Flight","Type","Route","STD/STA","ETD/ETA","Gate","Status","Delay","PAX","Risk"].map(h => (
                <th key={h} className="px-3 py-2 text-left font-bold tracking-widest uppercase text-[9px]" style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const risk = f.ai_risk_score || 0;
              const delayMin = f.delay_minutes || 0;
              return (
                <tr key={f.id} onClick={() => onSelect(f)}
                  className="border-b border-slate-800/30 hover:bg-slate-800/30 cursor-pointer transition-all">
                  <td className="px-3 py-2.5 font-bold" style={{ color: "#06b6d4" }}>{f.flight_number}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: f.flight_type === "arrival" ? "rgba(139,92,246,0.2)" : "rgba(6,182,212,0.2)", color: f.flight_type === "arrival" ? "#8b5cf6" : "#06b6d4" }}>
                      {f.flight_type === "arrival" ? "ARR" : f.flight_type === "departure" ? "DEP" : "TRN"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{f.origin} → {f.destination}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{formatTime(f.scheduled_time)}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: delayMin > 0 ? "#f59e0b" : "#10b981" }}>{formatTime(f.estimated_time)}</td>
                  <td className="px-3 py-2.5 font-bold text-white">{gateMap[f.gate_id] || f.gate_id || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${STATUS_COLOR[f.status] || "#64748b"}22`, color: STATUS_COLOR[f.status] || "#64748b" }}>
                      {(f.status || "").replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: delayMin > 15 ? "#f43f5e" : delayMin > 0 ? "#f59e0b" : "#10b981" }}>
                    {delayMin > 0 ? `+${delayMin}m` : "–"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{f.pax_boarded || 0}/{f.pax_total || 0}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${risk}%`, background: risk > 70 ? "#f43f5e" : risk > 40 ? "#f59e0b" : "#10b981" }} />
                      </div>
                      <span className="text-[9px]" style={{ color: risk > 70 ? "#f43f5e" : risk > 40 ? "#f59e0b" : "#10b981" }}>{risk}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600 text-xs">No flights match filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}