/**
 * Harbor evaluation starter kit — schema + seed cases + bundle validation.
 * Import from tooling, tests, or a future CLI; keeps runtime footprint optional.
 *
 * Trace/export row shapes: `@/lib/harborTraceExport`.
 * Stack layer ids + regression baseline ids: `@/lib/harborModelStack`.
 */

export {
  HARBOR_EVAL_CASE_SCHEMA_VERSION,
  HARBOR_EVAL_SUITE,
  HARBOR_EVAL_REGRESSION_REF,
  FAILURE_MODE_TAG,
  createHarborEvalCaseDraft,
  validateHarborEvalCase,
  validateHarborEvalCaseList,
  formatHarborEvalCaseOneLiner,
  previewHarborEvalCase,
} from "@/lib/harborEvalCaseSchema";

export { HARBOR_EVAL_SEED_CASES } from "@/lib/harborEvalSeedCases";

export {
  HARBOR_MODEL_STACK_VERSION,
  HARBOR_STACK_LAYER,
  HARBOR_BENCHMARK_SUITE,
  getHarborRegressionBaselineCaseIds,
} from "@/lib/harborModelStack";

export { buildTrainingExportRowV1, buildEvalRunRecordV1 } from "@/lib/harborTraceExport";

import { HARBOR_EVAL_SEED_CASES } from "@/lib/harborEvalSeedCases";
import {
  HARBOR_EVAL_CASE_SCHEMA_VERSION,
  validateHarborEvalCaseList,
} from "@/lib/harborEvalCaseSchema";

/**
 * @param {{ strictSuiteFields?: boolean }} [opts]
 */
export function getHarborEvalStarterKitSummary(opts = {}) {
  const validation = validateHarborEvalCaseList(HARBOR_EVAL_SEED_CASES, opts);
  return {
    schema_version: HARBOR_EVAL_CASE_SCHEMA_VERSION,
    seed_case_count: HARBOR_EVAL_SEED_CASES.length,
    validation_ok: validation.ok,
    validation_failures: validation.failures,
  };
}
