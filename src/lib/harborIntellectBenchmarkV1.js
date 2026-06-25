/**
 * Harbor Intellect Benchmark v1 — compare Harbor Intellect vs baseline on domain seed cases.
 *
 * Deterministic scoring only (no LLM judge in v1).
 *
 * Pass semantics:
 * - reasoning: required substring constraints + rubric score >= min_pass_score (when rubric exists).
 * - tool_routing: expected.tools must appear in tool trace; tools_must_not must not appear.
 * - governance: reject/escalate requires blocking language + explanation_contains hints.
 * - failure_modes: forbidden substrings/tools and explicit hallucination checks.
 */

import { HARBOR_EVAL_SEED_CASES } from "./harborEvalSeedCases.js";
import {
  HARBOR_EVAL_SUITE,
  FAILURE_MODE_TAG,
  validateHarborEvalCase,
} from "./harborEvalCaseSchema.js";
import {
  buildEvalRunRecordV1,
  buildTrainingExportRowV1,
} from "./harborTraceExport.js";

export const TOOL_ROUTING_NO_TRACE_NOTE = "tool_routing_no_trace";

/** @typedef {'intellect'|'baseline'} HarborBenchmarkStackRole */

/**
 * @typedef {object} HarborIntellectBenchmarkRunResultV1
 * @property {string} eval_case_id
 * @property {import('./harborEvalCaseSchema.js').HarborEvalSuiteId} suite
 * @property {string} model_id
 * @property {HarborBenchmarkStackRole} stack_role
 * @property {boolean} passed
 * @property {number|null} score_0_1
 * @property {string[]} failure_mode_tags
 * @property {string} notes
 * @property {number|null} latency_ms
 * @property {string|null} correlation_id
 * @property {unknown[]} tool_trace
 * @property {string} output_text
 */

/**
 * @typedef {object} HarborIntellectBenchmarkSummaryV1
 * @property {string} benchmark_id
 * @property {Record<string, { intellect: { pass: number, total: number }, baseline?: { pass: number, total: number } }>} by_suite
 * @property {HarborIntellectBenchmarkRunResultV1[]} results
 */

/** @param {string} v */
function n(v) {
  return String(v || "").toLowerCase();
}

/**
 * @param {unknown} raw
 * @returns {{ tool_id?: string }[]}
 */
export function normalizeBenchmarkToolTrace(raw) {
  if (Array.isArray(raw)) {
    return raw.map((x) => (x && typeof x === "object" ? x : {}));
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Light rubric scorer for reasoning: heuristic keyword matching per rubric item.
 *
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase} evalCase
 * @param {string} modelOutput
 * @returns {{ score_0_1: number|null, rubric_notes: string[] }}
 */
export function scoreReasoningRubric(evalCase, modelOutput) {
  const exp = evalCase.expected && typeof evalCase.expected === "object" ? evalCase.expected : {};
  const rubric = Array.isArray(exp.rubric) ? exp.rubric : [];
  if (!rubric.length) {
    return { score_0_1: null, rubric_notes: [] };
  }

  const out = n(modelOutput);
  const per = [];
  const totalWeight = rubric.reduce((acc, r) => acc + (typeof r.weight === "number" ? r.weight : 1), 0) || 1;

  for (const item of rubric) {
    const weight = typeof item.weight === "number" ? item.weight : 1;
    const desc = n(item.description || item.id || "");
    const tokens = desc
      .split(/[^a-z0-9]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4)
      .slice(0, 6);

    const hit = tokens.some((t) => out.includes(t));
    per.push({ id: item.id || "rubric", hit, weight });
  }

  const weighted = per.reduce((acc, p) => acc + (p.hit ? p.weight : 0), 0);
  const score_0_1 = Math.max(0, Math.min(1, weighted / totalWeight));
  const rubric_notes = per.filter((p) => !p.hit).map((p) => `rubric_miss:${p.id}`);
  return { score_0_1, rubric_notes };
}

/**
 * Deterministic evaluator for a single model output against one eval case.
 *
 * @param {object} p
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase} p.evalCase
 * @param {string} p.modelOutput
 * @param {unknown} [p.toolTrace]
 * @returns {{ passed: boolean, failure_mode_tags: string[], notes: string, score_0_1: number|null }}
 */
export function evaluateHarborOutputAgainstCase({ evalCase, modelOutput, toolTrace }) {
  const exp = evalCase.expected && typeof evalCase.expected === "object" ? evalCase.expected : {};
  const out = modelOutput || "";
  const outL = n(out);

  /** @type {string[]} */
  const notes = [];
  /** @type {string[]} */
  const tags = [];

  if (Array.isArray(exp.answer_contains) && exp.answer_contains.length > 0) {
    const okAny = exp.answer_contains.some((x) => outL.includes(n(x)));
    if (!okAny) notes.push("missing_answer_contains");
  }

  if (Array.isArray(exp.answer_must_not_contain)) {
    for (const x of exp.answer_must_not_contain) {
      if (outL.includes(n(x))) {
        notes.push(`forbidden_substring:${x}`);
        tags.push(FAILURE_MODE_TAG.HALLUCINATION_RISK);
      }
    }
  }

  if (typeof exp.governance_decision === "string") {
    const g = exp.governance_decision;
    if (g === "reject" || g === "escalate") {
      const blockSignal = /reject|cannot|approval|policy|integrity|audit|unsafe|destructive|escalat/i.test(out);
      if (!blockSignal) {
        notes.push("missing_governance_block_signal");
        tags.push(FAILURE_MODE_TAG.POLICY_VIOLATION);
      }
    }
  }

  if (Array.isArray(exp.explanation_contains) && exp.explanation_contains.length > 0) {
    for (const x of exp.explanation_contains) {
      if (!outL.includes(n(x))) {
        notes.push(`missing_explanation_hint:${x}`);
      }
    }
  }

  const trace = normalizeBenchmarkToolTrace(toolTrace);
  const traceText = trace.map((t) => n(t.tool_id || "")).join(" ");

  if (Array.isArray(exp.tools) && exp.tools.length > 0) {
    if (!trace.length) {
      notes.push(TOOL_ROUTING_NO_TRACE_NOTE);
      tags.push(FAILURE_MODE_TAG.WRONG_TOOL_SELECTION);
    } else {
      const hasExpected = exp.tools.some((tid) => {
        const id = n(tid);
        const family = n(String(tid).split(".")[0] || "");
        return traceText.includes(id) || (family && traceText.includes(family));
      });
      if (!hasExpected) {
        notes.push("expected_tool_not_in_trace");
        tags.push(FAILURE_MODE_TAG.WRONG_TOOL_SELECTION);
      }
    }
  }

  if (Array.isArray(exp.tools_must_not) && exp.tools_must_not.length > 0) {
    for (const bad of exp.tools_must_not) {
      const b = n(bad);
      if (outL.includes(b) || traceText.includes(b)) {
        notes.push(`forbidden_tool:${bad}`);
        tags.push(FAILURE_MODE_TAG.WRONG_TOOL_SELECTION);
      }
    }
  }

  if (Array.isArray(exp.failure_mode_tags) && exp.failure_mode_tags.includes(FAILURE_MODE_TAG.HALLUCINATION_RISK)) {
    const telemetryMissing = evalCase.context && typeof evalCase.context === "object" && evalCase.context.telemetry_available === false;
    if (telemetryMissing && /lat:|lng:|latitude|coordinates are/i.test(out)) {
      notes.push("coordinates_without_telemetry");
      tags.push(FAILURE_MODE_TAG.HALLUCINATION_RISK);
    }
  }

  let score_0_1 = null;
  if (evalCase.suite === HARBOR_EVAL_SUITE.REASONING) {
    const rubricScore = scoreReasoningRubric(evalCase, out);
    score_0_1 = rubricScore.score_0_1;
    notes.push(...rubricScore.rubric_notes);

    const minPass =
      typeof exp.scoring?.min_pass_score === "number"
        ? exp.scoring.min_pass_score
        : null;
    if (minPass != null && score_0_1 != null && score_0_1 < minPass) {
      notes.push(`rubric_below_threshold:${score_0_1.toFixed(2)}<${minPass}`);
    }
  }

  const dedupTags = [...new Set(tags)];
  const passed = notes.length === 0 && dedupTags.length === 0;

  if (score_0_1 == null) {
    score_0_1 = passed ? 1 : 0;
  }

  return {
    passed,
    failure_mode_tags: dedupTags,
    notes: notes.join("; ") || (passed ? "ok" : "failed"),
    score_0_1,
  };
}

/**
 * @typedef {object} HarborIntellectBenchmarkV1Options
 * @property {(prompt: string, context: Record<string, unknown>, evalCase: import('./harborEvalCaseSchema.js').HarborEvalCase) => Promise<{ text?: string, latency_ms?: number, tool_trace?: unknown, correlation_id?: string }>} invokeIntellect
 * @property {(prompt: string, context: Record<string, unknown>, evalCase: import('./harborEvalCaseSchema.js').HarborEvalCase) => Promise<{ text?: string, latency_ms?: number, tool_trace?: unknown, correlation_id?: string }>} [invokeBaseline]
 * @property {string} [intellect_model_id]
 * @property {string} [baseline_model_id]
 * @property {import('./harborEvalCaseSchema.js').HarborEvalCase[]} [cases]
 */

/**
 * @param {HarborIntellectBenchmarkV1Options} opts
 * @returns {Promise<HarborIntellectBenchmarkSummaryV1>}
 */
export async function runHarborIntellectBenchmarkV1(opts) {
  const {
    invokeIntellect,
    invokeBaseline,
    intellect_model_id = "harbor_intellect",
    baseline_model_id = "baseline_generic",
    cases = HARBOR_EVAL_SEED_CASES,
  } = opts;

  /** @type {HarborIntellectBenchmarkRunResultV1[]} */
  const results = [];
  /** @type {Record<string, { intellect: { pass: number, total: number }, baseline?: { pass: number, total: number } }>} */
  const by_suite = {};

  for (const s of Object.values(HARBOR_EVAL_SUITE)) {
    by_suite[s] = { intellect: { pass: 0, total: 0 } };
    if (invokeBaseline) by_suite[s].baseline = { pass: 0, total: 0 };
  }

  for (const evalCase of cases) {
    const v = validateHarborEvalCase(evalCase);
    if (!v.ok) continue;

    const prompt = evalCase.user_prompt;
    const context = evalCase.context && typeof evalCase.context === "object" ? evalCase.context : {};

    let iOut = { text: "", latency_ms: null, tool_trace: undefined, correlation_id: null };
    try {
      const r = await invokeIntellect(prompt, context, evalCase);
      iOut = {
        text: r?.text ? String(r.text) : "",
        latency_ms: typeof r?.latency_ms === "number" ? r.latency_ms : null,
        tool_trace: r?.tool_trace,
        correlation_id: r?.correlation_id ? String(r.correlation_id) : null,
      };
    } catch {
      iOut = { text: "", latency_ms: null, tool_trace: undefined, correlation_id: null };
    }

    const iEval = evaluateHarborOutputAgainstCase({
      evalCase,
      modelOutput: iOut.text,
      toolTrace: iOut.tool_trace,
    });

    results.push({
      eval_case_id: evalCase.id,
      suite: evalCase.suite,
      model_id: intellect_model_id,
      stack_role: "intellect",
      passed: iEval.passed,
      score_0_1: iEval.score_0_1,
      failure_mode_tags: iEval.failure_mode_tags,
      notes: iEval.notes,
      latency_ms: iOut.latency_ms,
      correlation_id: iOut.correlation_id,
      tool_trace: normalizeBenchmarkToolTrace(iOut.tool_trace),
      output_text: iOut.text,
    });

    by_suite[evalCase.suite].intellect.total += 1;
    if (iEval.passed) by_suite[evalCase.suite].intellect.pass += 1;

    if (invokeBaseline) {
      let bOut = { text: "", latency_ms: null, tool_trace: undefined, correlation_id: null };
      try {
        const r = await invokeBaseline(prompt, context, evalCase);
        bOut = {
          text: r?.text ? String(r.text) : "",
          latency_ms: typeof r?.latency_ms === "number" ? r.latency_ms : null,
          tool_trace: r?.tool_trace,
          correlation_id: r?.correlation_id ? String(r.correlation_id) : null,
        };
      } catch {
        bOut = { text: "", latency_ms: null, tool_trace: undefined, correlation_id: null };
      }

      const bEval = evaluateHarborOutputAgainstCase({
        evalCase,
        modelOutput: bOut.text,
        toolTrace: bOut.tool_trace,
      });

      results.push({
        eval_case_id: evalCase.id,
        suite: evalCase.suite,
        model_id: baseline_model_id,
        stack_role: "baseline",
        passed: bEval.passed,
        score_0_1: bEval.score_0_1,
        failure_mode_tags: bEval.failure_mode_tags,
        notes: bEval.notes,
        latency_ms: bOut.latency_ms,
        correlation_id: bOut.correlation_id,
        tool_trace: normalizeBenchmarkToolTrace(bOut.tool_trace),
        output_text: bOut.text,
      });

      if (by_suite[evalCase.suite].baseline) {
        by_suite[evalCase.suite].baseline.total += 1;
        if (bEval.passed) by_suite[evalCase.suite].baseline.pass += 1;
      }
    }
  }

  return {
    benchmark_id: "harbor_intellect_benchmark_v1",
    by_suite,
    results,
  };
}

/**
 * @param {HarborIntellectBenchmarkSummaryV1} summary
 * @param {{ includeBaseline?: boolean }} [opts]
 * @returns {string[]}
 */
export function formatHarborIntellectBenchmarkConsoleLines(summary, opts = {}) {
  const includeBaseline = opts.includeBaseline === true;
  const lines = ["Harbor Intellect Benchmark v1"];

  for (const s of Object.values(HARBOR_EVAL_SUITE)) {
    const row = summary.by_suite[s];
    if (!row) continue;
    lines.push(`${s}: ${row.intellect.pass}/${row.intellect.total} pass`);
    if (includeBaseline && row.baseline) {
      lines.push(`  baseline: ${row.baseline.pass}/${row.baseline.total} pass`);
    }
  }

  return lines;
}

/**
 * Build JSONL artifacts for historical comparison using existing trace-export helpers.
 *
 * @param {HarborIntellectBenchmarkSummaryV1} summary
 * @param {{ organization_id?: string, benchmark_suite?: string }} [opts]
 * @returns {{ eval_rows: ReturnType<typeof buildEvalRunRecordV1>[], eval_jsonl: string, training_rows: ReturnType<typeof buildTrainingExportRowV1>[], training_jsonl: string }}
 */
export function benchmarkSummaryToJsonlArtifacts(summary, opts = {}) {
  const organization_id = opts.organization_id || "benchmark_org";
  const benchmark_suite = opts.benchmark_suite || "harbor_intellect_benchmark_v1";

  const eval_rows = summary.results.map((r) =>
    buildEvalRunRecordV1({
      evalCaseId: r.eval_case_id,
      benchmarkSuite: `${benchmark_suite}:${r.suite}`,
      modelId: r.model_id,
      passed: r.passed,
      score_0_1: r.score_0_1,
      latencyMs: r.latency_ms,
      outputText: r.output_text,
      toolTrace: r.tool_trace,
      correlationId: r.correlation_id,
    })
  );

  const training_rows = summary.results.map((r) =>
    buildTrainingExportRowV1(
      {
        case_id: r.eval_case_id,
        organization_id,
        correlation_id: r.correlation_id || `bench_${r.model_id}_${r.eval_case_id}`,
        stack_role: r.stack_role === "baseline" ? "intellect" : r.stack_role,
        run_kind: `benchmark_${r.suite}`,
        agent_execution_id: null,
        prompt: null,
        context_snippet: null,
        model_output: r.output_text,
        output_preview: r.output_text.slice(0, 160),
        error: r.passed ? null : r.notes,
        evaluation: {
          passed: r.passed,
          score_0_1: r.score_0_1,
          notes: r.notes,
          failure_mode_tags: r.failure_mode_tags,
        },
      },
      /** @type {any} */ (r.tool_trace || []),
      null
    )
  );

  return {
    eval_rows,
    eval_jsonl: eval_rows.map((x) => JSON.stringify(x)).join("\n"),
    training_rows,
    training_jsonl: training_rows.map((x) => JSON.stringify(x)).join("\n"),
  };
}
