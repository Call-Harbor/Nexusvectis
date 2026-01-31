import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, AlertCircle, CheckCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const alertIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  success: CheckCircle,
};

const alertColors = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const categoryLabels = {
  maintenance: "Maintenance",
  delay: "Delay",
  weather: "Weather",
  fuel: "Fuel",
  route: "Route",
  system: "System",
};

export default function AlertPanel({ alerts, onMarkRead, onResolve }) {
  const unreadAlerts = alerts.filter(a => !a.is_resolved).slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Active Alerts</h3>
              <p className="text-sm text-slate-500">{unreadAlerts.length} require attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-700/30">
        <AnimatePresence mode="popLayout">
          {unreadAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-400">All systems running optimally</p>
            </motion.div>
          ) : (
            unreadAlerts.map((alert, index) => {
              const Icon = alertIcons[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 ${alertColors[alert.type]} border-l-2`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{alert.title}</span>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {categoryLabels[alert.category]}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                      {alert.ai_recommendation && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-violet-300">{alert.ai_recommendation}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                      onClick={() => onResolve && onResolve(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}