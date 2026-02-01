import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Warehouse, Plus, Search, MapPin, Fuel, Battery, Wrench, Ship, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const typeIcons = {
  fuel_depot: Fuel,
  warehouse: Warehouse,
  charging_station: Battery,
  maintenance_hub: Wrench,
  port: Ship,
};
const typeLabels = {
  fuel_depot: "Fuel Depot",
  warehouse: "Warehouse",
  charging_station: "Charging Station",
  maintenance_hub: "Maintenance Hub",
  port: "Port",
};
const statusColors = {
  operational: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  limited: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  offline: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};
const statusLabels = { operational: "Operational", limited: "Limited", offline: "Offline" };

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "", type: "warehouse", location: "", status: "operational",
    capacity: 1000, latitude: 20, longitude: 0
  });
  const [searchingLocation, setSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const geocodeMutation = useMutation({
    mutationFn: async ({ city, country }) => {
      const response = await base44.functions.invoke('geocodeCity', { city, country });
      return response.data;
    }
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Resource.filter({ organization_id: orgId });
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      return base44.entities.Resource.create({ 
        ...data, 
        organization_id: orgId,
        current_level: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });

  const resetForm = () => {
    setFormData({
      name: "", type: "warehouse", location: "", status: "operational",
      capacity: 1000, latitude: 20, longitude: 0
    });
  };

  const handleLocationSearch = async (locationText) => {
    if (locationText.length < 2) return;
    
    const parts = locationText.split(',').map(p => p.trim());
    const city = parts[0];
    const country = parts[1] || '';
    
    if (!city) return;
    
    setSearchingLocation(true);
    geocodeMutation.mutate({ city, country }, {
      onSuccess: (data) => {
        setFormData(prev => ({
          ...prev,
          latitude: data.lat,
          longitude: data.lng
        }));
        setSearchingLocation(false);
      },
      onError: () => setSearchingLocation(false)
    });
  };

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setFormData({...formData, location: newLocation});
    
    // Clear timeout if exists
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    // Set new timeout for geocoding
    searchTimeoutRef.current = setTimeout(() => {
      handleLocationSearch(newLocation);
    }, 800);
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeStats = Object.keys(typeLabels).reduce((acc, type) => {
    acc[type] = resources.filter(r => r.type === type).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Resources</h1>
            <p className="text-slate-400 mt-1">{resources.length} locations registered</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(typeStats).map(([type, count]) => {
            const Icon = typeIcons[type];
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-slate-500 truncate">{typeLabels[type]}</p>
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
              placeholder="Search for resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fuel_depot">Fuel Depot</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="charging_station">Charging Station</SelectItem>
              <SelectItem value="maintenance_hub">Maintenance Hub</SelectItem>
              <SelectItem value="port">Port</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource, index) => {
              const Icon = typeIcons[resource.type] || Warehouse;
              const utilization = resource.capacity > 0 
                ? Math.round((resource.current_level / resource.capacity) * 100)
                : 0;
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <Icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{resource.name}</h3>
                        <p className="text-sm text-slate-500">{typeLabels[resource.type]}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-rose-400"
                      onClick={() => {
                        if (confirm('Delete this resource?')) {
                          deleteMutation.mutate(resource.id);
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{resource.location || 'No location'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={statusColors[resource.status]}>
                        {statusLabels[resource.status]}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Capacity</span>
                        <span className="text-slate-400">
                          {resource.current_level || 0} / {resource.capacity || 0}
                        </span>
                      </div>
                      <Progress 
                        value={utilization} 
                        className="h-2 bg-slate-700"
                      />
                      <p className="text-xs text-slate-500 mt-1">{utilization}% utilized</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No resources match your search</p>
          </div>
        )}
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Main Warehouse Copenhagen"
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
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="fuel_depot">Fuel Depot</SelectItem>
                    <SelectItem value="charging_station">Charging Station</SelectItem>
                    <SelectItem value="maintenance_hub">Maintenance Hub</SelectItem>
                    <SelectItem value="port">Port</SelectItem>
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
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location (Search by city name)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.location}
                  onChange={handleLocationChange}
                  disabled={searchingLocation}
                  className="bg-slate-800 border-slate-700 flex-1"
                  placeholder="e.g. Copenhagen, Aarhus, Hamburg..."
                />
              </div>
              {searchingLocation && <p className="text-xs text-slate-400 mt-1">Searching coordinates...</p>}
              {formData.latitude !== 20 || formData.longitude !== 0 ? (
                <p className="text-xs text-emerald-400 mt-1">📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Location coordinates will be set when you finish typing</p>
              )}
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Resource'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}