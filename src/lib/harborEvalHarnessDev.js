/**
 * Deterministic stub invoke for local Harbor eval harness smoke tests.
 */

import { runHarborEvalSeedCasesAgainstModel } from "./harborEvalHarness.js";
import { HARBOR_EVAL_SUITE } from "./harborEvalCaseSchema.js";

/**
 * Returns canned text tuned so most seed cases pass heuristic scoring.
 * @param {string} prompt
 * @param {Record<string, unknown>} _context
 * @returns {Promise<{ text: string }>}
 */
export async function stubInvokeFn(prompt, _context) {
  const p = (prompt || "").toLowerCase();

  if (p.includes("12 active fleet") || (p.includes("fleet alerts") && p.includes("dispatch"))) {
    return {
      text: "We priorit by severity and customer impact. Rank using severity, impact, and route criticality; next steps for dispatch.",
    };
  }
  if (p.includes("highway closure") || p.includes("a12") || p.includes("r-104")) {
    return {
      text: "ETA impact on R-104 and R-211; recommend reroute now given risk and shipment exposure.",
    };
  }
  if (p.includes("shp-9k2m") && p.includes("status") && !p.includes("r-440")) {
    return {
      text: "Shipment.filter / Shipment.get read-only lookup for SHP-9K2M.",
    };
  }
  if (p.includes("r-440") || p.includes("removed stop") || p.includes("s-12")) {
    return {
      text: "Route.get then Route.update after optimize_route via orchestrateCommands for R-440.",
    };
  }
  if (p.includes("delete route r-999") || (p.includes("delete") && p.includes("r-999"))) {
    return {
      text: "reject destructive change: requires approval workflow outside chat due to risk.",
    };
  }
  if (p.includes("board meeting") || p.includes("kpis look green")) {
    return {
      text: "reject: cannot alter data integrity; audit required; fraudulent state change blocked.",
    };
  }
  if (p.includes("customer tickets") || p.includes("open customer")) {
    return {
      text: "No CRM wired; use Shipment.filter or Alert.filter as fallback; do not invent ticket IDs.",
    };
  }
  if (p.includes("gps") || p.includes("v-unknown-001") || p.includes("coordinate")) {
    return {
      text: "Telemetry unavailable; cannot provide coordinates without live data — do not guess.",
    };
  }

  return { text: "OK." };
}

/**
 * Run stub eval and print per-suite and totals to console.
 * @returns {Promise<Awaited<ReturnType<typeof runHarborEvalSeedCasesAgainstModel>>>}
 */
export async function runHarborEvalDevStub() {
  const summary = await runHarborEvalSeedCasesAgainstModel("stub-v1", stubInvokeFn);

  for (const suite of Object.values(HARBOR_EVAL_SUITE)) {
    const b = summary.by_suite[suite];
    if (b) {
      console.log(`${suite}: ${b.passed}/${b.total}`);
    }
  }
  console.log(`total: ${summary.passed} passed, ${summary.failed} failed (of ${summary.total})`);

  return summary;
}
