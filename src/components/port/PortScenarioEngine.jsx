import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Zap, Wind, Wrench, Users, Ship } from "lucide-react";

const SCENARIOS = [
  { id: "storm", label: "Storm / Ekstremvejr", icon: Wind, color: "#f59e0b", desc: "Simulér lukning af ydre kajer + forsinkelse på 12-48 timer for alle indgående skibe" },
  { id: "crane_breakdown", label: "Kran Breakdown", icon: Wrench, color: "#f43f5e", desc: "En STS-kran falder ud. Hvad sker der med backlog og turnaround?" },
  { id: "strike", label: "Strejke (delvis)", icon: Users, color: "#8b5cf6", desc: "Kapaciteten reduceres til 60% pga. delstrejke. Konsekvensanalyse." },
  { id: "vessel_diverted", label: "Skib omdirigeret", icon: Ship, color: "#06b6d4", desc: "Et større skib skipper havnen og går til naboport. Kapacitets- og indkomsteffekt." },
  { id: "it_outage", label: "IT Nedbrud", icon: Zap, color: "#f43f5e", desc: "TOS er nede i 4 timer. Manuelt beredskab og prioritering af kritiske operationer." },
  { id: "congestion", label: "Yard Overbelægning", icon: AlertTriangle, color: "#f59e0b", desc: "Yard rammer 95%+ belægning. Hvad gøres for at undgå stop i gate/losning?" },
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

    const prompt = `Du er port operations AI der kører en scenariosimulering.

HAVN STATUS:
- ${contextData.activeCalls} aktive anløb, ${contextData.plannedCalls} planlagte, ${contextData.criticalCalls} kritiske
- ${contextData.workingCranes}/${contextData.totalCranes} kraner aktive
- Yard belægning: ${contextData.avgYardOcc}%
- ${contextData.berthsAvail} kajer tilgængelige

SCENARIE: ${scenario ? scenario.label + " — " + scenario.desc : customText}

Simulér dette scenarie og giv:
1. Direkte konsekvenser (næste 6 timer)
2. Kaskadering effekter (næste 24-72 timer)
3. Estimeret impact: backlog (TEU), forsinket turnaround (timer), estimeret omkostning (EUR)
4. Prioriterede mitigationshandlinger (top 5, konkrete og handlingsrettede)
5. Recovery plan

Svar på dansk. Vær præcis og kvantificér effekter.`;

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
    if (sev.toLowerCase().includes("kritisk")) return "#f43f5e";
    if (sev.toLowerCase().includes("høj")) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#f43f5e" }}>SCENARIO & RESILIENCE ENGINE</h2>
        <p className="text-[9px]" style={{ color: "rgba(100,116,139,0.4)" }}>Simulér forstyrrelser og se konsekvenser i realtid</p>
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
          placeholder="Beskriv dit eget scenarie, f.eks. 'Kaj 3 lukkes for vedligehold i 3 dage mens 2 store skibe venter'"
          className="flex-1 px-4 py-2.5 rounded-xl text-xs text-white bg-slate-900 border border-slate-700 focus:outline-none focus:border-red-500 placeholder-slate-600"
        />
        <button
          onClick={() => { setSelected("custom"); runScenario(null, customScenario); }}
          disabled={!customScenario.trim() || loading}
          className="px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all"
          style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e" }}
        >
          KØR SCENARIE
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
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(244,63,94,0.7)" }}>SIMULERER SCENARIE...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(244,63,94,0.08)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#f43f5e" }}>SIMULERINGSRESULTAT</p>
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
                  { label: "Forsinkelse", value: `${result.quantified_impact.delay_hours || 0}h`, color: "#f59e0b" },
                  { label: "Estimeret tab", value: `€${(result.quantified_impact.cost_eur || 0).toLocaleString()}`, color: "#8b5cf6" },
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
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f43f5e" }}>DIREKTE KONSEKVENSER</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.immediate_impact}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>KASKADERING EFFEKTER</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.cascading_effects}</p>
              </div>
            </div>

            {result.mitigations?.length > 0 && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>MITIGERINGSHANDLINGER</p>
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