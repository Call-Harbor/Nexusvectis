import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TruckIcon, 
  MapPin, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Thermometer,
  Weight,
  AlertCircle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import moment from "moment";
import { toast } from "sonner";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function CustomerTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tracking = urlParams.get("tracking");
    if (tracking) {
      setTrackingNumber(tracking);
    } else {
      navigate(createPageUrl("CustomerPortal"));
    }
  }, []);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment-tracking', trackingNumber],
    queryFn: async () => {
      if (!trackingNumber) return null;
      const shipments = await base44.entities.Shipment.filter({ tracking_number: trackingNumber });
      return shipments.length > 0 ? shipments[0] : null;
    },
    enabled: !!trackingNumber,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: vehicle } = useQuery({
    queryKey: ['shipment-vehicle', shipment?.vehicle_id],
    queryFn: async () => {
      if (!shipment?.vehicle_id) return null;
      const vehicles = await base44.entities.Vehicle.filter({ id: shipment.vehicle_id });
      return vehicles.length > 0 ? vehicles[0] : null;
    },
    enabled: !!shipment?.vehicle_id
  });

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

  const getStatusTimeline = () => {
    if (!shipment) return [];
    
    const timeline = [
      { 
        status: "pending", 
        label: "Order Created", 
        completed: true,
        date: shipment.created_date
      },
      { 
        status: "in_transit", 
        label: "In Transit", 
        completed: shipment.status === "in_transit" || shipment.status === "delivered",
        date: null
      },
      { 
        status: "delivered", 
        label: "Delivered", 
        completed: shipment.status === "delivered",
        date: shipment.actual_delivery
      }
    ];
    
    return timeline;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading shipment details...</div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Shipment Not Found</h3>
            <p className="text-slate-400 mb-4">The tracking number you entered could not be found.</p>
            <Button onClick={() => navigate(createPageUrl("CustomerPortal"))} 
              className="bg-gradient-to-r from-cyan-600 to-violet-600">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(createPageUrl("CustomerPortal"))}
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Tracking: {shipment.tracking_number}</h1>
              <Badge className={getStatusColor(shipment.status) + " text-base"}>
                <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            {shipment.eta && shipment.status !== "delivered" && (
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Estimated Delivery</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold text-lg">
                    {moment(shipment.eta).format('MMM DD, YYYY HH:mm')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            {vehicle && vehicle.latitude && vehicle.longitude && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Live Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <MapContainer 
                      center={[vehicle.latitude, vehicle.longitude]} 
                      zoom={8} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Marker position={[vehicle.latitude, vehicle.longitude]}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{vehicle.name}</p>
                            <p>Speed: {vehicle.speed || 0} km/h</p>
                            <p>Status: {vehicle.status}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Shipment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {getStatusTimeline().map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.completed ? 'bg-cyan-500/20 border-2 border-cyan-500' : 'bg-slate-800 border-2 border-slate-600'
                        }`}>
                          {item.completed && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        {index < getStatusTimeline().length - 1 && (
                          <div className={`w-0.5 h-12 ${item.completed ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className={`font-semibold ${item.completed ? 'text-white' : 'text-slate-500'}`}>
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-slate-400 text-sm mt-1">
                            {moment(item.date).format('MMM DD, YYYY HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Route Info */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Route Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-sm">Origin</p>
                    <p className="text-white font-medium">{shipment.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-sm">Destination</p>
                    <p className="text-white font-medium">{shipment.destination}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Details */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Shipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shipment.weight_kg && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">Weight</span>
                    </div>
                    <span className="text-white font-medium">{shipment.weight_kg} kg</span>
                  </div>
                )}
                {shipment.cargo_type && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">Cargo Type</span>
                    </div>
                    <span className="text-white font-medium capitalize">{shipment.cargo_type.replace('_', ' ')}</span>
                  </div>
                )}
                {shipment.current_temperature && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">Temperature</span>
                    </div>
                    <span className="text-white font-medium">{shipment.current_temperature}°C</span>
                  </div>
                )}
                {shipment.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Priority</span>
                    <Badge className={
                      shipment.priority === "urgent" ? "bg-red-500/20 text-red-400" :
                      shipment.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    }>
                      {shipment.priority}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            {vehicle && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Vehicle</span>
                    <span className="text-white font-medium">{vehicle.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Type</span>
                    <span className="text-white font-medium capitalize">{vehicle.type}</span>
                  </div>
                  {vehicle.speed !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Current Speed</span>
                      <span className="text-white font-medium">{vehicle.speed} km/h</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}