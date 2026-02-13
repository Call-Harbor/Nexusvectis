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
  Settings, Warehouse, Satellite, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';

const HologramWindow = React.memo(({ id, title, icon: Icon, children, position, onClose, onMinimize, isMinimized }) => {
  const [pos, setPos] = useState(position);
  const [size, setSize] = useState({ width: 480, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
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
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-20 left-4 z-40"
      >
        <Button
          onClick={onMinimize}
          className="bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 backdrop-blur-xl hover:from-cyan-500/40 hover:to-violet-500/40 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
        >
          <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-cyan-400" />
          <span className="text-white font-medium">{title}</span>
        </Button>
      </motion.div>
    );
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
            <div className="flex gap-1 sm:gap-2">
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
  const [messages, setMessages] = useState([
    { role: "system", content: "⚡ FLEET AI online. Specialized logistics intelligence ready. Command me to open windows, create routes, manage fleet operations, analyze files, or answer strategic questions." }
  ]);

  const quickCommands = [
    { icon: Globe, label: "Open Dashboard", command: "open dashboard", color: "cyan" },
    { icon: Truck, label: "Show Fleet Status", command: "show fleet status", color: "violet" },
    { icon: Route, label: "Open Route Editor", command: "open route editor", color: "emerald" },
    { icon: AlertTriangle, label: "Check Alerts", command: "check alerts", color: "amber" },
    { icon: Sparkles, label: "AI Optimization", command: "open ai optimization", color: "cyan" },
    { icon: Package, label: "Track Shipments", command: "show shipments", color: "blue" },
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
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const openWindow = useCallback((type, position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }) => {
    if (activeWindows.find(w => w.type === type)) {
      toast.info(`${type} window already open`);
      return;
    }
    setActiveWindows(prev => [...prev, { type, id: Date.now(), position }]);
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

  const processCommand = async () => {
    if (!input.trim() || isProcessing) return;

    const currentCommand = input;
    
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

        const payload = {
          command: currentCommand,
          context: {
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

        if (currentFiles.length > 0) {
          payload.file_urls = currentFiles.map(f => f.url);
          console.log('📤 Sending files:', payload.file_urls);
        }

        const mistralResponse = await Promise.race([
          base44.functions.invoke('mistralCommand', payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
        ]);
        
        // Remove streaming placeholder
        setMessages(prev => prev.filter((_, idx) => idx !== streamingMsgIndex));

        const { action, parameters, message, open_window } = mistralResponse.data;
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
      switch (action) {
        case "OPEN_WINDOW":
          const validWindows = ['fleet', 'alerts', 'routes', 'shipments', 'dashboard', 'settings', 
                                'aioptimization', 'invoices', 'apidocs', 'resources', 
                                'warehouseautomation', 'demandforecasting', 'greentms', 
                                'gpsintegration', 'assignment', 'routeeditor'];
          if (parameters.window_type && validWindows.includes(parameters.window_type)) {
            openWindow(parameters.window_type);
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          } else {
            setMessages(prev => [...prev, { role: "system", content: `❌ Invalid window type` }]);
          }
          break;

        case "CLOSE_WINDOWS":
          setActiveWindows([]);
          setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          break;

        case "CREATE_ROUTE":
          setMessages(prev => [...prev, { role: "system", content: "🔄 Planning route..." }]);
          const routePlan = await base44.functions.invoke('planRoute', {
            origin: parameters.origin,
            destination: parameters.destination,
            transport_type: parameters.transport_type || 'ship'
          });

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
          setMessages(prev => [...prev, { role: "assistant", content: message }]);
          if (open_window) openWindow(open_window);
          
          base44.analytics.track({
            eventName: "fleet_ai_query_answered",
            properties: { action }
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

        break;
      } catch (error) {
        attempts++;
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

  const renderWindowContent = useCallback((type) => {
    // For full page iframes
    if (['dashboard', 'settings', 'aioptimization', 'invoices', 'apidocs', 'resources', 
         'warehouseautomation', 'demandforecasting', 'greentms', 'gpsintegration', 'assignment', 'routeeditor'].includes(type)) {
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
        'routeeditor': 'Routes'
      };
      
      return (
        <iframe 
          src={`${createPageUrl(pageMap[type])}?hologram=true`}
          className="w-full h-full border-0"
          title={pageMap[type]}
        />
      );
    }

    // For fleet/alerts/routes/shipments - open as full page iframes
    if (['fleet', 'alerts', 'routes', 'shipments'].includes(type)) {
      const pageMap = {
        'fleet': 'Fleet',
        'alerts': 'Alerts',
        'routes': 'Routes',
        'shipments': 'Shipments'
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
        <div className="p-3 sm:p-4 lg:p-6 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-900/20">
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
                <p className="text-cyan-400 text-xs sm:text-sm">Elite Logistics Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
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
          {/* Hologram Windows */}
          <AnimatePresence>
            {activeWindows.map((window) => (
              <HologramWindow
                key={window.id}
                id={window.id}
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
                  window.type === 'routeeditor' ? 'Route Editor' : ''
                }
                icon={
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
                  window.type === 'routeeditor' ? Route : Activity
                }
                position={window.position}
                onClose={() => closeWindow(window.id)}
                onMinimize={() => toggleMinimize(window.id)}
                isMinimized={minimizedWindows.has(window.id)}
              >
                {renderWindowContent(window.type)}
              </HologramWindow>
            ))}
          </AnimatePresence>

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
              <p className="text-slate-400">Command me to activate hologram windows and manage operations</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              </motion.div>
          )}
        </div>

        {/* Command Interface */}
        <div className="p-3 sm:p-4 lg:p-6 border-t border-cyan-500/20 backdrop-blur-xl bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:50px_50px]">
          <div className="max-w-4xl mx-auto">
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
                      setInput(cmd.command);
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
                      <span className="text-white text-[11px] sm:text-xs font-semibold">{cmd.label}</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">"{cmd.command}"</p>
                    </motion.button>
                ))}
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
                placeholder="Enter command... (e.g. 'open fleet', 'check alerts', 'analyze attached files')"
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
    </div>
  );
}