import { Users, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export default function CrowdingPredictionDashboard({ buses = [], trips = [] }) {
  const overloadedBuses = buses.filter(b => (b.passenger_count || 0) > (b.capacity_seated + b.capacity_standing) * 0.85).length;
  const avgOccupancy = buses.length > 0 ? Math.round(buses.reduce((sum, b) => sum + ((b.passenger_count || 0) / (b.capacity_seated + b.capacity_standing || 1) * 100), 0) / buses.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Peak Hour Crowding', value: '78%', icon: Users, color: '#f59e0b', alert: true },
          { label: 'Overloaded Routes', value: overloadedBuses, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: TrendingUp, color: '#3b82f6' },
          { label: 'Capacity Forecast', value: '85%', icon: Zap, color: '#8b5cf6' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${item.color}22`, background: `${item.color}08` }}>
              <Icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: `${item.color}88` }}>{item.label}</p>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              {item.alert && <p className="text-[9px] text-amber-400 mt-1">Monitor closely</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Crowding by Hour */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Crowding by Hour</h3>
          <div className="space-y-3">
            {[
              { hour: '7-8', crowding: 92, prediction: 95 },
              { hour: '8-9', crowding: 88, prediction: 91 },
              { hour: '12-13', crowding: 74, prediction: 76 },
              { hour: '17-18', crowding: 85, prediction: 89 },
              { hour: '18-19', crowding: 92, prediction: 94 },
            ].map((period, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{period.hour}</span>
                  <span className="text-slate-300">{period.crowding}% → {period.prediction}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${period.crowding}%`, background: period.crowding > 85 ? '#ef4444' : '#3b82f6' }}></div>
                  <div style={{ width: `${period.prediction - period.crowding}%`, background: 'rgba(255,255,255,0.1)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Crowding Heatmap */}
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Line Crowding Heatmap</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { line: '1A', crowding: 92 },
              { line: '1B', crowding: 88 },
              { line: '5', crowding: 76 },
              { line: '7', crowding: 95 },
              { line: '8', crowding: 82 },
              { line: '12', crowding: 74 },
              { line: '15', crowding: 86 },
              { line: '17', crowding: 91 },
              { line: '25', crowding: 68 },
              { line: '40', crowding: 79 },
            ].map((item, i) => {
              const color = item.crowding >= 90 ? '#ef4444' : item.crowding >= 80 ? '#f59e0b' : item.crowding >= 70 ? '#3b82f6' : '#10b981';
              return (
                <div key={i} className="aspect-square rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
                  {item.line}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4 justify-center text-[10px]">
            <span className="text-slate-400">Low</span>
            <div className="w-2 h-2 rounded bg-emerald-500"></div>
            <div className="w-2 h-2 rounded bg-blue-500"></div>
            <div className="w-2 h-2 rounded bg-amber-500"></div>
            <div className="w-2 h-2 rounded bg-red-500"></div>
            <span className="text-slate-400">High</span>
          </div>
        </div>
      </div>

      {/* Predictions & Recommendations */}
      <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
        <h3 className="text-sm font-bold text-white mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          {[
            { title: 'Add vehicles to Line 7', detail: 'Peak hour (17-18) predicted at 95% capacity', priority: 'high' },
            { title: 'Increase frequency on Line 1A', detail: 'Consistent 90%+ occupancy suggests demand growth', priority: 'medium' },
            { title: 'Monitor Line 5 demand', detail: 'Currently underutilized (76%), opportunity for optimization', priority: 'low' },
          ].map((rec, i) => {
            const priorityColor = rec.priority === 'high' ? 'border-red-500/30 bg-red-500/10' : rec.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/10' : 'border-blue-500/30 bg-blue-500/10';
            const priorityLabel = rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-amber-400' : 'text-blue-400';
            return (
              <div key={i} className={`p-3 rounded-lg border ${priorityColor}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs font-bold ${priorityLabel}`}>{rec.title}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{rec.detail}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${priorityLabel}`}>{rec.priority}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}