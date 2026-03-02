import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Clock, DollarSign, Zap, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PredictiveMaintenancePanel({ orgId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const analyzeMaintenance = async () => {
      try {
        const response = await base44.functions.invoke('predictiveMaintenanceScheduler', { 
          organization_id: orgId 
        });
        setAnalysis(response.data);
      } catch (error) {
        console.error('Maintenance analysis error:', error);
      } finally {
        setLoading(false);
      }
    };
    analyzeMaintenance();
  }, [orgId]);

  if (loading) {
    return <div className="p-6 text-slate-400">Analyzing vehicle maintenance needs...</div>;
  }

  if (!analysis) {
    return <div className="p-6 text-slate-400">No maintenance data available</div>;
  }

  const { summary, risks, created_orders, optimized_schedule } = analysis;

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">CRITICAL</p>
              <p className="text-2xl font-bold text-red-400">{summary.critical_vehicles}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500/50" />
          </div>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">ORDERS CREATED</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.maintenance_orders_created}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-cyan-500/50" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">DOWNTIME SAVED</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.potential_downtime_avoidance_hours}h</p>
            </div>
            <TrendingDown className="w-8 h-8 text-emerald-500/50" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">TOTAL VEHICLES</p>
              <p className="text-2xl font-bold text-violet-400">{summary.total_vehicles}</p>
            </div>
            <Zap className="w-8 h-8 text-violet-500/50" />
          </div>
        </Card>
      </div>

      {/* Risk List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Vehicle Maintenance Risk Analysis</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {risks.map((risk, idx) => (
            <motion.div
              key={risk.vehicle_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedVehicle(selectedVehicle?.vehicle_id === risk.vehicle_id ? null : risk)}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white">{risk.vehicle_name}</p>
                  <p className="text-xs text-slate-400">Last service: {risk.days_since_maintenance} days ago</p>
                </div>
                <Badge className={`${
                  risk.urgency === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                  risk.urgency === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                }`}>
                  {risk.failure_probability}% Risk
                </Badge>
              </div>

              {selectedVehicle?.vehicle_id === risk.vehicle_id && (
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">Recommended: {risk.recommended_services.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">Est. downtime: {risk.estimated_downtime_hours} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-slate-300">Est. cost: €{risk.cost_estimate}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Optimized Schedule */}
      {optimized_schedule.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Optimized Service Schedule</h3>
          <div className="space-y-2">
            {optimized_schedule.map((item, idx) => (
              <div key={item.vehicle_id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 text-sm">
                <p className="font-semibold text-cyan-400">{item.vehicle_name}</p>
                <p className="text-slate-400">Scheduled: {item.suggested_schedule_date} | Batch #{item.batch_group}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}