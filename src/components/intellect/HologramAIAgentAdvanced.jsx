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

// Find all visible documents (main + iframes)
function getAllRoots(containerEl) {
  const roots = [];
  if (!containerEl) { roots.push(document); return roots; }
  
  const iframes = containerEl.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) roots.push(doc);
    } catch {}
  }
  roots.push(document);
  return roots;
}

// Find the active dialog (Radix UI or HTML dialog)
function findActiveDialog(containerEl) {
  let dialog = null;
  
  // Check main document first (Radix portals)
  dialog = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"], [role="dialog"]:not([hidden])');
  if (dialog) return dialog;
  
  // Check container
  if (containerEl) {
    dialog = containerEl.querySelector('[role="dialog"], [role="alertdialog"]');
    if (dialog && dialog.offsetHeight > 0) return dialog;
  }
  
  // Check iframes
  const iframes = containerEl?.querySelectorAll('iframe') || [];
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const d = doc?.querySelector('[role="dialog"], [role="alertdialog"]');
      if (d && d.offsetHeight > 0) return d;
    } catch {}
  }
  
  return null;
}

// Smart element finding with multiple strategies
function findElement(doc, label, type = "any") {
  if (!doc || !label) return null;
  
  const lower = label.toLowerCase().trim();
  const selector = type === "input" 
    ? "input, textarea, select, [role='combobox'], [role='searchbox']"
    : type === "button"
    ? "button, [role='button'], [type='submit']"
    : "*";

  let elements = doc.querySelectorAll(selector);
  
  // Filter visible
  elements = [...elements].filter(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  });

  // Exact text match
  let el = elements.find(e => e.textContent?.trim().toLowerCase() === lower);
  if (el) return el;

  // Placeholder match (inputs)
  el = elements.find(e => e.placeholder?.toLowerCase() === lower);
  if (el) return el;

  // Aria-label match
  el = elements.find(e => e.getAttribute('aria-label')?.toLowerCase().includes(lower));
  if (el) return el;

  // Text contains
  el = elements.find(e => e.textContent?.trim().toLowerCase().includes(lower));
  if (el) return el;

  // Label association (for inputs)
  for (const inp of elements) {
    if (inp.id && doc.querySelector(`label[for="${inp.id}"]`)) {
      const lbl = doc.querySelector(`label[for="${inp.id}"]`);
      if (lbl?.textContent?.toLowerCase().includes(lower)) return inp;
    }
  }

  return elements[0] || null;
}

// Scan all visible elements
function scanDialog(dialog) {
  const fields = [];
  const buttons = [];

  if (!dialog) return { fields, buttons };

  const inputs = [...dialog.querySelectorAll("input, textarea, select, [role='combobox'], [contenteditable='true']")];
  const btns = [...dialog.querySelectorAll("button, [role='button'], [type='submit']")];

  for (const inp of inputs) {
    const rect = inp.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    let label = inp.placeholder || inp.getAttribute("aria-label") || inp.name || "";
    if (!label && inp.id) {
      const lbl = dialog.querySelector(`label[for="${inp.id}"]`);
      if (lbl) label = lbl.textContent?.trim() || "";
    }

    fields.push({
      label: label.slice(0, 60),
      element: inp,
      type: inp.type || inp.tagName.toLowerCase(),
      value: inp.value || ""
    });
  }

  for (const btn of btns) {
    const rect = btn.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    const label = btn.textContent?.trim().slice(0, 60) || 
      btn.getAttribute("aria-label") || 
      btn.getAttribute("title") || "";

    if (label) {
      buttons.push({
        label,
        element: btn,
        disabled: btn.disabled || btn.getAttribute("aria-disabled") === "true"
      });
    }
  }

  return { fields, buttons };
}

// Fill element with proper React event handling
function fillInput(el, val) {
  if (!el || !val) return;

  try {
    el.focus();
  } catch {}

  if (el.tagName === 'SELECT') {
    const opt = [...el.options].find(o => o.text.toLowerCase().includes(val.toLowerCase()));
    if (opt) {
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  if (el.type === 'checkbox' || el.type === 'radio') {
    if (!el.checked) el.click();
    return;
  }

  // Clear field
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  // Set value with React support
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, val);
  } else {
    el.value = val;
  }

  // Trigger all events
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));

  try {
    el.blur();
    el.focus();
  } catch {}
}

export function useHologramAIAgentAdvanced() {
  const busyRef = useRef(false);

  const runTask = useCallback(async (containerEl, windowType, task, orgId, onStep) => {
    if (busyRef.current) return { summary: "Agent busy", steps: [] };
    busyRef.current = true;

    const report = (text, phase) => {
      setAgentStatus("working", text.slice(0, 50));
      onStep?.({ text, phase });
    };

    try {
      report("Scanning dialog interface...", "scan");

      // Wait for dialog to appear
      let dialog = findActiveDialog(containerEl);
      for (let i = 0; i < 5 && !dialog; i++) {
        await new Promise(r => setTimeout(r, 800));
        dialog = findActiveDialog(containerEl);
        report(`Waiting for dialog... (${i + 1}/5)`, "think");
      }

      if (!dialog) {
        report("No dialog found", "error");
        busyRef.current = false;
        return { summary: "Dialog not detected", steps: [] };
      }

      report("Dialog found ✓", "narrate");

      // Scan dialog content
      const { fields, buttons } = scanDialog(dialog);
      report(`Found: ${fields.length} fields, ${buttons.length} buttons`, "scan");

      if (fields.length === 0) {
        report("No fields in dialog", "error");
        busyRef.current = false;
        return { summary: "No form fields detected", steps: [] };
      }

      // Generate smart values using LLM
      report("Analyzing task context...", "plan");
      const fieldDescriptions = fields
        .filter(f => f.label && f.label.length > 0)
        .map(f => `- ${f.label} (${f.type})`)
        .join('\n');

      let smartValues = {};
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are filling a form for: "${task}"

Fields to fill:
${fieldDescriptions}

Generate realistic, contextual data. Output ONLY valid JSON:
{
  "values": {
    "Field Label Exactly": "realistic value"
  }
}`,
          response_json_schema: {
            type: "object",
            properties: {
              values: { type: "object", additionalProperties: { type: "string" } }
            }
          }
        });
        smartValues = response?.values || {};
      } catch (e) {
        report("LLM unavailable, using defaults", "think");
      }

      // Fill form
      report("Filling fields...", "type");
      let filled = 0;

      for (const field of fields) {
        if (!field.label) continue;
        if (field.value && field.value.trim()) {
          report(`✓ Already filled: ${field.label}`, "narrate");
          filled++;
          continue;
        }

        const value = smartValues[field.label] || smartValues[field.type] || "";
        if (!value) {
          report(`⊘ Skipping: ${field.label}`, "think");
          continue;
        }

        report(`⌨️ Filling: ${field.label}`, "type");
        try {
          const rect = field.element.getBoundingClientRect();
          if (rect.width > 0) {
            dispatchCursorAction("type", field.label, null, value, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
          fillInput(field.element, value);
          filled++;
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          report(`⚠️ Error filling field, skipping`, "think");
        }
      }

      report(`✅ Filled ${filled} fields`, "narrate");

      // Find and click submit button
      if (buttons.length > 0) {
        const createBtn = buttons.find(b => b.label.toLowerCase().includes('create'));
        const saveBtn = buttons.find(b => b.label.toLowerCase().includes('save'));
        const submitBtn = createBtn || saveBtn || buttons.find(b => !b.disabled);

        if (submitBtn) {
          report(`🖱️ Clicking: ${submitBtn.label}`, "click");

          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const rect = submitBtn.element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                dispatchCursorAction("click", submitBtn.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 100));
              }

              // Multiple click methods
              submitBtn.element.click();
              await new Promise(r => setTimeout(r, 100));
              submitBtn.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
              
              report(`✅ Form submitted`, "narrate");
              await new Promise(r => setTimeout(r, 1500));
              break;
            } catch (e) {
              if (attempt < 3) {
                await new Promise(r => setTimeout(r, 400));
              }
            }
          }
        }
      }

      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `✅ Task completed: Filled ${filled} fields`,
        steps: filled + (buttons.length > 0 ? 1 : 0)
      };

    } catch (err) {
      report(`❌ ${err.message}`, "error");
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Error: ${err.message}`, steps: [] };
    }
  }, []);

  return { runTask };
}