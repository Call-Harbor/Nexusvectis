import { base44 } from "@/api/base44Client";

/**
 * Dynamic, self-learning AI agent that observes results, 
 * adapts strategy, and improves with each task.
 */

async function loadMemory(windowType, orgId) {
  try {
    const memories = await base44.entities.AdaptiveAgentMemory.filter({
      window_type: windowType,
      created_by: (await base44.auth.me()).email,
    });
    return memories.length > 0 ? memories[0] : null;
  } catch {
    return null;
  }
}

async function saveMemory(memory, windowType, orgId) {
  try {
    if (memory.id) {
      await base44.entities.AdaptiveAgentMemory.update(memory.id, memory);
    } else {
      await base44.entities.AdaptiveAgentMemory.create({
        window_type: windowType,
        ...memory,
      });
    }
  } catch (e) {
    console.error("Failed to save memory:", e);
  }
}

export async function runDynamicLearningSelfAgent(
  containerEl,
  windowType,
  task,
  orgId,
  onStep
) {
  const report = (text, phase) => onStep?.({ text, phase });

  try {
    // Phase 1: Load prior knowledge
    report("🧠 Læser hukommelse...", "think");
    const memory = await loadMemory(windowType, orgId);
    
    report(`📊 Tillid: ${memory?.confidence_score || 0}%`, "scan");

    // Phase 2: Adaptive analysis
    report("🔍 Analyserer interface...", "scan");
    const analysis = await analyzePageDynamically(containerEl, memory);

    // Phase 3: Strategy selection (learned or new)
    report("🤖 Vælger strategi...", "plan");
    const strategy = selectAdaptiveStrategy(task, memory, analysis);
    
    report(`📋 Strategi: ${strategy.name}`, "narrate");

    // Phase 4: Execute with real-time learning
    report("⚙️ Udfører og lærer...", "click");
    const result = await executeAndLearn(
      containerEl,
      strategy,
      analysis,
      onStep
    );

    // Phase 5: Update memory with results
    report("💾 Gemmer erfaringer...", "narrate");
    await updateMemoryWithResults(memory, windowType, strategy, result, orgId);

    return {
      summary: `✅ ${result.success ? "Succès" : "Forsøg"}: ${result.description}`,
      steps: result.steps,
      learned: true,
    };
  } catch (err) {
    report(`❌ Fejl: ${err.message}`, "error");
    return { summary: `Error: ${err.message}`, steps: 0, learned: false };
  }
}

async function analyzePageDynamically(container, memory) {
  const analysis = {
    buttons: [],
    inputs: [],
    selectableElements: [],
    context: "",
  };

  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.opacity !== "0";
  };

  // Find buttons
  const buttonEls = container.querySelectorAll(
    "button, [role='button'], a[onclick]"
  );
  for (const el of buttonEls) {
    if (!isVisible(el)) continue;
    const text = (el.textContent || el.getAttribute("aria-label") || "").trim();
    if (text) {
      analysis.buttons.push({
        text: text.slice(0, 60),
        el,
        priority: memory?.success_strategies?.some(s =>
          s.action_sequence.some(a => a.toLowerCase().includes(text.toLowerCase()))
        ) ? "high" : "normal",
      });
    }
  }

  // Find inputs
  const inputEls = container.querySelectorAll(
    "input:not([type='hidden']), textarea, select"
  );
  for (const el of inputEls) {
    if (!isVisible(el)) continue;
    const label = el.placeholder || el.getAttribute("name") || "";
    analysis.inputs.push({
      label: label.slice(0, 40),
      el,
      type: el.type || "text",
    });
  }

  analysis.context = container.innerText?.slice(0, 1500) || "";

  // Sort by memory-learned priority
  analysis.buttons.sort((a, b) =>
    a.priority === "high" && b.priority !== "high" ? -1 : 1
  );

  return analysis;
}

function selectAdaptiveStrategy(task, memory, analysis) {
  // If we have high-confidence strategies, use them
  if (memory?.success_strategies && memory.success_strategies.length > 0) {
    const bestStrategy = memory.success_strategies.sort(
      (a, b) => (b.success_rate || 0) - (a.success_rate || 0)
    )[0];

    if (bestStrategy.success_rate > 70) {
      return {
        name: "Learned Pattern",
        type: "learned",
        actions: bestStrategy.action_sequence,
        confidence: memory.confidence_score,
      };
    }
  }

  // Avoid known failure patterns
  const avoidedActions = new Set(
    memory?.failure_patterns?.flatMap(p => p.avoided_actions) || []
  );

  // Smart button selection: prefer create/add buttons
  const priorityButtons = analysis.buttons.filter(b => {
    const text = b.text.toLowerCase();
    const isAvoid = avoidedActions.has(text);
    const isCreateLike =
      text.match(/add|create|new|start|open|lav|opret/i) && !isAvoid;
    return isCreateLike;
  });

  return {
    name: "Adaptive Heuristic",
    type: "heuristic",
    actions: priorityButtons.slice(0, 2).map(b => b.text),
    confidence: 50 + (memory?.confidence_score || 0) * 0.3,
  };
}

async function executeAndLearn(container, strategy, analysis, onStep) {
  const steps = [];
  let success = true;
  let description = "Task attempted";

  try {
    // Execute actions from strategy
    for (const actionText of strategy.actions) {
      onStep?.({ text: `🖱️ ${actionText}`, phase: "click" });
      const btn = analysis.buttons.find(b =>
        b.text.toLowerCase().includes(actionText.toLowerCase())
      );

      if (btn) {
        btn.el.click();
        steps.push(`clicked: ${actionText}`);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Try to fill visible inputs
    if (analysis.inputs.length > 0) {
      onStep?.({ text: "⌨️ Fylder formular...", phase: "type" });
      for (const input of analysis.inputs.slice(0, 3)) {
        const value = generateSmartValue(input.label);
        if (value) {
          input.el.focus();
          input.el.value = value;
          input.el.dispatchEvent(new Event("input", { bubbles: true }));
          input.el.dispatchEvent(new Event("change", { bubbles: true }));
          steps.push(`filled: ${input.label}`);
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    // Find and click submit-like button
    const submitBtn = analysis.buttons.find(b =>
      b.text.toLowerCase().match(/create|save|submit|ok|lav|gem/i)
    );
    if (submitBtn) {
      onStep?.({ text: `✓ Sender...`, phase: "click" });
      submitBtn.el.click();
      steps.push("submitted");
      await new Promise(r => setTimeout(r, 800));
      success = true;
      description = "Task completed";
    }
  } catch (err) {
    success = false;
    description = err.message;
    onStep?.({ text: `❌ ${err.message}`, phase: "error" });
  }

  return { success, description, steps };
}

function generateSmartValue(label) {
  const l = label.toLowerCase();
  if (l.includes("name")) return "Test User";
  if (l.includes("email")) return "test@example.com";
  if (l.includes("phone")) return "+4512345678";
  if (l.includes("date")) return new Date().toISOString().split("T")[0];
  if (l.includes("number") || l.includes("price")) return "1000";
  return "Test Data";
}

async function updateMemoryWithResults(memory, windowType, strategy, result, orgId) {
  const updated = {
    ...memory,
    window_type: windowType,
    last_updated: new Date().toISOString(),
  };

  if (result.success) {
    // Update success strategies
    if (!updated.success_strategies) updated.success_strategies = [];

    const existing = updated.success_strategies.find(s =>
      JSON.stringify(s.action_sequence) === JSON.stringify(strategy.actions)
    );

    if (existing) {
      existing.success_count = (existing.success_count || 0) + 1;
    } else {
      updated.success_strategies.push({
        action_sequence: strategy.actions,
        success_count: 1,
        failure_count: 0,
      });
    }

    // Increase confidence
    updated.confidence_score = Math.min(
      100,
      (updated.confidence_score || 50) + 10
    );
  } else {
    // Track failures
    if (!updated.failure_patterns) updated.failure_patterns = [];

    const failPattern = updated.failure_patterns.find(p =>
      JSON.stringify(p.avoided_actions) === JSON.stringify(strategy.actions)
    );

    if (failPattern) {
      failPattern.count = (failPattern.count || 0) + 1;
    } else {
      updated.failure_patterns.push({
        error_type: result.description,
        avoided_actions: strategy.actions,
        count: 1,
      });
    }

    // Decrease confidence
    updated.confidence_score = Math.max(0, (updated.confidence_score || 50) - 5);
  }

  // Recalculate success rates
  if (updated.success_strategies) {
    for (const s of updated.success_strategies) {
      const total = (s.success_count || 0) + (s.failure_count || 0);
      s.success_rate = total > 0 ? ((s.success_count || 0) / total) * 100 : 0;
    }
  }

  await saveMemory(updated, windowType, orgId);
}