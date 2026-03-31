import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Calendar, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Zap, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import moment from "moment";

const PLANNED_OUTAGES = [
  {
    id: "o1",
    asset: "132kV Line Rødby-CPH",
    type: "Planned inspection & cable replacement (section 4)",
    window_start: "2026-04-14T22:00",
    window_end: "2026-04-15T06:00",
    duration_h: 8,
    risk: "high",
    constraint: "Max load on parallel route rises to 89% during outage",
    pre_actions: ["Activate Gas Power Plant Avedøre to 60%", "Reduce Shore Power Pier 7 to 50%", "Notify Transit: no fast-charging 22:00–06:00"],
    status: "approved",
  },
  {
    id: "o2",
    asset: "Substation Nordhavn",
    type: "Preventive insulation measurement and oil sample",
    window_start: "2026-04-22T01:00",
    window_end: "2026-04-22T05:00",
    duration_h: 4,
    risk: "medium",
    constraint: "Nordhavn distribution rerouted to 60kV ring — capacity OK",
    pre_actions: ["Switch to 60kV ring network (automatic)", "Notify Port Command: maintenance 01:00–05:00"],
    status: "approved",
  },
  {
    id: "o3",
    asset: "Battery Storage Kastrup",
    type: "BMS software update v4.2 and cell balancing",
    window_start: "2026-05-03T10:00",
    window_end: "2026-05-03T16:00",
    duration_h: 6,
    risk: "low",
    constraint: "No battery capacity reserve during period — recommend low grid load",
    pre_actions: ["Increase Wind Farm Øresund priority to max", "AI dispatch avoids gas-standby changes"],
    status: "pending",
  },
  {
    id: "o4",
    asset: "PtX Electrolysis Esbjerg",
    type: "Major service: stack replacement blocks 2-4",
    window_start: "2026-06-01T00:00",
    window_end: "2026-06-08T23:59",
    duration_h: 168,
    risk: "medium",
    constraint: "100 MW flexible load temporarily offline — but reduces load during summer period",
    pre_actions: ["Notify ESG reporting: PtX pause week 23", "Plan H2 storage fill before service"],
    status: "draft",
  },
];

const RISK_CONFIG = {
  high: { label: "High risk", color: "red" },
  medium: { label: "Medium risk", color: "amber" },
  low: { label: "Low risk", color: "emerald" },
};

const STATUS_CONFIG = {
  approved: { label: "Approved", color: "emerald", icon: CheckCircle2 },
  pending: { label: "Pending", color: "amber", icon: Clock },
  draft: { label: "Draft", color: "slate", icon: Wrench },
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
              <span className="text-slate-400 text-[10px]">Outage window</span>
            </div>
            <p className="text-white text-xs font-medium">{moment(outage.window_start).format("DD/MM HH:mm")}</p>
            <p className="text-slate-500 text-[10px]">→ {moment(outage.window_end).format("DD/MM HH:mm")} ({outage.duration_h}h)</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400 text-[10px]">Grid constraint</span>
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
          {analyzing ? "AI analyzing..." : "AI Outage Impact Analysis"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 bg-amber-500/5 border border-amber-500/25 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-[10px] font-semibold">AI IMPACT ANALYSIS</span>
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
      prompt: `You are NexusVectis Outage Planning AI. Analyze this planned maintenance outage:

ASSET: ${outage.asset}
TYPE: ${outage.type}
WINDOW: ${outage.window_start} → ${outage.window_end} (${outage.duration_h}h)
RISK: ${outage.risk}
GRID CONSTRAINT: ${outage.constraint}
PLANNED PRE-ACTIONS: ${outage.pre_actions.join(", ")}

Generate a concrete outage plan with:
1. Optimal timing recommendation (is the chosen window optimal? When is load lowest?)
2. Impact analysis for Port/Airport/Transit modules
3. Redundancy verification: Is there sufficient capacity on parallel routes?
4. What-if: What if the outage takes twice as long?
5. ENTSO-E N-1 criterion: Is the grid compliant during the outage?
6. Stakeholder communication plan

Be specific with numbers and time recommendations.`,
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
          <p className="text-slate-500 text-xs">Plan outages with minimal risk and customer impact — AI N-1 verification</p>
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