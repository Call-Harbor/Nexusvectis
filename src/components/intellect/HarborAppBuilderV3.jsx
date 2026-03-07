import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Plus, Search, Trash2, Save, Eye, Code2, Copy, Loader2,
  ChevronRight, Database, LayoutGrid, Zap, Settings, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DatabaseDesigner from "./DatabaseDesigner";
import MultiPageAppBuilder from "./MultiPageAppBuilder";

// Live preview sandbox
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
<script>tailwind.config = { theme: { extend: {} } }</script>
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
const { useState, useEffect, useRef, useMemo } = React;
const orgData = window.__ORG_DATA__;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-red-400 font-mono text-sm"><p className="font-bold mb-2">⚠️ App Error:<\/p><pre className="whitespace-pre-wrap text-xs opacity-80">{this.state.error?.message}<\/pre><\/div>;
    }
    return this.props.children;
  }
}

${code}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <GeneratedApp {...orgData} />
  <\/ErrorBoundary>
);
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code, orgId, vehicles, routes, shipments, alerts, customers, currentUser]);

  return <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="H.A.R.B.O.R Generated App" />;
}

export default function HarborAppBuilderV3({ onClose, vehicles = [], routes = [], shipments = [], alerts = [], customers = [], currentUser, orgId, installedAppIds = new Set() }) {
  const [activeTab, setActiveTab] = useState("prompt"); // prompt | entities | pages | preview
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entities, setEntities] = useState([]);
  const [pages, setPages] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [appMeta, setAppMeta] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLog, setBuildLog] = useState([]);
  const [savedApps, setSavedApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [currentAppId, setCurrentAppId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [searchApps, setSearchApps] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandPrompt, setExpandPrompt] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    loadApps();
  }, [orgId]);

  const loadApps = async () => {
    if (!orgId) return;
    setLoadingApps(true);
    const apps = await base44.entities.HarborApp.filter({ organization_id: orgId }, '-created_date', 50);
    setSavedApps(apps);
    setLoadingApps(false);
  };

  const addLog = (msg, type = "info") => {
    setBuildLog(prev => [...prev, { msg, type, ts: Date.now() }]);
  };

  const handleAnalyzePrompt = async () => {
    if (!userPrompt.trim()) return;
    setIsAnalyzing(true);
    addLog("🤖 Analyzing your requirements...", "system");

    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this app description and extract the data model and pages needed:

USER DESCRIPTION: "${userPrompt}"

Respond with JSON:
{
  "entities": [
    {
      "name": "Entity name (singular, PascalCase)",
      "description": "What this entity represents",
      "fields": [
        { "name": "fieldName", "type": "string|number|boolean|date|text|email|url", "required": true, "description": "Field purpose" }
      ]
    }
  ],
  "pages": [
    {
      "name": "Page name",
      "route": "page-route",
      "type": "list|detail|form|dashboard",
      "description": "What this page does"
    }
  ],
  "appName": "App name",
  "appDescription": "Short description"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: { type: "object" }
            },
            pages: {
              type: "array",
              items: { type: "object" }
            },
            appName: { type: "string" },
            appDescription: { type: "string" }
          }
        }
      });

      const schema = typeof analysis === "string" ? JSON.parse(analysis) : analysis;
      
      setEntities(schema.entities || []);
      setPages(schema.pages || []);
      setAppMeta({ name: schema.appName || "New App", description: schema.appDescription || "" });
      
      addLog(`✅ Generated ${schema.entities?.length || 0} entities & ${schema.pages?.length || 0} pages`, "success");
      await new Promise(r => setTimeout(r, 400));
      setActiveTab("entities");
    } catch (err) {
      addLog(`❌ Error analyzing: ${err.message}`, "error");
    }
    setIsAnalyzing(false);
  };

  const handleBuild = async () => {
    if (entities.length === 0) {
      toast.error("Define at least one entity");
      return;
    }
    
    setIsBuilding(true);
    setBuildLog([]);
    setBuildProgress(0);
    setGeneratedCode("");
    setCurrentAppId(null);

    addLog("🚀 Building app from schema...", "system");
    setBuildProgress(20);
    await new Promise(r => setTimeout(r, 300));

    addLog(`📊 ${entities.length} entities, ${pages.length} pages`, "info");
    setBuildProgress(40);
    await new Promise(r => setTimeout(r, 300));

    addLog("🎨 Generating Jarvis-style interface...", "info");
    setBuildProgress(60);

    const entityDefs = entities.map(e => `- ${e.name}: [${e.fields?.map(f => `${f.name}:${f.type}${f.required ? '*' : ''}`).join(', ')}]`).join('\n');
    const pageDefs = pages.map(p => `- ${p.name} (${p.route}): ${p.type}`).join('\n');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are H.A.R.B.O.R AI building a React app matching Base44's UX patterns with Jarvis visual style.

SCHEMA:
${entityDefs}

PAGES:
${pageDefs}

BUILD REQUIREMENTS:
1. Export function GeneratedApp({ orgId, vehicles, routes, shipments, alerts, customers, currentUser })
2. Dark theme: bg-slate-950, borders cyan-500/20, text slate-300
3. Sidebar layout with left nav
4. CRUD operations on entities
5. Real-time data binding
6. Jarvis aesthetic: font-mono, tracking-wider, cyan glows
7. Use Tailwind + React only
8. Must work with provided org data
9. Return ONLY JavaScript code, no markdown`,
        response_json_schema: null
      });

      let code = typeof result === "string" ? result : JSON.stringify(result);
      code = code.replace(/^```(?:jsx?|javascript)?\n?/gm, "").replace(/```$/gm, "").trim();
      if (!code.includes("function GeneratedApp")) {
        code = `function GeneratedApp({ orgId, vehicles, routes, shipments, alerts, customers, currentUser }) {\n${code}\n}`;
      }

      setGeneratedCode(code);
      setBuildProgress(85);
      addLog("✅ App generated successfully!", "success");
      setBuildProgress(100);
      
      await new Promise(r => setTimeout(r, 400));
      setActiveTab("preview");
      setAppMeta({ name: `${entities[0]?.name} Manager`, description: `Multi-entity app with ${entities.length} models` });
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
    }

    setIsBuilding(false);
  };

  const handleSave = async () => {
    if (!generatedCode || !orgId) return;
    setSaving(true);
    try {
      const data = {
        organization_id: orgId,
        name: appMeta?.name || "Generated App",
        description: appMeta?.description || "",
        code: generatedCode,
        category: "custom",
        icon_emoji: "⚡",
        created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
      };
      
      if (currentAppId) {
        await base44.entities.HarborApp.update(currentAppId, data);
        toast.success("App updated!");
      } else {
        const saved = await base44.entities.HarborApp.create(data);
        setCurrentAppId(saved.id);
        toast.success("App saved!");
      }
      await loadApps();
    } catch (err) {
      toast.error("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (app) => {
    await base44.entities.HarborApp.delete(app.id);
    if (currentAppId === app.id) setCurrentAppId(null);
    await loadApps();
    toast.success("App deleted");
  };

  const filteredApps = savedApps.filter(app => 
    app.name.toLowerCase().includes(searchApps.toLowerCase())
  );

  return (
    <div className="relative w-full h-full bg-slate-950 text-white flex overflow-hidden font-mono">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} className="absolute inset-0" />
      </div>

      <div className="relative z-10 flex w-full h-full">
        {/* Left sidebar - like Base44 */}
        <div className="w-80 border-r border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800/50">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="Base44" 
              className="h-8 w-auto mb-3"
            />
            <p className="text-xs text-slate-400 font-semibold">H.A.R.B.O.R BUILDER</p>
            <p className="text-[10px] text-slate-500 tracking-wider">Entity-based design</p>
          </div>

          {/* Nav tabs */}
          <div className="flex border-b border-slate-800/50 flex-shrink-0">
            {[
              { id: "prompt", label: "Describe", icon: Sparkles },
              { id: "entities", label: "Entities", icon: Database },
              { id: "pages", label: "Pages", icon: LayoutGrid },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "prompt" && (
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Describe your app idea</p>
                  <textarea
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                    placeholder="E.g., 'I need a customer management system with contacts, orders, and invoices. Users should be able to track order status and export data.'"
                    className="w-full h-32 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>
                <button
                  onClick={handleAnalyzePrompt}
                  disabled={isAnalyzing || !userPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Schema
                    </>
                  )}
                </button>
                {buildLog.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                    {buildLog.map((log, i) => (
                      <div key={i} className={`text-[10px] ${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-emerald-400" : "text-slate-400"}`}>
                        {log.msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "entities" && (
              <div className="p-3 space-y-2">
                <button
                  onClick={() => setEntities([...entities, { name: `Entity${entities.length + 1}`, fields: [] }])}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add Entity
                </button>
                <div className="space-y-1">
                  {entities.map((entity, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedEntity(i)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                        selectedEntity === i
                          ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        {entity.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntities(entities.filter((_, idx) => idx !== i));
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">{entity.fields?.length || 0} fields</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "pages" && (
              <div className="p-3 space-y-2">
                <button
                  onClick={() => setPages([...pages, { name: `Page${pages.length + 1}`, route: `page${pages.length + 1}`, type: "list" }])}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add Page
                </button>
                <div className="space-y-1">
                  {pages.map((page, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 text-xs"
                    >
                      <div className="font-semibold flex items-center justify-between">
                        {page.name}
                        <Badge className="text-[8px] bg-violet-500/20 text-violet-300">{page.type}</Badge>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">/{page.route}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apps list */}
          <div className="flex-shrink-0 border-t border-slate-800/50 p-3">
            <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">My Apps ({filteredApps.length})</p>
            <div className="relative mb-2">
              <Search className="w-3 h-3 absolute left-2 top-2.5 text-slate-600" />
              <input
                type="text"
                value={searchApps}
                onChange={e => setSearchApps(e.target.value)}
                placeholder="Search..."
                className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {loadingApps ? (
                <p className="text-xs text-slate-500 text-center py-2">Loading...</p>
              ) : filteredApps.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-2">No apps yet</p>
              ) : (
                filteredApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setGeneratedCode(app.code);
                      setCurrentAppId(app.id);
                      setAppMeta({ name: app.name, description: app.description });
                      setActiveTab("preview");
                    }}
                    className="flex items-center justify-between p-1.5 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-xs text-slate-300 cursor-pointer transition-all group"
                  >
                    <span className="truncate">{app.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(app);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex-shrink-0 h-16 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6">
            <div>
              <h2 className="text-sm font-semibold text-white">{appMeta?.name || 'New App'}</h2>
              <p className="text-xs text-slate-500">{appMeta?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {generatedCode && (
                <>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                  >
                    {showCode ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      toast.success("Code copied!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-cyan-500/20 transition-all border border-cyan-500/30"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </>
              )}
              {!generatedCode && (
                <Button
                  onClick={handleBuild}
                  disabled={isBuilding || entities.length === 0}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-mono font-bold border-0"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  BUILD
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {isBuilding ? (
                <motion.div
                  key="building"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center p-6 gap-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center"
                  >
                    <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">GENERATING APP</p>
                    <p className="text-slate-400 text-sm mt-1">Building your interface...</p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{buildProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        animate={{ width: `${buildProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <div className="w-full max-w-sm bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                    {buildLog.map((log, i) => (
                      <div
                        key={i}
                        className={`text-xs ${
                          log.type === "error"
                            ? "text-red-400"
                            : log.type === "success"
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }`}
                      >
                        {log.msg}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : generatedCode ? (
                <motion.div key="preview" className="h-full">
                  {showCode ? (
                    <div className="h-full overflow-auto bg-slate-950 p-4">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">{generatedCode}</pre>
                    </div>
                  ) : (
                    <LiveAppSandbox
                      code={generatedCode}
                      orgId={orgId}
                      vehicles={vehicles}
                      routes={routes}
                      shipments={shipments}
                      alerts={alerts}
                      customers={customers}
                      currentUser={currentUser}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center"
                >
                  {selectedEntity !== null ? (
                    <DatabaseDesigner
                      entities={[entities[selectedEntity]]}
                      onEntitiesChange={(updated) => {
                        const newEntities = [...entities];
                        newEntities[selectedEntity] = updated[0];
                        setEntities(newEntities);
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Database className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Define entities to start building</p>
                    </div>
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