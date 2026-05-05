/**
 * Trace / training export helpers — JSONL-friendly plain objects.
 *
 * TODO(persisted tool traces): populate tool_trace from orchestrateCommands / HarborOrchestratorAPI
 *   when those paths emit structured step logs keyed by correlation_id.
 * TODO(join outcomes): add outcome_learning_id and measured_kpi from OutcomeLearning after delayed KPI jobs.
 *
 * Use from a secured Cloud Function for production export; client may call for dev preview only.
 */

import { HARBOR_MODEL_STACK_VERSION } from "@/lib/harborModelStack";

/**
 * @typedef {object} HarborTrainingExportRowV1
 * @property {'harbor.training_export.v1'} schema
 * @property {string} stack_version
 * @property {string} organization_id
 * @property {string} correlation_id
 * @property {'intellect'|'orchestration'} stack_role
 * @property {string} run_kind
 * @property {string|null} agent_execution_id
 * @property {string|null} output_preview
 * @property {string|null} error
 * @property {Record<string, unknown>} [evaluation]
 * @property {Record<string, unknown>} [routing_decision_parsed] - if caller parses AgentExecution.routing_decision
 * @property {string} exported_at - ISO
 */

/**
 * @param {object} p
 * @param {string} p.organizationId
 * @param {string} p.correlationId
 * @param {'intellect'|'orchestration'} p.stackRole
 * @param {string} p.runKind
 * @param {string|null} [p.agentExecutionId]
 * @param {string|null} [p.outputPreview]
 * @param {string|null} [p.error]
 * @param {Record<string, unknown>} [p.evaluation]
 * @param {Record<string, unknown>} [p.routingDecisionParsed]
 * @returns {HarborTrainingExportRowV1}
 */
export function buildTrainingExportRowV1(p) {
  return {
    schema: "harbor.training_export.v1",
    stack_version: HARBOR_MODEL_STACK_VERSION,
    organization_id: p.organizationId,
    correlation_id: p.correlationId,
    stack_role: p.stackRole,
    run_kind: p.runKind,
    agent_execution_id: p.agentExecutionId ?? null,
    output_preview: p.outputPreview ?? null,
    error: p.error ?? null,
    evaluation: p.evaluation,
    routing_decision_parsed: p.routingDecisionParsed,
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
 * @property {unknown[]} [tool_trace]
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
 * @param {unknown[]} [p.toolTrace]
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
