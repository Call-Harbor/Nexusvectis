/**
 * Local developer benchmark runner — seed cases + injected invoke, no UI.
 *
 * Wraps runHarborIntellectBenchmarkV1 with a single-model surface and JSONL helpers.
 */

import { HARBOR_EVAL_SEED_CASES } from "./harborEvalSeedCases.js";
import {
  benchmarkSummaryToJsonlArtifacts,
  formatHarborIntellectBenchmarkConsoleLines,
  runHarborIntellectBenchmarkV1,
} from "./harborIntellectBenchmarkV1.js";

/**
 * @typedef {object} HarborBenchmarkLocalInvokeResult
 * @property {string} [text]
 * @property {number} [latency_ms]
 * @property {unknown} [tool_trace]
 * @property {string} [correlation_id]
 */

/**
 * @callback HarborBenchmarkLocalInvoke
 * @param {string} prompt
 * @param {Record<string, unknown>} context
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase} evalCase
 * @returns {Promise<HarborBenchmarkLocalInvokeResult>}
 */

/**
 * @typedef {object} RunHarborIntellectBenchmarkLocalOptions
 * @property {HarborBenchmarkLocalInvoke} invoke - Your model / stub / API adapter
 * @property {string} [modelId] - Stored on results and in harbor.eval_run.v1 rows
 * @property {import('./harborEvalCaseSchema.js').HarborEvalCase[]} [cases] - Default: HARBOR_EVAL_SEED_CASES
 */

/**
 * Run benchmark v1 against seed cases using one invoke function.
 *
 * @param {RunHarborIntellectBenchmarkLocalOptions} opts
 * @returns {Promise<import('./harborIntellectBenchmarkV1.js').HarborIntellectBenchmarkSummaryV1>}
 */
export async function runHarborIntellectBenchmarkLocal(opts) {
  const {
    invoke,
    modelId = "harbor_intellect_local",
    cases = HARBOR_EVAL_SEED_CASES,
  } = opts;

  if (typeof invoke !== "function") {
    throw new Error(
      "[harbor-benchmark-local] opts.invoke must be async (prompt, context, evalCase) => { text?, latency_ms?, tool_trace?, correlation_id? }",
    );
  }

  return runHarborIntellectBenchmarkV1({
    invokeIntellect: invoke,
    intellect_model_id: modelId,
    cases,
  });
}

/**
 * Turn a local run summary into harbor.eval_run.v1 JSONL (one object per line).
 *
 * @param {import('./harborIntellectBenchmarkV1.js').HarborIntellectBenchmarkSummaryV1} summary
 * @param {{ organization_id?: string }} [opts]
 * @returns {string}
 */
export function benchmarkLocalSummaryToEvalJsonl(summary, opts = {}) {
  const { eval_jsonl } = benchmarkSummaryToJsonlArtifacts(summary, {
    organization_id: opts.organization_id,
    benchmark_suite: "harbor_intellect_benchmark_v1",
  });
  return eval_jsonl;
}

export { formatHarborIntellectBenchmarkConsoleLines };
