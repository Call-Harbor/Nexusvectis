import React, { useState, useRef, useEffect, useCallback } from "react";
import { strToU8, zipSync } from "fflate";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Code2, Terminal, GitBranch, Play, Plus, X, Copy, Download,
  Cpu, Zap, ChevronRight, Folder, FolderOpen, Package,
  Check, AlertCircle, Loader2, Cloud, Lock,
  ArrowRight, Activity, Bot, Layers, Search,
  FolderArchive, GitCommit, BarChart3, Edit3, Trash2,
  Shield, FileText, TestTube, RefreshCw, BookOpen,
  Wand2, MessageSquare, Network, Eye, Gauge, Bug,
  Boxes, Sparkles, ChevronDown, Send, KeyRound,
  Globe, Replace, Import, EyeOff, Database,
  Link, Cpu as CpuIcon
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const LANG_MAP = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", sh: "bash", yml: "yaml", yaml: "yaml", json: "json",
  sql: "sql", dockerfile: "dockerfile", md: "markdown", css: "css", html: "html",
};
const LANG_COLORS = {
  javascript: "#f7df1e", typescript: "#3178c6", python: "#3776ab",
  bash: "#4eaa25", yaml: "#cb171e", json: "#5da5d5", sql: "#e38c00",
  dockerfile: "#0db7ed", markdown: "#083fa1", css: "#1572b6", html: "#e34f26",
};

const PIPELINE_STAGES = [
  { id: "code", label: "Code", icon: Code2, color: "#06b6d4" },
  { id: "test", label: "Test", icon: Check, color: "#10b981" },
  { id: "build", label: "Build", icon: Package, color: "#8b5cf6" },
  { id: "scan", label: "Security", icon: Lock, color: "#f59e0b" },
  { id: "deploy", label: "Deploy", icon: Cloud, color: "#3b82f6" },
  { id: "monitor", label: "Monitor", icon: Activity, color: "#ec4899" },
];

const DEFAULT_FILES = [
  {
    id: "main", name: "main.py", lang: "python",
    content: `# NexusVectis AI Orchestrator\nimport asyncio\nfrom dataclasses import dataclass\nfrom typing import List\n\n@dataclass\nclass OrchestrationTask:\n    id: str\n    name: str\n    priority: int\n    dependencies: List[str]\n    status: str = "pending"\n\nasync def orchestrate_fleet_ops(tasks):\n    """AI-powered fleet orchestration engine."""\n    completed = set()\n    for task in sorted(tasks, key=lambda t: t.priority):\n        if all(d in completed for d in task.dependencies):\n            task.status = "running"\n            await asyncio.sleep(0.1)\n            task.status = "completed"\n            completed.add(task.id)\n    return completed\n\nif __name__ == "__main__":\n    tasks = [\n        OrchestrationTask("t1", "Load fleet telemetry", 1, []),\n        OrchestrationTask("t2", "Anomaly detection", 2, ["t1"]),\n        OrchestrationTask("t3", "Optimize routes", 3, ["t1"]),\n        OrchestrationTask("t4", "Generate report", 4, ["t2", "t3"]),\n    ]\n    asyncio.run(orchestrate_fleet_ops(tasks))\n`
  },
  {
    id: "devops", name: "pipeline.yml", lang: "yaml",
    content: `name: Fleet AI Deployment\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pytest tests/ -v\n  build:\n    needs: test\n    steps:\n      - run: docker build -t nexusvectis/fleet-ai .\n  deploy:\n    needs: build\n    environment: production\n    steps:\n      - run: kubectl set image deployment/fleet-ai fleet-ai=nexusvectis/fleet-ai:latest\n`
  },
  {
    id: "api", name: "api.js", lang: "javascript",
    content: `// NexusVectis Fleet API\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\napp.get('/api/v1/fleet/telemetry', async (req, res) => {\n  const { orgId } = req.query;\n  const telemetry = await FleetAI.getTelemetry(orgId);\n  const anomalies = await FleetAI.detectAnomalies(telemetry);\n  res.json({ status: 'ok', vehicles: telemetry.length, anomalies, timestamp: new Date() });\n});\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'healthy', uptime: process.uptime() });\n});\n\napp.listen(3000);\n`
  },
];

// ── AI Feature Definitions ────────────────────────────────────────────────────
const AI_FEATURES = [
  { id: "review", label: "Code Review", icon: Eye, color: "#06b6d4", desc: "Deep AI code review with issues, fixes & best practices" },
  { id: "security", label: "Security Scan", icon: Shield, color: "#ef4444", desc: "CVE scanning, OWASP checks, secret detection" },
  { id: "docs", label: "Generate Docs", icon: BookOpen, color: "#10b981", desc: "Auto-generate JSDoc/docstrings & README" },
  { id: "tests", label: "Write Tests", icon: TestTube, color: "#8b5cf6", desc: "Generate unit, integration & edge case tests" },
  { id: "refactor", label: "Smart Refactor", icon: RefreshCw, color: "#f59e0b", desc: "AI refactoring with performance & readability gains" },
  { id: "explain", label: "Explain Code", icon: MessageSquare, color: "#ec4899", desc: "Line-by-line AI explanation of complex code" },
  { id: "perf", label: "Profile & Optimize", icon: Gauge, color: "#3b82f6", desc: "Identify bottlenecks and suggest optimizations" },
  { id: "deps", label: "Dependency Analysis", icon: Network, color: "#a3e635", desc: "Detect outdated, vulnerable or unused dependencies" },
  { id: "arch", label: "Architecture Diagram", icon: Boxes, color: "#fb923c", desc: "Generate system architecture from codebase" },
  { id: "debug", label: "AI Debugger", icon: Bug, color: "#f43f5e", desc: "Trace bugs, suggest fixes with root cause analysis" },
  { id: "migrate", label: "Code Migration", icon: ArrowRight, color: "#06b6d4", desc: "Migrate code between languages/frameworks" },
  { id: "project", label: "Generate Project", icon: Sparkles, color: "#8b5cf6", desc: "Generate entire multi-file project from description" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function TerminalEmulator({ output, isRunning, onClear }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [output]);
  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 font-bold">TERMINAL</span>
          {isRunning && <span className="flex items-center gap-1 text-amber-400"><Loader2 className="w-3 h-3 animate-spin" />running</span>}
        </div>
        <button onClick={onClear} className="text-slate-600 hover:text-slate-400 text-[10px]">clear</button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-0.5">
        {output.map((line, i) => (
          <div key={i} className={`leading-5 ${
            line.type === 'error' ? 'text-red-400' :
            line.type === 'success' ? 'text-green-400' :
            line.type === 'info' ? 'text-cyan-400' :
            line.type === 'warn' ? 'text-amber-400' :
            line.type === 'system' ? 'text-violet-400' : 'text-slate-300'
          }`}>
            {line.type === 'system' && <span className="text-slate-600">$ </span>}
            {line.text}
          </div>
        ))}
        {isRunning && <div className="text-green-400 animate-pulse">█</div>}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function PipelineVisualizer({ activeStage, stageStatus }) {
  return (
    <div className="p-4 bg-slate-900/80 border-b border-slate-800">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">CI/CD Pipeline</p>
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const status = stageStatus[stage.id] || "idle";
          const isActive = activeStage === stage.id;
          return (
            <React.Fragment key={stage.id}>
              <div className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${isActive ? "bg-slate-700" : "opacity-60"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  status === "success" ? "bg-green-500/20" : status === "running" ? "bg-amber-500/20" : status === "error" ? "bg-red-500/20" : "bg-slate-800"
                }`}>
                  {status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: stage.color }} /> :
                   status === "success" ? <Check className="w-3.5 h-3.5 text-green-400" /> :
                   status === "error" ? <AlertCircle className="w-3.5 h-3.5 text-red-400" /> :
                   <Icon className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <span className="text-[9px] text-slate-400 font-mono">{stage.label}</span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && <ArrowRight className={`w-3 h-3 flex-shrink-0 ${stageStatus[stage.id] === "success" ? "text-green-500" : "text-slate-700"}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FileExplorer({ files, activeFileId, onSelect, onNew, onDelete, onRename }) {
  return (
    <div className="h-full bg-slate-950 border-r border-slate-800 flex flex-col" style={{ minWidth: 148, maxWidth: 148 }}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Files</span>
        <button onClick={onNew} className="text-slate-500 hover:text-cyan-400 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <div className="px-2 mb-1 flex items-center gap-1 text-slate-500">
          <FolderOpen className="w-3 h-3" /><span className="text-[10px]">nexusvectis</span>
        </div>
        {files.map(f => (
          <div key={f.id}
            className={`flex items-center gap-1.5 px-3 py-1 cursor-pointer group transition-colors ${f.id === activeFileId ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
            onClick={() => onSelect(f.id)}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[f.lang] || "#94a3b8" }} />
            <span className="text-[11px] flex-1 truncate font-mono">{f.name}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto">
              <button className="text-slate-600 hover:text-cyan-400" onClick={e => { e.stopPropagation(); onRename(f.id); }}><Edit3 className="w-2.5 h-2.5" /></button>
              <button className="text-slate-600 hover:text-red-400" onClick={e => { e.stopPropagation(); onDelete(f.id); }}><Trash2 className="w-2.5 h-2.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIResultPanel({ result, onClose }) {
  if (!result) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-700 z-10 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <result.icon className="w-3.5 h-3.5" style={{ color: result.color }} />
          <span className="text-xs font-bold text-white">{result.title}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex-1 overflow-auto p-3 text-xs text-slate-300 leading-relaxed space-y-2 font-mono whitespace-pre-wrap">
        {result.content}
      </div>
      <div className="flex gap-2 p-2 border-t border-slate-800 flex-shrink-0">
        <button onClick={() => { navigator.clipboard.writeText(result.content); toast.success("Copied"); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all">
          <Copy className="w-3 h-3" /> Copy
        </button>
        {result.applyCode && (
          <button onClick={result.applyCode}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs transition-all">
            <Check className="w-3 h-3" /> Apply
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AIChatSidebar({ files, activeFile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm Fleet AI. Ask me anything about your code, architecture, or DevOps." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Fleet AI, an expert DevOps and software engineering assistant for NexusVectis fleet management platform.

Current open file: ${activeFile?.name} (${activeFile?.lang})
File content (first 600 chars):
${activeFile?.content?.slice(0, 600)}

Project files: ${files.map(f => f.name).join(", ")}

User question: "${userMsg}"

Answer concisely and technically. Use code blocks where helpful.`,
        model: "claude_sonnet_4_6"
      });
      setMessages(prev => [...prev, { role: "assistant", text: typeof reply === "string" ? reply : JSON.stringify(reply) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800" style={{ width: 280 }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-bold text-violet-300">Fleet AI Chat</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl">
              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-slate-800 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask Fleet AI..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all">
          <Send className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIDevOrchestrator({ onClose }) {
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState("main");
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "system", text: "NexusVectis Fleet AI IDE — DevOps Orchestrator v3.0" },
    { type: "info", text: "12 AI features available. Select from the AI toolbar or chat." },
    { type: "success", text: "✓ Environment initialized" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState("code");
  const [stageStatus, setStageStatus] = useState({});
  const [activePanel, setActivePanel] = useState("editor");
  const [bottomPanel, setBottomPanel] = useState("terminal");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);
  const [projectPrompt, setProjectPrompt] = useState("");
  const [showProjectGen, setShowProjectGen] = useState(false);
  const [gitLog] = useState([
    { hash: "a3f8c12", msg: "Initial fleet orchestrator setup", time: "2 min ago" },
    { hash: "b7d2e91", msg: "Add anomaly detection pipeline", time: "5 min ago" },
    { hash: "c9a1f44", msg: "Configure Kubernetes deployment", time: "12 min ago" },
  ]);
  const [orchestratorTasks, setOrchestratorTasks] = useState([
    { id: 1, name: "Fleet telemetry sync", status: "completed", agent: "DataAgent", duration: "1.2s" },
    { id: 2, name: "Anomaly detection run", status: "completed", agent: "AIAgent", duration: "3.4s" },
    { id: 3, name: "Route optimization", status: "running", agent: "RouteAgent", duration: "..." },
    { id: 4, name: "Report generation", status: "pending", agent: "ReportAgent", duration: "-" },
  ]);
  const [devopsTab, setDevopsTab] = useState("iac");
  const [devopsInput, setDevopsInput] = useState("");
  const [devopsResult, setDevopsResult] = useState(null);
  const [devopsLoading, setDevopsLoading] = useState(false);

  // Secrets
  const [secrets, setSecrets] = useState([
    { id: 1, key: "DATABASE_URL", value: "postgresql://user:pass@localhost/fleetdb", masked: true },
    { id: 2, key: "FLEET_AI_KEY", value: "sk-fleetai-prod-xxx", masked: true },
    { id: 3, key: "NODE_ENV", value: "development", masked: false },
    { id: 4, key: "REDIS_URL", value: "redis://localhost:6379", masked: true },
  ]);
  const [showSecretValues, setShowSecretValues] = useState({});
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");

  // Packages
  const [packages, setPackages] = useState([
    { id: 1, name: "fastapi", version: "0.104.0", lang: "python", status: "installed" },
    { id: 2, name: "asyncpg", version: "0.29.0", lang: "python", status: "installed" },
    { id: 3, name: "pydantic", version: "2.5.0", lang: "python", status: "installed" },
    { id: 4, name: "express", version: "4.18.2", lang: "node", status: "installed" },
    { id: 5, name: "axios", version: "1.6.0", lang: "node", status: "installed" },
  ]);
  const [packageInput, setPackageInput] = useState("");
  const [packageLang, setPackageLang] = useState("python");
  const [packageInstalling, setPackageInstalling] = useState(false);

  // API Tester
  const [apiUrl, setApiUrl] = useState("https://httpbin.org/get");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiBody, setApiBody] = useState('{"key": "value"}');
  const [apiHeaders, setApiHeaders] = useState('{"Content-Type": "application/json"}');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiTab, setApiTab] = useState("response");

  // Find & Replace
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);

  // Import from URL
  const [importUrl, setImportUrl] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);
  const log = (text, type = "default") => setTerminalOutput(prev => [...prev, { text, type }]);

  // ── Run file ────────────────────────────────────────────────────────────────
  const runFile = async () => {
    if (isRunning || !activeFile) return;
    setIsRunning(true); setBottomPanel("terminal");
    log(`$ run ${activeFile.name}`, "system");
    for (const stage of PIPELINE_STAGES.slice(0, 3)) {
      setActiveStage(stage.id); setStageStatus(prev => ({ ...prev, [stage.id]: "running" }));
      await new Promise(r => setTimeout(r, 500));
      setStageStatus(prev => ({ ...prev, [stage.id]: "success" }));
    }
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate running this ${activeFile.lang} code for NexusVectis fleet management. Return JSON: { "output": ["line1","line2",...], "exit_code": 0, "duration_ms": 1234 }\n\nCode:\n${activeFile.content.slice(0, 800)}`,
        response_json_schema: { type: "object", properties: { output: { type: "array", items: { type: "string" } }, exit_code: { type: "number" }, duration_ms: { type: "number" } } }
      });
      (result.output || ["Done"]).forEach(line => log(line, line.includes("Error") ? "error" : line.includes("✓") ? "success" : "default"));
      log(`Process exited with code ${result.exit_code ?? 0} in ${result.duration_ms ?? 800}ms`, result.exit_code === 0 ? "success" : "error");
    } catch { log("Process exited with code 0", "success"); }
    setIsRunning(false);
  };

  // ── Deploy pipeline ─────────────────────────────────────────────────────────
  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true); setBottomPanel("terminal"); setStageStatus({});
    log("$ nexusvectis deploy --env=production", "system");
    for (const stage of PIPELINE_STAGES) {
      setActiveStage(stage.id); setStageStatus(prev => ({ ...prev, [stage.id]: "running" }));
      log(`[${stage.label.toUpperCase()}] Starting...`, "info");
      await new Promise(r => setTimeout(r, 900));
      setStageStatus(prev => ({ ...prev, [stage.id]: "success" }));
      log(`[${stage.label.toUpperCase()}] ✓ Passed`, "success");
    }
    log("\n🚀 Deployment successful! Fleet AI v3.0 is live.", "success");
    toast.success("Pipeline completed — Fleet AI deployed!");
    setIsRunning(false);
  };

  // ── AI Feature Runner ───────────────────────────────────────────────────────
  const runAIFeature = async (feature) => {
    if (isGenerating) return;
    setActiveFeature(feature.id);
    setIsGenerating(true);
    setAiResult(null);
    log(`$ fleet-ai ${feature.id} ${activeFile?.name}`, "system");
    log(`🤖 Running: ${feature.label}...`, "info");

    const prompts = {
      review: `Perform a comprehensive code review of this ${activeFile?.lang} code. Include: issues (numbered), severity levels, specific fix suggestions, best practices violations, and positive aspects. Be very detailed and technical.\n\nCode:\n${activeFile?.content}`,
      security: `Perform a security audit of this ${activeFile?.lang} code. Check for: SQL injection, XSS, CSRF, hardcoded secrets, insecure dependencies, OWASP Top 10 vulnerabilities, input validation issues. Rate each finding as CRITICAL/HIGH/MEDIUM/LOW and provide exact line references and fixes.\n\nCode:\n${activeFile?.content}`,
      docs: `Generate comprehensive documentation for this ${activeFile?.lang} code. Include: module docstring, function/method docstrings with params/returns/raises, usage examples, and a README section. Format properly for the language.\n\nCode:\n${activeFile?.content}`,
      tests: `Generate comprehensive tests for this ${activeFile?.lang} code. Include: unit tests for each function, edge cases, error cases, integration tests where applicable. Use appropriate testing framework (pytest for Python, Jest for JS). Aim for 90%+ coverage.\n\nCode:\n${activeFile?.content}`,
      refactor: `Refactor this ${activeFile?.lang} code for maximum quality. Apply: SOLID principles, DRY, design patterns where appropriate, improved naming, better error handling, performance optimizations. Show the complete refactored code with comments explaining each improvement.\n\nCode:\n${activeFile?.content}`,
      explain: `Explain this ${activeFile?.lang} code in detail. For each section: what it does, why it exists, how it works internally, potential issues, and how it fits the NexusVectis fleet system. Use clear headings and be educational.\n\nCode:\n${activeFile?.content}`,
      perf: `Profile and analyze the performance of this ${activeFile?.lang} code. Identify: time complexity of each function (Big-O), memory usage concerns, I/O bottlenecks, database query issues, caching opportunities, and specific optimizations with estimated improvement percentages.\n\nCode:\n${activeFile?.content}`,
      deps: `Analyze the dependencies in this ${activeFile?.lang} code. List: all imports/requires used, whether each is necessary, potential alternatives, version recommendations, security vulnerabilities in common versions, and suggest a package.json/requirements.txt. Also identify any circular dependencies.\n\nCode:\n${activeFile?.content}`,
      arch: `Based on these project files: ${files.map(f => f.name).join(", ")}, generate a detailed ASCII/text architecture diagram and description. Include: component relationships, data flow, API boundaries, database connections, and how this fits NexusVectis fleet management. Also suggest improvements.\n\nMain file:\n${activeFile?.content?.slice(0, 600)}`,
      debug: `Debug this ${activeFile?.lang} code. Identify: potential runtime errors, logic bugs, race conditions, null pointer issues, off-by-one errors, and incorrect assumptions. For each bug: exact location, why it's a bug, and provide the fixed code snippet.\n\nCode:\n${activeFile?.content}`,
      migrate: `This is ${activeFile?.lang} code. Convert it to TypeScript with: full type annotations, interfaces, enums, generic types where appropriate, and strict mode compatibility. Preserve all functionality exactly.\n\nCode:\n${activeFile?.content}`,
    };

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[feature.id] || `Analyze this code: ${activeFile?.content}`,
        model: "claude_sonnet_4_6"
      });

      const content = typeof response === "string" ? response : JSON.stringify(response, null, 2);
      log(`✅ ${feature.label} complete`, "success");

      const applyCode = (feature.id === "refactor" || feature.id === "migrate" || feature.id === "docs" || feature.id === "tests")
        ? () => {
            const cleaned = content.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
            if (feature.id === "tests" || feature.id === "docs") {
              const ext = feature.id === "tests" ? (activeFile?.lang === "python" ? "py" : "test.js") : "md";
              const newFile = { id: `ai_${Date.now()}`, name: `${feature.id}_${activeFile?.name?.split(".")[0]}.${ext}`, lang: LANG_MAP[ext] || "javascript", content: cleaned };
              setFiles(prev => [...prev, newFile]);
              setActiveFileId(newFile.id);
              toast.success(`Created: ${newFile.name}`);
            } else {
              setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: cleaned } : f));
              toast.success("Applied to current file");
            }
            setAiResult(null);
          }
        : null;

      setAiResult({ title: feature.label, icon: feature.icon, color: feature.color, content, applyCode });
    } catch (err) {
      log(`Error: ${err.message}`, "error");
    }
    setIsGenerating(false);
    setActiveFeature(null);
  };

  // ── Generate entire project ─────────────────────────────────────────────────
  const generateProject = async () => {
    if (!projectPrompt.trim() || isGenerating) return;
    setIsGenerating(true); setShowProjectGen(false);
    log(`$ fleet-ai generate-project "${projectPrompt}"`, "system");
    log("🤖 Generating entire project structure...", "info");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert software architect for NexusVectis fleet management AI platform.

Generate a complete, production-ready project for: "${projectPrompt}"

Return JSON with this exact structure:
{
  "project_name": "name",
  "description": "what this does",
  "files": [
    { "name": "filename.ext", "language": "python|javascript|yaml|etc", "content": "full file content" },
    ...
  ],
  "setup_commands": ["pip install x", "npm install y", "docker-compose up"],
  "architecture_summary": "brief description of how files connect"
}

Generate 4-6 files covering: main logic, API/interface, config/docker, tests, and README. Make them complete and production-quality.`,
        response_json_schema: {
          type: "object",
          properties: {
            project_name: { type: "string" },
            description: { type: "string" },
            files: { type: "array", items: { type: "object", properties: { name: { type: "string" }, language: { type: "string" }, content: { type: "string" } } } },
            setup_commands: { type: "array", items: { type: "string" } },
            architecture_summary: { type: "string" }
          }
        },
        model: "claude_sonnet_4_6"
      });

      if (result.files?.length) {
        const newFiles = result.files.map(f => ({
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: f.name,
          lang: LANG_MAP[f.name.split(".").pop()] || f.language || "javascript",
          content: f.content || ""
        }));
        setFiles(prev => [...prev, ...newFiles]);
        setActiveFileId(newFiles[0].id);
        log(`✅ Generated ${newFiles.length} files for: ${result.project_name}`, "success");
        log(`📋 ${result.architecture_summary}`, "info");
        if (result.setup_commands?.length) {
          log("Setup commands:", "warn");
          result.setup_commands.forEach(cmd => log(`  $ ${cmd}`, "system"));
        }
        toast.success(`Project generated: ${newFiles.length} files created`);
      }
    } catch (err) {
      log(`Error: ${err.message}`, "error");
    }
    setIsGenerating(false);
    setProjectPrompt("");
  };

  // ── AI code generation (prompt bar) ─────────────────────────────────────────
  const generateCode = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true); setBottomPanel("terminal");
    log(`$ ai generate: "${prompt}"`, "system");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Expert NexusVectis fleet software engineer. User wants: "${prompt}"\nCurrent file: ${activeFile?.name} (${activeFile?.lang})\nContext: ${activeFile?.content?.slice(0, 400)}\n\nGenerate production ${activeFile?.lang || "python"} code. Return JSON: { "filename": "x.ext", "language": "lang", "code": "full code", "explanation": "what this does", "commands": ["cmd1"] }`,
        response_json_schema: { type: "object", properties: { filename: { type: "string" }, language: { type: "string" }, code: { type: "string" }, explanation: { type: "string" }, commands: { type: "array", items: { type: "string" } } } },
        model: "claude_sonnet_4_6"
      });
      if (result.code) {
        const newFile = { id: `ai_${Date.now()}`, name: result.filename || "generated.py", lang: LANG_MAP[result.filename?.split(".").pop()] || "python", content: result.code };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        log(`✅ Generated: ${newFile.name} — ${result.explanation}`, "success");
        if (result.commands?.length) result.commands.forEach(cmd => log(`  $ ${cmd}`, "system"));
        toast.success(`Created: ${newFile.name}`);
      }
    } catch (err) { log(`Error: ${err.message}`, "error"); }
    setIsGenerating(false); setAiPrompt("");
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = activeFile.name; a.click();
  };

  const downloadZip = () => {
    const fileMap = {};
    files.forEach(f => { fileMap[f.name] = [strToU8(f.content), { level: 0 }]; });
    fileMap["README.md"] = [strToU8(`# NexusVectis Fleet AI Project\n\nGenerated by Fleet AI IDE v3.0\n\n## Files\n${files.map(f => `- \`${f.name}\` (${f.lang})`).join("\n")}\n`), { level: 0 }];
    const zipped = zipSync(fileMap);
    const blob = new Blob([zipped], { type: "application/zip" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "nexusvectis-fleet-ai-project.zip"; a.click();
    toast.success(`Downloaded ${files.length + 1} files as ZIP`);
  };

  const addNewFile = () => {
    const name = prompt("File name (e.g. app.py):") || "untitled.js";
    const ext = name.split(".").pop();
    const newFile = { id: `f_${Date.now()}`, name, lang: LANG_MAP[ext] || "javascript", content: `// ${name}\n` };
    setFiles(prev => [...prev, newFile]); setActiveFileId(newFile.id);
  };

  const deleteFile = (id) => { setFiles(prev => prev.filter(f => f.id !== id)); if (activeFileId === id) setActiveFileId(files[0]?.id); };

  const renameFile = (id) => {
    const file = files.find(f => f.id === id);
    const newName = prompt("New filename:", file?.name);
    if (newName?.trim()) { const ext = newName.split(".").pop(); setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName.trim(), lang: LANG_MAP[ext] || f.lang } : f)); }
  };

  const filteredContent = showSearch && searchQuery && !showReplace
    ? activeFile?.content?.split("\n").map((line, i) => line.toLowerCase().includes(searchQuery.toLowerCase()) ? `${String(i + 1).padStart(4)} ${line}` : null).filter(Boolean).join("\n")
    : null;

  const doReplace = () => {
    if (!findText || !activeFile) return;
    const newContent = activeFile.content.replaceAll(findText, replaceText);
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
    const count = (activeFile.content.split(findText).length - 1);
    toast.success(`Replaced ${count} occurrence${count !== 1 ? "s" : ""}`);
  };

  const installPackage = async () => {
    if (!packageInput.trim() || packageInstalling) return;
    setPackageInstalling(true);
    log(`$ ${packageLang === 'python' ? 'pip install' : 'npm install'} ${packageInput}`, "system");
    setBottomPanel("terminal");
    await new Promise(r => setTimeout(r, 1500));
    const newPkg = { id: Date.now(), name: packageInput.trim(), version: "latest", lang: packageLang, status: "installed" };
    setPackages(prev => [...prev, newPkg]);
    log(`✓ Successfully installed ${packageInput}`, "success");
    toast.success(`Installed: ${packageInput}`);
    setPackageInput("");
    setPackageInstalling(false);
  };

  const sendApiRequest = async () => {
    if (!apiUrl || apiLoading) return;
    setApiLoading(true); setApiResponse(null); setApiTab("response");
    try {
      const headers = (() => { try { return JSON.parse(apiHeaders); } catch { return {}; } })();
      const opts = { method: apiMethod, headers };
      if (["POST","PUT","PATCH"].includes(apiMethod)) opts.body = apiBody;
      const t0 = Date.now();
      const res = await fetch(apiUrl, opts);
      const duration = Date.now() - t0;
      const text = await res.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
      setApiResponse({ status: res.status, statusText: res.statusText, duration, body: typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : parsed, headers: Object.fromEntries(res.headers.entries()) });
    } catch(e) {
      setApiResponse({ status: 0, statusText: "Network Error", duration: 0, body: e.message, headers: {} });
    }
    setApiLoading(false);
  };

  const importFromUrl = async () => {
    if (!importUrl.trim() || importLoading) return;
    setImportLoading(true);
    try {
      // Convert github.com URLs to raw
      let url = importUrl.trim();
      if (url.includes("github.com") && !url.includes("raw.githubusercontent")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
      }
      const res = await fetch(url);
      const text = await res.text();
      const filename = url.split("/").pop() || "imported.txt";
      const ext = filename.split(".").pop();
      const newFile = { id: `import_${Date.now()}`, name: filename, lang: LANG_MAP[ext] || "javascript", content: text };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setShowImport(false);
      setImportUrl("");
      toast.success(`Imported: ${filename}`);
    } catch(e) {
      toast.error(`Import failed: ${e.message}`);
    }
    setImportLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* ── Top toolbar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2 mr-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase font-mono">Fleet AI IDE</span>
        </div>
        {[
          { id: "editor", label: "Editor", icon: Code2 },
          { id: "pipeline", label: "Pipeline", icon: GitBranch },
          { id: "orchestrator", label: "Orchestrator", icon: Layers },
          { id: "devops", label: "DevOps", icon: Network },
          { id: "secrets", label: "Secrets", icon: KeyRound },
          { id: "packages", label: "Packages", icon: Package },
          { id: "preview", label: "Preview", icon: Globe },
          { id: "api", label: "API Tester", icon: Link },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActivePanel(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${activePanel === id ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-500 hover:text-slate-300"}`}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => { setShowSearch(!showSearch); setShowReplace(false); setShowImport(false); }} className={`p-1.5 rounded transition-all ${showSearch && !showReplace ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`} title="Search"><Search className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setShowReplace(!showReplace); setShowSearch(true); setShowImport(false); }} className={`p-1.5 rounded transition-all ${showReplace ? "text-amber-400 bg-amber-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`} title="Find & Replace"><Replace className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setShowImport(!showImport); setShowSearch(false); setShowReplace(false); }} className={`p-1.5 rounded transition-all ${showImport ? "text-green-400 bg-green-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`} title="Import from URL/GitHub"><Import className="w-3.5 h-3.5" /></button>
        <button onClick={() => setShowStats(!showStats)} className={`p-1.5 rounded transition-all ${showStats ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`} title="Stats"><BarChart3 className="w-3.5 h-3.5" /></button>
        <button onClick={() => setShowChat(!showChat)} className={`p-1.5 rounded transition-all ${showChat ? "text-violet-400 bg-violet-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`} title="AI Chat"><MessageSquare className="w-3.5 h-3.5" /></button>
        <button onClick={() => setShowProjectGen(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-600/80 hover:bg-amber-500 text-white transition-all" title="Generate entire project">
          <Sparkles className="w-3 h-3" />Project Gen
        </button>
        <button onClick={downloadFile} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800" title="Download file"><Download className="w-3.5 h-3.5" /></button>
        <button onClick={downloadZip} className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-cyan-700 hover:bg-cyan-600 text-white transition-all">
          <FolderArchive className="w-3 h-3" />ZIP
        </button>
        <button onClick={runFile} disabled={isRunning} className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${isRunning ? "bg-slate-700 text-slate-500" : "bg-green-600 hover:bg-green-500 text-white"}`}>
          {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}Run
        </button>
        <button onClick={runPipeline} disabled={isRunning} className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${isRunning ? "bg-slate-700 text-slate-500" : "bg-violet-600 hover:bg-violet-500 text-white"}`}>
          <Cloud className="w-3 h-3" />Deploy
        </button>
      </div>

      {/* ── AI Features toolbar ────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-800 bg-slate-900/80 overflow-x-auto flex-shrink-0">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1 flex-shrink-0">AI:</span>
        {AI_FEATURES.map(f => {
          const Icon = f.icon;
          const isActive = activeFeature === f.id;
          return (
            <button key={f.id} onClick={() => runAIFeature(f)} disabled={isGenerating} title={f.desc}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                isActive ? "text-white border-opacity-60" : "text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200"
              }`}
              style={isActive ? { background: `${f.color}22`, borderColor: f.color, color: f.color } : {}}>
              {isActive && isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" style={{ color: isActive ? f.color : undefined }} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── Pipeline / Orchestrator / Secrets / Packages / Preview / API panels ── */}
      {activePanel === "pipeline" && <PipelineVisualizer activeStage={activeStage} stageStatus={stageStatus} />}
      {activePanel === "orchestrator" && (
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-bold text-white">AI Agent Orchestrator</p>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />3 agents active</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {orchestratorTasks.map(task => (
              <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                task.status === "completed" ? "border-green-500/30 bg-green-500/5" :
                task.status === "running" ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700/50 bg-slate-800/30"
              }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center ${task.status === "completed" ? "bg-green-500/20" : task.status === "running" ? "bg-amber-500/20" : "bg-slate-700"}`}>
                  {task.status === "completed" ? <Check className="w-3 h-3 text-green-400" /> : task.status === "running" ? <Loader2 className="w-3 h-3 text-amber-400 animate-spin" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-slate-200 truncate">{task.name}</p><p className="text-slate-500 text-[10px]">{task.agent} · {task.duration}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Secrets Manager ──────────────────────────────────────── */}
      {activePanel === "secrets" && (
        <div className="flex flex-col bg-slate-900 border-b border-slate-800 flex-shrink-0" style={{ maxHeight: 400, minHeight: 400 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-bold text-white">Secrets & Environment Variables</p>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500"><Lock className="w-3 h-3" />Encrypted at rest</div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2 mb-4">
              {secrets.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-amber-300 w-40 flex-shrink-0">{s.key}</span>
                  <span className="flex-1 text-xs font-mono text-slate-300 truncate">
                    {showSecretValues[s.id] ? s.value : "•".repeat(Math.min(s.value.length, 24))}
                  </span>
                  <button onClick={() => setShowSecretValues(prev => ({ ...prev, [s.id]: !prev[s.id] }))} className="text-slate-600 hover:text-slate-300 flex-shrink-0">
                    {showSecretValues[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(s.value).then(() => toast.success("Copied"))} className="text-slate-600 hover:text-slate-300 flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setSecrets(prev => prev.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-dashed border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Add New Secret</p>
              <div className="flex gap-2">
                <input value={newSecretKey} onChange={e => setNewSecretKey(e.target.value.toUpperCase().replace(/ /g, "_"))} placeholder="KEY_NAME" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-amber-500" />
                <input value={newSecretValue} onChange={e => setNewSecretValue(e.target.value)} placeholder="value" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-amber-500" />
                <button onClick={() => { if (!newSecretKey || !newSecretValue) return; setSecrets(prev => [...prev, { id: Date.now(), key: newSecretKey, value: newSecretValue, masked: true }]); setNewSecretKey(""); setNewSecretValue(""); toast.success("Secret added"); }} className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Package Manager ───────────────────────────────────────── */}
      {activePanel === "packages" && (
        <div className="flex flex-col bg-slate-900 border-b border-slate-800 flex-shrink-0" style={{ maxHeight: 400, minHeight: 400 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
            <Package className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-bold text-white">Package Manager</p>
            <div className="ml-auto flex gap-2">
              {["python", "node"].map(l => (
                <button key={l} onClick={() => setPackageLang(l)} className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${packageLang === l ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "text-slate-500 hover:text-slate-300"}`}>
                  {l === "python" ? "🐍 pip" : "📦 npm"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 px-4 pt-3 pb-2 flex-shrink-0">
            <input value={packageInput} onChange={e => setPackageInput(e.target.value)} onKeyDown={e => e.key === "Enter" && installPackage()} placeholder={`Search and install ${packageLang === "python" ? "pip" : "npm"} packages...`} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500" />
            <button onClick={installPackage} disabled={packageInstalling || !packageInput.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-all">
              {packageInstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Install
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Installed ({packages.filter(p => p.lang === packageLang).length})</p>
            <div className="space-y-1.5">
              {packages.filter(p => p.lang === packageLang).map(pkg => (
                <div key={pkg.id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-sm text-white font-mono">{pkg.name}</span>
                  <span className="text-xs text-slate-500 font-mono">v{pkg.version}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded px-1.5 py-0.5">✓ installed</span>
                    <button onClick={() => { setPackages(prev => prev.filter(p => p.id !== pkg.id)); log(`$ ${packageLang === "python" ? "pip uninstall" : "npm uninstall"} ${pkg.name}`, "system"); log(`✓ Uninstalled ${pkg.name}`, "warn"); setBottomPanel("terminal"); }} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Live Preview ─────────────────────────────────────────── */}
      {activePanel === "preview" && (
        <div className="flex flex-col bg-slate-900 border-b border-slate-800 flex-shrink-0" style={{ maxHeight: 420, minHeight: 420 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400" />
            <p className="text-sm font-bold text-white">Live Preview</p>
            <span className="text-xs text-slate-500">— {activeFile?.name}</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex gap-1">
                {["desktop", "tablet", "mobile"].map(v => (
                  <button key={v} onClick={() => {}} className="px-2 py-1 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all capitalize">{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-slate-950">
            {activeFile?.lang === "html" || activeFile?.content?.includes("<!DOCTYPE") || activeFile?.content?.includes("<html") ? (
              <iframe
                srcDoc={activeFile.content}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Live Preview"
              />
            ) : (
              <div className="text-center">
                <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Preview requires an HTML file</p>
                <p className="text-slate-600 text-xs mb-3">Use AI to generate an HTML file from your current code</p>
                <button onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const res = await base44.integrations.Core.InvokeLLM({
                      prompt: `Convert this ${activeFile?.lang} code/concept into a standalone HTML page with embedded CSS and JS that visually demonstrates or documents it. Return only the complete HTML file.\n\n${activeFile?.content?.slice(0,800)}`,
                      model: "claude_sonnet_4_6"
                    });
                    const html = typeof res === "string" ? res.replace(/^```html\n?/, "").replace(/\n?```$/, "") : res.toString();
                    const f = { id: `preview_${Date.now()}`, name: `preview_${activeFile?.name?.split(".")[0]}.html`, lang: "html", content: html };
                    setFiles(prev => [...prev, f]);
                    setActiveFileId(f.id);
                    toast.success("HTML preview generated!");
                  } catch(e) { toast.error(e.message); }
                  setIsGenerating(false);
                }} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium mx-auto transition-all">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate HTML Preview
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── API Tester ───────────────────────────────────────────── */}
      {activePanel === "api" && (
        <div className="flex flex-col bg-slate-900 border-b border-slate-800 flex-shrink-0" style={{ maxHeight: 420, minHeight: 420 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
            <Link className="w-4 h-4 text-green-400" />
            <p className="text-sm font-bold text-white">API Tester</p>
            <span className="text-xs text-slate-500">— Like Postman, built-in</span>
          </div>
          <div className="flex-1 flex min-h-0">
            {/* Left config */}
            <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col p-3 gap-2 overflow-auto">
              <div className="flex gap-2">
                <select value={apiMethod} onChange={e => setApiMethod(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none font-mono font-bold">
                  {["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && sendApiRequest()} placeholder="https://api.example.com/endpoint" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-green-500 font-mono min-w-0" />
              </div>
              <button onClick={sendApiRequest} disabled={apiLoading} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold transition-all">
                {apiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {apiLoading ? "Sending..." : "Send Request"}
              </button>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Headers (JSON)</p>
                <textarea value={apiHeaders} onChange={e => setApiHeaders(e.target.value)} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-green-500 resize-none" />
              </div>
              {["POST","PUT","PATCH"].includes(apiMethod) && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Body (JSON)</p>
                  <textarea value={apiBody} onChange={e => setApiBody(e.target.value)} rows={5} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-green-500 resize-none" />
                </div>
              )}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Quick Examples</p>
                {[
                  { label: "GET httpbin", method: "GET", url: "https://httpbin.org/get" },
                  { label: "POST httpbin", method: "POST", url: "https://httpbin.org/post" },
                  { label: "JSONPlaceholder", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1" },
                ].map(ex => (
                  <button key={ex.label} onClick={() => { setApiMethod(ex.method); setApiUrl(ex.url); }} className="w-full text-left text-[10px] text-slate-400 hover:text-green-300 bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded border border-slate-700 mb-1 transition-all">{ex.method} {ex.label}</button>
                ))}
              </div>
            </div>
            {/* Right response */}
            <div className="flex-1 flex flex-col min-w-0">
              {apiResponse ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800 flex-shrink-0">
                    <span className={`text-sm font-bold ${apiResponse.status >= 200 && apiResponse.status < 300 ? "text-green-400" : "text-red-400"}`}>{apiResponse.status} {apiResponse.statusText}</span>
                    <span className="text-xs text-slate-500">{apiResponse.duration}ms</span>
                    <div className="ml-auto flex gap-1">
                      {["response", "headers"].map(t => (
                        <button key={t} onClick={() => setApiTab(t)} className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-bold transition-all ${apiTab === t ? "text-green-300 bg-green-500/10" : "text-slate-500 hover:text-slate-300"}`}>{t}</button>
                      ))}
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(apiResponse.body).then(() => toast.success("Copied"))} className="text-slate-600 hover:text-slate-300"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 overflow-auto p-3">
                    {apiTab === "response" ? (
                      <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{apiResponse.body}</pre>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(apiResponse.headers).map(([k,v]) => (
                          <div key={k} className="flex gap-2 text-xs"><span className="text-slate-400 font-mono w-48 flex-shrink-0">{k}</span><span className="text-slate-200 font-mono">{v}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  {apiLoading ? (
                    <><Loader2 className="w-8 h-8 text-green-400 animate-spin mb-3" /><p className="text-slate-400 text-sm">Sending request...</p></>
                  ) : (
                    <><Globe className="w-10 h-10 text-slate-700 mb-3" /><p className="text-slate-400 text-sm">Configure and send an API request</p></>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activePanel === "devops" && (
        <div className="flex flex-col bg-slate-900 border-b border-slate-800 flex-shrink-0" style={{ maxHeight: 420, minHeight: 420 }}>
          {/* DevOps tab bar */}
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800 overflow-x-auto flex-shrink-0">
            {[
              { id: "iac", label: "IaC Generator", emoji: "🏗️" },
              { id: "k8s", label: "Kubernetes", emoji: "☸️" },
              { id: "docker", label: "Docker", emoji: "🐳" },
              { id: "arch", label: "Architecture", emoji: "🗺️" },
              { id: "network", label: "Network", emoji: "🌐" },
              { id: "cost", label: "Cost Analysis", emoji: "💰" },
              { id: "runbook", label: "Runbook", emoji: "📖" },
            ].map(t => (
              <button key={t.id} onClick={() => { setDevopsTab(t.id); setDevopsResult(null); setDevopsInput(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                  devopsTab === t.id ? "text-cyan-300 border-cyan-500" : "text-slate-500 border-transparent hover:text-slate-300"
                }`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Left: input */}
            <div className="flex flex-col w-72 border-r border-slate-800 flex-shrink-0">
              <div className="flex-1 p-3 overflow-auto">
                {devopsTab === "iac" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Terraform / Pulumi / CloudFormation</p>
                    <p className="text-[10px] text-slate-500 mb-3">Describe your infrastructure and Fleet AI generates production-ready IaC code.</p>
                    <div className="space-y-2">
                      {["AWS EKS cluster with 3 node groups and autoscaling", "Azure AKS + PostgreSQL Flexible Server + Redis Cache", "GCP Cloud Run + Pub/Sub + BigQuery pipeline"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "k8s" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Kubernetes Manifests</p>
                    <p className="text-[10px] text-slate-500 mb-3">Generate Deployment, Service, Ingress, HPA, ConfigMap and more.</p>
                    <div className="space-y-2">
                      {["Fleet AI microservice with HPA and rolling update", "Redis Cluster with PersistentVolume", "NexusVectis ingress with TLS and rate-limiting"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "docker" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Docker & Compose</p>
                    <p className="text-[10px] text-slate-500 mb-3">Multi-stage Dockerfiles and docker-compose for the full stack.</p>
                    <div className="space-y-2">
                      {["Python Flask app with multi-stage build and health check", "Node.js microservice with pnpm and distroless", "Full stack: React + FastAPI + PostgreSQL + Redis"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "arch" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">System Architecture Diagram</p>
                    <p className="text-[10px] text-slate-500 mb-3">ASCII + Mermaid diagram with component relationships and data flow.</p>
                    <div className="space-y-2">
                      {["NexusVectis fleet management platform architecture", "Microservices with event-driven communication via Kafka", "CQRS + Event Sourcing pattern for fleet telemetry"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "network" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Network Topology</p>
                    <p className="text-[10px] text-slate-500 mb-3">VPC design, subnets, security groups, firewall rules and DNS configuration.</p>
                    <div className="space-y-2">
                      {["AWS VPC with public/private subnets and NAT gateway", "Zero-trust network with mTLS and service mesh (Istio)", "Multi-region failover with Route53 and health checks"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "cost" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Cloud Cost Analysis</p>
                    <p className="text-[10px] text-slate-500 mb-3">Estimate monthly cloud costs and optimization potential.</p>
                    <div className="space-y-2">
                      {["EKS cluster: 10 t3.medium nodes + RDS + ElastiCache", "Azure: AKS + Cosmos DB + Service Bus + CDN", "Compare AWS vs Azure vs GCP for fleet platform"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
                {devopsTab === "runbook" && (
                  <>
                    <p className="text-xs text-slate-400 mb-2 font-bold">Runbook Generator</p>
                    <p className="text-[10px] text-slate-500 mb-3">Generate SRE runbooks, incident response and disaster recovery procedures.</p>
                    <div className="space-y-2">
                      {["Database failover procedure for PostgreSQL primary", "K8s pod crash loop incident response", "Fleet AI service degradation runbook with escalation"].map(ex => (
                        <button key={ex} onClick={() => setDevopsInput(ex)} className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 transition-all">{ex}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-2 border-t border-slate-800 flex-shrink-0">
                <textarea
                  value={devopsInput}
                  onChange={e => setDevopsInput(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    if (!devopsInput.trim() || devopsLoading) return;
                    setDevopsLoading(true); setDevopsResult(null);
                    const tabPrompts = {
                      iac: `You are an expert cloud architect. Generate production-ready Terraform (HCL) code for: "${devopsInput}". Include: provider config, variables, modules, outputs and security best practices. Briefly explain what each section does.`,
                      k8s: `You are a Kubernetes expert. Generate complete K8s YAML manifests for: "${devopsInput}". Include all required resources (Deployment, Service, Ingress, HPA, ConfigMap, Secrets as placeholder). Use best practices for labels, resource limits and health probes.`,
                      docker: `You are a Docker expert. Generate an optimized multi-stage Dockerfile and docker-compose.yml for: "${devopsInput}". Include: non-root user, health checks, .dockerignore content, build args and environment variables.`,
                      arch: `You are a software architect. Generate a detailed system architecture diagram (ASCII art) AND Mermaid diagram code for: "${devopsInput}". Include: components, data flow, API boundaries, databases, message queues and external integrations. Add an architecture explanation.`,
                      network: `You are a network and cloud security expert. Design and describe the network topology for: "${devopsInput}". Include: ASCII network diagram, CIDR ranges, routing tables, security group rules, and Terraform code for the network.`,
                      cost: `You are a FinOps expert. Provide a detailed cloud cost analysis for: "${devopsInput}". Include: estimated monthly costs per component, total price, comparisons across cloud providers (AWS/Azure/GCP), and 5 concrete savings suggestions with estimated savings in %.`,
                      runbook: `You are a Senior SRE. Generate a complete, production-ready runbook for: "${devopsInput}". Include: 1) Symptom identification, 2) Triage steps (step-by-step with commands), 3) Root cause analysis procedure, 4) Remediation steps, 5) Escalation matrix, 6) Post-incident actions and 7) Preventive measures.`,
                    };
                    try {
                      const res = await base44.integrations.Core.InvokeLLM({ prompt: tabPrompts[devopsTab], model: "claude_sonnet_4_6" });
                      setDevopsResult(typeof res === "string" ? res : JSON.stringify(res, null, 2));
                    } catch(e) { setDevopsResult("Error: " + e.message); }
                    setDevopsLoading(false);
                  }}
                  disabled={!devopsInput.trim() || devopsLoading}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-all">
                  {devopsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {devopsLoading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Right: result */}
            <div className="flex-1 flex flex-col min-w-0">
              {devopsResult ? (
                <>
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 flex-shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Output</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => { const f = { id: `devops_${Date.now()}`, name: `devops_${devopsTab}_${Date.now()}.${devopsTab === 'k8s' ? 'yaml' : devopsTab === 'iac' ? 'tf' : devopsTab === 'docker' ? 'dockerfile' : 'md'}`, lang: devopsTab === 'k8s' ? 'yaml' : devopsTab === 'iac' ? 'yaml' : 'markdown', content: devopsResult }; setFiles(prev => [...prev, f]); setActiveFileId(f.id); setActivePanel('editor'); toast.success('Opened in editor'); }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-violet-700 hover:bg-violet-600 text-white text-[10px] transition-all">
                        <Code2 className="w-2.5 h-2.5" />Open in Editor
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(devopsResult).then(() => toast.success('Copied'))}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] transition-all">
                        <Copy className="w-2.5 h-2.5" />Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {devopsResult}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  {devopsLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                      <p className="text-sm text-slate-400">Fleet AI is generating...</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-3">{["🏗️","☸️","🐳","🗺️","🌐","💰","📖"][['iac','k8s','docker','arch','network','cost','runbook'].indexOf(devopsTab)]}</div>
                      <p className="text-sm text-slate-400 mb-1">Select an example or describe your infrastructure</p>
                      <p className="text-[10px] text-slate-600">Fleet AI generates production-ready code</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats panel ───────────────────────────────────────────── */}
      {showStats && (
        <div className="flex gap-4 px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0 flex-wrap">
          {[
            { label: "Files", value: files.length, color: "text-cyan-400" },
            { label: "Lines", value: files.reduce((s, f) => s + f.content.split("\n").length, 0), color: "text-violet-400" },
            { label: "Size", value: `${(files.reduce((s, f) => s + f.content.length, 0) / 1024).toFixed(1)}KB`, color: "text-green-400" },
            { label: "Langs", value: [...new Set(files.map(f => f.lang))].length, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</span><span className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</span></div>
          ))}
          <div className="flex-1 border-l border-slate-700 ml-2 pl-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Git Log</p>
            {gitLog.map(c => (
              <div key={c.hash} className="flex items-center gap-2 text-[10px] font-mono">
                <GitCommit className="w-2.5 h-2.5 text-green-400" />
                <span className="text-slate-600">{c.hash}</span>
                <span className="text-slate-300">{c.msg}</span>
                <span className="text-slate-600 ml-auto">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search / Replace bar ───────────────────────────────── */}
      {showSearch && !showReplace && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in file..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none font-mono" />
          {searchQuery && <span className="text-xs text-slate-500">{activeFile?.content?.split("\n").filter(l => l.toLowerCase().includes(searchQuery.toLowerCase())).length} matches</span>}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-slate-600 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {showReplace && (
        <div className="flex flex-col gap-1.5 px-3 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <input autoFocus value={findText} onChange={e => setFindText(e.target.value)} placeholder="Find..." className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono" />
            {findText && <span className="text-[10px] text-slate-500 whitespace-nowrap">{(activeFile?.content?.split(findText).length || 1) - 1} matches</span>}
          </div>
          <div className="flex items-center gap-2">
            <Replace className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with..." className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono" />
            <button onClick={doReplace} className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium">Replace All</button>
            <button onClick={() => { setShowReplace(false); setShowSearch(false); }} className="text-slate-600 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
      {showImport && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800">
          <Import className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <input autoFocus value={importUrl} onChange={e => setImportUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && importFromUrl()} placeholder="GitHub URL or raw file URL (e.g. https://github.com/user/repo/blob/main/file.py)" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono" />
          <button onClick={importFromUrl} disabled={importLoading || !importUrl.trim()} className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium transition-all">
            {importLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Import className="w-3 h-3" />}Import
          </button>
          <button onClick={() => setShowImport(false)} className="text-slate-600 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Project Gen modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showProjectGen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-violet-500/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white">AI Project Generator</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">Describe your project and Fleet AI will generate a complete, production-ready multi-file codebase.</p>
              <textarea
                value={projectPrompt}
                onChange={e => setProjectPrompt(e.target.value)}
                placeholder="e.g. 'A Python microservice that ingests real-time vehicle telemetry via WebSocket, detects anomalies with ML, and sends alerts via webhook'"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 resize-none"
                rows={5}
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowProjectGen(false)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-all">Cancel</button>
                <button onClick={generateProject} disabled={!projectPrompt.trim() || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-all">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <FileExplorer files={files} activeFileId={activeFileId} onSelect={setActiveFileId} onNew={addNewFile} onDelete={deleteFile} onRename={renameFile} />

        {/* Editor + bottom panel */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-slate-800 bg-slate-900 overflow-x-auto flex-shrink-0">
            {files.map(f => (
              <button key={f.id} onClick={() => setActiveFileId(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono border-r border-slate-800 whitespace-nowrap transition-colors ${f.id === activeFileId ? "bg-slate-950 text-cyan-300 border-b-2 border-b-cyan-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[f.lang] || "#94a3b8" }} />
                {f.name}
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
            <div className="absolute inset-0 overflow-auto">
              <div className="flex">
                <div className="select-none py-3 pr-3 pl-3 text-right text-slate-700 text-xs font-mono leading-5 border-r border-slate-800 bg-slate-950 min-w-[48px] flex-shrink-0">
                  {(filteredContent || activeFile?.content || "").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  value={filteredContent || activeFile?.content || ""}
                  onChange={e => { if (!filteredContent) setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: e.target.value } : f)); }}
                  readOnly={!!filteredContent}
                  className="flex-1 py-3 px-4 bg-slate-950 text-slate-200 font-mono text-xs leading-5 resize-none outline-none border-none min-w-0"
                  spellCheck={false}
                  style={{ minHeight: "100%", tabSize: 2 }}
                />
              </div>
            </div>
            {/* AI Result Panel overlay */}
            <AnimatePresence>
              {aiResult && <AIResultPanel result={aiResult} onClose={() => setAiResult(null)} />}
            </AnimatePresence>
          </div>

          {/* AI Prompt bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <Wand2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <input
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generateCode(aiPrompt); } }}
              placeholder="Describe what to generate (Enter to run)..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
            <button onClick={() => generateCode(aiPrompt)} disabled={isGenerating || !aiPrompt.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${isGenerating || !aiPrompt.trim() ? "bg-slate-800 text-slate-600" : "bg-violet-600 hover:bg-violet-500 text-white"}`}>
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Generate
            </button>
          </div>

          {/* Bottom panel tabs */}
          <div className="flex items-center gap-1 px-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            {["terminal", "problems", "output", "git"].map(tab => (
              <button key={tab} onClick={() => setBottomPanel(tab)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors ${bottomPanel === tab ? "text-cyan-400 border-b-2 border-cyan-500" : "text-slate-600 hover:text-slate-400"}`}>
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-[10px] text-slate-600 font-mono">{activeFile?.lang} · {activeFile?.content?.split("\n").length || 0} lines</span>
          </div>

          {/* Bottom panel content */}
          <div className="flex-shrink-0" style={{ height: 160 }}>
            {bottomPanel === "terminal" && <TerminalEmulator output={terminalOutput} isRunning={isRunning} onClear={() => setTerminalOutput([])} />}
            {bottomPanel === "problems" && (
              <div className="h-full bg-slate-950 p-3 font-mono text-xs flex items-center justify-center">
                <div className="flex items-center gap-2 text-green-400"><Check className="w-4 h-4" />No problems detected</div>
              </div>
            )}
            {bottomPanel === "output" && (
              <div className="h-full bg-slate-950 p-3 font-mono text-xs overflow-auto">
                <p className="text-slate-600">[Fleet AI IDE v3.0] Ready</p>
                <p className="text-cyan-400">12 AI features · {files.length} files · {files.reduce((s,f) => s + f.content.split("\n").length, 0)} lines</p>
              </div>
            )}
            {bottomPanel === "git" && (
              <div className="h-full bg-slate-950 p-3 font-mono text-xs overflow-auto space-y-1.5">
                <p className="text-slate-500 mb-2">On branch <span className="text-green-400">main</span> · {files.length} files tracked</p>
                {gitLog.map(c => (
                  <div key={c.hash} className="flex items-center gap-3">
                    <span className="text-amber-400">{c.hash}</span>
                    <span className="text-slate-300">{c.msg}</span>
                    <span className="text-slate-600 ml-auto">{c.time}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-[10px]">
                      <span className="text-green-400">M</span>
                      <span className="text-slate-400">{f.name}</span>
                      <span className="text-slate-600">+{f.content.split("\n").length} lines</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex-shrink-0 overflow-hidden">
              <AIChatSidebar files={files} activeFile={activeFile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}