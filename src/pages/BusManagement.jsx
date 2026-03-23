import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bus, Plus, MapPin, Battery, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function BusManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [formData, setFormData] = useState({
    bus_number: '',
    vehicle_type: 'standard_12m',
    fuel_type: 'diesel',
    capacity_seated: 40,
    capacity_standing: 60,
    status: 'idle'
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Bus.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: depots = [] } = useQuery({
    queryKey: ['depots'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.BusDepot.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Bus.create({
        ...data,
        organization_id: user.organization_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setShowAddDialog(false);
    },
  });

  const statusColors = {
    in_service: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    idle: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    charging: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    maintenance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    out_of_service: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Bus className="w-10 h-10 text-cyan-400" />
              Bus Fleet Management
            </h1>
            <p className="text-slate-400">{buses.length} buses in fleet</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-violet-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bus
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "In Service", count: buses.filter(b => b.status === 'in_service').length, color: "emerald" },
            { label: "Idle", count: buses.filter(b => b.status === 'idle').length, color: "slate" },
            { label: "Charging", count: buses.filter(b => b.status === 'charging').length, color: "cyan" },
            { label: "Maintenance", count: buses.filter(b => b.status === 'maintenance').length, color: "amber" },
            { label: "Out of Service", count: buses.filter(b => b.status === 'out_of_service').length, color: "rose" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
            >
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-black text-${stat.color}-400`}>{stat.count}</p>
            </motion.div>
          ))}
        </div>

        {/* Bus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buses.map((bus, i) => (
            <motion.div
              key={bus.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedBus(bus)}
              className="cursor-pointer"
            >
              <Card className="p-5 bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                      <Bus className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{bus.bus_number}</h3>
                      <p className="text-xs text-slate-500">{bus.vehicle_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[bus.status]}>
                    {bus.status?.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {bus.current_line_id && (
                    <div className="text-xs text-violet-300 bg-violet-500/10 px-2 py-1 rounded w-fit">
                      Line {bus.current_line_id}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Capacity</p>
                      <p className="text-white font-medium">{bus.capacity_seated + bus.capacity_standing}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Passengers</p>
                      <p className="text-cyan-400 font-medium">{bus.passenger_count || 0}</p>
                    </div>
                  </div>

                  {bus.fuel_type === 'electric' ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Battery</span>
                        <span className="text-slate-400">{bus.battery_level || 0}%</span>
                      </div>
                      <Progress value={bus.battery_level || 0} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1">{bus.battery_range_km || 0} km range</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Fuel</span>
                        <span className="text-slate-400">{bus.fuel_level || 0}%</span>
                      </div>
                      <Progress value={bus.fuel_level || 0} className="h-2" />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Bus Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bus Number</Label>
              <Input
                value={formData.bus_number}
                onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. BUS-101"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="electric">Electric</SelectItem>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seated Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_seated}
                  onChange={(e) => setFormData({...formData, capacity_seated: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Standing Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity_standing}
                  onChange={(e) => setFormData({...formData, capacity_standing: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.bus_number || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Bus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}