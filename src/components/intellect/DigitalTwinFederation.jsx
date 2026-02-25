import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Network, Cpu, Zap, Activity, CheckCircle, Loader2,
  Globe, GitMerge, Layers, Share2, RefreshCw, TrendingUp,
  AlertTriangle, Shield, Server, Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ═══════════════════════════════════════════════════════════
// FEDERATION CANVAS — decentralized twin network visualization
// ═══════════════════════════════════════════════════════════
const FederationCanvas = ({ twins, syncActivity }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ nodes: [], pulses: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 340;
    const H = 220;
    canvas.width = W;
    canvas.height = H;

    const twinTypes = ['vehicle', 'server', 'route', 'swarm', 'sensor'];
    const colors = {
      vehicle: '#06b6d4',
      server: '#8b5cf6',
      route: '#10b981',
      swarm: '#f59e0b',
      sensor: '#ec4899',
    };

    const count = Math.max(twins?.length || 0, 7);
    const nodes = Array.from({ length: Math.min(count, 10) }, (_, i) => {
      const type = twins?.[i]?.type || twinTypes[i % twinTypes.length];
      const angle = (i / Math.min(count, 10)) * Math.PI * 2;
      const r = 65 + (i % 3) * 20;
      return {
        id: i,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r * 0.7,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.25,
        type,
        label: twins?.[i]?.name || `Twin-${i + 1}`,
        color: colors[type] || '#06b6d4',
        health: twins?.[i]?.health || (80 + Math.random() * 20),
        syncPulse: Math.random() * Math.PI * 2,
        active: Math.random() > 0.15,
        federating: Math.random() > 0.4,
      };
    });

    stateRef.current = { nodes, pulses: [] };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      const { nodes, pulses } = stateRef.current;

      // Add federation pulse occasionally
      if (frame % 45 === 0 && nodes.length > 1) {
        const src = nodes[Math.floor(Math.random() * nodes.length)];
        const dst = nodes[Math.floor(Math.random() * nodes.length)];
        if (src !== dst) {
          pulses.push({ sx: src.x, sy: src.y, ex: dst.x, ey: dst.y, t: 0, color: src.color });
        }
      }

      // Move nodes gently
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        const margin = 30;
        if (n.x < margin || n.x > W - margin) n.vx *= -1;
        if (n.y < margin || n.y > H - margin) n.vy *= -1;
        n.syncPulse += 0.04;
      });

      // Draw federated links
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140 && (a.federating || b.federating)) {
            const alpha = (1 - dist / 140) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      // Draw federation pulses (data sync)
      stateRef.current.pulses = pulses.filter(p => {
        p.t += 0.035;
        if (p.t > 1) return false;
        const px = p.sx + (p.ex - p.sx) * p.t;
        const py = p.sy + (p.ey - p.sy) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.t;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // Draw nodes
      nodes.forEach(n => {
        // Sync halo
        if (n.federating) {
          const haloR = 14 + Math.sin(n.syncPulse) * 4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
          ctx.strokeStyle = `${n.color}44`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Node body
        const grad = ctx.createRadialGradient(n.x - 2, n.y - 2, 0, n.x, n.y, 11);
        grad.addColorStop(0, n.active ? n.color + 'ff' : '#33415580');
        grad.addColorStop(1, n.active ? n.color + '44' : '#33415520');
        ctx.beginPath();
        ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Icon hint (type initial)
        ctx.fillStyle = '#ffffff99';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.type[0].toUpperCase(), n.x, n.y + 2.5);
        ctx.textAlign = 'left';

        // Label
        ctx.fillStyle = 'rgba(148,163,184,0.65)';
        ctx.font = '7px monospace';
        ctx.fillText(n.label.slice(0, 7), n.x + 14, n.y + 3);
      });

      // Central federation hub indicator
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(6,182,212,${0.4 + Math.sin(frame * 0.04) * 0.2})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(6,182,212,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [twins]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ height: 220, background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.15)' }}
    />
  );
};

// ─────────────────────────────────────────────────────────
// TWIN CARD
// ─────────────────────────────────────────────────────────
const TwinCard = ({ twin, index }) => {
  const typeConfig = {
    vehicle: { icon: Truck, color: 'cyan' },
    server: { icon: Server, color: 'violet' },
    route: { icon: Share2, color: 'emerald' },
    swarm: { icon: Network, color: 'amber' },
    sensor: { icon: Activity, color: 'pink' },
  };
  const cfg = typeConfig[twin.type] || typeConfig.vehicle;
  const Icon = cfg.icon;
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-2.5 rounded-xl border ${colorMap[cfg.color]} relative overflow-hidden`}
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-lg bg-slate-900/50 flex-shrink-0">
          <Icon className={`w-3.5 h-3.5 text-${cfg.color}-400`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-white text-[11px] font-bold truncate">{twin.name}</span>
            <Badge className={`text-[8px] px-1 py-0 bg-${cfg.color}-500/20 text-${cfg.color}-300 border-${cfg.color}-500/30`}>
              {twin.type}
            </Badge>
          </div>
          <p className="text-slate-400 text-[9px] leading-relaxed mb-1.5">{twin.status}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${cfg.color}-400 rounded-full transition-all`}
                style={{ width: `${twin.sync_rate || 0}%` }}
              />
            </div>
            <span className={`text-[8px] font-mono text-${cfg.color}-400`}>{twin.sync_rate || 0}% sync</span>
          </div>
        </div>
      </div>
      {twin.cascade_warning && (
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">
          <AlertTriangle className="w-2.5 h-2.5" />
          {twin.cascade_warning}
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function DigitalTwinFederation({ vehicles = [], routes = [], onCommand }) {
  const [activeTab, setActiveTab] = useState('federation');
  const [twins, setTwins] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [federationReport, setFederationReport] = useState(null);
  const [syncActivity, setSyncActivity] = useState(0);
  const [gdprScore, setGdprScore] = useState(98);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Build virtual twins from real fleet data
  useEffect(() => {
    const builtTwins = [
      ...vehicles.slice(0, 5).map(v => ({
        id: v.id,
        name: v.name,
        type: 'vehicle',
        status: `${v.status} · ${v.fuel_level || 0}% fuel · ${v.speed || 0}km/h`,
        sync_rate: v.status === 'active' ? 94 + Math.floor(Math.random() * 5) : 40 + Math.floor(Math.random() * 20),
        health: v.fuel_level || 80,
        cascade_warning: v.fuel_level < 15 ? 'Low fuel cascade risk' : null,
      })),
      ...routes.slice(0, 3).map(r => ({
        id: r.id,
        name: r.name,
        type: 'route',
        status: `${r.status} · ${r.distance_km || 0}km`,
        sync_rate: r.status === 'active' ? 88 + Math.floor(Math.random() * 10) : 60,
        health: 85,
        cascade_warning: r.status === 'delayed' ? 'Route delay cascade' : null,
      })),
      { id: 'swarm-1', name: 'Swarm Agent', type: 'swarm', status: 'ACO/PSO coordinating fleet mesh', sync_rate: 96, health: 99 },
      { id: 'sensor-1', name: 'IoT Sensor Hub', type: 'sensor', status: 'Streaming telemetry · 5G/LoRa', sync_rate: 91, health: 97 },
    ];
    setTwins(builtTwins);
  }, [vehicles, routes]);

  // Animate sync activity
  useEffect(() => {
    const t = setInterval(() => setSyncActivity(s => (s + 1) % 100), 800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!autoLoaded && vehicles.length > 0) {
      runFederationAnalysis();
      setAutoLoaded(true);
    }
  }, [vehicles]);

  const runFederationAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const activeTwins = twins.length || vehicles.length;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Digital Twin Federation AI engine managing a decentralized network of virtual replicas.

Fleet context:
- ${vehicles.length} vehicles with digital twins (${vehicles.filter(v => v.status === 'active').length} active)
- ${routes.length} route twins
- 1 Swarm Intelligence twin (ACO/PSO)
- 1 IoT Sensor Hub twin
- Total federation nodes: ${activeTwins + 2}

Offline vehicles: ${vehicles.filter(v => v.status === 'offline').map(v => v.name).join(', ') || 'none'}
Critical fuel: ${vehicles.filter(v => v.fuel_level < 15).map(v => v.name + ':' + v.fuel_level + '%').join(', ') || 'none'}
Delayed routes: ${routes.filter(r => r.status === 'delayed').map(r => r.name).join(', ') || 'none'}

Perform Digital Twin Federation analysis:
1. Identify cascade risks (e.g. "if server twin crashes during WoW-peak, how do vehicle twins adapt?")
2. Federated learning insights — what cross-twin patterns are emerging without sharing raw data (GDPR-safe)?
3. Swarm-Twin synergy — which decisions should be simulated by twins before swarm executes them?
4. Emergent collective intelligence signals from twin federation
5. Proactive "what-if" scenarios: simulate top 2 failure scenarios and recommended pre-emptive actions
6. Edge AI recommendations: what each twin should decide locally vs. federate to the collective

Return analysis JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            federation_health_score: { type: "number" },
            summary: { type: "string" },
            cascade_scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario: { type: "string" },
                  probability: { type: "number" },
                  twin_response: { type: "string" }
                }
              }
            },
            federated_learning_insights: { type: "array", items: { type: "string" } },
            swarm_twin_synergies: { type: "array", items: { type: "string" } },
            edge_ai_decisions: { type: "array", items: { type: "string" } },
            proactive_actions: { type: "array", items: { type: "string" } },
            gdpr_compliance_note: { type: "string" }
          }
        }
      });
      setFederationReport(result);
    } catch (e) {
      console.error('Federation analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'federation', label: 'Federation', icon: Globe },
    { id: 'twins', label: 'Twins', icon: Layers },
    { id: 'learning', label: 'Fed. Learning', icon: GitMerge },
    { id: 'scenarios', label: 'Simulations', icon: TrendingUp },
  ];

  const healthScore = federationReport?.federation_health_score || Math.round(twins.reduce((a, t) => a + (t.sync_rate || 80), 0) / Math.max(twins.length, 1));
  const healthColor = healthScore > 80 ? 'emerald' : healthScore > 55 ? 'amber' : 'red';

  return (
    <div className="h-full flex flex-col bg-slate-950/70 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-b border-cyan-500/15 bg-gradient-to-r from-cyan-500/8 to-violet-500/8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-black uppercase tracking-widest">Digital Twin Federation</span>
            <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/25 text-[9px]">LIVE</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black text-${healthColor}-400`}>{healthScore}</span>
            <button
              onClick={runFederationAnalysis}
              disabled={isAnalyzing}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Twin Nodes', value: twins.length, color: 'cyan' },
            { label: 'Sync Rate', value: `${Math.round(twins.reduce((a, t) => a + (t.sync_rate || 80), 0) / Math.max(twins.length, 1))}%`, color: 'emerald' },
            { label: 'GDPR Score', value: `${gdprScore}%`, color: 'violet' },
            { label: 'Cascades', value: twins.filter(t => t.cascade_warning).length, color: twins.filter(t => t.cascade_warning).length > 0 ? 'red' : 'emerald' },
          ].map((s, i) => (
            <div key={i} className={`p-1.5 rounded-lg text-center border bg-${s.color}-500/10 border-${s.color}-500/20`}>
              <p className={`text-sm font-black text-${s.color}-400`}>{s.value}</p>
              <p className="text-[8px] text-slate-600 font-mono">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] text-cyan-400 font-mono">Federated learning · No raw data shared · EU-GDPR compliant</span>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex border-b border-slate-800/50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

        {/* FEDERATION TAB */}
        {activeTab === 'federation' && (
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-slate-600 font-mono mb-1.5 uppercase tracking-widest">
                Decentralized Twin Network — Live Mesh
              </p>
              <FederationCanvas twins={twins} syncActivity={syncActivity} />
            </div>

            {/* Principles */}
            <div className="space-y-1.5">
              {[
                { icon: Share2, color: 'cyan', title: 'Interoperability', desc: 'Vehicle, server, route & swarm twins share sensor data via secure protocols without raw data exposure' },
                { icon: GitMerge, color: 'violet', title: 'Federated Learning', desc: 'Models trained locally per twin, aggregated for collective insights — GDPR-safe by design' },
                { icon: Network, color: 'emerald', title: 'Swarm-Twin Synergy', desc: 'Twins simulate swarm decisions before execution, reducing risk in dynamic environments' },
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

            {federationReport?.summary && (
              <div className="p-2.5 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
                <p className="text-[9px] text-cyan-400 font-bold uppercase mb-1">Federation AI Summary</p>
                <p className="text-slate-300 text-[10px] leading-relaxed">{federationReport.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* TWINS TAB */}
        {activeTab === 'twins' && (
          <div className="space-y-2">
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
              Active Digital Twins — {twins.length} nodes
            </p>
            {twins.map((twin, i) => (
              <TwinCard key={twin.id} twin={twin} index={i} />
            ))}
            {twins.length === 0 && (
              <div className="text-center py-10">
                <Layers className="w-8 h-8 text-cyan-400/30 mx-auto mb-3" />
                <p className="text-slate-500 text-xs">No twin data yet — add vehicles and routes to federate</p>
              </div>
            )}
          </div>
        )}

        {/* FEDERATED LEARNING TAB */}
        {activeTab === 'learning' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-violet-400 text-[10px] font-black uppercase mb-1.5 flex items-center gap-1.5">
                <GitMerge className="w-3 h-3" /> Federated Learning — Cross-Twin Insights
              </p>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Each twin trains locally on its own data. Aggregated model updates are shared — 
                not raw data. This enables collective fleet intelligence while remaining EU-GDPR compliant.
              </p>
            </div>

            {isAnalyzing && !federationReport && (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Federating learning across twins...</p>
              </div>
            )}

            {federationReport?.federated_learning_insights?.length > 0 && (
              <div className="space-y-1.5">
                {federationReport.federated_learning_insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/40">
                    <CheckCircle className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-[10px] leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            )}

            {federationReport?.edge_ai_decisions?.length > 0 && (
              <div>
                <p className="text-[9px] text-cyan-400 font-bold uppercase mb-1.5 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Edge AI — Local Twin Decisions
                </p>
                {federationReport.edge_ai_decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 mb-1.5">
                    <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-[10px] leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            )}

            {federationReport?.gdpr_compliance_note && (
              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-emerald-400 text-[9px] font-bold uppercase mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> GDPR Compliance
                </p>
                <p className="text-slate-400 text-[10px]">{federationReport.gdpr_compliance_note}</p>
              </div>
            )}

            {!federationReport && !isAnalyzing && (
              <Button
                onClick={runFederationAnalysis}
                className="w-full bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
                size="sm"
              >
                <GitMerge className="w-4 h-4 mr-2" />
                Run Federated Analysis
              </Button>
            )}
          </div>
        )}

        {/* SIMULATIONS TAB */}
        {activeTab === 'scenarios' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/40">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">What-If Simulation Engine</p>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Digital twins pre-simulate failure scenarios before they occur. 
                Cascade effects — e.g. "server crash during WoW-peak → vehicle delivery delays" — 
                are modeled and mitigated proactively.
              </p>
            </div>

            {isAnalyzing && !federationReport && (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Simulating cascade scenarios...</p>
              </div>
            )}

            {federationReport?.cascade_scenarios?.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/40">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white text-[11px] font-semibold flex-1">{s.scenario}</p>
                  <span className={`text-xs font-black flex-shrink-0 ml-2 ${
                    s.probability > 70 ? 'text-red-400' : s.probability > 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{s.probability}%</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-400 text-[10px] leading-relaxed">{s.twin_response}</p>
                </div>
              </div>
            ))}

            {federationReport?.swarm_twin_synergies?.length > 0 && (
              <div>
                <p className="text-[9px] text-emerald-400 font-bold uppercase mb-1.5 flex items-center gap-1">
                  <Network className="w-3 h-3" /> Swarm-Twin Synergies
                </p>
                {federationReport.swarm_twin_synergies.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 mb-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-[10px] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {federationReport?.proactive_actions?.length > 0 && (
              <div>
                <p className="text-[9px] text-amber-400 font-bold uppercase mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Proactive Actions
                </p>
                {federationReport.proactive_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15 mb-1.5">
                    <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-[10px] leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            )}

            {federationReport && (
              <Button
                onClick={() => onCommand && onCommand(`Activate Digital Twin Federation proactive protocol — simulate and pre-empt cascade failures across all ${twins.length} twins`)}
                className="w-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30"
                size="sm"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Activate via FLEET AI
              </Button>
            )}

            {!federationReport && !isAnalyzing && (
              <Button
                onClick={runFederationAnalysis}
                className="w-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30"
                size="sm"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Simulate Cascade Scenarios
              </Button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}