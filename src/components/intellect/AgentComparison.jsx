import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";

const AGENT_COLORS = {
  "harbor_fleet_analyst": "#06b6d4",
  "harbor_route_optimizer": "#8b5cf6",
  "harbor_risk_engine": "#ef4444",
  "harbor_demand_forecaster": "#f59e0b",
  "harbor_financial_ai": "#10b981",
  "harbor_maintenance_bot": "#3b82f6",
  "harbor_compliance_guard": "#ec4899",
  "harbor_sustainability_ai": "#14b8a6",
  "harbor_customer_intel": "#f97316",
  "harbor_data_miner": "#6366f1",
};

const AGENT_DISPLAY_NAMES = {
  "harbor_fleet_analyst": "Fleet Analyst",
  "harbor_route_optimizer": "Route Optimizer",
  "harbor_risk_engine": "Risk Engine",
  "harbor_demand_forecaster": "Demand Forecaster",
  "harbor_financial_ai": "Financial AI",
  "harbor_maintenance_bot": "Maintenance Bot",
  "harbor_compliance_guard": "Compliance Guard",
  "harbor_sustainability_ai": "Sustainability AI",
  "harbor_customer_intel": "Customer Intel",
  "harbor_data_miner": "Data Miner",
};

export default function AgentComparison({ orgId }) {
  const [selectedAgents, setSelectedAgents] = useState([]);

  // Fetch all agent executions
  const { data: allExecutions, isLoading } = useQuery({
    queryKey: ["agent-executions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const executions = await base44.entities.AgentExecution.filter(
        { organization_id: orgId },
        "-created_date",
        100
      );
      return executions;
    },
    enabled: !!orgId,
  });

  // Calculate metrics per agent
  const agentMetrics = useMemo(() => {
    if (!allExecutions) return {};

    const metrics = {};
    allExecutions.forEach((exec) => {
      const agentId =
        exec.agents_involved?.[0] || exec.workflow_name || "unknown";
      if (!metrics[agentId]) {
        metrics[agentId] = {
          name: agentId,
          displayName: AGENT_DISPLAY_NAMES[agentId] || agentId,
          total: 0,
          completed: 0,
          failed: 0,
          totalTokens: 0,
          totalLatency: 0,
          latencies: [],
          statuses: [],
        };
      }
      metrics[agentId].total++;
      metrics[agentId].statuses.push(exec.status);
      if (exec.status === "completed") {
        metrics[agentId].completed++;
      }
      if (exec.status === "failed") {
        metrics[agentId].failed++;
      }
      if (exec.tokens_used) {
        metrics[agentId].totalTokens += exec.tokens_used;
      }
      if (exec.latency_ms) {
        metrics[agentId].totalLatency += exec.latency_ms;
        metrics[agentId].latencies.push(exec.latency_ms);
      }
    });

    // Calculate aggregates
    Object.keys(metrics).forEach((key) => {
      const m = metrics[key];
      m.successRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
      m.avgLatency =
        m.latencies.length > 0
          ? Math.round(m.totalLatency / m.latencies.length)
          : 0;
      m.avgTokens =
        m.total > 0 ? Math.round(m.totalTokens / m.total) : 0;
    });

    return metrics;
  }, [allExecutions]);

  const availableAgents = useMemo(
    () => Object.keys(agentMetrics).sort(),
    [agentMetrics]
  );

  const selectedMetrics = useMemo(
    () => selectedAgents.map((id) => agentMetrics[id]).filter(Boolean),
    [selectedAgents, agentMetrics]
  );

  // Chart data
  const successRateData = selectedMetrics.map((m) => ({
    name: m.displayName,
    "Success Rate": m.successRate,
    "Failure Rate": 100 - m.successRate,
  }));

  const latencyData = selectedMetrics.map((m) => ({
    name: m.displayName,
    "Avg Latency (ms)": m.avgLatency,
  }));

  const tokenData = selectedMetrics.map((m) => ({
    name: m.displayName,
    "Avg Tokens": m.avgTokens,
  }));

  const executionCountData = selectedMetrics.map((m) => ({
    name: m.displayName,
    Completed: m.completed,
    Failed: m.failed,
  }));

  const toggleAgent = (agentId) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            AI Agent Performance Comparison
          </h1>
          <p className="text-slate-400">Sammenlign agenter side om side med detaljerede metrics</p>
        </div>

        {/* Agent Selection */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4">
            Vælg Agenter
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableAgents.map((agentId) => (
              <button
                key={agentId}
                onClick={() => toggleAgent(agentId)}
                className={`px-4 py-2 rounded-lg transition-all border ${
                  selectedAgents.includes(agentId)
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {AGENT_DISPLAY_NAMES[agentId] || agentId}
              </button>
            ))}
          </div>
        </div>

        {selectedMetrics.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Vælg mindst en agent for at se sammenligning
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedMetrics.map((metric) => (
                <div
                  key={metric.name}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-semibold text-white">
                      {metric.displayName}
                    </h3>
                    <button
                      onClick={() => toggleAgent(metric.name)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Success Rate</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-emerald-400">
                          {metric.successRate}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {metric.completed}/{metric.total}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Avg Latency</p>
                      <p className="text-lg font-bold text-blue-400">
                        {metric.avgLatency}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tokens/Execution</p>
                      <p className="text-lg font-bold text-violet-400">
                        {metric.avgTokens}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Success Rate Comparison */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4">
                Success Rate Comparison
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={successRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Bar dataKey="Success Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Failure Rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latency Comparison */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4">
                Latency Comparison (ms)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Avg Latency (ms)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Execution Count Comparison */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4">
                Executions Completed vs Failed
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executionCountData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tokens Comparison */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4">
                Tokens per Execution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Bar dataKey="Avg Tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}