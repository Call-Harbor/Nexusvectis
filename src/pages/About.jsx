import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Zap, Target, Users, Globe, Heart, X, Minimize2, TrendingUp, Gauge, Activity, AlertTriangle, CheckCircle, Rocket, Shield, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const FloatingHologramWindow = ({ id, title, icon: Icon, children, onClose, position, isMinimized, onMinimize, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
      onFocus(id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };

  const handlePointerUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ left: pos.x, top: pos.y, zIndex: isFocused ? 9999 : 50, width: '520px' }}
      className="fixed resize overflow-auto"
      onPointerDown={handlePointerDown}
    >
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/40 overflow-hidden flex flex-col relative group h-fit">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" style={{ animationDuration: '3s' }} />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/50 rounded-br-2xl" />
        
        <div className="relative flex flex-col">
          <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-cyan-500/30 cursor-move touch-none bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
                <Icon className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-white font-semibold tracking-wide text-sm">{title}</span>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </motion.div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => onMinimize(id)} className="h-8 w-8 text-cyan-400 hover:text-cyan-300">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onClose(id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 text-sm text-slate-300 max-w-2xl overflow-y-auto max-h-[600px]">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TechInsightChart = ({ data, title, type = 'line' }) => {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.1)" />
            <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} />
            <YAxis stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(6,182,212,0.3)' }} />
            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.1)" />
            <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} />
            <YAxis stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(6,182,212,0.3)' }} />
            <Bar dataKey="value" fill="#06b6d4" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default function About() {
  const [activeWindows, setActiveWindows] = useState([
    'neural-architecture', 'predictive-engine', 'route-optimization', 
    'demand-forecast', 'anomaly-detection'
  ]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [focusedWindow, setFocusedWindow] = useState(null);

  const hologramSections = [
    {
      id: 'neural-architecture',
      title: "Neural Architecture",
      icon: Brain,
      position: { x: 80, y: 200 },
      content: (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-slate-400 text-xs">Multi-layer transformer neural networks processing real-time fleet data with quantum-enhanced embeddings.</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-xs font-semibold text-cyan-400">384 Layers</div>
                  <div className="text-[10px] text-slate-400">Deep Learning</div>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <div className="text-xs font-semibold text-violet-400">2.3B Params</div>
                  <div className="text-[10px] text-slate-400">Model Size</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-400">99.7% Acc</div>
                  <div className="text-[10px] text-slate-400">Accuracy</div>
                </div>
              </div>
            </div>
            <TechInsightChart data={[
              { name: '0h', value: 40 },
              { name: '6h', value: 75 },
              { name: '12h', value: 88 },
              { name: '24h', value: 95 },
              { name: '48h', value: 99 }
            ]} title="Learning Accuracy Over Time" type="line" />
          </div>
        </>
      )
    },
    {
      id: 'predictive-engine',
      title: "Predictive Maintenance",
      icon: Gauge,
      position: { x: 650, y: 150 },
      content: (
        <>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-red-400">Engine Bearing - Truck-4521</span>
                  <Badge className="bg-red-500/20 text-red-400">92% Risk</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Critical: Replace within 48 hours. Estimated cost: €2,400</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400">Transmission Fluid - Truck-3891</span>
                  <Badge className="bg-amber-500/20 text-amber-400">67% Risk</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Urgent: Schedule for next maintenance cycle. Cost: €150</p>
              </div>
              <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-400">Brake Pads - Truck-2103</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400">34% Risk</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Monitor: Next service in 2 weeks. Cost: €280</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500">Estimated prevention of 47 vehicle failures per month • Cost savings: €145k/month</p>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'route-optimization',
      title: "Route Optimization",
      icon: Rocket,
      position: { x: 1200, y: 250 },
      content: (
        <>
          <div className="space-y-4">
            <TechInsightChart data={[
              { name: 'Standard', value: 2400 },
              { name: 'Optimized', value: 1280 },
              { name: 'AI Enhanced', value: 680 }
            ]} title="Distance Optimization (km)" type="bar" />
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs font-semibold text-green-400">+47% Efficiency</div>
                <div className="text-[10px] text-slate-400">vs Traditional</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs font-semibold text-blue-400">3.2ms Solve</div>
                <div className="text-[10px] text-slate-400">Quantum Computing</div>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'demand-forecast',
      title: "Demand Forecasting",
      icon: TrendingUp,
      position: { x: 350, y: 600 },
      content: (
        <>
          <div className="space-y-4">
            <TechInsightChart data={[
              { name: 'Week 1', value: 4200 },
              { name: 'Week 2', value: 4800 },
              { name: 'Week 3', value: 5200 },
              { name: 'Week 4', value: 5800 },
              { name: 'Week 5', value: 6200 }
            ]} title="Forecasted Shipment Volume (Next 30 Days)" type="line" />
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Forecast Accuracy:</span>
                <span className="text-cyan-400 font-semibold">94.3%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[94%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">AI predicts 23% spike in Week 4 based on seasonal patterns and market indicators</p>
          </div>
        </>
      )
    },
    {
      id: 'anomaly-detection',
      title: "Anomaly Detection",
      icon: AlertTriangle,
      position: { x: 900, y: 700 },
      content: (
        <>
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-red-400">Unusual Route Deviation</span>
                  <CheckCircle className="w-3 h-3 text-red-400" />
                </div>
                <p className="text-[11px] text-slate-400">Truck-1924 deviated 180km from optimal route. Automatic alert sent.</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-amber-400">Extreme Temperature Variance</span>
                  <CheckCircle className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400">Cold chain breach detected on shipment #SHP-48291. Contacted customer.</p>
              </div>
              <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-cyan-400">Driver Fatigue Pattern</span>
                  <CheckCircle className="w-3 h-3 text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400">Driver #DRV-3421 showing fatigue signs. Recommended break scheduled.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500">Real-time detection: 2.3M events/sec • Detection latency: &lt;100ms</p>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'co2-analysis',
      title: "Sustainability Analytics",
      icon: Heart,
      position: { x: 100, y: 900 },
      content: (
        <>
          <div className="space-y-4">
            <TechInsightChart data={[
              { name: 'Jan', value: 2400 },
              { name: 'Feb', value: 2100 },
              { name: 'Mar', value: 1800 },
              { name: 'Apr', value: 1400 },
              { name: 'May', value: 950 }
            ]} title="CO₂ Emissions Reduction (Tonnes/Month)" type="line" />
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-semibold text-emerald-400">78% Reduction</div>
                <div className="text-[10px] text-slate-400">vs 2023</div>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs font-semibold text-green-400">25,000 EVs</div>
                <div className="text-[10px] text-slate-400">In Fleet</div>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'swarm-intelligence',
      title: "Swarm Coordination",
      icon: Network,
      position: { x: 650, y: 950 },
      content: (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-slate-400 text-xs">Autonomous multi-agent system coordinating 50,000+ vehicles with minimal latency.</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-xs font-semibold text-purple-400">50K Agents</div>
                  <div className="text-[10px] text-slate-400">Active</div>
                </div>
                <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <div className="text-xs font-semibold text-pink-400">2.1ms Sync</div>
                  <div className="text-[10px] text-slate-400">Consensus</div>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="text-xs font-semibold text-indigo-400">99.2% Uptime</div>
                  <div className="text-[10px] text-slate-400">Network</div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500">Decentralized decision making • No single point of failure • Self-healing network</p>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'security-ops',
      title: "Security & Compliance",
      icon: Shield,
      position: { x: 1350, y: 850 },
      content: (
        <>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-slate-400 text-xs">Military-grade encryption with blockchain verification.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs font-semibold text-blue-400">AES-256</div>
                  <div className="text-[10px] text-slate-400">Encryption</div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-xs font-semibold text-orange-400">SHA-3</div>
                  <div className="text-[10px] text-slate-400">Hashing</div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Zero Security Breaches</span>
              </div>
              <p className="text-[10px] text-slate-400">15 consecutive years without compromise</p>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500">ISO 27001 • SOC 2 Type II • GDPR Compliant</p>
            </div>
          </div>
        </>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      // Stagger window opening throughout scroll
      const windowsToShow = [];
      if (scrollPercent > 5) windowsToShow.push('neural-architecture');
      if (scrollPercent > 15) windowsToShow.push('predictive-engine');
      if (scrollPercent > 25) windowsToShow.push('route-optimization');
      if (scrollPercent > 40) windowsToShow.push('demand-forecast');
      if (scrollPercent > 55) windowsToShow.push('anomaly-detection');
      if (scrollPercent > 70) windowsToShow.push('co2-analysis');
      if (scrollPercent > 80) windowsToShow.push('swarm-intelligence');
      if (scrollPercent > 90) windowsToShow.push('security-ops');
      
      setActiveWindows(windowsToShow);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCloseWindow = (id) => {
    setActiveWindows(prev => prev.filter(wid => wid !== id));
  };

  const handleMinimizeWindow = (id) => {
    setMinimizedWindows(prev => new Set([...prev, id]));
  };

  const handleFocusWindow = (id) => {
    setFocusedWindow(id);
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/40" />
        <motion.div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]" animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]" animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,182,212,0.03)_1px,transparent_2px)]" style={{ backgroundSize: '100% 2px' }} animate={{ backgroundPosition: ['0 0', '0 20px'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      </div>

      <AnimatePresence>
        {activeWindows.map(windowId => {
          const hologram = hologramSections.find(h => h.id === windowId);
          if (!hologram) return null;
          return (
            <FloatingHologramWindow
              key={windowId}
              id={windowId}
              title={hologram.title}
              icon={hologram.icon}
              position={hologram.position}
              onClose={handleCloseWindow}
              onMinimize={handleMinimizeWindow}
              isMinimized={minimizedWindows.has(windowId)}
              isFocused={focusedWindow === windowId}
              onFocus={handleFocusWindow}
            >
              {hologram.content}
            </FloatingHologramWindow>
          );
        })}
      </AnimatePresence>

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-center max-w-4xl">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="inline-block mb-6">
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            <h1 className="text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight">NexusVectis</h1>
            <p className="text-2xl text-slate-300 mb-8">Enterprise AI for Global Logistics Dominance</p>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-cyan-400 text-sm mt-20">Scroll to initialize hologram analysis →</motion.div>
          </motion.div>
        </section>

        {hologramSections.map((_, idx) => (
          <section key={idx} className="min-h-screen flex items-center justify-center" />
        ))}

        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center max-w-2xl">
            <h2 className="text-4xl font-black text-white mb-6">Powering the Future of Logistics</h2>
            <p className="text-xl text-slate-400 mb-8">AI-driven intelligence that transforms fleet operations into autonomous, self-optimizing networks. Experience 47% efficiency gains and 78% CO₂ reduction.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50">
              Request Demo
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}