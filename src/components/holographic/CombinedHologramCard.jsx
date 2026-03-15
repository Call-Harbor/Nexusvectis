import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, Zap, Activity, MapPin, Clock, Fuel, Package, TrendingUp, AlertTriangle, CheckCircle, Navigation, Battery, Thermometer, Gauge, Radio, Cpu, Brain, Target, Orbit, Shield, ArrowUpRight, ArrowDownRight, Waves, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanProgress, setScanProgress] = useState(0);
  const zIndex = depth ? Math.max(10, 1000 - Math.floor(depth * 100)) : 100;

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanProgress(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(scanInterval);
  }, []);

  // Separate and analyze items
  const vehicles = items.filter(item => item.type === 'vehicle');
  const resources = items.filter(item => item.type === 'resource');
  const routes = items.filter(item => item.type === 'route');

  // Calculate ULTRA-advanced analytics
  const analytics = {
    // Performance metrics
    avgSpeed: vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.data.speed || 0), 0) / vehicles.length) : 0,
    maxSpeed: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.data.speed || 0)) : 0,
    activeVehicles: vehicles.filter(v => v.data.status === 'active').length,
    avgFuel: vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.data.fuel_level || 0), 0) / vehicles.length) : 0,
    
    // Critical monitoring
    criticalAlerts: vehicles.filter(v => v.data.fuel_level < 20 || v.data.status === 'maintenance').length,
    lowFuelVehicles: vehicles.filter(v => v.data.fuel_level < 30).length,
    maintenanceNeeded: vehicles.filter(v => v.data.status === 'maintenance').length,
    
    // Resource intelligence
    resourceUtilization: resources.length > 0 ? Math.round(resources.reduce((sum, r) => {
      const util = r.data.capacity ? (r.data.current_level / r.data.capacity) * 100 : 0;
      return sum + util;
    }, 0) / resources.length) : 0,
    overcapacity: resources.filter(r => r.data.capacity && (r.data.current_level / r.data.capacity) > 0.9).length,
    
    // Route analysis
    totalDistance: routes.reduce((sum, r) => sum + (r.data.distance_km || 0), 0),
    avgDistance: routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + (r.data.distance_km || 0), 0) / routes.length) : 0,
    aiOptimized: routes.filter(r => r.data.ai_optimized).length,
    
    // AI predictions — derived from real data
    efficiency: vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.data.efficiency_score || 0), 0) / vehicles.length)
      : (routes.length > 0 ? Math.round(routes.filter(r => r.data.status === 'active').length / routes.length * 100) : 0),
    predictedETA: vehicles.length > 0
      ? Math.round(vehicles.filter(v => v.data.eta).reduce((sum, v) => {
          const mins = (new Date(v.data.eta) - Date.now()) / 60000;
          return sum + Math.max(0, mins);
        }, 0) / Math.max(1, vehicles.filter(v => v.data.eta).length))
      : 0,
    riskScore: vehicles.length > 0
      ? Math.round((vehicles.filter(v => v.data.status === 'maintenance' || v.data.fuel_level < 20).length / vehicles.length) * 100)
      : 0,
    optimalPerformance: vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.data.efficiency_score || 0), 0) / vehicles.length)
      : (routes.length > 0 ? Math.round(routes.filter(r => r.data.ai_optimized).length / routes.length * 100) : 0),

    // Neural network stats — real signal quality
    neuralConfidence: vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.data.signal_strength || 80), 0) / vehicles.length)
      : 95,
    // processingLoad = avg cargo utilization across vehicles (real data)
    processingLoad: vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => {
          const util = v.data.cargo_capacity ? (v.data.cargo_used || 0) / v.data.cargo_capacity * 100 : 0;
          return sum + util;
        }, 0) / vehicles.length)
      : (resources.length > 0
          ? Math.round(resources.reduce((sum, r) => {
              return sum + (r.data.capacity ? (r.data.current_level || 0) / r.data.capacity * 100 : 0);
            }, 0) / resources.length)
          : 0),
    quantumState: routes.filter(r => r.data.ai_optimized).length > 0 ? 'AI-OPTIMIZED' : 'STANDARD'
  };

  // Render detailed vehicle info
  const renderVehicleDetail = (item, idx) => {
    const data = item.data;
    const isHovered = hoveredItem === `vehicle-${idx}`;
    const statusColor = data.status === 'active' ? 'text-emerald-400' : data.status === 'idle' ? 'text-amber-400' : 'text-red-400';
    const fuelWarning = data.fuel_level < 20;

    return (
      <motion.div
        key={`vehicle-${idx}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        onMouseEnter={() => setHoveredItem(`vehicle-${idx}`)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "relative p-3 rounded-lg border transition-all",
          isHovered ? "bg-cyan-500/10 border-cyan-400/50" : "bg-slate-900/40 border-slate-700/30"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-xs font-bold text-white">{data.name}</p>
              <p className="text-[9px] text-slate-400 uppercase">{data.type}</p>
            </div>
          </div>
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", statusColor, "border-current")}>
            {data.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <div>
              <p className="text-[8px] text-slate-500">Speed</p>
              <p className="text-[10px] text-white font-semibold">{data.speed || 0} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className={cn("w-3 h-3", fuelWarning ? "text-red-400" : "text-amber-400")} />
            <div>
              <p className="text-[8px] text-slate-500">Fuel</p>
              <p className={cn("text-[10px] font-semibold", fuelWarning ? "text-red-400" : "text-white")}>
                {data.fuel_level || 0}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-violet-400" />
            <div>
              <p className="text-[8px] text-slate-500">Destination</p>
              <p className="text-[10px] text-white font-semibold truncate">{data.destination || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-emerald-400" />
            <div>
              <p className="text-[8px] text-slate-500">ETA</p>
              <p className="text-[10px] text-white font-semibold">
                {data.eta ? new Date(data.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {fuelWarning && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-500/10 border border-red-400/30">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] text-red-400 font-semibold">LOW FUEL ALERT</span>
          </div>
        )}

        {isHovered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -inset-0.5 bg-cyan-400/20 rounded-lg blur -z-10"
          />
        )}
      </motion.div>
    );
  };

  // Render detailed resource info
  const renderResourceDetail = (item, idx) => {
    const data = item.data;
    const isHovered = hoveredItem === `resource-${idx}`;
    const utilization = data.capacity ? Math.round((data.current_level / data.capacity) * 100) : 0;
    const utilizationColor = utilization > 80 ? 'text-red-400' : utilization > 50 ? 'text-amber-400' : 'text-emerald-400';

    return (
      <motion.div
        key={`resource-${idx}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        onMouseEnter={() => setHoveredItem(`resource-${idx}`)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "relative p-3 rounded-lg border transition-all",
          isHovered ? "bg-amber-500/10 border-amber-400/50" : "bg-slate-900/40 border-slate-700/30"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-white">{data.name}</p>
              <p className="text-[9px] text-slate-400 uppercase">{data.type?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-slate-500">Capacity Utilization</span>
              <span className={cn("text-[10px] font-bold", utilizationColor)}>{utilization}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${utilization}%` }}
                className={cn("h-full rounded-full", utilization > 80 ? 'bg-red-400' : utilization > 50 ? 'bg-amber-400' : 'bg-emerald-400')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[8px] text-slate-500">Current</p>
              <p className="text-[10px] text-white font-semibold">{data.current_level || 0}</p>
            </div>
            <div>
              <p className="text-[8px] text-slate-500">Capacity</p>
              <p className="text-[10px] text-white font-semibold">{data.capacity || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-violet-400" />
            <p className="text-[10px] text-white">{data.location || 'Unknown'}</p>
          </div>
        </div>

        {isHovered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -inset-0.5 bg-amber-400/20 rounded-lg blur -z-10"
          />
        )}
      </motion.div>
    );
  };

  // Render detailed route info
  const renderRouteDetail = (item, idx) => {
    const data = item.data;
    const isHovered = hoveredItem === `route-${idx}`;

    return (
      <motion.div
        key={`route-${idx}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        onMouseEnter={() => setHoveredItem(`route-${idx}`)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "relative p-3 rounded-lg border transition-all",
          isHovered ? "bg-violet-500/10 border-violet-400/50" : "bg-slate-900/40 border-slate-700/30"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-4 h-4 text-violet-400" />
          <p className="text-xs font-bold text-white">{data.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[8px] text-slate-500">Origin</p>
            <p className="text-[10px] text-white font-semibold truncate">{data.origin}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-500">Destination</p>
            <p className="text-[10px] text-white font-semibold truncate">{data.destination}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-500">Distance</p>
            <p className="text-[10px] text-cyan-400 font-semibold">{data.distance_km || 0} km</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-500">Transport</p>
            <p className="text-[10px] text-white font-semibold">{data.transport_type || 'N/A'}</p>
          </div>
        </div>

        {isHovered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -inset-0.5 bg-violet-400/20 rounded-lg blur -z-10"
          />
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateX: -15, rotateY: -10 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        left: x + 200,
        top: y - 300
      }}
      exit={{ opacity: 0, scale: 0.85, rotateX: 15, rotateY: 10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        zIndex: zIndex,
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d',
        perspective: '1500px',
        width: '520px',
        maxHeight: '88vh'
      }}
    >
      <div className="relative">
        {/* Multi-layer Quantum Glow */}
        <motion.div
          className="absolute -inset-3 bg-gradient-to-r from-cyan-500/40 via-violet-500/40 to-fuchsia-500/40 rounded-2xl blur-2xl"
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/30 via-cyan-500/30 to-violet-500/30 rounded-xl blur-xl"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Main Quantum Panel */}
        <div className="relative bg-gradient-to-br from-slate-950/98 via-slate-900/98 to-slate-950/98 backdrop-blur-3xl rounded-2xl border-2 border-cyan-400/60 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          {/* Multi-directional Scan Lines */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/12 to-transparent pointer-events-none"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/8 to-transparent pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Quantum Field Effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.8) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />

          {/* Advanced Corner Targeting Systems */}
          <motion.svg 
            className="absolute top-0 left-0 w-12 h-12 text-cyan-400" 
            viewBox="0 0 24 24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M0 0 L24 0 L24 2 L2 2 L2 24 L0 24 Z" fill="currentColor" opacity="0.8"/>
            <circle cx="4" cy="4" r="1.5" fill="currentColor">
              <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </motion.svg>
          <motion.svg 
            className="absolute top-0 right-0 w-12 h-12 text-cyan-400" 
            viewBox="0 0 24 24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <path d="M24 0 L0 0 L0 2 L22 2 L22 24 L24 24 Z" fill="currentColor" opacity="0.8"/>
            <circle cx="20" cy="4" r="1.5" fill="currentColor">
              <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </motion.svg>
          <motion.svg 
            className="absolute bottom-0 left-0 w-12 h-12 text-violet-400" 
            viewBox="0 0 24 24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <path d="M0 24 L24 24 L24 22 L2 22 L2 0 L0 0 Z" fill="currentColor" opacity="0.8"/>
            <circle cx="4" cy="20" r="1.5" fill="currentColor">
              <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </motion.svg>
          <motion.svg 
            className="absolute bottom-0 right-0 w-12 h-12 text-violet-400" 
            viewBox="0 0 24 24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          >
            <path d="M24 24 L0 24 L0 22 L22 22 L22 0 L24 0 Z" fill="currentColor" opacity="0.8"/>
            <circle cx="20" cy="20" r="1.5" fill="currentColor">
              <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </motion.svg>
          
          {/* HUD Targeting Grid */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
              style={{ top: `${25 * (i + 1)}%` }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}

          {/* Neural Command Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 border-b-2 border-cyan-400/40">
            {/* Neural Pulse Background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 100%' }}
            />
            
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/50 to-violet-500/50 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    <Brain className="w-6 h-6 text-cyan-200" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-cyan-400/40"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wider flex items-center gap-2">
                    NEURAL CLUSTER ANALYSIS
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Cpu className="w-4 h-4 text-cyan-400" />
                    </motion.div>
                  </h3>
                  <p className="text-[10px] text-cyan-300 font-mono flex items-center gap-2">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {items.length} NODES • AI PROCESSING • {analytics.quantumState}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      boxShadow: [
                        '0 0 5px rgba(16,185,129,0.5)',
                        '0 0 15px rgba(16,185,129,0.8)',
                        '0 0 5px rgba(16,185,129,0.5)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-[9px] text-emerald-300 font-black uppercase">OPERATIONAL</span>
                </motion.div>
                <div className="text-[8px] text-violet-300 font-mono">
                  CONFIDENCE: {analytics.neuralConfidence}%
                </div>
              </div>
            </div>

            {/* Advanced Neural Analytics Grid */}
            <div className="relative grid grid-cols-4 gap-2">
              <motion.div 
                className="relative bg-slate-900/70 rounded-lg p-2.5 border border-cyan-400/30 overflow-hidden group"
                whileHover={{ scale: 1.05, borderColor: 'rgba(6,182,212,0.6)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative">
                  <div className="flex items-center gap-1 mb-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    <p className="text-[8px] text-slate-300 uppercase tracking-wider">Velocity</p>
                  </div>
                  <p className="text-lg font-black text-cyan-400">{analytics.avgSpeed}</p>
                  <div className="flex items-center gap-1 text-[7px] text-cyan-300">
                    <ArrowUpRight className="w-2 h-2" />
                    <span>MAX {analytics.maxSpeed}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="relative bg-slate-900/70 rounded-lg p-2.5 border border-amber-400/30 overflow-hidden group"
                whileHover={{ scale: 1.05, borderColor: 'rgba(251,191,36,0.6)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <div className="relative">
                  <div className="flex items-center gap-1 mb-1">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    <p className="text-[8px] text-slate-300 uppercase tracking-wider">Energy</p>
                  </div>
                  <p className="text-lg font-black text-amber-400">{analytics.avgFuel}%</p>
                  <div className="flex items-center gap-1 text-[7px] text-amber-300">
                    {analytics.lowFuelVehicles > 0 && <AlertTriangle className="w-2 h-2" />}
                    <span>{analytics.lowFuelVehicles} LOW</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="relative bg-slate-900/70 rounded-lg p-2.5 border border-violet-400/30 overflow-hidden group"
                whileHover={{ scale: 1.05, borderColor: 'rgba(139,92,246,0.6)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
                <div className="relative">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-violet-400" />
                    <p className="text-[8px] text-slate-300 uppercase tracking-wider">Optimal</p>
                  </div>
                  <p className="text-lg font-black text-violet-400">{analytics.optimalPerformance}%</p>
                  <div className="flex items-center gap-1 text-[7px] text-violet-300">
                    <TrendingUp className="w-2 h-2" />
                    <span>AI BOOST</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="relative bg-slate-900/70 rounded-lg p-2.5 border border-red-400/30 overflow-hidden group"
                whileHover={{ scale: 1.05, borderColor: 'rgba(239,68,68,0.6)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"
                  animate={{ opacity: analytics.criticalAlerts > 0 ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="relative">
                  <div className="flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3 text-red-400" />
                    <p className="text-[8px] text-slate-300 uppercase tracking-wider">Threats</p>
                  </div>
                  <p className="text-lg font-black text-red-400">{analytics.criticalAlerts}</p>
                  <div className="flex items-center gap-1 text-[7px] text-red-300">
                    {analytics.criticalAlerts > 0 ? <AlertTriangle className="w-2 h-2 animate-pulse" /> : <CheckCircle className="w-2 h-2" />}
                    <span>{analytics.criticalAlerts > 0 ? 'CRITICAL' : 'SECURE'}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Neural Processing Bar */}
            <div className="mt-3 p-2 rounded-lg bg-slate-900/60 border border-violet-400/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-[9px] text-violet-300">
                  <Cpu className="w-3 h-3" />
                  <span>NEURAL PROCESSING</span>
                </div>
                <span className="text-[9px] text-violet-400 font-mono">{analytics.processingLoad}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full"
                  animate={{ 
                    width: `${analytics.processingLoad}%`,
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ 
                    width: { duration: 0.3 },
                    backgroundPosition: { duration: 2, repeat: Infinity }
                  }}
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
            {/* Vehicles */}
            {vehicles.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-black uppercase tracking-wider">
                    Vehicles Analysis ({vehicles.length})
                  </span>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-400/50 to-transparent" />
                </div>
                <div className="space-y-2">
                  {vehicles.map((item, idx) => renderVehicleDetail(item, idx))}
                </div>
              </div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-black uppercase tracking-wider">
                    Resources Analysis ({resources.length})
                  </span>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-amber-400/50 to-transparent" />
                </div>
                <div className="space-y-2">
                  {resources.map((item, idx) => renderResourceDetail(item, idx))}
                </div>
              </div>
            )}

            {/* Routes */}
            {routes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-400 font-black uppercase tracking-wider">
                    Routes Analysis ({routes.length})
                  </span>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-violet-400/50 to-transparent" />
                </div>
                <div className="space-y-2">
                  {routes.map((item, idx) => renderRouteDetail(item, idx))}
                </div>
              </div>
            )}
          </div>

          {/* Binary Stream */}
          <div className="absolute top-0 right-0 w-20 h-full overflow-hidden opacity-5 pointer-events-none">
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="text-[6px] text-cyan-400 font-mono leading-tight break-all"
            >
              {Array(200).fill('01').join('')}
            </motion.div>
          </div>
        </div>

        {/* Particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
            style={{ left: `${10 + i * 10}%`, top: '50%' }}
            animate={{
              y: [-30, -70, -30],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}