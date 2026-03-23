import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Activity, Brain, Sparkles, TrendingUp, AlertTriangle, 
  Radio, Cpu, Shield, Target, Orbit, Network, Zap, Eye, Layers,
  ChevronRight, Satellite
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardGlobeFrame from "@/components/holographic/DashboardGlobeFrame";
import AIInsightWidget from "@/components/ai/AIInsightWidget";

// Floating particle component
function Particle({ delay, duration, x, size, color }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        left: `${x}%`,
        bottom: '-10px',
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }}
      animate={{
        y: [0, -window.innerHeight - 50],
        opacity: [0, 0.8, 0.8, 0],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Animated number counter
function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const step = Math.max(1, Math.floor(end / 20));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// Stat Card
function StatCard({ icon: Icon, label, value, suffix = "", color, delay = 0, sub }) {
  const colorMap = {
    cyan: { border: 'border-cyan-500/40', bg: 'from-cyan-500/10', icon: 'text-cyan-400', glow: 'shadow-cyan-500/20', bar: 'from-cyan-500 to-cyan-300', sweep: 'via-cyan-400/30' },
    violet: { border: 'border-violet-500/40', bg: 'from-violet-500/10', icon: 'text-violet-400', glow: 'shadow-violet-500/20', bar: 'from-violet-500 to-violet-300', sweep: 'via-violet-400/30' },
    emerald: { border: 'border-emerald-500/40', bg: 'from-emerald-500/10', icon: 'text-emerald-400', glow: 'shadow-emerald-500/20', bar: 'from-emerald-500 to-emerald-300', sweep: 'via-emerald-400/30' },
    amber: { border: 'border-amber-500/40', bg: 'from-amber-500/10', icon: 'text-amber-400', glow: 'shadow-amber-500/20', bar: 'from-amber-500 to-amber-300', sweep: 'via-amber-400/30' },
    pink: { border: 'border-pink-500/40', bg: 'from-pink-500/10', icon: 'text-pink-400', glow: 'shadow-pink-500/20', bar: 'from-pink-500 to-pink-300', sweep: 'via-pink-400/30' },
    red: { border: 'border-red-500/50', bg: 'from-red-500/15', icon: 'text-red-400', glow: 'shadow-red-500/20', bar: 'from-red-500 to-red-300', sweep: 'via-red-400/30' },
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.04, y: -3 }}
      className={`relative p-3 rounded-xl bg-gradient-to-br ${c.bg} to-transparent backdrop-blur-xl border ${c.border} overflow-hidden shadow-lg ${c.glow} cursor-default`}
    >
      {/* Sweep animation */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r from-transparent ${c.sweep} to-transparent`}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay }}
      />
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl ${c.bar} opacity-20 rounded-bl-2xl`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
          <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
        </div>
        <p className={`text-2xl font-black ${c.icon} tabular-nums`}>
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  // Live ticker
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if ((window.scrollY || document.documentElement.scrollTop) > 300) {
        setSelectedVehicle(null); setSelectedResource(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { navigate(createPageUrl("Landing")); return; }
        const user = await base44.auth.me();
        let id = user?.organization_id || user?.data?.organization_id;
        if (!id) {
          // Try to auto-assign org from invite
          const result = await base44.functions.invoke('assignOrganizationOnFirstLogin', {});
          if (result?.data?.needsOrganization === false && result?.data?.organization_id) {
            id = result.data.organization_id;
          } else {
            navigate(createPageUrl("OrganizationSetup")); return;
          }
        }
        setOrgId(id);
      } catch { navigate(createPageUrl("Landing")); }
    };
    checkAuth();
  }, [navigate]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', orgId], queryFn: () => base44.entities.Vehicle.filter({ organization_id: orgId }),
    enabled: !!orgId, refetchInterval: 10000,
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['routes', orgId], queryFn: () => base44.entities.Route.filter({ organization_id: orgId }),
    enabled: !!orgId, refetchInterval: 15000,
  });
  const { data: resources = [] } = useQuery({
    queryKey: ['resources', orgId], queryFn: () => base44.entities.Resource.filter({ organization_id: orgId }),
    enabled: !!orgId, refetchInterval: 20000,
  });
  const { data: digitalTwins = [] } = useQuery({
    queryKey: ['digitalTwins', orgId], queryFn: () => base44.entities.DigitalTwin.filter({ organization_id: orgId }),
    enabled: !!orgId, refetchInterval: 20000,
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', orgId], queryFn: () => base44.entities.Alert.filter({ organization_id: orgId }, '-created_date', 10),
    enabled: !!orgId, refetchInterval: 15000,
  });
  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions', orgId], queryFn: () => base44.entities.Exception.filter({ organization_id: orgId, status: { $ne: 'resolved' } }, '-created_date', 5),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Bus.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  const { data: busRoutes = [] } = useQuery({
    queryKey: ['busRoutes', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusRoute.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: busStops = [] } = useQuery({
    queryKey: ['busStops', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusStop.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 20000,
  });

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const avgEfficiency = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.efficiency_score || 0), 0) / vehicles.length) : 0;
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.is_resolved).length;
  const criticalExceptions = exceptions.filter(e => e.severity === 'critical').length;
  const aiOptimizedRoutes = routes.filter(r => r.ai_optimized).length;
  const networkHealth = vehicles.length > 0
    ? Math.round(vehicles.filter(v => v.status === 'active' || v.status === 'idle').length / vehicles.length * 100) : 0;

  // Particles config
  const particles = [
    { delay: 0, duration: 8, x: 10, size: 3, color: 'rgba(6,182,212,0.7)' },
    { delay: 1.5, duration: 11, x: 25, size: 2, color: 'rgba(139,92,246,0.6)' },
    { delay: 3, duration: 9, x: 40, size: 4, color: 'rgba(6,182,212,0.5)' },
    { delay: 0.5, duration: 13, x: 55, size: 2, color: 'rgba(236,72,153,0.5)' },
    { delay: 2, duration: 10, x: 70, size: 3, color: 'rgba(139,92,246,0.7)' },
    { delay: 4, duration: 12, x: 85, size: 2, color: 'rgba(6,182,212,0.6)' },
    { delay: 1, duration: 7, x: 92, size: 3, color: 'rgba(16,185,129,0.5)' },
    { delay: 3.5, duration: 14, x: 5, size: 2, color: 'rgba(245,158,11,0.4)' },
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* === BACKGROUND LAYERS === */}
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020818] via-[#050d1a] to-black" />
      
      {/* Animated aurora */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(6,182,212,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse 80% 50% at 70% 20%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 70%, rgba(6,182,212,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(6,182,212,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.12) 0%, transparent 60%)',
          ]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Holographic grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Scan line sweep */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"
        animate={{ top: ['-2px', '100vh'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => <Particle key={i} {...p} />)}
      </div>

      {/* === HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 left-0 right-0 z-50"
      >
        <div className="relative bg-gradient-to-b from-black/98 via-black/85 to-transparent backdrop-blur-2xl border-b border-cyan-500/20">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          <div className="px-4 sm:px-6 py-3">
            {/* Main header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Logo */}
                <motion.div className="relative flex-shrink-0"
                  animate={{ boxShadow: ['0 0 15px rgba(6,182,212,0.3)', '0 0 30px rgba(139,92,246,0.5)', '0 0 15px rgba(6,182,212,0.3)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40">
                    <Globe className="w-7 h-7 text-cyan-400" />
                  </div>
                  <motion.div className="absolute -inset-1 rounded-2xl border border-cyan-400/20"
                    animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div className="absolute -inset-2 rounded-2xl border border-violet-400/10"
                    animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                <div>
                  <div className="flex items-center gap-2">
                    <motion.h1
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee)', backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      animate={{ backgroundPosition: ['0%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      NexusVectis
                    </motion.h1>
                    <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-400/30 text-[9px] px-1.5 py-0.5 animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Brain className="w-3 h-3 text-violet-400" />
                    Neural Fleet Intelligence · AI-Powered Operations
                  </p>
                </div>
              </div>

              {/* Right: clock + status */}
              <div className="flex items-center gap-3">
                {/* Live clock */}
                <div className="hidden sm:block text-right">
                  <motion.p className="text-sm font-mono font-bold text-cyan-400 tabular-nums" key={tick}>
                    {timeStr}
                  </motion.p>
                  <p className="text-[10px] text-slate-500 font-mono">{dateStr}</p>
                </div>

                {/* System status pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider hidden sm:block">All Systems Go</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider sm:hidden">Online</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
              <StatCard icon={Activity} label="Active Fleet" value={activeVehicles} sub={`of ${vehicles.length} total`} color="cyan" delay={0.1} />
              <StatCard icon={Network} label="Live Routes" value={activeRoutes} sub={`of ${routes.length} total`} color="violet" delay={0.15} />
              <StatCard icon={Target} label="Efficiency" value={avgEfficiency} suffix="%" sub="Fleet average" color="emerald" delay={0.2} />
              <StatCard icon={Brain} label="AI Routes" value={aiOptimizedRoutes} sub="Optimized" color="amber" delay={0.25} />
              <StatCard icon={Sparkles} label="Digital Twins" value={digitalTwins.length} sub="Active models" color="pink" delay={0.3} />
              <StatCard icon={Orbit} label="Resources" value={resources.length} sub="Operational" color="cyan" delay={0.35} />
              <StatCard icon={AlertTriangle} label="Critical" value={criticalAlerts} sub={criticalAlerts > 0 ? "Needs attention" : "All clear"} color={criticalAlerts > 0 ? "red" : "emerald"} delay={0.4} />
              <StatCard icon={Shield} label="Net Health" value={networkHealth} suffix="%" sub="System vitals" color="violet" delay={0.45} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* === MAIN CONTENT === */}
      <div className="absolute top-[195px] sm:top-[190px] md:top-[175px] left-0 right-0 bottom-0 px-3 sm:px-4 lg:px-6 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-4 h-full pb-4">

          {/* Left Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-72 flex-shrink-0 space-y-3"
          >
            {/* Predictive Intelligence */}
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-4 shadow-xl shadow-cyan-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-400/20">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Predictive Intelligence</h3>
                  <p className="text-[10px] text-cyan-400/60">Neural Engine Active</p>
                </div>
                <motion.div className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>

              {/* Accuracy gauge */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Model Accuracy</span>
                  <motion.span className="text-2xl font-black text-cyan-400"
                    animate={{ textShadow: ['0 0 10px rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.8)', '0 0 10px rgba(6,182,212,0)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {avgEfficiency}%
                  </motion.span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avgEfficiency}%` }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 rounded-full relative"
                  >
                    <motion.div className="absolute right-0 top-0 bottom-0 w-3 bg-white/50 blur-sm"
                      animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Status list */}
              <div className="space-y-1.5">
                {[
                  { label: 'Route optimization', active: true, color: 'cyan' },
                  { label: 'Traffic analysis', active: true, color: 'violet' },
                  { label: 'Maintenance predict', active: true, color: 'emerald' },
                  { label: 'ETA engine', active: aiOptimizedRoutes > 0, color: 'amber' },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-400' : 'bg-slate-600'}`}
                        animate={item.active ? { opacity: [0.4, 1, 0.4] } : {}} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />
                      <span className="text-[11px] text-slate-300">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${item.active ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {item.active ? 'ACTIVE' : 'IDLE'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Network vitals */}
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-violet-500/30 p-4 shadow-xl shadow-violet-500/5 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-400/20">
                  <Satellite className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Network Vitals</h3>
              </div>
              
              {[
                { label: 'Fleet Coverage', value: networkHealth, color: 'bg-violet-500' },
                { label: 'Signal Quality', value: 94, color: 'bg-cyan-500' },
                { label: 'Data Sync', value: 99, color: 'bg-emerald-500' },
              ].map((v, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">{v.label}</span>
                    <span className="text-[10px] font-bold text-white tabular-nums">{v.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className={`h-full ${v.color} rounded-full`}
                      initial={{ width: 0 }} animate={{ width: `${v.value}%` }}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Critical Exceptions */}
            <AnimatePresence>
              {criticalExceptions > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  className="bg-black/80 backdrop-blur-xl rounded-2xl border border-red-500/50 p-4 shadow-xl shadow-red-500/10 relative overflow-hidden"
                >
                  <motion.div className="absolute inset-0 bg-red-500/5 pointer-events-none"
                    animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div className="p-1.5 rounded-lg bg-red-500/20"
                      animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Critical Exceptions</h3>
                      <p className="text-[10px] text-red-400">Immediate attention required</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {exceptions.slice(0, 3).map((exc, i) => (
                      <motion.div key={exc.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/15 border border-red-500/30"
                      >
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{exc.title}</p>
                          <p className="text-[9px] text-red-300 uppercase tracking-wide">{exc.type}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-red-400 flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insight */}
            <div>
              <AIInsightWidget entity_type="fleet" entity_id="all" compact />
            </div>
          </motion.div>

          {/* Center - Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex-1 relative rounded-2xl overflow-hidden border border-cyan-500/25 bg-black/60 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 h-[55vw] min-h-[320px] max-h-[600px] lg:h-auto lg:max-h-none lg:min-h-[500px]"
          >
            {/* Globe frame glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              boxShadow: 'inset 0 0 60px rgba(6,182,212,0.05), inset 0 0 120px rgba(139,92,246,0.03)'
            }} />
            {/* Corner brackets */}
            {[
              'top-2 left-2 border-t border-l',
              'top-2 right-2 border-t border-r',
              'bottom-2 left-2 border-b border-l',
              'bottom-2 right-2 border-b border-r',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 ${cls} border-cyan-400/50 pointer-events-none`} />
            ))}
            
            <DashboardGlobeFrame
              vehicles={vehicles} routes={routes} resources={resources}
              digitalTwins={digitalTwins} buses={buses} busRoutes={busRoutes} busStops={busStops}
              orgId={orgId}
              onSelectVehicle={setSelectedVehicle} onSelectResource={setSelectedResource}
              className="w-full h-full"
            />

            {/* Bottom data tape */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3 pointer-events-none">
              <div className="flex items-center gap-4 overflow-hidden">
                <motion.div className="flex items-center gap-6 text-[10px] font-mono text-slate-400"
                  animate={{ x: ['0%', '-50%'] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  {[
                    `FLEET: ${vehicles.length} UNITS`,
                    `ACTIVE: ${activeVehicles}`,
                    `ROUTES: ${routes.length}`,
                    `EFFICIENCY: ${avgEfficiency}%`,
                    `HEALTH: ${networkHealth}%`,
                    `AI ROUTES: ${aiOptimizedRoutes}`,
                    `TWINS: ${digitalTwins.length}`,
                    `FLEET: ${vehicles.length} UNITS`,
                    `ACTIVE: ${activeVehicles}`,
                    `ROUTES: ${routes.length}`,
                    `EFFICIENCY: ${avgEfficiency}%`,
                    `HEALTH: ${networkHealth}%`,
                    `AI ROUTES: ${aiOptimizedRoutes}`,
                    `TWINS: ${digitalTwins.length}`,
                  ].map((item, i) => (
                    <span key={i} className="whitespace-nowrap">
                      <span className="text-cyan-500/50 mr-1">◆</span>
                      <span>{item}</span>
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* === VEHICLE HOLOGRAM === */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className="fixed bottom-6 right-6 w-80 z-50"
          >
            <div className="relative bg-black/95 backdrop-blur-2xl rounded-2xl border border-cyan-400/40 p-5 shadow-2xl shadow-cyan-500/20 overflow-hidden">
              {/* Header accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
              {/* Scan line */}
              <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                animate={{ top: ['0%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cyan-400/50" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-cyan-400/50" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-cyan-400/50" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cyan-400/50" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div className={`w-2.5 h-2.5 rounded-full ${selectedVehicle.status === 'active' ? 'bg-emerald-400' : selectedVehicle.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'}`}
                    animate={{ scale: selectedVehicle.status === 'active' ? [1, 1.4, 1] : 1, opacity: selectedVehicle.status === 'active' ? [0.5, 1, 0.5] : 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <h3 className="font-black text-white">{selectedVehicle.name}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedVehicle(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs transition-colors"
                >✕</motion.button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-center">
                  <p className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Speed</p>
                  <p className="text-2xl font-black text-white">{selectedVehicle.speed || 0}</p>
                  <p className="text-[9px] text-slate-500">km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-center">
                  <p className="text-[9px] text-violet-400 uppercase tracking-wider mb-1">Fuel</p>
                  <p className="text-2xl font-black text-white">{selectedVehicle.fuel_level || 0}%</p>
                  <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedVehicle.fuel_level || 0}%` }}
                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Type', value: selectedVehicle.type?.toUpperCase(), valueClass: 'text-white font-bold' },
                  { label: 'Efficiency', value: `${selectedVehicle.efficiency_score || 0}%`, valueClass: 'text-emerald-400 font-bold' },
                  selectedVehicle.destination && { label: 'Destination', value: selectedVehicle.destination, valueClass: 'text-white' },
                  selectedVehicle.driver && { label: 'Driver', value: selectedVehicle.driver, valueClass: 'text-white' },
                  selectedVehicle.signal_type && { label: 'Signal', value: selectedVehicle.signal_type, valueClass: 'text-cyan-400 font-bold' },
                ].filter(Boolean).map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`${row.valueClass} truncate ml-2 max-w-32`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === RESOURCE HOLOGRAM === */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className="fixed bottom-6 left-6 w-80 z-50"
          >
            <div className="relative bg-black/95 backdrop-blur-2xl rounded-2xl border border-violet-400/40 p-5 shadow-2xl shadow-violet-500/20 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
              <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
                animate={{ top: ['0%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-violet-400/50" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-violet-400/50" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-violet-400/50" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-violet-400/50" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div className={`w-2.5 h-2.5 rounded-full ${selectedResource.status === 'operational' ? 'bg-emerald-400' : selectedResource.status === 'limited' ? 'bg-amber-400' : 'bg-red-400'}`}
                    animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <h3 className="font-black text-white">{selectedResource.name}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedResource(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs transition-colors"
                >✕</motion.button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-center">
                  <p className="text-[9px] text-violet-400 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-2xl font-black text-white">{selectedResource.capacity || 0}</p>
                  <p className="text-[9px] text-slate-500">units</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-center">
                  <p className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">In Use</p>
                  <p className="text-2xl font-black text-white">{selectedResource.current_level || 0}</p>
                  <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: `${((selectedResource.current_level || 0) / (selectedResource.capacity || 1)) * 100}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Type', value: selectedResource.type?.replace('_', ' ').toUpperCase(), valueClass: 'text-white font-bold' },
                  { label: 'Status', value: selectedResource.status?.toUpperCase(), valueClass: selectedResource.status === 'operational' ? 'text-emerald-400 font-bold' : selectedResource.status === 'limited' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold' },
                  { label: 'Utilization', value: `${Math.round(((selectedResource.current_level || 0) / (selectedResource.capacity || 1)) * 100)}%`, valueClass: 'text-violet-400 font-bold' },
                  selectedResource.location && { label: 'Location', value: selectedResource.location, valueClass: 'text-white' },
                ].filter(Boolean).map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`${row.valueClass} truncate ml-2 max-w-32`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BOTTOM STATUS BAR === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden sm:block"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-emerald-500/25 shadow-xl shadow-emerald-500/10">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
            <Radio className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">System Operational</span>
          <div className="w-px h-3 bg-slate-700" />
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">{tick}s uptime</span>
          <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </div>
  );
}