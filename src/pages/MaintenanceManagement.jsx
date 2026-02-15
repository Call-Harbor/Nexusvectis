import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Search, AlertTriangle, Clock, CheckCircle2, DollarSign, Download, Filter, X, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import MaintenanceEditor from "../components/maintenance/MaintenanceEditor.jsx";
import MaintenanceDetails from "../components/maintenance/MaintenanceDetails.jsx";

export default function MaintenanceManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: maintenanceRecords = [], isLoading } = useQuery({
    queryKey: ['maintenance', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Maintenance.filter({ organization_id: user.organization_id }, '-created_date', 200);
    },
    enabled: !!user?.organization_id
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Vehicle.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_progress":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "cancelled":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredRecords = maintenanceRecords.filter(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicle_id);
    const matchesSearch = 
      vehicle?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.component?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || m.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  }).sort((a, b) => {
    if (sortBy === "date") return new Date(b.scheduled_date || b.created_date) - new Date(a.scheduled_date || a.created_date);
    if (sortBy === "priority") {
      const priority = { critical: 4, high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    }
    if (sortBy === "cost") return (b.cost_estimate || 0) - (a.cost_estimate || 0);
    if (sortBy === "vehicle") {
      const vehA = vehicles.find(v => v.id === a.vehicle_id)?.name || "";
      const vehB = vehicles.find(v => v.id === b.vehicle_id)?.name || "";
      return vehA.localeCompare(vehB);
    }
    return 0;
  });

  const stats = {
    total: maintenanceRecords.length,
    pending: maintenanceRecords.filter(m => m.status === "pending").length,
    inProgress: maintenanceRecords.filter(m => m.status === "in_progress").length,
    completed: maintenanceRecords.filter(m => m.status === "completed").length,
    totalCost: maintenanceRecords.reduce((sum, m) => sum + (m.cost_estimate || 0), 0),
    overdue: maintenanceRecords.filter(m => 
      m.status === "pending" && 
      m.scheduled_date && 
      moment(m.scheduled_date).isBefore(moment())
    ).length
  };

  const exportToCSV = () => {
    const headers = ["Vehicle", "Type", "Component", "Status", "Priority", "Scheduled Date", "Cost Estimate", "Description"];
    const rows = filteredRecords.map(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      return [
        vehicle?.name || "-",
        m.type || "-",
        m.component || "-",
        m.status || "-",
        m.priority || "-",
        m.scheduled_date ? moment(m.scheduled_date).format('DD-MM-YYYY') : "-",
        m.cost_estimate ? `€${m.cost_estimate}` : "-",
        m.description || "-"
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showEditor) {
    return (
      <MaintenanceEditor
        maintenance={editingMaintenance}
        vehicles={vehicles}
        onClose={() => {
          setShowEditor(false);
          setEditingMaintenance(null);
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
          setShowEditor(false);
          setEditingMaintenance(null);
        }}
      />
    );
  }

  if (selectedMaintenance) {
    return (
      <MaintenanceDetails
        maintenance={selectedMaintenance}
        vehicle={vehicles.find(v => v.id === selectedMaintenance.vehicle_id)}
        onClose={() => setSelectedMaintenance(null)}
        onEdit={(maintenance) => {
          setEditingMaintenance(maintenance);
          setShowEditor(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Maintenance Management</h1>
            <p className="text-slate-400">
              {filteredRecords.length} of {maintenanceRecords.length} records
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowEditor(true)}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Wrench className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.inProgress}</p>
                </div>
                <Wrench className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Cost</p>
                  <p className="text-2xl font-bold text-emerald-400">€{stats.totalCost.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by vehicle, component, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "pending", "in_progress", "completed"].map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? "default" : "outline"}
                  className={statusFilter === status ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
                  size="sm"
                >
                  {status === "all" ? "All" : status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm text-slate-400">Type:</label>
              <div className="flex gap-2">
                {["all", "scheduled", "predictive", "emergency"].map((type) => (
                  <Button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    variant={typeFilter === type ? "default" : "outline"}
                    className={typeFilter === type ? "bg-violet-600" : "border-slate-700 text-slate-300"}
                    size="sm"
                  >
                    {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              <label className="text-sm text-slate-400 ml-3">Priority:</label>
              <div className="flex gap-2">
                {["all", "critical", "high", "medium", "low"].map((priority) => (
                  <Button
                    key={priority}
                    onClick={() => setPriorityFilter(priority)}
                    variant={priorityFilter === priority ? "default" : "outline"}
                    className={priorityFilter === priority ? "bg-rose-600" : "border-slate-700 text-slate-300"}
                    size="sm"
                  >
                    {priority === "all" ? "All" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sort by:</label>
              <div className="flex gap-2">
                {[
                  { value: "date", label: "Date" },
                  { value: "priority", label: "Priority" },
                  { value: "cost", label: "Cost" },
                  { value: "vehicle", label: "Vehicle" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    className={sortBy === option.value ? "bg-emerald-600" : "border-slate-700 text-slate-300"}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all") && (
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
              {typeFilter !== "all" && (
                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  Type: {typeFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setTypeFilter("all")}
                  />
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="outline" className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                  Priority: {priorityFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setPriorityFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setPriorityFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Maintenance Records */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading maintenance records...</p>
              </CardContent>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No maintenance records found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((maintenance) => {
              const vehicle = vehicles.find(v => v.id === maintenance.vehicle_id);
              const isOverdue = maintenance.status === "pending" && maintenance.scheduled_date && moment(maintenance.scheduled_date).isBefore(moment());
              
              return (
                <Card 
                  key={maintenance.id} 
                  className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMaintenance(maintenance)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{vehicle?.name || "Unknown Vehicle"}</h3>
                          <Badge className={getStatusColor(maintenance.status)}>
                            {maintenance.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(maintenance.priority)}>
                            {maintenance.priority}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Type</p>
                            <p className="text-white capitalize">{maintenance.type}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Component</p>
                            <p className="text-white">{maintenance.component}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Scheduled Date</p>
                            <p className="text-white">{maintenance.scheduled_date ? moment(maintenance.scheduled_date).format('MMM DD, YYYY') : "Not scheduled"}</p>
                          </div>
                          {maintenance.cost_estimate && (
                            <div>
                              <p className="text-slate-400">Estimated Cost</p>
                              <p className="text-white">€{maintenance.cost_estimate.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {maintenance.description && (
                          <p className="text-slate-400 text-sm mt-2">{maintenance.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}