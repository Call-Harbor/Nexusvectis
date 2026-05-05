/**
 * Build a Hugging Face–friendly dataset bundle for Harbor Intellect:
 * eval cases (JSONL), optional benchmark runs (JSONL), and agent card JSON.
 */

import fs from "node:fs";
import path from "node:path";

import { HARBOR_EVAL_SEED_CASES } from "./harborEvalSeedCases.js";
import {
  HARBOR_EVAL_CASE_SCHEMA_VERSION,
  validateHarborEvalCaseList,
} from "./harborEvalCaseSchema.js";
import { HARBOR_MODEL_STACK_VERSION } from "./harborModelStack.js";

const HF_API = "https://huggingface.co";

/** @typedef {{ path: string, content: string }} HarborHfRepoFile */

/**
 * @param {object} [opts]
 * @param {import('./harborEvalCaseSchema.js').HarborEvalCase[]} [opts.cases]
 * @param {{ eval_jsonl?: string, training_jsonl?: string }} [opts.benchmarkJsonl]
 * @param {boolean} [opts.includeAgentDefinition]
 * @param {string} [opts.agentDefinitionPath] - default: base44/agents/harbor_intellect.jsonc
 * @returns {{ files: HarborHfRepoFile[], manifest: Record<string, unknown> }}
 */
export function buildHarborIntellectHfDatasetFiles(opts = {}) {
  const cases = opts.cases ?? HARBOR_EVAL_SEED_CASES;
  const v = validateHarborEvalCaseList(cases);
  if (!v.ok) {
    const msg = v.failures
      .map((f) => `${f.id}: ${f.errors.join(", ")}`)
      .join("; ");
    throw new Error(`Harbor eval cases invalid for HF export: ${msg}`);
  }

  const evalCasesJsonl = cases.map((c) => JSON.stringify(c)).join("\n");
  const files = /** @type {HarborHfRepoFile[]} */ ([
    {
      path: "harbor_eval_cases.jsonl",
      content: `${evalCasesJsonl}\n`,
    },
    {
      path: "README.md",
      content: buildDatasetReadme(),
    },
  ]);

  if (opts.benchmarkJsonl?.eval_jsonl?.trim()) {
    files.push({
      path: "harbor_intellect_benchmark_v1.eval.jsonl",
      content: opts.benchmarkJsonl.eval_jsonl.endsWith("\n")
        ? opts.benchmarkJsonl.eval_jsonl
        : `${opts.benchmarkJsonl.eval_jsonl}\n`,
    });
  }
  if (opts.benchmarkJsonl?.training_jsonl?.trim()) {
    files.push({
      path: "harbor_intellect_benchmark_v1.training.jsonl",
      content: opts.benchmarkJsonl.training_jsonl.endsWith("\n")
        ? opts.benchmarkJsonl.training_jsonl
        : `${opts.benchmarkJsonl.training_jsonl}\n`,
    });
  }

  const includeAgent =
    opts.includeAgentDefinition !== false;
  if (includeAgent) {
    const rel = opts.agentDefinitionPath ?? path.join("base44", "agents", "harbor_intellect.jsonc");
    const abs = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    if (fs.existsSync(abs)) {
      const raw = fs.readFileSync(abs, "utf8");
      files.push({
        path: "agent_definition.json",
        content: raw,
      });
    }
  }

  const manifest = {
    kind: "harbor_intellect_dataset_bundle",
    eval_case_schema_version: HARBOR_EVAL_CASE_SCHEMA_VERSION,
    stack_version: HARBOR_MODEL_STACK_VERSION,
    case_count: cases.length,
    files: files.map((f) => f.path),
    generated_at: new Date().toISOString(),
  };
  files.push({
    path: "manifest.json",
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  });

  return { files, manifest };
}

function buildDatasetReadme() {
  return `# Harbor Intellect — evaluation & benchmark bundle

Synthetic operations / fleet / logistics **evaluation cases** for Harbor Intellect (NexusVectis), plus optional **benchmark v1** JSONL runs.

## Files

- \`harbor_eval_cases.jsonl\` — one JSON object per line (\`HarborEvalCase\`, schema ${HARBOR_EVAL_CASE_SCHEMA_VERSION}).
- \`harbor_intellect_benchmark_v1.eval.jsonl\` — optional per-run eval records (\`harbor.eval_run.v1\`).
- \`harbor_intellect_benchmark_v1.training.jsonl\` — optional training-oriented export rows.
- \`agent_definition.json\` — Harbor Intellect agent card from the app repo (instructions + metadata), when bundled.
- \`manifest.json\` — bundle metadata.

## Usage

Load with Hugging Face \`datasets\`:

\`\`\`python
from datasets import load_dataset
ds = load_dataset("json", data_files="harbor_eval_cases.jsonl", split="train")
\`\`\`

## License

See repository metadata on the Hugging Face Hub. Content is intended for research, benchmarking, and fine-tuning preparation — verify suitability for your jurisdiction and data policies.

## Source

Generated from the NexusVectis / Harbor codebase (\`harborEvalSeedCases\`, Harbor Intellect Benchmark v1).
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
