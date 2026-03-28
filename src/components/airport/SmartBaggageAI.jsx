import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Loader2, AlertCircle, Zap, TrendingUp } from "lucide-react";

const STATUS_COLOR = {
  checked_in: "#64748b", sorting: "#06b6d4", loaded: "#10b981",
  in_transit: "#8b5cf6", at_reclaim: "#f59e0b", collected: "#10b981",
  mishandled: "#f43f5e", delayed: "#f97316"
};

const RISK_COLOR = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

export default function SmartBaggageAI({ bags, flights }) {
  const [dispatch, setDispatch] = useState(null);
  const [loading, setLoading] = useState(false);

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));

  // Compute risk metrics
  const rushBags = bags.filter(b => b.is_rush || (b.connection_time_minutes || 999) < 45);
  const mishandled = bags.filter(b => b.status === "mishandled" || b.status === "delayed");
  const sorting = bags.filter(b => b.status === "sorting" || b.status === "checked_in");
  const loaded = bags.filter(b => b.status === "loaded");

  // Group by flight
  const byFlight = bags.reduce((acc, b) => {
    if (!acc[b.flight_id]) acc[b.flight_id] = [];
    acc[b.flight_id].push(b);
    return acc;
  }, {});

  const runDispatch = async () => {
    setLoading(true);
    setDispatch(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Smart Baggage AI for airport ground operations. Optimize baggage handling using ride-share style dispatch.

Current state:
- Total bags: ${bags.length}
- Rush/tight-connection bags: ${rushBags.length}
- Mishandled: ${mishandled.length}
- In sorting/processing: ${sorting.length}
- Loaded to aircraft: ${loaded.length}
- Active flights with bags: ${Object.keys(byFlight).length}

Top rush bags (connection time < 45 min):
${rushBags.slice(0, 8).map(b => `  Tag ${b.tag_number}: ${b.passenger_name || "PAX"}, flight ${flightMap[b.flight_id]?.flight_number || "?"}, connection ${b.connection_time_minutes || "?"}min, status: ${b.status}`).join("\n")}

Return JSON with:
- overall_risk: "low"|"medium"|"high"|"critical"
- misconnect_probability_pct: number
- dispatch_assignments: array of max 6 {tag_number: string, action: string, driver_suggestion: string, priority: "critical"|"high"|"normal", eta_minutes: number}
- bottlenecks: array of 3 strings (where the system is congested)
- ai_recommendations: array of 4 strings (specific actions to reduce misconnects)
- bags_at_risk: number
- estimated_misconnects_prevented: number`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_risk: { type: "string" },
            misconnect_probability_pct: { type: "number" },
            dispatch_assignments: {
              type: "array", items: {
                type: "object", properties: {
                  tag_number: { type: "string" }, action: { type: "string" },
                  driver_suggestion: { type: "string" }, priority: { type: "string" },
                  eta_minutes: { type: "number" }
                }
              }
            },
            bottlenecks: { type: "array", items: { type: "string" } },
            ai_recommendations: { type: "array", items: { type: "string" } },
            bags_at_risk: { type: "number" },
            estimated_misconnects_prevented: { type: "number" }
          }
        }
      });
      setDispatch(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const prioColor = { critical: "#f43f5e", high: "#f97316", normal: "#10b981" };

  return (
    <div className="space-y-4">
      {/* Header KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Bags", val: bags.length, color: "#64748b" },
          { label: "Rush / Tight", val: rushBags.length, color: rushBags.length > 0 ? "#f97316" : "#10b981" },
          { label: "Mishandled", val: mishandled.length, color: mishandled.length > 0 ? "#f43f5e" : "#10b981" },
          { label: "Processing", val: sorting.length, color: "#06b6d4" },
          { label: "Loaded", val: loaded.length, color: "#10b981" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}30`, background: `${k.color}08` }}>
            <p className="text-[8px] tracking-widest uppercase mb-1" style={{ color: `${k.color}80` }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Status flow */}
      <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400">BAGGAGE PIPELINE STATUS</p>
          <button onClick={runDispatch} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Optimizing...</> : <><Zap className="w-3.5 h-3.5" />AI Dispatch</>}
          </button>
        </div>
        <div className="flex gap-1 items-center">
          {["checked_in", "sorting", "in_transit", "loaded", "at_reclaim", "collected"].map((s, i, arr) => {
            const count = bags.filter(b => b.status === s).length;
            const color = STATUS_COLOR[s];
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className="flex-1 rounded-lg p-2.5 text-center" style={{ border: `1px solid ${color}30`, background: `${color}10` }}>
                  <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: `${color}80` }}>{s.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold" style={{ color }}>{count}</p>
                </div>
                {i < arr.length - 1 && <span className="text-slate-700 text-xs">→</span>}
              </div>
            );
          })}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-slate-700 text-xs mx-1">⚠</span>
            <div className="rounded-lg p-2.5 text-center" style={{ border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.08)" }}>
              <p className="text-[8px] uppercase tracking-widest mb-0.5 text-red-400/60">mishandled</p>
              <p className="text-lg font-bold text-red-400">{mishandled.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rush bags table */}
      {rushBags.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(249,115,22,0.2)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-orange-400 mb-3">
            🚨 RUSH CONNECTIONS — {rushBags.length} bags at risk
          </p>
          <div className="space-y-1.5">
            {rushBags.slice(0, 10).map(b => {
              const flight = flightMap[b.flight_id];
              const connFlight = b.connection_flight_id ? flightMap[b.connection_flight_id] : null;
              const mins = b.connection_time_minutes || 0;
              const risk = mins < 20 ? "critical" : mins < 30 ? "high" : "medium";
              return (
                <div key={b.id} className="flex items-center gap-3 text-[10px] px-3 py-2 rounded-lg"
                  style={{ background: `${RISK_COLOR[risk]}08`, border: `1px solid ${RISK_COLOR[risk]}25` }}>
                  <span className="font-bold font-mono text-slate-300">#{b.tag_number}</span>
                  <span className="text-slate-400 truncate flex-1">{b.passenger_name || "—"}</span>
                  <span className="text-cyan-400">{flight?.flight_number || "?"}</span>
                  {connFlight && <><span className="text-slate-600">→</span><span className="text-violet-400">{connFlight.flight_number}</span></>}
                  <span className="font-bold" style={{ color: RISK_COLOR[risk] }}>{mins}m</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: `${RISK_COLOR[risk]}20`, color: RISK_COLOR[risk] }}>{risk}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase" style={{ background: `${STATUS_COLOR[b.status] || "#64748b"}20`, color: STATUS_COLOR[b.status] || "#64748b" }}>{b.status?.replace(/_/g, " ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Dispatch result */}
      {dispatch && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ border: `1px solid ${RISK_COLOR[dispatch.overall_risk] || "#64748b"}30`, background: `${RISK_COLOR[dispatch.overall_risk] || "#64748b"}08` }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Mis-connect Risk</p>
              <p className="text-2xl font-bold" style={{ color: RISK_COLOR[dispatch.overall_risk] }}>{dispatch.misconnect_probability_pct}%</p>
              <p className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: RISK_COLOR[dispatch.overall_risk] }}>{dispatch.overall_risk}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Bags at Risk</p>
              <p className="text-2xl font-bold text-red-400">{dispatch.bags_at_risk}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest text-slate-500">Misconnects Prevented</p>
              <p className="text-2xl font-bold text-emerald-400">{dispatch.estimated_misconnects_prevented}</p>
            </div>
          </div>

          {/* Dispatch assignments */}
          {dispatch.dispatch_assignments?.length > 0 && (
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-violet-400 mb-3">🚐 RIDE-SHARE DISPATCH PLAN</p>
              <div className="space-y-2">
                {dispatch.dispatch_assignments.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <span className="px-1.5 py-0.5 rounded font-bold text-[8px] uppercase flex-shrink-0"
                      style={{ background: `${prioColor[a.priority] || "#64748b"}20`, color: prioColor[a.priority] || "#64748b" }}>
                      {a.priority}
                    </span>
                    <span className="font-mono text-slate-300 flex-shrink-0">#{a.tag_number}</span>
                    <span className="text-slate-300 flex-1">{a.action}</span>
                    <span className="text-cyan-400 flex-shrink-0">{a.driver_suggestion}</span>
                    <span className="text-emerald-400 font-bold flex-shrink-0">ETA {a.eta_minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Bottlenecks */}
            <div className="rounded-xl p-3" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-red-400 mb-2">BOTTLENECKS</p>
              {(dispatch.bottlenecks || []).map((b, i) => (
                <p key={i} className="text-[10px] text-slate-300 mb-1 flex items-start gap-1.5"><AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />{b}</p>
              ))}
            </div>
            {/* Recommendations */}
            <div className="rounded-xl p-3" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 mb-2">AI RECOMMENDATIONS</p>
              {(dispatch.ai_recommendations || []).map((r, i) => (
                <p key={i} className="text-[10px] text-slate-300 mb-1 flex items-start gap-1.5"><TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />{r}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-flight baggage summary */}
      <div className="rounded-xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(0,10,25,0.5)" }}>
        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-3">PER-FLIGHT BAGGAGE OVERVIEW</p>
        <div className="space-y-1.5">
          {Object.entries(byFlight).slice(0, 12).map(([fid, fbags]) => {
            const flight = flightMap[fid];
            const rushCount = fbags.filter(b => b.is_rush || (b.connection_time_minutes || 999) < 45).length;
            const mishandledCount = fbags.filter(b => b.status === "mishandled").length;
            const loadedCount = fbags.filter(b => b.status === "loaded").length;
            return (
              <div key={fid} className="flex items-center gap-3 text-[10px] px-3 py-1.5 rounded-lg"
                style={{ background: mishandledCount > 0 ? "rgba(244,63,94,0.06)" : "rgba(15,23,42,0.4)", border: mishandledCount > 0 ? "1px solid rgba(244,63,94,0.2)" : "1px solid rgba(30,41,59,0.5)" }}>
                <span className="font-bold text-violet-400 w-16 flex-shrink-0">{flight?.flight_number || "?"}</span>
                <span className="text-slate-500 flex-1">{flight?.destination || "—"}</span>
                <span className="text-slate-400">{fbags.length} bags</span>
                {rushCount > 0 && <span className="text-orange-400 font-bold">{rushCount} rush</span>}
                {mishandledCount > 0 && <span className="text-red-400 font-bold">{mishandledCount} mishandled</span>}
                <span className="text-emerald-400">{loadedCount} loaded</span>
              </div>
            );
          })}
          {Object.keys(byFlight).length === 0 && <p className="text-slate-600 text-xs text-center py-3">No baggage records found</p>}
        </div>
      </div>
    </div>
  );
}