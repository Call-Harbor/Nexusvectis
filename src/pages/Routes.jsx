import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

function FitBounds({ waypoints }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints?.length > 1) {
      const bounds = waypoints.map(w => [w.lat, w.lng]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [waypoints, map]);
  return null;
}
import { 
  Route, Plus, Search, MapPin, Clock, Sparkles, 
  ArrowRight, Truck, Ship, Plane, Train, Leaf, X, Map, Edit, Filter, Download, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AIInsightWidget from "@/components/ai/AIInsightWidget";
import AIAssistantBadge from "@/components/ai/AIAssistantBadge";
import AdvancedRouteEditor from "@/components/routes/AdvancedRouteEditor";
import RouteOptimizer from "@/components/routes/RouteOptimizer";

const statusColors = {
  planned: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delayed: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};
const statusLabels = { planned: "Planned", active: "Active", completed: "Completed", delayed: "Delayed" };
const priorityColors = {
  low: "bg-slate-500/20 text-slate-400",
  normal: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  critical: "bg-rose-500/20 text-rose-400",
};
const priorityLabels = { low: "Low", normal: "Normal", high: "High", critical: "Critical" };
const vehicleIcons = { truck: Truck, ship: Ship, drone: Plane, train: Train, aircraft: Plane };

// Precise distance calculation using Haversine formula
const calculateDistance = (waypoints) => {
  if (!waypoints || waypoints.length < 2) return 0;
  const R = 6371; // Earth radius in km
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  return Math.round(totalDistance * 10) / 10;
};

// Precise duration calculation based on transport type
const calculateDuration = (waypoints, transportType) => {
  const distance = calculateDistance(waypoints);
  const speeds = { truck: 80, ship: 25, train: 120, aircraft: 800, drone: 60 };
  const speed = speeds[transportType] || 80;
  return Math.round((distance / speed) * 10) / 10;
};

// Precise CO2 calculation based on transport type
const calculateCO2 = (waypoints, transportType) => {
  const distance = calculateDistance(waypoints);
  const factors = { truck: 0.8, ship: 0.02, train: 0.04, aircraft: 0.9, drone: 0.1 };
  const factor = factors[transportType] || 0.8;
  return Math.round(distance * factor * 10) / 10;
};

export default function Routes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [transportFilter, setTransportFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "", origin: "", destination: "", transport_type: "truck",
    status: "planned", priority: "normal", distance_km: 0, 
    estimated_duration_hours: 0, ai_optimized: false, co2_estimate: 0
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Route.filter({ organization_id: orgId });
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      return base44.entities.Route.create({ ...data, organization_id: orgId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Route.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Route.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  });

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  const planRouteMutation = useMutation({
    mutationFn: async ({ origin, destination, transport_type }) => {
      const response = await base44.functions.invoke('planRoute', { 
        origin, 
        destination, 
        transport_type 
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.route_data) {
        setFormData(prev => ({
          ...prev,
          waypoints: data.route_data.waypoints,
          distance_km: data.route_data.distance_km,
          estimated_duration_hours: data.route_data.estimated_duration_hours,
          co2_estimate: data.route_data.co2_estimate
        }));
      }
    }
  });

  const resetForm = () => {
    setFormData({
      name: "", origin: "", destination: "", transport_type: "truck",
      status: "planned", priority: "normal", distance_km: 0,
      estimated_duration_hours: 0, ai_optimized: false, co2_estimate: 0
    });
  };

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || r.priority === priorityFilter;
    const matchesTransport = transportFilter === "all" || r.transport_type === transportFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesTransport;
  }).sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "distance") return (b.distance_km || 0) - (a.distance_km || 0);
    if (sortBy === "duration") return (b.estimated_duration_hours || 0) - (a.estimated_duration_hours || 0);
    if (sortBy === "co2") return (b.co2_estimate || 0) - (a.co2_estimate || 0);
    return 0;
  });

  const stats = {
    total: routes.length,
    active: routes.filter(r => r.status === 'active').length,
    delayed: routes.filter(r => r.status === 'delayed').length,
    optimized: routes.filter(r => r.ai_optimized).length,
  };

  const exportToCSV = () => {
    const headers = ["Name", "Origin", "Destination", "Status", "Priority", "Transport", "Distance", "Duration", "CO2", "AI-Optimized"];
    const rows = filteredRoutes.map(r => [
      r.name,
      r.origin,
      r.destination,
      statusLabels[r.status],
      priorityLabels[r.priority],
      r.transport_type,
      `${r.distance_km || 0} km`,
      `${r.estimated_duration_hours || 0}h`,
      `${r.co2_estimate || 0} kg`,
      r.ai_optimized ? "Yes" : "No"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routes-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <AIAssistantBadge />

      <div className="relative z-10">
         {/* Header */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
           <div>
             <h1 className="text-3xl font-bold text-white">Route Management</h1>
             <p className="text-slate-400 mt-1">
               {filteredRoutes.length} of {routes.length} routes
               {searchTerm && ` matching "${searchTerm}"`}
             </p>
           </div>
           <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={exportToCSV}
                className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowRouteOptimizer(true)}
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Route Optimizer
              </Button>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Route
              </Button>
            </div>
        </div>

        {/* AI Route Insights */}
        <div className="mb-6">
          <AIInsightWidget entity_type="routes" entity_id="all" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Routes", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Delayed", value: stats.delayed },
            { label: "AI-Optimized", value: stats.optimized },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, origin, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={transportFilter} onValueChange={setTransportFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transport</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="ship">Ship</SelectItem>
                  <SelectItem value="drone">Drone</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="aircraft">Aircraft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort: Name</SelectItem>
                  <SelectItem value="distance">Sort: Distance</SelectItem>
                  <SelectItem value="duration">Sort: Duration</SelectItem>
                  <SelectItem value="co2">Sort: CO2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || transportFilter !== "all") && (
            <div className="flex items-center gap-2 text-sm flex-wrap">
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
              {statusFilter !== "all" && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Status: {statusFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Priority: {priorityFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setPriorityFilter("all")}
                  />
                </Badge>
              )}
              {transportFilter !== "all" && (
                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  Transport: {transportFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setTransportFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setTransportFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Routes List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRoutes.map((route, index) => {
              const Icon = vehicleIcons[route.transport_type] || Truck;
              return (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{route.name}</h3>
                          <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newOptimized = !route.ai_optimized;
                            updateMutation.mutate({ 
                              id: route.id, 
                              data: { ai_optimized: newOptimized }
                            });
                          }}
                          className={`transition-all ${route.ai_optimized ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'} border rounded-full px-3 py-1 inline-flex items-center gap-1 text-sm`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {route.ai_optimized ? 'AI-Optimized' : 'Optimize'}
                        </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{route.origin}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{route.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className={statusColors[route.status]}>
                        {statusLabels[route.status]}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[route.priority]}>
                        {priorityLabels[route.priority]}
                      </Badge>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {route.distance_km > 0 && (
                          <span>{route.distance_km} km</span>
                        )}
                        {route.estimated_duration_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {route.estimated_duration_hours}h
                          </span>
                        )}
                        {route.co2_estimate > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Leaf className="w-4 h-4" />
                            {route.co2_estimate} kg CO₂
                          </span>
                        )}
                      </div>
                      <Button
                       size="sm"
                       variant="outline"
                       className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
                       onClick={() => {
                         setSelectedRoute(route);
                         setShowRouteDialog(true);
                       }}
                      >
                       <Map className="w-4 h-4" />
                      </Button>
                      <Button
                       size="sm"
                       variant="outline"
                       className="text-violet-400 border-violet-500/30 hover:bg-violet-500/20"
                       onClick={() => {
                         setEditingRoute(route);
                         setShowAdvancedEditor(true);
                       }}
                      >
                       <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                       size="sm"
                       variant="ghost"
                       className="text-slate-400 hover:text-rose-400"
                       onClick={() => {
                         if (confirm('Delete this route?')) {
                           deleteMutation.mutate(route.id);
                         }
                       }}
                      >
                       <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <Route className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No routes match your search</p>
          </div>
        )}
      </div>

      {/* Add Route Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Route Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Copenhagen-Aarhus Express"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origin</Label>
                <Input
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="e.g. Copenhagen"
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="e.g. Aarhus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Transport Type</Label>
                <Select value={formData.transport_type} onValueChange={(v) => setFormData({...formData, transport_type: v})}>
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
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Distance (km)</Label>
                <Input
                  type="number"
                  value={formData.distance_km}
                  onChange={(e) => setFormData({...formData, distance_km: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label>Est. Duration (hours)</Label>
                <Input
                  type="number"
                  value={formData.estimated_duration_hours}
                  onChange={(e) => setFormData({...formData, estimated_duration_hours: parseInt(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold"
                onClick={() => planRouteMutation.mutate({
                  origin: formData.origin,
                  destination: formData.destination,
                  transport_type: formData.transport_type
                })}
                disabled={!formData.origin || !formData.destination || planRouteMutation.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {planRouteMutation.isPending ? 'Planning...' : 'AI Plan'}
              </Button>
              <Button
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
                onClick={() => setShowAdvancedEditor(true)}
              >
                <Map className="w-4 h-4 mr-2" />
                Manual Editor
              </Button>
            </div>
            {planRouteMutation.isPending && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm flex items-center gap-2 text-cyan-400">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Planning real road route using OpenStreetMap...
              </div>
            )}
            {planRouteMutation.isError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
                Failed to plan route. Please check origin/destination names.
              </div>
            )}
            {formData.waypoints?.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <div className="text-emerald-400 font-medium mb-1">✓ Route planned on real road network!</div>
                <div className="text-slate-300">{formData.waypoints.length} waypoints · {formData.distance_km} km · {formData.estimated_duration_hours}h</div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm">AI Optimization</span>
              </div>
              <Switch
                checked={formData.ai_optimized}
                onCheckedChange={(v) => setFormData({...formData, ai_optimized: v})}
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.origin || !formData.destination || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Route'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Route Visualization Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Route Visualization: {selectedRoute?.name}</DialogTitle>
          </DialogHeader>
          {selectedRoute?.waypoints?.length > 0 ? (
            <div className="space-y-4">
              <div className="h-96 rounded-lg overflow-hidden border border-slate-700">
                <MapContainer
                  center={[selectedRoute.waypoints[0].lat, selectedRoute.waypoints[0].lng]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {selectedRoute.waypoints.map((waypoint, idx) => (
                    <Marker key={idx} position={[waypoint.lat, waypoint.lng]}>
                      <Popup>{waypoint.name}</Popup>
                    </Marker>
                  ))}
                  <Polyline
                    positions={selectedRoute.waypoints.map(w => [w.lat, w.lng])}
                    color="#06b6d4"
                    weight={3}
                  />
                </MapContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold text-white">{selectedRoute.distance_km} km</div>
                  <div className="text-xs text-slate-400">Total Distance</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold text-white">{selectedRoute.estimated_duration_hours}h</div>
                  <div className="text-xs text-slate-400">Duration</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl font-bold text-emerald-400">{selectedRoute.co2_estimate} kg</div>
                  <div className="text-xs text-slate-400">CO₂ Emissions</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-400">Waypoints:</div>
                {selectedRoute.waypoints.map((waypoint, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-white">{waypoint.name}</span>
                    <span className="text-slate-500 text-xs">
                      ({waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No route data available. Use "AI Plan Route" when creating a route.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Advanced Route Editor Dialog */}
      <Dialog open={showAdvancedEditor} onOpenChange={(open) => {
        setShowAdvancedEditor(open);
        if (!open) setEditingRoute(null);
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingRoute ? `Edit Route: ${editingRoute.name}` : 'Advanced Route Editor'}</DialogTitle>
          </DialogHeader>
          <AdvancedRouteEditor
            initialWaypoints={editingRoute?.waypoints || formData.waypoints || []}
            onSave={(waypoints) => {
               const distance = calculateDistance(waypoints);
               const duration = calculateDuration(waypoints, editingRoute?.transport_type || formData.transport_type);
               const co2 = calculateCO2(waypoints, editingRoute?.transport_type || formData.transport_type);

               if (editingRoute) {
                 updateMutation.mutate({
                   id: editingRoute.id,
                   data: { waypoints, distance_km: distance, estimated_duration_hours: duration, co2_estimate: co2 }
                 });
                 setEditingRoute(null);
               } else {
                 setFormData({ ...formData, waypoints, distance_km: distance, estimated_duration_hours: duration, co2_estimate: co2 });
               }
               setShowAdvancedEditor(false);
             }}
             onCancel={() => {
              setShowAdvancedEditor(false);
              setEditingRoute(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AI Route Optimizer Dialog */}
      <Dialog open={showRouteOptimizer} onOpenChange={setShowRouteOptimizer}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-5 pb-0 border-b border-slate-700/50">
            <DialogTitle className="flex items-center gap-2 text-white pb-4">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              AI Route Optimizer
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <RouteOptimizer
              onApply={(routeData) => {
                setFormData(prev => ({
                  ...prev,
                  origin: routeData.origin || prev.origin,
                  destination: routeData.destination || prev.destination,
                  transport_type: routeData.transport_type || prev.transport_type,
                  waypoints: routeData.waypoints,
                  distance_km: routeData.distance_km,
                  estimated_duration_hours: routeData.estimated_duration_hours,
                  co2_estimate: routeData.co2_estimate_kg,
                  ai_optimized: true,
                }));
                setShowRouteOptimizer(false);
                setShowAddDialog(true);
              }}
              onClose={() => setShowRouteOptimizer(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}