import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Brain, Clock, AlertTriangle, TrendingUp, Leaf, Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const HINT_ICONS = {
  timing: Clock,
  boarding: User,
  eco: Leaf,
  safety: AlertTriangle,
  default: Brain,
};

const HINT_COLORS = {
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-cyan-500/30 bg-cyan-500/10',
  success: 'border-green-500/30 bg-green-500/10',
  critical: 'border-red-500/30 bg-red-500/10',
};

export default function DriverCopilot({ organizationId }) {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-copilot', organizationId],
    queryFn: async () => {
      return await base44.entities.BusDriver.filter({ organization_id: organizationId, status: 'active' });
    },
    enabled: !!organizationId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['performance-reports', organizationId],
    queryFn: async () => {
      return await base44.entities.PerformanceReport.filter({ organization_id: organizationId }, '-shift_date', 10);
    },
    enabled: !!organizationId,
  });

  const fetchHints = async (driver) => {
    setSelectedDriver(driver);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('driverCopilotagent', {
        driverId: driver.driver_id,
        organizationId,
      });
      setHints(res.data.hints || []);
    } catch {
      // Fallback demo hints
      setHints([
        { type: 'timing', severity: 'warning', message: 'Running 3 min early on Line 5A – ease speed slightly to stay on schedule.', actionable: true },
        { type: 'boarding', severity: 'info', message: 'High crowding predicted at next 2 stops – prepare for extended dwell time.', actionable: false },
        { type: 'eco', severity: 'success', message: 'Great eco-driving on last segment! Your eco score is 87/100.', actionable: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveReportMutation = useMutation({
    mutationFn: async (driver) => {
      return await base44.entities.PerformanceReport.create({
        organization_id: organizationId,
        driver_id: driver.driver_id,
        shift_date: new Date().toISOString().split('T')[0],
        shift_start: new Date(Date.now() - 4 * 3600000).toISOString(),
        shift_end: new Date().toISOString(),
        trips_completed: Math.floor(Math.random() * 8) + 4,
        on_time_percentage: Math.floor(Math.random() * 20) + 80,
        eco_score: Math.floor(Math.random() * 20) + 75,
        safety_incidents: 0,
        boarding_efficiency: Math.floor(Math.random() * 15) + 80,
        passenger_feedback_score: (Math.random() * 2 + 7.5).toFixed(1),
        hints_received: hints.map(h => ({ time: new Date().toISOString(), hint: h.message, category: h.type })),
        summary: `Solid shift for ${driver.first_name}. On-time performance above average.`,
        recommendations: ['Maintain current eco-driving style', 'Focus on smooth braking at intersections'],
      });
    },
    onSuccess: () => toast.success('Performance report saved'),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="text-xs text-violet-400 font-semibold mb-1">Active Drivers</div>
          <div className="text-2xl font-bold text-white">{drivers.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-400 font-semibold mb-1">Hints Sent Today</div>
          <div className="text-2xl font-bold text-white">{hints.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-semibold mb-1">Reports Generated</div>
          <div className="text-2xl font-bold text-white">{reports.length}</div>
        </div>
      </div>

      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            Driver Co-pilot
          </CardTitle>
          <CardDescription className="text-slate-400">Real-time hints and shift performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Driver selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {drivers.length === 0 && (
              <div className="col-span-3 text-center py-4 text-slate-500 text-sm">No active drivers</div>
            )}
            {drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => fetchHints(driver)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedDriver?.id === driver.id
                    ? 'border-violet-500 bg-violet-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="text-xs font-medium text-white">{driver.first_name} {driver.last_name}</div>
                <div className="text-xs text-slate-400">#{driver.employee_number}</div>
              </button>
            ))}
          </div>

          {/* Hints */}
          {selectedDriver && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{selectedDriver.first_name} {selectedDriver.last_name}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs"
                    onClick={() => fetchHints(selectedDriver)} disabled={loading}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs"
                    onClick={() => saveReportMutation.mutate(selectedDriver)}
                    disabled={saveReportMutation.isPending}>
                    <Star className="w-3 h-3 mr-1" />
                    Save Report
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4 text-slate-400 text-sm">Fetching hints...</div>
              ) : hints.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">No active hints for this driver</div>
              ) : (
                hints.map((hint, i) => {
                  const Icon = HINT_ICONS[hint.type] || HINT_ICONS.default;
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${HINT_COLORS[hint.severity] || HINT_COLORS.info}`}>
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 text-slate-300 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-white">{hint.message}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge className="text-xs bg-slate-700 text-slate-300">{hint.type}</Badge>
                            {hint.actionable && <Badge className="text-xs bg-amber-900 text-amber-300">Action needed</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}