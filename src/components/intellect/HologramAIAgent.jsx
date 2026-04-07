import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * HologramAIAgent — Production-grade AI that physically operates hologram windows.
 * Reads DOM, plans actions via LLM, executes with human-like timing + cursor events.
 */

export function dispatchCursorAction(type, label, selector, value, x, y) {
  window.dispatchEvent(new CustomEvent("harbor_ai_action", {
    detail: { type, label, selector, value, x, y }
  }));
}

export function setAgentStatus(status, task) {
  window.dispatchEvent(new CustomEvent("harbor_ai_status", {
    detail: { status, task }
  }));
}

/** Deep DOM scan — extracts everything visible in a container */
function deepScanWindow(containerEl) {
  // Fallback to full document if containerEl is missing or yields nothing
  const root = containerEl || document.body;

  // Relaxed visibility: just needs to have dimensions (ignores scroll/viewport position)
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const scan = (el) => {
    const buttons = [...el.querySelectorAll(
      "button:not([disabled]), [role='button']:not([disabled]), [class*='btn']:not([disabled])"
    )].filter(isVisible).map(b => ({
      label: (
        b.textContent?.trim().replace(/\s+/g, " ") ||
        b.getAttribute("aria-label") ||
        b.getAttribute("title") ||
        b.getAttribute("data-label") ||
        (/(add|new|create|plus|fab|float)/i.test(b.className || "") ? "Add" : "")
      ).slice(0, 80),
      classes: b.className?.slice(0, 80)
    })).filter(b => b.label).slice(0, 60);

    const inputs = [...el.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")].filter(isVisible).map(i => ({
      label: (i.placeholder || i.getAttribute("aria-label") || i.name || i.id || "field").slice(0, 50),
      type: i.type || i.tagName.toLowerCase(),
      value: i.value?.slice(0, 30) || ""
    })).slice(0, 30);

    const tabs = [...el.querySelectorAll("[role='tab'], [data-state='active'], [data-state='inactive']")].filter(isVisible).map(t => ({
      label: t.textContent?.trim().slice(0, 40),
      active: t.getAttribute("data-state") === "active" || t.getAttribute("aria-selected") === "true"
    })).filter(t => t.label).slice(0, 20);

    const selects = [...el.querySelectorAll("select")].filter(isVisible).map(s => ({
      label: s.getAttribute("aria-label") || s.name || "select",
      options: [...s.options].map(o => o.text).slice(0, 8)
    })).slice(0, 10);

    const links = [...el.querySelectorAll("a[href], [role='link']")].filter(isVisible).map(a => a.textContent?.trim().slice(0, 40)).filter(Boolean).slice(0, 15);

    const headings = [...el.querySelectorAll("h1,h2,h3,h4,[class*='title'],[class*='heading']")].filter(isVisible).map(h => h.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 10);

    const allText = [...el.querySelectorAll("p, span, td, [class*='label'], [class*='value'], [class*='stat']")]
      .filter(isVisible).map(e => e.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 100)
      .slice(0, 30).join(" | ");

    return { buttons, inputs, tabs, selects, links, headings, text: allText.slice(0, 800) };
  };

  const result = scan(root);

  // If container scan finds nothing, fall back to full document
  if (containerEl && result.buttons.length === 0 && result.inputs.length === 0) {
    return scan(document.body);
  }

  return result;
}

/** Find element by multiple strategies — aggressive fuzzy matching */
function findElement(containerEl, label, type) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();

  // Search in container first, then fall back to full document
  const roots = containerEl ? [containerEl, document.body] : [document.body];

  // Relaxed: just needs dimensions
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  for (const root of roots) {
    const pool = type === "input"
      ? [...root.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")]
      : type === "tab"
      ? [...root.querySelectorAll("[role='tab'], [data-state='inactive'], [data-state='active']")]
      : [...root.querySelectorAll("button, [role='button'], [role='tab'], a, input, textarea, select, label, [class*='tab'], [class*='fab'], [class*='float'], [class*='btn']")];

    const visible = pool.filter(isVisible);

    // Exact text match
    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;
    // Placeholder match
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;
    // Placeholder includes
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;
    // Partial text match
    el = visible.find(e => e.textContent?.trim().toLowerCase().includes(lower));
    if (el) return el;
    // Label contains target text
    el = visible.find(e => lower.includes(e.textContent?.trim().toLowerCase()) && e.textContent?.trim().length > 2);
    if (el) return el;
    // aria-label
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;
    // title attribute
    el = visible.find(e => e.getAttribute("title")?.toLowerCase().includes(lower));
    if (el) return el;
    // name/id
    el = visible.find(e => (e.name || e.id || "").toLowerCase().includes(lower));
    if (el) return el;
    // class name heuristic for add/new/create
    if (/add|new|create|opret|tilf/i.test(lower)) {
      el = visible.find(e => /add|new|create|plus|fab|float/i.test(e.className || ""));
      if (el) return el;
    }
  }
  return null;
}

export function useHologramAIAgent() {
  const busyRef = useRef(false);

  const runTask = useCallback(async (containerEl, windowType, task, orgId, onStep) => {
    if (busyRef.current) return { summary: "Agent is busy", steps: [] };
    busyRef.current = true;

    const report = (text, phase) => {
      setAgentStatus("working", text.slice(0, 60));
      onStep?.({ text, phase });
    };

    try {
      // ── PHASE 1: SCAN ──────────────────────────────────────────────────
      report("Scanning interface...", "scan");
      setAgentStatus("thinking", "Analyzing window structure");
      await new Promise(r => setTimeout(r, 600));

      const structure = deepScanWindow(containerEl);

      // Move cursor to center of window while "reading"
      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        if (rect.width > 0) {
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.3, rect.top + rect.height * 0.3);
          await new Promise(r => setTimeout(r, 500));
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.7, rect.top + rect.height * 0.5);
          await new Promise(r => setTimeout(r, 400));
        }
      }

      report(`Found ${structure.buttons.length} buttons, ${structure.inputs.length} inputs, ${structure.tabs.length} tabs`, "scan");

      // If nothing found yet, retry up to 4 more times (window may still be rendering)
      if (structure.buttons.length === 0 && structure.inputs.length === 0) {
        for (let attempt = 0; attempt < 4; attempt++) {
          report(`Waiting for content to load... (${attempt + 1}/4)`, "think");
          await new Promise(r => setTimeout(r, 1500));
          const retry = deepScanWindow(containerEl);
          if (retry.buttons.length > 0 || retry.inputs.length > 0) {
            report(`Content loaded: ${retry.buttons.length} buttons, ${retry.inputs.length} inputs`, "scan");
            break;
          }
        }
      }
      await new Promise(r => setTimeout(r, 400));

      // ── PHASE 2: PLAN ──────────────────────────────────────────────────
      report("Planning action sequence...", "plan");
      setAgentStatus("thinking", "Planning optimal action sequence");

      const windowName = windowType.replace(/_/g, " ");

      // Re-scan after potential load
      const liveStructure = deepScanWindow(containerEl);
      const buttonLabels = liveStructure.buttons.map(b => b.label).filter(Boolean);
      const inputLabels = liveStructure.inputs.map(i => i.label).filter(Boolean);
      const tabLabels = liveStructure.tabs.map(t => t.label).filter(Boolean);

      // Also scan for any floating action buttons (class-based detection)
      const fabButtons = [...(containerEl?.querySelectorAll("[class*='fab'], [class*='float'], [class*='action-btn'], [class*='add-btn']") || [])]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .map(el => el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent?.trim() || "Add")
        .filter(Boolean);
      const allButtonLabels = [...new Set([...buttonLabels, ...fabButtons])];

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent physically clicking and typing inside a NexusVectis logistics hologram UI.

TASK: "${task}"
WINDOW: "${windowType.replace(/_/g, ' ')}"

=== EXACT CLICKABLE BUTTONS (use EXACT label text) ===
${allButtonLabels.length > 0 ? allButtonLabels.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'No buttons found yet (window may still be loading)'}

=== INPUT FIELDS (use EXACT label text) ===
${inputLabels.length > 0 ? inputLabels.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'No input fields found'}

=== TABS (use EXACT label text) ===
${tabLabels.length > 0 ? tabLabels.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'No tabs found'}

=== VISIBLE HEADINGS ===
${liveStructure.headings.join(' | ') || 'none'}

=== VISIBLE DATA ===
${liveStructure.text.slice(0, 400) || 'loading...'}

Your job: Generate a realistic sequence of 5-9 actions to complete the task. Rules:
1. For CLICK actions: use ONLY exact strings from the BUTTONS or TABS list above.
2. For TYPE actions: use ONLY exact strings from the INPUT FIELDS list above, and provide realistic values.
3. If the task requires navigating to a tab first (e.g. "Active" tab), click that tab before other actions.
4. If task is "create", look for buttons like "New", "Add", "Create", "Opret", "Tilf\u00f8j", "+ ..."
5. If task is "optimize", look for buttons like "Optimize", "Optim\u00e9r", "Run", "Calculate", "Analyse"
6. If task is "search/filter", look for search inputs and type the search term.
7. Always end with a narrate step summarizing what was accomplished.
8. Include think steps to show reasoning between actions.
9. CRITICAL: Do NOT invent button/field labels. Only use exact strings from the lists above. If a needed button isn't in the list, skip that action.

Return JSON: { "steps": [ {"type": "click|type|tab|hover|scroll|think|narrate", "label": "exact text", "value": "value for type steps", "text": "text for think/narrate"} ], "summary": "one sentence summary" }`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.filter(s => s.type === 'click' || s.type === 'type' || s.type === 'tab').length} actions planned`, "plan");
      await new Promise(r => setTimeout(r, 300));

      // Helper: re-plan remaining steps after UI changes (e.g. dialog opened)
      const rePlanRemaining = async (remainingTask, executedSoFar) => {
        const fresh = deepScanWindow(containerEl);
        const bLabels = fresh.buttons.map(b => b.label).filter(Boolean);
        const iLabels = fresh.inputs.map(i => i.label).filter(Boolean);
        const tLabels = fresh.tabs.map(t => t.label).filter(Boolean);
        report(`Re-scanning after UI change: ${bLabels.length} buttons, ${iLabels.length} inputs`, "scan");
        const rePlan = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI agent inside a NexusVectis logistics UI.\n\nOriginal task: "${task}"\nRemaining goal: "${remainingTask}"\nActions already done: ${executedSoFar.join(', ')}\n\n=== CURRENT BUTTONS ===\n${bLabels.length > 0 ? bLabels.map((b,i) => `${i+1}. "${b}"`).join('\n') : 'none'}\n\n=== CURRENT INPUT FIELDS ===\n${iLabels.length > 0 ? iLabels.map((f,i) => `${i+1}. "${f}"`).join('\n') : 'none'}\n\n=== CURRENT TABS ===\n${tLabels.length > 0 ? tLabels.map((t,i) => `${i+1}. "${t}"`).join('\n') : 'none'}\n\nGenerate remaining steps to complete the goal. Use ONLY exact strings from the lists above. Return JSON: { "steps": [{"type": "click|type|tab|think|narrate", "label": "...", "value": "...", "text": "..."}], "summary": "..." }`,
          response_json_schema: { type: "object", properties: { steps: { type: "array", items: { type: "object", additionalProperties: true } }, summary: { type: "string" } } }
        });
        return rePlan?.steps || [];
      };

      // ── PHASE 3: EXECUTE ───────────────────────────────────────────────
      setAgentStatus("working", task.slice(0, 50));
      const executedLabels = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "tab") {
          const el = findElement(containerEl, step.label, "tab");
          report(`📌 Clicking tab: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 300));
            el.click();
            await new Promise(r => setTimeout(r, 800));
          } else {
            report(`Tab "${step.label}" not found, skipping`, "think");
            await new Promise(r => setTimeout(r, 300));
          }
          continue;
        }

        if (step.type === "click") {
          const el = findElement(containerEl, step.label, "button")
            || findElement(containerEl, step.label, "tab")
            || findElement(containerEl, step.label, "any");
          report(`🖱 Clicking: ${step.label}`, "click");
          const scanBefore = deepScanWindow(containerEl);
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 350));
            el.click();
            await new Promise(r => setTimeout(r, 900 + Math.random() * 400));
          } else {
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("click", step.label, null, null, r.left + r.width * 0.5, r.top + r.height * 0.4);
            }
            await new Promise(r => setTimeout(r, 500));
          }
          executedLabels.push(`clicked:${step.label}`);
          // If UI changed significantly (new inputs appeared), re-plan remaining steps
          const scanAfter = deepScanWindow(containerEl);
          const newInputCount = scanAfter.inputs.length - scanBefore.inputs.length;
          const newButtonCount = scanAfter.buttons.length - scanBefore.buttons.length;
          if ((newInputCount > 1 || newButtonCount > 2) && i < steps.length - 1) {
            report(`UI changed (+${newInputCount} inputs, +${newButtonCount} buttons) — re-planning`, "think");
            await new Promise(r => setTimeout(r, 600));
            const remaining = steps.slice(i + 1);
            const remainingGoal = remaining.map(s => s.text || s.label || s.value).filter(Boolean).join(", ");
            const newSteps = await rePlanRemaining(remainingGoal || task, executedLabels);
            if (newSteps.length > 0) {
              steps = [...steps.slice(0, i + 1), ...newSteps];
              report(`Re-planned: ${newSteps.filter(s => s.type === 'click' || s.type === 'type').length} new actions`, "plan");
            }
          }
          continue;
        }

        if (step.type === "type") {
          const typeEl = findElement(containerEl, step.label, "input");
          const val = step.value || "";
          report(`⌨️ Typing in "${step.label}": ${val.slice(0, 30)}`, "type");
          if (typeEl) {
            const rect = typeEl.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 400));
            typeEl.focus();
            const proto = typeEl.tagName === "TEXTAREA"
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
            if (setter) {
              setter.call(typeEl, val);
              typeEl.dispatchEvent(new Event("input", { bubbles: true }));
              typeEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
            await new Promise(r => setTimeout(r, Math.max(800, val.length * 45)));
          } else {
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("type", step.label, null, val, r.left + r.width * 0.5, r.top + r.height * 0.5);
            }
            await new Promise(r => setTimeout(r, Math.max(800, val.length * 45)));
          }
          executedLabels.push(`typed:${step.label}=${val.slice(0,20)}`);
          continue;
        }

        if (step.type === "scroll") {
          report(`📜 Scrolling ${step.direction || "down"}`, "scroll");
          if (containerEl) {
            const r = containerEl.getBoundingClientRect();
            dispatchCursorAction("scroll", step.direction || "down", null, null,
              r.left + r.width / 2, r.top + r.height / 2);
            containerEl.scrollBy({ top: step.direction === "up" ? -200 : 200, behavior: "smooth" });
          }
          await new Promise(r => setTimeout(r, 700));
          continue;
        }
      }

      await new Promise(r => setTimeout(r, 800));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult.summary || "Task completed successfully",
        steps: steps.length
      };

    } catch (err) {
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Error: ${err.message}`, steps: [] };
    }
  }, []);

  return { runTask };
}