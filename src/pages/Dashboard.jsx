import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Satellite, Radio, BarChart3,
  PanelRightOpen, PanelRightClose
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import VehicleDetailPanel from "@/components/tracking/VehicleDetailPanel";
import FleetAnalytics from "@/components/tracking/FleetAnalytics";
import AlertPanel from "@/components/dashboard/AlertPanel";

// Vehicle simulation logic
const routeTemplates = {
  truck: [
    { lat: 55.6761, lng: 12.5683 }, { lat: 55.7, lng: 12.3 }, { lat: 55.8, lng: 11.8 },
    { lat: 55.9, lng: 11.2 }, { lat: 56.0, lng: 10.8 }, { lat: 56.1629, lng: 10.2039 },
  ],
  ship: [
    { lat: 57.0, lng: 10.0 }, { lat: 56.5, lng: 8.0 }, { lat: 55.5, lng: 6.0 },
    { lat: 54.0, lng: 4.5 }, { lat: 52.5, lng: 4.0 }, { lat: 51.9, lng: 4.5 },
  ],
  aircraft: [
    { lat: 55.618, lng: 12.656 }, { lat: 54.5, lng: 11.5 }, { lat: 53.5, lng: 10.5 },
    { lat: 52.5, lng: 9.5 }, { lat: 51.5, lng: 9.0 }, { lat: 50.033, lng: 8.570 },
  ],
  train: [
    { lat: 55.6761, lng: 12.5683 }, { lat: 55.5, lng: 11.5 },
    { lat: 55.4, lng: 10.4 }, { lat: 55.5, lng: 9.5 },
  ],
  drone: [
    { lat: 55.68, lng: 12.55 }, { lat: 55.69, lng: 12.54 }, { lat: 55.70, lng: 12.53 },
    { lat: 55.71, lng: 12.52 }, { lat: 55.72, lng: 12.51 }, { lat: 55.73, lng: 12.50 },
  ],
};

const speedRanges = {
  truck: { min: 60, max: 100 },
  ship: { min: 15, max: 30 },
  aircraft: { min: 400, max: 900 },
  train: { min: 100, max: 180 },
  drone: { min: 30, max: 60 },
};

function calculateHeading(from, to) {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function interpolatePosition(waypoints, progress) {
  if (waypoints.length < 2) return waypoints[0] || { lat: 55.6761, lng: 12.5683, heading: 0 };
  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const segmentFraction = segmentProgress - currentSegment;
  const start = waypoints[currentSegment];
  const end = waypoints[currentSegment + 1];
  return {
    lat: start.lat + (end.lat - start.lat) * segmentFraction,
    lng: start.lng + (end.lng - start.lng) * segmentFraction,
    heading: calculateHeading(start, end),
  };
}

function useVehicleSimulation(initialVehicles, updateInterval = 2000) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [vehicleTrails, setVehicleTrails] = useState({});
  const vehicleStateRef = useRef({});

  useEffect(() => {
    const states = {};
    initialVehicles.forEach(vehicle => {
      if (!vehicleStateRef.current[vehicle.id]) {
        states[vehicle.id] = {
          progress: Math.random(),
          direction: 1,
          route: routeTemplates[vehicle.type] || routeTemplates.truck,
        };
      }
    });
    vehicleStateRef.current = { ...vehicleStateRef.current, ...states };
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  const updateVehicles = useCallback(() => {
    setVehicles(prevVehicles => {
      const updatedVehicles = prevVehicles.map(vehicle => {
        if (vehicle.status !== 'active') return vehicle;
        const state = vehicleStateRef.current[vehicle.id];
        if (!state) return vehicle;

        const speedRange = speedRanges[vehicle.type] || speedRanges.truck;
        const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
        const progressIncrement = (speed / 10000) * state.direction;
        let newProgress = state.progress + progressIncrement;
        
        if (newProgress >= 1) { newProgress = 1; state.direction = -1; }
        else if (newProgress <= 0) { newProgress = 0; state.direction = 1; }
        state.progress = newProgress;
        
        const position = interpolatePosition(state.route, newProgress);
        const noise = { lat: (Math.random() - 0.5) * 0.001, lng: (Math.random() - 0.5) * 0.001 };
        const fuelConsumption = (speed / 1000) * (Math.random() * 0.5 + 0.5);
        const newFuel = Math.max(5, (vehicle.fuel_level || 100) - fuelConsumption);
        
        return {
          ...vehicle,
          latitude: position.lat + noise.lat,
          longitude: position.lng + noise.lng,
          heading: Math.round(position.heading),
          speed: Math.round(speed),
          fuel_level: Math.round(newFuel * 10) / 10,
        };
      });

      // Update trails
      setVehicleTrails(prevTrails => {
        const newTrails = { ...prevTrails };
        updatedVehicles.forEach(vehicle => {
          if (vehicle.status === 'active' && vehicle.latitude && vehicle.longitude) {
            const trail = newTrails[vehicle.id] || [];
            const newPosition = [vehicle.latitude, vehicle.longitude];
            if (trail.length === 0 || trail[trail.length - 1][0] !== newPosition[0]) {
              newTrails[vehicle.id] = [...trail.slice(-50), newPosition];
            }
          }
        });
        return newTrails;
      });

      return updatedVehicles;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(updateVehicles, updateInterval);
    return () => clearInterval(interval);
  }, [updateVehicles, updateInterval]);

  return { vehicles, vehicleTrails };
}

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [activeTab, setActiveTab] = useState("tracking");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if user has organization
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const user = await base44.auth.me();
        if (!user.organization_id) {
          navigate(createPageUrl("OrganizationSetup"));
        }
      } catch (error) {
        console.error("Error checking organization:", error);
      }
    };
    checkOrganization();
  }, [navigate]);

  const { data: rawVehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
    refetchInterval: 30000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  const { vehicles, vehicleTrails } = useVehicleSimulation(rawVehicles, 2000);

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { is_resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  useEffect(() => {
    if (!selectedVehicle && vehicles.length > 0) {
      const activeVehicle = vehicles.find(v => v.status === 'active');
      if (activeVehicle) setSelectedVehicle(activeVehicle);
    }
  }, [vehicles, selectedVehicle]);

  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find(v => v.id === selectedVehicle.id);
      if (updated && updated.latitude !== selectedVehicle.latitude) {
        setSelectedVehicle(updated);
      }
    }
  }, [vehicles, selectedVehicle]);

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">NexusVectis</h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Satellite className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-400">Live Fleet Control</span>
                  </div>
                  <div className="h-4 w-px bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-sm text-emerald-400">{activeVehicles} units transmitting</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-800/50 border border-slate-700/50">
                  <TabsTrigger value="tracking" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                    <Satellite className="w-4 h-4 mr-2" />
                    Live Tracking
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/50 border-slate-700/50 text-white"
                onClick={() => setShowDetailPanel(!showDetailPanel)}
              >
                {showDetailPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {activeTab === "tracking" ? (
          <div className="flex gap-6">
            <div className="flex-1">
              <LiveTrackingMap 
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={(v) => {
                  setSelectedVehicle(v);
                  setShowDetailPanel(true);
                }}
                vehicleTrails={vehicleTrails}
              />
            </div>

            <AnimatePresence>
              {showDetailPanel && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-96 space-y-6 flex-shrink-0 hidden xl:block"
                >
                  {selectedVehicle && (
                    <VehicleDetailPanel 
                      vehicle={selectedVehicle}
                      onClose={() => setSelectedVehicle(null)}
                    />
                  )}
                  <AlertPanel 
                    alerts={alerts}
                    onResolve={(id) => resolveAlertMutation.mutate(id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <FleetAnalytics vehicles={vehicles} routes={routes} />
        )}
      </div>
    </div>
  );
}