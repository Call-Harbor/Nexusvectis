#!/usr/bin/env node
/**
 * Local Harbor Intellect Benchmark v1 — seed cases + stub invoke by default.
 *
 *   npm run harbor:benchmark:local
 *   npm run harbor:benchmark:local -- --json
 *   npm run harbor:benchmark:local -- --write-jsonl
 *
 * Programmatic use: import runHarborIntellectBenchmarkLocal from src/lib/harborIntellectBenchmarkLocal.js
 */

import fs from "node:fs";
import path from "node:path";

import { createStubIntellectInvoke } from "../src/lib/harborIntellectBenchmarkDev.js";
import {
  benchmarkLocalSummaryToEvalJsonl,
  formatHarborIntellectBenchmarkConsoleLines,
  runHarborIntellectBenchmarkLocal,
} from "../src/lib/harborIntellectBenchmarkLocal.js";

function parseArgs(argv) {
  const out = { json: false, writeJsonl: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--json") out.json = true;
    if (argv[i] === "--write-jsonl") out.writeJsonl = true;
  }
  return out;
}

const modelId = process.env.BENCHMARK_MODEL_ID || "local-stub-intellect-v1";
const { json, writeJsonl } = parseArgs(process.argv);

const invoke = createStubIntellectInvoke();
const summary = await runHarborIntellectBenchmarkLocal({
  invoke,
  modelId,
});

const lines = formatHarborIntellectBenchmarkConsoleLines(summary);
console.log(lines.join("\n"));

if (json) {
  console.log("\n--- summary JSON ---\n");
  console.log(
    JSON.stringify(
      {
        benchmark_id: summary.benchmark_id,
        by_suite: summary.by_suite,
        results: summary.results.map((r) => ({
          eval_case_id: r.eval_case_id,
          suite: r.suite,
          model_id: r.model_id,
          passed: r.passed,
          score_0_1: r.score_0_1,
          latency_ms: r.latency_ms,
          notes: r.notes,
          failure_mode_tags: r.failure_mode_tags,
        })),
      },
      null,
      2,
    ),
  );
}

const evalJsonl = benchmarkLocalSummaryToEvalJsonl(summary);
if (writeJsonl) {
  const outDir = path.resolve(process.cwd(), "artifacts/benchmark");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "harbor-intellect-benchmark-local.eval.jsonl");
  fs.writeFileSync(outPath, `${evalJsonl}\n`, "utf8");
  console.log(`\n[jsonl] wrote ${outPath}`);
  console.log("[jsonl] rows use schema harbor.eval_run.v1 (compatible with harbor-intellect-benchmark-v1.eval.jsonl)");
}
