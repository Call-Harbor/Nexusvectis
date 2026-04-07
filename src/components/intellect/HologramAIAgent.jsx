import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * HologramAIAgent — AI that physically operates hologram windows.
 * Has pre-trained knowledge of every module's UI so it doesn't rely
 * solely on DOM scanning. Fast execution — faster than a human.
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

// ── Pre-trained UI knowledge for every module ─────────────────────────────
// Gives the agent reliable knowledge WITHOUT needing perfect DOM scan
const MODULE_KNOWLEDGE = {
  routes: {
    description: "Route management page. Lists all routes.",
    buttons: ["Create Route", "Export", "AI Route Optimizer"],
    inputs: ["Search by name, origin, destination..."],
    tabs: [],
    dialogs: {
      "Create Route": {
        buttons: ["Create Route", "AI Plan", "Manual Editor"],
        inputs: ["e.g. Copenhagen-Aarhus Express", "e.g. Copenhagen", "e.g. Aarhus", "Route Name", "Origin", "Destination"],
        selects: ["Transport Type", "Priority"]
      }
    }
  },
  fleet: {
    description: "Fleet vehicle list.",
    buttons: ["Add Vehicle", "Export"],
    inputs: ["Search vehicles..."],
    tabs: ["All", "Active", "Maintenance", "Offline"],
    dialogs: { "Add Vehicle": { inputs: ["Vehicle Name", "Driver", "Destination"] } }
  },
  fleet_map: {
    description: "Live GPS tracking map.",
    buttons: ["Filter", "Refresh"],
    inputs: ["Search vehicle..."],
    tabs: ["All", "Active", "Trucks", "Ships", "Drones"]
  },
  shipments: {
    description: "Shipment management.",
    buttons: ["New Shipment", "Export", "Import"],
    inputs: ["Search shipments...", "Tracking Number", "Origin", "Destination"],
    tabs: ["All", "Pending", "In Transit", "Delivered", "Delayed"]
  },
  alerts: {
    description: "System alerts.",
    buttons: ["Mark all read", "Dismiss", "Resolve"],
    inputs: ["Search alerts..."],
    tabs: ["All", "Critical", "Warning", "Info"]
  },
  predictive_maintenance: {
    description: "AI predictive maintenance panel.",
    buttons: ["Schedule Maintenance", "Run Analysis", "Export"],
    inputs: [],
    tabs: ["Overview", "Vehicles", "Schedule"]
  },
  performance_analytics: {
    description: "KPI dashboard.",
    buttons: ["Export", "Refresh"],
    inputs: [],
    tabs: ["Overview", "Vehicles", "Routes", "Emissions"]
  },
  demand_forecast: {
    description: "AI demand forecasting.",
    buttons: ["Generate Forecast", "Export"],
    inputs: [],
    tabs: ["30 Days", "60 Days", "90 Days"]
  },
  risk_assessment: {
    description: "Risk analysis dashboard.",
    buttons: ["Run Assessment", "Export"],
    inputs: [],
    tabs: ["Overview", "Routes", "Vehicles", "Incidents"]
  },
  port_command: {
    description: "Port Command Center.",
    buttons: ["Add Vessel", "Schedule Berth", "Add Call", "Refresh"],
    inputs: ["Search..."],
    tabs: ["Vessels", "Berths", "Containers", "Cranes", "Yard", "Gates"]
  },
  airport_ops: {
    description: "Airport Ops Center.",
    buttons: ["Add Flight", "Assign Gate", "Refresh"],
    inputs: ["Search flight..."],
    tabs: ["Live Dashboard", "Flights", "Gates", "Baggage", "Ground Handling", "Security", "Turnaround", "Staff", "Landside"]
  },
  document_editor: {
    description: "AI document editor.",
    buttons: ["New Document", "Save", "Export PDF", "AI Generate"],
    inputs: ["Document title...", "Search templates..."],
    tabs: ["My Documents", "Templates", "Shared"]
  },
  project_management: {
    description: "Kanban project board.",
    buttons: ["New Task", "New Project", "Add Column"],
    inputs: ["Task title...", "Search..."],
    tabs: ["Board", "List", "Timeline"]
  },
  route_optimizer: {
    description: "AI route optimizer for existing routes.",
    buttons: ["Run Optimization", "Apply", "Export", "Optimize All"],
    inputs: [],
    tabs: ["Overview", "Savings", "Routes"]
  },
  swarm_intelligence: {
    description: "Multi-vehicle swarm coordination.",
    buttons: ["Activate Swarm", "Configure", "Run Analysis"],
    inputs: [],
    tabs: []
  },
  digital_twin: {
    description: "Digital twin federation.",
    buttons: ["Create Twin", "Simulate", "Refresh"],
    inputs: [],
    tabs: ["Overview", "Assets", "Simulation"]
  },
  news_intelligence: {
    description: "Live logistics news with AI analysis.",
    buttons: ["Refresh", "Filter"],
    inputs: ["Search news..."],
    tabs: ["All", "Disruptions", "Regulatory", "Market"]
  },
  satellite_weather: {
    description: "Satellite weather and route weather impact.",
    buttons: ["Refresh", "Toggle Layer"],
    inputs: [],
    tabs: ["Map", "Forecast", "Alerts"]
  },
  deep_analysis: {
    description: "Deep AI data analysis.",
    buttons: ["Run Analysis", "Export"],
    inputs: ["Analysis query..."],
    tabs: []
  },
};

/** Deep DOM scan — extracts everything visible in a container */
function deepScanWindow(containerEl) {
  const root = containerEl || document.body;

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

    const headings = [...el.querySelectorAll("h1,h2,h3,h4,[class*='title'],[class*='heading']")].filter(isVisible).map(h => h.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 10);

    const allText = [...el.querySelectorAll("p, span, td, [class*='label'], [class*='value'], [class*='stat']")]
      .filter(isVisible).map(e => e.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 100)
      .slice(0, 30).join(" | ");

    return { buttons, inputs, tabs, headings, text: allText.slice(0, 600) };
  };

  const result = scan(root);

  if (containerEl && result.buttons.length === 0 && result.inputs.length === 0) {
    return scan(document.body);
  }

  return result;
}

/** Find element by multiple strategies */
function findElement(containerEl, label, type) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();

  const roots = containerEl ? [containerEl, document.body] : [document.body];

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

    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => e.textContent?.trim().toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => lower.includes(e.textContent?.trim().toLowerCase()) && e.textContent?.trim().length > 2);
    if (el) return el;
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => e.getAttribute("title")?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => (e.name || e.id || "").toLowerCase().includes(lower));
    if (el) return el;
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
      // ── PHASE 1: SCAN ─────────────────────────────────────────────────
      report("Scanning interface...", "scan");
      setAgentStatus("thinking", "Analyzing window structure");
      await new Promise(r => setTimeout(r, 200));

      const structure = deepScanWindow(containerEl);

      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        if (rect.width > 0) {
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.3, rect.top + rect.height * 0.3);
          await new Promise(r => setTimeout(r, 100));
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.7, rect.top + rect.height * 0.5);
          await new Promise(r => setTimeout(r, 80));
        }
      }

      // Retry scan if empty (window still rendering)
      let liveStructure = structure;
      if (structure.buttons.length === 0 && structure.inputs.length === 0) {
        for (let attempt = 0; attempt < 3; attempt++) {
          report(`Waiting for content... (${attempt + 1}/3)`, "think");
          await new Promise(r => setTimeout(r, 700));
          const retry = deepScanWindow(containerEl);
          if (retry.buttons.length > 0 || retry.inputs.length > 0) {
            liveStructure = retry;
            break;
          }
        }
      }

      report(`Found ${liveStructure.buttons.length} buttons, ${liveStructure.inputs.length} inputs`, "scan");

      // ── PHASE 2: PLAN ─────────────────────────────────────────────────
      report("Planning actions...", "plan");
      setAgentStatus("thinking", "Planning optimal action sequence");

      const knowledge = MODULE_KNOWLEDGE[windowType] || null;

      // Merge pre-trained knowledge with live scan
      const liveButtons = liveStructure.buttons.map(b => b.label).filter(Boolean);
      const liveInputs = liveStructure.inputs.map(i => i.label).filter(Boolean);
      const liveTabs = liveStructure.tabs.map(t => t.label).filter(Boolean);

      const knownButtons = knowledge?.buttons || [];
      const knownInputs = knowledge?.inputs || [];
      const knownTabs = knowledge?.tabs || [];

      // Also scan FABs
      const fabButtons = [...(containerEl?.querySelectorAll("[class*='fab'], [class*='float'], [class*='action-btn'], [class*='add-btn']") || [])]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .map(el => el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent?.trim() || "Add")
        .filter(Boolean);

      const allButtons = [...new Set([...liveButtons, ...fabButtons, ...knownButtons])];
      const allInputs = [...new Set([...liveInputs, ...knownInputs])];
      const allTabs = [...new Set([...liveTabs, ...knownTabs])];

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent operating the NexusVectis logistics platform — physically clicking buttons and typing in forms, FASTER than a human.

TASK: "${task}"
MODULE: "${windowType.replace(/_/g, ' ')}"
${knowledge ? `MODULE INFO: ${knowledge.description}` : ''}

=== BUTTONS (pre-trained + live scan — use EXACT text) ===
${allButtons.length > 0 ? allButtons.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'None detected yet — UI may still be loading'}

=== INPUT FIELDS (use EXACT placeholder/label text) ===
${allInputs.length > 0 ? allInputs.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'None'}

=== TABS ===
${allTabs.length > 0 ? allTabs.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'None'}

=== VISIBLE DATA ===
${liveStructure.text.slice(0, 400) || 'loading...'}

RULES:
1. Generate 3-8 steps. Be concise and direct — no unnecessary hover/think steps.
2. CLICK steps: use button labels from the BUTTONS list above. Even if not in live scan, use known button names.
3. TYPE steps: use EXACT input placeholder from INPUT FIELDS. Provide realistic values.
4. For "create" tasks: click the primary creation button (e.g. "Create Route", "Add Vehicle", "New Shipment").
5. After clicking a create button, a dialog will open — fill its fields and click the submit button inside.
6. For "search/filter": type directly in the search input.
7. For "navigate to tab": use tab step type.
8. Always end with a narrate step summarizing what was accomplished.
9. If a button is in the KNOWN list but not live scan, still plan to click it — it may just not be visible yet.

Return JSON only:
{ "steps": [ {"type": "click|type|tab|think|narrate|scroll", "label": "...", "value": "...", "text": "..."} ], "summary": "one sentence summary" }`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.filter(s => ["click","type","tab"].includes(s.type)).length} actions`, "plan");

      // ── Helpers ────────────────────────────────────────────────────────
      const getActiveDialog = () => document.querySelector(
        '[role="dialog"][data-state="open"], [role="dialog"].fixed, [role="alertdialog"], [data-radix-dialog-content]'
      );

      const rePlanRemaining = async (remainingTask, executedSoFar) => {
        const dialog = getActiveDialog();
        const scanRoot = dialog || containerEl;
        const fresh = deepScanWindow(scanRoot);
        const bLabels = [...new Set([...fresh.buttons.map(b => b.label), ...(knowledge?.dialogs?.[executedSoFar.find(e => e.startsWith('clicked:'))?.replace('clicked:', '')] || knowledge)?.buttons || []])].filter(Boolean);
        const iLabels = [...new Set([...fresh.inputs.map(i => i.label), ...(knowledge?.dialogs?.[executedSoFar.find(e => e.startsWith('clicked:'))?.replace('clicked:', '')] || knowledge)?.inputs || []])].filter(Boolean);
        const tLabels = fresh.tabs.map(t => t.label).filter(Boolean);
        report(`Re-scanning ${dialog ? 'dialog' : 'window'}: ${bLabels.length} buttons, ${iLabels.length} inputs`, "scan");
        const rePlan = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI agent inside NexusVectis UI.\n\nOriginal task: "${task}"\nRemaining goal: "${remainingTask}"\nDone so far: ${executedSoFar.join(', ')}\n\n=== CURRENT BUTTONS ===\n${bLabels.length > 0 ? bLabels.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'none'}\n\n=== CURRENT INPUT FIELDS ===\n${iLabels.length > 0 ? iLabels.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'none'}\n\n=== CURRENT TABS ===\n${tLabels.length > 0 ? tLabels.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'none'}\n\nGenerate remaining steps. ONLY use exact strings from lists above. JSON: { "steps": [{"type": "click|type|tab|think|narrate", "label": "...", "value": "...", "text": "..."}], "summary": "..." }`,
          response_json_schema: { type: "object", properties: { steps: { type: "array", items: { type: "object", additionalProperties: true } }, summary: { type: "string" } } }
        });
        return rePlan?.steps || [];
      };

      // ── PHASE 3: EXECUTE ──────────────────────────────────────────────
      setAgentStatus("working", task.slice(0, 50));
      const executedLabels = [];
      let activeRoot = containerEl;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "think") {
          report(`💭 ${step.text || step.label}`, "think");
          await new Promise(r => setTimeout(r, 80));
          continue;
        }

        if (step.type === "narrate") {
          report(`✅ ${step.text || step.label}`, "narrate");
          continue;
        }

        if (step.type === "tab") {
          const el = findElement(activeRoot, step.label, "tab");
          report(`📌 Tab: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            el.click();
            await new Promise(r => setTimeout(r, 300));
          }
          continue;
        }

        if (step.type === "click") {
          const el = findElement(activeRoot, step.label, "button")
            || findElement(activeRoot, step.label, "tab")
            || findElement(document.body, step.label, "button")
            || findElement(document.body, step.label, "any");
          report(`🖱 Click: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            el.click();
            await new Promise(r => setTimeout(r, 350));
          } else {
            report(`⚠️ Button "${step.label}" not found — trying anyway`, "think");
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("click", step.label, null, null, r.left + r.width * 0.5, r.top + r.height * 0.4);
            }
            await new Promise(r => setTimeout(r, 200));
          }
          executedLabels.push(`clicked:${step.label}`);

          // Check if dialog opened
          await new Promise(r => setTimeout(r, 250));
          const dialog = getActiveDialog();
          if (dialog && activeRoot !== dialog) {
            activeRoot = dialog;
            report(`💬 Dialog opened — re-planning form fields`, "think");
            if (i < steps.length - 1) {
              const remaining = steps.slice(i + 1);
              const remainingGoal = remaining.map(s => s.text || s.label || s.value).filter(Boolean).join(", ");
              const newSteps = await rePlanRemaining(remainingGoal || task, executedLabels);
              if (newSteps.length > 0) {
                steps = [...steps.slice(0, i + 1), ...newSteps];
                report(`Re-planned: ${newSteps.filter(s => ["click","type"].includes(s.type)).length} new actions`, "plan");
              }
            }
          }
          continue;
        }

        if (step.type === "type") {
          const typeEl = findElement(activeRoot, step.label, "input")
            || findElement(document.body, step.label, "input");
          const val = step.value || "";
          report(`⌨️ Type "${val.slice(0, 25)}" in ${step.label}`, "type");
          if (typeEl) {
            const rect = typeEl.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
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
            await new Promise(r => setTimeout(r, 150));
          } else {
            report(`⚠️ Input "${step.label}" not found`, "think");
            await new Promise(r => setTimeout(r, 100));
          }
          executedLabels.push(`typed:${step.label}=${val.slice(0, 20)}`);
          continue;
        }

        if (step.type === "scroll") {
          report(`📜 Scroll ${step.direction || "down"}`, "scroll");
          if (containerEl) {
            const r = containerEl.getBoundingClientRect();
            dispatchCursorAction("scroll", step.direction || "down", null, null, r.left + r.width / 2, r.top + r.height / 2);
            containerEl.scrollBy({ top: step.direction === "up" ? -200 : 200, behavior: "smooth" });
          }
          await new Promise(r => setTimeout(r, 250));
          continue;
        }
      }

      await new Promise(r => setTimeout(r, 200));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult.summary || "Task completed",
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