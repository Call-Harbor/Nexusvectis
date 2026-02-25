import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Shield, Brain, Satellite, Globe, Zap, Activity, AlertTriangle, 
  TrendingUp, CheckCircle, Loader2, Eye, Radio, Cpu, Lock,
  Wifi, BarChart3, Cloud, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Neural network pulse visualization on canvas
const NeuralPulseCanvas = ({ riskLevel }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 340;
    const H = canvas.offsetHeight || 160;
    canvas.width = W;
    canvas.height = H;

    const layers = [
      { x: W * 0.12, nodes: 5, label: 'Sensors' },
      { x: W * 0.38, nodes: 7, label: 'Neural' },
      { x: W * 0.62, nodes: 5, label: 'Symbolic' },
      { x: W * 0.88, nodes: 3, label: 'Risk' },
    ];

    const allNodes = [];
    layers.forEach((layer, li) => {
      const gap = H / (layer.nodes + 1);
      for (let i = 0; i < layer.nodes; i++) {
        allNodes.push({
          x: layer.x,
          y: gap * (i + 1),
          layer: li,
          active: Math.random() > 0.4,
          pulse: Math.random(),
          pulseSpeed: 0.02 + Math.random() * 0.03,
          color: li === 0 ? '#06b6d4' : li === 1 ? '#8b5cf6' : li === 2 ? '#f59e0b' : 
                 riskLevel > 70 ? '#ef4444' : riskLevel > 40 ? '#f59e0b' : '#10b981',
        });
      }
    });
    nodesRef.current = allNodes;

    const edges = [];
    allNodes.forEach(a => {
      allNodes.forEach(b => {
        if (b.layer === a.layer + 1 && Math.random() > 0.45) {
          edges.push({ a, b, signal: Math.random(), speed: 0.008 + Math.random() * 0.012 });
        }
      });
    });

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      nodesRef.current.forEach(n => { n.pulse = (n.pulse + n.pulseSpeed) % 1; });
      edges.forEach(e => { e.signal = (e.signal + e.speed) % 1; });

      edges.forEach(e => {
        const alpha = 0.12 + Math.abs(Math.sin(frame * 0.02)) * 0.1;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        const px = e.a.x + (e.b.x - e.a.x) * e.signal;
        const py = e.a.y + (e.b.y - e.a.y) * e.signal;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = e.b.color + 'cc';
        ctx.fill();
      });

      nodesRef.current.forEach(n => {
        const glow = 0.3 + Math.sin(n.pulse * Math.PI * 2) * 0.3;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 12);
        grad.addColorStop(0, n.color + Math.round(glow * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? n.color : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = n.color + '99';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      layers.forEach(layer => {
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(layer.label, layer.x, H - 4);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [riskLevel]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: 160, background: 'transparent' }} />;
};

const SignalStream = ({ signals }) => (
  <div className="space-y-1.5">
    {signals.map((s, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] ${
          s.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
          s.severity === 'high' ? 'bg-amber-500/10 border-amber-500/20' :
          s.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
          'bg-emerald-500/10 border-emerald-500/20'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          s.severity === 'critical' ? 'bg-red-400 animate-pulse' :
          s.severity === 'high' ? 'bg-amber-400 animate-pulse' :
          s.severity === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
        }`} />
        <span className={`font-mono font-semibold flex-shrink-0 ${
          s.severity === 'critical' ? 'text-red-400' :
          s.severity === 'high' ? 'text-amber-400' :
          s.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
        }`}>[{s.source}]</span>
        <span className="text-slate-300 flex-1">{s.signal}</span>
        <span className="text-slate-600 flex-shrink-0">{s.confidence}%</span>
      </motion.div>
    ))}
  </div>
);

export default function NeuroSymbolicRiskPanel({ vehicles = [], routes = [], onCommand }) {
  const [activeTab, setActiveTab] = useState('fusion');
  const [riskLevel, setRiskLevel] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState(null);
  const [realSignals, setRealSignals] = useState([]);
  const [symbolicRules, setSymbolicRules] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [fusionPulse, setFusionPulse] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Pulse counter animation
  useEffect(() => {
    const t = setInterval(() => setFusionPulse(p => p + 1), 2500);
    return () => clearInterval(t);
  }, []);

  // Auto-run on mount
  useEffect(() => {
    if (!autoLoaded) {
      runFusionAnalysis();
      setAutoLoaded(true);
    }
  }, []);

  const runFusionAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const user = await base44.auth.me();
      const orgId = user?.organization_id;

      const response = await base44.functions.invoke('neuroRiskFusion', { organization_id: orgId });
      const data = response.data;

      if (data.error) throw new Error(data.error);

      setRealSignals(data.real_signals || []);
      setSymbolicRules(data.symbolic_rules || []);
      setFleetSummary(data.fleet_summary);
      setRiskReport(data.ai_report);
      setRiskLevel(data.risk_score || data.ai_report?.overall_risk_score || 20);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Fusion error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const riskColor = riskLevel > 70 ? 'red' : riskLevel > 45 ? 'amber' : 'emerald';
  const riskLabel = riskLevel > 70 ? 'CRITICAL' : riskLevel > 45 ? 'ELEVATED' : 'NOMINAL';

  const tabs = [
    { id: 'fusion', label: 'Risk Fusion', icon: Brain },
    { id: 'signals', label: 'Live Signals', icon: Radio },
    { id: 'symbolic', label: 'Symbolic AI', icon: Cpu },
    { id: 'report', label: 'Intelligence', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/60 overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 p-3 border-b bg-gradient-to-r ${
        riskColor === 'red' ? 'from-red-500/15 to-violet-500/10 border-red-500/20' :
        riskColor === 'amber' ? 'from-amber-500/15 to-violet-500/10 border-amber-500/20' :
        'from-violet-500/15 to-cyan-500/10 border-violet-500/20'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              riskColor === 'red' ? 'bg-red-400' : riskColor === 'amber' ? 'bg-amber-400' : 'bg-violet-400'
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              riskColor === 'red' ? 'text-red-400' : riskColor === 'amber' ? 'text-amber-400' : 'text-violet-400'
            }`}>Neuro-Symbolic Risk Fusion</span>
            <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">LIVE DATA</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] font-bold ${
              riskColor === 'red' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              riskColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>{riskLabel}</Badge>
            <span className={`text-2xl font-black ${
              riskColor === 'red' ? 'text-red-400' : riskColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
            }`}>{Math.round(riskLevel)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                riskColor === 'red' ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                riskColor === 'amber' ? 'bg-gradient-to-r from-emerald-500 to-amber-500' :
                'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              animate={{ width: `${riskLevel}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <Button
            onClick={runFusionAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className={`h-6 text-[10px] px-2 border ${
              riskColor === 'red'
                ? 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30'
                : 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/30'
            }`}
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isAnalyzing ? 'Analyserer...' : 'Opdater'}
          </Button>
        </div>

        <p className="text-[9px] text-slate-600 mt-1 font-mono">
          fusion cycles: {fusionPulse} · {fleetSummary ? `${fleetSummary.vehicles_total} køretøjer · ${fleetSummary.vehicles_offline} offline · ${fleetSummary.alerts_critical} kritiske alerts` : 'indlæser...'} {lastUpdated ? `· opdateret ${lastUpdated.toLocaleTimeString()}` : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-800/60">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
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

        {/* FUSION TAB */}
        {activeTab === 'fusion' && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-violet-500/20 bg-slate-900/40 p-2">
              <p className="text-[9px] text-violet-400/60 font-mono mb-1">
                neuro-symbolic fusion network · 4-layer architecture · live fleet data
              </p>
              <NeuralPulseCanvas riskLevel={riskLevel} />
            </div>

            {/* Fleet summary stats */}
            {fleetSummary && (
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Rigtig Flåde Status
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Offline', value: fleetSummary.vehicles_offline, color: fleetSummary.vehicles_offline > 0 ? 'red' : 'emerald' },
                    { label: 'Lav brændstof', value: fleetSummary.vehicles_low_fuel, color: fleetSummary.vehicles_low_fuel > 0 ? 'amber' : 'emerald' },
                    { label: 'Forsinkede', value: fleetSummary.shipments_delayed, color: fleetSummary.shipments_delayed > 0 ? 'amber' : 'emerald' },
                    { label: 'Kritiske alerts', value: fleetSummary.alerts_critical, color: fleetSummary.alerts_critical > 0 ? 'red' : 'emerald' },
                    { label: 'Vedligeholdelse', value: fleetSummary.maintenance_overdue, color: fleetSummary.maintenance_overdue > 0 ? 'red' : 'emerald' },
                    { label: 'Undtagelser', value: fleetSummary.exceptions_critical, color: fleetSummary.exceptions_critical > 0 ? 'red' : 'emerald' },
                  ].map((s, i) => (
                    <div key={i} className={`p-2 rounded-lg text-center border ${
                      s.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                      s.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      <p className={`font-bold text-sm ${
                        s.color === 'red' ? 'text-red-400' :
                        s.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{s.value}</p>
                      <p className="text-slate-500 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAnalyzing && !fleetSummary && (
              <div className="text-center py-6">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Fusionerer rigtige flådedata med Mistral AI...</p>
              </div>
            )}
          </div>
        )}

        {/* LIVE SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-red-400" />
                Rigtige Risikosignaler
              </p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] text-red-400 font-mono">LIVE</span>
              </div>
            </div>

            {realSignals.length === 0 && !isAnalyzing && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                <p className="text-emerald-400 text-xs font-semibold">Ingen kritiske signaler</p>
                <p className="text-slate-600 text-[10px]">Flåden kører nominelt</p>
              </div>
            )}

            {isAnalyzing && realSignals.length === 0 && (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Scanner flådedata...</p>
              </div>
            )}

            {realSignals.length > 0 && (
              <>
                <SignalStream signals={realSignals.slice(0, 8)} />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Total signaler', value: realSignals.length, color: 'violet' },
                    { label: 'Kritiske', value: realSignals.filter(s => s.severity === 'critical').length, color: 'red' },
                    { label: 'Avg. confidence', value: `${Math.round(realSignals.reduce((a, s) => a + s.confidence, 0) / realSignals.length)}%`, color: 'cyan' },
                    { label: 'Høj prioritet', value: realSignals.filter(s => s.severity === 'high').length, color: 'amber' },
                  ].map((s, i) => (
                    <div key={i} className={`p-2 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20 text-center`}>
                      <p className={`text-${s.color}-400 font-bold text-sm`}>{s.value}</p>
                      <p className="text-slate-500 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SYMBOLIC AI TAB */}
        {activeTab === 'symbolic' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-amber-400" />
              Symbolsk Logik Motor — Baseret på Rigtige Data
            </p>

            {isAnalyzing && symbolicRules.length === 0 && (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              </div>
            )}

            {symbolicRules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`mb-2 p-2.5 rounded-xl border ${
                  rule.triggered ? 'bg-amber-500/10 border-amber-500/25' : 'bg-slate-800/30 border-slate-700/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${rule.triggered ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-slate-300 leading-relaxed break-all">{rule.rule}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold ${rule.triggered ? 'text-amber-400' : 'text-slate-600'}`}>
                        {rule.triggered ? '▶ TRIGGERED' : '○ DORMANT'}
                      </span>
                      <span className="text-[9px] text-slate-600">conf: {rule.confidence}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <p className="text-amber-400 font-bold text-sm">{symbolicRules.filter(r => r.triggered).length}</p>
                <p className="text-slate-500 text-[9px]">Aktive regler</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <p className="text-violet-400 font-bold text-sm">{symbolicRules.length}</p>
                <p className="text-slate-500 text-[9px]">Total regler</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <p className="text-cyan-400 font-bold text-sm">
                  {symbolicRules.length > 0 ? `${Math.round(symbolicRules.reduce((a, r) => a + r.confidence, 0) / symbolicRules.length)}%` : '-'}
                </p>
                <p className="text-slate-500 text-[9px]">Avg confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* INTELLIGENCE REPORT TAB */}
        {activeTab === 'report' && (
          <div className="space-y-3">
            {!riskReport && !isAnalyzing && (
              <div className="text-center py-8">
                <Shield className="w-10 h-10 text-violet-400/40 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Kør Deep Fusion for fuld risikorapport</p>
                <Button
                  onClick={runFusionAnalysis}
                  className="bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Aktivér Analyse
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="relative mx-auto w-12 h-12 mb-3">
                  <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                  <Brain className="w-5 h-5 text-amber-400 absolute top-3.5 left-3.5" />
                </div>
                <p className="text-slate-400 text-sm">Mistral AI analyserer rigtige flådedata...</p>
                <p className="text-slate-600 text-xs mt-1">Henter køretøjer, ruter, advarsler og undtagelser</p>
              </div>
            )}

            {riskReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  riskLevel > 70 ? 'bg-red-500/10 border-red-500/25' :
                  riskLevel > 45 ? 'bg-amber-500/10 border-amber-500/25' :
                  'bg-emerald-500/10 border-emerald-500/25'
                }`}>
                  <div>
                    <p className="text-white font-bold">Risk Score</p>
                    <p className="text-slate-400 text-xs">{riskReport.summary}</p>
                  </div>
                  <div className={`text-3xl font-black ${
                    riskLevel > 70 ? 'text-red-400' : riskLevel > 45 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{Math.round(riskLevel)}</div>
                </div>

                {riskReport.sixth_sense_alert && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
                    <p className="text-violet-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> 🔮 Sixth Sense Alert
                    </p>
                    <p className="text-white text-[11px] leading-relaxed">{riskReport.sixth_sense_alert}</p>
                  </div>
                )}

                {riskReport.compound_risks?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> Compound Risici</p>
                    {riskReport.compound_risks.map((r, i) => (
                      <div key={i} className="mb-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-white text-[11px] font-semibold flex-1">{r.scenario}</p>
                          <span className={`text-[10px] font-bold ml-2 ${r.probability > 70 ? 'text-red-400' : r.probability > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{r.probability}%</span>
                        </div>
                        <p className="text-slate-500 text-[9px] mb-1">Impact: {r.impact}</p>
                        {r.inputs && <div className="flex flex-wrap gap-1">{r.inputs.map((inp, j) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">{inp}</span>
                        ))}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {riskReport.hedging_actions?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> Proaktiv Hedging</p>
                    {riskReport.hedging_actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-[11px]">{a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {riskReport.cyber_threats?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1"><Lock className="w-3 h-3 text-red-400" /> Cyber Trusler</p>
                    {riskReport.cyber_threats.map((t, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-[11px]">{t}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => onCommand && onCommand(`Aktivér neuro-symbolsk risikofusion hedge-protokol — implementér top prioritets sikkerhedstiltag baseret på: ${riskReport.hedging_actions?.[0] || 'aktuelle risici'}`)}
                  className="w-full bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
                  size="sm"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Implementér Hedge-Protokol via FLEET AI
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}