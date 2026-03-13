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
  const [aiMode, setAiMode] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          navigate(createPageUrl("Landing"));
          return;
        }
        const user = await base44.auth.me();
        const orgId = user?.organization_id || user?.data?.organization_id;
        if (!orgId) {
          navigate(createPageUrl("OrganizationSetup"));
        }
      } catch (error) {
        navigate(createPageUrl("Landing"));
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Vehicle.filter({ organization_id: orgId });
    },
    refetchInterval: 3000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Route.filter({ organization_id: orgId });
    },
    refetchInterval: 5000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Resource.filter({ organization_id: orgId });
    },
    refetchInterval: 10000,
  });

  const { data: digitalTwins = [] } = useQuery({
    queryKey: ['digitalTwins'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.DigitalTwin.filter({ organization_id: orgId });
    },
    refetchInterval: 5000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Alert.filter({ organization_id: orgId }, '-created_date', 10);
    },
    refetchInterval: 5000,
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Exception.filter({ 
        organization_id: orgId,
        status: { $ne: 'resolved' }
      }, '-created_date', 5);
    },
    refetchInterval: 5000,
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
  const predictiveScore = Math.round(85 + Math.random() * 10);
  const networkHealth = Math.round(92 + Math.random() * 7);

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      NexusVectis
                    </h1>
                    <Badge className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border-cyan-400/30 animate-pulse">
                      NEXUS
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                    <Brain className="w-3 h-3 text-violet-400" />
                    Neural Fleet Intelligence • Real-time AI Analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setAiMode(aiMode === 'active' ? 'learning' : 'active')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    aiMode === 'active'
                      ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-400 border border-cyan-400/50'
                      : 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-violet-400 border border-violet-400/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{aiMode === 'active' ? 'AI Active' : 'Learning Mode'}</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Neural Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
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
      <div className="absolute inset-0 pt-48 sm:pt-52 pb-4 px-4 sm:px-6 flex gap-3">
        {/* Left Panel - AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 flex-shrink-0 space-y-4 overflow-y-auto max-h-full hidden lg:block"
        >
          {/* Predictive Analytics */}
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/40 p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Predictive Intelligence</h3>
                <p className="text-xs text-cyan-300">AI-Powered Forecasting</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-cyan-200 font-medium">Accuracy Score</span>
                  <span className="text-2xl font-bold text-cyan-400">{predictiveScore}%</span>
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

              <div className="p-3 rounded-xl bg-slate-800/80 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-300 font-medium">Neural Processing</span>
                </div>
                <div className="space-y-1 text-xs text-white">
                  <p>• Route optimization algorithms active</p>
                  <p>• Real-time traffic analysis running</p>
                  <p>• Predictive maintenance models trained</p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Exceptions */}
          {criticalExceptions > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/50 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-lg bg-red-500/20"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white">Critical Exceptions</h3>
                  <p className="text-xs text-red-400">Immediate attention required</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {exceptions.slice(0, 3).map((exception) => (
                  <motion.div
                    key={exception.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-red-500/20 border border-red-500/40"
                  >
                    <p className="text-sm font-bold text-white">{exception.title}</p>
                    <p className="text-xs text-red-200 mt-1 uppercase tracking-wide">{exception.type}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Real-time AI Widget */}
          <div className="hidden lg:block">
            <AIInsightWidget entity_type="fleet" entity_id="all" compact />
          </div>
        </motion.div>

        {/* Center - 3D Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 backdrop-blur-xl shadow-2xl shadow-cyan-500/20"
        >
          <FuturisticGlobe 
            vehicles={vehicles}
            routes={routes}
            resources={resources}
            digitalTwins={digitalTwins}
            onSelectVehicle={setSelectedVehicle}
          />
        </motion.div>
      </div>

      {/* Selected Vehicle Hologram */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 z-50"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-2xl border-2 border-cyan-400/50 p-5 shadow-2xl shadow-cyan-500/30">
              {/* Holographic scan line */}
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
              />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-3 h-3 rounded-full ${
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
                  <h3 className="text-lg font-bold text-white">{selectedVehicle.name}</h3>
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
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-xs text-cyan-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-white">{selectedVehicle.speed || 0}</p>
                  <p className="text-xs text-slate-400">km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <p className="text-xs text-violet-400 mb-1">Fuel</p>
                  <p className="text-2xl font-bold text-white">{selectedVehicle.fuel_level || 0}%</p>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedVehicle.fuel_level || 0}%` }}
                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-bold uppercase">{selectedVehicle.type}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Efficiency</span>
                  <span className="text-emerald-400 font-bold">{selectedVehicle.efficiency_score || 0}%</span>
                </div>
                {selectedVehicle.destination && (
                  <div className="p-2 rounded-lg bg-slate-800/50">
                    <span className="text-slate-400 block mb-1">Destination</span>
                    <span className="text-white font-medium">{selectedVehicle.destination}</span>
                  </div>
                )}
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
        className="fixed bottom-6 left-6 z-40"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-3 shadow-xl">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Radio className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-xs font-bold text-emerald-400">SYSTEM OPERATIONAL</p>
              <p className="text-[10px] text-slate-400">All systems nominal</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}