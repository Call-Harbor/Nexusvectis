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
          command: currentCommand,
          context: { 
            user_timezone: userTimezone,
            fleet_vehicles: vehicles.length,
            active_alerts: alerts.length,
            active_routes: routes.length,
            shipments_in_transit: shipments.length
          },
          history: conversationHistory,
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4 relative z-10">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm border ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                : msg.role === 'system'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-100 border-amber-500/30'
                : 'bg-gradient-to-r from-violet-950/40 to-slate-900/40 text-slate-100 border-violet-500/30'
            }`}>
              <ReactMarkdown className="text-xs leading-relaxed">
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

      {/* Voice Waveform Visualizer */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-violet-950/30 px-4 py-4 backdrop-blur"
          >
            <div className="flex items-center justify-center gap-1 h-12">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-cyan-400 to-violet-400 rounded-full"
                  animate={{ 
                    height: [8, 24 + Math.random() * 20, 8]
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
            <div className="text-center text-xs text-cyan-300 mt-2">
              {isProcessing ? 'Processing...' : 'Listening...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Input Area */}
      <motion.div 
        className="relative z-10 border-t border-cyan-500/30 bg-gradient-to-t from-slate-950/90 via-slate-900/80 to-transparent backdrop-blur-xl p-4 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Quick Actions Grid */}
        <AnimatePresence>
          {!input && !voiceActive && messages.length < 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-4 gap-2"
            >
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  onClick={() => setInput(action.label)}
                  className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border border-cyan-500/30 hover:border-cyan-500/60 text-xs text-center transition-all hover:bg-gradient-to-br hover:from-cyan-500/30 hover:to-violet-500/20"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-lg mb-1">{action.icon}</div>
                  <div className="truncate text-[10px] font-medium">{action.label}</div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && processCommand()}
            placeholder="Speak or type command..."
            className="flex-1 bg-slate-900/60 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:bg-slate-900/80 transition backdrop-blur"
          />
          
          {/* Voice Button */}
          <motion.button
            onClick={handleVoiceInput}
            className={`relative p-3 rounded-lg transition-all ${
              voiceActive 
                ? 'bg-gradient-to-r from-red-600 to-red-700 border border-red-500/50' 
                : 'bg-gradient-to-r from-cyan-600 to-cyan-700 border border-cyan-500/50 hover:from-cyan-500 hover:to-cyan-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {voiceActive ? (
              <>
                <motion.div 
                  className="absolute inset-0 rounded-lg border-2 border-red-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <VolumeX className="w-5 h-5 text-white relative z-10" />
              </>
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </motion.button>

          {/* Send Button */}
          <motion.button
            onClick={processCommand}
            disabled={!input.trim() || isProcessing}
            className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-30 rounded-lg px-4 py-3 transition border border-violet-500/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={isProcessing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
            >
              {isProcessing ? <Zap className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </motion.div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}