import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, Brain, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AdvancedModelMonitoring() {
  const { data: fleetAIUsages = [] } = useQuery({
    queryKey: ['fleetaiusage_monitor'],
    queryFn: () => base44.entities.FleetAIUsage.list('-created_date', 100),
  });
  const { data: apiUsages = [] } = useQuery({
    queryKey: ['apiusage_monitor'],
    queryFn: () => base44.entities.APIUsage.list('-created_date', 100),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles_monitor'],
    queryFn: () => base44.entities.Vehicle.list(),
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts_monitor'],
    queryFn: () => base44.entities.Alert.list(),
  });
  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments_monitor'],
    queryFn: () => base44.entities.Shipment.list(),
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['routes_monitor'],
    queryFn: () => base44.entities.Route.list(),
  });

  // Build real-time metrics from last 5 hours of FleetAI usage
  const buildRealtimeMetrics = () => {
    const now = Date.now();
    const buckets = Array.from({ length: 5 }, (_, i) => {
      const label = `${i * 6}h`;
      const bucketStart = now - (5 - i) * 6 * 3600 * 1000;
      const bucketEnd = now - (4 - i) * 6 * 3600 * 1000;
      const bucket = fleetAIUsages.filter(u => {
        const t = new Date(u.created_date).getTime();
        return t >= bucketStart && t < bucketEnd;
      });
      const apiBucket = apiUsages.filter(u => {
        const t = new Date(u.created_date).getTime();
        return t >= bucketStart && t < bucketEnd;
      });
      const inferenceCount = bucket.length + apiBucket.length;
      const successRate = bucket.length > 0 ? bucket.filter(u => u.success !== false).length / bucket.length : 1;
      const avgLatency = apiBucket.length > 0
        ? apiBucket.reduce((s, a) => s + (a.response_time_ms || 150), 0) / apiBucket.length
        : 150;
      return {
        time: label,
        inference: Math.max(1, inferenceCount),
        accuracy: parseFloat((70 + successRate * 25).toFixed(1)),
        latency: Math.round(avgLatency),
        health: Math.round(successRate * 100),
      };
    });
    // If no real data at all, use a small baseline
    const anyData = fleetAIUsages.length > 0 || apiUsages.length > 0;
    if (!anyData) {
      return [
        { time: '0h', inference: 0, accuracy: 0, latency: 0, health: 0 },
        { time: '6h', inference: 0, accuracy: 0, latency: 0, health: 0 },
        { time: '12h', inference: 0, accuracy: 0, latency: 0, health: 0 },
        { time: '18h', inference: 0, accuracy: 0, latency: 0, health: 0 },
        { time: '24h', inference: 0, accuracy: 0, latency: 0, health: 0 },
      ];
    }
    return buckets;
  };

  const realtimeMetrics = buildRealtimeMetrics();

  // Radar from real entity metrics
  const avgEfficiency = vehicles.length > 0 ? vehicles.reduce((s, v) => s + (v.efficiency_score || 75), 0) / vehicles.length : 0;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  const accuracy = shipments.length > 0 ? Math.min(99, 70 + (deliveredShipments / shipments.length) * 25) : 0;
  const apiSuccessRate = apiUsages.length > 0 ? (apiUsages.filter(a => a.status_code < 400).length / apiUsages.length) * 100 : 0;
  const activeRouteRatio = routes.length > 0 ? (routes.filter(r => r.status === 'active').length / routes.length) * 100 : 0;
  const fleetSuccessRate = fleetAIUsages.length > 0 ? (fleetAIUsages.filter(u => u.success !== false).length / fleetAIUsages.length) * 100 : 0;

  const modelHealthData = [
    { metric: 'Accuracy', value: Math.round(accuracy) },
    { metric: 'Stability', value: Math.round(apiSuccessRate) },
    { metric: 'Performance', value: Math.round(avgEfficiency) },
    { metric: 'Robustness', value: Math.round(fleetSuccessRate) },
    { metric: 'Efficiency', value: Math.round(activeRouteRatio) },
  ];

  // Summary stats
  const totalInferences = fleetAIUsages.length + apiUsages.length;
  const avgLatencyMs = apiUsages.length > 0
    ? Math.round(apiUsages.reduce((s, a) => s + (a.response_time_ms || 150), 0) / apiUsages.length)
    : 0;
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Inferences', value: totalInferences.toLocaleString(), color: 'text-cyan-400', icon: Zap },
          { label: 'Avg Latency', value: avgLatencyMs > 0 ? `${avgLatencyMs}ms` : '—', color: 'text-emerald-400', icon: Activity },
          { label: 'Model Health', value: accuracy > 0 ? `${accuracy.toFixed(1)}%` : '—', color: 'text-violet-400', icon: Brain },
          { label: 'Active Alerts', value: unresolvedAlerts.toString(), color: 'text-amber-400', icon: AlertCircle },
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
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Inference Volume (24h)
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
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }} />
              <Area type="monotone" dataKey="inference" stroke="#06b6d4" fill="url(#colorInference)" name="Inferences" />
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
            <p className="text-xs text-slate-300">
              {unresolvedAlerts > 0
                ? `${unresolvedAlerts} unresolved alert${unresolvedAlerts > 1 ? 's' : ''} detected. Fleet AI commands: ${fleetAIUsages.length}. API calls: ${apiUsages.length}.`
                : `No active anomalies. Fleet AI commands: ${fleetAIUsages.length}. API calls: ${apiUsages.length}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}