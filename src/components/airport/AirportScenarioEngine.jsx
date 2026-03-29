import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, Zap, Clock, Users, Plane, CheckCircle, Activity } from "lucide-react";

const SCENARIOS = [
  { id: "storm", label: "Thunderstorm", icon: "⛈️", desc: "Severe weather, ground stops, diversions", color: "#3b82f6" },
  { id: "fog", label: "Dense Fog", icon: "🌫️", desc: "CAT III ops, reduced capacity", color: "#64748b" },
  { id: "security_incident", label: "Security Incident", icon: "🚨", desc: "Evacuation, checkpoint closure", color: "#f43f5e" },
  { id: "baggage_system_failure", label: "BHS Failure", icon: "⚙️", desc: "Manual baggage operations", color: "#f97316" },
  { id: "fire_alarm", label: "Terminal Fire", icon: "🔥", desc: "Evacuation, gate reassignments", color: "#ef4444" },
  { id: "it_outage", label: "IT Outage", icon: "💻", desc: "AODB/check-in systems down", color: "#8b5cf6" },
  { id: "strike", label: "Staff Strike", icon: "✊", desc: "50% staff, priority-only ops", color: "#f59e0b" },
  { id: "medical_emergency", label: "Medical Emergency", icon: "🚑", desc: "Aircraft diverted, paramedics on stand", color: "#10b981" },
];

const SEV_COLOR = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

export default function AirportScenarioEngine({ flights, gates, securityLanes }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simHistory, setSimHistory] = useState([]);

  const runScenario = async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    const scenario = SCENARIOS.find(s => s.id === selected);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Operations disruption analyst. Simulate: "${scenario.label}" (${scenario.desc}).

Airport state:
- ${flights.length} flights. Delayed: ${flights.filter(f => (f.delay_minutes || 0) > 5).length}. Boarding: ${flights.filter(f => f.status === "boarding").length}
- Gates: ${gates.length} total, ${gates.filter(g => g.status === "occupied").length} occupied
- Security: ${securityLanes.filter(l => l.status === "open").length} lanes open, avg ${securityLanes.length > 0 ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : 0}m wait
- Total PAX on ground: ~${flights.reduce((s, f) => s + (f.pax_total || 0), 0)}

Return JSON:
- impact_summary: string 2 sentences
- flights_affected: number
- estimated_delay_cascade_minutes: number
- pax_impacted: number
- revenue_loss_estimate_eur: number
- key_risks: array of 4 strings
- mitigation_steps: array of 5 actionable strings with timeframe
- recovery_time_hours: number
- severity: "low"|"medium"|"high"|"critical"
- immediate_priority: string (1 action to take in next 5 minutes)
- gates_to_close: number`,
        response_json_schema: {
          type: "object",
          properties: {
            impact_summary: { type: "string" },
            flights_affected: { type: "number" },
            estimated_delay_cascade_minutes: { type: "number" },
            pax_impacted: { type: "number" },
            revenue_loss_estimate_eur: { type: "number" },
            key_risks: { type: "array", items: { type: "string" } },
            mitigation_steps: { type: "array", items: { type: "string" } },
            recovery_time_hours: { type: "number" },
            severity: { type: "string" },
            immediate_priority: { type: "string" },
            gates_to_close: { type: "number" }
          }
        }
      });
      setResult(res);
      setSimHistory(h => [{ scenario: scenario.label, icon: scenario.icon, severity: res.severity, ts: new Date() }, ...h].slice(0, 5));
    } catch {
      setResult({ impact_summary: "Simulation fejlede. Prøv igen.", flights_affected: 0, key_risks: [], mitigation_steps: [], severity: "low", immediate_priority: "" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-red-400">DISRUPTION SCENARIO ENGINE</h2>
        </div>
        {simHistory.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-slate-600 uppercase tracking-widest">SENESTE:</span>
            {simHistory.slice(0, 3).map((h, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 rounded-lg font-bold"
                style={{ background: `${SEV_COLOR[h.severity] || "#64748b"}15`, color: SEV_COLOR[h.severity] || "#64748b", border: `1px solid ${SEV_COLOR[h.severity] || "#64748b"}25` }}>
                {h.icon} {h.scenario}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scenario grid */}
      <div className="grid grid-cols-4 gap-3">
        {SCENARIOS.map(s => {
          const isSelected = selected === s.id;
          return (
            <button key={s.id} onClick={() => { setSelected(s.id); setResult(null); }}
              className="flex flex-col items-center p-4 rounded-2xl transition-all text-center group"
              style={{
                background: isSelected ? `${s.color}15` : "rgba(0,8,20,0.8)",
                border: `1.5px solid ${isSelected ? s.color + "70" : "rgba(30,41,59,0.5)"}`,
                boxShadow: isSelected ? `0 0 20px ${s.color}20` : "none"
              }}>
              <span className="text-3xl mb-2">{s.icon}</span>
              <span className="text-[10px] font-black text-white mb-1">{s.label}</span>
              <span className="text-[8px] text-slate-500 leading-tight">{s.desc}</span>
              {isSelected && <span className="mt-2 text-[8px] font-black uppercase tracking-widest" style={{ color: s.color }}>VALGT</span>}
            </button>
          );
        })}
      </div>

      <button onClick={runScenario} disabled={!selected || loading}
        className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        style={{ background: selected ? "rgba(244,63,94,0.12)" : "rgba(15,23,42,0.6)", border: `1.5px solid ${selected ? "rgba(244,63,94,0.5)" : "rgba(30,41,59,0.6)"}`, color: selected ? "#f43f5e" : "#334155" }}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Simulerer...</> : <><Zap className="w-4 h-4" />Kør Simulation — {SCENARIOS.find(s => s.id === selected)?.label || "Vælg scenario"}</>}
      </button>

      {result && (
        <div className="space-y-4">
          {/* Immediate priority banner */}
          {result.immediate_priority && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(244,63,94,0.1)", border: "1.5px solid rgba(244,63,94,0.4)" }}>
              <Zap className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-0.5">ØJEBLIKKELIG PRIORITET</p>
                <p className="text-sm font-black text-white">{result.immediate_priority}</p>
              </div>
            </div>
          )}

          {/* Severity + summary */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: `${SEV_COLOR[result.severity] || "#64748b"}10`, border: `1.5px solid ${SEV_COLOR[result.severity] || "#64748b"}35` }}>
            <div className="text-center px-3">
              <p className="text-[7px] uppercase tracking-widest text-slate-600">ALVORLIGHED</p>
              <p className="text-lg font-black uppercase" style={{ color: SEV_COLOR[result.severity] }}>{result.severity}</p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <p className="text-[10px] text-slate-300 flex-1">{result.impact_summary}</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Fly Ramt", val: result.flights_affected, color: "#f43f5e", icon: Plane },
              { label: "Delay Cascade", val: `${result.estimated_delay_cascade_minutes}m`, color: "#f97316", icon: Clock },
              { label: "PAX Ramt", val: (result.pax_impacted || 0).toLocaleString(), color: "#f59e0b", icon: Users },
              { label: "Gates Lukkes", val: result.gates_to_close || 0, color: "#8b5cf6", icon: Activity },
              { label: "Restituering", val: `${result.recovery_time_hours}t`, color: "#06b6d4", icon: CheckCircle },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-2xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
                  <p className="text-[7px] uppercase tracking-widest text-slate-600">{k.label}</p>
                  <p className="text-xl font-black" style={{ color: k.color }}>{k.val}</p>
                </div>
              );
            })}
          </div>

          {result.revenue_loss_estimate_eur > 0 && (
            <div className="px-4 py-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
              <span className="text-[9px] text-slate-500">Estimeret tab:</span>
              <span className="text-sm font-black text-red-400">€{result.revenue_loss_estimate_eur.toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(0,8,20,0.9)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-red-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />NØGLERISICI
              </p>
              <div className="space-y-2">
                {(result.key_risks || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 text-xs flex-shrink-0">▸</span>
                    <p className="text-[10px] text-slate-300">{r}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.9)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />MITIGATIONSHANDLINGER
              </p>
              <div className="space-y-2">
                {(result.mitigation_steps || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black text-[9px] flex-shrink-0">{i + 1}.</span>
                    <p className="text-[10px] text-slate-300">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}