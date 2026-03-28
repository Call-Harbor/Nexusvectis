import { useState } from "react";
import { Map } from "lucide-react";

const ZONES = [
  { id: "checkin_a", label: "Check-in A", x: 8, y: 12, w: 18, h: 8 },
  { id: "checkin_b", label: "Check-in B", x: 28, y: 12, w: 18, h: 8 },
  { id: "checkin_c", label: "Check-in C", x: 48, y: 12, w: 18, h: 8 },
  { id: "security_1", label: "Security 1", x: 8, y: 28, w: 12, h: 7 },
  { id: "security_2", label: "Security 2", x: 22, y: 28, w: 12, h: 7 },
  { id: "security_3", label: "Security 3", x: 36, y: 28, w: 12, h: 7 },
  { id: "fast_track", label: "Fast Track", x: 50, y: 28, w: 10, h: 7 },
  { id: "passport", label: "Passport Control", x: 14, y: 43, w: 22, h: 7 },
  { id: "gates_a", label: "Gates A1–A10", x: 5, y: 58, w: 20, h: 10 },
  { id: "gates_b", label: "Gates B1–B12", x: 28, y: 58, w: 22, h: 10 },
  { id: "gates_c", label: "Gates C1–C8", x: 53, y: 58, w: 18, h: 10 },
  { id: "reclaim_1", label: "Reclaim 1", x: 8, y: 77, w: 14, h: 7 },
  { id: "reclaim_2", label: "Reclaim 2", x: 24, y: 77, w: 14, h: 7 },
  { id: "arrivals", label: "Arrivals Hall", x: 40, y: 77, w: 22, h: 7 },
];

const LAYERS = [
  { id: "crowd", label: "Crowd Density" },
  { id: "wait", label: "Wait Time" },
  { id: "risk", label: "Flight Risk" },
  { id: "bags", label: "Baggage Load" },
];

function generateLoad(zoneId, flights, securityLanes, bags) {
  const securityIds = ["security_1", "security_2", "security_3", "fast_track", "passport"];
  const isSecure = securityIds.includes(zoneId);
  const isGate = zoneId.startsWith("gates_");
  const isReclaim = zoneId.startsWith("reclaim");
  const isCheckin = zoneId.startsWith("checkin");

  let baseLoad;
  if (isSecure) {
    const avgWait = securityLanes.length > 0
      ? securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length
      : 10;
    baseLoad = Math.min(1, avgWait / 25);
  } else if (isGate) {
    const boardingFlights = flights.filter(f => f.status === "boarding" || f.status === "final_call").length;
    baseLoad = Math.min(1, boardingFlights / Math.max(1, flights.length) * 2);
  } else if (isReclaim) {
    const landedFlights = flights.filter(f => f.status === "landed" || f.status === "at_gate").length;
    baseLoad = Math.min(1, landedFlights / 8);
  } else if (isCheckin) {
    const departureFlights = flights.filter(f => f.flight_type !== "arrival").length;
    baseLoad = Math.min(1, departureFlights / 20);
  } else {
    baseLoad = 0.2 + Math.random() * 0.3;
  }

  const jitter = (Math.random() - 0.5) * 0.15;
  return Math.max(0, Math.min(1, baseLoad + jitter));
}

function loadToColor(load) {
  if (load < 0.25) return { bg: "rgba(16,185,129,0.35)", border: "#10b981", label: "Low" };
  if (load < 0.5) return { bg: "rgba(6,182,212,0.35)", border: "#06b6d4", label: "Moderate" };
  if (load < 0.75) return { bg: "rgba(245,158,11,0.45)", border: "#f59e0b", label: "High" };
  return { bg: "rgba(244,63,94,0.55)", border: "#f43f5e", label: "Critical" };
}

export default function TerminalHeatmap({ flights, securityLanes, bags, gates }) {
  const [activeLayer, setActiveLayer] = useState("crowd");
  const [hovered, setHovered] = useState(null);

  const loads = Object.fromEntries(
    ZONES.map(z => [z.id, generateLoad(z.id, flights, securityLanes, bags)])
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400">TERMINAL DIGITAL TWIN — LIVE HEATMAP</h2>
        </div>
        <div className="flex gap-1.5">
          {LAYERS.map(l => (
            <button key={l.id} onClick={() => setActiveLayer(l.id)}
              className="px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase transition-all"
              style={{ background: activeLayer === l.id ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.5)", border: `1px solid ${activeLayer === l.id ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.8)"}`, color: activeLayer === l.id ? "#06b6d4" : "#64748b" }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal map */}
      <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(2,8,20,0.95)", paddingBottom: "62%" }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 76 92" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(6,182,212,0.04)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="76" height="92" fill="url(#grid)" />

          {/* Airside boundary */}
          <rect x="2" y="53" width="72" height="2" fill="rgba(6,182,212,0.12)" />
          <text x="38" y="57" fill="rgba(6,182,212,0.3)" fontSize="1.8" textAnchor="middle" fontFamily="monospace">— — AIRSIDE BOUNDARY — —</text>

          {/* Terminal outline */}
          <rect x="3" y="3" width="70" height="88" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* Zones */}
          {ZONES.map(z => {
            const load = loads[z.id];
            const { bg, border, label } = loadToColor(load);
            const isHov = hovered === z.id;
            return (
              <g key={z.id} onMouseEnter={() => setHovered(z.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={bg} stroke={border} strokeWidth={isHov ? "0.6" : "0.3"} rx="0.8" />
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 0.8} fill="rgba(255,255,255,0.85)" fontSize="1.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{z.label}</text>
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 1.5} fill={border} fontSize="1.3" textAnchor="middle" fontFamily="monospace">{label} · {Math.round(load * 100)}%</text>
              </g>
            );
          })}

          {/* Gate dots */}
          {gates.slice(0, 20).map((g, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const cx = 6 + col * 7;
            const cy = 61 + row * 4;
            const gc = g.status === "occupied" ? "#f59e0b" : g.status === "open" ? "#10b981" : "#64748b";
            return (
              <g key={g.id}>
                <circle cx={cx} cy={cy} r="1.2" fill={gc} opacity="0.8" />
                <text x={cx} y={cy + 2.8} fill={gc} fontSize="1.1" textAnchor="middle" fontFamily="monospace">{g.gate_code}</text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {[["#10b981", "Low"], ["#06b6d4", "Moderate"], ["#f59e0b", "High"], ["#f43f5e", "Critical"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded" style={{ background: c, opacity: 0.8 }} />
              <span className="text-[8px]" style={{ color: c }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical Zones", val: Object.values(loads).filter(l => l >= 0.75).length, color: "#f43f5e" },
          { label: "High Load Zones", val: Object.values(loads).filter(l => l >= 0.5 && l < 0.75).length, color: "#f59e0b" },
          { label: "Normal Zones", val: Object.values(loads).filter(l => l < 0.5).length, color: "#10b981" },
          { label: "Total Zones", val: ZONES.length, color: "#06b6d4" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] tracking-widest uppercase" style={{ color: `${k.color}80` }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}