# Harbor Intellect Benchmark v1

## What Benchmark v1 tests

Benchmark v1 compares **Harbor Intellect** against a **baseline model path** on the same domain cases.

Suites:

- `reasoning`
- `tool_routing`
- `governance`
- `failure_modes`

The evaluator is deterministic and uses case constraints from `harborEvalCaseSchema` / `harborEvalSeedCases`.

## Pass criteria (suite-specific)

- **reasoning**
  - Must satisfy `answer_contains` / `answer_must_not_contain` checks.
  - When rubric exists, score uses weighted heuristic rubric matching.
  - If `expected.scoring.min_pass_score` exists, rubric score must meet it.

- **tool_routing**
  - Expected tools should appear in `tool_trace`.
  - Forbidden tools (`tools_must_not`) must not appear.

- **governance**
  - Reject/escalate cases must include clear block signal (reject/approval/policy/integrity/audit etc).
  - `explanation_contains` hints should appear.

- **failure_modes**
  - Forbidden substrings and hallucination patterns are blocked.
  - Missing context hallucination (e.g. coordinates without telemetry) is flagged.

## How to run manually

```bash
npm run harbor:benchmark:v1
```

This runs `scripts/harbor-intellect-benchmark.mjs`, which:

1. runs benchmark using either stub invokes or live invokes,
2. applies a regression gate per suite,
3. writes JSONL outputs to `artifacts/benchmark/`:
   - `harbor-intellect-benchmark-v1.eval.jsonl`
   - `harbor-intellect-benchmark-v1.training.jsonl`

## Live model usage

`harborIntellectBenchmarkDev` supports live invoke adapters:

- `createHarborIntellectApiInvokeFn(base44)` for Harbor Intellect
- `createBaselineCoreInvokeFn(base44)` for baseline path

Set `BENCHMARK_USE_LIVE=1` and pass `base44` when running programmatically.

## Next steps

- Replace baseline proxy with dedicated generic endpoint (same base model, no Harbor config).
- Improve tool-trace capture from runtime/orchestration for stricter routing checks.
- Add CI job using this script as regression gate.
- Expand case set and add stronger rubric keyword maps.

## Hugging Face dataset upload

The Hub target is always a **dataset** repository (not a model). The uploader builds a **bundle** documented by a dataset card (`README.md` with YAML front matter), `manifest.json`, and JSONL files.

**Typical bundle files**

| File | Role |
|------|------|
| `harbor_eval_cases.jsonl` | Always — seed `HarborEvalCase` rows |
| `harbor_intellect_benchmark_v1.eval.jsonl` | Optional — `harbor.eval_run.v1` rows (validated before upload) |
| `harbor_intellect_benchmark_v1.training.jsonl` | Optional — `harbor.training_export.v1` rows |
| `agent_definition.json` | Optional — agent card from `base44/agents/harbor_intellect.jsonc` when present |
| `manifest.json` | Bundle metadata: `bundle_schema_version`, `eval_case_schema_version`, `stack_version`, `seed_case_count`, `suite_counts`, `benchmark_jsonl_stats`, `includes`, `generated_at` |
| `README.md` | Dataset card (suites, examples, intended use, limitations, governance) |

**Steps**

1. Create a token with **write** access: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. (Recommended) Generate benchmark JSONL locally: `npm run harbor:benchmark:v1`
3. Preview bundle locally without uploading: `npm run harbor:hf:upload -- --repo org/name --dry-run`
4. First Hub push (creates dataset repo if needed):

```bash
export HF_TOKEN=hf_...
npm run harbor:hf:upload -- --repo YOUR_USERNAME/harbor-intellect-eval-v1 --create
```

Or resolve the user namespace via Hub API (short repo name):

```bash
export HF_TOKEN=hf_...
npm run harbor:hf:upload -- --repo harbor-intellect-eval-v1 --create
```

**Environment flags:** `HF_ORG`, `HF_PRIVATE=1`, `HF_SKIP_BENCHMARK=1` (eval cases + card only), `HF_SKIP_AGENT=1` (omit agent JSON). CLI: `--help`, `--dry-run`.

Implementation: `scripts/harbor-intellect-upload-hf.mjs`, `src/lib/harborIntellectHfDataset.js`. A copy of the pushed files is written under `artifacts/hf-upload/` (gitignored).
