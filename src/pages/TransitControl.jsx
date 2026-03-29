import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bus, MapPin, TrendingUp, AlertTriangle, Users, Clock, Zap,
  Radio, Shield, BarChart3, Sparkles, Globe, Network, Brain,
  ChevronRight, Play, Settings, MessageSquare, Maximize2, Activity,
  Battery, Fuel, Plus, TrendingDown, Wifi, Target, Gauge, Leaf
 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AddonAccessGate from "@/components/shared/AddonAccessGate";
import LiveTransitMap from "@/components/transit/LiveTransitMap";
import NetworkDesignStudio from "@/components/transit/NetworkDesignStudio";
import ScenarioSimulator from "@/components/transit/ScenarioSimulator";
import FrequencyOptimizer from "@/components/transit/FrequencyOptimizer";
import PassengerExperiencePanel from "@/components/transit/PassengerExperiencePanel";
import BusStopManager from "@/components/transit/BusStopManager";
import BusLineManager from "@/components/transit/BusLineManager";
import BusFleetManager from "@/components/transit/BusFleetManager";
import TransitKPIBanner from "@/components/transit/TransitKPIBanner";
import TransitAlertBar from "@/components/transit/TransitAlertBar";
import TransitOperationsPanel from "@/components/transit/TransitOperationsPanel";
import AdvancedAnalyticsDashboard from "@/components/transit/AdvancedAnalyticsDashboard";
import PredictiveCapacityOptimizer from "@/components/transit/PredictiveCapacityOptimizer";
import IncidentResponseCenter from "@/components/transit/IncidentResponseCenter";
import CrowdingDashboard from "@/components/transit/CrowdingDashboard";
import PassengerFlowPanel from "@/components/transit/PassengerFlowPanel";
import DRTMonitor from "@/components/transit/DRTMonitor";
import SustainabilityPanel from "@/components/transit/SustainabilityPanel";
import TSPInterface from "@/components/transit/TSPInterface";
import DriverCopilot from "@/components/transit/DriverCopilot";
import SmartTicketingPanel from "@/components/transit/SmartTicketingPanel";
import MultiModalPanel from "@/components/transit/MultiModalPanel";
import TransitAIAdvisor from "@/components/transit/TransitAIAdvisor";
import Transit3DGISMap from "@/components/transit/Transit3DGISMap";
import TransitSustainabilityDashboard from "@/components/transit/TransitSustainabilityDashboard";
import TransitPerformanceAnalytics from "@/components/transit/TransitPerformanceAnalytics";
import CrowdingPredictionDashboard from "@/components/transit/CrowdingPredictionDashboard";
import NetworkOptimizationEngine from "@/components/transit/NetworkOptimizationEngine";

const TABS = [
  { id: "operations", label: "LIVE OPS", icon: Radio },
  { id: "network", label: "NETWORK", icon: Network },
  { id: "planning", label: "PLANNING", icon: Brain },
  { id: "scenarios", label: "SCENARIOS", icon: Sparkles },
  { id: "infrastructure", label: "FLEET", icon: Bus },
  { id: "ai-advisor", label: "AI ADVISOR", icon: Sparkles },
  { id: "3d-gis", label: "3D MAP", icon: Globe },
  { id: "sustainability", label: "CO₂", icon: Leaf },
  { id: "performance", label: "PERFORMANCE", icon: BarChart3 },
  { id: "crowding", label: "CROWDING", icon: Users },
  { id: "network-opt", label: "OPTIMIZE", icon: Zap },
  { id: "advanced-ai", label: "ADVANCED", icon: Sparkles },
];

export default function TransitControl() {
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [activeTab, setActiveTab] = useState("operations");
  const [orgId, setOrgId] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [clock, setClock] = useState("");
  const [showAddLine, setShowAddLine] = useState(false);
  const [org, setOrg] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setOrgId(u?.organization_id || "__all__");
      setDataReady(true);
      if (u?.organization_id) {
        base44.entities.Organization.get(u.organization_id).then(setOrg);
      }
    }).catch(() => setDataReady(true));
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lines = [] } = useQuery({
    queryKey: ['busLines', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.BusLine.filter({ organization_id: orgId });
    },
    enabled: !!orgId && dataReady,
    refetchInterval: 30000,
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      const allStops = await base44.entities.BusStop.list();
      return allStops.filter(s => !s.organization_id || s.organization_id === orgId);
    },
    enabled: !!orgId && dataReady,
  });

  const { data: activeTrips = [] } = useQuery({
    queryKey: ['activeTrips', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.BusTrip.filter({ 
        organization_id: orgId,
        status: 'in_progress'
      });
    },
    enabled: !!orgId && dataReady,
    refetchInterval: 10000,
  });

  const { data: activeBuses = [] } = useQuery({
    queryKey: ['activeBuses', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.Bus.filter({ 
        organization_id: orgId,
        status: 'in_service'
      });
    },
    enabled: !!orgId && dataReady,
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['busDrivers', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.BusDriver.filter({ organization_id: orgId });
    },
    enabled: !!orgId && dataReady,
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['transitKPIs', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.TransitKPI.filter({ 
        organization_id: orgId 
      }, '-date', 7);
    },
    enabled: !!orgId && dataReady,
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['transitAlerts', orgId],
    queryFn: async () => {
      if (!orgId || orgId === "__all__") return [];
      return await base44.entities.Alert.filter({ 
        organization_id: orgId,
        is_resolved: false
      });
    },
    enabled: !!orgId && dataReady,
    refetchInterval: 10000,
  });

  const todayKPI = kpis[0] || {};
  const delayedTrips = activeTrips.filter(t => (t.delay_minutes || 0) > 5);
  const overloadedBuses = activeBuses.filter(b => 
    (b.passenger_count || 0) > (b.capacity_seated + b.capacity_standing) * 0.9
  );

  return (
    <AddonAccessGate addon="addon_transit_control" org={org} addonName="Transit Control" monthlyPrice="€2,000">
      <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {/* Header */}
        <div className="relative border-b border-indigo-900/40" style={{ background: "linear-gradient(180deg, rgba(0,15,35,0.99) 0%, rgba(0,8,20,0.99) 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)" }} />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <svg className="absolute" width="40" height="40" viewBox="0 0 40 40">
                  <polygon points="20,3 35,10 35,30 20,37 5,30 5,10" fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" strokeWidth="1" />
                </svg>
                <Bus className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase" style={{ color: "#8b5cf6", textShadow: "0 0 20px rgba(139,92,246,0.6)" }}>
                  NEXUSVECTIS TRANSIT
                </h1>
                <p className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em] uppercase hidden sm:block" style={{ color: "rgba(139,92,246,0.4)" }}>
                  AI-Powered Transit Operations Command Center
                </p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-3 sm:gap-5">
              {[
                { label: "ACTIVE BUSES", val: activeBuses.length, color: "#8b5cf6" },
                { label: "DELAYED", val: delayedTrips.length, color: delayedTrips.length > 0 ? "#f43f5e" : "#10b981" },
                { label: "BUS LINES", val: lines.length, color: "#06b6d4" },
                { label: "PUNCTUALITY", val: (todayKPI.on_time_performance ? Math.round(todayKPI.on_time_performance) : 0) + "%", color: "#10b981" },
              ].map(k => (
                <div key={k.label} className="text-center hidden sm:block">
                  <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(139,92,246,0.4)" }}>{k.label}</p>
                  <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
              <div className="text-right">
                <p className="text-2xl font-black font-mono" style={{ color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.4)" }}>{clock}</p>
                <p className="text-[8px] tracking-widest" style={{ color: "rgba(6,182,212,0.4)" }}>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</p>
              </div>
              <button onClick={() => setShowAddLine(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[9px] tracking-widest uppercase">New Line</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] tracking-widest uppercase" style={{ color: "#10b981" }}>OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Banner */}
        <TransitKPIBanner kpis={kpis} activeTrips={activeTrips} activeBuses={activeBuses} />

        {/* Tabs */}
        <div className="border-b border-slate-800/60 overflow-x-auto scrollbar-none">
          <div className="flex px-3 sm:px-6 pt-2 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 mr-1 whitespace-nowrap flex-shrink-0"
                style={{
                  color: active ? "#8b5cf6" : "rgba(100,116,139,0.6)",
                  borderColor: active ? "#8b5cf6" : "transparent",
                  background: active ? "rgba(139,92,246,0.05)" : "transparent",
                  textShadow: active ? "0 0 8px rgba(139,92,246,0.4)" : "none",
                }}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === "operations" && (
            <div className="space-y-4">
              <TransitAlertBar 
                delayedTrips={delayedTrips} 
                overloadedBuses={overloadedBuses} 
                alerts={alerts}
                onAnalyze={() => {}}
                isAnalyzing={false}
              />
              <AdvancedAnalyticsDashboard 
                kpis={todayKPI} 
                activeTrips={activeTrips} 
                buses={activeBuses}
                trips={activeTrips}
              />
              <PredictiveCapacityOptimizer
                buses={activeBuses}
                trips={activeTrips}
                lines={lines}
              />
              <IncidentResponseCenter
                incidents={[]}
                buses={activeBuses}
                drivers={drivers}
              />
              <LiveTransitMap 
                organizationId={orgId} 
                buses={activeBuses}
                stops={stops}
                onBusClick={setSelectedBus}
              />
              <Card className="p-8 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                    Live Trips Dashboard
                  </h3>
                  <Badge className="bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold">
                    <Radio className="w-3 h-3 mr-2 animate-pulse" />
                    Real-time
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeTrips.map((trip, i) => {
                    const tripLine = lines.find(l => l.id === trip.line_id);
                    const tripBus = activeBuses.find(b => b.id === trip.assigned_bus_id);
                    const isDelayed = (trip.delay_minutes || 0) > 5;
                    return (
                      <div
                        key={trip.id}
                        className={`p-5 rounded-xl border backdrop-blur-xl transition-all ${
                          isDelayed 
                            ? 'bg-gradient-to-br from-rose-500/20 to-rose-500/5 border-rose-500/30 hover:border-rose-400/50' 
                            : 'bg-gradient-to-br from-slate-700/30 to-slate-800/20 border-white/10 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold">Line {tripLine?.line_number || trip.line_id}</p>
                            <p className="text-xs text-slate-400">{trip.direction_id}</p>
                          </div>
                          <Badge className={isDelayed ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                            {isDelayed ? `+${trip.delay_minutes}min` : 'On time'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Bus:</span>
                            <span className="text-white font-medium">{tripBus?.bus_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Departure:</span>
                            <span className="text-white">{trip.scheduled_departure}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Passengers:</span>
                            <span className="text-cyan-400 font-semibold">{tripBus?.passenger_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
          {activeTab === "network" && (
            <NetworkDesignStudio organizationId={orgId} />
          )}
          {activeTab === "planning" && (
            <div className="space-y-8">
              <FrequencyOptimizer organizationId={orgId} />
              <PassengerExperiencePanel organizationId={orgId} />
            </div>
          )}
          {activeTab === "scenarios" && (
            <ScenarioSimulator organizationId={orgId} />
          )}
          {activeTab === "infrastructure" && (
            <div className="space-y-8">
              <BusFleetManager organizationId={orgId} />
              <BusStopManager organizationId={orgId} stops={stops} />
              <BusLineManager organizationId={orgId} lines={lines} stops={stops} />
            </div>
          )}
          {activeTab === "ai-advisor" && (
            <TransitAIAdvisor buses={activeBuses} trips={activeTrips} lines={lines} />
          )}
          {activeTab === "3d-gis" && (
            <Transit3DGISMap buses={activeBuses} stops={stops} lines={lines} />
          )}
          {activeTab === "sustainability" && (
            <TransitSustainabilityDashboard buses={activeBuses} trips={activeTrips} />
          )}
          {activeTab === "performance" && (
            <TransitPerformanceAnalytics trips={activeTrips} buses={activeBuses} />
          )}
          {activeTab === "crowding" && (
            <CrowdingPredictionDashboard buses={activeBuses} trips={activeTrips} />
          )}
          {activeTab === "network-opt" && (
            <NetworkOptimizationEngine lines={lines} buses={activeBuses} trips={activeTrips} />
          )}
          {activeTab === "advanced-ai" && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <CrowdingDashboard />
                <PassengerFlowPanel />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <DRTMonitor />
                <SustainabilityPanel />
              </div>
              <TSPInterface organizationId={orgId} />
              <DriverCopilot organizationId={orgId} />
              <SmartTicketingPanel organizationId={orgId} />
              <MultiModalPanel organizationId={orgId} />
            </div>
          )}
        </div>

        {/* Add Bus Line Dialog */}
        <Dialog open={showAddLine} onOpenChange={() => setShowAddLine(false)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader><DialogTitle>New Bus Line</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Line Name *</Label><Input className="bg-slate-800 border-slate-700" placeholder="Line 1A" /></div>
                <div><Label>Line Number</Label><Input className="bg-slate-800 border-slate-700" placeholder="1" /></div>
                <div><Label>Status</Label>
                  <Select defaultValue="planned">
                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button
                className="w-full py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
                Create Line
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AddonAccessGate>
  );
}