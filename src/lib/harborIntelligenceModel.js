/**
 * Harbor Intelligence Architecture — domain vocabulary for NexusVectis.
 *
 * Harbor Intellect (thinking layer): reasoning, analysis, planning, explanation,
 * prioritization, narrative synthesis — typically via harbor_intellect agent,
 * LLM analysis, scenario engines. Does not mutate operational state without going
 * through orchestration / approval.
 *
 * Harbor Orchestration (acting layer): task routing, delegation to workers/agents,
 * tool execution, retries, execution tracking, queues — e.g. orchestrateCommands,
 * orchestrateMultipleAIs, HarborOrchestratorAPI, AITaskRunner-driven runs.
 *
 * Layers map loosely to:
 * - Context: org scope + fleet entities + conversation/session metadata (assembled client or server-side).
 * - Memory: AdaptiveAgentMemory, AgentSharedMemory, ChatSession, conversation persistence — TODO unify CaseMemory.
 * - Planner: harborCore / orchestrateCommands task decomposition — produces AgentPlan-shaped structures (TODO dedicated entity).
 * - Executor: orchestrateMultipleAIs, window APIs, entity mutations via secured functions.
 * - Tools / integrations: base44.functions.*, entity CRUD, external hooks.
 * - Observability & audit: AgentExecution, FleetAIUsage, APIUsage, auditLog — TODO single correlation id everywhere.
 * - Approval / governance: AgentWorkflow.require_human_approval, GovernancePolicy, AIDecisionLog.status — TODO ApprovalRequest entity.
 */

/** @typedef {'intellect'|'orchestration'} HarborStackRole */

/** Intellect-side run kinds (reasoning / analysis). */
export const INTELLECT_RUN_KIND = {
  HARBOR_AGENT: "harbor_intellect",
  DEEP_ANALYSIS: "deep_analysis",
};

/** Orchestration-side run kinds (delegation / execution) — extend when wiring task runner. */
export const ORCHESTRATION_RUN_KIND = {
  TASK_RUNNER: "task_runner",
  ORCHESTRATOR_API: "orchestrator_api",
};

/** Plan → execute → evaluate pipeline phases (for tracing only until persisted). */
export const PIPELINE_PHASE = {
  PLAN: "plan",
  EXECUTE: "execute",
  EVALUATE: "evaluate",
};

/**
 * Maps stack role from run kind string (extend as new kinds appear).
 * @param {string} kind
 * @returns {HarborStackRole}
 */
export function stackRoleFromRunKind(kind) {
  if (
    kind === INTELLECT_RUN_KIND.HARBOR_AGENT ||
    kind === INTELLECT_RUN_KIND.DEEP_ANALYSIS
  ) {
    return "intellect";
  }
  return "orchestration";
}

/**
 * Canonical execution row shape for UI + future AgentExecution persistence.
 * @typedef {object} HarborExecutionRecord
 * @property {string} id
 * @property {string} kind - run type discriminator
 * @property {HarborStackRole} stackRole
 * @property {'queued'|'running'|'completed'|'failed'} status
 * @property {string} [label]
 * @property {number} startedAt
 * @property {number} [finishedAt]
 * @property {string|null} [error]
 * @property {string|null} [outputPreview]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * Normalize a partial record before merging into session log.
 * @param {Partial<HarborExecutionRecord> & { kind: string }} partial
 * @returns {HarborExecutionRecord}
 */
export function normalizeHarborExecutionRecord(partial) {
  const kind = partial.kind || partial.type || "unknown";
  const stackRole = partial.stackRole ?? stackRoleFromRunKind(kind);
  return {
    id: partial.id || `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    stackRole,
    status: partial.status || "running",
    label: partial.label ?? "",
    startedAt: partial.startedAt ?? Date.now(),
    finishedAt: partial.finishedAt ?? undefined,
    error: partial.error ?? null,
    outputPreview: partial.outputPreview ?? null,
    meta: partial.meta && typeof partial.meta === "object" ? partial.meta : {},
  };
}

/**
 * Maps session execution row → AgentExecution-friendly payload for future persistence.
 * TODO(persistent execution log): call from a secured base44 function with service role + correlation id.
 * TODO(audit trail): append immutable audit entry after each transition.
 *
 * @param {HarborExecutionRecord} row
 * @param {string} organizationId
 * @returns {object}
 */
export function toAgentExecutionPayload(row, organizationId) {
  return {
    organization_id: organizationId,
    task: row.label || row.kind,
    status:
      row.status === "completed"
        ? "completed"
        : row.status === "failed"
          ? "failed"
          : row.status === "running"
            ? "running"
            : "queued",
    orchestration_mode: row.stackRole === "intellect" ? "intellect" : "orchestration",
    routing_decision: JSON.stringify({
      kind: row.kind,
      stack_role: row.stackRole,
      correlation_id: row.meta?.correlationId || row.id,
    }),
    result: row.outputPreview || undefined,
    error: row.error || undefined,
    latency_ms: row.meta?.latencyMs ?? undefined,
    tokens_used: row.meta?.tokensUsed ?? undefined,
    cost_estimate: row.meta?.costEstimate ?? undefined,
    started_at: row.startedAt ? new Date(row.startedAt).toISOString() : undefined,
    completed_at: row.finishedAt ? new Date(row.finishedAt).toISOString() : undefined,
    agents_involved:
      row.kind === INTELLECT_RUN_KIND.HARBOR_AGENT ? ["harbor_intellect"] : [],
    steps: [],
  };
}

/**
 * Parse AgentExecution.routing_decision JSON — tolerant of legacy / partial blobs.
 * @param {string|Record<string, unknown>|null|undefined} raw
 * @returns {Record<string, unknown>}
 */
export function parseHarborRoutingDecision(raw) {
  if (raw == null) return {};
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return /** @type {Record<string, unknown>} */ ({ ...raw });
  }
  if (typeof raw !== "string") return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === "object" && !Array.isArray(o)
      ? /** @type {Record<string, unknown>} */ (o)
      : {};
  } catch {
    return {};
  }
}

/**
 * Shallow-merge routing metadata so complete/fail updates do not erase start-time fields
 * (kind, stack_role, correlation_id, phase from execute).
 *
 * @param {string|Record<string, unknown>|null|undefined} existingRaw
 * @param {Record<string, unknown>} patch
 * @returns {Record<string, unknown>}
 */
export function mergeHarborRoutingDecision(existingRaw, patch) {
  return {
    ...parseHarborRoutingDecision(existingRaw),
    ...patch,
  };
}

/**
 * Entity mapping (existing Base44 entities — align schemas before heavy use):
 *
 * - AgentExecution — orchestration/execution truth; use for every tracked run.
 * - AgentWorkflow — workflow defs + require_human_approval + thresholds.
 * - AIDecisionLog — decisions / governance snapshot (intellect output worthy of record).
 * - OutcomeLearning — OutcomeEvaluation analogue (predicted vs measured KPI).
 * - AdaptiveAgentMemory / AgentSharedMemory — Memory layer (success patterns).
 *
 * Planned / TODO entities (create via migration when ready):
 * - AgentPlan — structured planner output (tasks, deps, risk).
 * - AgentDecision — single routing choice with rationale + scores.
 * - ApprovalRequest — pending human gate with payload snapshot.
 * - MemoryEntry / CaseMemory — durable case file keyed by shipment/route/incident.
 */
