import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Bus, MapPin, TrendingUp, AlertTriangle, Users, Clock, Zap,
  Radio, Shield, BarChart3, Sparkles, Globe, Network, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TransitControl() {
  const [selectedLine, setSelectedLine] = useState(null);
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
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['transitKPIs'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.TransitKPI.filter({ 
        organization_id: user.organization_id 
      }, '-date', 1);
    },
    enabled: !!user?.organization_id,
  });

  const realtimeControlMutation = useMutation({
    mutationFn: () => base44.functions.invoke('transitRealtimeControl', {
      organization_id: user.organization_id
    }),
  });

  const todayKPI = kpis[0] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Globe className="w-10 h-10 text-cyan-400" />
              Neural Transit Orchestration
            </h1>
            <p className="text-slate-400">AI-Powered Bus Command Center</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
              <Radio className="w-4 h-4 mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-slate-500">On-Time</p>
            </div>
            <p className="text-3xl font-black text-white">{todayKPI.on_time_performance || 0}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-slate-500">Load Factor</p>
            </div>
            <p className="text-3xl font-black text-white">{todayKPI.average_load_factor || 0}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bus className="w-4 h-4 text-violet-400" />
              <p className="text-xs text-slate-500">Active Trips</p>
            </div>
            <p className="text-3xl font-black text-white">{activeTrips.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-slate-500">Delays</p>
            </div>
            <p className="text-3xl font-black text-white">{todayKPI.delays_total_minutes || 0}</p>
            <p className="text-xs text-slate-500">min</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-slate-500">Passengers</p>
            </div>
            <p className="text-3xl font-black text-white">{(todayKPI.total_passengers || 0).toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-slate-500">CO₂/pax·km</p>
            </div>
            <p className="text-3xl font-black text-white">{todayKPI.co2_per_passenger_km || 0}</p>
            <p className="text-xs text-slate-500">g</p>
          </motion.div>
        </div>

        {/* Main Control Tabs */}
        <Tabs defaultValue="operations" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="operations">
              <Radio className="w-4 h-4 mr-2" />
              Operations Board
            </TabsTrigger>
            <TabsTrigger value="network">
              <Network className="w-4 h-4 mr-2" />
              Network Design
            </TabsTrigger>
            <TabsTrigger value="planning">
              <Brain className="w-4 h-4 mr-2" />
              Planning Studio
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <Sparkles className="w-4 h-4 mr-2" />
              Scenarios
            </TabsTrigger>
          </TabsList>

          {/* Operations Board */}
          <TabsContent value="operations" className="space-y-6">
            <Card className="p-6 bg-slate-800/30 border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Real-Time Operations</h2>
                <Button
                  onClick={() => realtimeControlMutation.mutate()}
                  disabled={realtimeControlMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {realtimeControlMutation.isPending ? 'Analyzing...' : 'AI Control Suggestions'}
                </Button>
              </div>

              {realtimeControlMutation.data?.data && (
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <h3 className="text-cyan-300 font-semibold mb-2">AI Recommendations</h3>
                    <div className="space-y-2">
                      {realtimeControlMutation.data.data.recommendations.short_turns?.map((st, i) => (
                        <div key={i} className="text-sm text-slate-300">
                          <strong>Short-turn:</strong> Trip {st.trip_id} at {st.turn_at_stop} - {st.reason}
                        </div>
                      ))}
                      {realtimeControlMutation.data.data.recommendations.extra_insertions?.map((ei, i) => (
                        <div key={i} className="text-sm text-slate-300">
                          <strong>Insert trip:</strong> Line {ei.line} - {ei.justification}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-white font-semibold mb-3">Active Buses</h3>
                  {activeBuses.slice(0, 5).map(bus => (
                    <div key={bus.id} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{bus.bus_number}</p>
                          <p className="text-xs text-slate-400">Line {bus.current_line_id || 'Unassigned'}</p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {bus.passenger_count || 0} pax
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-semibold mb-3">Lines Overview</h3>
                  {lines.slice(0, 5).map(line => (
                    <div 
                      key={line.id} 
                      className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/50"
                      onClick={() => setSelectedLine(line)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Line {line.line_number}</p>
                          <p className="text-xs text-slate-400">{line.line_name}</p>
                        </div>
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                          {activeTrips.filter(t => t.line_id === line.id).length} active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Network Design */}
          <TabsContent value="network">
            <Card className="p-6 bg-slate-800/30 border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">AI Network Design Studio</h2>
              <p className="text-slate-400 mb-6">
                Use AI to analyze passenger flows and suggest new lines, express routes, and network restructuring
              </p>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500">
                <Brain className="w-4 h-4 mr-2" />
                Generate Network Proposals
              </Button>
            </Card>
          </TabsContent>

          {/* Planning Studio */}
          <TabsContent value="planning">
            <Card className="p-6 bg-slate-800/30 border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">Holographic Planning Studio</h2>
              <p className="text-slate-400">
                Visual editor for drawing new lines, moving stops, and simulating passenger flow impact
              </p>
            </Card>
          </TabsContent>

          {/* Scenarios */}
          <TabsContent value="scenarios">
            <Card className="p-6 bg-slate-800/30 border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">Scenario Simulation</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {['Storm Weather', 'Metro Breakdown', 'Concert Event'].map((scenario) => (
                  <div key={scenario} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <h3 className="text-white font-semibold mb-2">{scenario}</h3>
                    <Button variant="outline" className="w-full mt-2">
                      Simulate
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}