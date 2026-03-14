import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, Maximize2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteHologramCard from './RouteHologramCard';
import ResourceHologramCard from './ResourceHologramCard';
import VehicleHologramCard from './VehicleHologramCard';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const cardRef = useRef(null);
  const navRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const scale = useTransform(mouseY, [-0.5, 0.5], [0.95, 1.05]);

  const handleMouseMove = (e) => {
    if (!cardRef.current || isExpanded) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(percentX);
    mouseY.set(percentY);
  };
  
  const handleMouseLeave = () => {
    if (!isExpanded) {
      mouseX.set(0);
      mouseY.set(0);
    }
    setIsHovered(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const currentItem = items[currentIndex];
  const Icon = currentItem.type === 'route' ? Route : currentItem.type === 'resource' ? Warehouse : Truck;

  // If expanded, show the actual card
  if (isExpanded) {
    const props = {
      x,
      y,
      index,
      depth,
      onClose: () => setIsExpanded(false)
    };

    if (currentItem.type === 'route') {
      return <RouteHologramCard route={currentItem.data} {...props} />;
    } else if (currentItem.type === 'resource') {
      return <ResourceHologramCard resource={currentItem.data} {...props} />;
    } else {
      return <VehicleHologramCard vehicle={currentItem.data} {...props} />;
    }
  }

  const zIndex = depth ? Math.max(10, 1000 - Math.floor(depth * 100)) : 100;

  return (
    <>
      {/* Navigation Menu - Fixed positioned outside card */}
      <motion.div
        ref={navRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          transform: 'translateZ(50px)',
          left: `calc(${x}px + 384px - 28px)`,
          top: `calc(${y}px + 16px)`
        }}
      >
        {/* Center button */}
        <motion.button
          onClick={() => setIsNavOpen(!isNavOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-14 h-14 rounded-full backdrop-blur-2xl border-2 shadow-xl flex items-center justify-center transition-all",
            isNavOpen 
              ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50" 
              : "bg-slate-900/80 border-slate-700/50 hover:border-slate-600/80"
          )}
        >
          <motion.div
            animate={{ rotate: isNavOpen ? 90 : 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <Navigation className={cn("w-6 h-6", isNavOpen ? "text-cyan-400" : "text-white")} />
          </motion.div>
          
          <AnimatePresence>
            {!isNavOpen && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-cyan-400"
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Expanding menu items */}
        <AnimatePresence mode="wait">
          {isNavOpen && items.map((item, idx) => {
            const angle = (idx / items.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 100;
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;
            const isActive = idx === currentIndex;
            const ItemIcon = item.type === 'route' ? Route : item.type === 'resource' ? Warehouse : Truck;

            return (
              <motion.button
                key={idx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: offsetX,
                  y: offsetY
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.04 }}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsNavOpen(false);
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'absolute w-12 h-12 rounded-full backdrop-blur-2xl border-2 shadow-xl flex items-center justify-center transition-all',
                  isActive
                    ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50 text-cyan-400"
                    : "bg-slate-900/80 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600"
                )}
                title={item.data.name || item.data.title || item.type}
              >
                <ItemIcon className="w-5 h-5" strokeWidth={1.5} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Main Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.7, z: -200, rotateY: -30 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          z: 0,
          rotateY: 0,
          y: [0, -10, 0],
          left: x + 180,
          top: y - 200
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5, type: "spring" },
          z: { duration: 0.8 },
          rotateY: { duration: 0.8 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        exit={{ opacity: 0, scale: 0.7, z: -200, rotateY: 30 }}
        style={{
          position: 'absolute',
          zIndex: zIndex,
          pointerEvents: 'auto',
          transformStyle: 'preserve-3d',
          perspective: '1500px',
          rotateX: rotateX,
          rotateY: rotateY,
          scale: scale,
          width: '384px'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        <motion.div className="relative" style={{ transformStyle: 'preserve-3d' }}>
          <div className="absolute -inset-6" style={{ transform: 'translateZ(-20px)' }}>
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: isHovered ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 blur-lg"
              style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }}
            />
          </div>

          <motion.div 
            className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-3xl rounded-2xl overflow-hidden border-2 border-cyan-400/70 shadow-2xl"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: isHovered 
                ? '0 30px 60px rgba(6, 182, 212, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)'
                : '0 20px 40px rgba(6, 182, 212, 0.3)',
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
              animate={{
                x: ['-100%', '200%'],
                opacity: isHovered ? [0, 0.6, 0] : [0, 0, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ transform: 'translateZ(60px)' }}
            />

            <motion.div 
              className="relative px-6 py-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 border-b-2 border-cyan-400/40"
              style={{ transform: 'translateZ(40px)' }}
            >
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  </motion.div>
                  <div>
                    <motion.h3 className="text-lg font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                      {currentItem.data.name || currentItem.data.title || 'Item'}
                    </motion.h3>
                    <p className="text-xs text-cyan-300/70 font-mono">{currentIndex + 1} of {items.length}</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={handleExpand}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            <div className="relative p-6 space-y-4" style={{ transform: 'translateZ(30px)' }}>
              {/* Item Details */}
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-4">
                <p className="text-xs text-cyan-400/70 font-mono uppercase mb-2">Current Item</p>
                <p className="text-sm font-bold text-white mb-1">
                  {currentItem.data.name || currentItem.data.title || 'Item'}
                </p>
                <p className="text-xs text-cyan-300/60">{currentItem.type}</p>
                <p className="text-xs text-slate-400 mt-1">{currentIndex + 1} of {items.length}</p>
              </div>

              {/* Advanced Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {currentItem.type === 'vehicle' && (
                  <>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Status</p>
                      <p className="text-white font-bold">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Speed</p>
                      <p className="text-white font-bold">{currentItem.data.speed || 0} km/h</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Fuel</p>
                      <p className="text-white font-bold">{currentItem.data.fuel_level || 0}%</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Type</p>
                      <p className="text-white font-bold capitalize">{currentItem.data.type}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'resource' && (
                  <>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Status</p>
                      <p className="text-white font-bold">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Type</p>
                      <p className="text-white font-bold capitalize">{currentItem.data.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20 col-span-2">
                      <p className="text-cyan-400/60">Location</p>
                      <p className="text-white font-bold text-xs">{currentItem.data.location || 'Unknown'}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'route' && (
                  <>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Status</p>
                      <p className="text-white font-bold">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20">
                      <p className="text-cyan-400/60">Distance</p>
                      <p className="text-white font-bold">{currentItem.data.distance_km || 0} km</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2 border border-cyan-400/20 col-span-2">
                      <p className="text-cyan-400/60">Route</p>
                      <p className="text-white font-bold text-xs">{currentItem.data.origin} → {currentItem.data.destination}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
              style={{ left: `${20 + i * 15}%`, top: '50%', filter: 'blur(1px)' }}
              animate={{
                y: [-30, -60, -30],
                x: [0, Math.sin(i * 2) * 15, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}