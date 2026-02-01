import { motion } from "framer-motion";
import { Wrench, AlertTriangle, Clock, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function PredictiveMaintenance({ maintenanceRecords = [], vehicles = [] }) {
  const predictiveRecords = maintenanceRecords.filter(m => m.type === 'predictive' && m.status === 'pending');
  const upcomingRecords = maintenanceRecords.filter(m => m.status === 'pending').slice(0, 5);

  const stats = {
    total: maintenanceRecords.length,
    predictive: maintenanceRecords.filter(m => m.type === 'predictive').length,
    critical: maintenanceRecords.filter(m => m.priority === 'critical' && m.status === 'pending').length,
    avgConfidence: Math.round(
      maintenanceRecords.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / 
      (maintenanceRecords.length || 1)
    ),
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Maintenance</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-cyan-400" />
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
              <p className="text-sm text-slate-400">AI Predicted</p>
              <p className="text-2xl font-bold text-violet-400 mt-1">{stats.predictive}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-violet-400" />
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
              <p className="text-sm text-slate-400">Critical Issues</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg. Confidence</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.avgConfidence}%</p>
            </div>
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="4" fill="none" />
                <circle 
                  cx="20" cy="20" r="16" 
                  stroke="#10b981" 
                  strokeWidth="4" 
                  fill="none"
                  strokeDasharray={`${stats.avgConfidence * 1.005} 100.5`}
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upcoming Maintenance */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Upcoming Maintenance Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingRecords.map((record, index) => {
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{vehicle?.name || 'Unknown Vehicle'}</h4>
                      <Badge variant="outline" className={priorityColors[record.priority]}>
                        {record.priority}
                      </Badge>
                      {record.type === 'predictive' && (
                        <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                          AI Predicted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{record.component}: {record.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {record.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">
                            {format(new Date(record.scheduled_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {record.cost_estimate && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">${record.cost_estimate}</span>
                        </div>
                      )}
                      {record.downtime_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">{record.downtime_hours}h downtime</span>
                        </div>
                      )}
                      {record.ai_confidence && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-violet-400" />
                          <span className="text-violet-400">{record.ai_confidence}% confidence</span>
                        </div>
                      )}
                    </div>

                    {record.ai_confidence && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">AI Confidence</span>
                          <span className="text-violet-400">{record.ai_confidence}%</span>
                        </div>
                        <Progress value={record.ai_confidence} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {upcomingRecords.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming maintenance scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}