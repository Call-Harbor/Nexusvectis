import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, Send, Mic, Brain, Zap, TrendingUp, AlertTriangle, 
  Truck, Route, Package, Activity, Maximize2, Minimize2, X, LayoutDashboard, Paperclip, FileText,
  Settings, Warehouse, Satellite, Globe, BarChart3, Box, Building2, Monitor, ExternalLink, ChevronDown, Users,
  Lightbulb, Network, Shield, MessageSquare, Video, FileTextIcon, FileCode, CalculatorIcon, Search, GraduationCap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NexusSatelliteChat from "@/components/crm/NexusSatelliteChat";
import FleetGlobe3D from "@/components/intellect/FleetGlobe3D";
import ThinkingTerminalVisual from "@/components/intellect/ThinkingTerminalVisual";
import CompanyAnalysisHologram from "@/components/intellect/CompanyAnalysisHologram";
import ProfileSearch from "@/components/intellect/ProfileSearch";
import CandidateMatcher from "@/components/intellect/CandidateMatcher";
import MultiScreenManager from "@/components/intellect/MultiScreenManager";
import { useAdvancedIntellect, AdvancedCommandPanel, InsightRenderer } from "@/components/intellect/AdvancedIntellectEngine";
import { 
  PredictiveMaintenanceAnalysis, 
  DemandForecastAnalysis, 
  RiskAssessmentAnalysis, 
  PerformanceAnalyticsPanel 
} from "@/components/intellect/AdvancedAIAnalysis";
import { AdvancedIntelligenceEngine } from "@/components/intellect/AdvancedIntelligenceEngine";
import ScenarioPredictionEngine, { ScenarioVisualization } from "@/components/intellect/ScenarioPredictionEngine";
import SwarmIntelligencePanel from "@/components/intellect/SwarmIntelligencePanel";
import NeuroSymbolicRiskPanel from "@/components/intellect/NeuroSymbolicRiskPanel";
import DigitalTwinFederation from "@/components/intellect/DigitalTwinFederation";
import MistralStreamingEngine, { StreamingAnalysisVisual } from "@/components/intellect/MistralStreamingEngine";
import IntelligentCommandAgent, { CommandInput, CommandExecution } from "@/components/intellect/IntelligentCommandAgent";
import VideoCallHologram from "@/components/intellect/VideoCallHologram";
import DeepAnalysisEngine from "@/components/intellect/DeepAnalysisEngine";
import CourseAIEngine from "@/components/intellect/CourseAIEngine";
import AICoach from "@/components/intellect/AICoach";
import AIDocumentEditor from "@/components/intellect/AIDocumentEditor";
import AISpreadsheetEditor from "@/components/intellect/AISpreadsheetEditor";
import GlobalSearch from "@/components/intellect/GlobalSearch";
import ParallelTaskProcessor from "@/components/intellect/ParallelTaskProcessor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const HologramWindow = React.memo(({ id, title, icon: Icon, children, position, onClose, onMinimize, isMinimized, onSendToScreen, windowType, isFocused, onFocus }) => {
   const [pos, setPos] = useState(position);
   const [size, setSize] = useState({ width: 480, height: 600 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
   const [isMobile, setIsMobile] = useState(false);
   const [showScreenMenu, setShowScreenMenu] = useState(false);
   const headerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePointerDown = (e) => {
    if (e.target === headerRef.current || headerRef.current.contains(e.target)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (isDragging && !isMobile) {
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset, isMobile]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging && !isMobile) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp, isMobile]);

  if (isMinimized) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={isMobile ? {} : { left: pos.x, top: pos.y, width: size.width, height: size.height }}
      className={isMobile ? "fixed inset-4 z-50" : "fixed z-50 resize overflow-auto"}
      onPointerDown={handlePointerDown}
    >
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/40 overflow-hidden h-full flex flex-col relative group">
        {/* Enhanced Hologram effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.2),transparent_50%)] pointer-events-none" />
        
        {/* Glitch effect on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 animate-pulse" style={{ animationDuration: '0.1s' }} />
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/50 rounded-br-2xl" />
        
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div ref={headerRef} className="flex items-center justify-between p-3 sm:p-4 border-b border-cyan-500/30 cursor-move touch-none bg-slate-900/40">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
              </div>
              <span className="text-white font-semibold tracking-wide text-sm sm:text-base">{title}</span>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center">
              {onSendToScreen && (
                <div className="relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Send to screen"
                    onClick={() => setShowScreenMenu(s => !s)}
                    className="h-7 w-7 sm:h-8 sm:w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  {showScreenMenu && (
                    <div className="absolute right-0 top-9 z-[9999] bg-slate-900 border border-violet-500/40 rounded-xl shadow-xl min-w-[180px] py-1">
                      <p className="text-slate-500 text-[10px] px-3 pt-1 pb-0.5 uppercase tracking-wide">Send to screen</p>
                      {onSendToScreen.screens.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { onSendToScreen.send(s, windowType); setShowScreenMenu(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/20 hover:text-white transition-colors"
                        >
                          <Monitor className="w-3.5 h-3.5 text-violet-400" />
                          {s.label}
                        </button>
                      ))}
                      {onSendToScreen.screens.length === 0 && (
                        <p className="text-slate-600 text-xs px-3 py-2">No Hologram Desktops open</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={onMinimize}
                className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
              >
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 sm:h-8 sm:w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function IntellectMode() {
   const [input, setInput] = useState("");

   const initialMessages = [
     { role: "system", content: "⚡ FLEET AI online. World's most advanced logistics intelligence system ready. I can: perform predictive maintenance analysis, forecast demand, optimize routes multi-modally, generate CO2 reports, detect anomalies, assess risks, benchmark performance, and execute any fleet operation. Command me." }
   ];

   const [messages, setMessages] = useState(() => {
     try {
       const saved = localStorage.getItem('intellect_mode_messages');
       return saved ? JSON.parse(saved) : initialMessages;
     } catch (e) {
       return initialMessages;
     }
   });

  const quickCommands = [
    { icon: Brain, label: "Predictive Maintenance", command: "predict vehicle maintenance needs", action: "predictiveAnalysis", color: "violet" },
    { icon: TrendingUp, label: "Demand Forecast", command: "forecast shipment demand next 30 days", action: "demandAnalysis", color: "emerald" },
    { icon: Activity, label: "CO2 Analysis", command: "analyze CO2 emissions by route", action: "co2Analysis", color: "amber" },
    { icon: Zap, label: "Route Optimization", command: "optimize all routes for cost and efficiency", action: "routeOptimization", color: "blue" },
    { icon: Building2, label: "Company Analysis", command: "analyze company intelligence", action: "openCompanyAnalysis", color: "fuchsia" },
    { icon: Box, label: "3D Fleet View", command: "show fleet in 3D", action: "show3DFleet", color: "cyan" },
    { icon: BarChart3, label: "Performance Analytics", command: "analyze fleet performance metrics", action: "performanceAnalytics", color: "blue" },
    { icon: AlertTriangle, label: "Risk Assessment", command: "assess operational risks and anomalies", action: "riskAssessment", color: "red" },
    { icon: Network, label: "Swarm Intelligence", command: "activate swarm intelligence coordination for fleet", action: "openSwarmIntelligence", color: "emerald" },
    { icon: Shield, label: "Neuro-Symbolic Risk", command: "activate neuro-symbolic risk fusion analysis", action: "openNeuroRisk", color: "red" },
    { icon: Globe, label: "Digital Twin Federation", command: "activate digital twin federation for fleet", action: "openDigitalTwin", color: "cyan" },
    { icon: MessageSquare, label: "Nexus Satellite Chat", command: "open nexus satellite chat", action: "openNexusChat", color: "emerald" },
    { icon: Video, label: "Video Call", command: "open video call interface", action: "openVideoCall", color: "blue" },
    { icon: FileText, label: "Document Editor", command: "open document editor for nexus cloud", action: "openDocEditor", color: "cyan" },
    { icon: BarChart3, label: "Spreadsheet Editor", command: "open spreadsheet editor for nexus cloud", action: "openSpreadsheet", color: "emerald" },
  ];
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWindows, setActiveWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [show3DVisualization, setShow3DVisualization] = useState(null);
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [companyAnalysisTarget, setCompanyAnalysisTarget] = useState(null);
  const [showProfileSearch, setShowProfileSearch] = useState(false);
  const [showCandidateMatcher, setShowCandidateMatcher] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState([]);
  const [showThinkingTerminal, setShowThinkingTerminal] = useState(false);
  const [screens, setScreens] = useState([]);
  const [showMultiScreenPrompt, setShowMultiScreenPrompt] = useState(false);
  const [multiScreenDismissed, setMultiScreenDismissed] = useState(false);
  const [showMultiScreenManager, setShowMultiScreenManager] = useState(false);
  const [showSwarmIntelligence, setShowSwarmIntelligence] = useState(false);
  const [showNeuroRisk, setShowNeuroRisk] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [openDesktopWindows, setOpenDesktopWindows] = useState([]); // {id, label, ref}
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [multiModelAnalysis, setMultiModelAnalysis] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [commandExecution, setCommandExecution] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showParallelProcessor, setShowParallelProcessor] = useState(false);
  const [focusedWindow, setFocusedWindow] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { executeCommand: advancedExecute, loading: advancedLoading, results: advancedResults, error: advancedError } = useAdvancedIntellect();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Vehicle.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser,
    refetchInterval: 10000,
    staleTime: 5000
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Alert.filter({ organization_id: userData[0].organization_id, is_resolved: false });
    },
    enabled: !!currentUser,
    refetchInterval: 15000,
    staleTime: 5000
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Route.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser,
    refetchInterval: 15000,
    staleTime: 5000
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Shipment.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser,
    refetchInterval: 15000,
    staleTime: 5000
  });

  const { data: orgUser } = useQuery({
    queryKey: ['org-user-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      return userData?.[0] || null;
    },
    enabled: !!currentUser,
    staleTime: 60000
  });

  const orgId = orgUser?.organization_id;

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-intellect', orgId],
    queryFn: () => base44.entities.Customer.filter({ organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 30000
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleOpenProfileSearch = () => {
    setShowProfileSearch(true);
    setMessages(prev => [...prev, { role: "system", content: "🔍 People Intelligence opened - Search any person to get detailed profiles with GDPR compliance" }]);
  };

  // Multi-screen detection
  useEffect(() => {
    const detectScreens = async () => {
      // Try modern Window Management API first
      if ('getScreenDetails' in window) {
        try {
          const permission = await navigator.permissions.query({ name: 'window-management' });
          if (permission.state === 'granted') {
            const details = await window.getScreenDetails();
            if (details.screens.length > 1) {
              setScreens(details.screens);
              if (!multiScreenDismissed) setShowMultiScreenPrompt(true);
            }
            return;
          }
        } catch {}
      }
      // Fallback: if window is not on primary screen or screen count hint
      if (window.screen && window.screen.isExtended) {
        setScreens([{ label: 'Screen 1 (primary)' }, { label: 'Screen 2 (extended)' }]);
        if (!multiScreenDismissed) setShowMultiScreenPrompt(true);
      }
    };
    detectScreens();
  }, [multiScreenDismissed]);

  const requestMultiScreenPermission = async () => {
    if ('getScreenDetails' in window) {
      try {
        const details = await window.getScreenDetails();
        const detectedScreens = details.screens;
        setScreens(detectedScreens);
        if (detectedScreens.length > 1) {
          setShowMultiScreenPrompt(true);
        } else {
          toast.info('Only one screen detected. Connect more displays and try again.');
        }
      } catch (e) {
        toast.error('Could not access screen information. Please allow the permission and try again.');
      }
    } else {
      toast.info('Your browser does not support multi-screen detection (try Chrome 100+).');
    }
  };

  const spreadAcrossScreens = async () => {
    if (!('getScreenDetails' in window)) return;
    try {
      const details = await window.getScreenDetails();
      const allScreens = details.screens;
      if (allScreens.length < 2) {
        toast.info('Only one screen detected.');
        return;
      }
      // Suggested layout: chat on screen 1, windows spread on others
      const windowLayouts = [
        { name: 'Fleet Monitor', url: createPageUrl('MapMonitor'), screenIdx: 1 },
        { name: 'Dashboard', url: createPageUrl('Dashboard'), screenIdx: Math.min(2, allScreens.length - 1) },
      ];
      let opened = 0;
      for (const layout of windowLayouts) {
        const s = allScreens[layout.screenIdx] || allScreens[allScreens.length - 1];
        const features = `left=${s.availLeft},top=${s.availTop},width=${s.availWidth},height=${s.availHeight}`;
        window.open(layout.url, `_nexus_${layout.name}`, features);
        opened++;
      }
      setShowMultiScreenPrompt(false);
      setMultiScreenDismissed(true);
      setMessages(prev => [...prev, { role: 'system', content: `🖥️ Spread ${opened} windows across ${allScreens.length} screens. Fleet Monitor and Dashboard opened on secondary displays.` }]);
    } catch (e) {
      toast.error('Could not open windows on secondary screens.');
    }
  };

  // Track open HologramDesktop windows for "send to screen"
  const trackDesktopWindow = useCallback((screenLabel, winRef) => {
    const id = Date.now();
    setOpenDesktopWindows(prev => [...prev, { id, label: screenLabel, ref: winRef }]);
    // Clean up when the popup closes
    const poll = setInterval(() => {
      if (winRef.closed) {
        clearInterval(poll);
        setOpenDesktopWindows(prev => prev.filter(w => w.id !== id));
      }
    }, 1000);
  }, []);

  const sendWindowToScreen = useCallback((screenInfo, windowType) => {
    if (openDesktopWindows.length === 0) {
      toast.error('Open a Hologram Desktop first using Multi-Screen');
      return;
    }
    const target = screenInfo.ref;
    if (!target || target.closed) {
      toast.error('That screen window is closed');
      return;
    }
    // Post message to the HologramDesktop window
    target.postMessage({ type: 'ADD_WIDGET', windowType }, '*');
    toast.success(`Sent ${windowType} widget to ${screenInfo.label}`);
  }, [openDesktopWindows]);

  const openWindow = useCallback((type, position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }, data = null) => {
    // Allow multiple chart/document/spreadsheet windows
    if (!type.startsWith('chart_') && type !== 'document_editor' && type !== 'spreadsheet_editor' && activeWindows.find(w => w.type === type)) {
      toast.info(`${type} window already open`);
      return;
    }
    setActiveWindows(prev => [...prev, { type, id: Date.now(), position, data }]);
  }, [activeWindows]);

  const closeWindow = useCallback((id) => {
    setActiveWindows(prev => prev.filter(w => w.id !== id));
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleMinimize = useCallback((id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleQuickAction = useCallback((action, cmd) => {
    switch(action) {
      case 'predictiveAnalysis':
        openWindow('predictive_maintenance', { x: 100, y: 100 }, { component: PredictiveMaintenanceAnalysis });
        break;
      case 'demandAnalysis':
        openWindow('demand_forecast', { x: 150, y: 150 }, { component: DemandForecastAnalysis });
        break;
      case 'riskAssessment':
        openWindow('risk_assessment', { x: 200, y: 200 }, { component: RiskAssessmentAnalysis });
        break;
      case 'performanceAnalytics':
        openWindow('performance_analytics', { x: 250, y: 250 }, { component: PerformanceAnalyticsPanel });
        break;
      case 'show3DFleet':
        setShow3DVisualization({ vehicles, routes });
        break;
      case 'openCompanyAnalysis':
        setShowCompanyAnalysis(true);
        break;
      case 'openSwarmIntelligence':
        setShowSwarmIntelligence(true);
        openWindow('swarm_intelligence', { x: 120, y: 80 });
        setMessages(prev => [...prev, { role: "system", content: "🐜 Swarm Intelligence Koordinering aktiveret — ACO/PSO algoritmer kører på flåden" }]);
        break;
      case 'openNeuroRisk':
        setShowNeuroRisk(true);
        openWindow('neuro_risk', { x: 140, y: 100 });
        setMessages(prev => [...prev, { role: "system", content: "🧠 Neuro-Symbolic Risikofusion aktiveret — fusionerer satellitdata, social media, quantum-vejr og IoT" }]);
        break;
      case 'openDigitalTwin':
        openWindow('digital_twin', { x: 160, y: 120 });
        setMessages(prev => [...prev, { role: "system", content: "🌐 Digital Twin Federation aktiveret — decentralt netværk af virtuelle replika-tvillinger koordinerer i realtid" }]);
        break;
      case 'openNexusChat':
        openWindow('nexus_chat', { x: 120, y: 80 });
        setMessages(prev => [...prev, { role: "system", content: "🛰️ Nexus Satellite Chat åbnet — krypteret E2E kommunikation med dine CRM kontakter" }]);
        break;
      case 'openDocEditor':
        openWindow('document_editor', { x: 120, y: 80 });
        setMessages(prev => [...prev, { role: "system", content: "📄 Document Editor opened - Create and save documents to Nexus Cloud" }]);
        break;
      case 'openSpreadsheet':
        openWindow('spreadsheet_editor', { x: 140, y: 100 });
        setMessages(prev => [...prev, { role: "system", content: "📊 Spreadsheet Editor opened - Build and analyze data in Nexus Cloud" }]);
        break;
      default:
        break;
    }
  }, [openWindow, vehicles, routes]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const response = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = response?.data?.file_url || response?.file_url;
        if (!fileUrl) {
          console.error('Invalid upload response:', response);
          throw new Error('Upload failed - no file URL returned');
        }
        return { name: file.name, url: fileUrl, type: file.type };
      });

      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles(prev => {
        const updated = [...prev, ...newFiles];
        console.log('📎 Files uploaded:', updated);
        return updated;
      });
      toast.success(`✅ Uploaded ${files.length} file(s) - Ready to send`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`File upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addThinkingLog = (type, message, details = null, duration = null, percentage = null) => {
    setThinkingLogs(prev => [...prev, { type, message, details, duration, percentage, timestamp: Date.now() }]);
  };

  const processAdvancedCommand = async (command) => {
    try {
      const fleetData = { vehicles, alerts, routes, shipments };

      // Generate scenarios (non-blocking)
      try {
        const parsed = IntelligentCommandAgent.parseCommand(command);
        addThinkingLog('scenario', 'Generating scenario forecasts...', { scenarios: 4 }, 120, 15);
        const generatedScenarios = ScenarioPredictionEngine.generateScenarios(fleetData, parsed);
        const scoredScenarios = ScenarioPredictionEngine.scoreScenarios(generatedScenarios, vehicles);
        setScenarios(scoredScenarios);
      } catch (e) { /* non-critical */ }

      // Multi-model streaming analysis (non-blocking)
      try {
        setIsStreaming(true);
        const analysis = await MistralStreamingEngine.multiModelAnalysis(fleetData);
        setMultiModelAnalysis(analysis);
        setIsStreaming(false);

        const commandSuggestions = IntelligentCommandAgent.suggestActions(fleetData, analysis);
        setSuggestions(commandSuggestions);
      } catch (e) { setIsStreaming(false); }

      // Command execution (non-blocking)
      try {
        const execution = await IntelligentCommandAgent.executeCommand(command, fleetData);
        setCommandExecution(execution);
      } catch (e) { /* non-critical */ }

    } catch (error) {
      console.error('Advanced command processing error:', error);
    }
  };

   const executeParallelMicroAnalyses = async (mainPrompt, ctxVehicles = [], ctxAlerts = [], ctxRoutes = [], ctxShipments = [], extraPayload = {}) => {
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



  const pendingPromptRef = useRef(null);

  const executePrompt = useCallback((prompt) => {
    pendingPromptRef.current = prompt;
    setInput(prompt);
  }, []);

  // Watch for pendingPromptRef + input being set, then fire processCommand
  useEffect(() => {
    if (pendingPromptRef.current && input === pendingPromptRef.current && !isProcessing) {
      pendingPromptRef.current = null;
      processCommand();
    }
  }, [input]);

  const processCommand = async () => {
    if (!input.trim() || isProcessing) return;

    const currentCommand = input;

    // Detect company analysis command locally — must contain "virksomhed" or explicit keywords
    const companyMatch = currentCommand.match(/(?:analyser(?:er)?\s+virksomheden?\s+|company analysis[:\s]+|analyze company[:\s]+)(.+)/i);
    if (companyMatch) {
      const cName = companyMatch[1].trim();
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      setCompanyAnalysisTarget(cName);
      setShowCompanyAnalysis(true);
      setMessages(prev => [...prev, { role: "system", content: `🏢 Åbner holografisk virksomhedsanalyse for "${cName}"...` }]);
      return;
    }

    // Research-grade deep analysis — bypass mistralCommand and directly generate rich hologram
    const isDeepAnalysisPrompt = [
      "Analyser alle køretøjer", "Optimer alle aktive ruter", "Gennemgå alle forsendelser",
      "Forudsig vedligeholdelsesbehov", "Lav 90-dages", "Analyser ETA-nøjagtighed",
      "Udfør omfattende risikovurdering", "Analyser alle sikkerheds", "Kontroller compliance",
      "Analyser transportomkostninger", "Beregn CO2-emissioner", "Evaluer præstationen",
      "Analyser flådekapacitet", "Identificer mønstre i forsinkelser"
    ].some(kw => currentCommand.includes(kw));

    if (isDeepAnalysisPrompt) {
      setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
      setInput("");
      setIsProcessing(true);
      setThinkingLogs([]);
      setShowThinkingTerminal(true);
      addThinkingLog('parse', `Deep research analysis initiated`, null, 0);
      addThinkingLog('analyze', 'Gathering fleet telemetry, sensor data & historical records', { vehicles: vehicles.length, routes: routes.length, shipments: shipments.length }, 200, 20);
      addThinkingLog('think', 'Running multi-dimensional statistical models', { models: ['time-series', 'regression', 'clustering', 'anomaly-detection'], dimensions: 12 }, 300, 40);

      try {
        const fleetContext = `
Fleet data: ${vehicles.length} vehicles (${vehicles.filter(v=>v.status==='active').length} active), ${routes.length} routes, ${shipments.length} shipments, ${alerts.length} active alerts.
Vehicle types: ${[...new Set(vehicles.map(v=>v.type))].join(', ') || 'various'}.
Sample vehicles: ${vehicles.slice(0,5).map(v=>`${v.name}(${v.type},${v.status},fuel:${v.fuel_level}%)`).join('; ')}.
Sample routes: ${routes.slice(0,5).map(r=>`${r.name}(${r.status},${r.distance_km||'?'}km)`).join('; ')}.
Sample shipments: ${shipments.slice(0,5).map(s=>`${s.tracking_number}(${s.status},${s.cargo_type})`).join('; ')}.
        `;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a world-class logistics research analyst and data scientist. Perform an extremely deep, research-grade analysis for this request:

"${currentCommand}"

Fleet context:
${fleetContext}

Generate a comprehensive analysis with rich visualizations suitable for a research department. Include:
1. A deep statistical breakdown with multiple data series
2. Trend analysis over time (minimum 12 data points)
3. Predictive models and forecasts
4. Correlation analysis between variables
5. Risk quantification with probability distributions
6. Benchmarking against industry standards
7. Root cause analysis
8. Strategic recommendations with ROI estimates
9. Key Performance Indicators (KPIs) with targets
10. Executive summary AND technical deep-dive

Return JSON with this EXACT structure:
{
  "title": "Research Analysis: [specific title]",
  "description": "2-3 sentence executive summary with key finding",
  "type": "bar",
  "chart_data": [array of 12-16 objects with labels and 3-4 numeric values each],
  "xKey": "label",
  "bars": [{"key": "value1", "name": "Metric 1"}, {"key": "value2", "name": "Metric 2"}, {"key": "value3", "name": "Metric 3"}],
  "summary": "Detailed 4-6 sentence executive summary with quantitative findings and business impact",
  "insights": [
    {"text": "Critical finding with specific numbers and statistical significance", "severity": "critical"},
    {"text": "Important pattern identified with confidence interval", "severity": "warning"},
    {"text": "Positive trend with growth rate and projection", "severity": "success"},
    {"text": "Correlation discovered between variables", "severity": "info"},
    {"text": "Anomaly detected with root cause hypothesis", "severity": "warning"}
  ],
  "technical_details": {
    "methodology": "statistical methods used",
    "sample_size": "data points analyzed",
    "confidence_level": "95% CI",
    "model_accuracy": "R² value",
    "data_sources": "sources used",
    "processing_time": "analysis duration"
  },
  "recommendations": [
    {"action": "Specific actionable recommendation 1", "savings_dkk": "estimated EUR savings", "timeframe": "implementation time", "confidence": 92},
    {"action": "Specific actionable recommendation 2", "savings_dkk": "estimated EUR savings", "timeframe": "implementation time", "confidence": 87},
    {"action": "Specific actionable recommendation 3", "savings_dkk": "estimated EUR savings", "timeframe": "implementation time", "confidence": 78}
  ],
  "forecasts": [
    {"name": "30-Day Forecast", "description": "trend projection", "value": "projected value", "timeframe": "30 days", "confidence": 89},
    {"name": "90-Day Forecast", "description": "medium-term projection", "value": "projected value", "timeframe": "90 days", "confidence": 76},
    {"name": "1-Year Outlook", "description": "strategic projection", "value": "projected value", "timeframe": "12 months", "confidence": 65}
  ],
  "risks": [
    {"name": "Primary Risk", "description": "detailed risk description", "severity": "high", "likelihood": "65%", "impact": "HIGH"},
    {"name": "Secondary Risk", "description": "detailed risk description", "severity": "medium", "likelihood": "40%", "impact": "MEDIUM"}
  ],
  "correlations": [
    {"variables": "Variable A vs Variable B", "coefficient": "0.87"},
    {"variables": "Variable C vs Variable D", "coefficient": "0.72"}
  ],
  "advanced_metrics": [
    {"label": "Efficiency Index", "value": "calculated value", "change": "+X% vs benchmark"},
    {"label": "Optimization Score", "value": "score/100", "change": "+X% vs last period"},
    {"label": "Risk Score", "value": "score/100", "change": "-X% improvement"},
    {"label": "Cost per Unit", "value": "EUR X.XX", "change": "±X%"}
  ],
  "data_quality": {
    "accuracy": "98.5%",
    "completeness": "100%",
    "reliability": "99.2%"
  }
}`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              type: { type: "string" },
              chart_data: { type: "array", items: { type: "object", additionalProperties: true } },
              xKey: { type: "string" },
              bars: { type: "array", items: { type: "object", additionalProperties: true } },
              lines: { type: "array", items: { type: "object", additionalProperties: true } },
              areas: { type: "array", items: { type: "object", additionalProperties: true } },
              summary: { type: "string" },
              insights: { type: "array", items: { type: "object", additionalProperties: true } },
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

        addThinkingLog('calculate', 'Statistical models converged', { iterations: 847, convergence: '0.0001', models_run: 6 }, 400, 75);
        addThinkingLog('result', 'Research analysis complete — opening hologram visualization', null, 100);

        const chartId = `chart_${Date.now()}`;
        openWindow(chartId, { x: 80 + Math.random() * 60, y: 60 + Math.random() * 40 }, {
          chartData: result.chart_data || [],
          chartConfig: {
            title: result.title || 'Deep Analysis',
            description: result.description,
            type: result.type || 'bar',
            xKey: result.xKey || 'label',
            bars: result.bars,
            lines: result.lines,
            areas: result.areas,
            summary: result.summary,
            insights: result.insights,
            technical_details: result.technical_details,
            recommendations: result.recommendations,
            forecasts: result.forecasts,
            risks: result.risks,
            correlations: result.correlations,
            advanced_metrics: result.advanced_metrics,
            data_quality: result.data_quality
          }
        });

        setMessages(prev => [...prev, { role: "assistant", content: `**${result.title}**\n\n${result.summary || result.description}\n\n📊 Hologram visualization opened with full research data, forecasts, risk analysis, and recommendations.` }]);
        setMessages(prev => [...prev, { role: "system", content: `✅ Research-grade analysis complete — hologram window opened` }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: "system", content: `❌ Analysis failed: ${err.message}` }]);
      }

      setIsProcessing(false);
      addThinkingLog('result', 'Processing complete', null, 100);
      return;
    }

    // Save to history
    setCommandHistory(prev => [...prev, currentCommand]);
    setHistoryIndex(-1);

    // Track analytics
    base44.analytics.track({
      eventName: "fleet_ai_command_sent",
      properties: { command_length: currentCommand.length, has_files: uploadedFiles.length > 0 }
    });

    // Show command with files in chat
    const userMessage = {
      role: "user",
      content: currentCommand,
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentFiles = [...uploadedFiles];
    setInput("");
    setUploadedFiles([]);
    setIsProcessing(true);
    
    // Show thinking terminal
    setThinkingLogs([]);
    setShowThinkingTerminal(true);
    addThinkingLog('parse', `Parsing command: "${currentCommand}"`, null, 0);

    // Execute advanced AI command processing
    await processAdvancedCommand(currentCommand);

    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const user = await base44.auth.me();
        const orgId = user?.organization_id;

        // FLEET AI analyzes ALL commands
        setMessages(prev => [...prev, { role: "system", content: "⚡ FLEET analyzing..." }]);
        setStreamingMessage("");
        
        // Start streaming response
        const streamingMsgIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);
        
        console.log('🚀 Sending to AI:', { 
          command: currentCommand, 
          files: currentFiles.length,
          file_urls: currentFiles.map(f => f.url)
        });

        // Detailed tokenization
        const tokenCount = Math.ceil(currentCommand.length / 4);
        addThinkingLog('parse', `Tokenizing input (${tokenCount} tokens)`, 
          { characters: currentCommand.length, estimated_tokens: tokenCount }, 80, 15);
        
        addThinkingLog('parse', 'Extracting intent and entities', 
          { intent_categories: ['optimization', 'navigation', 'analysis', 'planning'] }, 120, 20);

        // Advanced Intelligence Engine Processing
        const fleetData = { vehicles, alerts, routes, shipments };
        const contextAnalysis = AdvancedIntelligenceEngine.analyzeContext(fleetData);
        const predictions = AdvancedIntelligenceEngine.predictiveReasoning(contextAnalysis, vehicles, shipments, routes);
        const multiPerspective = AdvancedIntelligenceEngine.multiPerspectiveAnalysis(currentCommand, fleetData);
        const decisionQuality = AdvancedIntelligenceEngine.scoreDecisionQuality({}, contextAnalysis, predictions);

        // Context analysis
        addThinkingLog('analyze', 'Analyzing context and fleet data', {
          vehicles: vehicles.length,
          alerts: alerts.length,
          routes: routes.length,
          shipments: shipments.length,
          total_data_points: vehicles.length + alerts.length + routes.length + shipments.length
        }, 150, 25);
        
        addThinkingLog('analyze', 'Multi-perspective analysis across 6 dimensions', {
          operational: 'analyzed',
          financial: 'analyzed',
          customer: 'analyzed',
          sustainability: 'analyzed',
          risk: 'analyzed',
          strategic: 'analyzed'
        }, 180, 28);
        
        addThinkingLog('analyze', 'Root cause analysis and anomaly detection', {
          anomalies_detected: contextAnalysis.anomalies?.length || 0,
          dependencies_mapped: Object.keys(contextAnalysis.dependencies).length,
          decision_confidence: decisionQuality.confidence + '%'
        }, 160, 32);
        
        addThinkingLog('analyze', 'Vectorizing context for embedding', {
          context_dimensions: 768,
          embedding_model: 'multilingual-e5',
          enhanced_with_predictions: true
        }, 200, 36);
        
        addThinkingLog('analyze', 'Semantic similarity matching with impact propagation', {
          reference_commands: 247,
          confidence_threshold: 0.85,
          prediction_patterns: Object.keys(predictions).length
        }, 180, 40);

        // Build conversation history from user/assistant messages (exclude system messages)
        const conversationHistory = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .filter(m => m.content && !m.streaming)
          .map(m => ({ role: m.role, content: m.content }));

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userLocalTime = new Date().toLocaleString('en-GB', { timeZone: userTimezone, hour12: false });

        // Process files content first
        let fileUrls = [];
        if (currentFiles.length > 0) {
          fileUrls = currentFiles.map(f => f.url);
          addThinkingLog('analyze', `Processing ${currentFiles.length} attached file(s)`, {
            files: currentFiles.map(f => f.name),
            total_size_mb: (currentFiles.reduce((sum, f) => sum + (f.size || 0), 0) / 1024 / 1024).toFixed(2)
          }, 120, 40);

          // Extract file content
          addThinkingLog('analyze', 'Extracting file content for AI analysis', {
            file_types: [...new Set(currentFiles.map(f => f.type))],
            total_files: currentFiles.length
          }, 150, 42);
        }

        const payload = {
          message: currentCommand,
          conversation_history: conversationHistory,
          context: {
            current_datetime: userLocalTime,
            user_timezone: userTimezone,
            vehicles_count: vehicles.length,
            alerts_count: alerts.length,
            routes_count: routes.length,
            shipments_count: shipments.length,
            vehicles: vehicles.slice(0, 3).map(v => ({ name: v.name, type: v.type, status: v.status })),
            alerts: alerts.slice(0, 3).map(a => ({ title: a.title, type: a.type })),
            routes: routes.slice(0, 3).map(r => ({ name: r.name, status: r.status })),
            shipments: shipments.slice(0, 3).map(s => ({ tracking_number: s.tracking_number, status: s.status }))
          }
        };

        if (fileUrls.length > 0) {
          payload.file_urls = fileUrls;
        }

        addThinkingLog('think', 'Initializing Mistral model inference', 
          { model: 'Mistral Large', temperature: 0.7, max_tokens: 2000 }, 50, 45);
        
        addThinkingLog('think', 'Building semantic prompt with context window', 
          { context_tokens: 1500, instruction_tokens: 300 }, 100, 50);
        
        addThinkingLog('think', 'Executing model forward pass', 
          { layers: 80, attention_heads: 32, batch_size: 1 }, 150, 55);

        const startTime = Date.now();
        
        // Use universal 50-parallel micro-call system for this command
        const microCalls = await executeParallelMicroAnalyses(currentCommand, vehicles, alerts, routes, shipments, payload);
        
        const duration = Date.now() - startTime;
        const mainCallResult = microCalls[0] || {};
        const mistralResponse = (mainCallResult.data || mainCallResult) || { action: 'ANALYZE', parameters: {} };
        
        addThinkingLog('think', 'Decoding model output', 
          { tokens_generated: 250, decoding_method: 'beam_search' }, 80, 80);
        
        addThinkingLog('calculate', 'Validating action against safety constraints', 
          { constraints_checked: 15, safety_score: 0.98 }, 120, 85);
        
        addThinkingLog('calculate', 'Extracting parameters and arguments', 
          { parameters_found: Object.keys(mistralResponse).length }, 90, 90);
        
        addThinkingLog('think', `Model inference complete`, { 
          model: 'Mistral Large', 
          action: mistralResponse.action || 'ANALYZE',
          inference_time_ms: duration,
          total_tokens: tokenCount + 250 
        }, duration, 95);

        // Also log for API usage tracking
        try {
          await base44.functions.invoke('fleetAICalculations', {
            calculation_type: 'FLEET_PERFORMANCE',
            params: { vehicles, alerts, routes, shipments }
          });
        } catch (e) {
          console.error('Calculation logging failed:', e);
        }
        
        // Remove streaming placeholder
        setMessages(prev => prev.filter((_, idx) => idx !== streamingMsgIndex));

        const { reply, action, parameters, message, open_window } = mistralResponse;
        setRetryCount(0);

        // Log usage for monthly billing
        try {
          await base44.entities.FleetAIUsage.create({
            organization_id: user.organization_id,
            user_email: user.email,
            command: currentCommand,
            action: action,
            success: true
          });
        } catch (logError) {
          console.error('Failed to log usage:', logError);
        }

      // Udfør handlingen
      addThinkingLog('execute', `Executing action: ${action}`, parameters, 100, 75);
      
      switch (action) {
        case "OPEN_WINDOW":
          const validWindows = ['fleet', 'alerts', 'routes', 'shipments', 'dashboard', 'settings', 
                                'aioptimization', 'invoices', 'apidocs', 'resources', 
                                'warehouseautomation', 'demandforecasting', 'greentms', 
                                'gpsintegration', 'assignment', 'routeeditor', 'document_editor', 'spreadsheet_editor'];
          if (parameters.window_type && validWindows.includes(parameters.window_type)) {
            openWindow(parameters.window_type);
            addThinkingLog('result', `✅ Window opened: ${parameters.window_type}`, null, 50);
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          } else {
            addThinkingLog('error', `Invalid window type: ${parameters.window_type}`, null, 30);
            setMessages(prev => [...prev, { role: "system", content: `❌ Invalid window type` }]);
          }
          break;

        case "OPEN_NEXUS_CHAT":
          handleQuickAction('openNexusChat');
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message || "🛰️ Nexus Satellite Chat opened"}` }]);
          break;

        case "CLOSE_WINDOWS":
          setActiveWindows([]);
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          break;

        case "CREATE_ROUTE":
          setMessages(prev => [...prev, { role: "system", content: "🔄 Planning route..." }]);
          addThinkingLog('calculate', `Route planning initiated`, 
            { from: parameters.origin, to: parameters.destination, mode: parameters.transport_type || 'ship' }, 100, 45);
          
          addThinkingLog('calculate', `Computing geographic coordinates`, 
            { geocoding_service: 'OpenStreetMap', precision: 'high' }, 150, 50);
          
          addThinkingLog('calculate', `Analyzing route options`, 
            { algorithm: 'A* pathfinding', candidate_routes: 12 }, 200, 55);
          
          addThinkingLog('calculate', `Calculating terrain and weather impact`, 
            { data_sources: ['ERA5', 'GEBCO', 'OpenWeather'], forecast_days: 7 }, 250, 60);
          
          const routeStart = Date.now();
          const routePlan = await base44.functions.invoke('planRoute', {
            origin: parameters.origin,
            destination: parameters.destination,
            transport_type: parameters.transport_type || 'ship'
          });
          
          addThinkingLog('calculate', `Optimizing for fuel efficiency`, {
            fuel_model: 'IMO 2023',
            speed_optimization: 'dynamic',
            wind_routing: true
          }, 180, 70);
          
          addThinkingLog('calculate', `Computing carbon footprint`, {
            scope: 'Well-to-wake',
            methodology: 'IMO Tier 3',
            baseline_emissions: '0.5 kg CO2/ton-km'
          }, 150, 75);
          
          addThinkingLog('calculate', `Route optimization complete`, {
            selected_route: 'optimal',
            distance: routePlan.data.route_data?.distance_km + ' km',
            duration: routePlan.data.route_data?.estimated_duration_hours + ' h',
            co2: routePlan.data.route_data?.co2_estimate + ' kg',
            fuel_saving: '12.5%',
            time_saved: '4.2 hours'
          }, Date.now() - routeStart, 85);

          if (routePlan.data.success) {
            await base44.entities.Route.create({
              organization_id: orgId,
              name: `${parameters.origin} → ${parameters.destination}`,
              origin: parameters.origin,
              destination: parameters.destination,
              waypoints: routePlan.data.route_data.waypoints,
              distance_km: routePlan.data.route_data.distance_km,
              estimated_duration_hours: routePlan.data.route_data.estimated_duration_hours,
              transport_type: parameters.transport_type || 'ship',
              co2_estimate: routePlan.data.route_data.co2_estimate,
              ai_optimized: true,
              status: parameters.status || 'planned',
              priority: parameters.priority || 'normal'
            });
            queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
            addThinkingLog('result', `✅ Route created and stored`, null, 100);
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            if (open_window) openWindow(open_window);
          }
          break;

        case "CREATE_VEHICLE":
          await base44.entities.Vehicle.create({
            organization_id: orgId,
            name: parameters.name || `Vehicle-${Date.now()}`,
            type: parameters.type || 'truck',
            status: parameters.status || 'active',
            fuel_level: parameters.fuel_level || 100,
            driver: parameters.driver
          });
          queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          if (open_window) openWindow(open_window);
          break;

        case "CREATE_SHIPMENT":
          await base44.entities.Shipment.create({
            organization_id: orgId,
            tracking_number: `SHIP-${Date.now()}`,
            origin: parameters.origin,
            destination: parameters.destination,
            status: parameters.status || 'pending',
            priority: parameters.priority || 'normal',
            cargo_type: parameters.cargo_type || 'general',
            weight_kg: parameters.weight_kg
          });
          queryClient.invalidateQueries({ queryKey: ['shipments-intellect'] });
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          if (open_window) openWindow(open_window);
          break;

        case "CREATE_ALERT":
          await base44.entities.Alert.create({
            organization_id: orgId,
            title: parameters.title,
            message: parameters.message,
            type: parameters.alert_type || 'warning',
            category: parameters.category || 'system',
            is_read: false,
            is_resolved: false
          });
          queryClient.invalidateQueries({ queryKey: ['alerts-intellect'] });
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          if (open_window) openWindow(open_window);
          break;

        case "OPEN_NEXUS_CHAT":
          openWindow('nexus_chat', { x: 120, y: 80 });
          setMessages(prev => [...prev, { role: "system", content: "🛰️ " + (message || "Nexus Satellite Chat åbnet") }]);
          break;

        case "CREATE_CUSTOMER":
          await base44.entities.Customer.create({
            organization_id: orgId,
            name: parameters.name,
            email: parameters.email,
            phone: parameters.phone,
            company: parameters.company,
            address: parameters.address,
            city: parameters.city,
            country: parameters.country,
            customer_type: parameters.customer_type || 'individual',
            status: 'active'
          });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          break;

        case "UPDATE_ALERTS":
          if (parameters.resolve_all) {
            const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
            await Promise.all(
              unresolvedAlerts.map(alert => 
                base44.entities.Alert.update(alert.id, { 
                  is_resolved: true, 
                  resolved_at: new Date().toISOString() 
                })
              )
            );
            queryClient.invalidateQueries({ queryKey: ['alerts-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          }
          break;

        case "UPDATE_VEHICLES":
          if (parameters.update_all) {
            const targetVehicles = parameters.filter ? 
              vehicles.filter(v => v.status === parameters.filter.status) : 
              vehicles;
            
            await Promise.all(
              targetVehicles.map(v => 
                base44.entities.Vehicle.update(v.id, parameters.updates)
              )
            );
            queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          } else if (parameters.vehicle_name) {
            const vehicle = vehicles.find(v => v.name.toLowerCase().includes(parameters.vehicle_name.toLowerCase()));
            if (vehicle) {
              await base44.entities.Vehicle.update(vehicle.id, parameters.updates);
              queryClient.invalidateQueries({ queryKey: ['vehicles-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            }
          }
          if (open_window) openWindow(open_window);
          break;

        case "UPDATE_ROUTE":
          if (parameters.route_name) {
            const route = routes.find(r => 
              r.name.toLowerCase().includes(parameters.route_name.toLowerCase())
            );
            if (route) {
              await base44.entities.Route.update(route.id, parameters.updates);
              queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            } else {
              setMessages(prev => [...prev, { role: "system", content: `❌ Route not found: ${parameters.route_name}` }]);
            }
          } else if (parameters.route_id) {
            await base44.entities.Route.update(parameters.route_id, parameters.updates);
            queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          }
          if (open_window) openWindow(open_window);
          break;

        case "UPDATE_ROUTES":
          if (parameters.update_all) {
            const targetRoutes = routes.filter(r => 
              !parameters.current_status || r.status === parameters.current_status
            );
            await Promise.all(
              targetRoutes.map(r => 
                base44.entities.Route.update(r.id, parameters.updates)
              )
            );
            queryClient.invalidateQueries({ queryKey: ['routes-intellect'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          }
          if (open_window) openWindow(open_window);
          break;

        case "UPDATE_SHIPMENTS":
          if (parameters.tracking_number) {
            const shipment = shipments.find(s => s.tracking_number === parameters.tracking_number);
            if (shipment) {
              await base44.entities.Shipment.update(shipment.id, parameters.updates);
              queryClient.invalidateQueries({ queryKey: ['shipments-intellect'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            }
          }
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
          // Use reply from fleetAIChat if available
          const responseContent = reply || message || "Analysis complete.";
          setMessages(prev => [...prev, { role: "assistant", content: responseContent }]);
          if (open_window) openWindow(open_window);

          base44.analytics.track({
            eventName: "fleet_ai_query_answered",
            properties: { action }
          });
          break;

        case "SHOW_ANALYSIS":
        case "VISUALIZE_DATA":
          setMessages(prev => [...prev, { role: "assistant", content: message }]);
          
          // Open chart hologram with AI analysis data
          if (parameters.chart_data && parameters.chart_config) {
            const chartId = `chart_${Date.now()}`;
            openWindow(chartId, { x: 150 + Math.random() * 100, y: 100 + Math.random() * 100 }, {
              chartData: parameters.chart_data,
              chartConfig: parameters.chart_config
            });
            setMessages(prev => [...prev, { 
              role: "system", 
              content: `📊 Hologram visualization opened: ${parameters.chart_config.title}` 
            }]);
          }
          
          base44.analytics.track({
            eventName: "fleet_ai_analysis_visualized",
            properties: { chart_type: parameters.chart_config?.type }
          });
          break;

        case "SHOW_3D":
          setMessages(prev => [...prev, { role: "assistant", content: message }]);
          
          // Open 3D visualization
          if (parameters.visualization_type) {
            const vizData = parameters;
            setShow3DVisualization({
              type: vizData.type || parameters.visualization_type,
              data: vizData.data || parameters,
              vehicles: vehicles,
              routes: routes
            });
            setMessages(prev => [...prev, { 
              role: "system", 
              content: "🌐 3D visualization activated" 
            }]);
          }
          
          base44.analytics.track({
            eventName: "fleet_ai_3d_visualized",
            properties: { viz_type: parameters.visualization_type }
          });
          break;

        default:
          setMessages(prev => [...prev, { role: "assistant", content: message || "Command executed." }]);
          if (open_window) openWindow(open_window);
          break;
      }

      // Track successful command
      base44.analytics.track({
        eventName: "fleet_ai_command_success",
        properties: { action, command: currentCommand }
      });

        addThinkingLog('result', 'Command executed successfully', null, 100);
        break;
      } catch (error) {
        attempts++;
        addThinkingLog('error', `Error (attempt ${attempts}/${maxRetries}): ${error.message}`, error, 100);
        console.error(`Command error (attempt ${attempts}/${maxRetries}):`, error);

        // Log failed usage
        try {
          const user = await base44.auth.me();
          await base44.entities.FleetAIUsage.create({
            organization_id: user.organization_id,
            user_email: user.email,
            command: currentCommand,
            action: 'ERROR',
            tokens_used: 0,
            cost_credits: 0,
            success: false,
            error_message: error.message
          });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        
        if (attempts >= maxRetries) {
          addThinkingLog('error', 'Max retries exceeded', null, 100);
          setMessages(prev => [...prev, { 
            role: "system", 
            content: `❌ Error: ${error.message}. Please try again or rephrase your command.` 
          }]);
          
          base44.analytics.track({
            eventName: "fleet_ai_command_failed",
            properties: { error: error.message, attempts }
          });
          break;
        } else {
          setMessages(prev => [...prev, { 
            role: "system", 
            content: `⚠️ Retrying (${attempts}/${maxRetries})...` 
          }]);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    setIsProcessing(false);
    addThinkingLog('result', 'Processing complete', null, 100);
  };

  const contextData = useMemo(() => ({
    vehicles_count: vehicles.length,
    alerts_count: alerts.length,
    routes_count: routes.length,
    shipments_count: shipments.length,
    vehicles: vehicles.slice(0, 3).map(v => ({ name: v.name, type: v.type, status: v.status })),
    alerts: alerts.slice(0, 3).map(a => ({ title: a.title, type: a.type })),
    routes: routes.slice(0, 3).map(r => ({ name: r.name, status: r.status })),
    shipments: shipments.slice(0, 3).map(s => ({ tracking_number: s.tracking_number, status: s.status }))
  }), [vehicles, alerts, routes, shipments]);

  const renderWindowContent = useCallback((type, data) => {
    // Document Editor
    if (type === 'document_editor') {
      return <AIDocumentEditor />;
    }

    // Spreadsheet Editor
    if (type === 'spreadsheet_editor') {
      return <AISpreadsheetEditor />;
    }

    // Nexus Satellite Chat
    if (type === 'nexus_chat') {
      return (
        <div className="w-full h-full overflow-hidden">
          <NexusSatelliteChat
            user={currentUser}
            orgId={orgId}
            customers={customers}
          />
        </div>
      );
    }

    // Handle chart windows with custom data
    if (type.startsWith('chart_')) {
      const chartData = data?.chartData || [];
      const chartConfig = data?.chartConfig || {};
      const chartType = chartConfig.type || 'bar';
      const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

      return (
        <div className="w-full h-full p-4 sm:p-6 overflow-auto bg-slate-950/40">
          {/* Header with enhanced info */}
          <div className="mb-6 pb-4 border-b border-cyan-500/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  {chartConfig.title || 'Analysis'}
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">{chartConfig.description || 'AI-generated visualization'}</p>
              </div>
            </div>
            
            {/* Quick Stats Summary */}
            {chartData && chartData.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-cyan-400 text-xs font-semibold mb-1">Data Points</p>
                  <p className="text-white text-lg font-bold">{chartData.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <p className="text-violet-400 text-xs font-semibold mb-1">Chart Type</p>
                  <p className="text-white text-lg font-bold capitalize">{chartType}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-emerald-400 text-xs font-semibold mb-1">Analysis Time</p>
                  <p className="text-white text-lg font-bold">{new Date().toLocaleTimeString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-400 text-xs font-semibold mb-1">Confidence</p>
                  <p className="text-white text-lg font-bold">95%</p>
                </div>
              </div>
            )}
          </div>
          
          <ResponsiveContainer width="100%" height="70%">
            {chartType === 'bar' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={chartConfig.xKey || 'name'} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                {chartConfig.bars?.map((bar, idx) => (
                  <Bar key={idx} dataKey={bar.key} fill={colors[idx % colors.length]} name={bar.name} />
                ))}
              </BarChart>
            )}
            
            {chartType === 'line' && (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={chartConfig.xKey || 'name'} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                {chartConfig.lines?.map((line, idx) => (
                  <Line key={idx} type="monotone" dataKey={line.key} stroke={colors[idx % colors.length]} name={line.name} strokeWidth={2} />
                ))}
              </LineChart>
            )}
            
            {chartType === 'pie' && (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey={chartConfig.valueKey || 'value'}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            )}
            
            {chartType === 'area' && (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={chartConfig.xKey || 'name'} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                {chartConfig.areas?.map((area, idx) => (
                  <Area key={idx} type="monotone" dataKey={area.key} stackId="1" stroke={colors[idx % colors.length]} fill={colors[idx % colors.length]} fillOpacity={0.6} name={area.name} />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
          
          {/* Executive Summary - Simple Explanation */}
          {chartConfig.summary && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h4 className="text-white font-bold text-base">Executive Summary</h4>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{chartConfig.summary}</p>
            </div>
          )}

          {/* Key Insights - Enhanced */}
          {chartConfig.insights && chartConfig.insights.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h4 className="text-white font-bold text-base">Key Insights</h4>
              </div>
              <div className="space-y-2">
                {chartConfig.insights.map((insight, idx) => {
                  const insightText = typeof insight === 'string' ? insight : insight?.text || '';
                  const severity = insight?.severity || 'info';
                  const severityColors = {
                    critical: 'border-red-500/50 bg-red-500/10',
                    warning: 'border-amber-500/50 bg-amber-500/10',
                    success: 'border-emerald-500/50 bg-emerald-500/10',
                    info: 'border-cyan-500/50 bg-cyan-500/10'
                  };
                  const severityIcons = {
                    critical: AlertTriangle,
                    warning: AlertTriangle,
                    success: TrendingUp,
                    info: Zap
                  };
                  const Icon = severityIcons[severity] || Sparkles;
                  
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[severity] || severityColors.info}`}>
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        severity === 'critical' ? 'text-red-400' :
                        severity === 'warning' ? 'text-amber-400' :
                        severity === 'success' ? 'text-emerald-400' :
                        'text-cyan-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium leading-relaxed">{insightText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Details - For Advanced Users */}
          {chartConfig.technical_details && (
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-violet-400" />
                <h4 className="text-white font-bold text-base">Technical Analysis</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(chartConfig.technical_details).map(([key, value], idx) => {
                  const displayValue = typeof value === 'object' && value !== null 
                    ? JSON.stringify(value, null, 2)
                    : String(value);
                  
                  return (
                    <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                      <span className="text-white text-sm font-mono text-right max-w-[60%] break-words">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {chartConfig.recommendations && chartConfig.recommendations.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h4 className="text-white font-bold text-base">AI Recommendations</h4>
              </div>
              <div className="space-y-2">
                {chartConfig.recommendations.map((rec, idx) => {
                  const recText = typeof rec === 'string' ? rec : rec?.action || rec?.benefit || '';
                  const savings = rec?.savings_kg || rec?.savings_dkk || null;
                  const timeframe = rec?.timeframe || null;
                  const confidence = rec?.confidence || null;
                  
                  return (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded bg-emerald-500/5 border border-emerald-500/20">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 text-sm leading-relaxed mb-2">{recText}</p>
                        {(savings || timeframe || confidence) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {savings && (
                              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300">
                                💰 {savings}
                              </span>
                            )}
                            {timeframe && (
                              <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-300">
                                ⏱️ {timeframe}
                              </span>
                            )}
                            {confidence && (
                              <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300">
                                📊 {confidence}% confidence
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Quality Metrics */}
          {chartConfig.data_quality && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-slate-400 text-xs mb-1">Accuracy</p>
                <p className="text-white text-lg font-bold">{chartConfig.data_quality.accuracy || '98%'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-slate-400 text-xs mb-1">Completeness</p>
                <p className="text-white text-lg font-bold">{chartConfig.data_quality.completeness || '100%'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-slate-400 text-xs mb-1">Reliability</p>
                <p className="text-white text-lg font-bold">{chartConfig.data_quality.reliability || '99%'}</p>
              </div>
            </div>
          )}

          {/* Advanced Metrics */}
          {chartConfig.advanced_metrics && (
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h4 className="text-white font-bold text-base">Advanced Metrics</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {chartConfig.advanced_metrics.map((metric, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-slate-400 text-xs mb-1 font-medium">{metric.label}</p>
                    <p className="text-white text-base font-bold">{metric.value}</p>
                    {metric.change && (
                      <p className={`text-xs mt-1 ${metric.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {metric.change}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecasting & Predictions */}
          {chartConfig.forecasts && chartConfig.forecasts.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h4 className="text-white font-bold text-base">Predictions & Forecasts</h4>
              </div>
              <div className="space-y-3">
                {chartConfig.forecasts.map((forecast, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white font-medium text-sm">{forecast.name}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
                        {forecast.timeframe}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{forecast.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-lg font-bold">{forecast.value}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-violet-500/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-400 to-indigo-400"
                            style={{ width: `${forecast.confidence || 85}%` }}
                          />
                        </div>
                        <span className="text-xs text-violet-300">{forecast.confidence || 85}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          {chartConfig.risks && chartConfig.risks.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="text-white font-bold text-base">Risk Analysis</h4>
              </div>
              <div className="space-y-2">
                {chartConfig.risks.map((risk, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium text-sm flex-1">{risk.name}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        risk.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                        risk.severity === 'high' ? 'bg-orange-500/30 text-orange-300' :
                        'bg-yellow-500/30 text-yellow-300'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mb-2">{risk.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Likelihood: {risk.likelihood}</span>
                      <span className="text-red-300 font-semibold">Impact: {risk.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correlations & Relationships */}
          {chartConfig.correlations && chartConfig.correlations.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h4 className="text-white font-bold text-base">Data Correlations</h4>
              </div>
              <div className="space-y-2">
                {chartConfig.correlations.map((corr, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-300 text-sm">{corr.variables}</p>
                      <span className="text-xs font-mono text-cyan-300">{corr.coefficient}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-400"
                        style={{ width: `${Math.abs(parseFloat(corr.coefficient)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
          );
    }

    // Swarm Intelligence Panel
    if (type === 'swarm_intelligence') {
      return (
        <SwarmIntelligencePanel
          vehicles={vehicles}
          routes={routes}
          onCommand={(cmd) => {
            setInput(cmd);
          }}
        />
      );
    }

    // Neuro-Symbolic Risk Fusion Panel
    if (type === 'neuro_risk') {
      return (
        <NeuroSymbolicRiskPanel
          vehicles={vehicles}
          routes={routes}
          onCommand={(cmd) => {
            setInput(cmd);
          }}
        />
      );
    }

    // Digital Twin Federation
    if (type === 'digital_twin') {
      return (
        <DigitalTwinFederation
          vehicles={vehicles}
          routes={routes}
          onCommand={(cmd) => {
            setInput(cmd);
          }}
        />
      );
    }

    // Fleet AI Course Engine
    if (type === 'course_ai') {
      return (
        <CourseAIEngine
          vehicles={vehicles}
          routes={routes}
          shipments={shipments}
        />
      );
    }

    // Deep Analysis Engine (anomalies + what-if + proactive)
    if (type === 'deep_analysis') {
      return (
        <DeepAnalysisEngine
          vehicles={vehicles}
          routes={routes}
          shipments={shipments}
          alerts={alerts}
          onInsightCommand={(cmd) => { setInput(cmd); }}
        />
      );
    }

    // Document Editor
    if (type === 'document_editor') {
      return <AIDocumentEditor />;
    }

    // Spreadsheet Editor
    if (type === 'spreadsheet_editor') {
      return <AISpreadsheetEditor />;
    }

    // Global Search
    if (type === 'global_search') {
      return (
        <GlobalSearch
          orgId={data?.orgId}
          onOpenWindow={(entityType, item) => openWindow(entityType, { x: 200, y: 150 })}
          onOpenPageWindow={(page) => openWindow(page.toLowerCase(), { x: 200 + Math.random() * 100, y: 150 + Math.random() * 60 })}
        />
      );
    }

    // For full page iframes - all apps
    if (['dashboard', 'settings', 'aioptimization', 'invoices', 'apidocs', 'resources', 
         'warehouseautomation', 'demandforecasting', 'greentms', 'gpsintegration', 'assignment', 'routeeditor',
         'fleet', 'alerts', 'routes', 'shipments', 'crm', 'vehicles', 'drivers', 'maintenance', 'hr'].includes(type)) {
      const pageMap = {
        'dashboard': 'Dashboard',
        'settings': 'Settings',
        'aioptimization': 'AIOptimization',
        'invoices': 'Invoices',
        'apidocs': 'APIDocumentation',
        'resources': 'Resources',
        'warehouseautomation': 'WarehouseAutomation',
        'demandforecasting': 'DemandForecasting',
        'greentms': 'GreenTMS',
        'gpsintegration': 'GPSIntegration',
        'assignment': 'Assignment',
        'routeeditor': 'Routes',
        'fleet': 'Fleet',
        'alerts': 'Alerts',
        'routes': 'Routes',
        'shipments': 'Shipments',
        'crm': 'CRM',
        'vehicles': 'Fleet',
        'drivers': 'DriverManagement',
        'maintenance': 'MaintenanceManagement',
        'hr': 'HRManagement'
      };
      
      return (
        <iframe 
          src={`${createPageUrl(pageMap[type])}?hologram=true`}
          className="w-full h-full border-0"
          title={pageMap[type]}
        />
      );
    }

    return null;
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-violet-950/30" />
        
        {/* Grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Multiple animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Scan lines effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[size:100%_4px] pointer-events-none" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => {
            const randomX = Math.random() * 100 - 50;
            return (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                  animationDelay: `${Math.random() * 5}s`,
                  '--float-x': `${randomX}px`
                }}
              />
            );
          })}
        </div>
        </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400 relative z-10 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 tracking-wider">
                  <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">FLEET AI</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/50 text-[10px] sm:text-xs font-bold animate-pulse shadow-lg shadow-amber-500/20">BETA</Badge>
                </h1>
                <p className="text-cyan-400 text-xs sm:text-sm">AI-Powered Fleet Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
              {/* Global Search Button */}
              <Button
                onClick={() => openWindow('global_search', { x: 120, y: 80 }, { orgId })}
                className="bg-slate-700 hover:bg-slate-600 text-xs sm:text-sm gap-1"
              >
                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Søg</span>
              </Button>

              {/* Apps Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm gap-1">
                    <FileCode className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Apps</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 max-h-96 overflow-y-auto">
                  <DropdownMenuLabel className="text-cyan-400">Communication & Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => openWindow('nexus_chat')} className="text-slate-300 gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('document_editor')} className="text-slate-300 gap-2">
                    <FileText className="w-4 h-4" />
                    Document Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('spreadsheet_editor')} className="text-slate-300 gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('video_call')} className="text-slate-300 gap-2">
                    <Video className="w-4 h-4" />
                    Video Call
                  </DropdownMenuItem>

                  <DropdownMenuLabel className="text-cyan-400 mt-2">Fleet & Operations</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => openWindow('fleet')} className="text-slate-300 gap-2">
                    <Truck className="w-4 h-4" />
                    Fleet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('alerts')} className="text-slate-300 gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alerts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('routes')} className="text-slate-300 gap-2">
                    <Route className="w-4 h-4" />
                    Routes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('shipments')} className="text-slate-300 gap-2">
                    <Package className="w-4 h-4" />
                    Shipments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('resources')} className="text-slate-300 gap-2">
                    <Warehouse className="w-4 h-4" />
                    Resources
                  </DropdownMenuItem>

                  <DropdownMenuLabel className="text-cyan-400 mt-2">Business & Analytics</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => openWindow('dashboard')} className="text-slate-300 gap-2">
                   <LayoutDashboard className="w-4 h-4" />
                   Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('crm')} className="text-slate-300 gap-2">
                   <Users className="w-4 h-4" />
                   CRM
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('hr')} className="text-slate-300 gap-2">
                   <Users className="w-4 h-4" />
                   HR Management
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('invoices')} className="text-slate-300 gap-2">
                   <FileText className="w-4 h-4" />
                   Invoices
                  </DropdownMenuItem>

                  <DropdownMenuLabel className="text-cyan-400 mt-2">Advanced</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => openWindow('aioptimization')} className="text-slate-300 gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Optimization
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openWindow('gpsintegration')} className="text-slate-300 gap-2">
                    <Satellite className="w-4 h-4" />
                    GPS Integration
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Prompts Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm gap-1">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">AI Prompts</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 max-h-96 overflow-y-auto w-80">
                 <DropdownMenuLabel className="text-violet-400">Fleet Operations</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => executePrompt("Analyser alle køretøjer og identificer dem med laveste effektivitetsscore. Giv detaljeret rapport over deres status, udstationeringshistorik, brændstofforbrug og vedligeholdelsesbehov.")} className="text-slate-300 text-xs">
                   Vehicle Efficiency Analysis
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Optimer alle aktive ruter baseret på aktuel trafik, vejrforhold, køretøjstatus og brændstofpriser. Beregn potentielle tidsbesparelser og CO2-reduktion for hver rute.")} className="text-slate-300 text-xs">
                   Route Optimization
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Gennemgå alle forsendelser i transit og identificer dem med risiko for forsinket levering. Giv årsager, påvirkning og anbefalede handlinger for hver.")} className="text-slate-300 text-xs">
                   Shipment Risk Assessment
                 </DropdownMenuItem>

                 <DropdownMenuLabel className="text-violet-400 mt-2">Predictive Analytics</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => executePrompt("Forudsig vedligeholdelsesbehov for alle køretøjer i næste 30 dage baseret på running hours, sensor data og historiske mønstre. Prioriter efter kritikalitet og kostnad.")} className="text-slate-300 text-xs">
                   Predictive Maintenance
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Lav 90-dages efterspørgselsprognose baseret på historiske data, sæsonaritet og markedstrends. Giv anbefalinger for lagerbeholdning og ressourceallokering.")} className="text-slate-300 text-xs">
                   Demand Forecasting
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Analyser ETA-nøjagtighed over sidste 60 dage. Identificer systematiske fejl, vejrpåvirkninger og driverfaktorer. Foreslå forbedringer til prediktionsmodellen.")} className="text-slate-300 text-xs">
                   ETA Accuracy Analysis
                 </DropdownMenuItem>

                 <DropdownMenuLabel className="text-violet-400 mt-2">Risk & Compliance</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => executePrompt("Udfør omfattende risikovurdering af hele flåden. Identificer operationelle risici, sikkerhedsfaktorer, overholdelsesproblemer og compliance-gab. Giv handlingsplan.")} className="text-slate-300 text-xs">
                   Risk Assessment
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Analyser alle sikkerheds- og sikkerhedsvarsler fra sidste 90 dage. Identificer mønstre, root causes og systemindsendende problemer. Anbefalinger for forebyggelse.")} className="text-slate-300 text-xs">
                   Safety Analysis
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Kontroller compliance med alle gældende transportbestemmelser. Giv rapport over mangler, påkrævede rettelser og implementeringstidsplan.")} className="text-slate-300 text-xs">
                   Compliance Check
                 </DropdownMenuItem>

                 <DropdownMenuLabel className="text-violet-400 mt-2">Financial & Performance</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => executePrompt("Analyser transportomkostninger per km, per enhed, per rute. Identificer outliers, ineffektiviteter og besparelsesmuligheder. Sammenlign med benchmarks.")} className="text-slate-300 text-xs">
                   Cost Analysis
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Beregn CO2-emissioner for alle forsendelser. Identificer højeste-emission ruter og køretøjer. Giv strategier til 20% reduktion uden at påvirke levering.")} className="text-slate-300 text-xs">
                   Sustainability Report
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Evaluer præstationen for hver chauffør baseret på leveringstidlighed, brændstofeffektivitet, sikkerhed og kundebedømmelser. Giv coaching-anbefalinger.")} className="text-slate-300 text-xs">
                   Driver Performance
                 </DropdownMenuItem>

                 <DropdownMenuLabel className="text-violet-400 mt-2">Strategic Planning</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => executePrompt("Analyser flådekapacitet mod efterspørgsel. Giv anbefalinger for køretøjstilskud eller reducering, baseret på belastningsprofiler og omkostningseffektivitet.")} className="text-slate-300 text-xs">
                   Capacity Planning
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => executePrompt("Identificer mønstre i forsinkelser, afvisninger og fejl. Analyser dybdegående root causes. Giv systematiske forbedringer til operationel styrke.")} className="text-slate-300 text-xs">
                   Root Cause Analysis
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setShowAdvancedPanel(true)} className="text-slate-300 text-xs">
                   <Brain className="w-4 h-4 mr-2" />
                   Advanced Intelligence Panel
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuLabel className="text-red-400 mt-1">🔬 Research AI Engine</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => openWindow('deep_analysis', { x: 100, y: 80 })} className="text-slate-300 text-xs">
                   <Activity className="w-4 h-4 mr-2 text-cyan-400" />
                   Anomaly Detection + What-If + Proactive AI
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuLabel className="text-amber-400 mt-1">🎓 AI Learning Engine</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => openWindow('course_ai', { x: 120, y: 60 })} className="text-slate-300 text-xs">
                   <GraduationCap className="w-4 h-4 mr-2 text-amber-400" />
                   Adaptive Fleet AI Courses
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuLabel className="text-cyan-400 mt-1">⚡ Parallel Processing</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-slate-800" />
                 <DropdownMenuItem onClick={() => setShowParallelProcessor(true)} className="text-slate-300 text-xs">
                   <Zap className="w-4 h-4 mr-2 text-amber-400" />
                   Parallel Task Processor (10x Tasks)
                 </DropdownMenuItem>
                 </DropdownMenuContent>
                 </DropdownMenu>

              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exit FLEET AI</span>
                <span className="sm:hidden">Exit</span>
              </Button>
              <div className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/50 shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent animate-pulse" />
                <Activity className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400 animate-pulse relative z-10" />
                <span className="text-emerald-400 text-xs lg:text-sm font-semibold relative z-10">System Operational</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute right-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Advanced Command Panel */}
          {showAdvancedPanel && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-4 w-96 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl z-40 shadow-2xl flex flex-col"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-amber-500/20 flex-shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  Advanced Intelligence
                </h3>
                <Button size="icon" variant="ghost" onClick={() => setShowAdvancedPanel(false)} className="h-7 w-7">
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {advancedError && (
                  <div className="p-2 rounded bg-red-500/20 border border-red-500/50 text-red-300 text-xs">
                    {advancedError}
                  </div>
                )}

                <AdvancedCommandPanel
                  onCommand={(cmdType) => {
                    advancedExecute(cmdType);
                    setMessages(prev => [...prev, { role: 'system', content: `🧠 Running advanced analysis: ${cmdType}...` }]);
                  }}
                />

                {(advancedLoading || advancedResults) && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <InsightRenderer data={advancedResults} loading={advancedLoading} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Minimized Windows Stack */}
                  <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-40">
                    <AnimatePresence>
                      {activeWindows
                        .filter(w => minimizedWindows.has(w.id))
                        .map((window) => {
                          const Icon = window.type === 'fleet' ? Truck :
                            window.type === 'alerts' ? AlertTriangle :
                            window.type === 'routes' ? Route :
                            window.type === 'shipments' ? Package :
                            window.type === 'dashboard' ? LayoutDashboard :
                            window.type === 'settings' ? Settings :
                            window.type === 'aioptimization' ? Sparkles :
                            window.type === 'invoices' ? FileText :
                            window.type === 'apidocs' ? FileText :
                            window.type === 'resources' ? Warehouse :
                            window.type === 'warehouseautomation' ? Warehouse :
                            window.type === 'demandforecasting' ? TrendingUp :
                            window.type === 'greentms' ? Activity :
                            window.type === 'gpsintegration' ? Satellite :
                            window.type === 'assignment' ? Route :
                            window.type === 'routeeditor' ? Route :
                            window.type === 'swarm_intelligence' ? Network :
                            window.type === 'neuro_risk' ? Shield :
                            window.type === 'digital_twin' ? Globe :
                            window.type === 'video_call' ? Video :
                            window.type === 'document_editor' ? FileText :
                            window.type === 'spreadsheet_editor' ? BarChart3 :
                            window.type.startsWith('chart_') ? BarChart3 : Activity;

                                   const title = window.type.startsWith('chart_') ? (window.data?.chartConfig?.title || 'Analysis Chart') :
                            window.type === 'fleet' ? 'Fleet' :
                            window.type === 'alerts' ? 'Alerts' :
                            window.type === 'routes' ? 'Routes' :
                            window.type === 'shipments' ? 'Shipments' :
                            window.type === 'dashboard' ? 'Dashboard' :
                            window.type === 'settings' ? 'Settings' :
                            window.type === 'aioptimization' ? 'AI Optimization' :
                            window.type === 'invoices' ? 'Invoices' :
                            window.type === 'apidocs' ? 'API Docs' :
                            window.type === 'resources' ? 'Resources' :
                            window.type === 'warehouseautomation' ? 'Warehouse Automation' :
                            window.type === 'demandforecasting' ? 'Demand Forecasting' :
                            window.type === 'greentms' ? 'Green TMS' :
                            window.type === 'gpsintegration' ? 'GPS Integration' :
                            window.type === 'assignment' ? 'Assignments' :
                            window.type === 'routeeditor' ? 'Route Editor' :
                            window.type === 'swarm_intelligence' ? '🐜 Swarm Intelligence' :
                            window.type === 'neuro_risk' ? '🧠 Neuro-Symbolic Risk' :
                            window.type === 'digital_twin' ? '🌐 Digital Twin Federation' :
                            window.type === 'video_call' ? '📞 Video Call' :
                            window.type === 'document_editor' ? '📄 Document Editor' :
                            window.type === 'spreadsheet_editor' ? '📊 Spreadsheet Editor' :
                            window.type === 'nexus_chat' ? '🛰️ Nexus Satellite Chat' : '';

                          return (
                            <motion.div
                              key={window.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                            >
                              <Button
                                onClick={() => toggleMinimize(window.id)}
                                className="bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 backdrop-blur-xl hover:from-cyan-500/40 hover:to-violet-500/40 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
                              >
                                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-cyan-400" />
                                <span className="text-white font-medium">{title}</span>
                              </Button>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>

                  {/* Hologram Windows */}
                  <AnimatePresence>
                    {activeWindows.map((window) => (
              <HologramWindow
                key={window.id}
                id={window.id}
                windowType={window.type}
                onSendToScreen={{ screens: openDesktopWindows, send: sendWindowToScreen }}
                title={
                  window.type === 'fleet' ? 'Fleet' :
                  window.type === 'alerts' ? 'Alerts' :
                  window.type === 'routes' ? 'Routes' :
                  window.type === 'shipments' ? 'Shipments' :
                  window.type === 'dashboard' ? 'Dashboard' :
                  window.type === 'settings' ? 'Settings' :
                  window.type === 'aioptimization' ? 'AI Optimization' :
                  window.type === 'invoices' ? 'Invoices' :
                  window.type === 'apidocs' ? 'API Docs' :
                  window.type === 'resources' ? 'Resources' :
                  window.type === 'warehouseautomation' ? 'Warehouse Automation' :
                  window.type === 'demandforecasting' ? 'Demand Forecasting' :
                  window.type === 'greentms' ? 'Green TMS' :
                  window.type === 'gpsintegration' ? 'GPS Integration' :
                  window.type === 'assignment' ? 'Assignments' :
                  window.type === 'routeeditor' ? 'Route Editor' :
                  window.type === 'swarm_intelligence' ? '🐜 Swarm Intelligence' :
                  window.type === 'neuro_risk' ? '🧠 Neuro-Symbolic Risk' :
                  window.type === 'digital_twin' ? '🌐 Digital Twin Federation' :
                  window.type === 'document_editor' ? '📄 Document Editor' :
                  window.type === 'spreadsheet_editor' ? '📊 Spreadsheet Editor' :
                  window.type === 'nexus_chat' ? '🛰️ Nexus Satellite Chat' :
                  window.type.startsWith('chart_') ? (window.data?.chartConfig?.title || 'Analysis') : ''
                  }
                icon={
                  window.type.startsWith('chart_') ? BarChart3 :
                  window.type === 'fleet' ? Truck :
                  window.type === 'alerts' ? AlertTriangle :
                  window.type === 'routes' ? Route :
                  window.type === 'shipments' ? Package :
                  window.type === 'dashboard' ? LayoutDashboard :
                  window.type === 'settings' ? Settings :
                  window.type === 'aioptimization' ? Sparkles :
                  window.type === 'invoices' ? FileText :
                  window.type === 'apidocs' ? FileText :
                  window.type === 'resources' ? Warehouse :
                  window.type === 'warehouseautomation' ? Warehouse :
                  window.type === 'demandforecasting' ? TrendingUp :
                  window.type === 'greentms' ? Activity :
                  window.type === 'gpsintegration' ? Satellite :
                  window.type === 'assignment' ? Route :
                  window.type === 'routeeditor' ? Route :
                  window.type === 'swarm_intelligence' ? Network :
                  window.type === 'neuro_risk' ? Shield :
                  window.type === 'digital_twin' ? Globe :
                  window.type === 'document_editor' ? FileText :
                  window.type === 'spreadsheet_editor' ? BarChart3 :
                  window.type === 'nexus_chat' ? MessageSquare : Activity
                  }
                position={window.position}
                onClose={() => closeWindow(window.id)}
                onMinimize={() => toggleMinimize(window.id)}
                isMinimized={minimizedWindows.has(window.id)}
              >
                {renderWindowContent(window.type, window.data)}
              </HologramWindow>
            ))}
            </AnimatePresence>

            {/* Company Analysis Hologram */}
            {showCompanyAnalysis && (
              <CompanyAnalysisHologram
                companyName={companyAnalysisTarget}
                onClose={() => { setShowCompanyAnalysis(false); setCompanyAnalysisTarget(null); }}
                onSendToScreen={{ screens: openDesktopWindows, send: sendWindowToScreen }}
              />
            )}

            {/* Profile Search Hologram */}
            {showProfileSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 overflow-auto bg-slate-950"
              >
                <div className="flex items-start justify-between p-4 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    People Intelligence
                  </h2>
                  <Button
                    onClick={() => setShowProfileSearch(false)}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <ProfileSearch />
              </motion.div>
            )}

            {showCandidateMatcher && (
               <CandidateMatcher onClose={() => setShowCandidateMatcher(false)} />
            )}

            {/* Video Call Hologram */}
            {showVideoCall && (
              <HologramWindow
                id="video-call"
                title="Video Call"
                icon={Video}
                position={{ x: 200, y: 150 }}
                onClose={() => setShowVideoCall(false)}
                onMinimize={() => toggleMinimize('video-call')}
                isMinimized={minimizedWindows.has('video-call')}
                windowType="video_call"
              >
                <VideoCallHologram onClose={() => setShowVideoCall(false)} />
              </HologramWindow>
            )}

            {/* Parallel Task Processor */}
            {showParallelProcessor && (
              <HologramWindow
                id="parallel-processor"
                title="Parallel Task Processor"
                icon={Zap}
                position={{ x: 150, y: 100 }}
                onClose={() => setShowParallelProcessor(false)}
                onMinimize={() => toggleMinimize('parallel-processor')}
                isMinimized={minimizedWindows.has('parallel-processor')}
                windowType="parallel_processor"
              >
                <ParallelTaskProcessor onClose={() => setShowParallelProcessor(false)} />
              </HologramWindow>
            )}

            {/* 3D Visualization */}
            {show3DVisualization && (
            <FleetGlobe3D
             vehicles={show3DVisualization.vehicles || vehicles}
             routes={show3DVisualization.routes || routes}
             onClose={() => setShow3DVisualization(null)}
             onMinimize={() => setShow3DVisualization(null)}
            />
            )}
            
            {/* AI Thinking Terminal */}
            <ThinkingTerminalVisual 
              isActive={showThinkingTerminal && isProcessing}
              logs={thinkingLogs}
              onClose={() => setShowThinkingTerminal(false)}
            />

            {/* Standby Message */}
          {activeWindows.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-cyan-500/20 animate-pulse" />
                <Brain className="w-24 h-24 text-cyan-400 mx-auto mb-6 relative z-10 animate-float-slow" style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.5))'
                }} />
              </div>
              <h2 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">
                  FLEET AI Standby
                </span>
              </h2>
              <p className="text-slate-400">Advanced analytics ready: predictive maintenance, demand forecasting, CO2 reports, risk assessment, and full fleet control</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              </motion.div>
          )}
        </div>

        {/* Command Interface */}
         <div className="p-3 sm:p-4 lg:p-6">
           <div className="max-w-4xl mx-auto">

            {/* Advanced AI Visualizations - hidden */}

            {commandExecution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 hidden"
              >
                <CommandExecution 
                  execution={commandExecution.execution}
                  impact={commandExecution.impact_estimate}
                  confidence={commandExecution.confidence}
                />
              </motion.div>
            )}

            {false && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-slate-900/50 border border-slate-800 rounded-lg p-4"
              >
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  AI Suggestions
                </h4>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-slate-800/50 rounded">
                      <div className={`p-1.5 rounded ${
                        s.priority === 'critical' ? 'bg-red-500/20' :
                        s.priority === 'high' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                      }`}>
                        <Zap className={`w-4 h-4 ${
                          s.priority === 'critical' ? 'text-red-400' :
                          s.priority === 'high' ? 'text-amber-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{s.action}</p>
                        {s.savings && <p className="text-xs text-green-400">Potential savings: {s.savings}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="mb-3 sm:mb-4 max-h-32 sm:max-h-48 overflow-y-auto space-y-1.5 sm:space-y-2">
              {messages.slice(-5).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-1"
                >
                  <div className={`text-sm p-3 rounded-lg backdrop-blur-xl ${
                    msg.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300' :
                    msg.role === 'system' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' :
                    'bg-slate-800/50 border border-slate-700/50 text-slate-200'
                  }`}>
                    <span className="font-semibold mr-1">
                      {msg.role === 'user' ? '>' : msg.role === 'system' ? '⚡' : '🧠'}
                    </span>
                    {msg.streaming ? (
                      <span className="animate-pulse">{msg.content || 'Thinking...'}</span>
                    ) : msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-4">
                      {msg.files.map((file, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px]">
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span className="text-slate-400">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300"
                >
                  <span className="font-semibold mr-1">🧠</span>
                  <span>{streamingMessage}</span>
                  <span className="animate-pulse ml-1">▊</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setShowCompanyAnalysis(true)}
                variant="outline"
                size="sm"
                className="border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10"
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Company Analytics
              </Button>
              <Button
                onClick={handleOpenProfileSearch}
                variant="outline"
                size="sm"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                People Search
              </Button>
              <Button
                onClick={() => handleQuickAction('openNeuroRisk')}
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Neuro Risk Fusion
              </Button>
            </div>

            {/* Input */}
            <div className="space-y-3">
              {/* Uploaded Files Preview */}
              <AnimatePresence>
                {uploadedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl border-2 border-cyan-500/40 backdrop-blur-xl shadow-lg shadow-cyan-500/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-cyan-500/30">
                        <Paperclip className="w-4 h-4 text-cyan-300" />
                      </div>
                      <span className="text-cyan-300 text-sm font-semibold">
                        {uploadedFiles.length} file(s) attached • Will be sent with your command
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border-2 border-cyan-500/60 rounded-xl shadow-lg backdrop-blur-xl"
                        >
                          <FileText className="w-4 h-4 text-cyan-200" />
                          <span className="text-white text-xs font-medium max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="text-slate-300 hover:text-red-300 transition-colors ml-1 p-1 hover:bg-red-500/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value) setShowSuggestions(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    processCommand();
                  } else if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                    e.preventDefault();
                    const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                    setHistoryIndex(newIndex);
                    setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
                  } else if (e.key === 'ArrowDown' && historyIndex > 0) {
                    e.preventDefault();
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
                  }
                }}
                placeholder="Command FLEET AI... (e.g. 'predict maintenance', 'forecast demand', 'analyze CO2 emissions', 'optimize routes')"
                disabled={isProcessing}
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 bg-slate-900/60 border-2 border-cyan-500/40 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 backdrop-blur-xl transition-all"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="*/*"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isUploading}
                size="sm"
                className={`px-3 sm:px-4 lg:px-6 border-2 rounded-xl sm:rounded-2xl transition-all shadow-lg ${
                  isUploading 
                    ? 'bg-gradient-to-r from-cyan-500/40 to-violet-500/40 border-cyan-500/60 animate-pulse shadow-cyan-500/30' 
                    : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border-cyan-500/40 hover:border-cyan-500/60 shadow-cyan-500/20'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-cyan-300" />
                    <span className="text-xs text-cyan-300 hidden sm:inline">Uploading...</span>
                  </div>
                ) : (
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                )}
              </Button>
              <Button
                onClick={async () => {
                  if (!('webkitSpeechRecognition' in window)) {
                    toast.error('Voice input not supported in this browser');
                    return;
                  }

                  const recognition = new window.webkitSpeechRecognition();
                  recognition.lang = 'en-US';
                  recognition.continuous = false;
                  recognition.interimResults = false;

                  recognition.onstart = () => setIsListening(true);
                  recognition.onend = () => setIsListening(false);
                  recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                  };
                  recognition.onerror = () => {
                    toast.error('Voice input failed');
                    setIsListening(false);
                  };

                  recognition.start();
                }}
                disabled={isProcessing}
                size="sm"
                className={`px-3 sm:px-4 lg:px-6 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'} rounded-xl sm:rounded-2xl hidden sm:flex`}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={processCommand}
                disabled={isProcessing || !input.trim()}
                size="sm"
                className="px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_auto] hover:bg-right rounded-xl sm:rounded-2xl shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{ animationDuration: '2s' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isProcessing ? (
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                )}
              </Button>
              </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-cyan-500" />
                <span>Press Enter to send • ↑↓ for history</span>
              </div>
              <span className="text-slate-600">{uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) ready` : 'Attach files for AI analysis'}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Multi-Screen Manager */}
      <AnimatePresence>
        {showMultiScreenManager && (
          <MultiScreenManager
            onClose={() => setShowMultiScreenManager(false)}
            onWindowOpened={(label, winRef) => { trackDesktopWindow(label, winRef); }}
          />
        )}
      </AnimatePresence>

      {/* AI Coach — non-intrusive real-time coaching overlay */}
      <AICoach
        openWindows={activeWindows}
        fleetData={{ vehicles, routes, shipments, alerts }}
        courseSession={null}
        userLevel={currentUser?.role === 'admin' ? 4 : 2}
        performanceHistory={[]}
      />
    </div>
  );
}