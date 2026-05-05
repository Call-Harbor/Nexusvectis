#!/usr/bin/env node
/**
 * Build Harbor Intellect eval/benchmark JSONL and push to a Hugging Face **dataset** repo.
 *
 * Requires HF_TOKEN (or HUGGING_FACE_HUB_TOKEN) with write access.
 *
 * Usage:
 *   HF_TOKEN=hf_... node scripts/harbor-intellect-upload-hf.mjs --repo harbor-intellect-eval-v1
 *   HF_TOKEN=hf_... node scripts/harbor-intellect-upload-hf.mjs --repo my-org/harbor-intellect-eval --create
 *
 * Env:
 *   HF_ORG              - optional organization namespace (else your user)
 *   HF_PRIVATE=1        - create private repo when using --create
 *   HF_SKIP_BENCHMARK=1 - do not attach benchmark JSONL from artifacts/
 *   HF_SKIP_AGENT=1     - do not bundle base44/agents/harbor_intellect.jsonc
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
  HF_TOKEN=hf_... node scripts/harbor-intellect-upload-hf.mjs --repo <name|org/name> [options]

OPTIONS
  --repo <id>     Dataset repo: short name (under your user or HF_ORG) or full namespace/name
  --create        Call Hub API to create the dataset repo first (idempotent if repo exists)
  --dry-run       Build bundle under artifacts/hf-upload/ only; do not create repo or commit
  -h, --help      Show this help

ENVIRONMENT
  HF_TOKEN | HUGGING_FACE_HUB_TOKEN   Required unless --dry-run (write token for upload)
  HF_ORG                              Organization slug when using a short --repo name
  HF_PRIVATE=1                        With --create: private dataset
  HF_SKIP_BENCHMARK=1                 Ship eval cases + README + manifest only (no benchmark JSONL)
  HF_SKIP_AGENT=1                     Omit agent_definition.json

NOTES
  - Repo type is always **dataset**, not model.
  - Benchmark JSONL is validated (JSON lines + schema field) before commit.
  - See src/docs/harborIntellectBenchmarkV1.md for benchmark details.
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

if (create && !dryRun) {
  const priv = process.env.HF_PRIVATE === "1" || process.env.HF_PRIVATE === "true";
  console.log(`[hf] creating dataset repo ${fullRepoId} (private=${priv})`);
  try {
    await hfCreateRepo(token, {
      repo: repoShort,
      type: "dataset",
      organization: org || (repoArg.includes("/") ? namespace : null),
      private: priv,
      license: "apache-2.0",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already exists|409|Repository already exists/i.test(msg)) {
      throw e;
    }
    console.warn(`[hf] repo may already exist: ${msg.slice(0, 200)}`);
  }
}

let benchmarkJsonl = {};
if (process.env.HF_SKIP_BENCHMARK !== "1") {
  const benchDir = path.resolve(process.cwd(), "artifacts/benchmark");
  const evalPath = path.join(benchDir, "harbor-intellect-benchmark-v1.eval.jsonl");
  const trainPath = path.join(benchDir, "harbor-intellect-benchmark-v1.training.jsonl");
  if (fs.existsSync(evalPath) && fs.existsSync(trainPath)) {
    benchmarkJsonl = {
      eval_jsonl: fs.readFileSync(evalPath, "utf8"),
      training_jsonl: fs.readFileSync(trainPath, "utf8"),
    };
    console.log(`[hf] using benchmark JSONL from ${benchDir}`);
  } else {
    console.log("[hf] running benchmark to generate JSONL (artifacts missing)…");
    fs.mkdirSync(benchDir, { recursive: true });
    const { eval_jsonl, training_jsonl } = await runHarborIntellectBenchmarkDev();
    fs.writeFileSync(evalPath, `${eval_jsonl}\n`, "utf8");
    fs.writeFileSync(trainPath, `${training_jsonl}\n`, "utf8");
    benchmarkJsonl = { eval_jsonl, training_jsonl };
  }
}

let files;
let manifest;
try {
  const built = buildHarborIntellectHfDatasetFiles({
    benchmarkJsonl,
    includeAgentDefinition: process.env.HF_SKIP_AGENT !== "1",
  });
  files = built.files;
  manifest = built.manifest;
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[harbor-hf-upload] Bundle build failed: ${msg}`);
  process.exit(1);
}

if (manifest.agent_definition_status === "skipped_not_found") {
  console.warn(
    `[hf] agent_definition.json not bundled (file missing). Set HF_SKIP_AGENT=1 to silence, or add base44/agents/harbor_intellect.jsonc.`,
  );
}

const outDir = path.resolve(process.cwd(), "artifacts/hf-upload");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
for (const f of files) {
  const safe = f.path.replace(/\//g, "__");
  fs.writeFileSync(path.join(outDir, safe), f.content, "utf8");
}

if (dryRun) {
  console.log(`[hf] dry-run: wrote ${files.length} files to ${outDir} (no Hub commit).`);
  process.exit(0);
}

console.log(`[hf] committing ${files.length} files to datasets/${fullRepoId} …`);
const commit = await hfCommitDatasetFiles(token, {
  repoId: fullRepoId,
  files,
  summary: "Harbor Intellect Eval/Benchmark v1: dataset bundle",
});
console.log("[hf] done", commit?.commit || commit);
console.log(`[hf] local copy: ${outDir}`);
