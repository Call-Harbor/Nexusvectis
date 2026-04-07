import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * HologramAIAgent — AI that physically operates hologram windows.
 * Has pre-trained knowledge of every module's UI so it doesn't rely
 * solely on DOM scanning. Fast execution — faster than a human.
 */

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

// ── Pre-trained UI knowledge for every module ─────────────────────────────
const MODULE_KNOWLEDGE = {
  routes: {
    description: "Route management — create and view routes between locations.",
    buttons: ["Create Route", "Export", "AI Route Optimizer", "Edit", "Delete", "View"],
    inputs: ["Search by name, origin, destination..."],
    tabs: [],
    dialogs: {
      "Create Route": {
        buttons: ["Create Route", "AI Plan", "Manual Editor", "Cancel"],
        inputs: ["e.g. Copenhagen-Aarhus Express", "e.g. Copenhagen", "e.g. Aarhus", "Route Name", "Origin", "Destination", "Distance (km)", "Est. Duration (hours)"],
        selects: ["Transport Type", "Priority"]
      }
    }
  },
  fleet: {
    description: "Fleet vehicle list — view and manage all vehicles.",
    buttons: ["Add Vehicle", "Export", "Edit", "Delete", "View Details"],
    inputs: ["Search vehicles..."],
    tabs: ["All", "Active", "Maintenance", "Offline"],
    dialogs: {
      "Add Vehicle": {
        buttons: ["Save", "Cancel", "Add Vehicle"],
        inputs: ["Vehicle Name", "Driver", "Destination", "Fuel Level", "Cargo Capacity"]
      }
    }
  },
  fleet_map: {
    description: "Live GPS tracking map with vehicle locations.",
    buttons: ["Filter", "Refresh", "Center Map", "Export"],
    inputs: ["Search vehicle..."],
    tabs: ["All", "Active", "Trucks", "Ships", "Drones"]
  },
  shipments: {
    description: "Shipment tracking and management.",
    buttons: ["New Shipment", "Export", "Import", "Edit", "Delete", "Track"],
    inputs: ["Search shipments...", "Tracking Number", "Origin", "Destination", "Customer Name", "Weight (kg)"],
    tabs: ["All", "Pending", "In Transit", "Delivered", "Delayed"]
  },
  alerts: {
    description: "System alerts sorted by severity.",
    buttons: ["Mark all read", "Dismiss", "Resolve", "Create Alert", "Delete"],
    inputs: ["Search alerts..."],
    tabs: ["All", "Critical", "Warning", "Info"]
  },
  predictive_maintenance: {
    description: "AI predictive maintenance — schedule and predict failures.",
    buttons: ["Schedule Maintenance", "Run Analysis", "Export", "Mark Complete", "Add Record"],
    inputs: ["Search vehicles..."],
    tabs: ["Overview", "Vehicles", "Schedule", "History"]
  },
  performance_analytics: {
    description: "KPI dashboard — efficiency, CO2, delivery rates.",
    buttons: ["Export", "Refresh", "Generate Report"],
    inputs: [],
    tabs: ["Overview", "Vehicles", "Routes", "Emissions"]
  },
  demand_forecast: {
    description: "AI demand forecasting for capacity planning.",
    buttons: ["Generate Forecast", "Export", "Apply"],
    inputs: [],
    tabs: ["30 Days", "60 Days", "90 Days"]
  },
  risk_assessment: {
    description: "Operational risk analysis.",
    buttons: ["Run Assessment", "Export", "Refresh"],
    inputs: [],
    tabs: ["Overview", "Routes", "Vehicles", "Incidents"]
  },
  port_command: {
    description: "Port Command Center — vessels, berths, containers, cranes.",
    buttons: ["Add Vessel", "Schedule Berth", "Add Call", "Refresh", "Export", "Assign"],
    inputs: ["Search...", "Vessel Name", "IMO Number", "Destination"],
    tabs: ["Vessels", "Berths", "Containers", "Cranes", "Yard", "Gates"]
  },
  airport_ops: {
    description: "Airport Ops Center — flights, gates, baggage, ground handling.",
    buttons: ["Add Flight", "Assign Gate", "Refresh", "Export", "Add Staff"],
    inputs: ["Search flight...", "Flight Number", "Airline", "Origin", "Destination"],
    tabs: ["Live Dashboard", "Flights", "Gates", "Baggage", "Ground Handling", "Security", "Turnaround", "Staff", "Landside"]
  },
  document_editor: {
    description: "AI document editor — CMR, BOL, contracts, reports.",
    buttons: ["New Document", "Save", "Export PDF", "AI Generate", "Share", "Delete"],
    inputs: ["Document title...", "Search templates..."],
    tabs: ["My Documents", "Templates", "Shared"]
  },
  spreadsheet_editor: {
    description: "Excel-like spreadsheet for logistics data.",
    buttons: ["New Sheet", "Save", "Export", "Import CSV", "AI Fill"],
    inputs: [],
    tabs: ["Sheet 1"]
  },
  project_management: {
    description: "Kanban project board with tasks and milestones.",
    buttons: ["New Task", "New Project", "Add Column", "Delete", "Edit", "Assign"],
    inputs: ["Task title...", "Search...", "Project Name", "Description"],
    tabs: ["Board", "List", "Timeline"]
  },
  route_optimizer: {
    description: "AI route optimization — reduces fuel, time, CO2.",
    buttons: ["Run Optimization", "Apply", "Export", "Optimize All", "Reset"],
    inputs: [],
    tabs: ["Overview", "Savings", "Routes"]
  },
  swarm_intelligence: {
    description: "Multi-vehicle swarm coordination AI.",
    buttons: ["Activate Swarm", "Configure", "Run Analysis", "Stop", "Deploy"],
    inputs: ["Swarm radius..."],
    tabs: ["Overview", "Vehicles", "Commands"]
  },
  digital_twin: {
    description: "Digital twin federation — virtual asset copies.",
    buttons: ["Create Twin", "Simulate", "Refresh", "Sync", "Delete"],
    inputs: ["Asset name..."],
    tabs: ["Overview", "Assets", "Simulation", "Divergences"]
  },
  news_intelligence: {
    description: "Live logistics news with AI analysis and insights.",
    buttons: ["Refresh", "Filter", "Save Article", "Analyze"],
    inputs: ["Search news..."],
    tabs: ["All", "Disruptions", "Regulatory", "Market"]
  },
  satellite_weather: {
    description: "Satellite weather intelligence and route weather impact.",
    buttons: ["Refresh", "Toggle Layer", "Export"],
    inputs: [],
    tabs: ["Map", "Forecast", "Alerts"]
  },
  deep_analysis: {
    description: "Deep AI data analysis — patterns, anomalies, trends.",
    buttons: ["Run Analysis", "Export", "New Analysis"],
    inputs: ["Analysis query...", "Enter your analysis query..."],
    tabs: []
  },
  crm: {
    description: "CRM — customers, deals, activities, pipeline.",
    buttons: ["New Deal", "Add Customer", "Add Activity", "Export", "Edit", "Delete"],
    inputs: ["Search...", "Customer Name", "Company", "Email", "Phone", "Deal Value"],
    tabs: ["Pipeline", "Customers", "Activities", "Contracts"]
  },
  vehicles: {
    description: "Fleet vehicle management.",
    buttons: ["Add Vehicle", "Export", "Edit", "Delete"],
    inputs: ["Search vehicles...", "Vehicle Name", "Driver"],
    tabs: ["All", "Active", "Maintenance", "Offline"]
  },
  drivers: {
    description: "Driver management — profiles, licenses, performance.",
    buttons: ["Add Driver", "Export", "Edit", "Delete", "View Details"],
    inputs: ["Search drivers...", "First Name", "Last Name", "Email", "Phone", "License Number"],
    tabs: ["All", "Active", "On Leave", "Suspended"]
  },
  maintenance: {
    description: "Maintenance records and scheduling.",
    buttons: ["Add Maintenance", "Export", "Schedule", "Mark Complete", "Edit"],
    inputs: ["Search...", "Vehicle", "Component", "Description", "Cost Estimate"],
    tabs: ["Pending", "In Progress", "Completed", "Scheduled"]
  },
  hr: {
    description: "HR Management — employees, leave, performance, recruitment.",
    buttons: ["Add Employee", "New Leave Request", "Schedule Review", "Export", "Edit"],
    inputs: ["Search employees...", "Employee Name", "Department", "Email"],
    tabs: ["Employees", "Leave", "Performance", "Recruitment", "Training"]
  },
  invoices: {
    description: "Invoice management — billing, payments, PDF generation.",
    buttons: ["Generate Invoice", "Export PDF", "Mark Paid", "Send", "Delete"],
    inputs: ["Search invoices...", "Invoice Number"],
    tabs: ["All", "Pending", "Paid", "Overdue"]
  },
  resources: {
    description: "Resource management — warehouses, fuel depots, ports.",
    buttons: ["Add Resource", "Export", "Edit", "Delete"],
    inputs: ["Search resources...", "Resource Name", "Location"],
    tabs: ["All", "Operational", "Limited", "Offline"]
  },
  dashboard: {
    description: "Main dashboard with fleet overview KPIs.",
    buttons: ["Refresh", "Export", "Filter"],
    inputs: [],
    tabs: ["Overview", "Fleet", "Alerts", "Performance"]
  },
  fleet_drive: {
    description: "Fleet Drive — file storage for documents and assets.",
    buttons: ["Upload", "New Folder", "Delete", "Download", "Share"],
    inputs: ["Search files...", "Folder name..."],
    tabs: ["My Files", "Shared", "Recent"]
  },
  fleet_ai_trainer: {
    description: "H.A.R.B.O.R AI trainer — train custom AI workers.",
    buttons: ["Start Training", "Add Source", "Save", "Export Model"],
    inputs: ["URL or topic...", "Training prompt..."],
    tabs: ["Sources", "Training", "Models"]
  },
  parallel_processor: {
    description: "Parallel task processor — run multiple AI tasks simultaneously.",
    buttons: ["Add Task", "Run All", "Clear", "Export Results"],
    inputs: ["Enter task prompt..."],
    tabs: ["Queue", "Running", "Completed"]
  },
  fleet_3d_viewer: {
    description: "3D globe viewer of entire fleet.",
    buttons: ["Reset View", "Filter", "Toggle Labels"],
    inputs: [],
    tabs: []
  },
  vehicle_builder: {
    description: "Transport builder and simulator.",
    buttons: ["Build Vehicle", "Simulate", "Save", "Export"],
    inputs: ["Vehicle name..."],
    tabs: ["Builder", "Simulator", "Gallery"]
  },
  harbor_app_builder: {
    description: "H.A.R.B.O.R App Builder — create custom fleet apps.",
    buttons: ["New App", "Generate", "Install", "Preview", "Export"],
    inputs: ["App name...", "Describe your app..."],
    tabs: ["Apps", "Builder", "Installed"]
  },
  fleet_store: {
    description: "Fleet Store — install fleet add-on apps.",
    buttons: ["Install", "Uninstall", "View Details", "Search"],
    inputs: ["Search apps..."],
    tabs: ["All", "Installed", "Analytics", "Operations", "AI"]
  },
  image_generator: {
    description: "AI image generator for logistics visuals.",
    buttons: ["Generate", "Download", "Edit", "Save"],
    inputs: ["Describe the image...", "Prompt..."],
    tabs: []
  },
  image_editor: {
    description: "AI image editor.",
    buttons: ["Apply", "Save", "Export", "Reset", "Enhance"],
    inputs: ["Edit instructions..."],
    tabs: []
  },
  global_search: {
    description: "Global search across all entities.",
    buttons: ["Search", "Filter", "Open"],
    inputs: ["Search everything..."],
    tabs: ["All", "Vehicles", "Routes", "Shipments", "Alerts"]
  },
  web_browser: {
    description: "In-app web browser.",
    buttons: ["Go", "Back", "Forward", "Reload"],
    inputs: ["Enter URL..."],
    tabs: []
  },
  nexus_chat: {
    description: "Nexus satellite chat communication.",
    buttons: ["Send", "New Chat", "Attach File"],
    inputs: ["Type a message..."],
    tabs: ["Chats", "Channels"]
  },
  transit_console: {
    description: "Transit Control — bus lines, stops, schedules, demand.",
    buttons: ["Add Bus", "Add Line", "Add Stop", "Optimize", "Refresh", "Export"],
    inputs: ["Search...", "Line Name", "Stop Name"],
    tabs: ["Live Map", "Lines", "Stops", "Fleet", "Demand", "Analytics", "DRT", "Driver App"]
  },
  ai_dev_ide: {
    description: "Fleet AI IDE & DevOps — code editor and deployment.",
    buttons: ["Run", "Deploy", "Save", "New File", "Install Package"],
    inputs: ["// Write code here...", "Package name..."],
    tabs: ["Editor", "Terminal", "Deploy", "Logs"]
  },
  neuro_risk: {
    description: "Neuro-symbolic AI risk fusion — advanced multi-source risk modeling.",
    buttons: ["Run Analysis", "Export", "Configure", "Refresh"],
    inputs: [],
    tabs: ["Overview", "Risk Factors", "Predictions"]
  },
  company_analytics: {
    description: "Company analytics — research and insights about companies.",
    buttons: ["Analyze", "Export", "Save", "New Analysis"],
    inputs: ["Company name...", "Enter company name..."],
    tabs: ["Overview", "Financials", "News", "Competitors"]
  },
  profile_search: {
    description: "People intelligence — search and analyze professional profiles.",
    buttons: ["Search", "Analyze", "Export", "Save Profile"],
    inputs: ["Name...", "Company...", "Location..."],
    tabs: ["Search", "Results", "Saved"]
  },
};

/** Get the real scannable root — if container has an iframe, use its contentDocument */
function getEffectiveRoot(containerEl) {
  if (!containerEl) return document.body;
  const iframe = containerEl.querySelector('iframe');
  if (iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) return doc.body;
    } catch {}
  }
  return containerEl;
}

/** Deep DOM scan — extracts everything visible in a container */
function deepScanWindow(containerEl) {
  const root = getEffectiveRoot(containerEl);

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const scan = (el) => {
    const buttons = [...el.querySelectorAll(
      "button:not([disabled]), [role='button']:not([disabled]), [class*='btn']:not([disabled])"
    )].filter(isVisible).map(b => ({
      label: (
        b.textContent?.trim().replace(/\s+/g, " ") ||
        b.getAttribute("aria-label") ||
        b.getAttribute("title") ||
        b.getAttribute("data-label") ||
        (/(add|new|create|plus|fab|float)/i.test(b.className || "") ? "Add" : "")
      ).slice(0, 80),
      classes: b.className?.slice(0, 80)
    })).filter(b => b.label).slice(0, 60);

    const inputs = [...el.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")].filter(isVisible).map(i => ({
      label: (i.placeholder || i.getAttribute("aria-label") || i.name || i.id || "field").slice(0, 50),
      type: i.type || i.tagName.toLowerCase(),
      value: i.value?.slice(0, 30) || ""
    })).slice(0, 30);

    const tabs = [...el.querySelectorAll("[role='tab'], [data-state='active'], [data-state='inactive']")].filter(isVisible).map(t => ({
      label: t.textContent?.trim().slice(0, 40),
      active: t.getAttribute("data-state") === "active" || t.getAttribute("aria-selected") === "true"
    })).filter(t => t.label).slice(0, 20);

    const headings = [...el.querySelectorAll("h1,h2,h3,h4,[class*='title'],[class*='heading']")].filter(isVisible).map(h => h.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 10);

    const allText = [...el.querySelectorAll("p, span, td, [class*='label'], [class*='value'], [class*='stat']")]
      .filter(isVisible).map(e => e.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 100)
      .slice(0, 30).join(" | ");

    return { buttons, inputs, tabs, headings, text: allText.slice(0, 600) };
  };

  const result = scan(root);

  // If iframe scan found nothing, try container element directly
  if (result.buttons.length === 0 && result.inputs.length === 0) {
    if (containerEl && root !== containerEl) {
      const fallback = scan(containerEl);
      if (fallback.buttons.length > 0 || fallback.inputs.length > 0) return fallback;
    }
    return scan(document.body);
  }

  return result;
}

/** Find element by multiple strategies — also searches inside iframes */
function findElement(containerEl, label, type) {
  if (!label) return null;
  const lower = label.toLowerCase().trim();

  // Include iframe contentDocument in search roots
  const effectiveRoot = getEffectiveRoot(containerEl);
  const rootSet = new Set();
  if (effectiveRoot) rootSet.add(effectiveRoot);
  if (containerEl) rootSet.add(containerEl);
  rootSet.add(document.body);
  const roots = [...rootSet];

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  for (const root of roots) {
    const pool = type === "input"
      ? [...root.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")]
      : type === "tab"
      ? [...root.querySelectorAll("[role='tab'], [data-state='inactive'], [data-state='active']")]
      : [...root.querySelectorAll("button, [role='button'], [role='tab'], a, input, textarea, select, label, [class*='tab'], [class*='fab'], [class*='float'], [class*='btn']")];

    const visible = pool.filter(isVisible);

    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => e.textContent?.trim().toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => lower.includes(e.textContent?.trim().toLowerCase()) && e.textContent?.trim().length > 2);
    if (el) return el;
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => e.getAttribute("title")?.toLowerCase().includes(lower));
    if (el) return el;
    el = visible.find(e => (e.name || e.id || "").toLowerCase().includes(lower));
    if (el) return el;
    if (/add|new|create|opret|tilf/i.test(lower)) {
      el = visible.find(e => /add|new|create|plus|fab|float/i.test(e.className || ""));
      if (el) return el;
    }

    // For inputs: also find by associated <label> text or nearby label element
    if (type === "input") {
      const allInputs = [...root.querySelectorAll("input:not([type=hidden]):not([type=checkbox]), textarea, select")].filter(isVisible);
      for (const inp of allInputs) {
        // Check <label for="id"> association
        if (inp.id) {
          const lbl = root.querySelector(`label[for="${inp.id}"]`);
          if (lbl && lbl.textContent?.trim().toLowerCase().includes(lower)) return inp;
        }
        // Check aria-labelledby
        const labelledBy = inp.getAttribute("aria-labelledby");
        if (labelledBy) {
          const lbl = root.getElementById(labelledBy) || document.getElementById(labelledBy);
          if (lbl && lbl.textContent?.trim().toLowerCase().includes(lower)) return inp;
        }
        // Check parent/sibling label text
        const parent = inp.closest("div, fieldset, [class*='field'], [class*='form']");
        if (parent) {
          const lblEl = parent.querySelector("label, [class*='label']");
          if (lblEl && lblEl.textContent?.trim().toLowerCase().includes(lower)) return inp;
          // Also check all text nodes in parent
          const parentText = parent.textContent?.toLowerCase() || "";
          if (parentText.includes(lower)) return inp;
        }
      }
    }
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
      // ── PHASE 1: SCAN ─────────────────────────────────────────────────
      report("Scanning interface...", "scan");
      setAgentStatus("thinking", "Analyzing window structure");
      await new Promise(r => setTimeout(r, 200));

      const structure = deepScanWindow(containerEl);

      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        if (rect.width > 0) {
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.3, rect.top + rect.height * 0.3);
          await new Promise(r => setTimeout(r, 100));
          dispatchCursorAction("hover", "Reading interface", null, null,
            rect.left + rect.width * 0.7, rect.top + rect.height * 0.5);
          await new Promise(r => setTimeout(r, 80));
        }
      }

      // Retry scan if empty (window still rendering)
      let liveStructure = structure;
      if (structure.buttons.length === 0 && structure.inputs.length === 0) {
        for (let attempt = 0; attempt < 3; attempt++) {
          report(`Waiting for content... (${attempt + 1}/3)`, "think");
          await new Promise(r => setTimeout(r, 700));
          const retry = deepScanWindow(containerEl);
          if (retry.buttons.length > 0 || retry.inputs.length > 0) {
            liveStructure = retry;
            break;
          }
        }
      }

      report(`Found ${liveStructure.buttons.length} buttons, ${liveStructure.inputs.length} inputs`, "scan");

      // ── PHASE 2: PLAN ─────────────────────────────────────────────────
      report("Planning actions...", "plan");
      setAgentStatus("thinking", "Planning optimal action sequence");

      const knowledge = MODULE_KNOWLEDGE[windowType] || null;

      // Merge pre-trained knowledge with live scan
      const liveButtons = liveStructure.buttons.map(b => b.label).filter(Boolean);
      const liveInputs = liveStructure.inputs.map(i => i.label).filter(Boolean);
      const liveTabs = liveStructure.tabs.map(t => t.label).filter(Boolean);

      const knownButtons = knowledge?.buttons || [];
      const knownInputs = knowledge?.inputs || [];
      const knownTabs = knowledge?.tabs || [];

      // Also scan FABs
      const fabButtons = [...(containerEl?.querySelectorAll("[class*='fab'], [class*='float'], [class*='action-btn'], [class*='add-btn']") || [])]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .map(el => el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent?.trim() || "Add")
        .filter(Boolean);

      const allButtons = [...new Set([...liveButtons, ...fabButtons, ...knownButtons])];
      const allInputs = [...new Set([...liveInputs, ...knownInputs])];
      const allTabs = [...new Set([...liveTabs, ...knownTabs])];

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent operating the NexusVectis logistics platform — physically clicking buttons and typing in forms, FASTER than a human.

TASK: "${task}"
MODULE: "${windowType.replace(/_/g, ' ')}"
${knowledge ? `MODULE INFO: ${knowledge.description}` : ''}

=== BUTTONS (pre-trained + live scan — use EXACT text) ===
${allButtons.length > 0 ? allButtons.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'None detected yet — UI may still be loading'}

=== INPUT FIELDS (use EXACT placeholder/label text) ===
${allInputs.length > 0 ? allInputs.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'None'}

=== TABS ===
${allTabs.length > 0 ? allTabs.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'None'}

=== VISIBLE DATA ===
${liveStructure.text.slice(0, 400) || 'loading...'}

RULES:
1. Generate 3-8 steps. Be concise and direct — no unnecessary hover/think steps.
2. CLICK steps: use button labels from the BUTTONS list above. Even if not in live scan, use known button names.
3. TYPE steps: use EXACT input placeholder from INPUT FIELDS. Provide realistic values.
4. For "create" tasks: click the primary creation button (e.g. "Create Route", "Add Vehicle", "New Shipment").
5. After clicking a create button, a dialog will open — fill its fields and click the submit button inside.
6. For "search/filter": type directly in the search input.
7. For "navigate to tab": use tab step type.
8. Always end with a narrate step summarizing what was accomplished.
9. If a button is in the KNOWN list but not live scan, still plan to click it — it may just not be visible yet.

Return JSON only:
{ "steps": [ {"type": "click|type|tab|think|narrate|scroll", "label": "...", "value": "...", "text": "..."} ], "summary": "one sentence summary" }`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "object", additionalProperties: true } },
            summary: { type: "string" }
          }
        }
      });

      let steps = planResult?.steps || [];
      report(`Plan: ${steps.filter(s => ["click","type","tab"].includes(s.type)).length} actions`, "plan");

      // ── Helpers ────────────────────────────────────────────────────────
      // Check both main document AND iframe document for dialogs
      const getActiveDialog = () => {
        const selector = '[role="dialog"][data-state="open"], [role="dialog"].fixed, [role="alertdialog"], [data-radix-dialog-content]';
        // Check main document first (Radix portals render here)
        const mainDialog = document.querySelector(selector);
        if (mainDialog) return mainDialog;
        // Also check iframe document
        try {
          const iframe = containerEl?.querySelector('iframe');
          const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
          if (iframeDoc) return iframeDoc.querySelector(selector);
        } catch {}
        return null;
      };

      const rePlanRemaining = async (remainingTask, executedSoFar) => {
        const dialog = getActiveDialog();
        const scanRoot = dialog || containerEl;
        const fresh = deepScanWindow(scanRoot);
        const bLabels = [...new Set([...fresh.buttons.map(b => b.label), ...(knowledge?.dialogs?.[executedSoFar.find(e => e.startsWith('clicked:'))?.replace('clicked:', '')] || knowledge)?.buttons || []])].filter(Boolean);
        const iLabels = [...new Set([...fresh.inputs.map(i => i.label), ...(knowledge?.dialogs?.[executedSoFar.find(e => e.startsWith('clicked:'))?.replace('clicked:', '')] || knowledge)?.inputs || []])].filter(Boolean);
        const tLabels = fresh.tabs.map(t => t.label).filter(Boolean);
        report(`Re-scanning ${dialog ? 'dialog' : 'window'}: ${bLabels.length} buttons, ${iLabels.length} inputs`, "scan");
        const rePlan = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI agent inside NexusVectis UI.\n\nOriginal task: "${task}"\nRemaining goal: "${remainingTask}"\nDone so far: ${executedSoFar.join(', ')}\n\n=== CURRENT BUTTONS ===\n${bLabels.length > 0 ? bLabels.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'none'}\n\n=== CURRENT INPUT FIELDS ===\n${iLabels.length > 0 ? iLabels.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'none'}\n\n=== CURRENT TABS ===\n${tLabels.length > 0 ? tLabels.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'none'}\n\nGenerate remaining steps. ONLY use exact strings from lists above. JSON: { "steps": [{"type": "click|type|tab|think|narrate", "label": "...", "value": "...", "text": "..."}], "summary": "..." }`,
          response_json_schema: { type: "object", properties: { steps: { type: "array", items: { type: "object", additionalProperties: true } }, summary: { type: "string" } } }
        });
        return rePlan?.steps || [];
      };

      // ── PHASE 3: EXECUTE ──────────────────────────────────────────────
      setAgentStatus("working", task.slice(0, 50));
      const executedLabels = [];
      let activeRoot = containerEl;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === "think") {
          report(`💭 ${step.text || step.label}`, "think");
          await new Promise(r => setTimeout(r, 80));
          continue;
        }

        if (step.type === "narrate") {
          report(`✅ ${step.text || step.label}`, "narrate");
          continue;
        }

        if (step.type === "tab") {
          const el = findElement(activeRoot, step.label, "tab");
          report(`📌 Tab: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            el.click();
            await new Promise(r => setTimeout(r, 300));
          }
          continue;
        }

        if (step.type === "click") {
          const el = findElement(activeRoot, step.label, "button")
            || findElement(activeRoot, step.label, "tab")
            || findElement(document.body, step.label, "button")
            || findElement(document.body, step.label, "any");
          report(`🖱 Click: ${step.label}`, "click");
          if (el) {
            const rect = el.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            el.click();
            await new Promise(r => setTimeout(r, 350));
          } else {
            report(`⚠️ Button "${step.label}" not found — trying anyway`, "think");
            if (containerEl) {
              const r = containerEl.getBoundingClientRect();
              dispatchCursorAction("click", step.label, null, null, r.left + r.width * 0.5, r.top + r.height * 0.4);
            }
            await new Promise(r => setTimeout(r, 200));
          }
          executedLabels.push(`clicked:${step.label}`);

          // Check if dialog opened
          await new Promise(r => setTimeout(r, 250));
          const dialog = getActiveDialog();
          if (dialog && activeRoot !== dialog) {
            activeRoot = dialog;
            report(`💬 Dialog opened — re-planning form fields`, "think");
            if (i < steps.length - 1) {
              const remaining = steps.slice(i + 1);
              const remainingGoal = remaining.map(s => s.text || s.label || s.value).filter(Boolean).join(", ");
              const newSteps = await rePlanRemaining(remainingGoal || task, executedLabels);
              if (newSteps.length > 0) {
                steps = [...steps.slice(0, i + 1), ...newSteps];
                report(`Re-planned: ${newSteps.filter(s => ["click","type"].includes(s.type)).length} new actions`, "plan");
              }
            }
          }
          continue;
        }

        if (step.type === "type") {
          const typeEl = findElement(activeRoot, step.label, "input")
            || findElement(document.body, step.label, "input");
          const val = step.value || "";
          report(`⌨️ Type "${val.slice(0, 25)}" in ${step.label}`, "type");
          if (typeEl) {
            const rect = typeEl.getBoundingClientRect();
            dispatchCursorAction("type", step.label, null, val, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            // Use the element's own window context (important for iframes)
            const elWin = typeEl.ownerDocument?.defaultView || window;
            typeEl.focus();
            // Clear existing value first
            const nativeInputProto = typeEl.tagName === "TEXTAREA"
              ? elWin.HTMLTextAreaElement.prototype
              : elWin.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(nativeInputProto, "value")?.set;
            if (setter) {
              setter.call(typeEl, "");
              typeEl.dispatchEvent(new Event("input", { bubbles: true }));
            }
            // Set new value
            if (setter) {
              setter.call(typeEl, val);
              typeEl.dispatchEvent(new Event("input", { bubbles: true }));
              typeEl.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
              // Fallback: simulate keypresses character by character
              typeEl.value = val;
              typeEl.dispatchEvent(new Event("input", { bubbles: true }));
              typeEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
            // Also dispatch a React-compatible synthetic event via nativeInputValueSetter
            typeEl.dispatchEvent(new InputEvent("input", { bubbles: true, data: val }));
            await new Promise(r => setTimeout(r, 150));
          } else {
            report(`⚠️ Input "${step.label}" not found`, "think");
            await new Promise(r => setTimeout(r, 100));
          }
          executedLabels.push(`typed:${step.label}=${val.slice(0, 20)}`);
          continue;
        }

        if (step.type === "scroll") {
          report(`📜 Scroll ${step.direction || "down"}`, "scroll");
          if (containerEl) {
            const r = containerEl.getBoundingClientRect();
            dispatchCursorAction("scroll", step.direction || "down", null, null, r.left + r.width / 2, r.top + r.height / 2);
            containerEl.scrollBy({ top: step.direction === "up" ? -200 : 200, behavior: "smooth" });
          }
          await new Promise(r => setTimeout(r, 250));
          continue;
        }
      }

      await new Promise(r => setTimeout(r, 200));
      setAgentStatus("idle");
      busyRef.current = false;

      return {
        summary: planResult.summary || "Task completed",
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