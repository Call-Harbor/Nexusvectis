import { useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

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

function getAllRoots(containerEl) {
  const roots = [];
  if (!containerEl) { roots.push(document.body); return roots; }
  const iframes = containerEl.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) roots.push(doc.body);
    } catch {}
  }
  roots.push(containerEl);
  if (!roots.includes(document.body)) roots.push(document.body);
  return roots;
}

function fillElement(el, val) {
  const elWin = el.ownerDocument?.defaultView || window;
  el.focus();

  if (el.tagName === 'SELECT') {
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      o.value.toLowerCase() === lower ||
      o.text.toLowerCase() === lower ||
      o.text.toLowerCase().includes(lower)
    );
    if (opt) {
      const nativeSetter = Object.getOwnPropertyDescriptor(elWin.HTMLSelectElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(el, opt.value);
      else el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
    return;
  }

  if (el.type === 'checkbox' || el.type === 'radio') {
    const shouldCheck = /true|yes|1|on|check/i.test(val);
    if (el.checked !== shouldCheck) el.click();
    return;
  }

  const proto = el.tagName === 'TEXTAREA'
    ? elWin.HTMLTextAreaElement.prototype
    : elWin.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (setter) setter.call(el, '');
  else el.value = '';
  el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  
  if (setter) setter.call(el, val);
  else el.value = val;
  
  el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: val }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true }));
  
  el.blur();
  setTimeout(() => el.focus(), 10);
}

function deepScanWindow(containerEl) {
  const roots = getAllRoots(containerEl);
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const scan = (root) => {
    const buttons = [...root.querySelectorAll(
      "button:not([disabled]), [role='button']:not([disabled]), [type='submit']:not([disabled])"
    )].filter(isVisible).map(b => {
      let label = b.textContent?.trim().replace(/\s+/g, " ") ||
        b.getAttribute("aria-label") ||
        b.getAttribute("title") || "";
      return { label: label.slice(0, 80) };
    }).filter(b => b.label).slice(0, 50);

    const inputs = [...root.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select, [role='combobox']"
    )].filter(isVisible).map(i => {
      let label = i.placeholder || i.getAttribute("aria-label") || "";
      if (!label && i.id) {
        const lbl = root.querySelector(`label[for="${i.id}"]`);
        if (lbl) label = lbl.textContent?.trim() || "";
      }
      if (!label) label = i.name || i.id || "field";

      let options = [];
      if (i.tagName === 'SELECT') {
        options = [...i.options].map(o => o.text).filter(Boolean);
      }

      return {
        label: label.slice(0, 60),
        type: i.type || i.tagName.toLowerCase(),
        options,
        value: i.value?.slice(0, 30) || ""
      };
    }).slice(0, 40);

    return { buttons, inputs };
  };

  let merged = { buttons: [], inputs: [] };
  for (const root of roots) {
    const r = scan(root);
    if (r.buttons.length > merged.buttons.length) merged.buttons = r.buttons;
    if (r.inputs.length > merged.inputs.length) merged.inputs = r.inputs;
  }

  return merged;
}

function findElement(containerEl, label, type) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();
  const roots = getAllRoots(containerEl);
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  for (const root of roots) {
    const pool = type === "input"
      ? [...root.querySelectorAll("input:not([type=hidden]), textarea, select, [role='combobox']")]
      : [...root.querySelectorAll("button, [role='button'], input, textarea, select, [type='submit']")];

    const visible = pool.filter(isVisible);

    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => {
      const text = e.textContent?.trim().toLowerCase() || "";
      return text.includes(lower) && (lower.length > 3 || text === lower);
    });
    if (el) return el;
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;

    if (type === "input") {
      for (const inp of visible) {
        if (inp.id) {
          const lbl = root.querySelector(`label[for="${inp.id}"]`);
          if (lbl && lbl.textContent?.trim().toLowerCase().includes(lower)) return inp;
        }
        let parent = inp.parentElement;
        for (let depth = 0; depth < 3 && parent; depth++) {
          const lblEl = parent.querySelector("label");
          if (lblEl && lblEl.textContent?.trim().toLowerCase().includes(lower)) return inp;
          parent = parent.parentElement;
        }
      }
    }
  }
  return null;
}

export function useHologramAIAgent() {
  const busyRef = useRef(false);

  const runTask = useCallback(async (containerEl, windowType, task, orgId, onStep) => {
    if (busyRef.current) return { summary: "Agent busy", steps: [] };
    busyRef.current = true;

    const report = (text, phase) => {
      setAgentStatus("working", text.slice(0, 60));
      onStep?.({ text, phase });
    };

    try {
      report("Scanning interface...", "scan");
      await new Promise(r => setTimeout(r, 300));

      const structure = deepScanWindow(containerEl);

      let retries = 0;
      while ((structure.buttons.length === 0 && structure.inputs.length === 0) && retries < 3) {
        report(`Waiting for content... (${retries + 1}/3)`, "think");
        await new Promise(r => setTimeout(r, 800));
        const fresh = deepScanWindow(containerEl);
        if (fresh.buttons.length > 0 || fresh.inputs.length > 0) {
          Object.assign(structure, fresh);
          break;
        }
        retries++;
      }

      report(`Found ${structure.buttons.length} buttons, ${structure.inputs.length} inputs`, "scan");

      report("Planning actions...", "plan");
      await new Promise(r => setTimeout(r, 200));

      const liveButtons = structure.buttons.map(b => b.label).filter(Boolean);
      const liveInputs = structure.inputs.map(i => `${i.label}`).filter(Boolean);

      const fieldsList = liveInputs.map(f => `- ${f}`).join('\n');
      const buttonsList = liveButtons.map(b => `- ${b}`).join('\n');

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Opgave: "${task}"\n\nFELTER:\n${fieldsList || '(ingen)'}\n\nKNAPPER:\n${buttonsList || '(ingen)'}\n\nUdfyld ALLE felter med realistisk data. Output KUN JSON:\n{"steps":[{"type":"click|type|select","label":"felt/knap","value":"data"}],"summary":"done"}`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.filter(s => ["click", "type", "select"].includes(s.type)).length} handlinger`, "plan");

      setAgentStatus("working", task.slice(0, 50));

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "think" || step.type === "narrate") {
          report(`${step.type === "think" ? "💭" : "✅"} ${step.text || step.label}`, step.type);
          await new Promise(r => setTimeout(r, 80));
          continue;
        }

        if (step.type === "click") {
          const el = findElement(containerEl, step.label, "button")
            || findElement(document.body, step.label, "button");
          report(`🖱 Click: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 100));
            el.click();
            await new Promise(r => setTimeout(r, 400));
          } else {
            report(`⚠️ Knap "${step.label}" ikke fundet`, "think");
          }
          continue;
        }

        if (step.type === "type" || step.type === "select") {
          const el = findElement(containerEl, step.label, "input")
            || findElement(document.body, step.label, "input");
          const val = step.value || "";
          report(`⌨️ ${step.type === "select" ? "Vælg" : "Skriv"}: "${val.slice(0, 20)}" i ${step.label}`, "type");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 100));
            fillElement(el, val);
            await new Promise(r => setTimeout(r, 250));
          } else {
            report(`⚠️ Felt "${step.label}" ikke fundet`, "think");
          }
          continue;
        }
      }

      await new Promise(r => setTimeout(r, 200));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult?.summary || "Opgave fuldført",
        steps: steps.length
      };

    } catch (err) {
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Fejl: ${err.message}`, steps: [] };
    }
  }, []);

  return { runTask };
}