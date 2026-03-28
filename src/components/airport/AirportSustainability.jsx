import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Loader2, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const ENERGY_SYSTEMS = [
  { id: "hvac", label: "HVAC / Climate", icon: "🌡️", base_kwh: 1200, saveable_pct: 18 },
  { id: "lighting", label: "Terminal Lighting", icon: "💡", base_kwh: 480, saveable_pct: 25 },
  { id: "baggage", label: "Baggage Conveyors", icon: "🎠", base_kwh: 320, saveable_pct: 12 },
  { id: "escalators", label: "Escalators/Travelators", icon: "⬆️", base_kwh: 210, saveable_pct: 20 },
  { id: "apron", label: "Apron Equipment", icon: "⚙️", base_kwh: 890, saveable_pct: 8 },
  { id: "groundvehicles", label: "Ground Vehicles", icon: "🚐", base_kwh: 640, saveable_pct: 30 },
];

export default function AirportSustainability({ flights, tasks }) {
  const [aiPlan, setAiPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalKwh = ENERGY_SYSTEMS.reduce((s, e) => s + e.base_kwh, 0);
  const totalSaveable = ENERGY_SYSTEMS.reduce((s, e) => s + Math.round(e.base_kwh * e.saveable_pct / 100), 0);
  const totalCO2 = flights.reduce((s, f) => s + (f.co2_kg || 0), 0);
  const fuelUplift = flights.reduce((s, f) => s + (f.fuel_uplift_kg || 0), 0);

  const chartData = ENERGY_SYSTEMS.map(e => ({
    name: e.label.split(" ")[0],
    current: e.base_kwh,
    potential: Math.round(e.base_kwh * (1 - e.saveable_pct / 100))
  }));

  const pieData = ENERGY_SYSTEMS.map(e => ({ name: e.label, value: e.base_kwh }));
  const COLORS = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#f97316", "#ec4899"];

  const runAIOptimize = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Airport Sustainability AI. Analyze energy and CO₂ data.

Current state:
- Terminal energy consumption: ${totalKwh} kWh/h
- Potential savings: ${totalSaveable} kWh/h (${Math.round(totalSaveable / totalKwh * 100)}%)
- Active flights: ${flights.length}
- Fuel uplift total: ${fuelUplift.toLocaleString()} kg
- Ground tasks active: ${tasks.filter(t => t.status !== "completed").length}

Provide JSON:
- headline_action: string (top single action right now)
- actions: array of 5 {system: string, action: string, saving_kwh: number, co2_kg_saved: number, implementation: "immediate"|"1week"|"1month"}
- total_co2_saved_today: number
- total_kwh_saved: number
- green_score: number (0-100)
- trend: "improving"|"stable"|"worsening"`,
        response_json_schema: {
          type: "object",
          properties: {
            headline_action: { type: "string" },
            actions: { type: "array", items: { type: "object", properties: { system: { type: "string" }, action: { type: "string" }, saving_kwh: { type: "number" }, co2_kg_saved: { type: "number" }, implementation: { type: "string" } } } },
            total_co2_saved_today: { type: "number" },
            total_kwh_saved: { type: "number" },
            green_score: { type: "number" },
            trend: { type: "string" }
          }
        }
      });
      setAiPlan(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const impColor = { immediate: "#10b981", "1week": "#f59e0b", "1month": "#64748b" };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Terminal Energy/h", val: `${totalKwh.toLocaleString()} kWh`, color: "#f59e0b" },
          { label: "Potential Savings", val: `${totalSaveable.toLocaleString()} kWh`, color: "#10b981" },
          { label: "Savings %", val: `${Math.round(totalSaveable / totalKwh * 100)}%`, color: "#06b6d4" },
          { label: "Flight CO₂ Today", val: `${(totalCO2 / 1000).toFixed(1)} t`, color: "#f43f5e" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] tracking-widest uppercase mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 mb-3">ENERGY BY SYSTEM — CURRENT vs OPTIMIZED (kWh/h)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10 }} />
              <Bar dataKey="current" fill="rgba(245,158,11,0.5)" name="Current" radius={[2,2,0,0]} />
              <Bar dataKey="potential" fill="rgba(16,185,129,0.5)" name="Optimized" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(0,10,25,0.6)" }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 mb-3">ENERGY DISTRIBUTION</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={30}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {ENERGY_SYSTEMS.map((e, i) => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] text-slate-400">{e.label}</span>
                  <span className="text-[9px] font-bold ml-auto" style={{ color: COLORS[i % COLORS.length] }}>{e.base_kwh}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimizer */}
      <div className="rounded-xl p-4" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,10,25,0.6)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">AI SUSTAINABILITY OPTIMIZER</p>
          </div>
          <button onClick={runAIOptimize} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing...</> : <><Zap className="w-3.5 h-3.5" />Optimize Now</>}
          </button>
        </div>

        {aiPlan ? (
          <div className="space-y-3">
            <div className="px-4 py-3 rounded-lg flex items-center justify-between"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <p className="text-[10px] text-emerald-300 font-semibold">{aiPlan.headline_action}</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[8px] text-slate-500">Green Score</p>
                  <p className="font-bold text-emerald-400">{aiPlan.green_score}/100</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-slate-500">kWh Saved</p>
                  <p className="font-bold text-cyan-400">{aiPlan.total_kwh_saved}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-slate-500">CO₂ Saved</p>
                  <p className="font-bold text-emerald-400">{aiPlan.total_co2_saved_today} kg</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {(aiPlan.actions || []).map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] px-3 py-2 rounded-lg"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)" }}>
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">{a.system}</span>
                  <span className="text-slate-300 flex-1">{a.action}</span>
                  <span className="text-yellow-400 font-bold w-16 text-right">−{a.saving_kwh} kWh</span>
                  <span className="text-emerald-400 font-bold w-16 text-right">−{a.co2_kg_saved} kg</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold w-16 text-center"
                    style={{ background: `${impColor[a.implementation] || "#64748b"}20`, color: impColor[a.implementation] || "#64748b" }}>
                    {a.implementation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 text-center py-4">Run the AI optimizer to get personalized energy-saving recommendations based on live operations.</p>
        )}
      </div>
    </div>
  );
}