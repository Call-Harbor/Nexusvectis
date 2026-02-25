import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Network, Cpu, Wifi, GitBranch, Dna, Bug, Zap, Activity, TrendingUp, CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [swarmReport, setSwarmReport] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const [geneticGeneration, setGeneticGeneration] = useState(0);
  const [fitness, setFitness] = useState(0);

  // Genetic algorithm evolution simulation
  useEffect(() => {
    const t = setInterval(() => {
      setGeneticGeneration(g => g + 1);
      setFitness(f => Math.min(98, f + Math.random() * 2.5 - 0.3));
    }, 1200);
    return () => clearInterval(t);
  }, []);

  const runSwarmAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Swarm Intelligence AI engine embedded in a fleet management system.

Analyze this fleet using ${algorithm} (${algorithm === 'ACO' ? 'Ant Colony Optimization' : 'Particle Swarm Optimization'}) principles:
- Vehicles: ${vehicles.length} units (${vehicles.filter(v => v.status === 'active').length} active)
- Routes: ${routes.length} active routes
- Algorithm: ${algorithm}

Perform swarm intelligence analysis:
1. Identify optimal route clusters using pheromone/velocity signals
2. Detect bottlenecks that swarm agents should route around
3. Suggest stigmergic communication improvements (what data to broadcast between agents)
4. Estimate collective efficiency gain from swarm coordination vs. centralized control
5. Identify which vehicles should act as "scout agents" (high mobility, route diversity)
6. Genetic algorithm recommendation: what fleet behaviors should evolve over time
7. Edge AI recommendation: which decisions each vehicle node should make locally

Return a concise, actionable swarm intelligence report for the fleet operator.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            efficiency_gain_percent: { type: "number" },
            bottlenecks: { type: "array", items: { type: "string" } },
            stigmergic_signals: { type: "array", items: { type: "string" } },
            scout_agents: { type: "array", items: { type: "string" } },
            genetic_recommendations: { type: "array", items: { type: "string" } },
            edge_ai_decisions: { type: "array", items: { type: "string" } },
            swarm_health_score: { type: "number" }
          }
        }
      });
      setSwarmReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'visualization', label: 'Live Swarm', icon: Network },
    { id: 'algorithm', label: 'Algorithm', icon: GitBranch },
    { id: 'genetic', label: 'Genetic AI', icon: Dna },
    { id: 'report', label: 'Report', icon: Activity },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/60 overflow-hidden">
      {/* Header bar */}
      <div className="flex-shrink-0 p-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Swarm Intelligence Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Gen {geneticGeneration}</span>
            <span className="text-emerald-400 text-[10px] font-mono">Fitness: {fitness.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex gap-1.5 text-[10px]">
          {['ACO', 'PSO'].map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-2.5 py-1 rounded-full border transition-all font-semibold ${
                algorithm === alg
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
              }`}
            >
              {alg === 'ACO' ? '🐜 ACO' : '⚡ PSO'}
            </button>
          ))}
          <Button
            onClick={runSwarmAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="ml-auto bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 h-6 text-[10px] px-2"
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
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
                {vehicles.length || 8} agents · pheromone mesh · live
              </div>
            </div>

            {/* Agent status grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Active Agents', value: vehicles.filter(v => v.status === 'active').length || 6, color: 'emerald' },
                { label: 'Mesh Links', value: Math.floor((vehicles.length || 8) * 2.3), color: 'cyan' },
                { label: 'Signals/min', value: Math.floor(Math.random() * 40 + 80), color: 'violet' },
              ].map((s, i) => (
                <div key={i} className={`p-2 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20 text-center`}>
                  <p className={`text-${s.color}-400 font-bold text-sm`}>{s.value}</p>
                  <p className="text-slate-500 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Principles */}
            <div className="space-y-1.5">
              {[
                { icon: Bug, color: 'emerald', title: 'Pheromone Trails', desc: 'Optimal routes reinforced by digital feromoner fra aktive køretøjer' },
                { icon: Wifi, color: 'cyan', title: 'Mesh Koordinering', desc: 'P2P signaler via 5G/LoRaWAN — ingen central hjerne nødvendig' },
                { icon: Network, color: 'violet', title: 'Emergent Routing', desc: 'Flåden self-organiserer automatisk ved trafikkaos eller fejl' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg bg-${item.color}-500/5 border border-${item.color}-500/15`}>
                    <Icon className={`w-3.5 h-3.5 text-${item.color}-400 mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className="text-white text-[11px] font-semibold">{item.title}</p>
                      <p className="text-slate-400 text-[10px]">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'algorithm' && (
          <div className="space-y-3">
            <AlgorithmStats algorithm={algorithm} vehicles={vehicles} />

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <p className="text-white text-xs font-semibold flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Edge AI — Lokale beslutninger pr. node
              </p>
              {[
                'Omdirigering ved lokal trafik-detektion',
                'Fuel-optimering baseret på sensor-data',
                'Peer signal: broadcast forsinkelse til naboer',
                'Autonom lastfordeling ved kapacitets-spikes',
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  {d}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-cyan-400 text-[10px] font-bold uppercase mb-1.5">Stigmergi-kommunikation</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Agenter opdaterer det delte miljø — opdaterede kort, belastningsdata — 
                så andre agenter automatisk tilpasser sig uden direkte kommunikation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'genetic' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-violet-400 text-xs font-bold flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" />
                  Genetisk Algoritme
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
              <p className="text-slate-400 text-[10px]">Fitness: {fitness.toFixed(1)}% — swarmen udvikler sig over tid</p>
            </div>

            {[
              { label: 'Vejroptimering', desc: 'Europæiske vejrforhold indlært fra historiske ture', score: 87 },
              { label: 'Rush-hour Patterns', desc: 'Travl-tids mønstre i København, Berlin, Amsterdam', score: 92 },
              { label: 'Gaming Spike Handling', desc: 'Server-load spikes under MMORPG peak times', score: 78 },
              { label: 'Fuel Efficiency Evolution', desc: 'Optimal fart-profiler på tværs af ruter', score: 95 },
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
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-3">
            {!swarmReport && !isAnalyzing && (
              <div className="text-center py-8">
                <Network className="w-10 h-10 text-emerald-400/40 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Kør analyse for at generere swarm intelligence rapport</p>
                <Button
                  onClick={runSwarmAnalysis}
                  className="mt-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Analysér Flåde
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Swarm algoritme kører...</p>
                <p className="text-slate-600 text-xs mt-1">{algorithm} optimering i gang</p>
              </div>
            )}

            {swarmReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Score */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <p className="text-white font-bold">Swarm Health Score</p>
                    <p className="text-slate-400 text-xs">{swarmReport.summary}</p>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">{swarmReport.swarm_health_score || 82}</div>
                </div>

                {swarmReport.efficiency_gain_percent && (
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <p className="text-cyan-400 font-bold text-lg">{swarmReport.efficiency_gain_percent}%</p>
                    <p className="text-slate-400 text-xs">Efficiency gain over centralized control</p>
                  </div>
                )}

                {swarmReport.stigmergic_signals?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Wifi className="w-3 h-3" /> Stigmergi Signaler</p>
                    {swarmReport.stigmergic_signals.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                        <CheckCircle className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {swarmReport.edge_ai_decisions?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Cpu className="w-3 h-3" /> Edge AI Beslutninger</p>
                    {swarmReport.edge_ai_decisions.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                        <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        {d}
                      </div>
                    ))}
                  </div>
                )}

                {swarmReport.genetic_recommendations?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Dna className="w-3 h-3" /> Genetiske Anbefalinger</p>
                    {swarmReport.genetic_recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                        <TrendingUp className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => onCommand && onCommand(`Implementér swarm intelligence koordinering for flåden med ${algorithm} algoritmen — optimer ruter og edge AI beslutninger`)}
                  className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                  size="sm"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Implementér via FLEET AI
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}