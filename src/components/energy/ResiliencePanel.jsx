import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, AlertTriangle, RefreshCw, Sparkles, GitBranch, Activity, Wind, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCENARIOS = [
  {
    id: "line_fault",
    title: "132kV Linjefejl Rødby-CPH",
    icon: Zap,
    color: "red",
    trigger: "Lynnedslag / kabelfejl på 132kV-forbindelsen",
    impact: "371 MW afbrudt transmission — 4 transformerstationer påvirket",
    affected: ["Transformerstation Nordhavn", "Shore Power Pier 7", "Terminal 2 HVAC"],
    reconfiguration: [
      "Automatisk omkobling via 60kV ring-net (45 sek)",
      "Batterilager Kastrup dækker 38 MW gap øjeblikkeligt",
      "Vindpark Øresund øger output +15 MW via rampe",
      "Shore Power Pier 7 reduceres til 50% (service-kritisk minimum)",
    ],
    load_shed_mw: 42,
    recovery_min: 12,
    saidi_impact: 0.8,
  },
  {
    id: "heatwave",
    title: "Varmebølge + Spidslast",
    icon: Activity,
    color: "amber",
    trigger: "+8°C over norm i 3 dage — kølebehov eksploderer",
    impact: "Forventet lastspids på 940 MW — 15% over kapacitet",
    affected: ["Alle load-noder", "132kV Linje Rødby-CPH (>98%)", "PtX stopper"],
    reconfiguration: [
      "Gaskraftværk Avedøre aktiveres til 100% (500 MW)",
      "Flex-anmodning til Airport: −8 MW HVAC i 4 timer",
      "Flex-anmodning til Transit: udskyd lade-cyklus til nat",
      "Nødaftale: import fra Sverige via Storebælt (max 200 MW)",
    ],
    load_shed_mw: 0,
    recovery_min: 0,
    saidi_impact: 0.0,
  },
  {
    id: "storm",
    title: "Stormfront — Multifejl",
    icon: Wind,
    color: "violet",
    trigger: "Vindstød >35 m/s — 3 linjer nede simultant",
    impact: "Østjylland og Bornholm i ørislands-tilstand (islanding)",
    affected: ["3 x 132kV-linjer", "2 transformerstationer offline", "Vindpark Øresund nedlukket (fejlsikring)"],
    reconfiguration: [
      "Ørislands-drift aktiveret for Bornholm: lokal PtX + diesel backup",
      "Automatisk load shedding: industri-klynger (50 MW) prioriteres ned",
      "Krise-kobling til Sydnorge via HVDC (Skagerrak) anmodes",
      "Alle fleksible noder sænkes til 20% ikke-kritisk forbrug",
    ],
    load_shed_mw: 120,
    recovery_min: 45,
    saidi_impact: 3.2,
  },
  {
    id: "flood",
    title: "Oversvømmelse — Nordhavn Station",
    icon: Waves,
    color: "blue",
    trigger: "Havvandsstigning 1.8m — Nordhavn transformer kritisk",
    impact: "121 MW nord-CPH risikerer total blackout inden 2 timer",
    affected: ["Transformerstation Nordhavn", "Shore Power Pier 7", "Havne-kraner"],
    reconfiguration: [
      "Planlagt ordnet nedlukning af Nordhavn station (forebygger eksplosion)",
      "Rerouting via Valby-stationen (60kV, 80% kapacitet)",
      "Port Command: alle kraner og shore power nedlukket ordnet",
      "Havneoperationer overgår til dieselgeneratorer (nødplan A)",
    ],
    load_shed_mw: 80,
    recovery_min: 180,
    saidi_impact: 5.1,
  },
];

function ScenarioCard({ scenario, onSimulate, simulating, result }) {
  const Icon = scenario.icon;
  const colors = { red: "red", amber: "amber", violet: "violet", blue: "blue" };
  const c = colors[scenario.color];

  return (
    <Card className={`bg-slate-900/60 border-slate-800 overflow-hidden`}>
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
          {simulating ? "Simulerer..." : "Kør AI-simulation"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-cyan-500/5 border border-cyan-500/25 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-[10px] font-semibold">SIMULATION RESULTAT</span>
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
      prompt: `Du er NexusVectis Grid Resilience AI. Simuler denne gridhændelse detaljeret:

HÆNDELSE: ${scenario.title}
TRIGGER: ${scenario.trigger}
IMPACT: ${scenario.impact}
BERØRTE ASSETS: ${scenario.affected.join(", ")}
PLANLAGT REKONFIGURATION: ${scenario.reconfiguration.join(" | ")}
KPI: Load shed ${scenario.load_shed_mw} MW, Recovery ${scenario.recovery_min} min, SAIDI ${scenario.saidi_impact} min

Generer en detaljeret trin-for-trin simulationsrapport med:
1. T+0 til T+${scenario.recovery_min}: Tidslinje for hændelsesforløb
2. Kritiske beslutningspunkter og automationssvar
3. SAIDI/SAIFI påvirkning og regulatorisk compliance (ENTSO-E)
4. Restrisici der kræver operatørindgreb
5. Læringspoint til at forbedre planen

Hold det præcist og teknisk relevant for en grid operator.`,
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
          <p className="text-slate-500 text-xs">Simuler fejlscenarier og generer AI-rekonfigurationsplaner</p>
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