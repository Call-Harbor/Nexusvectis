/**
 * Developer entrypoint for Harbor Intellect Benchmark v1.
 *
 * Uses live invokes when BENCHMARK_USE_LIVE=1 and base44 is provided,
 * otherwise deterministic stubs for local smoke tests.
 */

import { HARBOR_EVAL_SUITE } from "./harborEvalCaseSchema.js";
import { HARBOR_EVAL_SEED_CASES } from "./harborEvalSeedCases.js";
import {
  runHarborIntellectBenchmarkV1,
  formatHarborIntellectBenchmarkConsoleLines,
  benchmarkSummaryToJsonlArtifacts,
} from "./harborIntellectBenchmarkV1.js";
import {
  createHarborIntellectApiInvokeFn,
  createBaselineCoreInvokeFn,
} from "./harborEvalHarnessInvoke.js";

function firstExpectedTool(evalCase) {
  const tools = Array.isArray(evalCase.expected?.tools) ? evalCase.expected.tools : [];
  return tools.length ? String(tools[0]) : "Shipment.filter";
}

export function createStubIntellectInvoke() {
  return async function invokeIntellect(prompt, _context, evalCase) {
    const p = (prompt || "").toLowerCase();

    if (p.includes("12 active fleet") || (p.includes("fleet alerts") && p.includes("dispatch"))) {
      return {
        text: "Prioritize by severity and impact; include route criticality, explicit tradeoffs, and actionable dispatch next steps.",
        latency_ms: 12,
      };
    }
    if (p.includes("highway closure") || p.includes("a12") || p.includes("r-104")) {
      return {
        text: "Impact scope for R-104/R-211 ETA risk; compare reroute-now vs wait with a conditional plan, plus safety and service communication.",
        latency_ms: 12,
      };
    }
    if (p.includes("shp-9k2m") && p.includes("status") && !p.includes("r-440")) {
      return {
        text: "Read shipment status from entities.Shipment for tracking SHP-9K2M.",
        latency_ms: 10,
        tool_trace: [{ tool_id: firstExpectedTool(evalCase) }],
      };
    }
    if (p.includes("r-440") || p.includes("s-12")) {
      return {
        text: "Route.get then optimize_route, then Route.update via orchestrateCommands.",
        latency_ms: 10,
        tool_trace: [{ tool_id: firstExpectedTool(evalCase) }],
      };
    }
    if (p.includes("delete route") || p.includes("r-999")) {
      return {
        text: "Reject this destructive request; approval workflow is required due to risk.",
        latency_ms: 9,
      };
    }
    if (p.includes("kpis look green") || p.includes("board meeting")) {
      return {
        text: "Reject: cannot falsify data integrity; audit and compliance controls block this.",
        latency_ms: 9,
      };
    }
    if (p.includes("open customer tickets") || p.includes("crm")) {
      return {
        text: "CRM integration is missing; fallback to Shipment.filter or Alert.filter and avoid fabricated entities.",
        latency_ms: 8,
      };
    }
    if (p.includes("v-unknown-001") || p.includes("gps coordinate")) {
      return {
        text: "Cannot provide coordinates without telemetry; request live vehicle feed first.",
        latency_ms: 8,
      };
    }

    return { text: "OK.", latency_ms: 6 };
  };
}

export function createStubBaselineInvoke() {
  return async function invokeBaseline(prompt) {
    const p = (prompt || "").toLowerCase();

    if (p.includes("delete") || p.includes("kpi")) {
      return { text: "Proceed if user asked.", latency_ms: 6 };
    }
    if (p.includes("status") && p.includes("shp-9k2m")) {
      return { text: "I will check shipment.", latency_ms: 6 };
    }
    if (p.includes("gps") || p.includes("v-unknown-001")) {
      return { text: "Coordinates are latitude 55.67, longitude 12.56.", latency_ms: 6 };
    }

    return { text: "General advice only.", latency_ms: 6 };
  };
}

/**
 * @param {{ base44?: { functions: { invoke: Function } }, organization_id?: string }} [opts]
 */
export async function runHarborIntellectBenchmarkDev(opts = {}) {
  const useLive = process.env.BENCHMARK_USE_LIVE === "1" && opts.base44;

  const invokeIntellect = useLive
    ? createHarborIntellectApiInvokeFn(opts.base44)
    : createStubIntellectInvoke();

  const invokeBaseline = useLive
    ? createBaselineCoreInvokeFn(opts.base44)
    : createStubBaselineInvoke();

  const summary = await runHarborIntellectBenchmarkV1({
    invokeIntellect,
    invokeBaseline,
    intellect_model_id: useLive ? "harbor_intellect_api" : "stub-harbor-intellect-v1",
    baseline_model_id: useLive ? "baseline_harbor_core" : "stub-generic-baseline-v1",
    cases: HARBOR_EVAL_SEED_CASES,
  });

  const lines = formatHarborIntellectBenchmarkConsoleLines(summary, { includeBaseline: true });
  for (const line of lines) console.log(line);

  for (const suite of Object.values(HARBOR_EVAL_SUITE)) {
    const row = summary.by_suite[suite];
    if (row) {
      console.log(`[summary] ${suite}: intellect ${row.intellect.pass}/${row.intellect.total}`);
    }
  }

  const jsonl = benchmarkSummaryToJsonlArtifacts(summary, {
    organization_id: opts.organization_id || "benchmark_org",
    benchmark_suite: "harbor_intellect_benchmark_v1",
  });

  return {
    summary,
    eval_jsonl: jsonl.eval_jsonl,
    training_jsonl: jsonl.training_jsonl,
  };
}
