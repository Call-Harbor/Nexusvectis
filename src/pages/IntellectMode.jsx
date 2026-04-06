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
import DashboardGlobeFrame from "@/components/holographic/DashboardGlobeFrame";
import ThinkingTerminalVisual from "@/components/intellect/ThinkingTerminalVisual";
import CompanyAnalysisHologram from "@/components/intellect/CompanyAnalysisHologram";
import ProfileSearch from "@/components/intellect/ProfileSearch";
import CandidateMatcher from "@/components/intellect/CandidateMatcher";
import MultiScreenManager from "@/components/intellect/MultiScreenManager";
import FleetAITrainer from "@/components/intellect/FleetAITrainer";
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
import HarborSuperAgentChat from "@/components/intellect/HarborSuperAgentChat";

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
  const [showFleetAITrainer, setShowFleetAITrainer] = useState(false);
  const [showHarborAgentChat, setShowHarborAgentChat] = useState(false);
  const intellectConversationRef = useRef(null);
  const intellectUnsubRef = useRef(null);
  const [installedAppIds, setInstalledAppIds] = useState(new Set());

  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pendingPromptRef = useRef(null);

  const { executeCommand: advancedExecute, loading: advancedLoading, results: advancedResults, error: advancedError } = useAdvancedIntellect();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // ── Auth Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      // In Electron/desktop, App.jsx already shows ElectronLoginHelper — don't web-redirect
      const isElectron = !!window.__todesktop || navigator.userAgent.toLowerCase().includes('electron');
      if (!isElectron) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      }
    }
  }, [currentUser, isLoadingUser]);

  const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Vehicle.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Alert.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Route.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Shipment.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Resource.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 10000,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-intellect', orgId],
    queryFn: () => base44.entities.Customer.filter({ organization_id: orgId }),
    enabled: !!orgId, staleTime: 30000
  });

  // Bus entities
  const { data: buses = [] } = useQuery({
    queryKey: ['buses-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.Bus.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  const { data: busLines = [] } = useQuery({
    queryKey: ['busLines-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusLine.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: busStops = [] } = useQuery({
    queryKey: ['busStops-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusStop.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: busDrivers = [] } = useQuery({
    queryKey: ['busDrivers-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusDriver.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: busTrips = [] } = useQuery({
    queryKey: ['busTrips-intellect', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return await base44.entities.BusTrip.filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  // ── Load installed apps from user profile ─────────────────────────────────
  useEffect(() => {
    if (currentUser?.installed_harbor_apps) {
      setInstalledAppIds(new Set(currentUser.installed_harbor_apps));
    }
  }, [currentUser]);

  // ── Init Harbor Intellect conversation ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'harbor_intellect',
          metadata: { name: 'IntellectMode Session' }
        });
        intellectConversationRef.current = conv;
      } catch (e) {
        console.warn('Could not init harbor_intellect conversation:', e);
      }
    };
    init();
    return () => { intellectUnsubRef.current?.(); };
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingMessage]);



  useEffect(() => {
    if (pendingPromptRef.current && input === pendingPromptRef.current && !isProcessing) {
      const cmd = pendingPromptRef.current;
      pendingPromptRef.current = null;
      processCommand(cmd);
    }
  }, [input]);

  // ── Window Management ──────────────────────────────────────────────────────
  const openWindow = useCallback((type, position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }, data = null) => {
    // Allow multiple instances of: charts, documents, spreadsheets, and analysis windows
    const allowMultiple = type.startsWith('chart_') || type === 'document_editor' || type === 'spreadsheet_editor' || type === 'deep_analysis';
    if (!allowMultiple && activeWindows.find(w => w.type === type)) {
      toast.info(`${type} window already open`);
      return;
    }
    // Offset position slightly for each new window of same type to avoid stacking
    const existingCount = activeWindows.filter(w => w.type === type || w.type.startsWith('chart_')).length;
    const offsetPosition = {
      x: position.x + existingCount * 30,
      y: position.y + existingCount * 30
    };
    const newId = Date.now();
    setActiveWindows(prev => [...prev, { type, id: newId, position: allowMultiple ? offsetPosition : position, data }]);
    setFocusedWindow(newId);
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

  // ── Installed Apps Persistence ────────────────────────────────────────────
  const updateInstalledApps = useCallback(async (newSet) => {
    setInstalledAppIds(newSet);
    try {
      await base44.auth.updateMe({ installed_harbor_apps: [...newSet] });
    } catch (e) { console.error('Failed to save installed apps', e); }
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
     show3DFleet: () => setShow3DVisualization({ vehicles, routes, resources }),
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
     openFleetAITrainer: () => { setShowFleetAITrainer(true); setMessages(prev => [...prev, { role: "system", content: "⚡ HARBOR AI Trainer activated — Train your own AI models and deploy via API" }]); },
     open3DViewer: () => { openWindow('fleet_3d_viewer', { x: 60, y: 50 }); setMessages(prev => [...prev, { role: "system", content: "🚛 Fleet 3D Viewer åbnet — Udforsk realistiske 3D-modeller af lastbiler, skibe, droner og fly" }]); },
     openVehicleBuilder: () => { openWindow('vehicle_builder', { x: 80, y: 60 }); setMessages(prev => [...prev, { role: "system", content: "🔧 Transport Builder & Simulator opened — Configure truck, ship, aircraft or train and run advanced fuel & CO₂ simulations" }]); },
     openHarborAppBuilder: () => { openWindow('harbor_app_builder', { x: 60, y: 50 }, { installedAppIds, onInstall: (appId) => updateInstalledApps(new Set([...installedAppIds, appId])), vehicles, routes, shipments, alerts, customers, currentUser, orgId }); setMessages(prev => [...prev, { role: "system", content: "⚡ H.A.R.B.O.R App Builder activated — Entity-first design workflow" }]); },
     openFleetStore: () => { openWindow('fleet_store', { x: 100, y: 80 }, { installedAppIds, onInstall: (appId) => { const next = new Set([...installedAppIds, appId]); updateInstalledApps(next); window.dispatchEvent(new CustomEvent('harbor_install_app', { detail: { appId, orgId } })); openWindow('harbor_app_builder', { x: 60, y: 50 }, { installedAppIds: next, onInstall: (id) => updateInstalledApps(new Set([...next, id])), vehicles, routes, shipments, alerts, customers, currentUser, orgId }); toast.success("App installeret — tjek App Builder!"); }, onUninstall: async (appId) => { const next = new Set(installedAppIds); next.delete(appId); updateInstalledApps(next); } }); setMessages(prev => [...prev, { role: "system", content: "Fleet Store opened" }]); },
     openTransitConsole: () => { navigate('/TransitControl'); setMessages(prev => [...prev, { role: "system", content: "🚌 Transit Console opened — Manage bus lines, stops, drivers and real-time operations" }]); },
      openAirportOps: () => { openWindow('airport_ops', { x: 60, y: 50 }); setMessages(prev => [...prev, { role: "system", content: "✈️ Airport Ops Center opened as hologram — Full AI-powered airport operations" }]); },
      openPortCommand: () => { openWindow('port_command', { x: 80, y: 60 }); setMessages(prev => [...prev, { role: "system", content: "🚢 Port Command Center opened as hologram — Full AI-powered port operations" }]); },
      openEnergyOps: () => { navigate('/EnergyOpsCenter'); setMessages(prev => [...prev, { role: "system", content: "⚡ Energy & Utilities Ops opened — Neural grid control, load forecast, AI dispatch and resilience simulation" }]); },
      openAIDevIDE: () => { openWindow('ai_dev_ide', { x: 40, y: 30 }); setMessages(prev => [...prev, { role: "system", content: "🖥️ Fleet AI IDE & DevOps Orchestrator activated — Advanced code generation, CI/CD pipelines and AI agent orchestration" }]); },
      };
     actionMap[action]?.();
     }, [openWindow, vehicles, routes, setMessages, installedAppIds]);

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

  // ── Bus Command Detection ───────────────────────────────────────────────────
  const detectBusCommand = async (command, vehicles, orgId, buses, busLines, busStops, busDrivers) => {
    const lower = command.toLowerCase();
    
    // Assign driver to bus
    const assignDriverMatch = lower.match(/(?:assign|tildel)\s+(?:driver|chauffør)\s+(?:x|(\w+))\s+(?:to|til)\s+(?:bus|bus nummer)\s+(?:y|(\w+))/i);
    if (assignDriverMatch || lower.includes('assign driver') || lower.includes('tildel chauffør')) {
      const driverId = assignDriverMatch?.[1] || 'driver-id';
      const busId = assignDriverMatch?.[2] || 'bus-id';
      return { type: 'assign_driver', driverId, busId, buses, busDrivers };
    }
    
    // Divert bus to route/line
    const divertMatch = lower.match(/(?:divert|omdiriger|send)\s+(?:bus|bus nummer)\s+(?:z|(\w+))\s+(?:to|til)\s+(?:route|line|rute)\s+(?:a|(\w+))/i);
    if (divertMatch || lower.includes('divert bus') || lower.includes('omdiriger bus')) {
      const busId = divertMatch?.[1] || 'bus-id';
      const lineId = divertMatch?.[2] || 'line-id';
      return { type: 'divert_bus', busId, lineId, buses, busLines };
    }
    
    // Report breakdown
    const breakdownMatch = lower.match(/(?:report|rapporter)\s+(?:breakdown|nedbrud|fejl)\s+(?:on|på)\s+(?:line|linje)\s+(?:b|(\w+))/i);
    if (breakdownMatch || lower.includes('report breakdown') || lower.includes('rapporter nedbrud')) {
      const lineId = breakdownMatch?.[1] || 'line-id';
      return { type: 'report_breakdown', lineId, buses, busLines };
    }
    
    // Get bus status
    if (lower.includes('bus status') || lower.includes('bus status') || lower.includes('hvad er status på bus')) {
      const busIdMatch = lower.match(/(?:bus|bus nummer)\s+(\w+)/i);
      const busId = busIdMatch?.[1];
      return { type: 'get_bus_status', busId, buses };
    }
    
    // List all buses
    if (lower.includes('list buses') || lower.includes('show buses') || lower.includes('vis busser')) {
      return { type: 'list_buses', buses };
    }
    
    // List bus lines
    if (lower.includes('list lines') || lower.includes('show lines') || lower.includes('vis linjer')) {
      return { type: 'list_lines', busLines };
    }
    
    // Create new bus
    const createBusMatch = lower.match(/(?:create|opret)\s+(?:a|en)\s+(?:new|ny)\s+bus/i);
    if (createBusMatch || lower.includes('opret bus')) {
      return { type: 'create_bus' };
    }
    
    // Update bus status
    const updateStatusMatch = lower.match(/(?:set|ændre|opdater)\s+(?:bus|bus nummer)\s+(\w+)\s+(?:status|til)\s+(?:in_service|idle|maintenance|out_of_service|aktiv|vedligehold)/i);
    if (updateStatusMatch) {
      const busId = updateStatusMatch[1];
      const status = updateStatusMatch[2];
      return { type: 'update_bus_status', busId, status, buses };
    }
    
    // Create new bus line/route
    const createLineMatch = lower.match(/(?:create|opret)\s+(?:a|en)\s+(?:new|ny)\s+(?:bus\s+)?(?:line|rute)\s+(?:number|nummer)?\s*(\w+)?(?:\s+(?:named|kaldet)\s+(\w+))?/i) || 
                           lower.match(/(?:opret|rute)\s+(\w+)\s+(?:fra|from)\s+(.+?)\s+(?:til|to)\s+(.+)/i);
    if (createLineMatch || lower.includes('create line') || lower.includes('opret rute')) {
      const lineNumber = createLineMatch?.[1] || 'NEW';
      const lineName = createLineMatch?.[2] || 'New Route';
      return { type: 'create_line', lineNumber, lineName, busStops };
    }
    
    // Add stop to line
    const addStopMatch = lower.match(/(?:add|tilføj)\s+(?:stop|stoppested)\s+(?:['"]?)(.+?)(?:['"]?)\s+(?:to|til)\s+(?:line|rute)\s+(\w+)/i);
    if (addStopMatch || lower.includes('add stop to') || lower.includes('tilføj stoppested til')) {
      const stopName = addStopMatch?.[1] || 'stop-name';
      const lineId = addStopMatch?.[2] || 'line-id';
      return { type: 'add_stop_to_line', stopName, lineId, busStops, busLines };
    }
    
    // Create new bus stop
    const createStopMatch = lower.match(/(?:create|opret)\s+(?:a|et)\s+(?:new|nyt)\s+(?:bus\s+)?(?:stop|stoppested)\s+(?:named|kaldet)?\s*['"]?(.+?)['"]?\s+(?:at|ved|på)?\s*(?:coords|koordinater)?\s*(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/i) ||
                           lower.match(/(?:opret|create)\s+(?:stoppested|stop)\s+(.+?)\s+(?:på|at)\s+(.+?)\s+(?:gade|vej|street)/i);
    if (createStopMatch || lower.includes('create stop') || lower.includes('opret stoppested')) {
      const stopName = createStopMatch?.[1] || 'New Stop';
      const lat = createStopMatch?.[2] ? parseFloat(createStopMatch[2]) : null;
      const lng = createStopMatch?.[3] ? parseFloat(createStopMatch[3]) : null;
      return { type: 'create_stop', stopName, lat, lng, busStops };
    }
    
    return null;
  };

  // ── Bus Command Execution ───────────────────────────────────────────────────
  const executeBusCommand = async (cmd, orgId, userOrgId, busTrips = []) => {
    try {
      switch (cmd.type) {
        case 'assign_driver': {
          const bus = cmd.buses.find(b => b.bus_number === cmd.busId || b.id === cmd.busId);
          const driver = cmd.busDrivers.find(d => d.driver_id === cmd.driverId || d.id === cmd.driverId);
          if (!bus) return { role: "system", content: `❌ Bus ${cmd.busId} not found` };
          if (!driver) return { role: "system", content: `❌ Driver ${cmd.driverId} not found` };
          
          await base44.entities.Bus.update(bus.id, { driver_id: driver.driver_id });
          return { role: "system", content: `✅ Assigned driver ${driver.first_name} ${driver.last_name} to bus ${bus.bus_number}` };
        }
        
        case 'divert_bus': {
          const bus = cmd.buses.find(b => b.bus_number === cmd.busId || b.id === cmd.busId);
          const line = cmd.busLines.find(l => l.line_number === cmd.lineId || l.id === cmd.lineId);
          if (!bus) return { role: "system", content: `❌ Bus ${cmd.busId} not found` };
          if (!line) return { role: "system", content: `❌ Line ${cmd.lineId} not found` };
          
          await base44.entities.Bus.update(bus.id, { current_line_id: line.line_number });
          return { role: "system", content: `✅ Diverted bus ${bus.bus_number} to line ${line.line_number}` };
        }
        
        case 'report_breakdown': {
          const line = cmd.busLines.find(l => l.line_number === cmd.lineId || l.id === cmd.lineId);
          if (!line) return { role: "system", content: `❌ Line ${cmd.lineId} not found` };
          
          await base44.entities.Alert.create({
            organization_id: orgId,
            title: `Breakdown on Line ${line.line_number}`,
            message: `Vehicle breakdown reported on line ${line.line_number}. Maintenance required.`,
            type: 'critical',
            category: 'maintenance',
            is_read: false,
            is_resolved: false
          });
          return { role: "system", content: `✅ Breakdown reported on line ${line.line_number}. Maintenance alert created.` };
        }
        
        case 'get_bus_status': {
          const bus = cmd.buses.find(b => b.bus_number === cmd.busId || b.id === cmd.busId);
          if (!bus) return { role: "system", content: `❌ Bus ${cmd.busId} not found` };
          
          const status = `**Bus ${bus.bus_number} Status:**\n- Status: ${bus.status}\n- Location: ${bus.latitude?.toFixed(4) || 'N/A'}, ${bus.longitude?.toFixed(4) || 'N/A'}\n- Speed: ${bus.speed || 0} km/h\n- Fuel/Battery: ${bus.fuel_type === 'electric' ? `${bus.battery_level || 0}%` : `${bus.fuel_level || 0}%`}\n- Passengers: ${bus.passenger_count || 0}\n- Current Line: ${bus.current_line_id || 'Unassigned'}`;
          return { role: "assistant", content: status };
        }
        
        case 'list_buses': {
          if (!cmd.buses.length) return { role: "system", content: `ℹ️ No buses in fleet` };
          
          const summary = `**Fleet Overview:** ${cmd.buses.length} buses\n\n` + cmd.buses.map(b => 
            `• **${b.bus_number}** - ${b.status} | ${b.vehicle_type} | ${b.fuel_type} | Line: ${b.current_line_id || 'Unassigned'}`
          ).join('\n');
          return { role: "assistant", content: summary };
        }
        
        case 'list_lines': {
          if (!cmd.busLines.length) return { role: "system", content: `ℹ️ No bus lines configured` };
          
          const summary = `**Bus Lines:** ${cmd.busLines.length} lines\n\n` + cmd.busLines.map(l => 
            `• **${l.line_number}** - ${l.line_name} | Status: ${l.status} | ${l.daily_trips || 'N/A'} trips/day`
          ).join('\n');
          return { role: "assistant", content: summary };
        }
        
        case 'create_bus': {
          // Open TransitControl to the bus management section
          return { role: "system", content: `ℹ️ To create a new bus, please use the TransitControl dashboard. Type "open transit control" to navigate there.` };
        }
        
        case 'update_bus_status': {
          const bus = cmd.buses.find(b => b.bus_number === cmd.busId || b.id === cmd.busId);
          if (!bus) return { role: "system", content: `❌ Bus ${cmd.busId} not found` };
          
          const validStatuses = ['in_service', 'idle', 'maintenance', 'out_of_service'];
          const newStatus = validStatuses.includes(cmd.status) ? cmd.status : 'idle';
          
          await base44.entities.Bus.update(bus.id, { status: newStatus });
          return { role: "system", content: `✅ Updated bus ${bus.bus_number} status to ${newStatus}` };
        }
        
        case 'create_line': {
          const lineNumber = cmd.lineNumber === 'NEW' ? `L${Math.floor(Math.random() * 100)}` : cmd.lineNumber;
          const newLine = {
            organization_id: orgId,
            line_number: lineNumber,
            line_name: cmd.lineName,
            status: 'active',
            directions: []
          };
          
          const created = await base44.entities.BusLine.create(newLine);
          return { role: "assistant", content: `✅ Created new bus line **${lineNumber}** - ${cmd.lineName}\n\nLine ID: ${created.id}\nStatus: active\n\nYou can now add stops to this line using "add stop [stop name] to line ${lineNumber}"` };
        }
        
        case 'add_stop_to_line': {
          const line = cmd.busLines.find(l => l.line_number === cmd.lineId || l.id === cmd.lineId || l.line_name === cmd.lineId);
          if (!line) return { role: "system", content: `❌ Line ${cmd.lineId} not found` };
          
          // Find or create the stop
          let stop = cmd.busStops.find(s => s.stop_name.toLowerCase().includes(cmd.stopName.toLowerCase()));
          if (!stop) {
            return { role: "system", content: `❌ Stop "${cmd.stopName}" not found. Create it first with "create stop ${cmd.stopName} at coordinates lat, lng"` };
          }
          
          // Add stop to line's direction
          const directions = line.directions || [];
          if (directions.length === 0) {
            directions.push({
              direction_id: 'outbound',
              direction_name: `${line.line_number} Outbound`,
              stop_sequence: []
            });
          }
          
          const sequence = directions[0].stop_sequence || [];
          const nextOrder = sequence.length > 0 ? Math.max(...sequence.map(s => s.sequence_order)) + 1 : 1;
          
          sequence.push({
            stop_id: stop.stop_id,
            sequence_order: nextOrder,
            planned_travel_time_minutes: 2
          });
          
          directions[0].stop_sequence = sequence;
          
          await base44.entities.BusLine.update(line.id, { directions });
          return { role: "assistant", content: `✅ Added stop **${stop.stop_name}** to line **${line.line_number}**\n\nStop order: ${nextOrder}\nDirection: ${directions[0].direction_name}` };
        }
        
        case 'create_stop': {
          const stopId = `STOP-${Math.floor(Math.random() * 10000)}`;
          
          if (!cmd.lat || !cmd.lng) {
            return { role: "system", content: `❌ Please provide coordinates: "create stop ${cmd.stopName} at coordinates 55.6761, 12.5683"` };
          }
          
          const newStop = {
            organization_id: orgId,
            stop_id: stopId,
            stop_name: cmd.stopName,
            latitude: cmd.lat,
            longitude: cmd.lng,
            stop_type: 'regular',
            status: 'operational',
            facilities: {
              shelter: false,
              seating: false,
              realtime_display: false,
              ticket_machine: false,
              wheelchair_accessible: true,
              bike_parking: false,
              lighting: true
            }
          };
          
          const created = await base44.entities.BusStop.create(newStop);
          return { role: "assistant", content: `✅ Created new bus stop **${cmd.stopName}**\n\nStop ID: ${stopId}\nCoordinates: ${cmd.lat}, ${cmd.lng}\nStatus: operational\n\nAdd it to a line with "add stop ${cmd.stopName} to line [line number]"` };
        }
        
        default:
          return null;
      }
    } catch (error) {
      return { role: "system", content: `❌ Bus command failed: ${error.message}` };
    }
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
       setMessages(prev => [...prev, { role: "system", content: "🔬 Running deep analysis... this may take a moment..." }]);

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

       // Open hologram window with analysis data
       console.log('Opening analysis window:', { chartId, hasChartData: !!result.chart_data, hasRecommendations: !!result.recommendations });
       openWindow(chartId, { x: 80, y: 60 }, {
         chartData: result.chart_data || [],
         chartConfig: result
       });

       // Add message to chat
       setMessages(prev => [...prev, { role: "assistant", content: `**🔬 ${result.title}**\n\n${result.summary || result.description}\n\n📊 **Advanced holographic research dashboard opened** — Explore detailed statistical analysis, predictive models, risk assessment, KPIs, and strategic recommendations with ROI calculations.` }]);
       addThinkingLog('complete', 'Deep research analysis rendered successfully', null, 100, 100, processId);
    } catch (error) {
      addThinkingLog('error', `Deep analysis failed: ${error.message}`, null, 100, null, processId);
      setMessages(prev => [...prev, { role: "system", content: `❌ Deep analysis failed: ${error.message}` }]);
    }
    
    closeProcessTerminal(processId);
  };

  // ── Main Command Processor ─────────────────────────────────────────────────
  const processCommand = async (commandText) => {
    const currentCommand = commandText || input;
    if (!currentCommand.trim()) return;

    // Bus Management Commands Detection
    const busCommand = await detectBusCommand(currentCommand, vehicles, orgId, buses, busLines, busStops, busDrivers);
    if (busCommand) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      const result = await executeBusCommand(busCommand, orgId, orgId, busTrips);
      if (result) {
        setMessages(prev => [...prev, result]);
        queryClient.invalidateQueries({ queryKey: ['buses-intellect', 'busLines-intellect', 'busStops-intellect', 'busDrivers-intellect', 'busTrips-intellect'] });
        setIsProcessing(false);
        return;
      }
    }

    // Airport Ops detection
    const airportMatch = currentCommand.match(/(?:airport|lufthavn|airport ops|åbn airport|open airport|vis airport|airport command)/i);
    if (airportMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      handleQuickAction('openAirportOps');
      return;
    }

    // Energy Ops detection
    const energyMatch = currentCommand.match(/(?:energy|energi|grid|elnet|utilities|dispatch grid|load forecast|islanding|outage planner|power grid|strøm|el-net)/i);
    if (energyMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      handleQuickAction('openEnergyOps');
      return;
    }

    // Port Command detection
    const portMatch = currentCommand.match(/(?:port command|portkommando|åbn port|open port|vis port|havn|port center|port ops)/i);
    if (portMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      handleQuickAction('openPortCommand');
      return;
    }

    // AI Dev IDE detection
    const ideMatch = currentCommand.match(/(?:ide|code editor|devops|orchestrator|ai ide|fleet ide|deploy pipeline|ci.?cd|codegen|generate code|kode editor|skriv kode|byg pipeline)/i);
    if (ideMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      handleQuickAction('openAIDevIDE');
      return;
    }

    // H.A.R.B.O.R App Builder detection
    const harborAppMatch = currentCommand.match(/(?:harbor\s+app|build\s+(?:an?\s+)?app|create\s+(?:an?\s+)?app|app\s+builder|lav\s+(?:en?\s+)?app|byg\s+(?:en?\s+)?app|h\.?a\.?r\.?b\.?o\.?r\s+builder)/i);
    if (harborAppMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      openWindow('harbor_app_builder', { x: 60, y: 50 });
      setMessages(prev => [...prev, { role: "system", content: "⚡ H.A.R.B.O.R App Builder activated — Describe any app and AI will code it live with your organisation's data" }]);
      return;
    }

    // Vehicle builder / simulator detection
    const builderMatch = currentCommand.match(/(?:byg\s+(?:en?\s+)?(?:lastbil|skib|fly|tog|k.retøj)|transport(?:bygger|simulator)|simulator|brændstof(?:beregn|simuler)|co2\s+beregn|simuler\s+(?:tur|rute|transport|forbrug)|beregn\s+(?:brændstof|forbrug|co2)|konfigurer\s+(?:lastbil|skib|fly|tog)|build\s+(?:truck|ship|aircraft|train)|vehicle\s+builder|vehicle\s+simulator)/i);
    if (builderMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      openWindow('vehicle_builder', { x: 80, y: 60 });
      setMessages(prev => [...prev, { role: "system", content: "🔧 Transportbygger & Simulator åbnet — Konfigurer dit køretøj trin for trin og kør avanceret brændstof- og CO₂-simulering" }]);
      return;
    }

    // 3D model viewer detection
    const viewer3DMatch = currentCommand.match(/(?:vis\s+3d|3d\s+model|3d\s+viewer|show\s+3d|fleet\s+3d|lastbil\s+3d|truck\s+3d|skib\s+3d|drone\s+3d|fly\s+3d|vis\s+k.retøj|vis\s+lastbil|vis\s+skib|volvo|scania|mercedes\s+actros|man\s+tgx|daf\s+xf|containerskib|tankskib|cargo\s+drone|fragtfly)/i);
    if (viewer3DMatch) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      openWindow('fleet_3d_viewer', { x: 60, y: 50 });
      setMessages(prev => [...prev, { role: "system", content: "🚛 Fleet 3D Viewer åbnet — Udforsk realistiske 3D-modeller af lastbiler (Volvo, Scania, Mercedes, MAN, DAF), containerskibe, tankskibe, cargo droner og fragtfly. Klik og træk for at rotere!" }]);
      return;
    }

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

    // Deep analysis detection - removed, handled by mistral AI

    setCommandHistory(prev => [...prev, currentCommand]);
    setHistoryIndex(-1);
    base44.analytics.track({ eventName: "fleet_ai_command_sent", properties: { command_length: currentCommand.length, has_files: uploadedFiles.length > 0 } });

    setParallelProcessorTasks(prev => [...prev, currentCommand]);
    setMessages(prev => [...prev, { role: "user", content: currentCommand, files: uploadedFiles.length > 0 ? uploadedFiles : undefined }]);
    const currentFiles = [...uploadedFiles];
    setInput("");
    setUploadedFiles([]);
    setIsProcessing(true);

    // ── Use H.A.R.B.O.R. Intellect Agent ──────────────────────────────────
    const conv = intellectConversationRef.current;
    if (!conv) {
      setMessages(prev => [...prev, { role: "system", content: "⚠️ H.A.R.B.O.R. not ready — please retry" }]);
      setIsProcessing(false);
      return;
    }

    // Inject org context if first command
    const isFirstCmd = messages.filter(m => m.role === 'user').length === 0;
    if (isFirstCmd && orgId) {
      base44.agents.addMessage(conv, {
        role: 'system',
        content: `SYSTEM CONTEXT: The user's organization_id is "${orgId}". ALWAYS filter all entity queries by organization_id = "${orgId}". Never show data from other organizations.`
      }).catch(() => {});
    }

    // Subscribe to stream response back into IntellectMode messages
    intellectUnsubRef.current?.();
    let processingDone = false;
    intellectUnsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
      const agentMsgs = (data.messages || []).filter(m => m.role !== 'system');
      const lastMsg = agentMsgs[agentMsgs.length - 1];
      if (!lastMsg || lastMsg.role !== 'assistant') return;

      setMessages(prev => {
        const withoutPending = prev.filter(m => !m.streaming && m.content !== '⚡ H.A.R.B.O.R analyzing...');
        const last = withoutPending[withoutPending.length - 1];
        if (last?.role === 'assistant') {
          return [...withoutPending.slice(0, -1), { role: 'assistant', content: lastMsg.content }];
        }
        return [...withoutPending, { role: 'assistant', content: lastMsg.content }];
      });

      if (!processingDone) {
        processingDone = true;
        setIsProcessing(false);
      }
    });

    setMessages(prev => [...prev, { role: "system", content: "⚡ H.A.R.B.O.R analyzing..." }]);

    await base44.agents.addMessage(conv, {
      role: 'user',
      content: currentCommand,
      ...(currentFiles.length > 0 && { file_urls: currentFiles.map(f => f.url) })
    });

    // Track billing
    try {
      const user = await base44.auth.me();
      base44.entities.APIUsage.create({ organization_id: orgId || user.id, endpoint: '/functions/harborIntellectAPI', method: 'POST', status_code: 200, response_time_ms: 0, ip_address: 'internal' }).catch(() => {});
      base44.entities.FleetAIUsage.create({ organization_id: orgId, user_email: user.email, command: currentCommand, action: 'HARBOR_INTELLECT', success: true }).catch(() => {});
    } catch {}
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null;

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
           onShow3DGlobe={() => setShow3DVisualization({ vehicles, routes, resources })}
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

          {/* Fleet AI Trainer */}
          {showFleetAITrainer && (
            <HologramWindow id="fleet-ai-trainer" title="Fleet AI Trainer" icon={Zap} position={{ x: 100, y: 80 }}
              onClose={() => setShowFleetAITrainer(false)} onMinimize={() => toggleMinimize('fleet-ai-trainer')}
              isMinimized={minimizedWindows.has('fleet-ai-trainer')} windowType="fleet_ai_trainer"
              isFocused={focusedWindow === 'fleet-ai-trainer'} onFocus={setFocusedWindow}>
              <FleetAITrainer onClose={() => setShowFleetAITrainer(false)} />
            </HologramWindow>
          )}

          {/* 3D Fleet Globe */}
          {show3DVisualization && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            >
              <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button
                  onClick={() => setShow3DVisualization(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all font-semibold flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close 3D View
                </button>
              </div>
              <DashboardGlobeFrame
                vehicles={show3DVisualization.vehicles || vehicles}
                routes={show3DVisualization.routes || routes}
                resources={show3DVisualization.resources || resources}
                digitalTwins={[]}
                orgId={orgId}
                onSelectVehicle={() => {}}
                onSelectResource={() => {}}
                className="w-full h-full"
              />
            </motion.div>
          )}

          {/* AI Thinking Terminal */}
          <ThinkingTerminalVisual isActive={showThinkingTerminal && isProcessing} logs={thinkingLogs} onClose={() => setShowThinkingTerminal(false)} />

          {/* Standby */}
          {activeWindows.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              {/* Enhanced background effects */}
               <div className="absolute inset-0 pointer-events-none">
                 {/* Ambient glow orbs */}
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

                 {/* Floating stars */}
                 {[...Array(8)].map((_, i) => (
                   <motion.div
                     key={`star-${i}`}
                     className="absolute w-1 h-1 rounded-full"
                     animate={{
                       y: [0, -100, 0],
                       x: [0, Math.cos((i / 8) * Math.PI * 2) * 50, 0],
                       opacity: [0.3, 1, 0.3],
                     }}
                     transition={{
                       duration: 6 + i,
                       repeat: Infinity,
                       ease: "easeInOut",
                     }}
                     style={{
                       background: i % 2 === 0 ? "#06b6d4" : "#8b5cf6",
                       boxShadow: i % 2 === 0 ? "0 0 10px #06b6d4" : "0 0 10px #8b5cf6",
                       left: `${20 + i * 10}%`,
                       top: `${30 + Math.random() * 40}%`,
                     }}
                   />
                 ))}

                 {/* Gradient light beams */}
                 <motion.div
                   animate={{ rotate: [0, 360] }}
                   transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
                   style={{
                     background: "conic-gradient(from 0deg, rgba(6,182,212,0.1) 0deg, transparent 90deg, rgba(139,92,246,0.1) 180deg, transparent 270deg)",
                   }}
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
                   animate={{ opacity: activeWindows.length === 0 ? 1 : 0, y: activeWindows.length === 0 ? 0 : 20 }}
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
          vehicles={vehicles}
          alerts={alerts}
          routes={routes}
          onNavigate={(page) => navigate(createPageUrl(page))}
          onCloseWindows={() => setActiveWindows([])}
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

      {/* Harbor Super Agent Chat */}
      <AnimatePresence>
        {showHarborAgentChat && (
          <HarborSuperAgentChat onClose={() => setShowHarborAgentChat(false)} />
        )}
      </AnimatePresence>

      {/* Harbor Agent Button */}
      <motion.button
        onClick={() => setShowHarborAgentChat(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-32 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl font-mono font-bold text-xs tracking-widest uppercase transition-all"
        style={{
          background: showHarborAgentChat
            ? "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))"
            : "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))",
          border: "1px solid rgba(6,182,212,0.5)",
          color: "#06b6d4",
          boxShadow: "0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(139,92,246,0.1)"
        }}>
        <Brain className="w-4 h-4" />
        H.A.R.B.O.R Chat
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </motion.button>

      {/* AI Coach */}
      <AICoach openWindows={activeWindows} fleetData={{ vehicles, routes, shipments, alerts }} courseSession={null} userLevel={currentUser?.role === 'admin' ? 4 : 2} performanceHistory={[]} />
    </div>
  );
}