import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Sparkles, TrendingUp, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function CRMAIInsights({ deals, customers }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const pipelineValue = deals.reduce((s, d) => s + (d.value || 0), 0);
    const byStage = ['lead','qualified','proposal','negotiation','won','lost'].map(s => ({
      stage: s,
      count: deals.filter(d => d.stage === s).length,
      value: deals.filter(d => d.stage === s).reduce((sum, d) => sum + (d.value || 0), 0)
    }));
    const atRisk = deals.filter(d => d.ai_risk_level === 'high' || d.ai_risk_level === 'critical');
    const overdue = deals.filter(d => d.expected_close_date && new Date(d.expected_close_date) < new Date() && !['won','lost'].includes(d.stage));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert B2B CRM analyst. Analyze this sales pipeline and provide strategic insights.

PIPELINE SUMMARY:
- Total deals: ${deals.length}
- Total pipeline value: €${pipelineValue.toLocaleString()}
- Customers: ${customers.length}

BY STAGE:
${byStage.map(s => `- ${s.stage}: ${s.count} deals, €${s.value.toLocaleString()}`).join('\n')}

AT-RISK DEALS: ${atRisk.length}
OVERDUE: ${overdue.length}

TOP DEALS (by value):
${deals.sort((a,b) => (b.value||0)-(a.value||0)).slice(0,5).map(d => `- "${d.title}" | €${d.value?.toLocaleString()} | ${d.stage} | risk: ${d.ai_risk_level}`).join('\n')}

Provide:
1. **Pipeline Health** — overall assessment with key metrics
2. **Critical Actions** — top 3 things to do TODAY
3. **Win Probability Analysis** — which deals to prioritize
4. **Revenue Forecast** — realistic 30/60/90 day forecast
5. **Strategic Recommendations** — 2-3 strategic moves

Be specific, quantified, and actionable. Use markdown formatting.`,
      response_json_schema: null
    });

    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border border-violet-500/40">
            <Brain className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h3 className="text-white font-bold">AI Pipeline Intelligence</h3>
            <p className="text-slate-400 text-xs">GPT-powered sales analysis</p>
          </div>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
      </div>

      {!analysis && !loading && (
        <div className="text-center py-8 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click "Run AI Analysis" to get intelligent insights on your pipeline</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700/50 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      )}

      {analysis && (
        <div className="prose prose-sm prose-invert max-w-none prose-headings:text-cyan-300 prose-strong:text-white prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:text-slate-300">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}