import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Ship, Plane, Train, Plus, Search,
  Fuel, MapPin, Clock, Settings, Radio, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const vehicleIcons = { truck: Truck, ship: Ship, drone: Plane, train: Train, aircraft: Plane };
const vehicleLabels = { truck: "Truck", ship: "Ship", drone: "Drone", train: "Train", aircraft: "Aircraft" };
const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  maintenance: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};
const statusLabels = { active: "Active", idle: "Standby", maintenance: "Maintenance", offline: "Offline" };

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: "TRUCK-001", type: "truck", status: "active", destination: "",
    fuel_level: 100, speed: 0, latitude: 55.6761, longitude: 12.5683,
    signal_type: "GPS", signal_strength: 95, callsign: "", mmsi: "", icao: "", driver: ""
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
    const nextNumber = vehicles.filter(v => v.type === 'truck').length + 1;
    setFormData({
      name: `TRUCK-${String(nextNumber).padStart(3, '0')}`, type: "truck", status: "active", destination: "",
      fuel_level: 100, speed: 0, latitude: 55.6761, longitude: 12.5683,
      signal_type: "GPS", signal_strength: 95, callsign: "", mmsi: "", icao: "", driver: ""
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
            <h1 className="text-3xl font-bold text-white">Fleet Management</h1>
            <p className="text-slate-400 mt-1">{vehicles.length} units registered</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
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
              placeholder="Search for unit or destination..."
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
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="ship">Ship</SelectItem>
              <SelectItem value="drone">Drone</SelectItem>
              <SelectItem value="train">Train</SelectItem>
              <SelectItem value="aircraft">Aircraft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Standby</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
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
                      <span className="truncate">{vehicle.destination || 'No destination'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{vehicle.speed || 0} km/h</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span className="text-xs">Live</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Fuel</span>
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
            <p className="text-slate-400">No units match your search</p>
          </div>
        )}
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name (Auto-generated)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Auto-generated based on type"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => {
                  const typePrefix = v.toUpperCase();
                  const nextNumber = vehicles.filter(vehicle => vehicle.type === v).length + 1;
                  const autoName = `${typePrefix}-${String(nextNumber).padStart(3, '0')}`;
                  setFormData({...formData, type: v, name: autoName});
                }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="ship">Ship</SelectItem>
                    <SelectItem value="drone">Drone</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="aircraft">Aircraft</SelectItem>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="idle">Standby</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
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
                placeholder="e.g. Copenhagen"
              />
            </div>
            <div>
              <Label>Driver / Operator</Label>
              <Input
                value={formData.driver}
                onChange={(e) => setFormData({...formData, driver: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Signal Type</Label>
                <Select value={formData.signal_type} onValueChange={(v) => setFormData({...formData, signal_type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GPS">GPS</SelectItem>
                    <SelectItem value="AIS">AIS (Ships)</SelectItem>
                    <SelectItem value="ADS-B">ADS-B (Aircraft)</SelectItem>
                    <SelectItem value="LoRa">LoRa (Drones)</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Signal Strength %</Label>
                <Input
                  type="number"
                  value={formData.signal_strength}
                  onChange={(e) => setFormData({...formData, signal_strength: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                  min="0" max="100"
                />
              </div>
            </div>

            {/* Conditional fields based on type */}
            {formData.type === 'ship' && (
              <div>
                <Label>MMSI Number</Label>
                <Input
                  value={formData.mmsi}
                  onChange={(e) => setFormData({...formData, mmsi: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="e.g. 123456789"
                />
              </div>
            )}

            {formData.type === 'aircraft' && (
              <div>
                <Label>ICAO Code</Label>
                <Input
                  value={formData.icao}
                  onChange={(e) => setFormData({...formData, icao: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="e.g. 4B1234"
                />
              </div>
            )}

            {(formData.type === 'ship' || formData.type === 'aircraft') && (
              <div>
                <Label>Callsign</Label>
                <Input
                  value={formData.callsign}
                  onChange={(e) => setFormData({...formData, callsign: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="e.g. ALPHA-1"
                />
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Label className="text-slate-400">Start Position (lat/lng)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Latitude"
                />
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Longitude"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Default: Copenhagen (55.6761, 12.5683)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fuel %</Label>
                <Input
                  type="number"
                  value={formData.fuel_level}
                  onChange={(e) => setFormData({...formData, fuel_level: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Speed (km/h)</Label>
                <Input
                  type="number"
                  value={formData.speed}
                  onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 text-black font-semibold"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Unit'}
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
                    <p className="text-xs text-slate-500">Fuel</p>
                    <p className="font-medium">{selectedVehicle.fuel_level || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Speed</p>
                    <p className="font-medium">{selectedVehicle.speed || 0} km/h</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="font-medium">{selectedVehicle.destination || 'No destination'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-700 text-black bg-white hover:bg-slate-100"
                    onClick={() => {
                      const newStatus = selectedVehicle.status === 'active' ? 'idle' : 'active';
                      updateMutation.mutate({ id: selectedVehicle.id, data: { status: newStatus }});
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Toggle Status
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this unit?')) {
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