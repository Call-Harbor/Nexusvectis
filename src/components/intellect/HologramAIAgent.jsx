import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * HologramAIAgent — given a hologram window ref + a task string,
 * this agent reads the DOM structure, asks the LLM what actions to take,
 * then executes them one-by-one with human-like timing and visual cursor events.
 *
 * Usage:
 *   const { runTask } = useHologramAIAgent();
 *   await runTask(windowRef, "Create a new shipment from Copenhagen to Hamburg");
 */

function dispatch(type, label, selector, value) {
  window.dispatchEvent(new CustomEvent("harbor_ai_action", {
    detail: { type, label, selector, value }
  }));
}

function setStatus(status, task) {
  window.dispatchEvent(new CustomEvent("harbor_ai_status", {
    detail: { status, task }
  }));
}

function extractWindowDOM(containerEl) {
  if (!containerEl) return { buttons: [], inputs: [], tabs: [], text: "" };

  const buttons = [...containerEl.querySelectorAll("button:not([disabled])")].map(b => ({
    label: b.textContent?.trim().slice(0, 60),
    visible: b.getBoundingClientRect().width > 0
  })).filter(b => b.label && b.visible).slice(0, 30);

  const inputs = [...containerEl.querySelectorAll("input:not([type=hidden]), textarea, select")].map(i => ({
    label: i.placeholder || i.name || i.id || i.getAttribute("aria-label") || "input",
    type: i.type || i.tagName.toLowerCase(),
    value: i.value || ""
  })).slice(0, 20);

  const tabs = [...containerEl.querySelectorAll("[role='tab'], [data-tab]")].map(t => ({
    label: t.textContent?.trim().slice(0, 40)
  })).filter(t => t.label).slice(0, 15);

  const headings = [...containerEl.querySelectorAll("h1,h2,h3,h4,p,span")].map(h => h.textContent?.trim()).filter(Boolean).slice(0, 20).join(" | ");

  return { buttons, inputs, tabs, text: headings.slice(0, 600) };
}

export function useHologramAIAgent() {
  const busyRef = useRef(false);

  const runTask = useCallback(async (windowRef, windowType, task, orgId) => {
    if (busyRef.current) {
      toast.error("AI Agent is already working");
      return;
    }
    busyRef.current = true;
    setStatus("thinking", `Analyzing ${windowType.replace(/_/g, " ")}...`);

    try {
      // 1. Extract DOM structure from the window
      const structure = extractWindowDOM(windowRef);

      // 2. Ask LLM to plan a sequence of UI actions
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent operating a logistics software UI. You must complete this task: "${task}"

The current window is: "${windowType.replace(/_/g, " ")}"

Available UI elements:
BUTTONS: ${structure.buttons.map(b => `"${b.label}"`).join(", ") || "none"}
INPUT FIELDS: ${structure.inputs.map(i => `"${i.label}" (${i.type})`).join(", ") || "none"}
TABS: ${structure.tabs.map(t => `"${t.label}"`).join(", ") || "none"}
VISIBLE TEXT SUMMARY: ${structure.text || "not available"}

Return a step-by-step JSON plan. Each step is ONE action:
- { "type": "click", "label": "exact button/tab text from available list" }
- { "type": "type", "label": "exact input placeholder/label", "value": "what to type" }
- { "type": "scroll", "label": "scroll down" }
- { "type": "narrate", "text": "brief explanation of what you are doing" }

Rules:
1. Only use labels that EXACTLY match what is available above.
2. Keep it realistic - max 8 steps.
3. Start with a narrate step explaining your plan.
4. If you cannot complete the task with available elements, explain why in a narrate step.
${orgId ? `5. Organization ID for any data operations: ${orgId}` : ""}

Return JSON: { "steps": [...], "summary": "one sentence what you accomplished" }`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  label: { type: "string" },
                  value: { type: "string" },
                  text: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      const steps = plan.steps || [];
      if (steps.length === 0) {
        setStatus("idle");
        busyRef.current = false;
        return { summary: "Could not determine actions for this task", steps: [] };
      }

      setStatus("working", task.slice(0, 50));

      // 3. Execute steps with human-like delays
      let delay = 200;
      for (const step of steps) {
        if (step.type === "narrate") {
          // Narrate step: just update status text
          await new Promise(r => setTimeout(r, 400));
          setStatus("working", step.text?.slice(0, 60) || task.slice(0, 60));
          delay = 600;
          continue;
        }

        await new Promise(r => setTimeout(r, delay));

        if (step.type === "click") {
          dispatch("click", step.label, null, null);
          delay = 800 + Math.random() * 400;
        } else if (step.type === "type") {
          dispatch("type", step.label, null, step.value || "");
          delay = Math.max(800, (step.value?.length || 5) * 60 + 500);
        } else if (step.type === "scroll") {
          dispatch("scroll", step.label || "down", null, null);
          delay = 600;
        }
      }

      // Small delay then done
      await new Promise(r => setTimeout(r, 1200));
      setStatus("idle");
      busyRef.current = false;
      return { summary: plan.summary || "Task completed", steps };

    } catch (err) {
      setStatus("idle");
      busyRef.current = false;
      toast.error(`AI Agent error: ${err.message}`);
      return { summary: `Error: ${err.message}`, steps: [] };
    }
  }, []);

  return { runTask };
}