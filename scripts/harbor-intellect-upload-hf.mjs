#!/usr/bin/env node
/**
 * Build Harbor Intellect eval/benchmark JSONL and push to a Hugging Face dataset repo.
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

async function hfWhoamiUsername(token) {
  const res = await fetch(`${HF_API}/api/whoami-v2`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF whoami failed ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  const name = typeof j?.name === "string" ? j.name : null;
  if (!name) {
    throw new Error("HF whoami: missing name; use --repo namespace/dataset-name");
  }
  return name;
}

function parseArgs(argv) {
  const out = { create: false, repo: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--create") out.create = true;
    else if (a === "--repo" && argv[i + 1]) {
      out.repo = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
const { create, repo: repoArg } = parseArgs(process.argv);

if (!token) {
  console.error("Set HF_TOKEN or HUGGING_FACE_HUB_TOKEN with write access.");
  process.exit(1);
}
if (!repoArg) {
  console.error("Usage: node scripts/harbor-intellect-upload-hf.mjs --repo <dataset-name|namespace/name> [--create]");
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
} else {
  const user = await hfWhoamiUsername(token);
  fullRepoId = `${user}/${repoShort}`;
  namespace = user;
}

if (create) {
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

const { files, manifest } = buildHarborIntellectHfDatasetFiles({
  benchmarkJsonl,
  includeAgentDefinition: process.env.HF_SKIP_AGENT !== "1",
});

const outDir = path.resolve(process.cwd(), "artifacts/hf-upload");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
for (const f of files) {
  const safe = f.path.replace(/\//g, "__");
  fs.writeFileSync(path.join(outDir, safe), f.content, "utf8");
}

console.log(`[hf] committing ${files.length} files to datasets/${fullRepoId} …`);
const commit = await hfCommitDatasetFiles(token, {
  repoId: fullRepoId,
  files,
  summary: "Harbor Intellect: eval cases + benchmark JSONL bundle",
});
console.log("[hf] done", commit?.commit || commit);
console.log(`[hf] local copy: ${outDir}`);
