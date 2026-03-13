import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Fleet3DGlobeMap from "../components/tracking/Fleet3DGlobeMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Globe, 
  Zap, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Network,
  Sparkles,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HolographicInterface() {
  const [user, setUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
    refetchInterval: 5000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: digitalTwins = [] } = useQuery({
    queryKey: ['digitalTwins'],
    queryFn: () => base44.entities.DigitalTwin.list(),
  });

  const { data: swarmCoords = [] } = useQuery({
    queryKey: ['swarmCoords'],
    queryFn: () => base44.entities.SwarmCoordination.list(),
  });

  const stats = {
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    totalVehicles: vehicles.length,
    activeRoutes: routes.filter(r => r.status === 'active').length,
    avgEfficiency: vehicles.length > 0 
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.efficiency_score || 0), 0) / vehicles.length)
      : 0,
    digitalTwins: digitalTwins.length,
    swarmNodes: swarmCoords.length
  };

  const panelContent = {
    fleet: {
      title: "Fleet Status",
      icon: Users,
      color: "cyan",
      data: vehicles.slice(0, 5).map(v => ({
        name: v.name,
        status: v.status,
        efficiency: v.efficiency_score
      }))
    },
    swarm: {
      title: "Swarm Intelligence",
      icon: Network,
      color: "violet",
      data: swarmCoords.slice(0, 3).map(s => ({
        coordination: s.coordination_type || 'active',
        nodes: s.member_count || 0
      }))
    },
    twins: {
      title: "Digital Twins",
      icon: Activity,
      color: "emerald",
      data: digitalTwins.slice(0, 4).map(t => ({
        entity: t.entity_type,
        sync: t.sync_status || 'synced'
      }))
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      {/* Holographic Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Holographic Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Globe className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Holographic Interface
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                INTELLECT MODE™ • DIGITAL TWIN FEDERATION • SWARM INTELLIGENCE
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ONLINE
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
          {[
            { label: "Active Vehicles", value: `${stats.activeVehicles}/${stats.totalVehicles}`, icon: Users, color: "cyan" },
            { label: "Active Routes", value: stats.activeRoutes, icon: TrendingUp, color: "violet" },
            { label: "Avg Efficiency", value: `${stats.avgEfficiency}%`, icon: Zap, color: "amber" },
            { label: "Digital Twins", value: stats.digitalTwins, icon: Activity, color: "emerald" },
            { label: "Swarm Nodes", value: stats.swarmNodes, icon: Network, color: "pink" },
            { label: "AI Status", value: "OPTIMAL", icon: Sparkles, color: "indigo" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-slate-900/50 border-slate-800 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <div className={cn("text-xl font-bold", `text-${stat.color}-400`)}>
                  {stat.value}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main 3D Globe */}
      <div className={cn(
        "absolute transition-all duration-500",
        isFullscreen ? "inset-0 z-10" : "top-44 left-6 right-6 bottom-6 z-10",
        "rounded-2xl overflow-hidden border border-slate-800/50 shadow-2xl"
      )}>
        <Fleet3DGlobeMap 
          vehicles={vehicles} 
          routes={routes}
          onSelectVehicle={setSelectedVehicle}
        />
      </div>

      {/* Side Panel Controls */}
      {!isFullscreen && (
        <div className="absolute top-44 right-6 z-20 space-y-3">
          {Object.entries(panelContent).map(([key, panel]) => {
            const Icon = panel.icon;
            return (
              <Button
                key={key}
                onClick={() => setActivePanel(activePanel === key ? null : key)}
                className={cn(
                  "w-12 h-12 rounded-xl transition-all",
                  activePanel === key
                    ? `bg-${panel.color}-500/20 border-${panel.color}-500/50`
                    : "bg-slate-900/50 border-slate-800 hover:bg-slate-800"
                )}
                variant="outline"
              >
                <Icon className={cn("w-5 h-5", activePanel === key ? `text-${panel.color}-400` : "text-slate-400")} />
              </Button>
            );
          })}
        </div>
      )}

      {/* Active Panel Overlay */}
      {activePanel && !isFullscreen && (
        <Card className="absolute top-44 left-1/2 -translate-x-1/2 z-30 w-96 bg-slate-900/95 border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {React.createElement(panelContent[activePanel].icon, { 
                className: `w-5 h-5 text-${panelContent[activePanel].color}-400` 
              })}
              <h3 className="font-semibold text-white">{panelContent[activePanel].title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActivePanel(null)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto space-y-2">
            {activePanel === 'fleet' && panelContent.fleet.data.map((v, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{v.name}</span>
                  <Badge className={cn(
                    "text-xs",
                    v.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                    v.status === 'idle' ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {v.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-slate-400">Efficiency: {v.efficiency}%</span>
                </div>
              </div>
            ))}
            
            {activePanel === 'swarm' && panelContent.swarm.data.map((s, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">Coordination #{i + 1}</span>
                  <Badge className="bg-violet-500/20 text-violet-400 text-xs">
                    {s.nodes} nodes
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Network className="w-3 h-3 text-violet-400" />
                  <span className="text-xs text-slate-400">{s.coordination}</span>
                </div>
              </div>
            ))}
            
            {activePanel === 'twins' && panelContent.twins.data.map((t, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium capitalize">{t.entity}</span>
                  <Badge className={cn(
                    "text-xs",
                    t.sync === 'synced' ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {t.sync}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Vehicle Details */}
      {selectedVehicle && !isFullscreen && (
        <Card className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-80 bg-slate-900/95 border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">{selectedVehicle.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedVehicle(null)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <Badge className={cn(
                  selectedVehicle.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                  selectedVehicle.status === 'idle' ? "bg-amber-500/20 text-amber-400" :
                  "bg-slate-500/20 text-slate-400"
                )}>
                  {selectedVehicle.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Type</div>
                <div className="text-sm text-white capitalize">{selectedVehicle.type}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Speed</div>
                <div className="text-sm text-white">{selectedVehicle.speed || 0} km/h</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Fuel</div>
                <div className="text-sm text-white">{selectedVehicle.fuel_level || 0}%</div>
              </div>
            </div>
            {selectedVehicle.efficiency_score && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Efficiency Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full"
                      style={{ width: `${selectedVehicle.efficiency_score}%` }}
                    />
                  </div>
                  <span className="text-sm text-cyan-400 font-semibold">
                    {selectedVehicle.efficiency_score}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}