import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { Building2, Users, Truck, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

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

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.asServiceRole.entities.Organization.list(),
    enabled: user?.role === 'admin',
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['allVehicles'],
    queryFn: () => base44.asServiceRole.entities.Vehicle.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.asServiceRole.entities.User.list(),
    enabled: user?.role === 'admin',
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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 text-center">
            <p className="text-slate-400">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVehicles = vehicles.length;
  const totalUsers = allUsers.length;
  const activeOrgs = organizations.filter(org => 
    vehicles.some(v => v.organization_id === org.id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Monitor</h1>
          <p className="text-slate-400">Global organization overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{organizations.length}</div>
              <p className="text-xs text-slate-500 mt-1">{activeOrgs} with active vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Total Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalVehicles}</div>
              <p className="text-xs text-slate-500 mt-1">Across all organizations</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">Platform-wide</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Organization Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] relative">
              {geocodedOrgs.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Loading organization locations...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}