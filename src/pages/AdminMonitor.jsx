import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { Building2, Users, Truck, MapPin, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminMonitor() {
  const [geocodedOrgs, setGeocodedOrgs] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['allVehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  useEffect(() => {
    const geocodeOrganizations = async () => {
      const results = await Promise.all(
        organizations.map(async (org) => {
          if (org.headquarters_city && org.headquarters_country) {
            try {
              const response = await base44.functions.invoke('geocodeCity', {
                city: org.headquarters_city,
                country: org.headquarters_country
              });
              
              if (response.data?.lat && response.data?.lng) {
                const orgVehicles = vehicles.filter(v => v.organization_id === org.id);
                return {
                  ...org,
                  lat: response.data.lat,
                  lng: response.data.lng,
                  vehicleCount: orgVehicles.length
                };
              }
            } catch (error) {
              console.error(`Failed to geocode ${org.name}:`, error);
            }
          }
          return null;
        })
      );
      setGeocodedOrgs(results.filter(Boolean));
    };

    if (organizations.length > 0) {
      geocodeOrganizations();
    }
  }, [organizations, vehicles]);

  const totalVehicles = vehicles.length;
  const totalUsers = allUsers.length;
  const activeOrgs = organizations.filter(org => 
    vehicles.some(v => v.organization_id === org.id)
  ).length;

  const isLoading = orgsLoading || vehiclesLoading || usersLoading;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="absolute top-6 left-6 right-6 z-[9999] flex items-center justify-between pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 pointer-events-auto"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <Globe className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Global Monitor
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Real-time platform overview</p>
          </div>
        </motion.div>
        
        <div className="flex gap-3 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)' }}
            className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-slate-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-xl px-4 py-3 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Building2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-br from-cyan-400 to-cyan-600 bg-clip-text text-transparent">{organizations.length}</div>
                <div className="text-xs text-slate-400">Organizations</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)' }}
            className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 to-slate-900/50 backdrop-blur-xl border border-violet-500/30 rounded-xl px-4 py-3 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Truck className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-br from-violet-400 to-violet-600 bg-clip-text text-transparent">{totalVehicles}</div>
                <div className="text-xs text-slate-400">Vehicles</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-slate-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-xl px-4 py-3 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">{totalUsers}</div>
                <div className="text-xs text-slate-400">Users</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="h-full w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
              <p>Loading data...</p>
            </div>
          </div>
        ) : geocodedOrgs.length > 0 ? (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full"
            style={{ background: '#0f172a' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {geocodedOrgs.map((org) => (
              <CircleMarker
                key={org.id}
                center={[org.lat, org.lng]}
                radius={8}
                pathOptions={{
                  fillColor: '#06b6d4',
                  fillOpacity: 0.8,
                  color: '#22d3ee',
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-slate-900 mb-1">{org.name}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {org.headquarters_city}, {org.headquarters_country}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        {org.vehicleCount} vehicles
                      </Badge>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : organizations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No organizations found</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Geocoding organizations...</p>
              <p className="text-xs mt-2">{organizations.length} organizations, {geocodedOrgs.length} geocoded</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}