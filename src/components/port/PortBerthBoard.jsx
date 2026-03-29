import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Anchor, Cpu, Clock, Ship, Zap } from "lucide-react";

const STATUS_COLORS = {
  available: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b",
  reserved: "#8b5cf6", planned: "#8b5cf6", approaching: "#f59e0b",
  berthed: "#06b6d4", operations: "#00ff88", completed: "#334455",
  cancelled: "#f43f5e", delayed: "#f43f5e",
};

export default function PortBerthBoard({ berths, portCalls, vessels, cranes, onSelectPortCall }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  const getVessel = (vesselId) => vessels.find(v => v.id === vesselId);
  const getBerthCalls = (berthId) => portCalls.filter(pc => pc.berth_id === berthId && ["berthed", "operations", "approaching"].includes(pc.status));
  const getBerthCranes = (berthId) => cranes.filter(c => c.berth_id === berthId);

  const runAIBerthPlan = async () => {
    setAiLoading(true);
    const prompt = `You are a port operations AI. Analyze the following data and create an optimal berth allocation plan.
    
Kajer: ${JSON.stringify(berths.map(b => ({ name: b.name, length: b.length_m, draft: b.max_draft_m, status: b.status })))}
Kommende anløb: ${JSON.stringify(portCalls.filter(p => p.status === "planned").slice(0, 10).map(p => {
  const v = getVessel(p.vessel_id);
  return { eta: p.eta, vessel: v?.name, type: v?.type, length: v?.length_m, draft: v?.max_draft_m, moves: p.total_moves };
}))}

Provide 3 concrete recommendations for berth allocation. Answer with precise recommendations in JSON format:
{ "recommendations": [{ "vessel": "navn", "berth": "kaj", "reason": "begrundelse", "savings": "besparelse" }], "summary": "overordnet vurdering" }`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: { type: "array", items: { type: "object", properties: { vessel: { type: "string" }, berth: { type: "string" }, reason: { type: "string" }, savings: { type: "string" } } } },
          summary: { type: "string" }
        }
      }
    });
    setAiPlan(res);
    setAiLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#06b6d4" }}>BERTH PLAN — OVERVIEW</h2>
        <button
          onClick={runAIBerthPlan}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-all"
          style={{ border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}
        >
          <Cpu className="w-3 h-3" />
          {aiLoading ? "ANALYZING..." : "AI BERTH PLAN"}
        </button>
      </div>

      {/* Berth Timeline Grid */}
      <div className="space-y-2">
        {berths.length === 0 && (
          <div className="text-center py-16 rounded-xl" style={{ border: "1px solid rgba(6,182,212,0.1)", color: "rgba(100,116,139,0.5)" }}>
            <Anchor className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs tracking-widest uppercase">No berths configured</p>
            <p className="text-[10px] mt-1 opacity-60">Add berths to see berth plan</p>
          </div>
        )}
        {berths.map(berth => {
          const berthCalls = getBerthCalls(berth.id);
          const berthCranesList = getBerthCranes(berth.id);
          const currentCall = berthCalls[0];
          const vessel = currentCall ? getVessel(currentCall.vessel_id) : null;

          return (
            <div
              key={berth.id}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{
                border: `1px solid ${STATUS_COLORS[berth.status] || "#334455"}33`,
                background: `${STATUS_COLORS[berth.status] || "#334455"}08`,
              }}
              onClick={() => currentCall && onSelectPortCall(currentCall)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[berth.status] || "#334455", boxShadow: `0 0 6px ${STATUS_COLORS[berth.status] || "#334455"}` }} />
                  <div>
                    <p className="text-sm font-bold tracking-wider" style={{ color: STATUS_COLORS[berth.status] || "#94a3b8" }}>{berth.name}</p>
                    <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(100,116,139,0.5)" }}>
                      {berth.terminal} · {berth.length_m}m · {berth.max_draft_m}m draft · {berthCranesList.length} cranes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {berthCranesList.map(crane => (
                    <div key={crane.id} className="text-center">
                      <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(100,116,139,0.4)" }}>{crane.name}</p>
                      <p className="text-[9px] font-bold" style={{ color: crane.status === "working" ? "#10b981" : "#f59e0b" }}>
                        {crane.current_moves_per_hour || 0} mv/h
                      </p>
                    </div>
                  ))}
                  <span className="text-[8px] px-2 py-1 rounded font-bold tracking-widest uppercase"
                    style={{ background: `${STATUS_COLORS[berth.status] || "#334455"}22`, color: STATUS_COLORS[berth.status] || "#94a3b8", border: `1px solid ${STATUS_COLORS[berth.status] || "#334455"}44` }}>
                    {berth.status}
                  </span>
                </div>
              </div>

              {vessel && currentCall && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4" style={{ color: "#06b6d4" }} />
                    <span className="text-xs font-bold" style={{ color: "#06b6d4" }}>{vessel.name}</span>
                    <span className="text-[8px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.5)" }}>{vessel.type} · {vessel.operator}</span>
                  </div>
                  <div className="flex gap-4 ml-auto text-right">
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>MOVES</p>
                      <p className="text-xs font-bold text-white">{currentCall.completed_moves || 0}/{currentCall.total_moves || 0}</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>ETD</p>
                      <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>
                        {currentCall.etd ? new Date(currentCall.etd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "–"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>STATUS</p>
                      <p className="text-[9px] font-bold" style={{ color: STATUS_COLORS[currentCall.status] || "#94a3b8" }}>{currentCall.status?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Plan Output */}
      {aiPlan && (
        <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.04)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#8b5cf6" }}>⬡ AI BERTH PLAN RECOMMENDATION</p>
          <p className="text-xs text-slate-300">{aiPlan.summary}</p>
          <div className="space-y-2">
            {(aiPlan.recommendations || []).map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <span className="text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center" style={{ background: "#8b5cf6", color: "white" }}>{i + 1}</span>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: "#c4b5fd" }}>{rec.vessel} → {rec.berth}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{rec.reason}</p>
                  {rec.savings && <p className="text-[9px] mt-0.5" style={{ color: "#10b981" }}>Savings: {rec.savings}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}