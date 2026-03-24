import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrafficCone, Zap, Clock, CheckCircle2, Send, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_INTERSECTIONS = [
  { id: 'INT-001', name: 'Nørreport × Frederiksborggade', bus_id: 'BUS-12', line_id: '5A', delay: 4 },
  { id: 'INT-002', name: 'Rådhuspladsen × Vester Voldgade', bus_id: 'BUS-07', line_id: '26', delay: 7 },
  { id: 'INT-003', name: 'Trianglen × Østerbrogade', bus_id: 'BUS-23', line_id: '1A', delay: 2 },
];

export default function TSPInterface({ organizationId }) {
  const [sentSuggestions, setSentSuggestions] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: suggestions, refetch } = useQuery({
    queryKey: ['tsp-suggestions', organizationId],
    queryFn: async () => {
      return await base44.entities.TSPSuggestion.filter(
        { organization_id: organizationId },
        '-timestamp', 15
      );
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async (intersection) => {
      const greenExt = intersection.delay > 5 ? 12 : 8;
      return await base44.entities.TSPSuggestion.create({
        organization_id: organizationId,
        intersection_id: intersection.id,
        line_id: intersection.line_id,
        bus_id: intersection.bus_id,
        delay_minutes_current: intersection.delay,
        suggested_extension: greenExt,
        expected_time_saved: greenExt * 0.7,
        expected_regularity_gain: intersection.delay > 5 ? 18 : 10,
        status: 'sent',
        timestamp: new Date().toISOString(),
        validity_end: new Date(Date.now() + 5 * 60000).toISOString(),
      });
    },
    onSuccess: (_, intersection) => {
      setSentSuggestions(prev => new Set([...prev, intersection.id]));
      toast.success(`TSP signal sent for ${intersection.name}`);
      refetch();
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.TSPSuggestion.update(id, { status: 'executed' });
    },
    onSuccess: () => {
      toast.success('TSP signal executed');
      refetch();
    },
  });

  const stats = {
    pending: suggestions?.filter(s => s.status === 'pending' || s.status === 'sent').length || 0,
    executed: suggestions?.filter(s => s.status === 'executed').length || 0,
    avgSaved: suggestions?.length
      ? (suggestions.reduce((sum, s) => sum + (s.expected_time_saved || 0), 0) / suggestions.length).toFixed(1)
      : 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-400 font-semibold mb-1">Active TSP Requests</div>
          <div className="text-2xl font-bold text-white">{stats.pending}</div>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="text-xs text-green-400 font-semibold mb-1">Executed Today</div>
          <div className="text-2xl font-bold text-white">{stats.executed}</div>
        </div>
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-xs text-cyan-400 font-semibold mb-1">Avg. Time Saved (s)</div>
          <div className="text-2xl font-bold text-white">{stats.avgSaved}</div>
        </div>
      </div>

      {/* Candidate intersections */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrafficCone className="w-5 h-5 text-amber-400" />
            Transit Signal Priority
          </CardTitle>
          <CardDescription className="text-slate-400">AI recommends green extensions for delayed buses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_INTERSECTIONS.map(inter => {
            const alreadySent = sentSuggestions.has(inter.id);
            return (
              <div key={inter.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{inter.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Line {inter.line_id} • Bus {inter.bus_id} •
                    <span className={inter.delay > 5 ? ' text-red-400' : ' text-yellow-400'}> {inter.delay} min delay</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    +{inter.delay > 5 ? 12 : 8}s green
                  </Badge>
                  <Button
                    size="sm"
                    disabled={alreadySent || createMutation.isPending}
                    onClick={() => createMutation.mutate(inter)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  >
                    {alreadySent ? <CheckCircle2 className="w-3 h-3" /> : <Send className="w-3 h-3 mr-1" />}
                    {alreadySent ? 'Sent' : 'Send TSP'}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Existing suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-400 mb-2">Recent TSP Log</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {suggestions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-slate-800 rounded text-xs">
                    <div className="text-slate-300">{s.intersection_id} • Line {s.line_id}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">+{s.suggested_extension}s</span>
                      <Badge className={
                        s.status === 'executed' ? 'bg-green-900 text-green-300 text-xs' :
                        s.status === 'sent' ? 'bg-blue-900 text-blue-300 text-xs' :
                        'bg-slate-700 text-slate-300 text-xs'
                      }>{s.status}</Badge>
                      {s.status === 'sent' && (
                        <Button size="sm" variant="ghost" className="h-5 text-xs text-green-400 px-2"
                          onClick={() => executeMutation.mutate(s.id)}>
                          Execute
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}