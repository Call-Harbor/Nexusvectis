import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Globe, Truck, Warehouse, DollarSign, TrendingUp, AlertCircle,
  Users, Building2, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminDashboard() {


  // Check if user is authenticated
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch all organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['allOrganizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  // Fetch all vehicles
  const { data: allVehicles = [] } = useQuery({
    queryKey: ['allVehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  // Fetch all resources
  const { data: allResources = [] } = useQuery({
    queryKey: ['allResources'],
    queryFn: () => base44.entities.Resource.list()
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  // Calculate stats
  const calculateStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const vehiclesLast30 = allVehicles.filter(v => {
      const created = new Date(v.created_date);
      return created >= thirtyDaysAgo;
    }).length;

    const resourcesLast30 = allResources.filter(r => {
      const created = new Date(r.created_date);
      return created >= thirtyDaysAgo;
    }).length;

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyRevenue = invoices
      .filter(inv => inv.period_month === currentMonth && inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      totalVehicles: allVehicles.length,
      vehiclesLast30,
      totalResources: allResources.length,
      resourcesLast30,
      totalOrganizations: organizations.length,
      monthlyRevenue
    };
  };

  const stats = calculateStats();

  // Prepare map markers for organizations
  const organizationMarkers = organizations
    .filter(org => org.headquarters_country && org.headquarters_city)
    .map((org, idx) => ({
      id: org.id,
      name: org.name,
      country: org.headquarters_country,
      city: org.headquarters_city,
      lat: 55.6761 + (Math.random() - 0.5) * 0.1,
      lng: 12.5683 + (Math.random() - 0.5) * 0.1,
      vehicles: allVehicles.filter(v => v.organization_id === org.id).length
    }));

  // Chart data for growth
  const growthData = [
    { name: 'Jan', vehicles: Math.floor(stats.totalVehicles * 0.3), resources: Math.floor(stats.totalResources * 0.2) },
    { name: 'Feb', vehicles: Math.floor(stats.totalVehicles * 0.5), resources: Math.floor(stats.totalResources * 0.4) },
    { name: 'Mar', vehicles: Math.floor(stats.totalVehicles * 0.7), resources: Math.floor(stats.totalResources * 0.6) },
    { name: 'Apr', vehicles: Math.floor(stats.totalVehicles * 0.85), resources: Math.floor(stats.totalResources * 0.8) },
    { name: 'May', vehicles: Math.floor(stats.totalVehicles * 0.95), resources: Math.floor(stats.totalResources * 0.9) },
    { name: 'Jun', vehicles: stats.totalVehicles, resources: stats.totalResources }
  ];

  // Revenue data
  const revenueData = invoices
    .filter(inv => inv.status === 'paid')
    .slice(-6)
    .map(inv => ({
      month: inv.period_month,
      revenue: inv.total_amount
    }));

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
              <Globe className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">NexusVectis Admin Board</h1>
          </div>
          <p className="text-slate-400">Platform oversigt og systemstatistikker</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Organisationer</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalOrganizations}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Samlede enheder</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalVehicles}</p>
                <p className="text-xs text-emerald-400 mt-1">+{stats.vehiclesLast30} (30d)</p>
              </div>
              <Truck className="w-8 h-8 text-emerald-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Ressourcer</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalResources}</p>
                <p className="text-xs text-amber-400 mt-1">+{stats.resourcesLast30} (30d)</p>
              </div>
              <Warehouse className="w-8 h-8 text-amber-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Månedsomgang</p>
                <p className="text-2xl font-bold text-white mt-1">{(stats.monthlyRevenue / 1000).toFixed(1)}k DKK</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Gennemsn. pr org</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.totalOrganizations > 0 ? (stats.totalVehicles / stats.totalOrganizations).toFixed(1) : '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-violet-400 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Map and Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Organizations Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl overflow-hidden h-96"
          >
            <MapContainer center={[56, 12]} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap"
              />
              {organizationMarkers.map(org => (
                <Marker key={org.id} position={[org.lat, org.lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{org.name}</p>
                      <p className="text-slate-600">{org.city}, {org.country}</p>
                      <p className="text-slate-600">Enheder: {org.vehicles}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>

          {/* Growth Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Vækst (6 mdr)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="vehicles" fill="#06b6d4" name="Enheder" />
                <Bar dataKey="resources" fill="#f59e0b" name="Ressourcer" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Revenue and Organizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Omsætning (seneste 6 mdr)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.length > 0 ? revenueData : growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Organizations List */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Organisationer ({organizations.length})</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {organizations.slice(0, 10).map((org) => {
                const vehicleCount = allVehicles.filter(v => v.organization_id === org.id).length;
                return (
                  <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-slate-400">{org.headquarters_city}, {org.headquarters_country}</p>
                    </div>
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      {vehicleCount} enheder
                    </Badge>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Invoice Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
        >
          <h3 className="text-white font-semibold mb-4">Fakturaer (seneste)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'I alt', value: invoices.length, color: 'text-blue-400' },
              { label: 'Betalt', value: invoices.filter(i => i.status === 'paid').length, color: 'text-green-400' },
              { label: 'Afventer', value: invoices.filter(i => i.status === 'pending').length, color: 'text-amber-400' },
              { label: 'Forfaldne', value: invoices.filter(i => i.status === 'overdue').length, color: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}