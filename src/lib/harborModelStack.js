/**
 * Harbor Model Stack — product architecture hooks (client-side contracts only).
 *
 * This is not a deployed “stack” by itself; it names layers and ties eval/runtime
 * modules together so NexusVectis can evolve toward a separable Harbor AI product line.
 *
 * Server-side training/inference live under base44/functions/ (harborCore, harborIntellectAPI,
 * harborModelInference, harborFinetune, harborOrchestratorAPI, outcomeTracker, auditLog, …).
 *
 * TODO(model stack versioning): align HARBOR_MODEL_STACK_VERSION with FleetAIModel.snapshot_id
 *   convention when Intellect vs Orchestration adapters are stored as separate records.
 */

import { HARBOR_EVAL_SEED_CASES } from "@/lib/harborEvalSeedCases";

/** Bump when layer contracts or export row shapes change incompatibly. */
export const HARBOR_MODEL_STACK_VERSION = "0.1.0";

/**
 * Logical layers for documentation, planning, and future service boundaries.
 * @readonly
 */
export const HARBOR_STACK_LAYER = {
  DATA: "harbor_data",
  KNOWLEDGE_CONTEXT: "harbor_knowledge_context",
  EVALUATION: "harbor_evaluation",
  INTELLECT_MODEL: "harbor_intellect_model",
  ORCHESTRATION_MODEL: "harbor_orchestration_model",
  RUNTIME_GOVERNANCE: "harbor_runtime_governance",
  DEPLOYMENT: "harbor_deployment",
};

/**
 * Benchmark suites — maps to HARBOR_EVAL_SUITE + regression baseline id list.
 * Regression = re-run same case IDs after model/prompt/RAG changes (CI or manual).
 */
export const HARBOR_BENCHMARK_SUITE = {
  reasoning: "reasoning",
  tool_routing: "tool_routing",
  governance: "governance",
  failure_modes: "failure_modes",
  /** Full seed list as V1 regression baseline (expand with frozen golden sets later). */
  regression: "regression",
};

/**
 * Case IDs for regression runs (all current seeds). Replace with a frozen subset per release when needed.
 * @returns {string[]}
 */
export function getHarborRegressionBaselineCaseIds() {
  return HARBOR_EVAL_SEED_CASES.map((c) => c.id);
}

/**
 * Map eval suite string → owning stack layer (for telemetry dashboards).
 * @param {string} suite
 * @returns {string}
 */
export function benchmarkSuiteToPrimaryLayer(suite) {
  if (suite === HARBOR_BENCHMARK_SUITE.reasoning) return HARBOR_STACK_LAYER.INTELLECT_MODEL;
  if (suite === HARBOR_BENCHMARK_SUITE.regression) return HARBOR_STACK_LAYER.EVALUATION;
  return HARBOR_STACK_LAYER.ORCHESTRATION_MODEL;
}
