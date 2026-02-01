import { motion } from "framer-motion";
import { AlertTriangle, Clock, Zap, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const severityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const statusColors = {
  detected: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  analyzing: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  action_taken: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  escalated: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const typeIcons = {
  delay: Clock,
  shortage: AlertTriangle,
  damage: AlertTriangle,
  route_blocked: AlertTriangle,
  weather: AlertTriangle,
  mechanical: AlertTriangle,
  customs: AlertTriangle,
};

export default function ExceptionManagement({ exceptions = [], onResolve }) {
  const activeExceptions = exceptions.filter(e => e.status !== 'resolved');
  const autoResolved = exceptions.filter(e => e.auto_resolved).length;
  const avgResolutionTime = Math.round(
    exceptions.filter(e => e.resolved_at).reduce((acc, e) => {
      const detected = new Date(e.detected_at);
      const resolved = new Date(e.resolved_at);
      return acc + (resolved - detected) / (1000 * 60);
    }, 0) / (exceptions.filter(e => e.resolved_at).length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Exceptions</p>
              <p className="text-2xl font-bold text-white mt-1">{activeExceptions.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Auto-Resolved</p>
              <p className="text-2xl font-bold text-violet-400 mt-1">{autoResolved}</p>
            </div>
            <Zap className="w-8 h-8 text-violet-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg. Resolution</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{avgResolutionTime}m</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </motion.div>
      </div>

      {/* Active Exceptions */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Active Exceptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeExceptions.map((exception, index) => {
            const Icon = typeIcons[exception.type] || AlertTriangle;
            return (
              <motion.div
                key={exception.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${severityColors[exception.severity]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">{exception.title}</h4>
                        <Badge variant="outline" className={severityColors[exception.severity]}>
                          {exception.severity}
                        </Badge>
                        <Badge variant="outline" className={statusColors[exception.status]}>
                          {exception.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-3">{exception.description}</p>
                      
                      {exception.ai_recommendation && (
                        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-3">
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-violet-300 mb-1">AI Recommendation</p>
                              <p className="text-xs text-violet-400">{exception.ai_recommendation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs">
                        {exception.detected_at && (
                          <span className="text-slate-500">
                            Detected {formatDistanceToNow(new Date(exception.detected_at), { addSuffix: true })}
                          </span>
                        )}
                        {exception.estimated_delay_minutes && (
                          <span className="text-amber-400">
                            +{exception.estimated_delay_minutes}min delay
                          </span>
                        )}
                        {exception.impact_score && (
                          <span className="text-rose-400">
                            Impact: {exception.impact_score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                    onClick={() => onResolve && onResolve(exception.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </motion.div>
            );
          })}

          {activeExceptions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400 opacity-50" />
              <p>No active exceptions - all systems operating normally</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}