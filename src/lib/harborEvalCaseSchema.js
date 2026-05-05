/**
 * Harbor Evaluation Layer — portable eval case shape for benchmarks and export pipelines.
 *
 * TODO(training export): serialize labeled rows from AgentExecution + domain entities to JSONL;
 * join correlation_id with OutcomeLearning / shipment KPIs for supervised targets.
 * TODO(governance eval): add human_verdict + policy_rule_hits when ApprovalRequest exists.
 */

/** @typedef {'reasoning'|'tool_routing'|'governance'|'failure_modes'} HarborEvalSuiteId */

/** @typedef {'intellect'|'orchestration'} HarborEvalStackRole */

/**
 * @typedef {object} HarborEvalExpected
 * @property {string[]} [tools] - expected tool / integration ids (orchestration routing)
 * @property {string} [answer_contains] - substring or regex doc id for intellect checks
 * @property {'approve'|'reject'|'escalate'} [approval] - governance suite
 * @property {boolean} [must_not_hallucinate_entity_id] - failure-mode flag
 */

/**
 * @typedef {object} HarborEvalCase
 * @property {string} id - stable case id (e.g. inc_alert_route_001)
 * @property {string} [version] - schema version for exporters
 * @property {HarborEvalSuiteId} suite
 * @property {HarborEvalStackRole} stack_role
 * @property {string} organization_id - tenant scope or synthetic org key
 * @property {string} user_prompt
 * @property {Record<string, unknown>} [context] - fleet snapshot ids, RAG doc refs, etc.
 * @property {HarborEvalExpected} expected
 * @property {Record<string, unknown>} [metadata] - source entity ids, author, date
 */

export const HARBOR_EVAL_CASE_SCHEMA_VERSION = "1.0.0";

export const HARBOR_EVAL_SUITE = {
  REASONING: /** @type {const} */ ("reasoning"),
  TOOL_ROUTING: /** @type {const} */ ("tool_routing"),
  GOVERNANCE: /** @type {const} */ ("governance"),
  FAILURE_MODES: /** @type {const} */ ("failure_modes"),
};

const SUITE_VALUES = new Set(Object.values(HARBOR_EVAL_SUITE));
const STACK_VALUES = new Set(["intellect", "orchestration"]);

/**
 * @param {Partial<HarborEvalCase> & { id: string }} partial
 * @returns {HarborEvalCase}
 */
export function createHarborEvalCaseDraft(partial) {
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
  };
}

/**
 * Structural validation for fixtures and import pipelines (not full JSON Schema).
 * @param {unknown} obj
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateHarborEvalCase(obj) {
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
  return { ok: errors.length === 0, errors };
}
