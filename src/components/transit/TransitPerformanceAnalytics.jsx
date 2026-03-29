import { BarChart3, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function TransitPerformanceAnalytics({ trips = [], buses = [] }) {
  const onTimeTrips = trips.filter(t => (t.delay_minutes || 0) <= 5).length;
  const onTimeRate = trips.length > 0 ? Math.round((onTimeTrips / trips.length) * 100) : 0;
  const avgDelay = trips.length > 0 ? Math.round(trips.reduce((sum, t) => sum + (t.delay_minutes || 0), 0) / trips.length) : 0;
  const avgPassengers = buses.length > 0 ? Math.round(buses.reduce((sum, b) => sum + (b.passenger_count || 0), 0) / buses.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: Clock, color: '#10b981', target: '95%' },
          { label: 'Average Delay', value: `${avgDelay}m`, icon: AlertCircle, color: '#ef4444', target: '<3m' },
          { label: 'Avg Passengers/Bus', value: avgPassengers, icon: Users, color: '#3b82f6', target: '45' },
          { label: 'Network Efficiency', value: '87%', icon: TrendingUp, color: '#8b5cf6', target: '90%' },
        ].map((item, i) => {
          const Icon = item.icon;
          const isBelowTarget = i === 1; // avg delay
          return (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${item.color}22`, background: `${item.color}08` }}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: item.color }} />
                <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.target}</span>
              </div>
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: `${item.color}88` }}>{item.label}</p>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Hourly Performance */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Hourly Performance
          </h3>
          <div className="space-y-2">
            {[
              { hour: '6-9', onTime: 92, delay: 8 },
              { hour: '9-12', onTime: 85, delay: 15 },
              { hour: '12-15', onTime: 88, delay: 12 },
              { hour: '15-18', onTime: 78, delay: 22 },
              { hour: '18-21', onTime: 91, delay: 9 },
            ].map((period, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{period.hour}</span>
                  <span className="text-emerald-400">{period.onTime}% on-time</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full flex" style={{ width: '100%' }}>
                    <div style={{ width: `${period.onTime}%`, background: '#10b981' }}></div>
                    <div style={{ width: `${period.delay}%`, background: '#ef4444' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Performance */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Top/Bottom Lines</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Best Performers</p>
              {['Line 1A (94%)', 'Line 5 (91%)', 'Line 12 (89%)'].map((line, i) => (
                <div key={i} className="flex justify-between items-center mb-1 px-2 py-1 rounded bg-emerald-500/10">
                  <span className="text-xs text-slate-300">{line.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-emerald-400">{line.split(' ')[1]}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2 mt-3">Needs Attention</p>
              {['Line 7 (73%)', 'Line 8 (76%)', 'Line 15 (78%)'].map((line, i) => (
                <div key={i} className="flex justify-between items-center mb-1 px-2 py-1 rounded bg-red-500/10">
                  <span className="text-xs text-slate-300">{line.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-red-400">{line.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
        <h3 className="text-sm font-bold text-white mb-4">Advanced Metrics</h3>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Schedule Compliance', value: '92%', unit: 'Adherence' },
            { label: 'Vehicle Availability', value: '96%', unit: 'Fleet Ready' },
            { label: 'Passenger Satisfaction', value: '4.2/5', unit: 'Rating' },
            { label: 'Operational Cost/km', value: '€2.34', unit: 'Per km' },
            { label: 'Revenue per Trip', value: '€3.87', unit: 'Average' },
          ].map((metric, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-[10px] text-slate-400">{metric.label}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{metric.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}