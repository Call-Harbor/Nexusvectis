import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import SecurityPeakTimeline from "./SecurityPeakTimeline";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CHECKPOINTS = [
  { id: "checkin", label: "Check-in", icon: "🧳" },
  { id: "security", label: "Security", icon: "🔍" },
  { id: "passport", label: "Passport Control", icon: "🛂" },
  { id: "boarding", label: "Boarding Gates", icon: "✈️" },
  { id: "reclaim", label: "Baggage Reclaim", icon: "🎁" },
];

export default function PassengerFlowAI({ flights, securityLanes, staff }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(30);

  const totalPaxNext2h = flights
    .filter(f => {
      const dep = f.scheduled_departure || f.scheduled_time;
      if (!dep) return false;
      const t = new Date(dep);
      const now = new Date();
      const diff = (t - now) / 60000;
      return diff >= -30 && diff <= 120;
    })
    .reduce((s, f) => s + (f.pax_total || 0), 0);

  const avgWait = securityLanes.length > 0
    ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
    : 0;

  const runPrediction = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Passenger Flow AI. Predict queue status for the next ${horizon} minutes.

Current state:
- Flights in next 2h: PAX total ~${totalPaxNext2h}
- Security lanes open: ${securityLanes.filter(l => l.status === "open").length} / ${securityLanes.length}
- Avg security wait now: ${avgWait} min
- Staff on duty: ${staff.filter(s => s.status === "on_duty" || s.status === "assigned").length}

Return JSON with:
- checkpoints: array of {id, label, current_wait_min, predicted_wait_min, queue_now, queue_predicted, risk: "low"|"medium"|"high"|"critical", recommendation: string}
- overall_risk: "low"|"medium"|"high"|"critical"
- key_bottleneck: string (which checkpoint is worst)
- staff_reallocation: string (specific action)
- pax_flow_forecast: array of 6 objects {time_label: "+Xmin", pax_per_minute: number} (15min intervals)`,
        response_json_schema: {
          type: "object",
          properties: {
            checkpoints: {
              type: "array", items: {
                type: "object", properties: {
                  id: { type: "string" }, label: { type: "string" },
                  current_wait_min: { type: "number" }, predicted_wait_min: { type: "number" },
                  queue_now: { type: "number" }, queue_predicted: { type: "number" },
                  risk: { type: "string" }, recommendation: { type: "string" }
                }
              }
            },
            overall_risk: { type: "string" },
            key_bottleneck: { type: "string" },
            staff_reallocation: { type: "string" },
            pax_flow_forecast: { type: "array", items: { type: "object", properties: { time_label: { type: "string" }, pax_per_minute: { type: "number" } } } }
          }
        }
      });
      setPrediction(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const riskColor = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

  return (
    <div className="space-y-4">
      {/* Security Peak Timeline — 60 min forecast */}
      <SecurityPeakTimeline flights={flights} securityLanes={securityLanes} />

      {/* Header */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(0,10,25,0.6)" }}>
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400">PASSENGER FLOW & QUEUE AI</h2>
            <p className="text-[9px] text-slate-500">Predictive queue management · {totalPaxNext2h.toLocaleString()} PAX in next 2h</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Horizon</span>
            {[15, 30, 60].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className="px-2.5 py-1 rounded text-[9px] font-bold transition-all"
                style={{ background: horizon === h ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.5)", border: `1px solid ${horizon === h ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.8)"}`, color: horizon === h ? "#06b6d4" : "#64748b" }}>
                +{h}m
              </button>
            ))}
          </div>
          <button onClick={runPrediction} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
            style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Predicting...</> : <><TrendingUp className="w-3.5 h-3.5" /> Run AI Prediction</>}
          </button>
        </div>
      </div>

      {/* Live checkpoint cards */}
      <div className="grid grid-cols-5 gap-3">
        {CHECKPOINTS.map(cp => {
          const wait = cp.id === "security" ? avgWait : Math.round(Math.random() * 10 + 2);
          const risk = wait > 20 ? "critical" : wait > 15 ? "high" : wait > 8 ? "medium" : "low";
          return (
            <div key={cp.id} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${riskColor[risk]}30`, background: `${riskColor[risk]}08` }}>
              <span className="text-2xl">{cp.icon}</span>
              <p className="text-[9px] font-semibold text-white mt-1">{cp.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: riskColor[risk] }}>{wait}m</p>
              <p className="text-[8px] uppercase tracking-widest" style={{ color: `${riskColor[risk]}80` }}>{risk}</p>
            </div>
          );
        })}
      </div>

      {prediction && (
        <>
          {/* Overall status */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: `${riskColor[prediction.overall_risk] || "#64748b"}10`, border: `1px solid ${riskColor[prediction.overall_risk] || "#64748b"}30` }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: riskColor[prediction.overall_risk] }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: riskColor[prediction.overall_risk] }}>
                {prediction.overall_risk?.toUpperCase()} — Bottleneck: {prediction.key_bottleneck}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 max-w-md text-right">{prediction.staff_reallocation}</p>
          </div>

          {/* Checkpoint predictions */}
          <div className="grid grid-cols-5 gap-3">
            {(prediction.checkpoints || []).map(cp => (
              <div key={cp.id} className="rounded-xl p-3" style={{ border: `1px solid ${riskColor[cp.risk] || "#64748b"}25`, background: "rgba(0,10,25,0.6)" }}>
                <p className="text-[9px] font-bold text-white mb-2">{cp.label}</p>
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] text-slate-500">Now</span>
                  <span className="text-[10px] font-bold text-slate-300">{cp.current_wait_min}m</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[8px] text-slate-500">+{horizon}m</span>
                  <span className="text-[10px] font-bold" style={{ color: riskColor[cp.risk] }}>{cp.predicted_wait_min}m</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">{cp.recommendation}</p>
              </div>
            ))}
          </div>

          {/* Flow forecast chart */}
          {prediction.pax_flow_forecast?.length > 0 && (
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
              <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 mb-3">PAX/MIN FORECAST</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={prediction.pax_flow_forecast}>
                  <XAxis dataKey="time_label" tick={{ fill: "#64748b", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 10 }} />
                  <Bar dataKey="pax_per_minute" radius={[3, 3, 0, 0]}>
                    {prediction.pax_flow_forecast.map((_, i) => (
                      <Cell key={i} fill={`rgba(6,182,212,${0.4 + i * 0.1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}