/**
 * Canonical tool / integration step trace for Harbor Intellect + Orchestration observability.
 * Serialize as JSON inside AgentExecution.routing_decision.tool_traces or export via harborTraceExport.
 */

/** @typedef {'pending'|'running'|'success'|'failure'|'skipped'} HarborToolTraceStatus */

/**
 * @typedef {object} HarborToolTrace
 * @property {string} trace_id
 * @property {string|null} correlation_id
 * @property {string} phase - plan | execute | evaluate | integration
 * @property {string} action - logical name (entity op, function id, or orchestration step)
 * @property {HarborToolTraceStatus} status
 * @property {string|null} [tool_name] - integration label
 * @property {number|null} [latency_ms]
 * @property {string} started_at - ISO
 * @property {string|null} [finished_at]
 * @property {Record<string, unknown>|null} [inputs_redacted]
 * @property {Record<string, unknown>|null} [outputs_redacted]
 * @property {string[]} [risk_tags]
 * @property {string|null} [error]
 */

/**
 * @param {Partial<HarborToolTrace> & { action: string }} partial
 * @returns {HarborToolTrace}
 */
export function createHarborToolTraceDraft(partial) {
  const now = new Date().toISOString();
  const id =
    partial.trace_id ||
    `tt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    trace_id: id,
    correlation_id: partial.correlation_id ?? null,
    phase: partial.phase || "execute",
    action: partial.action,
    status: partial.status || "pending",
    tool_name: partial.tool_name ?? null,
    latency_ms: partial.latency_ms ?? null,
    started_at: partial.started_at || now,
    finished_at: partial.finished_at ?? null,
    inputs_redacted:
      partial.inputs_redacted && typeof partial.inputs_redacted === "object"
        ? partial.inputs_redacted
        : null,
    outputs_redacted:
      partial.outputs_redacted && typeof partial.outputs_redacted === "object"
        ? partial.outputs_redacted
        : null,
    risk_tags: Array.isArray(partial.risk_tags) ? partial.risk_tags : [],
    error: partial.error ?? null,
  };
}

/**
 * @param {unknown} raw
 * @returns {HarborToolTrace|null}
 */
export function normalizeHarborToolTrace(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const action = typeof o.action === "string" ? o.action : null;
  if (!action) return null;
  const status =
    o.status === "pending" ||
    o.status === "running" ||
    o.status === "success" ||
    o.status === "failure" ||
    o.status === "skipped"
      ? o.status
      : "success";
  const phase = typeof o.phase === "string" ? o.phase : "execute";
  const traceId =
    typeof o.trace_id === "string" && o.trace_id
      ? o.trace_id
      : `tt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    trace_id: traceId,
    correlation_id:
      typeof o.correlation_id === "string" ? o.correlation_id : null,
    phase,
    action,
    status,
    tool_name: typeof o.tool_name === "string" ? o.tool_name : null,
    latency_ms: typeof o.latency_ms === "number" ? o.latency_ms : null,
    started_at:
      typeof o.started_at === "string"
        ? o.started_at
        : new Date().toISOString(),
    finished_at: typeof o.finished_at === "string" ? o.finished_at : null,
    inputs_redacted:
      o.inputs_redacted &&
      typeof o.inputs_redacted === "object" &&
      !Array.isArray(o.inputs_redacted)
        ? /** @type {Record<string, unknown>} */ (o.inputs_redacted)
        : null,
    outputs_redacted:
      o.outputs_redacted &&
      typeof o.outputs_redacted === "object" &&
      !Array.isArray(o.outputs_redacted)
        ? /** @type {Record<string, unknown>} */ (o.outputs_redacted)
        : null,
    risk_tags: Array.isArray(o.risk_tags)
      ? o.risk_tags.filter((t) => typeof t === "string")
      : [],
    error: typeof o.error === "string" ? o.error : null,
  };
}

/**
 * Map orchestration execution log entries to HarborToolTrace (best-effort).
 * @param {unknown} executionLog
 * @param {string|null} [correlationId]
 * @returns {HarborToolTrace[]}
 */
export function harborToolTraceFromOrchestrationExecutionLog(
  executionLog,
  correlationId = null,
) {
  if (!Array.isArray(executionLog)) return [];
  /** @type {HarborToolTrace[]} */
  const out = [];
  for (const entry of executionLog) {
    if (!entry || typeof entry !== "object") continue;
    const e = /** @type {Record<string, unknown>} */ (entry);
    const taskId = typeof e.taskId === "string" ? e.taskId : null;
    const taskType = typeof e.type === "string" ? e.type : null;
    const action =
      (taskType && taskId && `orchestrate_task:${taskType}:${taskId}`) ||
      (taskType && `orchestrate_task:${taskType}`) ||
      (typeof e.step === "string" && e.step) ||
      (typeof e.task === "string" && e.task) ||
      (typeof e.action === "string" && e.action) ||
      "orchestration_step";
    const statusRaw = e.status;
    const status =
      statusRaw === "failed" || statusRaw === "error"
        ? "failure"
        : statusRaw === "skipped"
          ? "skipped"
          : statusRaw === "running"
            ? "running"
            : "success";
    out.push(
      createHarborToolTraceDraft({
        correlation_id:
          (typeof e.correlation_id === "string" && e.correlation_id) ||
          correlationId,
        phase: "execute",
        action,
        status,
        tool_name:
          typeof e.tool === "string"
            ? e.tool
            : typeof e.function === "string"
              ? e.function
              : taskType || "executeOrchestration",
        latency_ms:
          typeof e.duration_ms === "number"
            ? e.duration_ms
            : typeof e.latency_ms === "number"
              ? e.latency_ms
              : null,
        error:
          typeof e.error === "string"
            ? e.error
            : typeof e.message === "string"
              ? e.message
              : null,
        outputs_redacted:
          e.result && typeof e.result === "object"
            ? /** @type {Record<string, unknown>} */ (e.result)
            : null,
      }),
    );
  }
  return out;
}

/**
 * @param {string} taskType
 * @returns {string}
 */
export function orchestrationTaskTypeToAction(taskType) {
  if (typeof taskType !== "string" || !taskType) return "orchestration_task";
  return taskType.replace(/[^a-z0-9_]+/gi, "_").toLowerCase();
}
