import { useState, useMemo } from "react";
import { Map, RefreshCw, Activity, AlertTriangle } from "lucide-react";

const ZONES = [
  { id: "checkin_a", label: "Check-in A", x: 8, y: 12, w: 18, h: 8 },
  { id: "checkin_b", label: "Check-in B", x: 28, y: 12, w: 18, h: 8 },
  { id: "checkin_c", label: "Check-in C", x: 48, y: 12, w: 18, h: 8 },
  { id: "security_1", label: "Security 1", x: 8, y: 28, w: 12, h: 7 },
  { id: "security_2", label: "Security 2", x: 22, y: 28, w: 12, h: 7 },
  { id: "security_3", label: "Security 3", x: 36, y: 28, w: 12, h: 7 },
  { id: "fast_track", label: "Fast Track", x: 50, y: 28, w: 10, h: 7 },
  { id: "passport", label: "Passport", x: 14, y: 43, w: 22, h: 7 },
  { id: "gates_a", label: "Gates A1–A10", x: 5, y: 58, w: 20, h: 10 },
  { id: "gates_b", label: "Gates B1–B12", x: 28, y: 58, w: 22, h: 10 },
  { id: "gates_c", label: "Gates C1–C8", x: 53, y: 58, w: 18, h: 10 },
  { id: "reclaim_1", label: "Reclaim 1", x: 8, y: 77, w: 14, h: 7 },
  { id: "reclaim_2", label: "Reclaim 2", x: 24, y: 77, w: 14, h: 7 },
  { id: "arrivals", label: "Arrivals Hall", x: 40, y: 77, w: 22, h: 7 },
];

const LAYERS = [
  { id: "crowd", label: "Crowd" },
  { id: "wait", label: "Wait Time" },
  { id: "risk", label: "Flight Risk" },
  { id: "bags", label: "Baggage" },
];

function computeLoad(zoneId, flights, securityLanes, bags) {
  const secZone = ["security_1", "security_2", "security_3", "fast_track", "passport"];
  const isSecure = secZone.includes(zoneId);
  const isGate = zoneId.startsWith("gates_");
  const isReclaim = zoneId.startsWith("reclaim");
  const isCheckin = zoneId.startsWith("checkin");

  let base;
  if (isSecure) {
    const match = securityLanes.find(l =>
      (zoneId === "fast_track" && l.lane_type === "fast_track") ||
      (zoneId === "passport" && l.name?.toLowerCase().includes("passport")) ||
      l.name?.toLowerCase().includes(zoneId.replace("_", " ").slice(-1))
    );
    const avgWait = match
      ? match.wait_minutes || 0
      : securityLanes.length > 0
        ? securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length
        : 8;
    base = Math.min(1, avgWait / 30);
  } else if (isGate) {
    const boarding = flights.filter(f => f.status === "boarding" || f.status === "final_call").length;
    base = Math.min(1, boarding / Math.max(flights.length, 1) * 2.5);
  } else if (isReclaim) {
    const landed = flights.filter(f => f.status === "landed" || f.status === "at_gate").length;
    base = Math.min(1, landed / 8);
  } else if (isCheckin) {
    const deps = flights.filter(f => f.flight_type !== "arrival").length;
    base = Math.min(1, deps / 20);
  } else {
    base = 0.2;
  }
  return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.1));
}

function loadColor(load) {
  if (load < 0.25) return { bg: "rgba(16,185,129,0.3)", border: "#10b981", label: "LOW", textC: "#10b981" };
  if (load < 0.5) return { bg: "rgba(6,182,212,0.3)", border: "#06b6d4", label: "MOD", textC: "#06b6d4" };
  if (load < 0.75) return { bg: "rgba(245,158,11,0.4)", border: "#f59e0b", label: "HIGH", textC: "#f59e0b" };
  return { bg: "rgba(244,63,94,0.5)", border: "#f43f5e", label: "CRIT", textC: "#f43f5e" };
}

export default function TerminalHeatmap({ flights, securityLanes, bags, gates }) {
  const [activeLayer, setActiveLayer] = useState("crowd");
  const [hovered, setHovered] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loads = useMemo(() =>
    Object.fromEntries(ZONES.map(z => [z.id, computeLoad(z.id, flights, securityLanes, bags)])),
    [flights, securityLanes, bags, refreshKey]
  );

  const critical = Object.values(loads).filter(l => l >= 0.75).length;
  const high = Object.values(loads).filter(l => l >= 0.5 && l < 0.75).length;

  const boardingFlights = flights.filter(f => f.status === "boarding").slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-400">TERMINAL DIGITAL TWIN — LIVE HEATMAP</h2>
          {critical > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded animate-pulse"
              style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
              <AlertTriangle className="w-2.5 h-2.5" />{critical} KRITISKE ZONER
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => setActiveLayer(l.id)}
                className="px-2.5 py-1 rounded text-[9px] font-bold tracking-wide uppercase transition-all"
                style={{ background: activeLayer === l.id ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.5)", border: `1px solid ${activeLayer === l.id ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.8)"}`, color: activeLayer === l.id ? "#06b6d4" : "#64748b" }}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Main heatmap */}
        <div className="col-span-2 relative rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(2,8,20,0.97)", paddingBottom: "65%" }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 76 92" preserveAspectRatio="none">
            <defs>
              <pattern id="grid2" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(6,182,212,0.05)" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="76" height="92" fill="url(#grid2)" />
            <rect x="3" y="3" width="70" height="88" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5" strokeDasharray="2,2" />
            <rect x="2" y="53" width="72" height="2" fill="rgba(6,182,212,0.1)" />
            <text x="38" y="57.5" fill="rgba(6,182,212,0.35)" fontSize="1.8" textAnchor="middle" fontFamily="monospace">— — AIRSIDE BOUNDARY — —</text>

            {ZONES.map(z => {
              const load = loads[z.id];
              const { bg, border, label, textC } = loadColor(load);
              const isHov = hovered === z.id;
              const isCrit = load >= 0.75;
              return (
                <g key={z.id} onMouseEnter={() => setHovered(z.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                  {isCrit && <rect x={z.x - 0.5} y={z.y - 0.5} width={z.w + 1} height={z.h + 1} fill="none" stroke="#f43f5e" strokeWidth="0.3" rx="1.2" opacity="0.4" />}
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={bg} stroke={border} strokeWidth={isHov ? "0.7" : "0.3"} rx="0.8" />
                  <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 1.2} fill="rgba(255,255,255,0.9)" fontSize="1.6" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{z.label}</text>
                  <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 1.8} fill={textC} fontSize="1.3" textAnchor="middle" fontFamily="monospace">{label} {Math.round(load * 100)}%</text>
                </g>
              );
            })}

            {/* Gate dots */}
            {gates.slice(0, 20).map((g, i) => {
              const col = i % 10;
              const row = Math.floor(i / 10);
              const cx = 6 + col * 7;
              const cy = 61 + row * 4;
              const gc = g.status === "occupied" ? "#f59e0b" : g.status === "open" ? "#10b981" : "#475569";
              return (
                <g key={g.id}>
                  <circle cx={cx} cy={cy} r="1.3" fill={gc} opacity="0.85" />
                  <text x={cx} y={cy + 3} fill={gc} fontSize="1" textAnchor="middle" fontFamily="monospace">{g.gate_code}</text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            {[["#10b981", "Low"], ["#06b6d4", "Moderate"], ["#f59e0b", "High"], ["#f43f5e", "Critical"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ background: c, opacity: 0.7 }} />
                <span className="text-[8px]" style={{ color: c }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Hovered zone tooltip */}
          {hovered && (
            <div className="absolute top-2 right-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,8,20,0.95)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <p className="text-[9px] font-black text-cyan-400 uppercase">{ZONES.find(z => z.id === hovered)?.label}</p>
              <p className="text-lg font-black text-white">{Math.round((loads[hovered] || 0) * 100)}%</p>
              <p className="text-[8px]" style={{ color: loadColor(loads[hovered] || 0).textC }}>{loadColor(loads[hovered] || 0).label}</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Kritiske Zoner", val: critical, color: "#f43f5e" },
              { label: "Høj Belastning", val: high, color: "#f59e0b" },
              { label: "Normale Zoner", val: ZONES.length - critical - high, color: "#10b981" },
              { label: "Gates Aktive", val: gates.filter(g => g.status === "occupied").length, color: "#06b6d4" },
            ].map(k => (
              <div key={k.label} className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
                <p className="text-[7px] uppercase tracking-widest" style={{ color: `${k.color}70` }}>{k.label}</p>
                <p className="text-xl font-black" style={{ color: k.color }}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Boarding now */}
          {boardingFlights.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.25)", background: "rgba(0,8,20,0.9)" }}>
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-800/50" style={{ background: "rgba(139,92,246,0.07)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-violet-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-violet-400">BOARDING NU</span>
              </div>
              <div className="p-2 space-y-1">
                {boardingFlights.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-[9px] px-2 py-1.5 rounded-lg"
                    style={{ background: "rgba(139,92,246,0.08)" }}>
                    <span className="font-black text-white">{f.flight_number}</span>
                    <span className="text-violet-400">Gate {f.gate || "?"}</span>
                    <span className="text-slate-400">{f.destination}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security status */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.9)" }}>
            <div className="px-3 py-2 border-b border-slate-800/50" style={{ background: "rgba(16,185,129,0.05)" }}>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">SEC. BANER STATUS</span>
            </div>
            <div className="p-2 space-y-1.5">
              {securityLanes.length === 0 && <p className="text-slate-700 text-[9px] text-center py-2">Ingen data</p>}
              {securityLanes.slice(0, 5).map(l => {
                const color = l.wait_minutes > 20 ? "#f43f5e" : l.wait_minutes > 10 ? "#f59e0b" : "#10b981";
                return (
                  <div key={l.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: l.status === "open" ? "#10b981" : "#f43f5e" }} />
                    <span className="text-[9px] text-slate-400 flex-1 truncate">{l.name}</span>
                    <span className="text-[9px] font-black" style={{ color }}>{l.wait_minutes || 0}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}