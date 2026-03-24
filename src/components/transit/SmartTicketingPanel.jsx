import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function SmartTicketingPanel({ organizationId }) {
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis-ticketing', organizationId],
    queryFn: async () => {
      return await base44.entities.TransitKPI.filter({ organization_id: organizationId }, '-date', 14);
    },
    enabled: !!organizationId,
  });

  // Build chart data from KPIs
  const revenueData = kpis.slice(0, 7).reverse().map(k => ({
    date: k.date?.slice(5) || '—',
    revenue: k.revenue || 0,
    passengers: k.total_passengers || 0,
    cost: k.operating_cost || 0,
  }));

  const totalRevenue = kpis.reduce((sum, k) => sum + (k.revenue || 0), 0);
  const totalPassengers = kpis.reduce((sum, k) => sum + (k.total_passengers || 0), 0);
  const avgRevPerPassenger = totalPassengers > 0 ? (totalRevenue / totalPassengers).toFixed(2) : '—';
  const latestKPI = kpis[0] || {};

  // Segment revenue breakdown (estimated)
  const segmentData = [
    { name: 'Single', value: 45, color: '#6366f1' },
    { name: 'Season', value: 30, color: '#22d3ee' },
    { name: 'Concession', value: 15, color: '#a78bfa' },
    { name: 'Tourist', value: 10, color: '#34d399' },
  ];

  return (
    <Card className="bg-slate-800/60 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          Smart Ticketing & Revenue
        </CardTitle>
        <CardDescription className="text-slate-400">Ticket analytics and revenue performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Revenue (7d)
            </div>
            <div className="text-xl font-bold text-white">€{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="text-xs text-cyan-400 font-semibold mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Passengers
            </div>
            <div className="text-xl font-bold text-white">{totalPassengers.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="text-xs text-violet-400 font-semibold mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Rev/Passenger
            </div>
            <div className="text-xl font-bold text-white">€{avgRevPerPassenger}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs text-amber-400 font-semibold mb-1">Operating Cost</div>
            <div className="text-xl font-bold text-white">€{(latestKPI.operating_cost || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Revenue chart */}
        {revenueData.length > 0 ? (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">Revenue Trend (7 days)</div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">No KPI data yet – add records to TransitKPI</div>
        )}

        {/* Ticket segment breakdown */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">Ticket Type Distribution</div>
          <div className="space-y-2">
            {segmentData.map(seg => (
              <div key={seg.name} className="flex items-center gap-3">
                <div className="w-16 text-xs text-slate-400">{seg.name}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${seg.value}%`, background: seg.color }} />
                </div>
                <div className="text-xs text-white w-8 text-right">{seg.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}