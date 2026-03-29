import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Loader2, Zap, TrendingDown, Activity, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from "recharts";

const ENERGY_SYSTEMS = [
  { id: "hvac", label: "HVAC", icon: "🌡️", base_kwh: 1200, saveable_pct: 18, color: "#06b6d4" },
  { id: "lighting", label: "Belysning", icon: "💡", base_kwh: 480, saveable_pct: 25, color: "#f59e0b" },
  { id: "baggage", label: "Båndsystem", icon: "🎠", base_kwh: 320, saveable_pct: 12, color: "#8b5cf6" },
  { id: "escalators", label: "Rulletrapper", icon: "⬆️", base_kwh: 210, saveable_pct: 20, color: "#10b981" },
  { id: "apron", label: "Forpladsudrstr.", icon: "⚙️", base_kwh: 890, saveable_pct: 8, color: "#f97316" },
  { id: "groundvehicles", label: "Groundkøretøjer", icon: "🚐", base_kwh: 640, saveable_pct: 30, color: "#ec4899" },
];

const IMP_COLOR = { immediate: "#10b981", "1week": "#f59e0b", "1month": "#64748b" };
const TREND_COLOR = { improving: "#10b981", stable: "#06b6d4", worsening: "#f43f5e" };

export default function AirportSustainability({ flights, tasks }) {
  const [aiPlan, setAiPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalKwh = ENERGY_SYSTEMS.reduce((s, e) => s + e.base_kwh, 0);
  const totalSaveable = ENERGY_SYSTEMS.reduce((s, e) => s + Math.round(e.base_kwh * e.saveable_pct / 100), 0);
  const totalCO2 = flights.reduce((s, f) => s + (f.co2_kg || 0), 0);
  const fuelUplift = flights.reduce((s, f) => s + (f.fuel_uplift_kg || 0), 0);
  const savingsPct = Math.round(totalSaveable / totalKwh * 100);

  const chartData = ENERGY_SYSTEMS.map(e => ({
    name: e.label,
    current: e.base_kwh,
    optimized: Math.round(e.base_kwh * (1 - e.saveable_pct / 100)),
    saving: Math.round(e.base_kwh * e.saveable_pct / 100),
    color: e.color,
  }));

  const pieData = ENERGY_SYSTEMS.map(e => ({ name: e.label, value: e.base_kwh, color: e.color }));

  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    time: `${String(8 + i).padStart(2, "0")}:00`,
    consumption: Math.round(totalKwh * (0.7 + Math.sin(i * 0.5) * 0.3)),
    target: Math.round(totalKwh * 0.82),
  }));

  const runAIOptimize = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Sustainability AI. Analyze and optimize energy use.

Current state:
- Terminal energy: ${totalKwh} kWh/h across 6 systems
- Potential savings: ${totalSaveable} kWh/h (${savingsPct}%)
- Active flights: ${flights.length} | Flight CO₂ today: ${totalCO2} kg
- Fuel uplift total: ${fuelUplift.toLocaleString()} kg
- Active ground tasks: ${tasks.filter(t => t.status !== "completed").length}

Systems: ${ENERGY_SYSTEMS.map(e => `${e.label}: ${e.base_kwh}kWh, ${e.saveable_pct}% saveable`).join(", ")}

Return JSON:
- headline_action: string
- actions: array of 5 {system, action, saving_kwh, co2_kg_saved, implementation: "immediate"|"1week"|"1month"}
- total_co2_saved_today: number
- total_kwh_saved: number
- green_score: number 0-100
- trend: "improving"|"stable"|"worsening"
- carbon_offset_trees: number (equivalent trees planted)`,
        response_json_schema: {
          type: "object",
          properties: {
            headline_action: { type: "string" },
            actions: { type: "array", items: { type: "object", properties: { system: { type: "string" }, action: { type: "string" }, saving_kwh: { type: "number" }, co2_kg_saved: { type: "number" }, implementation: { type: "string" } } } },
            total_co2_saved_today: { type: "number" },
            total_kwh_saved: { type: "number" },
            green_score: { type: "number" },
            trend: { type: "string" },
            carbon_offset_trees: { type: "number" }
          }
        }
      });
      setAiPlan(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Forbrug/t", val: `${totalKwh.toLocaleString()} kWh`, color: "#f59e0b", sub: "terminal total" },
          { label: "Besparelsespotentiale", val: `${totalSaveable.toLocaleString()} kWh`, color: "#10b981", sub: `${savingsPct}% reduktion` },
          { label: "Fly CO₂ i dag", val: `${(totalCO2 / 1000).toFixed(1)} t`, color: "#f43f5e", sub: `${flights.length} fly` },
          { label: "Fuel Uplift", val: `${(fuelUplift / 1000).toFixed(1)} t`, color: "#f97316", sub: "total tankload" },
          { label: "Green Score", val: aiPlan ? `${aiPlan.green_score}/100` : "—", color: "#10b981", sub: aiPlan?.trend || "klik optimize" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.val}</p>
            <p className="text-[8px] mt-0.5" style={{ color: `${k.color}55` }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Energy comparison bar chart */}
        <div className="col-span-2 rounded-2xl p-4" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.95)" }}>
          <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 mb-3">ENERGI PR SYSTEM — NUVÆRENDE vs OPTIMERET (kWh/t)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10, color: "#e2e8f0" }} />
              <Bar dataKey="current" name="Nuværende" radius={[3,3,0,0]}>
                {chartData.map((d, i) => <Cell key={i} fill={`${d.color}60`} />)}
              </Bar>
              <Bar dataKey="optimized" name="Optimeret" radius={[3,3,0,0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution pie */}
        <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(0,8,20,0.95)" }}>
          <p className="text-[9px] font-black tracking-widest uppercase text-cyan-400 mb-3">FORDELING</p>
          <div className="flex flex-col items-center gap-1">
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1">
              {ENERGY_SYSTEMS.map(e => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: e.color }} />
                  <span className="text-[8px] text-slate-400 flex-1">{e.label}</span>
                  <span className="text-[8px] font-black" style={{ color: e.color }}>{e.base_kwh}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly consumption trend */}
      <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(0,8,20,0.95)" }}>
        <p className="text-[9px] font-black tracking-widest uppercase text-amber-400 mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />TIMELIGT FORBRUG vs MÅL (kWh/t)
        </p>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10, color: "#e2e8f0" }} />
            <Area type="monotone" dataKey="consumption" stroke="#f59e0b" fill="url(#consGrad)" strokeWidth={2} name="Forbrug" />
            <Area type="monotone" dataKey="target" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4,4" name="Mål" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Optimizer */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.25)", background: "rgba(0,8,20,0.97)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50" style={{ background: "rgba(16,185,129,0.05)" }}>
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-400">AI SUSTAINABILITY OPTIMIZER</p>
          </div>
          <button onClick={runAIOptimize} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(16,185,129,0.15)", border: "1.5px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyserer...</> : <><Zap className="w-3.5 h-3.5" />Optimer Nu</>}
          </button>
        </div>

        <div className="p-4">
          {aiPlan ? (
            <div className="space-y-4">
              {/* Headline */}
              <div className="px-4 py-3 rounded-2xl flex items-center justify-between"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <p className="text-[10px] text-emerald-300 font-black flex-1">{aiPlan.headline_action}</p>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-center">
                    <p className="text-[7px] text-slate-600 uppercase">Green Score</p>
                    <p className="text-lg font-black text-emerald-400">{aiPlan.green_score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] text-slate-600 uppercase">kWh Sparet</p>
                    <p className="text-lg font-black text-cyan-400">{aiPlan.total_kwh_saved}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] text-slate-600 uppercase">CO₂ Sparet</p>
                    <p className="text-lg font-black text-emerald-400">{aiPlan.total_co2_saved_today}kg</p>
                  </div>
                  {aiPlan.carbon_offset_trees > 0 && (
                    <div className="text-center">
                      <p className="text-[7px] text-slate-600 uppercase">Træer ≈</p>
                      <p className="text-lg font-black text-green-400">🌳 {aiPlan.carbon_offset_trees}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[7px] text-slate-600 uppercase">Trend</p>
                    <p className="text-sm font-black uppercase" style={{ color: TREND_COLOR[aiPlan.trend] || "#64748b" }}>{aiPlan.trend}</p>
                  </div>
                </div>
              </div>

              {/* Action list */}
              <div className="space-y-2">
                {(aiPlan.actions || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(0,12,28,0.8)", border: "1px solid rgba(30,41,59,0.6)" }}>
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: IMP_COLOR[a.implementation] || "#64748b" }} />
                    <span className="text-slate-400 font-black w-24 flex-shrink-0 text-[9px]">{a.system}</span>
                    <span className="text-slate-300 flex-1">{a.action}</span>
                    <span className="text-amber-400 font-black w-20 text-right flex-shrink-0">−{a.saving_kwh} kWh</span>
                    <span className="text-emerald-400 font-black w-20 text-right flex-shrink-0">−{a.co2_kg_saved} kg</span>
                    <span className="px-2 py-0.5 rounded-lg text-[8px] font-black w-20 text-center flex-shrink-0"
                      style={{ background: `${IMP_COLOR[a.implementation] || "#64748b"}15`, color: IMP_COLOR[a.implementation] || "#64748b", border: `1px solid ${IMP_COLOR[a.implementation] || "#64748b"}25` }}>
                      {a.implementation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 text-center py-6">Klik "Optimer Nu" for AI-drevne energibesparelsesanbefalinger baseret på live drift.</p>
          )}
        </div>
      </div>
    </div>
  );
}