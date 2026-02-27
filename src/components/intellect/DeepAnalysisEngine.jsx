import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, Zap, TrendingUp, Brain, Loader2, ChevronDown, ChevronUp,
  Activity, Target, BarChart3, Lightbulb, GitBranch, ShieldAlert, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

/* ─── Collapsible Section ─── */
function Section({ title, icon: Icon, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/60 hover:bg-slate-900/80 transition-colors"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
        <span className="text-white font-semibold text-sm flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="p-4 bg-slate-950/40 space-y-3">{children}</div>}
    </div>
  );
}

/* ─── Anomaly Card ─── */
function AnomalyCard({ anomaly, idx }) {
  const sev = anomaly.severity || 'medium';
  const styles = {
    critical: 'border-red-500/50 bg-red-500/10 text-red-400',
    high:     'border-orange-500/50 bg-orange-500/10 text-orange-400',
    medium:   'border-amber-500/50 bg-amber-500/10 text-amber-400',
    low:      'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
      className={`p-3 rounded-lg border ${styles[sev] || styles.medium}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-white text-sm font-semibold">{anomaly.entity}</p>
        <Badge className={`text-[10px] uppercase ${styles[sev]}`}>{sev}</Badge>
      </div>
      <p className="text-slate-300 text-xs mb-1">{anomaly.description}</p>
      <p className="text-slate-400 text-xs">🔍 Root cause: <span className="text-white">{anomaly.root_cause}</span></p>
      {anomaly.z_score && (
        <p className="text-slate-500 text-[11px] mt-1">Z-score: <span className="font-mono text-cyan-300">{anomaly.z_score}σ</span> · Deviation: <span className="font-mono text-amber-300">{anomaly.deviation}</span></p>
      )}
      {anomaly.recommended_action && (
        <div className="mt-2 flex items-start gap-1.5">
          <Zap className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-emerald-300 text-xs">{anomaly.recommended_action}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Scenario Card ─── */
function ScenarioCard({ scenario, idx }) {
  const [expanded, setExpanded] = useState(false);
  const outcomeColor = scenario.net_impact_eur?.startsWith('+') || parseFloat(scenario.net_impact_eur) > 0
    ? 'text-emerald-400' : 'text-red-400';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
      className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <p className="text-white font-bold text-sm">{scenario.name}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{scenario.probability}% likely</span>
      </div>
      <p className="text-slate-300 text-xs mb-3 leading-relaxed">{scenario.description}</p>

      {/* KPI deltas */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Net Impact', value: scenario.net_impact_eur, color: outcomeColor },
          { label: 'Time', value: scenario.timeframe, color: 'text-slate-300' },
          { label: 'Confidence', value: `${scenario.confidence}%`, color: 'text-cyan-300' },
        ].map((kpi, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-slate-900/50">
            <p className="text-slate-500 text-[10px] mb-0.5">{kpi.label}</p>
            <p className={`text-xs font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {scenario.delta_chart && scenario.delta_chart.length > 0 && (
        <div className="mb-3">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={scenario.delta_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="metric" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="change" fill="#8b5cf6" radius={[3,3,0,0]}
                label={false}
                shape={(props) => {
                  const { x, y, width, height, value } = props;
                  return <rect x={x} y={value >= 0 ? y : y + height} width={width} height={Math.abs(height)} fill={value >= 0 ? '#10b981' : '#ef4444'} rx={3} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <button onClick={() => setExpanded(v => !v)} className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
        {expanded ? <><ChevronUp className="w-3 h-3" />Hide details</> : <><ChevronDown className="w-3 h-3" />Show details</>}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {scenario.prerequisites?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase mb-1">Prerequisites</p>
              {scenario.prerequisites.map((p, i) => <p key={i} className="text-slate-300 text-xs">• {p}</p>)}
            </div>
          )}
          {scenario.risks?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase mb-1">Risks</p>
              {scenario.risks.map((r, i) => <p key={i} className="text-red-300 text-xs">⚠ {r}</p>)}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Proactive Optimization Card ─── */
function OptimizationCard({ opt, idx }) {
  const impactColors = { high: 'text-emerald-400', medium: 'text-cyan-400', low: 'text-slate-400' };
  const urgencyColors = { immediate: 'bg-red-500/20 text-red-300 border-red-500/30', short_term: 'bg-amber-500/20 text-amber-300 border-amber-500/30', long_term: 'bg-slate-800 text-slate-300 border-slate-700' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
      className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
          </div>
          <p className="text-white font-bold text-sm">{opt.title}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${urgencyColors[opt.urgency] || urgencyColors.long_term}`}>
          {opt.urgency?.replace('_', ' ')}
        </span>
      </div>
      <p className="text-slate-300 text-xs mb-3 leading-relaxed">{opt.description}</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 rounded-lg bg-slate-900/50">
          <p className="text-slate-500 text-[10px]">Est. Savings</p>
          <p className="text-emerald-400 text-sm font-bold">{opt.estimated_savings}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50">
          <p className="text-slate-500 text-[10px]">ROI Period</p>
          <p className="text-cyan-400 text-sm font-bold">{opt.roi_period}</p>
        </div>
      </div>

      {/* Impact bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-500">Impact Score</span>
          <span className={`font-bold ${impactColors[opt.impact_level] || impactColors.medium}`}>{opt.impact_score}/100</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: 0 }} animate={{ width: `${opt.impact_score}%` }} transition={{ duration: 0.6, delay: idx * 0.06 }}
          />
        </div>
      </div>

      {opt.trend_basis && (
        <p className="text-slate-500 text-[10px]">📈 Based on: <span className="text-slate-400">{opt.trend_basis}</span></p>
      )}
    </motion.div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function DeepAnalysisEngine({ vehicles = [], routes = [], shipments = [], alerts = [], onInsightCommand }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState('all');

  const run = async () => {
    setLoading(true);
    setResult(null);

    const fleetSummary = `
${vehicles.length} vehicles (${vehicles.filter(v => v.status === 'active').length} active, ${vehicles.filter(v => v.status === 'maintenance').length} in maintenance).
Fuel levels: avg ${vehicles.length ? Math.round(vehicles.reduce((s, v) => s + (v.fuel_level || 0), 0) / vehicles.length) : 'N/A'}%.
Efficiency scores: ${vehicles.filter(v => v.efficiency_score != null).map(v => v.efficiency_score).join(', ') || 'N/A'}.
Routes: ${routes.length} total (${routes.filter(r => r.status === 'active').length} active, ${routes.filter(r => r.status === 'delayed').length} delayed).
Shipments: ${shipments.length} (${shipments.filter(s => s.status === 'in_transit').length} in transit, ${shipments.filter(s => s.status === 'delayed').length} delayed).
Active alerts: ${alerts.length}.
Vehicle details: ${vehicles.slice(0, 8).map(v => `${v.name}(fuel:${v.fuel_level}%,eff:${v.efficiency_score},status:${v.status})`).join('; ')}.
Route details: ${routes.slice(0, 5).map(r => `${r.name}(${r.status},${r.distance_km || '?'}km,priority:${r.priority})`).join('; ')}.
    `.trim();

    try {
      // Run 3 parallel AI analyses
      const [anomalyResult, scenarioResult, optimizationResult] = await Promise.all([
        // 1. Anomaly Detection
        base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert anomaly detection AI for logistics & fleet management. Analyze this fleet data and detect ALL statistical anomalies using z-score analysis, isolation forest logic, and time-series deviation:

${fleetSummary}

Identify anomalies in: fuel consumption patterns, efficiency deviations, route delays, shipment patterns, maintenance clustering.

Return JSON:
{
  "anomalies": [
    {
      "entity": "Vehicle/Route/Shipment name or group",
      "type": "fuel_anomaly|efficiency_anomaly|route_anomaly|maintenance_anomaly|shipment_anomaly",
      "severity": "critical|high|medium|low",
      "description": "precise statistical description of what is anomalous",
      "z_score": "e.g. 3.2",
      "deviation": "e.g. 47% below fleet average",
      "root_cause": "likely root cause with technical reasoning",
      "recommended_action": "specific corrective action with expected outcome"
    }
  ],
  "anomaly_summary": "2-sentence statistical overview of anomaly landscape",
  "health_score": 0-100,
  "anomaly_chart": [{"metric": "label", "normal": number, "actual": number, "threshold": number}]
}`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              anomalies: { type: "array", items: { type: "object", additionalProperties: true } },
              anomaly_summary: { type: "string" },
              health_score: { type: "number" },
              anomaly_chart: { type: "array", items: { type: "object", additionalProperties: true } }
            }
          }
        }),

        // 2. What-If Scenario Generation
        base44.integrations.Core.InvokeLLM({
          prompt: `You are a strategic scenario planning AI for fleet & logistics. Generate realistic "what-if" scenarios for fleet expansion and route changes based on this data:

${fleetSummary}

Generate 4 distinct scenarios covering: fleet size changes (+/- vehicles), route restructuring, technology upgrades, and market shifts. Each scenario must be data-driven with quantitative impact estimates.

Return JSON:
{
  "scenarios": [
    {
      "name": "Scenario name (e.g. '+3 EV Trucks Expansion')",
      "type": "expansion|reduction|optimization|technology|market",
      "description": "2-3 sentence description with specific numbers",
      "probability": 0-100,
      "confidence": 0-100,
      "timeframe": "e.g. 6 months",
      "net_impact_eur": "+€45,000 / year or -€12,000",
      "prerequisites": ["prerequisite 1", "prerequisite 2"],
      "risks": ["risk 1", "risk 2"],
      "delta_chart": [{"metric": "Cost", "change": -12}, {"metric": "Revenue", "change": 18}, {"metric": "CO2", "change": -22}]
    }
  ],
  "scenario_insight": "Key strategic finding across all scenarios"
}`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              scenarios: { type: "array", items: { type: "object", additionalProperties: true } },
              scenario_insight: { type: "string" }
            }
          }
        }),

        // 3. Proactive Optimization Suggestions
        base44.integrations.Core.InvokeLLM({
          prompt: `You are a proactive optimization AI for fleet management. Based on trend analysis and predictive modeling of this fleet data, suggest HIGH-VALUE optimizations BEFORE problems occur:

${fleetSummary}

Analyze trends: maintenance clustering, route efficiency degradation, fuel cost trajectories, shipment delay patterns. Suggest proactive interventions ranked by ROI.

Return JSON:
{
  "optimizations": [
    {
      "title": "Short optimization title",
      "description": "Detailed description with trend basis and prediction rationale",
      "urgency": "immediate|short_term|long_term",
      "impact_level": "high|medium|low",
      "impact_score": 0-100,
      "estimated_savings": "e.g. €8,200/month",
      "roi_period": "e.g. 3 months",
      "trend_basis": "specific trend that triggered this suggestion",
      "predicted_outcome": "if not acted upon: X will happen within Y timeframe"
    }
  ],
  "trend_summary": "2-3 sentence overall trend narrative with specific numbers",
  "optimization_radar": [{"area": "Fuel", "current": 60, "potential": 85}, {"area": "Routes", "current": 70, "potential": 92}]
}`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              optimizations: { type: "array", items: { type: "object", additionalProperties: true } },
              trend_summary: { type: "string" },
              optimization_radar: { type: "array", items: { type: "object", additionalProperties: true } }
            }
          }
        })
      ]);

      setResult({ anomaly: anomalyResult, scenario: scenarioResult, optimization: optimizationResult });
    } catch (err) {
      console.error('DeepAnalysisEngine error:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'anomalies', label: 'Anomalies' },
    { id: 'scenarios', label: 'What-If' },
    { id: 'optimizations', label: 'Proactive' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Deep AI Analysis Engine</p>
            <p className="text-slate-400 text-xs">Anomaly Detection · What-If Scenarios · Proactive Optimization</p>
          </div>
        </div>
        <Button
          onClick={run}
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-xs"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Brain className="w-4 h-4 mr-1.5" />}
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Tabs */}
      {result && (
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-800/50 flex-shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 border-b-0'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl bg-cyan-500/10 animate-pulse rounded-full" />
              <Cpu className="w-16 h-16 text-cyan-400/60 relative z-10" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Multi-Model AI Analysis Engine</p>
            <p className="text-slate-600 text-xs max-w-xs">Run 3 parallel AI models simultaneously for anomaly detection, what-if scenario modelling, and proactive trend-based optimization.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center max-w-xs w-full">
              {[
                { icon: ShieldAlert, label: 'Anomaly Detection', color: 'text-red-400' },
                { icon: GitBranch, label: 'What-If Scenarios', color: 'text-violet-400' },
                { icon: Lightbulb, label: 'Proactive Optimization', color: 'text-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/30">
                  <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                  <p className="text-slate-400 text-[10px] leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 animate-spin border-t-cyan-400" />
              <Brain className="absolute inset-0 m-auto w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Running 3 AI models in parallel</p>
              <p className="text-slate-400 text-xs mt-1">Anomaly detection · Scenario generation · Trend prediction</p>
            </div>
            <div className="flex gap-2 text-xs text-slate-600 flex-wrap justify-center">
              {['Isolation Forest', 'Z-Score Analysis', 'Monte Carlo', 'Linear Regression', 'Time-Series', 'What-If Engine'].map(m => (
                <span key={m} className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800">{m}</span>
              ))}
            </div>
          </div>
        )}

        {result && (
          <AnimatePresence>
            {/* ── ANOMALIES ── */}
            {(activeSection === 'all' || activeSection === 'anomalies') && result.anomaly && (
              <Section title={`Anomaly Detection (${result.anomaly.anomalies?.length || 0} found)`} icon={ShieldAlert} color="text-red-400">
                {/* Health score + chart */}
                {result.anomaly.health_score != null && (
                  <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
                    <div className="text-center">
                      <p className="text-slate-500 text-[10px]">Fleet Health</p>
                      <p className={`text-3xl font-black ${result.anomaly.health_score >= 80 ? 'text-emerald-400' : result.anomaly.health_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {result.anomaly.health_score}
                      </p>
                      <p className="text-slate-500 text-[10px]">/100</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 text-xs leading-relaxed">{result.anomaly.anomaly_summary}</p>
                    </div>
                  </div>
                )}
                {result.anomaly.anomaly_chart?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-500 text-[10px] uppercase mb-2">Statistical Deviation Chart</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={result.anomaly.anomaly_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="metric" tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }} />
                        <Bar dataKey="normal" fill="#334155" name="Normal" radius={[2,2,0,0]} />
                        <Bar dataKey="actual" fill="#ef4444" name="Actual" radius={[2,2,0,0]} />
                        <Bar dataKey="threshold" fill="#f59e0b" name="Threshold" radius={[2,2,0,0]} fillOpacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-2">
                  {result.anomaly.anomalies?.map((a, i) => <AnomalyCard key={i} anomaly={a} idx={i} />)}
                </div>
                {onInsightCommand && (
                  <Button
                    onClick={() => onInsightCommand(`Analyser alle køretøjer og identificer dem med laveste effektivitetsscore. Giv detaljeret rapport over anomalier og anbefalede handlinger baseret på den seneste analyse.`)}
                    className="w-full mt-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1.5" /> Deep dive into anomalies via FLEET AI
                  </Button>
                )}
              </Section>
            )}

            {/* ── SCENARIOS ── */}
            {(activeSection === 'all' || activeSection === 'scenarios') && result.scenario && (
              <Section title="What-If Scenario Modelling" icon={GitBranch} color="text-violet-400">
                {result.scenario.scenario_insight && (
                  <div className="mb-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-violet-300 text-xs leading-relaxed">💡 {result.scenario.scenario_insight}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {result.scenario.scenarios?.map((s, i) => <ScenarioCard key={i} scenario={s} idx={i} />)}
                </div>
              </Section>
            )}

            {/* ── PROACTIVE OPTIMIZATIONS ── */}
            {(activeSection === 'all' || activeSection === 'optimizations') && result.optimization && (
              <Section title="Proactive AI Optimization Suggestions" icon={Lightbulb} color="text-emerald-400">
                {result.optimization.trend_summary && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-300 text-xs leading-relaxed">📈 {result.optimization.trend_summary}</p>
                  </div>
                )}
                {result.optimization.optimization_radar?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-500 text-[10px] uppercase mb-2">Optimization Potential Radar</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart data={result.optimization.optimization_radar}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Radar name="Current" dataKey="current" stroke="#334155" fill="#334155" fillOpacity={0.4} />
                        <Radar name="Potential" dataKey="potential" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-3">
                  {result.optimization.optimizations?.map((o, i) => <OptimizationCard key={i} opt={o} idx={i} />)}
                </div>
              </Section>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}