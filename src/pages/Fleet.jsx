import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Ship, Plane, Train, Plus, Search, Filter,
  Fuel, MapPin, Clock, Activity, Settings, Radio, X,
  CheckCircle, AlertCircle, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const vehicleIcons = { truck: Truck, ship: Ship, drone: Plane, train: Train, aircraft: Plane };
const vehicleLabels = { truck: "Lastbil", ship: "Skib", drone: "Drone", train: "Tog", aircraft: "Fly" };
const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  maintenance: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};
const statusLabels = { active: "Aktiv", idle: "Standby", maintenance: "Vedligehold", offline: "Offline" };

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: "", type: "truck", status: "active", destination: "",
    fuel_level: 100, speed: 0, latitude: 55.6761, longitude: 12.5683
  });

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedVehicle(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "", type: "truck", status: "active", destination: "",
      fuel_level: 100, speed: 0, latitude: 55.6761, longitude: 12.5683
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const typeStats = {
    truck: vehicles.filter(v => v.type === 'truck').length,
    ship: vehicles.filter(v => v.type === 'ship').length,
    drone: vehicles.filter(v => v.type === 'drone').length,
    train: vehicles.filter(v => v.type === 'train').length,
    aircraft: vehicles.filter(v => v.type === 'aircraft').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Flådestyring</h1>
            <p className="text-slate-400 mt-1">{vehicles.length} enheder registreret</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Enhed
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(typeStats).map(([type, count]) => {
            const Icon = vehicleIcons[type];
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-slate-500">{vehicleLabels[type]}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Søg efter enhed eller destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              <SelectItem value="truck">Lastbil</SelectItem>
              <SelectItem value="ship">Skib</SelectItem>
              <SelectItem value="drone">Drone</SelectItem>
              <SelectItem value="train">Tog</SelectItem>
              <SelectItem value="aircraft">Fly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="idle">Standby</SelectItem>
              <SelectItem value="maintenance">Vedligehold</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredVehicles.map((vehicle, index) => {
              const Icon = vehicleIcons[vehicle.type] || Truck;
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl cursor-pointer hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{vehicle.name}</h3>
                        <p className="text-sm text-slate-500">{vehicleLabels[vehicle.type]}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[vehicle.status]}>
                      {statusLabels[vehicle.status]}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{vehicle.destination || 'Ingen destination'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{vehicle.speed || 0} km/t</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span className="text-xs">Live</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Brændstof</span>
                        <span className={vehicle.fuel_level < 20 ? 'text-rose-400' : 'text-slate-400'}>
                          {vehicle.fuel_level || 0}%
                        </span>
                      </div>
                      <Progress value={vehicle.fuel_level || 0} className="h-1.5 bg-slate-700" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredVehicles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Ingen enheder matcher din søgning</p>
          </div>
        )}
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Tilføj Ny Enhed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Navn</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="F.eks. Lastbil-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Lastbil</SelectItem>
                    <SelectItem value="ship">Skib</SelectItem>
                    <SelectItem value="drone">Drone</SelectItem>
                    <SelectItem value="train">Tog</SelectItem>
                    <SelectItem value="aircraft">Fly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="idle">Standby</SelectItem>
                    <SelectItem value="maintenance">Vedligehold</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Destination</Label>
              <Input
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="F.eks. København"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brændstof %</Label>
                <Input
                  type="number"
                  value={formData.fuel_level}
                  onChange={(e) => setFormData({...formData, fuel_level: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Hastighed (km/t)</Label>
                <Input
                  type="number"
                  value={formData.speed}
                  onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Opretter...' : 'Opret Enhed'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Detail Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          {selectedVehicle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => { const Icon = vehicleIcons[selectedVehicle.type]; return <Icon className="w-5 h-5 text-cyan-400" />; })()}
                  {selectedVehicle.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-medium">{vehicleLabels[selectedVehicle.type]}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge variant="outline" className={statusColors[selectedVehicle.status]}>
                      {statusLabels[selectedVehicle.status]}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Brændstof</p>
                    <p className="font-medium">{selectedVehicle.fuel_level || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Hastighed</p>
                    <p className="font-medium">{selectedVehicle.speed || 0} km/t</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="font-medium">{selectedVehicle.destination || 'Ingen destination'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-700"
                    onClick={() => {
                      const newStatus = selectedVehicle.status === 'active' ? 'idle' : 'active';
                      updateMutation.mutate({ id: selectedVehicle.id, data: { status: newStatus }});
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Skift Status
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Er du sikker på at du vil slette denne enhed?')) {
                        deleteMutation.mutate(selectedVehicle.id);
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}