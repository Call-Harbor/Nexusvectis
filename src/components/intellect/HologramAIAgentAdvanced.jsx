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

// Find all clickable elements on the page
function findAllClickables(container = document) {
  const clickables = [];
  
  const selectors = [
    'button:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    'a:not([disabled])',
    '[type="submit"]',
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

        const label = el.textContent?.trim().slice(0, 80) || 
          el.getAttribute('aria-label') || '';

        if (label && !clickables.some(c => c.label === label)) {
          clickables.push({
            el,
            label,
            rect,
          });
        }
      }
    } catch (e) {}
  }

  return clickables;
}

// Find dialog or modal
function findDialog() {
  const selectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[data-radix-dialog-content]',
    '[class*="modal"]',
    '[class*="dialog"]',
  ];

  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none') {
          return el;
        }
      }
    }
  }

  return null;
}

// Find all form inputs
function findFormInputs(container) {
  const inputs = [];
  
  const selectors = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
    'textarea',
    'select',
    '[role="combobox"]',
  ];

  for (const sel of selectors) {
    try {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        if (rect.width < 5 || rect.height < 5) continue;
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        let label = el.placeholder || el.getAttribute('aria-label') || el.name || '';
        
        if (!label && el.id) {
          const lbl = container.querySelector(`label[for="${el.id}"]`);
          if (lbl) label = lbl.textContent?.trim() || '';
        }

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

        if (!label) label = `field_${inputs.length}`;

        inputs.push({
          el,
          label: label.slice(0, 80),
          type: el.type || el.tagName.toLowerCase(),
          value: el.value,
        });
      }
    } catch (e) {}
  }

  return inputs;
}

// Find buttons in dialog/form
function findFormButtons(container) {
  const buttons = [];
  
  const selectors = [
    'button:not([disabled])',
    '[role="button"]:not([aria-disabled])',
    '[type="submit"]',
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
            disabled: el.disabled,
          });
        }
      }
    } catch (e) {}
  }

  return buttons;
}

// Set input value with React support
function fillInput(input, value) {
  if (!input || !value) return;

  try { input.focus(); } catch {}

  if (input.tagName === 'SELECT') {
    for (const opt of input.options) {
      if (opt.text.toLowerCase().includes(value.toLowerCase())) {
        input.value = opt.value;
        break;
      }
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (input.type === 'checkbox' || input.type === 'radio') {
    if (!input.checked) input.click();
    return;
  }

  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    'value'
  )?.set;

  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// Click element
function clickElement(el) {
  if (!el) return false;
  try {
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
      report("🔍 Analyzing task...", "plan");

      // PHASE 1: Analyze page and determine what button to click
      const pageButtons = findAllClickables(document);
      report(`Found ${pageButtons.length} buttons on page`, "scan");

      if (pageButtons.length === 0) {
        report("❌ No buttons found", "error");
        busyRef.current = false;
        return { summary: "No actions available", steps: [] };
      }

      // Use LLM to determine which button to click
      const buttonLabels = pageButtons.map(b => b.label).filter(Boolean);
      
      let buttonToClick = null;
      try {
        const plan = await base44.integrations.Core.InvokeLLM({
          prompt: `Task: "${task}"\n\nAvailable buttons: [${buttonLabels.join(', ')}]\n\nWhich button should be clicked first? Return JSON: {"button":"exact button name"}`,
          response_json_schema: {
            type: "object",
            properties: { button: { type: "string" } }
          }
        });

        if (plan?.button) {
          buttonToClick = pageButtons.find(b => 
            b.label.toLowerCase().includes(plan.button.toLowerCase()) ||
            plan.button.toLowerCase().includes(b.label.toLowerCase())
          );
        }
      } catch (e) {
        report("⚠️ LLM error, using first relevant button", "think");
      }

      // Fallback to smart button selection
      if (!buttonToClick) {
        const keywords = ['add', 'new', 'create', 'open', 'start', 'begin'];
        for (const kw of keywords) {
          buttonToClick = pageButtons.find(b => b.label.toLowerCase().includes(kw));
          if (buttonToClick) break;
        }
      }

      if (!buttonToClick) {
        buttonToClick = pageButtons[0];
      }

      // PHASE 2: Click the button
      report(`🖱️ Clicking: ${buttonToClick.label}`, "click");
      const rect = buttonToClick.rect;
      dispatchCursorAction("click", buttonToClick.label, null, null, 
        rect.left + rect.width / 2, rect.top + rect.height / 2);
      
      clickElement(buttonToClick.el);
      report(`✓ Button clicked`, "narrate");
      await new Promise(r => setTimeout(r, 1500));

      // PHASE 3: Wait for and handle dialog/form if it appears
      let dialog = null;
      for (let i = 0; i < 6; i++) {
        dialog = findDialog();
        if (dialog) break;
        report(`⏳ Waiting for dialog (${i + 1}/6)`, "think");
        await new Promise(r => setTimeout(r, 700));
      }

      let steps = 1;

      if (dialog) {
        report("✓ Dialog opened", "narrate");

        // Find form inputs
        const inputs = findFormInputs(dialog);
        if (inputs.length > 0) {
          report(`📋 Found ${inputs.length} fields`, "scan");

          // Generate smart values
          let values = {};
          try {
            const fieldList = inputs.map(i => `- ${i.label} (${i.type})`).join('\n');
            const resp = await base44.integrations.Core.InvokeLLM({
              prompt: `Fill form for: "${task}"\n\nFields:\n${fieldList}\n\nJSON: {"data":{"Field Label":"value"}}`,
              response_json_schema: {
                type: "object",
                properties: { data: { type: "object" } }
              }
            });
            values = resp?.data || {};
          } catch (e) {
            report("⚠️ LLM unavailable", "think");
          }

          // Fill inputs
          report("⌨️ Filling fields...", "type");
          let filled = 0;

          for (const inp of inputs) {
            if (inp.value?.trim()) {
              filled++;
              continue;
            }

            let val = values[inp.label] || '';
            if (!val) {
              const lbl = inp.label.toLowerCase();
              if (lbl.includes('name')) val = 'Test Name';
              else if (lbl.includes('email')) val = 'test@test.com';
              else if (lbl.includes('price') || lbl.includes('value')) val = '10000';
              else val = 'Test Data';
            }

            report(`⌨️ ${inp.label}`, "type");
            fillInput(inp.el, val);
            filled++;
            await new Promise(r => setTimeout(r, 150));
          }

          steps += filled;
          report(`✅ Filled ${filled} fields`, "narrate");
        }

        // Click submit button
        const buttons = findFormButtons(dialog);
        const submitBtn = buttons.find(b => 
          b.label.toLowerCase().includes('create') ||
          b.label.toLowerCase().includes('save') ||
          b.label.toLowerCase().includes('submit')
        ) || buttons[0];

        if (submitBtn && !submitBtn.disabled) {
          report(`🖱️ Submitting: ${submitBtn.label}`, "click");
          const sbRect = submitBtn.el.getBoundingClientRect();
          dispatchCursorAction("click", submitBtn.label, null, null,
            sbRect.left + sbRect.width / 2, sbRect.top + sbRect.height / 2);
          
          clickElement(submitBtn.el);
          await new Promise(r => setTimeout(r, 1800));
          steps++;
        }
      }

      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `✅ Task completed in ${steps} steps`,
        steps
      };

    } catch (err) {
      report(`❌ Error: ${err.message}`, "error");
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Error: ${err.message}`, steps: 0 };
    }
  }, []);

  return { runTask };
}