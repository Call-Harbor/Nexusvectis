import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bus, Plus, X, Battery, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function BusFleetManager({ organizationId }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    bus_number: "",
    vehicle_type: "standard_12m",
    fuel_type: "diesel",
    capacity_seated: 40,
    capacity_standing: 40,
    status: "idle"
  });

  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({
    queryKey: ['allBuses', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return await base44.entities.Bus.filter({ organization_id: organizationId });
    },
    enabled: !!organizationId,
  });

  const createBusMutation = useMutation({
    mutationFn: (data) => base44.entities.Bus.create({
      ...data,
      organization_id: organizationId,
      battery_level: data.fuel_type === 'electric' ? 100 : 0,
      fuel_level: data.fuel_type !== 'electric' ? 100 : 0,
      passenger_count: 0,
      speed: 0,
      heading: 0,
      latitude: 0,
      longitude: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBuses'] });
      queryClient.invalidateQueries({ queryKey: ['activeBuses'] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Bus added to fleet');
    },
  });

  const deleteBusMutation = useMutation({
    mutationFn: (id) => base44.entities.Bus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBuses'] });
      queryClient.invalidateQueries({ queryKey: ['activeBuses'] });
      toast.success('Bus removed from fleet');
    },
  });

  const resetForm = () => {
    setFormData({
      bus_number: "",
      vehicle_type: "standard_12m",
      fuel_type: "diesel",
      capacity_seated: 40,
      capacity_standing: 40,
      status: "idle"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bus className="w-7 h-7 text-emerald-400" />
          Bus Fleet ({buses.length})
        </h3>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bus
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buses.map((bus, i) => (
          <motion.div
            key={bus.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-bold">{bus.bus_number}</h4>
                <p className="text-xs text-slate-400">{bus.vehicle_type?.replace('_', ' ')}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400"
                onClick={() => {
                  if (confirm('Remove this bus?')) {
                    deleteBusMutation.mutate(bus.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Badge className={
                bus.status === 'in_service' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                bus.status === 'idle' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                bus.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {bus.status?.replace('_', ' ')}
              </Badge>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Capacity</p>
                  <p className="text-white font-semibold">
                    {(bus.capacity_seated || 0) + (bus.capacity_standing || 0)}
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Fuel Type</p>
                  <p className="text-white font-semibold">{bus.fuel_type}</p>
                </div>
              </div>

              {bus.fuel_type === 'electric' ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400">Battery</span>
                    </div>
                    <span className="text-white">{bus.battery_level || 0}%</span>
                  </div>
                  <Progress value={bus.battery_level || 0} className="h-1" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-amber-400" />
                      <span className="text-slate-400">Fuel</span>
                    </div>
                    <span className="text-white">{bus.fuel_level || 0}%</span>
                  </div>
                  <Progress value={bus.fuel_level || 0} className="h-1" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Bus Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Bus to Fleet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bus Number</Label>
              <Input
                value={formData.bus_number}
                onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. BUS-001"
              />
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_12m">Standard 12m</SelectItem>
                  <SelectItem value="articulated_18m">Articulated 18m</SelectItem>
                  <SelectItem value="minibus">Minibus</SelectItem>
                  <SelectItem value="double_decker">Double Decker</SelectItem>
                  <SelectItem value="brt">BRT</SelectItem>
                  <SelectItem value="electric">Electric Bus</SelectItem>
                  <SelectItem value="hybrid">Hybrid Bus</SelectItem>
                  <SelectItem value="diesel">Diesel Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={formData.fuel_type} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                  <SelectItem value="hydrogen">Hydrogen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seated Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_seated}
                  onChange={(e) => setFormData({...formData, capacity_seated: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Standing Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_standing}
                  onChange={(e) => setFormData({...formData, capacity_standing: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              onClick={() => createBusMutation.mutate(formData)}
              disabled={!formData.bus_number || createBusMutation.isPending}
            >
              {createBusMutation.isPending ? 'Creating...' : 'Add to Fleet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}