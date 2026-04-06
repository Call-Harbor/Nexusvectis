// Giver H.A.R.B.O.R evne til at interagere med åbne hologramvinduer som mennesker
export class HologramWindowInteractionAPI {
  constructor() {
    this.windows = new Map(); // windowId -> { ref, type, data }
  }

  registerWindow(windowId, windowRef, windowType, windowData = {}) {
    this.windows.set(windowId, { ref: windowRef, type: windowType, data: windowData });
  }

  unregisterWindow(windowId) {
    this.windows.delete(windowId);
  }

  // Get all open windows
  getOpenWindows() {
    return Array.from(this.windows.entries()).map(([id, w]) => ({
      id,
      type: w.type,
      data: w.data,
    }));
  }

  // Get specific window
  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  // Click element in window
  clickElement(windowId, selector) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const container = window.ref;
    const element = container.querySelector(selector);
    if (!element) return { success: false, error: `Element not found: ${selector}` };

    element.click();
    return { success: true };
  }

  // Fill input field
  fillInput(windowId, selector, value) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const input = window.ref.querySelector(selector);
    if (!input) return { success: false, error: `Input not found: ${selector}` };

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true };
  }

  // Read text from element
  readText(windowId, selector) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const element = window.ref.querySelector(selector);
    if (!element) return { success: false, error: `Element not found: ${selector}` };

    return { success: true, text: element.textContent?.trim() || element.value || "" };
  }

  // Read all text matching selector
  readAllText(windowId, selector) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const elements = window.ref.querySelectorAll(selector);
    if (!elements.length) return { success: true, texts: [] };

    return { success: true, texts: Array.from(elements).map(e => e.textContent?.trim() || "") };
  }

  // Scroll in window
  scroll(windowId, direction = "down", amount = 3) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const scrollable = window.ref.querySelector("[class*='scroll']") || window.ref;
    const delta = direction === "down" ? amount * 50 : -amount * 50;
    scrollable.scrollBy({ top: delta, behavior: "smooth" });
    return { success: true };
  }

  // Get window structure (for agent to understand layout)
  getWindowStructure(windowId) {
    const window = this.windows.get(windowId);
    if (!window?.ref) return { success: false, error: "Window not found" };

    const buttons = Array.from(window.ref.querySelectorAll("button")).map(b => ({
      selector: this._getSelectorFor(b),
      text: b.textContent?.trim() || "",
    }));

    const inputs = Array.from(window.ref.querySelectorAll("input, textarea")).map(i => ({
      selector: this._getSelectorFor(i),
      type: i.type,
      placeholder: i.placeholder || "",
    }));

    const headings = Array.from(window.ref.querySelectorAll("h1, h2, h3")).map(h => ({
      level: h.tagName,
      text: h.textContent?.trim() || "",
    }));

    return {
      success: true,
      structure: {
        buttons,
        inputs,
        headings,
        mainText: window.ref.textContent?.substring(0, 500) || "",
      },
    };
  }

  // Helper: generate selector for element
  _getSelectorFor(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `input[name="${element.name}"]`;
    if (element.className) {
      const classes = element.className.split(" ").filter(c => !c.startsWith("_")).join(".");
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  }

  // Execute a sequence of actions
  async executeSequence(windowId, actions) {
    const results = [];
    for (const action of actions) {
      let result;
      switch (action.type) {
        case "click":
          result = this.clickElement(windowId, action.selector);
          break;
        case "fill":
          result = this.fillInput(windowId, action.selector, action.value);
          break;
        case "read":
          result = this.readText(windowId, action.selector);
          break;
        case "scroll":
          result = this.scroll(windowId, action.direction, action.amount);
          break;
        case "wait":
          await new Promise(resolve => setTimeout(resolve, action.ms || 500));
          result = { success: true };
          break;
        default:
          result = { success: false, error: `Unknown action: ${action.type}` };
      }
      results.push(result);
      if (!result.success) break; // Stop on first error
    }
    return results;
  }
}

// Singleton instance
export const hologramWindowAPI = new HologramWindowInteractionAPI();