/**
 * Invoke adapters for benchmark harnesses.
 *
 * - createHarborIntellectApiInvokeFn: Harbor Intellect configured endpoint
 * - createBaselineCoreInvokeFn: same base LLM path without Harbor-specific orchestration
 */

/**
 * @param {{ functions: { invoke: (name: string, body: object) => Promise<{ data?: Record<string, unknown> }> } }} base44
 * @returns {(prompt: string, context?: Record<string, unknown>, evalCase?: Record<string, unknown>) => Promise<{ text: string, latency_ms?: number, tool_trace?: unknown, correlation_id?: string, error?: string }>}
 */
export function createHarborIntellectApiInvokeFn(base44) {
  return async function harborIntellectInvoke(prompt, context, evalCase) {
    const t0 = Date.now();
    try {
      const r = await base44.functions.invoke("harborIntellectAPI", {
        message: prompt,
        context: context || {},
        benchmark_case_id: evalCase?.id,
      });
      const data = r?.data;
      const text =
        (data && typeof data.reply === "string" && data.reply) ||
        (data && typeof data.message === "string" && data.message) ||
        (data && typeof data.content === "string" && data.content) ||
        JSON.stringify(data ?? "");

      return {
        text: String(text),
        latency_ms: Date.now() - t0,
        tool_trace: data?.tool_trace,
        correlation_id: data?.correlation_id,
      };
    } catch (e) {
      return {
        text: "",
        latency_ms: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };
}

/**
 * Baseline invoke: route to same base LLM infrastructure (harborCore) in plain command mode,
 * avoiding Harbor-specific wrapper behavior as much as possible.
 *
 * TODO(baseline hardening): if a dedicated generic endpoint exists, switch to that endpoint.
 *
 * @param {{ functions: { invoke: (name: string, body: object) => Promise<{ data?: Record<string, unknown> }> } }} base44
 * @returns {(prompt: string, context?: Record<string, unknown>, evalCase?: Record<string, unknown>) => Promise<{ text: string, latency_ms?: number, tool_trace?: unknown, correlation_id?: string, error?: string }>}
 */
export function createBaselineCoreInvokeFn(base44) {
  return async function baselineInvoke(prompt, context, evalCase) {
    const t0 = Date.now();
    try {
      const baselinePrompt = [
        "You are a general logistics assistant.",
        "Respond directly, avoid domain-specific Harbor assumptions.",
        "Do not assume unavailable integrations.",
        `Task: ${prompt}`,
      ].join("\n");

      const r = await base44.functions.invoke("harborCore", {
        prompt: baselinePrompt,
        mode: "command",
        context: context || {},
        benchmark_case_id: evalCase?.id,
      });
      const data = r?.data;
      const text =
        (data && typeof data.reply === "string" && data.reply) ||
        (data && typeof data.message === "string" && data.message) ||
        (data && typeof data.content === "string" && data.content) ||
        JSON.stringify(data ?? "");

      return {
        text: String(text),
        latency_ms: Date.now() - t0,
        tool_trace: data?.tool_trace,
        correlation_id: data?.correlation_id,
      };
    } catch (e) {
      return {
        text: "",
        latency_ms: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };
}
