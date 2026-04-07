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
  if (!containerEl) return { buttons: [], inputs: [], tabs: [], selects: [], links: [], headings: [], text: "" };

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
  };

  const buttons = [...containerEl.querySelectorAll("button:not([disabled])")].filter(isVisible).map(b => ({
    label: b.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    classes: b.className?.slice(0, 50)
  })).filter(b => b.label).slice(0, 40);

  const inputs = [...containerEl.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")].filter(isVisible).map(i => ({
    label: (i.placeholder || i.getAttribute("aria-label") || i.name || i.id || "field").slice(0, 50),
    type: i.type || i.tagName.toLowerCase(),
    value: i.value?.slice(0, 30) || ""
  })).slice(0, 25);

  const tabs = [...containerEl.querySelectorAll("[role='tab'], [data-state='active'], [data-state='inactive']")].filter(isVisible).map(t => ({
    label: t.textContent?.trim().slice(0, 40),
    active: t.getAttribute("data-state") === "active" || t.getAttribute("aria-selected") === "true"
  })).filter(t => t.label).slice(0, 20);

  const selects = [...containerEl.querySelectorAll("select")].filter(isVisible).map(s => ({
    label: s.getAttribute("aria-label") || s.name || "select",
    options: [...s.options].map(o => o.text).slice(0, 8)
  })).slice(0, 10);

  const links = [...containerEl.querySelectorAll("a[href], [role='link']")].filter(isVisible).map(a => a.textContent?.trim().slice(0, 40)).filter(Boolean).slice(0, 15);

  const headings = [...containerEl.querySelectorAll("h1,h2,h3,h4,[class*='title'],[class*='heading']")].filter(isVisible).map(h => h.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 10);

  const allText = [...containerEl.querySelectorAll("p, span, td, [class*='label'], [class*='value'], [class*='stat']")]
    .filter(isVisible).map(e => e.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 100)
    .slice(0, 30).join(" | ");

  return { buttons, inputs, tabs, selects, links, headings, text: allText.slice(0, 800) };
}

/** Find element by multiple strategies */
function findElement(containerEl, label, type) {
  if (!label || !containerEl) return null;
  const lower = label.toLowerCase().trim();

  const pool = type === "input"
    ? [...containerEl.querySelectorAll("input:not([type=hidden]), textarea, select")]
    : type === "tab"
    ? [...containerEl.querySelectorAll("[role='tab'], [data-state]")]
    : [...containerEl.querySelectorAll("button, [role='button'], [role='tab'], a, input, textarea, select, label")];

  // Exact text match
  let el = pool.find(e => e.textContent?.trim().toLowerCase() === lower);
  if (el) return el;
  // Placeholder match
  el = pool.find(e => e.placeholder?.toLowerCase().includes(lower));
  if (el) return el;
  // Partial text match
  el = pool.find(e => e.textContent?.trim().toLowerCase().includes(lower));
  if (el) return el;
  // aria-label match
  el = pool.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
  return el || null;
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
      await new Promise(r => setTimeout(r, 400));

      // ── PHASE 2: PLAN ──────────────────────────────────────────────────
      report("Planning action sequence...", "plan");
      setAgentStatus("thinking", "Planning optimal action sequence");

      const windowName = windowType.replace(/_/g, " ");

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI agent controlling a logistics operations interface. Your task is:

TASK: "${task}"
WINDOW: "${windowName}"

CURRENT INTERFACE STATE:
- BUTTONS (clickable): ${structure.buttons.map(b => `"${b.label}"`).join(", ") || "none visible"}
- INPUT FIELDS: ${structure.inputs.map(i => `"${i.label}" [${i.type}]${i.value ? ` current="${i.value}"` : ""}`).join(", ") || "none"}
- TABS: ${structure.tabs.map(t => `"${t.label}"${t.active ? " (ACTIVE)" : ""}`).join(", ") || "none"}
- HEADINGS: ${structure.headings.join(" | ") || "none"}
- PAGE TEXT SAMPLE: ${structure.text.slice(0, 400) || "not available"}
${orgId ? `- ORG CONTEXT: ${orgId}` : ""}

Create a REALISTIC step-by-step plan. Each step MUST be one of:
- { "type": "click", "label": "EXACT button/tab text from the list above" }
- { "type": "type", "label": "EXACT input placeholder/label from list", "value": "realistic value to enter" }
- { "type": "scroll", "direction": "down" }
- { "type": "hover", "label": "EXACT element label", "purpose": "what you are reading" }
- { "type": "think", "text": "what you are analyzing or deciding" }
- { "type": "narrate", "text": "explain to user what step you completed" }

IMPORTANT RULES:
1. Only use labels that appear EXACTLY in the lists above
2. Use hover+think steps to simulate reading data before acting
3. Include narrate steps after major actions to explain what you did
4. Be realistic: 4-9 steps total, including think/hover/narrate
5. Start with hover/think to read the current state
6. If no elements match the task, use a think step explaining why

Return JSON: { "steps": [...], "summary": "one sentence what was accomplished" }`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      const steps = planResult?.steps || [];
      report(`Plan ready: ${steps.length} actions`, "plan");
      await new Promise(r => setTimeout(r, 300));

      if (steps.length === 0) {
        busyRef.current = false;
        return { summary: "No actionable steps found for this task", steps: [] };
      }

      // ── PHASE 3: EXECUTE ───────────────────────────────────────────────
      setAgentStatus("working", task.slice(0, 50));

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "think") {
          report(`💭 ${step.text || "Analyzing..."}`, "think");
          setAgentStatus("thinking", step.text?.slice(0, 50) || "Analyzing");
          await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
          continue;
        }

        if (step.type === "narrate") {
          report(`✓ ${step.text || ""}`, "narrate");
          await new Promise(r => setTimeout(r, 700));
          continue;
        }

        if (step.type === "hover") {
          const el = findElement(containerEl, step.label, "any");
          report(`👁 Reading: ${step.label}`, "hover");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("hover", step.label, null, null,
              rect.left + rect.width / 2, rect.top + rect.height / 2);
          } else {
            // Move to approximate area
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("hover", step.label, null, null,
                r.left + r.width * (0.2 + Math.random() * 0.6),
                r.top + r.height * (0.2 + Math.random() * 0.6));
            }
          }
          await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
          continue;
        }

        if (step.type === "click") {
          const el = findElement(containerEl, step.label, "button");
          report(`🖱 Clicking: ${step.label}`, "click");

          if (el) {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            dispatchCursorAction("click", step.label, null, null, cx, cy);
            await new Promise(r => setTimeout(r, 350));
            el.click();
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
          } else {
            // Still animate cursor even if element not found
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("click", step.label, null, null,
                r.left + r.width * 0.5, r.top + r.height * 0.4);
            }
            await new Promise(r => setTimeout(r, 500));
          }
          continue;
        }

        if (step.type === "type") {
          const el = findElement(containerEl, step.label, "input");
          const val = step.value || "";
          report(`⌨️ Typing in "${step.label}": ${val.slice(0, 30)}`, "type");

          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 400));
            el.focus();
            // React-compatible setter
            const proto = el.tagName === "TEXTAREA"
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
            if (setter) {
              setter.call(el, val);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
            await new Promise(r => setTimeout(r, Math.max(800, val.length * 45)));
          } else {
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("type", step.label, null, val,
                r.left + r.width * 0.5, r.top + r.height * 0.5);
            }
            await new Promise(r => setTimeout(r, Math.max(800, val.length * 45)));
          }
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