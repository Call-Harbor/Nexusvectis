import { motion } from "framer-motion";
import { Satellite, Radio, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MapHeader({ vehicleCount, activeCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
            <Satellite className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Live Tracking</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Fleet Monitor
            </p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-lg bg-slate-900/70 backdrop-blur-md border border-slate-700/50 hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">{activeCount} Active</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <span className="text-slate-400">{vehicleCount} Total</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-lg bg-slate-900/70 backdrop-blur-md border border-slate-700/50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-slate-300">AI Mode</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}