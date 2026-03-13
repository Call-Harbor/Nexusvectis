import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Sparkles, Radio, Activity, Maximize2, Minimize2, Layers, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import FuturisticGlobe from "@/components/holographic/FuturisticGlobe";
import AIAssistantBadge from "@/components/ai/AIAssistantBadge";

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in and has organization
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
    refetchInterval: 5000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Route.filter({ organization_id: orgId });
    },
    refetchInterval: 10000,
  });

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const avgEfficiency = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.efficiency_score || 0), 0) / vehicles.length)
    : 0;

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <AIAssistantBadge />

      {/* Header Overlay */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(6, 182, 212, 0.3)',
                  '0 0 40px rgba(139, 92, 246, 0.4)',
                  '0 0 20px rgba(6, 182, 212, 0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                NexusVectis
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-400/30 text-xs">
                  LIVE
                </Badge>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Holographic Fleet Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 hover:bg-slate-800/70 hover:border-cyan-500/50"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline ml-2">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </Button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Active Fleet</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {activeVehicles}<span className="text-sm text-slate-500">/{vehicles.length}</span>
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-violet-500/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-slate-400">Routes</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {activeRoutes}<span className="text-sm text-slate-500">/{totalRoutes}</span>
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Efficiency</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{avgEfficiency}%</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-amber-500/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="text-sm sm:text-base font-bold text-emerald-400">Operational</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main Globe Container */}
      <div className="relative z-10 w-full" style={{ height: 'calc(100vh - 280px)' }}>
        <FuturisticGlobe 
          vehicles={vehicles}
          routes={routes}
          onSelectVehicle={setSelectedVehicle}
        />
      </div>

      {/* Selected Vehicle Panel */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 border-cyan-400/50 p-4 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedVehicle.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                    selectedVehicle.status === 'idle' ? 'bg-amber-400' :
                    'bg-slate-400'
                  }`} />
                  <h3 className="text-lg font-bold text-white">{selectedVehicle.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVehicle(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Speed</p>
                  <p className="text-xl font-bold text-cyan-400">{selectedVehicle.speed || 0} km/h</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Fuel</p>
                  <p className="text-xl font-bold text-violet-400">{selectedVehicle.fuel_level || 0}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm font-bold text-white uppercase">{selectedVehicle.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Efficiency</p>
                  <p className="text-xl font-bold text-emerald-400">{selectedVehicle.efficiency_score || 0}%</p>
                </div>
              </div>

              {selectedVehicle.destination && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Destination</p>
                  <p className="text-sm font-bold text-white">{selectedVehicle.destination}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-6 z-40 hidden sm:block"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-xs text-slate-400 space-y-2">
          <p className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">↻</span>
            Drag to rotate globe
          </p>
          <p className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold">⊕</span>
            Scroll to zoom
          </p>
          <p className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">↖</span>
            Click vehicles for details
          </p>
        </div>
      </motion.div>
    </div>
  );
}