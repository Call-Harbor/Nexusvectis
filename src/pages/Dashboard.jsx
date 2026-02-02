import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Satellite, Radio, BarChart3,
  PanelRightOpen, PanelRightClose, TrendingUp, AlertTriangle, Zap, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LiveTrackingMap from "@/components/tracking/LiveTrackingMap";
import VehicleDetailPanel from "@/components/tracking/VehicleDetailPanel";
import FleetAnalytics from "@/components/tracking/FleetAnalytics";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AIInsightWidget from "@/components/ai/AIInsightWidget";
import AIQuickActions from "@/components/ai/AIQuickActions";
import AIAssistantBadge from "@/components/ai/AIAssistantBadge";
import InventoryForecast from "@/components/ai/InventoryForecast";

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

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user.organization_id) return [];
      return await base44.entities.Vehicle.filter({ organization_id: user.organization_id });
    },
    refetchInterval: 5000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user.organization_id) return [];
      return await base44.entities.Resource.filter({ organization_id: user.organization_id });
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  const vehicleTrails = {};

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
      if (updated) {
        setSelectedVehicle(updated);
      }
    }
  }, [vehicles, selectedVehicle]);

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
  const avgEfficiency = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.efficiency_score || 0), 0) / vehicles.length)
    : 0;
  const totalCo2 = vehicles.reduce((acc, v) => acc + (v.co2_emissions || 0), 0);
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.is_resolved).length;

  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-xl border transition-all ${
        color === 'cyan' 
          ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20' 
          : color === 'violet'
          ? 'bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20'
          : color === 'emerald'
          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
          : 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20'
      }`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${
          color === 'cyan' ? 'bg-cyan-500/20' 
          : color === 'violet' ? 'bg-violet-500/20'
          : color === 'emerald' ? 'bg-emerald-500/20'
          : 'bg-amber-500/20'
        }`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
            color === 'cyan' ? 'text-cyan-400' 
            : color === 'violet' ? 'text-violet-400'
            : color === 'emerald' ? 'text-emerald-400'
            : 'text-amber-400'
          }`} />
        </div>
        {trend && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />}
      </div>
      <p className="text-slate-400 text-xs sm:text-sm font-medium">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">{value}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <AIAssistantBadge />

      <div className="relative z-10 p-3 sm:p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
          <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                  <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">NexusVectis</h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Advanced Fleet Intelligence Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 sm:flex-initial">
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full">
                    <TabsTrigger value="tracking" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-xs sm:text-sm flex-1 sm:flex-initial">
                      <Satellite className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Live Tracking</span>
                      <span className="sm:hidden">Tracking</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-xs sm:text-sm flex-1 sm:flex-initial">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Analytics</span>
                      <span className="sm:hidden">Stats</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50 hidden lg:flex"
                  onClick={() => setShowDetailPanel(!showDetailPanel)}
                >
                  {showDetailPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              <StatCard icon={Activity} label="Active Units" value={activeVehicles} trend color="cyan" />
              <StatCard icon={Radio} label="Idle Units" value={idleVehicles} color="amber" />
              <StatCard icon={AlertTriangle} label="Offline" value={offlineVehicles} color="violet" />
              <StatCard icon={Zap} label="Avg Efficiency" value={`${avgEfficiency}%`} trend color="emerald" />
              <StatCard icon={AlertTriangle} label="Critical Alerts" value={criticalAlerts} color={criticalAlerts > 0 ? 'violet' : 'cyan'} />
            </div>
          </div>
        </motion.div>

        {activeTab === "tracking" ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="hidden md:block">
              <AIQuickActions 
                onOptimize={() => {}} 
                onPredict={() => {}} 
                onAnalyze={() => {}}
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <div className="flex-1 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                <LiveTrackingMap 
                  vehicles={vehicles}
                  resources={resources}
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
                    className="w-full lg:w-80 xl:w-96 space-y-4 sm:space-y-6 flex-shrink-0 hidden lg:block"
                  >
                    {selectedVehicle && (
                      <>
                        <VehicleDetailPanel 
                          vehicle={selectedVehicle}
                          onClose={() => setSelectedVehicle(null)}
                        />
                        <AIInsightWidget 
                          entity_type="vehicle" 
                          entity_id={selectedVehicle.id}
                          compact
                        />
                      </>
                    )}
                    <AlertPanel 
                      alerts={alerts}
                      onResolve={(id) => resolveAlertMutation.mutate(id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AIInsightWidget entity_type="fleet" entity_id="all" />
              <InventoryForecast forecast_days={30} />
            </div>
            <FleetAnalytics vehicles={vehicles} routes={routes} />
          </div>
        )}
      </div>
    </div>
  );
}