import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Calendar, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment";

const PLANNED_OUTAGES = [
  {
    id: "o1",
    asset: "132kV Linje Rødby-CPH",
    type: "Planlagt inspektion & kabeludskiftning (sektion 4)",
    window_start: "2026-04-14T22:00",
    window_end: "2026-04-15T06:00",
    duration_h: 8,
    risk: "high",
    constraint: "Maks last på parallelruten stiger til 89% under udtag",
    pre_actions: ["Aktiver Gaskraftværk Avedøre til 60%", "Reducer Shore Power Pier 7 til 50%", "Varsle Transit: ingen hurtiglading 22-06"],
    status: "approved",
  },
  {
    id: "o2",
    asset: "Transformerstation Nordhavn",
    type: "Forebyggende isolationsmåling og olieprøve",
    window_start: "2026-04-22T01:00",
    window_end: "2026-04-22T05:00",
    duration_h: 4,
    risk: "medium",
    constraint: "Nordhavn-distributionen omlagres til 60kV ring — kapacitet OK",
    pre_actions: ["Kobl om til 60kV ring-net (automatisk)", "Notificer Port Command: vedligehold 01-05"],
    status: "approved",
  },
  {
    id: "o3",
    asset: "Batterilager Kastrup",
    type: "BMS software-opdatering v4.2 og cellebalancering",
    window_start: "2026-05-03T10:00",
    window_end: "2026-05-03T16:00",
    duration_h: 6,
    risk: "low",
    constraint: "Ingen kapacitetsreserve fra batteri i perioden — anbefal lav netbelastning",
    pre_actions: ["Øg Vindpark Øresund prioritet til max", "AI dispatch undgår gas-standby ændringer"],
    status: "pending",
  },
  {
    id: "o4",
    asset: "PtX Elektrolyse Esbjerg",
    type: "Større service: stack-udskiftning blok 2-4",
    window_start: "2026-06-01T00:00",
    window_end: "2026-06-08T23:59",
    duration_h: 168,
    risk: "medium",
    constraint: "100 MW fleksibelt forbrug midlertidigt ude — men reducerer last i sommerperiode",
    pre_actions: ["Informer ESG-rapportering: PtX pause uge 23", "Planlæg H2-lagerfylding inden service"],
    status: "draft",
  },
];

const RISK_CONFIG = {
  high: { label: "Høj risiko", color: "red" },
  medium: { label: "Medium risiko", color: "amber" },
  low: { label: "Lav risiko", color: "emerald" },
};

const STATUS_CONFIG = {
  approved: { label: "Godkendt", color: "emerald", icon: CheckCircle2 },
  pending: { label: "Afventer", color: "amber", icon: Clock },
  draft: { label: "Udkast", color: "slate", icon: Wrench },
};

function OutageCard({ outage, onAnalyze, analyzing, result }) {
  const risk = RISK_CONFIG[outage.risk];
  const status = STATUS_CONFIG[outage.status];
  const StatusIcon = status.icon;

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Zap className={`w-4 h-4 text-${risk.color}-400 flex-shrink-0`} />
              <span className="text-white font-semibold text-sm">{outage.asset}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold bg-${risk.color}-500/15 text-${risk.color}-300`}>{risk.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold bg-${status.color}-500/15 text-${status.color}-300 flex items-center gap-1`}>
                <StatusIcon className="w-2.5 h-2.5" />{status.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{outage.type}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400 text-[10px]">Udtag-vindue</span>
            </div>
            <p className="text-white text-xs font-medium">{moment(outage.window_start).format("DD/MM HH:mm")}</p>
            <p className="text-slate-500 text-[10px]">→ {moment(outage.window_end).format("DD/MM HH:mm")} ({outage.duration_h}h)</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400 text-[10px]">Grid-constraint</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">{outage.constraint}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Pre-actions</p>
          <ul className="space-y-1">
            {outage.pre_actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onAnalyze(outage)}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-amber-700 hover:to-orange-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {analyzing ? "AI analyserer..." : "AI Outage Impact Analyse"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 bg-amber-500/5 border border-amber-500/25 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-[10px] font-semibold">AI IMPACT ANALYSE</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">{result}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function OutagePlanner() {
  const [analyzing, setAnalyzing] = useState(null);
  const [results, setResults] = useState({});

  const handleAnalyze = async (outage) => {
    setAnalyzing(outage.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er NexusVectis Outage Planning AI. Analyser dette planlagte vedligeholdelsesudtag:

ASSET: ${outage.asset}
TYPE: ${outage.type}
VINDUE: ${outage.window_start} → ${outage.window_end} (${outage.duration_h}h)
RISIKO: ${outage.risk}
GRID-CONSTRAINT: ${outage.constraint}
PLANLAGTE PRE-ACTIONS: ${outage.pre_actions.join(", ")}

Generer en konkret outage-plan med:
1. Optimal tidspunkt-anbefaling (er det valgte vindue optimalt? Hvornår er lasten lavest?)
2. Konsekvensanalyse for Port/Airport/Transit-modulerne
3. Redundans-verificering: Er der tilstrækkelig kapacitet på parallelruter?
4. What-if: Hvad hvis udtaget tager dobbelt så lang tid?
5. ENTSO-E N-1 kriterium: Er nettet compliant under udtaget?
6. Kommunikationsplan til stakeholders

Vær specifik med tal og tidsanbefalinger.`,
    });
    setResults(prev => ({ ...prev, [outage.id]: result }));
    setAnalyzing(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-white font-bold">Outage & Maintenance Planner</h2>
          <p className="text-slate-500 text-xs">Planlæg udtag med minimal risiko og kundepåvirkning — AI N-1 verificering</p>
        </div>
      </div>

      <div className="space-y-4">
        {PLANNED_OUTAGES.map(outage => (
          <OutageCard
            key={outage.id}
            outage={outage}
            onAnalyze={handleAnalyze}
            analyzing={analyzing === outage.id}
            result={results[outage.id]}
          />
        ))}
      </div>
    </div>
  );
}