import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Sparkles, Send, Mic, Brain, Zap, TrendingUp, AlertTriangle, 
  Truck, Route, Package, Activity, Maximize2, Minimize2, X, LayoutDashboard 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';

const HologramWindow = ({ id, title, icon: Icon, children, position, onClose, onMinimize, isMinimized }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState(position);
  const dragRef = useRef(null);

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
          className="bg-cyan-500/20 border border-cyan-500/50 backdrop-blur-xl hover:bg-cyan-500/30"
        >
          <Icon className="w-4 h-4 mr-2" />
          {title}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 50 }}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-96"
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        setPos({ x: pos.x + info.offset.x, y: pos.y + info.offset.y });
      }}
    >
      <div className="bg-slate-900/40 backdrop-blur-2xl rounded-2xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Hologram effect border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 cursor-move">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-white font-semibold">{title}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={onMinimize}
                className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function IntellectMode() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "system", content: "⚡ FLEET AI online. Specialized logistics intelligence ready. Command me to open windows, create routes, manage fleet operations, or answer strategic questions." }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWindows, setActiveWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    enabled: !!currentUser
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Alert.filter({ organization_id: userData[0].organization_id, is_resolved: false });
    },
    enabled: !!currentUser
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Route.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-intellect'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Shipment.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openWindow = (type, position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }) => {
    if (activeWindows.find(w => w.type === type)) {
      toast.info(`${type} window already open`);
      return;
    }
    setActiveWindows(prev => [...prev, { type, id: Date.now(), position }]);
  };

  const closeWindow = (id) => {
    setActiveWindows(prev => prev.filter(w => w.id !== id));
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleMinimize = (id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
      properties: { command_length: currentCommand.length }
    });

    setMessages(prev => [...prev, { role: "user", content: currentCommand }]);
    setInput("");
    setIsProcessing(true);

    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const userData = await base44.entities.User.filter({ email: currentUser.email });
        const orgId = userData?.[0]?.organization_id;

        // FLEET AI analyzes ALL commands
        setMessages(prev => [...prev, { role: "system", content: "⚡ FLEET analyzing..." }]);
        
        const mistralResponse = await Promise.race([
          base44.functions.invoke('mistralCommand', {
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
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
        ]);

        const { action, parameters, message, open_window } = mistralResponse.data;
        setRetryCount(0);

      // Udfør handlingen
      switch (action) {
        case "OPEN_WINDOW":
          const validWindows = ['fleet', 'alerts', 'routes', 'shipments'];
          if (parameters.window_type && validWindows.includes(parameters.window_type)) {
            openWindow(parameters.window_type);
            setMessages(prev => [...prev, { role: "system", content: `✅ ${message}` }]);
          } else {
            setMessages(prev => [...prev, { role: "system", content: `❌ Invalid window: ${parameters.window_type}. Use: fleet, alerts, routes, or shipments` }]);
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

  const renderWindowContent = (type) => {
    switch (type) {
      case "fleet":
        return (
          <div className="space-y-3">
            <div className="text-cyan-400 text-sm font-semibold mb-2">Active Vehicles ({vehicles.length})</div>
            {vehicles.slice(0, 5).map(vehicle => (
              <div key={vehicle.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{vehicle.name}</span>
                  <Badge className={
                    vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }>
                    {vehicle.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">
                  {vehicle.type} • {vehicle.fuel_level}% fuel
                </div>
              </div>
            ))}
          </div>
        );
      
      case "alerts":
        return (
          <div className="space-y-3">
            <div className="text-amber-400 text-sm font-semibold mb-2">Active Alerts ({alerts.length})</div>
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="p-3 bg-slate-800/50 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium">{alert.title}</span>
                </div>
                <div className="text-xs text-slate-400">{alert.message}</div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-slate-400 text-center py-4">No active alerts</div>
            )}
          </div>
        );

      case "routes":
        return (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            <div className="text-violet-400 text-sm font-semibold mb-2">Active Routes ({routes.length})</div>
            {routes.slice(0, 5).map(route => (
              <div key={route.id} className="space-y-2">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{route.name}</span>
                    <Badge className={
                      route.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }>
                      {route.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">
                    {route.origin} → {route.destination}
                    {route.distance_km && ` • ${route.distance_km} km`}
                  </div>
                </div>
                
                {route.waypoints && route.waypoints.length > 0 && (
                  <div className="h-48 rounded-lg overflow-hidden border border-violet-500/30">
                    <MapContainer
                      center={[route.waypoints[0].lat, route.waypoints[0].lng]}
                      zoom={5}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                      />
                      <Polyline
                        positions={route.waypoints.map(wp => [wp.lat, wp.lng])}
                        color="#8b5cf6"
                        weight={3}
                      />
                      {route.waypoints.map((wp, idx) => (
                        <Marker key={idx} position={[wp.lat, wp.lng]}>
                          <Popup>
                            <div className="text-sm">
                              <strong>{wp.name || `Point ${idx + 1}`}</strong>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "shipments":
        return (
          <div className="space-y-3">
            <div className="text-blue-400 text-sm font-semibold mb-2">Shipments ({shipments.length})</div>
            {shipments.slice(0, 5).map(shipment => (
              <div key={shipment.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{shipment.tracking_number}</span>
                  <Badge className={
                    shipment.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    shipment.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }>
                    {shipment.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">
                  {shipment.origin} → {shipment.destination}
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-violet-950/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/20 backdrop-blur-xl bg-slate-900/20">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/30">
                <Brain className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  FLEET AI
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs font-semibold">BETA</Badge>
                </h1>
                <p className="text-cyan-400 text-sm">Elite Logistics Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Exit FLEET AI
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/40">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-semibold">System Operational</span>
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
                  window.type === 'shipments' ? 'Shipments' : ''
                }
                icon={
                  window.type === 'fleet' ? Truck :
                  window.type === 'alerts' ? AlertTriangle :
                  window.type === 'routes' ? Route :
                  window.type === 'shipments' ? Package : Activity
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

          {/* Quick Actions */}
          {activeWindows.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <Brain className="w-24 h-24 text-cyan-500/30 mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-4">FLEET AI Standby</h2>
              <p className="text-slate-400 mb-6">Command me to activate hologram windows and manage operations</p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => openWindow('fleet')}
                  className="bg-cyan-500/20 border-2 border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-400"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Open Fleet
                </Button>
                <Button
                  onClick={() => openWindow('alerts')}
                  className="bg-amber-500/20 border-2 border-amber-500/40 hover:bg-amber-500/30 text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Open Alerts
                </Button>
                <Button
                  onClick={() => openWindow('routes')}
                  className="bg-violet-500/20 border-2 border-violet-500/40 hover:bg-violet-500/30 text-violet-400"
                >
                  <Route className="w-4 h-4 mr-2" />
                  Open Routes
                </Button>
                <Button
                  onClick={() => openWindow('shipments')}
                  className="bg-blue-500/20 border-2 border-blue-500/40 hover:bg-blue-500/30 text-blue-400"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Open Shipments
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Command Interface */}
        <div className="p-6 border-t border-cyan-500/20 backdrop-blur-xl bg-slate-900/40">
          <div className="max-w-4xl mx-auto">
            {/* Messages */}
            <div className="mb-4 max-h-32 overflow-y-auto space-y-2">
              {messages.slice(-3).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm ${
                    msg.role === 'user' ? 'text-cyan-400' :
                    msg.role === 'system' ? 'text-emerald-400' :
                    'text-slate-300'
                  }`}
                >
                  <span className="font-semibold">
                    {msg.role === 'user' ? '> ' : msg.role === 'system' ? '⚡ ' : '🧠 '}
                  </span>
                  {msg.content}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
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
                placeholder="Enter command (e.g., 'open fleet', 'show alerts', 'create route from Copenhagen to Berlin')..."
                disabled={isProcessing}
                className="flex-1 px-6 py-4 bg-slate-900/50 border-2 border-cyan-500/30 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 backdrop-blur-xl"
              />
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
                className={`px-6 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'} rounded-2xl`}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                onClick={processCommand}
                disabled={isProcessing || !input.trim()}
                className="px-8 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 rounded-2xl"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="mt-3 text-xs text-slate-500 text-center">
              Examples: "create ship route from Copenhagen to London" • "set all vehicles to maintenance" • "how many shipments are delayed?" • "create 3 trucks with high fuel"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}