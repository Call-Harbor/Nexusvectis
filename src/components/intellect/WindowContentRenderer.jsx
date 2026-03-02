import React from "react";
import { createPageUrl } from "../../utils";
import { 
  Sparkles, AlertTriangle, TrendingUp, Zap, Activity, Brain
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AIDocumentEditor from "@/components/intellect/AIDocumentEditor";
import AISpreadsheetEditor from "@/components/intellect/AISpreadsheetEditor";
import SatelliteWeatherIntelligence from "@/components/intellect/SatelliteWeatherIntelligence";
import SwarmIntelligencePanel from "@/components/intellect/SwarmIntelligencePanel";
import NeuroSymbolicRiskPanel from "@/components/intellect/NeuroSymbolicRiskPanel";
import DigitalTwinFederation from "@/components/intellect/DigitalTwinFederation";
import CourseAIEngine from "@/components/intellect/CourseAIEngine";
import DeepAnalysisEngine from "@/components/intellect/DeepAnalysisEngine";
import GlobalSearch from "@/components/intellect/GlobalSearch";
import WebBrowser from "@/components/intellect/WebBrowser";
import ProfileSearch from "@/components/intellect/ProfileSearch";
import NewsIntelligence from "@/components/intellect/NewsIntelligence";
import CompanyAnalysisHologram from "@/components/intellect/CompanyAnalysisHologram";
import PeopleIntelligenceHologram from "@/components/intellect/PeopleIntelligenceHologram";
import ImageGeneratorHologram from "@/components/intellect/ImageGeneratorHologram";
import ImageEditorHologram from "@/components/intellect/ImageEditorHologram";

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
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-cyan-400" /><h4 className="text-white font-bold">🎯 Actionable Insights</h4></div>
          {config.insights.map((insight, idx) => {
            const text = typeof insight === 'string' ? insight : insight?.text || '';
            const sev = insight?.severity || 'info';
            const impact = insight?.impact || '';
            const severityMap = {
              critical: { bg: 'bg-red-500/15', border: 'border-red-500/50', icon: 'text-red-400', label: '🚨 CRITICAL' },
              high: { bg: 'bg-orange-500/15', border: 'border-orange-500/50', icon: 'text-orange-400', label: '⚠️ HIGH' },
              medium: { bg: 'bg-amber-500/15', border: 'border-amber-500/50', icon: 'text-amber-400', label: '⚡ MEDIUM' },
              low: { bg: 'bg-blue-500/15', border: 'border-blue-500/50', icon: 'text-blue-400', label: 'ℹ️ INSIGHT' }
            };
            const style = severityMap[sev] || severityMap.low;
            return (
              <div key={idx} className={`flex flex-col gap-2 p-4 rounded-lg border ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-2">
                  <div className={`font-bold text-xs mt-0.5 px-2 py-1 rounded ${style.icon} bg-white/5`}>{style.label}</div>
                </div>
                <p className="text-white text-sm font-medium leading-relaxed">{text}</p>
                {impact && <p className="text-slate-300 text-xs leading-relaxed">📈 <strong>Impact:</strong> {impact}</p>}
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
          <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-emerald-400" /><h4 className="text-white font-bold">💡 Strategic Actions</h4></div>
          <div className="space-y-3">
            {config.recommendations.map((rec, idx) => {
              const recText = typeof rec === 'string' ? rec : rec?.action || rec?.benefit || '';
              const advantage = rec?.competitive_advantage || '';
              const savings = rec?.savings_dkk ? (typeof rec.savings_dkk === 'number' ? `${rec.savings_dkk.toLocaleString()} DKK` : rec.savings_dkk) : null;
              const confidence = rec?.confidence ? Math.round(rec.confidence * 100) : null;
              return (
                <div key={idx} className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/25 hover:border-emerald-500/50 transition">
                  <div className="flex gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0 font-bold text-slate-950">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm mb-1">{recText}</p>
                      {advantage && <p className="text-emerald-300 text-xs italic mb-2">✨ {advantage}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-11 text-xs">
                    {savings && <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 font-semibold">💰 {savings}</span>}
                    {rec?.timeframe && <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200">⏱️ {rec.timeframe}</span>}
                    {confidence && <span className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-200">✓ {confidence}% confidence</span>}
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
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-blue-400" /><h4 className="text-white font-bold">📊 KPI Dashboard</h4></div>
          <div className="grid grid-cols-2 gap-3">
            {config.advanced_metrics.map((metric, idx) => {
              const change = metric.change_percent || metric.change;
              const isPositive = !change || change >= 0 || (typeof change === 'string' && change.includes('+'));
              return (
                <div key={idx} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition">
                  <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wide">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-white text-2xl font-bold">{metric.value}</p>
                    {metric.unit && <p className="text-slate-500 text-xs">{metric.unit}</p>}
                  </div>
                  {change && (
                    <p className={`text-xs mt-2 font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '📈' : '📉'} {typeof change === 'string' ? change : `${change > 0 ? '+' : ''}${change}%`}
                    </p>
                  )}
                  {metric.story && <p className="text-slate-300 text-xs mt-2 italic">{metric.story}</p>}
                </div>
              );
            })}
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

function ArticleIframeViewer({ url, onClose }) {
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
        if (!doc || doc.domain !== window.location.hostname) {
          window.open(url, '_blank');
          if (onClose) onClose();
        }
      } catch {
        window.open(url, '_blank');
        if (onClose) onClose();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [url]);

  if (!url) return null;

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full h-full border-0 bg-white"
      style={{ background: 'white' }}
      title="Article Viewer"
    />
  );
}

export default function WindowContentRenderer({ type, data, vehicles, routes, shipments, alerts, currentUser, orgId, customers, setInput, openWindow }) {
  if (type === 'document_editor') return <AIDocumentEditor />;
  if (type === 'spreadsheet_editor') return <AISpreadsheetEditor />;

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
  // profile_search is handled above as PeopleIntelligenceHologram
  if (type === 'company_analytics') return <CompanyAnalysisHologram onClose={data?.onClose} onSendToScreen={null} embedded={true} />;
  if (type === 'profile_search') return <PeopleIntelligenceHologram onClose={data?.onClose} onSendToScreen={null} embedded={true} />;
  if (type === 'satellite_weather') return <SatelliteWeatherIntelligence routes={routes} vehicles={vehicles} onRouteSelect={(routeId) => setInput(`Analyzing route ${routeId}`)} />;
  if (type === 'news_intelligence') return <NewsIntelligence openWindow={openWindow} />;
  if (type === 'article_iframe') return <ArticleIframeViewer url={data?.url} onClose={data?.onClose} />;
  if (type === 'image_generator') return <ImageGeneratorHologram onClose={data?.onClose} />;
  if (PAGE_MAP[type]) {
    return <iframe src={`${createPageUrl(PAGE_MAP[type])}?hologram=true`} className="w-full h-full border-0" title={PAGE_MAP[type]} />;
  }

  return null;
}