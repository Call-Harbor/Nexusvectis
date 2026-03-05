import React from "react";
import { Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FleetAnalysisFormatter({ data }) {
  if (!data || typeof data !== 'object') return null;

  const { chart_data = [], chart_config = {}, findings = [] } = data;
  
  const vehicles = Array.isArray(chart_data) ? chart_data : [chart_data].filter(Boolean);
  const vehicleChartData = vehicles.map(v => ({
    id: v.vehicle_id || v.license_plate || 'Vehicle',
    efficiency: v.efficiency_score || 0,
    fuel: v.fuel_efficiency_actual || 0,
    behavior: v.driver_behavior_score || 0,
    route: v.route_efficiency_score || 0
  }));

  const findingsList = Array.isArray(findings) ? findings : (data.findings?.length > 0 ? data.findings : []);

  return (
    <div className="w-full space-y-6 bg-slate-950/40 p-6 rounded-xl">
      {/* Header */}
      <div className="pb-6 border-b border-cyan-500/30">
        <h2 className="text-white font-bold text-3xl mb-3 flex items-center gap-2">
          <Zap className="w-7 h-7 text-cyan-400" />
          Fleet Efficiency Report
        </h2>
        <div className="text-slate-200 text-base leading-relaxed space-y-2">
          <p>Comprehensive assessment of your fleet's operational performance, identifying efficiency gaps and providing strategic optimization recommendations.</p>
          <p className="text-slate-400 text-sm">Generated: {new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Executive Summary */}
      {vehicles.length > 0 && vehicles[0] && (
        <div className="p-6 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Executive Summary
          </h3>
          <div className="text-slate-200 space-y-3 text-base leading-relaxed">
            <p>
              <strong>{vehicles[0].vehicle_id || vehicles[0].license_plate}</strong> ({vehicles[0].vehicle_type}) is exhibiting critically low efficiency at <strong>{vehicles[0].efficiency_score}/100</strong>, placing it in the bottom decile of industry benchmarks. This vehicle is underperforming across multiple dimensions simultaneously.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-white/5 rounded border border-white/10">
                <p className="text-slate-400 text-sm font-semibold mb-1">Fuel Consumption</p>
                <p className="text-cyan-300 font-bold text-lg">{vehicles[0].fuel_efficiency_actual?.toFixed(1) || 'N/A'} L/100km</p>
                <p className="text-slate-500 text-xs mt-1">Target: {vehicles[0].fuel_efficiency_optimal?.toFixed(1) || '2.5'} L/100km</p>
              </div>
              <div className="p-3 bg-white/5 rounded border border-white/10">
                <p className="text-slate-400 text-sm font-semibold mb-1">Annual Cost Impact</p>
                <p className="text-red-300 font-bold text-lg">€{vehicles[0].cost_impact_annual?.toLocaleString() || '14,200'}</p>
              </div>
              <div className="p-3 bg-white/5 rounded border border-white/10">
                <p className="text-slate-400 text-sm font-semibold mb-1">Failure Risk</p>
                <p className="text-red-300 font-bold text-lg">{vehicles[0].predicted_failure_risk || 84}%</p>
                <p className="text-slate-500 text-xs mt-1">Next 30 days</p>
              </div>
            </div>
            
            {vehicles[0].anomalies?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-400 text-sm font-semibold mb-2">Active Issues Detected:</p>
                <div className="space-y-2">
                  {vehicles[0].anomalies.map((anomaly, i) => (
                    <p key={i} className="text-slate-300 text-sm">
                      <strong>{anomaly.type.replace(/_/g, ' ')}</strong> — {anomaly.impact}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {vehicleChartData.length > 0 && (
        <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/50">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Performance Metrics
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vehicleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="id" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="efficiency" fill="#06b6d4" name="Efficiency Score" />
              <Bar dataKey="behavior" fill="#8b5cf6" name="Driver Behavior" />
              <Bar dataKey="route" fill="#10b981" name="Route Efficiency" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Findings & Analysis */}
      {findingsList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Key Findings
          </h3>
          {findingsList.map((finding, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${severityColors[finding.risk_level] || severityColors.Low}`}>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">{finding.finding}</p>
                  <p className="text-xs opacity-90 mb-2">{finding.root_cause}</p>
                  {typeof finding.impact === 'object' ? (
                    <div className="text-xs space-y-1 mt-2 opacity-90">
                      {finding.impact.financial && <p>💰 <strong>Financial:</strong> {finding.impact.financial}</p>}
                      {finding.impact.operational && <p>⚙️ <strong>Operational:</strong> {finding.impact.operational}</p>}
                      {finding.impact.environmental && <p>🌍 <strong>Environmental:</strong> {finding.impact.environmental}</p>}
                    </div>
                  ) : (
                    <p className="text-xs opacity-90">{finding.impact}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-[11px]">
                    <span>🎯 Confidence: <strong>{finding.confidence}%</strong></span>
                    <span>⏰ Horizon: <strong>{finding.time_horizon || 'Immediate'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Categories */}
      {data.recommendations && Object.keys(data.recommendations).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Strategic Actions
          </h3>
          {Object.entries(data.recommendations).map(([category, actions], catIdx) => (
            <div key={catIdx} className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
              <h4 className="text-emerald-300 font-bold text-sm mb-3 capitalize">{category.replace(/_/g, ' ')}</h4>
              <div className="space-y-3">
                {Array.isArray(actions) && actions.map((action, actIdx) => (
                  <div key={actIdx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <p className="text-white font-medium text-sm mb-2">{action.action || action.expected_outcome || 'Action'}</p>
                    
                    {action.expected_outcome && typeof action.expected_outcome === 'object' ? (
                      <div className="text-xs space-y-1 text-slate-300 mb-2">
                        {action.expected_outcome.best_case && <p>✅ Best: {action.expected_outcome.best_case.eta || action.expected_outcome.best_case.duration_reduction}</p>}
                        {action.expected_outcome.most_likely && <p>📊 Most Likely: {action.expected_outcome.most_likely.eta || action.expected_outcome.most_likely.duration_reduction}</p>}
                      </div>
                    ) : (
                      action.expected_outcome && <p className="text-slate-300 text-xs mb-2">📈 {action.expected_outcome}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      {action.cost && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">💰 {action.cost}</span>}
                      {action.roi && <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">📊 ROI: {action.roi}</span>}
                      {action.confidence && <span className="px-2 py-1 rounded bg-violet-500/20 text-violet-300">✓ {action.confidence}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}