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
      {/* Simple Navigation Menu */}
      <motion.div
        ref={navRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: `calc(${x}px + 330px)`,
          top: `calc(${y}px + 6px)`
        }}
      >
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className={cn(
            "w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700/80 transition-colors",
            isNavOpen && "bg-slate-700/80"
          )}
        >
          <Navigation className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <AnimatePresence mode="wait">
          {isNavOpen && items.map((item, idx) => {
            const angle = (idx / items.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 50;
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
                transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.02 }}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsNavOpen(false);
                }}
                className={cn(
                  'absolute w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700/80 transition-colors',
                  isActive && "bg-slate-700/80 border-slate-600"
                )}
                title={item.data.name || item.data.title || item.type}
              >
                <ItemIcon className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.5} />
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
        <motion.div className="relative">
          <motion.div 
            className="relative bg-slate-900/90 backdrop-blur-xl rounded-lg overflow-hidden border border-slate-700/60 shadow-2xl"
            style={{
              boxShadow: isHovered 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >

            <div className="relative px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-300" />
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {currentItem.data.name || currentItem.data.title || 'Item'}
                    </h3>
                    <p className="text-[10px] text-slate-400">{currentIndex + 1} of {items.length}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                    className="p-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleExpand}
                    className="p-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                    className="p-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative p-3 space-y-2">
              {/* Advanced Details */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {currentItem.type === 'vehicle' && (
                  <>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Status</p>
                      <p className="text-white font-medium">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Speed</p>
                      <p className="text-white font-medium">{currentItem.data.speed || 0} km/h</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Fuel</p>
                      <p className="text-white font-medium">{currentItem.data.fuel_level || 0}%</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Type</p>
                      <p className="text-white font-medium capitalize">{currentItem.data.type}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'resource' && (
                  <>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Status</p>
                      <p className="text-white font-medium">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Type</p>
                      <p className="text-white font-medium capitalize">{currentItem.data.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40 col-span-2">
                      <p className="text-slate-400 mb-0.5">Location</p>
                      <p className="text-white font-medium text-[9px]">{currentItem.data.location || 'Unknown'}</p>
                    </div>
                  </>
                )}
                {currentItem.type === 'route' && (
                  <>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Status</p>
                      <p className="text-white font-medium">{currentItem.data.status || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40">
                      <p className="text-slate-400 mb-0.5">Distance</p>
                      <p className="text-white font-medium">{currentItem.data.distance_km || 0} km</p>
                    </div>
                    <div className="bg-slate-800/40 rounded p-1.5 border border-slate-700/40 col-span-2">
                      <p className="text-slate-400 mb-0.5">Route</p>
                      <p className="text-white font-medium text-[9px]">{currentItem.data.origin} → {currentItem.data.destination}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>


        </motion.div>
      </motion.div>
    </>
  );
}