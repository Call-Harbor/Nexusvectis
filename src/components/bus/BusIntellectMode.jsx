import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import { Brain, Zap, Activity, Users, TrendingUp, AlertTriangle, Globe, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ buses, center }) {
  const map = useMap();

  useEffect(() => {
    if (buses.length > 0 && center) {
      map.setView(center, map.getZoom());
    }
  }, [center, buses, map]);

  return null;
}

export default function BusIntellectMode({ buses, routes, stops }) {
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState("passenger_load");
  const [viewMode, setViewMode] = useState("global");
  const mapRef = useRef();

  // Auto-detect center based on data or use global view
  const getMapCenter = () => {
    if (viewMode === "global") {
      return [20, 0]; // Global view centered
    }
    
    if (buses.length > 0 && buses[0].latitude && buses[0].longitude) {
      return [buses[0].latitude, buses[0].longitude];
    }
    
    if (stops.length > 0 && stops[0].latitude && stops[0].longitude) {
      return [stops[0].latitude, stops[0].longitude];
    }
    
    // Default to Copenhagen
    return [55.6761, 12.5683];
  };

  const getMapZoom = () => {
    return viewMode === "global" ? 2 : 12;
  };

  // Calculate heatmap intensity for each bus
  const getHeatmapColor = (bus) => {
    const loadPercentage = bus.capacity ? (bus.current_passengers / bus.capacity) * 100 : 0;
    
    if (heatmapMode === "passenger_load") {
      if (loadPercentage > 90) return "#ef4444"; // red
      if (loadPercentage > 70) return "#f59e0b"; // amber
      if (loadPercentage > 50) return "#eab308"; // yellow
      return "#10b981"; // green
    } else if (heatmapMode === "delay") {
      if (bus.delay_minutes > 10) return "#ef4444";
      if (bus.delay_minutes > 5) return "#f59e0b";
      if (bus.delay_minutes > 2) return "#eab308";
      return "#10b981";
    } else if (heatmapMode === "fuel") {
      if (bus.fuel_level < 20) return "#ef4444";
      if (bus.fuel_level < 40) return "#f59e0b";
      if (bus.fuel_level < 60) return "#eab308";
      return "#10b981";
    }
    return "#10b981";
  };

  // Custom bus marker
  const createBusIcon = (bus, color) => {
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-size: 12px;
          color: white;
          font-weight: bold;
        ">
          🚌
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createStopIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          border: 2px solid white;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
        "></div>
      `,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  const networkMetrics = {
    totalBuses: buses.length,
    activeBuses: buses.filter(b => b.status === 'active').length,
    avgLoad: buses.length > 0 
      ? Math.round(buses.reduce((acc, b) => acc + ((b.current_passengers / b.capacity) * 100 || 0), 0) / buses.length)
      : 0,
    delayedBuses: buses.filter(b => b.delay_minutes > 5).length,
    totalPassengers: buses.reduce((acc, b) => acc + (b.current_passengers || 0), 0),
    networkEfficiency: 85 + Math.round(Math.random() * 12),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-2xl border border-slate-700/50 p-8 relative overflow-hidden"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <Brain className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Intellect Mode: Neural Transit Command
              </h2>
              <p className="text-slate-400">Global holographic control center • Real-time network intelligence</p>
            </div>
          </div>

          <div className="grid md:grid-cols-6 gap-4">
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30"
            >
              <Activity className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.totalBuses}</div>
              <div className="text-xs text-cyan-400/60">Total Fleet</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30"
            >
              <Zap className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.activeBuses}</div>
              <div className="text-xs text-emerald-400/60">Active</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30"
            >
              <Users className="w-6 h-6 text-violet-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.totalPassengers}</div>
              <div className="text-xs text-violet-400/60">Passengers</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 border border-fuchsia-500/30"
            >
              <TrendingUp className="w-6 h-6 text-fuchsia-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.avgLoad}%</div>
              <div className="text-xs text-fuchsia-400/60">Avg Load</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30"
            >
              <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.delayedBuses}</div>
              <div className="text-xs text-amber-400/60">Delayed</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30"
            >
              <Brain className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-white">{networkMetrics.networkEfficiency}%</div>
              <div className="text-xs text-blue-400/60">Network AI</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("global")}
            variant={viewMode === "global" ? "default" : "outline"}
            className={viewMode === "global" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : ""}
          >
            <Globe className="w-4 h-4 mr-2" />
            Global View
          </Button>
          <Button
            onClick={() => setViewMode("local")}
            variant={viewMode === "local" ? "default" : "outline"}
            className={viewMode === "local" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : ""}
          >
            <Layers className="w-4 h-4 mr-2" />
            Local View
          </Button>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            onClick={() => setHeatmapMode("passenger_load")}
            variant={heatmapMode === "passenger_load" ? "default" : "outline"}
            size="sm"
            className={heatmapMode === "passenger_load" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : ""}
          >
            Passenger Load
          </Button>
          <Button
            onClick={() => setHeatmapMode("delay")}
            variant={heatmapMode === "delay" ? "default" : "outline"}
            size="sm"
            className={heatmapMode === "delay" ? "bg-gradient-to-r from-amber-500 to-orange-500" : ""}
          >
            Delays
          </Button>
          <Button
            onClick={() => setHeatmapMode("fuel")}
            variant={heatmapMode === "fuel" ? "default" : "outline"}
            size="sm"
            className={heatmapMode === "fuel" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : ""}
          >
            Fuel Status
          </Button>
        </div>
      </div>

      {/* Holographic 3D Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative"
        style={{ height: '70vh' }}
      >
        {/* Holographic overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none z-[1000]" />
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-[1000]"
        />

        <MapContainer
          center={getMapCenter()}
          zoom={getMapZoom()}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          zoomControl={true}
          ref={mapRef}
        >
          <MapController buses={buses} center={getMapCenter()} />
          
          {/* Dark themed map tiles for holographic effect */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Route lines */}
          {routes.map((route) => {
            if (!route.waypoints || route.waypoints.length < 2) return null;
            
            const routeStops = route.stops || [];
            const stopCoords = routeStops
              .map(s => {
                const stop = stops.find(st => st.id === s.stop_id);
                return stop && stop.latitude && stop.longitude ? [stop.latitude, stop.longitude] : null;
              })
              .filter(Boolean);

            if (stopCoords.length < 2) return null;

            return (
              <Polyline
                key={route.id}
                positions={stopCoords}
                pathOptions={{
                  color: '#8b5cf6',
                  weight: 3,
                  opacity: 0.6,
                  dashArray: '10, 10',
                }}
              />
            );
          })}

          {/* Bus stops */}
          {stops.map((stop) => {
            if (!stop.latitude || !stop.longitude) return null;
            
            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={createStopIcon()}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-violet-600">{stop.stop_name}</div>
                    <div className="text-xs text-slate-600">{stop.stop_code}</div>
                    <div className="text-xs text-slate-500 mt-1">{stop.address}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Buses with heatmap colors */}
          {buses.map((bus) => {
            if (!bus.latitude || !bus.longitude) return null;
            
            const color = getHeatmapColor(bus);
            const loadPercentage = bus.capacity ? Math.round((bus.current_passengers / bus.capacity) * 100) : 0;

            return (
              <React.Fragment key={bus.id}>
                <Marker
                  position={[bus.latitude, bus.longitude]}
                  icon={createBusIcon(bus, color)}
                  eventHandlers={{
                    click: () => setSelectedBus(bus),
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <div className="font-bold text-lg mb-2">Bus {bus.bus_number}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Type:</span>
                          <span className="font-medium">{bus.bus_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Load:</span>
                          <span className="font-medium">{bus.current_passengers}/{bus.capacity} ({loadPercentage}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Speed:</span>
                          <span className="font-medium">{bus.speed || 0} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Delay:</span>
                          <span className={`font-medium ${bus.delay_minutes > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {bus.delay_minutes > 0 ? '+' : ''}{bus.delay_minutes || 0} min
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fuel:</span>
                          <span className="font-medium">{bus.fuel_level || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Heatmap circle around bus */}
                <Circle
                  center={[bus.latitude, bus.longitude]}
                  radius={loadPercentage * 5}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.2,
                    color: color,
                    weight: 1,
                    opacity: 0.4,
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Heatmap legend */}
        <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 z-[1000]">
          <div className="text-xs font-bold text-white mb-2">
            {heatmapMode === "passenger_load" && "Passenger Load"}
            {heatmapMode === "delay" && "Delay Status"}
            {heatmapMode === "fuel" && "Fuel Level"}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-slate-300">Optimal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: '#eab308' }} />
              <span className="text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: '#f59e0b' }} />
              <span className="text-slate-300">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: '#ef4444' }} />
              <span className="text-slate-300">Critical</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}