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

function getElementLabel(el, root) {
  let label = el.placeholder || el.getAttribute("aria-label") || "";
  
  if (!label && el.id) {
    const lbl = root.querySelector(`label[for="${el.id}"]`);
    if (lbl) label = lbl.textContent?.trim() || "";
  }
  
  if (!label) {
    let parent = el.parentElement;
    for (let depth = 0; depth < 10 && parent; depth++) {
      const lblEl = parent.querySelector("label, [class*='label'], legend, [class*='field-label']");
      if (lblEl) {
        const txt = lblEl.textContent?.trim();
        if (txt && txt.length < 100) { label = txt; break; }
      }
      
      const parentText = parent.textContent?.trim();
      if (parentText && parentText.length < 150 && parentText.includes(el.placeholder || el.name || '')) {
        label = parentText;
        break;
      }
      
      parent = parent.parentElement;
    }
  }
  
  if (!label) label = el.name || el.id || "";
  return label.trim();
}

// Advanced scan with field type detection
async function advancedDeepScan(containerEl) {
  const roots = getAllRoots(containerEl);
  const fields = [];

  for (const root of roots) {
    const inputs = [...root.querySelectorAll("input, textarea, select, [role='combobox'], [contenteditable='true']")];
    
    for (const inp of inputs) {
      const label = getElementLabel(inp, root);
      if (!label) continue;
      
      let fieldType = inp.type || inp.tagName.toLowerCase();
      let options = [];
      let isRequired = inp.required || inp.getAttribute("aria-required") === "true";
      
      if (inp.tagName === 'SELECT') {
        options = [...inp.options].map(o => ({ text: o.text, value: o.value }));
      }
      
      // Check for aria-invalid or error states
      const hasError = inp.classList.contains('error') || inp.getAttribute('aria-invalid') === 'true';
      
      fields.push({
        label,
        element: inp,
        type: fieldType,
        options,
        required: isRequired,
        hasError,
        value: inp.value || "",
        classList: inp.className,
        name: inp.name
      });
    }
  }

  // Get buttons
  const buttons = [];
  for (const root of roots) {
    const btns = [...root.querySelectorAll("button, [role='button'], [type='submit'], a[role='button']")];
    for (const btn of btns) {
      const label = btn.textContent?.trim().replace(/\s+/g, " ") || 
        btn.getAttribute("aria-label") || 
        btn.getAttribute("title") || "";
      const isDisabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
      
      if (label && !buttons.find(b => b.label === label)) {
        buttons.push({ label, element: btn, disabled: isDisabled });
      }
    }
  }

  return { fields, buttons };
}

// Use LLM to intelligently fill form based on task context
async function generateIntelligentValues(task, fields) {
  if (fields.length === 0) return {};
  
  const fieldDescriptions = fields
    .map(f => `- ${f.label} (type: ${f.type}, required: ${f.required})${f.options.length > 0 ? ` [options: ${f.options.map(o => o.text).slice(0, 5).join(', ')}]` : ''}`)
    .join('\n');

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are filling a form to: "${task}"

Form fields:
${fieldDescriptions}

Generate realistic, contextual data for each field. Output ONLY JSON (no other text):
{
  "fieldValues": {
    "Field Label Exactly As Above": "realistic value",
    ...
  },
  "strategy": "description of approach"
}`,
    response_json_schema: {
      type: "object",
      properties: {
        fieldValues: { type: "object", additionalProperties: { type: "string" } },
        strategy: { type: "string" }
      }
    }
  });

  return response?.fieldValues || {};
}

function fuzzyMatch(source, target) {
  const s = source.toLowerCase().replace(/\s+/g, '');
  const t = target.toLowerCase().replace(/\s+/g, '');
  if (s === t) return 1.0;
  if (s.includes(t) || t.includes(s)) return 0.85;
  let matches = 0;
  for (let i = 0; i < Math.min(s.length, t.length); i++) {
    if (s[i] === t[i]) matches++;
  }
  return matches / Math.max(s.length, t.length);
}

function fillElement(el, val) {
  if (!el || !val) return;
  
  try {
    el.focus();
  } catch {}

  if (el.tagName === 'SELECT') {
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      fuzzyMatch(o.text, val) > 0.8 ||
      fuzzyMatch(o.value, val) > 0.8
    );
    if (opt) {
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(el.ownerDocument.defaultView.HTMLSelectElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, opt.value);
        else el.value = opt.value;
      } catch {
        el.value = opt.value;
      }
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
    return;
  }

  if (el.type === 'checkbox' || el.type === 'radio') {
    const shouldCheck = /true|yes|1|on|check/i.test(val);
    if (el.checked !== shouldCheck) {
      try { el.click(); } catch {}
    }
    return;
  }

  const proto = el.tagName === 'TEXTAREA'
    ? el.ownerDocument.defaultView.HTMLTextAreaElement.prototype
    : el.ownerDocument.defaultView.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  try {
    if (setter) setter.call(el, val);
    else el.value = val;
    
    // Trigger all change events
    ['change', 'input', 'blur', 'focus'].forEach(eventType => {
      el.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: val }));
  } catch (e) {
    console.error('fillElement error:', e);
  }
}

export function useHologramAIAgentAdvanced() {
  const busyRef = useRef(false);

  const runTask = useCallback(async (containerEl, windowType, task, orgId, onStep) => {
    if (busyRef.current) return { summary: "Agent is busy", steps: [] };
    busyRef.current = true;

    const report = (text, phase) => {
      setAgentStatus("working", text.slice(0, 60));
      onStep?.({ text, phase });
    };

    try {
      report("Advanced form analysis...", "scan");
      
      // Initial scan with waits
      let scan = await advancedDeepScan(containerEl);
      if (scan.fields.length === 0) {
        for (let i = 0; i < 4; i++) {
          report(`Waiting for form content... (${i + 1}/4)`, "think");
          await new Promise(r => setTimeout(r, 1200));
          scan = await advancedDeepScan(containerEl);
          if (scan.fields.length > 0) break;
        }
      }

      report(`Form loaded: ${scan.fields.length} fields, ${scan.buttons.length} buttons`, "narrate");

      // Generate intelligent values using LLM
      report("Analyzing form context with AI...", "plan");
      const values = await generateIntelligentValues(task, scan.fields);

      // Fill fields in parallel groups for speed
      report("Filling form fields intelligently...", "type");
      let filledCount = 0;

      for (const field of scan.fields) {
        try {
          const value = values[field.label] || values[field.name] || "";
          
          if (!value) {
            report(`⊘ Skipping optional field: ${field.label}`, "think");
            continue;
          }

          if (field.value && field.value.trim()) {
            report(`✓ Field already filled: ${field.label}`, "narrate");
            filledCount++;
            continue;
          }

          report(`⌨️ Filling: ${field.label}`, "type");
          const rect = field.element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            dispatchCursorAction("type", field.label, null, value, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
          }

          fillElement(field.element, value);
          filledCount++;
          await new Promise(r => setTimeout(r, 120));

        } catch (e) {
          report(`⚠️ Error filling ${field.label}, skipping...`, "think");
          continue;
        }
      }

      report(`✅ Filled ${filledCount}/${scan.fields.length} fields`, "narrate");

      // Get LLM recommendation for button sequence
      report("Determining submission strategy...", "plan");
      const buttonLabels = scan.buttons.filter(b => !b.disabled).map(b => b.label);
      
      const submitPlan = await base44.integrations.Core.InvokeLLM({
        prompt: `Task: "${task}"
        
Available buttons: [${buttonLabels.join(', ')}]

Which button(s) should be clicked to submit/complete this form? Only return exact button names from the list.
Output JSON: {"buttons": ["button name 1", "button name 2"], "reason": "why"}`,
        response_json_schema: {
          type: "object",
          properties: {
            buttons: { type: "array", items: { type: "string" } },
            reason: { type: "string" }
          }
        }
      });

      let buttonsToClick = submitPlan?.buttons?.filter(b => buttonLabels.some(bl => fuzzyMatch(bl, b) > 0.7)) || [];
      
      // If no match, use priority buttons
      if (buttonsToClick.length === 0) {
        const priorityLabels = ["Save", "Create", "Submit", "Confirm", "Add", "Next"];
        for (const priority of priorityLabels) {
          if (buttonLabels.some(bl => fuzzyMatch(bl, priority) > 0.7)) {
            buttonsToClick = [buttonLabels.find(bl => fuzzyMatch(bl, priority) > 0.7)];
            break;
          }
        }
      }

      if (buttonsToClick.length === 0 && buttonLabels.length > 0) {
        buttonsToClick = [buttonLabels[0]];
      }

      // Submit form with aggressive retry logic
      for (const btnLabel of buttonsToClick) {
        let success = false;
        
        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            let btn = scan.buttons.find(b => fuzzyMatch(b.label, btnLabel) > 0.7)?.element;
            
            if (!btn) {
              const freshScan = await advancedDeepScan(containerEl);
              btn = freshScan.buttons.find(b => fuzzyMatch(b.label, btnLabel) > 0.7)?.element;
            }

            if (btn) {
              report(`🖱️ Submitting with: ${btnLabel} (attempt ${attempt + 1})`, "click");
              const rect = btn.getBoundingClientRect();
              
              if (rect.width > 0 && rect.height > 0) {
                dispatchCursorAction("click", btnLabel, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 150));
              }

              // Multiple submission strategies
              btn.click();
              await new Promise(r => setTimeout(r, 100));
              btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
              await new Promise(r => setTimeout(r, 100));
              btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
              btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
              
              success = true;
              report(`✅ Form submitted successfully`, "narrate");
              await new Promise(r => setTimeout(r, 2000)); // Wait for submission processing
              break;
            } else if (attempt < 5) {
              report(`Searching for button... (${attempt + 1}/5)`, "think");
              await new Promise(r => setTimeout(r, 700));
            }
          } catch (e) {
            if (attempt < 5) await new Promise(r => setTimeout(r, 400));
          }
        }
        
        if (success) break; // Successfully submitted, exit loop
      }

      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `Task completed: Filled ${filledCount} fields and submitted form`,
        steps: filledCount + buttonsToClick.length
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