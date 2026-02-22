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
  Lightbulb
} from "lucide-react";
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
import MistralStreamingEngine, { StreamingAnalysisVisual } from "@/components/intellect/MistralStreamingEngine";
import IntelligentCommandAgent, { CommandInput, CommandExecution } from "@/components/intellect/IntelligentCommandAgent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Placeholder integration - importing remaining utilities from original
export default function IntellectMode() {
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedResults, setAdvancedResults] = useState(null);
  const [advancedError, setAdvancedError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [showCandidateMatcher, setShowCandidateMatcher] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeWindows, setActiveWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [scenarios, setScenarios] = useState([]);
  const [multiModelAnalysis, setMultiModelAnalysis] = useState(null);
  const [commandExecution, setCommandExecution] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const quickCommands = [
    { icon: TrendingUp, text: "Fleet Performance", command: "analyze fleet performance metrics", color: "cyan" },
    { icon: AlertTriangle, text: "Route Issues", command: "identify route optimization issues", color: "violet" },
    { icon: Package, text: "Shipment Status", command: "provide shipment status overview", color: "emerald" },
    { icon: Zap, text: "AI Optimization", command: "suggest fleet optimizations", color: "amber" },
    { icon: Activity, text: "Maintenance", command: "predict maintenance needs", color: "blue" },
    { icon: Sparkles, text: "Company Analysis", action: "openCompanyAnalysis", color: "fuchsia" },
  ];

  const advancedExecute = async (type) => {
    setAdvancedLoading(true);
    setAdvancedError(null);
    try {
      const result = await base44.functions.invoke('advancedIntellectOrchestration', { analysisType: type });
      setAdvancedResults(result.data);
    } catch (error) {
      setAdvancedError(error.message || "Failed to execute advanced analysis");
    } finally {
      setAdvancedLoading(false);
    }
  };

  const processCommand = async (command) => {
    if (!command.trim()) return;
    
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: command, files: uploadedFiles }]);
    setUploadedFiles([]);
    setIsProcessing(true);
    setStreamingMessage("Processing command...");

    try {
      const fileUrls = uploadedFiles.map(f => f.url || f);
      const response = await base44.functions.invoke('mistralCommand', {
        command,
        file_urls: fileUrls,
        context: { messages, scenarios }
      });

      setStreamingMessage("");
      if (response.data) {
        setMessages(prev => [...prev, { role: "assistant", content: response.data.response || "Done" }]);
        if (response.data.scenarios) setScenarios(response.data.scenarios);
        if (response.data.suggestions) setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      setStreamingMessage("");
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOpenProfileSearch = () => {
    setShowCandidateMatcher(true);
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl border-b border-slate-800/50 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-full flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30 flex-shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-bold text-lg sm:text-2xl truncate">FLEET AI</h1>
              <p className="text-slate-400 text-xs">Advanced analytics ready: predictive maintenance, demand forecasting, CO2 reports, risk assessment, and full fleet control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => setShowAdvancedPanel(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 text-xs sm:text-sm"
            >
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">AI</span>
            </Button>
            
            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm flex-shrink-0"
            >
              <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exit FLEET AI</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Advanced Command Panel Modal */}
        <AnimatePresence>
          {showAdvancedPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center p-4"
            >
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAdvancedPanel(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              
              {/* Panel */}
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
                  <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span>Advanced Intelligence</span>
                  </h3>
                  <Button size="icon" variant="ghost" onClick={() => setShowAdvancedPanel(false)} className="hover:bg-slate-800 flex-shrink-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {advancedError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex-shrink-0"
                    >
                      {advancedError}
                    </motion.div>
                  )}
                  
                  <div className="flex-shrink-0">
                    <AdvancedCommandPanel 
                      onCommand={(cmdType) => {
                        advancedExecute(cmdType);
                        setMessages(prev => [...prev, { role: 'system', content: `🧠 Running advanced analysis: ${cmdType}...` }]);
                      }}
                    />
                  </div>
                  
                  {(advancedLoading || advancedResults) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-4 border-t border-slate-800 space-y-3"
                    >
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <InsightRenderer data={advancedResults} loading={advancedLoading} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Interface */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Messages and Content Area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
            {/* Quick Commands */}
            {showSuggestions && messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 sm:mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {quickCommands.map((cmd, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      if (cmd.action === 'openCompanyAnalysis') {
                        setShowCompanyAnalysis(true);
                        setMessages(prev => [...prev, { role: "system", content: "🏢 Company Analytics Hologram activated - Search any company for deep insights" }]);
                      } else if (cmd.action === 'openCandidateMatcher') {
                        setShowCandidateMatcher(true);
                        setMessages(prev => [...prev, { role: "system", content: "👥 Candidate Intelligence activated - Match candidates to job descriptions" }]);
                      } else {
                        setInput(cmd.command);
                      }
                      setShowSuggestions(false);
                    }}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 backdrop-blur-xl transition-all text-left active:scale-95 sm:hover:scale-105 ${
                      cmd.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50' :
                      cmd.color === 'violet' ? 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-500/50' :
                      cmd.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50' :
                      cmd.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50' :
                      'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <cmd.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                        cmd.color === 'cyan' ? 'text-cyan-400' :
                        cmd.color === 'violet' ? 'text-violet-400' :
                        cmd.color === 'emerald' ? 'text-emerald-400' :
                        cmd.color === 'amber' ? 'text-amber-400' :
                        'text-blue-400'
                      }`} />
                      <span className={`text-xs sm:text-sm font-semibold ${
                        cmd.color === 'cyan' ? 'text-cyan-300' :
                        cmd.color === 'violet' ? 'text-violet-300' :
                        cmd.color === 'emerald' ? 'text-emerald-300' :
                        cmd.color === 'amber' ? 'text-amber-300' :
                        'text-blue-300'
                      }`}>
                        {cmd.text}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2">{cmd.command}</p>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Advanced AI Visualizations */}
            {scenarios.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
              >
                <ScenarioVisualization scenarios={scenarios} />
              </motion.div>
            )}

            {multiModelAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <StreamingAnalysisVisual analysis={multiModelAnalysis} isStreaming={isStreaming} />
              </motion.div>
            )}

            {commandExecution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CommandExecution 
                  execution={commandExecution.execution}
                  impact={commandExecution.impact_estimate}
                  confidence={commandExecution.confidence}
                />
              </motion.div>
            )}

            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
              >
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  AI Suggestions
                </h4>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-slate-800/50 rounded">
                      <div className={`p-1.5 rounded flex-shrink-0 ${
                        s.priority === 'critical' ? 'bg-red-500/20' :
                        s.priority === 'high' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                      }`}>
                        <Zap className={`w-4 h-4 ${
                          s.priority === 'critical' ? 'text-red-400' :
                          s.priority === 'high' ? 'text-amber-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{s.action}</p>
                        {s.savings && <p className="text-xs text-green-400">Potential savings: {s.savings}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="space-y-3">
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
                          <span className="text-slate-400">{file.name || 'File'}</span>
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
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3">
            {/* Uploaded Files Preview */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl border border-cyan-500/30 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    <span className="text-cyan-300 text-xs sm:text-sm font-semibold truncate">
                      {uploadedFiles.length} file(s) attached
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-[10px] sm:text-xs"
                      >
                        <FileText className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                        <span className="text-cyan-200 truncate max-w-[100px]">{file.name || 'File'}</span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-300 transition-colors ml-1 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    processCommand(input);
                  }
                }}
                placeholder="Ask FLEET AI anything... (e.g., optimize routes, predict maintenance)"
                className="flex-1 px-4 py-2 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm sm:text-base"
                disabled={isProcessing}
              />
              <Button
                onClick={() => processCommand(input)}
                disabled={!input.trim() || isProcessing}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 px-3 sm:px-4 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCompanyAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCompanyAnalysis(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden border border-slate-800"
          >
            <button
              onClick={() => setShowCompanyAnalysis(false)}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <CompanyAnalysisHologram />
          </motion.div>
        </div>
      )}

      {showCandidateMatcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCandidateMatcher(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden border border-slate-800"
          >
            <button
              onClick={() => setShowCandidateMatcher(false)}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <CandidateMatcher />
          </motion.div>
        </div>
      )}
    </div>
  );
}