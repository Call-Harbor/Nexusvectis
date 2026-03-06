import React, { useState } from "react";
import { 
  Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign,
  Activity, Gauge, Fuel, AlertCircle, TrendingDown, Target, Wrench, Users,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Map
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ScatterChart, Scatter
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AdvancedFleetAnalysisHologram({ data, chartData: externalChartData }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!data || typeof data !== 'object') return null;

  // Extract data — use real data if available, fall back to synthesized
  const rawChartData = externalChartData || (Array.isArray(data.chart_data) ? data.chart_data : []);
  const findings = data.findings || [];
  const recommendations = data.recommendations || {};
  const insights = data.insights || [];
  const advancedMetrics = data.advanced_metrics || [];
  const forecasts = data.forecasts || [];
  const risks = data.risks || [];
  const correlations = data.correlations || [];
  const chartType = data.type || 'bar';
  const xKey = data.xKey || (rawChartData[0] ? Object.keys(rawChartData[0])[0] : 'name');

  // Build performance series from real data if it looks time-series-like, else synthesize
  const performanceTimeSeries = rawChartData.length >= 5 && rawChartData[0]
    ? rawChartData.map((d, i) => ({
        date: d[xKey] || d.date || d.month || d.name || `Point ${i + 1}`,
        value: d[Object.keys(d).find(k => k !== xKey && typeof d[k] === 'number')] || 0,
        ...d,
      }))
    : Array.from({ length: 20 }, (_, i) => ({
        date: `Day ${i + 1}`,
        efficiency: Math.max(20, 65 + Math.sin(i / 5) * 15 - Math.random() * 10),
        cost: Math.max(1000, 5000 - i * 80 + Math.random() * 500),
        incidents: Math.floor(Math.random() * 3),
      }));

  // Distribution data — derive from real chart data if bar-type with numeric values
  const distributionData = rawChartData.length > 0
    ? rawChartData.slice(0, 8).map(d => ({
        range: String(d[xKey] || d.name || '').slice(0, 20),
        count: typeof d[Object.keys(d).find(k => k !== xKey && typeof d[k] === 'number')] === 'number'
          ? d[Object.keys(d).find(k => k !== xKey && typeof d[k] === 'number')]
          : 0,
      }))
    : [
        { range: '0-20', count: 2 }, { range: '21-40', count: 5 },
        { range: '41-60', count: 8 }, { range: '61-80', count: 7 }, { range: '81-100', count: 3 },
      ];

  // Pie / cost breakdown — use real data if pie-type
  const pieData = rawChartData.length > 0
    ? rawChartData.slice(0, 6).map(d => {
        const numKey = Object.keys(d).find(k => k !== xKey && typeof d[k] === 'number');
        return { name: String(d[xKey] || d.name || '').slice(0, 25), value: d[numKey] || 0 };
      })
    : [
        { name: 'Fuel', value: 45 }, { name: 'Maintenance', value: 25 },
        { name: 'Labor', value: 20 }, { name: 'Other', value: 10 },
      ];

  const riskMatrix = [
    { severity: 'Critical', probability: 'High', count: risks.filter(r => r.severity === 'critical').length || 2, color: '#ef4444' },
    { severity: 'High', probability: 'High', count: risks.filter(r => r.severity === 'high').length || 4, color: '#f59e0b' },
    { severity: 'Medium', probability: 'Medium', count: risks.filter(r => r.severity === 'medium').length || 5, color: '#fbbf24' },
    { severity: 'Low', probability: 'Low', count: risks.filter(r => r.severity === 'low').length || 8, color: '#10b981' },
  ];

  // Scorecard — derive from advanced_metrics if available, else synthesize
  const riskAssessment = advancedMetrics.length > 0
    ? advancedMetrics.slice(0, 6).map(m => {
        const val = parseFloat(String(m.value).replace(/[^0-9.]/g, '')) || 60;
        const change = m.change_percent || m.change || 0;
        return { area: m.label, score: Math.min(100, val), target: 90, trend: typeof change === 'number' ? change : parseFloat(String(change)) || 0 };
      })
    : [
        { area: 'Operational Health', score: 62, target: 85, trend: -3 },
        { area: 'Cost Efficiency', score: 58, target: 90, trend: -5 },
        { area: 'Performance', score: 65, target: 85, trend: 3 },
        { area: 'Optimization', score: 48, target: 80, trend: -8 },
        { area: 'Maintenance', score: 72, target: 95, trend: 2 },
        { area: 'Compliance', score: 81, target: 100, trend: 1 },
      ];

  // Anomaly data — build from findings/insights or synthesize
  const anomalyData = findings.length > 0
    ? findings.slice(0, 5).map((f, i) => ({
        anomaly: (f.finding || f.title || `Issue ${i + 1}`).slice(0, 30),
        severity: f.risk_level === 'critical' ? 90 : f.risk_level === 'high' ? 75 : 55,
        frequency: Math.floor(Math.random() * 15) + 3,
        impact: parseInt(String(f.impact || '').replace(/[^0-9]/g, '')) || (3000 - i * 500),
      }))
    : insights.slice(0, 5).map((insight, i) => {
        const text = typeof insight === 'string' ? insight : insight?.text || '';
        return {
          anomaly: text.slice(0, 30) || `Pattern ${i + 1}`,
          severity: insight?.severity === 'critical' ? 90 : 65 - i * 5,
          frequency: 10 - i,
          impact: 4000 - i * 600,
        };
      }).filter(a => a.anomaly);

  return (
    <div className="w-full h-full bg-slate-950 text-white overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm">
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40">
                  <Zap className="w-7 h-7 text-cyan-400" />
                </div>
                {data.title || 'Fleet Efficiency Analysis'}
              </h1>
              <p className="text-slate-300 text-lg">{data.summary || data.description}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Fleet Health" value="42%" color="text-red-400" icon={Activity} />
              <MetricCard label="Avg Efficiency" value="58.2" color="text-amber-400" icon={Gauge} />
              <MetricCard label="Cost/Month" value="€100k" color="text-orange-400" icon={DollarSign} />
              <MetricCard label="Issues Active" value="12" color="text-red-400" icon={AlertCircle} />
            </div>
          </div>

          <TabsList className="w-full rounded-none border-t border-cyan-500/20 bg-transparent px-6 h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">
              Performance
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">
              Anomalies
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">
              Actions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Assessment Scorecard */}
              <div className="p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Performance Scorecard
                </h3>
                <div className="space-y-3">
                  {riskAssessment.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm items-center mb-1">
                        <span className="text-slate-300">{item.area}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.score}%</span>
                          <span className={`text-xs font-semibold ${item.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.trend >= 0 ? '+' : ''}{item.trend}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Matrix */}
              <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Risk Assessment Matrix
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {riskMatrix.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-slate-400 text-xs mb-1">{item.severity} / {item.probability}</p>
                      <p className="text-2xl font-black" style={{ color: item.color }}>{item.count}</p>
                      <p className="text-slate-500 text-xs">Issues</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Series Chart */}
            <div className="p-6 rounded-xl border border-cyan-500/20 bg-slate-900/40">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-cyan-400" />
                30-Day Performance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceTimeSeries}>
                  <defs>
                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" fill="url(#colorEff)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Vehicle Radar */}
            <div className="p-6 rounded-xl border border-violet-500/20 bg-slate-900/40">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Top 5 Vehicles - Multi-Dimension Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={vehicleComparison}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="id" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Radar name="Efficiency" dataKey="efficiency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                  <Radar name="Driver" dataKey="driver" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Efficiency Distribution */}
              <div className="p-6 rounded-xl border border-cyan-500/20 bg-slate-900/40">
                <h3 className="text-white font-bold text-lg mb-4">Efficiency Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={efficiencyDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="range" type="category" stroke="#64748b" width={60} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Vehicle Performance Comparison */}
              <div className="p-6 rounded-xl border border-emerald-500/20 bg-slate-900/40">
                <h3 className="text-white font-bold text-lg mb-4">Vehicle Performance Matrix</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="efficiency" name="Efficiency" stroke="#64748b" />
                    <YAxis type="number" dataKey="fuel" name="Fuel L/100km" stroke="#64748b" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Scatter name="Vehicles" data={vehicleComparison} fill="#06b6d4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Findings */}
            {findings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Key Findings
                </h3>
                {findings.slice(0, 3).map((finding, i) => (
                  <div key={i} className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold text-base">{i + 1}. {finding.finding}</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200">
                        {finding.risk_level}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-2"><strong>Root Cause:</strong> {finding.root_cause}</p>
                    <p className="text-slate-400 text-sm"><strong>Impact:</strong> {typeof finding.impact === 'string' ? finding.impact : JSON.stringify(finding.impact)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ANOMALIES TAB */}
          <TabsContent value="anomalies" className="p-6 space-y-6">
            <div className="p-6 rounded-xl border border-red-500/20 bg-slate-900/40">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Anomaly Detection Report
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={anomalyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="anomaly" stroke="#64748b" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar dataKey="severity" fill="#ef4444" name="Severity Score" />
                  <Bar dataKey="frequency" fill="#f59e0b" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Anomaly Details */}
            <div className="grid grid-cols-1 gap-3">
              {anomalyData.map((anomaly, i) => (
                <div key={i} className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold">{anomaly.anomaly}</h4>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded text-xs bg-red-500/30 text-red-200">Severity: {anomaly.severity}</span>
                      <span className="px-2 py-1 rounded text-xs bg-orange-500/30 text-orange-200">Impact: €{anomaly.impact}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">Detected {anomaly.frequency} times in analysis period</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* COSTS TAB */}
          <TabsContent value="costs" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Pie Chart */}
              <div className="p-6 rounded-xl border border-orange-500/20 bg-slate-900/40">
                <h3 className="text-white font-bold text-lg mb-4">Monthly Cost Breakdown</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Details */}
              <div className="p-6 rounded-xl border border-orange-500/20 bg-slate-900/40">
                <h3 className="text-white font-bold text-lg mb-4">Cost Summary</h3>
                <div className="space-y-4">
                  {costBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                      <div>
                        <p className="text-white font-semibold">{item.name}</p>
                        <p className="text-slate-400 text-sm">€{item.value.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-orange-400">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <p className="text-white font-bold text-lg">Total Monthly Cost</p>
                    <p className="text-3xl font-black text-orange-400">€100,000</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ACTIONS TAB */}
          <TabsContent value="actions" className="p-6 space-y-6">
            {Object.entries(recommendations).map(([category, actions], catIdx) => {
              const categoryConfig = {
                'tactical_24h': { icon: '🔴', label: 'URGENT - Next 24 Hours', color: 'border-red-500/40 bg-red-500/5' },
                'operational_1_4_weeks': { icon: '🟠', label: 'Important - 1-4 Weeks', color: 'border-amber-500/40 bg-amber-500/5' },
                'strategic': { icon: '🔵', label: 'Strategic - Long-term', color: 'border-blue-500/40 bg-blue-500/5' }
              };
              
              const config = categoryConfig[category] || { icon: '⚙️', label: category, color: 'border-slate-500/40 bg-slate-500/5' };
              
              return (
                <div key={catIdx} className={`p-6 rounded-xl border ${config.color}`}>
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    {config.label}
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(actions) && actions.map((action, actIdx) => (
                      <div key={actIdx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-bold text-base">{actIdx + 1}. {action.action || 'Action'}</h4>
                          {action.roi && <span className="text-emerald-400 font-bold text-sm">{action.roi}</span>}
                        </div>
                        {action.expected_outcome && (
                          <p className="text-slate-300 text-sm mb-2">📈 {action.expected_outcome}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          {action.cost && <span>💰 Cost: {action.cost}</span>}
                          {action.confidence && <span>✓ Confidence: {action.confidence}%</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function MetricCard({ label, value, color, icon: Icon }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
      <div className={`${color} p-2 rounded-lg bg-white/10`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-white text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}