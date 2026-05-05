/**
 * Build a Hugging Face–friendly dataset bundle for Harbor Intellect:
 * eval cases (JSONL), optional benchmark runs (JSONL), and agent card JSON.
 */

import fs from "node:fs";
import path from "node:path";

import { HARBOR_EVAL_SEED_CASES } from "./harborEvalSeedCases.js";
import {
  HARBOR_EVAL_CASE_SCHEMA_VERSION,
  HARBOR_EVAL_SUITE,
  validateHarborEvalCaseList,
} from "./harborEvalCaseSchema.js";
import { HARBOR_MODEL_STACK_VERSION } from "./harborModelStack.js";

const HF_API = "https://huggingface.co";

/** Stable version for manifest.json shape and Hub README contract (bump when manifest fields change). */
export const HARBOR_HF_DATASET_BUNDLE_VERSION = "1.0.0";

/** Benchmark harness id aligned with file prefixes and docs. */
export const HARBOR_INTELLECT_BENCHMARK_V1_ID = "harbor_intellect_benchmark_v1";

/** @typedef {{ path: string, content: string }} HarborHfRepoFile */

/**
 * Count seed cases per eval suite (reasoning, tool_routing, governance, failure_modes).
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase[]} cases
 */
export function countHarborEvalCasesBySuite(cases) {
  /** @type {Record<string, number>} */
  const out = {
    [HARBOR_EVAL_SUITE.REASONING]: 0,
    [HARBOR_EVAL_SUITE.TOOL_ROUTING]: 0,
    [HARBOR_EVAL_SUITE.GOVERNANCE]: 0,
    [HARBOR_EVAL_SUITE.FAILURE_MODES]: 0,
  };
  for (const c of cases) {
    const s = c?.suite;
    if (s && Object.prototype.hasOwnProperty.call(out, s)) {
      out[s] += 1;
    }
  }
  return out;
}

/**
 * @param {string} jsonl
 * @param {{ label: string, expectSchema?: string }} ctx
 * @returns {{ line_count: number, object_count: number }}
 */
export function validateHarborJsonlLines(jsonl, ctx) {
  const raw = String(jsonl || "").trim();
  if (!raw) {
    throw new Error(`${ctx.label}: JSONL is empty.`);
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let objectCount = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`${ctx.label}: invalid JSON on line ${lineNo}: ${msg}`);
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error(`${ctx.label}: line ${lineNo} must be a JSON object, not an array or primitive.`);
    }
    if (ctx.expectSchema && obj.schema !== ctx.expectSchema) {
      throw new Error(
        `${ctx.label}: line ${lineNo} expected schema "${ctx.expectSchema}", got ${JSON.stringify(obj.schema)}.`,
      );
    }
    objectCount += 1;
  }
  if (objectCount === 0) {
    throw new Error(`${ctx.label}: no JSON objects found.`);
  }
  return { line_count: lines.length, object_count: objectCount };
}

/**
 * Derive eval-run counts per underlying suite from benchmark_suite field
 * (e.g. "harbor_intellect_benchmark_v1:reasoning" → "reasoning").
 * @param {string} evalJsonlRaw
 */
export function countHarborEvalRunsBySuiteFromEvalJsonl(evalJsonlRaw) {
  const raw = String(evalJsonlRaw || "").trim();
  if (!raw) return null;
  /** @type {Record<string, number>} */
  const out = {
    [HARBOR_EVAL_SUITE.REASONING]: 0,
    [HARBOR_EVAL_SUITE.TOOL_ROUTING]: 0,
    [HARBOR_EVAL_SUITE.GOVERNANCE]: 0,
    [HARBOR_EVAL_SUITE.FAILURE_MODES]: 0,
  };
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const bs = obj && typeof obj.benchmark_suite === "string" ? obj.benchmark_suite : "";
    const colon = bs.lastIndexOf(":");
    const suite = colon >= 0 ? bs.slice(colon + 1) : "";
    if (suite && Object.prototype.hasOwnProperty.call(out, suite)) {
      out[suite] += 1;
    }
  }
  return out;
}

/**
 * @param {object} [opts]
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase[]} [opts.cases]
 * @param {{ eval_jsonl?: string, training_jsonl?: string }} [opts.benchmarkJsonl]
 * @param {boolean} [opts.includeAgentDefinition]
 * @param {string} [opts.agentDefinitionPath] - default: base44/agents/harbor_intellect.jsonc
 * @param {boolean} [opts.validateBenchmarkJsonl] - default true when benchmark strings are non-empty
 * @returns {{ files: HarborHfRepoFile[], manifest: Record<string, unknown> }}
 */
export function buildHarborIntellectHfDatasetFiles(opts = {}) {
  const cases = opts.cases ?? HARBOR_EVAL_SEED_CASES;
  const v = validateHarborEvalCaseList(cases);
  if (!v.ok) {
    const msg = v.failures
      .map((f) => `${f.id}: ${f.errors.join(", ")}`)
      .join("; ");
    throw new Error(
      `[harbor-hf-dataset] Seed eval cases failed validation (fix before upload): ${msg}`,
    );
  }

  const suiteCounts = countHarborEvalCasesBySuite(cases);
  const validateBench = opts.validateBenchmarkJsonl !== false;

  const evalJsonlRaw = opts.benchmarkJsonl?.eval_jsonl?.trim() ? opts.benchmarkJsonl.eval_jsonl : "";
  const trainJsonlRaw = opts.benchmarkJsonl?.training_jsonl?.trim() ? opts.benchmarkJsonl.training_jsonl : "";

  /** @type {{ eval?: { line_count: number, object_count: number }, training?: { line_count: number, object_count: number } }} */
  const benchmarkStats = {};

  if (evalJsonlRaw && validateBench) {
    benchmarkStats.eval = validateHarborJsonlLines(evalJsonlRaw, {
      label: "harbor_intellect_benchmark_v1.eval.jsonl",
      expectSchema: "harbor.eval_run.v1",
    });
  }
  if (trainJsonlRaw && validateBench) {
    benchmarkStats.training = validateHarborJsonlLines(trainJsonlRaw, {
      label: "harbor_intellect_benchmark_v1.training.jsonl",
      expectSchema: "harbor.training_export.v1",
    });
  }

  const evalCasesJsonl = cases.map((c) => JSON.stringify(c)).join("\n");

  /** @type {HarborHfRepoFile[]} */
  const files = [];

  files.push({
    path: "harbor_eval_cases.jsonl",
    content: `${evalCasesJsonl}\n`,
  });

  const includeAgent = opts.includeAgentDefinition !== false;
  let agentStatus = /** @type {"included"|"skipped_not_found"|"skipped_disabled"} */ ("skipped_disabled");
  const relAgent = opts.agentDefinitionPath ?? path.join("base44", "agents", "harbor_intellect.jsonc");
  const absAgent = path.isAbsolute(relAgent) ? relAgent : path.join(process.cwd(), relAgent);

  if (includeAgent) {
    if (fs.existsSync(absAgent)) {
      const raw = fs.readFileSync(absAgent, "utf8");
      files.push({
        path: "agent_definition.json",
        content: raw,
      });
      agentStatus = "included";
    } else {
      agentStatus = "skipped_not_found";
    }
  }

  if (evalJsonlRaw) {
    files.push({
      path: "harbor_intellect_benchmark_v1.eval.jsonl",
      content: evalJsonlRaw.endsWith("\n") ? evalJsonlRaw : `${evalJsonlRaw}\n`,
    });
  }
  if (trainJsonlRaw) {
    files.push({
      path: "harbor_intellect_benchmark_v1.training.jsonl",
      content: trainJsonlRaw.endsWith("\n") ? trainJsonlRaw : `${trainJsonlRaw}\n`,
    });
  }

  const exampleEvalRunLine = evalJsonlRaw
    ? evalJsonlRaw.split(/\r?\n/).find((l) => l.trim()) ?? null
    : null;

  const benchmarkEvalRunSuiteCounts = evalJsonlRaw
    ? countHarborEvalRunsBySuiteFromEvalJsonl(evalJsonlRaw)
    : null;

  const readmeContext = {
    suiteCounts,
    seedCaseCount: cases.length,
    includesBenchmarkEval: Boolean(evalJsonlRaw),
    includesBenchmarkTraining: Boolean(trainJsonlRaw),
    benchmarkJsonlStats:
      Object.keys(benchmarkStats).length > 0 ? benchmarkStats : null,
    benchmarkEvalRunSuiteCounts,
    agentStatus,
    exampleEvalCase: cases[0] ?? null,
    exampleEvalRunLine,
  };

  files.push({
    path: "README.md",
    content: buildDatasetReadme(readmeContext),
  });

  /** @type {Record<string, boolean>} */
  const includesMap = {
    "harbor_eval_cases.jsonl": true,
    "README.md": true,
    "manifest.json": true,
    "harbor_intellect_benchmark_v1.eval.jsonl": Boolean(evalJsonlRaw),
    "harbor_intellect_benchmark_v1.training.jsonl": Boolean(trainJsonlRaw),
    "agent_definition.json": agentStatus === "included",
  };

  const manifest = {
    kind: "harbor_intellect_dataset_bundle",
    bundle_schema_version: HARBOR_HF_DATASET_BUNDLE_VERSION,
    benchmark_id: HARBOR_INTELLECT_BENCHMARK_V1_ID,
    eval_case_schema_version: HARBOR_EVAL_CASE_SCHEMA_VERSION,
    stack_version: HARBOR_MODEL_STACK_VERSION,
    seed_case_count: cases.length,
    suite_counts: suiteCounts,
    benchmark_eval_run_counts_by_suite: benchmarkEvalRunSuiteCounts,
    benchmark_jsonl_stats:
      Object.keys(benchmarkStats).length > 0 ? benchmarkStats : null,
    includes: includesMap,
    agent_definition_status: agentStatus,
    agent_definition_source_path: agentStatus === "included" ? relAgent.replace(/\\/g, "/") : null,
    files_in_bundle: [],
    generated_at: new Date().toISOString(),
    source: {
      repository: "NexusVectis / Harbor",
      components: [
        "src/lib/harborEvalSeedCases.js",
        "src/lib/harborIntellectBenchmarkV1.js",
        "scripts/harbor-intellect-benchmark.mjs",
      ],
    },
  };

  manifest.files_in_bundle = [...files.map((f) => f.path), "manifest.json"];

  files.push({
    path: "manifest.json",
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  });

  return { files, manifest };
}

/**
 * @param {object} ctx
 * @param {Record<string, number>} ctx.suiteCounts
 * @param {number} ctx.seedCaseCount
 * @param {boolean} ctx.includesBenchmarkEval
 * @param {boolean} ctx.includesBenchmarkTraining
 * @param {{ eval?: { line_count: number, object_count: number }, training?: { line_count: number, object_count: number } }|null} [ctx.benchmarkJsonlStats]
 * @param {Record<string, number>|null} [ctx.benchmarkEvalRunSuiteCounts]
 * @param {'included'|'skipped_not_found'|'skipped_disabled'} ctx.agentStatus
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase|null} ctx.exampleEvalCase
 * @param {string|null} ctx.exampleEvalRunLine
 */
function buildDatasetReadme(ctx) {
  const suiteRows = Object.entries(ctx.suiteCounts)
    .map(([k, n]) => `- **${k}**: ${n} seed case(s)`)
    .join("\n");

  let benchmarkRowsNote = "";
  if (ctx.benchmarkJsonlStats?.eval) {
    const s = ctx.benchmarkJsonlStats.eval;
    benchmarkRowsNote += `\n- **Eval JSONL**: ${s.object_count} row(s) (${s.line_count} line(s)).`;
  }
  if (ctx.benchmarkJsonlStats?.training) {
    const s = ctx.benchmarkJsonlStats.training;
    benchmarkRowsNote += `\n- **Training JSONL**: ${s.object_count} row(s) (${s.line_count} line(s)).`;
  }
  if (ctx.benchmarkEvalRunSuiteCounts) {
    const runRows = Object.entries(ctx.benchmarkEvalRunSuiteCounts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `  - ${k}: ${n} run row(s)`)
      .join("\n");
    if (runRows) {
      benchmarkRowsNote += `\n- **Eval runs by suite** (from \`benchmark_suite\` suffix):\n${runRows}`;
    }
  }

  const exampleCaseBlock = ctx.exampleEvalCase
    ? "```json\n" + JSON.stringify(ctx.exampleEvalCase, null, 2) + "\n```"
    : "_No example case._";

  const exampleRunBlock = ctx.exampleEvalRunLine
    ? "```json\n" + ctx.exampleEvalRunLine + "\n```"
    : "_Not included in this revision — run `npm run harbor:benchmark:v1` and re-upload with benchmark JSONL, or omit benchmark files._";

  const agentNote =
    ctx.agentStatus === "included"
      ? "This revision includes `agent_definition.json` (system prompt / agent metadata from the Harbor app repo)."
      : ctx.agentStatus === "skipped_not_found"
        ? "`agent_definition.json` is **not** in this bundle (source file was not found at build time)."
        : "`agent_definition.json` was omitted (export disabled).";

  const yamlCard = `---
license: apache-2.0
language:
  - en
tags:
  - benchmark
  - evaluation
  - logistics
  - fleet
  - operations
  - harbor-intellect
pretty_name: Harbor Intellect Eval / Benchmark v1
size_categories:
  - n<1K
---

`;

  return `${yamlCard}# Harbor Intellect Eval / Benchmark v1

**Official-style benchmark and evaluation seed set** for **Harbor Intellect**: reasoning, tool routing, governance, and failure-mode checks in fleet, logistics, and operations scenarios (synthetic org context). This repository is a **dataset** (JSONL + metadata), not a model checkpoint.

Harbor Intellect is the domain-tuned reasoning and analysis layer in the Harbor / NexusVectis stack (prioritization, disruption handling, policy-aware responses). This dataset packages **frozen eval cases** and optional **v1 benchmark run exports** for reproducible scoring and training-data preparation.

## Dataset contents

| File | Description |
|------|-------------|
| \`harbor_eval_cases.jsonl\` | One JSON object per line: \`HarborEvalCase\` (schema **${HARBOR_EVAL_CASE_SCHEMA_VERSION}**). Primary artifact for benchmarks and supervised labels. |
| \`harbor_intellect_benchmark_v1.eval.jsonl\` | Optional: one row per model run with \`schema: harbor.eval_run.v1\` (pass/fail, score, output snippet). |
| \`harbor_intellect_benchmark_v1.training.jsonl\` | Optional: \`harbor.training_export.v1\` rows for finetune pipelines. |
| \`agent_definition.json\` | Optional: agent card JSON (instructions / metadata) for prompt recovery — **not** a trained model. |
| \`manifest.json\` | Machine-readable bundle metadata (versions, suite counts, which files are present). |

## Benchmark suites (seed distribution)

Suites follow \`harborEvalCaseSchema\` (\`suite\` field). Current seed counts:

${suiteRows}

## Bundle statistics (this revision)

${
    benchmarkRowsNote.trim()
      ? benchmarkRowsNote.replace(/^\n+/, "")
      : "_Benchmark JSONL not included in this revision._ Use the default upload flow (omit HF_SKIP_BENCHMARK) to attach benchmark files after running npm run harbor:benchmark:v1."
  }

## Example: one \`harbor_eval_cases.jsonl\` record

${exampleCaseBlock}

## Example: one \`harbor.eval_run.v1\` line (when benchmark JSONL is bundled)

${exampleRunBlock}

## Intended use

- **Benchmarking** domain models and agents on operations / logistics tasks.
- **Regression testing** after prompt, RAG, routing, or policy changes.
- **Training data preparation** (supervision, preference pairs) when combined with your own logged outputs — not a substitute for production telemetry review.

## Limitations

- **Synthetic** scenarios and org ids (e.g. \`synthetic_org_acme\`); not real customer data.
- **Deterministic v1 scorer** uses heuristics (substring, rubric keyword overlap, tool-trace checks). It does not replace human review or a frozen LLM-judge for high-stakes acceptance.
- **Tool traces** in benchmark rows may be empty or stubbed unless your runner attaches real orchestration traces.
- **Coverage** is intentionally small (seed set); extend before claiming full domain coverage.

## Governance & safety

Eval cases include **governance** and **failure_mode** scenarios (e.g. unsafe actions, policy violations). Use outputs only in line with your **internal AI governance**, approval workflows, and regional regulations. Do not treat passing scores as proof of safety in production.

## Versioning

- **Eval case schema**: \`${HARBOR_EVAL_CASE_SCHEMA_VERSION}\` (per-case \`HarborEvalCase\` objects).
- **Stack version** (export rows): \`${HARBOR_MODEL_STACK_VERSION}\`.
- **Dataset bundle manifest**: \`${HARBOR_HF_DATASET_BUNDLE_VERSION}\` — see \`manifest.json\` for \`generated_at\`, \`suite_counts\`, and \`includes\`.

Re-publish the dataset after changing seed cases or benchmark harness; consumers should pin Hub revision or \`manifest.generated_at\`.

## Loading with Hugging Face \`datasets\`

\`\`\`python
from datasets import load_dataset
cases = load_dataset("json", data_files="harbor_eval_cases.jsonl", split="train")
\`\`\`

## Agent definition note

${agentNote}

## License & attribution

Dataset card license in YAML is **Apache-2.0** (align with Hub repo settings). Verify license and attribution requirements for your use case. Source: NexusVectis / Harbor codebase (\`harborEvalSeedCases\`, Harbor Intellect Benchmark v1).
`;
}

/**
 * @param {string} token
 * @param {object} p
 * @param {string} p.repo - short name (no namespace)
 * @param {'dataset'} p.type
 * @param {string} [p.organization] - HF org; omit for user namespace
 * @param {boolean} [p.private]
 * @param {string} [p.license] - Hub license id, e.g. apache-2.0
 */
export async function hfCreateRepo(token, p) {
  const body = {
    name: p.repo,
    type: p.type,
    private: p.private ?? false,
    license: p.license ?? "apache-2.0",
  };
  if (p.organization) body.organization = p.organization;
  const res = await fetch(`${HF_API}/api/repos/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF create repo failed ${res.status}: ${t.slice(0, 500)}`);
  }
  return res.json();
}

/**
 * @param {string} token
 * @param {string} repoId - e.g. user/name or org/name
 * @returns {Promise<string|null>} main branch tip commit sha
 */
export async function hfDatasetMainParentCommit(token, repoId) {
  const enc = encodeURIComponent(repoId);
  const res = await fetch(`${HF_API}/api/datasets/${enc}/refs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const branches = Array.isArray(data?.branches) ? data.branches : [];
  const main = branches.find((b) => b?.name === "main") || branches[0];
  return main?.targetCommit ?? null;
}

/**
 * @param {string} token
 * @param {object} p
 * @param {string} p.repoId
 * @param {HarborHfRepoFile[]} p.files
 * @param {string} [p.branch]
 * @param {string|null} [p.parentCommit]
 * @param {string} [p.summary]
 */
export async function hfCommitDatasetFiles(token, p) {
  const repoId = p.repoId;
  const enc = encodeURIComponent(repoId);
  const branch = p.branch ?? "main";
  let parentCommit = p.parentCommit;
  if (!parentCommit) {
    parentCommit = await hfDatasetMainParentCommit(token, repoId);
  }

  const payload = {
    summary: p.summary ?? "Upload Harbor Intellect dataset bundle",
    description: "",
    parentCommit: parentCommit ?? undefined,
    files: p.files.map((f) => ({
      path: f.path,
      content: f.content,
      encoding: "utf-8",
    })),
  };

  const res = await fetch(`${HF_API}/api/datasets/${enc}/commit/${encodeURIComponent(branch)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF commit failed ${res.status}: ${t.slice(0, 800)}`);
  }
  return res.json();
}

export { HF_API };
