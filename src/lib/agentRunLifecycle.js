/**
 * Shared agent run lifecycle — plan → execute → evaluate with optional AgentExecution persistence.
 *
 * TODO(ApprovalRequest): when mutation requires approval, startRun returns awaiting_approval and blocks execution until approved.
 * TODO(AgentPlan persistence): store planner output in routing_decision.steps or dedicated entity when orchestrateCommands runs.
 * TODO(OutcomeEvaluation): link completed runs to OutcomeLearning / KPI measurement jobs.
 * TODO(export / eval): join AgentExecution + harborEvalCaseSchema for benchmark JSONL.
 * TODO(audit trail): emit immutable audit row with correlation_id on each transition (service role function).
 */

import {
  normalizeHarborExecutionRecord,
  INTELLECT_RUN_KIND,
  stackRoleFromRunKind,
  toAgentExecutionPayload,
  PIPELINE_PHASE,
  mergeHarborRoutingDecision,
} from "@/lib/harborIntelligenceModel";

/** @typedef {'success'|'failure'|'partial'} RunOutcome */

/**
 * Minimal evaluate payload attached to meta.evaluation.
 * @typedef {object} RunEvaluation
 * @property {RunOutcome} outcome
 * @property {'ok'|'degraded'|'error'} quality
 * @property {number|null} latencyMs
 * @property {string} summary
 * @property {string|null} failureReason
 * @property {string} evaluatedAt - ISO
 */

/**
 * Classify output for governance / observability (not a substitute for human review).
 * @param {{ success: boolean, error?: string|null, outputPreview?: string|null, latencyMs?: number|null }} p
 * @returns {RunEvaluation}
 */
export function evaluateRun(p) {
  const evaluatedAt = new Date().toISOString();
  const latencyMs = p.latencyMs ?? null;
  if (!p.success) {
    return {
      outcome: "failure",
      quality: "error",
      latencyMs,
      summary: (p.error || "failed").slice(0, 500),
      failureReason: p.error || "unknown_error",
      evaluatedAt,
    };
  }
  const preview = (p.outputPreview || "").trim();
  const quality =
    preview.length >= 40 ? "ok" : preview.length > 0 ? "degraded" : "degraded";
  return {
    outcome: "success",
    quality,
    latencyMs,
    summary: preview.slice(0, 500) || "(no text output)",
    failureReason: null,
    evaluatedAt,
  };
}

/**
 * @param {import('@/lib/harborIntelligenceModel').HarborExecutionRecord} row
 * @param {string} organizationId
 */
async function createAgentExecutionRunning(base44, row, organizationId) {
  const base = toAgentExecutionPayload(row, organizationId);
  const payload = {
    ...base,
    status: "running",
    started_at: row.startedAt ? new Date(row.startedAt).toISOString() : new Date().toISOString(),
    routing_decision: JSON.stringify({
      kind: row.kind,
      stack_role: row.stackRole,
      correlation_id: row.meta?.correlationId || row.id,
      phase: row.meta?.phase || PIPELINE_PHASE.EXECUTE,
    }),
  };
  const doc = await base44.entities.AgentExecution.create(payload);
  return doc?.id || doc;
}

/**
 * @param {string} agentExecutionId
 */
async function patchAgentExecution(base44, agentExecutionId, patch) {
  if (!agentExecutionId) return;
  await base44.entities.AgentExecution.update(agentExecutionId, patch);
}

/**
 * Start a run: local queue row + optional persistent AgentExecution (running).
 *
 * @param {object} ctx
 * @param {import('@/api/base44Client').base44} ctx.base44
 * @param {string|null} ctx.organizationId
 * @param {function(object): void} ctx.appendExecutionRun
 * @param {function(string, object): void} ctx.updateExecutionRun
 * @param {string} ctx.localId - client run id (must be stable for this turn)
 * @param {string} ctx.kind
 * @param {string} ctx.label
 * @param {Record<string, unknown>} [ctx.meta]
 */
export async function startRun(ctx) {
  const {
    base44,
    organizationId,
    appendExecutionRun,
    updateExecutionRun,
    localId,
    kind,
    label,
    meta = {},
  } = ctx;

  const correlationId = meta.correlationId || localId;
  const row = normalizeHarborExecutionRecord({
    id: localId,
    kind,
    status: "running",
    label,
    startedAt: Date.now(),
    meta: {
      ...meta,
      correlationId,
      phase: meta.phase || PIPELINE_PHASE.EXECUTE,
    },
  });

  appendExecutionRun({
    id: row.id,
    kind: row.kind,
    status: "running",
    label: row.label,
    startedAt: row.startedAt,
    meta: row.meta,
  });

  let agentExecutionId = null;
  if (organizationId) {
    try {
      agentExecutionId = await createAgentExecutionRunning(base44, row, organizationId);
      if (agentExecutionId) {
        updateExecutionRun(localId, {
          meta: {
            ...row.meta,
            agentExecutionId,
            correlationId,
          },
        });
      }
    } catch (e) {
      console.warn("[agentRunLifecycle] AgentExecution.create failed — local run only:", e?.message || e);
    }
  }

  return { localId, correlationId, agentExecutionId, startedAt: row.startedAt };
}

/**
 * @param {object} ctx
 * @param {function(string, object): void} ctx.updateExecutionRun
 * @param {import('@/api/base44Client').base44} ctx.base44
 * @param {string} ctx.localId
 * @param {boolean} ctx.success
 * @param {string|null} [ctx.outputPreview]
 * @param {string|null} [ctx.error]
 * @param {number|null} [ctx.latencyMs]
 * @param {string|null} [ctx.agentExecutionId] - if not passed, read from current row by caller via meta merge
 */
export async function completeRun(ctx) {
  const {
    base44,
    organizationId,
    updateExecutionRun,
    localId,
    success,
    outputPreview,
    error,
    latencyMs,
    agentExecutionId: explicitAeId,
  } = ctx;

  const evaluation = evaluateRun({
    success,
    error,
    outputPreview,
    latencyMs,
  });

  updateExecutionRun(localId, {
    status: success ? "completed" : "failed",
    finishedAt: Date.now(),
    outputPreview: outputPreview || null,
    error: success ? null : error || evaluation.failureReason,
    meta: {
      phase: PIPELINE_PHASE.EVALUATE,
      evaluation,
    },
  });

  const aeId = explicitAeId;
  if (aeId && organizationId) {
    try {
      let routingDecisionStr;
      try {
        const doc = await base44.entities.AgentExecution.get(aeId);
        const merged = mergeHarborRoutingDecision(doc?.routing_decision, {
          phase: PIPELINE_PHASE.EVALUATE,
          correlation_id: localId,
          evaluation,
        });
        routingDecisionStr = JSON.stringify(merged);
      } catch {
        routingDecisionStr = JSON.stringify(
          mergeHarborRoutingDecision(null, {
            phase: PIPELINE_PHASE.EVALUATE,
            correlation_id: localId,
            evaluation,
          })
        );
      }
      const rowPatch = {
        status: success ? "completed" : "failed",
        result: outputPreview ? String(outputPreview).slice(0, 12000) : undefined,
        error: success ? undefined : error || evaluation.failureReason,
        latency_ms: latencyMs ?? undefined,
        completed_at: new Date().toISOString(),
        routing_decision: routingDecisionStr,
      };
      await patchAgentExecution(base44, aeId, rowPatch);
    } catch (e) {
      console.warn("[agentRunLifecycle] AgentExecution.update (complete) failed:", e?.message || e);
    }
  }
}

/**
 * @param {object} ctx
 */
export async function failRun(ctx) {
  const {
    base44,
    organizationId,
    updateExecutionRun,
    localId,
    error,
    agentExecutionId,
    latencyMs,
  } = ctx;

  await completeRun({
    base44,
    organizationId,
    updateExecutionRun,
    localId,
    success: false,
    outputPreview: null,
    error: error || "failed",
    latencyMs: latencyMs ?? null,
    agentExecutionId,
  });
}

/**
 * Placeholder for approval-gated execution — wire to ApprovalRequest + AgentExecution.awaiting_approval.
 * TODO(approval workflow): implement queue consumer or resume after human_approved_* fields set.
 */
export async function awaitApproval(/* ctx */) {
  return { ok: false, reason: "not_implemented" };
}

/**
 * Map persisted AgentExecution → local Harbor-shaped row for hydration.
 */
export function agentExecutionToLocalRow(doc) {
  let routing = {};
  try {
    routing = doc.routing_decision ? JSON.parse(doc.routing_decision) : {};
  } catch {
    routing = {};
  }
  const kind = routing.kind || "unknown";
  const stackRole = routing.stack_role || stackRoleFromRunKind(kind);
  const startedAt = doc.started_at ? new Date(doc.started_at).getTime() : Date.now();
  const finishedAt = doc.completed_at ? new Date(doc.completed_at).getTime() : undefined;

  return normalizeHarborExecutionRecord({
    id: `srv_${doc.id}`,
    kind,
    stackRole,
    status:
      doc.status === "completed"
        ? "completed"
        : doc.status === "failed"
          ? "failed"
          : doc.status === "running"
            ? "running"
            : "queued",
    label: doc.task || kind,
    startedAt,
    finishedAt,
    outputPreview: doc.result ? String(doc.result).slice(0, 240) : null,
    error: doc.error || null,
    meta: {
      agentExecutionId: doc.id,
      correlationId:
        routing.correlation_id ||
        routing.correlation_hint ||
        doc.id,
      fromRemote: true,
      phase: routing.phase || PIPELINE_PHASE.EVALUATE,
    },
  });
}
