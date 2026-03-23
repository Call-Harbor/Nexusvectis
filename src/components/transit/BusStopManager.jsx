import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Plus, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function BusStopManager({ organizationId, stops = [] }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    stop_id: "",
    stop_name: "",
    stop_type: "regular",
    latitude: 0,
    longitude: 0,
    facilities: {
      shelter: false,
      seating: false,
      realtime_display: false,
      ticket_machine: false,
      wheelchair_accessible: false,
      bike_parking: false,
      lighting: false
    }
  });

  const queryClient = useQueryClient();

  const createStopMutation = useMutation({
    mutationFn: (data) => base44.entities.BusStop.create({
      ...data,
      organization_id: organizationId,
      status: "operational"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busStops'] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Bus stop created');
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: (id) => base44.entities.BusStop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busStops'] });
      toast.success('Bus stop deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      stop_id: "",
      stop_name: "",
      stop_type: "regular",
      latitude: 0,
      longitude: 0,
      facilities: {
        shelter: false,
        seating: false,
        realtime_display: false,
        ticket_machine: false,
        wheelchair_accessible: false,
        bike_parking: false,
        lighting: false
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-7 h-7 text-cyan-400" />
          Bus Stops ({stops.length})
        </h3>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-cyan-500 to-violet-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stop
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stops.map((stop, i) => (
          <motion.div
            key={stop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-semibold">{stop.stop_name}</h4>
                <p className="text-xs text-slate-400">ID: {stop.stop_id}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400"
                onClick={() => {
                  if (confirm('Delete this stop?')) {
                    deleteStopMutation.mutate(stop.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Navigation className="w-3 h-3" />
                <span>{stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}</span>
              </div>
              <div className="p-2 rounded bg-slate-900/50">
                <span className="text-violet-400">{stop.stop_type?.replace('_', ' ')}</span>
              </div>
              {stop.daily_passengers_avg > 0 && (
                <div className="text-cyan-400">
                  ~{stop.daily_passengers_avg.toLocaleString()} passengers/day
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Stop Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Bus Stop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Stop ID</Label>
              <Input
                value={formData.stop_id}
                onChange={(e) => setFormData({...formData, stop_id: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. ST-001"
              />
            </div>
            <div>
              <Label>Stop Name</Label>
              <Input
                value={formData.stop_name}
                onChange={(e) => setFormData({...formData, stop_name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Central Station"
              />
            </div>
            <div>
              <Label>Stop Type</Label>
              <Select value={formData.stop_type} onValueChange={(v) => setFormData({...formData, stop_type: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Stop</SelectItem>
                  <SelectItem value="terminal">Terminal</SelectItem>
                  <SelectItem value="interchange">Interchange</SelectItem>
                  <SelectItem value="request_stop">Request Stop</SelectItem>
                  <SelectItem value="brt_station">BRT Station</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Facilities</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(formData.facilities).map((facility) => (
                  <div key={facility} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.facilities[facility]}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        facilities: { ...formData.facilities, [facility]: checked }
                      })}
                    />
                    <Label className="text-xs cursor-pointer">
                      {facility.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500"
              onClick={() => createStopMutation.mutate(formData)}
              disabled={!formData.stop_id || !formData.stop_name || createStopMutation.isPending}
            >
              {createStopMutation.isPending ? 'Creating...' : 'Create Stop'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}