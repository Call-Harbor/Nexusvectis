import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Network, Cpu, Wifi, GitBranch, Dna, Zap, Activity, TrendingUp, CheckCircle, Loader2, RefreshCw, Bug, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Canvas Swarm Viz ─────────────────────────────────────────────────────────
const SwarmVisualization = ({ vehicles, latestCycle }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 300;
    const H = canvas.offsetHeight || 200;
    canvas.width = W;
    canvas.height = H;

    const count = Math.max(vehicles?.length || 0, 6);
    nodesRef.current = Array.from({ length: Math.min(count, 14) }, (_, i) => ({
      id: i,
      x: 60 + Math.random() * (W - 120),
      y: 40 + Math.random() * (H - 80),
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      label: vehicles?.[i]?.name?.slice(0, 8) || `N${i + 1}`,
      type: vehicles?.[i]?.type || 'truck',
      active: vehicles?.[i]?.status === 'active' || Math.random() > 0.3,
      isScout: latestCycle?.scout_agents?.includes(vehicles?.[i]?.name),
      pheromone: Math.random(),
      signaling: false,
      signalTimer: 0,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      if (frame % 45 === 0) {
        const idx = Math.floor(Math.random() * nodesRef.current.length);
        nodesRef.current[idx].signaling = true;
        nodesRef.current[idx].signalTimer = 50;
      }

      const nodes = nodesRef.current;

      // Swarm attraction: nodes gently pull toward centroid
      const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
      const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;

      nodes.forEach(n => {
        n.vx += (cx - n.x) * 0.0003;
        n.vy += (cy - n.y) * 0.0003;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 30 || n.x > W - 30) n.vx *= -1;
        if (n.y < 20 || n.y > H - 20) n.vy *= -1;
        if (n.signalTimer > 0) n.signalTimer--;
        else n.signaling = false;
        n.pheromone = Math.max(0.1, n.pheromone - 0.001);
        if (n.signaling) n.pheromone = Math.min(1, n.pheromone + 0.05);
        n.pulsePhase += 0.04;
      });

      // Connections
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140) {
            const strength = ((a.pheromone + b.pheromone) / 2) * (1 - dist / 140);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(6,182,212,${strength * 0.45})`;
            ctx.lineWidth = strength * 2.5;
            ctx.stroke();
            if ((a.signaling || b.signaling) && dist < 100) {
              const t = (frame % 35) / 35;
              ctx.beginPath();
              ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(16,185,129,0.9)';
              ctx.fill();
            }
          }
        });
      });

      nodes.forEach(n => {
        if (n.signaling) {
          const r = (50 - n.signalTimer) * 1.8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16,185,129,${(n.signalTimer / 50) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Scout: diamond ring
        if (n.isScout) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 13 + Math.sin(n.pulsePhase) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251,191,36,0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 16);
        grad.addColorStop(0, `rgba(16,185,129,${n.pheromone * 0.35})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.isScout ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? (n.isScout ? '#fbbf24' : '#10b981') : '#334155';
        ctx.fill();
        ctx.strokeStyle = n.active ? (n.isScout ? 'rgba(251,191,36,0.7)' : 'rgba(16,185,129,0.7)') : 'rgba(51,65,85,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.75)';
        ctx.font = '7px monospace';
        ctx.fillText(n.label, n.x + 10, n.y + 3);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [vehicles?.length, latestCycle?.cycle_number]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ background: 'transparent' }} />;
};

// ─── Cycle History Row ────────────────────────────────────────────────────────
function CycleRow({ cycle, isLatest }) {
  const delta = cycle.efficiency_gain_percent;
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg text-[10px] ${isLatest ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/30'}`}>
      <span className={`font-mono font-bold ${cycle.algorithm === 'ACO' ? 'text-amber-400' : 'text-cyan-400'}`}>#{cycle.cycle_number}</span>
      <Badge className={`${cycle.algorithm === 'ACO' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'} text-[9px]`}>{cycle.algorithm}</Badge>
      <span className="text-slate-400">Health: <span className="text-white font-bold">{cycle.swarm_health_score}</span></span>
      <span className="text-slate-400 ml-auto flex items-center gap-1">
        {delta > 0 ? <ArrowUp className="w-2.5 h-2.5 text-emerald-400" /> : delta < 0 ? <ArrowDown className="w-2.5 h-2.5 text-red-400" /> : <Minus className="w-2.5 h-2.5" />}
        <span className={delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500'}>{delta > 0 ? '+' : ''}{delta}%</span>
      </span>
      <span className="text-slate-600">{new Date(cycle.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function SwarmIntelligencePanel({ vehicles = [], routes = [], onCommand }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [latestCycle, setLatestCycle] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [ticker, setTicker] = useState([]);

  const loadCycles = async () => {
    try {
      const data = await base44.entities.SwarmCoordination.list('-created_date', 10);
      setCycles(data);
      if (data.length > 0) setLatestCycle(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCycles(false);
    }
  };

  useEffect(() => {
    loadCycles();
    const unsub = base44.entities.SwarmCoordination.subscribe((event) => {
      if (event.type === 'create') {
        setLatestCycle(event.data);
        setCycles(prev => [event.data, ...prev.slice(0, 9)]);
        const msg = `Cycle #${event.data.cycle_number} — ${event.data.algorithm} · Health ${event.data.swarm_health_score} · +${event.data.efficiency_gain_percent}% efficiency`;
        setTicker(prev => [msg, ...prev.slice(0, 4)]);
      }
    });
    return unsub;
  }, []);

  const runSwarmAnalysis = async () => {
    setIsAnalyzing(true);
    const res = await base44.functions.invoke('swarmCoordinationEngine', {});
    toast.success(`Swarm cycle complete — health ${res.data?.results?.[0]?.swarm_health_score || '?'}/100`);
    await loadCycles();
    setIsAnalyzing(false);
  };

  const geneticGeneration = latestCycle?.genetic_generation || 0;
  const fitness = latestCycle?.fitness_score || 0;
  const swarmHealthScore = latestCycle?.swarm_health_score || 0;
  const efficiencyGain = latestCycle?.efficiency_gain_percent || 0;
  const convergence = latestCycle?.convergence_data || [];
  const cycleAlgorithm = latestCycle?.algorithm || 'ACO';

  const healthColor = swarmHealthScore >= 70 ? 'emerald' : swarmHealthScore >= 40 ? 'amber' : 'red';

  const tabs = [
    { id: 'visualization', label: 'Live Swarm', icon: Network },
    { id: 'algorithm', label: 'Algorithm', icon: GitBranch },
    { id: 'genetic', label: 'Genetic AI', icon: Dna },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/60 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Swarm Intelligence</span>
            {latestCycle && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">Cycle #{latestCycle.cycle_number}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-mono">Gen {geneticGeneration}</span>
            <span className={`text-[10px] font-mono text-${healthColor}-400`}>{swarmHealthScore}/100</span>
            <Button
              onClick={runSwarmAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 h-6 text-[10px] px-2"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              {isAnalyzing ? 'Running...' : 'Run Now'}
            </Button>
          </div>
        </div>

        {/* Algorithm badge + fitness bar */}
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${cycleAlgorithm === 'ACO' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'}`}>
            {cycleAlgorithm === 'ACO' ? '🐜 ACO — Ant Colony' : '⚡ PSO — Particle Swarm'}
          </div>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              animate={{ width: `${fitness}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">fit:{typeof fitness === 'number' ? fitness.toFixed(1) : '0.0'}%</span>
        </div>

        {/* Live ticker */}
        <AnimatePresence>
          {ticker[0] && (
            <motion.div
              key={ticker[0]}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-[9px] text-emerald-300/60 font-mono truncate"
            >
              ▶ {ticker[0]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-800/60">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all ${activeTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

        {/* ── VISUALIZATION ── */}
        {activeTab === 'visualization' && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-900/40" style={{ height: 200 }}>
              <SwarmVisualization vehicles={vehicles} latestCycle={latestCycle} />
              <div className="absolute bottom-2 left-2 text-[9px] text-emerald-400/60 font-mono">
                {latestCycle?.vehicles_in_swarm || vehicles.length || 0} agents · pheromone mesh · {latestCycle ? 'live' : 'idle'}
              </div>
              {latestCycle && (
                <div className={`absolute top-2 right-2 text-[9px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded text-${healthColor}-400`}>
                  ♥ {swarmHealthScore}/100
                </div>
              )}
              {/* Legend */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[8px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />active</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />scout</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Active Agents', value: latestCycle?.vehicles_in_swarm || vehicles.filter(v => v.status === 'active').length || 0, color: 'emerald' },
                { label: 'Routes Optimized', value: latestCycle?.routes_optimized || 0, color: 'cyan' },
                { label: 'Pheromone Signals', value: latestCycle?.pheromone_signals || 0, color: 'violet' },
              ].map((s, i) => (
                <div key={i} className={`p-2 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20 text-center`}>
                  <p className={`text-${s.color}-400 font-bold text-sm`}>{s.value}</p>
                  <p className="text-slate-500 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>

            {latestCycle?.bottlenecks_detected?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                  <Bug className="w-3 h-3" /> ACO Bottlenecks
                </p>
                {latestCycle.bottlenecks_detected.map((b, i) => (
                  <p key={i} className="text-slate-300 text-[10px] flex items-center gap-1">
                    <span className="text-amber-400">▲</span> {b}
                  </p>
                ))}
              </div>
            )}

            {latestCycle?.scout_agents?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-amber-300 text-[10px] font-bold uppercase mb-1">Scout Agents (High Mobility)</p>
                <div className="flex flex-wrap gap-1">
                  {latestCycle.scout_agents.map((s, i) => (
                    <Badge key={i} className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {latestCycle?.ai_summary && (
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <p className="text-slate-500 text-[9px] uppercase mb-1">AI Summary</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{latestCycle.ai_summary}</p>
              </div>
            )}

            {!latestCycle && !loadingCycles && (
              <div className="text-center py-6">
                <Network className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">No swarm cycles yet — click "Run Now"</p>
              </div>
            )}
            {loadingCycles && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /></div>}
          </div>
        )}

        {/* ── ALGORITHM ── */}
        {activeTab === 'algorithm' && (
          <div className="space-y-3">
            {convergence.length > 1 && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  {cycleAlgorithm} Convergence Curve — Cycle #{latestCycle?.cycle_number}
                </p>
                <div className="h-14 flex items-end gap-0.5">
                  {convergence.map((v, i) => {
                    const max = Math.max(...convergence);
                    const min = Math.min(...convergence);
                    const h = max === min ? 50 : Math.max(5, ((v - min) / (max - min)) * 100);
                    const isLast = i === convergence.length - 1;
                    return (
                      <div key={i} className={`flex-1 rounded-t transition-all ${isLast ? 'ring-1 ring-emerald-400/60' : ''}`}
                        style={{ height: `${h}%`, background: `rgba(16,185,129,${0.2 + (i / convergence.length) * 0.8})` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
                  <span>iter 1</span>
                  <span>cost minimization</span>
                  <span>iter {convergence.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                    <p className="text-slate-400 text-[10px]">Efficiency Gain</p>
                    <p className="text-emerald-400 font-bold text-sm">+{efficiencyGain}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                    <p className="text-slate-400 text-[10px]">PSO Improved</p>
                    <p className="text-cyan-400 font-bold text-sm">{latestCycle?.rerouted_vehicles?.length || 0}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                    <p className="text-slate-400 text-[10px]">Bottlenecks</p>
                    <p className="text-amber-400 font-bold text-sm">{latestCycle?.bottlenecks_detected?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {latestCycle?.stigmergic_signals?.length > 0 && (
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <p className="text-cyan-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Stigmergic Signals Broadcast
                </p>
                {latestCycle.stigmergic_signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}

            {latestCycle?.actions_taken?.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Real Actions Taken
                </p>
                {latestCycle.actions_taken.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            )}

            {!latestCycle && (
              <div className="text-center py-6 text-slate-500 text-xs">Run a cycle to see real algorithm data</div>
            )}
          </div>
        )}

        {/* ── GENETIC AI ── */}
        {activeTab === 'genetic' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-violet-400 text-xs font-bold flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" /> Genetic Algorithm — Gen {geneticGeneration}
                </p>
                <span className={`text-[10px] font-mono text-${healthColor}-400`}>Fitness {typeof fitness === 'number' ? fitness.toFixed(1) : '0.0'}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-emerald-500 to-cyan-500"
                  animate={{ width: `${fitness}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-slate-500 text-[10px]">Evolving over real fleet cycles — {cycles.length} generations logged</p>
            </div>

            {latestCycle ? (
              <>
                {[
                  {
                    label: 'Active Vehicle Ratio',
                    desc: `${latestCycle.vehicles_in_swarm} vehicles in swarm`,
                    score: Math.round((vehicles.filter(v => v.status === 'active').length / Math.max(vehicles.length, 1)) * 100),
                    color: 'emerald'
                  },
                  {
                    label: 'Route Coverage',
                    desc: `${latestCycle.routes_optimized} routes optimized this cycle`,
                    score: Math.min(100, Math.round((latestCycle.routes_optimized / Math.max(routes.length, 1)) * 100)),
                    color: 'cyan'
                  },
                  {
                    label: 'Swarm Health Score',
                    desc: `${latestCycle.algorithm} cycle #${latestCycle.cycle_number}`,
                    score: latestCycle.swarm_health_score,
                    color: healthColor
                  },
                  {
                    label: 'PSO Efficiency vs Baseline',
                    desc: `${latestCycle.rerouted_vehicles?.length || 0} vehicles efficiency-updated`,
                    score: Math.min(100, latestCycle.efficiency_gain_percent + 50),
                    color: 'violet'
                  },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-[11px] font-semibold">{item.label}</p>
                      <span className={`text-${item.color}-400 text-[10px] font-mono`}>{item.score}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
                      <div className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400`} style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="text-slate-500 text-[10px]">{item.desc}</p>
                  </div>
                ))}

                {latestCycle.rerouted_vehicles?.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1.5">PSO-Optimized Vehicles</p>
                    <div className="flex flex-wrap gap-1">
                      {latestCycle.rerouted_vehicles.map((v, i) => (
                        <Badge key={i} className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">{v}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">No genetic data — run first cycle</div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400 font-semibold">Last {cycles.length} Swarm Cycles</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="text-amber-400">🐜</span> ACO</span>
                <span className="flex items-center gap-1"><span className="text-cyan-400">⚡</span> PSO</span>
              </div>
            </div>

            {loadingCycles && <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /></div>}

            {!loadingCycles && cycles.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">No cycle history yet</p>
                <Button onClick={runSwarmAnalysis} disabled={isAnalyzing} size="sm" className="mt-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30">
                  <Zap className="w-3 h-3 mr-1" /> Run First Cycle
                </Button>
              </div>
            )}

            {cycles.map((c, i) => <CycleRow key={c.id} cycle={c} isLatest={i === 0} />)}

            {cycles.length > 0 && (
              <div className="p-3 mt-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-xs text-slate-400 font-semibold mb-2">Aggregate Stats ({cycles.length} cycles)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-emerald-400 font-bold">{Math.round(cycles.reduce((s, c) => s + (c.swarm_health_score || 0), 0) / cycles.length)}</p>
                    <p className="text-slate-500 text-[9px]">Avg Health</p>
                  </div>
                  <div>
                    <p className="text-cyan-400 font-bold">{cycles.filter(c => c.algorithm === 'ACO').length}/{cycles.filter(c => c.algorithm === 'PSO').length}</p>
                    <p className="text-slate-500 text-[9px]">ACO/PSO Split</p>
                  </div>
                  <div>
                    <p className="text-violet-400 font-bold">{Math.max(...cycles.map(c => c.genetic_generation || 0))}</p>
                    <p className="text-slate-500 text-[9px]">Max Gen</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}