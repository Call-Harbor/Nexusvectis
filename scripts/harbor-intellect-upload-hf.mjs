#!/usr/bin/env node
/**
 * Build Harbor Intellect eval/benchmark JSONL and push to a Hugging Face **dataset** repo.
 *
 * Safer defaults: **private** repo on `--create`, **minimal bundle** (eval cases + README + manifest only),
 * benchmark JSONL only with HF_INCLUDE_BENCHMARK=1, **no agent_definition.json** unless HF_INCLUDE_AGENT=1,
 * real upload requires HF_I_UNDERSTAND_UPLOAD=1. Prints a preflight summary before commit.
 *
 * Requires HF_TOKEN (or HUGGING_FACE_HUB_TOKEN) with write access.
 */

import fs from "node:fs";
import path from "node:path";

import { runHarborIntellectBenchmarkDev } from "../src/lib/harborIntellectBenchmarkDev.js";
import {
  HF_API,
  buildHarborIntellectHfDatasetFiles,
  hfCommitDatasetFiles,
  hfCreateRepo,
} from "../src/lib/harborIntellectHfDataset.js";

function printHelp() {
  console.log(`harbor-intellect-upload-hf — push Harbor Intellect eval bundle to Hugging Face Hub (dataset repo)

USAGE
  HF_TOKEN=hf_... HF_I_UNDERSTAND_UPLOAD=1 node scripts/harbor-intellect-upload-hf.mjs --repo <name|org/name> [options]

OPTIONS
  --repo <id>     Dataset repo: short name (under your user or HF_ORG) or full namespace/name
  --create        Create the dataset repo via Hub API first (idempotent if repo exists)
  --dry-run       Build bundle under artifacts/hf-upload/ only; no Hub API except optional whoami
  -h, --help      Show this help

ENVIRONMENT — upload / safety
  HF_TOKEN | HUGGING_FACE_HUB_TOKEN   Write token (required for real upload; not for --dry-run with namespace/name)
  HF_I_UNDERSTAND_UPLOAD=1            Required to push to Hub (prevents accidental publish)
  HF_ORG                              Organization slug when using a short --repo name

ENVIRONMENT — repo creation (--create)
  HF_PRIVATE=1 | HF_PUBLIC=1          Private (default) vs public when creating repo. Without --create, visibility is unchanged.
  HF_LICENSE                          Optional Hub license id for create (default: apache-2.0)

ENVIRONMENT — bundle contents
  HF_INCLUDE_BENCHMARK=1              Add benchmark JSONL (from artifacts/benchmark/*.jsonl or auto-run if missing)
  HF_SKIP_BENCHMARK=1               Forces no benchmark even if HF_INCLUDE_BENCHMARK=1 (explicit minimal)
  HF_INCLUDE_AGENT=1                Include agent_definition.json (opt-in; system instructions)

NOTES
  - Repo type is always **dataset**, not model.
  - **Default bundle is minimal:** eval cases + README + manifest only (no benchmark JSONL, no agent file).
  - Benchmark JSONL is never attached unless HF_INCLUDE_BENCHMARK=1 (existing artifact files are ignored otherwise).
  - After any run, inspect artifacts/hf-upload/ before a real upload.

See src/docs/harborIntellectBenchmarkV1.md (pre-release checklist).
`);
}

/**
 * @param {object} p
 * @param {string} p.fullRepoId
 * @param {boolean} p.dryRun
 * @param {boolean} p.willCreate
 * @param {boolean} [p.createPrivate]
 * @param {string|null} [p.createLicense]
 * @param {{ path: string }[]} p.files
 * @param {boolean} p.benchmarkIncluded
 * @param {boolean} p.agentIncluded
 */
function printPreflightSummary(p) {
  const paths = p.files.map((f) => f.path).sort();
  const bench = p.benchmarkIncluded ? "YES (harbor_intellect_benchmark_v1.*.jsonl)" : "NO (default minimal — set HF_INCLUDE_BENCHMARK=1 to add)";
  const agent = p.agentIncluded ? "YES (agent_definition.json)" : "NO (default — set HF_INCLUDE_AGENT=1 to add)";

  let visLine;
  let licLine;
  if (p.willCreate) {
    visLine = `  Repo visibility (--create): ${p.createPrivate ? "private (default)" : "public (HF_PUBLIC=1)"}`;
    licLine = `  License (--create API): ${p.createLicense ?? "(not set)"}`;
  } else {
    visLine =
      "  Repo visibility: unchanged by this upload (check Hub → Settings on an existing dataset)";
    licLine = "  License: unchanged by this upload (check Hub → Settings)";
  }

  console.log(`
══════════════════════════════════════════════════════════════════
  HARBOR INTELLECT — PREFLIGHT (HF dataset bundle)
══════════════════════════════════════════════════════════════════
  Target:     datasets/${p.fullRepoId}
  Mode:       ${p.dryRun ? "DRY-RUN (no Hub commit)" : "UPLOAD (will commit to Hub)"}
${visLine}
${licLine}

  Benchmark JSONL in bundle:  ${bench}
  agent_definition in bundle: ${agent}

  Files (${paths.length}):
${paths.map((x) => `    - ${x}`).join("\n")}
  Local copy: artifacts/hf-upload/

  Consent required for upload: HF_I_UNDERSTAND_UPLOAD=1
══════════════════════════════════════════════════════════════════
`);
}

async function hfWhoamiUsername(token) {
  const res = await fetch(`${HF_API}/api/whoami-v2`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(
      `[harbor-hf-upload] Hugging Face whoami failed (HTTP ${res.status}). Check HF_TOKEN. Body: ${t.slice(0, 200)}`,
    );
  }
  const j = await res.json();
  const name = typeof j?.name === "string" ? j.name : null;
  if (!name) {
    throw new Error(
      "[harbor-hf-upload] whoami returned no user name; use --repo org/dataset-name explicitly.",
    );
  }
  return name;
}

function parseArgs(argv) {
  const out = { create: false, repo: null, dryRun: false, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--create") out.create = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--repo" && argv[i + 1]) {
      out.repo = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

const { create, repo: repoArg, dryRun, help } = parseArgs(process.argv);
const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;

if (help) {
  printHelp();
  process.exit(0);
}

if (!repoArg) {
  console.error("[harbor-hf-upload] Missing --repo.\n");
  printHelp();
  process.exit(1);
}

if (!token && !dryRun) {
  console.error(
    "[harbor-hf-upload] Set HF_TOKEN or HUGGING_FACE_HUB_TOKEN (write access), or use --dry-run to build locally only.",
  );
  process.exit(1);
}

const org = process.env.HF_ORG?.trim() || "";
let repoShort = repoArg.trim();
let namespace = org;
if (repoArg.includes("/")) {
  const [ns, name] = repoArg.split("/").map((s) => s.trim());
  namespace = ns;
  repoShort = name;
}

let fullRepoId;
if (namespace) {
  fullRepoId = `${namespace}/${repoShort}`;
} else if (repoArg.includes("/")) {
  fullRepoId = repoArg.trim();
} else if (!token && dryRun) {
  fullRepoId = `<hf_user>/${repoShort}`;
  console.warn(
    "[harbor-hf-upload] dry-run: using placeholder repo id; pass namespace/name or HF_TOKEN for a resolved id.",
  );
} else {
  if (!token) {
    console.error(
      "[harbor-hf-upload] For a short --repo name, set HF_TOKEN (whoami) or use namespace/name or HF_ORG.",
    );
    process.exit(1);
  }
  const user = await hfWhoamiUsername(token);
  fullRepoId = `${user}/${repoShort}`;
  namespace = user;
}

const isPublicFlag =
  process.env.HF_PUBLIC === "1" || process.env.HF_PUBLIC === "true";
const createPrivateDefault =
  process.env.HF_PRIVATE === "1" ||
  process.env.HF_PRIVATE === "true" ||
  !isPublicFlag;
const createLicense = (process.env.HF_LICENSE || "apache-2.0").trim() || "apache-2.0";

if (create && !dryRun) {
  console.log(
    `[hf] creating dataset repo ${fullRepoId} (private=${createPrivateDefault}, license=${createLicense}) — set HF_PUBLIC=1 for a public repo`,
  );
  try {
    await hfCreateRepo(token, {
      repo: repoShort,
      type: "dataset",
      organization: org || (repoArg.includes("/") ? namespace : null),
      private: createPrivateDefault,
      license: createLicense,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already exists|409|Repository already exists/i.test(msg)) {
      throw e;
    }
    console.warn(`[hf] repo may already exist: ${msg.slice(0, 200)}`);
  }
}

const skipBenchForced = process.env.HF_SKIP_BENCHMARK === "1";
const includeBenchRequested =
  process.env.HF_INCLUDE_BENCHMARK === "1" || process.env.HF_INCLUDE_BENCHMARK === "true";
const includeBench = includeBenchRequested && !skipBenchForced;

if (skipBenchForced && includeBenchRequested) {
  console.warn(
    "[hf] HF_SKIP_BENCHMARK=1 overrides HF_INCLUDE_BENCHMARK=1 — bundle will not include benchmark JSONL.",
  );
}

let benchmarkJsonl = {};
if (includeBench) {
  const benchDir = path.resolve(process.cwd(), "artifacts/benchmark");
  const evalPath = path.join(benchDir, "harbor-intellect-benchmark-v1.eval.jsonl");
  const trainPath = path.join(benchDir, "harbor-intellect-benchmark-v1.training.jsonl");
  if (fs.existsSync(evalPath) && fs.existsSync(trainPath)) {
    benchmarkJsonl = {
      eval_jsonl: fs.readFileSync(evalPath, "utf8"),
      training_jsonl: fs.readFileSync(trainPath, "utf8"),
    };
    console.log(`[hf] HF_INCLUDE_BENCHMARK=1: using benchmark JSONL from ${benchDir}`);
  } else {
    console.warn(
      "[hf] HF_INCLUDE_BENCHMARK=1 but artifacts missing — running benchmark once to generate JSONL (review outputs before re-upload).",
    );
    fs.mkdirSync(benchDir, { recursive: true });
    const { eval_jsonl, training_jsonl } = await runHarborIntellectBenchmarkDev();
    fs.writeFileSync(evalPath, `${eval_jsonl}\n`, "utf8");
    fs.writeFileSync(trainPath, `${training_jsonl}\n`, "utf8");
    benchmarkJsonl = { eval_jsonl, training_jsonl };
  }
} else {
  console.log(
    "[hf] default minimal bundle: benchmark JSONL omitted (ignored even if artifacts/benchmark exists). Set HF_INCLUDE_BENCHMARK=1 to attach.",
  );
}

const includeAgent =
  process.env.HF_INCLUDE_AGENT === "1" || process.env.HF_INCLUDE_AGENT === "true";

if (includeAgent) {
  console.warn(
    "[hf] HF_INCLUDE_AGENT=1 — agent_definition.json will be uploaded if the source file exists. Confirm legal/product approval.",
  );
}

let files;
let manifest;
try {
  const built = buildHarborIntellectHfDatasetFiles({
    benchmarkJsonl,
    includeAgentDefinition: includeAgent,
  });
  files = built.files;
  manifest = built.manifest;
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[harbor-hf-upload] Bundle build failed: ${msg}`);
  process.exit(1);
}

if (manifest.agent_definition_status === "skipped_not_found" && includeAgent) {
  console.warn(
    "[hf] HF_INCLUDE_AGENT=1 but agent file not found at base44/agents/harbor_intellect.jsonc — agent_definition.json omitted.",
  );
}

const outDir = path.resolve(process.cwd(), "artifacts/hf-upload");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
for (const f of files) {
  const safe = f.path.replace(/\//g, "__");
  fs.writeFileSync(path.join(outDir, safe), f.content, "utf8");
}

const benchmarkIncluded = files.some((f) =>
  f.path.startsWith("harbor_intellect_benchmark_v1."),
);
const agentIncluded = files.some((f) => f.path === "agent_definition.json");

printPreflightSummary({
  fullRepoId,
  dryRun,
  willCreate: create,
  createPrivate: createPrivateDefault,
  createLicense: create ? createLicense : null,
  files,
  benchmarkIncluded,
  agentIncluded,
});

if (dryRun) {
  console.log(`[hf] dry-run: wrote ${files.length} files to ${outDir} (no Hub commit).`);
  console.log(
    "[hf] Review the bundle, then upload with HF_I_UNDERSTAND_UPLOAD=1 (and HF_TOKEN) if content is approved.",
  );
  process.exit(0);
}

const confirmed =
  process.env.HF_I_UNDERSTAND_UPLOAD === "1" ||
  process.env.HF_I_UNDERSTAND_UPLOAD === "true";
if (!confirmed) {
  console.error(
    "[harbor-hf-upload] Refusing to upload: set HF_I_UNDERSTAND_UPLOAD=1 after reviewing artifacts/hf-upload/ (dataset card, JSONL, manifest).",
  );
  process.exit(3);
}

console.log(`[hf] committing ${files.length} files to datasets/${fullRepoId} …`);
const commit = await hfCommitDatasetFiles(token, {
  repoId: fullRepoId,
  files,
  summary: "Harbor Intellect Eval/Benchmark v1: dataset bundle",
});
console.log("[hf] done", commit?.commit || commit);
console.log(`[hf] local copy: ${outDir}`);
