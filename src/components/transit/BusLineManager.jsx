import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Plus, X, Clock, MapPin, Route, Sparkles, Navigation, TrendingUp, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function BusLineManager({ organizationId, lines = [], stops = [] }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [formData, setFormData] = useState({
    line_number: "",
    line_name: "",
    status: "active"
  });

  const queryClient = useQueryClient();

  const createLineMutation = useMutation({
    mutationFn: (data) => base44.entities.BusLine.create({
      ...data,
      organization_id: organizationId,
      directions: [],
      service_windows: [],
      daily_trips: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busLines'] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Bus line created');
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (id) => base44.entities.BusLine.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busLines'] });
      toast.success('Bus line deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      line_number: "",
      line_name: "",
      status: "active"
    });
  };

  const toggleStop = (stopId) => {
    setSelectedStops(prev => 
      prev.includes(stopId) 
        ? prev.filter(id => id !== stopId)
        : [...prev, stopId]
    );
    setOptimizedRoute(null);
  };

  const optimizeRoute = async () => {
    if (selectedStops.length < 2) {
      toast.error('Select at least 2 stops');
      return;
    }

    setIsOptimizing(true);
    try {
      const selectedStopData = stops.filter(s => selectedStops.includes(s.id));
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a transit route optimization AI. Given these bus stops, calculate the most efficient route order that minimizes total travel distance.

Stops:
${selectedStopData.map(s => `- ${s.stop_name} (${s.latitude}, ${s.longitude})`).join('\n')}

Calculate:
1. Optimal stop sequence (minimize total distance)
2. Estimated travel time between each stop (in minutes, based on typical city speeds ~30 km/h average)
3. Total route length in km
4. Suggested headway/frequency based on route length

Return ONLY valid JSON with this structure:
{
  "stop_sequence": [{"stop_id": "...", "stop_name": "...", "sequence_order": 1, "travel_time_from_previous": 0}, ...],
  "total_distance_km": number,
  "total_time_minutes": number,
  "suggested_frequency_minutes": number,
  "route_efficiency_score": number (0-100)
}`,
        response_json_schema: {
          type: "object",
          properties: {
            stop_sequence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stop_id: { type: "string" },
                  stop_name: { type: "string" },
                  sequence_order: { type: "number" },
                  travel_time_from_previous: { type: "number" }
                }
              }
            },
            total_distance_km: { type: "number" },
            total_time_minutes: { type: "number" },
            suggested_frequency_minutes: { type: "number" },
            route_efficiency_score: { type: "number" }
          }
        }
      });

      setOptimizedRoute(response);
      toast.success('Route optimized by AI');
    } catch (error) {
      toast.error('Optimization failed');
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const saveOptimizedRoute = async () => {
    if (!selectedLine || !optimizedRoute) return;

    const directionData = {
      direction_id: "outbound",
      direction_name: "Outbound Route",
      stop_sequence: optimizedRoute.stop_sequence.map(s => ({
        stop_id: s.stop_id,
        sequence_order: s.sequence_order,
        planned_travel_time_minutes: s.travel_time_from_previous
      }))
    };

    try {
      await base44.entities.BusLine.update(selectedLine.id, {
        directions: [directionData],
        route_length_km: optimizedRoute.total_distance_km,
        average_trip_time_minutes: optimizedRoute.total_time_minutes
      });

      queryClient.invalidateQueries({ queryKey: ['busLines'] });
      setShowRouteDialog(false);
      setSelectedStops([]);
      setOptimizedRoute(null);
      toast.success('Route saved to line');
    } catch (error) {
      toast.error('Failed to save route');
    }
  };

  const activeLines = lines.filter(l => l.status === 'active').length;
  const totalRouteKm = lines.reduce((sum, l) => sum + (l.route_length_km || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-bold text-white flex items-center gap-3">
            <Network className="w-8 h-8 text-violet-400" />
            Bus Lines & Routes
          </h3>
          <p className="text-slate-400 text-sm mt-2">{lines.length} lines • {activeLines} active</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:shadow-violet-500/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Line
        </Button>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30 backdrop-blur-xl">
          <p className="text-xs text-violet-400 font-bold uppercase mb-1">Total Lines</p>
          <p className="text-3xl font-bold text-white">{lines.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 backdrop-blur-xl">
          <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Active</p>
          <p className="text-3xl font-bold text-white">{activeLines}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 backdrop-blur-xl">
          <p className="text-xs text-cyan-400 font-bold uppercase mb-1">Total Route</p>
          <p className="text-3xl font-bold text-white">{totalRouteKm.toFixed(0)} km</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 backdrop-blur-xl">
          <p className="text-xs text-amber-400 font-bold uppercase mb-1">Stops</p>
          <p className="text-3xl font-bold text-white">{stops.length}</p>
        </div>
      </div>

      {/* Bus Lines Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lines.map((line, i) => {
          const passengersDaily = Math.floor((line.annual_passengers || 0) / 365);
          const isActive = line.status === 'active';

          return (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-violet-500/40 shadow-2xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg group-hover:text-violet-400 transition\">Line {line.line_number}</h4>
                <p className="text-sm text-slate-400 font-medium mt-1\">{line.line_name}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                onClick={() => {
                  if (confirm('Delete this line?')) {
                    deleteLineMutation.mutate(line.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Status Badge */}
              <Badge className={
                line.status === 'active' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' :
                line.status === 'suspended' ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' :
                'bg-slate-500/25 text-slate-300 border-slate-500/40'
              }>
                <div className="w-2 h-2 rounded-full mr-2" style={{
                  backgroundColor: line.status === 'active' ? '#10b981' : line.status === 'suspended' ? '#ef4444' : '#64748b'
                }}></div>
                {line.status}
              </Badge>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium\">Directions</p>
                  <p className="text-white font-bold text-lg mt-1\">{line.directions?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium\">Daily Trips</p>
                  <p className="text-white font-bold text-lg mt-1\">{line.daily_trips || 0}</p>
                </div>
              </div>

              {/* Route Details */}
              {line.route_length_km > 0 && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/25">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-violet-400" />
                      <span className="text-slate-400 font-medium\">Route Length</span>
                    </div>
                    <span className="text-violet-400 font-bold\">{line.route_length_km.toFixed(1)} km</span>
                  </div>
                  {line.average_trip_time_minutes > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span className="text-slate-400 font-medium\">Trip Time</span>
                      </div>
                      <span className="text-cyan-400 font-bold\">{line.average_trip_time_minutes} min</span>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Passengers */}
              {passengersDaily > 0 && (
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 font-medium\">Avg Daily Passengers</p>
                  <p className="text-white font-bold text-sm mt-1\">{passengersDaily.toLocaleString()}</p>
                </div>
              )}

              {/* Configure Button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 text-xs border-white/20 hover:bg-violet-500/20"
                onClick={() => {
                  setSelectedLine(line);
                  setShowRouteDialog(true);
                }}
              >
                <Route className="w-3 h-3 mr-2" />
                Configure Route
              </Button>
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Add Line Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 text-white backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">Add Bus Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 font-semibold">Line Number</Label>
              <Input
                value={formData.line_number}
                onChange={(e) => setFormData({...formData, line_number: e.target.value})}
                className="bg-slate-800/60 border-white/10 text-white mt-1"
                placeholder="e.g. 5A, 42, Express 1"
              />
            </div>
            <div>
              <Label className="text-slate-300 font-semibold">Line Name</Label>
              <Input
                value={formData.line_name}
                onChange={(e) => setFormData({...formData, line_name: e.target.value})}
                className="bg-slate-800/60 border-white/10 text-white mt-1"
                placeholder="e.g. City Center - Airport"
              />
            </div>
            <div>
              <Label className="text-slate-300 font-semibold">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-800/60 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:shadow-violet-500/50 mt-6"
              onClick={() => createLineMutation.mutate(formData)}
              disabled={!formData.line_number || !formData.line_name || createLineMutation.isPending}
            >
              {createLineMutation.isPending ? 'Creating...' : 'Create Line'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Route Configuration Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 text-white backdrop-blur-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Configure Route - Line {selectedLine?.line_number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Stop Selection */}
            <div>
              <Label className="text-lg text-slate-300 font-semibold mb-3 block">Select Stops for This Route</Label>
              <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-slate-800/50 rounded-xl border border-white/10">
                {stops.map(stop => (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStops.includes(stop.id)
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                    onClick={() => toggleStop(stop.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedStops.includes(stop.id)} />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{stop.stop_name}</p>
                        <p className="text-xs text-slate-400">{stop.stop_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {selectedStops.length} stops selected
              </p>
            </div>

            {/* Optimize Button */}
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg"
              onClick={optimizeRoute}
              disabled={selectedStops.length < 2 || isOptimizing}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isOptimizing ? 'Optimizing Route...' : 'AI Optimize Route'}
            </Button>

            {/* Optimized Route Display */}
            <AnimatePresence>
              {optimizedRoute && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Route Stats */}
                  <Card className="p-4 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border-cyan-500/30">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      AI Optimized Route
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400\">Total Distance</p>
                        <p className="text-xl font-bold text-white mt-1\">{optimizedRoute.total_distance_km?.toFixed(1)} km</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400\">Travel Time</p>
                        <p className="text-xl font-bold text-white mt-1\">{optimizedRoute.total_time_minutes} min</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400\">Suggested Frequency</p>
                        <p className="text-xl font-bold text-white mt-1\">{optimizedRoute.suggested_frequency_minutes} min</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400\">Efficiency Score</p>
                        <p className="text-xl font-bold text-cyan-400 mt-1\">{optimizedRoute.route_efficiency_score}/100</p>
                      </div>
                    </div>
                  </Card>

                  {/* Route Visualization */}
                  <Card className="p-4 bg-slate-800/50 border-slate-700">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-violet-400" />
                      Optimized Stop Sequence
                    </h4>
                    <div className="space-y-2">
                      {optimizedRoute.stop_sequence?.map((stop, index) => (
                        <motion.div
                          key={stop.stop_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 font-bold text-sm">
                            {stop.sequence_order}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{stop.stop_name}</p>
                            {stop.travel_time_from_previous > 0 && (
                              <p className="text-xs text-slate-400">
                                +{stop.travel_time_from_previous} min from previous
                              </p>
                            )}
                          </div>
                          <MapPin className="w-4 h-4 text-cyan-400" />
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  {/* Save Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg"
                    onClick={saveOptimizedRoute}
                  >
                    Save Route to Line
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}