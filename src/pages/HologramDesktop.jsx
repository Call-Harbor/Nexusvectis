import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Monitor, Truck, Route, Package, Bell, Activity, Zap, Globe,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Fuel, MapPin,
  Wifi, WifiOff, X, GripHorizontal, Minimize2, Maximize2
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Draggable hologram widget
function HoloWidget({ title, icon: Icon, color, children, defaultPos, id }) {
  const [pos, setPos] = useState(defaultPos || { x: 40, y: 40 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const onMouseUp = () => {
    dragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const borderColor = {
    cyan: "border-cyan-500/60",
    violet: "border-violet-500/60",
    emerald: "border-emerald-500/60",
    amber: "border-amber-500/60",
    red: "border-red-500/60",
    blue: "border-blue-500/60",
  }[color] || "border-cyan-500/60";

  const glowColor = {
    cyan: "shadow-cyan-500/20",
    violet: "shadow-violet-500/20",
    emerald: "shadow-emerald-500/20",
    amber: "shadow-amber-500/20",
    red: "shadow-red-500/20",
    blue: "shadow-blue-500/20",
  }[color] || "shadow-cyan-500/20";

  const iconColor = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    blue: "text-blue-400",
  }[color] || "text-cyan-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: "absolute", left: pos.x, top: pos.y, zIndex: 10 }}
      className={`rounded-2xl border-2 ${borderColor} bg-slate-950/90 backdrop-blur-xl shadow-2xl ${glowColor} min-w-[280px]`}
    >
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 ${borderColor} rounded-tl-2xl pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 ${borderColor} rounded-tr-2xl pointer-events-none`} />

      {/* Header */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 cursor-move select-none bg-slate-900/40 rounded-t-2xl"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-white text-xs font-semibold tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')} animate-pulse`} />
            <div className={`w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')} opacity-50 animate-pulse`} style={{ animationDelay: '0.4s' }} />
          </div>
          <button onClick={() => setMinimized(m => !m)} className="ml-2 text-slate-500 hover:text-slate-300 transition-colors">
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="p-4">
          {children}
        </div>
      )}
    </motion.div>
  );
}

const WIDGET_TYPES = ['fleet', 'alerts', 'shipments', 'routes', 'map', 'trend'];

export default function HologramDesktop() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [time, setTime] = useState(new Date());
  // Active widgets - user can remove or add
  const [activeWidgets, setActiveWidgets] = useState(WIDGET_TYPES);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Listen for "send widget here" messages from IntellectMode
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'ADD_WIDGET') {
        const wt = e.data.windowType;
        if (!activeWidgets.includes(wt)) {
          setActiveWidgets(prev => [...prev, wt]);
          // brief visual notification
          document.title = `⚡ Widget received — FLEET AI Desktop`;
          setTimeout(() => { document.title = 'FLEET AI — Hologram Desktop'; }, 3000);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeWidgets]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      base44.entities.User.filter({ email: u.email }).then(ud => {
        if (ud?.[0]?.organization_id) setOrgId(ud[0].organization_id);
      });
    }).catch(() => {});
  }, []);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['holo-vehicles', orgId],
    queryFn: () => base44.entities.Vehicle.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 10000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['holo-alerts', orgId],
    queryFn: () => base44.entities.Alert.filter({ organization_id: orgId, is_resolved: false }),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['holo-shipments', orgId],
    queryFn: () => base44.entities.Shipment.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['holo-routes', orgId],
    queryFn: () => base44.entities.Route.filter({ organization_id: orgId }),
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const idleVehicles = vehicles.filter(v => v.status === 'idle');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const inTransit = shipments.filter(s => s.status === 'in_transit');
  const delayed = shipments.filter(s => s.status === 'delayed');

  const vehicleStatusData = [
    { name: 'Active', value: activeVehicles.length, fill: '#06b6d4' },
    { name: 'Idle', value: idleVehicles.length, fill: '#8b5cf6' },
    { name: 'Maintenance', value: maintenanceVehicles.length, fill: '#f59e0b' },
  ];

  const deliveryTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    deliveries: Math.floor(Math.random() * 30) + 10,
    onTime: Math.floor(Math.random() * 25) + 8,
  }));

  const mapVehicles = vehicles.filter(v => v.latitude && v.longitude).slice(0, 20);
  const mapCenter = mapVehicles.length > 0
    ? [mapVehicles[0].latitude, mapVehicles[0].longitude]
    : [55.6761, 12.5683]; // Copenhagen default

  return (
    <div
      className="w-screen h-screen overflow-hidden relative select-none"
      style={{ background: '#020817' }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-slate-950/70 backdrop-blur border-b border-cyan-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">FLEET AI — Hologram Desktop</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-cyan-400" />{vehicles.length} vehicles</span>
          <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400" />{alerts.length} alerts</span>
          <span className="text-slate-500">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Widgets */}
      {/* Fleet Status */}
      {activeWidgets.includes('fleet') && <HoloWidget title="Fleet Status" icon={Truck} color="cyan" defaultPos={{ x: 40, y: 60 }} onClose={() => setActiveWidgets(p => p.filter(w => w !== 'fleet'))}>
        <div className="space-y-2 min-w-[240px]">
          {[
            { label: 'Active', count: activeVehicles.length, color: 'text-emerald-400', dot: 'bg-emerald-400' },
            { label: 'Idle', count: idleVehicles.length, color: 'text-violet-400', dot: 'bg-violet-400' },
            { label: 'Maintenance', count: maintenanceVehicles.length, color: 'text-amber-400', dot: 'bg-amber-400' },
            { label: 'Offline', count: vehicles.filter(v => v.status === 'offline').length, color: 'text-slate-500', dot: 'bg-slate-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.dot} ${item.count > 0 ? 'animate-pulse' : ''}`} />
                <span className="text-slate-300 text-xs">{item.label}</span>
              </div>
              <span className={`font-bold text-sm ${item.color}`}>{item.count}</span>
            </div>
          ))}
          <div className="mt-2 flex gap-1 pt-1">
            {vehicleStatusData.map((d, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: d.fill, opacity: d.value > 0 ? 1 : 0.2 }} />
            ))}
          </div>
        </div>
      </HoloWidget>

      {/* Live Alerts */}
      <HoloWidget title="Live Alerts" icon={Bell} color="red" defaultPos={{ x: 40, y: 280 }}>
        <div className="space-y-1.5 min-w-[260px] max-h-[180px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
              <CheckCircle className="w-4 h-4" />
              <span>No active alerts</span>
            </div>
          ) : alerts.slice(0, 6).map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
              a.type === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
              a.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
              'bg-slate-800/40 border border-slate-700/40'
            }`}>
              <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${a.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
              <span className="text-slate-300 leading-tight">{a.title}</span>
            </div>
          ))}
        </div>
      </HoloWidget>

      {/* Shipment Tracker */}
      <HoloWidget title="Shipment Tracker" icon={Package} color="emerald" defaultPos={{ x: 360, y: 60 }}>
        <div className="space-y-2 min-w-[240px]">
          {[
            { label: 'In Transit', count: inTransit.length, color: 'text-cyan-400' },
            { label: 'Delayed', count: delayed.length, color: 'text-red-400' },
            { label: 'Pending', count: shipments.filter(s => s.status === 'pending').length, color: 'text-amber-400' },
            { label: 'Delivered', count: shipments.filter(s => s.status === 'delivered').length, color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
              <span className="text-slate-400 text-xs">{item.label}</span>
              <span className={`font-bold text-sm ${item.color}`}>{item.count}</span>
            </div>
          ))}
        </div>
      </HoloWidget>

      {/* Delivery Trend Chart */}
      <HoloWidget title="Delivery Trend (7d)" icon={TrendingUp} color="violet" defaultPos={{ x: 360, y: 290 }}>
        <div className="min-w-[300px]">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={deliveryTrendData}>
              <defs>
                <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" style={{ fontSize: 10 }} />
              <YAxis stroke="#475569" style={{ fontSize: 10 }} width={24} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="deliveries" stroke="#06b6d4" fill="url(#delivGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="onTime" stroke="#8b5cf6" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-slate-400">Total</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-slate-400">On-time</span></div>
          </div>
        </div>
      </HoloWidget>

      {/* Live Map */}
      <HoloWidget title="Live Fleet Map" icon={Globe} color="blue" defaultPos={{ x: 700, y: 60 }}>
        <div className="min-w-[380px]" style={{ height: 300 }}>
          {typeof window !== 'undefined' && (
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution=""
              />
              {mapVehicles.map((v, i) => (
                <Marker key={i} position={[v.latitude, v.longitude]}>
                  <Popup>
                    <div style={{ color: '#fff', background: '#0f172a', padding: 6, borderRadius: 6, fontSize: 11 }}>
                      <strong>{v.name}</strong><br />
                      {v.status} · {v.type}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </HoloWidget>

      {/* Active Routes */}
      <HoloWidget title="Active Routes" icon={Route} color="amber" defaultPos={{ x: 700, y: 400 }}>
        <div className="min-w-[260px] space-y-1.5 max-h-[160px] overflow-y-auto">
          {routes.filter(r => r.status === 'active').slice(0, 6).map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 text-xs">
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-slate-300 truncate flex-1">{r.origin} → {r.destination}</span>
              <span className="text-amber-400 font-mono text-[10px]">{r.distance_km ? `${r.distance_km}km` : ''}</span>
            </div>
          ))}
          {routes.filter(r => r.status === 'active').length === 0 && (
            <p className="text-slate-500 text-xs py-2">No active routes</p>
          )}
        </div>
      </HoloWidget>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-950/70 backdrop-blur border-t border-cyan-500/20 flex items-center justify-center z-50">
        <span className="text-slate-600 text-[11px] tracking-widest uppercase">
          FLEET AI Hologram Desktop · Secondary Display · Drag widgets freely
        </span>
      </div>
    </div>
  );
}