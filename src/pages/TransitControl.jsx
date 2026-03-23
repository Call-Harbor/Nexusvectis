import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, MapPin, TrendingUp, AlertTriangle, Users, Clock, Zap,
  Radio, Shield, BarChart3, Sparkles, Globe, Network, Brain,
  ChevronRight, Play, Settings, MessageSquare, Maximize2, Activity,
  Battery, Fuel, Plus, TrendingDown, Wifi
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

  useEffect(() => {
    if (!user?.organization_id) return;
    
    const interval = setInterval(() => {
      realtimeControlMutation.mutate();
    }, 120000);

    return () => clearInterval(interval);
  }, [user?.organization_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 p-8 overflow-hidden">
      {/* Modern animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-1/4 w-[400px] h-[400px] bg-cyan-500/12 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-[1900px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-12 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full"></div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">Transit Control</h1>
          </div>
          <p className="text-slate-400 text-lg ml-6 font-light">AI-powered fleet & network command • {lines.length} Lines • {activeBuses.length} Buses</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-end gap-3 mb-8"
        >
          <Badge className="bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-400 border-emerald-500/30 px-4 py-2 text-sm font-semibold backdrop-blur-xl">
            <Radio className="w-4 h-4 mr-2 animate-pulse" />
            Live System
          </Badge>
          {alerts.length > 0 && (
            <Badge className="bg-gradient-to-r from-rose-500/30 to-rose-500/10 text-rose-400 border-rose-500/30 px-4 py-2 text-sm font-semibold backdrop-blur-xl animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {alerts.length} Active
            </Badge>
          )}
        </motion.div>

        {/* KPI Banner */}
        <div className="mb-10">
          <TransitKPIBanner kpis={kpis} activeTrips={activeTrips} activeBuses={activeBuses} />
        </div>

        {/* Alerts */}
        {(delayedTrips.length > 0 || overloadedBuses.length > 0 || alerts.length > 0) && (
          <div className="mb-10">
            <TransitAlertBar 
              delayedTrips={delayedTrips} 
              overloadedBuses={overloadedBuses} 
              alerts={alerts}
              onAnalyze={() => realtimeControlMutation.mutate()}
              isAnalyzing={realtimeControlMutation.isPending}
            />
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="operations" className="space-y-8">
          <TabsList className="bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl gap-1">
            <TabsTrigger value="operations" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all text-sm font-medium">
              <Radio className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="network" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all text-sm font-medium">
              <Network className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="planning" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all text-sm font-medium">
              <Brain className="w-4 h-4 mr-2" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all text-sm font-medium">
              <MapPin className="w-4 h-4 mr-2" />
              Infrastructure
            </TabsTrigger>
          </TabsList>

          {/* OPERATIONS */}
          <TabsContent value="operations" className="space-y-8 animate-in fade-in duration-300">
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
              organizationId={user?.organization_id} 
              buses={activeBuses}
              stops={stops}
              onBusClick={setSelectedBus}
            />

            <Card className="p-8 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
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
          </TabsContent>

          {/* NETWORK */}
          <TabsContent value="network" className="animate-in fade-in duration-300">
            <NetworkDesignStudio organizationId={user?.organization_id} />
          </TabsContent>

          {/* PLANNING */}
          <TabsContent value="planning" className="space-y-8 animate-in fade-in duration-300">
            <FrequencyOptimizer organizationId={user?.organization_id} />
            <PassengerExperiencePanel organizationId={user?.organization_id} />
          </TabsContent>

          {/* SCENARIOS */}
          <TabsContent value="scenarios" className="animate-in fade-in duration-300">
            <ScenarioSimulator organizationId={user?.organization_id} />
          </TabsContent>

          {/* INFRASTRUCTURE */}
          <TabsContent value="infrastructure" className="space-y-8 animate-in fade-in duration-300">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl">
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

      {/* Driver Assignment Dialog */}
      <Dialog open={!!assigningDriver} onOpenChange={() => setAssigningDriver(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 text-white backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Assign Driver to {assigningDriver?.bus_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block font-semibold">Select Driver</label>
              <Select 
                value={assigningDriver?.driver_id || ""} 
                onValueChange={(driverId) => {
                  assignDriverMutation.mutate({ 
                    busId: assigningDriver.id, 
                    driverId: driverId 
                  });
                }}
              >
                <SelectTrigger className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
                  <SelectValue placeholder="Choose driver..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
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