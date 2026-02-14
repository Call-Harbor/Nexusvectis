import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, Route, MapPin, Plus, X, Users, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Assignment() {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignData, setAssignData] = useState({ route_id: "", resource_id: "", driver_id: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Vehicle.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Route.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Resource.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Driver.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Shipment.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ vehicleId, driverId, data }) => {
      await base44.entities.Vehicle.update(vehicleId, data);
      if (driverId) {
        await base44.entities.Driver.update(driverId, { current_vehicle_id: vehicleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Assignment successful");
      setShowAssignDialog(false);
      setSelectedVehicle(null);
      setAssignData({ route_id: "", resource_id: "", driver_id: "" });
    },
    onError: () => {
      toast.error("Failed to assign");
    }
  });

  const handleAssign = () => {
    if (!selectedVehicle || !assignData.route_id || !assignData.resource_id) {
      toast.error("Please select route and resource");
      return;
    }
    assignMutation.mutate({
      vehicleId: selectedVehicle.id,
      driverId: assignData.driver_id || null,
      data: { 
        route_id: assignData.route_id, 
        resource_id: assignData.resource_id,
        driver: assignData.driver_id ? drivers.find(d => d.id === assignData.driver_id)?.first_name + " " + drivers.find(d => d.id === assignData.driver_id)?.last_name : null
      }
    });
  };

  const getRouteName = (routeId) => routes.find(r => r.id === routeId)?.name || "Unknown";
  const getResourceName = (resourceId) => resources.find(r => r.id === resourceId)?.name || "Unknown";
  const getResourceType = (resourceId) => resources.find(r => r.id === resourceId)?.type || "";

  const availableDrivers = drivers.filter(d => d.status === "active" && !d.current_vehicle_id);
  const assignedVehicles = vehicles.filter(v => v.route_id && v.resource_id);
  const unassignedVehicles = vehicles.filter(v => !v.route_id || !v.resource_id);

  const filteredVehicles = filterStatus === "all" ? vehicles 
    : filterStatus === "assigned" ? assignedVehicles 
    : unassignedVehicles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dispatch & Assignment</h1>
            <p className="text-slate-400 mt-1">Assign drivers, routes and resources to vehicles</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterStatus("all")}
              variant={filterStatus === "all" ? "default" : "outline"}
              className={filterStatus === "all" ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
            >
              All
            </Button>
            <Button
              onClick={() => setFilterStatus("assigned")}
              variant={filterStatus === "assigned" ? "default" : "outline"}
              className={filterStatus === "assigned" ? "bg-emerald-600" : "border-slate-700 text-slate-300"}
            >
              Assigned
            </Button>
            <Button
              onClick={() => setFilterStatus("unassigned")}
              variant={filterStatus === "unassigned" ? "default" : "outline"}
              className={filterStatus === "unassigned" ? "bg-amber-600" : "border-slate-700 text-slate-300"}
            >
              Unassigned
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Truck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{vehicles.length}</p>
                <p className="text-sm text-slate-500">Total Units</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-500/20">
                <Route className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{routes.length}</p>
                <p className="text-sm text-slate-500">Available Routes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{availableDrivers.length}</p>
                <p className="text-sm text-slate-500">Available Drivers</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Vehicle Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No vehicles found</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const route = routes.find(r => r.id === vehicle.route_id);
                  const resource = resources.find(r => r.id === vehicle.resource_id);
                  const driver = drivers.find(d => d.current_vehicle_id === vehicle.id);
                  const isFullyAssigned = route && resource;

                  return (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-cyan-400" />
                            <h3 className="font-semibold text-white">{vehicle.name}</h3>
                            {isFullyAssigned && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {driver ? (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Users className="w-3 h-3" />
                                {driver.first_name} {driver.last_name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-500">
                                <Users className="w-3 h-3" />
                                No driver assigned
                              </div>
                            )}
                            {route ? (
                              <div className="flex items-center gap-2 text-violet-300">
                                <Route className="w-3 h-3" />
                                {route.name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-500">
                                <Route className="w-3 h-3" />
                                No route
                              </div>
                            )}
                            {resource ? (
                              <div className="flex items-center gap-2 text-emerald-300">
                                <MapPin className="w-3 h-3" />
                                {resource.name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-500">
                                <MapPin className="w-3 h-3" />
                                No resource
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            const currentDriver = drivers.find(d => d.current_vehicle_id === vehicle.id);
                            setAssignData({ 
                              route_id: vehicle.route_id || "", 
                              resource_id: vehicle.resource_id || "",
                              driver_id: currentDriver?.id || ""
                            });
                            setShowAssignDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Available Drivers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableDrivers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No available drivers</p>
                </div>
              ) : (
                availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{driver.first_name} {driver.last_name}</p>
                      <p className="text-sm text-slate-400">{driver.license_type || "No license type"}</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              Assign Unit
            </DialogTitle>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-sm text-slate-400">Unit</p>
                <p className="font-semibold text-lg text-white mt-1">{selectedVehicle.name}</p>
              </div>

              <div>
                <Label>Assign Driver (Optional)</Label>
                <Select 
                  value={assignData.driver_id} 
                  onValueChange={(value) => setAssignData({...assignData, driver_id: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 mt-2">
                    <SelectValue placeholder="Choose a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No driver</SelectItem>
                    {availableDrivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.first_name} {driver.last_name} {driver.license_type && `(${driver.license_type})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Route</Label>
                <Select 
                  value={assignData.route_id} 
                  onValueChange={(value) => setAssignData({...assignData, route_id: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 mt-2">
                    <SelectValue placeholder="Choose a route..." />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.origin} → {route.destination})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Resource (Port/Warehouse)</Label>
                <Select 
                  value={assignData.resource_id} 
                  onValueChange={(value) => setAssignData({...assignData, resource_id: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 mt-2">
                    <SelectValue placeholder="Choose a resource..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map(resource => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.name} ({resource.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-white"
                  onClick={() => setShowAssignDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold"
                  onClick={handleAssign}
                  disabled={!assignData.route_id || !assignData.resource_id || assignMutation.isPending}
                >
                  {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}