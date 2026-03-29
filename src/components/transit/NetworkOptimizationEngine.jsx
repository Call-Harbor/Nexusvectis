import { Network, Zap, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NetworkOptimizationEngine({ lines = [], buses = [], trips = [] }) {
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const costPerKm = 2.34;
  const dailyCost = totalDistance * costPerKm;

  const optimizations = [
    { type: 'Route Consolidation', savings: '€450/week', impact: 'Reduce 2 redundant routes', status: 'recommended' },
    { type: 'Frequency Optimization', savings: '€320/week', impact: 'Adjust peak hour frequency', status: 'recommended' },
    { type: 'Vehicle Scheduling', savings: '€280/week', impact: 'Improve vehicle utilization', status: 'approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Network Cost/Day', value: `€${dailyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: TrendingDown, color: '#ef4444' },
          { label: 'Total Route Distance', value: `${totalDistance.toLocaleString()} km`, icon: Network, color: '#3b82f6' },
          { label: 'Optimization Savings', value: '€1.05k/week', icon: Zap, color: '#10b981' },
          { label: 'Network Efficiency', value: '82%', icon: Target, color: '#8b5cf6', target: '90%' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${item.color}22`, background: `${item.color}08` }}>
              <Icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: `${item.color}88` }}>{item.label}</p>
              <p className="text-xl font-bold text-white">{item.value}</p>
              {item.target && <p className="text-[9px] text-slate-400 mt-1">Target: {item.target}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Optimization Opportunities */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Optimization Opportunities
          </h3>
          <div className="space-y-3">
            {optimizations.map((opt, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-white">{opt.type}</p>
                    <p className="text-xs text-slate-400 mt-1">{opt.impact}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    opt.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {opt.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-emerald-400 mb-2">{opt.savings}</p>
                <Button size="sm" variant="outline" className="w-full text-xs h-7">
                  {opt.status === 'approved' ? 'Implement' : 'Review'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Route Analysis */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Route Performance</h3>
          <div className="space-y-3">
            {[
              { line: 'Line 1A', efficiency: 92, passengers: 1240, distance: 45.2, recommendation: 'Add morning trip' },
              { line: 'Line 7', efficiency: 68, passengers: 856, distance: 52.1, recommendation: 'Consolidate with Line 8' },
              { line: 'Line 25', efficiency: 74, passengers: 620, distance: 38.4, recommendation: 'Reduce frequency' },
            ].map((route, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{route.line}</p>
                  <span className={`text-xs font-bold ${route.efficiency >= 85 ? 'text-emerald-400' : route.efficiency >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                    {route.efficiency}% eff.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                  <div><span className="text-slate-500">Passengers</span><p className="font-bold text-white">{route.passengers}</p></div>
                  <div><span className="text-slate-500">Distance</span><p className="font-bold text-white">{route.distance} km</p></div>
                  <div><span className="text-slate-500">Cost/km</span><p className="font-bold text-white">€{costPerKm}</p></div>
                </div>
                <p className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{route.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Map Overview */}
      <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          Network Optimization Strategy
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              phase: 'Phase 1: Analysis',
              items: ['Identify redundant routes', 'Analyze crowding patterns', 'Calculate cost impact'],
              progress: 100,
              status: 'completed'
            },
            {
              phase: 'Phase 2: Implementation',
              items: ['Consolidate routes', 'Adjust frequency', 'Update schedules'],
              progress: 65,
              status: 'in-progress'
            },
            {
              phase: 'Phase 3: Monitoring',
              items: ['Track efficiency gains', 'Monitor user satisfaction', 'Optimize further'],
              progress: 0,
              status: 'pending'
            },
          ].map((phase, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <p className="font-bold text-white mb-3">{phase.phase}</p>
              <div className="space-y-2 mb-3">
                {phase.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      phase.status === 'completed' ? 'bg-emerald-500' : phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-500'
                    }`}></div>
                    <span className="text-xs text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full" style={{ 
                  width: `${phase.progress}%`, 
                  background: phase.status === 'completed' ? '#10b981' : phase.status === 'in-progress' ? '#3b82f6' : '#6b7280'
                }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{phase.progress}% complete</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}