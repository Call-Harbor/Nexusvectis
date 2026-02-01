import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Activity, Satellite, Radio, BarChart3, Settings,
  Maximize2, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import VehicleDetailPanel from "@/components/tracking/VehicleDetailPanel";
import FleetAnalytics from "@/components/tracking/FleetAnalytics";
import AlertPanel from "@/components/dashboard/AlertPanel";
import { useVehicleSimulation } from "@/components/tracking/useVehicleSimulation";

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [activeTab, setActiveTab] = useState("tracking");
  const queryClient = useQueryClient();

  const { data: rawVehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
    refetchInterval: 30000, // Refetch every 30s for any external updates
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  // Use simulation hook for live movement
  const { vehicles, vehicleTrails } = useVehicleSimulation(rawVehicles, 2000);

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { is_resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  // Auto-select first active vehicle
  useEffect(() => {
    if (!selectedVehicle && vehicles.length > 0) {
      const activeVehicle = vehicles.find(v => v.status === 'active');
      if (activeVehicle) setSelectedVehicle(activeVehicle);
    }
  }, [vehicles, selectedVehicle]);

  // Update selected vehicle with latest data
  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find(v => v.id === selectedVehicle.id);
      if (updated && (
        updated.latitude !== selectedVehicle.latitude ||
        updated.longitude !== selectedVehicle.longitude
      )) {
        setSelectedVehicle(updated);
      }
    }
  }, [vehicles, selectedVehicle]);

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 lg:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
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

        {/* Main Content */}
        {activeTab === "tracking" ? (
          <div className="flex gap-6">
            {/* Map Section */}
            <div className={`flex-1 transition-all ${showDetailPanel ? '' : ''}`}>
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

            {/* Side Panels */}
            <AnimatePresence>
              {showDetailPanel && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-96 space-y-6 flex-shrink-0"
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