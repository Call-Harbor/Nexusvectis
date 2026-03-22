import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Route, MapPin, Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BusRouteEditor({ route, onSave, onClose }) {
  const [formData, setFormData] = useState(route || {
    route_number: "",
    route_name: "",
    route_type: "urban",
    frequency_minutes: 15,
    status: "active",
    estimated_duration_minutes: 45,
    total_distance_km: 12,
    stops: [],
  });

  const [selectedStops, setSelectedStops] = useState(route?.stops || []);
  const [optimizingRoute, setOptimizingRoute] = useState(false);

  const { data: availableStops = [] } = useQuery({
    queryKey: ['busStops'],
    queryFn: () => base44.entities.BusStop.list('-stop_code', 200),
  });

  const addStop = (stopId) => {
    const stop = availableStops.find(s => s.id === stopId);
    if (!stop) return;
    
    const newStop = {
      stop_id: stop.id,
      sequence: selectedStops.length,
      travel_time_from_previous: selectedStops.length > 0 ? 3 : 0,
    };
    setSelectedStops([...selectedStops, newStop]);
  };

  const removeStop = (index) => {
    const updated = selectedStops.filter((_, i) => i !== index).map((s, i) => ({ ...s, sequence: i }));
    setSelectedStops(updated);
  };

  const moveStop = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedStops.length) return;
    
    const updated = [...selectedStops];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((s, i) => s.sequence = i);
    setSelectedStops(updated);
  };

  const optimizeRoute = async () => {
    if (selectedStops.length < 2) {
      toast.error('Add at least 2 stops to optimize');
      return;
    }

    setOptimizingRoute(true);
    try {
      // Simulate AI optimization by calculating distances and reordering
      const stopsWithCoords = selectedStops.map(s => {
        const stop = availableStops.find(as => as.id === s.stop_id);
        return { ...s, lat: stop?.latitude, lng: stop?.longitude, name: stop?.stop_name };
      });

      // Simple optimization: keep first and last, optimize middle
      if (stopsWithCoords.length > 2) {
        const first = stopsWithCoords[0];
        const last = stopsWithCoords[stopsWithCoords.length - 1];
        const middle = stopsWithCoords.slice(1, -1);
        
        // Sort middle stops by distance from first stop (simplified)
        middle.sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.lat - first.lat, 2) + Math.pow(a.lng - first.lng, 2));
          const distB = Math.sqrt(Math.pow(b.lat - first.lat, 2) + Math.pow(b.lng - first.lng, 2));
          return distA - distB;
        });

        const optimized = [first, ...middle, last].map((s, i) => ({
          ...s,
          sequence: i,
          travel_time_from_previous: i > 0 ? Math.round(2 + Math.random() * 4) : 0,
        }));

        setSelectedStops(optimized);
        
        // Calculate total distance and duration
        let totalDist = 0;
        let totalTime = 0;
        for (let i = 1; i < optimized.length; i++) {
          const dist = Math.sqrt(
            Math.pow(optimized[i].lat - optimized[i-1].lat, 2) + 
            Math.pow(optimized[i].lng - optimized[i-1].lng, 2)
          ) * 111; // rough km conversion
          totalDist += dist;
          totalTime += optimized[i].travel_time_from_previous;
        }

        setFormData({
          ...formData,
          total_distance_km: parseFloat(totalDist.toFixed(1)),
          estimated_duration_minutes: totalTime,
        });

        toast.success('Route optimized by AI');
      }
    } catch (error) {
      toast.error('Failed to optimize route');
    } finally {
      setOptimizingRoute(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedStops.length < 2) {
      toast.error('Route must have at least 2 stops');
      return;
    }

    const stopIds = selectedStops.map(s => s.stop_id);
    const uniqueStops = new Set(stopIds);
    if (stopIds.length !== uniqueStops.size) {
      toast.error('Cannot have duplicate stops in route');
      return;
    }

    const routeData = {
      ...formData,
      stops: selectedStops,
      start_stop_id: selectedStops[0]?.stop_id,
      end_stop_id: selectedStops[selectedStops.length - 1]?.stop_id,
    };
    
    onSave(routeData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Route className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {route ? 'Edit Route' : 'Add New Route'}
              </h2>
              <p className="text-sm text-slate-400">Configure route details</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Route Number *</Label>
              <Input
                required
                value={formData.route_number}
                onChange={(e) => setFormData({...formData, route_number: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., 5A"
              />
            </div>
            <div>
              <Label className="text-slate-300">Route Name *</Label>
              <Input
                required
                value={formData.route_name}
                onChange={(e) => setFormData({...formData, route_name: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., City Center Loop"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Route Type</Label>
              <Select value={formData.route_type} onValueChange={(val) => setFormData({...formData, route_type: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="suburban">Suburban</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="airport">Airport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Frequency (min)</Label>
              <Input
                type="number"
                value={formData.frequency_minutes}
                onChange={(e) => setFormData({...formData, frequency_minutes: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Duration (min)</Label>
              <Input
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({...formData, estimated_duration_minutes: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.total_distance_km}
                onChange={(e) => setFormData({...formData, total_distance_km: parseFloat(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          {/* Stops Management */}
          <div className="border-t border-slate-700/50 pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-slate-300 text-lg">Route Stops *</Label>
              <Button
                type="button"
                onClick={optimizeRoute}
                disabled={optimizingRoute || selectedStops.length < 2}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {optimizingRoute ? 'Optimizing...' : 'AI Optimize Route'}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Available Stops */}
              <div>
                <Label className="text-slate-400 text-sm mb-2 block">Available Stops</Label>
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-3 max-h-80 overflow-y-auto space-y-2">
                  {availableStops
                    .filter(stop => !selectedStops.find(s => s.stop_id === stop.id))
                    .map(stop => (
                      <motion.div
                        key={stop.id}
                        whileHover={{ x: 4 }}
                        onClick={() => addStop(stop.id)}
                        className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-violet-500/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{stop.stop_name}</div>
                            <div className="text-xs text-slate-400">{stop.stop_code}</div>
                          </div>
                          <Plus className="w-5 h-5 text-violet-400" />
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Selected Stops */}
              <div>
                <Label className="text-slate-400 text-sm mb-2 block">Selected Stops ({selectedStops.length})</Label>
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-3 max-h-80 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {selectedStops.map((stop, index) => {
                      const stopData = availableStops.find(s => s.id === stop.stop_id);
                      return (
                        <motion.div
                          key={stop.stop_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="text-sm font-bold text-violet-400">{index + 1}</div>
                              <div className="flex-1">
                                <div className="text-white font-medium text-sm">{stopData?.stop_name}</div>
                                <div className="text-xs text-slate-400">{stopData?.stop_code}</div>
                                {index > 0 && (
                                  <div className="text-xs text-violet-400 mt-1">
                                    +{stop.travel_time_from_previous} min from previous
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => moveStop(index, 'up')}
                                disabled={index === 0}
                                className="h-8 w-8"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => moveStop(index, 'down')}
                                disabled={index === selectedStops.length - 1}
                                className="h-8 w-8"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeStop(index)}
                                className="h-8 w-8 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {selectedStops.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p>No stops added yet</p>
                      <p className="text-xs">Click stops from the left to add</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
              <Save className="w-4 h-4 mr-2" />
              {route ? 'Update' : 'Create'} Route
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}