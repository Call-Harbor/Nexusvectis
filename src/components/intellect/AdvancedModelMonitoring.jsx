import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, Brain, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const realtimeMetrics = [
  { time: '00:00', inference: 45, accuracy: 94.2, latency: 32, health: 98 },
  { time: '06:00', inference: 52, accuracy: 94.5, latency: 29, health: 97 },
  { time: '12:00', inference: 78, accuracy: 95.1, latency: 25, health: 99 },
  { time: '18:00', inference: 65, accuracy: 94.8, latency: 28, health: 98 },
  { time: '24:00', inference: 48, accuracy: 94.6, latency: 31, health: 97 },
];

const modelHealthData = [
  { metric: 'Accuracy', value: 94.2 },
  { metric: 'Stability', value: 96.5 },
  { metric: 'Performance', value: 92.1 },
  { metric: 'Robustness', value: 88.3 },
  { metric: 'Efficiency', value: 95.7 },
];

export default function AdvancedModelMonitoring() {
  const [monitoring, setMonitoring] = useState(true);
  const [alerts, setAlerts] = useState(2);

  useEffect(() => {
    if (!monitoring) return;
    const interval = setInterval(() => {
      setAlerts(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : -1)));
    }, 5000);
    return () => clearInterval(interval);
  }, [monitoring]);

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Inference/sec', value: '78.5K', color: 'text-cyan-400', icon: Zap },
          { label: 'Avg Latency', value: '28ms', color: 'text-emerald-400', icon: Activity },
          { label: 'Model Health', value: '94.2%', color: 'text-violet-400', icon: Brain },
          { label: 'Active Alerts', value: alerts.toString(), color: 'text-amber-400', icon: AlertCircle },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-3 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`w-5 h-5 ${stat.color} opacity-50`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Performance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Real-time Metrics
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={realtimeMetrics}>
              <defs>
                <linearGradient id="colorInference" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="rgba(148,163,184,0.3)" height={20} tick={{ fontSize: 10 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }} />
              <Area type="monotone" dataKey="inference" stroke="#06b6d4" fill="url(#colorInference)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" /> Model Health Radar
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <RadarChart data={modelHealthData}>
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="metric" stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(148,163,184,0.3)" />
              <Radar name="Health" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Detection */}
      <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-lg p-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Anomaly Detection Active</p>
            <p className="text-xs text-slate-300">System detected 2 potential issues. Drift: 0.3%, Outliers: 12</p>
          </div>
        </div>
      </div>
    </div>
  );
}