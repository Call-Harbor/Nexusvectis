import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, DollarSign, Package, Zap } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function BillingDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Check if user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setIsLoadingAuth(false);
        return u;
      } catch (e) {
        setIsLoadingAuth(false);
        return null;
      }
    }
  });

  // Fetch all invoices for analytics
  const { data: invoices = [] } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  // Fetch organizations for subscription count
  const { data: organizations = [] } = useQuery({
    queryKey: ['billing-organizations'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!invoices.length) return {
      monthlyRevenue: [],
      productDistribution: [],
      forecast: [],
      totals: { revenue: 0, invoices: 0, avgInvoice: 0 }
    };

    // Group invoices by month
    const monthlyData = {};
    invoices.forEach(inv => {
      if (inv.status !== 'cancelled' && inv.period_month) {
        if (!monthlyData[inv.period_month]) {
          monthlyData[inv.period_month] = {
            month: inv.period_month,
            revenue: 0,
            vehicles: 0,
            resources: 0,
            fleetAI: 0,
            api: 0,
            harbor: 0,
            addons: 0
          };
        }
        monthlyData[inv.period_month].revenue += inv.total_amount || 0;
        monthlyData[inv.period_month].vehicles += (inv.vehicle_count * inv.vehicle_price_euro) || 0;
        monthlyData[inv.period_month].resources += (inv.resource_count * inv.resource_price_euro) || 0;
        monthlyData[inv.period_month].fleetAI += (Math.ceil(inv.fleetai_commands / 100) * inv.fleetai_price_per_100) || 0;
        monthlyData[inv.period_month].api += (Math.ceil(inv.api_calls / 100) * inv.api_price_per_100) || 0;
        monthlyData[inv.period_month].harbor += (inv.harbor_intelligence_calls * inv.harbor_intelligence_price_per_call) || 0;
        monthlyData[inv.period_month].addons += (inv.addon_airport_ops_price || 0) + (inv.addon_port_command_price || 0) + (inv.addon_transit_control_price || 0);
      }
    });

    const monthlyRevenue = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Product distribution
    const totalVehicles = monthlyRevenue.reduce((sum, m) => sum + m.vehicles, 0);
    const totalResources = monthlyRevenue.reduce((sum, m) => sum + m.resources, 0);
    const totalFleetAI = monthlyRevenue.reduce((sum, m) => sum + m.fleetAI, 0);
    const totalAPI = monthlyRevenue.reduce((sum, m) => sum + m.api, 0);
    const totalHarbor = monthlyRevenue.reduce((sum, m) => sum + m.harbor, 0);
    const totalAddons = monthlyRevenue.reduce((sum, m) => sum + m.addons, 0);

    const productDistribution = [
      { name: 'Fleet Management (Vehicles)', value: Math.round(totalVehicles) },
      { name: 'Fleet Management (Resources)', value: Math.round(totalResources) },
      { name: 'FLEET AI', value: Math.round(totalFleetAI) },
      { name: 'API Calls', value: Math.round(totalAPI) },
      { name: 'Harbor Intelligence', value: Math.round(totalHarbor) },
      { name: 'Add-ons', value: Math.round(totalAddons) }
    ].filter(p => p.value > 0);

    // Forecast next 3 months based on active subscriptions
    const avgMonthlyRevenue = monthlyRevenue.length > 0 
      ? monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0) / monthlyRevenue.length 
      : 0;
    
    const activeAddons = organizations.filter(o => o.addon_airport_ops || o.addon_port_command || o.addon_transit_control).length;
    const addonRevenue = activeAddons * 2000; // €2000 per addon per month
    
    const forecast = [];
    const now = moment();
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = now.clone().add(i, 'months');
      forecast.push({
        month: forecastMonth.format('YYYY-MM'),
        revenue: Math.round(avgMonthlyRevenue + (addonRevenue * 0.5)), // Conservative estimate
        forecast: true
      });
    }

    const totals = {
      revenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
      invoices: invoices.length,
      avgInvoice: invoices.length > 0 ? invoices.reduce((sum, i) => sum + i.total_amount, 0) / invoices.length : 0
    };

    return {
      monthlyRevenue,
      productDistribution,
      forecast,
      totals
    };
  }, [invoices, organizations]);

  if (isLoadingAuth) {
    return (
      <AdminLayout currentPage="BillingDashboard">
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  // Admin-only access
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AdminLayout currentPage="BillingDashboard">
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <Card className="bg-slate-900/80 border-red-500/30 max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Access Denied</p>
              <p className="text-slate-400 text-sm">Only administrators can access this dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const combinedData = [...analyticsData.monthlyRevenue, ...analyticsData.forecast];

  return (
    <AdminLayout currentPage="BillingDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Billing Dashboard</h1>
            <p className="text-slate-400">Revenue analytics and subscription forecasts</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-cyan-400">€{analyticsData.totals.revenue.toLocaleString('da-DK')}</p>
                <p className="text-xs text-slate-500 mt-1">Paid invoices only</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Total Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-violet-400">{analyticsData.totals.invoices}</p>
                <p className="text-xs text-slate-500 mt-1">€{analyticsData.totals.avgInvoice.toLocaleString('da-DK', { maximumFractionDigits: 0 })} average</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Active Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">
                  {organizations.filter(o => o.addon_airport_ops || o.addon_port_command || o.addon_transit_control).length}
                </p>
                <p className="text-xs text-slate-500 mt-1">€2,000 per add-on/month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Revenue & Forecast */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Monthly Revenue & Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => `€${value.toLocaleString('da-DK')}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', r: 4 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Distribution */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-400" />
                  Revenue by Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.productDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name.split(' ')[0]}: €${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.productDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => `€${value.toLocaleString('da-DK')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Monthly Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => `€${value.toLocaleString('da-DK')}`}
                  />
                  <Legend />
                  <Bar dataKey="vehicles" stackId="a" fill="#06b6d4" name="Vehicles" />
                  <Bar dataKey="resources" stackId="a" fill="#8b5cf6" name="Resources" />
                  <Bar dataKey="fleetAI" stackId="a" fill="#ec4899" name="FLEET AI" />
                  <Bar dataKey="api" stackId="a" fill="#f59e0b" name="API" />
                  <Bar dataKey="harbor" stackId="a" fill="#10b981" name="Harbor" />
                  <Bar dataKey="addons" stackId="a" fill="#3b82f6" name="Add-ons" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}