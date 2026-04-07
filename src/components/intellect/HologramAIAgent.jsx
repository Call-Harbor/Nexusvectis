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

/** Collect all searchable roots: container + all iframe documents inside it */
function getAllRoots(containerEl) {
  const roots = [];
  if (!containerEl) { roots.push(document.body); return roots; }

  // Add all iframe documents first (highest priority)
  const iframes = containerEl.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) roots.push(doc.body);
    } catch {}
  }

  // Add the container itself
  roots.push(containerEl);

  // Add main document as last resort
  if (!roots.includes(document.body)) roots.push(document.body);

  return roots;
}

/** Get primary iframe doc or container */
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

/** Fill an input/textarea/select with a value, triggering all React-compatible events */
function fillElement(el, val) {
  const elWin = el.ownerDocument?.defaultView || window;
  el.focus();

  if (el.tagName === 'SELECT') {
    // Find matching option by text or value
    const lower = val.toLowerCase();
    const opt = [...el.options].find(o =>
      o.value.toLowerCase() === lower ||
      o.text.toLowerCase() === lower ||
      o.text.toLowerCase().includes(lower)
    );
    if (opt) {
      const nativeSetter = Object.getOwnPropertyDescriptor(elWin.HTMLSelectElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(el, opt.value);
      else el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  if (el.type === 'checkbox' || el.type === 'radio') {
    const shouldCheck = /true|yes|1|on|check/i.test(val);
    if (el.checked !== shouldCheck) {
      el.click();
    }
    return;
  }

  // input / textarea
  const proto = el.tagName === 'TEXTAREA'
    ? elWin.HTMLTextAreaElement.prototype
    : elWin.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (setter) {
    setter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(el, val);
  } else {
    el.value = val;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: val }));
}

/** Deep DOM scan — extracts EVERYTHING visible in a container, including iframes */
function deepScanWindow(containerEl) {
  const roots = getAllRoots(containerEl);

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const scan = (root) => {
    const buttons = [...root.querySelectorAll(
      "button:not([disabled]), [role='button']:not([disabled]), [class*='btn']:not([disabled])"
    )].filter(isVisible).map(b => ({
      label: (
        b.textContent?.trim().replace(/\s+/g, " ") ||
        b.getAttribute("aria-label") ||
        b.getAttribute("title") ||
        b.getAttribute("data-label") ||
        (/(add|new|create|plus|fab|float)/i.test(b.className || "") ? "Add" : "")
      ).slice(0, 80),
    })).filter(b => b.label).slice(0, 60);

    const inputs = [...root.querySelectorAll(
      "input:not([type=hidden]), textarea, select"
    )].filter(isVisible).map(i => {
      // Resolve label from <label for>, aria-labelledby, or parent label
      let label = i.placeholder || i.getAttribute("aria-label") || "";
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
      if (!label) {
        const parent = i.closest("div, fieldset, [class*='field'], [class*='form-item'], [class*='form-group']");
        if (parent) {
          const lbl = parent.querySelector("label, [class*='label']");
          if (lbl) label = lbl.textContent?.trim() || "";
        }
      }
      if (!label) label = i.name || i.id || "field";

      // For selects, include option values
      const options = i.tagName === 'SELECT'
        ? [...i.options].map(o => o.text).filter(Boolean)
        : [];

      return {
        label: label.slice(0, 60),
        type: i.type || i.tagName.toLowerCase(),
        options,
        value: i.value?.slice(0, 30) || ""
      };
    }).slice(0, 40);

    const tabs = [...root.querySelectorAll("[role='tab'], [data-state='active'], [data-state='inactive']")].filter(isVisible).map(t => ({
      label: t.textContent?.trim().slice(0, 40),
      active: t.getAttribute("data-state") === "active" || t.getAttribute("aria-selected") === "true"
    })).filter(t => t.label).slice(0, 20);

    const headings = [...root.querySelectorAll("h1,h2,h3,h4,[class*='title'],[class*='heading']")].filter(isVisible).map(h => h.textContent?.trim().slice(0, 60)).filter(Boolean).slice(0, 10);

    const allText = [...root.querySelectorAll("p, span, td, [class*='label'], [class*='value'], [class*='stat']")]
      .filter(isVisible).map(e => e.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 100)
      .slice(0, 30).join(" | ");

    return { buttons, inputs, tabs, headings, text: allText.slice(0, 600) };
  };

  // Merge results from all roots, preferring iframe content
  let merged = { buttons: [], inputs: [], tabs: [], headings: [], text: "" };
  for (const root of roots) {
    const r = scan(root);
    if (r.buttons.length > merged.buttons.length) merged.buttons = r.buttons;
    if (r.inputs.length > merged.inputs.length) merged.inputs = r.inputs;
    if (r.tabs.length > merged.tabs.length) merged.tabs = r.tabs;
    if (r.headings.length > merged.headings.length) merged.headings = r.headings;
    if (r.text.length > merged.text.length) merged.text = r.text;
  }

  return merged;
}

/** Find element by multiple strategies — searches ALL roots including iframes */
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
      ? [...root.querySelectorAll("input:not([type=hidden]), textarea, select")]
      : type === "tab"
      ? [...root.querySelectorAll("[role='tab'], [data-state='inactive'], [data-state='active']")]
      : [...root.querySelectorAll("button, [role='button'], [role='tab'], a, input, textarea, select, label, [class*='tab'], [class*='fab'], [class*='float'], [class*='btn']")];

    const visible = pool.filter(isVisible);

    // Exact text match
    let el = visible.find(e => e.textContent?.trim().toLowerCase() === lower);
    if (el) return el;
    // Placeholder exact
    el = visible.find(e => e.placeholder?.toLowerCase() === lower);
    if (el) return el;
    // Placeholder contains
    el = visible.find(e => e.placeholder?.toLowerCase().includes(lower));
    if (el) return el;
    // Text contains
    el = visible.find(e => e.textContent?.trim().toLowerCase().includes(lower));
    if (el) return el;
    // Label contains search term
    el = visible.find(e => lower.includes(e.textContent?.trim().toLowerCase()) && e.textContent?.trim().length > 2);
    if (el) return el;
    // aria-label
    el = visible.find(e => e.getAttribute("aria-label")?.toLowerCase().includes(lower));
    if (el) return el;
    // title
    el = visible.find(e => e.getAttribute("title")?.toLowerCase().includes(lower));
    if (el) return el;
    // name/id
    el = visible.find(e => (e.name || e.id || "").toLowerCase().includes(lower));
    if (el) return el;
    // FAB patterns
    if (/add|new|create|opret|tilf/i.test(lower)) {
      el = visible.find(e => /add|new|create|plus|fab|float/i.test(e.className || ""));
      if (el) return el;
    }

    // For inputs: resolve via associated label elements
    if (type === "input") {
      const allInputs = [...root.querySelectorAll("input:not([type=hidden]), textarea, select")].filter(isVisible);
      for (const inp of allInputs) {
        if (inp.id) {
          const lbl = root.querySelector(`label[for="${inp.id}"]`);
          if (lbl && lbl.textContent?.trim().toLowerCase().includes(lower)) return inp;
        }
        const labelledBy = inp.getAttribute("aria-labelledby");
        if (labelledBy) {
          const lbl = root.getElementById(labelledBy);
          if (lbl && lbl.textContent?.trim().toLowerCase().includes(lower)) return inp;
        }
        const parent = inp.closest("div, fieldset, [class*='field'], [class*='form-item'], [class*='form-group']");
        if (parent) {
          const lblEl = parent.querySelector("label, [class*='label']");
          if (lblEl && lblEl.textContent?.trim().toLowerCase().includes(lower)) return inp;
          if (parent.textContent?.toLowerCase().includes(lower)) return inp;
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

      // Build select options info for the prompt
      const selectsInfo = liveStructure.inputs
        .filter(i => i.type === 'select' && i.options?.length > 0)
        .map(i => `  "${i.label}" options: [${i.options.slice(0, 10).join(', ')}]`)
        .join('\n');

      const planResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent operating the NexusVectis logistics platform — physically clicking buttons and typing in forms.

TASK: "${task}"
MODULE: "${windowType.replace(/_/g, ' ')}"
${knowledge ? `MODULE INFO: ${knowledge.description}` : ''}

=== BUTTONS (use EXACT text) ===
${allButtons.length > 0 ? allButtons.map((b, i) => `${i + 1}. "${b}"`).join('\n') : 'None detected yet'}

=== INPUT FIELDS (use EXACT placeholder/label) ===
${allInputs.length > 0 ? allInputs.map((f, i) => `${i + 1}. "${f}"`).join('\n') : 'None'}

=== SELECT DROPDOWNS (options available) ===
${selectsInfo || 'None'}

=== TABS ===
${allTabs.length > 0 ? allTabs.map((t, i) => `${i + 1}. "${t}"`).join('\n') : 'None'}

=== VISIBLE DATA ===
${liveStructure.text.slice(0, 400) || 'loading...'}

RULES:
1. Generate 3-8 steps. Be concise and direct.
2. CLICK steps: click buttons using exact label text.
3. TYPE steps: use EXACT input placeholder/label. Provide realistic values.
4. SELECT steps: use type="select" with label=field name, value=option to pick.
5. CHECK steps: use type="check" with label=checkbox/radio name, value="true" or "false".
6. For "create" tasks: click the primary creation button first, then fill the dialog form fields.
7. For "search": type in the search input.
8. For "navigate to tab": use type="tab".
9. Always end with a narrate step summarizing what was accomplished.
10. Use known button names even if not in live scan — they may appear after loading.

Return JSON only:
{ "steps": [ {"type": "click|type|select|check|tab|think|narrate|scroll", "label": "...", "value": "...", "text": "..."} ], "summary": "one sentence summary" }`,
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

        if (step.type === "select") {
          const selEl = findElement(activeRoot, step.label, "input")
            || findElement(document.body, step.label, "input");
          const val = step.value || "";
          report(`🔽 Select "${val}" in ${step.label}`, "type");
          if (selEl) {
            const rect = selEl.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            fillElement(selEl, val);
            await new Promise(r => setTimeout(r, 200));
          } else {
            report(`⚠️ Select "${step.label}" not found`, "think");
          }
          executedLabels.push(`selected:${step.label}=${val.slice(0, 20)}`);
          continue;
        }

        if (step.type === "check") {
          const checkEl = findElement(activeRoot, step.label, "input")
            || findElement(document.body, step.label, "input");
          const val = step.value || "true";
          report(`☑️ Check "${step.label}" = ${val}`, "click");
          if (checkEl) {
            const rect = checkEl.getBoundingClientRect();
            dispatchCursorAction("click", step.label, null, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            await new Promise(r => setTimeout(r, 80));
            fillElement(checkEl, val);
            await new Promise(r => setTimeout(r, 150));
          } else {
            report(`⚠️ Checkbox "${step.label}" not found`, "think");
          }
          executedLabels.push(`checked:${step.label}`);
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
            fillElement(typeEl, val);
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