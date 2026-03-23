import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, MapPin, TrendingUp, AlertTriangle, Users, Clock, Zap,
  Radio, Shield, BarChart3, Sparkles, Globe, Network, Brain,
  ChevronRight, Play, Settings, MessageSquare, Maximize2, Activity,
  Battery, Fuel, Plus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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

export default function TransitControl() {
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [realtimeRecommendations, setRealtimeRecommendations] = useState(null);
  const [assigningDriver, setAssigningDriver] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lines = [] } = useQuery({
    queryKey: ['busLines'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.BusLine.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
    refetchInterval: 30000,
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const allStops = await base44.entities.BusStop.list();
      // Include both org-specific stops and global stops (organization_id is null)
      return allStops.filter(s => !s.organization_id || s.organization_id === user.organization_id);
    },
    enabled: !!user?.organization_id,
  });

  const { data: activeTrips = [] } = useQuery({
    queryKey: ['activeTrips'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.BusTrip.filter({ 
        organization_id: user.organization_id,
        status: 'in_progress'
      });
    },
    enabled: !!user?.organization_id,
    refetchInterval: 10000,
  });

  const { data: activeBuses = [] } = useQuery({
    queryKey: ['activeBuses'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Bus.filter({ 
        organization_id: user.organization_id,
        status: 'in_service'
      });
    },
    enabled: !!user?.organization_id,
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['busDrivers'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.BusDriver.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['transitKPIs'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.TransitKPI.filter({ 
        organization_id: user.organization_id 
      }, '-date', 7);
    },
    enabled: !!user?.organization_id,
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['transitAlerts'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Alert.filter({ 
        organization_id: user.organization_id,
        is_resolved: false
      });
    },
    enabled: !!user?.organization_id,
    refetchInterval: 10000,
  });

  const realtimeControlMutation = useMutation({
    mutationFn: () => base44.functions.invoke('transitRealtimeControl', {
      organization_id: user.organization_id
    }),
    onSuccess: (response) => {
      setRealtimeRecommendations(response.data);
      toast.success('AI Control Analysis Complete');
    },
    onError: () => {
      toast.error('Analysis failed');
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ busId, driverId }) => base44.entities.Bus.update(busId, { driver_id: driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBuses'] });
      toast.success('Driver assigned to bus');
      setAssigningDriver(null);
    },
  });

  const todayKPI = kpis[0] || {};
  const delayedTrips = activeTrips.filter(t => (t.delay_minutes || 0) > 5);
  const overloadedBuses = activeBuses.filter(b => 
    (b.passenger_count || 0) > (b.capacity_seated + b.capacity_standing) * 0.9
  );

  // Auto-refresh real-time control every 2 minutes
  useEffect(() => {
    if (!user?.organization_id) return;
    
    const interval = setInterval(() => {
      realtimeControlMutation.mutate();
    }, 120000);

    return () => clearInterval(interval);
  }, [user?.organization_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 max-w-[1900px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Globe className="w-12 h-12 text-cyan-400" />
              </motion.div>
              Neural Transit Orchestration
            </h1>
            <p className="text-slate-400 text-lg">Digital Twin Command Center • {lines.length} Lines • {activeBuses.length} Active Buses</p>
          </div>
          <div className="flex gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2 text-base">
              <Radio className="w-5 h-5 mr-2 animate-pulse" />
              Live System
            </Badge>
            {alerts.length > 0 && (
              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 px-4 py-2 text-base animate-pulse">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {alerts.length} Alerts
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Real-Time KPI Dashboard */}
        <TransitKPIBanner kpis={kpis} activeTrips={activeTrips} activeBuses={activeBuses} />

        {/* Critical Alerts Bar */}
        <TransitAlertBar 
          delayedTrips={delayedTrips} 
          overloadedBuses={overloadedBuses} 
          alerts={alerts}
          onAnalyze={() => realtimeControlMutation.mutate()}
          isAnalyzing={realtimeControlMutation.isPending}
        />

        {/* Main Control Interface */}
        <Tabs defaultValue="operations" className="space-y-6">
          <TabsList className="bg-slate-800/70 border border-slate-700/50 p-1 backdrop-blur-xl">
            <TabsTrigger value="operations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Radio className="w-4 h-4 mr-2" />
              Live Operations
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
              <Network className="w-4 h-4 mr-2" />
              Network Design
            </TabsTrigger>
            <TabsTrigger value="planning" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <Brain className="w-4 h-4 mr-2" />
              Planning & Analytics
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Scenario Testing
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="data-[state=active]:bg-fuchsia-500/20 data-[state=active]:text-fuchsia-300">
              <MapPin className="w-4 h-4 mr-2" />
              Infrastructure Setup
            </TabsTrigger>
          </TabsList>

          {/* OPERATIONS BOARD */}
          <TabsContent value="operations" className="space-y-6">
            {/* ADVANCED ANALYTICS DASHBOARD */}
            <AdvancedAnalyticsDashboard 
              kpis={todayKPI} 
              activeTrips={activeTrips} 
              buses={activeBuses}
              trips={activeTrips}
            />

            {/* PREDICTIVE CAPACITY OPTIMIZER */}
            <PredictiveCapacityOptimizer
              buses={activeBuses}
              trips={activeTrips}
              lines={lines}
            />

            {/* INCIDENT RESPONSE CENTER */}
            <IncidentResponseCenter
              incidents={[]}
              buses={activeBuses}
              drivers={drivers}
            />

            {/* Live Transit Map */}
            <LiveTransitMap
<Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                Active Trips Detailed View
              </h3>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeTrips.map((trip, i) => {
                  const tripLine = lines.find(l => l.id === trip.line_id);
                  const tripBus = activeBuses.find(b => b.id === trip.assigned_bus_id);
                  const isDelayed = (trip.delay_minutes || 0) > 5;

                  return (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`p-4 rounded-xl border ${
                        isDelayed 
                          ? 'bg-rose-500/10 border-rose-500/30' 
                          : 'bg-slate-700/30 border-slate-600/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">Line {tripLine?.line_number || trip.line_id}</p>
                          <p className="text-xs text-slate-400">{trip.direction_id}</p>
                        </div>
                        <Badge className={isDelayed ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}>
                          {isDelayed ? `+${trip.delay_minutes}min` : 'On time'}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Bus:</span>
                          <span className="text-white">{tripBus?.bus_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Departure:</span>
                          <span className="text-white">{trip.scheduled_departure}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Passengers:</span>
                          <span className="text-cyan-400">{tripBus?.passenger_count || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* NETWORK DESIGN */}
          <TabsContent value="network">
            <NetworkDesignStudio organizationId={user?.organization_id} />
          </TabsContent>

          {/* PLANNING STUDIO */}
          <TabsContent value="planning" className="space-y-6">
            <FrequencyOptimizer organizationId={user?.organization_id} />
            <div className="mt-8">
              <PassengerExperiencePanel organizationId={user?.organization_id} />
            </div>
          </TabsContent>

          {/* SCENARIOS */}
          <TabsContent value="scenarios">
            <ScenarioSimulator organizationId={user?.organization_id} />
          </TabsContent>

          {/* INFRASTRUCTURE SETUP */}
          <TabsContent value="infrastructure" className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Bus className="w-8 h-8 text-cyan-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Bus Management</h3>
                  <p className="text-sm text-slate-400">Manage buses from the Units page</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">
                All bus fleet management has been centralized in the <span className="font-semibold text-cyan-400">Units</span> page for better coordination across your entire fleet.
              </p>
              <Button
                onClick={() => window.location.href = '/Fleet'}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-black font-semibold"
              >
                Go to Units
              </Button>
            </div>
            <BusStopManager organizationId={user?.organization_id} stops={stops} />
            <BusLineManager organizationId={user?.organization_id} lines={lines} stops={stops} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={!!assigningDriver} onOpenChange={() => setAssigningDriver(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Assign Driver to {assigningDriver?.bus_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Select Driver</label>
              <Select 
                value={assigningDriver?.driver_id || ""} 
                onValueChange={(driverId) => {
                  assignDriverMutation.mutate({ 
                    busId: assigningDriver.id, 
                    driverId: driverId 
                  });
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Choose driver..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No driver (unassign)</SelectItem>
                  {drivers.filter(d => d.status === 'active').map(driver => (
                    <SelectItem key={driver.driver_id} value={driver.driver_id}>
                      {driver.first_name} {driver.last_name} - #{driver.employee_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              Driver will be able to access this bus from Nexus Orbit and receive route assignments.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}