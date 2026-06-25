/**
 * HarborToolTrace — canonical cross-stack shape for tool / integration steps.
 *
 * Used by: Intellect flows (LLM, agents SDK), Orchestration (task execution, APIs).
 * TODO(orchestrateMultipleAIs): emit HarborToolTrace[] server-side with correlation_id from body.
 * TODO(harborOrchestratorAPI): append traces per worker invocation + synthesis step.
 * TODO(orchestrateCommands): include parse step as plan_only trace when harborCore returns tasks.
 *
 * Persist via: AgentExecution.routing_decision.tool_traces (merged on completeRun) or export JSONL only.
 */

/** @typedef {'intellect'|'orchestration'} HarborToolTraceStackRole */

/** @typedef {'read'|'write'|'plan_only'} HarborToolAction */

/**
 * @typedef {'success'|'error'|'blocked'|'skipped'} HarborToolTraceStatus
 */

/**
 * @typedef {object} HarborToolTrace
 * @property {string} trace_id - stable id for this step (uuid or `${correlation}:${seq}`)
 * @property {string} correlation_id - same as run / AgentExecution correlation
 * @property {string} [run_id] - alias for correlation_id when logging externally
 * @property {HarborToolTraceStackRole} stack_role
 * @property {string} tool_id - logical name, e.g. agents.addMessage, task.plan_route, functions.orchestrateCommands
 * @property {string} [integration_id] - e.g. base44.integrations.Core, base44.functions.executeOrchestration
 * @property {HarborToolAction} action
 * @property {string} input_summary - redacted / truncated args description
 * @property {string} [result_summary] - truncated outcome
 * @property {HarborToolTraceStatus} status
 * @property {string[]} [risk_tags] - use FAILURE_MODE_TAG / policy tags where relevant
 * @property {string} [occurred_at] - ISO timestamp
 * @property {number} [latency_ms]
 */

export const HARBOR_TOOL_TRACE_SCHEMA_VERSION = "1.0.0";

/**
 * @param {Partial<HarborToolTrace> & { correlation_id: string, stack_role: HarborToolTraceStackRole, tool_id: string, action: HarborToolAction }} partial
 * @returns {HarborToolTrace}
 */
export function createHarborToolTraceDraft(partial) {
  const correlationId = partial.correlation_id || partial.run_id || "";
  const traceId =
    partial.trace_id ||
    `tt_${correlationId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return normalizeHarborToolTrace({
    trace_id: traceId,
    correlation_id: correlationId,
    run_id: partial.run_id || correlationId,
    stack_role: partial.stack_role,
    tool_id: partial.tool_id,
    integration_id: partial.integration_id,
    action: partial.action,
    input_summary: partial.input_summary ?? "",
    result_summary: partial.result_summary,
    status: partial.status ?? "success",
    risk_tags: Array.isArray(partial.risk_tags) ? partial.risk_tags : [],
    occurred_at: partial.occurred_at || new Date().toISOString(),
    latency_ms: partial.latency_ms ?? undefined,
  });
}

/**
 * @param {Partial<HarborToolTrace>} partial
 * @returns {HarborToolTrace}
 */
export function normalizeHarborToolTrace(partial) {
  const correlationId = partial.correlation_id || partial.run_id || "";
  const stackRole =
    partial.stack_role === "orchestration" || partial.stack_role === "intellect"
      ? partial.stack_role
      : "orchestration";
  const action =
    partial.action === "read" ||
    partial.action === "write" ||
    partial.action === "plan_only"
      ? partial.action
      : "read";
  const status =
    partial.status === "success" ||
    partial.status === "error" ||
    partial.status === "blocked" ||
    partial.status === "skipped"
      ? partial.status
      : "success";
  const tags = Array.isArray(partial.risk_tags)
    ? partial.risk_tags.filter((t) => typeof t === "string")
    : [];

  return {
    trace_id: partial.trace_id || `tt_${correlationId}_${Date.now()}`,
    correlation_id: correlationId,
    run_id: partial.run_id || correlationId,
    stack_role: stackRole,
    tool_id: String(partial.tool_id || "unknown.tool"),
    integration_id: partial.integration_id,
    action,
    input_summary: String(partial.input_summary ?? "").slice(0, 4000),
    result_summary:
      partial.result_summary != null ? String(partial.result_summary).slice(0, 8000) : undefined,
    status,
    risk_tags: tags,
    occurred_at: partial.occurred_at || new Date().toISOString(),
    latency_ms: typeof partial.latency_ms === "number" ? partial.latency_ms : undefined,
  };
}

/**
 * Map executeOrchestration executionLog entry → HarborToolTrace (client-side).
 * TODO(executeOrchestration): return HarborToolTrace-compatible rows from the server to skip mapping.
 *
 * @param {object} log
 * @param {string} log.taskId
 * @param {string} log.type
 * @param {string} log.status
 * @param {string} [log.error]
 * @param {unknown} [log.result]
 * @param {string} correlationId
 * @returns {HarborToolTrace}
 */
export function harborToolTraceFromOrchestrationExecutionLog(log, correlationId) {
  const taskType = log?.type || "unknown_task";
  const action = orchestrationTaskTypeToAction(taskType);
  const status =
    log?.status === "completed" ? "success" : log?.status === "failed" ? "error" : "skipped";
  /** Risk tags added by policy layer later; not all writes are unsafe. */
  const riskTags = [];

  return createHarborToolTraceDraft({
    correlation_id: correlationId,
    stack_role: "orchestration",
    tool_id: `orchestration.task.${taskType}`,
    integration_id: "base44.functions.executeOrchestration",
    action,
    input_summary: `task_id=${log?.taskId || "?"} type=${taskType}`,
    result_summary:
      status === "success"
        ? summarizeUnknown(log?.result)
        : String(log?.error || "error"),
    status,
    risk_tags: riskTags,
  });
}

/**
 * @param {string} taskType
 * @returns {HarborToolAction}
 */
export function orchestrationTaskTypeToAction(taskType) {
  const writeTypes = new Set([
    "plan_route",
    "assign_driver",
    "send_notification",
    "create_shipment",
    "optimize_route",
    "schedule_maintenance",
  ]);
  if (writeTypes.has(taskType)) return "write";
  return "read";
}

function summarizeUnknown(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.slice(0, 500);
  try {
    return JSON.stringify(value).slice(0, 500);
  } catch {
    return "(unserializable)";
  }
}
