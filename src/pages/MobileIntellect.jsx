import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, Send, Mic, Brain, Zap, X, Paperclip, 
  Volume2, VolumeX, Radio, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const INITIAL_MESSAGES = [
  { role: "system", content: "⚡ FLEET AI Mobile ready. Command me." }
];

export default function MobileIntellect() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('mobile_intellect_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch { return INITIAL_MESSAGES; }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState([]);
  const [showThinkingTerminal, setShowThinkingTerminal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState([]);
  const [systemPulse, setSystemPulse] = useState(false);

  // Animate system pulse
  useEffect(() => {
    const interval = setInterval(() => setSystemPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  // Data Fetching
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: orgUser } = useQuery({
    queryKey: ['org-user-mobile-intellect'],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: currentUser.email });
      return users?.[0] || null;
    },
    enabled: !!currentUser,
    staleTime: 60000
  });

  const orgId = orgUser?.organization_id;

  const makeOrgQuery = (entity) => ({
    queryFn: async () => {
      if (!orgId) return [];
      return base44.entities[entity].filter({ organization_id: orgId });
    },
    enabled: !!orgId,
    refetchInterval: 15000,
    staleTime: 5000
  });

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles-mobile', orgId], ...makeOrgQuery('Vehicle') });
  const { data: alerts = [] } = useQuery({ queryKey: ['alerts-mobile', orgId], ...makeOrgQuery('Alert') });
  const { data: routes = [] } = useQuery({ queryKey: ['routes-mobile', orgId], ...makeOrgQuery('Route') });
  const { data: shipments = [] } = useQuery({ queryKey: ['shipments-mobile', orgId], ...makeOrgQuery('Shipment') });

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  const addThinkingLog = (type, message, details = null, duration = null, percentage = null) => {
    const entry = { type, message, details, duration, percentage, timestamp: Date.now() };
    setThinkingLogs(prev => [...prev, entry]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const newFiles = await Promise.all(files.map(async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = response?.data?.file_url || response?.file_url;
      if (!fileUrl) throw new Error('Upload failed');
      return { name: file.name, url: fileUrl, type: file.type };
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`✅ Uploaded ${files.length} file(s)`);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const processCommand = async () => {
    if (!input.trim()) return;
    const currentCommand = input;

    setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
    setInput("");
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);
    setIsProcessing(true);
    setThinkingLogs([]);
    setShowThinkingTerminal(true);
    setMenuOpen(false);
    addThinkingLog('parse', `Processing: "${currentCommand.substring(0, 50)}..."`);

    const maxRetries = 2;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const user = await base44.auth.me();
        const userOrgId = user?.organization_id;

        setMessages(prev => [...prev, { role: "system", content: "⚡ Analyzing..." }]);

        addThinkingLog('analyze', 'Analyzing fleet data');

        const conversationHistory = messages.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content).map(m => ({ role: m.role, content: m.content }));
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userLocalTime = new Date().toLocaleString('en-GB', { timeZone: userTimezone, hour12: false });

        let fileUrls = currentFiles.map(f => f.url);

        const payload = {
          message: currentCommand,
          conversation_history: conversationHistory,
          context: { 
            current_datetime: userLocalTime, 
            user_timezone: userTimezone, 
            vehicles_count: vehicles.length, 
            alerts_count: alerts.length, 
            routes_count: routes.length, 
            shipments_count: shipments.length 
          },
          ...(fileUrls.length > 0 && { file_urls: fileUrls })
        };

        addThinkingLog('process', 'Running AI analysis');

        const response = await base44.functions.invoke('mistralCommand', payload);
        const mistralResponse = (response.data || response) || { action: 'ANALYZE', parameters: {} };

        setMessages(prev => prev.filter(m => m.role !== 'system' || m.content !== "⚡ Analyzing..."));

        const { reply, action, parameters, message, open_window } = mistralResponse;

        try {
          await base44.entities.FleetAIUsage.create({ 
            organization_id: userOrgId, 
            user_email: user.email, 
            command: currentCommand, 
            action, 
            success: true 
          });
        } catch {}

        addThinkingLog('execute', `Executing: ${action}`);

        switch (action) {
          case "CREATE_ROUTE":
            setMessages(prev => [...prev, { role: "system", content: "🔄 Planning route..." }]);
            const routePlan = await base44.functions.invoke('planRoute', { 
              origin: parameters.origin, 
              destination: parameters.destination, 
              transport_type: parameters.transport_type || 'ship' 
            });
            if (routePlan.data.success) {
              await base44.entities.Route.create({ 
                organization_id: userOrgId, 
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
              queryClient.invalidateQueries({ queryKey: ['routes-mobile'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            }
            break;

          case "CREATE_VEHICLE":
            await base44.entities.Vehicle.create({ 
              organization_id: userOrgId, 
              name: parameters.name || `Vehicle-${Date.now()}`, 
              type: parameters.type || 'truck', 
              status: parameters.status || 'active', 
              fuel_level: parameters.fuel_level || 100, 
              driver: parameters.driver 
            });
            queryClient.invalidateQueries({ queryKey: ['vehicles-mobile'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            break;

          case "CREATE_SHIPMENT":
            await base44.entities.Shipment.create({ 
              organization_id: userOrgId, 
              tracking_number: `SHIP-${Date.now()}`, 
              origin: parameters.origin, 
              destination: parameters.destination, 
              status: parameters.status || 'pending', 
              priority: parameters.priority || 'normal', 
              cargo_type: parameters.cargo_type || 'general', 
              weight_kg: parameters.weight_kg 
            });
            queryClient.invalidateQueries({ queryKey: ['shipments-mobile'] });
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            break;

          case "UPDATE_ALERTS":
            if (parameters.resolve_all) {
              const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
              await Promise.all(unresolvedAlerts.map(alert => 
                base44.entities.Alert.update(alert.id, { is_resolved: true })
              ));
              queryClient.invalidateQueries({ queryKey: ['alerts-mobile'] });
              setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
            }
            break;

          case "QUERY_DATA":
          case "ANSWER":
            setMessages(prev => [...prev, { role: "assistant", content: reply || message || "Done." }]);
            break;

          default:
            setMessages(prev => [...prev, { role: "assistant", content: message || "Command executed." }]);
            break;
        }

        base44.analytics.track({ eventName: "fleet_ai_mobile_command_success", properties: { action } });
        addThinkingLog('complete', 'Done');
        break;
      } catch (error) {
        attempts++;
        addThinkingLog('error', `Error: ${error.message}`);
        if (attempts >= maxRetries) {
          setMessages(prev => [...prev, { role: "system", content: `❌ Error: ${error.message}` }]);
          break;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    setIsProcessing(false);
    addThinkingLog('complete', 'Processing complete');
  };

  const handleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice not supported on this device');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (voiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setVoiceActive(false);
        setVoiceWaveform([]);
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceActive(true);
      setIsListening(true);
    };

    recognition.onend = () => {
      setVoiceActive(false);
      setIsListening(false);
      setVoiceWaveform([]);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + finalTranscript);
      } else if (interimTranscript) {
        setInput(interimTranscript);
      }

      // Animate waveform
      setVoiceWaveform(prev => {
        const next = [...prev, Math.random() * 100];
        return next.slice(-8);
      });
    };

    recognition.onerror = (event) => {
      toast.error(`Voice error: ${event.error}`);
      setVoiceActive(false);
    };

    recognition.start();
  }, [voiceActive]);

  const quickActions = [
    { label: "Fleet Status", icon: "📍" },
    { label: "Active Alerts", icon: "🚨" },
    { label: "Routes", icon: "🛣️" },
    { label: "Shipments", icon: "📦" },
  ];

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-black to-violet-950/50" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl transition-opacity duration-3000 ${systemPulse ? 'opacity-100' : 'opacity-40'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl transition-opacity duration-3000 ${systemPulse ? 'opacity-40' : 'opacity-100'}`} />
      </div>

      {/* Holographic Header */}
      <motion.div 
        className="relative z-10 px-4 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
              <Brain className="w-6 h-6 text-cyan-400" />
            </motion.div>
            <div>
              <div className="font-bold text-sm tracking-wider">FLEET AI</div>
              <div className="text-[10px] text-cyan-400/60">Neural Command System</div>
            </div>
          </div>
          <motion.div 
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-800 text-slate-100'
            }`}>
              <ReactMarkdown className="text-xs">
                {msg.content}
              </ReactMarkdown>
              {msg.files && msg.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.files.map((file, i) => (
                    <div key={i} className="text-[10px] text-slate-300 truncate">
                      📎 {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Thinking Terminal */}
      <AnimatePresence>
        {showThinkingTerminal && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 border-t border-slate-700 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-400">Processing...</span>
              <button 
                onClick={() => setShowThinkingTerminal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Hide
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto text-[10px] text-slate-400">
              {thinkingLogs.slice(-5).map((log, i) => (
                <div key={i}>▸ {log.message}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Upload List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700 bg-slate-800/30 p-2"
          >
            <div className="space-y-1">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1 text-xs">
                  <span className="truncate text-slate-300">{file.name}</span>
                  <button 
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-400 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur p-3 space-y-2">
        {/* Quick Actions */}
        {!input && messages.length < 3 && (
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.label)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition"
              >
                <div className="text-lg mb-0.5">{action.icon}</div>
                <div className="truncate">{action.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && processCommand()}
            placeholder="Command FLEET AI..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleVoiceInput}
            disabled={isListening}
            className={`p-2 rounded-lg transition ${isListening ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'text-white animate-pulse' : 'text-slate-400'}`} />
          </button>
          <label className="p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition">
            <Paperclip className="w-5 h-5 text-slate-400" />
            <input 
              ref={fileInputRef}
              type="file" 
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept="*/*"
            />
          </label>
          <button
            onClick={processCommand}
            disabled={!input.trim() || isProcessing}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg px-4 py-2 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}