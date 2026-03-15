import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Warehouse, Truck, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteHologramCard from './RouteHologramCard';
import ResourceHologramCard from './ResourceHologramCard';
import VehicleHologramCard from './VehicleHologramCard';

export default function CombinedHologramCard({ items, x, y, index, depth }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentItem = items[currentIndex];
  
  // If expanded, show full detail card
  if (isExpanded) {
    const props = { x, y, index, depth, onClose: () => setIsExpanded(false) };
    
    if (currentItem.type === 'route') {
      return <RouteHologramCard route={currentItem.data} {...props} />;
    } else if (currentItem.type === 'resource') {
      return <ResourceHologramCard resource={currentItem.data} {...props} />;
    } else {
      return <VehicleHologramCard vehicle={currentItem.data} {...props} />;
    }
  }

  const Icon = currentItem.type === 'route' ? Route : currentItem.type === 'resource' ? Warehouse : Truck;
  const zIndex = depth ? Math.max(10, 1000 - Math.floor(depth * 100)) : 100;

  // Get display data based on type
  const getDisplayData = () => {
    if (currentItem.type === 'vehicle') {
      return {
        title: currentItem.data.name,
        subtitle: currentItem.data.type,
        fields: [
          { label: 'Status', value: currentItem.data.status },
          { label: 'Speed', value: `${currentItem.data.speed || 0} km/h` },
          { label: 'Fuel', value: `${currentItem.data.fuel_level || 0}%` },
          { label: 'Destination', value: currentItem.data.destination || 'N/A' }
        ]
      };
    } else if (currentItem.type === 'resource') {
      return {
        title: currentItem.data.name,
        subtitle: currentItem.data.type?.replace(/_/g, ' '),
        fields: [
          { label: 'Status', value: currentItem.data.status },
          { label: 'Capacity', value: `${currentItem.data.current_level || 0}/${currentItem.data.capacity || 0}` },
          { label: 'Location', value: currentItem.data.location || 'Unknown' }
        ]
      };
    } else {
      return {
        title: currentItem.data.name,
        subtitle: `${currentItem.data.origin} → ${currentItem.data.destination}`,
        fields: [
          { label: 'Status', value: currentItem.data.status },
          { label: 'Distance', value: `${currentItem.data.distance_km || 0} km` },
          { label: 'Transport', value: currentItem.data.transport_type || 'N/A' }
        ]
      };
    }
  };

  const displayData = getDisplayData();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        left: x + 160,
        top: y - 180
      }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: 'absolute',
        zIndex: zIndex,
        pointerEvents: 'auto',
        width: '320px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      {/* Main Card Container */}
      <motion.div 
        className="relative bg-slate-900/95 backdrop-blur-xl rounded-lg overflow-hidden border border-slate-700/70 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Scan Line Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-cyan-400/0 via-cyan-400/10 to-cyan-400/0"
          animate={{
            y: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ pointerEvents: 'none' }}
        />

        {/* Header */}
        <div className="relative px-4 py-3 bg-slate-800/60 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">
                  {displayData.title}
                </h3>
                <p className="text-[10px] text-slate-400 capitalize truncate">
                  {displayData.subtitle}
                </p>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[9px] text-slate-500 mr-1">{currentIndex + 1}/{items.length}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
                }}
                className="p-0.5 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev + 1) % items.length);
                }}
                className="p-0.5 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {displayData.fields.map((field, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "bg-slate-800/40 rounded px-2 py-1.5 border border-slate-700/40",
                  displayData.fields.length === 3 && idx === 2 && "col-span-2"
                )}
              >
                <p className="text-[9px] text-slate-500 mb-0.5">{field.label}</p>
                <p className="text-[11px] text-white font-medium truncate">{field.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Expand Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="mt-2 w-full py-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Details
          </motion.button>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400/50" />
      </motion.div>

      {/* Glow Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-0.5 bg-cyan-400/20 rounded-lg blur-md -z-10"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}