import { motion } from "framer-motion";
import { AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TransitAlertBar({ delayedTrips, overloadedBuses, alerts, onAnalyze, isAnalyzing }) {
  if (delayedTrips.length === 0 && overloadedBuses.length === 0 && alerts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
          <div>
            <p className="text-white font-semibold">System Alerts</p>
            <p className="text-sm text-slate-400">
              {delayedTrips.length} delayed trips • {overloadedBuses.length} overloaded buses • {alerts.length} active alerts
            </p>
          </div>
        </div>
        <Button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-rose-500 to-amber-500"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Get AI Solutions'}
        </Button>
      </div>
    </motion.div>
  );
}