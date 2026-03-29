import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Zap, Wind, Wrench, Users, Ship } from "lucide-react";

const SCENARIOS = [
  { id: "storm", label: "Storm / Extreme Weather", icon: Wind, color: "#f59e0b", desc: "Simulate closure of outer berths + 12-48 hour delay for all incoming vessels" },
  { id: "crane_breakdown", label: "Crane Breakdown", icon: Wrench, color: "#f43f5e", desc: "One STS crane goes down. What happens to backlog and turnaround?" },
  { id: "strike", label: "Strike (Partial)", icon: Users, color: "#8b5cf6", desc: "Capacity reduced to 60% due to partial strike. Impact analysis." },
  { id: "vessel_diverted", label: "Vessel Diverted", icon: Ship, color: "#06b6d4", desc: "Large vessel skips the port and goes to neighboring port. Capacity and revenue impact." },
  { id: "it_outage", label: "IT Outage", icon: Zap, color: "#f43f5e", desc: "TOS down for 4 hours. Manual contingency and critical operations prioritization." },
  { id: "congestion", label: "Yard Overcongestion", icon: AlertTriangle, color: "#f59e0b", desc: "Yard hits 95%+ occupancy. What to do to prevent gate/discharge stoppage?" },
];

export default function PortScenarioEngine({ portCalls, berths, cranes, yardZones, orgId }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customScenario, setCustomScenario] = useState("");

  const runScenario = async (scenarioId, customText) => {
    setLoading(true);
    setResult(null);

    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    const contextData = {
      activeCalls: portCalls.filter(p => ["operations", "berthed", "approaching"].includes(p.status)).length,
      plannedCalls: portCalls.filter(p => p.status === "planned").length,
      criticalCalls: portCalls.filter(p => p.priority === "critical").length,
      workingCranes: cranes.filter(c => c.status === "working").length,
      totalCranes: cranes.length,
      avgYardOcc: yardZones.length ? Math.round(yardZones.reduce((s, z) => s + (z.occupancy_pct || 0), 0) / yardZones.length) : 0,
      berthsAvail: berths.filter(b => b.status === "available").length,
    };

    const prompt = `You are a port operations AI running a scenario simulation.

PORT STATUS:
- ${contextData.activeCalls} active calls, ${contextData.plannedCalls} planned, ${contextData.criticalCalls} critical
- ${contextData.workingCranes}/${contextData.totalCranes} cranes active
- Yard occupancy: ${contextData.avgYardOcc}%
- ${contextData.berthsAvail} berths available

SCENARIO: ${scenario ? scenario.label + " — " + scenario.desc : customText}

Simulate this scenario and provide:
1. Immediate consequences (next 6 hours)
2. Cascading effects (next 24-72 hours)
3. Quantified impact: backlog (TEU), delayed turnaround (hours), estimated cost (EUR)
4. Prioritized mitigation actions (top 5, concrete and action-oriented)
5. Recovery plan

Be precise and quantify effects.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          immediate_impact: { type: "string" },
          cascading_effects: { type: "string" },
          quantified_impact: {
            type: "object",
            properties: {
              backlog_teu: { type: "number" },
              delay_hours: { type: "number" },
              cost_eur: { type: "number" }
            }
          },
          mitigations: { type: "array", items: { type: "string" } },
          recovery_plan: { type: "string" },
          severity: { type: "string" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const severityColor = (sev) => {
    if (!sev) return "#94a3b8";
    if (sev.toLowerCase().includes("critical")) return "#f43f5e";
    if (sev.toLowerCase().includes("high")) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#f43f5e" }}>SCENARIO & RESILIENCE ENGINE</h2>
        <p className="text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>Simulate disruptions and see consequences in real time</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SCENARIOS.map(sc => {
          const Icon = sc.icon;
          const isSelected = selected === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => { setSelected(sc.id); runScenario(sc.id); }}
              className="text-left rounded-xl p-4 transition-all hover:scale-[1.02]"
              style={{
                border: `1px solid ${isSelected ? sc.color : sc.color + "33"}`,
                background: isSelected ? `${sc.color}12` : `${sc.color}06`,
                boxShadow: isSelected ? `0 0 20px ${sc.color}22` : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" style={{ color: sc.color }} />
                <p className="text-xs font-bold" style={{ color: sc.color }}>{sc.label}</p>
              </div>
              <p className="text-[8px] text-slate-500 leading-relaxed">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom scenario */}
      <div className="flex gap-3">
        <input
          value={customScenario}
          onChange={e => setCustomScenario(e.target.value)}
          placeholder="Describe your own scenario, e.g. 'Berth 3 closed for maintenance 3 days while 2 large vessels waiting'"
          className="flex-1 px-4 py-2.5 rounded-xl text-xs text-white bg-slate-900 border border-slate-700 focus:outline-none focus:border-red-500 placeholder-slate-600"
        />
        <button
          onClick={() => { setSelected("custom"); runScenario(null, customScenario); }}
          disabled={!customScenario.trim() || loading}
          className="px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all"
          style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e" }}
        >
          RUN SCENARIO
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl p-8 text-center" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.04)" }}>
          <div className="flex justify-center gap-1 mb-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-1.5 h-6 rounded-full animate-pulse" style={{ background: "#f43f5e", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(244,63,94,0.7)" }}>SIMULATING SCENARIO...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(244,63,94,0.08)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#f43f5e" }}>SIMULATION RESULT</p>
            {result.severity && (
              <span className="text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest"
                style={{ background: `${severityColor(result.severity)}22`, color: severityColor(result.severity) }}>
                {result.severity}
              </span>
            )}
          </div>
          <div className="p-4 space-y-4">
            {/* KPI Impact */}
            {result.quantified_impact && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Backlog", value: `${result.quantified_impact.backlog_teu || 0} TEU`, color: "#f43f5e" },
                  { label: "Delay", value: `${result.quantified_impact.delay_hours || 0}h`, color: "#f59e0b" },
                  { label: "Estimated Loss", value: `€${(result.quantified_impact.cost_eur || 0).toLocaleString()}`, color: "#8b5cf6" },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-lg p-3 text-center" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}22` }}>
                    <p className="text-[7px] uppercase tracking-widest" style={{ color: `${kpi.color}88` }}>{kpi.label}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f43f5e" }}>IMMEDIATE CONSEQUENCES</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.immediate_impact}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>CASCADING EFFECTS</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.cascading_effects}</p>
              </div>
            </div>

            {result.mitigations?.length > 0 && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>MITIGATION ACTIONS</p>
                <div className="space-y-1.5">
                  {result.mitigations.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <span className="text-[8px] font-bold w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#10b981", color: "white" }}>{i + 1}</span>
                      <p className="text-[9px] text-slate-300">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recovery_plan && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "#06b6d4" }}>RECOVERY PLAN</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.recovery_plan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}