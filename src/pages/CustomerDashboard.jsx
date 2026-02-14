import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  TruckIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Search,
  LogOut,
  User,
  MapPin,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const customerId = sessionStorage.getItem("customer_id");
    const customerEmail = sessionStorage.getItem("customer_email");
    
    if (!customerId || !customerEmail) {
      navigate(createPageUrl("CustomerPortal"));
      return;
    }

    loadCustomer(customerId);
  }, []);

  const loadCustomer = async (customerId) => {
    try {
      const customers = await base44.entities.Customer.filter({ id: customerId });
      if (customers.length > 0) {
        setCustomer(customers[0]);
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      toast.error("Error loading customer data");
    }
  };

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['customer-shipments', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      return await base44.entities.Shipment.filter({ 
        customer_name: customer.name 
      }, '-created_date', 100);
    },
    enabled: !!customer?.id
  });

  const handleLogout = () => {
    sessionStorage.removeItem("customer_id");
    sessionStorage.removeItem("customer_email");
    navigate(createPageUrl("CustomerPortal"));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "in_transit":
        return <TruckIcon className="w-4 h-4 text-cyan-400" />;
      case "delayed":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Package className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_transit":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "delayed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeShipments = filteredShipments.filter(s => 
    s.status === "pending" || s.status === "in_transit" || s.status === "delayed"
  );
  const completedShipments = filteredShipments.filter(s => 
    s.status === "delivered" || s.status === "cancelled"
  );

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis" 
                className="h-12 w-auto"
              />
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-medium">{customer.name}</span>
                </div>
                <span className="text-slate-400 text-sm">{customer.email}</span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Shipments</p>
                  <p className="text-2xl font-bold text-white">{shipments.length}</p>
                </div>
                <Package className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Transit</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {shipments.filter(s => s.status === "in_transit").length}
                  </p>
                </div>
                <TruckIcon className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Delivered</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {shipments.filter(s => s.status === "delivered").length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Delayed</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {shipments.filter(s => s.status === "delayed").length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by tracking number, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Shipments Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Active ({activeShipments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Completed ({completedShipments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {activeShipments.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No active shipments</p>
                  </CardContent>
                </Card>
              ) : (
                activeShipments.map((shipment) => (
                  <Card key={shipment.id} className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("CustomerTracking") + `?tracking=${shipment.tracking_number}`)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold text-lg">{shipment.tracking_number}</span>
                            <Badge className={getStatusColor(shipment.status)}>
                              {getStatusIcon(shipment.status)}
                              <span className="ml-1 capitalize">{shipment.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" />
                              <div>
                                <p className="text-slate-400 text-xs">Origin</p>
                                <p className="text-white text-sm">{shipment.origin}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-red-400 mt-0.5" />
                              <div>
                                <p className="text-slate-400 text-xs">Destination</p>
                                <p className="text-white text-sm">{shipment.destination}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {shipment.eta && (
                          <div className="text-right">
                            <p className="text-slate-400 text-xs mb-1">Estimated Delivery</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-cyan-400" />
                              <span className="text-white font-medium">
                                {moment(shipment.eta).format('MMM DD, HH:mm')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedShipments.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No completed shipments</p>
                  </CardContent>
                </Card>
              ) : (
                completedShipments.map((shipment) => (
                  <Card key={shipment.id} className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("CustomerTracking") + `?tracking=${shipment.tracking_number}`)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold text-lg">{shipment.tracking_number}</span>
                            <Badge className={getStatusColor(shipment.status)}>
                              {getStatusIcon(shipment.status)}
                              <span className="ml-1 capitalize">{shipment.status}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-slate-400 text-xs">Route</p>
                                <p className="text-white text-sm">{shipment.origin} → {shipment.destination}</p>
                              </div>
                            </div>
                            {shipment.actual_delivery && (
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-emerald-400 mt-0.5" />
                                <div>
                                  <p className="text-slate-400 text-xs">Delivered</p>
                                  <p className="text-white text-sm">
                                    {moment(shipment.actual_delivery).format('MMM DD, YYYY HH:mm')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}