import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';
import FuturisticGlobe from "@/components/holographic/FuturisticGlobe";

// Wrapper that delegates to FuturisticGlobe so both Dashboard and IntellectMode
// show the same globe with CombinedHologramCard holograms.
export default function FleetGlobe3D({ vehicles = [], routes = [], resources = [], digitalTwins = [], onClose, onMinimize }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {isMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 z-50"
        >
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 backdrop-blur-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-500/40 hover:to-violet-500/40 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white text-sm font-medium">3D Fleet Globe</span>
            <span className="text-cyan-400 text-xs">{vehicles.length} v</span>
          </button>
        </motion.div>
      )}

      {!isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsMinimized(true)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl h-[80vh] rounded-2xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent backdrop-blur-sm border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xl font-bold text-white">3D Fleet Globe</h3>
                <span className="text-sm text-cyan-400">{vehicles.length} vehicles • {routes.length} routes</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FuturisticGlobe — same as Dashboard */}
            <FuturisticGlobe
              vehicles={vehicles}
              routes={routes}
              resources={resources}
              digitalTwins={digitalTwins}
              onSelectVehicle={() => {}}
              onSelectResource={() => {}}
            />
          </div>
        </div>
      )}
    </>
  );
}