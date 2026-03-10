import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import Fleet3DGlobeMap from "@/components/tracking/Fleet3DGlobeMap";
import MapHeader from "@/components/tracking/MapHeader";
import EnhancedVehiclePanel from "@/components/tracking/EnhancedVehiclePanel";
import SmartInsights from "@/components/tracking/SmartInsights";
import RealtimeAlerts from "@/components/tracking/RealtimeAlerts";
import AIControlPanel from "@/components/tracking/AIControlPanel";
import { Loader2, Globe, Map } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function MapMonitor() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleTrails, setVehicleTrails] = useState({});
  const [showInsights, setShowInsights] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [aiMode, setAiMode] = useState(false);
  const [view3D, setView3D] = useState(false);

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

  // Fetch external AIS traffic
  const { data: aisData = {} } = useQuery({
    queryKey: ['aisTraffic'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAISTraffic', {});
      return res.data || {};
    },
    refetchInterval: 10000,
  });

  // Fetch external aircraft traffic
  const { data: aircraftData = {} } = useQuery({
    queryKey: ['aircraftTraffic'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAircraftTraffic', {});
      return res.data || {};
    },
    refetchInterval: 10000,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubVehicles = base44.entities.Vehicle.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    });

    const unsubResources = base44.entities.Resource.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    });

    const unsubRoutes = base44.entities.Route.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    });

    return () => {
      unsubVehicles();
      unsubResources();
      unsubRoutes();
    };
  }, [queryClient]);

  if (!currentUser || vehiclesLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      <MapHeader 
        vehicleCount={vehicles.length} 
        activeCount={vehicles.filter(v => v.status === 'active').length}
        aiMode={aiMode}
        onToggleAI={() => setAiMode(!aiMode)}
      />

      <div className="flex-1 w-full relative">
        {/* 2D / 3D toggle */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(2,6,18,0.85)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <button
            onClick={() => setView3D(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={!view3D
              ? { background: "rgba(6,182,212,0.2)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.4)" }
              : { color: "#475569", border: "1px solid transparent" }}
          >
            <Map className="w-3.5 h-3.5" /> 2D
          </button>
          <button
            onClick={() => setView3D(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={view3D
              ? { background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)" }
              : { color: "#475569", border: "1px solid transparent" }}
          >
            <Globe className="w-3.5 h-3.5" /> 3D
          </button>
        </div>
        {view3D ? (
          <Fleet3DGlobeMap
            vehicles={vehicles}
            routes={[]}
            onSelectVehicle={setSelectedVehicle}
          />
        ) : (
        <LiveTrackingMap
          vehicles={vehicles}
          resources={resources}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          vehicleTrails={vehicleTrails}
          externalShips={aisData.traffic || []}
          externalAircraft={aircraftData.traffic || []}
          aiMode={aiMode}
        />
        )}

        {/* Left Panels: Alerts & Insights */}
        <div className="absolute top-24 left-4 z-[999] space-y-3 pointer-events-auto max-w-sm">
          {(showAlerts || aiMode) && (
            <RealtimeAlerts
              vehicles={vehicles}
              onDismiss={(alertId) => {
                setDismissedAlerts(prev => new Set([...prev, alertId]));
              }}
              enhanced={aiMode}
            />
          )}

          {(showInsights || aiMode) && selectedVehicle && (
            <SmartInsights 
              vehicle={selectedVehicle} 
              vehicles={vehicles}
              aiMode={aiMode}
            />
          )}
        </div>

        {/* AI Control Panel (bottom-left when AI mode active) */}
        <div className="absolute bottom-24 left-4 z-[999] pointer-events-auto">
          <AIControlPanel 
            vehicles={vehicles} 
            aiMode={aiMode}
            onApplyOptimization={(rec) => {
              console.log('Applying optimization:', rec);
            }}
          />
        </div>

        {/* Right Panel: Vehicle Details — only in 2D mode */}
        {!view3D && (
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
        )}

        {/* Vehicle detail panel in 3D mode */}
        {view3D && selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 z-[999] pointer-events-auto"
          >
            <EnhancedVehiclePanel
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}