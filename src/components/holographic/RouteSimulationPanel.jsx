import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, RotateCcw, Fuel, Wind, CloudRain, Thermometer, TrendingDown,
  TrendingUp, AlertTriangle, CheckCircle, Route, Zap, Leaf, Clock,
  ChevronDown, ChevronUp, RefreshCw, Navigation
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Deterministic helpers based on route/weather data ──────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function simulateWeather(lat, lng) {
  // Deterministic pseudo-weather based on coordinates + hour
  const hour = new Date().getHours();
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233 + hour * 0.5) * 43758.5453);
  const frac = seed - Math.floor(seed);
  const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Strong Wind', 'Fog'];
  const condition = conditions[Math.floor(frac * conditions.length)];
  const windSpeed = 5 + Math.floor(frac * 60); // km/h
  const temp = Math.round(-5 + frac * 40); // °C
  const rainProb = condition.includes('Rain') ? 60 + Math.floor(frac * 35) : Math.floor(frac * 30);
  return { condition, windSpeed, temp, rainProb };
}

function weatherMultiplier(weather) {
  let m = 1.0;
  if (weather.condition === 'Light Rain') m += 0.12;
  if (weather.condition === 'Fog') m += 0.08;
  if (weather.condition === 'Strong Wind') m += 0.15;
  if (weather.windSpeed > 50) m += 0.1;
  if (weather.temp < 0) m += 0.07;
  if (weather.temp > 35) m += 0.05;
  return m;
}

function simulateTraffic(lat, lng, distanceKm) {
  const hour = new Date().getHours();
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  const seed = Math.abs(Math.sin(lat * 17.1 + lng * 3.14 + hour) * 9999.1);
  const congestion = isPeak ? 0.4 + (seed % 0.4) : 0.05 + (seed % 0.25);
  return { congestion: Math.min(congestion, 0.8), isPeak, label: congestion > 0.5 ? 'Heavy' : congestion > 0.25 ? 'Moderate' : 'Light' };
}

// ─── CO2 factors by transport type (g CO2/ton-km) ───────────────────────────
const CO2_FACTOR = { truck: 62, ship: 8, aircraft: 500, train: 22, drone: 150 };
const FUEL_LPH   = { truck: 35, ship: 1800, aircraft: 3500, train: 200, drone: 4 }; // L/hour

function calcMetrics(route, weatherData, trafficData) {
  const waypoints = (route.waypoints || []).filter(w => w.lat && w.lng);
  let totalKm = route.distance_km || 0;

  if (!totalKm && waypoints.length >= 2) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalKm += haversineKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
    }
  }

  const type = route.transport_type || 'truck';
  const avgSpeedBase = { truck: 80, ship: 35, aircraft: 800, train: 120, drone: 60 }[type] || 80;
  const wMult = weatherData ? weatherMultiplier(weatherData) : 1.0;
  const tDelay = trafficData ? trafficData.congestion : 0;
  const effectiveSpeed = avgSpeedBase * (1 - tDelay * 0.4);
  const durationH = totalKm / effectiveSpeed;

  const fuelLph = FUEL_LPH[type] || 35;
  const baseFuel = fuelLph * durationH * wMult;
  const co2Factor = CO2_FACTOR[type] || 62;
  // Assume avg cargo 20 tons
  const co2Kg = (co2Factor * totalKm * 20) / 1000 * wMult;

  return {
    distanceKm: Math.round(totalKm),
    durationH: parseFloat(durationH.toFixed(1)),
    fuelL: Math.round(baseFuel),
    co2Kg: Math.round(co2Kg),
    efficiency: Math.round(100 - tDelay * 60 - (wMult - 1) * 80),
  };
}

// ─── Alternative routes generator ─────────────────────────────────────────
function generateAlternatives(route, baseMetrics) {
  return [
    {
      label: 'Eco',
      description: 'Avoids high-traffic corridors, maintains steady speed',
      fuelSavingPct: 8,
      co2SavingPct: 8,
      extraTimeH: 0.5,
      risk: 'low',
      color: '#10b981',
    },
    {
      label: 'Fast',
      description: 'Priority motorways, minimised travel time',
      fuelSavingPct: -5,
      co2SavingPct: -5,
      extraTimeH: -0.8,
      risk: 'medium',
      color: '#06b6d4',
    },
    {
      label: 'Green',
      description: 'Maximises CO₂ reduction, reduced speed',
      fuelSavingPct: 18,
      co2SavingPct: 20,
      extraTimeH: 1.2,
      risk: 'low',
      color: '#84cc16',
    },
  ].map((alt) => ({
    ...alt,
    fuelL: Math.round(baseMetrics.fuelL * (1 - alt.fuelSavingPct / 100)),
    co2Kg: Math.round(baseMetrics.co2Kg * (1 - alt.co2SavingPct / 100)),
    durationH: parseFloat((baseMetrics.durationH + alt.extraTimeH).toFixed(1)),
  }));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function WeatherBadge({ weather }) {
  const icons = {
    'Clear': '☀️', 'Partly Cloudy': '⛅', 'Overcast': '☁️',
    'Light Rain': '🌧️', 'Strong Wind': '💨', 'Fog': '🌫️',
  };
  const colors = {
    'Clear': 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    'Partly Cloudy': 'text-sky-300 border-sky-400/30 bg-sky-400/10',
    'Overcast': 'text-slate-400 border-slate-400/30 bg-slate-400/10',
    'Light Rain': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    'Strong Wind': 'text-violet-400 border-violet-400/30 bg-violet-400/10',
    'Fog': 'text-slate-300 border-slate-300/30 bg-slate-300/10',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${colors[weather.condition] || 'text-slate-300 border-slate-400/30'}`}>
      {icons[weather.condition] || '🌡️'} {weather.condition}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color, delta }) {
  return (
    <div className={`relative p-3 rounded-lg border bg-slate-900/50 border-${color}-400/20 overflow-hidden`}>
      <motion.div
        className={`absolute inset-0 bg-${color}-500/5`}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative flex items-start gap-2">
        <Icon className={`w-4 h-4 text-${color}-400 mt-0.5 flex-shrink-0`} />
        <div className="min-w-0">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-lg font-black text-${color}-300`}>{value}<span className="text-[10px] text-slate-400 ml-1">{unit}</span></p>
          {delta !== undefined && (
            <p className={`text-[9px] font-semibold ${delta < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta < 0 ? '↓' : '↑'} {Math.abs(delta)}% vs base
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AlternativeRouteCard({ alt, onSelect, isSelected }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect(alt)}
      className={`cursor-pointer p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
          : 'bg-slate-900/40 border-slate-700/30 hover:border-slate-500/50'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: alt.color }} />
          <span className="text-xs font-bold text-white">{alt.label}</span>
          {isSelected && <CheckCircle className="w-3 h-3 text-cyan-400" />}
        </div>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
          alt.risk === 'low' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
        }`}>
          {alt.risk === 'low' ? '✓ Low risk' : '⚡ Medium risk'}
        </span>
      </div>
      <p className="text-[9px] text-slate-400 mb-2">{alt.description}</p>
      <div className="grid grid-cols-3 gap-1">
        <div className="text-center">
          <p className="text-[8px] text-slate-500">Fuel</p>
          <p className="text-[10px] font-bold text-amber-300">{alt.fuelL} L</p>
          <p className={`text-[8px] ${alt.fuelSavingPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {alt.fuelSavingPct > 0 ? '-' : '+'}{Math.abs(alt.fuelSavingPct)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] text-slate-500">CO₂</p>
          <p className="text-[10px] font-bold text-emerald-300">{alt.co2Kg}kg</p>
          <p className={`text-[8px] ${alt.co2SavingPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {alt.co2SavingPct > 0 ? '-' : '+'}{Math.abs(alt.co2SavingPct)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] text-slate-500">Time</p>
          <p className="text-[10px] font-bold text-cyan-300">{alt.durationH}h</p>
          <p className={`text-[8px] ${alt.extraTimeH < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {alt.extraTimeH < 0 ? `${Math.abs(alt.extraTimeH)}h faster` : `+${alt.extraTimeH}h`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function RouteSimulationPanel({ route, onClose }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [weather, setWeather] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const midpoint = (() => {
    const wp = (route?.waypoints || []).filter(w => w.lat && w.lng);
    if (wp.length >= 2) return wp[Math.floor(wp.length / 2)];
    return { lat: 51.5, lng: 0 };
  })();

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    setSimDone(false);
    setProgress(0);
    setSelectedAlt(null);
    setAiInsight('');

    // Animated progress
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18;
      if (p >= 100) { p = 100; clearInterval(tick); }
      setProgress(Math.round(p));
    }, 120);

    // Compute locally
    const w = simulateWeather(midpoint.lat, midpoint.lng);
    const t = simulateTraffic(midpoint.lat, midpoint.lng, route?.distance_km || 500);
    await new Promise(r => setTimeout(r, 1400)); // UX delay

    const m = calcMetrics(route, w, t);
    const alts = generateAlternatives(route, m);

    setWeather(w);
    setTraffic(t);
    setMetrics(m);
    setAlternatives(alts);
    setIsSimulating(false);
    setSimDone(true);

    // AI insight
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Route simulation results for "${route?.name || 'route'}":
- Distance: ${m.distanceKm} km | Type: ${route?.transport_type || 'truck'}
- Duration: ${m.durationH}h | Fuel: ${m.fuelL}L | CO₂: ${m.co2Kg}kg
- Weather: ${w.condition}, Wind: ${w.windSpeed}km/h, Temp: ${w.temp}°C
- Traffic: ${t.label} (congestion ${Math.round(t.congestion * 100)}%)
Give a 2-sentence expert logistics recommendation to reduce fuel and CO₂. Be concise and specific.`,
        response_json_schema: {
          type: 'object',
          properties: { recommendation: { type: 'string' } }
        }
      });
      setAiInsight(res?.recommendation || '');
    } catch {
      setAiInsight('Consider scheduling this route during off-peak hours to reduce congestion impact and fuel consumption.');
    }
    setAiLoading(false);
  }, [route, midpoint]);

  if (!route) return null;

  const displayMetrics = selectedAlt
    ? { fuelL: selectedAlt.fuelL, co2Kg: selectedAlt.co2Kg, durationH: selectedAlt.durationH, distanceKm: metrics?.distanceKm }
    : metrics;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 right-4 z-50 w-[340px] max-h-[95vh] flex flex-col"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Glow */}
      <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-emerald-500/20 rounded-2xl blur-xl pointer-events-none" />

      <div className="relative flex flex-col bg-slate-950/97 border border-cyan-400/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] max-h-[95vh]">
        {/* Scan line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/6 to-transparent pointer-events-none"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Navigation className="w-3 h-3 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider uppercase">Route Simulation</h3>
              <p className="text-[9px] text-cyan-300 font-mono truncate max-w-[180px]">{route.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(c => !c)} className="p-1.5 hover:bg-white/10 rounded text-slate-400">
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
            <div className="p-4 space-y-4">

              {/* Route meta */}
              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                <span className="text-emerald-400">{route.origin}</span>
                <span className="flex-1 border-t border-dashed border-slate-600" />
                <span className="text-cyan-400">{route.destination}</span>
              </div>

              {/* Simulate button */}
              {!simDone && !isSimulating && (
                <button
                  onClick={runSimulation}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all"
                >
                  <Play className="w-4 h-4" /> Run Simulation
                </button>
              )}

              {/* Progress */}
              <AnimatePresence>
                {isSimulating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
                        <span>Computing…</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      {['🌦️ Loading weather data…', '🚦 Analysing traffic patterns…', '⚡ Calculating fuel consumption…', '🌿 Estimating CO₂ impact…'][Math.floor(progress / 26)] && (
                        <p className="text-[9px] text-slate-400 font-mono animate-pulse">
                          {['🌦️ Loading weather data…', '🚦 Analysing traffic patterns…', '⚡ Calculating fuel consumption…', '🌿 Estimating CO₂ impact…'][Math.floor(progress / 26)]}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence>
                {simDone && metrics && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                    {/* Weather + Traffic */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {weather && <WeatherBadge weather={weather} />}
                      {traffic && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                          traffic.label === 'Heavy' ? 'text-red-400 border-red-400/30 bg-red-400/10'
                          : traffic.label === 'Moderate' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                          : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                        }`}>
                          🚦 {traffic.label} traffic {traffic.isPeak ? '(peak)' : ''}
                        </span>
                      )}
                    </div>

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <MetricCard icon={Fuel} label="Fuel" value={displayMetrics.fuelL} unit="L" color="amber"
                        delta={selectedAlt ? -selectedAlt.fuelSavingPct : undefined} />
                      <MetricCard icon={Leaf} label="CO₂" value={displayMetrics.co2Kg} unit="kg" color="emerald"
                        delta={selectedAlt ? -selectedAlt.co2SavingPct : undefined} />
                      <MetricCard icon={Clock} label="Est. Duration" value={displayMetrics.durationH} unit="h" color="cyan" />
                      <MetricCard icon={Route} label="Distance" value={displayMetrics.distanceKm} unit="km" color="violet" />
                    </div>

                    {/* Weather detail */}
                    {weather && (
                      <div className="grid grid-cols-3 gap-1.5 p-3 rounded-xl border border-slate-700/40 bg-slate-900/30">
                        <div className="text-center">
                          <Wind className="w-3 h-3 text-violet-400 mx-auto mb-0.5" />
                          <p className="text-[8px] text-slate-500">Wind</p>
                          <p className="text-[10px] text-white font-bold">{weather.windSpeed} km/h</p>
                        </div>
                        <div className="text-center">
                          <Thermometer className="w-3 h-3 text-red-400 mx-auto mb-0.5" />
                          <p className="text-[8px] text-slate-500">Temp.</p>
                          <p className="text-[10px] text-white font-bold">{weather.temp}°C</p>
                        </div>
                        <div className="text-center">
                          <CloudRain className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
                          <p className="text-[8px] text-slate-500">Precip.</p>
                          <p className="text-[10px] text-white font-bold">{weather.rainProb}%</p>
                        </div>
                      </div>
                    )}

                    {/* Efficiency bar */}
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                        <span className="font-mono uppercase">Overall Efficiency</span>
                        <span className={`font-black ${metrics.efficiency >= 70 ? 'text-emerald-400' : metrics.efficiency >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {metrics.efficiency}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.efficiency}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${metrics.efficiency >= 70 ? 'bg-emerald-400' : metrics.efficiency >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        />
                      </div>
                    </div>

                    {/* Alternative routes */}
                    <div>
                      <p className="text-[9px] font-black text-violet-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Alternatives
                      </p>
                      <div className="space-y-2">
                        {alternatives.map((alt) => (
                          <AlternativeRouteCard
                            key={alt.label}
                            alt={alt}
                            onSelect={setSelectedAlt}
                            isSelected={selectedAlt?.label === alt.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* AI Insight */}
                    <div className="p-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5">
                      <p className="text-[9px] font-black text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Recommendation
                      </p>
                      {aiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
                          <p className="text-[9px] text-slate-400 italic">Analysing…</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-200 leading-relaxed">{aiInsight}</p>
                      )}
                    </div>

                    {/* Re-run */}
                    <button
                      onClick={runSimulation}
                      className="w-full py-2 rounded-lg border border-slate-700/40 text-slate-400 text-[9px] font-mono uppercase flex items-center justify-center gap-1.5 hover:border-cyan-400/30 hover:text-cyan-400 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-simulate
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}