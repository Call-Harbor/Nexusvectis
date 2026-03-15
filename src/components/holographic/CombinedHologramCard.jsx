import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, Zap, Activity, MapPin, Clock, Fuel, Package, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const zIndex = depth ? Math.max(10, 1000 - Math.floor(depth * 100)) : 100;

  // Separate items by type
  const vehicles = items.filter(item => item.type === 'vehicle');
  const resources = items.filter(item => item.type === 'resource');
  const routes = items.filter(item => item.type === 'route');

  // Get icon and color based on type
  const getTypeConfig = (type) => {
    switch(type) {
      case 'vehicle':
        return { icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-400/30' };
      case 'resource':
        return { icon: Warehouse, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/30' };
      case 'route':
        return { icon: Route, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-400/30' };
      default:
        return { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-400/30' };
    }
  };

  // Render compact item
  const renderCompactItem = (item, idx) => {
    const config = getTypeConfig(item.type);
    const Icon = config.icon;
    const data = item.data;
    const isHovered = hoveredItem === `${item.type}-${idx}`;

    let title = '';
    let status = '';
    let metric = '';

    if (item.type === 'vehicle') {
      title = data.name;
      status = data.status;
      metric = `${data.speed || 0} km/h`;
    } else if (item.type === 'resource') {
      title = data.name;
      status = data.status;
      metric = `${data.current_level || 0}/${data.capacity || 0}`;
    } else {
      title = data.name;
      status = data.status;
      metric = `${data.distance_km || 0} km`;
    }

    return (
      <motion.div
        key={`${item.type}-${idx}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.03 }}
        onMouseEnter={() => setHoveredItem(`${item.type}-${idx}`)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
          config.bg,
          isHovered ? config.border : 'border-slate-700/30'
        )}
      >
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white font-medium truncate">{title}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[8px] uppercase font-bold", config.color)}>{status}</span>
            <span className="text-[8px] text-slate-500">•</span>
            <span className="text-[8px] text-slate-400">{metric}</span>
          </div>
        </div>
        {isHovered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-violet-400/20 rounded-lg blur -z-10"
          />
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateX: -15 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        left: x + 180,
        top: y - 220
      }}
      exit={{ opacity: 0, scale: 0.85, rotateX: 15 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        zIndex: zIndex,
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        width: isExpanded ? '420px' : '360px'
      }}
    >
      {/* JARVIS HUD Container */}
      <div className="relative">
        {/* Outer Glow */}
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-amber-500/20 rounded-xl blur-lg"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Main Panel */}
        <div className="relative bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-cyan-400/40 overflow-hidden shadow-2xl">
          {/* Animated Scan Lines */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Corner Brackets */}
          <svg className="absolute top-0 left-0 w-8 h-8 text-cyan-400" viewBox="0 0 20 20">
            <path d="M0 0 L20 0 L20 2 L2 2 L2 20 L0 20 Z" fill="currentColor" opacity="0.6"/>
          </svg>
          <svg className="absolute top-0 right-0 w-8 h-8 text-cyan-400" viewBox="0 0 20 20">
            <path d="M20 0 L0 0 L0 2 L18 2 L18 20 L20 20 Z" fill="currentColor" opacity="0.6"/>
          </svg>
          <svg className="absolute bottom-0 left-0 w-8 h-8 text-violet-400" viewBox="0 0 20 20">
            <path d="M0 20 L20 20 L20 18 L2 18 L2 0 L0 0 Z" fill="currentColor" opacity="0.6"/>
          </svg>
          <svg className="absolute bottom-0 right-0 w-8 h-8 text-violet-400" viewBox="0 0 20 20">
            <path d="M20 20 L0 20 L0 18 L18 18 L18 0 L20 0 Z" fill="currentColor" opacity="0.6"/>
          </svg>

          {/* Header */}
          <div className="relative px-4 py-3 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-amber-500/10 border-b border-cyan-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-400/40 flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                </motion.div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">CLUSTER ANALYSIS</h3>
                  <p className="text-[9px] text-cyan-400 font-mono">{items.length} ENTITIES DETECTED</p>
                </div>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] text-emerald-400 font-bold uppercase">Live</span>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {/* Vehicles Section */}
            {vehicles.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    Vehicles ({vehicles.length})
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
                </div>
                <div className="space-y-1.5">
                  {vehicles.map((item, idx) => renderCompactItem(item, idx))}
                </div>
              </div>
            )}

            {/* Resources Section */}
            {resources.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Resources ({resources.length})
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
                </div>
                <div className="space-y-1.5">
                  {resources.map((item, idx) => renderCompactItem(item, idx))}
                </div>
              </div>
            )}

            {/* Routes Section */}
            {routes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                    Routes ({routes.length})
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-violet-400/40 to-transparent" />
                </div>
                <div className="space-y-1.5">
                  {routes.map((item, idx) => renderCompactItem(item, idx))}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/40">
              <div className="text-center p-2 rounded bg-cyan-500/10 border border-cyan-400/20">
                <div className="text-lg font-black text-cyan-400">{vehicles.length}</div>
                <div className="text-[8px] text-slate-400 uppercase">Vehicles</div>
              </div>
              <div className="text-center p-2 rounded bg-amber-500/10 border border-amber-400/20">
                <div className="text-lg font-black text-amber-400">{resources.length}</div>
                <div className="text-[8px] text-slate-400 uppercase">Resources</div>
              </div>
              <div className="text-center p-2 rounded bg-violet-500/10 border border-violet-400/20">
                <div className="text-lg font-black text-violet-400">{routes.length}</div>
                <div className="text-[8px] text-slate-400 uppercase">Routes</div>
              </div>
            </div>
          </div>

          {/* Data Stream Background */}
          <div className="absolute top-0 right-0 w-24 h-full overflow-hidden opacity-5 pointer-events-none">
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="text-[6px] text-cyan-400 font-mono leading-tight break-all"
            >
              {Array(150).fill('01').join('')}
            </motion.div>
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: '50%'
            }}
            animate={{
              y: [-20, -50, -20],
              opacity: [0, 0.7, 0],
              scale: [0, 1.2, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}