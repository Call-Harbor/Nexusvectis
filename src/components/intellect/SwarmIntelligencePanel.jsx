import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Network, Cpu, Wifi, GitBranch, Dna, Bug, Zap, Activity, TrendingUp, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Animated swarm node visualization
const SwarmVisualization = ({ vehicles, activeSignals }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    // Initialize nodes from vehicles (or random if none)
    const count = Math.max(vehicles?.length || 0, 6);
    nodesRef.current = Array.from({ length: Math.min(count, 12) }, (_, i) => ({
      id: i,
      x: 60 + Math.random() * (W - 120),
      y: 40 + Math.random() * (H - 80),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      label: vehicles?.[i]?.name || `Node ${i + 1}`,
      type: vehicles?.[i]?.type || 'truck',
      active: Math.random() > 0.3,
      pheromone: Math.random(),
      signaling: false,
      signalTimer: 0,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Randomly trigger signals
      if (frame % 60 === 0) {
        const idx = Math.floor(Math.random() * nodesRef.current.length);
        nodesRef.current[idx].signaling = true;
        nodesRef.current[idx].signalTimer = 40;
      }

      const nodes = nodesRef.current;

      // Update positions
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 30 || n.x > W - 30) n.vx *= -1;
        if (n.y < 20 || n.y > H - 20) n.vy *= -1;
        if (n.signalTimer > 0) n.signalTimer--;
        else n.signaling = false;

        // Pheromone trail decay & boost
        n.pheromone = Math.max(0.1, n.pheromone - 0.002);
        if (n.signaling) n.pheromone = Math.min(1, n.pheromone + 0.05);
      });

      // Draw connections with pheromone intensity
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            const strength = ((a.pheromone + b.pheromone) / 2) * (1 - dist / 130);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(6,182,212,${strength * 0.5})`;
            ctx.lineWidth = strength * 2;
            ctx.stroke();

            // Signal pulse along connection
            if (a.signaling || b.signaling) {
              const t = (frame % 30) / 30;
              const px = a.x + (b.x - a.x) * t;
              const py = a.y + (b.y - a.y) * t;
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(6,182,212,0.9)';
              ctx.fill();
            }
          }
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        // Signal ring
        if (n.signaling) {
          const r = (40 - n.signalTimer) * 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16,185,129,${n.signalTimer / 40 * 0.6})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Pheromone halo
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
        grad.addColorStop(0, `rgba(16,185,129,${n.pheromone * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? '#10b981' : '#334155';
        ctx.fill();
        ctx.strokeStyle = n.active ? 'rgba(16,185,129,0.8)' : 'rgba(51,65,85,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(148,163,184,0.8)';
        ctx.font = '8px monospace';
        ctx.fillText(n.label.slice(0, 8), n.x + 9, n.y + 3);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [vehicles]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ background: 'transparent' }} />;
};

// ACO/PSO algorithm simulation stats
const AlgorithmStats = ({ algorithm, vehicles }) => {
  const [iteration, setIteration] = useState(0);
  const [bestCost, setBestCost] = useState(1000);
  const [convergence, setConvergence] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIteration(prev => {
        const next = prev + 1;
        const decay = algorithm === 'ACO' ? 0.97 : 0.95;
        const newCost = Math.max(200, bestCost * decay + (Math.random() - 0.5) * 20);
        setBestCost(Math.round(newCost));
        setConvergence(prev => [...prev.slice(-19), Math.round(newCost)]);
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [algorithm]);

  const improvement = convergence.length > 1
    ? Math.round(((convergence[0] - convergence[convergence.length - 1]) / convergence[0]) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">{algorithm} Running</span>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Live</Badge>
        </div>
        <span className="text-slate-400 text-xs font-mono">iter: {iteration}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-slate-800/60 text-center">
          <p className="text-slate-400 text-[10px]">Best Cost</p>
          <p className="text-emerald-400 font-bold text-sm">{bestCost}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/60 text-center">
          <p className="text-slate-400 text-[10px]">Improvement</p>
          <p className="text-cyan-400 font-bold text-sm">-{improvement}%</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/60 text-center">
          <p className="text-slate-400 text-[10px]">Agents</p>
          <p className="text-violet-400 font-bold text-sm">{Math.max(vehicles?.length || 0, 6)}</p>
        </div>
      </div>

      {/* Convergence mini-chart */}
      {convergence.length > 2 && (
        <div className="h-12 flex items-end gap-0.5">
          {convergence.map((v, i) => {
            const max = Math.max(...convergence);
            const min = Math.min(...convergence);
            const h = max === min ? 50 : ((v - min) / (max - min)) * 100;
            return (
              <div
                key={i}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${h}%`,
                  background: `rgba(16,185,129,${0.3 + (i / convergence.length) * 0.7})`
                }}
              />
            );
          })}
        </div>
      )}
      <p className="text-slate-500 text-[10px] text-center">Convergence curve — cost minimization over iterations</p>
    </div>
  );
};

export default function SwarmIntelligencePanel({ vehicles = [], routes = [], onCommand }) {
  const [algorithm, setAlgorithm] = useState('ACO');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestCycle, setLatestCycle] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const [loadingCycles, setLoadingCycles] = useState(true);

  // Load latest real swarm cycle from DB
  const loadLatestCycle = async () => {
    try {
      const cycles = await base44.entities.SwarmCoordination.list('-created_date', 1);
      if (cycles.length > 0) setLatestCycle(cycles[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCycles(false);
    }
  };

  useEffect(() => {
    loadLatestCycle();
    // Subscribe to real-time updates
    const unsub = base44.entities.SwarmCoordination.subscribe((event) => {
      if (event.type === 'create') setLatestCycle(event.data);
    });
    return unsub;
  }, []);

  // Trigger real swarm engine manually
  const runSwarmAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('swarmCoordinationEngine', {});
      // Reload latest cycle after engine runs
      await loadLatestCycle();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Use real data from latest cycle, with fallbacks
  const geneticGeneration = latestCycle?.genetic_generation || 0;
  const fitness = latestCycle?.fitness_score || 0;
  const swarmHealthScore = latestCycle?.swarm_health_score || 0;
  const efficiencyGain = latestCycle?.efficiency_gain_percent || 0;
  const convergence = latestCycle?.convergence_data || [];

  const tabs = [
    { id: 'visualization', label: 'Live Swarm', icon: Network },
    { id: 'algorithm', label: 'Algorithm', icon: GitBranch },
    { id: 'genetic', label: 'Genetic AI', icon: Dna },
    { id: 'report', label: 'Report', icon: Activity },
  ];

  const cycleAlgorithm = latestCycle?.algorithm || algorithm;

  return (
    <div className="h-full flex flex-col bg-slate-950/60 overflow-hidden">
      {/* Header bar */}
      <div className="flex-shrink-0 p-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Swarm Intelligence Active</span>
            {latestCycle && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">Cycle #{latestCycle.cycle_number}</Badge>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Gen {geneticGeneration}</span>
            <span className="text-emerald-400 text-[10px] font-mono">Fitness: {typeof fitness === 'number' ? fitness.toFixed(1) : '0.0'}%</span>
          </div>
        </div>
        <div className="flex gap-1.5 text-[10px]">
          <div className={`px-2.5 py-1 rounded-full border font-semibold bg-emerald-500/20 border-emerald-500/50 text-emerald-300`}>
            {cycleAlgorithm === 'ACO' ? '🐜 ACO' : '⚡ PSO'} — {cycleAlgorithm === 'ACO' ? 'Ant Colony' : 'Particle Swarm'}
          </div>
          <Button
            onClick={runSwarmAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="ml-auto bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 h-6 text-[10px] px-2"
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isAnalyzing ? 'Running...' : 'Run Now'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-800/60">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {activeTab === 'visualization' && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-900/40" style={{ height: 200 }}>
              <SwarmVisualization vehicles={vehicles} />
              <div className="absolute bottom-2 left-2 text-[9px] text-emerald-400/60 font-mono">
                {latestCycle?.vehicles_in_swarm || vehicles.length || 0} agents · pheromone mesh · {latestCycle ? 'live' : 'idle'}
              </div>
              {latestCycle && (
                <div className="absolute top-2 right-2 text-[9px] text-emerald-300 font-mono bg-slate-900/70 px-1.5 py-0.5 rounded">
                  Health: {swarmHealthScore}/100
                </div>
              )}
            </div>

            {/* Real stats from latest cycle */}
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

            {/* Bottlenecks from real data */}
            {latestCycle?.bottlenecks_detected?.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 text-[10px] font-bold uppercase mb-1">Bottlenecks Detected by ACO</p>
                {latestCycle.bottlenecks_detected.map((b, i) => (
                  <p key={i} className="text-slate-300 text-[10px] flex items-center gap-1">
                    <span className="text-amber-400">▲</span> {b}
                  </p>
                ))}
              </div>
            )}

            {/* Scout agents */}
            {latestCycle?.scout_agents?.length > 0 && (
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Scout Agents (High Mobility)</p>
                <p className="text-slate-300 text-[10px]">{latestCycle.scout_agents.join(' · ')}</p>
              </div>
            )}

            {!latestCycle && !loadingCycles && (
              <div className="text-center py-4">
                <p className="text-slate-500 text-xs">No swarm cycles run yet — click "Run Now" to start</p>
              </div>
            )}
            {loadingCycles && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'algorithm' && (
          <div className="space-y-3">
            {/* Real convergence data */}
            {convergence.length > 1 && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  {cycleAlgorithm} Convergence — Cycle #{latestCycle?.cycle_number}
                </p>
                <div className="h-12 flex items-end gap-0.5">
                  {convergence.map((v, i) => {
                    const max = Math.max(...convergence);
                    const min = Math.min(...convergence);
                    const h = max === min ? 50 : ((v - min) / (max - min)) * 100;
                    return (
                      <div key={i} className="flex-1 rounded-t transition-all"
                        style={{ height: `${Math.max(5, h)}%`, background: `rgba(16,185,129,${0.3 + (i / convergence.length) * 0.7})` }}
                      />
                    );
                  })}
                </div>
                <p className="text-slate-500 text-[10px] text-center mt-1">Cost minimization — {convergence.length} iterations</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                    <p className="text-slate-400 text-[10px]">Efficiency Gain</p>
                    <p className="text-emerald-400 font-bold text-sm">+{efficiencyGain}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                    <p className="text-slate-400 text-[10px]">Vehicles Improved</p>
                    <p className="text-cyan-400 font-bold text-sm">{latestCycle?.rerouted_vehicles?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stigmergic signals from real cycle */}
            {latestCycle?.stigmergic_signals?.length > 0 && (
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <p className="text-cyan-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Stigmergic Signals Broadcast
                </p>
                {latestCycle.stigmergic_signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300 mb-1">
                    <CheckCircle className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Actions taken */}
            {latestCycle?.actions_taken?.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Real Actions Taken
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
              <div className="text-center py-6 text-slate-500 text-xs">Run a swarm cycle to see real algorithm data</div>
            )}
          </div>
        )}

        {activeTab === 'genetic' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-violet-400 text-xs font-bold flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" />
                  Genetic Algorithm — Real Data
                </p>
                <span className="text-[10px] font-mono text-violet-300">Gen {geneticGeneration}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  animate={{ width: `${fitness}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-slate-400 text-[10px]">Fitness: {typeof fitness === 'number' ? fitness.toFixed(1) : '0.0'}% — evolving over real fleet cycles</p>
            </div>

            {/* Real metrics from actual fleet data */}
            {latestCycle && (
              <>
                {[
                  {
                    label: 'Active Vehicle Ratio',
                    desc: `${latestCycle.vehicles_in_swarm} vehicles in swarm`,
                    score: Math.round((vehicles.filter(v => v.status === 'active').length / Math.max(vehicles.length, 1)) * 100)
                  },
                  {
                    label: 'Route Coverage',
                    desc: `${latestCycle.routes_optimized} routes optimized`,
                    score: Math.min(100, Math.round((latestCycle.routes_optimized / Math.max(routes.length, 1)) * 100))
                  },
                  {
                    label: 'Swarm Health',
                    desc: `Cycle #${latestCycle.cycle_number} — ${latestCycle.algorithm}`,
                    score: latestCycle.swarm_health_score
                  },
                  {
                    label: 'Efficiency Gain vs Baseline',
                    desc: `PSO particle optimization — ${latestCycle.rerouted_vehicles?.length || 0} vehicles updated`,
                    score: Math.min(100, latestCycle.efficiency_gain_percent + 50)
                  },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-[11px] font-semibold">{item.label}</p>
                      <span className="text-emerald-400 text-[10px] font-mono">{item.score}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="text-slate-500 text-[10px]">{item.desc}</p>
                  </div>
                ))}
              </>
            )}

            {!latestCycle && (
              <div className="text-center py-6 text-slate-500 text-xs">No genetic data yet — run a swarm cycle first</div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-3">
            {!latestCycle && !isAnalyzing && (
              <div className="text-center py-8">
                <Network className="w-10 h-10 text-emerald-400/40 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No swarm cycles run yet</p>
                <Button
                  onClick={runSwarmAnalysis}
                  className="mt-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run First Cycle
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Swarm engine running...</p>
                <p className="text-slate-600 text-xs mt-1">ACO + PSO + Genetic algorithms processing fleet data</p>
              </div>
            )}

            {latestCycle && !isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Health score */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <p className="text-white font-bold">Swarm Health Score</p>
                    <p className="text-slate-400 text-xs">{latestCycle.ai_summary}</p>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">{swarmHealthScore}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <p className="text-cyan-400 font-bold text-lg">+{efficiencyGain}%</p>
                    <p className="text-slate-400 text-xs">Efficiency gain</p>
                  </div>
                  <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-center">
                    <p className="text-violet-400 font-bold text-lg">{latestCycle.genetic_generation}</p>
                    <p className="text-slate-400 text-xs">Generations evolved</p>
                  </div>
                </div>

                {latestCycle.stigmergic_signals?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Wifi className="w-3 h-3" /> Stigmergic Signals</p>
                    {latestCycle.stigmergic_signals.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                        <CheckCircle className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {latestCycle.rerouted_vehicles?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Cpu className="w-3 h-3" /> PSO-Optimized Vehicles</p>
                    {latestCycle.rerouted_vehicles.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                        <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        {v} — efficiency score updated
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={runSwarmAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                  size="sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Run New Cycle
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}