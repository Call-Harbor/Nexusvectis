import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, AlertCircle, Users, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function APIMetrics() {
  const [timeRange, setTimeRange] = useState("monthly");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: apiUsage = [], isLoading } = useQuery({
    queryKey: ['api-usage-metrics'],
    queryFn: async () => {
      if (currentUser?.role === 'admin') {
        return await base44.asServiceRole.entities.APIUsage.list('-created_date', 1000);
      }
      const userData = await base44.entities.User.filter({ email: currentUser.email });
      if (!userData?.[0]?.organization_id) return [];
      return await base44.entities.APIUsage.filter({ organization_id: userData[0].organization_id });
    },
    enabled: !!currentUser,
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-metrics'],
    queryFn: () => base44.asServiceRole.entities.Organization.list(),
    enabled: currentUser?.role === 'admin',
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (!apiUsage.length) return { timeline: [], endpoints: [], statusRates: [], orgBreakdown: [] };

    // Timeline data
    const timelineMap = {};
    const endpointMap = {};
    const statusMap = { success: 0, error: 0 };
    const orgMap = {};

    apiUsage.forEach(call => {
      const date = new Date(call.created_date);
      let key;

      if (timeRange === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (timeRange === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      timelineMap[key] = (timelineMap[key] || 0) + 1;
      endpointMap[call.endpoint] = (endpointMap[call.endpoint] || 0) + 1;

      if (call.status_code < 400) {
        statusMap.success++;
      } else {
        statusMap.error++;
      }

      if (call.organization_id) {
        orgMap[call.organization_id] = (orgMap[call.organization_id] || 0) + 1;
      }
    });

    const timeline = Object.entries(timelineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date, calls: count }));

    const endpoints = Object.entries(endpointMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ 
        endpoint: endpoint.length > 30 ? endpoint.slice(0, 30) + '...' : endpoint, 
        count 
      }));

    const statusRates = [
      { name: 'Success', value: statusMap.success, percentage: ((statusMap.success / apiUsage.length) * 100).toFixed(1) },
      { name: 'Error', value: statusMap.error, percentage: ((statusMap.error / apiUsage.length) * 100).toFixed(1) }
    ];

    const orgBreakdown = Object.entries(orgMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([orgId, count]) => {
        const org = organizations.find(o => o.id === orgId);
        return {
          name: org?.name || orgId.slice(0, 8),
          calls: count
        };
      });

    return { timeline, endpoints, statusRates, orgBreakdown };
  }, [apiUsage, timeRange, organizations]);

  const stats = useMemo(() => {
    const total = apiUsage.length;
    const success = apiUsage.filter(c => c.status_code < 400).length;
    const avgResponseTime = apiUsage.length > 0 
      ? (apiUsage.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / apiUsage.length).toFixed(0)
      : 0;
    const uniqueOrgs = new Set(apiUsage.map(c => c.organization_id)).size;

    return {
      total,
      successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0,
      avgResponseTime,
      uniqueOrgs
    };
  }, [apiUsage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Usage Metrics</h1>
          <p className="text-slate-400">Monitor your API consumption and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total API Calls</CardTitle>
              <Activity className="w-4 h-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-violet-500/20 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Response Time</CardTitle>
              <AlertCircle className="w-4 h-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgResponseTime}ms</div>
            </CardContent>
          </Card>

          {currentUser?.role === 'admin' && (
            <Card className="bg-slate-900/50 border-amber-500/20 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Organizations</CardTitle>
                <Users className="w-4 h-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.uniqueOrgs}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* API Calls Timeline */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">API Calls Over Time</CardTitle>
                <CardDescription className="text-slate-400">Track your API usage trends</CardDescription>
              </div>
              <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                <TabsList className="bg-slate-800/50">
                  <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Endpoints */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Top API Endpoints</CardTitle>
              <CardDescription className="text-slate-400">Most frequently used endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.endpoints} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="endpoint" type="category" width={150} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success/Error Rates */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">API Call Status Distribution</CardTitle>
              <CardDescription className="text-slate-400">Success vs error rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusRates}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusRates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-400">Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-400">Error</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Breakdown (Admin Only) */}
        {currentUser?.role === 'admin' && chartData.orgBreakdown.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Usage by Organization</CardTitle>
              <CardDescription className="text-slate-400">API calls per organization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.orgBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="calls" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}