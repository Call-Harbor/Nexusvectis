/**
 * Outcome Intelligence Panel
 * Shows the "digital COO" view: all AI decisions, KPI outcomes, learning scores,
 * and governance status — framed in business language, not AI tech language.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  TrendingUp, TrendingDown, CheckCircle2, Clock, AlertTriangle, 
  X, BarChart3, Target, Shield, Brain, Loader2, ChevronRight,
  Zap, Leaf, DollarSign, Activity, RefreshCw, ThumbsUp, ThumbsDown
} from "lucide-react";

const KPI_META = {
  co2_reduction: { label: "CO₂ Reduction", icon: Leaf, color: "#22c55e", unit: "kg" },
  cost_savings: { label: "Cost Savings", icon: DollarSign, color: "#f59e0b", unit: "EUR" },
  sla_compliance: { label: "SLA Compliance", icon: CheckCircle2, color: "#06b6d4", unit: "%" },
  fuel_efficiency: { label: "Fuel Efficiency", icon: Activity, color: "#8b5cf6", unit: "%" },
  route_optimization: { label: "Route Optimization", icon: TrendingUp, color: "#06b6d4", unit: "%" },
  maintenance_prevention: { label: "Maintenance Prevention", icon: Shield, color: "#f59e0b", unit: "EUR" },
  revenue_impact: { label: "Revenue Impact", icon: DollarSign, color: "#10b981", unit: "EUR" },
  delay_reduction: { label: "Delay Reduction", icon: Clock, color: "#a78bfa", unit: "min" },
};

const STATUS_MAP = {
  pending_feedback: { label: "Awaiting Outcome", color: "#f59e0b" },
  implemented: { label: "Implemented", color: "#06b6d4" },
  measured: { label: "Measured", color: "#10b981" },
  skipped: { label: "Skipped", color: "#64748b" },
};

function ScoreRing({ score, size = 48 }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <span className="text-[10px] font-black font-mono" style={{ color }}>{score}%</span>
    </div>
  );
}

function FeedbackModal({ recommendation, onSubmit, onClose }) {
  const [implemented, setImplemented] = useState(null);
  const [measured, setMeasured] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (implemented === null || !measured) return;
    setSubmitting(true);
    await onSubmit({ outcome_id: recommendation.id, measured_value: parseFloat(measured), was_implemented: implemented });
    setSubmitting(false);
    onClose();
  };

  const kpi = KPI_META[recommendation.kpi_type] || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "rgba(5,10,25,0.99)", border: "1px solid rgba(6,182,212,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Record Outcome</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">{recommendation.recommendation_text}</p>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Was this recommendation implemented?</p>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => setImplemented(val)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all"
                  style={{
                    background: implemented === val ? (val ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)") : "rgba(255,255,255,0.03)",
                    border: `1px solid ${implemented === val ? (val ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.08)"}`,
                    color: implemented === val ? (val ? "#10b981" : "#ef4444") : "#64748b"
                  }}>
                  {val ? <><ThumbsUp className="w-3.5 h-3.5" /> Yes</> : <><ThumbsDown className="w-3.5 h-3.5" /> No</>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">
              Actual {kpi.label || "outcome"} achieved ({recommendation.predicted_unit})
            </p>
            <div className="flex items-center gap-2">
              <input type="number" value={measured} onChange={e => setMeasured(e.target.value)}
                placeholder={`Predicted: ${recommendation.predicted_value}`}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-white bg-black/40 outline-none"
                style={{ border: "1px solid rgba(6,182,212,0.25)" }} />
              <span className="text-xs text-slate-500 font-mono">{recommendation.predicted_unit}</span>
            </div>
          </div>
          <motion.button onClick={handleSubmit} disabled={submitting || implemented === null || !measured}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.2))", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)" }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Outcome"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OutcomeIntelligencePanel({ orgId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("outcomes");
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke("outcomeTracker", { action: "get_learning_summary", organization_id: orgId });
      setData(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const submitOutcome = async (payload) => {
    await base44.functions.invoke("outcomeTracker", { action: "record_outcome", organization_id: orgId, ...payload });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#06b6d4" }} />
      </div>
    );
  }

  const kpiKeys = data?.kpi_performance ? Object.keys(data.kpi_performance) : [];

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden" style={{ background: "rgba(1,5,15,0.98)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
              <Target className="w-4 h-4" style={{ color: "#06b6d4" }} />
            </div>
            <div>
              <p className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>Digital COO</p>
              <p className="text-[9px] text-slate-500 font-mono">Decision outcomes · KPI learning · Governance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={refreshing}
              className="p-1.5 rounded-lg transition-all hover:bg-slate-800" style={{ color: "#64748b" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-all" style={{ color: "#64748b" }}>
              <X className="w-4 h-4" />
            </button>}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="px-4 py-3 flex gap-3 overflow-x-auto flex-shrink-0 border-b" style={{ borderColor: "rgba(6,182,212,0.06)" }}>
          {[
            { label: "Decisions", value: data?.total_decisions ?? 0, icon: Brain, color: "#8b5cf6" },
            { label: "Outcomes Measured", value: data?.measured_outcomes ?? 0, icon: CheckCircle2, color: "#10b981" },
            { label: "Awaiting Feedback", value: data?.pending_feedback ?? 0, icon: Clock, color: "#f59e0b" },
            { label: "Avg Accuracy", value: data?.avg_outcome_score != null ? `${data.avg_outcome_score}%` : "—", icon: Target, color: "#06b6d4" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-2.5"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                <div>
                  <p className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{item.label}</p>
                  <p className="text-sm font-black font-mono" style={{ color: item.color }}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-1 flex-shrink-0 border-b" style={{ borderColor: "rgba(6,182,212,0.06)" }}>
          {["outcomes", "pending", "governance", "kpi"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
              style={{
                background: tab === t ? "rgba(6,182,212,0.12)" : "transparent",
                color: tab === t ? "#06b6d4" : "#475569",
                border: tab === t ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent"
              }}>
              {t === "outcomes" ? "Measured Outcomes" : t === "pending" ? `Pending (${data?.pending_feedback ?? 0})` : t === "governance" ? "All Decisions" : "KPI Performance"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">

          {/* OUTCOMES */}
          {tab === "outcomes" && (data?.recent_outcomes || []).map((o, i) => {
            const kpi = KPI_META[o.kpi_type] || { label: o.kpi_type, color: "#64748b", unit: "" };
            const Icon = kpi.icon || Activity;
            return (
              <motion.div key={o.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start gap-3">
                  <ScoreRing score={o.outcome_score || 0} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                        {kpi.label}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {o.was_implemented ? "✓ Implemented" : "✗ Skipped"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed truncate">{o.recommendation_text}</p>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-mono">
                      <span style={{ color: "#8b5cf6" }}>Predicted: {o.predicted_value}{kpi.unit}</span>
                      <span style={{ color: o.outcome_score > 70 ? "#10b981" : "#ef4444" }}>Actual: {o.measured_value}{kpi.unit}</span>
                    </div>
                    {o.learning_note && (
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed border-t border-slate-800/80 pt-1.5">
                        💡 {o.learning_note}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {tab === "outcomes" && !data?.recent_outcomes?.length && (
            <div className="text-center py-12 text-slate-600 text-xs font-mono">No measured outcomes yet</div>
          )}

          {/* PENDING FEEDBACK */}
          {tab === "pending" && (data?.pending_recommendations || []).map((o, i) => {
            const kpi = KPI_META[o.kpi_type] || { label: o.kpi_type, color: "#f59e0b", unit: "" };
            return (
              <motion.div key={o.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${kpi.color}15`, color: kpi.color }}>{kpi.label}</span>
                    <span className="text-[9px] text-slate-600 font-mono">Predicted: {o.predicted_value}{o.predicted_unit}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{o.recommendation_text}</p>
                </div>
                <button onClick={() => setFeedbackTarget(o)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
                  style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                  Record
                </button>
              </motion.div>
            );
          })}
          {tab === "pending" && !data?.pending_recommendations?.length && (
            <div className="text-center py-12 text-slate-600 text-xs font-mono">No pending recommendations</div>
          )}

          {/* ALL DECISIONS */}
          {tab === "governance" && (data?.recent_decisions || []).map((d, i) => (
            <motion.div key={d.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === "auto_approved" ? "#10b981" : d.status === "blocked" ? "#ef4444" : "#f59e0b" }} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">{d.status?.replace(/_/g, " ")}</span>
                <span className="text-[9px] text-slate-700 font-mono ml-auto">{d.decision_type?.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{d.input_summary}</p>
              <p className="text-[10px] text-slate-600 mt-1 truncate">{d.output_summary}</p>
              {d.agents_used?.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {d.agents_used.slice(0, 4).map(a => (
                    <span key={a} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.08)", color: "#64748b" }}>
                      {a.replace("harbor_", "").replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {tab === "governance" && !data?.recent_decisions?.length && (
            <div className="text-center py-12 text-slate-600 text-xs font-mono">No decisions logged yet</div>
          )}

          {/* KPI PERFORMANCE */}
          {tab === "kpi" && kpiKeys.map(k => {
            const kpi = KPI_META[k] || { label: k, color: "#64748b" };
            const Icon = kpi.icon || Activity;
            const stats = data.kpi_performance[k];
            return (
              <motion.div key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4"
                style={{ background: `${kpi.color}06`, border: `1px solid ${kpi.color}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold font-mono" style={{ color: kpi.color }}>{kpi.label}</p>
                    <p className="text-[10px] text-slate-500">{stats.count} decisions measured</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black font-mono" style={{ color: stats.avg_score > 70 ? "#10b981" : stats.avg_score > 50 ? "#f59e0b" : "#ef4444" }}>{stats.avg_score}%</p>
                    <p className="text-[9px] text-slate-600 font-mono">avg accuracy</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${stats.implementation_rate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: kpi.color }} />
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: kpi.color }}>{stats.implementation_rate}% implemented</span>
                </div>
              </motion.div>
            );
          })}
          {tab === "kpi" && kpiKeys.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-xs font-mono">No KPI data yet — record outcomes to populate</div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackTarget && (
          <FeedbackModal recommendation={feedbackTarget} onSubmit={submitOutcome} onClose={() => setFeedbackTarget(null)} />
        )}
      </AnimatePresence>
    </>
  );
}