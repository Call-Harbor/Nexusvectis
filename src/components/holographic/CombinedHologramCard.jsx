import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, Zap, TrendingUp, Activity, MapPin, Clock, Fuel, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteHologramCard from './RouteHologramCard';
import ResourceHologramCard from './ResourceHologramCard';
import VehicleHologramCard from './VehicleHologramCard';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [autoRotateIndex, setAutoRotateIndex] = useState(0);

  // Auto-rotate through items every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRotateIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  // If item is selected, show full detail card
  if (selectedItem) {
    const props = { x, y, index, depth, onClose: () => setSelectedItem(null) };
    
    if (selectedItem.type === 'route') {
      return <RouteHologramCard route={selectedItem.data} {...props} />;
    } else if (selectedItem.type === 'resource') {
      return <ResourceHologramCard resource={selectedItem.data} {...props} />;
    } else {
      return <VehicleHologramCard vehicle={selectedItem.data} {...props} />;
    }
  }

  const zIndex = depth ? Math.max(10, 1000 - Math.floor(depth * 100)) : 100;
  const displayIndex = hoveredIndex !== null ? hoveredIndex : autoRotateIndex;
  const activeItem = items[displayIndex];

  // Get intelligent data based on item type
  const getIntelligentData = (item) => {
    if (item.type === 'vehicle') {
      const data = item.data;
      return {
        icon: Truck,
        title: data.name,
        subtitle: data.type?.toUpperCase() || 'VEHICLE',
        status: data.status,
        statusColor: data.status === 'active' ? 'text-emerald-400' : data.status === 'idle' ? 'text-amber-400' : 'text-red-400',
        metrics: [
          { icon: Activity, label: 'Speed', value: `${data.speed || 0} km/h`, color: 'text-cyan-400' },
          { icon: Fuel, label: 'Fuel', value: `${data.fuel_level || 0}%`, color: 'text-amber-400' },
          { icon: MapPin, label: 'Destination', value: data.destination || 'N/A', color: 'text-violet-400' },
          { icon: Clock, label: 'ETA', value: data.eta ? new Date(data.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A', color: 'text-emerald-400' }
        ]
      };
    } else if (item.type === 'resource') {
      const data = item.data;
      const utilization = data.capacity ? Math.round((data.current_level / data.capacity) * 100) : 0;
      return {
        icon: Warehouse,
        title: data.name,
        subtitle: data.type?.replace(/_/g, ' ').toUpperCase() || 'RESOURCE',
        status: data.status,
        statusColor: data.status === 'operational' ? 'text-emerald-400' : 'text-amber-400',
        metrics: [
          { icon: Package, label: 'Capacity', value: `${data.current_level || 0}/${data.capacity || 0}`, color: 'text-cyan-400' },
          { icon: TrendingUp, label: 'Utilization', value: `${utilization}%`, color: 'text-violet-400' },
          { icon: MapPin, label: 'Location', value: data.location || 'Unknown', color: 'text-amber-400' }
        ]
      };
    } else {
      const data = item.data;
      return {
        icon: Route,
        title: data.name,
        subtitle: 'ROUTE',
        status: data.status,
        statusColor: data.status === 'active' ? 'text-emerald-400' : data.status === 'planned' ? 'text-cyan-400' : 'text-slate-400',
        metrics: [
          { icon: MapPin, label: 'Origin', value: data.origin || 'N/A', color: 'text-cyan-400' },
          { icon: MapPin, label: 'Destination', value: data.destination || 'N/A', color: 'text-violet-400' },
          { icon: Activity, label: 'Distance', value: `${data.distance_km || 0} km`, color: 'text-amber-400' },
          { icon: Truck, label: 'Transport', value: data.transport_type || 'N/A', color: 'text-emerald-400' }
        ]
      };
    }
  };

  const intelligentData = getIntelligentData(activeItem);
  const Icon = intelligentData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        left: x + 180,
        top: y - 200
      }}
      exit={{ opacity: 0, scale: 0.8, rotateX: 20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        zIndex: zIndex,
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      className="w-80"
    >
      {/* JARVIS-style HUD Container */}
      <div className="relative">
        {/* Holographic Frame */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-lg blur-md"
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main Panel */}
        <div className="relative bg-slate-950/90 backdrop-blur-2xl rounded-lg border border-cyan-400/30 overflow-hidden">
          {/* Animated Scan Lines */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ pointerEvents: 'none' }}
          />

          {/* Corner HUD Elements */}
          <div className="absolute top-0 left-0 w-8 h-8">
            <motion.div 
              className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-transparent"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.5 }}
            />
            <motion.div 
              className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-cyan-400 to-transparent"
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="absolute top-0 right-0 w-8 h-8">
            <motion.div 
              className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-cyan-400 to-transparent"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.5 }}
            />
            <motion.div 
              className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-cyan-400 to-transparent"
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8">
            <motion.div 
              className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-transparent"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-cyan-400 to-transparent"
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8">
            <motion.div 
              className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-cyan-400 to-transparent"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-cyan-400 to-transparent"
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>

          {/* Header */}
          <div className="relative px-4 py-3 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 flex items-center justify-center"
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <div>
                  <motion.h3 
                    key={activeItem.data.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-bold text-white tracking-wide"
                  >
                    {intelligentData.title}
                  </motion.h3>
                  <p className="text-[9px] text-cyan-400 font-mono">{intelligentData.subtitle}</p>
                </div>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn("px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase", intelligentData.statusColor, "border-current")}
              >
                {intelligentData.status}
              </motion.div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="relative p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2"
              >
                {intelligentData.metrics.map((metric, idx) => {
                  const MetricIcon = metric.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-lg p-2.5 border border-slate-700/40 group-hover:border-cyan-400/30 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MetricIcon className={cn("w-3 h-3", metric.color)} />
                          <span className="text-[9px] text-slate-400 uppercase tracking-wide">{metric.label}</span>
                        </div>
                        <p className={cn("text-xs font-bold truncate", metric.color)}>{metric.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-cyan-400/10">
              {items.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setHoveredIndex(idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    displayIndex === idx ? "bg-cyan-400 w-4" : "bg-slate-600 hover:bg-slate-500"
                  )}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            {/* Access Full Data */}
            <motion.button
              onClick={() => setSelectedItem(activeItem)}
              className="w-full mt-3 py-2 text-[10px] font-bold text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-colors uppercase tracking-wider"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-3 h-3" />
                Access Full Data
              </div>
            </motion.button>
          </div>

          {/* Data Stream Effect */}
          <div className="absolute top-0 right-0 w-32 h-full overflow-hidden opacity-10 pointer-events-none">
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-[6px] text-cyan-400 font-mono leading-tight break-all"
            >
              {Array(100).fill('01').join('')}
            </motion.div>
          </div>
        </div>

        {/* Holographic Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: '50%'
            }}
            animate={{
              y: [-30, -60, -30],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}