import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bus, MapPin, Users, Clock, Zap, TrendingUp, AlertCircle, Settings, Plus, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import BusMap from "../components/bus/BusMap";
import BusCard from "../components/bus/BusCard";
import BusRouteOverview from "../components/bus/BusRouteOverview";
import BusEditor from "../components/bus/BusEditor";
import BusStopEditor from "../components/bus/BusStopEditor";
import BusRouteEditor from "../components/bus/BusRouteEditor";
import NeuralTransitOrchestrator from "../components/bus/NeuralTransitOrchestrator";
import BusIntellectMode from "../components/bus/BusIntellectMode";
import BusFleetAI from "../components/bus/BusFleetAI";

export default function BusFleet() {
  const [selectedBus, setSelectedBus] = useState(null);
  const [view, setView] = useState("intellect"); // intellect, orchestration, map, list, routes
  const [showAISetup, setShowAISetup] = useState(false);
  const [showBusEditor, setShowBusEditor] = useState(false);
  const [showStopEditor, setShowStopEditor] = useState(false);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: buses = [], isLoading: loadingBuses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('-updated_date', 100),
    refetchInterval: 5000, // Real-time updates every 5s
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['busRoutes'],
    queryFn: () => base44.entities.BusRoute.list('-route_number', 50),
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops'],
    queryFn: () => base44.entities.BusStop.list('-stop_code', 200),
  });

  // Auto-show AI setup if no fleet exists
  useEffect(() => {
    if (buses.length === 0 && routes.length === 0 && !loadingBuses) {
      setShowAISetup(true);
    }
  }, [buses.length, routes.length, loadingBuses]);

  const createBusMutation = useMutation({
    mutationFn: async (data) => {
      // Get organization ID from current user
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      
      // Get resource coordinates if resource is selected
      let latitude = 0;
      let longitude = 0;
      
      if (data.resource_id) {
        try {
          const resource = await base44.entities.Resource.get(data.resource_id);
          if (resource?.latitude && resource?.longitude) {
            latitude = resource.latitude;
            longitude = resource.longitude;
          } else {
            toast.error('Resource does not have coordinates. Using default.');
          }
        } catch (error) {
          console.error('Failed to get resource:', error);
          toast.error('Could not get resource location. Using default coordinates.');
        }
      }
      
      return base44.entities.Bus.create({
        ...data,
        organization_id: orgId,
        latitude,
        longitude,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['buses']);
      toast.success('Bus created successfully');
      setShowBusEditor(false);
      setEditingItem(null);
    },
  });

  const createStopMutation = useMutation({
    mutationFn: async (data) => {
      // Get organization ID from current user
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      
      // Geocode the address to get coordinates using AI
      let latitude = 0;
      let longitude = 0;
      
      if (data.address) {
        try {
          const geocodeResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Return the GPS coordinates for this location: ${data.address}. Only return the coordinates, nothing else.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" }
              },
              required: ["latitude", "longitude"]
            }
          });
          
          if (geocodeResult?.latitude && geocodeResult?.longitude) {
            latitude = geocodeResult.latitude;
            longitude = geocodeResult.longitude;
          } else {
            toast.error('Could not find coordinates for this location.');
          }
        } catch (error) {
          console.error('Geocoding failed:', error);
          toast.error('Could not geocode address.');
        }
      }
      
      return base44.entities.BusStop.create({
        ...data,
        organization_id: orgId,
        latitude,
        longitude,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['busStops']);
      toast.success('Stop created successfully');
      setShowStopEditor(false);
      setEditingItem(null);
    },
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data) => {
      // Get organization ID from current user
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      
      return base44.entities.BusRoute.create({
        ...data,
        organization_id: orgId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['busRoutes']);
      toast.success('Route created successfully');
      setShowRouteEditor(false);
      setEditingItem(null);
    },
  });

  const stats = {
    total: buses.length,
    active: buses.filter(b => b.status === 'active').length,
    delayed: buses.filter(b => b.delay_minutes > 5).length,
    avgPassengers: buses.reduce((acc, b) => acc + (b.current_passengers || 0), 0) / (buses.length || 1),
    totalPassengers: buses.reduce((acc, b) => acc + (b.current_passengers || 0), 0),
    capacity: buses.reduce((acc, b) => acc + (b.capacity || 0), 0),
  };

  if (showAISetup) {
    return (
      <BusFleetAI 
        onSetupComplete={() => {
          setShowAISetup(false);
          queryClient.invalidateQueries();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Holographic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-violet-950/20" />
        
        {/* Floating Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 14, repeat: Infinity }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 16, repeat: Infinity }}
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Scan Lines */}
        <motion.div
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-32"
        />
      </div>

      <div className="relative z-10 p-6 max-w-[120rem] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center"
              >
                <Bus className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                  Bus Fleet Command
                </h1>
                <p className="text-slate-400 text-lg">Real-time tracking • Passenger intelligence • AI route optimization</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAISetup(true)}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50 flex items-center gap-2"
              >
                <Brain className="w-5 h-5" />
                AI Setup
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBusEditor(true)}
                className="px-6 py-3 rounded-xl font-semibold bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Bus
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStopEditor(true)}
                className="px-6 py-3 rounded-xl font-semibold bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Stop
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRouteEditor(true)}
                className="px-6 py-3 rounded-xl font-semibold bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Route
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('intellect')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                view === 'intellect' 
                  ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <Brain className="w-5 h-5" />
              Intellect Mode
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('orchestration')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                view === 'orchestration' 
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 border border-violet-400/50' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <Zap className="w-5 h-5" />
              Neural AI
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('map')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                view === 'map' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Map View
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('list')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                view === 'list' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/50' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <Bus className="w-5 h-5" />
              List View
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('routes')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                view === 'routes' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/50' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Routes
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Bus className="w-10 h-10 text-cyan-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-cyan-400/60 font-medium">Total Buses</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Zap className="w-10 h-10 text-emerald-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
                  {stats.active}
                </div>
                <div className="text-sm text-emerald-400/60 font-medium">Active</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">
                  {stats.delayed}
                </div>
                <div className="text-sm text-amber-400/60 font-medium">Delayed</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 backdrop-blur-2xl border border-violet-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Users className="w-10 h-10 text-violet-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
                  {stats.totalPassengers}
                </div>
                <div className="text-sm text-violet-400/60 font-medium">Passengers Now</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 backdrop-blur-2xl border border-fuchsia-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <TrendingUp className="w-10 h-10 text-fuchsia-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {Math.round(stats.avgPassengers)}
                </div>
                <div className="text-sm text-fuchsia-400/60 font-medium">Avg Load</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-2xl border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Clock className="w-10 h-10 text-rose-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent mb-1">
                  {routes.length}
                </div>
                <div className="text-sm text-rose-400/60 font-medium">Routes</div>
                </div>
                </motion.div>
                </div>

                {/* Main Content */}
        {view === 'intellect' && (
          <BusIntellectMode buses={buses} routes={routes} stops={stops} />
        )}

        {view === 'orchestration' && (
          <NeuralTransitOrchestrator buses={buses} routes={routes} stops={stops} />
        )}

        {view === 'map' && (
          <BusMap 
            buses={buses} 
            routes={routes} 
            stops={stops}
            selectedBus={selectedBus}
            onSelectBus={setSelectedBus}
          />
        )}

        {view === 'list' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map(bus => (
              <BusCard 
                key={bus.id} 
                bus={bus}
                onClick={() => setSelectedBus(bus)}
                selected={selectedBus?.id === bus.id}
              />
            ))}
          </div>
        )}

        {view === 'routes' && (
          <BusRouteOverview routes={routes} stops={stops} buses={buses} />
        )}

        {/* Editors */}
        <AnimatePresence>
          {showBusEditor && (
            <BusEditor
              bus={editingItem}
              onSave={(data) => createBusMutation.mutate(data)}
              onClose={() => {
                setShowBusEditor(false);
                setEditingItem(null);
              }}
            />
          )}
          {showStopEditor && (
            <BusStopEditor
              stop={editingItem}
              onSave={(data) => createStopMutation.mutate(data)}
              onClose={() => {
                setShowStopEditor(false);
                setEditingItem(null);
              }}
            />
          )}
          {showRouteEditor && (
            <BusRouteEditor
              route={editingItem}
              stops={stops}
              onSave={(data) => createRouteMutation.mutate(data)}
              onClose={() => {
                setShowRouteEditor(false);
                setEditingItem(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}