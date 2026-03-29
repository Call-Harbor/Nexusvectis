import { Leaf, TrendingDown, Zap, Wind } from 'lucide-react';

export default function TransitSustainabilityDashboard({ buses = [], trips = [] }) {
  const totalCO2 = buses.reduce((sum, b) => sum + (b.co2_emissions || 0), 0);
  const electricBuses = buses.filter(b => b.fuel_type === 'electric').length;
  const avgOccupancy = buses.length > 0 
    ? Math.round(buses.reduce((sum, b) => sum + ((b.passenger_count || 0) / (b.capacity_seated + b.capacity_standing || 1) * 100), 0) / buses.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CO₂ Emissions', value: `${totalCO2.toLocaleString()} kg`, icon: Wind, color: '#ef4444', delta: '-12%' },
          { label: 'Electric Buses', value: electricBuses, icon: Zap, color: '#10b981', delta: '+2' },
          { label: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: TrendingDown, color: '#3b82f6', delta: '+8%' },
          { label: 'CO₂ Saved YTD', value: '245 tons', icon: Leaf, color: '#8b5cf6', delta: '+18%' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${item.color}22`, background: `${item.color}08` }}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: item.color }} />
                <span className="text-[10px] font-bold text-emerald-400">{item.delta}</span>
              </div>
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: `${item.color}88` }}>{item.label}</p>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Carbon Reduction Strategy</h3>
          {[
            { name: 'Increase electric fleet', target: '60%', current: '45%', color: '#10b981' },
            { name: 'Peak hour efficiency', target: '95%', current: '87%', color: '#3b82f6' },
            { name: 'Idle time reduction', target: '-20%', current: '-8%', color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{item.name}</span>
                <span className="text-slate-400">{item.current} / {item.target}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: item.current, background: item.color }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Environmental Impact</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-400 font-bold">Monthly CO₂ Reduction</p>
              <p className="text-lg font-bold text-white mt-1">38 tons</p>
              <p className="text-[10px] text-emerald-400/60">Equivalent to 450 trees</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-[10px] text-blue-400 font-bold">Energy Efficiency</p>
              <p className="text-lg font-bold text-white mt-1">3.2 km/kWh</p>
              <p className="text-[10px] text-blue-400/60">+0.4 vs target</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}