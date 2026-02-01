import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import MapHeader from "@/components/tracking/MapHeader";
import EnhancedVehiclePanel from "@/components/tracking/EnhancedVehiclePanel";
import SmartInsights from "@/components/tracking/SmartInsights";
import RealtimeAlerts from "@/components/tracking/RealtimeAlerts";
import { Loader2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function MapMonitor() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleTrails, setVehicleTrails] = useState({});
  const [showInsights, setShowInsights] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Get current user
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      return user;
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Vehicle.filter({ organization_id: orgId }, '-updated_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
    refetchInterval: 3000,
  });

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ['resources', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Resource.filter({ organization_id: orgId });
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  if (!currentUser || vehiclesLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      <MapHeader vehicleCount={vehicles.length} activeCount={vehicles.filter(v => v.status === 'active').length} />

      <div className="flex-1 w-full relative">
        <LiveTrackingMap
          vehicles={vehicles}
          resources={resources}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          vehicleTrails={vehicleTrails}
        />

        {/* Left Panels: Alerts & Insights */}
        <div className="absolute top-24 left-4 z-[999] space-y-3 pointer-events-auto max-w-sm">
          {showAlerts && (
            <RealtimeAlerts
              vehicles={vehicles}
              onDismiss={(alertId) => {
                setDismissedAlerts(prev => new Set([...prev, alertId]));
              }}
            />
          )}

          {showInsights && selectedVehicle && (
            <SmartInsights vehicle={selectedVehicle} vehicles={vehicles} />
          )}
        </div>

        {/* Right Panel: Vehicle Details */}
        <div className="absolute top-24 right-4 bottom-4 z-[999] pointer-events-auto">
          <AnimatePresence>
            {selectedVehicle && (
              <EnhancedVehiclePanel
                vehicle={selectedVehicle}
                onClose={() => setSelectedVehicle(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}