import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Plus, X, Clock, MapPin, Route, Sparkles, Navigation } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Network className="w-7 h-7 text-violet-400" />
          Bus Lines ({lines.length})
        </h3>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Line
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lines.map((line, i) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-bold text-lg">Line {line.line_number}</h4>
                <p className="text-sm text-slate-400">{line.line_name}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400"
                onClick={() => {
                  if (confirm('Delete this line?')) {
                    deleteLineMutation.mutate(line.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Badge className={
                line.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                line.status === 'suspended' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {line.status}
              </Badge>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Directions</p>
                  <p className="text-white font-semibold">{line.directions?.length || 0}</p>
                </div>
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Daily Trips</p>
                  <p className="text-white font-semibold">{line.daily_trips || 0}</p>
                </div>
              </div>

              {line.route_length_km > 0 && (
                <div className="text-xs text-cyan-400">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {line.route_length_km} km route
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
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
        ))}
      </div>

      {/* Add Line Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Bus Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Line Number</Label>
              <Input
                value={formData.line_number}
                onChange={(e) => setFormData({...formData, line_number: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. 5A, 42, Express 1"
              />
            </div>
            <div>
              <Label>Line Name</Label>
              <Input
                value={formData.line_name}
                onChange={(e) => setFormData({...formData, line_name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. City Center - Airport"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Route - Line {selectedLine?.line_number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Stop Selection */}
            <div>
              <Label className="text-lg mb-3 block">Select Stops for This Route</Label>
              <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                {stops.map(stop => (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStops.includes(stop.id)
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
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
              <p className="text-xs text-slate-400 mt-2">
                {selectedStops.length} stops selected
              </p>
            </div>

            {/* Optimize Button */}
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
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
                  <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      AI Optimized Route
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400">Total Distance</p>
                        <p className="text-xl font-bold text-white">{optimizedRoute.total_distance_km?.toFixed(1)} km</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400">Travel Time</p>
                        <p className="text-xl font-bold text-white">{optimizedRoute.total_time_minutes} min</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400">Suggested Frequency</p>
                        <p className="text-xl font-bold text-white">{optimizedRoute.suggested_frequency_minutes} min</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-xs text-slate-400">Efficiency Score</p>
                        <p className="text-xl font-bold text-cyan-400">{optimizedRoute.route_efficiency_score}/100</p>
                      </div>
                    </div>
                  </Card>

                  {/* Route Map Visualization */}
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

                  {/* Save Route Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
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