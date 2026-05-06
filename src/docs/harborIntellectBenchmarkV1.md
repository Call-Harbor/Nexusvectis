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

### Local runner (single model, developer tool)

For a **minimal** local loop without the full dev harness wiring:

```bash
npm run harbor:benchmark:local
npm run harbor:benchmark:local -- --json
npm run harbor:benchmark:local -- --write-jsonl
```

- Uses **stub** invoke by default (`createStubIntellectInvoke` from `harborIntellectBenchmarkDev.js`).
- Prints **per-suite pass counts** and optional JSON summary; `--write-jsonl` writes `artifacts/benchmark/harbor-intellect-benchmark-local.eval.jsonl` with **`harbor.eval_run.v1`** rows (same shape as the main benchmark export).

Programmatic: import `runHarborIntellectBenchmarkLocal` and `benchmarkLocalSummaryToEvalJsonl` from `src/lib/harborIntellectBenchmarkLocal.js`, pass your own `invoke(prompt, context, evalCase)`.

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
| `agent_definition.json` | **Opt-in** (`HF_INCLUDE_AGENT=1`) — can expose system instructions; review before any public release |
| `manifest.json` | Bundle metadata + `sensitivity` hints (`contains_benchmark_model_outputs`, `contains_agent_system_instructions`) |
| `README.md` | Dataset card (suites, examples, privacy/pre-release notes, intended use, limitations, governance) |

**Safer defaults (pre-release)**

- **Private-first:** with `--create`, new repos default to **private** unless `HF_PUBLIC=1`.
- **Minimal bundle by default:** benchmark JSONL is **not** included unless `HF_INCLUDE_BENCHMARK=1` (existing files under `artifacts/benchmark/` are **not** auto-attached). `HF_SKIP_BENCHMARK=1` forces no benchmark even if `HF_INCLUDE_BENCHMARK=1`.
- **No agent file by default:** set `HF_INCLUDE_AGENT=1` only after legal/product review.
- **Explicit upload consent:** real Hub commits require `HF_I_UNDERSTAND_UPLOAD=1` after you inspect `artifacts/hf-upload/`.
- **Preflight:** the CLI prints a boxed summary (target repo, visibility/license when creating, benchmark on/off, agent on/off, file list) before any Hub commit.

### Pre-release checklist (before first Hub upload)

1. **Token:** HF [access token](https://huggingface.co/settings/tokens) with **write**; store in CI secrets, never in the repo.
2. **Repo name:** choose `namespace/dataset-name` (org or user); keep naming consistent across teams.
3. **Visibility:** first upload **private** (default on `--create`); use `HF_PUBLIC=1` only after explicit approval.
4. **License:** confirm Hub **Settings → License** matches legal; optional `HF_LICENSE` when creating the repo (API default is `apache-2.0`).
5. **Benchmark output:** if bundling JSONL, open `artifacts/benchmark/*.jsonl` and check `output_text` for live-model leakage, PII, or internal phrasing; prefer stub-only runs for low-risk bundles.
6. **Agent definition:** only set `HF_INCLUDE_AGENT=1` if distributing system prompts is approved.
7. **Dry-run:** `npm run harbor:hf:upload -- --repo org/name --dry-run` then read `artifacts/hf-upload/README.md` and `manifest.json`.
8. **Confirm:** set `HF_I_UNDERSTAND_UPLOAD=1` only after the checklist is satisfied.

**Steps**

1. Create a token with **write** access: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. (Optional) For a larger bundle later: `npm run harbor:benchmark:v1` then upload with `HF_INCLUDE_BENCHMARK=1`. First upload needs no benchmark step.
3. Preview: `npm run harbor:hf:upload -- --repo org/name --dry-run`
4. First Hub push (private dataset by default):

```bash
export HF_TOKEN=hf_...
export HF_I_UNDERSTAND_UPLOAD=1
npm run harbor:hf:upload -- --repo YOUR_ORG/harbor-intellect-eval-v1 --create
```

Short repo name (resolves your user via whoami):

```bash
export HF_TOKEN=hf_...
export HF_I_UNDERSTAND_UPLOAD=1
npm run harbor:hf:upload -- --repo harbor-intellect-eval-v1 --create
```

**Environment flags:** `HF_ORG`, `HF_PUBLIC=1`, `HF_LICENSE`, `HF_SKIP_BENCHMARK=1`, `HF_INCLUDE_BENCHMARK=1`, `HF_INCLUDE_AGENT=1`, `HF_I_UNDERSTAND_UPLOAD=1`. CLI: `--help`, `--dry-run`.

Implementation: `scripts/harbor-intellect-upload-hf.mjs`, `src/lib/harborIntellectHfDataset.js`. A copy of the pushed files is written under `artifacts/hf-upload/` (gitignored).
