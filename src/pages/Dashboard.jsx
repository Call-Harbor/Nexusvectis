import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Satellite, Radio, BarChart3,
  PanelRightOpen, PanelRightClose, TrendingUp, AlertTriangle, Zap, Activity,
  Package, Wrench, ArrowRight, FileText, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import moment from "moment";

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

  // Check if user is logged in and has organization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          navigate(createPageUrl("Landing"));
          return;
        }
        const user = await base44.auth.me();
        const orgId = user?.organization_id || user?.data?.organization_id;
        if (!orgId) {
          navigate(createPageUrl("OrganizationSetup"));
        }
      } catch (error) {
        navigate(createPageUrl("Landing"));
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Vehicle.filter({ organization_id: orgId });
    },
    refetchInterval: 5000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Resource.filter({ organization_id: orgId });
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

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Shipment.filter({ organization_id: orgId }, '-created_date', 50);
    },
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      if (!orgId) return [];
      return await base44.entities.Maintenance.filter({ organization_id: orgId }, '-created_date', 50);
    },
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
  const avgFuelLevel = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.fuel_level || 0), 0) / vehicles.length)
    : 0;
  const totalCo2 = Math.round(vehicles.reduce((acc, v) => acc + (v.co2_emissions || 0), 0) * 10) / 10;
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.is_resolved).length;

  const inTransitShipments = shipments.filter(s => s.status === 'in_transit').length;
  const pendingMaintenance = maintenanceRecords.filter(m => m.status === 'pending').length;
  const overdueMaintenance = maintenanceRecords.filter(m => 
    m.status === 'pending' && 
    m.scheduled_date && 
    moment(m.scheduled_date).isBefore(moment())
  ).length;

  const quickActions = [
    { label: "Shipments", icon: Package, page: "Shipments", color: "cyan" },
    { label: "Maintenance", icon: Wrench, page: "MaintenanceManagement", color: "violet" },
    { label: "Reports", icon: FileText, page: "Reports", color: "emerald" },
    { label: "Drivers", icon: Users, page: "DriverManagement", color: "amber" }
  ];

  const StatCard = ({ icon: Icon, label, value, trend, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="p-3 sm:p-4 rounded-lg hologram-border transition-all"
      style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.5)' }}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.15)' }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 hologram-text" />
        </div>
        {trend && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />}
      </div>
      <p className="text-slate-300 text-xs sm:text-sm font-medium">{label}</p>
      <p className="text-xl sm:text-2xl font-bold hologram-text mt-0.5 sm:mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </motion.div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, rgba(2,13,30,0.98) 0%, rgba(15,10,40,0.95) 100%)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <AIAssistantBadge />

      <div className="relative z-10 p-3 sm:p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
          <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg hologram-border" style={{ background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.5)' }}>
                  <Globe className="w-6 h-6 sm:w-8 sm:h-8 hologram-text" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold hologram-text tracking-tight">[NEXUS] FLEET OPS</h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 uppercase tracking-widest font-mono">Advanced Fleet Intelligence Platform</p>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link key={idx} to={createPageUrl(action.page)}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`p-3 sm:p-4 rounded-xl backdrop-blur-xl border transition-all cursor-pointer group ${
                        action.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50' :
                        action.color === 'violet' ? 'bg-violet-500/10 border-violet-500/30 hover:border-violet-500/50' :
                        action.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50' :
                        'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 group-hover:scale-110 transition-transform ${
                        action.color === 'cyan' ? 'text-cyan-400' :
                        action.color === 'violet' ? 'text-violet-400' :
                        action.color === 'emerald' ? 'text-emerald-400' :
                        'text-amber-400'
                      }`} />
                      <p className="text-white text-sm font-medium">{action.label}</p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              <StatCard icon={Activity} label="Active Units" value={`${activeVehicles}/${vehicles.length}`} trend color="cyan" />
              <StatCard icon={Zap} label="Fleet Efficiency" value={`${avgEfficiency}%`} trend color="cyan" />
              <StatCard icon={Package} label="In Transit" value={inTransitShipments} subtitle={`${shipments.length} total`} color="violet" />
              <StatCard icon={Wrench} label="Maintenance" value={pendingMaintenance} subtitle={overdueMaintenance > 0 ? `${overdueMaintenance} overdue` : "On track"} color={overdueMaintenance > 0 ? 'amber' : 'emerald'} />
              <StatCard icon={Radio} label="Avg. Fuel" value={`${avgFuelLevel}%`} color="emerald" />
              <StatCard icon={AlertTriangle} label="Critical" value={criticalAlerts} color={criticalAlerts > 0 ? 'amber' : 'cyan'} />
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

            {/* Recent Activity Cards - Mobile & Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-cyan-400" />
                      Recent Shipments
                    </h3>
                    <Link to={createPageUrl("Shipments")}>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 text-xs">
                        View All
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {shipments.slice(0, 4).map(shipment => (
                      <div key={shipment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{shipment.tracking_number}</p>
                          <p className="text-slate-400 text-xs truncate">{shipment.origin} → {shipment.destination}</p>
                        </div>
                        <Badge className={
                          shipment.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 text-xs' :
                          shipment.status === 'in_transit' ? 'bg-cyan-500/20 text-cyan-400 text-xs' :
                          'bg-amber-500/20 text-amber-400 text-xs'
                        }>
                          {shipment.status === 'in_transit' ? 'Transit' : shipment.status}
                        </Badge>
                      </div>
                    ))}
                    {shipments.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">No shipments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-violet-400" />
                      Upcoming Maintenance
                    </h3>
                    <Link to={createPageUrl("MaintenanceManagement")}>
                      <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 text-xs">
                        View All
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {maintenanceRecords.filter(m => m.status === "pending").slice(0, 4).map(maintenance => {
                      const vehicle = vehicles.find(v => v.id === maintenance.vehicle_id);
                      const isOverdue = maintenance.scheduled_date && moment(maintenance.scheduled_date).isBefore(moment());
                      return (
                        <div key={maintenance.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{vehicle?.name || "Unknown"}</p>
                            <p className="text-slate-400 text-xs truncate">{maintenance.component}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">Overdue</Badge>
                            )}
                            <Badge className="bg-violet-500/20 text-violet-400 text-xs whitespace-nowrap">
                              {maintenance.scheduled_date ? moment(maintenance.scheduled_date).format('MMM DD') : 'TBD'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {maintenanceRecords.filter(m => m.status === "pending").length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">No upcoming maintenance</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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