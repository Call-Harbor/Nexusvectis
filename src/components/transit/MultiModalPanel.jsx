import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Train, Bike, Ship, MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const MODAL_ICONS = { bus: '🚌', metro: '🚇', train: '🚆', tram: '🚊', ferry: '⛴️', bike: '🚲' };

const MOCK_CONNECTIONS = [
  { id: 'c1', stop_id: 'STOP-001', stop_name: 'Nørreport St.', mode: 'metro', line: 'M1/M2', distance_meters: 40, status: 'operational', wait_minutes: 3 },
  { id: 'c2', stop_id: 'STOP-001', stop_name: 'Nørreport St.', mode: 'train', line: 'S-tog A/B', distance_meters: 120, status: 'operational', wait_minutes: 6 },
  { id: 'c3', stop_id: 'STOP-007', stop_name: 'Rådhuspladsen', mode: 'metro', line: 'M3', distance_meters: 200, status: 'delayed', wait_minutes: 11 },
  { id: 'c4', stop_id: 'STOP-014', stop_name: 'Islands Brygge', mode: 'ferry', line: 'Harbour Bus 991', distance_meters: 80, status: 'operational', wait_minutes: 8 },
  { id: 'c5', stop_id: 'STOP-022', stop_name: 'Østerport', mode: 'train', line: 'Regional RE', distance_meters: 60, status: 'operational', wait_minutes: 14 },
  { id: 'c6', stop_id: 'STOP-031', stop_name: 'Sydhavn', mode: 'tram', line: 'Tram 8', distance_meters: 30, status: 'partial', wait_minutes: 5 },
];

export default function MultiModalPanel({ organizationId }) {
  const [filter, setFilter] = useState('all');

  const { data: stops = [] } = useQuery({
    queryKey: ['bus-stops-modal', organizationId],
    queryFn: async () => {
      const all = await base44.entities.BusStop.list('-created_date', 20);
      return all.filter(s => !s.organization_id || s.organization_id === organizationId);
    },
    enabled: !!organizationId,
  });

  const filteredConnections = filter === 'all'
    ? MOCK_CONNECTIONS
    : MOCK_CONNECTIONS.filter(c => c.mode === filter);

  const modes = ['all', 'metro', 'train', 'tram', 'ferry'];
  const statusCounts = {
    operational: MOCK_CONNECTIONS.filter(c => c.status === 'operational').length,
    delayed: MOCK_CONNECTIONS.filter(c => c.status === 'delayed').length,
    partial: MOCK_CONNECTIONS.filter(c => c.status === 'partial').length,
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          Multi-Modal Connectivity
        </CardTitle>
        <CardDescription className="text-slate-400">Live connections to metro, train, tram, and ferry</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{statusCounts.operational}</div>
            <div className="text-xs text-green-400">Operational</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <AlertCircle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{statusCounts.partial}</div>
            <div className="text-xs text-amber-400">Partial</div>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{statusCounts.delayed}</div>
            <div className="text-xs text-red-400">Delayed</div>
          </div>
        </div>

        {/* Mode filter */}
        <div className="flex gap-2 flex-wrap">
          {modes.map(mode => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === mode
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {mode === 'all' ? 'All modes' : `${MODAL_ICONS[mode] || ''} ${mode}`}
            </button>
          ))}
        </div>

        {/* Connections list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredConnections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{MODAL_ICONS[conn.mode] || '🚌'}</span>
                <div>
                  <div className="text-sm font-medium text-white">{conn.stop_name}</div>
                  <div className="text-xs text-slate-400">
                    <span className="capitalize">{conn.mode}</span> {conn.line} • {conn.distance_meters}m walk
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-cyan-400 font-semibold">{conn.wait_minutes} min</div>
                  <div className="text-xs text-slate-500">next dep.</div>
                </div>
                <Badge className={
                  conn.status === 'operational' ? 'bg-green-900/50 text-green-300 border-green-500/20 text-xs' :
                  conn.status === 'delayed' ? 'bg-red-900/50 text-red-300 border-red-500/20 text-xs' :
                  'bg-amber-900/50 text-amber-300 border-amber-500/20 text-xs'
                }>
                  {conn.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Interchange stops from DB */}
        {stops.filter(s => s.stop_type === 'interchange').length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-400 mb-2">Interchange Stops</div>
            <div className="flex flex-wrap gap-2">
              {stops.filter(s => s.stop_type === 'interchange').map(stop => (
                <Badge key={stop.id} className="bg-indigo-900/50 text-indigo-300 border-indigo-500/20">
                  <MapPin className="w-3 h-3 mr-1" />
                  {stop.stop_name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}