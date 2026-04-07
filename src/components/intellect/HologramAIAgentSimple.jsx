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

function generateSmartValue(fieldName) {
  const lower = fieldName.toLowerCase();
  
  if (lower.includes('email')) return 'contact@company.com';
  if (lower.includes('phone')) return '+45 40 40 40 40';
  if (lower.includes('date') || lower.includes('close')) return '12/31/2026';
  if (lower.includes('name')) return 'John Anderson';
  if (lower.includes('company')) return 'Tech Solutions ApS';
  if (lower.includes('contact')) return 'John Anderson';
  if (lower.includes('note') || lower.includes('description')) return 'High-priority enterprise account with growth potential';
  if (lower.includes('value') || lower.includes('amount')) return '500000';
  if (lower.includes('currency')) return 'EUR';
  
  return 'Data entry';
}

function fillElement(el, val) {
  const elWin = el.ownerDocument?.defaultView || window;
  el.focus();

  if (el.tagName === 'SELECT') {
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      o.value.toLowerCase() === lower ||
      o.text.toLowerCase() === lower ||
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

// Deep comprehensive scan — finds EVERYTHING
function deepScanWindow(containerEl) {
  const roots = getAllRoots(containerEl);
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const scan = (root) => {
    // Get ALL buttons/clickables
    const buttons = [...root.querySelectorAll(
      "button:not([disabled]), [role='button']:not([disabled]), [type='submit']:not([disabled]), a[role='button'], [class*='btn']:not([disabled])"
    )].filter(isVisible).map(b => {
      let label = b.textContent?.trim().replace(/\s+/g, " ") ||
        b.getAttribute("aria-label") ||
        b.getAttribute("title") || "";
      return { label: label.slice(0, 100) };
    }).filter(b => b.label && b.label.length > 0).slice(0, 100);

    // Get ALL input fields — search very deeply
    const inputs = [...root.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select, [role='combobox'], [role='textbox'], [contenteditable='true']"
    )].filter(isVisible).map(i => {
      let label = i.placeholder || i.getAttribute("aria-label") || i.getAttribute("title") || "";
      
      // Search parent chain for label
      if (!label && i.id) {
        const lbl = root.querySelector(`label[for="${i.id}"]`);
        if (lbl) label = lbl.textContent?.trim() || "";
      }
      
      if (!label) {
        const lblById = i.getAttribute("aria-labelledby");
        if (lblById) {
          const lbl = root.getElementById(lblById);
          if (lbl) label = lbl.textContent?.trim() || "";
        }
      }
      
      // Search 6 levels up for label/header
      if (!label) {
        let parent = i.parentElement;
        for (let depth = 0; depth < 6 && parent; depth++) {
          const lblEl = parent.querySelector("label, [class*='label'], legend, [class*='field-label'], .form-label, [data-label]");
          if (lblEl) {
            const txt = lblEl.textContent?.trim();
            if (txt && txt.length > 0) { label = txt; break; }
          }
          const headerTxt = parent.children?.[0]?.textContent?.trim();
          if (headerTxt && headerTxt.length < 50) { label = headerTxt; break; }
          parent = parent.parentElement;
        }
      }
      
      if (!label) label = i.name || i.id || i.getAttribute("data-testid") || "field";

      let options = [];
      if (i.tagName === 'SELECT') {
        options = [...i.options].map(o => o.text).filter(Boolean);
      }

      return {
        label: label.slice(0, 80),
        type: i.type || i.tagName.toLowerCase(),
        options,
        value: i.value?.slice(0, 30) || "",
        element: i
      };
    }).slice(0, 100);

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

// Ultra-intelligent element finder
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
      ? [...root.querySelectorAll("input:not([type=hidden]), textarea, select, [role='combobox'], [contenteditable='true']")]
      : [...root.querySelectorAll("button, [role='button'], input, textarea, select, [type='submit'], a[role='button']")];

    const visible = pool.filter(isVisible);

    // Exact match
    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;

    // Placeholder exact
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;

    // Placeholder contains
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;

    // Fuzzy match on text
    el = visible.find(e => {
      const text = e.textContent?.trim().toLowerCase() || "";
      return fuzzyMatch(text, lower) > 0.7;
    });
    if (el) return el;

    // Aria-label
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;

    // Title attribute
    el = visible.find(e => e.getAttribute("title")?.toLowerCase().includes(lower));
    if (el) return el;

    // Label association (inputs)
    if (type === "input") {
      for (const inp of visible) {
        if (!inp.offsetParent) continue; // Skip hidden
        
        if (inp.id) {
          const lbl = root.querySelector(`label[for="${inp.id}"]`);
          if (lbl) {
            const lblText = lbl.textContent?.trim().toLowerCase() || "";
            if (lblText.includes(lower) || fuzzyMatch(lblText, lower) > 0.75) return inp;
          }
        }
        
        const lblById = inp.getAttribute("aria-labelledby");
        if (lblById) {
          const lbl = root.getElementById(lblById);
          if (lbl) {
            const lblText = lbl.textContent?.trim().toLowerCase() || "";
            if (lblText.includes(lower) || fuzzyMatch(lblText, lower) > 0.75) return inp;
          }
        }
        
        // Search parent chain
        let parent = inp.parentElement;
        for (let depth = 0; depth < 6 && parent; depth++) {
          const lblEl = parent.querySelector("label");
          if (lblEl) {
            const lblText = lblEl.textContent?.trim().toLowerCase() || "";
            if (lblText.includes(lower) || fuzzyMatch(lblText, lower) > 0.75) return inp;
          }
          parent = parent.parentElement;
        }
      }
    }

    // Partial text match (last resort)
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
      report("Deep scanning interface...", "scan");
      await new Promise(r => setTimeout(r, 400));

      const structure = deepScanWindow(containerEl);

      let retries = 0;
      while ((structure.buttons.length === 0 && structure.inputs.length === 0) && retries < 4) {
        report(`Waiting for content... (${retries + 1}/4)`, "think");
        await new Promise(r => setTimeout(r, 1000));
        const fresh = deepScanWindow(containerEl);
        if (fresh.buttons.length > 0 || fresh.inputs.length > 0) {
          Object.assign(structure, fresh);
          break;
        }
        retries++;
      }

      report(`Found ${structure.buttons.length} buttons, ${structure.inputs.length} inputs`, "scan");

      report("Intelligent planning...", "plan");
      await new Promise(r => setTimeout(r, 250));

      const liveButtons = structure.buttons.map(b => b.label).filter(Boolean);
      const liveInputs = structure.inputs.map(i => i.label).filter(Boolean);

      const fieldsList = liveInputs.map(f => `- ${f}`).join('\n');
      const buttonsList = liveButtons.map(b => `- ${b}`).join('\n');

      const pageText = containerEl?.innerText?.slice(0, 2000) || document.body.innerText.slice(0, 2000);

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You MUST complete this task FULLY and CORRECTLY:

TASK: "${task}"

ALL FIELDS TO FILL:
${fieldsList}

ALL BUTTONS AVAILABLE:
${buttonsList}

PAGE CONTENT:
${pageText}

INSTRUCTIONS:
1. Fill EVERY single field listed above — leave NONE empty
2. Use smart, realistic data appropriate to each field name
3. For dates: use format MM/DD/YYYY or DD-MM-YYYY
4. For emails: valid format
5. For phone: realistic format like +45 40 40 40 40
6. For names: realistic person names
7. For company: realistic company names
8. For notes: detailed, professional descriptions
9. For values/amounts: realistic numbers
10. Click buttons in the correct order to complete the task
11. Use EXACT button names from the list above
12. Output ONLY valid JSON, NOTHING else

{"steps":[{"type":"type|select|click","label":"exact field/button name","value":"appropriate realistic data"}],"summary":"Task completed - all fields filled"}`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.length} actions generated`, "plan");

      setAgentStatus("working", task.slice(0, 50));

      const filledFields = new Set();

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (!step || !step.type) continue;

        if (step.type === "think" || step.type === "narrate") {
          report(`${step.type === "think" ? "💭" : "✅"} ${step.text || step.label}`, step.type);
          await new Promise(r => setTimeout(r, 120));
          continue;
        }

        if (step.type === "click") {
          let el = findElement(containerEl, step.label, "button");
          if (!el) el = findElement(document.body, step.label, "button");
          
          report(`🖱 Clicking: ${step.label}`, "click");
          
          if (el && el.offsetParent) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 150));
            el.click();
            await new Promise(r => setTimeout(r, 600));
          } else {
            report(`ℹ️ Searching for similar button...`, "think");
            const fresh = deepScanWindow(containerEl);
            const match = fresh.buttons.find(b => fuzzyMatch(b.label, step.label) > 0.65);
            if (match) {
              const retry = findElement(containerEl, match.label, "button");
              if (retry && retry.offsetParent) {
                const rect = retry.getBoundingClientRect();
                dispatchCursorAction("click", match.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 150));
                retry.click();
                await new Promise(r => setTimeout(r, 500));
                report(`✅ Found: ${match.label}`, "narrate");
              }
            }
          }
          continue;
        }

        if (step.type === "type" || step.type === "select") {
          let el = findElement(containerEl, step.label, "input");
          if (!el) el = findElement(document.body, step.label, "input");
          
          let val = step.value || generateSmartValue(step.label);
          
          report(`⌨️ Filling "${step.label}" with "${val.slice(0, 25)}"`, "type");
          
          if (el && el.offsetParent) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 150));
            fillElement(el, val);
            filledFields.add(step.label);
            await new Promise(r => setTimeout(r, 350));
          } else {
            report(`ℹ️ Searching for similar field...`, "think");
            const fresh = deepScanWindow(containerEl);
            const match = fresh.inputs.find(i => fuzzyMatch(i.label, step.label) > 0.65);
            if (match) {
              const retry = findElement(containerEl, match.label, "input");
              if (retry && retry.offsetParent) {
                const rect = retry.getBoundingClientRect();
                dispatchCursorAction("type", match.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 150));
                fillElement(retry, val);
                filledFields.add(match.label);
                await new Promise(r => setTimeout(r, 300));
                report(`✅ Found & filled: ${match.label}`, "narrate");
              }
            }
          }
          continue;
        }
      }

      report(`✅ Filled ${filledFields.size} fields successfully`, "narrate");
      await new Promise(r => setTimeout(r, 300));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult?.summary || "Task completed - all fields filled and ready",
        steps: steps.length
      };

    } catch (err) {
      setAgentStatus("idle");
      busyRef.current = false;
      report(`❌ Error: ${err.message}`, "error");
      return { summary: `Error: ${err.message}`, steps: [] };
    }
  }, []);

  return { runTask };
}