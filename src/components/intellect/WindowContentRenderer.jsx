import React from "react";
import { createPageUrl } from "../../utils";
import { 
  Sparkles, AlertTriangle, TrendingUp, Zap, Activity, Brain
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import NexusSatelliteChat from "@/components/crm/NexusSatelliteChat";
import AIDocumentEditor from "@/components/intellect/AIDocumentEditor";
import AISpreadsheetEditor from "@/components/intellect/AISpreadsheetEditor";
import SwarmIntelligencePanel from "@/components/intellect/SwarmIntelligencePanel";
import NeuroSymbolicRiskPanel from "@/components/intellect/NeuroSymbolicRiskPanel";
import DigitalTwinFederation from "@/components/intellect/DigitalTwinFederation";
import CourseAIEngine from "@/components/intellect/CourseAIEngine";
import DeepAnalysisEngine from "@/components/intellect/DeepAnalysisEngine";
import GlobalSearch from "@/components/intellect/GlobalSearch";
import WebBrowser from "@/components/intellect/WebBrowser";
import VideoCallHologram from "@/components/intellect/VideoCallHologram";

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const PAGE_MAP = {
  'dashboard': 'Dashboard', 'settings': 'Settings', 'aioptimization': 'AIOptimization',
  'invoices': 'Invoices', 'apidocs': 'APIDocumentation', 'resources': 'Resources',
  'warehouseautomation': 'WarehouseAutomation', 'demandforecasting': 'DemandForecasting',
  'greentms': 'GreenTMS', 'gpsintegration': 'GPSIntegration', 'assignment': 'Assignment',
  'routeeditor': 'Routes', 'fleet': 'Fleet', 'alerts': 'Alerts', 'routes': 'Routes',
  'shipments': 'Shipments', 'crm': 'CRM', 'vehicles': 'Fleet', 'drivers': 'DriverManagement',
  'maintenance': 'MaintenanceManagement', 'hr': 'HRManagement'
};

function ChartWindow({ data, config }) {
  const chartType = config?.type || 'bar';
  const chartData = data || [];

  const severityColors = {
    critical: 'border-red-500/50 bg-red-500/10',
    warning: 'border-amber-500/50 bg-amber-500/10',
    success: 'border-emerald-500/50 bg-emerald-500/10',
    info: 'border-cyan-500/50 bg-cyan-500/10'
  };
  const severityIconColors = {
    critical: 'text-red-400', warning: 'text-amber-400',
    success: 'text-emerald-400', info: 'text-cyan-400'
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 overflow-auto bg-slate-950/40">
      <div className="mb-6 pb-4 border-b border-cyan-500/20">
        <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          {config?.title || 'Analysis'}
        </h3>
        <p className="text-slate-300 text-base leading-relaxed">{config?.description || 'AI-generated visualization'}</p>

        {chartData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Data Points', value: chartData.length, color: 'cyan' },
              { label: 'Chart Type', value: chartType, color: 'violet' },
              { label: 'Analysis Time', value: new Date().toLocaleTimeString(), color: 'emerald' },
              { label: 'Confidence', value: '95%', color: 'amber' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/30`}>
                <p className={`text-${color}-400 text-xs font-semibold mb-1`}>{label}</p>
                <p className="text-white text-lg font-bold capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={config?.xKey || 'name'} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
            <Legend />
            {config?.bars?.map((bar, idx) => <Bar key={idx} dataKey={bar.key} fill={CHART_COLORS[idx % CHART_COLORS.length]} name={bar.name} />)}
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={config?.xKey || 'name'} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
            <Legend />
            {config?.lines?.map((line, idx) => <Line key={idx} type="monotone" dataKey={line.key} stroke={CHART_COLORS[idx % CHART_COLORS.length]} name={line.name} strokeWidth={2} />)}
          </LineChart>
        ) : chartType === 'pie' ? (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={120} dataKey={config?.valueKey || 'value'}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {chartData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
          </PieChart>
        ) : (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={config?.xKey || 'name'} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
            <Legend />
            {config?.areas?.map((area, idx) => <Area key={idx} type="monotone" dataKey={area.key} stackId="1" stroke={CHART_COLORS[idx % CHART_COLORS.length]} fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.6} name={area.name} />)}
          </AreaChart>
        )}
      </ResponsiveContainer>

      {config?.summary && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2"><Brain className="w-5 h-5 text-cyan-400" /><h4 className="text-white font-bold">Executive Summary</h4></div>
          <p className="text-slate-200 text-sm leading-relaxed">{config.summary}</p>
        </div>
      )}

      {config?.insights?.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-cyan-400" /><h4 className="text-white font-bold">Key Insights</h4></div>
          {config.insights.map((insight, idx) => {
            const text = typeof insight === 'string' ? insight : insight?.text || '';
            const sev = insight?.severity || 'info';
            return (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[sev] || severityColors.info}`}>
                <Zap className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityIconColors[sev] || severityIconColors.info}`} />
                <p className="text-white text-sm font-medium leading-relaxed">{text}</p>
              </div>
            );
          })}
        </div>
      )}

      {config?.technical_details && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-violet-400" /><h4 className="text-white font-bold">Technical Analysis</h4></div>
          <div className="space-y-3">
            {Object.entries(config.technical_details).map(([key, value], idx) => (
              <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                <span className="text-white text-sm font-mono text-right max-w-[60%] break-words">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config?.recommendations?.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-emerald-400" /><h4 className="text-white font-bold">AI Recommendations</h4></div>
          <div className="space-y-2">
            {config.recommendations.map((rec, idx) => {
              const recText = typeof rec === 'string' ? rec : rec?.action || rec?.benefit || '';
              return (
                <div key={idx} className="flex items-start gap-2 p-3 rounded bg-emerald-500/5 border border-emerald-500/20">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 text-sm leading-relaxed mb-2">{recText}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {rec?.savings_dkk && <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300">💰 {rec.savings_dkk}</span>}
                      {rec?.timeframe && <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-300">⏱️ {rec.timeframe}</span>}
                      {rec?.confidence && <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300">📊 {rec.confidence}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {config?.data_quality && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[['Accuracy', config.data_quality.accuracy], ['Completeness', config.data_quality.completeness], ['Reliability', config.data_quality.reliability]].map(([label, val]) => (
            <div key={label} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
              <p className="text-slate-400 text-xs mb-1">{label}</p>
              <p className="text-white text-lg font-bold">{val || '99%'}</p>
            </div>
          ))}
        </div>
      )}

      {config?.advanced_metrics?.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-blue-400" /><h4 className="text-white font-bold">Advanced Metrics</h4></div>
          <div className="grid grid-cols-2 gap-3">
            {config.advanced_metrics.map((metric, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-slate-400 text-xs mb-1 font-medium">{metric.label}</p>
                <p className="text-white text-base font-bold">{metric.value}</p>
                {metric.change && <p className={`text-xs mt-1 ${metric.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>{metric.change}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {config?.forecasts?.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-violet-400" /><h4 className="text-white font-bold">Predictions & Forecasts</h4></div>
          <div className="space-y-3">
            {config.forecasts.map((forecast, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-medium text-sm">{forecast.name}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">{forecast.timeframe}</span>
                </div>
                <p className="text-slate-300 text-sm mb-2">{forecast.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white text-lg font-bold">{forecast.value}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-violet-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-400 to-indigo-400" style={{ width: `${forecast.confidence || 85}%` }} />
                    </div>
                    <span className="text-xs text-violet-300">{forecast.confidence || 85}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {config?.risks?.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-400" /><h4 className="text-white font-bold">Risk Analysis</h4></div>
          <div className="space-y-2">
            {config.risks.map((risk, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white font-medium text-sm flex-1">{risk.name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${risk.severity === 'critical' ? 'bg-red-500/30 text-red-300' : risk.severity === 'high' ? 'bg-orange-500/30 text-orange-300' : 'bg-yellow-500/30 text-yellow-300'}`}>{risk.severity}</span>
                </div>
                <p className="text-slate-300 text-xs mb-2">{risk.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Likelihood: {risk.likelihood}</span>
                  <span className="text-red-300 font-semibold">Impact: {risk.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {config?.correlations?.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-cyan-400" /><h4 className="text-white font-bold">Data Correlations</h4></div>
          <div className="space-y-2">
            {config.correlations.map((corr, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-300 text-sm">{corr.variables}</p>
                  <span className="text-xs font-mono text-cyan-300">{corr.coefficient}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400" style={{ width: `${Math.abs(parseFloat(corr.coefficient)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WindowContentRenderer({ type, data, vehicles, routes, shipments, alerts, currentUser, orgId, customers, setInput, openWindow }) {
  if (type === 'document_editor') return <AIDocumentEditor />;
  if (type === 'spreadsheet_editor') return <AISpreadsheetEditor />;

  if (type === 'nexus_chat') return (
    <div className="w-full h-full overflow-hidden">
      <NexusSatelliteChat user={currentUser} orgId={orgId} customers={customers} />
    </div>
  );

  if (type.startsWith('chart_')) {
    return <ChartWindow data={data?.chartData} config={data?.chartConfig} />;
  }

  if (type === 'swarm_intelligence') return <SwarmIntelligencePanel vehicles={vehicles} routes={routes} onCommand={setInput} />;
  if (type === 'neuro_risk') return <NeuroSymbolicRiskPanel vehicles={vehicles} routes={routes} onCommand={setInput} />;
  if (type === 'digital_twin') return <DigitalTwinFederation vehicles={vehicles} routes={routes} onCommand={setInput} />;
  if (type === 'course_ai') return <CourseAIEngine vehicles={vehicles} routes={routes} shipments={shipments} />;
  if (type === 'deep_analysis') return <DeepAnalysisEngine vehicles={vehicles} routes={routes} shipments={shipments} alerts={alerts} onInsightCommand={setInput} />;
  if (type === 'global_search') return <GlobalSearch orgId={data?.orgId} onOpenWindow={(entityType) => openWindow(entityType, { x: 200, y: 150 })} onOpenPageWindow={(page) => openWindow(page.toLowerCase(), { x: 200, y: 150 })} />;
  if (type === 'web_browser') return <WebBrowser />;
  if (type === 'video_call') return <VideoCallHologram videoUrl={data?.videoUrl} />;

  if (PAGE_MAP[type]) {
    return <iframe src={`${createPageUrl(PAGE_MAP[type])}?hologram=true`} className="w-full h-full border-0" title={PAGE_MAP[type]} />;
  }

  return null;
}