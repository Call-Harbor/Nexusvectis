import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Globe, Truck, Warehouse, DollarSign, TrendingUp, AlertCircle,
  Users, Building2, Loader2, ExternalLink, Save, FileText, Mail, CheckCircle2, Clock
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
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
  const [markerCoordinates, setMarkerCoordinates] = useState({});
  const [invoiceSettings, setInvoiceSettings] = useState({
    company_name: "NexusVectis ApS",
    vat_number: "",
    company_address: "",
    company_country: "Denmark",
    company_email: "",
    company_phone: "",
    bank_account: "",
    bank_swift: "",
    company_registration: ""
  });
  const [invoiceSettingsId, setInvoiceSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const geocodeMutation = useMutation({
    mutationFn: async ({ city, country }) => {
      const response = await base44.functions.invoke('geocodeCity', { city, country });
      return response.data;
    }
  });

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

  // Fetch contact messages
  const { data: contactMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['contactMessages'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date', 50)
  });

  const markAsRead = async (id) => {
    await base44.entities.ContactMessage.update(id, { status: 'read' });
    refetchMessages();
  };

  // Fetch invoice settings
  const { data: invoiceSettingsData } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: async () => {
      const settings = await base44.entities.InvoiceSettings.list();
      if (settings.length > 0) {
        setInvoiceSettings(settings[0]);
        setInvoiceSettingsId(settings[0].id);
        return settings[0];
      }
      return null;
    }
  });

  const updateInvoiceSettings = async () => {
    if (!invoiceSettings.company_name.trim() || !invoiceSettings.vat_number.trim()) {
      toast.error("Company name and VAT number are required");
      return;
    }

    setSaving(true);
    try {
      if (invoiceSettingsId) {
        await base44.entities.InvoiceSettings.update(invoiceSettingsId, invoiceSettings);
      } else {
        const created = await base44.entities.InvoiceSettings.create(invoiceSettings);
        setInvoiceSettingsId(created.id);
      }
      queryClient.invalidateQueries(['invoiceSettings']);
      toast.success("Invoice settings updated successfully");
    } catch (error) {
      toast.error("Failed to update invoice settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

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

  // Geocode organizations
  useEffect(() => {
    organizations
      .filter(org => org.headquarters_country && org.headquarters_city)
      .forEach(org => {
        const key = `${org.headquarters_city},${org.headquarters_country}`;
        if (!markerCoordinates[key]) {
          geocodeMutation.mutate({ 
            city: org.headquarters_city, 
            country: org.headquarters_country 
          }, {
            onSuccess: (data) => {
              setMarkerCoordinates(prev => ({
                ...prev,
                [key]: { lat: data.lat, lng: data.lng }
              }));
            }
          });
        }
      });
  }, [organizations]);

  // Prepare map markers for organizations
  const organizationMarkers = organizations
    .filter(org => org.headquarters_country && org.headquarters_city)
    .map((org) => {
      const key = `${org.headquarters_city},${org.headquarters_country}`;
      const coords = markerCoordinates[key] || { lat: 20, lng: 0 };
      return {
        id: org.id,
        name: org.name,
        country: org.headquarters_country,
        city: org.headquarters_city,
        lat: coords.lat,
        lng: coords.lng,
        vehicles: allVehicles.filter(v => v.organization_id === org.id).length
      };
    });

  // Chart data for growth - last 6 months
  const growthData = (() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const vehiclesInMonth = allVehicles.filter(v => {
        const created = new Date(v.created_date);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      const resourcesInMonth = allResources.filter(r => {
        const created = new Date(r.created_date);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      months.push({
        name: monthName,
        vehicles: vehiclesInMonth,
        resources: resourcesInMonth
      });
    }
    
    return months;
  })();

  // Revenue data
  const revenueData = invoices
    .filter(inv => inv.status === 'paid')
    .slice(-6)
    .map(inv => ({
      month: inv.period_month,
      revenue: inv.total_amount
    }));

  return (
    <AdminLayout currentPage="AdminDashboard">
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      {userLoading && <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>}
      {!userLoading && <><div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Globe className="w-6 h-6 text-red-400" />
                </div>
                <h1 className="text-4xl font-bold text-white">NexusVectis Admin Board</h1>
              </div>
              <p className="text-slate-400">Platform overview and system statistics</p>
            </div>
            <a
              href={createPageUrl("AdminMonitor")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                <Globe className="w-4 h-4" />
                Open Admin Monitor
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
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
                <p className="text-slate-400 text-sm">Organizations</p>
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
                <p className="text-slate-400 text-sm">Total Units</p>
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
                <p className="text-slate-400 text-sm">Resources</p>
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
                <p className="text-slate-400 text-sm">Monthly Revenue</p>
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
                <p className="text-slate-400 text-sm">Avg per Org</p>
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
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
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
            <h3 className="text-white font-semibold mb-4">Growth (6 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="vehicles" fill="#06b6d4" name="Units" />
                <Bar dataKey="resources" fill="#f59e0b" name="Resources" />
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
            <h3 className="text-white font-semibold mb-4">Revenue (Last 6 months)</h3>
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
            <h3 className="text-white font-semibold mb-4">Organizations ({organizations.length})</h3>
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
                      {vehicleCount} units
                    </Badge>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Invoice Status and Company Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Invoices (Recent)</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total', value: invoices.length, color: 'text-blue-400' },
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'text-green-400' },
                { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, color: 'text-amber-400' },
                { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'text-red-400' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Invoice Company Settings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">Invoice Company Info</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Company Name</Label>
                  <Input
                    value={invoiceSettings.company_name}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, company_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                    placeholder="NexusVectis ApS"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">VAT Number</Label>
                  <Input
                    value={invoiceSettings.vat_number}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, vat_number: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                    placeholder="DK12345678"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Address</Label>
                <Input
                  value={invoiceSettings.company_address}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, company_address: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                  placeholder="Full address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Email</Label>
                  <Input
                    value={invoiceSettings.company_email}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, company_email: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                    placeholder="invoice@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Phone</Label>
                  <Input
                    value={invoiceSettings.company_phone}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, company_phone: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                    placeholder="+45 12 34 56 78"
                  />
                </div>
              </div>
              
              <Button
                onClick={updateInvoiceSettings}
                disabled={saving}
                className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 h-8 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Contact Messages */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-semibold">Contact Form Messages ({contactMessages.length})</h3>
              {contactMessages.filter(m => m.status === 'new').length > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {contactMessages.filter(m => m.status === 'new').length} new
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {contactMessages.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No messages yet</p>
            ) : contactMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg border transition-all ${
                  msg.status === 'new'
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-slate-900/50 border-slate-700/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-medium text-sm">{msg.name}</span>
                      <span className="text-slate-400 text-xs">{msg.email}</span>
                      {msg.company && <span className="text-slate-500 text-xs">· {msg.company}</span>}
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{msg.subject || 'general'}</Badge>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-slate-600 text-xs mt-2">{new Date(msg.created_date).toLocaleString('da-DK')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {msg.status === 'new' ? (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 px-2 py-1 rounded"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark read
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> {msg.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
    </AdminLayout>
  );
}