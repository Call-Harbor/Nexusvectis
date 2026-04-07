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

// Fuzzy string matching — find similar strings even with typos/spacing
function fuzzyMatch(source, target) {
  const s = source.toLowerCase().replace(/\s+/g, '');
  const t = target.toLowerCase().replace(/\s+/g, '');
  if (s === t) return 1.0;
  if (s.includes(t) || t.includes(s)) return 0.9;
  
  let matches = 0;
  for (let i = 0; i < Math.min(s.length, t.length); i++) {
    if (s[i] === t[i]) matches++;
  }
  return matches / Math.max(s.length, t.length);
}

function fillElement(el, val) {
  const elWin = el.ownerDocument?.defaultView || window;
  el.focus();

  if (el.tagName === 'SELECT') {
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      o.value.toLowerCase() === lower ||
      o.text.toLowerCase() === lower ||
      o.text.toLowerCase().includes(lower) ||
      fuzzyMatch(o.text, val) > 0.7
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

// Intelligent element finder with multiple strategies
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

    // Strategy 1: Exact text match
    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;

    // Strategy 2: Exact placeholder match
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;

    // Strategy 3: Placeholder contains
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;

    // Strategy 4: Fuzzy text match (for similar text)
    el = visible.find(e => {
      const text = e.textContent?.trim().toLowerCase() || "";
      return fuzzyMatch(text, lower) > 0.75;
    });
    if (el) return el;

    // Strategy 5: Aria-label
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;

    // Strategy 6: Label association (for inputs)
    if (type === "input") {
      for (const inp of visible) {
        if (inp.id) {
          const lbl = root.querySelector(`label[for="${inp.id}"]`);
          if (lbl) {
            const lblText = lbl.textContent?.trim().toLowerCase() || "";
            if (lblText.includes(lower) || fuzzyMatch(lblText, lower) > 0.75) return inp;
          }
        }
        let parent = inp.parentElement;
        for (let depth = 0; depth < 4 && parent; depth++) {
          const lblEl = parent.querySelector("label");
          if (lblEl) {
            const lblText = lblEl.textContent?.trim().toLowerCase() || "";
            if (lblText.includes(lower) || fuzzyMatch(lblText, lower) > 0.75) return inp;
          }
          parent = parent.parentElement;
        }
      }
    }

    // Strategy 7: Partial match in text
    el = visible.find(e => {
      const text = e.textContent?.trim().toLowerCase() || "";
      return text.includes(lower) && lower.length > 2;
    });
    if (el) return el;
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

      report("Planning actions with intelligence...", "plan");
      await new Promise(r => setTimeout(r, 200));

      const liveButtons = structure.buttons.map(b => b.label).filter(Boolean);
      const liveInputs = structure.inputs.map(i => `${i.label}`).filter(Boolean);

      const fieldsList = liveInputs.map(f => `- ${f}`).join('\n');
      const buttonsList = liveButtons.map(b => `- ${b}`).join('\n');

      // Get full page text to understand context better
      const pageText = containerEl?.innerText?.slice(0, 1500) || document.body.innerText.slice(0, 1500);

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ultra-intelligent AI agent. Complete this task by any means necessary:

TASK: "${task}"

AVAILABLE FIELDS:
${fieldsList || '(none)'}

AVAILABLE BUTTONS:
${buttonsList || '(none)'}

PAGE CONTEXT:
${pageText}

CRITICAL DIRECTIVES:
1. Fill EVERY field with realistic, context-appropriate data
2. Use button names EXACTLY as listed
3. If a field name looks like it needs: address → use realistic address, email → use valid email, phone → use realistic phone, date → use valid date format
4. Complete the task systematically and intelligently
5. Do NOT skip any step
6. Think like an expert user who never makes mistakes

Output ONLY valid JSON (no markdown, no text outside JSON):
{"steps":[{"type":"click|type|select","label":"exact field/button name","value":"realistic data for the field"}],"summary":"brief success message"}`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.filter(s => ["click", "type", "select"].includes(s.type)).length} actions`, "plan");

      setAgentStatus("working", task.slice(0, 50));

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "think" || step.type === "narrate") {
          report(`${step.type === "think" ? "💭" : "✅"} ${step.text || step.label}`, step.type);
          await new Promise(r => setTimeout(r, 100));
          continue;
        }

        if (step.type === "click") {
          let el = findElement(containerEl, step.label, "button");
          if (!el) el = findElement(document.body, step.label, "button");
          
          report(`🖱 Click: ${step.label}`, "click");
          
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 120));
            el.click();
            await new Promise(r => setTimeout(r, 500));
          } else {
            // Intelligent retry: rescan and try again
            report(`⚠️ "${step.label}" not found, rescanning...`, "think");
            await new Promise(r => setTimeout(r, 300));
            const fresh = deepScanWindow(containerEl);
            const btnMatch = fresh.buttons.find(b => fuzzyMatch(b.label, step.label) > 0.7);
            if (btnMatch) {
              const retry = findElement(containerEl, btnMatch.label, "button");
              if (retry) {
                const rect = retry.getBoundingClientRect();
                dispatchCursorAction("click", btnMatch.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 120));
                retry.click();
                await new Promise(r => setTimeout(r, 400));
                report(`✅ Found & clicked: ${btnMatch.label}`, "narrate");
              }
            }
          }
          continue;
        }

        if (step.type === "type" || step.type === "select") {
          let el = findElement(containerEl, step.label, "input");
          if (!el) el = findElement(document.body, step.label, "input");
          
          const val = step.value || "";
          report(`⌨️ ${step.type === "select" ? "Select" : "Type"}: "${val.slice(0, 20)}" → ${step.label}`, "type");
          
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 120));
            fillElement(el, val);
            await new Promise(r => setTimeout(r, 300));
          } else {
            // Intelligent retry: find similar field
            report(`⚠️ "${step.label}" not found, rescanning...`, "think");
            await new Promise(r => setTimeout(r, 300));
            const fresh = deepScanWindow(containerEl);
            const inputMatch = fresh.inputs.find(i => fuzzyMatch(i.label, step.label) > 0.7);
            if (inputMatch) {
              const retry = findElement(containerEl, inputMatch.label, "input");
              if (retry) {
                const rect = retry.getBoundingClientRect();
                dispatchCursorAction("type", inputMatch.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 120));
                fillElement(retry, val);
                await new Promise(r => setTimeout(r, 250));
                report(`✅ Found & filled: ${inputMatch.label}`, "narrate");
              }
            } else {
              report(`ℹ️ Field not found after retry, continuing...`, "think");
            }
          }
          continue;
        }
      }

      await new Promise(r => setTimeout(r, 300));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult?.summary || "Task completed successfully",
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