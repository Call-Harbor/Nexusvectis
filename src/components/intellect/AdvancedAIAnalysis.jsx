import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, AlertTriangle, Zap, Activity, Brain, Loader2,
  BarChart3, MapPin, Gauge, Fuel, Shield, Sparkles, ChevronRight,
  Eye, Target, Lightbulb, Rocket
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export const PredictiveMaintenanceAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Provide predictive maintenance analysis for a fleet. Include failure risk scores, maintenance schedule recommendations, parts that need replacement, estimated downtime, and cost impact. Format as JSON with predictions array.',
          response_json_schema: {
            type: 'object',
            properties: {
              predictions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    vehicle_id: { type: 'string' },
                    component: { type: 'string' },
                    failure_risk: { type: 'number' },
                    recommended_action: { type: 'string' },
                    estimated_cost: { type: 'number' },
                    urgency: { type: 'string' }
                  }
                }
              },
              summary: { type: 'string' },
              cost_savings: { type: 'number' }
            }
          }
        });
        setData(result);
      } catch (error) {
        console.error('Analysis error:', error);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-cyan-400"><Loader2 className="w-4 h-4 animate-spin" />Analyzing fleet maintenance patterns...</div>;
  }

  return (
    <div className="space-y-4">
      {data?.predictions?.map((pred, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-white">{pred.vehicle_id} - {pred.component}</p>
              <p className="text-xs text-slate-400">{pred.recommended_action}</p>
            </div>
            <Badge className={pred.urgency === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}>
              {Math.round(pred.failure_risk)}% risk
            </Badge>
          </div>
          <div className="text-xs text-slate-400">Est. cost: €{pred.estimated_cost?.toLocaleString() || 0}</div>
        </motion.div>
      ))}
      {data?.summary && (
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs text-slate-300">{data.summary}</p>
        </div>
      )}
    </div>
  );
};

export const DemandForecastAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Generate demand forecast for next 30 days. Include weekly forecast data, peak demand periods, recommended fleet capacity, and growth trends.',
          response_json_schema: {
            type: 'object',
            properties: {
              forecast: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    week: { type: 'number' },
                    demand: { type: 'number' },
                    confidence: { type: 'number' }
                  }
                }
              },
              peak_period: { type: 'string' },
              growth_rate: { type: 'number' },
              fleet_capacity_needed: { type: 'number' }
            }
          }
        });
        setData(result);
      } catch (error) {
        console.error('Forecast error:', error);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-emerald-400"><Loader2 className="w-4 h-4 animate-spin" />Forecasting demand patterns...</div>;
  }

  return (
    <div className="space-y-4">
      {data?.forecast && (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.forecast}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '10px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            <Area type="monotone" dataKey="demand" stroke="#10b981" fillOpacity={1} fill="url(#colorDemand)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-slate-900/50">
          <p className="text-slate-400">Peak Period</p>
          <p className="font-bold text-white">{data?.peak_period || 'N/A'}</p>
        </div>
        <div className="p-2 rounded bg-slate-900/50">
          <p className="text-slate-400">Growth Rate</p>
          <p className="font-bold text-emerald-400">+{data?.growth_rate || 0}%</p>
        </div>
      </div>
    </div>
  );
};

export const RiskAssessmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Assess operational risks for a logistics fleet. Include safety risks, fuel price volatility, demand shocks, regulatory changes, and driver availability issues.',
          response_json_schema: {
            type: 'object',
            properties: {
              risks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    severity: { type: 'number' },
                    impact: { type: 'string' },
                    mitigation: { type: 'string' }
                  }
                }
              },
              overall_risk_score: { type: 'number' }
            }
          }
        });
        setData(result);
      } catch (error) {
        console.error('Risk assessment error:', error);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-red-400"><Loader2 className="w-4 h-4 animate-spin" />Assessing operational risks...</div>;
  }

  return (
    <div className="space-y-4">
      {data?.risks?.map((risk, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="p-3 rounded-lg border border-red-500/30 bg-red-500/5"
        >
          <div className="flex items-start justify-between mb-1">
            <p className="font-semibold text-white">{risk.category}</p>
            <Badge className="bg-red-500/20 text-red-400">Severity: {risk.severity}/10</Badge>
          </div>
          <p className="text-xs text-slate-400 mb-2">{risk.impact}</p>
          <p className="text-xs text-emerald-400">✓ {risk.mitigation}</p>
        </motion.div>
      ))}
    </div>
  );
};

export const PerformanceAnalyticsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Analyze fleet performance including fuel efficiency, on-time delivery rate, safety record, vehicle utilization, and cost per km.',
          response_json_schema: {
            type: 'object',
            properties: {
              metrics: {
                type: 'object',
                properties: {
                  fuel_efficiency: { type: 'number' },
                  on_time_delivery: { type: 'number' },
                  safety_score: { type: 'number' },
                  utilization_rate: { type: 'number' },
                  cost_per_km: { type: 'number' }
                }
              },
              ranking: { type: 'string' },
              improvements: { type: 'array', items: { type: 'string' } }
            }
          }
        });
        setData(result);
      } catch (error) {
        console.error('Analytics error:', error);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-blue-400"><Loader2 className="w-4 h-4 animate-spin" />Analyzing performance metrics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data?.metrics && Object.entries(data.metrics).map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
          >
            <p className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
            <p className="font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value}
              {key.includes('rate') || key.includes('efficiency') ? '%' : ''}
            </p>
          </motion.div>
        ))}
      </div>
      {data?.ranking && (
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs font-semibold text-white mb-2">Fleet Ranking</p>
          <p className="text-xs text-slate-300">{data.ranking}</p>
        </div>
      )}
      {data?.improvements && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-white">Improvement Areas</p>
          {data.improvements.map((imp, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <ChevronRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">{imp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};