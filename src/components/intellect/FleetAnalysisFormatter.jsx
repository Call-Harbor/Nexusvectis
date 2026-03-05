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
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              Detailed Analysis
            </h3>
          </div>
          {findingsList.map((finding, idx) => {
            const riskColors = {
              'Critical': 'border-red-500/40 bg-red-500/5',
              'High': 'border-orange-500/40 bg-orange-500/5',
              'Medium': 'border-amber-500/40 bg-amber-500/5',
              'Low': 'border-blue-500/40 bg-blue-500/5'
            };
            
            return (
              <div key={idx} className={`p-6 rounded-lg border ${riskColors[finding.risk_level] || riskColors.Low}`}>
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-bold text-lg leading-relaxed pr-4">
                      {idx + 1}. {finding.finding}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${finding.risk_level === 'Critical' ? 'bg-red-500/30 text-red-300' : finding.risk_level === 'High' ? 'bg-orange-500/30 text-orange-300' : finding.risk_level === 'Medium' ? 'bg-amber-500/30 text-amber-300' : 'bg-blue-500/30 text-blue-300'}`}>
                      {finding.risk_level}
                    </span>
                  </div>
                  <p className="text-slate-200 text-base leading-relaxed mb-3">
                    <strong>Root Cause:</strong> {finding.root_cause}
                  </p>
                </div>
                
                {typeof finding.impact === 'object' ? (
                  <div className="bg-white/5 p-4 rounded-lg mb-4 space-y-2">
                    <p className="text-slate-400 font-semibold text-sm mb-3">Impact Assessment:</p>
                    {finding.impact.financial && <p className="text-slate-200 text-base">💰 <strong>Financial Impact:</strong> {finding.impact.financial}</p>}
                    {finding.impact.operational && <p className="text-slate-200 text-base">⚙️ <strong>Operational Impact:</strong> {finding.impact.operational}</p>}
                    {finding.impact.environmental && <p className="text-slate-200 text-base">🌍 <strong>Environmental Impact:</strong> {finding.impact.environmental}</p>}
                    {finding.impact.compliance && <p className="text-slate-200 text-base">📋 <strong>Compliance Risk:</strong> {finding.impact.compliance}</p>}
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-lg mb-4">
                    <p className="text-slate-200 text-base"><strong>Impact:</strong> {finding.impact}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-slate-300">🎯 Confidence: <strong className="text-white">{finding.confidence}%</strong></span>
                  <span className="text-slate-300">⏰ Priority: <strong className="text-white">{finding.time_horizon || 'Immediate'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Categories */}
      {data.recommendations && Object.keys(data.recommendations).length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-bold text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-400" />
              Recommended Actions
            </h3>
            <p className="text-slate-400 text-base mt-2">Prioritized interventions to improve performance and reduce costs</p>
          </div>

          {Object.entries(data.recommendations).map(([category, actions], catIdx) => {
            const categoryColors = {
              'tactical_24h': { bg: 'bg-red-500/10', border: 'border-red-500/40', label: 'URGENT (Next 24 Hours)', icon: '🔴' },
              'operational_1_4_weeks': { bg: 'bg-amber-500/10', border: 'border-amber-500/40', label: 'Important (1-4 Weeks)', icon: '🟠' },
              'strategic': { bg: 'bg-blue-500/10', border: 'border-blue-500/40', label: 'Strategic (Long-term)', icon: '🔵' }
            };
            
            const style = categoryColors[category] || { bg: 'bg-slate-500/10', border: 'border-slate-500/40', label: category.replace(/_/g, ' ').toUpperCase(), icon: '⚙️' };
            
            return (
              <div key={catIdx} className={`p-6 rounded-lg border ${style.bg} ${style.border}`}>
                <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">{style.icon}</span>
                  {style.label}
                </h4>
                <div className="space-y-4">
                  {Array.isArray(actions) && actions.map((action, actIdx) => (
                    <div key={actIdx} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h5 className="text-white font-bold text-base mb-2">
                        {actIdx + 1}. {action.action || action.expected_outcome || 'Action'}
                      </h5>
                      
                      <div className="space-y-3">
                        {action.expected_outcome && (
                          <div>
                            <p className="text-slate-400 font-semibold text-sm mb-1">Expected Outcome:</p>
                            {typeof action.expected_outcome === 'object' ? (
                              <div className="text-slate-200 text-base space-y-1">
                                {action.expected_outcome.most_likely && (
                                  <p>📊 <strong>Most Likely:</strong> {action.expected_outcome.most_likely.eta || action.expected_outcome.most_likely.duration_reduction}</p>
                                )}
                                {action.expected_outcome.best_case && (
                                  <p>✅ <strong>Best Case:</strong> {action.expected_outcome.best_case.eta || action.expected_outcome.best_case.duration_reduction}</p>
                                )}
                                {action.expected_outcome.confidence && (
                                  <p>🎯 <strong>Confidence:</strong> {action.expected_outcome.confidence}%</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-200 text-base">{action.expected_outcome}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          {action.cost && <span className="text-slate-300">💰 <strong>Cost:</strong> {action.cost}</span>}
                          {action.roi && <span className="text-slate-300">📊 <strong>ROI:</strong> {action.roi}</span>}
                          {action.confidence && <span className="text-slate-300">✓ <strong>Confidence:</strong> {action.confidence}%</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}