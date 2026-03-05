import React from "react";
import { Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FleetAnalysisFormatter({ data }) {
  if (!data || typeof data !== 'object') return null;

  const { chart_data = [], chart_config = {}, findings = [] } = data;
  
  const severityColors = {
    Critical: 'border-red-500/50 bg-red-500/10 text-red-300',
    High: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
    Medium: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    Low: 'border-blue-500/50 bg-blue-500/10 text-blue-300'
  };

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
      <div className="pb-4 border-b border-cyan-500/20">
        <h2 className="text-white font-bold text-2xl mb-2 flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          Fleet Efficiency Analysis
        </h2>
        <p className="text-slate-300">Comprehensive vehicle performance assessment and optimization recommendations</p>
      </div>

      {/* Vehicle Overview Cards */}
      {vehicles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Vehicle Performance Summary
          </h3>
          {vehicles.map((vehicle, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-bold text-lg">{vehicle.vehicle_id || vehicle.license_plate}</p>
                  <p className="text-slate-400 text-sm">{vehicle.vehicle_type}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${vehicle.efficiency_score < 70 ? 'bg-red-500/30 text-red-300' : vehicle.efficiency_score < 80 ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'}`}>
                  Efficiency: {vehicle.efficiency_score}/100
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/30">
                  <p className="text-cyan-400 text-xs font-semibold">Fuel (L/100km)</p>
                  <p className="text-white font-bold">{vehicle.fuel_efficiency_actual?.toFixed(1) || 'N/A'}</p>
                </div>
                <div className="p-2 bg-violet-500/10 rounded border border-violet-500/30">
                  <p className="text-violet-400 text-xs font-semibold">Driver Score</p>
                  <p className="text-white font-bold">{vehicle.driver_behavior_score || 'N/A'}</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
                  <p className="text-emerald-400 text-xs font-semibold">Route Eff.</p>
                  <p className="text-white font-bold">{vehicle.route_efficiency_score || 'N/A'}</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
                  <p className="text-amber-400 text-xs font-semibold">Maintenance</p>
                  <p className="text-white font-bold">{vehicle.maintenance_score || 'N/A'}</p>
                </div>
              </div>

              {/* Anomalies */}
              {vehicle.anomalies?.length > 0 && (
                <div className="border-t border-slate-700/50 pt-3 mt-3">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">⚠️ Active Issues</p>
                  <div className="space-y-1">
                    {vehicle.anomalies.map((anomaly, i) => (
                      <div key={i} className={`p-2 rounded text-xs flex items-start gap-2 ${anomaly.severity === 'high' ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'}`}>
                        <span className="font-bold mt-0.5">•</span>
                        <span>
                          <strong>{anomaly.type.replace(/_/g, ' ')}</strong> - {anomaly.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Impact */}
              {vehicle.cost_impact_annual && (
                <div className="flex items-center gap-2 mt-3 text-sm text-red-300">
                  <DollarSign className="w-4 h-4" />
                  <span>Annual Cost Overrun: <strong>€{vehicle.cost_impact_annual.toLocaleString()}</strong></span>
                </div>
              )}
            </div>
          ))}
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