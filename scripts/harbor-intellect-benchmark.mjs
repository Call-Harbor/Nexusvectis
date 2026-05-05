import fs from "node:fs";
import path from "node:path";
import { runHarborIntellectBenchmarkDev } from "../src/lib/harborIntellectBenchmarkDev.js";

const outDir = path.resolve(process.cwd(), "artifacts/benchmark");
fs.mkdirSync(outDir, { recursive: true });

const { summary, eval_jsonl, training_jsonl } = await runHarborIntellectBenchmarkDev();

fs.writeFileSync(path.join(outDir, "harbor-intellect-benchmark-v1.eval.jsonl"), `${eval_jsonl}\n`, "utf8");
fs.writeFileSync(path.join(outDir, "harbor-intellect-benchmark-v1.training.jsonl"), `${training_jsonl}\n`, "utf8");

// Regression gate per suite.
let gateFailed = false;
for (const [suite, row] of Object.entries(summary.by_suite)) {
  if (!row?.intellect) continue;
  const ratio = row.intellect.total > 0 ? row.intellect.pass / row.intellect.total : 1;
  // v1 conservative gate: must not be 0 pass in any suite.
  if (row.intellect.total > 0 && ratio <= 0) {
    gateFailed = true;
    console.error(`[gate] FAIL ${suite}: ${row.intellect.pass}/${row.intellect.total}`);
  }
}

if (gateFailed) {
  process.exit(2);
}

console.log(`[jsonl] wrote ${path.join(outDir, "harbor-intellect-benchmark-v1.eval.jsonl")}`);
console.log(`[jsonl] wrote ${path.join(outDir, "harbor-intellect-benchmark-v1.training.jsonl")}`);
