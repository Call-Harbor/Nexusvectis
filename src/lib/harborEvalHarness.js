/**
 * Harbor eval harness — score model text against seed cases and aggregate runs.
 */

import { HARBOR_EVAL_SEED_CASES } from "@/lib/harborEvalSeedCases";
import {
  HARBOR_EVAL_SUITE,
  validateHarborEvalCase,
} from "@/lib/harborEvalCaseSchema";
import { buildEvalRunRecordV1 } from "@/lib/harborTraceExport";

/** When expected.tools is set, tool selection cannot be fully validated from free text alone. */
export const TOOL_ROUTING_NOT_VALIDATED_REASON =
  "tool_routing: expected.tools present — tool selection not validated from model text alone";

/**
 * @param {string} s
 * @returns {string}
 */
function norm(s) {
  return String(s || "").toLowerCase();
}

/**
 * Score a single model output against a Harbor eval case (heuristic text checks).
 * @param {import('@/lib/harborEvalCaseSchema').HarborEvalCase} c
 * @param {string} outputText
 * @returns {{ passed: boolean, score_0_1: number, reasons: string[] }}
 */
export function scoreHarborEvalCaseOutput(c, outputText) {
  const text = norm(outputText);
  const exp = c.expected && typeof c.expected === "object" ? c.expected : {};
  /** @type {string[]} */
  const reasons = [];
  let passed = true;

  if (Array.isArray(exp.tools) && exp.tools.length > 0) {
    reasons.push(TOOL_ROUTING_NOT_VALIDATED_REASON);
  }

  if (Array.isArray(exp.answer_contains)) {
    for (const sub of exp.answer_contains) {
      if (!text.includes(norm(sub))) {
        passed = false;
        reasons.push(`missing answer_contains: ${sub}`);
      }
    }
  }

  if (Array.isArray(exp.answer_must_not_contain)) {
    for (const sub of exp.answer_must_not_contain) {
      if (text.includes(norm(sub))) {
        passed = false;
        reasons.push(`forbidden substring (answer_must_not_contain): ${sub}`);
      }
    }
  }

  if (c.suite === HARBOR_EVAL_SUITE.GOVERNANCE) {
    const verdict = exp.governance_decision;
    if (verdict === "reject" && !text.includes("reject")) {
      passed = false;
      reasons.push("expected governance_decision reject not reflected in output");
    }
    if (Array.isArray(exp.explanation_contains)) {
      for (const sub of exp.explanation_contains) {
        if (!text.includes(norm(sub))) {
          passed = false;
          reasons.push(`missing explanation_contains: ${sub}`);
        }
      }
    }
  }

  if (c.suite === HARBOR_EVAL_SUITE.TOOL_ROUTING) {
    if (Array.isArray(exp.tools_must_not)) {
      for (const t of exp.tools_must_not) {
        if (text.includes(norm(t))) {
          passed = false;
          reasons.push(`forbidden tools_must_not hint in text: ${t}`);
        }
      }
    }
    if (Array.isArray(exp.tools) && exp.tools.length > 0) {
      const hit = exp.tools.some((t) => {
        const n = norm(t);
        return text.includes(n) || text.includes(norm(t.split(".")[0] || ""));
      });
      if (!hit) {
        passed = false;
        reasons.push("output does not reference an expected tool id or family");
      }
    }
  }

  if (c.suite === HARBOR_EVAL_SUITE.FAILURE_MODES) {
    if (Array.isArray(exp.tools_must_not)) {
      for (const t of exp.tools_must_not) {
        if (text.includes(norm(t))) {
          passed = false;
          reasons.push(`forbidden tools_must_not: ${t}`);
        }
      }
    }
  }

  const score_0_1 = passed ? 1 : 0;
  return { passed, score_0_1, reasons };
}

/**
 * @typedef {object} HarborEvalHarnessInvokeResult
 * @property {string} [text]
 * @property {number} [latencyMs]
 * @property {unknown} [error]
 */

/**
 * @typedef {object} HarborEvalHarnessRunOpts
 * @property {import('@/lib/harborEvalCaseSchema').HarborEvalCase[]} [cases] - override seed list
 * @property {boolean} [validateCases] - default true: skip invalid cases with error row
 */

/**
 * Run all seed cases (or opts.cases) against a model via invokeFn(prompt, context).
 * @param {string} modelId
 * @param {(prompt: string, context: Record<string, unknown>) => Promise<HarborEvalHarnessInvokeResult>} invokeFn
 * @param {HarborEvalHarnessRunOpts} [opts]
 */
export async function runHarborEvalSeedCasesAgainstModel(modelId, invokeFn, opts = {}) {
  const cases = Array.isArray(opts.cases) ? opts.cases : HARBOR_EVAL_SEED_CASES;
  const validateCases = opts.validateCases !== false;

  /** @type {Record<string, { passed: number, failed: number, total: number }>} */
  const by_suite = {};
  for (const s of Object.values(HARBOR_EVAL_SUITE)) {
    by_suite[s] = { passed: 0, failed: 0, total: 0 };
  }

  /** @type {Array<{
   *   case_id: string,
   *   suite: string,
   *   passed: boolean,
   *   score_0_1: number,
   *   reasons: string[],
   *   output_text: string,
   *   error: string | null,
   *   latency_ms: number | null
   * }>} */
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const c of cases) {
    if (validateCases) {
      const v = validateHarborEvalCase(c);
      if (!v.ok) {
        const suite = typeof c.suite === "string" ? c.suite : "unknown";
        if (by_suite[suite]) {
          by_suite[suite].total += 1;
          by_suite[suite].failed += 1;
        }
        failedCount += 1;
        results.push({
          case_id: typeof c.id === "string" ? c.id : "(invalid)",
          suite,
          passed: false,
          score_0_1: 0,
          reasons: [`invalid case: ${v.errors.join("; ")}`],
          output_text: "",
          error: v.errors.join("; "),
          latency_ms: null,
        });
        continue;
      }
    }

    let outputText = "";
    /** @type {number | null} */
    let latencyMs = null;
    /** @type {string | null} */
    let error = null;

    try {
      const r = await invokeFn(c.user_prompt, c.context && typeof c.context === "object" ? c.context : {});
      outputText = r?.text != null ? String(r.text) : "";
      if (typeof r?.latencyMs === "number") latencyMs = r.latencyMs;
      if (r?.error != null) error = String(r.error);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const score = scoreHarborEvalCaseOutput(c, outputText);
    const ok = score.passed && !error;
    if (ok) passedCount += 1;
    else failedCount += 1;

    const suite = c.suite;
    if (by_suite[suite]) {
      by_suite[suite].total += 1;
      if (ok) by_suite[suite].passed += 1;
      else by_suite[suite].failed += 1;
    }

    results.push({
      case_id: c.id,
      suite,
      passed: ok,
      score_0_1: score.score_0_1,
      reasons: error ? [...score.reasons, `invoke error: ${error}`] : score.reasons,
      output_text: outputText,
      error,
      latency_ms: latencyMs,
    });
  }

  return {
    model_id: modelId,
    total: cases.length,
    passed: passedCount,
    failed: failedCount,
    by_suite,
    results,
  };
}

/**
 * Map harness summary to eval run export rows (JSONL / pipeline).
 * @param {Awaited<ReturnType<typeof runHarborEvalSeedCasesAgainstModel>>} summary
 * @param {string} benchmarkSuite
 * @returns {ReturnType<typeof buildEvalRunRecordV1>[]}
 */
export function harnessSummaryToEvalRunRecords(summary, benchmarkSuite) {
  return summary.results.map((r) =>
    buildEvalRunRecordV1({
      evalCaseId: r.case_id,
      benchmarkSuite,
      modelId: summary.model_id,
      passed: r.passed,
      score_0_1: r.score_0_1,
      latencyMs: r.latency_ms,
      outputText: r.output_text,
    })
  );
}
