/**
 * Trace / training export helpers — JSONL-friendly plain objects.
 *
 * TODO(persisted tool traces): populate tool_trace from orchestrateCommands / HarborOrchestratorAPI
 *   when those paths emit structured step logs keyed by correlation_id.
 * TODO(join outcomes): add outcome_learning_id and measured_kpi from OutcomeLearning after delayed KPI jobs.
 *
 * Use from a secured Cloud Function for production export; client may call for dev preview only.
 */

import { HARBOR_MODEL_STACK_VERSION } from "./harborModelStack.js";

/**
 * @typedef {import('@/lib/harborToolTrace').HarborToolTrace} HarborToolTrace
 */

/**
 * @typedef {object} HarborTrainingExportRowV1
 * @property {'harbor.training_export.v1'} schema
 * @property {string} stack_version
 * @property {string|null} case_id - set when row ties to an eval case (supervised / eval JSONL)
 * @property {string} organization_id
 * @property {string} correlation_id
 * @property {'intellect'|'orchestration'} stack_role
 * @property {string} run_kind
 * @property {string|null} agent_execution_id
 * @property {string|null} prompt - user_input / primary instruction (same field name as common FT pipelines)
 * @property {string|null} user_input - duplicate semantic alias for labeling tools
 * @property {string|null} context_snippet - operational snapshot summary (not full RAG dump)
 * @property {string|null} model_output - full text output for training (distinct from short preview)
 * @property {HarborToolTrace[]} tool_traces
 * @property {Record<string, unknown>|null} outcome_summary - OutcomeLearning-shaped subset when joined
 * @property {string|null} output_preview - short preview for dashboards
 * @property {string|null} error
 * @property {Record<string, unknown>} [evaluation]
 * @property {Record<string, unknown>} [routing_decision_parsed]
 * @property {string} exported_at - ISO
 */

/**
 * Full training / eval export row (V1). Prefer this over the legacy single-arg form.
 *
 * @param {object} row
 * @param {string} row.organization_id
 * @param {string} row.correlation_id
 * @param {'intellect'|'orchestration'} row.stack_role
 * @param {string} row.run_kind
 * @param {string|null} [row.case_id]
 * @param {string|null} [row.agent_execution_id]
 * @param {string|null} [row.prompt]
 * @param {string|null} [row.context_snippet]
 * @param {string|null} [row.model_output]
 * @param {string|null} [row.output_preview]
 * @param {string|null} [row.error]
 * @param {Record<string, unknown>} [row.evaluation]
 * @param {Record<string, unknown>} [row.routing_decision_parsed]
 * @param {HarborToolTrace[]} [traces]
 * @param {Record<string, unknown>|null} [outcome]
 * @returns {HarborTrainingExportRowV1}
 */
export function buildTrainingExportRowV1(row, traces, outcome) {
  const tool_traces = Array.isArray(traces) ? traces : [];
  const outcome_summary =
    outcome && typeof outcome === "object" ? outcome : null;

  return {
    schema: "harbor.training_export.v1",
    stack_version: HARBOR_MODEL_STACK_VERSION,
    case_id: row.case_id ?? null,
    organization_id: row.organization_id,
    correlation_id: row.correlation_id,
    stack_role: row.stack_role,
    run_kind: row.run_kind,
    agent_execution_id: row.agent_execution_id ?? null,
    prompt: row.prompt ?? null,
    user_input: row.prompt ?? null,
    context_snippet: row.context_snippet ?? null,
    model_output: row.model_output ?? null,
    tool_traces,
    outcome_summary,
    output_preview: row.output_preview ?? null,
    error: row.error ?? null,
    evaluation: row.evaluation,
    routing_decision_parsed: row.routing_decision_parsed,
    exported_at: new Date().toISOString(),
  };
}

/**
 * @typedef {object} HarborEvalRunRecordV1
 * @property {'harbor.eval_run.v1'} schema
 * @property {string} stack_version
 * @property {string} eval_case_id
 * @property {string} benchmark_suite
 * @property {string|null} model_id - FleetAIModel.snapshot_id or external model id
 * @property {string|null} model_version
 * @property {boolean|null} passed
 * @property {number|null} score_0_1
 * @property {number|null} latency_ms
 * @property {string|null} output_text
 * @property {HarborToolTrace[]} [tool_trace]
 * @property {string} run_at - ISO
 * @property {string|null} correlation_id
 */

/**
 * One row per benchmark case execution (for eval JSONL, not production ops telemetry).
 * @param {object} p
 * @param {string} p.evalCaseId
 * @param {string} p.benchmarkSuite
 * @param {string|null} [p.modelId]
 * @param {string|null} [p.modelVersion]
 * @param {boolean|null} [p.passed]
 * @param {number|null} [p.score_0_1]
 * @param {number|null} [p.latencyMs]
 * @param {string|null} [p.outputText]
 * @param {HarborToolTrace[]} [p.toolTrace]
 * @param {string|null} [p.correlationId]
 * @returns {HarborEvalRunRecordV1}
 */
export function buildEvalRunRecordV1(p) {
  return {
    schema: "harbor.eval_run.v1",
    stack_version: HARBOR_MODEL_STACK_VERSION,
    eval_case_id: p.evalCaseId,
    benchmark_suite: p.benchmarkSuite,
    model_id: p.modelId ?? null,
    model_version: p.modelVersion ?? null,
    passed: p.passed ?? null,
    score_0_1: p.score_0_1 ?? null,
    latency_ms: p.latencyMs ?? null,
    output_text: p.outputText ?? null,
    tool_trace: p.toolTrace,
    run_at: new Date().toISOString(),
    correlation_id: p.correlationId ?? null,
  };
}
