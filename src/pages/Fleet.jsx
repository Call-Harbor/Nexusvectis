import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Ship, Plane, Train, Plus, Search,
  Fuel, MapPin, Clock, Settings, Radio, X, Filter, Download, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const vehicleIcons = { truck: Truck, ship: Ship, drone: Plane, train: Train, aircraft: Plane, bus: Truck };
const vehicleLabels = { truck: "Truck", ship: "Ship", drone: "Drone", train: "Train", aircraft: "Aircraft", bus: "Bus" };
const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  maintenance: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};
const statusLabels = { active: "Active", idle: "Standby", maintenance: "Maintenance", offline: "Offline" };

// Sort options
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "status", label: "Status" },
  { value: "fuel", label: "Fuel Level" },
  { value: "speed", label: "Speed" },
];

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [formData, setFormData] = useState({
    name: "TRUCK-001", type: "truck", status: "active",
    speed: 0, latitude: 20, longitude: 0,
    signal_type: "GPS", signal_strength: 95, callsign: "", mmsi: "", icao: "", driver: "", resource_id: ""
  });

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user.organization_id) return [];
      return await base44.entities.Vehicle.filter({ organization_id: user.organization_id });
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user.organization_id) return [];
      return await base44.entities.Resource.filter({ organization_id: user.organization_id });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const vehicleData = { ...data, organization_id: user.organization_id };
      
      // Set position from selected resource
      if (vehicleData.resource_id) {
        const resource = resources.find(r => r.id === vehicleData.resource_id);
        if (resource) {
          vehicleData.latitude = resource.latitude;
          vehicleData.longitude = resource.longitude;
        }
      }
      
      // Set dynamic signal strength (60-100%)
      vehicleData.signal_strength = Math.floor(Math.random() * 40) + 60;
      // Set dynamic speed based on type
      const speeds = { truck: 0, ship: 0, drone: 0, train: 0, aircraft: 0 };
      vehicleData.speed = speeds[vehicleData.type] || 0;
      
      const newVehicle = await base44.entities.Vehicle.create(vehicleData);
      
      // Increment resource current_level
      if (vehicleData.resource_id) {
        const resource = resources.find(r => r.id === vehicleData.resource_id);
        if (resource) {
          await base44.entities.Resource.update(vehicleData.resource_id, {
            current_level: (resource.current_level || 0) + 1
          });
        }
      }
      
      return newVehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
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
    mutationFn: async (id) => {
      const vehicle = vehicles.find(v => v.id === id);
      await base44.entities.Vehicle.delete(id);
      
      // Decrement resource current_level
      if (vehicle?.resource_id) {
        const resource = resources.find(r => r.id === vehicle.resource_id);
        if (resource) {
          await base44.entities.Resource.update(vehicle.resource_id, {
            current_level: Math.max(0, (resource.current_level || 1) - 1)
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setSelectedVehicle(null);
    },
  });

  const resetForm = () => {
    const nextNumber = vehicles.filter(v => v.type === 'truck').length + 1;
    setFormData({
      name: `TRUCK-${String(nextNumber).padStart(3, '0')}`, type: "truck", status: "active",
      speed: 0, latitude: 20, longitude: 0,
      signal_type: "GPS", signal_strength: 95, callsign: "", mmsi: "", icao: "", driver: "", resource_id: ""
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.driver?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "type") return (a.type || "").localeCompare(b.type || "");
    if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
    if (sortBy === "fuel") return (b.fuel_level || 0) - (a.fuel_level || 0);
    if (sortBy === "speed") return (b.speed || 0) - (a.speed || 0);
    return 0;
  });

  const typeStats = {
    truck: vehicles.filter(v => v.type === 'truck').length,
    ship: vehicles.filter(v => v.type === 'ship').length,
    drone: vehicles.filter(v => v.type === 'drone').length,
    train: vehicles.filter(v => v.type === 'train').length,
    aircraft: vehicles.filter(v => v.type === 'aircraft').length,
    bus: vehicles.filter(v => v.type === 'bus').length,
  };

  const exportToCSV = () => {
    const headers = ["Name", "Type", "Status", "Speed", "Fuel", "Driver", "Signal"];
    const rows = filteredVehicles.map(v => [
      v.name,
      vehicleLabels[v.type],
      statusLabels[v.status],
      `${v.speed || 0} km/h`,
      `${v.fuel_level || 0}%`,
      v.driver || "-",
      v.signal_type || "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <h1 className="text-3xl font-bold text-white">Units Management</h1>
            <p className="text-slate-400 mt-1">
              All vehicles and transit units in one place
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={exportToCSV}
              className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="truck">All Trucks</SelectItem>
                  <SelectItem value="ship">All Ships</SelectItem>
                  <SelectItem value="drone">All Drones</SelectItem>
                  <SelectItem value="train">All Trains</SelectItem>
                  <SelectItem value="aircraft">All Aircraft</SelectItem>
                  <SelectItem value="bus">All Buses</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Standby</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Search: {searchTerm}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  Type: {typeFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setTypeFilter("all")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Status: {statusFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
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
                    {vehicle.route_id && (
                      <div className="text-xs text-violet-300 bg-violet-500/10 px-2 py-1 rounded w-fit">
                        Route assigned
                      </div>
                    )}
                    {vehicle.resource_id && (
                      <div className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                        At resource
                      </div>
                    )}
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
                    {vehicle.driver && (
                      <div className="text-xs text-slate-500">
                        Driver: <span className="text-slate-400">{vehicle.driver}</span>
                      </div>
                    )}
                    {vehicle.efficiency_score > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Efficiency</span>
                        <span className={`font-medium ${
                          vehicle.efficiency_score >= 80 ? 'text-emerald-400' :
                          vehicle.efficiency_score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {vehicle.efficiency_score}%
                        </span>
                      </div>
                    )}
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
                    <SelectItem value="truck_delivery">Delivery Truck</SelectItem>
                    <SelectItem value="truck_semi">Semi Truck</SelectItem>
                    <SelectItem value="truck_refrigerated">Refrigerated Truck</SelectItem>
                    <SelectItem value="truck_tanker">Tanker Truck</SelectItem>
                    <SelectItem value="ship_container">Container Ship</SelectItem>
                    <SelectItem value="ship_tanker">Tanker Ship</SelectItem>
                    <SelectItem value="ship_cargo">Cargo Ship</SelectItem>
                    <SelectItem value="ship_ferry">Ferry</SelectItem>
                    <SelectItem value="drone">Drone</SelectItem>
                    <SelectItem value="train_freight">Freight Train</SelectItem>
                    <SelectItem value="train_passenger">Passenger Train</SelectItem>
                    <SelectItem value="train_high_speed">High-Speed Train</SelectItem>
                    <SelectItem value="aircraft_cargo">Cargo Aircraft</SelectItem>
                    <SelectItem value="aircraft_passenger">Passenger Aircraft</SelectItem>
                    <SelectItem value="aircraft_private">Private Jet</SelectItem>
                    <SelectItem value="bus_city">City Bus</SelectItem>
                    <SelectItem value="bus_coach">Coach Bus</SelectItem>
                    <SelectItem value="bus_school">School Bus</SelectItem>
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
              <Label>Driver / Operator</Label>
              <Input
                value={formData.driver}
                onChange={(e) => setFormData({...formData, driver: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. John Smith"
              />
            </div>

            <div>
              <Label>Start Position (Resource)</Label>
              <Select value={formData.resource_id} onValueChange={(v) => setFormData({...formData, resource_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select resource..." />
                </SelectTrigger>
                <SelectContent>
                  {resources.map(resource => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} ({resource.location || 'No location'}) - {resource.current_level || 0}/{resource.capacity || 0}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

                  {selectedVehicle.driver && (
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500">Driver / Operator</p>
                    <p className="font-medium">{selectedVehicle.driver}</p>
                  </div>
                  )}

                  {selectedVehicle.efficiency_score > 0 && (
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-500">Efficiency Score</p>
                      <div className="flex items-center gap-2">
                        <BarChart3 className={`w-4 h-4 ${
                          selectedVehicle.efficiency_score >= 80 ? 'text-emerald-400' :
                          selectedVehicle.efficiency_score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`} />
                        <p className="font-medium">{selectedVehicle.efficiency_score}%</p>
                      </div>
                    </div>
                  )}

                  {selectedVehicle.route_id && (
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <p className="text-xs text-violet-300">Assigned Route</p>
                      <p className="font-medium text-violet-200">{selectedVehicle.route_id}</p>
                    </div>
                  )}
                  {selectedVehicle.resource_id && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-300">Current Resource</p>
                      <p className="font-medium text-emerald-200">{selectedVehicle.resource_id}</p>
                    </div>
                  )}

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