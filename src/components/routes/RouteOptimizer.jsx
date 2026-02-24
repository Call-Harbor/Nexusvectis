import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import {
  Sparkles, Zap, Leaf, DollarSign, Clock, AlertTriangle, CheckCircle,
  ChevronRight, Loader2, Cloud, BarChart3, Info,
  Truck, Gauge, Coffee, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import L from 'leaflet';
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { id: 'fastest', label: 'Fastest', icon: Zap, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/50', text: 'text-amber-400', desc: 'Minimize travel time' },
  { id: 'lowest_cost', label: 'Lowest Cost', icon: DollarSign, color: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', desc: 'Minimize expenses' },
  { id: 'greenest', label: 'Greenest', icon: Leaf, color: 'from-teal-500/20 to-emerald-500/20', border: 'border-teal-500/50', text: 'text-teal-400', desc: 'Lowest CO₂ emissions' },
  { id: 'balanced', label: 'Balanced', icon: Gauge, color: 'from-cyan-500/20 to-violet-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', desc: 'Optimal trade-off' },
];

const ScoreBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={color}>{value}/100</span>
    </div>
    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default function RouteOptimizer({ onApply, onClose }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    transport_type: 'truck',
    optimization_priority: 'balanced',
    vehicle_capacity_tons: 20,
    driver_max_hours: 9,
    co2_target_kg: '',
    cargo_type: 'general',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleOptimize = async () => {
    if (!form.origin || !form.destination) { setError('Please enter origin and destination.'); return; }
    setLoading(true); setError(null); setResult(null);
    const res = await base44.functions.invoke('optimizeRoute', {
      ...form,
      co2_target_kg: form.co2_target_kg ? Number(form.co2_target_kg) : null,
    });
    setLoading(false);
    if (res.data?.success) { setResult(res.data); setActiveTab('overview'); }
    else setError(res.data?.error || 'Optimization failed.');
  };

  const rd = result?.route_data;
  const mapWaypoints = rd?.waypoints?.length > 0 ? rd.waypoints.map(w => [w.lat, w.lng]) : null;
  const mapCenter = mapWaypoints ? mapWaypoints[0] : [55.6761, 12.5683];

  const createWaypointIcon = (index, total) => L.divIcon({
    className: '',
    html: `<div class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white ${index === 0 ? 'bg-emerald-500' : index === total - 1 ? 'bg-rose-500' : 'bg-cyan-500'}">${index + 1}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });

  const tabs = ['overview', 'map', 'alternatives', 'risks'];

  return (
    <div className="flex flex-col h-full">
      {/* Config Panel */}
      <div className="p-5 border-b border-slate-700/50 space-y-5">
        {/* Optimization Priority */}
        <div>
          <Label className="text-slate-300 text-sm mb-2 block">Optimization Priority</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITY_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = form.optimization_priority === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setForm(f => ({ ...f, optimization_priority: opt.id }))}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                    selected ? `bg-gradient-to-br ${opt.color} ${opt.border}` : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  )}
                >
                  <Icon className={cn('w-5 h-5', selected ? opt.text : 'text-slate-500')} />
                  <span className={cn('text-xs font-semibold', selected ? opt.text : 'text-slate-400')}>{opt.label}</span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Origin / Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Origin</Label>
            <Input placeholder="e.g. Copenhagen, Denmark" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Destination</Label>
            <Input placeholder="e.g. Hamburg, Germany" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white" />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Transport</Label>
            <Select value={form.transport_type} onValueChange={v => setForm(f => ({ ...f, transport_type: v }))}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">🚛 Truck</SelectItem>
                <SelectItem value="ship">🚢 Ship</SelectItem>
                <SelectItem value="train">🚂 Train</SelectItem>
                <SelectItem value="aircraft">✈️ Aircraft</SelectItem>
                <SelectItem value="drone">🚁 Drone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Cargo Type</Label>
            <Select value={form.cargo_type} onValueChange={v => setForm(f => ({ ...f, cargo_type: v }))}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="cold_chain">Cold Chain</SelectItem>
                <SelectItem value="hazardous">Hazardous</SelectItem>
                <SelectItem value="fragile">Fragile</SelectItem>
                <SelectItem value="bulk">Bulk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Capacity (tons)</Label>
            <Input type="number" value={form.vehicle_capacity_tons} onChange={e => setForm(f => ({ ...f, vehicle_capacity_tons: Number(e.target.value) }))} className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">CO₂ Target (kg)</Label>
            <Input type="number" placeholder="Optional" value={form.co2_target_kg} onChange={e => setForm(f => ({ ...f, co2_target_kg: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm" />
          </div>
        </div>

        {/* Driver HOS Slider */}
        <div>
          <Label className="text-slate-400 text-xs mb-2 flex justify-between">
            <span>Driver Hours of Service</span>
            <span className="text-cyan-400">{form.driver_max_hours}h/day</span>
          </Label>
          <Slider value={[form.driver_max_hours]} onValueChange={([v]) => setForm(f => ({ ...f, driver_max_hours: v }))} min={4} max={13} step={0.5} className="w-full" />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>4h</span><span className="text-amber-400/70">9h EU legal max</span><span>13h</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <Button onClick={handleOptimize} disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 font-semibold">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing route...</> : <><Sparkles className="w-4 h-4 mr-2" />Optimize Route with AI</>}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {rd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-slate-700/50 px-5 pt-4 gap-1">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-t capitalize transition-all',
                  activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'
                )}>{tab}</button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Distance', value: `${rd.distance_km?.toLocaleString()} km`, icon: MapPin, color: 'text-cyan-400' },
                      { label: 'Duration', value: `${rd.estimated_duration_hours?.toFixed(1)}h`, icon: Clock, color: 'text-amber-400' },
                      { label: 'CO₂', value: `${rd.co2_estimate_kg?.toLocaleString()} kg`, icon: Leaf, color: 'text-teal-400' },
                      { label: 'Total Cost', value: `€${rd.total_cost_eur?.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
                    ].map(m => {
                      const Icon = m.icon;
                      return (
                        <div key={m.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                          <Icon className={`w-4 h-4 ${m.color} mb-1`} />
                          <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-xs text-slate-500">{m.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <p className="text-sm font-semibold text-white mb-3">Cost Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400"><span>Fuel cost</span><span className="text-white">€{rd.fuel_cost_eur?.toLocaleString()}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Tolls & fees</span><span className="text-white">€{rd.toll_cost_eur?.toLocaleString()}</span></div>
                      <div className="flex justify-between font-semibold border-t border-slate-700 pt-2 mt-2">
                        <span className="text-white">Total</span><span className="text-emerald-400">€{rd.total_cost_eur?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  {rd.optimization_score && (
                    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 space-y-2">
                      <p className="text-sm font-semibold text-white mb-3">Optimization Scores</p>
                      <ScoreBar label="Time Efficiency" value={rd.optimization_score.time} color="text-amber-400" />
                      <ScoreBar label="Cost Efficiency" value={rd.optimization_score.cost} color="text-emerald-400" />
                      <ScoreBar label="Green Score" value={rd.optimization_score.co2} color="text-teal-400" />
                      <ScoreBar label="Overall" value={rd.optimization_score.overall} color="text-cyan-400" />
                    </div>
                  )}

                  {/* Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rd.traffic_conditions && (
                      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                        <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />Traffic
                        </p>
                        <Badge className={cn('text-[10px] mb-1',
                          rd.traffic_conditions.level === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                          rd.traffic_conditions.level === 'high' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        )}>{rd.traffic_conditions.level}</Badge>
                        <p className="text-xs text-slate-400">{rd.traffic_conditions.notes}</p>
                      </div>
                    )}
                    {rd.weather_conditions && (
                      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                        <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-cyan-400" />Weather
                        </p>
                        <Badge className={cn('text-[10px] mb-1',
                          rd.weather_conditions.impact === 'none' ? 'bg-emerald-500/20 text-emerald-400' :
                          rd.weather_conditions.impact === 'severe' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        )}>{rd.weather_conditions.impact} impact</Badge>
                        <p className="text-xs text-slate-400">{rd.weather_conditions.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Driver Compliance */}
                  {rd.driver_compliance && (
                    <div className={cn('rounded-xl p-3 border flex items-start gap-2',
                      rd.driver_compliance.compliant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                    )}>
                      {rd.driver_compliance.compliant
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      }
                      <div>
                        <p className="text-xs font-semibold text-white">Driver Hours of Service</p>
                        <p className="text-xs text-slate-400">{rd.driver_compliance.notes}</p>
                        {rd.driver_compliance.required_breaks > 0 && (
                          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                            <Coffee className="w-3 h-3" />{rd.driver_compliance.required_breaks} mandatory break(s) required
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rest Stops */}
                  {rd.rest_stops?.length > 0 && (
                    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-amber-400" />Planned Rest Stops
                      </p>
                      <div className="space-y-2">
                        {rd.rest_stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">After {stop.after_hours}h</span>
                            <span className="font-medium text-white">{stop.name}</span>
                            <span>{stop.duration_minutes} min — {stop.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {rd.ai_recommendations?.length > 0 && (
                    <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-xl p-4 border border-cyan-500/20">
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />AI Recommendations
                      </p>
                      <ul className="space-y-1.5">
                        {rd.ai_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />{rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {onApply && (
                    <Button onClick={() => onApply(rd)} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2" />Apply Optimized Route
                    </Button>
                  )}
                </div>
              )}

              {/* MAP TAB */}
              {activeTab === 'map' && (
                <div className="space-y-3">
                  {mapWaypoints && mapWaypoints.length >= 2 ? (
                    <div className="h-80 rounded-xl overflow-hidden border border-slate-700/50">
                      <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        <Polyline
                          positions={mapWaypoints}
                          color={form.optimization_priority === 'greenest' ? '#14b8a6' : form.optimization_priority === 'fastest' ? '#f59e0b' : form.optimization_priority === 'lowest_cost' ? '#10b981' : '#06b6d4'}
                          weight={4} opacity={0.85}
                        />
                        {rd.waypoints?.map((wp, i) => (
                          <Marker key={i} position={[wp.lat, wp.lng]} icon={createWaypointIcon(i, rd.waypoints.length)}>
                            <Popup><div className="text-sm"><p className="font-bold">{wp.name}</p>{wp.purpose && <p className="text-gray-500">{wp.purpose}</p>}{wp.arrival_offset_hours != null && <p className="text-gray-500">+{wp.arrival_offset_hours}h from start</p>}</div></Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl border border-slate-700/50 flex items-center justify-center text-slate-500 text-sm">Map data not available</div>
                  )}
                  <div className="space-y-2">
                    {rd.waypoints?.map((wp, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                          i === 0 ? 'bg-emerald-500' : i === rd.waypoints.length - 1 ? 'bg-rose-500' : 'bg-cyan-500'
                        )}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{wp.name}</p>
                          {wp.purpose && <p className="text-xs text-slate-400">{wp.purpose}</p>}
                        </div>
                        {wp.arrival_offset_hours != null && <span className="text-xs text-slate-500">+{wp.arrival_offset_hours}h</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ALTERNATIVES TAB */}
              {activeTab === 'alternatives' && (
                <div className="space-y-3">
                  {rd.alternatives?.length > 0 ? rd.alternatives.map((alt, i) => (
                    <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-white">{alt.name}</p>
                        <Badge className="bg-slate-700/50 text-slate-300 text-[10px]">{alt.tradeoff}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{alt.description}</p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><p className="text-slate-500">Distance</p><p className="text-white">{alt.distance_km?.toLocaleString()} km</p></div>
                        <div><p className="text-slate-500">Duration</p><p className="text-white">{alt.duration_hours?.toFixed(1)}h</p></div>
                        <div><p className="text-slate-500">CO₂</p><p className="text-teal-400">{alt.co2_kg?.toLocaleString()} kg</p></div>
                        <div><p className="text-slate-500">Cost</p><p className="text-emerald-400">€{alt.cost_eur?.toLocaleString()}</p></div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-8">No alternative routes generated.</p>
                  )}
                </div>
              )}

              {/* RISKS TAB */}
              {activeTab === 'risks' && (
                <div className="space-y-3">
                  {rd.risks?.length > 0 ? rd.risks.map((risk, i) => {
                    const colors = { low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400', high: 'bg-rose-500/10 border-rose-500/30 text-rose-400' };
                    return (
                      <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border ${colors[risk.severity]}`}>
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold capitalize">{risk.type?.replace(/_/g, ' ')}</p>
                          <p className="text-xs opacity-80">{risk.description}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="text-sm text-emerald-400">No significant risks identified.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}