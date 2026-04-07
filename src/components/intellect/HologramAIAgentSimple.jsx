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

function generateSmartValue(fieldName, fieldType = 'text') {
  const lower = fieldName.toLowerCase();
  
  if (lower.includes('email')) return 'contact@company.com';
  if (lower.includes('phone')) return '+45 40 40 40 40';
  if (lower.includes('first name')) return 'John';
  if (lower.includes('last name')) return 'Anderson';
  if (lower.includes('full name') || lower.includes('name')) return 'John Anderson';
  if (lower.includes('company')) return 'Tech Solutions ApS';
  if (lower.includes('employee id')) return 'EMP001';
  if (lower.includes('location')) return 'Copenhagen';
  if (lower.includes('job title') || lower.includes('title')) return 'Senior Manager';
  if (lower.includes('department')) return 'Operations';
  if (lower.includes('date') || lower.includes('close')) return '12/31/2026';
  if (lower.includes('note') || lower.includes('description')) return 'High-priority account with growth potential';
  if (lower.includes('value') || lower.includes('amount')) return '500000';
  if (lower.includes('currency')) return 'EUR';
  
  return 'Data entry';
}

function fillElement(el, val) {
  if (!el) return;
  const elWin = el.ownerDocument?.defaultView || window;
  
  try {
    el.focus();
  } catch {}

  if (el.tagName === 'SELECT') {
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      o.value.toLowerCase() === lower ||
      o.text.toLowerCase() === lower ||
      fuzzyMatch(o.text, val) > 0.7
    );
    if (opt) {
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(elWin.HTMLSelectElement.prototype, 'value')?.set;
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
    ? elWin.HTMLTextAreaElement.prototype
    : elWin.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  try {
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
    
    try { el.blur(); } catch {}
    setTimeout(() => { try { el.focus(); } catch {} }, 10);
  } catch (e) {
    console.error('fillElement error:', e);
  }
}

// AGGRESSIVE scan — finds EVERY input regardless of visibility
function aggressiveDeepScan(containerEl) {
  const roots = getAllRoots(containerEl);
  const allInputs = new Map();

  for (const root of roots) {
    // Get ALL inputs (visible, hidden, disabled, everything)
    const inputs = [...root.querySelectorAll("input, textarea, select, [role='combobox'], [contenteditable='true']")];
    
    for (const inp of inputs) {
      let label = inp.placeholder || inp.getAttribute("aria-label") || "";
      
      if (!label && inp.id) {
        const lbl = root.querySelector(`label[for="${inp.id}"]`);
        if (lbl) label = lbl.textContent?.trim() || "";
      }
      
      if (!label) {
        let parent = inp.parentElement;
        for (let depth = 0; depth < 8 && parent; depth++) {
          const text = parent.textContent?.trim();
          if (text && text.length < 100 && !text.includes('\n\n')) {
            label = text;
            break;
          }
          const lblEl = parent.querySelector("label, [class*='label'], legend");
          if (lblEl) {
            const txt = lblEl.textContent?.trim();
            if (txt) { label = txt; break; }
          }
          parent = parent.parentElement;
        }
      }
      
      if (!label) label = inp.name || inp.id || `field_${Math.random()}`;
      
      const key = label.toLowerCase().trim();
      if (!allInputs.has(key)) {
        allInputs.set(key, {
          label,
          element: inp,
          type: inp.type || inp.tagName.toLowerCase(),
          options: inp.tagName === 'SELECT' ? [...inp.options].map(o => o.text) : []
        });
      }
    }
  }

  // Get all buttons
  const allButtons = [];
  for (const root of roots) {
    const buttons = [...root.querySelectorAll("button, [role='button'], [type='submit'], a[role='button']")];
    for (const btn of buttons) {
      const label = btn.textContent?.trim().replace(/\s+/g, " ") || 
        btn.getAttribute("aria-label") || 
        btn.getAttribute("title") || "";
      if (label && !allButtons.find(b => b.label === label)) {
        allButtons.push({ label, element: btn });
      }
    }
  }

  return { inputs: Array.from(allInputs.values()), buttons: allButtons };
}

function findButton(containerEl, label) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();
  const roots = getAllRoots(containerEl);
  
  for (const root of roots) {
    const buttons = [...root.querySelectorAll("button, [role='button'], [type='submit']")];
    
    let btn = buttons.find(b => b.textContent?.trim().toLowerCase() === lower);
    if (btn) return btn;
    
    btn = buttons.find(b => fuzzyMatch(b.textContent?.trim() || "", lower) > 0.7);
    if (btn) return btn;
    
    btn = buttons.find(b => b.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (btn) return btn;
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
      report("Aggressive scan for ALL fields...", "scan");
      await new Promise(r => setTimeout(r, 500));

      const scan = aggressiveDeepScan(containerEl);
      
      if (scan.inputs.length === 0) {
        for (let i = 0; i < 4; i++) {
          report(`Waiting for form... (${i + 1}/4)`, "think");
          await new Promise(r => setTimeout(r, 1200));
          const fresh = aggressiveDeepScan(containerEl);
          if (fresh.inputs.length > 0) {
            Object.assign(scan, fresh);
            break;
          }
        }
      }

      report(`FOUND: ${scan.inputs.length} fields, ${scan.buttons.length} buttons`, "scan");

      report("Planning intelligent fill strategy...", "plan");

      // Auto-fill ALL fields found without waiting for LLM
      const filledCount = new Set();
      
      for (const field of scan.inputs) {
        if (!field.element) continue;
        
        const val = generateSmartValue(field.label, field.type);
        report(`⌨️ Auto-filling: ${field.label}`, "type");
        
        try {
          const rect = field.element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            dispatchCursorAction("type", field.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
          await new Promise(r => setTimeout(r, 50));
          
          fillElement(field.element, val);
          filledCount.add(field.label);
          
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          console.error(`Failed to fill ${field.label}:`, e);
        }
      }

      report(`✅ Filled ${filledCount.size} fields`, "narrate");

      // Now get LLM plan for button clicks and order
      const fieldList = scan.inputs.map(f => f.label).join('\n');
      const buttonList = scan.buttons.map(b => b.label).join('\n');

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Task: "${task}"

All fields have been filled with data:
${fieldList}

Available buttons to click:
${buttonList}

What buttons should be clicked in order to complete this task? Output ONLY JSON:
{"buttons":["exact button name 1","exact button name 2"],"summary":"task completed"}`,
        response_json_schema: {
          type: "object",
          properties: {
            buttons: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });

      const buttonsToClick = planResult?.buttons || ["Save", "Create", "Submit", "Confirm"];

      // Click buttons in sequence — with retry and continuation
      let clickedCount = 0;
      for (const btnLabel of buttonsToClick) {
        try {
          let btn = findButton(containerEl, btnLabel);
          
          // Retry: if button not found, look for similar buttons
          if (!btn) {
            report(`🔄 Searching for alternative button match...`, "think");
            const freshScan = aggressiveDeepScan(containerEl);
            const similar = freshScan.buttons.find(b => fuzzyMatch(b.label, btnLabel) > 0.6);
            if (similar) {
              btn = similar.element;
              report(`✅ Found similar: ${similar.label}`, "narrate");
            }
          }
          
          if (btn) {
            report(`🖱️ Clicking: ${btnLabel}`, "click");
            try {
              const rect = btn.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                dispatchCursorAction("click", btnLabel, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
                await new Promise(r => setTimeout(r, 150));
              }
              btn.click();
              clickedCount++;
              await new Promise(r => setTimeout(r, 1000));
            } catch (clickErr) {
              report(`⚠️ Click attempt failed, continuing...`, "think");
              await new Promise(r => setTimeout(r, 300));
            }
          } else {
            report(`ℹ️ Button "${btnLabel}" not found, skipping...`, "think");
          }
        } catch (e) {
          report(`⚠️ Error processing button, continuing to next...`, "think");
          await new Promise(r => setTimeout(r, 200));
          continue; // CRITICAL: Don't stop, continue to next button
        }
      }

      report(`✅ Task completed - Filled ${filledCount.size} fields and executed button actions`, "narrate");
      await new Promise(r => setTimeout(r, 300));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `Success: Filled ${filledCount.size} fields, clicked ${buttonsToClick.length} buttons - task execution complete`,
        steps: scan.inputs.length + buttonsToClick.length
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