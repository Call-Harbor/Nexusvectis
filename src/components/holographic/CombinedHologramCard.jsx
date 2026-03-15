import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, Maximize2, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteHologramCard from './RouteHologramCard';
import ResourceHologramCard from './ResourceHologramCard';
import VehicleHologramCard from './VehicleHologramCard';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const cardRef = useRef(null);
  const navRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
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
      {/* Compact Navigation Menu */}
      <motion.div
        ref={navRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: `calc(${x}px + 360px)`,
          top: `calc(${y}px + 8px)`
        }}
      >
        {/* Center navigation button */}
        <motion.button
          onClick={() => setIsNavOpen(!isNavOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-10 h-10 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center transition-all",
            isNavOpen 
              ? "bg-cyan-500/20 border-cyan-400/40" 
              : "bg-slate-900/60 border-slate-700/40 hover:border-cyan-400/30"
          )}
        >
          <Navigation className={cn("w-4 h-4 transition-colors", isNavOpen ? "text-cyan-400" : "text-slate-300")} />
        </motion.button>

        {/* Compact menu items */}
        <AnimatePresence mode="wait">
          {isNavOpen && items.map((item, idx) => {
            const angle = (idx / items.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 60;
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
                transition={{ type: 'spring', stiffness: 400, damping: 28, delay: idx * 0.03 }}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsNavOpen(false);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'absolute w-9 h-9 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center transition-all',
                  isActive
                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-400"
                    : "bg-slate-900/70 border-slate-700/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/30"
                )}
                title={item.data.name || item.data.title || item.type}
              >
                <ItemIcon className="w-4 h-4" strokeWidth={1.5} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Main Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.8, z: -150 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          z: 0,
          y: [0, -8, 0],
          left: x + 160,
          top: y - 180
        }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { duration: 0.5, type: "spring", stiffness: 200 },
          z: { duration: 0.6 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }}
        exit={{ opacity: 0, scale: 0.8, z: -150 }}
        style={{
          position: 'absolute',
          zIndex: zIndex,
          pointerEvents: 'auto',
          transformStyle: 'preserve-3d',
          perspective: '1200px',
          rotateX: rotateX,
          rotateY: rotateY,
          scale: scale,
          width: '340px'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        <motion.div className="relative" style={{ transformStyle: 'preserve-3d' }}>
          {/* Subtle outer glow */}
          <div className="absolute -inset-4" style={{ transform: 'translateZ(-15px)' }}>
            <motion.div
              animate={{ 
                opacity: isHovered ? [0.3, 0.5, 0.3] : [0.15, 0.25, 0.15]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border border-cyan-400/30 blur-md"
              style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' }}
            />
          </div>

          <motion.div 
            className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-2xl rounded-xl overflow-hidden border border-cyan-400/50 shadow-xl"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: isHovered 
                ? '0 20px 40px rgba(6, 182, 212, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)'
                : '0 15px 30px rgba(6, 182, 212, 0.25)',
            }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
              animate={{
                x: ['-100%', '200%'],
                opacity: isHovered ? [0, 0.4, 0] : [0, 0, 0]
              }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
              style={{ transform: 'translateZ(40px)' }}
            />

            <motion.div 
              className="relative px-5 py-3 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-cyan-500/15 border-b border-cyan-400/30"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <motion.div 
                    className="relative"
                    whileHover={{ rotate: 360, scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {currentItem.data.name || currentItem.data.title || 'Item'}
                    </h3>
                    <p className="text-[10px] text-cyan-300/60 font-mono">{currentIndex + 1} of {items.length}</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5">
                  <motion.button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    onClick={handleExpand}
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="relative p-4 space-y-3" style={{ transform: 'translateZ(25px)' }}>
              {/* Item Details */}
              <div className="bg-cyan-500/8 border border-cyan-400/20 rounded-lg p-3">
                <p className="text-[10px] text-cyan-400/60 font-mono uppercase mb-1.5">Current Item</p>
                <p className="text-sm font-semibold text-white mb-0.5">
                  {currentItem.data.name || currentItem.data.title || 'Item'}
                </p>
                <p className="text-[11px] text-cyan-300/50 capitalize">{currentItem.type}</p>
              </div>

              {/* Advanced Details */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {currentItem.type === 'vehicle' && (
                  <>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Status</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Speed</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.speed || 0} km/h</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Fuel</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.fuel_level || 0}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Type</p>
                      <p className="text-white font-semibold text-xs capitalize">{currentItem.data.type}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'resource' && (
                  <>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Status</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Type</p>
                      <p className="text-white font-semibold text-xs capitalize">{currentItem.data.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15 col-span-2">
                      <p className="text-cyan-400/50 mb-0.5">Location</p>
                      <p className="text-white font-semibold text-[10px]">{currentItem.data.location || 'Unknown'}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'route' && (
                  <>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Status</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15">
                      <p className="text-cyan-400/50 mb-0.5">Distance</p>
                      <p className="text-white font-semibold text-xs">{currentItem.data.distance_km || 0} km</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 border border-cyan-400/15 col-span-2">
                      <p className="text-cyan-400/50 mb-0.5">Route</p>
                      <p className="text-white font-semibold text-[10px]">{currentItem.data.origin} → {currentItem.data.destination}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400/40"
              style={{ left: `${30 + i * 20}%`, top: '40%', filter: 'blur(0.5px)' }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, delay: i * 1, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}