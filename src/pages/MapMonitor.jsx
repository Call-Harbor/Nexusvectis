import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import SmartInsights from "@/components/tracking/SmartInsights";
import RealtimeAlerts from "@/components/tracking/RealtimeAlerts";
import { Loader2, MapPin, X } from "lucide-react";

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

  if (!currentUser || vehiclesLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      <div className="flex-1 w-full h-full relative">
        <LiveTrackingMap
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          vehicleTrails={vehicleTrails}
        />

        {/* Smart Panels */}
        <div className="absolute top-20 left-4 z-[999] space-y-3 pointer-events-auto">
          {showAlerts && (
            <div className="relative">
              <RealtimeAlerts
                vehicles={vehicles}
                onDismiss={(alertId) => {
                  setDismissedAlerts(prev => new Set([...prev, alertId]));
                  setTimeout(() => {
                    setDismissedAlerts(prev => {
                      const next = new Set(prev);
                      next.delete(alertId);
                      return next;
                    });
                  }, 5000);
                }}
              />
              <button
                onClick={() => setShowAlerts(false)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {showInsights && selectedVehicle && (
            <div className="relative">
              <SmartInsights vehicle={selectedVehicle} vehicles={vehicles} />
              <button
                onClick={() => setShowInsights(false)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}