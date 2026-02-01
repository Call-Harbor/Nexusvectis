import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Route, Plus, Search, MapPin, Clock, Sparkles, 
  ArrowRight, Truck, Ship, Plane, Train, Leaf, X
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

export default function Routes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const geocodeMutation = useMutation({
    mutationFn: async ({ city, country }) => {
      const response = await base44.functions.invoke('geocodeCity', { city, country });
      return response.data;
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
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: routes.length,
    active: routes.filter(r => r.status === 'active').length,
    delayed: routes.filter(r => r.status === 'delayed').length,
    optimized: routes.filter(r => r.ai_optimized).length,
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
             <p className="text-slate-400 mt-1">{routes.length} routes registered</p>
           </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Route
          </Button>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search for route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
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
    </div>
  );
}