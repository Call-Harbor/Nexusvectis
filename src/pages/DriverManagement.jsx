import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, TrendingUp, AlertTriangle, Award, Clock, Filter, X, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import DriverEditor from "../components/drivers/DriverEditor.jsx";
import DriverDetails from "../components/drivers/DriverDetails.jsx";

export default function DriverManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
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

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Driver.filter({ organization_id: user.organization_id }, '-created_date', 100);
    },
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "on_leave":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "terminated":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "name") return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    if (sortBy === "trips") return (b.total_trips_completed || 0) - (a.total_trips_completed || 0);
    if (sortBy === "distance") return (b.total_distance_km || 0) - (a.total_distance_km || 0);
    if (sortBy === "rating") return (b.performance_rating || 0) - (a.performance_rating || 0);
    if (sortBy === "hire_date") return moment(b.hire_date || 0).diff(moment(a.hire_date || 0));
    return 0;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === "active").length,
    expiringLicenses: drivers.filter(d => {
      if (!d.license_expiry) return false;
      const daysUntilExpiry = moment(d.license_expiry).diff(moment(), 'days');
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length,
    avgRating: (drivers.reduce((sum, d) => sum + (d.performance_rating || 0), 0) / drivers.length).toFixed(1)
  };

  const exportToCSV = () => {
    const headers = ["Employee ID", "Name", "Email", "Phone", "Status", "License", "License Expiry", "Trips", "Distance (km)", "Rating"];
    const rows = filteredDrivers.map(d => [
      d.employee_id || "-",
      `${d.first_name} ${d.last_name}`,
      d.email || "-",
      d.phone || "-",
      d.status,
      d.license_number || "-",
      d.license_expiry ? moment(d.license_expiry).format('DD-MM-YYYY') : "-",
      d.total_trips_completed || 0,
      d.total_distance_km || 0,
      d.performance_rating || "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showEditor) {
    return (
      <DriverEditor
        driver={editingDriver}
        onClose={() => {
          setShowEditor(false);
          setEditingDriver(null);
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['drivers'] });
          setShowEditor(false);
          setEditingDriver(null);
        }}
      />
    );
  }

  if (selectedDriver) {
    return (
      <DriverDetails
        driver={selectedDriver}
        onClose={() => setSelectedDriver(null)}
        onEdit={(driver) => {
          setEditingDriver(driver);
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
            <h1 className="text-3xl font-bold text-white mb-2">Driver Management</h1>
            <p className="text-slate-400">
              {filteredDrivers.length} of {drivers.length} drivers
              {searchTerm && ` matching "${searchTerm}"`}
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
              onClick={() => setShowEditor(true)}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Drivers</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Expiring Licenses</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.expiringLicenses}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Rating</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.avgRating}</p>
                </div>
                <Award className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, employee ID, license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "on_leave", "suspended", "terminated"].map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === status ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
                >
                  {status === "all" ? "All" : status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sort by:</label>
              <div className="flex gap-2">
                {[
                  { value: "name", label: "Name" },
                  { value: "trips", label: "Trips" },
                  { value: "distance", label: "Distance" },
                  { value: "rating", label: "Rating" },
                  { value: "hire_date", label: "Hire Date" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    className={sortBy === option.value ? "bg-violet-600" : "border-slate-700 text-slate-300"}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {(searchTerm || statusFilter !== "all") && (
              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Filters:</span>
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
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="text-slate-500 hover:text-white text-xs ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading drivers...</p>
              </CardContent>
            </Card>
          ) : filteredDrivers.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 col-span-full">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No drivers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredDrivers.map((driver) => {
              const licenseExpiring = driver.license_expiry && moment(driver.license_expiry).diff(moment(), 'days') <= 30;
              
              return (
                <Card 
                  key={driver.id} 
                  className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDriver(driver)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {driver.first_name} {driver.last_name}
                        </h3>
                        <p className="text-slate-400 text-sm">{driver.employee_id}</p>
                      </div>
                      <Badge className={getStatusColor(driver.status)}>
                        {driver.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Trips</span>
                        <span className="text-white">{driver.total_trips_completed || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Distance</span>
                        <span className="text-white">{driver.total_distance_km?.toLocaleString() || 0} km</span>
                      </div>
                      {driver.performance_rating && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Rating</span>
                          <span className="text-cyan-400 font-medium">{driver.performance_rating}/5</span>
                        </div>
                      )}
                    </div>

                    {licenseExpiring && (
                      <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 text-xs">License expiring soon</span>
                      </div>
                    )}
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