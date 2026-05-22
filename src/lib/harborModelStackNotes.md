# Harbor model stack — notes

## Eval harness entrypoint

- **`src/lib/harborEvalHarness.js`** — `scoreHarborEvalCaseOutput`, `runHarborEvalSeedCasesAgainstModel`, `harnessSummaryToEvalRunRecords`, `TOOL_ROUTING_NOT_VALIDATED_REASON`. Scoring uses text heuristics (`answer_contains`, governance, tool routing hints); when `expected.tools` is set, `TOOL_ROUTING_NOT_VALIDATED_REASON` is recorded because tool choice cannot be fully validated from free text.
- Re-exported from **`src/lib/harborEvalStarterKit.js`** for consumers that already use the starter kit barrel.

## Stub script (local smoke)

- **`npm run harbor:eval:dev`** runs `scripts/harbor-eval-dev.mjs`, which calls `runHarborEvalDevStub()` in `harborEvalHarnessDev.js` (deterministic `stubInvokeFn`).
- Requires Node to resolve `@/lib/*` imports (see `package.json` → `imports`).

## Optional `harborIntellectAPI` invoke

- **`src/lib/harborEvalHarnessInvoke.js`** — `createHarborIntellectApiInvokeFn(base44)` wraps `base44.functions.invoke('harborIntellectAPI', { message, context })` and returns `{ text, latencyMs?, error? }` for use with `runHarborEvalSeedCasesAgainstModel`.

## Next steps

- JSONL export of eval runs (wire `harnessSummaryToEvalRunRecords` to a writer).
- Run real model + regression in CI (replace stub with `createHarborIntellectApiInvokeFn` or provider client).
