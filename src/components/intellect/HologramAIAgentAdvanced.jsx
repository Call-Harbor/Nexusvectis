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

/**
 * Ultra-intelligent AI agent that operates UI like a human.
 * Learns context, adapts to complex UIs, handles errors gracefully.
 */

// Deep page analysis - understand full UI context
async function analyzePage(container = document) {
  const analysis = {
    buttons: [],
    inputs: [],
    dialogs: [],
    headings: [],
    context: "",
    errorMessages: [],
  };

  // Find ALL interactive elements with context
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  };

  // Buttons with context
  const buttonSelectors = ['button', '[role="button"]', 'a[onclick]', '[type="submit"]'];
  for (const sel of buttonSelectors) {
    const els = container.querySelectorAll(sel);
    for (const el of els) {
      if (!isVisible(el)) continue;
      const text = el.textContent?.trim() || el.getAttribute('aria-label') || '';
      const tooltip = el.getAttribute('title') || el.getAttribute('data-tooltip') || '';
      if (text) {
        analysis.buttons.push({
          el,
          text: text.slice(0, 60),
          tooltip,
          nearbyText: getNearbyText(el, 100),
        });
      }
    }
  }

  // Inputs with labels and context
  const inputSelectors = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
    'textarea',
    'select',
    '[role="combobox"]',
    '[role="searchbox"]',
  ];
  for (const sel of inputSelectors) {
    const els = container.querySelectorAll(sel);
    for (const el of els) {
      if (!isVisible(el)) continue;
      
      let label = el.placeholder || el.getAttribute('aria-label') || el.getAttribute('name') || '';
      
      if (!label && el.id) {
        const lbl = container.querySelector(`label[for="${el.id}"]`);
        if (lbl) label = lbl.textContent?.trim();
      }

      if (!label) {
        const parent = el.closest('[class*="field"], [class*="form-group"], [class*="input-wrapper"]');
        if (parent) {
          const lbl = parent.querySelector('label, [class*="label"]');
          if (lbl) label = lbl.textContent?.trim();
        }
      }

      const nearbyLabel = getNearbyText(el, 200);
      
      analysis.inputs.push({
        el,
        label: label || nearbyLabel.split('\n')[0].slice(0, 40) || `field_${analysis.inputs.length}`,
        type: el.type || el.tagName.toLowerCase(),
        value: el.value,
        placeholder: el.placeholder,
        required: el.required || el.getAttribute('aria-required') === 'true',
        options: el.tagName === 'SELECT' ? Array.from(el.options).map(o => o.text) : [],
      });
    }
  }

  // Dialog detection
  const dialogSelectors = ['[role="dialog"]', '[role="alertdialog"]', '[data-radix-dialog-content]', '[class*="modal"]'];
  for (const sel of dialogSelectors) {
    const els = container.querySelectorAll(sel);
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none') {
          analysis.dialogs.push({
            el,
            title: el.querySelector('h1,h2,h3')?.textContent?.trim() || 'Dialog',
          });
        }
      }
    }
  }

  // Headings for context
  const headings = container.querySelectorAll('h1,h2,h3,h4');
  analysis.headings = Array.from(headings).filter(isVisible).map(h => h.textContent?.trim());

  // Error messages
  const errorSelectors = ['[role="alert"]', '[class*="error"]', '[class*="warning"]', '[class*="danger"]'];
  for (const sel of errorSelectors) {
    const els = container.querySelectorAll(sel);
    for (const el of els) {
      const text = el.textContent?.trim();
      if (text && text.length > 5) {
        analysis.errorMessages.push(text.slice(0, 150));
      }
    }
  }

  // Overall page context
  const mainText = container.innerText?.slice(0, 2000) || '';
  analysis.context = mainText;

  return analysis;
}

function getNearbyText(el, maxDistance) {
  let text = '';
  let parent = el.parentElement;
  for (let i = 0; i < 6 && parent; i++) {
    const pText = parent.textContent?.slice(0, maxDistance) || '';
    if (pText.length > text.length) text = pText;
    parent = parent.parentElement;
  }
  return text;
}

// Intelligent element finder
function findElementBySemantic(analysis, query) {
  const q = query.toLowerCase();

  // Exact button match
  for (const btn of analysis.buttons) {
    if (btn.text.toLowerCase() === q) return btn.el;
    if (btn.text.toLowerCase().includes(q)) return btn.el;
  }

  // Fuzzy button match
  for (const btn of analysis.buttons) {
    const words = q.split(' ');
    if (words.every(w => btn.text.toLowerCase().includes(w))) return btn.el;
  }

  // Nearby text match
  for (const btn of analysis.buttons) {
    if (btn.nearbyText.toLowerCase().includes(q)) return btn.el;
  }

  return null;
}

function findInputBySemantic(analysis, query) {
  const q = query.toLowerCase();

  for (const inp of analysis.inputs) {
    if (inp.label.toLowerCase().includes(q)) return inp;
    if (inp.placeholder?.toLowerCase().includes(q)) return inp;
  }

  return analysis.inputs[0] || null;
}

// Adaptive value generation
async function generateSmartValues(inputs, context) {
  if (inputs.length === 0) return {};

  const fieldDescriptions = inputs.map(i => {
    const desc = `${i.label} (type: ${i.type}${i.required ? ', required' : ''})`;
    if (i.options.length > 0) return `${desc}, options: [${i.options.slice(0, 5).join(', ')}]`;
    return desc;
  }).join('\n');

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Context: "${context.slice(0, 500)}"\n\nFill these form fields intelligently:\n${fieldDescriptions}\n\nReturn JSON with realistic values: {"data":{"Label":"value"}}`,
      response_json_schema: {
        type: "object",
        properties: { data: { type: "object" } }
      }
    });
    return result?.data || {};
  } catch (e) {
    // Fallback smart defaults
    const values = {};
    for (const inp of inputs) {
      const l = inp.label.toLowerCase();
      if (l.includes('name')) values[inp.label] = 'John Doe';
      else if (l.includes('email')) values[inp.label] = 'user@example.com';
      else if (l.includes('phone') || l.includes('number')) values[inp.label] = '+4512345678';
      else if (l.includes('date')) values[inp.label] = new Date().toISOString().split('T')[0];
      else if (l.includes('price') || l.includes('amount')) values[inp.label] = '10000';
      else if (inp.options.length > 0) values[inp.label] = inp.options[0];
      else values[inp.label] = 'Test Data';
    }
    return values;
  }
}

// React-compatible input filling
function fillInput(el, value, retries = 0) {
  if (!el) return false;
  if (retries > 3) return false;

  try {
    el.focus();
    el.click();
  } catch {}

  // Select
  if (el.tagName === 'SELECT') {
    for (const opt of el.options) {
      if (opt.text.toLowerCase().includes(value.toLowerCase())) {
        el.value = opt.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // Checkbox/Radio
  if (el.type === 'checkbox' || el.type === 'radio') {
    const shouldCheck = /true|yes|check|✓|1|on/i.test(value);
    if (el.checked !== shouldCheck) el.click();
    return true;
  }

  // Text input
  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el),
    'value'
  )?.set;

  if (nativeSetter) nativeSetter.call(el, value);
  else el.value = value;

  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));

  // Verify value was set
  if (el.value === value) return true;

  // Retry with timeout
  if (retries < 3) {
    setTimeout(() => fillInput(el, value, retries + 1), 200);
  }

  return el.value === value;
}

// Click with resilience
function clickButton(el, retries = 0) {
  if (!el || retries > 5) return false;

  try {
    const rect = el.getBoundingClientRect();
    
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: false }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    
    el.click?.();
    
    return true;
  } catch (e) {
    if (retries < 5) {
      setTimeout(() => clickButton(el, retries + 1), 300);
    }
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
      report("🔍 Analyzing interface...", "scan");

      // PHASE 1: Deep analysis with retry - wait for page to fully load
      let page = await analyzePage(containerEl || document);
      let retries = 0;

      while ((page.buttons.length === 0 && page.inputs.length === 0) && retries < 10) {
        report(`⏳ Page loading... (${retries + 1}/10)`, "think");
        await new Promise(r => setTimeout(r, 300));
        page = await analyzePage(containerEl || document);
        retries++;
      }

      report(`Scanned: ${page.buttons.length} buttons, ${page.inputs.length} inputs`, "scan");

      if (page.buttons.length === 0 && page.inputs.length === 0) {
        report("❌ Page empty after 10 retries", "error");
        busyRef.current = false;
        return { summary: "Empty page", steps: [] };
      }

      let steps = [];

      // PHASE 2: Intelligent planning
      report("🤖 Planning workflow...", "plan");

      const buttonLabels = page.buttons.map(b => b.text).join(', ');
      let plan = null;

      try {
        const planResp = await base44.integrations.Core.InvokeLLM({
          prompt: `Task: "${task}"\n\nAvailable buttons: [${buttonLabels}]\n\nWhat's the optimal sequence?\nJSON: {"sequence":["button or action description"]}`,
          response_json_schema: {
            type: "object",
            properties: { sequence: { type: "array", items: { type: "string" } } }
          }
        });
        plan = planResp?.sequence || [];
      } catch (e) {
        report("⚠️ Planning failed, using heuristics", "think");
      }

      // PHASE 3: Execute workflow
      report("⚙️ Executing workflow...", "click");

      // If no plan, try to find relevant button
      if (!plan || plan.length === 0) {
        const keywords = ['add', 'create', 'new', 'open', 'start', 'begin', 'save', 'submit'];
        for (const kw of keywords) {
          const btn = page.buttons.find(b => b.text.toLowerCase().includes(kw));
          if (btn) {
            plan = [kw];
            break;
          }
        }
        if (!plan || plan.length === 0) plan = page.buttons.slice(0, 1).map(b => b.text);
      }

      // Execute plan
      for (const action of (plan || [])) {
        const btn = findElementBySemantic(page, action);
        if (btn) {
          report(`🖱️ Clicking: ${action}`, "click");
          clickButton(btn);
          steps.push(`clicked: ${action}`);
          await new Promise(r => setTimeout(r, 600));

          // Re-analyze after click
          const updated = await analyzePage(document);
          if (updated.dialogs.length > page.dialogs.length || updated.inputs.length > 0) {
            report("✓ Interface updated", "narrate");
            Object.assign(page, updated);
          }
        }
        await new Promise(r => setTimeout(r, 400));
      }

      // PHASE 4: Fill any visible form
      const visibleInputs = page.inputs.filter(i => {
        const rect = i.el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (visibleInputs.length > 0) {
        report(`📋 Found ${visibleInputs.length} form fields`, "scan");

        const values = await generateSmartValues(visibleInputs, page.context);
        report("⌨️ Filling form...", "type");

        for (const inp of visibleInputs) {
          const value = values[inp.label] || values[inp.name] || '';
          if (value) {
            report(`  ${inp.label}`, "type");
            fillInput(inp.el, value);
            steps.push(`filled: ${inp.label}`);
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      // PHASE 5: Find and click submit
      const submitBtn = page.buttons.find(b => 
        b.text.toLowerCase().match(/create|save|submit|done|ok|confirm/)
      );

      if (submitBtn) {
        report(`🖱️ Submitting...`, "click");
        clickButton(submitBtn.el);
        steps.push('submitted');
        await new Promise(r => setTimeout(r, 800));
      }

      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: `✅ Completed: ${steps.join(' → ')}`,
        steps: steps.length
      };

    } catch (err) {
      report(`❌ ${err.message}`, "error");
      setAgentStatus("idle");
      busyRef.current = false;
      return { summary: `Error: ${err.message}`, steps: 0 };
    }
  }, []);

  return { runTask };
}