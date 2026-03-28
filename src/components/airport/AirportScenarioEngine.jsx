import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, Zap } from "lucide-react";

const SCENARIOS = [
  { id: "storm", label: "Thunderstorm", icon: "⛈️", desc: "Severe weather forcing ground stops and diversions" },
  { id: "fog", label: "Dense Fog", icon: "🌫️", desc: "CAT III operations, reduced capacity, delays cascade" },
  { id: "security_incident", label: "Security Incident", icon: "🚨", desc: "Terminal evacuation, checkpoint closure, flight holds" },
  { id: "baggage_system_failure", label: "BHS Failure", icon: "⚙️", desc: "Baggage handling system breakdown, manual operations" },
  { id: "fire_alarm", label: "Terminal Fire Alarm", icon: "🔥", desc: "Evacuation of one terminal, gate reassignments" },
  { id: "it_outage", label: "IT Outage", icon: "💻", desc: "AODB/check-in systems down, manual check-in" },
  { id: "strike", label: "Staff Strike", icon: "✊", desc: "50% staff reduction, priority-only operations" },
];

export default function AirportScenarioEngine({ flights, gates, securityLanes }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runScenario = async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    const scenario = SCENARIOS.find(s => s.id === selected);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Operations disruption analyst. Simulate the impact of: "${scenario.label}" (${scenario.desc}).

Current airport state:
- ${flights.length} flights scheduled. Delayed: ${flights.filter(f => (f.delay_minutes || 0) > 5).length}
- Gates: ${gates.length} total, ${gates.filter(g => g.status === "occupied").length} occupied
- Security lanes open: ${securityLanes.filter(l => l.status === "open").length}

Provide a JSON response with keys:
- impact_summary: string (2 sentences)
- flights_affected: number
- estimated_delay_cascade_minutes: number
- pax_impacted: number
- key_risks: array of 3 strings
- mitigation_steps: array of 4 actionable steps
- recovery_time_hours: number
- severity: "low"|"medium"|"high"|"critical"`,
        response_json_schema: {
          type: "object",
          properties: {
            impact_summary: { type: "string" },
            flights_affected: { type: "number" },
            estimated_delay_cascade_minutes: { type: "number" },
            pax_impacted: { type: "number" },
            key_risks: { type: "array", items: { type: "string" } },
            mitigation_steps: { type: "array", items: { type: "string" } },
            recovery_time_hours: { type: "number" },
            severity: { type: "string" }
          }
        }
      });
      setResult(res);
    } catch {
      setResult({ impact_summary: "Simulation failed. Please retry.", flights_affected: 0, key_risks: [], mitigation_steps: [], severity: "low" });
    }
    setLoading(false);
  };

  const sevColor = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-400">DISRUPTION SCENARIO ENGINE</h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              className="flex flex-col items-center p-3 rounded-xl transition-all text-center"
              style={{
                background: selected === s.id ? "rgba(244,63,94,0.15)" : "rgba(15,23,42,0.5)",
                border: `1px solid ${selected === s.id ? "rgba(244,63,94,0.5)" : "rgba(30,41,59,0.8)"}`,
                boxShadow: selected === s.id ? "0 0 12px rgba(244,63,94,0.2)" : "none"
              }}>
              <span className="text-2xl mb-1">{s.icon}</span>
              <span className="text-[10px] font-semibold text-white">{s.label}</span>
              <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">{s.desc.slice(0, 30)}...</span>
            </button>
          ))}
        </div>

        <button onClick={runScenario} disabled={!selected || loading}
          className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{ background: selected ? "rgba(244,63,94,0.15)" : "rgba(30,41,59,0.5)", border: `1px solid ${selected ? "rgba(244,63,94,0.5)" : "rgba(30,41,59,0.8)"}`, color: selected ? "#f43f5e" : "#475569" }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</> : <><Zap className="w-4 h-4" /> Run Simulation</>}
        </button>

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: `${sevColor[result.severity] || "#64748b"}12`, border: `1px solid ${sevColor[result.severity] || "#64748b"}35` }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sevColor[result.severity] }}>
                {result.severity?.toUpperCase()} SEVERITY
              </span>
              <span className="text-[10px] text-slate-300 ml-2">{result.impact_summary}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Flights Affected", val: result.flights_affected },
                { label: "Delay Cascade", val: `${result.estimated_delay_cascade_minutes || 0}m` },
                { label: "PAX Impacted", val: (result.pax_impacted || 0).toLocaleString() },
              ].map(k => (
                <div key={k.label} className="rounded-lg p-3 text-center" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <p className="text-[8px] tracking-widest uppercase text-slate-500">{k.label}</p>
                  <p className="text-xl font-bold text-red-400 mt-0.5">{k.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)" }}>
                <p className="text-[9px] tracking-widest uppercase text-red-400/70 mb-2">KEY RISKS</p>
                {(result.key_risks || []).map((r, i) => (
                  <p key={i} className="text-[10px] text-slate-300 mb-1 flex items-start gap-1.5"><span className="text-red-400 mt-0.5">▸</span>{r}</p>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)" }}>
                <p className="text-[9px] tracking-widest uppercase text-emerald-400/70 mb-2">MITIGATION STEPS</p>
                {(result.mitigation_steps || []).map((s, i) => (
                  <p key={i} className="text-[10px] text-slate-300 mb-1 flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span>{s}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}