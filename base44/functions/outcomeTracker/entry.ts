/**
 * Outcome Tracker — Closed-loop learning engine
 * Measures actual KPI outcomes vs AI predictions and feeds learning back
 * into the orchestrator's agent trust scores.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  if (req.method === 'OPTIONS') return nvOptions(requestId);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return nvError(requestId, String('Unauthorized'), 401);


    const body = await req.json();
    const { action, organization_id } = body;
    const orgId = organization_id || user.organization_id;

    // ── ACTION: Record recommendation + initial prediction ──────────────────
    if (action === 'record_recommendation') {
      const { recommendation_text, agent_ids, kpi_type, predicted_value, predicted_unit, decision_context } = body;

      const outcome = await base44.asServiceRole.entities.OutcomeLearning.create({
        organization_id: orgId,
        recommendation_text,
        agent_ids: agent_ids || [],
        kpi_type,
        predicted_value,
        predicted_unit,
        status: 'pending_feedback',
      });

      // Also log the decision
      await base44.asServiceRole.entities.AIDecisionLog.create({
        organization_id: orgId,
        decision_type: kpi_type,
        agents_used: agent_ids || [],
        input_summary: decision_context || recommendation_text,
        output_summary: `Predicted ${predicted_value}${predicted_unit} improvement in ${kpi_type}`,
        kpi_impact: { co2_kg: 0, cost_eur: 0, sla_percent: 0, risk_score: 0 },
        governance_checks: [],
        status: 'auto_approved',
        outcome_id: outcome.id,
      });

      return nvJson(requestId, { success: true, outcome_id: outcome.id });

    }

    // ── ACTION: Record actual measured outcome ──────────────────────────────
    if (action === 'record_outcome') {
      const { outcome_id, measured_value, was_implemented, implementation_date } = body;

      const existing = await base44.asServiceRole.entities.OutcomeLearning.filter({ id: outcome_id });
      if (!existing || existing.length === 0) {
        return nvError(requestId, String('Outcome record not found'), 404);

      }
      const rec = existing[0];

      // Calculate outcome score: how close was the prediction to reality?
      const predicted = rec.predicted_value || 1;
      const measured = measured_value || 0;
      const accuracy = was_implemented
        ? Math.max(0, 100 - Math.abs(((predicted - measured) / predicted) * 100))
        : 0;

      // Generate learning note via LLM
      const learningNote = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a logistics AI learning engine. An AI agent predicted a ${rec.kpi_type} improvement of ${predicted}${rec.predicted_unit}. The actual measured outcome was ${measured}${rec.predicted_unit}. Was implemented: ${was_implemented}.

Write a concise (2-3 sentences) learning note that will help future routing decisions for this type of KPI. Focus on: accuracy assessment, what should be adjusted, and any contextual factors that might explain the gap. Be specific and actionable.`,
      });

      // Adjust trust scores for involved agents
      const agentAdjustments = (rec.agent_ids || []).map(agentId => ({
        agent_id: agentId,
        previous_trust: 80,
        adjustment: accuracy > 80 ? +5 : accuracy > 60 ? +2 : accuracy > 40 ? -2 : -5,
        new_trust: Math.min(100, Math.max(0, 80 + (accuracy > 80 ? +5 : accuracy > 60 ? +2 : accuracy > 40 ? -2 : -5))),
        reason: `Outcome accuracy: ${accuracy.toFixed(0)}%`,
      }));

      await base44.asServiceRole.entities.OutcomeLearning.update(rec.id, {
        measured_value,
        was_implemented: was_implemented || false,
        implementation_date: implementation_date || new Date().toISOString(),
        measurement_date: new Date().toISOString(),
        outcome_score: Math.round(accuracy),
        learning_note: learningNote,
        agent_trust_adjustments: agentAdjustments,
        status: 'measured',
      });

      return nvJson(requestId, {
        success: true,
        outcome_score: Math.round(accuracy),
        learning_note: learningNote,
        agent_adjustments: agentAdjustments,
      });

    }

    // ── ACTION: Get learning summary for an org ─────────────────────────────
    if (action === 'get_learning_summary') {
      const outcomes = await base44.asServiceRole.entities.OutcomeLearning.filter(
        { organization_id: orgId, status: 'measured' },
        '-measurement_date', 50
      );

      const pending = await base44.asServiceRole.entities.OutcomeLearning.filter(
        { organization_id: orgId, status: 'pending_feedback' },
        '-created_date', 20
      );

      const decisionLog = await base44.asServiceRole.entities.AIDecisionLog.filter(
        { organization_id: orgId },
        '-created_date', 30
      );

      // Compute per-KPI averages
      const kpiStats = {};
      for (const o of outcomes) {
        if (!kpiStats[o.kpi_type]) kpiStats[o.kpi_type] = { count: 0, avg_score: 0, implemented: 0 };
        kpiStats[o.kpi_type].count++;
        kpiStats[o.kpi_type].avg_score += o.outcome_score || 0;
        if (o.was_implemented) kpiStats[o.kpi_type].implemented++;
      }
      for (const k of Object.keys(kpiStats)) {
        kpiStats[k].avg_score = Math.round(kpiStats[k].avg_score / kpiStats[k].count);
        kpiStats[k].implementation_rate = Math.round((kpiStats[k].implemented / kpiStats[k].count) * 100);
      }

      // Build agent trust map
      const agentTrust = {};
      for (const o of outcomes) {
        for (const adj of (o.agent_trust_adjustments || [])) {
          if (!agentTrust[adj.agent_id]) agentTrust[adj.agent_id] = { total_adj: 0, count: 0 };
          agentTrust[adj.agent_id].total_adj += adj.adjustment || 0;
          agentTrust[adj.agent_id].count++;
        }
      }

      return nvJson(requestId, {
        total_decisions: decisionLog.length,
        measured_outcomes: outcomes.length,
        pending_feedback: pending.length,
        avg_outcome_score: outcomes.length > 0
          ? Math.round(outcomes.reduce((s, o) => s + (o.outcome_score || 0), 0) / outcomes.length)
          : null,
        kpi_performance: kpiStats,
        agent_trust_map: agentTrust,
        recent_outcomes: outcomes.slice(0, 10),
        pending_recommendations: pending,
        recent_decisions: decisionLog.slice(0, 10),
      });

    }

    // ── ACTION: Check governance policies ───────────────────────────────────
    if (action === 'check_governance') {
      const { agent_ids, decision_type, estimated_cost_eur, user_role } = body;

      const policies = await base44.asServiceRole.entities.GovernancePolicy.filter(
        { organization_id: orgId, is_active: true }
      );

      const violations = [];
      const warnings = [];

      for (const policy of policies) {
        const appliesToAgents = !policy.applies_to_agents?.length || 
          agent_ids?.some(id => policy.applies_to_agents.includes(id));
        const appliesToRole = !policy.applies_to_roles?.length || 
          policy.applies_to_roles.includes(user_role || 'user');

        if (!appliesToAgents || !appliesToRole) continue;

        if (policy.policy_type === 'budget_limit' && policy.rule?.max_eur) {
          if (estimated_cost_eur > policy.rule.max_eur) {
            const entry = { policy_id: policy.id, policy_name: policy.name, enforcement: policy.enforcement, message: `Cost €${estimated_cost_eur} exceeds policy limit of €${policy.rule.max_eur}` };
            policy.enforcement === 'block' ? violations.push(entry) : warnings.push(entry);
          }
        }

        if (policy.policy_type === 'approval_required') {
          warnings.push({ policy_id: policy.id, policy_name: policy.name, enforcement: 'require_approval', message: `This decision type (${decision_type}) requires human approval per policy: ${policy.name}` });
        }
      }

      const blocked = violations.some(v => v.enforcement === 'block');

      // Update violation counts
      for (const v of [...violations, ...warnings]) {
        base44.asServiceRole.entities.GovernancePolicy.update(v.policy_id, {
          violation_count: 1,
          last_triggered: new Date().toISOString(),
        }).catch(() => {});
      }

      return nvJson(requestId, {
        allowed: !blocked,
        violations,
        warnings,
        requires_approval: warnings.some(w => w.enforcement === 'require_approval'),
      });

    }

    return nvError(requestId, 'Unknown action. Use: record_recommendation, record_outcome, get_learning_summary, check_governance', 400, 'BAD_REQUEST');


  } catch (error) {
    console.error('[Outcome Tracker]', error);
    return nvError(requestId, String(error.message), 500);

  }
});