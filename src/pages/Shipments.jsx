import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, TrendingUp, Clock, AlertCircle, Filter, X, Download, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [cargoFilter, setCargoFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tracking_number: `SHIP-${Date.now()}`,
    origin: "",
    destination: "",
    status: "pending",
    priority: "normal",
    cargo_type: "general",
    weight_kg: "",
    customer_name: "",
    customer_email: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return base44.entities.Shipment.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      return base44.entities.Shipment.create({
        ...data,
        organization_id: userData[0].organization_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setIsDialogOpen(false);
      setFormData({
        tracking_number: `SHIP-${Date.now()}`,
        origin: "",
        destination: "",
        status: "pending",
        priority: "normal",
        cargo_type: "general",
        weight_kg: "",
        customer_name: "",
        customer_email: ""
      });
    }
  });

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || s.priority === priorityFilter;
    const matchesCargo = cargoFilter === "all" || s.cargo_type === cargoFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCargo;
  });

  const stats = {
    total: shipments.length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => s.status === 'delayed').length
  };

  const statusColors = {
    pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    in_transit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const priorityColors = {
    low: 'bg-slate-500/20 text-slate-400',
    normal: 'bg-blue-500/20 text-blue-400',
    high: 'bg-amber-500/20 text-amber-400',
    urgent: 'bg-red-500/20 text-red-400'
  };

  const exportToCSV = () => {
    const headers = ["Tracking", "Status", "Priority", "Origin", "Destination", "Weight", "Cargo Type", "Customer", "ETA"];
    const rows = filteredShipments.map(s => [
      s.tracking_number,
      s.status,
      s.priority || "-",
      s.origin,
      s.destination,
      s.weight_kg ? `${s.weight_kg} kg` : "-",
      s.cargo_type || "-",
      s.customer_name || "-",
      s.eta ? moment(s.eta).format('DD-MM-YYYY HH:mm') : "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-cyan-400" />
              Shipments
            </h1>
            <p className="text-slate-400 mt-1">
              {filteredShipments.length} of {shipments.length} shipments
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  New Shipment
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Shipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tracking Number</Label>
                  <Input
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Origin</Label>
                    <Input
                      value={formData.origin}
                      onChange={(e) => setFormData({...formData, origin: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                      placeholder="København"
                    />
                  </div>
                  <div>
                    <Label>Destination</Label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                      placeholder="Berlin"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cargo Type</Label>
                    <Select value={formData.cargo_type} onValueChange={(v) => setFormData({...formData, cargo_type: v})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="cold_chain">Cold Chain</SelectItem>
                        <SelectItem value="hazardous">Hazardous</SelectItem>
                        <SelectItem value="fragile">Fragile</SelectItem>
                        <SelectItem value="bulk">Bulk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div>
                    <Label>Customer Email</Label>
                    <Input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  disabled={!formData.origin || !formData.destination}
                >
                  Create Shipment
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <Package className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">I Transit</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.in_transit}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Delivered</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.delivered}</p>
                </div>
                <Clock className="w-10 h-10 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Delayed</p>
                  <p className="text-3xl font-bold text-red-400">{stats.delayed}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tracking, customer, location..."
                className="pl-10 bg-slate-900/50 border-slate-800 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cargoFilter} onValueChange={setCargoFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">All Cargo</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cold_chain">Cold Chain</SelectItem>
                  <SelectItem value="hazardous">Hazardous</SelectItem>
                  <SelectItem value="fragile">Fragile</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || cargoFilter !== "all") && (
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
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
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
              {cargoFilter !== "all" && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Cargo: {cargoFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setCargoFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCargoFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Shipments List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredShipments.map((shipment, index) => (
            <motion.div
              key={shipment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{shipment.tracking_number}</h3>
                        <Badge className={statusColors[shipment.status]}>
                          {shipment.status}
                        </Badge>
                        {shipment.priority && (
                          <Badge className={priorityColors[shipment.priority]}>
                            {shipment.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          <span>{shipment.origin} → {shipment.destination}</span>
                        </div>
                        {shipment.cargo_type && (
                          <div className="text-sm text-slate-400">
                            <span className="text-slate-500">Type:</span> {shipment.cargo_type}
                          </div>
                        )}
                        {shipment.weight_kg && (
                          <div className="text-sm text-slate-400">
                            <span className="text-slate-500">Weight:</span> {shipment.weight_kg} kg
                          </div>
                        )}
                        {shipment.customer_name && (
                          <div className="text-sm text-slate-400">
                            <span className="text-slate-500">Customer:</span> {shipment.customer_name}
                          </div>
                        )}
                        {shipment.eta && (
                          <div className="text-sm text-slate-400">
                            <span className="text-slate-500">ETA:</span> {moment(shipment.eta).format('DD/MM HH:mm')}
                          </div>
                        )}
                        {shipment.created_date && (
                          <div className="text-sm text-slate-400">
                            <span className="text-slate-500">Created:</span> {moment(shipment.created_date).format('DD/MM HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredShipments.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No shipments found</p>
          </div>
        )}
      </div>
    </div>
  );
}