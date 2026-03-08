import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Plus, Search, Trash2, Save, Eye, Code2, Copy, Loader2,
  ChevronRight, Database, LayoutGrid, Zap, Settings, Sparkles,
  ArrowRight, Terminal, Cpu, Globe, Layers, Play, RefreshCw,
  CheckCircle2, Circle, Box, Wand2, Rocket, PanelLeft
} from "lucide-react";
import { toast } from "sonner";
import DatabaseDesigner from "./DatabaseDesigner";

function LiveAppSandbox({ code, orgId, vehicles, routes, shipments, alerts, customers, currentUser }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!code || !iframeRef.current) return;
    const orgDataScript = `window.__ORG_DATA__ = ${JSON.stringify({ orgId, vehicles, routes, shipments, alerts, customers, currentUser })};`;
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
<script>${orgDataScript}</script>
<script type="text/babel">
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const orgData = window.__ORG_DATA__;
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div style={{padding:'2rem',color:'#f87171',fontFamily:'monospace'}}><b>App Error:</b><pre style={{fontSize:'12px',opacity:0.8,marginTop:'8px'}}>{this.state.error?.message}<\/pre><\/div>;
    return this.props.children;
  }
}
${code}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><GeneratedApp {...orgData} \/><\/ErrorBoundary>);
<\/script>
<\/body>
<\/html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code, orgId, vehicles, routes, shipments, alerts, customers, currentUser]);

  return <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Generated App" />;
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

export default function HarborAppBuilderV3({ onClose, vehicles = [], routes = [], shipments = [], alerts = [], customers = [], currentUser, orgId, installedAppIds = new Set() }) {
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
  const promptRef = useRef(null);

  useEffect(() => { loadApps(); }, [orgId]);

  const loadApps = async () => {
    if (!orgId) return;
    const apps = await base44.entities.HarborApp.filter({ organization_id: orgId }, '-created_date', 50);
    setSavedApps(apps);
  };

  const addLog = (msg, type = "info") => setBuildLog(prev => [...prev, { msg, type, ts: Date.now() }]);

  const handleBuild = async (promptOverride) => {
    const prompt = promptOverride || userPrompt;
    if (!prompt.trim()) return;

    setPhase("analyzing");
    setBuildLog([]);
    setBuildProgress(5);
    addLog("🤖 Understanding your requirements...", "system");

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

      const schema = typeof analysis === "string" ? JSON.parse(analysis) : analysis;
      setEntities(schema.entities || []);
      setPages(schema.pages || []);
      setAppMeta({ name: schema.appName, description: schema.appDescription, icon: schema.icon || "⚡" });
      setBuildProgress(30);
      addLog(`✅ Schema: ${schema.entities?.length} entities, ${schema.pages?.length} pages`, "success");

      // Step 2: Build
      setPhase("building");
      setBuildProgress(50);
      addLog("🎨 Generating premium UI...", "info");

      const entityDefs = (schema.entities || []).map(e =>
        `${e.name}: [${e.fields?.map(f => `${f.name}:${f.type}${f.required ? '*' : ''}${f.options ? `(${f.options.join('|')})` : ''}`).join(', ')}]`
      ).join('\n');
      const pageDefs = (schema.pages || []).map(p => `${p.name} (${p.type}): ${p.description}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite React developer building a STUNNING, PRODUCTION-READY application. This is NOT a prototype - it must look like a $50,000 custom-built SaaS product.

APP: ${schema.appName}
DESCRIPTION: ${schema.appDescription}

ENTITIES:
${entityDefs}

PAGES:
${pageDefs}

ABSOLUTE REQUIREMENTS:
1. Export EXACTLY: function GeneratedApp(props) { ... }
2. Use useState for ALL local state (pre-populate with 3-5 realistic demo records)
3. Dark premium theme ONLY: bg-slate-950, bg-slate-900, slate-800 backgrounds
4. Accent: cyan-500, violet-500, emerald-500, amber-500 for status indicators
5. EVERY page must be complete with:
   - Top header bar with title + action buttons
   - Stats row (3-4 metric cards with numbers)
   - Filterable/searchable data table OR card grid
   - Functional ADD form (inline or modal) with ALL fields
   - Edit/Delete actions on each row/card
   - Empty state message
6. ALL buttons must DO something (add, edit, delete, filter, search)
7. Use inline modals (position:fixed overlay) for forms
8. Sidebar navigation with icons for all pages
9. Status badges: emerald=active/done, amber=pending/warning, red=error/cancelled, blue=info
10. Cards with: rounded-xl, bg-slate-800/50, border border-slate-700/50, hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all
11. Buttons: bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-lg px-4 py-2
12. Tables: striped rows, hover highlight, proper column headers
13. Forms: dark inputs with bg-slate-800, border-slate-700, focus:border-cyan-500 rounded-lg
14. Use Tailwind CSS ONLY - zero external packages
15. Return COMPLETE JavaScript code ONLY - NO markdown, NO triple backticks, NO explanation

The app MUST have real data and real interactions. Make it impressive.`,
        response_json_schema: null
      });

      let code = typeof result === "string" ? result : JSON.stringify(result);
      code = code.replace(/^```(?:jsx?|javascript|js)?\n?/gm, "").replace(/```\s*$/gm, "").trim();
      if (!code.includes("function GeneratedApp")) {
        code = `function GeneratedApp(props) {\n  const { useState, useEffect } = React;\n${code}\n}`;
      }

      setGeneratedCode(code);
      setBuildProgress(100);
      addLog("✅ App generated successfully!", "success");
      await new Promise(r => setTimeout(r, 500));
      setPhase("preview");

    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
      setPhase("idle");
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
- Add the new features maintaining the same premium dark design style
- Return ONLY complete updated JavaScript code, no markdown, no backticks`,
        response_json_schema: null
      });
      let code = typeof result === "string" ? result : JSON.stringify(result);
      code = code.replace(/^```(?:jsx?|javascript|js)?\n?/gm, "").replace(/```\s*$/gm, "").trim();
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

  const filteredApps = savedApps.filter(app => app.name.toLowerCase().includes(searchApps.toLowerCase()));

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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-semibold transition-all">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="text-xs">Save</span>
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
                      <EmptyState onStart={(p) => { setUserPrompt(p); }} />
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
                <motion.div key="preview" initial={{ opacity:0 }} animate={{ opacity:1 }} className="h-full">
                  {showCode ? (
                    <div className="h-full overflow-auto bg-slate-950 p-6">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">{generatedCode}</pre>
                    </div>
                  ) : (
                    <LiveAppSandbox code={generatedCode} orgId={orgId} vehicles={vehicles} routes={routes} shipments={shipments} alerts={alerts} customers={customers} currentUser={currentUser} />
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}