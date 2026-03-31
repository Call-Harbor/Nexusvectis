import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, AlertTriangle, RefreshCw, Sparkles, GitBranch, Activity, Wind, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCENARIOS = [
  {
    id: "line_fault",
    title: "132kV Line Fault Rødby-CPH",
    icon: Zap,
    color: "red",
    trigger: "Lightning strike / cable fault on 132kV transmission line",
    impact: "371 MW interrupted transmission — 4 substations affected",
    affected: ["Substation Nordhavn", "Shore Power Pier 7", "Terminal 2 HVAC"],
    reconfiguration: [
      "Automatic switching via 60kV ring network (45 sec)",
      "Battery storage Kastrup covers 38 MW gap immediately",
      "Wind farm Øresund ramps up output +15 MW",
      "Shore Power Pier 7 reduced to 50% (service-critical minimum)",
    ],
    load_shed_mw: 42,
    recovery_min: 12,
    saidi_impact: 0.8,
  },
  {
    id: "heatwave",
    title: "Heatwave + Peak Load",
    icon: Activity,
    color: "amber",
    trigger: "+8°C above norm for 3 days — cooling demand spikes",
    impact: "Expected peak load of 940 MW — 15% above capacity",
    affected: ["All load nodes", "132kV Line Rødby-CPH (>98%)", "PtX halted"],
    reconfiguration: [
      "Gas power plant Avedøre activated to 100% (500 MW)",
      "Flex-request to Airport: −8 MW HVAC for 4 hours",
      "Flex-request to Transit: defer charging cycle to night",
      "Emergency agreement: import from Sweden via Storebælt (max 200 MW)",
    ],
    load_shed_mw: 0,
    recovery_min: 0,
    saidi_impact: 0.0,
  },
  {
    id: "storm",
    title: "Storm Front — Multi-fault",
    icon: Wind,
    color: "violet",
    trigger: "Wind gusts >35 m/s — 3 lines down simultaneously",
    impact: "East Jutland and Bornholm in islanding mode",
    affected: ["3 x 132kV lines", "2 substations offline", "Wind farm Øresund shut down (protection)"],
    reconfiguration: [
      "Islanding mode activated for Bornholm: local PtX + diesel backup",
      "Automatic load shedding: industrial clusters (50 MW) deprioritized",
      "Emergency tie to South Norway via HVDC (Skagerrak) requested",
      "All flexible nodes reduced to 20% non-critical consumption",
    ],
    load_shed_mw: 120,
    recovery_min: 45,
    saidi_impact: 3.2,
  },
  {
    id: "flood",
    title: "Flooding — Nordhavn Substation",
    icon: Waves,
    color: "blue",
    trigger: "Sea level rise 1.8m — Nordhavn transformer critical",
    impact: "121 MW north-CPH risks total blackout within 2 hours",
    affected: ["Substation Nordhavn", "Shore Power Pier 7", "Port cranes"],
    reconfiguration: [
      "Planned orderly shutdown of Nordhavn station (prevents explosion)",
      "Rerouting via Valby substation (60kV, 80% capacity)",
      "Port Command: all cranes and shore power shut down in order",
      "Port operations transfer to diesel generators (emergency plan A)",
    ],
    load_shed_mw: 80,
    recovery_min: 180,
    saidi_impact: 5.1,
  },
];

function ScenarioCard({ scenario, onSimulate, simulating, result }) {
  const Icon = scenario.icon;
  const c = scenario.color;

  return (
    <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-white text-sm">
          <div className={`w-9 h-9 rounded-lg bg-${c}-500/15 border border-${c}-500/30 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 text-${c}-400`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{scenario.title}</div>
            <div className="text-slate-500 text-xs font-normal mt-0.5 truncate">{scenario.trigger}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`text-xs text-${c}-300 bg-${c}-500/8 border border-${c}-500/20 rounded-lg p-2.5`}>
          <strong>Impact:</strong> {scenario.impact}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/60 rounded-lg p-2">
            <div className={`text-lg font-black ${scenario.load_shed_mw > 0 ? `text-${c}-400` : "text-emerald-400"}`}>{scenario.load_shed_mw} MW</div>
            <div className="text-slate-500 text-[10px]">Load shed</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2">
            <div className="text-lg font-black text-slate-200">{scenario.recovery_min} min</div>
            <div className="text-slate-500 text-[10px]">Recovery</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2">
            <div className={`text-lg font-black ${scenario.saidi_impact > 1 ? "text-red-400" : "text-amber-400"}`}>{scenario.saidi_impact}</div>
            <div className="text-slate-500 text-[10px]">SAIDI min</div>
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">AI Reconfiguration Plan</p>
          <ul className="space-y-1">
            {scenario.reconfiguration.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-cyan-500 flex-shrink-0 font-mono">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onSimulate(scenario)}
          disabled={simulating}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-cyan-700 hover:to-violet-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {simulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <GitBranch className="w-3 h-3" />}
          {simulating ? "Simulating..." : "Run AI Simulation"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-cyan-500/5 border border-cyan-500/25 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-[10px] font-semibold">SIMULATION RESULT</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">{result}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function ResiliencePanel() {
  const [simulating, setSimulating] = useState(null);
  const [results, setResults] = useState({});

  const handleSimulate = async (scenario) => {
    setSimulating(scenario.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are NexusVectis Grid Resilience AI. Simulate this grid event in detail:

EVENT: ${scenario.title}
TRIGGER: ${scenario.trigger}
IMPACT: ${scenario.impact}
AFFECTED ASSETS: ${scenario.affected.join(", ")}
PLANNED RECONFIGURATION: ${scenario.reconfiguration.join(" | ")}
KPIs: Load shed ${scenario.load_shed_mw} MW, Recovery ${scenario.recovery_min} min, SAIDI ${scenario.saidi_impact} min

Generate a detailed step-by-step simulation report with:
1. T+0 to T+${scenario.recovery_min}: Event timeline
2. Critical decision points and automation responses
3. SAIDI/SAIFI impact and regulatory compliance (ENTSO-E)
4. Residual risks requiring operator intervention
5. Lessons learned to improve the plan

Keep it precise and technically relevant for a grid operator.`,
    });
    setResults(prev => ({ ...prev, [scenario.id]: result }));
    setSimulating(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-bold">Resilience & Islanding AI</h2>
          <p className="text-slate-500 text-xs">Simulate fault scenarios and generate AI reconfiguration plans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSimulate={handleSimulate}
            simulating={simulating === scenario.id}
            result={results[scenario.id]}
          />
        ))}
      </div>
    </div>
  );
}