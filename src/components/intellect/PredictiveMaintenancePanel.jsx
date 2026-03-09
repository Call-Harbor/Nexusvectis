import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, CheckCircle, Clock, DollarSign, Zap, TrendingDown,
  ChevronDown, ChevronUp, Brain, Wrench, Activity, Shield, BarChart3,
  Truck, Battery, Gauge, Flame, Cpu, Wind
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COMPONENT_ICONS = {
  "Engine": Flame,
  "Brakes": Shield,
  "Transmission": Zap,
  "Tires": Gauge,
  "Fuel System": Battery,
  "Electrical & Sensors": Cpu,
  "Cooling System": Wind,
  "Exhaust & Emissions": Activity,
};

const URGENCY_STYLES = {
  critical: { badge: "bg-red-500/20 text-red-400 border-red-500/40", bar: "#ef4444", glow: "shadow-red-500/20" },
  high:     { badge: "bg-orange-500/20 text-orange-400 border-orange-500/40", bar: "#f97316", glow: "shadow-orange-500/20" },
  medium:   { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", bar: "#eab308", glow: "" },
  low:      { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", bar: "#22c55e", glow: "" },
};

function ComponentGrid({ components }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {components.map(comp => {
        const Icon = COMPONENT_ICONS[comp.name] || Wrench;
        const style = URGENCY_STYLES[comp.urgency];
        return (
          <div key={comp.name} className={`p-2 rounded-lg border text-center ${style.badge}`} style={{ background: 'rgba(15,23,42,0.5)' }}>
            <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
            <p className="text-[10px] font-bold leading-tight">{comp.name}</p>
            <p className="text-base font-bold mt-0.5">{comp.risk}%</p>
            <p className="text-[9px] opacity-70 mt-0.5">Fail ~{comp.estimated_failure_days}d</p>
          </div>
        );
      })}
    </div>
  );
}

function VehicleCard({ vehicle, index }) {
  const [expanded, setExpanded] = useState(false);
  const style = URGENCY_STYLES[vehicle.urgency];
  const chartData = vehicle.components.filter(c => c.risk > 0).map(c => ({ name: c.name.split(' ')[0], risk: c.risk }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border overflow-hidden shadow-lg ${style.glow}`}
      style={{ background: 'rgba(15,23,42,0.8)', borderColor: vehicle.urgency === 'critical' ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.5)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(51,65,85,0.5)' }}>
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            {vehicle.urgency === 'critical' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{vehicle.vehicle_name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <Badge className={`text-[10px] py-0 ${style.badge}`}>{vehicle.urgency.toUpperCase()}</Badge>
              {vehicle.critical_components.length > 0 && (
                <span className="text-[10px] text-red-400">{vehicle.critical_components.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Overall Risk</p>
            <p className="text-xl font-black" style={{ color: URGENCY_STYLES[vehicle.urgency].bar }}>{vehicle.overall_risk}%</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400">Save</p>
            <p className="text-sm font-bold text-emerald-400">€{vehicle.potential_savings_eur.toLocaleString()}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-3">
              {/* Telemetry row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  { label: "Fuel", value: `${vehicle.fuel_level ?? '—'}%`, warn: vehicle.fuel_level < 20 },
                  { label: "Efficiency", value: `${vehicle.efficiency_score ?? '—'}`, warn: vehicle.efficiency_score < 60 },
                  { label: "CO₂", value: `${vehicle.co2_emissions ?? '—'} kg`, warn: vehicle.co2_emissions > 500 },
                  { label: "Days w/o Service", value: vehicle.days_since_service ?? '—', warn: vehicle.days_since_service > 90 },
                ].map(item => (
                  <div key={item.label} className="bg-slate-800/40 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <p className={`font-bold ${item.warn ? 'text-orange-400' : 'text-white'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Component grid */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Component Risk Breakdown</p>

                <ComponentGrid components={vehicle.components} />
              </div>

              {/* Mini bar chart */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Chart</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }} />
                    <Bar dataKey="risk" radius={[3,3,0,0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.risk > 75 ? '#ef4444' : entry.risk > 45 ? '#f97316' : entry.risk > 20 ? '#eab308' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Critical services list */}
              {vehicle.components.filter(c => c.risk > 40).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recommended Services</p>

                  <div className="space-y-1">
                    {vehicle.components.filter(c => c.risk > 40).map(comp => (
                      <div key={comp.name} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-800/30">
                        <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${comp.urgency === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-200">{comp.service}</span>
                          <span className="text-slate-500 ml-2">~{comp.estimated_failure_days}d</span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-emerald-400 font-mono">€{comp.preventive_cost_eur}</p>
                          <p className="text-red-400/60 line-through font-mono text-[10px]">€{comp.reactive_cost_eur}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <p className="text-xs text-emerald-400 font-bold">Preventive Cost</p>

                  <p className="text-lg font-black text-white">€{vehicle.preventive_cost_eur.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">vs. Reactive</p>
                  <p className="text-sm font-bold text-red-400 line-through">€{vehicle.reactive_cost_eur.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 font-bold">Potential Savings</p>
                  <p className="text-lg font-black text-emerald-400">€{vehicle.potential_savings_eur.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PredictiveMaintenancePanel({ orgId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.functions.invoke('predictiveMaintenanceScheduler', { organization_id: orgId })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Brain className="w-10 h-10 text-cyan-400" />
        </motion.div>
        <p className="text-slate-400 font-mono text-sm">AI analyzing vehicle data...</p>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-slate-400">No maintenance data available</div>;

  const { summary, vehicle_analyses, ai_insights, optimized_schedule } = data;

  const filtered = filter === 'all' ? vehicle_analyses : vehicle_analyses.filter(v => v.urgency === filter);

  const FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-5 p-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Fleet Health", value: `${summary.fleet_health_score}%`, icon: Activity, color: summary.fleet_health_score > 70 ? 'text-emerald-400' : 'text-orange-400' },
          { label: "Critical Vehicles", value: summary.critical_vehicles, icon: AlertTriangle, color: 'text-red-400' },
          { label: "Potential Savings", value: `€${(summary.total_potential_savings_eur || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: "Downtime Saved", value: `${summary.potential_downtime_avoidance_hours}h`, icon: TrendingDown, color: 'text-cyan-400' },
        ].map(item => (
          <Card key={item.label} className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide">{item.label}</p>
                <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</p>
              </div>
              <item.icon className={`w-7 h-7 opacity-40 ${item.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* AI Insights box */}
      {ai_insights && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border"
          style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-violet-300">AI Fleet Intelligence</span>

            <Badge className="ml-auto bg-violet-500/20 text-violet-400 border-violet-500/40 text-[10px]">MISTRAL AI</Badge>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">{ai_insights.ai_summary}</p>
          {ai_insights.key_findings?.length > 0 && (
            <ul className="space-y-1">
              {ai_insights.key_findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          {ai_insights.highest_risk_component_fleet_wide && (
            <div className="mt-3 pt-3 border-t border-violet-500/20 flex items-center gap-2 text-xs text-slate-400">
              <Wrench className="w-3 h-3 text-orange-400" />
              <span>Highest fleet-wide risk: <strong className="text-orange-400">{ai_insights.highest_risk_component_fleet_wide}</strong></span>
            </div>
          )}
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-500 border border-slate-700/50 hover:text-slate-300'
            }`}
          >
            {f === 'all' ? `All (${vehicle_analyses.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${vehicle_analyses.filter(v => v.urgency === f).length})`}
          </button>
        ))}
      </div>

      {/* Vehicle list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No vehicles in this category</p>
        ) : (
          filtered.map((v, i) => <VehicleCard key={v.vehicle_id} vehicle={v} index={i} />)
        )}
      </div>

      {/* Optimized schedule */}
      {optimized_schedule?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Optimized Service Schedule (High Risk)
          </h3>
          <div className="grid gap-2">
            {optimized_schedule.map((item, idx) => (
              <div key={item.vehicle_id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-cyan-400 text-sm">{item.vehicle_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.services?.slice(0, 2).join(' · ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-300">{item.suggested_schedule_date}</p>
                  <p className="text-xs text-emerald-400 font-mono">€{item.cost_eur?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}