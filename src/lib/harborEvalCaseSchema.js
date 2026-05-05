/**
 * Harbor Evaluation Layer — starter kit for benchmarks and export pipelines (not a full platform).
 *
 * TODO(training export): JSONL from labeled runs + AgentExecution.correlation_id + OutcomeLearning.
 * TODO(human review UI): persist human_labels to a secured entity or sidecar file.
 */

/** @typedef {'reasoning'|'tool_routing'|'governance'|'failure_modes'} HarborEvalSuiteId */

/** @typedef {'intellect'|'orchestration'} HarborEvalStackRole */

/** @typedef {'approve'|'reject'|'escalate'|'defer'} HarborEvalGovernanceVerdict */

/**
 * Human review labels (offline benchmark or future HITL pipeline).
 * @typedef {object} HarborEvalHumanLabels
 * @property {number} [score_0_1] - aggregate human score
 * @property {boolean} [passed] - explicit pass/fail
 * @property {string[]} [notes]
 * @property {string} [reviewer_id]
 * @property {string} [labeled_at] - ISO
 */

/**
 * Simple scoring hint for rubric-based or judge-based evaluation.
 * @typedef {object} HarborEvalScoringCriteria
 * @property {number} [min_pass_score] - e.g. 0.7 weighted rubric
 * @property {'0-1'|'binary'} [scale]
 * @property {string} [judge_model] - optional frozen judge id for reproducibility
 */

/**
 * Single rubric row (human or automated judge).
 * @typedef {object} HarborEvalRubricItem
 * @property {string} id
 * @property {string} description
 * @property {number} [weight] - 0–1, sum should be ~1 per case when used
 */

/**
 * @typedef {object} HarborEvalExpected
 *
 * Reasoning
 * @property {string[]} [answer_contains] - substrings model answer should include (any match ok unless strict)
 * @property {string[]} [answer_must_not_contain] - forbidden substrings (hallucination / safety)
 * @property {HarborEvalRubricItem[]} [rubric]
 * @property {HarborEvalScoringCriteria} [scoring]
 *
 * Tool routing
 * @property {string[]} [tools] - preferred tool / integration ids or patterns
 * @property {string[]} [tools_must_not] - tools that indicate wrong routing
 * @property {string[]} [acceptable_fallbacks] - when multiple paths are valid
 * @property {string} [tool_routing_notes]
 *
 * Governance
 * @property {HarborEvalGovernanceVerdict} [governance_decision]
 * @property {HarborEvalGovernanceVerdict[]} [governance_decision_alternatives]
 * @property {string[]} [policy_rules_triggered] - logical tags for eval harness
 * @property {boolean} [required_escalation]
 * @property {string[]} [explanation_contains]
 *
 * Failure modes
 * @property {string[]} [failure_mode_tags] - use FAILURE_MODE_TAG.*
 * @property {string[]} [positive_criteria] - free-text acceptance criteria
 * @property {string[]} [negative_criteria]
 * @property {boolean} [must_not_hallucinate_entity_id]
 */

/**
 * @typedef {object} HarborEvalCase
 * @property {string} id
 * @property {string} [version] - schema version for exporters
 * @property {HarborEvalSuiteId} suite
 * @property {HarborEvalStackRole} stack_role
 * @property {string} organization_id
 * @property {string} user_prompt
 * @property {Record<string, unknown>} [context]
 * @property {HarborEvalExpected} expected
 * @property {Record<string, unknown>} [metadata]
 * @property {string[]} [tags] - domain tags (alert, route, shipment…)
 * @property {'low'|'medium'|'high'} [risk_tier] - anticipated blast radius if model errs
 * @property {HarborEvalHumanLabels} [human_labels] - filled after review
 */

export const HARBOR_EVAL_CASE_SCHEMA_VERSION = "1.1.0";

export const HARBOR_EVAL_SUITE = {
  REASONING: /** @type {const} */ ("reasoning"),
  TOOL_ROUTING: /** @type {const} */ ("tool_routing"),
  GOVERNANCE: /** @type {const} */ ("governance"),
  FAILURE_MODES: /** @type {const} */ ("failure_modes"),
};

/**
 * Regression runs re-execute a frozen case set (see getHarborRegressionBaselineCaseIds in harborModelStack.js)
 * after model, RAG, or policy changes — not a separate "suite" in every case file.
 */
export const HARBOR_EVAL_REGRESSION_REF = "regression_baseline";

/** Normalized failure-mode tags for harnesses and filters. */
export const FAILURE_MODE_TAG = {
  WRONG_TOOL_SELECTION: "wrong_tool_selection",
  INCOMPLETE_CONTEXT: "incomplete_context",
  HALLUCINATION_RISK: "hallucination_risk",
  UNSAFE_WRITE: "unsafe_write",
  POLICY_VIOLATION: "policy_violation",
  OVERCONFIDENT_ANSWER: "overconfident_answer",
};

const SUITE_VALUES = new Set(Object.values(HARBOR_EVAL_SUITE));
const STACK_VALUES = new Set(["intellect", "orchestration"]);
const GOVERNANCE_VERDICTS = new Set(["approve", "reject", "escalate", "defer"]);
const FAILURE_TAG_VALUES = new Set(Object.values(FAILURE_MODE_TAG));
const RISK_TIERS = new Set(["low", "medium", "high"]);

/**
 * @param {Partial<HarborEvalCase> & { id: string }} partial
 * @returns {HarborEvalCase}
 */
export function createHarborEvalCaseDraft(partial) {
  const tags = Array.isArray(partial.tags)
    ? partial.tags.filter((t) => typeof t === "string")
    : [];
  return {
    version: partial.version || HARBOR_EVAL_CASE_SCHEMA_VERSION,
    id: partial.id,
    suite: partial.suite || HARBOR_EVAL_SUITE.REASONING,
    stack_role: partial.stack_role || "intellect",
    organization_id: partial.organization_id || "synthetic",
    user_prompt: partial.user_prompt || "",
    context: partial.context && typeof partial.context === "object" ? partial.context : {},
    expected: partial.expected && typeof partial.expected === "object" ? partial.expected : {},
    metadata: partial.metadata && typeof partial.metadata === "object" ? partial.metadata : {},
    tags,
    ...(partial.risk_tier ? { risk_tier: partial.risk_tier } : {}),
    human_labels:
      partial.human_labels && typeof partial.human_labels === "object"
        ? partial.human_labels
        : undefined,
  };
}

/**
 * Structural validation for fixtures and import pipelines.
 * @param {unknown} obj
 * @param {{ strictSuiteFields?: boolean }} [opts]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateHarborEvalCase(obj, opts = {}) {
  const strict = opts.strictSuiteFields === true;
  const errors = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["case must be an object"] };
  }
  const c = /** @type {Record<string, unknown>} */ (obj);
  if (typeof c.id !== "string" || !c.id.trim()) errors.push("id must be a non-empty string");
  if (typeof c.suite !== "string" || !SUITE_VALUES.has(c.suite)) {
    errors.push(`suite must be one of: ${[...SUITE_VALUES].join(", ")}`);
  }
  if (typeof c.stack_role !== "string" || !STACK_VALUES.has(c.stack_role)) {
    errors.push("stack_role must be intellect or orchestration");
  }
  if (typeof c.organization_id !== "string" || !c.organization_id.trim()) {
    errors.push("organization_id must be a non-empty string");
  }
  if (typeof c.user_prompt !== "string") errors.push("user_prompt must be a string");
  if (c.context != null && (typeof c.context !== "object" || Array.isArray(c.context))) {
    errors.push("context must be a plain object when present");
  }
  if (c.expected != null && (typeof c.expected !== "object" || Array.isArray(c.expected))) {
    errors.push("expected must be a plain object when present");
  }
  if (c.tags != null) {
    if (!Array.isArray(c.tags) || !c.tags.every((t) => typeof t === "string")) {
      errors.push("tags must be an array of strings when present");
    }
  }
  if (c.risk_tier != null && !RISK_TIERS.has(c.risk_tier)) {
    errors.push("risk_tier must be low, medium, or high when present");
  }
  if (c.human_labels != null && (typeof c.human_labels !== "object" || Array.isArray(c.human_labels))) {
    errors.push("human_labels must be a plain object when present");
  }

  const exp = c.expected && typeof c.expected === "object" ? /** @type {Record<string, unknown>} */ (c.expected) : null;
  if (strict && exp && c.suite === HARBOR_EVAL_SUITE.GOVERNANCE) {
    const g = exp.governance_decision;
    if (typeof g !== "string" || !GOVERNANCE_VERDICTS.has(g)) {
      errors.push("expected.governance_decision must be approve|reject|escalate|defer (strict governance suite)");
    }
  }
  if (strict && exp && c.suite === HARBOR_EVAL_SUITE.TOOL_ROUTING) {
    if (!Array.isArray(exp.tools) || !exp.tools.length) {
      errors.push("expected.tools must be a non-empty array (strict tool_routing suite)");
    }
  }
  if (strict && exp && c.suite === HARBOR_EVAL_SUITE.FAILURE_MODES) {
    const fm = exp.failure_mode_tags;
    if (!Array.isArray(fm) || !fm.length) {
      errors.push("expected.failure_mode_tags must be a non-empty array (strict failure_modes suite)");
    } else {
      for (const tag of fm) {
        if (typeof tag !== "string" || !FAILURE_TAG_VALUES.has(tag)) {
          errors.push(
            `unknown failure_mode_tag "${tag}"; use FAILURE_MODE_TAG constants`
          );
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Compact one-line summary for CLI logging or UI snippets.
 * @param {HarborEvalCase} c
 * @returns {string}
 */
export function formatHarborEvalCaseOneLiner(c) {
  const prompt = (c.user_prompt || "").replace(/\s+/g, " ").trim().slice(0, 72);
  const tags = (c.tags || []).join(",");
  return `[${c.suite}/${c.stack_role}] ${c.id}${tags ? ` #${tags}` : ""} — ${prompt}${(c.user_prompt || "").length > 72 ? "…" : ""}`;
}

/**
 * Preview object for spreadsheets or JSONL headers (no giant prompts in table view).
 * @param {HarborEvalCase} c
 * @returns {object}
 */
export function previewHarborEvalCase(c) {
  return {
    id: c.id,
    version: c.version,
    suite: c.suite,
    stack_role: c.stack_role,
    organization_id: c.organization_id,
    risk_tier: c.risk_tier,
    tags: c.tags,
    prompt_preview: (c.user_prompt || "").slice(0, 160),
    expected_keys: c.expected ? Object.keys(c.expected) : [],
    metadata_domain: c.metadata?.domain,
    has_human_labels: !!(c.human_labels && Object.keys(c.human_labels).length),
  };
}

/**
 * Validate every case in a list; returns first errors only per id.
 * @param {HarborEvalCase[]} cases
 * @param {{ strictSuiteFields?: boolean }} [opts]
 * @returns {{ ok: boolean, failures: { id: string, errors: string[] }[] }}
 */
export function validateHarborEvalCaseList(cases, opts) {
  const failures = [];
  for (const c of cases) {
    const r = validateHarborEvalCase(c, opts);
    if (!r.ok) failures.push({ id: typeof c?.id === "string" ? c.id : "(missing id)", errors: r.errors });
  }
  return { ok: failures.length === 0, failures };
}
