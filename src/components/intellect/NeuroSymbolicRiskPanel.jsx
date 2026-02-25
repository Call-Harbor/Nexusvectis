import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Shield, Brain, Zap, Activity, AlertTriangle,
  TrendingUp, CheckCircle, Loader2, Eye, Lock, RefreshCw,
  Syringe, Heart, FlaskConical, Microscope, Dna, Radiation
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// ═══════════════════════════════════════════════════
// IMMUNE CELL CANVAS — bloodstream with live cells
// ═══════════════════════════════════════════════════
const ImmuneSystemCanvas = ({ riskLevel, immunityLog = [] }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ cells: [], pathogens: [], antibodies: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 340;
    const H = 200;
    canvas.width = W;
    canvas.height = H;

    // Generate blood cells
    const cells = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 6 + Math.random() * 5,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.6,
      type: i < 18 ? 'rbc' : i < 24 ? 'wbc' : 'platelet', // red blood, white blood, platelet
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.02,
    }));

    // Generate pathogens based on risk
    const pathogenCount = Math.round((riskLevel / 100) * 12);
    const pathogens = Array.from({ length: pathogenCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 4 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      spikes: 6 + Math.floor(Math.random() * 4),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      detected: false,
    }));

    // Antibodies
    const antibodies = Array.from({ length: 8 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      targetX: Math.random() * W,
      targetY: Math.random() * H,
      speed: 1.5 + Math.random(),
      active: Math.random() > 0.4,
      pulse: Math.random() * Math.PI * 2,
    }));

    stateRef.current = { cells, pathogens, antibodies };

    const drawCell = (x, y, r, type, alpha, pulse) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      if (type === 'rbc') {
        // Red blood cell — biconcave disc look
        const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
        grad.addColorStop(0, '#7f1d1d');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#ef4444aa');
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Center dip
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7f1d1d88';
        ctx.fill();
      } else if (type === 'wbc') {
        // White blood cell — irregular with nucleus
        const glow = 0.5 + Math.sin(pulse) * 0.2;
        const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r * 1.4);
        grad.addColorStop(0, `rgba(139,92,246,${glow})`);
        grad.addColorStop(0.5, `rgba(109,40,217,${glow * 0.6})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#6d28d9cc';
        ctx.fill();
        // Nucleus
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.1, r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      } else {
        // Platelet — small star-like
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b99';
        ctx.fill();
      }
      ctx.restore();
    };

    const drawPathogen = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Virus body
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 1.5);
      grad.addColorStop(0, p.detected ? '#ef4444' : '#f97316');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.detected ? '#ef4444cc' : '#f97316cc';
      ctx.fill();
      // Spikes
      for (let s = 0; s < p.spikes; s++) {
        const angle = (s / p.spikes) * Math.PI * 2;
        const sx = Math.cos(angle) * (p.r + 4);
        const sy = Math.sin(angle) * (p.r + 4);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * p.r, Math.sin(angle) * p.r);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = p.detected ? '#fca5a5' : '#fdba74';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.detected ? '#fca5a5' : '#fdba74';
        ctx.fill();
      }
      ctx.restore();
    };

    const drawAntibody = (ab) => {
      if (!ab.active) return;
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(ab.pulse) * 0.3;
      // Y-shape antibody
      const stemLen = 8;
      const armLen = 6;
      const angle = Math.atan2(ab.targetY - ab.y, ab.targetX - ab.x);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      // Stem
      ctx.beginPath();
      ctx.moveTo(ab.x, ab.y);
      ctx.lineTo(ab.x + Math.cos(angle) * stemLen, ab.y + Math.sin(angle) * stemLen);
      ctx.stroke();
      // Two arms
      const perpAngle1 = angle + Math.PI / 4;
      const perpAngle2 = angle - Math.PI / 4;
      const tipX = ab.x + Math.cos(angle) * stemLen;
      const tipY = ab.y + Math.sin(angle) * stemLen;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(perpAngle1) * armLen, tipY + Math.sin(perpAngle1) * armLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(perpAngle2) * armLen, tipY + Math.sin(perpAngle2) * armLen);
      ctx.stroke();
      // Binding tips
      ctx.beginPath();
      ctx.arc(tipX + Math.cos(perpAngle1) * armLen, tipY + Math.sin(perpAngle1) * armLen, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tipX + Math.cos(perpAngle2) * armLen, tipY + Math.sin(perpAngle2) * armLen, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.restore();
    };

    const drawBloodVessel = () => {
      // Top and bottom vessel walls
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, 'rgba(127,29,29,0.3)');
      gradient.addColorStop(0.15, 'rgba(127,29,29,0.05)');
      gradient.addColorStop(0.85, 'rgba(127,29,29,0.05)');
      gradient.addColorStop(1, 'rgba(127,29,29,0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Vessel walls
      ctx.strokeStyle = 'rgba(185,28,28,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(W, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H - 8); ctx.lineTo(W, H - 8); ctx.stroke();
    };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      drawBloodVessel();

      const { cells, pathogens, antibodies } = stateRef.current;

      // Move cells
      cells.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.pulse += c.pulseSpeed;
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        if (c.y < 8 + c.r) { c.y = 8 + c.r; c.vy = Math.abs(c.vy); }
        if (c.y > H - 8 - c.r) { c.y = H - 8 - c.r; c.vy = -Math.abs(c.vy); }
        drawCell(c.x, c.y, c.r, c.type, 0.85, c.pulse);
      });

      // Move pathogens
      pathogens.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 8 || p.y > H - 8) p.vy *= -1;

        // WBC detection radius
        cells.filter(c => c.type === 'wbc').forEach(wbc => {
          const dx = wbc.x - p.x;
          const dy = wbc.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            p.detected = true;
            // WBC chases pathogen
            wbc.vx += dx * 0.005;
            wbc.vy += dy * 0.005;
          }
        });

        drawPathogen(p);
      });

      // Move antibodies
      antibodies.forEach(ab => {
        if (!ab.active) return;
        ab.pulse += 0.06;
        const dx = ab.targetX - ab.x;
        const dy = ab.targetY - ab.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          ab.x += (dx / dist) * ab.speed;
          ab.y += (dy / dist) * ab.speed;
        } else {
          ab.targetX = Math.random() * W;
          ab.targetY = 8 + Math.random() * (H - 16);
        }
        drawAntibody(ab);
      });

      // Immunity field pulse
      if (riskLevel < 40) {
        const pulseAlpha = 0.03 + Math.sin(frame * 0.03) * 0.02;
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
        grad.addColorStop(0, `rgba(16,185,129,${pulseAlpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [riskLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ height: 200, background: 'rgba(127,29,29,0.08)', border: '1px solid rgba(185,28,28,0.2)' }}
    />
  );
};

// ═══════════════════════════════════════════════════
// IMMUNITY LAYER DISPLAY
// ═══════════════════════════════════════════════════
const ImmunityLayer = ({ layer, isActive, response }) => {
  const configs = {
    innate: {
      name: 'Innate Immune System',
      subtitle: 'First line of defense',
      icon: Shield,
      color: 'amber',
      description: 'Fast, non-specific response. Activated within minutes.',
      cells: ['Neutrophils', 'Macrophages', 'NK Cells'],
    },
    adaptive: {
      name: 'Adaptive Immune System',
      subtitle: 'Second line of defense',
      icon: Dna,
      color: 'violet',
      description: 'Specific response. Learns and remembers threats. Activated over hours.',
      cells: ['T-Cells', 'B-Cells', 'Antibodies'],
    },
    memory: {
      name: 'Immune Memory',
      subtitle: 'Long-term protection',
      icon: Brain,
      color: 'cyan',
      description: 'Remembers past threats. Faster response on repeated attacks.',
      cells: ['Memory Cells', 'SecurityAudit Log', 'Antigen Profiles'],
    },
  };
  const cfg = configs[layer];
  const Icon = cfg.icon;
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/25', text: 'text-violet-400', dot: 'bg-violet-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  };
  const c = colorMap[cfg.color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-3 ${isActive ? `${c.bg} ${c.border}` : 'bg-slate-900/40 border-slate-800/40'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isActive ? c.bg : 'bg-slate-800/60'} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${isActive ? c.text : 'text-slate-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-xs font-bold ${isActive ? c.text : 'text-slate-500'}`}>{cfg.name}</p>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? `${c.dot} animate-pulse` : 'bg-slate-700'}`} />
              <span className={`text-[9px] font-mono ${isActive ? c.text : 'text-slate-600'}`}>
                {isActive ? 'AKTIV' : 'STANDBY'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">{cfg.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {cfg.cells.map((cell, i) => (
              <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                isActive ? `${c.bg} ${c.border} ${c.text}` : 'bg-slate-800/40 border-slate-700/40 text-slate-600'
              }`}>{cell}</span>
            ))}
          </div>
          {response && (
            <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-800/40 rounded-lg px-2 py-1.5 border border-slate-700/30">
              {response}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════
// THREAT PATHOGEN CARD
// ═══════════════════════════════════════════════════
const PathogenCard = ({ signal, index }) => {
  const sevConfig = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400', dot: 'bg-red-400', label: 'CRITICAL PATHOGEN' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400', dot: 'bg-orange-400', label: 'HIGH THREAT' },
    medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400', label: 'MODERATE THREAT' },
    low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'LOW THREAT' },
  };
  const cfg = sevConfig[signal.severity] || sevConfig.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`p-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${cfg.dot} ${signal.severity === 'critical' ? 'animate-pulse' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={`text-[9px] font-black tracking-wider ${cfg.text}`}>{cfg.label}</span>
            <span className="text-[9px] text-slate-600 font-mono">{signal.confidence}% match</span>
          </div>
          <p className={`text-[10px] font-semibold ${cfg.text} mb-0.5`}>[{signal.source}]</p>
          <p className="text-slate-300 text-[10px] leading-relaxed">{signal.signal}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function NeuroSymbolicRiskPanel({ vehicles = [], routes = [], onCommand }) {
  const [activeTab, setActiveTab] = useState('bloodstream');
  const [riskLevel, setRiskLevel] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState(null);
  const [realSignals, setRealSignals] = useState([]);
  const [symbolicRules, setSymbolicRules] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [immunityLog, setImmunityLog] = useState([]);
  const [heartbeat, setHeartbeat] = useState(0);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setHeartbeat(h => h + 1), 1200);
    return () => clearInterval(t);
  }, []);

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
      const response = await base44.functions.invoke('neuroRiskFusion', { organization_id: user?.organization_id });
      const data = response.data;
      if (data.error) throw new Error(data.error);
      setRealSignals(data.real_signals || []);
      setSymbolicRules(data.symbolic_rules || []);
      setFleetSummary(data.fleet_summary);
      setRiskReport(data.ai_report);
      setRiskLevel(data.risk_score || data.ai_report?.overall_risk_score || 20);
    } catch (e) {
      console.error('Immunity analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const riskColor = riskLevel > 70 ? 'red' : riskLevel > 45 ? 'amber' : 'emerald';
  const immuneStatus = riskLevel > 70 ? 'CYTOKINE STORM' : riskLevel > 45 ? 'INFLAMMATION' : 'HOMEOSTASIS';
  const immuneStatusColor = riskLevel > 70 ? 'text-red-400' : riskLevel > 45 ? 'text-amber-400' : 'text-emerald-400';
  const immuneStatusBg = riskLevel > 70 ? 'from-red-900/30 to-slate-950' : riskLevel > 45 ? 'from-amber-900/20 to-slate-950' : 'from-emerald-900/20 to-slate-950';

  const criticalCount = realSignals.filter(s => s.severity === 'critical').length;
  const highCount = realSignals.filter(s => s.severity === 'high').length;

  const innateActive = riskLevel > 20 || criticalCount > 0 || highCount > 0;
  const adaptiveActive = riskLevel > 40 || criticalCount > 0;
  const memoryActive = true; // Always active — logs to SecurityAudit

  const tabs = [
    { id: 'bloodstream', label: 'Bloodstream', icon: Heart },
    { id: 'pathogens', label: 'Threats', icon: Radiation },
    { id: 'layers', label: 'Defense', icon: Shield },
    { id: 'dna', label: 'Intelligence', icon: Dna },
  ];

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b ${immuneStatusBg} overflow-hidden`}>

      {/* ── HEADER: Vital Signs ─────────────────────── */}
      <div className={`flex-shrink-0 p-3 border-b ${
        riskLevel > 70 ? 'border-red-900/40' : riskLevel > 45 ? 'border-amber-900/30' : 'border-emerald-900/20'
      }`}>
        {/* Title row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {/* Heartbeat icon */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.6 }}
            >
              <Heart className={`w-4 h-4 ${riskLevel > 70 ? 'text-red-500' : riskLevel > 45 ? 'text-amber-400' : 'text-emerald-400'} fill-current`} />
            </motion.div>
            <div>
              <p className="text-[11px] font-black text-white tracking-widest uppercase">Fleet Immunforsvar</p>
              <p className="text-[8px] text-slate-500 font-mono tracking-wider">Autonomous · Human-Like · Self-Healing</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${immuneStatusColor}`}>{Math.round(riskLevel)}</p>
            <p className={`text-[9px] font-bold tracking-widest ${immuneStatusColor}`}>{immuneStatus}</p>
          </div>
        </div>

        {/* Vital signs bar — ECG-like */}
        <div className="relative h-8 mb-2 overflow-hidden rounded-lg bg-slate-950/60 border border-slate-800/40">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 32" preserveAspectRatio="none">
            {/* ECG trace */}
            <motion.path
              d={`M0,16 L40,16 L50,16 L55,4 L60,28 L65,10 L70,16 L110,16 L120,16 L125,4 L130,28 L135,10 L140,16 L180,16 L190,16 L195,${riskLevel > 70 ? 2 : riskLevel > 45 ? 6 : 8} L200,${riskLevel > 70 ? 30 : riskLevel > 45 ? 26 : 24} L205,${riskLevel > 70 ? 5 : riskLevel > 45 ? 9 : 11} L210,16 L260,16 L270,16 L275,4 L280,28 L285,10 L290,16 L340,16`}
              fill="none"
              stroke={riskLevel > 70 ? '#ef4444' : riskLevel > 45 ? '#f59e0b' : '#10b981'}
              strokeWidth="1.5"
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              strokeDasharray="200"
            />
          </svg>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <motion.div
              className={`w-1.5 h-1.5 rounded-full ${riskLevel > 70 ? 'bg-red-400' : riskLevel > 45 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[8px] font-mono text-slate-500">LIVE</span>
          </div>
        </div>

        {/* Fleet vitals */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'T-Cells', sublabel: 'Active vehicles', value: fleetSummary?.vehicles_total ?? '—', color: 'emerald' },
            { label: 'NK-Cells', sublabel: 'Threats detected', value: criticalCount + highCount, color: criticalCount > 0 ? 'red' : 'amber' },
            { label: 'Antibodies', sublabel: 'Auto-actions', value: fleetSummary?.alerts_critical ?? '—', color: 'violet' },
            { label: 'Cytokines', sublabel: 'Offline units', value: fleetSummary?.vehicles_offline ?? '—', color: fleetSummary?.vehicles_offline > 0 ? 'red' : 'emerald' },
          ].map((v, i) => (
            <div key={i} className={`p-1.5 rounded-lg text-center border ${
              v.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
              v.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
              v.color === 'violet' ? 'bg-violet-500/10 border-violet-500/20' :
              'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <p className={`text-sm font-black ${
                v.color === 'red' ? 'text-red-400' :
                v.color === 'amber' ? 'text-amber-400' :
                v.color === 'violet' ? 'text-violet-400' : 'text-emerald-400'
              }`}>{v.value}</p>
              <p className="text-[8px] text-slate-600 font-mono">{v.label}</p>
            </div>
          ))}
        </div>

        {/* Refresh + status */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-mono font-bold">IMMUNITY ENGINE ACTIVE · 10min cycle</span>
          </div>
          <button
            onClick={runFusionAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isAnalyzing
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />
            }
            {isAnalyzing ? 'Analyserer...' : 'Opdater'}
          </button>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────── */}
      <div className="flex-shrink-0 flex border-b border-slate-800/50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? riskLevel > 70 ? 'text-red-400 border-b-2 border-red-400 bg-red-500/5'
                    : riskLevel > 45 ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                    : 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

        {/* BLOODSTREAM TAB */}
        {activeTab === 'bloodstream' && (
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-slate-600 font-mono mb-1.5 uppercase tracking-widest">
                Fleet Bloodstream — Immunological Overview
              </p>
              {isAnalyzing && !fleetSummary ? (
                <div className="flex items-center justify-center h-48 rounded-xl bg-red-900/10 border border-red-900/20">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 text-red-400/60 animate-spin mx-auto mb-2" />
                    <p className="text-[10px] text-slate-600 font-mono">Analyzing blood sample...</p>
                  </div>
                </div>
              ) : (
                <ImmuneSystemCanvas riskLevel={riskLevel} />
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { color: 'bg-red-600', label: 'Red Blood Cells', sub: 'Active vehicles' },
                { color: 'bg-violet-500', label: 'White Blood Cells', sub: 'AI immune response' },
                { color: riskLevel > 30 ? 'bg-orange-500' : 'bg-slate-700', label: 'Pathogens', sub: `${criticalCount + highCount} threats` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/30">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold leading-tight">{item.label}</p>
                    <p className="text-[8px] text-slate-600">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Homeostasis indicator */}
            <div className={`p-3 rounded-xl border ${
              riskLevel > 70 ? 'bg-red-500/10 border-red-500/20' :
              riskLevel > 45 ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${immuneStatusColor}`}>
                  Homeostasis Balance
                </p>
                <span className={`text-[9px] font-mono ${immuneStatusColor}`}>{immuneStatus}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    riskLevel > 70 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                    riskLevel > 45 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  animate={{ width: `${riskLevel}%` }}
                  transition={{ duration: 1, type: 'spring' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-emerald-500/60 font-mono">NOMINAL</span>
                <span className="text-[8px] text-amber-500/60 font-mono">INFLAMMATION</span>
                <span className="text-[8px] text-red-500/60 font-mono">CYTOKINE STORM</span>
              </div>
            </div>
          </div>
        )}

        {/* PATHOGENS TAB */}
        {activeTab === 'pathogens' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
                Detected Pathogens & Threats
              </p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] text-red-400 font-mono">{realSignals.length} found</span>
              </div>
            </div>

            {isAnalyzing && realSignals.length === 0 && (
              <div className="text-center py-8">
                <Microscope className="w-8 h-8 text-violet-400/40 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] text-slate-600">Scanning fleet blood sample...</p>
              </div>
            )}

            {!isAnalyzing && realSignals.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 text-sm font-bold">No pathogens detected</p>
                <p className="text-slate-600 text-[10px] mt-1">Fleet is immune and running nominally</p>
              </div>
            )}

            <div className="space-y-2">
              {realSignals.map((s, i) => (
                <PathogenCard key={i} signal={s} index={i} />
              ))}
            </div>

            {realSignals.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {[
                  { label: 'Critical', value: criticalCount, color: 'red' },
                  { label: 'High', value: highCount, color: 'orange' },
                  { label: 'Medium', value: realSignals.filter(s => s.severity === 'medium').length, color: 'amber' },
                  { label: 'Low', value: realSignals.filter(s => s.severity === 'low').length, color: 'emerald' },
                ].map((s, i) => (
                  <div key={i} className={`p-2 rounded-lg text-center border ${
                    s.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                    s.color === 'orange' ? 'bg-orange-500/10 border-orange-500/20' :
                    s.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <p className={`font-black text-sm ${
                      s.color === 'red' ? 'text-red-400' :
                      s.color === 'orange' ? 'text-orange-400' :
                      s.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{s.value}</p>
                    <p className="text-[9px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEFENSE LAYERS TAB */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-2">
              Immune System Defense Layers
            </p>

            <ImmunityLayer
              layer="innate"
              isActive={innateActive}
              response={innateActive
                ? `Rapid response activated. ${criticalCount} critical threats being neutralized. Offline vehicles flagged for quarantine. Low-fuel alerts dispatched.`
                : null
              }
            />
            <ImmunityLayer
              layer="adaptive"
              isActive={adaptiveActive}
              response={adaptiveActive
                ? `Mistral AI analyzing threat patterns. Antibody generation initiated. Cascade risks evaluated. Targeted countermeasures being deployed.`
                : null
              }
            />
            <ImmunityLayer
              layer="memory"
              isActive={memoryActive}
              response="All immunity cycles logged to SecurityAudit. Threat patterns stored and used for faster response on future attacks."
            />

            {/* Symbolic rules */}
            {symbolicRules.length > 0 && (
              <div className="mt-3">
                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-2">
                  Symbolic Immune Rules ({symbolicRules.filter(r => r.triggered).length}/{symbolicRules.length} active)
                </p>
                <div className="space-y-1.5">
                  {symbolicRules.slice(0, 6).map((rule, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-[10px] ${
                      rule.triggered ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/30 border-slate-800/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${rule.triggered ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                      <p className={`font-mono text-[9px] leading-relaxed ${rule.triggered ? 'text-amber-300' : 'text-slate-600'}`}>{rule.rule}</p>
                      <span className={`text-[8px] flex-shrink-0 ${rule.triggered ? 'text-amber-400' : 'text-slate-700'}`}>{rule.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DNA / INTELLIGENCE TAB */}
        {activeTab === 'dna' && (
          <div className="space-y-3">
            {!riskReport && !isAnalyzing && (
              <div className="text-center py-10">
                <FlaskConical className="w-10 h-10 text-violet-400/30 mx-auto mb-3" />
                <p className="text-slate-500 text-xs mb-3">Activate DNA analysis for full immune profile</p>
                <Button
                  onClick={runFusionAnalysis}
                  className="bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30"
                  size="sm"
                >
                  <Dna className="w-4 h-4 mr-2" />
                  Analyze DNA
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-10">
                <div className="relative mx-auto w-14 h-14 mb-4">
                  <motion.div
                    className="w-14 h-14 rounded-full border-2 border-violet-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                  <Dna className="w-6 h-6 text-violet-400 absolute top-4 left-4" />
                </div>
                <p className="text-slate-400 text-xs">Mistral AI sequencing fleet DNA...</p>
                <p className="text-slate-600 text-[10px] mt-1">Analyzing vehicles, routes, exceptions & maintenance</p>
              </div>
            )}

            {riskReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* DNA Summary */}
                <div className={`p-3 rounded-xl border ${
                  riskLevel > 70 ? 'bg-red-500/10 border-red-500/20' :
                  riskLevel > 45 ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white text-xs font-bold flex items-center gap-1.5">
                      <Dna className={`w-3.5 h-3.5 ${immuneStatusColor}`} />
                      Immunologisk DNA-profil
                    </p>
                    <span className={`text-xl font-black ${immuneStatusColor}`}>{Math.round(riskLevel)}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{riskReport.summary}</p>
                </div>

                {riskReport.sixth_sense_alert && (
                  <div className="p-3 rounded-xl bg-violet-900/20 border border-violet-500/25">
                    <p className="text-violet-400 text-[10px] font-black uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                      <Eye className="w-3 h-3" /> Sjette Sans — Præ-Immun Signal
                    </p>
                    <p className="text-slate-200 text-[11px] leading-relaxed">{riskReport.sixth_sense_alert}</p>
                  </div>
                )}

                {riskReport.compound_risks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Kaskade-Risici (Cytokinstorm-scenarier)
                    </p>
                    <div className="space-y-2">
                      {riskReport.compound_risks.map((r, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/40">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-slate-200 text-[11px] font-semibold flex-1">{r.scenario}</p>
                            <span className={`text-xs font-black flex-shrink-0 ${r.probability > 70 ? 'text-red-400' : r.probability > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{r.probability}%</span>
                          </div>
                          <p className="text-slate-500 text-[9px]">{r.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {riskReport.hedging_actions?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Syringe className="w-3 h-3" /> Immunterapi — Proaktive Foranstaltninger
                    </p>
                    <div className="space-y-1.5">
                      {riskReport.hedging_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                          <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-300 text-[11px] leading-relaxed">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => onCommand && onCommand(`Aktivér immunterapi-protokol — implementér alle proaktive hedging foranstaltninger: ${riskReport.hedging_actions?.slice(0,2).join(', ')}`)}
                  className={`w-full border ${
                    riskLevel > 70
                      ? 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30'
                      : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30'
                  }`}
                  size="sm"
                >
                  <Syringe className="w-3.5 h-3.5 mr-1.5" />
                  Injicér Immunterapi via FLEET AI
                </Button>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}