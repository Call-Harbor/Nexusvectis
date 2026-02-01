import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Wrench, AlertTriangle, Thermometer, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import PredictiveMaintenance from "@/components/ai/PredictiveMaintenance";
import ExceptionManagement from "@/components/ai/ExceptionManagement";
import ColdChainMonitor from "@/components/shipments/ColdChainMonitor";

export default function AIOptimization() {
  const [activeTab, setActiveTab] = useState("maintenance");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Vehicle.filter({ organization_id: orgId });
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Maintenance.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Exception.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Shipment.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const resolveExceptionMutation = useMutation({
    mutationFn: (id) => base44.entities.Exception.update(id, { status: 'resolved', resolved_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exceptions'] }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Optimization</h1>
              <p className="text-slate-400 mt-1">Predictive intelligence & automated management</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50 mb-6">
            <TabsTrigger 
              value="maintenance" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Predictive Maintenance
            </TabsTrigger>
            <TabsTrigger 
              value="exceptions" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Exception Management
            </TabsTrigger>
            <TabsTrigger 
              value="coldchain" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Cold Chain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance">
            <PredictiveMaintenance 
              maintenanceRecords={maintenanceRecords}
              vehicles={vehicles}
            />
          </TabsContent>

          <TabsContent value="exceptions">
            <ExceptionManagement 
              exceptions={exceptions}
              onResolve={(id) => resolveExceptionMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="coldchain">
            <ColdChainMonitor shipments={shipments} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}