import { Globe, MapPin, Bus, Navigation } from 'lucide-react';

export default function Transit3DGISMap({ buses = [], stops = [], lines = [] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800/60 h-[500px] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-950/50"></div>
        <div className="relative z-10 text-center">
          <Globe className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">3D GIS Transit Map</h3>
          <p className="text-slate-400 text-sm mb-4">Real-time vehicle tracking & route visualization</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <div className="px-3 py-1.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Bus className="w-3 h-3 inline mr-1" />
              {buses.length} Active Buses
            </div>
            <div className="px-3 py-1.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <MapPin className="w-3 h-3 inline mr-1" />
              {stops.length} Stops
            </div>
            <div className="px-3 py-1.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Navigation className="w-3 h-3 inline mr-1" />
              {lines.length} Lines
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'GPS Tracking', value: '99.2%', color: '#06b6d4' },
          { label: 'Map Updates/sec', value: '12', color: '#3b82f6' },
          { label: 'Live Positions', value: buses.length, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: `${stat.color}88` }}>{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Map Controls</h3>
          <div className="space-y-2">
            {['Zoom In/Out', 'Satellite View', 'Traffic Layer', '3D Terrain', 'Route Overlay', 'Heat Map'].map((ctrl, i) => (
              <button key={i} className="w-full text-left text-xs p-2 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition-all">
                {ctrl}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6 bg-slate-900/60 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Real-Time Data</h3>
          <div className="space-y-2">
            {['Tracking Speed: 1 Hz', 'Accuracy: ±3m', 'Coverage: 100%', 'Sync Status: Live', 'Last Update: <1s', 'Data Points: 2,450'].map((data, i) => (
              <div key={i} className="text-xs p-2 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300 flex justify-between">
                <span>{data.split(':')[0]}</span>
                <span className="font-bold text-cyan-400">{data.split(':')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}