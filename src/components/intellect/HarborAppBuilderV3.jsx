import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Plus, Search, Trash2, Save, Eye, Code2, Copy, Loader2,
  ChevronRight, Database, LayoutGrid, Zap, Settings, Sparkles,
  ArrowRight, Terminal, Cpu, Globe, Layers, Play, RefreshCw,
  CheckCircle2, Circle, Box, Wand2, Rocket, PanelLeft, Store, Upload, X
} from "lucide-react";
import { toast } from "sonner";
import DatabaseDesigner from "./DatabaseDesigner";

/** Pick serializable user fields so iframe JSON never throws (avoids blank preview). */
function safePickUser(u) {
  if (!u || typeof u !== "object") return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? u.name ?? u.display_name,
    role: u.role,
    organization_id: u.organization_id ?? u.data?.organization_id,
  };
}

function slimList(arr, max = 100) {
  return Array.isArray(arr) ? arr.slice(0, max) : [];
}

/** Safe payload for blob-URL iframe — prevents JSON.stringify failures from breaking the sandbox. */
function buildSandboxOrgData(orgId, vehicles, routes, shipments, alerts, customers, currentUser) {
  const payload = {
    orgId: orgId ?? null,
    vehicles: slimList(vehicles),
    routes: slimList(routes),
    shipments: slimList(shipments),
    alerts: slimList(alerts, 60),
    customers: slimList(customers),
    currentUser: safePickUser(currentUser),
  };
  try {
    JSON.stringify(payload);
    return payload;
  } catch {
    return {
      orgId: payload.orgId,
      vehicles: [],
      routes: [],
      shipments: [],
      alerts: [],
      customers: [],
      currentUser: safePickUser(currentUser),
    };
  }
}

/** Unwrap Base44 / InvokeLLM JSON results (string, markdown fences, or nested objects). */
function normalizeJsonFromLlm(raw) {
  const parseString = (s) => {
    if (typeof s !== "string") return null;
    let t = s.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    try {
      return JSON.parse(t);
    } catch {
      const m = t.match(/\{[\s\S]*\}/);
      try {
        return m ? JSON.parse(m[0]) : null;
      } catch {
        return null;
      }
    }
  };
  if (raw == null) return null;
  if (typeof raw === "string") return parseString(raw);
  if (typeof raw === "object") {
    if (!Array.isArray(raw) && raw.entities !== undefined) return raw;
    for (const k of ["content", "text", "message", "response", "output", "result", "data"]) {
      if (raw[k] != null) {
        const inner = typeof raw[k] === "string" ? parseString(raw[k]) : normalizeJsonFromLlm(raw[k]);
        if (inner && typeof inner === "object") return inner;
      }
    }
  }
  return typeof raw === "object" ? raw : null;
}

function normalizeCodeFromLlm(raw) {
  if (raw == null) return "";
  let code = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? (raw.content || raw.text || raw.message || raw.code || "") : "");
  if (typeof code !== "string") code = String(code ?? "");
  code = code.replace(/^```(?:jsx?|javascript|js)?\n?/gm, "").replace(/```\s*$/gm, "").trim();
  return code;
}

function LiveAppSandbox({ code, orgId, vehicles, routes, shipments, alerts, customers, currentUser, onCodeFixed }) {
  const iframeRef = useRef(null);
  const [autoFixing, setAutoFixing] = useState(false);
  const [fixAttempts, setFixAttempts] = useState(0);
  const lastErrorRef = useRef(null);

  // Listen for errors from the iframe
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === "APP_ERROR" && !autoFixing && fixAttempts < 3) {
        const errorMsg = event.data.message;
        if (lastErrorRef.current === errorMsg) return; // avoid loops
        lastErrorRef.current = errorMsg;
        setAutoFixing(true);
        setFixAttempts(prev => prev + 1);
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Fix this React app error. Return ONLY the corrected JavaScript code, no markdown, no backticks, no explanations.

ERROR: ${errorMsg}

CODE:
${code}

Rules:
- Keep function named GeneratedApp
- Use only inline styles (no className)
- Fix only the error, keep all other functionality intact`,
            response_json_schema: null
          });
          const fixed = normalizeCodeFromLlm(result);
          if (fixed && (fixed.includes("function GeneratedApp") || fixed.includes("GeneratedApp"))) {
            onCodeFixed?.(fixed);
          }
        } catch (e) {
          console.error("Auto-fix failed:", e);
        }
        setAutoFixing(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code, autoFixing, fixAttempts, onCodeFixed]);

  useEffect(() => {
    // Reset fix attempts when new code is loaded
    setFixAttempts(0);
    lastErrorRef.current = null;
  }, [code]);

  useEffect(() => {
    if (!code || !iframeRef.current) return;
    const orgPayload = buildSandboxOrgData(orgId, vehicles, routes, shipments, alerts, customers, currentUser);
    const orgDataScript = `window.__ORG_DATA__ = ${JSON.stringify(orgPayload)};`;
    // NexusVectis auth — injected into every generated app (minimal fields only)
    const nvUser = orgPayload.currentUser ? JSON.stringify(orgPayload.currentUser) : "null";
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  body { margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
</style>
</head>
<body>
<div id="root"><\/div>
<script>${orgDataScript}
window.__NV_USER__ = ${nvUser};
<\/script>
<script type="text/babel">
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const orgData = window.__ORG_DATA__;
const nvUser = window.__NV_USER__;

// NexusVectis auth gate — wraps every generated app
function NVAuthGate({ children }) {
  if (!nvUser) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
        <div style={{textAlign:'center',padding:'2rem',borderRadius:'1rem',border:'1px solid #1e293b',background:'#0f172a',maxWidth:'360px'}}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" style={{height:'48px',margin:'0 auto 1.5rem',display:'block'}} alt="NexusVectis" />
          <p style={{color:'#94a3b8',fontSize:'14px',marginBottom:'1.5rem'}}>Sign in to your NexusVectis account to access this app.</p>
          <div style={{padding:'10px 20px',background:'linear-gradient(to right,#0891b2,#7c3aed)',borderRadius:'8px',color:'white',fontSize:'14px',fontWeight:600,display:'inline-block'}}>
            🔒 NexusVectis Login Required
          </div>
        </div>
      </div>
    );
  }
  return children;
}

// NexusVectis top bar — shown in every app
function NVTopBar() {
  return (
    <div style={{height:'40px',background:'#0f172a',borderBottom:'1px solid #1e293b',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" style={{height:'20px',opacity:0.7}} alt="NV" />
        <span style={{color:'#475569',fontSize:'10px',letterSpacing:'0.1em'}}>HARBOR APP</span>
      </div>
      {nvUser && (
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10b981'}}></div>
          <span style={{color:'#64748b',fontSize:'11px'}}>{nvUser.full_name || nvUser.email}</span>
        </div>
      )}
    </div>
  );
}

// Report errors to parent for auto-fix
window.onerror = function(msg, src, line, col, err) {
  window.parent.postMessage({ type: 'APP_ERROR', message: (err?.message || msg) + ' (line ' + line + ')' }, '*');
};
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({ type: 'APP_ERROR', message: e.reason?.message || String(e.reason) }, '*');
});

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error) {
    window.parent.postMessage({ type: 'APP_ERROR', message: error.message }, '*');
  }
  render() {
    if (this.state.hasError) return (
      <div style={{padding:'2rem',color:'#f87171',fontFamily:'monospace',background:'#0f172a',minHeight:'100vh'}}>
        <b>⚠️ App Error — Auto-fixing...</b>
        <pre style={{fontSize:'12px',opacity:0.8,marginTop:'8px'}}>{this.state.error?.message}<\/pre>
      <\/div>
    );
    return this.props.children;
  }
}
${code}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <NVAuthGate>
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <NVTopBar \/>
      <div style={{flex:1,overflow:'hidden'}}>
        <ErrorBoundary><GeneratedApp {...orgData} currentUser={nvUser} \/><\/ErrorBoundary>
      <\/div>
    <\/div>
  <\/NVAuthGate>
);
<\/script>
<\/body>
<\/html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code, orgId, vehicles, routes, shipments, alerts, customers, currentUser]);

  return (
    <div className="relative w-full h-full">
      <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Generated App" />
      {autoFixing && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-sm">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-xs text-amber-300 font-medium">Auto-fixing error...</span>
        </div>
      )}
    </div>
  );
}

const BUILD_STEPS = [
  { id: "analyzing", label: "Analyzing requirements", icon: Cpu },
  { id: "schema",    label: "Designing data model",   icon: Database },
  { id: "ui",        label: "Generating UI components", icon: Layers },
  { id: "logic",     label: "Wiring application logic", icon: Terminal },
  { id: "polish",    label: "Applying design system",  icon: Sparkles },
  { id: "done",      label: "App ready",               icon: Rocket },
];

function BuildingScreen({ progress, log }) {
  const currentStepIdx = Math.floor((progress / 100) * (BUILD_STEPS.length - 1));
  return (
    <div className="h-full flex flex-col items-center justify-center p-10 gap-8">
      {/* Pulsing orb */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 blur-2xl opacity-40"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center"
          style={{
            background: "conic-gradient(from 0deg, #06b6d4, #7c3aed, #06b6d4)",
            padding: "2px"
          }}
        >
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Building Your App</h2>
        <p className="text-slate-400 text-sm mt-1">H.A.R.B.O.R AI is crafting your application</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-2">
        {BUILD_STEPS.map((step, i) => {
          const done = i < currentStepIdx;
          const active = i === currentStepIdx;
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                active ? "bg-cyan-500/10 border border-cyan-500/30" : ""
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? "bg-emerald-500" : active ? "bg-cyan-500/20 border border-cyan-500" : "bg-slate-800"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : active ? (
                  <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                ) : <Circle className="w-3 h-3 text-slate-600" />}
              </div>
              <span className={`text-sm ${active ? "text-white font-medium" : done ? "text-slate-400" : "text-slate-600"}`}>
                {step.label}
              </span>
              {active && <div className="ml-auto flex gap-0.5">
                {[0,1,2].map(d => (
                  <motion.div key={d} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.8, delay: d*0.2, repeat: Infinity }}
                    className="w-1 h-1 rounded-full bg-cyan-400" />
                ))}
              </div>}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Progress</span><span className="text-cyan-400 font-mono">{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #06b6d4, #7c3aed)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }) {
  const examples = [
    { emoji: "📦", label: "Inventory System", prompt: "Inventory management with products, categories, suppliers, stock levels, and purchase orders. Include low-stock alerts and reorder tracking." },
    { emoji: "👥", label: "CRM Platform", prompt: "Customer relationship management with contacts, deals pipeline, activities, and notes. Sales forecasting and revenue analytics." },
    { emoji: "🏗️", label: "Project Tracker", prompt: "Project management with projects, tasks, milestones, team members, and time tracking. Kanban board and Gantt chart views." },
    { emoji: "🏥", label: "Clinic Manager", prompt: "Medical clinic with patients, appointments, doctors, treatments, and billing. Patient history and appointment scheduling." },
    { emoji: "🚀", label: "SaaS Dashboard", prompt: "SaaS metrics dashboard with subscriptions, users, revenue, churn rate, MRR, and feature usage analytics." },
    { emoji: "🎓", label: "LMS Platform", prompt: "Learning management system with courses, lessons, students, enrollments, quizzes, and progress tracking." },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-2xl text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
          <Sparkles className="w-3 h-3" />
          H.A.R.B.O.R APP BUILDER
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          Build any app<br />
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">with a single sentence</span>
        </h1>
        <p className="text-slate-400 text-base">Describe what you need. H.A.R.B.O.R AI designs the data model, generates beautiful UI, and wires everything together instantly.</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}
        className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-3 gap-3">
        {examples.map((ex, i) => (
          <motion.button
            key={i}
            initial={{ opacity:0, scale:0.95 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onStart(ex.prompt)}
            className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all group"
          >
            <div className="text-2xl mb-2">{ex.emoji}</div>
            <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{ex.label}</p>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ex.prompt.substring(0, 60)}...</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default function HarborAppBuilderV3({ onClose, vehicles = [], routes = [], shipments = [], alerts = [], customers = [], currentUser, orgId, installedAppIds = new Set(), autoInstallAppId = null }) {
  const [phase, setPhase] = useState("idle"); // idle | analyzing | building | preview
  const [userPrompt, setUserPrompt] = useState("");
  const [entities, setEntities] = useState([]);
  const [pages, setPages] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [appMeta, setAppMeta] = useState(null);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLog, setBuildLog] = useState([]);
  const [savedApps, setSavedApps] = useState([]);
  const [currentAppId, setCurrentAppId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [searchApps, setSearchApps] = useState("");
  const [expandPrompt, setExpandPrompt] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({ category: "custom", description: "", tags: "" });
  const promptRef = useRef(null);

  useEffect(() => { loadApps(); }, [orgId]);

  // Listen for install events from the Fleet Store (even when builder is already open)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.orgId === orgId) {
        handleInstallFromStore(e.detail.appId);
      }
    };
    window.addEventListener('harbor_install_app', handler);
    return () => window.removeEventListener('harbor_install_app', handler);
  }, [orgId]);

  useEffect(() => {
    if (autoInstallAppId && orgId) {
      handleInstallFromStore(autoInstallAppId);
    }
  }, [autoInstallAppId, orgId]);

  const loadApps = async () => {
    if (!orgId) return;
    try {
      const apps = await base44.entities.HarborApp.filter({ organization_id: orgId }, '-created_date', 50);
      setSavedApps(apps || []);
    } catch (e) {
      console.error("HarborApp load failed", e);
      setSavedApps([]);
    }
  };

  const addLog = (msg, type = "info") => setBuildLog(prev => [...prev, { msg, type, ts: Date.now() }]);

  const handleBuild = async (promptOverride) => {
    const prompt = promptOverride || userPrompt;
    if (!prompt.trim()) return;
    if (!orgId) {
      toast.error("Ingen organisation — log ind med en konto der har organisation_id for at bygge og gemme apps.");
      return;
    }

    setPhase("analyzing");
    setBuildLog([]);
    setBuildProgress(5);
    addLog("🤖 Understanding your requirements...", "system");
    let tickAnalyze = null;
    let tickCodegen = null;
    tickAnalyze = setInterval(() => {
      setBuildProgress((p) => (p < 92 ? p + 2 : p));
    }, 900);

    try {
      // Step 1: Analyze
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this app description and extract structured data:

USER: "${prompt}"

Return JSON:
{
  "entities": [{ "name": "PascalCase", "description": "what it is", "fields": [{ "name": "camelCase", "type": "string|number|boolean|date|text|email|url|enum", "required": true, "description": "purpose", "options": ["opt1","opt2"] }] }],
  "pages": [{ "name": "Page Name", "route": "route-name", "type": "dashboard|list|detail|form", "description": "page purpose", "primary_entity": "EntityName" }],
  "appName": "App Name",
  "appDescription": "One line description",
  "icon": "single emoji"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            entities: { type: "array", items: { type: "object" } },
            pages: { type: "array", items: { type: "object" } },
            appName: { type: "string" },
            appDescription: { type: "string" },
            icon: { type: "string" }
          }
        }
      });

      clearInterval(tickAnalyze);
      tickAnalyze = null;

      const schema = normalizeJsonFromLlm(analysis);
      if (!schema || typeof schema !== "object") {
        throw new Error("AI kunne ikke levere et gyldigt skema (JSON). Prøv igen.");
      }
      let entities = Array.isArray(schema.entities) ? schema.entities : [];
      let pages = Array.isArray(schema.pages) ? schema.pages : [];
      if (!entities.length) {
        entities = [{
          name: "Record",
          description: "Standard poster",
          fields: [
            { name: "title", type: "string", required: true, description: "Titel" },
            { name: "status", type: "enum", required: false, description: "Status", options: ["active", "paused"] },
          ],
        }];
      }
      if (!pages.length) {
        pages = [
          { name: "Dashboard", route: "dashboard", type: "dashboard", description: "Overblik", primary_entity: entities[0]?.name || "Record" },
          { name: "Liste", route: "list", type: "list", description: "Poster", primary_entity: entities[0]?.name || "Record" },
        ];
      }
      setEntities(entities);
      setPages(pages);
      setAppMeta({
        name: schema.appName || "Harbor App",
        description: schema.appDescription || "",
        icon: schema.icon || "⚡",
      });
      setBuildProgress(30);
      addLog(`✅ Schema: ${entities.length} entities, ${pages.length} pages`, "success");

      // Step 2: Build
      setPhase("building");
      setBuildProgress(50);
      addLog("🎨 Generating premium UI...", "info");
      tickCodegen = setInterval(() => {
        setBuildProgress((p) => (p < 95 ? p + 1 : p));
      }, 1200);

      const appTitleSafe = String(schema.appName || "Harbor App").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      const entityDefs = (entities || []).map(e =>
        `${e.name}: [${e.fields?.map(f => `${f.name}:${f.type}${f.required ? '*' : ''}${f.options ? `(${f.options.join('|')})` : ''}`).join(', ')}]`
      ).join('\n');
      const pageDefs = (pages || []).map(p => `${p.name} (${p.type}): ${p.description}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior React engineer building a production-ready H.A.R.B.O.R enterprise app with a cyberpunk/terminal aesthetic. Every button, form, modal, and interaction MUST work 100%. No placeholders, no TODOs, no broken handlers.

APP: ${schema.appName || "Harbor App"}
DESCRIPTION: ${schema.appDescription || ""}

ENTITIES:
${entityDefs}

PAGES (build ALL of them as TAB VIEWS — no sidebar, use horizontal tab navigation):
${pageDefs}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATE ARCHITECTURE — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL state lives in GeneratedApp. Every entity gets:
  const [items, setItems] = React.useState([...6-8 records with unique numeric ids 1-8...]);
  const [showModal, setShowModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState({});

MODAL PATTERN (copy exactly for every entity):
  // Open ADD:  setEditingItem(null); setForm({}); setShowModal(true);
  // Open EDIT: setEditingItem(item); setForm({...item}); setShowModal(true);
  // SAVE:      if(editingItem) { setItems(prev => prev.map(x => x.id===editingItem.id ? {...x,...form} : x)); }
  //            else { setItems(prev => [...prev, {...form, id: Date.now()}]); }
  //            setShowModal(false); setForm({});
  // DELETE:    setItems(prev => prev.filter(x => x.id !== item.id));
  // SEARCH:    items.filter(x => JSON.stringify(x).toLowerCase().includes(search.toLowerCase()))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
H.A.R.B.O.R CYBERPUNK DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR PALETTE (USE THESE EXACT VALUES):
• Background:    #030a0e  (near-black with blue tint)
• Surface:       #0a1628  (dark navy card bg)
• Surface2:      #0d1f35  (slightly lighter panel bg)
• Border:        #1a3a5c  (dark blue border)
• Border bright: #0e4f6e  (active/hover border)
• Cyan primary:  #00d4ff  (main accent — bright cyan)
• Amber:         #f5a623  (secondary accent — warm amber/gold)
• Amber dim:     #c47a10  (dimmer amber)
• Green:         #00ff9d  (success / active)
• Red:           #ff3b4e  (error / danger)
• Text primary:  #e0f4ff  (near-white with cyan tint)
• Text muted:    #4a7a9b  (muted blue-grey)
• Text dim:      #1e4a6b  (very dim, labels)

FONTS: fontFamily: "'Courier New', Courier, monospace" for ALL text. This is a terminal-style app.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GeneratedApp(props) {
  const [currentTab, setCurrentTab] = React.useState("${(pages || [])[0]?.name || "Dashboard"}");
  // ALL entity state here
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#030a0e",color:"#e0f4ff",overflow:"hidden",fontFamily:"'Courier New',Courier,monospace",backgroundImage:"radial-gradient(ellipse at 20% 50%, rgba(0,50,80,0.15) 0%, transparent 60%)"}}>
      <TopBar appName="${appTitleSafe}" />
      <TabNav tabs={[...pageNames]} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {/* render page based on currentTab */}
      </div>
      {/* ALL modals here */}
    </div>
  );
}

TOP BAR (height 44px):
• background: #030a0e, borderBottom: "1px solid #1a3a5c"
• Left: small ⚡ icon (amber) + "H.A.R.B.O.R." text (amber, fontSize 12, letterSpacing 3, fontWeight bold) + app name badge (border 1px solid #0e4f6e, color #00d4ff, fontSize 10, padding 2px 8px)
• Right: status indicator "● SYSTEM NOMINAL" (green dot, fontSize 10, color #4a7a9b) + "ADD NEW" button (border 1px solid #f5a623, color #f5a623, bg transparent, padding 5px 14px, fontSize 10, letterSpacing 2, cursor pointer, hover bg rgba(245,166,35,0.1))

TAB NAV (height 36px):
• background: #030a0e, borderBottom: "1px solid #1a3a5c", display flex, paddingLeft 12, gap 0
• Each tab: padding 8px 20px, fontSize 11, letterSpacing 2, textTransform uppercase, cursor pointer, border none, bg transparent
• Active tab: color #00d4ff, borderBottom "2px solid #00d4ff", background "rgba(0,212,255,0.05)"
• Inactive: color #4a7a9b, hover color #e0f4ff

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EACH PAGE MUST HAVE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. STATS ROW — 4 stat cards in CSS grid (gridTemplateColumns: repeat(4,1fr), gap 12px, marginBottom 16px)
   Each card: bg #0a1628, border "1px solid #1a3a5c", padding 14px 16px, position relative
   • Corner brackets decoration (CSS pseudo-like divs at corners — 8px lines, color #0e4f6e)
   • Stat label: fontSize 10, color #4a7a9b, letterSpacing 3, textTransform uppercase, marginBottom 6
   • Stat value: fontSize 26, fontWeight bold, color #00d4ff (or #f5a623 for secondary stats)
   • Trend: fontSize 10, color #00ff9d (up) or #ff3b4e (down)
   Stats MUST use real computed values from state arrays.

2. SECTION HEADER — before each section:
   display flex, alignItems center, gap 8, marginBottom 10
   • "›_" prefix in amber (#f5a623), fontSize 12
   • Section title in caps, fontSize 11, letterSpacing 3, color #e0f4ff
   • Horizontal line: flex 1, height 1px, bg #1a3a5c, marginLeft 10

3. SEARCH + FILTER BAR — display flex, gap 10, marginBottom 12
   Search: bg #0a1628, border "1px solid #1a3a5c", color #e0f4ff, padding 7px 12px, fontSize 11, outline none, width 240
   Focus: border-color #00d4ff (use onFocus/onBlur state)
   Placeholder color: #1e4a6b

4. DATA TABLE — bg #0a1628, border "1px solid #1a3a5c", overflow hidden
   Header row: bg #030a0e, display grid, padding 8px 14px, fontSize 10, color #4a7a9b, letterSpacing 2, textTransform uppercase, borderBottom "1px solid #1a3a5c"
   Data rows: display grid, padding 11px 14px, borderBottom "1px solid #0d1f35", fontSize 11, color #e0f4ff
   Row hover: bg #0d1f35
   • Edit btn: border "1px solid #0e4f6e", color #00d4ff, bg transparent, padding 3px 10px, fontSize 10, letterSpacing 1, cursor pointer
   • Delete btn: border "1px solid rgba(255,59,78,0.3)", color #ff3b4e, bg transparent, padding 3px 10px, fontSize 10, cursor pointer

5. STATUS BADGES — display inline-flex, padding 2px 8px, fontSize 10, letterSpacing 1, fontWeight bold
   active/online/completed: border "1px solid #00ff9d", color #00ff9d, bg "rgba(0,255,157,0.08)"
   pending/processing: border "1px solid #f5a623", color #f5a623, bg "rgba(245,166,35,0.08)"
   inactive/offline/failed: border "1px solid #ff3b4e", color #ff3b4e, bg "rgba(255,59,78,0.08)"

6. ADD/EDIT MODAL — MUST BE 100% FUNCTIONAL
   • Overlay: position fixed, inset 0, bg "rgba(3,10,14,0.92)", backdropFilter blur(4px), zIndex 1000
   • Panel: bg #0a1628, border "1px solid #1a3a5c", padding 24px, width 480, maxWidth "90vw"
   • Title: fontSize 12, letterSpacing 3, color #00d4ff, textTransform uppercase, marginBottom 20, borderBottom "1px solid #1a3a5c", paddingBottom 10
   • Field label: fontSize 10, letterSpacing 2, color #4a7a9b, textTransform uppercase, marginBottom 4
   • Input: bg "#030a0e", border "1px solid #1a3a5c", color #e0f4ff, padding 8px 12px, fontSize 11, width "100%", outline none, fontFamily inherit
   • Focus input: border-color #00d4ff
   • Cancel: border "1px solid #1a3a5c", color #4a7a9b, bg transparent, padding 7px 20px, fontSize 10, letterSpacing 2, cursor pointer
   • Save: border "1px solid #f5a623", color #f5a623, bg "rgba(245,166,35,0.1)", padding 7px 20px, fontSize 10, letterSpacing 2, cursor pointer
   • Click overlay to close

7. SYSTEM LOG (optional bottom panel for dashboards) — monospace terminal output:
   bg #030a0e, border "1px solid #1a3a5c", padding 12px, maxHeight 100px, overflowY auto, fontSize 10
   Lines prefixed with "> " in amber, text in #4a7a9b

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARTS (when needed):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use inline SVG or simple div-based bar charts with amber/cyan fills. No external chart libraries.
Bar chart bars: bg #f5a623 or #00d4ff, height 100%, display inline-block
Chart container: border "1px solid #1a3a5c", bg #0a1628, padding 14px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. INLINE STYLES ONLY — zero className, zero Tailwind
2. fontFamily: "'Courier New', Courier, monospace" everywhere
3. Use only React.useState, React.useEffect (not destructured)
4. Every handler must be a real function — NO empty handlers
5. Every modal MUST have working close, save, field-editing
6. Every Delete MUST remove from state. Every Edit MUST pre-fill form.
7. Search MUST filter in real-time
8. IDs: seed data uses numbers 1-8. New records: Date.now()
9. NO placeholder comments, NO TODO, NO "implement here"
10. Return ONLY raw JavaScript — NO markdown, NO backticks, NO explanation`,
        response_json_schema: null
      });

      clearInterval(tickCodegen);
      tickCodegen = null;

      let code = normalizeCodeFromLlm(result);
      if (!code || code.length < 80) {
        throw new Error("AI returnerede ingen brugbar kode. Prøv igen eller brug en kortere beskrivelse.");
      }
      if (!code.includes("function GeneratedApp")) {
        code = `function GeneratedApp(props) {\n  const { useState, useEffect } = React;\n${code}\n}`;
      }

      setGeneratedCode(code);
      setBuildProgress(100);
      addLog("✅ App generated successfully!", "success");
      await new Promise(r => setTimeout(r, 500));
      setPhase("preview");

    } catch (err) {
      const msg = err?.message || String(err);
      addLog(`❌ Error: ${msg}`, "error");
      toast.error(msg);
      setPhase("idle");
    } finally {
      if (tickAnalyze) clearInterval(tickAnalyze);
      if (tickCodegen) clearInterval(tickCodegen);
    }
  };

  const handleExpandApp = async () => {
    if (!expandPrompt.trim() || !generatedCode) return;
    setIsExpanding(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are enhancing an existing React app. Keep all existing code and ADD the requested features.

CURRENT CODE:
${generatedCode}

EXPANSION REQUEST: "${expandPrompt}"

Requirements:
- Keep all existing functionality intact
- Add new features maintaining the same H.A.R.B.O.R cyberpunk terminal aesthetic (dark navy bg #030a0e, cyan #00d4ff, amber #f5a623, Courier New monospace font, terminal-style borders and labels)
- Return ONLY complete updated JavaScript code, no markdown, no backticks`,
        response_json_schema: null
      });
      let code = normalizeCodeFromLlm(result);
      if (!code.includes("function GeneratedApp")) {
        code = `function GeneratedApp(props) {\n${code}\n}`;
      }
      setGeneratedCode(code);
      setExpandPrompt("");
      toast.success("App expanded!");
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
    setIsExpanding(false);
  };

  const handleSave = async () => {
    if (!generatedCode || !orgId) return;
    setSaving(true);
    try {
      const data = {
        organization_id: orgId,
        name: appMeta?.name || "Generated App",
        description: appMeta?.description || "",
        prompt: userPrompt,
        code: generatedCode,
        category: "custom",
        icon_emoji: appMeta?.icon || "⚡",
        created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
      };
      if (currentAppId) {
        await base44.entities.HarborApp.update(currentAppId, data);
        toast.success("Saved!");
      } else {
        const saved = await base44.entities.HarborApp.create(data);
        setCurrentAppId(saved.id);
        toast.success("App saved!");
      }
      await loadApps();
    } catch (err) {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (app, e) => {
    e.stopPropagation();
    await base44.entities.HarborApp.delete(app.id);
    if (currentAppId === app.id) { setGeneratedCode(""); setPhase("idle"); setCurrentAppId(null); }
    await loadApps();
    toast.success("Deleted");
  };

  const handleLoadApp = (app) => {
    setGeneratedCode(app.code);
    setCurrentAppId(app.id);
    setAppMeta({ name: app.name, description: app.description, icon: app.icon_emoji });
    setUserPrompt(app.prompt || "");
    setPhase("preview");
  };

  const handleInstallFromStore = async (appId) => {
    if (!orgId || !appId) {
      toast.error("Mangler organisation eller app — log ind og prøv igen.");
      return;
    }
    try {
      const rows = await base44.entities.HarborApp.filter({ id: appId }, "-created_date", 10);
      const app = rows?.[0];
      if (!app?.code) {
        toast.error("Kunne ikke finde app-koden. Prøv at åbne Fleet Store igen.");
        return;
      }
      const saved = await base44.entities.HarborApp.create({
        organization_id: orgId,
        name: app.name,
        description: app.description,
        prompt: app.prompt || "",
        code: app.code,
        category: app.category || "custom",
        icon_emoji: app.icon_emoji,
        created_by_name: app.created_by_name || currentUser?.full_name || currentUser?.email || "Unknown",
      });
      await loadApps();
      handleLoadApp({ ...app, id: saved.id });
      toast.success(`✅ "${app.name}" er kopieret til din organisations bibliotek`);
    } catch (err) {
      console.error("Install from store failed:", err);
      toast.error("Installation fejlede: " + (err?.message || "ukendt fejl"));
    }
  };

  const filteredApps = savedApps.filter(app => app.name.toLowerCase().includes(searchApps.toLowerCase()));

  const handlePublish = async () => {
    if (!currentAppId && !generatedCode) return;
    setPublishing(true);
    try {
      let appId = currentAppId;
      // Save first if not saved
      if (!appId) {
        const saved = await base44.entities.HarborApp.create({
          organization_id: orgId,
          name: appMeta?.name || "Generated App",
          description: publishForm.description || appMeta?.description || "",
          prompt: userPrompt,
          code: generatedCode,
          category: publishForm.category,
          icon_emoji: appMeta?.icon || "⚡",
          created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
          published_to_store: true,
          tags: publishForm.tags ? publishForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        });
        appId = saved.id;
        setCurrentAppId(appId);
      } else {
        await base44.entities.HarborApp.update(appId, {
          published_to_store: true,
          category: publishForm.category,
          description: publishForm.description || appMeta?.description || "",
          tags: publishForm.tags ? publishForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        });
      }
      await loadApps();
      setShowPublishModal(false);
      toast.success("🚀 App published to Fleet Store!");
    } catch (err) {
      toast.error("Publish failed: " + err.message);
    }
    setPublishing(false);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 text-white flex overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(6,182,212,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 flex w-full h-full">

        {/* ─── LEFT SIDEBAR ─────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-xl flex flex-col overflow-hidden"
              style={{ width: 280 }}
            >
              {/* Logo */}
              <div className="p-5 border-b border-slate-800/50 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">H.A.R.B.O.R Builder</span>
                </div>
                <p className="text-[10px] text-slate-500 ml-9">AI-Powered App Generator</p>
              </div>

              {/* New App button */}
              <div className="p-3 flex-shrink-0">
                <button
                  onClick={() => { setPhase("idle"); setGeneratedCode(""); setCurrentAppId(null); setAppMeta(null); setEntities([]); setPages([]); setUserPrompt(""); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-sm font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" /> New App
                </button>
              </div>

              {/* Entities panel (only when building) */}
              {entities.length > 0 && (
                <div className="px-3 mb-3 flex-shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 mb-1.5">Entities ({entities.length})</p>
                  <div className="space-y-0.5">
                    {entities.map((e, i) => (
                      <button key={i} onClick={() => setSelectedEntity(selectedEntity === i ? null : i)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                          selectedEntity === i ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}>
                        <Box className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{e.name}</span>
                        <span className="ml-auto text-[9px] text-slate-600">{e.fields?.length || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved apps */}
              <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-800/50 min-h-0">
                <div className="p-3 flex-shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">My Apps ({filteredApps.length})</p>
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-600" />
                    <input
                      value={searchApps}
                      onChange={e => setSearchApps(e.target.value)}
                      placeholder="Search apps..."
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {filteredApps.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">No apps yet</p>
                  ) : (
                    filteredApps.map(app => (
                      <button key={app.id} onClick={() => handleLoadApp(app)}
                        className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group ${
                          currentAppId === app.id ? "border-cyan-500/30 bg-cyan-500/10 text-white" : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                        }`}>
                        <span className="text-lg flex-shrink-0">{app.icon_emoji || "⚡"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{app.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{app.description}</p>
                        </div>
                        <button onClick={(e) => handleDelete(app, e)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ─── MAIN AREA ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top toolbar */}
          <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <PanelLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {appMeta && (
                <>
                  <span className="text-base">{appMeta.icon || "⚡"}</span>
                  <h2 className="text-sm font-semibold text-white truncate">{appMeta.name}</h2>
                  <span className="text-xs text-slate-500 truncate hidden sm:block">{appMeta.description}</span>
                </>
              )}
            </div>

            {phase === "preview" && (
              <div className="flex items-center gap-2">
                {/* Expand bar */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <input
                    value={expandPrompt}
                    onChange={e => setExpandPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleExpandApp()}
                    placeholder="Add features to this app..."
                    className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-56"
                  />
                  <button onClick={handleExpandApp} disabled={isExpanding || !expandPrompt.trim()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40 transition-all">
                    {isExpanding ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>

                <button onClick={() => setShowCode(!showCode)}
                  className={`p-2 rounded-lg text-sm transition-all border ${showCode ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400" : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
                  <Code2 className="w-4 h-4" />
                </button>
                <button onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success("Copied!"); }}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-all">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="text-xs">Save</span>
                </button>
                <button onClick={() => { setPublishForm({ category: "custom", description: appMeta?.description || "", tags: "" }); setShowPublishModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-semibold transition-all shadow-lg shadow-cyan-500/20">
                  <Store className="w-3.5 h-3.5" />
                  <span className="text-xs">Publish</span>
                </button>
              </div>
            )}

            {phase === "idle" && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">AI Ready</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">

              {/* IDLE: prompt / empty state */}
              {phase === "idle" && (
                <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="h-full flex flex-col overflow-hidden">
                  {/* Entity designer if one selected */}
                  {selectedEntity !== null && entities[selectedEntity] ? (
                    <div className="h-full overflow-auto p-6">
                      <DatabaseDesigner
                        entities={[entities[selectedEntity]]}
                        onEntitiesChange={(updated) => {
                          const ne = [...entities];
                          ne[selectedEntity] = updated[0];
                          setEntities(ne);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <EmptyState onStart={(p) => { setUserPrompt(p); handleBuild(p); }} />
                    </div>
                  )}

                  {/* Prompt bar at bottom */}
                  <div className="flex-shrink-0 border-t border-slate-800/50 p-4">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-end gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 focus-within:border-cyan-500/50 transition-all shadow-xl">
                        <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mb-1" />
                        <textarea
                          ref={promptRef}
                          value={userPrompt}
                          onChange={e => setUserPrompt(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleBuild(); } }}
                          placeholder="Describe your app... (e.g. 'A fleet management system with vehicles, routes, and maintenance scheduling')"
                          rows={2}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
                        />
                        <button
                          onClick={() => handleBuild()}
                          disabled={!userPrompt.trim()}
                          className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20"
                        >
                          <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <p className="text-center text-[10px] text-slate-600 mt-2">Press Enter or click → to build · Shift+Enter for new line</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ANALYZING / BUILDING */}
              {(phase === "analyzing" || phase === "building") && (
                <motion.div key="building" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="h-full">
                  <BuildingScreen progress={buildProgress} log={buildLog} />
                </motion.div>
              )}

              {/* PREVIEW */}
              {phase === "preview" && (
                <motion.div key="preview" initial={{ opacity:0 }} animate={{ opacity:1 }} className="h-full flex">
                  {showCode ? (
                    <div className="flex flex-col h-full w-full">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/60" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono ml-2">GeneratedApp.jsx</span>
                        <span className="ml-auto text-[10px] text-slate-600">Click anywhere to edit · Changes apply in real-time</span>
                      </div>
                      <textarea
                        value={generatedCode}
                        onChange={e => setGeneratedCode(e.target.value)}
                        className="flex-1 bg-slate-950 text-xs text-slate-300 font-mono p-6 focus:outline-none resize-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <LiveAppSandbox code={generatedCode} orgId={orgId} vehicles={vehicles} routes={routes} shipments={shipments} alerts={alerts} customers={customers} currentUser={currentUser} onCodeFixed={(fixed) => { setGeneratedCode(fixed); toast.success("🔧 Error auto-fixed!"); }} />
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── PUBLISH MODAL ─────────────────────────── */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={e => e.target === e.currentTarget && setShowPublishModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Publish to Fleet Store</h3>
                    <p className="text-[10px] text-slate-500">Share your app with all organizations</p>
                  </div>
                </div>
                <button onClick={() => setShowPublishModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-5">
                <span className="text-2xl">{appMeta?.icon || "⚡"}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{appMeta?.name || "Generated App"}</p>
                  <p className="text-[10px] text-slate-500">Ready to publish</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">Ready</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={publishForm.category}
                    onChange={e => setPublishForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="analytics">Analytics</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="operations">Operations</option>
                    <option value="crm">CRM</option>
                    <option value="productivity">Productivity</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    value={publishForm.description}
                    onChange={e => setPublishForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe what this app does..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Tags (comma-separated)</label>
                  <input
                    value={publishForm.tags}
                    onChange={e => setPublishForm(p => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g. inventory, management, warehouse"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={handlePublish} disabled={publishing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {publishing ? "Publishing..." : "Publish to Store"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}