import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Cpu, Sparkles, Send, Code2, Play, RefreshCw, X, ChevronRight, 
  Lightbulb, Package, Truck, Route, AlertTriangle, Users, FileText,
  BarChart3, Zap, CheckCircle2, Loader2, Terminal, Eye, Copy, Settings2,
  Wrench, Activity, Globe, Database, Save, Store, Trash2, Download,
  FolderOpen, Upload, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";


// --- Live App Sandbox ---
function LiveAppSandbox({ code, orgId, vehicles, routes, shipments, alerts, customers, currentUser }) {
  const iframeRef = useRef(null);
  const [sandboxError, setSandboxError] = useState(null);

  useEffect(() => {
    if (!code || !iframeRef.current) return;
    setSandboxError(null);

    const orgDataScript = `
      window.__ORG_DATA__ = {
        orgId: ${JSON.stringify(orgId)},
        vehicles: ${JSON.stringify(vehicles)},
        routes: ${JSON.stringify(routes)},
        shipments: ${JSON.stringify(shipments)},
        alerts: ${JSON.stringify(alerts)},
        customers: ${JSON.stringify(customers)},
        currentUser: ${JSON.stringify(currentUser)},
      };
    `;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = { theme: { extend: {} } }</script>
<style>
  body { margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1e293b; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
</style>
</head>
<body>
<div id="root"></div>
<script>${orgDataScript}</script>
<script type="text/babel">
const { useState, useEffect, useRef, useMemo } = React;
const orgData = window.__ORG_DATA__;
const { orgId, vehicles, routes, shipments, alerts, customers, currentUser } = orgData;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'p-6 text-red-400 font-mono text-sm' },
        React.createElement('p', { className: 'font-bold mb-2' }, '⚠️ App Error:'),
        React.createElement('pre', { className: 'whitespace-pre-wrap text-xs opacity-80' }, this.state.error?.message)
      );
    }
    return this.props.children;
  }
}

${code}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(ErrorBoundary, null,
    React.createElement(GeneratedApp, { orgId, vehicles, routes, shipments, alerts, customers, currentUser })
  )
);
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code, orgId, vehicles, routes, shipments, alerts, customers, currentUser]);

  return (
    <div className="relative w-full h-full">
      {sandboxError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/90">
          <div className="text-red-400 font-mono text-sm p-4">⚠️ {sandboxError}</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 rounded-b-lg"
        sandbox="allow-scripts allow-same-origin"
        title="H.A.R.B.O.R Generated App"
      />
    </div>
  );
}

// --- Idea Templates ---
const IDEA_TEMPLATES = [
  { icon: BarChart3, label: "Fleet Analytics Dashboard", prompt: "Build an analytics dashboard showing vehicle status distribution as a pie chart, top routes by distance as a bar chart, and shipment status breakdown. Use recharts-style visualizations with Tailwind CSS dark theme." },
  { icon: AlertTriangle, label: "Live Alert Monitor", prompt: "Build a real-time alert monitor that categorizes alerts by type and severity, shows a severity filter, marks alerts as resolved with a button, and displays stats at the top." },
  { icon: Truck, label: "Vehicle Status Board", prompt: "Build a vehicle status board showing all vehicles in a grid with their type, status (colored badges), fuel level as a progress bar, and last known location. Include filter tabs for status." },
  { icon: Package, label: "Shipment Tracker", prompt: "Build a shipment tracker with search, filter by status, and a list of shipments with tracking numbers, origin → destination, status badge, and customer name." },
  { icon: Route, label: "Route Performance Map", prompt: "Build a route performance table showing all routes with their distance, estimated duration, status, transport type, CO2 estimate, and AI-optimized badge. Include sortable columns." },
  { icon: Users, label: "Customer CRM View", prompt: "Build a CRM customer list with search, filter by customer type and status, and cards showing name, company, email, city/country, and contact info." },
  { icon: Activity, label: "Operations KPI Board", prompt: "Build a KPI board with large stat cards: total vehicles, active shipments, open alerts, completed routes. Add trend indicators and color coding." },
  { icon: Globe, label: "Custom App", prompt: "" },
];

const CATEGORY_EMOJIS = { analytics: "📊", monitoring: "🔍", operations: "⚙️", crm: "👥", productivity: "⚡", custom: "✨" };

// --- My Saved Apps Panel ---
function MyAppsPanel({ orgId, onOpen, onDelete, apps, loading, onRefresh }) {
  if (loading) return (
    <div className="flex items-center justify-center h-40 gap-2 text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading apps...</span>
    </div>
  );
  if (apps.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
      <FolderOpen className="w-8 h-8 opacity-40" />
      <p className="text-sm">No saved apps yet</p>
      <p className="text-xs text-slate-600">Build and save your first app above</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {apps.map(app => (
        <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/60 hover:border-cyan-500/20 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-base flex-shrink-0">
            {app.icon_emoji || "⚡"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white truncate">{app.name}</p>
              {app.published_to_store && (
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 text-[9px] px-1">STORE</Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate">{app.description || app.prompt?.slice(0, 60) + "..."}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onOpen(app)}
              className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all" title="Open">
              <Play className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(app)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Publish Modal ---
function PublishModal({ appMeta, onConfirm, onCancel, saving }) {
  const [category, setCategory] = useState(appMeta?.category || "custom");
  const [emoji, setEmoji] = useState(appMeta?.icon_emoji || "⚡");
  const [description, setDescription] = useState(appMeta?.description || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-80 bg-slate-900 border border-violet-500/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Publish to Fleet Store</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Your app will be visible to all NexusVectis users in the Fleet Store.</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">App Emoji</label>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/50" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50">
              {["analytics", "monitoring", "operations", "crm", "productivity", "custom"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="ghost" onClick={onCancel} className="flex-1 text-slate-400 text-xs h-8">Cancel</Button>
          <Button onClick={() => onConfirm({ category, icon_emoji: emoji, description })} disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 font-mono gap-1.5 border-0">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Publish
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Component ---
export default function HarborAppBuilder({ onClose, vehicles = [], routes = [], shipments = [], alerts = [], customers = [], currentUser, orgId }) {
  const [step, setStep] = useState("idea"); // idea | building | preview
  const [activeTab, setActiveTab] = useState("builder"); // builder | myapps
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [buildLog, setBuildLog] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [appMeta, setAppMeta] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeView, setActiveView] = useState("preview");
  const [savedApps, setSavedApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    loadSavedApps();
  }, [orgId]);

  const loadSavedApps = async () => {
    if (!orgId) return;
    setLoadingApps(true);
    const apps = await base44.entities.HarborApp.filter({ organization_id: orgId }, '-created_date', 50);
    setSavedApps(apps);
    setLoadingApps(false);
  };

  const addLog = (msg, type = "info") => {
    setBuildLog(prev => [...prev, { msg, type, ts: Date.now() }]);
  };

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setIsBuilding(true);
    setStep("building");
    setBuildLog([]);
    setBuildProgress(0);
    setGeneratedCode("");
    setCurrentSavedId(null);

    addLog("🚀 H.A.R.B.O.R AI initializing...", "system");
    setBuildProgress(10);
    await new Promise(r => setTimeout(r, 300));
    addLog(`📊 Scanning org data: ${vehicles.length} vehicles, ${routes.length} routes, ${shipments.length} shipments, ${alerts.length} alerts, ${customers.length} customers`, "info");
    setBuildProgress(20);
    await new Promise(r => setTimeout(r, 400));
    addLog("🧠 Generating component architecture...", "info");
    setBuildProgress(35);

    const dataContext = `
Available org data (passed as props to GeneratedApp component):
- vehicles (array): ${JSON.stringify(vehicles.slice(0, 2))} ...${vehicles.length} total
- routes (array): ${JSON.stringify(routes.slice(0, 2))} ...${routes.length} total  
- shipments (array): ${JSON.stringify(shipments.slice(0, 2))} ...${shipments.length} total
- alerts (array): ${JSON.stringify(alerts.slice(0, 2))} ...${alerts.length} total
- customers (array): ${JSON.stringify(customers.slice(0, 2))} ...${customers.length} total
- currentUser: ${JSON.stringify(currentUser)}
- orgId: "${orgId}"
`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are H.A.R.B.O.R AI — the world's most advanced logistics app builder.

Generate a COMPLETE, WORKING React component for this Intellect Mode app:

USER REQUEST: "${prompt}"

${dataContext}

STRICT REQUIREMENTS:
1. Export a function named EXACTLY "GeneratedApp" — this is mandatory
2. It receives these props: { orgId, vehicles, routes, shipments, alerts, customers, currentUser }
3. Use ONLY: React (useState, useEffect, useRef, useMemo already available), Tailwind CSS classes for styling
4. NO external imports — no lucide-react, no recharts, no shadcn — use only vanilla React + Tailwind
5. For charts, use inline SVG or CSS-based visuals (div bars, etc.)
6. For icons, use emoji or Unicode symbols
7. Dark theme: bg-slate-900, text-slate-100, borders slate-700, accents cyan-400/violet-400
8. Must be FULLY FUNCTIONAL with the real data from props
9. Must handle empty arrays gracefully
10. Must look beautiful and professional
11. NO markdown, NO explanation — output ONLY the JavaScript code

The component must start with: function GeneratedApp({ orgId, vehicles, routes, shipments, alerts, customers, currentUser }) {

Return ONLY raw JavaScript code. No \`\`\`js markers. No explanation text.`,
        response_json_schema: null
      });

      setBuildProgress(75);
      addLog("⚡ Compiling React component...", "info");
      await new Promise(r => setTimeout(r, 300));

      let code = typeof result === "string" ? result : JSON.stringify(result);
      code = code.replace(/^```(?:jsx?|javascript)?\n?/gm, "").replace(/```$/gm, "").trim();

      if (!code.includes("function GeneratedApp") && !code.includes("const GeneratedApp")) {
        if (!code.includes("GeneratedApp")) {
          code = `function GeneratedApp({ orgId, vehicles, routes, shipments, alerts, customers, currentUser }) {\n${code}\n}`;
        }
      }

      setGeneratedCode(code);
      setBuildProgress(90);
      addLog("🎨 Rendering live preview...", "success");
      await new Promise(r => setTimeout(r, 400));

      const metaResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Given this app description: "${prompt}", generate a short app name (max 4 words) and one-line description (max 12 words). Also pick a category from: analytics, monitoring, operations, crm, productivity, custom. And pick one relevant emoji. Return JSON: {"name": "string", "description": "string", "category": "string", "icon_emoji": "string"}`,
        response_json_schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, category: { type: "string" }, icon_emoji: { type: "string" } } }
      });
      setAppMeta(metaResult);

      setBuildProgress(100);
      addLog(`✅ App "${metaResult?.name || 'Custom App'}" built successfully!`, "success");
      await new Promise(r => setTimeout(r, 500));
      setStep("preview");
    } catch (err) {
      addLog(`❌ Build failed: ${err.message}`, "error");
      setBuildProgress(0);
      setStep("idea");
    }

    setIsBuilding(false);
  };

  const handleSave = async () => {
    if (!generatedCode || !orgId) return;
    setSaving(true);
    try {
      const data = {
        organization_id: orgId,
        name: appMeta?.name || "Custom App",
        description: appMeta?.description || "",
        prompt,
        code: generatedCode,
        category: appMeta?.category || "custom",
        icon_emoji: appMeta?.icon_emoji || "⚡",
        created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
      };
      if (currentSavedId) {
        await base44.entities.HarborApp.update(currentSavedId, data);
        toast.success("App updated!");
      } else {
        const saved = await base44.entities.HarborApp.create(data);
        setCurrentSavedId(saved.id);
        toast.success("App saved to your org!");
      }
      await loadSavedApps();
    } catch (err) {
      toast.error("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const handlePublishToStore = async ({ category, icon_emoji, description }) => {
    setPublishing(true);
    try {
      // Save first if not saved
      let savedId = currentSavedId;
      if (!savedId) {
        const saved = await base44.entities.HarborApp.create({
          organization_id: orgId,
          name: appMeta?.name || "Custom App",
          description,
          prompt,
          code: generatedCode,
          category,
          icon_emoji,
          published_to_store: true,
          created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
        });
        savedId = saved.id;
        setCurrentSavedId(savedId);
      } else {
        await base44.entities.HarborApp.update(savedId, { published_to_store: true, category, icon_emoji, description });
      }
      setAppMeta(prev => ({ ...prev, category, icon_emoji, description }));
      await loadSavedApps();
      toast.success("🎉 Published to Fleet Store!");
      setShowPublishModal(false);
    } catch (err) {
      toast.error("Publish failed: " + err.message);
    }
    setPublishing(false);
  };

  const handleOpenSavedApp = (app) => {
    setPrompt(app.prompt || "");
    setGeneratedCode(app.code);
    setAppMeta({ name: app.name, description: app.description, category: app.category, icon_emoji: app.icon_emoji });
    setCurrentSavedId(app.id);
    setStep("preview");
    setActiveView("preview");
    setActiveTab("builder");
  };

  const handleDeleteApp = async (app) => {
    await base44.entities.HarborApp.delete(app.id);
    if (currentSavedId === app.id) { setCurrentSavedId(null); }
    await loadSavedApps();
    toast.success("App deleted");
  };

  const handleRebuild = () => {
    setStep("idea");
    setGeneratedCode("");
    setAppMeta(null);
    setCurrentSavedId(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied!");
  };

  const isSaved = !!currentSavedId;
  const isPublished = savedApps.find(a => a.id === currentSavedId)?.published_to_store;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Animated Grid Background */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: 'linear-gradient(0deg, #06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Scanning Lines */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full w-full text-white overflow-hidden">
        {showPublishModal && (
          <PublishModal
            appMeta={appMeta}
            onConfirm={handlePublishToStore}
            onCancel={() => setShowPublishModal(false)}
            saving={publishing}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center border border-cyan-400/50"
          >
            <Cpu className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h2 className="text-base font-bold text-white font-mono tracking-widest" style={{ textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>⚡ H.A.R.B.O.R APP BUILDER</h2>
            <p className="text-[10px] text-cyan-400/60 font-mono">AI-POWERED COMPONENT GENERATOR</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {step === "preview" && (
            <>
              <button
                onClick={() => setActiveView(v => v === "preview" ? "code" : "preview")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${activeView === "code" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                {activeView === "preview" ? <Code2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {activeView === "preview" ? "Code" : "Preview"}
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${isSaved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"}`}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? "Saved" : "Save"}
              </button>
              {!isPublished && (
                <button onClick={() => setShowPublishModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 transition-all">
                  <Store className="w-3.5 h-3.5" /> Publish
                </button>
              )}
              {isPublished && (
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 text-[10px]">
                  <Store className="w-2.5 h-2.5 mr-1" />In Store
                </Badge>
              )}
              <button onClick={handleRebuild}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Rebuild
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {[
          { id: "builder", label: "Builder", icon: Zap },
          { id: "myapps", label: `My Apps (${savedApps.length})`, icon: FolderOpen },

            ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* MY APPS TAB */}
          {activeTab === "myapps" && (
            <motion.div key="myapps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-3">
              <MyAppsPanel
                orgId={orgId}
                apps={savedApps}
                loading={loadingApps}
                onOpen={handleOpenSavedApp}
                onDelete={handleDeleteApp}
                onRefresh={loadSavedApps}
              />
            </motion.div>
          )}

          {/* BUILDER TAB */}
          {activeTab === "builder" && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">

              {/* STEP: IDEA */}
              {step === "idea" && (
                <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: "🚛", label: `${vehicles.length} Vehicles` },
                      { icon: "📦", label: `${shipments.length} Shipments` },
                      { icon: "🗺️", label: `${routes.length} Routes` },
                      { icon: "🔔", label: `${alerts.length} Alerts` },
                      { icon: "👥", label: `${customers.length} Customers` },
                    ].map(d => (
                      <div key={d.label} className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
                        <span>{d.icon}</span><span>{d.label}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Quick Start Templates
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {IDEA_TEMPLATES.map((t) => {
                        const Icon = t.icon;
                        const isCustom = t.label === "Custom App";
                        return (
                          <button key={t.label}
                            onClick={() => {
                              setSelectedTemplate(t.label);
                              if (!isCustom) setPrompt(t.prompt);
                              else { setPrompt(""); promptRef.current?.focus(); }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                              selectedTemplate === t.label
                                ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                                : "border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70"
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                            <span className="font-medium leading-tight">{t.label}</span>
                            {!isCustom && <ChevronRight className="w-3 h-3 ml-auto opacity-40 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Describe your app
                    </p>
                    <textarea ref={promptRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                      placeholder="e.g. Build a real-time vehicle efficiency dashboard with fuel level gauges..."
                      rows={4}
                      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/60 focus:bg-slate-800"
                      onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleBuild(); }}
                    />
                    <p className="text-[10px] text-slate-500">Full access to your organisation's live data. Press ⌘+Enter to build.</p>
                  </div>

                  <Button onClick={handleBuild} disabled={!prompt.trim()}
                    className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-mono font-bold tracking-wider border-0 gap-2">
                    <Zap className="w-4 h-4" />BUILD WITH H.A.R.B.O.R AI
                  </Button>
                </div>
              )}

              {/* STEP: BUILDING */}
              {step === "building" && (
                <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
                  <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Cpu className="w-10 h-10 text-cyan-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-white font-bold font-mono tracking-wider text-lg">BUILDING YOUR APP</p>
                    <p className="text-slate-400 text-sm mt-1">H.A.R.B.O.R AI is generating your component...</p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-slate-500 mb-1 font-mono">
                      <span>Progress</span><span>{buildProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                        animate={{ width: `${buildProgress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                  <div className="w-full max-w-sm bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                    {buildLog.map((log, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className={`${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-emerald-400" : log.type === "system" ? "text-violet-400" : "text-slate-300"}`}>
                        {log.msg}
                      </motion.div>
                    ))}
                    {isBuilding && (
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                        className="text-cyan-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP: PREVIEW */}
              {step === "preview" && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/60 bg-slate-900/60 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{appMeta?.icon_emoji} {appMeta?.name || "Custom App"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{appMeta?.description || "H.A.R.B.O.R Generated"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">LIVE</Badge>
                      {activeView === "code" && (
                        <button onClick={handleCopyCode}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {activeView === "preview" ? (
                      <LiveAppSandbox code={generatedCode} orgId={orgId} vehicles={vehicles} routes={routes} shipments={shipments} alerts={alerts} customers={customers} currentUser={currentUser} />
                    ) : (
                      <div className="h-full overflow-auto bg-slate-950 p-4">
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{generatedCode}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}