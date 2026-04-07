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

// Aggressive dialog finder
function findDialog() {
  // Try all possible dialog selectors
  const selectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    'dialog',
    '[data-radix-dialog-content]',
    '[class*="dialog"]',
    '[class*="modal"]',
    '[class*="popup"]',
  ];

  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      // Check if visible and has reasonable size
      if (rect.width > 100 && rect.height > 100 && style.display !== 'none') {
        return el;
      }
    }
  }

  // Check for portal containers with dialog content
  const allDivs = document.querySelectorAll('[class*="fixed"], [class*="absolute"]');
  for (const div of allDivs) {
    const text = div.innerText || '';
    if (text.includes('Deal') || text.includes('Navn') || text.includes('Email')) {
      const rect = div.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        const style = window.getComputedStyle(div);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return div;
        }
      }
    }
  }

  return null;
}

// Ultra-aggressive input finder
function findAllInputs(container) {
  const inputs = [];
  
  // Get all possible input elements
  const selectors = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
    'textarea',
    'select',
    '[role="combobox"]',
    '[role="searchbox"]',
    '[contenteditable="true"]',
    '[role="textbox"]',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="number"]',
    'input[type="date"]',
    'input[type="tel"]',
  ];

  for (const sel of selectors) {
    try {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const parent = el.parentElement?.getBoundingClientRect();

        // Visibility checks
        if (rect.width < 5 || rect.height < 5) continue;
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (style.opacity === '0') continue;

        // Get label
        let label = el.placeholder || el.getAttribute('aria-label') || el.name || el.id || '';
        
        // Search for associated label
        if (!label && el.id) {
          const lbl = container.querySelector(`label[for="${el.id}"]`);
          if (lbl) label = lbl.textContent?.trim() || '';
        }

        // Search parent for label
        if (!label) {
          let p = el.parentElement;
          for (let i = 0; i < 5; i++) {
            if (!p) break;
            const txt = p.textContent?.trim().split('\n')[0] || '';
            if (txt && txt.length > 2 && txt.length < 60) {
              label = txt;
              break;
            }
            p = p.parentElement;
          }
        }

        if (!label) label = `input_${inputs.length}`;

        inputs.push({
          el,
          label: label.slice(0, 80),
          type: el.type || el.tagName.toLowerCase(),
          value: el.value,
        });
      }
    } catch (e) {
      // Skip selector if it fails
    }
  }

  return inputs;
}

// Ultra-aggressive button finder
function findAllButtons(container) {
  const buttons = [];
  
  const selectors = [
    'button:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[type="submit"]',
    'a[role="button"]',
    '[class*="btn"]:not([disabled])',
  ];

  for (const sel of selectors) {
    try {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        if (rect.width < 5 || rect.height < 5) continue;
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const label = el.textContent?.trim().slice(0, 60) || 
          el.getAttribute('aria-label') || '';

        if (label && !buttons.some(b => b.label === label)) {
          buttons.push({
            el,
            label,
            disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
          });
        }
      }
    } catch (e) {
      // Skip
    }
  }

  return buttons;
}

// React-compatible value setter
function setInputValue(input, value) {
  if (!input || !value) return;

  try {
    input.focus();
  } catch {}

  // Handle select
  if (input.tagName === 'SELECT') {
    for (const opt of input.options) {
      if (opt.text.toLowerCase().includes(value.toLowerCase()) ||
          opt.value.toLowerCase() === value.toLowerCase()) {
        input.value = opt.value;
        break;
      }
    }
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    return;
  }

  // Handle checkbox/radio
  if (input.type === 'checkbox' || input.type === 'radio') {
    const check = /true|yes|1|on|✓|checked/i.test(value);
    if (input.checked !== check) {
      input.click();
    }
    return;
  }

  // Handle text inputs
  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    'value'
  )?.set;

  // Clear
  if (nativeSetter) nativeSetter.call(input, '');
  else input.value = '';
  
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Set new value
  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;

  // Multiple event triggers for React compatibility
  input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
  input.dispatchEvent(new Event('focus', { bubbles: true }));
}

// Click element reliably
function clickButton(btn) {
  if (!btn) return false;

  try {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      // Simulate mouse down/up
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    }

    // Direct click
    btn.click?.();
    return true;
  } catch (e) {
    return false;
  }
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
      report("🔍 Scanning for dialog...", "scan");

      // Wait for dialog
      let dialog = null;
      for (let i = 0; i < 10; i++) {
        dialog = findDialog();
        if (dialog) break;
        report(`⏳ Waiting for dialog (${i + 1}/10)`, "think");
        await new Promise(r => setTimeout(r, 600));
      }

      if (!dialog) {
        report("❌ Dialog not found", "error");
        busyRef.current = false;
        return { summary: "Dialog not found", steps: [] };
      }

      report("✓ Dialog found", "narrate");

      // Scan inputs and buttons
      report("📋 Scanning form elements...", "scan");
      let inputs = findAllInputs(dialog);
      let buttons = findAllButtons(dialog);

      // Retry if no inputs found
      if (inputs.length === 0) {
        for (let i = 0; i < 5; i++) {
          report(`⏳ No inputs found, rescanning (${i + 1}/5)`, "think");
          await new Promise(r => setTimeout(r, 800));
          inputs = findAllInputs(dialog);
          if (inputs.length > 0) break;
        }
      }

      if (inputs.length === 0) {
        report("❌ No form fields found", "error");
        busyRef.current = false;
        return { summary: "No inputs found", steps: [] };
      }

      report(`✓ Found: ${inputs.length} fields, ${buttons.length} buttons`, "narrate");

      // Generate smart values
      report("🤖 Analyzing context...", "plan");
      const fieldList = inputs.map(i => `- ${i.label} (${i.type})`).join('\n');

      let values = {};
      try {
        const resp = await base44.integrations.Core.InvokeLLM({
          prompt: `Task: "${task}"\n\nFill these fields:\n${fieldList}\n\nOutput JSON only:\n{"data":{"Field Label":"value"}}`,
          response_json_schema: {
            type: "object",
            properties: { data: { type: "object" } }
          }
        });
        values = resp?.data || {};
      } catch (e) {
        report("⚠️ LLM error, using defaults", "think");
      }

      // Fill all inputs
      report("⌨️ Filling fields...", "type");
      let filled = 0;

      for (const inp of inputs) {
        // Skip if already filled
        if (inp.value?.trim()) {
          report(`✓ ${inp.label} (already filled)`, "narrate");
          filled++;
          continue;
        }

        // Get value from LLM response or generate default
        let val = values[inp.label] || values[inp.name] || '';
        
        if (!val) {
          // Smart defaults
          const label = inp.label.toLowerCase();
          if (label.includes('name') || label.includes('titel')) val = 'Test Value';
          else if (label.includes('email')) val = 'test@example.com';
          else if (label.includes('phone') || label.includes('telefon')) val = '+4512345678';
          else if (label.includes('price') || label.includes('value') || label.includes('beløb')) val = '10000';
          else if (label.includes('date') || label.includes('dato')) val = new Date().toISOString().split('T')[0];
          else val = 'Test Data';
        }

        report(`⌨️ ${inp.label}: "${val.slice(0, 20)}"`, "type");
        
        try {
          const rect = inp.el.getBoundingClientRect();
          dispatchCursorAction("type", inp.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
          
          await setInputValue(inp.el, val);
          filled++;
          await new Promise(r => setTimeout(r, 180));
        } catch (e) {
          report(`⚠️ Error filling field, skipping`, "think");
        }
      }

      report(`✅ Filled ${filled}/${inputs.length} fields`, "narrate");

      // Find and click submit button
      if (buttons.length > 0) {
        const submitBtn = buttons.find(b => 
          b.label.toLowerCase().includes('create') ||
          b.label.toLowerCase().includes('save') ||
          b.label.toLowerCase().includes('submit')
        ) || buttons[buttons.length - 1];

        if (submitBtn && !submitBtn.disabled) {
          report(`🖱️ Clicking: ${submitBtn.label}`, "click");

          for (let attempt = 0; attempt < 6; attempt++) {
            const rect = submitBtn.el.getBoundingClientRect();
            if (rect.width > 0) {
              dispatchCursorAction("click", submitBtn.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }

            const success = clickButton(submitBtn.el);
            if (success) {
              report(`✅ Button clicked`, "narrate");
              await new Promise(r => setTimeout(r, 2000));
              break;
            }

            if (attempt < 5) {
              report(`🔄 Retry click (${attempt + 1}/6)`, "think");
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }
      }

      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `✅ Task completed: ${filled}/${inputs.length} fields filled`,
        steps: filled + 1
      };

    } catch (err) {
      report(`❌ Error: ${err.message}`, "error");
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Failed: ${err.message}`, steps: 0 };
    }
  }, []);

  return { runTask };
}