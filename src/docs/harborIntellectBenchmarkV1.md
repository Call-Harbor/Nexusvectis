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

Publish the **eval case JSONL**, optional **benchmark v1 JSONL** runs, and the **Harbor Intellect agent definition** to a Hub dataset repo:

1. Create a token with **write** access at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. First push (create repo + upload):

```bash
export HF_TOKEN=hf_...
npm run harbor:hf:upload -- --repo YOUR_USERNAME/harbor-intellect-eval-v1 --create
```

Or use your HF username automatically (repo is created under your account when using `--create`):

```bash
export HF_TOKEN=hf_...
npm run harbor:hf:upload -- --repo harbor-intellect-eval-v1 --create
```

Optional: `HF_ORG=my-org` for org-owned repos, `HF_PRIVATE=1` for private datasets, `HF_SKIP_BENCHMARK=1` to ship eval cases only, `HF_SKIP_AGENT=1` to omit `agent_definition.json`.

Implementation: `scripts/harbor-intellect-upload-hf.mjs`, `src/lib/harborIntellectHfDataset.js`. A local copy of the bundle is written under `artifacts/hf-upload/` (gitignored).
