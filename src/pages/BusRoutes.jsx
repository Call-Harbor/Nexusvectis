import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, MapPin, Clock, Users, Plus, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import BusRouteOverview from "../components/bus/BusRouteOverview";
import BusRouteEditor from "../components/bus/BusRouteEditor";

export default function BusRoutes() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const queryClient = useQueryClient();

  const { data: routes = [] } = useQuery({
    queryKey: ['busRoutes'],
    queryFn: () => base44.entities.BusRoute.list('-route_number', 50),
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops'],
    queryFn: () => base44.entities.BusStop.list('-stop_code', 200),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('-updated_date', 100),
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;
      
      return base44.entities.BusRoute.create({
        ...data,
        organization_id: orgId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['busRoutes']);
      toast.success('Route created successfully');
      setShowEditor(false);
      setEditingRoute(null);
    },
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Holographic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-teal-950/20" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 14, repeat: Infinity }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 16, repeat: Infinity }}
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="relative z-10 p-6 max-w-[120rem] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent animate-pulse" />
                <TrendingUp className="w-10 h-10 text-emerald-400 relative z-10" />
              </motion.div>
              <div>
                <h1 className="text-6xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                  BUS ROUTES
                </h1>
                <p className="text-slate-300 text-xl font-light">Network Planning & Optimization</p>
              </div>
            </div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button onClick={() => setShowEditor(true)}
                className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/40 border-2 border-emerald-400/60 flex items-center gap-3">
                <Plus className="w-5 h-5" />
                New Route
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Route Overview */}
        <BusRouteOverview routes={routes} stops={stops} buses={buses} />

        {/* Editor */}
        <AnimatePresence>
          {showEditor && (
            <BusRouteEditor
              route={editingRoute}
              stops={stops}
              onSave={(data) => createRouteMutation.mutate(data)}
              onClose={() => {
                setShowEditor(false);
                setEditingRoute(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}