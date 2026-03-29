import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, Loader2, AlertCircle, Zap, Clock, Activity } from "lucide-react";
import SecurityPeakTimeline from "./SecurityPeakTimeline";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";
import moment from "moment";

const CHECKPOINTS = [
  { id: "checkin", label: "Check-in", icon: "🧳", color: "#8b5cf6" },
  { id: "security", label: "Security", icon: "🔍", color: "#06b6d4" },
  { id: "passport", label: "Passport", icon: "🛂", color: "#f59e0b" },
  { id: "boarding", label: "Boarding", icon: "✈️", color: "#10b981" },
  { id: "reclaim", label: "Reclaim", icon: "🎁", color: "#f97316" },
];

const RISK_COLOR = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

export default function PassengerFlowAI({ flights, securityLanes, staff }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(30);

  const totalPaxNext2h = useMemo(() => flights
    .filter(f => {
      const dep = f.scheduled_departure || f.scheduled_time;
      if (!dep) return false;
      const diff = (new Date(dep) - new Date()) / 60000;
      return diff >= -30 && diff <= 120;
    })
    .reduce((s, f) => s + (f.pax_total || 0), 0), [flights]);

  const avgWait = useMemo(() => securityLanes.length > 0
    ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
    : 0, [securityLanes]);

  const openLanes = securityLanes.filter(l => l.status === "open").length;
  const staffOnDuty = staff.filter(s => s.status === "on_duty" || s.status === "assigned").length;
  const boardingNow = flights.filter(f => f.status === "boarding").length;

  const checkpointData = CHECKPOINTS.map(cp => {
    const wait = cp.id === "security" ? avgWait : cp.id === "boarding" ? boardingNow * 2 : Math.round(Math.random() * 8 + 2);
    const risk = wait > 20 ? "critical" : wait > 15 ? "high" : wait > 8 ? "medium" : "low";
    return { ...cp, wait, risk, queue: Math.round(wait * 12) };
  });

  const runPrediction = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Passenger Flow AI. Predict queue status for the next ${horizon} minutes.

Current state:
- Flights in next 2h: ~${totalPaxNext2h} PAX total
- Security lanes open: ${openLanes} / ${securityLanes.length}
- Avg security wait: ${avgWait} min
- Staff on duty: ${staffOnDuty}
- Flights boarding now: ${boardingNow}

Security lanes detail:
${securityLanes.map(l => `  ${l.name}: ${l.wait_minutes || 0}min, ${l.queue_length || 0} pax, ${l.status}`).join("\n") || "  none"}

Return JSON with:
- checkpoints: array of {id, label, current_wait_min, predicted_wait_min, queue_now, queue_predicted, risk, recommendation}
- overall_risk: "low"|"medium"|"high"|"critical"
- key_bottleneck: string
- staff_reallocation: string
- peak_time_label: string (when is peak expected, e.g. "In 20 minutes")
- pax_flow_forecast: array of 8 objects {time_label: string, pax_per_minute: number, risk_level: string}`,
        response_json_schema: {
          type: "object",
          properties: {
            checkpoints: { type: "array", items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, current_wait_min: { type: "number" }, predicted_wait_min: { type: "number" }, queue_now: { type: "number" }, queue_predicted: { type: "number" }, risk: { type: "string" }, recommendation: { type: "string" } } } },
            overall_risk: { type: "string" },
            key_bottleneck: { type: "string" },
            staff_reallocation: { type: "string" },
            peak_time_label: { type: "string" },
            pax_flow_forecast: { type: "array", items: { type: "object", properties: { time_label: { type: "string" }, pax_per_minute: { type: "number" }, risk_level: { type: "string" } } } }
          }
        }
      });
      setPrediction(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <SecurityPeakTimeline flights={flights} securityLanes={securityLanes} />

      {/* Control header */}
      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{ border: "1px solid rgba(6,182,212,0.25)", background: "rgba(0,8,20,0.95)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-400">PASSENGER FLOW & QUEUE AI</h2>
            <p className="text-[9px] text-slate-500">{totalPaxNext2h.toLocaleString()} PAX næste 2t · {openLanes} baner åbne · {staffOnDuty} personale på vagt</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">Horisont</span>
            {[15, 30, 60].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className="px-2.5 py-1 rounded-lg text-[9px] font-black transition-all"
                style={{ background: horizon === h ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.6)", border: `1px solid ${horizon === h ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.8)"}`, color: horizon === h ? "#06b6d4" : "#475569" }}>
                +{h}m
              </button>
            ))}
          </div>
          <button onClick={runPrediction} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(6,182,212,0.15)", border: "1.5px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Forudsiger...</> : <><TrendingUp className="w-3.5 h-3.5" />Kør AI Forudsigelse</>}
          </button>
        </div>
      </div>

      {/* Live checkpoint cards */}
      <div className="grid grid-cols-5 gap-3">
        {checkpointData.map(cp => (
          <div key={cp.id} className="rounded-2xl p-3 text-center"
            style={{ border: `1px solid ${RISK_COLOR[cp.risk]}30`, background: `${RISK_COLOR[cp.risk]}07` }}>
            <div className="relative inline-block mb-1">
              <span className="text-2xl">{cp.icon}</span>
              {cp.risk === "critical" && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-slate-900" />
              )}
            </div>
            <p className="text-[9px] font-black text-white">{cp.label}</p>
            <p className="text-2xl font-black mt-1 leading-none" style={{ color: RISK_COLOR[cp.risk] }}>{cp.wait}m</p>
            <p className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: `${RISK_COLOR[cp.risk]}80` }}>{cp.risk}</p>
            <div className="h-1 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, cp.wait * 3)}%`, background: RISK_COLOR[cp.risk] }} />
            </div>
            <p className="text-[7px] text-slate-600 mt-1">{cp.queue} i kø</p>
          </div>
        ))}
      </div>

      {prediction && (
        <>
          {/* Overall status banner */}
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${RISK_COLOR[prediction.overall_risk] || "#64748b"}09`, border: `1.5px solid ${RISK_COLOR[prediction.overall_risk] || "#64748b"}30` }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: RISK_COLOR[prediction.overall_risk] }} />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: RISK_COLOR[prediction.overall_risk] }}>
                {prediction.overall_risk?.toUpperCase()} RISIKO — Flaskehals: {prediction.key_bottleneck}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{prediction.staff_reallocation}</p>
            </div>
            {prediction.peak_time_label && (
              <div className="text-right flex-shrink-0">
                <p className="text-[8px] text-slate-600 uppercase">Peak forventet</p>
                <p className="text-sm font-black text-amber-400">{prediction.peak_time_label}</p>
              </div>
            )}
          </div>

          {/* Checkpoint predictions grid */}
          <div className="grid grid-cols-5 gap-3">
            {(prediction.checkpoints || []).map(cp => {
              const color = RISK_COLOR[cp.risk] || "#64748b";
              const delta = cp.predicted_wait_min - cp.current_wait_min;
              return (
                <div key={cp.id} className="rounded-2xl p-3"
                  style={{ border: `1px solid ${color}25`, background: "rgba(0,8,20,0.8)" }}>
                  <p className="text-[9px] font-black text-white mb-2">{cp.label}</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] text-slate-600">Nu</span>
                    <span className="text-sm font-black text-slate-300">{cp.current_wait_min}m</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] text-slate-600">+{horizon}m</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black" style={{ color }}>{cp.predicted_wait_min}m</span>
                      {delta !== 0 && (
                        <span className="text-[8px] font-black" style={{ color: delta > 0 ? "#f43f5e" : "#10b981" }}>
                          {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-tight">{cp.recommendation}</p>
                </div>
              );
            })}
          </div>

          {/* Flow forecast chart */}
          {prediction.pax_flow_forecast?.length > 0 && (
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,8,20,0.9)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-[9px] font-black tracking-widest uppercase text-cyan-400">PAX/MIN STRØM FORECAST</p>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={prediction.pax_flow_forecast}>
                  <defs>
                    <linearGradient id="paxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time_label" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 10 }} />
                  <Area type="monotone" dataKey="pax_per_minute" stroke="#06b6d4" fill="url(#paxGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}