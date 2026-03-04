import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, Send, Mic, Brain, Zap, TrendingUp, AlertTriangle, 
  Truck, Route, Package, Activity, X, LayoutDashboard, Paperclip, FileText,
  Settings, Warehouse, Satellite, Globe, BarChart3, Building2, Monitor, ChevronDown, Users,
  Lightbulb, Network, Shield, MessageSquare, Video, FileCode, CalculatorIcon, Search, GraduationCap
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Intellect sub-components
import HologramWindow from "@/components/intellect/HologramWindow";
import WindowContentRenderer from "@/components/intellect/WindowContentRenderer";
import { getWindowMeta } from "@/components/intellect/WindowRegistry";
import CircularBrainMenu from "@/components/intellect/CircularBrainMenu";
import IntellectHeader from "@/components/intellect/IntellectHeader";
import IntellectCommandBar from "@/components/intellect/IntellectCommandBar";
import FleetGlobe3D from "@/components/intellect/FleetGlobe3D";
import ThinkingTerminalVisual from "@/components/intellect/ThinkingTerminalVisual";
import CompanyAnalysisHologram from "@/components/intellect/CompanyAnalysisHologram";
import ProfileSearch from "@/components/intellect/ProfileSearch";
import CandidateMatcher from "@/components/intellect/CandidateMatcher";
import MultiScreenManager from "@/components/intellect/MultiScreenManager";
import { useAdvancedIntellect, AdvancedCommandPanel, InsightRenderer } from "@/components/intellect/AdvancedIntellectEngine";
import { 
  PredictiveMaintenanceAnalysis, DemandForecastAnalysis, 
  RiskAssessmentAnalysis, PerformanceAnalyticsPanel 
} from "@/components/intellect/AdvancedAIAnalysis";
import { AdvancedIntelligenceEngine } from "@/components/intellect/AdvancedIntelligenceEngine";
import ScenarioPredictionEngine from "@/components/intellect/ScenarioPredictionEngine";
import MistralStreamingEngine from "@/components/intellect/MistralStreamingEngine";
import IntelligentCommandAgent, { CommandInput, CommandExecution } from "@/components/intellect/IntelligentCommandAgent";
import VideoCallHologram from "@/components/intellect/VideoCallHologram";
import ParallelTaskProcessor from "@/components/intellect/ParallelTaskProcessor";
import ProcessThinkingTerminal from "@/components/intellect/ProcessThinkingTerminal";
import AICoach from "@/components/intellect/AICoach";

const INITIAL_MESSAGES = [
  { role: "system", content: "⚡ FLEET AI online. World's most advanced logistics intelligence system ready. I can: perform predictive maintenance analysis, forecast demand, optimize routes multi-modally, generate CO2 reports, detect anomalies, assess risks, benchmark performance, and execute any fleet operation. Command me." }
];

export default function IntellectMode() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('intellect_mode_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch { return INITIAL_MESSAGES; }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWindows, setActiveWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [show3DVisualization, setShow3DVisualization] = useState(null);
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [companyAnalysisTarget, setCompanyAnalysisTarget] = useState(null);
  const [showProfileSearch, setShowProfileSearch] = useState(false);
  const [showCandidateMatcher, setShowCandidateMatcher] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState([]);
  const [showThinkingTerminal, setShowThinkingTerminal] = useState(false);
  const [processTerminals, setProcessTerminals] = useState([]);
  const [minimizedProcesses, setMinimizedProcesses] = useState(new Set());
  const [screens, setScreens] = useState([]);
  const [showMultiScreenManager, setShowMultiScreenManager] = useState(false);
  const [multiScreenDismissed, setMultiScreenDismissed] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [openDesktopWindows, setOpenDesktopWindows] = useState([]);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [multiModelAnalysis, setMultiModelAnalysis] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [commandExecution, setCommandExecution] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showParallelProcessor, setShowParallelProcessor] = useState(false);
  const [focusedWindow, setFocusedWindow] = useState(null);
  const [parallelProcessorTasks, setParallelProcessorTasks] = useState([]);
  const [isCircularMenuOpen, setIsCircularMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pendingPromptRef = useRef(null);

  const { executeCommand: advancedExecute, loading: advancedLoading, results: advancedResults, error: advancedError } = useAdvancedIntellect();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: orgUser } = useQuery({
    queryKey: ['org-user-intellect'],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: currentUser.email });
      return users?.[0] || null;
    },
    enabled: !!currentUser,
    staleTime: 60000
  });

  const orgId = orgUser?.organization_id;

  const makeOrgQuery = (entity, extra = {}) => ({
    queryFn: async () => {
      if (!orgId) return [];
      return base44.entities[entity].filter({ organization_id: orgId }, ...Object.values(extra));
    },
    enabled: !!orgId,
    refetchInterval: 15000,
    staleTime: 5000
  });

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles-intellect', orgId], ...makeOrgQuery('Vehicle'), refetchInterval: 10000 });
  const { data: alerts = [] } = useQuery({ queryKey: ['alerts-intellect', orgId], ...makeOrgQuery('Alert') });
  const { data: routes = [] } = useQuery({ queryKey: ['routes-intellect', orgId], ...makeOrgQuery('Route') });
  const { data: shipments = [] } = useQuery({ queryKey: ['shipments-intellect', orgId], ...makeOrgQuery('Shipment') });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-intellect', orgId],
    queryFn: () => base44.entities.Customer.filter({ organization_id: orgId }),
    enabled: !!orgId, staleTime: 30000
  });

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingMessage]);

  useEffect(() => {
    if (pendingPromptRef.current && input === pendingPromptRef.current && !isProcessing) {
      pendingPromptRef.current = null;
      processCommand();
    }
  }, [input]);

  // ── Window Management ──────────────────────────────────────────────────────
  const openWindow = useCallback((type, position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }, data = null) => {
    if (!type.startsWith('chart_') && type !== 'document_editor' && type !== 'spreadsheet_editor' && activeWindows.find(w => w.type === type)) {
      toast.info(`${type} window already open`);
      return;
    }
    setActiveWindows(prev => [...prev, { type, id: Date.now(), position, data }]);
  }, [activeWindows]);

  const closeWindow = useCallback((id) => {
    setActiveWindows(prev => prev.filter(w => w.id !== id));
    setMinimizedWindows(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const toggleMinimize = useCallback((id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Screen Management ──────────────────────────────────────────────────────
  const trackDesktopWindow = useCallback((screenLabel, winRef) => {
    const id = Date.now();
    setOpenDesktopWindows(prev => [...prev, { id, label: screenLabel, ref: winRef }]);
    const poll = setInterval(() => {
      if (winRef.closed) { clearInterval(poll); setOpenDesktopWindows(prev => prev.filter(w => w.id !== id)); }
    }, 1000);
  }, []);

  const sendWindowToScreen = useCallback((screenInfo, windowType) => {
    if (!screenInfo.ref || screenInfo.ref.closed) { toast.error('That screen window is closed'); return; }
    screenInfo.ref.postMessage({ type: 'ADD_WIDGET', windowType }, '*');
    toast.success(`Sent ${windowType} widget to ${screenInfo.label}`);
  }, []);

  // ── Quick Actions ──────────────────────────────────────────────────────────
  const handleQuickAction = useCallback((action) => {
    const actionMap = {
      predictiveAnalysis: () => openWindow('predictive_maintenance', { x: 100, y: 100 }),
      demandAnalysis: () => openWindow('demand_forecast', { x: 150, y: 150 }),
      riskAssessment: () => openWindow('risk_assessment', { x: 200, y: 200 }),
      performanceAnalytics: () => openWindow('performance_analytics', { x: 250, y: 250 }),
      show3DFleet: () => setShow3DVisualization({ vehicles, routes }),
      openCompanyAnalysis: () => setShowCompanyAnalysis(true),
      openSwarmIntelligence: () => { openWindow('swarm_intelligence', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "🐜 Swarm Intelligence activated" }]); },
      openNeuroRisk: () => { openWindow('neuro_risk', { x: 140, y: 100 }); setMessages(prev => [...prev, { role: "system", content: "🧠 Neuro-Symbolic Risk Fusion activated" }]); },
      openDigitalTwin: () => { openWindow('digital_twin', { x: 160, y: 120 }); setMessages(prev => [...prev, { role: "system", content: "🌐 Digital Twin Federation activated" }]); },
      openNexusChat: () => { openWindow('nexus_chat', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "🛰️ Nexus Satellite Chat opened" }]); },
      openDocEditor: () => { openWindow('document_editor', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "📄 Document Editor opened" }]); },
      openSpreadsheet: () => { openWindow('spreadsheet_editor', { x: 140, y: 100 }); setMessages(prev => [...prev, { role: "system", content: "📊 Spreadsheet Editor opened" }]); },
      openSatelliteWeather: () => { openWindow('satellite_weather', { x: 100, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "🛰️ Satellite & Weather Intelligence activated" }]); },
      openNewsIntelligence: () => { openWindow('news_intelligence', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "📰 News Intelligence activated — fetching live logistics news" }]); },
      openImageGenerator: () => { openWindow('image_generator', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "🎨 AI Image Generator opened" }]); },
      openProjectManagement: () => { openWindow('project_management', { x: 120, y: 80 }); setMessages(prev => [...prev, { role: "system", content: "📋 Project Management AI opened — generate tasks, summaries and risk registers" }]); },
    };
    actionMap[action]?.();
  }, [openWindow, vehicles, routes, setMessages]);

  const executePrompt = useCallback((prompt) => {
    pendingPromptRef.current = prompt;
    setInput(prompt);
  }, []);

  // ── File Upload ────────────────────────────────────────────────────────────
  const detectFleetFileType = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'fleetslide') return 'hologram_presentation';
    if (ext === 'fleetdoc') return 'document_editor';
    if (ext === 'fleetsheet') return 'spreadsheet_editor';
    return null;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const newFiles = await Promise.all(files.map(async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = response?.data?.file_url || response?.file_url;
      if (!fileUrl) throw new Error('Upload failed - no file URL returned');
      return { name: file.name, url: fileUrl, type: file.type };
    }));
    // Split: Fleet-native files open directly, others go to AI upload queue
    const nativeFiles = newFiles.filter(f => detectFleetFileType(f.name));
    const regularFiles = newFiles.filter(f => !detectFleetFileType(f.name));

    nativeFiles.forEach(f => {
      const windowType = detectFleetFileType(f.name);
      openWindow(windowType, { x: 100 + Math.random() * 150, y: 80 }, { initialFileUrl: f.url, initialTitle: f.name });
      setMessages(prev => [...prev, { role: "system", content: `📂 Opened **${f.name}** in ${windowType === 'hologram_presentation' ? 'FleetSlide' : windowType === 'document_editor' ? 'FleetDocs' : 'FleetSheet'}` }]);
    });

    if (regularFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...regularFiles]);
    }

    toast.success(`✅ Uploaded ${files.length} file(s)`);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  // ── Thinking Logs ──────────────────────────────────────────────────────────
  const addThinkingLog = (type, message, details = null, duration = null, percentage = null, processId = null) => {
    const entry = { type, message, details, duration, percentage, timestamp: Date.now() };
    if (processId) {
      setProcessTerminals(prev => prev.map(p => p.id === processId ? { ...p, logs: [...(p.logs || []), entry] } : p));
    } else {
      setThinkingLogs(prev => [...prev, entry]);
    }
  };

  const createProcessTerminal = (commandName) => {
    const processId = `process_${Date.now()}`;
    setProcessTerminals(prev => [...prev, { id: processId, name: commandName, logs: [], startTime: Date.now() }]);
    return processId;
  };

  const closeProcessTerminal = (processId) => {
    setProcessTerminals(prev => prev.filter(p => p.id !== processId));
    setMinimizedProcesses(prev => { const next = new Set(prev); next.delete(processId); return next; });
  };

  const toggleProcessMinimize = (processId) => {
    setMinimizedProcesses(prev => {
      const next = new Set(prev);
      next.has(processId) ? next.delete(processId) : next.add(processId);
      return next;
    });
  };

  // ── Advanced Processing ────────────────────────────────────────────────────
  const processAdvancedCommand = async (command) => {
    const fleetData = { vehicles, alerts, routes, shipments };
    try {
      const parsed = IntelligentCommandAgent.parseCommand(command);
      const generatedScenarios = ScenarioPredictionEngine.generateScenarios(fleetData, parsed);
      setScenarios(ScenarioPredictionEngine.scoreScenarios(generatedScenarios, vehicles));
    } catch {}
    try {
      setIsStreaming(true);
      const analysis = await MistralStreamingEngine.multiModelAnalysis(fleetData);
      setMultiModelAnalysis(analysis);
      setIsStreaming(false);
      setSuggestions(IntelligentCommandAgent.suggestActions(fleetData, analysis));
    } catch { setIsStreaming(false); }
    try {
      const execution = await IntelligentCommandAgent.executeCommand(command, fleetData);
      setCommandExecution(execution);
    } catch {}
  };

  const executeParallelMicroAnalyses = async (mainPrompt, extraPayload = {}) => {
    const mainCall = base44.functions.invoke('mistralCommand', { command: mainPrompt, ...extraPayload }).catch(() => ({ data: { action: 'ANALYZE', parameters: {} } }));
    const microCalls = Array(49).fill(null).map((_, i) => {
      const p = [
        () => base44.integrations.Core.InvokeLLM({ prompt: `Vehicle efficiency gain?`, response_json_schema: { type: 'object', properties: { g: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Alert anomaly detection`, response_json_schema: { type: 'object', properties: { c: { type: 'string' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Route time optimization`, response_json_schema: { type: 'object', properties: { t: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Shipment ETA accuracy`, response_json_schema: { type: 'object', properties: { e: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Maintenance risk score`, response_json_schema: { type: 'object', properties: { r: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Cost saving potential`, response_json_schema: { type: 'object', properties: { s: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Safety score`, response_json_schema: { type: 'object', properties: { sc: { type: 'number' } } } }).catch(() => ({})),
        () => base44.integrations.Core.InvokeLLM({ prompt: `Demand forecast`, response_json_schema: { type: 'object', properties: { d: { type: 'number' } } } }).catch(() => ({})),
      ];
      return p[i % p.length]();
    });
    return Promise.all([mainCall, ...microCalls]);
  };

  // ── Deep Research ──────────────────────────────────────────────────────────
  const runDeepAnalysis = async (currentCommand) => {
    setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
    setInput("");
    const processId = createProcessTerminal(currentCommand.substring(0, 40) + '...');
    addThinkingLog('parse', `🔬 Deep research analysis initiated`, null, 0, null, processId);
    addThinkingLog('analyze', 'Gathering fleet telemetry & historical records', { vehicles: vehicles.length, routes: routes.length, shipments: shipments.length }, 200, 20, processId);
    addThinkingLog('think', 'Running multi-dimensional statistical models & predictive algorithms', null, 300, 40, processId);
    addThinkingLog('model', 'Initializing predictive engines and correlation matrices', null, 250, 55, processId);

    const fleetContext = `Fleet Statistics: ${vehicles.length} vehicles (${vehicles.filter(v => v.status === 'active').length} active), ${routes.length} routes, ${shipments.length} shipments, ${alerts.length} active alerts. Transport types: ${[...new Set(vehicles.map(v => v.type))].join(', ')}`;
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite fleet intelligence strategist & operations scientist. Generate COMPELLING, INSIGHTFUL analysis for: "${currentCommand}"

FLEET CONTEXT: ${fleetContext}

ANALYSIS MANDATE - Create engagement-focused, revealing insights that tell a compelling story:

1. NARRATIVE TITLE - Catchy, insightful title that reveals a key finding (e.g., "The Hidden Efficiency Gap" or "Route Paradox: Speed vs Sustainability")

2. STORYLINE SUMMARY - Write like a strategic briefing: start with the surprising finding, build tension, resolve with actionable intelligence. Include:
   - The unexpected pattern or opportunity you discovered
   - Why this matters for the business
   - The competitive advantage of acting now

3. VISUAL STORYTELLING - Create 16-22 compelling data points across:
   - Primary metric trends with hidden patterns
   - Comparative analysis (best vs worst performers)
   - Anomalies and breakpoints in data
   - Correlation insights that reveal causation
   - Multiple data series that tell conflicting stories (interesting tension)

4. EDGE CASE DISCOVERIES - Find and highlight:
   - Counterintuitive patterns (what defies conventional wisdom)
   - Hidden correlations (what variables secretly drive success)
   - Inflection points (where things change dramatically)
   - Outlier opportunities (exceptional performers to learn from)

5. PREDICTIVE THEATER - Make forecasts compelling:
   - What happens if nothing changes (cautionary projection)
   - What happens if you implement recommendations (optimistic scenario)
   - The tipping point where change accelerates
   - Confidence levels that reflect real uncertainty

6. RISK NARRATIVE - Present risks as strategic challenges:
   - What's the cascading impact of each risk?
   - Which risks are interconnected?
   - What's the compound effect if multiple risks materialize?

7. FINANCIAL STORYTELLING - Make ROI tangible:
   - Tie savings back to business outcomes
   - Show implementation roadmap with milestone savings
   - Highlight quick wins vs strategic plays
   - Calculate opportunity cost of inaction

8. COMPETITIVE INTELLIGENCE - Frame insights as:
   - Where you're ahead of industry benchmarks
   - Where you're vulnerable to competitors
   - What emerging threats to monitor
   - Where to gain unfair advantages

Return JSON with rich insights, NOT generic analysis. Make each insight worth the analysis time:
{
  "title": "string (intriguing, reveals a key finding)",
  "description": "string (provocative opening that hooks attention)",
  "type": "bar|line|area|pie",
  "summary": "string (5-7 paragraph strategic brief with story arc - surprising finding → business impact → recommended action)",
  "chart_data": [{label: string, value1: number, value2: number, value3: number, value4: number, ...}],
  "xKey": "label",
  "bars": [{key: string, name: string}],
  "lines": [{key: string, name: string}],
  "areas": [{key: string, name: string}],
  "insights": [{text: string (compelling, specific, actionable), severity: "critical|high|medium|low", impact: string (quantified business outcome)}],
  "recommendations": [{action: string (strategic + tactical), savings_dkk: number, timeframe: "30d|60d|90d", confidence: number, competitive_advantage: string}],
  "forecasts": [{name: string, value: number, timeframe: "30d|60d|90d", confidence: number, scenario: "baseline|optimistic|risk"}],
  "risks": [{name: string, severity: "critical|high|medium|low", likelihood: number, impact_dkk: number, cascade_effect: string}],
  "correlations": [{variables: string, coefficient: number, interpretation: string (reveals causation or hidden dependency)}],
  "advanced_metrics": [{label: string, value: number, unit: string, change_percent: number, story: string}],
  "edge_cases": [{discovery: string, implication: string, action: string}],
  "competitive_position": {strengths: [string], vulnerabilities: [string], opportunities: [string], threats: [string]},
  "technical_details": {methodology: string, data_sources: string, quality_score: number, hidden_assumptions: [string]},
  "data_quality": {accuracy: number, completeness: number, reliability: number, caveats: [string]}
}`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" }, description: { type: "string" }, type: { type: "string" },
          chart_data: { type: "array", items: { type: "object", additionalProperties: true } },
          xKey: { type: "string" }, bars: { type: "array", items: { type: "object", additionalProperties: true } },
          lines: { type: "array", items: { type: "object", additionalProperties: true } },
          areas: { type: "array", items: { type: "object", additionalProperties: true } },
          summary: { type: "string" }, insights: { type: "array", items: { type: "object", additionalProperties: true } },
          technical_details: { type: "object", additionalProperties: true },
          recommendations: { type: "array", items: { type: "object", additionalProperties: true } },
          forecasts: { type: "array", items: { type: "object", additionalProperties: true } },
          risks: { type: "array", items: { type: "object", additionalProperties: true } },
          correlations: { type: "array", items: { type: "object", additionalProperties: true } },
          advanced_metrics: { type: "array", items: { type: "object", additionalProperties: true } },
          data_quality: { type: "object", additionalProperties: true }
        }
      }
    });

      addThinkingLog('visualize', 'Rendering advanced holographic dashboard with multi-dimensional analysis', null, 150, 85, processId);
      const chartId = `chart_${Date.now()}`;
      openWindow(chartId, { x: 80, y: 60 }, {
        chartData: result.chart_data || [],
        chartConfig: {
          title: result.title,
          description: result.description,
          type: result.type || 'bar',
          xKey: result.xKey || 'label',
          bars: result.bars || [],
          lines: result.lines || [],
          areas: result.areas || [],
          summary: result.summary,
          insights: result.insights || [],
          technical_details: result.technical_details || {},
          recommendations: result.recommendations || [],
          forecasts: result.forecasts || [],
          risks: result.risks || [],
          correlations: result.correlations || [],
          advanced_metrics: result.advanced_metrics || [],
          data_quality: result.data_quality || {}
        }
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: `**🔬 ${result.title}**\n\n${result.summary || result.description}\n\n📊 **Advanced holographic research dashboard opened** — Explore detailed statistical analysis, predictive models, risk assessment, KPIs, and strategic recommendations with ROI calculations.` }]);
      addThinkingLog('complete', 'Deep research analysis rendered successfully', null, 100, 100, processId);
    } catch (error) {
      addThinkingLog('error', `Deep analysis failed: ${error.message}`, null, 100, null, processId);
      setMessages(prev => [...prev, { role: "system", content: `❌ Deep analysis failed: ${error.message}` }]);
    }
    
    closeProcessTerminal(processId);
  };

  // ── Main Command Processor ─────────────────────────────────────────────────
  const processCommand = async () => {
    if (!input.trim()) return;
    const currentCommand = input;

    // Image generation detection
    const imageMatch = currentCommand.match(/(?:generer(?:er)?\s+(?:et\s+)?billede(?:\s+af)?[:\s]*|generate\s+(?:an?\s+)?image(?:\s+of)?[:\s]*|lav\s+(?:et\s+)?billede(?:\s+af)?[:\s]*|create\s+(?:an?\s+)?image(?:\s+of)?[:\s]*)(.+)/i);
    if (imageMatch || currentCommand.toLowerCase().match(/^(?:billede|image|generer billede|generate image)$/)) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      openWindow('image_generator', { x: 100, y: 80 });
      setMessages(prev => [...prev, { role: "system", content: `🎨 AI Image Generator opened — enter your prompt to generate an image` }]);
      return;
    }

    // Company analysis detection
    const companyMatch = currentCommand.match(/(?:analyser(?:er)?\s+virksomheden?\s+|company analysis[:\s]+|analyze company[:\s]+)(.+)/i);
    if (companyMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      setCompanyAnalysisTarget(companyMatch[1].trim());
      setShowCompanyAnalysis(true);
      setMessages(prev => [...prev, { role: "system", content: `🏢 Opening holographic analysis for "${companyMatch[1].trim()}"...` }]);
      return;
    }

    // Deep analysis detection
     const deepKeywords = ["Analyser alle", "Optimer alle", "Gennemgå alle", "omfattende", "dybde", "forskel", "sammenligning", "tendenser", "mønstre", "statistik", "rapport", "analyse", "evaluering", "review"];
     const isDeeAnalysis = deepKeywords.some(kw => currentCommand.toLowerCase().includes(kw.toLowerCase()));
     if (isDeeAnalysis && currentCommand.length > 20) {
       await runDeepAnalysis(currentCommand);
       return;
     }

    setCommandHistory(prev => [...prev, currentCommand]);
    setHistoryIndex(-1);
    base44.analytics.track({ eventName: "fleet_ai_command_sent", properties: { command_length: currentCommand.length, has_files: uploadedFiles.length > 0 } });

    // Add to parallel processor
    setParallelProcessorTasks(prev => [...prev, currentCommand]);

    setMessages(prev => [...prev, { role: "user", content: currentCommand, files: uploadedFiles.length > 0 ? uploadedFiles : undefined }]);
    const currentFiles = [...uploadedFiles];
    setInput("");
    setUploadedFiles([]);
    setIsProcessing(true);
    setThinkingLogs([]);
    setShowThinkingTerminal(true);
    addThinkingLog('parse', `Parsing command: "${currentCommand}"`, null, 0);

    await processAdvancedCommand(currentCommand);

    const maxRetries = 3;
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const user = await base44.auth.me();
        const userOrgId = user?.organization_id;
        setMessages(prev => [...prev, { role: "system", content: "⚡ FLEET analyzing..." }]);
        setStreamingMessage("");
        setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

        const tokenCount = Math.ceil(currentCommand.length / 4);
        addThinkingLog('parse', `Tokenizing input (${tokenCount} tokens)`, null, 80, 15);
        addThinkingLog('analyze', 'Analyzing context and fleet data', { vehicles: vehicles.length, alerts: alerts.length, routes: routes.length, shipments: shipments.length }, 150, 25);

        const fleetData = { vehicles, alerts, routes, shipments };
        const contextAnalysis = AdvancedIntelligenceEngine.analyzeContext(fleetData);
        const predictions = AdvancedIntelligenceEngine.predictiveReasoning(contextAnalysis, vehicles, shipments, routes);

        addThinkingLog('analyze', 'Multi-perspective analysis across 6 dimensions', null, 180, 28);

        const conversationHistory = messages.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content && !m.streaming).map(m => ({ role: m.role, content: m.content }));
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userLocalTime = new Date().toLocaleString('en-GB', { timeZone: userTimezone, hour12: false });

        let fileUrls = currentFiles.map(f => f.url);

        const payload = {
          message: currentCommand, conversation_history: conversationHistory,
          context: { current_datetime: userLocalTime, user_timezone: userTimezone, vehicles_count: vehicles.length, alerts_count: alerts.length, routes_count: routes.length, shipments_count: shipments.length },
          ...(fileUrls.length > 0 && { file_urls: fileUrls })
        };

        addThinkingLog('think', 'Initializing Mistral model inference', null, 50, 45);
        const startTime = Date.now();
        const microCalls = await executeParallelMicroAnalyses(currentCommand, payload);
        const duration = Date.now() - startTime;
        const mainCallResult = microCalls[0] || {};
        const mistralResponse = (mainCallResult.data || mainCallResult) || { action: 'ANALYZE', parameters: {} };

        addThinkingLog('think', `Model inference complete`, { action: mistralResponse.action, inference_time_ms: duration }, duration, 95);

        try {
          await base44.functions.invoke('fleetAICalculations', { calculation_type: 'FLEET_PERFORMANCE', params: { vehicles, alerts, routes, shipments } });
        } catch {}

        setMessages(prev => prev.filter(m => !m.streaming));
        const { reply, action, parameters, message, open_window } = mistralResponse;

        try {
          await base44.entities.FleetAIUsage.create({ organization_id: userOrgId, user_email: user.email, command: currentCommand, action, success: true });
        } catch {}

        addThinkingLog('execute', `Executing action: ${action}`, parameters, 100, 75);

        switch (action) {
          case "OPEN_WINDOW": {
            const validWindows = ['fleet', 'alerts', 'routes', 'shipments', 'dashboard', 'settings', 'aioptimization', 'invoices', 'apidocs', 'resources', 'warehouseautomation', 'demandforecasting', 'greentms', 'gpsintegration', 'assignment', 'routeeditor', 'document_editor', 'spreadsheet_editor', 'satellite_weather', 'deep_analysis', 'swarm_intelligence', 'neuro_risk', 'digital_twin'];
            if (parameters.window_type && validWindows.includes(parameters.window_type)) {
              openWindow(parameters.window_type);
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            } else {
              setMessages(prev => [...prev, { role: "system", content: `❌ Invalid window type` }]);
            }
            break;
          }
          case "OPEN_NEXUS_CHAT":
            handleQuickAction('openNexusChat');
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message || "🛰️ Nexus Satellite Chat opened"}` }]);
            break;
          case "CLOSE_WINDOWS":
            setActiveWindows([]);
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            break;
          case "CREATE_ROUTE": {
            setMessages(prev => [...prev, { role: "system", content: "🔄 Planning route..." }]);
            const routePlan = await base44.functions.invoke('planRoute', { origin: parameters.origin, destination: parameters.destination, transport_type: parameters.transport_type || 'ship' });
            if (routePlan.data.success) {
              await base44.entities.Route.create({ organization_id: userOrgId, name: `${parameters.origin} → ${parameters.destination}`, origin: parameters.origin, destination: parameters.destination, waypoints: routePlan.data.route_data.waypoints, distance_km: routePlan.data.route_data.distance_km, estimated_duration_hours: routePlan.data.route_data.estimated_duration_hours, transport_type: parameters.transport_type || 'ship', co2_estimate: routePlan.data.route_data.co2_estimate, ai_optimized: true, status: parameters.status || 'planned', priority: parameters.priority || 'normal' });
              queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
              if (open_window) openWindow(open_window);
            }
            break;
          }
          case "CREATE_VEHICLE":
            await base44.entities.Vehicle.create({ organization_id: userOrgId, name: parameters.name || `Vehicle-${Date.now()}`, type: parameters.type || 'truck', status: parameters.status || 'active', fuel_level: parameters.fuel_level || 100, driver: parameters.driver });
            queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "CREATE_SHIPMENT":
            await base44.entities.Shipment.create({ organization_id: userOrgId, tracking_number: `SHIP-${Date.now()}`, origin: parameters.origin, destination: parameters.destination, status: parameters.status || 'pending', priority: parameters.priority || 'normal', cargo_type: parameters.cargo_type || 'general', weight_kg: parameters.weight_kg });
            queryClient.invalidateQueries({ queryKey: ['shipments-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "CREATE_ALERT":
            await base44.entities.Alert.create({ organization_id: userOrgId, title: parameters.title, message: parameters.message, type: parameters.alert_type || 'warning', category: parameters.category || 'system', is_read: false, is_resolved: false });
            queryClient.invalidateQueries({ queryKey: ['alerts-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "CREATE_CUSTOMER":
            await base44.entities.Customer.create({ organization_id: userOrgId, name: parameters.name, email: parameters.email, phone: parameters.phone, company: parameters.company, address: parameters.address, city: parameters.city, country: parameters.country, customer_type: parameters.customer_type || 'individual', status: 'active' });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            break;
          case "UPDATE_ALERTS":
            if (parameters.resolve_all) {
              const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
              await Promise.all(unresolvedAlerts.map(alert => base44.entities.Alert.update(alert.id, { is_resolved: true, resolved_at: new Date().toISOString() })));
              queryClient.invalidateQueries({ queryKey: ['alerts-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            }
            break;
          case "UPDATE_VEHICLES":
            if (parameters.update_all) {
              const targetVehicles = parameters.filter ? vehicles.filter(v => v.status === parameters.filter.status) : vehicles;
              await Promise.all(targetVehicles.map(v => base44.entities.Vehicle.update(v.id, parameters.updates)));
              queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
            } else if (parameters.vehicle_name) {
              const vehicle = vehicles.find(v => v.name.toLowerCase().includes(parameters.vehicle_name.toLowerCase()));
              if (vehicle) await base44.entities.Vehicle.update(vehicle.id, parameters.updates);
              queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
            }
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "UPDATE_ROUTE":
            if (parameters.route_name) {
              const route = routes.find(r => r.name.toLowerCase().includes(parameters.route_name.toLowerCase()));
              if (route) { await base44.entities.Route.update(route.id, parameters.updates); queryClient.invalidateQueries({ queryKey: ['routes-intellect'] }); }
            } else if (parameters.route_id) {
              await base44.entities.Route.update(parameters.route_id, parameters.updates);
              queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
            }
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "UPDATE_ROUTES":
            if (parameters.update_all) {
              const targetRoutes = routes.filter(r => !parameters.current_status || r.status === parameters.current_status);
              await Promise.all(targetRoutes.map(r => base44.entities.Route.update(r.id, parameters.updates)));
              queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
            }
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "UPDATE_SHIPMENTS":
            if (parameters.tracking_number) {
              const shipment = shipments.find(s => s.tracking_number === parameters.tracking_number);
              if (shipment) { await base44.entities.Shipment.update(shipment.id, parameters.updates); queryClient.invalidateQueries({ queryKey: ['shipments-intellect'] }); }
            }
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
            break;
          case "DELETE_ROUTES":
            if (parameters.delete_all) {
              await Promise.all(routes.map(r => base44.entities.Route.delete(r.id)));
              queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ Deleted ${routes.length} routes` }]);
            }
            break;
          case "DELETE_VEHICLES":
            if (parameters.delete_all) {
              await Promise.all(vehicles.map(v => base44.entities.Vehicle.delete(v.id)));
              queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ Deleted ${vehicles.length} vehicles` }]);
            }
            break;
          case "QUERY_DATA":
          case "ANSWER":
            setMessages(prev => [...prev, { role: "assistant", content: reply || message || "Analysis complete." }]);
            if (open_window) openWindow(open_window);
            break;
          case "SHOW_ANALYSIS":
          case "VISUALIZE_DATA":
            setMessages(prev => [...prev, { role: "assistant", content: message }]);
            if (parameters.chart_data && parameters.chart_config) {
              openWindow(`chart_${Date.now()}`, { x: 150, y: 100 }, { chartData: parameters.chart_data, chartConfig: parameters.chart_config });
            }
            break;
          case "SHOW_3D":
            setMessages(prev => [...prev, { role: "assistant", content: message }]);
            if (parameters.visualization_type) setShow3DVisualization({ type: parameters.type, vehicles, routes });
            break;
          case "CREATE_DOCUMENT":
            openWindow('document_editor', { x: 80, y: 60 }, {
              initialContent: parameters.content_html,
              initialTitle: parameters.title
            });
            setMessages(prev => [...prev, { role: "assistant", content: `📄 **${parameters.title}** — ${parameters.description || 'Document created and ready to edit.'}` }]);
            break;
          case "CREATE_SPREADSHEET":
            openWindow('spreadsheet_editor', { x: 80, y: 60 }, {
              initialGrid: parameters.grid,
              initialTitle: parameters.title
            });
            setMessages(prev => [...prev, { role: "assistant", content: `📊 **${parameters.title}** — ${parameters.description || 'Spreadsheet created and ready to edit.'}` }]);
            break;
          default:
            setMessages(prev => [...prev, { role: "assistant", content: message || "Command executed." }]);
            if (open_window) openWindow(open_window);
            break;
        }

        base44.analytics.track({ eventName: "fleet_ai_command_success", properties: { action, command: currentCommand } });
        addThinkingLog('result', 'Command executed successfully', null, 100);
        break;
      } catch (error) {
        attempts++;
        addThinkingLog('error', `Error (attempt ${attempts}/${maxRetries}): ${error.message}`, null, 100);
        if (attempts >= maxRetries) {
          setMessages(prev => [...prev, { role: "system", content: `❌ Error: ${error.message}. Please try again.` }]);
          base44.analytics.track({ eventName: "fleet_ai_command_failed", properties: { error: error.message, attempts } });
          break;
        } else {
          setMessages(prev => [...prev, { role: "system", content: `⚠️ Retrying (${attempts}/${maxRetries})...` }]);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    setIsProcessing(false);
    addThinkingLog('result', 'Processing complete', null, 100);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-violet-950/30" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[size:100%_4px] pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => {
            const randomX = Math.random() * 100 - 50;
            return (
              <div key={i} className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float-particle"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDuration: `${5 + Math.random() * 10}s`, animationDelay: `${Math.random() * 5}s`, '--float-x': `${randomX}px` }} />
            );
          })}
        </div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <IntellectHeader
           orgId={orgId}
           openWindow={openWindow}
           executePrompt={executePrompt}
           setShowAdvancedPanel={setShowAdvancedPanel}
           setShowParallelProcessor={setShowParallelProcessor}
           setShowCompanyAnalysis={setShowCompanyAnalysis}
         />

        {/* Main Canvas */}
        <div className="flex-1 overflow-hidden relative">
          {/* Advanced Intelligence Panel */}
          {showAdvancedPanel && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-4 w-96 max-w-[calc(100vw-32px)] backdrop-blur-xl rounded-lg z-40 flex flex-col"
              style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(6,182,212,0.3)", maxHeight: 'calc(100vh - 120px)' }}>
              <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(6,182,212,0.2)" }}>
                <h3 className="text-white font-bold text-sm flex items-center gap-2 font-mono tracking-wider">
                  <Brain className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
                  <span style={{ color: "#06b6d4", textShadow: "0 0 8px rgba(6,182,212,0.3)" }}>ADVANCED</span>
                </h3>
                <button onClick={() => setShowAdvancedPanel(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {advancedError && <div className="p-2 rounded bg-red-500/20 border border-red-500/50 text-red-300 text-xs">{advancedError}</div>}
                <AdvancedCommandPanel onCommand={(cmdType) => { advancedExecute(cmdType); setMessages(prev => [...prev, { role: 'system', content: `🧠 Running: ${cmdType}...` }]); }} />
                {(advancedLoading || advancedResults) && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <InsightRenderer data={advancedResults} loading={advancedLoading} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Minimized Windows */}
          <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-40">
            <AnimatePresence>
              {activeWindows.filter(w => minimizedWindows.has(w.id)).map((window) => {
                const meta = getWindowMeta(window.type);
                const title = window.type.startsWith('chart_') ? (window.data?.chartConfig?.title || 'Analysis Chart') : meta.title;
                const Icon = meta.icon;
                return (
                  <motion.div key={window.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                    <button onClick={() => toggleMinimize(window.id)}
                      className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase font-mono transition-all flex items-center gap-1.5 rounded-lg"
                      style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.08)" }}>
                      <Icon className="w-3 h-3" />
                      <span>{title}</span>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Hologram Windows */}
          <AnimatePresence>
            {activeWindows.map((window) => {
              const meta = getWindowMeta(window.type);
              const title = window.type.startsWith('chart_') ? (window.data?.chartConfig?.title || 'Analysis') : meta.title;
              return (
                <HologramWindow key={window.id} id={window.id} windowType={window.type}
                  onSendToScreen={{ screens: openDesktopWindows, send: sendWindowToScreen }}
                  title={title} icon={meta.icon} position={window.position}
                  onClose={() => closeWindow(window.id)} onMinimize={() => toggleMinimize(window.id)}
                  isMinimized={minimizedWindows.has(window.id)} isFocused={focusedWindow === window.id} onFocus={setFocusedWindow}>
                  <WindowContentRenderer type={window.type} data={{ ...(window.data || {}), onClose: () => closeWindow(window.id) }} vehicles={vehicles} routes={routes} shipments={shipments} alerts={alerts} currentUser={currentUser} orgId={orgId} customers={customers} setInput={setInput} openWindow={openWindow} />
                </HologramWindow>
              );
            })}
          </AnimatePresence>

          {/* Company Analysis */}
          {showCompanyAnalysis && (
            <CompanyAnalysisHologram initialName={companyAnalysisTarget}
              onClose={() => { setShowCompanyAnalysis(false); setCompanyAnalysisTarget(null); }}
              onSendToScreen={{ screens: openDesktopWindows, send: sendWindowToScreen }} />
          )}

          {/* Profile Search */}
          {showProfileSearch && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 overflow-auto bg-slate-950">
              <div className="flex items-start justify-between p-4 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                <h2 className="text-white font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-400" />People Intelligence</h2>
                <Button onClick={() => setShowProfileSearch(false)} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20"><X className="w-5 h-5" /></Button>
              </div>
              <ProfileSearch />
            </motion.div>
          )}

          {showCandidateMatcher && <CandidateMatcher onClose={() => setShowCandidateMatcher(false)} />}

          {/* Video Call */}
          {showVideoCall && (
            <HologramWindow id="video-call" title="Video Call" icon={Video} position={{ x: 200, y: 150 }}
              onClose={() => setShowVideoCall(false)} onMinimize={() => toggleMinimize('video-call')}
              isMinimized={minimizedWindows.has('video-call')} windowType="video_call"
              isFocused={focusedWindow === 'video-call'} onFocus={setFocusedWindow}>
              <VideoCallHologram onClose={() => setShowVideoCall(false)} />
            </HologramWindow>
          )}

          {/* Parallel Processor */}
          {showParallelProcessor && (
            <HologramWindow id="parallel-processor" title="Parallel Task Processor" icon={Zap} position={{ x: 150, y: 100 }}
              onClose={() => setShowParallelProcessor(false)} onMinimize={() => toggleMinimize('parallel-processor')}
              isMinimized={minimizedWindows.has('parallel-processor')} windowType="parallel_processor"
              isFocused={focusedWindow === 'parallel-processor'} onFocus={setFocusedWindow}>
              <ParallelTaskProcessor onClose={() => setShowParallelProcessor(false)} externalTasks={parallelProcessorTasks} />
            </HologramWindow>
          )}

          {/* 3D Fleet Globe */}
          {show3DVisualization && (
            <FleetGlobe3D vehicles={show3DVisualization.vehicles || vehicles} routes={show3DVisualization.routes || routes}
              onClose={() => setShow3DVisualization(null)} onMinimize={() => setShow3DVisualization(null)} />
          )}

          {/* AI Thinking Terminal */}
          <ThinkingTerminalVisual isActive={showThinkingTerminal && isProcessing} logs={thinkingLogs} onClose={() => setShowThinkingTerminal(false)} />

          {/* Standby */}
          {activeWindows.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              {/* Enhanced background effects */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
                />
                <motion.div
                  animate={{ scale: [1.2, 1, 1.2], rotate: [360, 0] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-15"
                  style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
                />
              </div>

              {/* Main content */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative mb-16"
                >
                  {/* Orbiting rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[1, 2, 3].map((ring) => (
                      <motion.div
                        key={ring}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10 + ring * 5, repeat: Infinity, ease: "linear" }}
                        className="absolute rounded-full border"
                        style={{
                          width: 120 + ring * 60,
                          height: 120 + ring * 60,
                          borderColor: `rgba(6,182,212,${0.2 - ring * 0.05})`,
                          borderWidth: 1,
                        }}
                      />
                    ))}
                  </div>

                  {/* Brain menu */}
                  <div className="relative z-20">
                    <CircularBrainMenu 
                      size="lg" 
                      showMenuByDefault={true}
                      onAction={(action) => {
                        if (action === 'advanced_intelligence') setShowAdvancedPanel(true);
                        else if (action === 'deep_analysis') openWindow('deep_analysis', { x: 100, y: 80 });
                        else if (action === 'company_analysis') setShowCompanyAnalysis(true);
                        else openWindow(action, { x: 100 + Math.random() * 100, y: 80 + Math.random() * 100 });
                      }}
                      onMenuToggle={setIsCircularMenuOpen}
                    />
                  </div>
                </motion.div>

                {/* Title and description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: activeWindows.length === 0 && !isCircularMenuOpen ? 1 : 0, y: activeWindows.length === 0 && !isCircularMenuOpen ? 0 : 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center max-w-xl px-4 space-y-4"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 blur-2xl opacity-50" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }} />
                    <h1 className="relative text-6xl font-black font-mono tracking-widest uppercase bg-clip-text text-transparent"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
                        textShadow: "0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(139,92,246,0.2)",
                      }}>
                      FLEET AI
                    </h1>
                  </div>

                  <p className="text-lg text-slate-300 font-light tracking-wide">
                    Neural Logistics Intelligence Platform
                  </p>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    Multi-dimensional analysis • Real-time optimization • Predictive reasoning
                  </p>

                  {/* Pulse indicators */}
                   <div className="flex items-center justify-center gap-2 pt-6">
                     {[0, 0.2, 0.4].map((delay) => (
                       <motion.div
                         key={delay}
                         className="w-1 h-1 rounded-full"
                         animate={{ scale: [1, 2, 1], opacity: [1, 0.3, 1] }}
                         transition={{ duration: 1.5, repeat: Infinity, delay }}
                         style={{ background: "#06b6d4", boxShadow: "0 0 8px rgba(6,182,212,0.4)" }}
                       />
                     ))}
                   </div>

                   {/* Floating particles effect */}
                   <div className="pt-8 flex gap-1 justify-center items-center h-8">
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                         key={i}
                         className="w-0.5 h-0.5 rounded-full"
                         animate={{
                           y: [0, -20, 0],
                           opacity: [0, 1, 0],
                           x: Math.cos((i / 5) * Math.PI * 2) * 15,
                         }}
                         transition={{
                           duration: 2.5,
                           repeat: Infinity,
                           delay: i * 0.3,
                         }}
                         style={{ background: "#8b5cf6", boxShadow: "0 0 6px rgba(139,92,246,0.6)" }}
                       />
                     ))}
                   </div>
                  </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Command Bar */}
        <IntellectCommandBar
          input={input} setInput={setInput}
          messages={messages} streamingMessage={streamingMessage} messagesEndRef={messagesEndRef}
          uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles}
          isUploading={isUploading} setIsUploading={setIsUploading}
          isListening={isListening} setIsListening={setIsListening}
          fileInputRef={fileInputRef} processCommand={processCommand}
          setShowCompanyAnalysis={setShowCompanyAnalysis}
          setShowProfileSearch={setShowProfileSearch}
          handleQuickAction={handleQuickAction}
          openWindow={openWindow}
        />
      </div>

      {/* Process Terminals */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
        <AnimatePresence>
          {processTerminals.map((process, idx) => (
            <div key={process.id} className="pointer-events-auto" style={{ transform: `translateY(${idx * 20}px)` }}>
              <ProcessThinkingTerminal processId={process.id} processName={process.name} thinkingLogs={process.logs || []}
                isMinimized={minimizedProcesses.has(process.id)} onClose={() => closeProcessTerminal(process.id)} onToggleMinimize={() => toggleProcessMinimize(process.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Multi-Screen Manager */}
      <AnimatePresence>
        {showMultiScreenManager && <MultiScreenManager onClose={() => setShowMultiScreenManager(false)} onWindowOpened={(label, winRef) => { trackDesktopWindow(label, winRef); }} />}
      </AnimatePresence>

      {/* AI Coach */}
      <AICoach openWindows={activeWindows} fleetData={{ vehicles, routes, shipments, alerts }} courseSession={null} userLevel={currentUser?.role === 'admin' ? 4 : 2} performanceHistory={[]} />
    </div>
  );
}