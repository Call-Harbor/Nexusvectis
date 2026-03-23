import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bus, Plus, X, Battery, Fuel, Users, AlertCircle, TrendingUp, Gauge } from "lucide-react";
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

  const inServiceCount = buses.filter(b => b.status === 'in_service').length;
  const maintenanceCount = buses.filter(b => b.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bus className="w-8 h-8 text-emerald-400" />
            Bus Fleet Management
          </h3>
          <p className="text-slate-400 text-sm mt-2">{buses.length} buses • {inServiceCount} in service</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bus
        </Button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 backdrop-blur-xl">
          <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Total Fleet</p>
          <p className="text-3xl font-bold text-white">{buses.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 backdrop-blur-xl">
          <p className="text-xs text-cyan-400 font-bold uppercase mb-1">In Service</p>
          <p className="text-3xl font-bold text-white">{inServiceCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 backdrop-blur-xl">
          <p className="text-xs text-amber-400 font-bold uppercase mb-1\">Maintenance</p>
          <p className="text-3xl font-bold text-white">{maintenanceCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30 backdrop-blur-xl">
          <p className="text-xs text-violet-400 font-bold uppercase mb-1">Idle</p>
          <p className="text-3xl font-bold text-white">{buses.length - inServiceCount - maintenanceCount}</p>
        </div>
      </div>

      {/* Bus Cards Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buses.map((bus, i) => {
          const capacity = (bus.capacity_seated || 0) + (bus.capacity_standing || 0);
          const occupancy = bus.passenger_count ? Math.round((bus.passenger_count / capacity) * 100) : 0;
          const fuelLevel = bus.fuel_type === 'electric' ? (bus.battery_level || 0) : (bus.fuel_level || 0);
          const lowFuel = fuelLevel < 30;

          return (
          <motion.div
            key={bus.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 shadow-2xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-bold text-lg group-hover:text-cyan-400 transition">{bus.bus_number}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">{bus.vehicle_type?.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                onClick={() => {
                  if (confirm('Remove this bus?')) {
                    deleteBusMutation.mutate(bus.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Status and Passengers */}
              <div className="flex items-center justify-between gap-2">
                <Badge className={
                  bus.status === 'in_service' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' :
                  bus.status === 'idle' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40' :
                  bus.status === 'maintenance' ? 'bg-amber-500/25 text-amber-300 border-amber-500/40' :
                  'bg-slate-500/25 text-slate-300 border-slate-500/40'
                }>
                  <div className="w-2 h-2 rounded-full mr-2" style={{
                    backgroundColor: bus.status === 'in_service' ? '#10b981' : 
                                   bus.status === 'idle' ? '#06b6d4' :
                                   bus.status === 'maintenance' ? '#f59e0b' : '#64748b'
                  }}></div>
                  {bus.status?.replace(/_/g, ' ')}
                </Badge>
                {bus.passenger_count > 0 && (
                  <Badge className="bg-violet-500/25 text-violet-300 border-violet-500/40 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {bus.passenger_count}
                  </Badge>
                )}
              </div>

              {/* Capacity and Occupancy */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium">Capacity</p>
                  <p className="text-white font-bold text-lg mt-1">{capacity}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium\">Occupancy</p>
                  <p className={`text-lg font-bold mt-1 ${occupancy > 80 ? 'text-rose-400' : 'text-cyan-400'}`}>{occupancy}%</p>
                </div>
              </div>

              {/* Load Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium\">Load</span>
                  <span className={occupancy > 80 ? 'text-rose-400 font-bold' : 'text-cyan-400 font-bold'}>{bus.passenger_count || 0}/{capacity}</span>
                </div>
                <Progress value={occupancy} className="h-2 rounded-full" />
              </div>

              {/* Fuel/Battery */}
              {bus.fuel_type === 'electric' ? (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <Battery className={`w-4 h-4 ${lowFuel ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
                      <span className="text-slate-400 font-medium\">Battery</span>
                    </div>
                    <span className={`font-bold ${lowFuel ? 'text-rose-400' : 'text-cyan-400'}`}>{bus.battery_level || 0}%</span>
                  </div>
                  <Progress value={bus.battery_level || 0} className="h-2 rounded-full" />
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <Fuel className={`w-4 h-4 ${lowFuel ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                      <span className="text-slate-400 font-medium\">Fuel</span>
                    </div>
                    <span className={`font-bold ${lowFuel ? 'text-rose-400' : 'text-amber-400'}`}>{bus.fuel_level || 0}%</span>
                  </div>
                  <Progress value={bus.fuel_level || 0} className="h-2 rounded-full" />
                </div>
              )}
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Add Bus Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 text-white backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">Add Bus to Fleet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 font-semibold">Bus Number</Label>
              <Input
                value={formData.bus_number}
                onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                className="bg-slate-800/60 border-white/10 text-white mt-1"
                placeholder="e.g. BUS-001"
              />
            </div>
            <div>
              <Label className="text-slate-300 font-semibold">Vehicle Type</Label>
              <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                <SelectTrigger className="bg-slate-800/60 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="standard_12m">Standard 12m</SelectItem>
                  <SelectItem value="articulated_18m">Articulated 18m</SelectItem>
                  <SelectItem value="minibus">Minibus</SelectItem>
                  <SelectItem value="double_decker">Double Decker</SelectItem>
                  <SelectItem value="brt">BRT</SelectItem>
                  <SelectItem value="electric">Electric Bus</SelectItem>
                  <SelectItem value="hybrid">Hybrid Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 font-semibold">Fuel Type</Label>
              <Select value={formData.fuel_type} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                <SelectTrigger className="bg-slate-800/60 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
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
                <Label className="text-slate-300 font-semibold">Seated Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_seated}
                  onChange={(e) => setFormData({...formData, capacity_seated: parseInt(e.target.value) || 0})}
                  className="bg-slate-800/60 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold">Standing Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_standing}
                  onChange={(e) => setFormData({...formData, capacity_standing: parseInt(e.target.value) || 0})}
                  className="bg-slate-800/60 border-white/10 text-white mt-1"
                />
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/50 mt-6"
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