import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Sparkles, Activity, Brain, Zap, TrendingUp, AlertTriangle, 
  Radio, Cpu, Shield, Target, Orbit, Network
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import FuturisticGlobe from "@/components/holographic/FuturisticGlobe";
import AIInsightWidget from "@/components/ai/AIInsightWidget";

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [aiMode, setAiMode] = useState('active');
  const [aiLearningProgress, setAiLearningProgress] = useState(0);
  const [aiLearningPhase, setAiLearningPhase] = useState(0);
  const [orgId, setOrgId] = useState(null);
  const navigate = useNavigate();

  const AI_LEARNING_PHASES = [
    'Ingesting fleet telemetry…',
    'Training route optimization model…',
    'Calibrating predictive maintenance…',
    'Updating anomaly detection weights…',
    'Synchronising digital twin federation…',
    'Finalising neural cluster analysis…',
  ];

  // Auto-close holograms when scrolling out of view
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 300) {
        setSelectedVehicle(null);
        setSelectedResource(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Single auth check — cache orgId
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { navigate(createPageUrl("Landing")); return; }
        const user = await base44.auth.me();
        const id = user?.organization_id || user?.data?.organization_id;
        if (!id) { navigate(createPageUrl("OrganizationSetup")); return; }
        setOrgId(id);
      } catch {
        navigate(createPageUrl("Landing"));
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', orgId],
    queryFn: () => base44.entities.Vehicle.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes', orgId],
    queryFn: () => base44.entities.Route.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', orgId],
    queryFn: () => base44.entities.Resource.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 20000,
  });

  const { data: digitalTwins = [] } = useQuery({
    queryKey: ['digitalTwins', orgId],
    queryFn: () => base44.entities.DigitalTwin.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 20000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', orgId],
    queryFn: () => base44.entities.Alert.filter({ organization_id: orgId }, '-created_date', 10),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions', orgId],
    queryFn: () => base44.entities.Exception.filter({ organization_id: orgId, status: { $ne: 'resolved' } }, '-created_date', 5),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  // Advanced Analytics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const avgEfficiency = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.efficiency_score || 0), 0) / vehicles.length)
    : 0;
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.is_resolved).length;
  const criticalExceptions = exceptions.filter(e => e.severity === 'critical').length;
  const aiOptimizedRoutes = routes.filter(r => r.ai_optimized).length;
  const predictiveScore = vehicles.length > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.efficiency_score || 0), 0) / vehicles.length)
    : 0;
  const networkHealth = vehicles.length > 0
    ? Math.round(vehicles.filter(v => v.status === 'active' || v.status === 'idle').length / vehicles.length * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Quantum Field Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-950/20 via-violet-950/20 to-black" />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Holographic Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Neural Network Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-50"
      >
        <div className="bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-xl border-b border-cyan-500/20">
          <div className="p-4 sm:p-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div 
                  className="relative"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.4)',
                      '0 0 40px rgba(139, 92, 246, 0.6)',
                      '0 0 20px rgba(6, 182, 212, 0.4)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-400/50 backdrop-blur-xl">
                    <Globe className="w-8 h-8 text-cyan-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-1 rounded-2xl border-2 border-cyan-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                
                <div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      NexusVectis
                    </h1>
                    <Badge className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border-cyan-400/30 animate-pulse text-[10px] sm:text-xs">
                      NEXUS
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-1">
                    <Brain className="w-3 h-3 text-violet-400" />
                    <span className="hidden sm:inline">Neural Fleet Intelligence • Real-time AI Analytics</span>
                    <span className="sm:hidden">Neural Fleet AI</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <motion.button
                  onClick={() => setAiMode(aiMode === 'active' ? 'learning' : 'active')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all flex-1 sm:flex-none ${
                    aiMode === 'active'
                      ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-400 border border-cyan-400/50'
                      : 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-violet-400 border border-violet-400/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{aiMode === 'active' ? 'AI Active' : 'Learning Mode'}</span>
                    <span className="sm:hidden">{aiMode === 'active' ? 'Active' : 'Learning'}</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Neural Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 relative overflow-hidden group"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fleet</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {activeVehicles}<span className="text-xs text-slate-500">/{vehicles.length}</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-violet-500/30 relative overflow-hidden group"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Routes</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {activeRoutes}<span className="text-xs text-slate-500">/{routes.length}</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Efficiency</span>
                </div>
                <p className="text-lg font-bold text-white">{avgEfficiency}%</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-amber-500/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">AI Opt</span>
                </div>
                <p className="text-lg font-bold text-white">{aiOptimizedRoutes}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-pink-500/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Twins</span>
                </div>
                <p className="text-lg font-bold text-white">{digitalTwins.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Orbit className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Resources</span>
                </div>
                <p className="text-lg font-bold text-white">{resources.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className={`p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border relative overflow-hidden ${
                  criticalAlerts > 0 ? 'border-red-500/50' : 'border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-3 h-3 ${criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Alerts</span>
                </div>
                <p className="text-lg font-bold text-white">{criticalAlerts}</p>
                {criticalAlerts > 0 && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"
                  />
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-violet-500/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Health</span>
                </div>
                <p className="text-lg font-bold text-white">{networkHealth}%</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="absolute top-[220px] sm:top-[200px] lg:top-[185px] left-0 right-0 bottom-0 px-3 sm:px-4 lg:px-6 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-4 min-h-full pb-4">
          {/* Left Panel - AI Insights */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-72 flex-shrink-0 space-y-4"
          >
          {/* Predictive Analytics */}
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-cyan-500/40 p-3 lg:p-4 shadow-lg">
            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              <div className="p-1.5 lg:p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-bold text-white">Predictive Intelligence</h3>
                <p className="text-[10px] lg:text-xs text-cyan-300">AI-Powered Forecasting</p>
              </div>
            </div>
            
            <div className="space-y-2 lg:space-y-3">
              <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-slate-800/80 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] lg:text-xs text-cyan-200 font-medium">Accuracy Score</span>
                  <span className="text-xl lg:text-2xl font-bold text-cyan-400">{predictiveScore}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${predictiveScore}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  />
                </div>
              </div>

              <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-slate-800/80 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-3 h-3 lg:w-4 lg:h-4 text-violet-400" />
                  <span className="text-[10px] lg:text-xs text-violet-300 font-medium">Neural Processing</span>
                </div>
                <div className="space-y-0.5 lg:space-y-1 text-[10px] lg:text-xs text-white">
                  <p>• Route optimization <span className="hidden lg:inline">algorithms </span>active</p>
                  <p>• Real-time traffic analysis<span className="hidden lg:inline"> running</span></p>
                  <p>• Predictive maintenance<span className="hidden lg:inline"> models trained</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Exceptions */}
          {criticalExceptions > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-red-500/50 p-3 lg:p-4"
            >
              <div className="flex items-center gap-2 lg:gap-3 mb-3">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-1.5 lg:p-2 rounded-lg bg-red-500/20"
                >
                  <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
                </motion.div>
                <div>
                  <h3 className="text-xs lg:text-sm font-bold text-white">Critical Exceptions</h3>
                  <p className="text-[10px] lg:text-xs text-red-400"><span className="hidden sm:inline">Immediate attention required</span><span className="sm:hidden">Urgent</span></p>
                </div>
              </div>
              
              <div className="space-y-1.5 lg:space-y-2">
                {exceptions.slice(0, 3).map((exception) => (
                  <motion.div
                    key={exception.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 lg:p-3 rounded-lg bg-red-500/20 border border-red-500/40"
                  >
                    <p className="text-xs lg:text-sm font-bold text-white line-clamp-1">{exception.title}</p>
                    <p className="text-[10px] lg:text-xs text-red-200 mt-0.5 lg:mt-1 uppercase tracking-wide">{exception.type}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Real-time AI Widget */}
          <div className="lg:block">
            <AIInsightWidget entity_type="fleet" entity_id="all" compact />
          </div>
          </motion.div>

          {/* Center - 3D Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 h-[55vw] min-h-[320px] max-h-[600px] lg:h-auto lg:max-h-none lg:min-h-[500px]"
          >
            <FuturisticGlobe 
              vehicles={vehicles}
              routes={routes}
              resources={resources}
              digitalTwins={digitalTwins}
              onSelectVehicle={setSelectedVehicle}
              onSelectResource={setSelectedResource}
            />
          </motion.div>
        </div>
      </div>

      {/* Selected Vehicle Hologram */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 lg:w-96 z-50 max-w-md"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-xl lg:rounded-2xl border-2 border-cyan-400/50 p-4 lg:p-5 shadow-2xl shadow-cyan-500/30">
              {/* Holographic scan line */}
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
              />
              
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <motion.div 
                    className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                      selectedVehicle.status === 'active' ? 'bg-emerald-400' :
                      selectedVehicle.status === 'idle' ? 'bg-amber-400' :
                      'bg-slate-400'
                    }`}
                    animate={{ 
                      scale: selectedVehicle.status === 'active' ? [1, 1.3, 1] : 1,
                      opacity: selectedVehicle.status === 'active' ? [0.6, 1, 0.6] : 1
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <h3 className="text-base lg:text-lg font-bold text-white truncate">{selectedVehicle.name}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedVehicle(null)}
                  className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-[10px] lg:text-xs text-cyan-400 mb-0.5 lg:mb-1">Speed</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{selectedVehicle.speed || 0}</p>
                  <p className="text-[10px] lg:text-xs text-slate-400">km/h</p>
                </div>
                <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <p className="text-[10px] lg:text-xs text-violet-400 mb-0.5 lg:mb-1">Fuel</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{selectedVehicle.fuel_level || 0}%</p>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedVehicle.fuel_level || 0}%` }}
                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 lg:space-y-2 text-[10px] lg:text-xs">
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-bold uppercase">{selectedVehicle.type}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Efficiency</span>
                  <span className="text-emerald-400 font-bold">{selectedVehicle.efficiency_score || 0}%</span>
                </div>
                {selectedVehicle.destination && (
                  <div className="p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400 block mb-0.5 lg:mb-1">Destination</span>
                    <span className="text-white font-medium truncate block">{selectedVehicle.destination}</span>
                  </div>
                )}
                {selectedVehicle.driver && (
                  <div className="p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400 block mb-0.5 lg:mb-1">Driver</span>
                    <span className="text-white font-medium truncate block">{selectedVehicle.driver}</span>
                  </div>
                )}
                {selectedVehicle.signal_type && (
                  <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">Signal</span>
                    <span className="text-cyan-400 font-bold">{selectedVehicle.signal_type}</span>
                  </div>
                )}
                {selectedVehicle.co2_emissions && (
                  <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400">CO₂ Emissions</span>
                    <span className="text-amber-400 font-bold">{selectedVehicle.co2_emissions} kg</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Resource Hologram */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 w-[calc(100vw-2rem)] sm:w-80 lg:w-96 z-50 max-w-md"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-xl lg:rounded-2xl border-2 border-violet-400/50 p-4 lg:p-5 shadow-2xl shadow-violet-500/30">
              {/* Holographic scan line */}
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-50"
              />
              
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <motion.div 
                    className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                      selectedResource.status === 'operational' ? 'bg-emerald-400' :
                      selectedResource.status === 'limited' ? 'bg-amber-400' :
                      'bg-red-400'
                    }`}
                    animate={{ 
                      scale: selectedResource.status === 'operational' ? [1, 1.3, 1] : 1,
                      opacity: selectedResource.status === 'operational' ? [0.6, 1, 0.6] : 1
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <h3 className="text-base lg:text-lg font-bold text-white truncate">{selectedResource.name}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedResource(null)}
                  className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <p className="text-[10px] lg:text-xs text-violet-400 mb-0.5 lg:mb-1">Capacity</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{selectedResource.capacity || 0}</p>
                  <p className="text-[10px] lg:text-xs text-slate-400">units</p>
                </div>
                <div className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-[10px] lg:text-xs text-cyan-400 mb-0.5 lg:mb-1">Current</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{selectedResource.current_level || 0}</p>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((selectedResource.current_level || 0) / (selectedResource.capacity || 1)) * 100}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 lg:space-y-2 text-[10px] lg:text-xs">
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-bold uppercase">{selectedResource.type?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Status</span>
                  <span className={`font-bold uppercase ${
                    selectedResource.status === 'operational' ? 'text-emerald-400' :
                    selectedResource.status === 'limited' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{selectedResource.status}</span>
                </div>
                {selectedResource.location && (
                  <div className="p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400 block mb-0.5 lg:mb-1">Location</span>
                    <span className="text-white font-medium truncate block">{selectedResource.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Utilization</span>
                  <span className="text-violet-400 font-bold">
                    {Math.round(((selectedResource.current_level || 0) / (selectedResource.capacity || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg lg:rounded-xl border border-emerald-500/30 p-2 lg:p-3 shadow-xl">
          <div className="flex items-center gap-2 lg:gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Radio className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-[10px] lg:text-xs font-bold text-emerald-400">SYSTEM <span className="hidden sm:inline">OPERATIONAL</span></p>
              <p className="text-[9px] lg:text-[10px] text-slate-400 hidden sm:block">All systems nominal</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-400"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}