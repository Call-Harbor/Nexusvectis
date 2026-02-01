import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, AlertCircle, CheckCircle2, TrendingDown, 
  Navigation, Zap, Clock, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RealtimeAlerts({ vehicles = [], onDismiss = () => {} }) {
  // Generate alerts from vehicles
  const generateAlerts = () => {
    const alerts = [];

    vehicles.forEach(vehicle => {
      // Critical fuel
      if (vehicle.fuel_level < 15) {
        alerts.push({
          id: `fuel-${vehicle.id}`,
          vehicle: vehicle.name,
          type: 'critical',
          title: 'Critical Fuel Level',
          desc: `${vehicle.fuel_level}% fuel remaining`,
          icon: AlertCircle,
          timestamp: new Date()
        });
      }

      // High speed
      if (vehicle.speed > 120) {
        alerts.push({
          id: `speed-${vehicle.id}`,
          vehicle: vehicle.name,
          type: 'warning',
          title: 'Excessive Speed',
          desc: `${vehicle.speed} km/h detected`,
          icon: TrendingDown,
          timestamp: new Date()
        });
      }

      // Offline
      if (vehicle.status === 'offline') {
        alerts.push({
          id: `offline-${vehicle.id}`,
          vehicle: vehicle.name,
          type: 'critical',
          title: 'Vehicle Offline',
          desc: 'No signal received',
          icon: AlertTriangle,
          timestamp: new Date()
        });
      }

      // Maintenance overdue
      if (vehicle.next_maintenance) {
        const nextMaint = new Date(vehicle.next_maintenance);
        const now = new Date();
        if (nextMaint < now) {
          alerts.push({
            id: `maint-${vehicle.id}`,
            vehicle: vehicle.name,
            type: 'warning',
            title: 'Maintenance Overdue',
            desc: `Should have been serviced ${Math.floor((now - nextMaint) / (1000 * 60 * 60 * 24))} days ago`,
            icon: AlertTriangle,
            timestamp: new Date()
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      const typeOrder = { critical: 0, warning: 1, info: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    }).slice(0, 4); // Show max 4 alerts
  };

  const alerts = generateAlerts();
  const typeStyles = {
    critical: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-96 rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Live Alerts</h3>
          </div>
          <span className="text-xs text-slate-500">{alerts.length} active</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`p-3 rounded-lg border ${typeStyles[alert.type]} group`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDismiss(alert.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs opacity-75">{alert.vehicle}</p>
                      <p className="text-xs opacity-60 mt-0.5">{alert.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-400">No active alerts</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/20">
          <p className="text-xs text-slate-400">
            {alerts.filter(a => a.type === 'critical').length > 0 && 
              `${alerts.filter(a => a.type === 'critical').length} critical • `}
            {alerts.filter(a => a.type === 'warning').length > 0 && 
              `${alerts.filter(a => a.type === 'warning').length} warnings`}
          </p>
        </div>
      )}
    </motion.div>
  );
}