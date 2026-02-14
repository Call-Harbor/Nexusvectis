import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, Package, DollarSign, Truck, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD')
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Shipment.filter({ organization_id: user.organization_id }, '-created_date', 500);
    },
    enabled: !!user?.organization_id
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Vehicle.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Driver.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Invoice.filter({ organization_id: user.organization_id }, '-created_date', 200);
    },
    enabled: !!user?.organization_id
  });

  // Filter data by date range
  const filteredShipments = shipments.filter(s => {
    const createdDate = moment(s.created_date);
    return createdDate.isBetween(dateRange.from, dateRange.to, 'day', '[]');
  });

  const filteredInvoices = invoices.filter(i => {
    const issueDate = moment(i.issue_date);
    return issueDate.isBetween(dateRange.from, dateRange.to, 'day', '[]');
  });

  // Calculate metrics
  const metrics = {
    totalShipments: filteredShipments.length,
    deliveredShipments: filteredShipments.filter(s => s.status === 'delivered').length,
    inTransit: filteredShipments.filter(s => s.status === 'in_transit').length,
    delayed: filteredShipments.filter(s => s.status === 'delayed').length,
    deliveryRate: filteredShipments.length > 0 
      ? ((filteredShipments.filter(s => s.status === 'delivered').length / filteredShipments.length) * 100).toFixed(1)
      : 0,
    totalRevenue: filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    activeDrivers: drivers.filter(d => d.status === 'active').length,
    avgDistance: filteredShipments.length > 0
      ? (filteredShipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0) / filteredShipments.length).toFixed(0)
      : 0
  };

  const reportTypes = [
    {
      title: "Shipment Performance Report",
      description: "Detailed analysis of shipment deliveries and performance",
      icon: Package,
      color: "cyan",
      data: { ...metrics, shipments: filteredShipments }
    },
    {
      title: "Financial Report",
      description: "Revenue, invoices and financial metrics",
      icon: DollarSign,
      color: "emerald",
      data: { revenue: metrics.totalRevenue, invoices: filteredInvoices }
    },
    {
      title: "Fleet Utilization Report",
      description: "Vehicle and driver utilization statistics",
      icon: Truck,
      color: "violet",
      data: { vehicles, drivers, activeVehicles: metrics.activeVehicles, activeDrivers: metrics.activeDrivers }
    },
    {
      title: "Operations Summary",
      description: "Complete operational overview for the period",
      icon: BarChart3,
      color: "amber",
      data: metrics
    }
  ];

  const generateReport = (report) => {
    const reportContent = JSON.stringify(report.data, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success("Report downloaded");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-slate-400">Generate detailed reports and insights</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Period:</span>
              </div>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white px-3 py-2 rounded-lg"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white px-3 py-2 rounded-lg"
              />
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={() => setDateRange({
                    from: moment().subtract(7, 'days').format('YYYY-MM-DD'),
                    to: moment().format('YYYY-MM-DD')
                  })}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Last 7 Days
                </Button>
                <Button
                  onClick={() => setDateRange({
                    from: moment().subtract(30, 'days').format('YYYY-MM-DD'),
                    to: moment().format('YYYY-MM-DD')
                  })}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Last 30 Days
                </Button>
                <Button
                  onClick={() => setDateRange({
                    from: moment().startOf('month').format('YYYY-MM-DD'),
                    to: moment().format('YYYY-MM-DD')
                  })}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  This Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-cyan-400" />
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {metrics.deliveryRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.totalShipments}</p>
              <p className="text-slate-400 text-sm">Total Shipments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-emerald-400" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">€{metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Total Revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Truck className="w-8 h-8 text-violet-400" />
                <span className="text-violet-400 text-sm">{metrics.activeVehicles} active</span>
              </div>
              <p className="text-2xl font-bold text-white">{vehicles.length}</p>
              <p className="text-slate-400 text-sm">Fleet Vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-amber-400" />
                <span className="text-amber-400 text-sm">{metrics.inTransit} in transit</span>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.deliveredShipments}</p>
              <p className="text-slate-400 text-sm">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report, idx) => {
            const Icon = report.icon;
            return (
              <Card key={idx} className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-${report.color}-500/20`}>
                        <Icon className={`w-6 h-6 text-${report.color}-400`} />
                      </div>
                      <div>
                        <CardTitle className="text-white mb-1">{report.title}</CardTitle>
                        <p className="text-slate-400 text-sm">{report.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => generateReport(report)}
                    className={`w-full bg-gradient-to-r from-${report.color}-600 to-${report.color}-500`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}