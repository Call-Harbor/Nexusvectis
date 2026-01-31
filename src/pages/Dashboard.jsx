import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Truck, Ship, Activity, Fuel, Route, AlertTriangle, 
  Sparkles, Globe, BarChart3, Layers
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import AlertPanel from "@/components/dashboard/AlertPanel";
import VehicleList from "@/components/dashboard/VehicleList";
import FleetMap from "@/components/dashboard/FleetMap";
import AIInsights from "@/components/dashboard/AIInsights";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { is_resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  // Calculate stats
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.cargo_capacity || 0), 0);
  const usedCapacity = vehicles.reduce((sum, v) => sum + (v.cargo_used || 0), 0);
  const avgFuel = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicles.length)
    : 0;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Globe className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">NexusVectis</h1>
              <p className="text-slate-400">AI-drevet logistikplatform • Realtidsoversigt</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Aktive Enheder"
            value={activeVehicles}
            subtitle={`af ${vehicles.length} total`}
            icon={Truck}
            color="cyan"
            trend="+12% denne uge"
            trendUp={true}
          />
          <StatCard
            title="Aktive Ruter"
            value={activeRoutes}
            subtitle={`${routes.length} total planlagt`}
            icon={Route}
            color="emerald"
          />
          <StatCard
            title="Gns. Brændstof"
            value={`${avgFuel}%`}
            subtitle="På tværs af flåden"
            icon={Fuel}
            color={avgFuel < 30 ? 'rose' : avgFuel < 50 ? 'amber' : 'blue'}
          />
          <StatCard
            title="Aktive Alarmer"
            value={unresolvedAlerts}
            subtitle="Kræver handling"
            icon={AlertTriangle}
            color={unresolvedAlerts > 5 ? 'rose' : unresolvedAlerts > 2 ? 'amber' : 'emerald'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Map and Chart */}
          <div className="xl:col-span-2 space-y-6">
            <FleetMap 
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />
            <PerformanceChart />
          </div>

          {/* Right Column - Panels */}
          <div className="space-y-6">
            <VehicleList 
              vehicles={vehicles}
              selectedId={selectedVehicle?.id}
              onSelectVehicle={setSelectedVehicle}
            />
            <AIInsights vehicles={vehicles} routes={routes} />
            <AlertPanel 
              alerts={alerts}
              onResolve={(id) => resolveAlertMutation.mutate(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}