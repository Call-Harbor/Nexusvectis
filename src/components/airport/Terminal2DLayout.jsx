import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Eye, EyeOff } from "lucide-react";

const GATE_STATUS_COLOR = { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" };
const FLIGHT_STATUS_COLOR = { boarding: "#10b981", delayed: "#f43f5e", at_gate: "#06b6d4", scheduled: "#8b5cf6", landed: "#f59e0b" };

const MOCK_GATES = [
  { id: "A1", x: 8, y: 20, terminal: "A" }, { id: "A2", x: 8, y: 35 , terminal: "A"}, { id: "A3", x: 8, y: 50, terminal: "A" },
  { id: "A4", x: 8, y: 65, terminal: "A" }, { id: "A5", x: 8, y: 80, terminal: "A" },
  { id: "B1", x: 35, y: 10, terminal: "B" }, { id: "B2", x: 50, y: 10, terminal: "B" }, { id: "B3", x: 65, y: 10, terminal: "B" },
  { id: "B4", x: 80, y: 10, terminal: "B" },
  { id: "C1", x: 92, y: 25, terminal: "C" }, { id: "C2", x: 92, y: 40, terminal: "C" },
  { id: "C3", x: 92, y: 55, terminal: "C" }, { id: "C4", x: 92, y: 70, terminal: "C" },
  { id: "D1", x: 35, y: 88, terminal: "D" }, { id: "D2", x: 50, y: 88, terminal: "D" },
  { id: "D3", x: 65, y: 88, terminal: "D" }, { id: "D4", x: 80, y: 88, terminal: "D" },
];

const SECURITY_ZONES = [
  { id: "S1", label: "Security A", x: 20, y: 45, w: 12, h: 16 },
  { id: "S2", label: "Security B/C", x: 60, y: 45, w: 14, h: 16 },
];

const ZONES = [
  { id: "terminal_a", label: "Terminal A", x: 2, y: 8, w: 14, h: 85, color: "rgba(6,182,212,0.04)" },
  { id: "terminal_b", label: "Terminal B", x: 20, y: 2, w: 70, h: 16, color: "rgba(139,92,246,0.04)" },
  { id: "terminal_c", label: "Terminal C", x: 84, y: 8, w: 14, h: 85, color: "rgba(16,185,129,0.04)" },
  { id: "terminal_d", label: "Terminal D", x: 20, y: 80, w: 70, h: 18, color: "rgba(245,158,11,0.04)" },
  { id: "central", label: "Central Hub", x: 20, y: 20, w: 62, h: 58, color: "rgba(30,41,59,0.3)" },
];

export default function Terminal2DLayout({ flights = [], gates = [], securityLanes = [], bags = [] }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [showFlights, setShowFlights] = useState(true);
  const [showSecurity, setShowSecurity] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));
  const dbGateMap = Object.fromEntries(gates.map(g => [g.gate_code, g]));

  const getGateData = (mockGate) => {
    const dbGate = dbGateMap[mockGate.id];
    const flight = dbGate?.current_flight_id ? flightMap[dbGate.current_flight_id] : null;
    const status = dbGate?.status || "open";
    return { dbGate, flight, status };
  };

  const runWhatIf = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Terminal 2D What-If Analysis:
Flights: ${flights.length} total, ${flights.filter(f => f.status === "delayed").length} delayed, ${flights.filter(f => f.status === "boarding").length} boarding
Security avg wait: ${securityLanes.length ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : "N/A"} min
Bags at risk: ${bags.filter(b => b.is_rush).length}

Provide a brief terminal flow analysis with:
- flow_score: number 0-100
- congestion_zones: array of 3 strings (zone names with issues)
- reallocation_suggestions: array of 3 strings
- passenger_risk_minutes: number (avg delay risk)
- optimization_summary: string (1 sentence)`,
        response_json_schema: {
          type: "object", properties: {
            flow_score: { type: "number" },
            congestion_zones: { type: "array", items: { type: "string" } },
            reallocation_suggestions: { type: "array", items: { type: "string" } },
            passenger_risk_minutes: { type: "number" },
            optimization_summary: { type: "string" }
          }
        }
      });
      setAnalysis(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectedGateData = selectedGate ? getGateData(selectedGate) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">TERMINAL LAYOUT</p>
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <button onClick={() => setShowFlights(!showFlights)} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] uppercase font-bold"
            style={{ border: "1px solid rgba(6,182,212,0.3)", background: showFlights ? "rgba(6,182,212,0.1)" : "transparent", color: showFlights ? "#06b6d4" : "#64748b" }}>
            {showFlights ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Fly
          </button>
          <button onClick={() => setShowSecurity(!showSecurity)} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] uppercase font-bold"
            style={{ border: "1px solid rgba(245,158,11,0.3)", background: showSecurity ? "rgba(245,158,11,0.1)" : "transparent", color: showSecurity ? "#f59e0b" : "#64748b" }}>
            {showSecurity ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Security
          </button>
          <button onClick={runWhatIf} disabled={loading} className="flex items-center gap-1.5 px-3 py-1 rounded text-[8px] uppercase font-bold"
            style={{ border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.15)", color: "#a855f7" }}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "⚡"} What-If AI
          </button>
        </div>
        <div className="flex items-center gap-3 text-[8px]">
          {Object.entries(GATE_STATUS_COLOR).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: v }} />{k}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* SVG Map */}
        <div className="col-span-2 rounded-xl overflow-hidden relative" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(0,8,20,0.95)", aspectRatio: "16/10" }}>
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {/* Background */}
            <rect x="0" y="0" width="100" height="100" fill="rgba(0,8,20,0.95)" />

            {/* Terminal zones */}
            {ZONES.map(z => (
              <g key={z.id}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={z.color} stroke="rgba(30,41,59,0.6)" strokeWidth="0.3" rx="1" />
                <text x={z.x + z.w / 2} y={z.y + 3} textAnchor="middle" fontSize="2" fill="rgba(100,116,139,0.6)" fontFamily="monospace">{z.label}</text>
              </g>
            ))}

            {/* Security zones */}
            {showSecurity && SECURITY_ZONES.map(s => (
              <g key={s.id}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.4)" strokeWidth="0.3" rx="0.5" />
                <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 0.8} textAnchor="middle" fontSize="1.5" fill="#f59e0b" fontFamily="monospace">{s.label}</text>
              </g>
            ))}

            {/* Connector lines between terminals */}
            <line x1="16" y1="50" x2="20" y2="50" stroke="rgba(30,41,59,0.8)" strokeWidth="0.5" />
            <line x1="82" y1="50" x2="84" y2="50" stroke="rgba(30,41,59,0.8)" strokeWidth="0.5" />
            <line x1="50" y1="18" x2="50" y2="20" stroke="rgba(30,41,59,0.8)" strokeWidth="0.5" />
            <line x1="50" y1="78" x2="50" y2="80" stroke="rgba(30,41,59,0.8)" strokeWidth="0.5" />

            {/* Gates */}
            {MOCK_GATES.map(g => {
              const { flight, status } = getGateData(g);
              const color = GATE_STATUS_COLOR[status] || "#10b981";
              const isSelected = selectedGate?.id === g.id;
              const hasFlight = showFlights && flight;
              const flightColor = flight ? (FLIGHT_STATUS_COLOR[flight.status] || "#06b6d4") : color;
              return (
                <g key={g.id} style={{ cursor: "pointer" }} onClick={() => setSelectedGate(isSelected ? null : g)}>
                  <circle cx={g.x} cy={g.y} r={isSelected ? 3 : 2.2}
                    fill={hasFlight ? `${flightColor}25` : `${color}15`}
                    stroke={isSelected ? "#fff" : hasFlight ? flightColor : color}
                    strokeWidth={isSelected ? 0.6 : 0.4} />
                  {isSelected && <circle cx={g.x} cy={g.y} r={4} fill="none" stroke="#ffffff" strokeWidth="0.3" strokeDasharray="1,1" />}
                  <text x={g.x} y={g.y + 0.7} textAnchor="middle" fontSize="1.6" fill="white" fontFamily="monospace" fontWeight="bold">{g.id}</text>
                  {hasFlight && (
                    <text x={g.x} y={g.y + 3.5} textAnchor="middle" fontSize="1.2" fill={flightColor} fontFamily="monospace">
                      {flight.flight_number}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Selected gate */}
          <div className="rounded-xl p-3" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(0,10,25,0.7)", minHeight: "120px" }}>
            <p className="text-[8px] uppercase tracking-widest text-cyan-400 mb-2">GATE DETALJER</p>
            {selectedGateData ? (
              <div className="space-y-1.5 text-[9px]">
                <div className="flex justify-between"><span className="text-slate-500">Gate</span><span className="font-bold text-white">{selectedGate.id}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Terminal</span><span className="text-white">{selectedGate.terminal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span>
                  <span className="font-bold" style={{ color: GATE_STATUS_COLOR[selectedGateData.status] }}>{selectedGateData.status}</span></div>
                {selectedGateData.flight ? (<>
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-[8px] uppercase text-slate-500 mb-1">Aktiv fly</p>
                    <p className="font-bold text-white">{selectedGateData.flight.flight_number}</p>
                    <p className="text-slate-400">{selectedGateData.flight.airline}</p>
                    <p className="text-slate-500">{selectedGateData.flight.origin} → {selectedGateData.flight.destination}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Status</span>
                      <span className="font-bold" style={{ color: FLIGHT_STATUS_COLOR[selectedGateData.flight.status] || "#06b6d4" }}>
                        {selectedGateData.flight.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pax</span>
                      <span className="text-white">{selectedGateData.flight.pax_boarded || 0}/{selectedGateData.flight.pax_total || 0}</span>
                    </div>
                  </div>
                </>) : <p className="text-slate-600 text-[9px] mt-2">Ingen aktiv fly</p>}
              </div>
            ) : <p className="text-slate-600 text-[9px] text-center py-4">Klik på en gate i kortet</p>}
          </div>

          {/* What-If result */}
          <div className="rounded-xl p-3" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.7)" }}>
            <p className="text-[8px] uppercase tracking-widest text-violet-400 mb-2">WHAT-IF ANALYSE</p>
            {loading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-violet-400 animate-spin" /></div>}
            {!loading && !analysis && <p className="text-slate-600 text-[9px] text-center py-3">Kør AI analyse ovenfor</p>}
            {analysis && (
              <div className="space-y-2 text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Flow score</span>
                  <span className="text-2xl font-bold" style={{ color: analysis.flow_score > 70 ? "#10b981" : analysis.flow_score > 50 ? "#f59e0b" : "#f43f5e" }}>
                    {analysis.flow_score}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Forsinkelsesrisiko</span>
                  <span className="font-bold text-orange-400">{analysis.passenger_risk_minutes} min</span>
                </div>
                {analysis.congestion_zones?.length > 0 && (
                  <div>
                    <p className="text-[7px] uppercase text-red-400 mb-1">KØDANNELSE</p>
                    {analysis.congestion_zones.map((z, i) => <p key={i} className="text-slate-400">• {z}</p>)}
                  </div>
                )}
                {analysis.reallocation_suggestions?.length > 0 && (
                  <div>
                    <p className="text-[7px] uppercase text-emerald-400 mb-1">FORSLAG</p>
                    {analysis.reallocation_suggestions.map((s, i) => <p key={i} className="text-slate-300">• {s}</p>)}
                  </div>
                )}
                {analysis.optimization_summary && (
                  <p className="text-slate-400 italic border-t border-slate-800 pt-2">{analysis.optimization_summary}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}