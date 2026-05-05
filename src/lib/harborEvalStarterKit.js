/**
 * Harbor evaluation starter kit — schema + seed cases + bundle validation.
 * Import from tooling, tests, or a future CLI; keeps runtime footprint optional.
 */

export {
  HARBOR_EVAL_CASE_SCHEMA_VERSION,
  HARBOR_EVAL_SUITE,
  FAILURE_MODE_TAG,
  createHarborEvalCaseDraft,
  validateHarborEvalCase,
  validateHarborEvalCaseList,
  formatHarborEvalCaseOneLiner,
  previewHarborEvalCase,
} from "@/lib/harborEvalCaseSchema";

export { HARBOR_EVAL_SEED_CASES } from "@/lib/harborEvalSeedCases";

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
