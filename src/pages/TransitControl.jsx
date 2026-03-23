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
import { toast } from "sonner";
import LiveTransitMap from "@/components/transit/LiveTransitMap";
import NetworkDesignStudio from "@/components/transit/NetworkDesignStudio";
import ScenarioSimulator from "@/components/transit/ScenarioSimulator";
import FrequencyOptimizer from "@/components/transit/FrequencyOptimizer";
import PassengerExperiencePanel from "@/components/transit/PassengerExperiencePanel";
import BusStopManager from "@/components/transit/BusStopManager";
import BusLineManager from "@/components/transit/BusLineManager";
import BusFleetManager from "@/components/transit/BusFleetManager";

export default function TransitControl() {
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [realtimeRecommendations, setRealtimeRecommendations] = useState(null);
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <p className="text-xs text-emerald-300 font-semibold">On-Time Performance</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{(todayKPI.on_time_performance || 92).toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Target: 95%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <p className="text-xs text-cyan-300 font-semibold">Load Factor</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{(todayKPI.average_load_factor || 68).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Capacity utilization</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bus className="w-5 h-5 text-violet-400" />
              <p className="text-xs text-violet-300 font-semibold">Active Trips</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{activeTrips.length}</p>
            <p className="text-xs text-slate-500">{delayedTrips.length} delayed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <p className="text-xs text-amber-300 font-semibold">Total Delays</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{todayKPI.delays_total_minutes || 0}</p>
            <p className="text-xs text-slate-500">minutes today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-blue-300 font-semibold">Passengers Today</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{(todayKPI.total_passengers || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500">total transported</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <p className="text-xs text-emerald-300 font-semibold">CO₂ Efficiency</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{(todayKPI.co2_per_passenger_km || 45).toFixed(0)}</p>
            <p className="text-xs text-slate-500">g CO₂ per pax·km</p>
          </motion.div>
        </div>

        {/* Critical Alerts Bar */}
        {(delayedTrips.length > 0 || overloadedBuses.length > 0 || alerts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
                <div>
                  <p className="text-white font-semibold">System Alerts</p>
                  <p className="text-sm text-slate-400">
                    {delayedTrips.length} delayed trips • {overloadedBuses.length} overloaded buses • {alerts.length} active alerts
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => realtimeControlMutation.mutate()}
                disabled={realtimeControlMutation.isPending}
                className="bg-gradient-to-r from-rose-500 to-amber-500"
              >
                <Zap className="w-4 h-4 mr-2" />
                {realtimeControlMutation.isPending ? 'Analyzing...' : 'Get AI Solutions'}
              </Button>
            </div>
          </motion.div>
        )}

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
            {/* Live Transit Map */}
            <LiveTransitMap 
              organizationId={user?.organization_id} 
              buses={activeBuses}
              stops={stops}
              onBusClick={setSelectedBus}
            />

            {/* AI Real-Time Recommendations */}
            {realtimeRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Brain className="w-7 h-7 text-cyan-400" />
                      AI Control Recommendations
                    </h2>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-3 py-1">
                      Urgency: {realtimeRecommendations.recommendations?.urgency_score || 0}/100
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Short Turns */}
                    {realtimeRecommendations.recommendations?.short_turns?.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Short-Turn Opportunities
                        </h3>
                        <div className="space-y-2">
                          {realtimeRecommendations.recommendations.short_turns.map((st, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-800/50 text-sm">
                              <p className="text-white font-medium mb-1">Trip {st.trip_id}</p>
                              <p className="text-slate-400 text-xs mb-1">Turn at: {st.turn_at_stop}</p>
                              <p className="text-amber-300 text-xs">{st.reason}</p>
                              <Button className="w-full mt-2" size="sm" variant="outline">
                                Execute Short-Turn
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extra Insertions */}
                    {realtimeRecommendations.recommendations?.extra_insertions?.length > 0 && (
                      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                        <h3 className="text-violet-300 font-semibold mb-3 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Extra Trip Insertions
                        </h3>
                        <div className="space-y-2">
                          {realtimeRecommendations.recommendations.extra_insertions.map((ei, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-800/50 text-sm">
                              <p className="text-white font-medium mb-1">Line {ei.line}</p>
                              <p className="text-slate-400 text-xs mb-1">Insert at: {ei.insert_at}</p>
                              <p className="text-violet-300 text-xs mb-2">{ei.justification}</p>
                              <p className="text-emerald-400 text-xs">Bus: {ei.available_bus}</p>
                              <Button className="w-full mt-2" size="sm" variant="outline">
                                Schedule Extra Trip
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rerouting */}
                    {realtimeRecommendations.recommendations?.rerouting?.length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                        <h3 className="text-rose-300 font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Rerouting Needed
                        </h3>
                        <div className="space-y-2">
                          {realtimeRecommendations.recommendations.rerouting.map((rr, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-800/50 text-sm">
                              <p className="text-white font-medium mb-1">Trip {rr.trip_id}</p>
                              <p className="text-rose-300 text-xs mb-1">Avoid: {rr.avoid_area}</p>
                              <p className="text-slate-400 text-xs mb-2">{rr.reason}</p>
                              <p className="text-cyan-400 text-xs">Alt: {rr.alternative_route}</p>
                              <Button className="w-full mt-2" size="sm" variant="outline">
                                Apply Reroute
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Active Buses Panel */}
              <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Bus className="w-6 h-6 text-cyan-400" />
                  Active Buses ({activeBuses.length})
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {activeBuses.map((bus, i) => (
                    <motion.div
                      key={bus.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedBus(bus)}
                      className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold">{bus.bus_number}</p>
                          <p className="text-xs text-slate-400">Line {bus.current_line_id || 'Unassigned'}</p>
                        </div>
                        <Badge className={
                          (bus.passenger_count || 0) > (bus.capacity_seated + bus.capacity_standing) * 0.9
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }>
                          {bus.passenger_count || 0}/{(bus.capacity_seated || 0) + (bus.capacity_standing || 0)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {bus.speed || 0} km/h
                        </div>
                        {bus.fuel_type === 'electric' ? (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Battery className="w-3 h-3" />
                            {bus.battery_level || 0}%
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Fuel className="w-3 h-3" />
                            {bus.fuel_level || 0}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Lines & Trips Panel */}
              <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Network className="w-6 h-6 text-violet-400" />
                  Lines Overview ({lines.length})
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {lines.map((line, i) => {
                    const lineTrips = activeTrips.filter(t => t.line_id === line.id);
                    const lineDelays = lineTrips.reduce((sum, t) => sum + (t.delay_minutes || 0), 0);
                    
                    return (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedLine(line)}
                        className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-semibold">Line {line.line_number}</p>
                            <p className="text-xs text-slate-400">{line.line_name}</p>
                          </div>
                          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                            {lineTrips.length} active
                          </Badge>
                        </div>
                        {lineDelays > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            {lineDelays} min total delay
                          </div>
                        )}
                        <div className="mt-2 text-xs text-slate-500">
                          {line.directions?.length || 0} directions • {line.daily_trips || 0} daily trips
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* Drivers & Crew Panel */}
              <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-400" />
                  Active Drivers ({drivers.filter(d => d.status === 'active').length})
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {drivers.filter(d => d.status === 'active').map((driver, i) => {
                    const hoursWorked = driver.current_shift?.hours_worked_today || 0;
                    const maxHours = 9;
                    const isNearLimit = hoursWorked > maxHours * 0.8;

                    return (
                      <motion.div
                        key={driver.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-medium text-sm">{driver.first_name} {driver.last_name}</p>
                            <p className="text-xs text-slate-400">#{driver.employee_number}</p>
                          </div>
                          {isNearLimit && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                              Near limit
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Hours today:</span>
                            <span className={isNearLimit ? 'text-amber-400 font-semibold' : 'text-white'}>
                              {hoursWorked.toFixed(1)}/{maxHours}h
                            </span>
                          </div>
                          <Progress value={(hoursWorked / maxHours) * 100} className="h-1" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Detailed Trip Status */}
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
            <BusFleetManager organizationId={user?.organization_id} />
            <BusStopManager organizationId={user?.organization_id} stops={stops} />
            <BusLineManager organizationId={user?.organization_id} lines={lines} stops={stops} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}