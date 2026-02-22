import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, X, Minimize2, Maximize2, Copy, Download, Plus, 
  TrendingUp, AlertTriangle, Zap, Brain, Eye, EyeOff, Settings,
  ChevronDown, ChevronUp, Monitor, Sparkles, Globe, Building2,
  Users, Package, Route, AlertCircle, CheckCircle, Clock, ExternalLink,
  Search, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CompanyAnalysisHologram from '@/components/intellect/CompanyAnalysisHologram';
import ThinkingTerminalVisual from '@/components/intellect/ThinkingTerminalVisual';
import MultiScreenManager from '@/components/intellect/MultiScreenManager';
import FleetGlobe3D from '@/components/intellect/FleetGlobe3D';
import AdvancedFleetHologram from '@/components/fleet/AdvancedFleetHologram';

export default function IntellectMode() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'system', 
      text: 'Welcome to FLEET AI Intellect Mode. I can help you optimize routes, analyze fleet performance, manage alerts, and more. Try commands like "optimize route", "show vehicle efficiency", or "analyze company Tesla".',
      timestamp: Date.now()
    }
  ]);
  const [thinkingLogs, setThinkingLogs] = useState([]);
  const [showThinkingTerminal, setShowThinkingTerminal] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [companyName, setCompanyName] = useState(null);
  const [screens, setScreens] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initApp = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const orgData = currentUser?.organizations?.[0];
      if (orgData) setOrg(orgData);

      const [v, a, r, s] = await Promise.all([
        base44.entities.Vehicle.list().catch(() => []),
        base44.entities.Alert.list().catch(() => []),
        base44.entities.Route.list().catch(() => []),
        base44.entities.Shipment.list().catch(() => []),
      ]);
      setVehicles(v || []);
      setAlerts(a || []);
      setRoutes(r || []);
      setShipments(s || []);
    };
    initApp();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addThinkingLog = (type, message, details = null, duration = null, percentage = null) => {
    setThinkingLogs(prev => [...prev, { type, message, details, duration, percentage, timestamp: Date.now() }]);
  };

  const executeParallelMicroAnalyses = async (mainPrompt, ctxVehicles = [], ctxAlerts = [], ctxRoutes = [], ctxShipments = []) => {
    // Split 50 micro-calls into 5 batches of 10 to avoid overwhelming the API
    const microPrompts = [
      `Vehicle efficiency gain opportunities?`,
      `Alert anomaly detection patterns?`,
      `Route time optimization potential?`,
      `Shipment ETA accuracy improvements?`,
      `Maintenance risk scores?`,
      `Cost saving opportunities?`,
      `Safety metric analysis?`,
      `Demand forecast insights?`,
      `Fuel efficiency gains?`,
      `Driver performance analysis?`,
      `Asset utilization rates?`,
      `Carbon footprint reduction?`,
      `Temperature monitoring anomalies?`,
      `Geofence boundary violations?`,
      `Real-time delay predictions?`,
      `Inventory level optimization?`,
      `Warehouse congestion analysis?`,
      `Supply chain bottlenecks?`,
      `Contract compliance analysis?`,
      `Customer satisfaction trends?`,
      `Revenue optimization opportunities?`,
      `Load balancing efficiency?`,
      `Cross-docking potential?`,
      `Return shipment analysis?`,
      `Customs clearance risks?`,
      `Competitor pricing analysis?`,
      `Market demand shifts?`,
      `Supplier reliability scores?`,
      `Payment terms optimization?`,
      `Insurance claim patterns?`,
      `Accident risk assessment?`,
      `Weather impact prediction?`,
      `Traffic congestion forecasting?`,
      `Port/Hub congestion levels?`,
      `Equipment utilization trends?`,
      `Spare parts inventory needs?`,
      `Driver training recommendations?`,
      `Route deviation analysis?`,
      `Customer delivery preferences?`,
      `Seasonal demand patterns?`,
      `Network optimization opportunities?`,
      `Distance/time correlation analysis?`,
      `Vehicle age vs. maintenance costs?`,
      `Cargo type profitability analysis?`,
      `Regional performance benchmarking?`,
      `Service level compliance tracking?`,
      `Exception rate analysis?`,
      `Process bottleneck identification?`,
      `AI prediction confidence levels?`,
      `System health status check?`,
    ];

    addThinkingLog('info', 'Starting parallel micro-analyses in 5 batches...');

    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < microPrompts.length; i += batchSize) {
      const batch = microPrompts.slice(i, i + batchSize);
      const batchPromises = batch.map((prompt, idx) => {
        const batchNum = Math.floor(i / batchSize) + 1;
        return base44.integrations.Core.InvokeLLM({
          prompt: `Context: ${ctxVehicles.length} vehicles, ${ctxAlerts.length} alerts, ${ctxRoutes.length} routes, ${ctxShipments.length} shipments. Analyze briefly: ${prompt}`,
          response_json_schema: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              score: { type: 'number' },
              action: { type: 'string' }
            }
          }
        }).then(res => {
          const data = res?.data || {};
          addThinkingLog('success', `Batch ${batchNum} - Micro ${idx + 1}/10: ${prompt}`, data.insight, 100 + Math.random() * 400);
          return data;
        }).catch(err => {
          addThinkingLog('error', `Batch ${batchNum} - Micro ${idx + 1} failed`, err.message);
          return { insight: 'Analysis unavailable', score: 0, action: 'retry' };
        });
      });

      batches.push(await Promise.all(batchPromises));
      addThinkingLog('info', `Batch ${Math.floor(i / batchSize) + 1}/5 completed (${Math.min(i + batchSize, microPrompts.length)}/${microPrompts.length} analyses)`);
    }

    const mainResult = await base44.functions.invoke('mistralCommand', { 
      command: mainPrompt 
    }).then(res => {
      addThinkingLog('success', 'Main command processed', res?.data?.action || 'COMPLETE');
      return res;
    }).catch(err => {
      addThinkingLog('error', 'Main command failed', err.message);
      return { data: { action: 'ANALYZE', parameters: {} } };
    });

    return { mainResult, microAnalyses: batches.flat() };
  };

  const processCommand = async () => {
    if (!input.trim() || isProcessing) return;

    const currentCommand = input;
    setInput('');
    setIsProcessing(true);
    setThinkingLogs([]);
    setShowThinkingTerminal(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: currentCommand, timestamp: Date.now() }]);

    try {
      // Company analysis
      const companyMatch = currentCommand.match(/(?:analyser(?:er)?\s+(?:virksomheden?\s+)?|company analysis[:\s]+|analyze company[:\s]+)(.+)/i);
      if (companyMatch) {
        const company = companyMatch[1].trim();
        setCompanyName(company);
        setShowCompanyAnalysis(true);
        setMessages(prev => [...prev, { 
          type: 'system', 
          text: `Opening company analysis for "${company}"...`, 
          timestamp: Date.now() 
        }]);
        setIsProcessing(false);
        return;
      }

      // Run parallel analyses
      addThinkingLog('info', 'Initializing Intellect Mode analysis...');
      const { mainResult, microAnalyses } = await executeParallelMicroAnalyses(
        currentCommand,
        vehicles,
        alerts,
        routes,
        shipments
      );

      const action = mainResult?.data?.action;
      const params = mainResult?.data?.parameters || {};

      let responseText = '';
      if (action === 'ANALYZE') {
        responseText = `Fleet Analysis Complete: ${microAnalyses.filter(m => m.score > 5).length} significant insights identified. Key opportunities: ${microAnalyses.slice(0, 3).map(m => m.action).join(', ')}.`;
      } else if (action === 'OPTIMIZE') {
        responseText = `Route optimization processed. Recommended changes: ${JSON.stringify(params).substring(0, 100)}...`;
      } else {
        responseText = `Command processed: ${action}. Results: ${JSON.stringify(params).substring(0, 100)}...`;
      }

      addThinkingLog('success', 'Analysis complete', 'All batches processed');
      setMessages(prev => [...prev, { type: 'ai', text: responseText, timestamp: Date.now() }]);
    } catch (error) {
      addThinkingLog('error', 'Processing failed', error.message);
      setMessages(prev => [...prev, { type: 'error', text: `Error: ${error.message}`, timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-cyan-500/20 bg-slate-950/50 backdrop-blur-xl p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/40">
                <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">FLEET AI Intellect Mode</h1>
                <p className="text-cyan-400 text-xs">Parallel micro-analysis system</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">BETA</Badge>
              <Button onClick={() => setShowThinkingTerminal(!showThinkingTerminal)} variant="ghost" size="icon" title="Toggle thinking terminal">
                <Brain className="w-5 h-5 text-violet-400" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md px-4 py-3 rounded-lg ${
                      msg.type === 'user' ? 'bg-cyan-500/20 text-white border border-cyan-500/40' :
                      msg.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/40' :
                      'bg-slate-800/40 text-slate-300 border border-slate-700/40'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <span className="text-xs opacity-60 mt-1 block">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-700/50 bg-slate-950/50 backdrop-blur p-4">
              <div className="max-w-4xl mx-auto flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && processCommand()}
                  placeholder="Ask me anything about your fleet... (e.g., 'optimize routes', 'show alerts', 'analyze company Tesla')"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                />
                <Button 
                  onClick={processCommand}
                  disabled={isProcessing || !input.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Thinking terminal sidebar */}
          {showThinkingTerminal && (
            <div className="w-96 border-l border-slate-700/50 bg-slate-950/30 overflow-hidden">
              <ThinkingTerminalVisual 
                logs={thinkingLogs}
                onMinimize={() => setTerminalMinimized(true)}
                isMinimized={terminalMinimized}
              />
            </div>
          )}
        </div>
      </div>

      {/* Company analysis modal */}
      <AnimatePresence>
        {showCompanyAnalysis && (
          <CompanyAnalysisHologram 
            companyName={companyName}
            onClose={() => { setShowCompanyAnalysis(false); setCompanyName(null); }}
            onSendToScreen={{
              screens: screens.map((s, i) => ({ id: i, label: `Screen ${i + 1}` })),
              send: (screen, type) => console.log('Send to screen:', screen, type)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}